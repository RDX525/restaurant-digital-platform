# Restaurant Digital Platform

Menu management and public restaurant websites powered by Next.js and Supabase.

## Features

### Menu Management (Phase 1)
- Create, edit, delete, activate/deactivate menus
- Categories and items with drag-and-drop reordering
- Modifiers, image uploads, realtime public menu sync

### Public Restaurant Websites (Phase 2)
- Database-driven public sites at `/r/[slug]`
- Pages: home, about, menu, gallery, contact, reservations, order
- Restaurant branding (logo, colors, hero, copy)
- Opening hours, Google Maps, gallery
- SEO: metadata, sitemap, robots.txt, canonical URLs, Open Graph, JSON-LD
- Preview mode from dashboard (`?preview=1`)
- Custom domain architecture via middleware (ready for future domains)

## Setup

```bash
npm install
cp .env.example .env.local
```

Configure environment variables — see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

Run all Supabase migrations in order (`001` through `013`). See [DEPLOYMENT.md](./DEPLOYMENT.md).

```bash
npm run dev
```

## Production

- [DEPLOYMENT.md](./DEPLOYMENT.md) — deploy steps
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — pre-launch checklist
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — env reference
- [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) — security, tenancy, and coding standards

## Routes

### Platform
- `/` — Platform home
- `/dashboard/menus` — Menu management
- `/dashboard/website` — Restaurant website settings & preview

### Public restaurant site
- `/r/[slug]` — Home
- `/r/[slug]/about`
- `/r/[slug]/menu`
- `/r/[slug]/gallery`
- `/r/[slug]/contact`
- `/r/[slug]/reservations`
- `/r/[slug]/order`

Demo: [http://localhost:3000/r/harbour-kitchen](http://localhost:3000/r/harbour-kitchen)

Seed / reset demo data: see [docs/DEMO.md](./docs/DEMO.md).

Preview (unpublished): `/r/[slug]?preview=1`

### SEO
- `/sitemap.xml`
- `/robots.txt`

## Custom domains (future-ready)

Middleware resolves `restaurant_domains` table or `restaurants.custom_domain` and rewrites requests to `/r/[slug]/*`.

## Tests

```bash
npm test
```
