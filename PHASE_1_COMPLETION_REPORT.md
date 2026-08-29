# Phase 1 Completion Report

**Project:** Restaurant Digital Platform  
**Review date:** 29 August 2026  
**Reviewer role:** CTO final review  
**Codebase:** `/Users/rdx525/Projects/restaurant-digital-platform`  
**Stack:** Next.js 15 (App Router) · Supabase (Postgres, Auth, Storage, Realtime) · Vitest  

**Verification at review time:**
- `npm test` — 34 files, **126 tests passing**
- `npm run build` — **production build succeeds**
- 13 Supabase migrations (`001`–`013`)
- Harbour Kitchen demo tenant seeded via `npm run seed:harbour-kitchen`

---

## Executive Summary

Phase 1 delivers a **feature-rich, single-tenant demonstration platform** with strong domain logic, database schema, RLS foundations, performance work, and deployment documentation. The **Harbour Kitchen demo path** supports sales and QA across website, menu, QR ordering, reservations, dashboard, analytics, and AI intelligence.

However, the **real multi-tenant owner journey is not end-to-end**. A new user who signs up does not receive a restaurant, dashboard APIs are gated to a hard-coded demo restaurant ID, authorization guards exist but are unwired, live payments cannot be accepted (demo provider only), and staff roles / audit logs are schema-level only.

| Dimension | Verdict |
|-----------|---------|
| Demo / sales pilot (Harbour Kitchen, seeded tenant) | **Ready** |
| Real restaurant signup → live operations | **Not ready** |
| Multi-tenant production SaaS | **Not ready** |

---

## Classification Key

| Status | Meaning |
|--------|---------|
| **COMPLETE** | Requirement met for Phase 1 scope |
| **PARTIAL** | Substantially implemented; gaps remain |
| **MISSING** | Not implemented or not wired |
| **RISK** | Implemented but unsafe, incomplete, or blocking for pilot |

---

## End-to-End Journey Assessment

Required pilot journey:

```
Restaurant signup → setup → menu → website → QR → customer order → payment
→ restaurant receives order → customer profile → analytics → AI insight
```

| Step | Status | Notes |
|------|--------|-------|
| Restaurant signup | **PARTIAL** | Supabase auth UI works; `restaurant_name` stored in user metadata only |
| Restaurant setup | **MISSING** | No onboarding wizard; no auto-provision of `restaurants` + `restaurant_members` |
| Menu | **PARTIAL** | Full CRUD exists; dashboard/API hard-coded to demo restaurant ID |
| Website | **PARTIAL** | Public site complete; dashboard editor scoped to demo ID |
| QR | **COMPLETE** | Token resolution, sessions, table dashboard, scan analytics (demo path) |
| Customer order | **COMPLETE** | Public checkout, server-side pricing, idempotency, dine-in table context |
| Payment | **PARTIAL / RISK** | Demo provider + webhooks work; **no Stripe/live provider**; prod blocks `demo` |
| Restaurant receives order | **COMPLETE** | Dashboard orders, status transitions, notifications on status change |
| Customer profile | **COMPLETE** | Sync from orders/reservations/payments; dashboard list/detail |
| Analytics | **COMPLETE** | Event ingestion, reports, CSV export, QR funnel |
| AI insight | **PARTIAL** | Orchestrator, tools, safeguards, demo + optional OpenAI; dashboard demo-scoped |

**Journey verdict:** Works end-to-end for **Harbour Kitchen (seeded demo tenant)**. **Fails** for a newly signed-up restaurant owner without manual DB seeding.

---

## Requirement-by-Requirement Review

### 1. Architecture

**Status: COMPLETE**

**Evidence:**
- Clear domain modules under `src/lib/{restaurant,menu,order,table,payment,reservation,customer,notification,analytics,intelligence,auth}/`
- App Router split: public (`/r/[slug]`), dashboard (`/dashboard/*`), API (`/api/*`), QR (`/q/[token]`)
- Dual-mode data layer: Supabase when configured, in-memory demo stores otherwise
- Provider abstractions for payments, notifications, and AI
- Production validation via `src/instrumentation.ts` → `src/lib/env/production.ts`
- Documented in `DEPLOYMENT.md`, `docs/payment-architecture.md`, `docs/DEMO.md`

