import type { SocialLinks } from "@/lib/restaurant/types";
import { restaurantSocialEntries } from "@/lib/restaurant/theme";

export function RestaurantSocialLinks({
  links,
  className,
  tone = "onDark",
}: {
  links: SocialLinks;
  className?: string;
  tone?: "onDark" | "onLight";
}) {
  const entries = restaurantSocialEntries(links);
  if (entries.length === 0) return null;

  const linkClass =
    tone === "onLight"
      ? "inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-pine-900 shadow-[0_8px_24px_rgb(20_32_28/0.08)] ring-1 ring-[rgb(var(--rs-accent)/0.38)] transition [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:ring-[rgb(var(--rs-accent)/0.7)]"
      : "inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-[rgb(var(--rs-accent))] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-[rgb(var(--rs-accent)/0.42)] transition [@media(hover:hover)]:hover:bg-white/[0.14] [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:ring-[rgb(var(--rs-accent)/0.75)]";

  return (
    <ul className={className ?? "flex flex-wrap gap-2"}>
      {entries.map((entry) => (
        <li key={entry.network}>
          <a
            href={entry.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={entry.label}
            className={linkClass}
          >
            <SocialGlyph network={entry.network} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function SocialGlyph({ network }: { network: keyof SocialLinks }) {
  const className = "h-5 w-5";
  switch (network) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.69 2.58-4.82 1.36-1.06 3.1-1.64 4.8-1.65.04 1.51.02 3.01.02 4.51-.18-.07-.37-.12-.55-.18-1.07-.33-2.21-.39-3.23-.07-1.09.35-1.95 1.16-2.38 2.21-.42 1.01-.24 2.27.5 3.08.69.8 1.85 1.11 2.89.9.98-.19 1.77-.89 2.09-1.83.14-.42.18-.95.18-1.4.02-3.02.01-6.05.02-9.07z" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
          <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M4.2 12h15.6M12 3.8c2.2 2.3 3.4 5.1 3.4 8.2S14.2 17.9 12 20.2C9.8 17.9 8.6 15.1 8.6 12S9.8 6.1 12 3.8Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    default:
      return null;
  }
}
