# Phase 1 Performance Review

This document records performance findings and the targeted fixes applied in Phase 1. The goal is measurable improvement without premature over-engineering.

## Scope

| Area | Primary paths |
|------|----------------|
| Public restaurant website | `src/app/r/[slug]/*`, `src/lib/restaurant/*` |
| Menu loading | `src/lib/menu/*`, `/api/menus/[menuId]` |
| QR / standalone menu | `/menu/[menuId]` |
| Dashboard — orders | `src/lib/order/data.ts` |
| Dashboard — reservations | `src/lib/reservation/data.ts` |
| Customer search | `src/lib/customer/data.ts` |
| Analytics | `src/lib/analytics/data.ts` |

---

## Findings & fixes

### 1. N+1 queries — table dashboard

**Finding:** `listTablesWithStats` loaded QR tokens, scan counts, and order counts per table in separate loops.

**Fix:** Batch queries with `Promise.all` over `table_qr_tokens`, `qr_scan_events`, and `restaurant_orders`, then aggregate in memory.

**File:** `src/lib/table/data.ts`

---

### 2. Unbounded list queries — dashboard

**Finding:** Orders, reservations, and customers could load entire tenant history.

**Fix:** Default limits via `src/lib/constants/pagination.ts`:

- Orders: 100
- Reservations: 200
- Customers: 100

Order listing also accepts optional date bounds for analytics lookback.

**Files:** `src/lib/order/data.ts`, `src/lib/reservation/data.ts`, `src/lib/customer/data.ts`

---

### 3. Reservation availability — full-table scan

**Finding:** Slot validation and reschedule checks loaded all reservations for a restaurant.

**Fix:** Pass `{ date }` to `listReservationsForRestaurant` so queries filter on `reservation_date` (indexed).

**File:** `src/lib/reservation/data.ts`

---

### 4. Analytics — load-all then filter in JS

**Finding:** Reports fetched all orders, events, reservations, and QR scans, then filtered by date in application code.

**Fix:** Apply UTC date bounds at query time. Orders use a 90-day lookback (`ANALYTICS_ORDERS_LOOKBACK_DAYS`) for repeat-customer metrics while keeping the selected range for revenue counts.

**File:** `src/lib/analytics/data.ts`

---

### 5. Missing / weak indexes

**Fix:** Migration `supabase/migrations/012_performance_indexes.sql`:

| Index | Purpose |
|-------|---------|
| `idx_orders_restaurant_placed_at` | Dashboard order lists, analytics |
| `idx_reservations_restaurant_guest_email` | Guest lookup |
| `idx_reservations_restaurant_date` | Availability by date |
| `idx_reservations_restaurant_created_at` | Analytics by creation time |
| `idx_qr_scans_restaurant_scanned_at` | Analytics QR funnel |
| `idx_qr_scans_table_scanned_at` | Per-table scan stats |
| `idx_table_qr_tokens_table_active` | Partial index for active tokens |
| `idx_restaurant_customers_updated_at` | Customer list sort |

Existing indexes from earlier migrations (menu, analytics events, etc.) were retained.

---

### 6. Gallery loaded on every public page

**Finding:** `fetchRestaurantBySlug` always joined `restaurant_gallery_images`, including layout shells that never render gallery.

**Fix:** Optional `galleryLimit` on `loadRestaurantBySlug` / `fetchRestaurantBySlug`. Default: skip gallery query (`gallery: []`). Home preview requests 3 images; gallery page requests up to 50; dashboard settings API requests up to 50.

**Files:** `src/lib/restaurant/service.ts`, `src/lib/restaurant/data.ts`, `src/lib/restaurant/page-data.ts`

---

### 7. Public menu — large payload & client-only QR page

**Finding:**

- `GET /api/menus/[menuId]` returned the full menu including inactive/sold-out items.
- `/menu/[menuId]` (QR) used client-side `useMenu`, triggering a fetch plus global Realtime subscriptions.

**Fix:**

- API returns `filterPublicMenu()` by default; dashboard editor passes `?full=1`.
- QR page is a Server Component using `loadPublicMenuById` (filtered, cached).
- `loadFullMenuById` wrapped in React `cache()` for request deduplication.

**Files:** `src/app/api/menus/[menuId]/route.ts`, `src/app/menu/[menuId]/page.tsx`, `src/lib/menu/data.ts`

---

### 8. Realtime — global subscriptions in `useMenu`

**Finding:** Subscriptions on `menu_items`, `modifier_groups`, and `modifiers` had **no filter**, causing reloads on unrelated tenant changes.

**Fix:** Subscribe only to `menus` and `menu_categories` scoped by `menu_id`. Item/modifier edits in the dashboard still refresh via API responses; optional `realtime: false` for future public clients.

**File:** `src/hooks/useMenu.ts`

---

### 9. Unnecessary client rendering — restaurant menu

**Finding:** `RestaurantMenuView` was entirely `"use client"` for a single analytics `useEffect`.

**Fix:** Split `MenuPageTracker` (small client island). Menu markup is server-rendered; only `AddToCartButton` remains client per item.

**Files:** `src/components/restaurant/RestaurantMenuView.tsx`, `src/components/restaurant/MenuPageTracker.tsx`

---

### 10. Image optimization

**Fix:**

- `next/image` with correct `sizes` on menu thumbnails (80px / 128px).
- Gallery: `priority` only for homepage preview hero; other images use `loading="lazy"`.
- Remote patterns for Supabase storage and Unsplash in `next.config.ts` (existing).

**Files:** `MenuPreview.tsx`, `GalleryGrid.tsx`, `RestaurantMenuView.tsx`

---

### 11. Menu reorder — sequential updates

**Finding:** `reorderRows` updated sort order one row at a time.

**Fix:** `Promise.all` for parallel updates (bounded by typical reorder batch size).

**File:** `src/lib/menu/service.ts`

---

## Intentionally deferred (not over-engineered)

| Item | Reason |
|------|--------|
| Full menu SQL join / RPC | Current 4-step menu fetch is acceptable for Phase 1 menu sizes; dependency chain limits parallelization |
| Redis / edge cache | React `cache()` + Supabase indexes sufficient for single-region Phase 1 |
| Cursor pagination UI | Fixed limits adequate for demo/small tenants; cursor APIs can come with scale |
| Table scan aggregation in SQL | In-memory aggregation over batched rows is fine for typical table counts |
| CDN cache headers on menu API | Editor needs fresh data; public menus served from RSC path |
| Splitting `RestaurantShell` client boundary | Layout requires cart/session providers; larger refactor |

---

## Verification

After applying migration `012_performance_indexes.sql`:

```bash
npm test
npm run build
```

---

## Summary

Phase 1 focuses on **query scoping**, **indexes**, **request deduplication**, **payload reduction** (public menu filter, optional gallery), **scoped Realtime**, and **smaller client islands**. These changes address the highest-impact issues identified without introducing a separate caching layer or pagination UX that the product does not yet require.