**Gaps:** Dashboard tenant resolution not abstracted; demo ID scattered across components and API routes.

**Complexity to close gap:** Medium (2–3 days) — active restaurant context + remove demo ID hardcoding.

---

### 2. Database

**Status: COMPLETE**

**Evidence:**
- 13 ordered migrations covering full Phase 1 schema
- Tenant key `restaurant_id` on business tables
- Enums, indexes (`012_performance_indexes.sql`), foreign keys, demo seed UUID
- Tables: restaurants, menus, categories, items, modifiers, locations, tables, QR tokens, sessions, orders, payments, reservations, customers, notifications, analytics, AI insights, `restaurant_members`

**Gaps (RLS completeness — see Tenant Isolation):** `table_sessions` SELECT policy missing for session validation; `qr_scan_events` member SELECT missing; public read on `table_qr_tokens` from migration `003`.

**Complexity:** Low–Medium (1–2 days) for RLS patch migration.

---

### 3. Tenant Isolation

**Status: PARTIAL / RISK**

**Evidence — database layer:**
- `restaurant_members` + `is_restaurant_member()` in `011_security_tenant_isolation.sql`
- Member-scoped policies on menus, orders, reservations, customers, payments, analytics, intelligence (`011`, `013`)
- Public INSERT-only policies for customer flows (orders, reservations, analytics, QR scans)

**Evidence — application layer:**
- `src/lib/auth/guards.ts` — `guardRestaurantRoute()`, menu/category/item guards
- `src/lib/auth/restaurant-access.ts` — membership check against `restaurant_members`
- Data modules filter by `restaurant_id` when querying

**Critical gaps:**
- **Guards never called from API routes** (zero usages under `src/app/api/`)
- **21+ dashboard routes** use `requestedId !== getDemoRestaurantId()` instead of membership checks
- `POST /api/restaurants` creates restaurants with **no auth** and **no `restaurant_members` row**
- Storage policies check `auth.uid() is not null` only — not tenant-scoped (`013`)
- `is_restaurant_member()` ignores role — all members have equal access

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| API guard wiring | Authenticated user A could call APIs for restaurant B if demo check removed without replacement | Call `guardRestaurantRoute()` in all `/api/restaurants/[id]/*` and menu mutation routes | Medium (2–3 days) |
| Active tenant context | Dashboard edits wrong restaurant | Resolve restaurant from session/`restaurant_members`; store in context; replace `getDemoRestaurantId()` in 7+ dashboard components | Medium (2–3 days) |
| Signup provisioning | New owners have no tenant | Post-signup hook: create restaurant + owner member from metadata | Medium (2–4 days) |
| RLS on sessions/scans | QR ordering may fail under strict Supabase RLS | Migration: SELECT policies for session validation and member QR analytics | Low (1 day) |

---

### 4. Authentication

**Status: PARTIAL**

**Evidence:**
- Email/password sign-in and sign-up UI (`AuthPanel.tsx`, `client-actions.ts`)
- Supabase PKCE callback (`/auth/callback`), password reset page
- Middleware session gate for `/dashboard` and protected APIs (`middleware.ts`, `protected-routes.ts`)
- Demo auth cookie for local dev (`/api/auth/demo`) — blocked in production
- Logout route

**Gaps:**
- Signup does not provision restaurant or membership
- Demo mode bypass when Supabase not configured (intentional for dev)
- No email verification flow testing documented
- No social/OAuth providers

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| Signup → restaurant provisioning | Core journey starts here | DB trigger, edge function, or post-callback server action | Medium (2–4 days) |
| Owner bootstrap on first login | Manual SQL is not scalable | Check membership on login; redirect to onboarding if empty | Medium (1–2 days) |

---

### 5. Authorization

**Status: PARTIAL / RISK**

**Evidence:**
- `requireApiAuth()`, `requireRestaurantAccess()` implemented
- Menu resource → restaurant resolution (`menu/authorization.ts`)
- RLS as database backstop for authenticated Supabase client writes

**Gaps:**
- Guards defined but **unused** in API layer
- Menu API (`/api/menus/route.ts`) hardcodes `getDemoRestaurantId()` for GET and POST
- Cross-tenant test in checklist assumes wiring that does not exist yet

**Complexity to wire guards:** Medium (2–3 days) including tests.

