import type { MetadataRoute } from 'next'
import { fetchCategories, resolvableProductSlugs } from '@/lib/api/server'
import { rooms } from '@/lib/data'
import { bandSlug, categories as lightCategories, categoryPath } from '@/lib/data/categories'
import { getRoomSubPage } from '@/lib/data/category-rooms'
import { cities } from '@/lib/data/cities'
import { guides } from '@/lib/data/guides'
import { products as staticProducts } from '@/lib/data/products'
import { absoluteUrl } from '@/lib/site'

// Revalidate daily — the catalog changes far slower than the 60s product TTL.
export const revalidate = 86400

/**
 * Every product slug from the API, falling back to static data if it is down.
 *
 * Taken from the resolver's own index rather than re-derived from product names:
 * the two used to be computed independently and could disagree about the
 * catalog, which put URLs in the sitemap that the product route answered with a
 * 404 (/collections/dg-p184a, sampled 2026-08-08). A slug that came out of the
 * resolver is resolvable by definition.
 */
async function allProductSlugs(): Promise<string[]> {
  try {
    // Shares the cached catalog with the product route — no extra API paging.
    const slugs = await resolvableProductSlugs()
    if (slugs.length === 0) return staticProducts.map(p => p.slug)
    return slugs
  } catch {
    // ponytail: a dead API must not fail the build — ship the static catalog.
    return staticProducts.map(p => p.slug)
  }
}

/**
 * Category landing pages — the strongest commercial URLs on the site.
 *
 * The flat pages (`/pendant-lights`) are the canonicals and are listed
 * unconditionally, since they are local data. Any backend category we have not
 * written copy for yet falls back to its `?category=` filter view so it is
 * still discoverable; a dead category API just drops those.
 */
async function categoryUrls(): Promise<string[]> {
  const flat = lightCategories.map(c => `/${c.slug}`)

  try {
    const apiCategories = await fetchCategories()
    // URLSearchParams, not encodeURIComponent: it encodes a space as `+`,
    // matching the canonical the collections page emits.
    const extras = apiCategories
      .filter(c => !categoryPath(c.name))
      .map(c => `/collections?${new URLSearchParams({ category: c.name }).toString()}`)
    return [...flat, ...extras]
  } catch {
    return flat
  }
}

/**
 * Room and price-band pages beneath each category. Local data, so no API call
 * and no failure mode — a room pairing without copy is simply not listed.
 */
function subTierUrls(): string[] {
  return lightCategories.flatMap(category => [
    ...category.priceBands.map(band => `/${category.slug}/${bandSlug(band)}`),
    ...category.rooms
      .filter(room => getRoomSubPage(category.slug, room))
      .map(room => `/${category.slug}/${room}`),
  ])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/collections'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/rooms'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/room-visualizer'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/guides'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/surat-store'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/shipping'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: absoluteUrl('/returns'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = (await categoryUrls()).map(path => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // A shade below the parent category: same inventory, narrower intent.
  const subTierRoutes: MetadataRoute.Sitemap = subTierUrls().map(path => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // lastModified is the guide's own updated date, not the build time — these
  // are the only pages on the site where we actually know when the content changed.
  const guideRoutes: MetadataRoute.Sitemap = guides.map(guide => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.updated),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  // Delivery-area pages. Not store pages — there is one address, /surat-store.
  const cityRoutes: MetadataRoute.Sitemap = cities.map(city => ({
    url: absoluteUrl(`/lighting/${city.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

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

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...subTierRoutes,
    ...cityRoutes,
    ...guideRoutes,
    ...roomRoutes,
    ...productRoutes,
  ]
}
