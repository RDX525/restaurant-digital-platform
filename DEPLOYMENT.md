# Deployment Guide — Phase 1

This guide covers deploying the Restaurant Digital Platform to production with Supabase as the backend.

## Architecture overview

```
Browser / Customer
       │
       ▼
  Next.js 15 (App Router)
  ├── Server Components (public sites, menus)
  ├── API Routes (/api/*)
  └── Middleware (auth, custom domains)
       │
       ▼
  Supabase
  ├── PostgreSQL (RLS + migrations)
  ├── Auth (email/password, PKCE)
  ├── Storage (menu-images, restaurant-assets)
  └── Realtime (menu editor sync)
```

**Recommended hosting:** Vercel, Netlify, or any Node.js host supporting Next.js 15.

---

## 1. Prerequisites

- Node.js 20+
- Supabase project (Pro recommended for backups + support)
- Domain with DNS access
- Payment provider account (required before live payments)
- Optional: OpenAI API key for intelligence features

---

## 2. Supabase setup

### 2.1 Create project

1. Create a new Supabase project in your target region.
2. Note the **Project URL**, **anon key**, and **service role key**.

### 2.2 Run migrations

Apply SQL migrations **in numeric order** via the Supabase SQL editor or CLI:

| # | File | Purpose |
|---|------|---------|
| 001 | `001_menu_schema.sql` | Restaurants, menus, storage |
| 002 | `002_restaurant_website.sql` | Gallery, domains, demo seed |
| 003 | `003_qr_tables.sql` | QR tables, orders base |
| 004 | `004_orders_phase1.sql` | Order status, indexes |
| 005 | `005_payments.sql` | Payment sessions |
| 006 | `006_reservations.sql` | Reservations |
| 007 | `007_customers.sql` | Customer profiles |
| 008 | `008_notifications.sql` | Email/SMS preferences |
| 009 | `009_analytics.sql` | Analytics events |
| 010 | `010_intelligence.sql` | AI insights |
| 011 | `011_security_tenant_isolation.sql` | Members, hardened RLS |
| 012 | `012_performance_indexes.sql` | Performance indexes |
| 013 | `013_production_rls_completion.sql` | Menu RLS, storage, read tightening |

```bash
# With Supabase CLI (optional)
supabase db push
# Or paste each file into Dashboard → SQL → New query
```

### 2.3 Seed first restaurant owner

After migrations, link a Supabase Auth user to a restaurant:

```sql
-- Replace UUIDs with your auth.users.id and restaurants.id
insert into restaurant_members (user_id, restaurant_id, role)
values ('YOUR-USER-UUID', 'YOUR-RESTAURANT-UUID', 'owner')
on conflict do nothing;
```

Remove or unpublish the demo restaurant for production:

```sql
update restaurants set is_published = false where slug = 'demo-restaurant';
```

### 2.4 Auth redirect URLs

In Supabase Dashboard → Authentication → URL configuration:

- **Site URL:** `https://your-domain.com`
- **Redirect URLs:**
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/reset-password`
  - `http://localhost:3000/auth/callback` (development)

### 2.5 Storage

Buckets are created by migration `001` and `002`:
- `menu-images` (public read)
- `restaurant-assets` (public read)

Migration `013` adds member-scoped upload policies. Uploads require an authenticated dashboard session.

### 2.6 Backups

- Enable Supabase **Point-in-Time Recovery** (Pro) or schedule weekly `pg_dump` exports
- Store exports in separate cloud storage
- Test restore procedure before launch

---

## 3. Environment configuration

Copy the template:

```bash
cp .env.example .env.local   # development
```

Set production variables in your hosting provider. See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