---

### 6. Website

**Status: COMPLETE** (public) / **PARTIAL** (owner editing)

**Evidence:**
- Public routes: `/r/[slug]`, about, menu, gallery, contact, reservations, order, orders
- Branding, opening hours, gallery, Google Maps, hero, colors
- SEO: metadata, JSON-LD, sitemap, robots.txt (`seo.ts`, `sitemap.ts`)
- Preview mode (`?preview=1`) for unpublished sites
- Custom domain rewrite in middleware
- Dashboard website editor (`/dashboard/website`, `RestaurantSettingsEditor.tsx`)

**Gap:** Dashboard editor uses demo restaurant ID, not authenticated owner's restaurant.

**Complexity:** Low (part of tenant context work, ~1 day).

---

### 7. Menu

**Status: COMPLETE** (functionality) / **PARTIAL** (multi-tenant)

**Evidence:**
- Full CRUD: menus, categories, items, modifier groups, modifiers
- Drag-and-drop reorder, image upload, availability flags
- Server-side menu loading with caching (`PERFORMANCE.md`)
- Realtime sync hook (`useMenu.ts`) with scoped subscriptions
- Public menu view with optimized payload
- Zod schemas at API boundary

**Gap:** Dashboard menu API scoped to demo tenant ID.

**Complexity:** Low (included in tenant wiring).

---

### 8. QR

**Status: COMPLETE** (demo path) / **RISK** (Supabase RLS)

**Evidence:**
- 20 tables with tokens (`hk-t1-qrt-…`) in Harbour Kitchen seed
- `/q/[token]` redirect → table session cookie → menu with table context
- QR PDF/generation API, token regeneration, scan analytics
- Session validation, tenant isolation tests (`table/security.test.ts`)
- Tables dashboard with scan counts

**Gaps:**
- `table_sessions`: INSERT-only policy after `011` — no SELECT for session lookup via anon client
- `table_qr_tokens`: world-readable from migration `003`
- Dashboard hard-coded to demo ID

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| Session SELECT RLS | Live QR ordering breaks when RLS enforced | Policy allowing SELECT by session token or service-role read in server route | Low (1 day) |
| Token public read restriction | Token enumeration risk | Restrict to service role; resolve tokens server-side only | Low (1 day) |

---

### 9. Ordering

**Status: COMPLETE**

**Evidence:**
- Public `POST /api/orders` with rate limiting (20/min)
- Server-side pricing from menu DB — client prices rejected (`order/pricing.ts`)
- Order types: dine-in, pickup, delivery; table context for QR
- Idempotency keys, GST/delivery fee calculation
- Dashboard: list, filter, status updates, refunds
- Access tokens for guest order history in production
- 17+ unit tests (pricing, schemas, cart, demo-store)

**Gap:** None for Phase 1 demo scope; production depends on payment provider.

---

### 10. Payments

**Status: PARTIAL / RISK**

**Evidence:**
- Payment architecture documented (`docs/payment-architecture.md`)
- Schema: `payment_sessions`, `payment_transactions`, `payment_webhook_events` (`005`)
- Demo provider with simulate-pay endpoint and webhook processing
- Order → payment session creation; polling with access tokens
- Refund API (demo)
- Production validation **rejects** `PAYMENT_PROVIDER=demo`

**Gaps:**
- **Only demo provider implemented** (`payment/providers/index.ts` throws for unknown providers)
- Checkout UI always calls demo pay endpoint (`OrderCheckout.tsx`)
- No Stripe Checkout / Payment Element integration

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| Stripe (or equivalent) provider | Cannot accept real money in pilot | Implement `StripePaymentProvider`; webhook handler; checkout redirect/element | High (5–8 days) |
| Provider-specific checkout UI | Demo pay returns 501 in prod | Branch checkout on `PAYMENT_PROVIDER` | Medium (1–2 days) |

---

### 11. Reservations

**Status: PARTIAL**

**Evidence:**
- Public booking API with rate limiting (15/min)
- Availability API with slot validation, covers/slot, opening hours, timezone
- Dashboard management, confirm/reject/cancel, reschedule
- Notifications on create, confirm, cancel, change
- Double-booking prevention at app layer (tests)
- Schema + RLS (`006`, `011`, `013`)

