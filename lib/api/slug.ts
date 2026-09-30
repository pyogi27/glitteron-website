/**
 * The API returns slug: null for every product, so product URLs are derived
 * from the name. Exported (and re-exported from server.ts) so the sitemap, the
 * slug index and the Watch & Shop cards all build the exact same slugs that
 * findApiProductBySlug resolves — a divergent copy would emit 404s.
 *
 * Kept free of imports so the Node self-tests can load it directly.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
