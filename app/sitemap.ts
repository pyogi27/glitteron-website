import type { MetadataRoute } from 'next'
import { fetchAllProducts, slugify } from '@/lib/api/server'
import { rooms } from '@/lib/data'
import { products as staticProducts } from '@/lib/data/products'
import { absoluteUrl } from '@/lib/site'

// Revalidate daily — the catalog changes far slower than the 60s product TTL.
export const revalidate = 86400

/** Every product slug from the API, falling back to static data if it is down. */
async function allProductSlugs(): Promise<string[]> {
  try {
    // Shares the cached catalog with the product route — no extra API paging.
    const products = await fetchAllProducts()
    if (products.length === 0) return staticProducts.map(p => p.slug)

    // slug is null on every API record today; derive it from the name exactly
    // as mapApiProduct and findApiProductBySlug do.
    const slugs = products
      .map(p => p.slug ?? slugify(p.name))
      .filter(s => s.length > 0)

    return Array.from(new Set(slugs))
  } catch {
    // ponytail: a dead API must not fail the build — ship the static catalog.
    return staticProducts.map(p => p.slug)
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/collections'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/rooms'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/room-visualizer'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/shipping'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: absoluteUrl('/returns'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const roomRoutes: MetadataRoute.Sitemap = rooms.map(room => ({
    url: absoluteUrl(`/rooms/${room.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // No updatedAt on the API product record, so lastModified is omitted rather
  // than stamped with a build time that would lie about freshness.
  const productRoutes: MetadataRoute.Sitemap = (await allProductSlugs()).map(slug => ({
    url: absoluteUrl(`/collections/${slug}`),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...roomRoutes, ...productRoutes]
}
