import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CollectionView from '@/components/collections/CollectionView'
import CategorySeoContent from '@/components/collections/CategorySeoContent'
import JsonLd from '@/components/seo/JsonLd'
import { faqSchema } from '@/lib/seo/schema'
import { categories, getCategoryBySlug } from '@/lib/data/categories'
import { COLORS, MATERIALS, pickSlugs } from '@/lib/data/filters'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{
    page?: string
    minPrice?: string
    maxPrice?: string
    /** Comma-joined MATERIALS slugs, set by the filter panel. */
    material?: string | string[]
    /** Comma-joined COLORS slugs. */
    color?: string | string[]
  }>
}

const MAX_PAGE = 1000

function parsePage(raw?: string): number {
  if (!raw || !/^\d+$/.test(raw)) return 1
  const n = Number(raw)
  return n >= 1 && n <= MAX_PAGE ? n : 1
}

export function generateStaticParams() {
  return categories.map(c => ({ category: c.slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const cat = getCategoryBySlug(slug)
  // A slug we do not own gets no metadata; the page below 404s it.
  if (!cat) return {}

  const { page: pageParam, minPrice, maxPrice, material, color } = await searchParams
  const page = parsePage(pageParam)
  const suffix = page > 1 ? ` — Page ${page}` : ''
  const canonical = page > 1 ? `/${cat.slug}?page=${page}` : `/${cat.slug}`
  const filtered = minPrice || maxPrice || pickSlugs(MATERIALS, material) || pickSlugs(COLORS, color)

  const title = `${cat.title}${suffix}`

  return {
    title,
    description: cat.description,
    alternates: { canonical },
    // Filtered slices are subsets of this page, not index-worthy on their own.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description: cat.description, url: canonical, type: 'website' },
  }
}

/**
 * Flat category landing page: `/pendant-lights`.
 *
 * Root-level rather than nested because that is the URL shape every competitor
 * ranking for these terms in India uses, and the segment itself is the keyword.
 * Static sibling routes win over this dynamic one, so `/about`, `/faq` and the
 * rest are unaffected; anything not in `categories` 404s.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params
  const cat = getCategoryBySlug(slug)
  if (!cat) notFound()

  const { page: pageParam, minPrice, maxPrice, material, color } = await searchParams
  const page = parsePage(pageParam)

  return (
    <>
      <JsonLd data={faqSchema(cat.faqs, `/${cat.slug}`)} />
      <CollectionView
        categoryName={cat.name}
        categoryNames={cat.names}
        heading={cat.heading}
        subtitle={cat.subtitle}
        page={page}
        minPrice={minPrice}
        maxPrice={maxPrice}
        material={pickSlugs(MATERIALS, material)}
        color={pickSlugs(COLORS, color)}
        basePath={`/${cat.slug}`}
        // Filter here rather than handing off to /collections: one `category`
        // param could not carry /hanging-lights, which spans two.
        filterPath={`/${cat.slug}`}
        listPath={`/${cat.slug}`}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Collections', path: '/collections' },
          { name: cat.heading, path: `/${cat.slug}` },
        ]}
      >
        <CategorySeoContent category={cat} />
      </CollectionView>
    </>
  )
}
