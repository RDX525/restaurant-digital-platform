# Production Deployment Checklist

Use this checklist before every production release. All items should be checked unless marked optional.

## Pre-deploy — secrets & environment

- [ ] `.env.local` and real secrets are **not** in git
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (not placeholders)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in hosting secrets only
- [ ] `NEXT_PUBLIC_SITE_URL` set to production HTTPS URL (not localhost)
- [ ] `ACCESS_TOKEN_SECRET` set to unique random value (32+ chars)
- [ ] `PAYMENT_PROVIDER` is **not** `demo`
- [ ] Provider webhook secret set (`PAYMENT_*_WEBHOOK_SECRET`)
- [ ] `ENABLE_DEMO_AUTH` is **unset**
- [ ] `NODE_ENV=production` on hosting platform
- [ ] OpenAI key set if `INTELLIGENCE_PROVIDER=openai`

## Database & Supabase

- [ ] All migrations applied in order (`001` → `013`) — see [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ ] `restaurant_members` populated for each owner (`user_id`, `restaurant_id`, `role`)
- [ ] RLS enabled on all tenant tables (verify in Supabase dashboard)
- [ ] Storage buckets exist: `menu-images`, `restaurant-assets`
- [ ] Supabase Auth redirect URLs include:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/reset-password`
- [ ] Supabase daily backups enabled (Pro plan or manual export schedule)
- [ ] Connection pooling configured if using serverless (Supabase pooler URL optional)

## Authentication

- [ ] Supabase Auth email provider configured
- [ ] Demo auth route (`POST /api/auth/demo`) returns 403 in production
- [ ] Dashboard routes require authenticated Supabase session
- [ ] Custom-domain requests to `/dashboard` and `/api` require auth (middleware)
- [ ] Password reset flow tested end-to-end

## Payments

- [ ] Real payment provider configured and tested in staging
- [ ] Webhook endpoint registered: `POST /api/webhooks/payments/{provider}`
- [ ] Webhook signature verification tested
- [ ] Demo pay endpoint (`POST .../pay`) returns 501 when not demo provider
- [ ] Payment session polling uses access tokens in production

## Email & SMS

- [ ] Notification provider decision documented:
  - `demo` = logs only (acceptable for soft launch)
  - OR real provider implemented (Resend / Twilio)
- [ ] Restaurant notification preferences configured per tenant

## Storage

- [ ] Bucket policies applied (migration `013`)
- [ ] Image upload tested from dashboard (menu item + restaurant assets)
- [ ] `next.config.ts` `images.remotePatterns` includes your Supabase storage host

## Security

- [ ] Public order history requires access token in production
- [ ] Payment session GET requires access token in production
- [ ] Rate limiting active on public write endpoints (orders, reservations, analytics, auth)
- [ ] No `using (true)` write policies on tenant tables
- [ ] Service role key never exposed to browser
- [ ] Preview mode (`?preview=1`) only for authenticated owners (header set by dashboard)

## Domain & routing

- [ ] DNS A/CNAME records point to hosting provider
- [ ] Custom domains added to `restaurant_domains` or `restaurants.custom_domain`
- [ ] SSL/TLS certificate active
- [ ] Middleware custom-domain rewrite tested

## SEO

- [ ] `/robots.txt` returns production host and sitemap URL
- [ ] `/sitemap.xml` lists published restaurants
- [ ] Restaurant `meta_title` / `meta_description` set in dashboard
- [ ] `is_published=true` only for live restaurants

## Error handling & observability

- [ ] Hosting platform error alerts configured
- [ ] Supabase logs monitored for RLS violations
- [ ] Payment webhook failures alert (provider dashboard)
- [ ] 5xx responses investigated (no silent failures in API routes)

## Rate limiting (Phase 1)

In-memory rate limits are applied per IP. For multi-instance production:

- [ ] Accept Phase 1 limits for single-region launch, **or**
- [ ] Plan Redis/Upstash upgrade for distributed rate limiting

Current limits (per IP / minute):

| Endpoint | Limit |
|----------|-------|
| `POST /api/orders` | 20 |
| `GET /api/orders` | 30 |
| `POST /api/reservations` | 15 |
| `POST /api/analytics/events` | 120 |
| `POST /api/auth/demo` | 10 (dev only) |
| `GET /api/payments/sessions/:id` | 60 |

## Testing

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — production build succeeds
- [ ] Smoke test: public menu, order checkout, reservation, dashboard login
- [ ] Cross-tenant access denied (user A cannot access restaurant B API)

## Post-deploy

- [ ] Verify startup logs — no production config errors
- [ ] Create first real restaurant + member row
- [ ] Publish restaurant and confirm public site
- [ ] Submit sitemap to search console (optional)
- [ ] Document rollback procedure (previous deployment + DB migration notes)

---

## Known Phase 1 limitations

Document these for stakeholders:

1. **Dashboard restaurant ID** — UI still references demo restaurant ID helper; multi-restaurant owners need member wiring per tenant.
2. **Payment provider** — Only demo provider implemented; real Stripe/etc. required before accepting live payments.
3. **Notifications** — Demo provider logs only unless external provider added.
4. **Rate limiting** — In-memory; not shared across serverless instances.
5. **Analytics** — Public event POST allowed (rate limited); acceptable for marketing telemetry.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step deploy instructions.
