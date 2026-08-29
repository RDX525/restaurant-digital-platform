const DOMAIN_CACHE_TTL_MS = 60_000;
const domainSlugCache = new Map<string, { slug: string | null; expiresAt: number }>();

export function getCachedDomainSlug(host: string): string | null | undefined {
  const entry = domainSlugCache.get(host);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    domainSlugCache.delete(host);
    return undefined;
  }
  return entry.slug;
}

export function setCachedDomainSlug(host: string, slug: string | null): void {
  domainSlugCache.set(host, {
    slug,
    expiresAt: Date.now() + DOMAIN_CACHE_TTL_MS,
  });
}
