# Harbour Kitchen — Demo Restaurant

Synthetic demo tenant for development and sales demonstrations. **No real personal data** — all guests use `@demo.harbourkitchen.nz` emails and fictional names.

## Quick start

```bash
# With Supabase (.env.local configured)
npm run seed:harbour-kitchen:reset

# Without Supabase (in-memory demo only)
npm run seed:harbour-kitchen
```

## Public URLs

| Feature | URL |
|---------|-----|
| Website | `/r/harbour-kitchen` |
| Menu | `/r/harbour-kitchen/menu` |
| Order | `/r/harbour-kitchen/order` |
| Reservations | `/r/harbour-kitchen/reservations` |
| QR (Table 5) | `/q/hk-t5-qrt-000000000005` |
| Legacy slug | `/r/demo-restaurant` (fallback) |

## What's included

- **Profile** — Wynyard Quarter, Auckland waterfront branding
- **Menu** — Breakfast, Lunch, Dinner, Drinks (18 items, modifiers on lamb, burger, coffee)
- **Tables** — 20 tables with QR tokens (`hk-t1` … `hk-t20`)
- **Customers** — 8 synthetic profiles with order/reservation history
- **Orders** — 6 sample orders (mixed status, dine-in/pickup/delivery)
- **Reservations** — 5 bookings (upcoming + past)
- **Analytics** — 24 synthetic events + QR scan samples
- **Intelligence** — 3 pre-seeded AI insights

## Reset / reseed

```bash
npm run seed:harbour-kitchen:reset   # delete harbour data in Supabase + reload
npm run seed:harbour-kitchen         # upsert without full delete
```

## Source files

| Path | Purpose |
|------|---------|
| `src/lib/seeds/harbour-kitchen/` | All seed data definitions |
| `scripts/seed-harbour-kitchen.ts` | CLI seed script |
