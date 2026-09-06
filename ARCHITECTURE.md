# Architecture — Restaurant Digital Platform

## Public restaurant websites

Guest sites render under `/r/[slug]` (and custom domains) via `RestaurantShell`.

- Theme tokens come from `restaurantThemeStyle(restaurant)` (`--rs-primary`, `--rs-accent`, etc.).
- Layout chrome: header, footer, cart + table-session providers.
- Pages are mostly Server Components with ISR (`revalidate = 60`).

## Motion system (generated sites inherit automatically)

Motion is part of the website generation architecture, not demo-only.

| Layer | Location | Role |
|---|---|---|
| Presets | `src/lib/motion/presets.ts` | Timing, easing, intensity tokens |
| CSS | `src/app/globals.css` (`.motion-*`, `.restaurant-site`) | Hover zoom, CTA press, hero drift, reveals |
| Islands | `src/components/motion/*` | `MotionReveal`, `MotionStagger`, hooks |

Any site wrapped in `RestaurantShell` (`.restaurant-site`) inherits:

- Food/gallery image hover zoom
- CTA / chip / menu-card micro-interactions
- Optional scroll reveals when pages use `MotionReveal` / `MotionStagger`

**Performance choice:** CSS + IntersectionObserver only on guest sites (no Framer Motion) to protect Core Web Vitals. Transforms/opacity only; `prefers-reduced-motion` respected; continuous hero drift is desktop-only.

## Platform / dashboard

Landing uses existing CSS entrance animations. Dashboard keeps motion light (card hover, mobile nav entrance) so operational UI stays snappy.
