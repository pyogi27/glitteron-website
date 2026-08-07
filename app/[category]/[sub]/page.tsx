import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CollectionView from '@/components/collections/CollectionView'
import SubPageSeoContent from '@/components/collections/SubPageSeoContent'
import JsonLd from '@/components/seo/JsonLd'
import { faqSchema } from '@/lib/seo/schema'
import {
  bandSlug,
  categories,
  formatInr,
  getCategoryBySlug,
  getPriceBand,
  type CategoryFaq,
  type LightCategory,
} from '@/lib/data/categories'
import { getRoomSubPage } from '@/lib/data/category-rooms'
import { rooms } from '@/lib/data/rooms'

interface Props {
  params: Promise<{ category: string; sub: string }>
  searchParams: Promise<{ page?: string }>
}

const MAX_PAGE = 1000

function parsePage(raw?: string): number {
  if (!raw || !/^\d+$/.test(raw)) return 1
  const n = Number(raw)
  return n >= 1 && n <= MAX_PAGE ? n : 1
}

/** Everything the page needs, whichever kind of sub-tier the slug turned out to be. */
interface Resolved {
  title: string
  description: string
  heading: string
  subtitle: string
  intro: string[]
  faqs: CategoryFaq[]
  /** Backend room tag, on room pages only. */
  whereUsed?: string
  /** Price ceiling in INR, on band pages only. */
  maxPrice?: string
  siblings: { label: string; href: string }[]
  siblingsLabel: string
}

/**
 * Shipping and warranty do not change with budget, and "is the cheap one worse
 * supported?" is the question a price-band page actually gets asked.
 */
function bandFaqs(): CategoryFaq[] {
  return [
    {
      question: 'Is shipping free on smaller orders?',
      answer:
        'Yes. Shipping is free on every order anywhere in India with no minimum order value, and delivery is 5 to 7 days from dispatch by registered courier.',
    },
    {
      question: 'Do lower-priced fixtures carry the same warranty?',
      answer:
        'Yes — 5 years against manufacturing defects on every fixture regardless of price, and the same 7-day return window from receipt.',
    },
  ]
}

function resolve(category: LightCategory, sub: string): Resolved | undefined {
  const band = getPriceBand(category, sub)
  if (band) {
    const price = formatInr(band.max)
    const heading = `${category.shortName} Under ${price}`
    return {
      title: `Buy ${category.shortName} Under ${price} Online in India`,
      description: `Handcrafted ${category.shortName.toLowerCase()} under ${price}, shipped free anywhere in India. 5-year warranty, 7-day returns, dimmable as standard.`,
      heading,
      subtitle: `Handcrafted ${category.shortName.toLowerCase()} at ${price} and below.`,
      intro: [
        band.note,
        `Price here is the fixture, not a stripped version of it. Everything under ${price} is made in the same Surat workshop, from the same brass, glass and steel, dimmable as standard and covered by the same 5-year warranty as the pieces above it.`,
      ],
      faqs: bandFaqs(),
      maxPrice: String(band.max),
      siblings: category.priceBands
        .filter(other => other.max !== band.max)
        .map(other => ({
          label: `${category.shortName} under ${formatInr(other.max)}`,
          href: `/${category.slug}/${bandSlug(other)}`,
        })),
      siblingsLabel: 'Other budgets',
    }
  }

  // Not a band — try a room pairing this category has copy for.
  if (!category.rooms.includes(sub)) return undefined
  const roomPage = getRoomSubPage(category.slug, sub)
  const room = rooms.find(r => r.slug === sub)
  if (!roomPage || !room) return undefined

  return {
    ...roomPage,
    whereUsed: room.whereUsed,
    siblings: [
      ...category.rooms
        .filter(other => other !== sub)
        .flatMap(other => {
          const sibling = getRoomSubPage(category.slug, other)
          return sibling ? [{ label: sibling.heading, href: `/${category.slug}/${other}` }] : []
        }),
      ...category.priceBands.map(band => ({
        label: `${category.shortName} under ${formatInr(band.max)}`,
        href: `/${category.slug}/${bandSlug(band)}`,
      })),
    ],
    siblingsLabel: 'Also in this category',
  }
}

export function generateStaticParams() {
  return categories.flatMap(category => [
    ...category.priceBands.map(band => ({ category: category.slug, sub: bandSlug(band) })),
    ...category.rooms
      .filter(room => getRoomSubPage(category.slug, room))
      .map(room => ({ category: category.slug, sub: room })),
  ])
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: categorySlug, sub } = await params
  const category = getCategoryBySlug(categorySlug)
  const resolved = category ? resolve(category, sub) : undefined
  if (!resolved) return {}

  const page = parsePage((await searchParams).page)
  const suffix = page > 1 ? ` — Page ${page}` : ''
  const path = `/${categorySlug}/${sub}`
  const canonical = page > 1 ? `${path}?page=${page}` : path
  const title = `${resolved.title}${suffix}`

  return {
    title,
    description: resolved.description,
    alternates: { canonical },
    openGraph: { title, description: resolved.description, url: canonical, type: 'website' },
  }
}

/**
 * Sub-tier landing page: `/chandelier-lights/dining-room` (room intent) or
 * `/chandelier-lights/under-25000` (budget intent).
 *
 * One route for both because they are the same page with a different filter
 * and different copy, and a slug is only ever one of the two. Anything else
 * 404s — there is no auto-generated variant.
 */
export default async function CategorySubPage({ params, searchParams }: Props) {
  const { category: categorySlug, sub } = await params
  const category = getCategoryBySlug(categorySlug)
  const resolved = category ? resolve(category, sub) : undefined
  if (!category || !resolved) notFound()

  const page = parsePage((await searchParams).page)

  return (
    <>
      <JsonLd data={faqSchema(resolved.faqs, `/${category.slug}/${sub}`)} />
      <CollectionView
        categoryName={category.name}
        whereUsed={resolved.whereUsed}
        maxPrice={resolved.maxPrice}
        heading={resolved.heading}
        subtitle={resolved.subtitle}
        page={page}
        basePath={`/${category.slug}/${sub}`}
        listPath={`/${category.slug}/${sub}`}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: category.heading, path: `/${category.slug}` },
          { name: resolved.heading, path: `/${category.slug}/${sub}` },
        ]}
      >
        <SubPageSeoContent
          category={category}
          heading={resolved.heading}
          intro={resolved.intro}
          faqs={resolved.faqs}
          siblings={resolved.siblings}
          siblingsLabel={resolved.siblingsLabel}
        />
      </CollectionView>
    </>
  )
}