**Minimum production set:**

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ACCESS_TOKEN_SECRET=<random-32+-char-string>
PAYMENT_PROVIDER=stripe
PAYMENT_STRIPE_WEBHOOK_SECRET=whsec_...
NOTIFICATION_PROVIDER=demo
INTELLIGENCE_PROVIDER=demo
```

Startup validation runs via `src/instrumentation.ts` and **fails the deploy** if required variables are missing or unsafe.

---

## 4. Build & deploy

```bash
npm ci
npm test
npm run build
npm start   # or deploy via platform CLI
```

### Vercel example

```bash
vercel env pull .env.local   # optional, for local parity
vercel --prod
```

Set all secrets in Vercel → Settings → Environment Variables for the **Production** environment.

---

## 5. Payment webhooks

Register with your payment provider:

```
POST https://your-domain.com/api/webhooks/payments/{provider}
```

The handler verifies HMAC signatures via `x-payment-signature` header. See `docs/payment-architecture.md` for event flow.

**Demo provider:** Development only. Disabled when `PAYMENT_PROVIDER=demo` in production (startup validation blocks this).

---

## 6. Email & SMS

Phase 1 ships with a **demo notification provider** that logs messages to the server console.

| Provider | Status | Env |
|----------|--------|-----|
| `demo` | Logs only | `NOTIFICATION_PROVIDER=demo` |
| Resend | Not implemented | Future |
| Twilio | Not implemented | Future |

For production launch without external providers, document that confirmation emails are not sent automatically.

---

## 7. Custom domains

1. Add domain record in DNS pointing to your host.
2. Insert mapping in Supabase:

```sql
insert into restaurant_domains (restaurant_id, domain, is_primary)
values ('RESTAURANT-UUID', 'www.example-restaurant.com', true);
```

Or set `restaurants.custom_domain`.

Middleware rewrites custom-domain traffic to `/r/[slug]/*`. Dashboard and API paths on custom domains require authentication.

---

## 8. Security summary

| Control | Implementation |
|---------|----------------|
| Tenant isolation | RLS + `restaurant_members` (migrations 011, 013) |
| Dashboard auth | Supabase session via middleware |
| Demo auth | Disabled in production |
| Order history | Scoped access token required in production |
| Payment sessions | Scoped access token required in production |
| Rate limiting | In-memory per IP on public endpoints |
| Secrets | Server env only; validated at startup |

**Not yet wired (Phase 1 gap):** Some dashboard API routes still use demo restaurant ID checks instead of `guardRestaurantRoute()`. Complete before multi-tenant production. See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

---

## 9. SEO

Generated automatically:

- **`/robots.txt`** — allows `/` and `/r/`; disallows `/dashboard/`, `/api/`, `/menu/`
- **`/sitemap.xml`** — lists published restaurants and public pages

Requires `NEXT_PUBLIC_SITE_URL` at build/runtime.

---

## 10. Monitoring & logging

Phase 1 does not include APM. Recommended:

| Signal | Tool |
|--------|------|
| HTTP errors | Hosting platform (Vercel Analytics, etc.) |
| Database | Supabase Dashboard → Logs |
| Auth failures | Supabase Auth logs |
| Payment failures | Provider dashboard + webhook logs |
| App startup | Hosting deploy logs (instrumentation validation) |

Add structured logging (`console.error` with context) in API catch blocks before scaling.

---

## 11. Rollback

1. Redeploy previous git tag / deployment in hosting UI
2. Database migrations are **forward-only** — avoid rollback migrations in production; write compensating migrations instead
3. Rotate secrets if a bad deploy exposed configuration

---

## 12. Related documents

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — full env reference
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — pre-launch checklist
- [PERFORMANCE.md](./PERFORMANCE.md) — performance decisions
- [docs/payment-architecture.md](./docs/payment-architecture.md) — payment design

---

## Development vs production

| Feature | Development | Production |
|---------|-------------|------------|
| Supabase | Optional (demo fallback) | **Required** |
| Demo auth | When Supabase unconfigured | **Disabled** |
| Demo payment | `PAYMENT_PROVIDER=demo` | **Blocked** |
| Site URL | `localhost:3000` default | **HTTPS required** |
| In-memory stores | When no Supabase | **Disabled** |
| Order history token | Optional | **Required** |