**Gaps:**
- **Reservation reminders not scheduled** — `queueReminderIfDue()` in `reminders.ts` is never called
- No DB-level slot locking (race under concurrent bookings)
- Dashboard demo-ID gated

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| Reminder scheduler | Guests don't get 24h reminders | Cron (Vercel cron / Supabase pg_cron) calling reminder queue | Low–Medium (1–2 days) |
| Slot exclusion constraint | Double booking under load | DB unique partial index or advisory lock | Medium (2–3 days) |

---

### 12. Customers

**Status: COMPLETE** (logic) / **PARTIAL** (dashboard scope)

**Evidence:**
- `restaurant_customers` schema with order/reservation aggregates (`007`)
- Auto-sync on order, reservation, payment events
- Dashboard list/detail with stats
- Guest order history on public site
- Harbour Kitchen seed: 8 synthetic customers

**Gap:** Dashboard API scoped to demo restaurant ID.

---

### 13. Notifications

**Status: PARTIAL**

**Evidence:**
- Transactional service with idempotency, retries, backoff
- Templates for all order/reservation event types
- Restaurant + customer preference model
- Demo provider (logs to console / demo store)
- Notification logs persisted; dashboard view + manual retry API
- Tests: service, templates, authorization (9 tests)

**Gaps:**
- **Resend/Twilio not implemented** — `providers/index.ts` throws for non-demo
- No background worker for retry queue (manual API only)
- Production allows demo with warning only

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| Resend email provider | Real customer/staff emails | Implement `ResendEmailProvider` behind env flag | Medium (2–3 days) |
| Twilio SMS (optional) | SMS confirmations | Implement `TwilioSmsProvider` | Medium (2–3 days) |
| Retry worker | Failed notifications stay stuck | Scheduled job calling `processNotificationRetries()` | Low (1 day) |

---

### 14. Analytics

**Status: COMPLETE** (Phase 1 scope)

**Evidence:**
- Event ingestion API (120/min rate limit)
- Dashboard: revenue, orders, reservations, QR funnel, item performance
- CSV export
- Date-range filtering at SQL layer (`PERFORMANCE.md`)
- 24 synthetic Harbour Kitchen events
- 11 unit tests

**Gap:** Dashboard demo-ID gated; public POST intentional for telemetry.

---

### 15. AI Restaurant Intelligence

**Status: PARTIAL**

**Evidence:**
- Ask, daily brief, menu description draft, insight history APIs
- Tool loop with verified metrics only (`orchestrator.ts`, `safeguards.ts`)
- Demo provider (deterministic) + optional OpenAI provider
- Pre-seeded insights in Harbour Kitchen demo
- 17 unit tests

**Gaps:**
- Default demo provider — no external AI without configuration
- Dashboard hard-coded to demo ID
- Insights require seeded/historical data to be meaningful

**Complexity for production AI:** Low config overhead if OpenAI key set; Medium for tenant wiring.

---

### 16. Staff Roles

**Status: PARTIAL** (schema) / **MISSING** (application)

**Evidence:**
- `restaurant_members.role` CHECK `('owner', 'manager', 'staff')` in migration `011`
- Documented manual member insert in `DEPLOYMENT.md`

**Gaps:**
- No role-based permission checks in app or RLS
- No staff invite, list, revoke UI or API
- No differentiation between owner/manager/staff capabilities

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| RBAC enforcement | Managers and staff have owner-level access today | Role checks in guards; optional RLS helper `has_restaurant_role()` | Medium (3–5 days) |
| Staff management UI | Owners can't add team | Invite flow + members API + dashboard page | High (5–7 days) |

---

### 17. Audit Logs

**Status: PARTIAL**

**Evidence:**
- Payment transaction log (`payment_transactions`)
- Payment webhook event log (`payment_webhook_events`)
- Notification delivery log (`notification_logs`)

**Gaps:**
- **No staff/admin audit trail** (settings changes, refunds, member changes, menu publishes)
- No immutable activity log table
- Order status changes tracked on row only — no history

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| `audit_events` table | Compliance, dispute resolution, security investigations | Append-only table + write on sensitive actions | Medium (3–4 days) |
| Order status history | Operational forensics | Status transition log or event sourcing lite | Medium (2–3 days) |

---

### 18. Security

**Status: PARTIAL / RISK**

