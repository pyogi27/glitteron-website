import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RoomBanner from '@/components/rooms/RoomBanner'
import RoomSwitcher from '@/components/rooms/RoomSwitcher'
import RoomToolbar from '@/components/rooms/RoomToolbar'
import InfiniteProductGrid from '@/components/collections/InfiniteProductGrid'
import { categoryIdOf, fetchCategories, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { rooms } from '@/lib/data'
import { MIN_ROOM_PRODUCTS } from '@/lib/data/rooms'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/schema'

const INITIAL_BATCH = 100

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return rooms.map(room => ({ slug: room.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const room = rooms.find(r => r.slug === slug)
  if (!room) return { title: 'Rooms', robots: { index: false, follow: true } }

  const description = `${room.tag}: handcrafted ${room.subtitle.toLowerCase()} curated for your ${room.name.toLowerCase()}. Free shipping across India, 5-year warranty.`
  return {
    title: `${room.name} Lighting — Chandeliers & Pendants`,
    description,
    alternates: { canonical: `/rooms/${room.slug}` },
    /*
     * Navigational tier, not a ranking tier.
     *
     * `/rooms/living-room` competes with `/chandelier-lights/living-room`,
     * `/wall-lights/living-room`, `/table-lamps/living-room`,
     * `/floor-lamps/living-room` and `/guides/how-to-light-a-living-room` for the
     * same intent, and it is the weakest of the six: it carries no prose of its
     * own, and its grid is the untagged fallback rather than a curated set.
     * Google agreed — all five room pages sat in "Crawled, currently not indexed"
     * (GSC, 2026-08-11). Kept crawlable and `follow` so it still passes equity
     * down to the category-room pages that do have the copy to rank.
     *
     * To make these indexable, give each room its own intro + FAQs the way
     * lib/data/category-rooms.ts does, then drop this and re-add them to the
     * sitemap.
     */
    robots: { index: false, follow: true },
    openGraph: {
      title: `${room.name} Lighting`,
      description,
      url: `/rooms/${room.slug}`,
      type: 'website',
      images: [{ url: room.image, alt: `${room.name} lighting` }],
    },
  }
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params
  const room = rooms.find(r => r.slug === slug)
  if (!room) notFound()

  const [categories, tagged] = await Promise.all([
    fetchCategories(),
    fetchProducts({ whereUsed: room.whereUsed, page: 1, limit: INITIAL_BATCH }),
  ])

  // Room tag too sparse to fill a page — widen to the whole catalogue, the same
  // rule CollectionView applies to /chandelier-lights/living-room and friends.
  // Without it, kitchen and home-office rendered an empty shelf: the API tags
  // 0–4 products per room while the backfill is still in progress.
  const roomTagUsed = tagged.total >= MIN_ROOM_PRODUCTS
  const { products: apiProducts, total, totalPages } = roomTagUsed
    ? tagged
    : await fetchProducts({ page: 1, limit: INITIAL_BATCH })

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  const products = apiProducts.map(p => mapApiProduct(p, categoryMap.get(categoryIdOf(p))))

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Rooms', path: '/rooms' },
          { name: room.name, path: `/rooms/${room.slug}` },
        ])}
      />
      {products.length > 0 && (
        <JsonLd data={itemListSchema(products, `/rooms/${room.slug}`)} />
      )}
      <RoomBanner room={room} total={total} />
      <RoomSwitcher activeSlug={room.slug} />
      <div className="min-h-screen bg-[#EDE8E0]">
        {products.length > 0 ? (
          <>
            <RoomToolbar total={total} />
            <InfiniteProductGrid
              initialProducts={products}
              initialPage={1}
              totalPages={totalPages}
              // Must mirror the query that actually ran, or load-more contradicts
              // page 1 — a room-tagged request against a widened grid comes back
              // near-empty and the shelf stops dead after the first batch.
              extraParams={roomTagUsed ? { whereUsed: room.whereUsed } : {}}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-6 py-28">
            <div className="flex items-center gap-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-5">
              <span className="w-8 h-px bg-[#C4714A] inline-block" />
              {room.name}
              <span className="w-8 h-px bg-[#C4714A] inline-block" />
            </div>
            <h2 className="font-serif text-[clamp(26px,3vw,40px)] font-light leading-[1.2] text-[#2C2825] mb-4 max-w-[520px]">
              We&rsquo;re still curating pieces for this <em className="italic">space</em>
            </h2>
            <p className="text-[13px] text-[#A09488] leading-[1.8] max-w-[400px] mb-10">
              New designs are tagged to rooms as they arrive. Meanwhile, explore the
              full collection — every piece is handcrafted to glow anywhere.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2.5 bg-[#2C2825] text-white text-[12px] font-medium tracking-[0.1em] uppercase px-8 py-4 rounded-full no-underline transition-all hover:gap-4 hover:bg-[#C4714A]"
            >
              Browse All Collections
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
