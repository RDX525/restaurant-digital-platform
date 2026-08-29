# Environment Variables

Complete reference for all configuration used by the Restaurant Digital Platform.

## Quick reference

| Variable | Required (prod) | Default | Secret |
|----------|-----------------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | **Yes** |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` (dev) | No |
| `ACCESS_TOKEN_SECRET` | Yes | — | **Yes** |
| `PAYMENT_PROVIDER` | Yes | `demo` | No |
| `PAYMENT_DEMO_WEBHOOK_SECRET` | Dev only | — | **Yes** |
| `PAYMENT_{PROVIDER}_WEBHOOK_SECRET` | Per provider | — | **Yes** |
| `NOTIFICATION_PROVIDER` | No | `demo` | No |
| `NOTIFICATION_EMAIL_PROVIDER` | No | falls back to `NOTIFICATION_PROVIDER` | No |
| `NOTIFICATION_SMS_PROVIDER` | No | `demo` (unless `NOTIFICATION_PROVIDER=twilio`) | No |
| `NOTIFICATION_DEMO_SIMULATE_FAILURE` | No | `false` | No |
| `RESEND_API_KEY` | If Resend email | — | **Yes** |
| `RESEND_FROM_EMAIL` | If Resend email | — | No |
| `TWILIO_ACCOUNT_SID` | If Twilio SMS | — | **Yes** |
| `TWILIO_AUTH_TOKEN` | If Twilio SMS | — | **Yes** |
| `TWILIO_FROM_NUMBER` | If Twilio SMS | — | No |
| `CRON_SECRET` | Recommended (prod) | — | **Yes** |
| `UPSTASH_REDIS_REST_URL` | Recommended (prod) | — | No |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended (prod) | — | **Yes** |
| `INTELLIGENCE_PROVIDER` | No | `demo` | No |
| `OPENAI_API_KEY` | If OpenAI | — | **Yes** |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | No |
| `NEXT_PUBLIC_DEMO_RESTAURANT_ID` | Dev only | UUID in code | No |
| `ENABLE_DEMO_AUTH` | Never in prod | unset | No |
| `NODE_ENV` | Set by host | — | No |

---

## Supabase

### `NEXT_PUBLIC_SUPABASE_URL`
Supabase project URL. Used by browser and server clients.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Supabase anonymous (public) key. Safe to expose to the browser; RLS enforces access.

### `SUPABASE_SERVICE_ROLE_KEY`
**Server-only.** Bypasses RLS. Used by admin operations when explicitly required. Never expose to the client or commit to git.

**Production:** Rotate if ever exposed. Store only in the hosting provider secret manager.

---

## Site URL

### `NEXT_PUBLIC_SITE_URL`
Canonical public URL of the platform (no trailing slash).

Used for:
- SEO metadata and canonical URLs
- `robots.txt` / `sitemap.xml`
- Auth callback and password reset redirects
- QR code scan URLs

**Production:** Must be HTTPS and must not be `localhost`. The app throws at startup if misconfigured.

---

## Security tokens

### `ACCESS_TOKEN_SECRET`
HMAC secret for scoped customer tokens:
- Order history lookup (`order_history` scope)
- Payment session status polling (`payment_session` scope)

**Production:** Required. Use a unique random string (32+ characters). Do not reuse webhook secrets.

---

## Payments

### `PAYMENT_PROVIDER`
Active payment integration. Phase 1 ships with `demo` only; production **must** use a real provider once implemented (e.g. `stripe`).

### `PAYMENT_DEMO_WEBHOOK_SECRET`
HMAC secret for the demo payment webhook (`POST /api/webhooks/payments/demo`).

**Production:** Not used when `PAYMENT_PROVIDER` ≠ `demo`. Must not be the default placeholder if demo provider is somehow enabled.

### `PAYMENT_{PROVIDER}_WEBHOOK_SECRET`
Dynamic env key per provider (uppercase). Example: `PAYMENT_STRIPE_WEBHOOK_SECRET`.

---

## Notifications

### `NOTIFICATION_PROVIDER`
`demo` (log only) | `resend` (email) | `twilio` (SMS)

Use `NOTIFICATION_EMAIL_PROVIDER` and `NOTIFICATION_SMS_PROVIDER` to mix providers (e.g. Resend + Twilio).

**Production:** With both on `demo`, emails and SMS are written to server logs only—not delivered.

### `NOTIFICATION_EMAIL_PROVIDER` / `NOTIFICATION_SMS_PROVIDER`
Override channel-specific providers. Example production setup:

```env
NOTIFICATION_EMAIL_PROVIDER=resend
NOTIFICATION_SMS_PROVIDER=twilio
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@yourdomain.com
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

### `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
Required when the email provider is `resend`. `RESEND_FROM_EMAIL` must be a verified sender in Resend.

### `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`
Required when the SMS provider is `twilio`.

### `CRON_SECRET`
Bearer token for scheduled jobs at `/api/cron/*`. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when this env var is set.

Jobs:
- `GET /api/cron/reservation-reminders` — hourly; sends 24h reservation reminders
- `GET /api/cron/notification-retries` — every 15 minutes; retries failed notifications

See `vercel.json` for default schedules. External schedulers must send the same bearer header.

### `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
Optional Upstash Redis REST credentials for distributed rate limiting on public API routes. When unset, the app falls back to in-memory rate limiting (single-instance only).

### `NOTIFICATION_DEMO_SIMULATE_FAILURE`
When `true`, demo provider randomly fails sends (testing retries).

---

## Intelligence (AI)

### `INTELLIGENCE_PROVIDER`
`demo` | `openai`

### `OPENAI_API_KEY`
Required when `INTELLIGENCE_PROVIDER=openai`.

### `OPENAI_MODEL`
OpenAI model id (default `gpt-4o-mini`).

---

## Development-only

### `NEXT_PUBLIC_DEMO_RESTAURANT_ID`
UUID for the seeded demo restaurant. Optional; defaults to `00000000-0000-4000-8000-000000000001`.

**Production:** Omit unless you intentionally seed a demo tenant. Real restaurants use database IDs.

### `ENABLE_DEMO_AUTH`
When `true` and Supabase is unconfigured, enables cookie-based demo sign-in.

**Production:** Must never be set. Blocked by startup validation.

---

## Validation

On production startup (`NODE_ENV=production`), `src/instrumentation.ts` validates:

1. Supabase URL and anon key are not placeholders
2. Service role key is set
3. `NEXT_PUBLIC_SITE_URL` is a public HTTPS URL
4. `ACCESS_TOKEN_SECRET` is set
5. `PAYMENT_PROVIDER` is not `demo`
6. OpenAI key present if intelligence provider is `openai`
7. `ENABLE_DEMO_AUTH` is not enabled

Warnings (non-blocking):
- Notification providers are `demo`
- `CRON_SECRET` is not set

---

## Where variables are read

| Area | Primary files |
|------|----------------|
| Supabase | `src/lib/supabase/config.ts`, `src/lib/supabase/admin.ts` |
| Site URL | `src/lib/env/site-url.ts` |
| Production checks | `src/lib/env/production.ts` |
| Payments | `src/lib/payment/config.ts` |
| Notifications | `src/lib/notification/config.ts` |
| Intelligence | `src/lib/intelligence/config.ts` |
| Access tokens | `src/lib/security/access-tokens.ts` |
| Demo auth | `src/lib/auth/demo.ts` |

---

## Secret hygiene

- Copy `.env.example` → `.env.local` for local development
- `.env`, `.env.local`, and variants are gitignored
- Only `.env.example` (placeholders) belongs in the repository
- Rotate all secrets if `.env.local` was ever committed