**Evidence:**
- RLS enabled on tenant tables; hardened in `011`, `013`
- Rate limiting on public write endpoints (in-memory per IP)
- Access tokens for order history and payment sessions in production
- Webhook signature verification framework
- Production env validation blocks demo auth, demo payments, placeholder secrets
- QR/session security tests
- CSRF mitigation via SameSite cookies (Supabase auth)

**Risks:**
- Authorization guards unwired — primary app-layer gap
- In-memory rate limits not shared across serverless instances
- `POST /api/restaurants` unauthenticated
- Storage not tenant-scoped
- Public QR token read policy
- No WAF/DDoS beyond platform defaults

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| Distributed rate limiting | Limits bypassed across instances | Upstash Redis rate limiter | Medium (2–3 days) |
| Tenant-scoped storage RLS | Cross-tenant upload risk | Path prefix = `restaurant_id` in policies | Low–Medium (1–2 days) |
| API auth on restaurant creation | Abuse vector | Require auth + create member in same transaction | Low (1 day) |

---

### 19. Testing

**Status: PARTIAL**

**Evidence:**
- **126 Vitest tests** across 34 files — all passing
- Strong coverage of domain logic: reservations, orders, pricing, table security, intelligence safeguards, notifications, analytics reports
- Component test: `MenuPreview.test.tsx`
- Production env validation tests

**Gaps:**
- No API route integration tests
- No E2E / Playwright tests
- No coverage reporting (`test:coverage` script absent)
- `queueReminderIfDue` untested and unused
- Cross-tenant access test in checklist not automated

| What is missing | Why it matters | Recommended implementation | Complexity |
|-----------------|----------------|----------------------------|------------|
| API integration tests | Regressions in auth wiring | Supertest/route handler tests for orders, reservations, guards | Medium (3–5 days) |
| E2E smoke tests | Journey validation in CI | Playwright: QR → order → dashboard | High (5–7 days) |
| Coverage gate | Unknown blind spots | `@vitest/coverage-v8` + 70% lib target | Low (1 day) |

---

### 20. Performance

**Status: COMPLETE**

**Evidence:**
- Documented review in `PERFORMANCE.md` (11 findings addressed)
- N+1 fixes for table dashboard
- Pagination limits (orders 100, reservations 200, customers 100)
- Analytics/reservation date bounds at SQL
- 8 composite indexes in `012_performance_indexes.sql`
- Menu cache, scoped Realtime, RSC splits, image lazy-load
- Build succeeds with optimized bundles

**Deferred (acceptable for Phase 1):** Redis cache, cursor pagination UI, full menu SQL RPC — documented.

---

### 21. Production Deployment

**Status: PARTIAL**

**Evidence:**
- `DEPLOYMENT.md` — step-by-step guide, migration table, security summary
- `PRODUCTION_CHECKLIST.md` — comprehensive pre/post deploy items
- `ENVIRONMENT_VARIABLES.md` — full reference
- `.env.example` template
- `instrumentation.ts` startup validation
- Harbour Kitchen seed script for demo environments

**Gaps (blockers for full production):**
- Payment provider not production-ready
- Multi-tenant dashboard/API not wired
- Manual `restaurant_members` population required
- No APM/structured logging (documented gap)
- Known limitations explicitly listed in checklist (lines 124–132)

---

## Summary Matrix

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Architecture | **COMPLETE** |
| 2 | Database | **COMPLETE** |
| 3 | Tenant isolation | **PARTIAL / RISK** |
| 4 | Authentication | **PARTIAL** |
| 5 | Authorization | **PARTIAL / RISK** |
| 6 | Website | **PARTIAL** |
| 7 | Menu | **PARTIAL** |
| 8 | QR | **COMPLETE / RISK** |
| 9 | Ordering | **COMPLETE** |
| 10 | Payments | **PARTIAL / RISK** |
| 11 | Reservations | **PARTIAL** |
| 12 | Customers | **PARTIAL** |
| 13 | Notifications | **PARTIAL** |
| 14 | Analytics | **COMPLETE** |
| 15 | AI Restaurant Intelligence | **PARTIAL** |
| 16 | Staff roles | **MISSING** (app) / **PARTIAL** (schema) |
| 17 | Audit logs | **PARTIAL** |
| 18 | Security | **PARTIAL / RISK** |
| 19 | Testing | **PARTIAL** |
| 20 | Performance | **COMPLETE** |
| 21 | Production deployment | **PARTIAL** |

**Counts:** 4 Complete · 14 Partial · 1 Missing (staff RBAC) · 6 with explicit Risk flags

---

## Priority Remediation Roadmap

Ordered by impact on pilot readiness:

| Priority | Item | Effort | Unblocks |
|----------|------|--------|----------|
| **P0** | Signup → restaurant + owner member provisioning | 2–4 days | Owner journey start |
| **P0** | Wire `guardRestaurantRoute()`; replace demo ID checks | 2–3 days | Multi-tenant security |
| **P0** | Active restaurant context in dashboard | 2–3 days | Owner setup → menu/website |
| **P0** | Stripe (or live payment) provider | 5–8 days | Real payments |
| **P1** | RLS patch: `table_sessions`, `qr_scan_events` | 1–2 days | Live QR under Supabase |
| **P1** | Resend email provider | 2–3 days | Real notifications |
| **P1** | Reservation reminder cron | 1–2 days | Complete reservation UX |
| **P2** | Staff RBAC + invite flow | 5–10 days | Team operations |
| **P2** | Audit log table | 3–4 days | Compliance |
| **P2** | API + E2E tests | 5–10 days | CI confidence |
| **P2** | Distributed rate limiting | 2–3 days | Multi-instance prod |

**Estimated total to full pilot readiness:** 4–6 weeks (1–2 engineers), depending on payment provider scope.

---

## Final Recommendation

### NOT READY FOR PILOT

Phase 1 **cannot be declared ready for pilot** against the required end-to-end journey:

> Restaurant signup → setup → menu → website → QR → order → payment → restaurant receives order → customer profile → analytics → AI insight

**Blocking reasons:**

1. **Restaurant signup does not create a tenant** — new owners land on an empty/wrong dashboard.
2. **Dashboard and APIs are bound to the demo restaurant ID** — even authenticated owners cannot manage their own restaurant without manual DB seeding.
3. **Authorization guards are not wired** — multi-tenant isolation relies on demo ID checks, not membership.
4. **Live payments cannot be accepted** — only demo provider exists; production validation explicitly blocks it.
5. **Staff roles and audit logs are not operational** — acceptable for demo, insufficient for operational pilot with real staff.

### What IS ready today

| Use case | Ready? |
|----------|--------|
| Sales / investor demos (Harbour Kitchen) | **Yes** — run `npm run seed:harbour-kitchen:reset` |
| QA of guest journey on seeded tenant | **Yes** |
| Engineering reference / Phase 2 foundation | **Yes** |
| Single-restaurant soft launch with manual Supabase seeding | **Partial** — possible with ops runbook, not self-serve |
| Multi-restaurant self-serve SaaS pilot | **No** |

### Suggested path to pilot

**Phase 1.5 (2–3 weeks)** — minimum viable pilot:
- Provisioning + tenant wiring + Stripe + RLS patches + Resend

**Phase 1.5+ (4–6 weeks)** — operational pilot:
- Above + staff invites + audit log + reminder cron + integration tests

Until P0 items ship, restrict external pilot to **controlled demos** using Harbour Kitchen and documented manual seeding per `DEPLOYMENT.md` and `docs/DEMO.md`.

---

## Appendix: Key File References

| Area | Path |
|------|------|
| Auth guards (unused) | `src/lib/auth/guards.ts` |
| Demo restaurant ID | `src/lib/utils.ts` (`getDemoRestaurantId`) |
| Harbour Kitchen seed | `scripts/seed-harbour-kitchen.ts`, `src/lib/seeds/harbour-kitchen/` |
| Migrations | `supabase/migrations/001`–`013` |
| Production validation | `src/lib/env/production.ts` |
| Payment providers | `src/lib/payment/providers/` |
| Notification providers | `src/lib/notification/providers/` |
| Deployment docs | `DEPLOYMENT.md`, `PRODUCTION_CHECKLIST.md`, `ENVIRONMENT_VARIABLES.md` |
| Performance | `PERFORMANCE.md` |
| Demo guide | `docs/DEMO.md` |

---

*This report reflects codebase state at review time. No new features were implemented as part of this review.*
