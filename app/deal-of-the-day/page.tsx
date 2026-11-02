import type { Metadata } from 'next'
import CollectionView from '@/components/collections/CollectionView'

interface Props {
  searchParams: Promise<{ page?: string }>
}

const MAX_PAGE = 1000

/** Same rule as /collections: plain digits only, anything else is page 1. */
function parsePage(raw?: string): number {
  if (!raw || !/^\d+$/.test(raw)) return 1
  const n = Number(raw)
  return n >= 1 && n <= MAX_PAGE ? n : 1
}

// ponytail: the backend has no deal flag or sort-by-discount yet, so this is the full
// catalogue — the same grid as /collections. noindex keeps it from competing with that
// page; point it at a real deals query and drop the noindex once one exists.
export const metadata: Metadata = {
  title: 'Deal of the Day — Lights on Offer',
  description: "Today's lighting deals: handcrafted chandeliers, pendants and wall lights. Free shipping across India.",
  alternates: { canonical: '/deal-of-the-day' },
  robots: { index: false, follow: true },
}

export default async function DealOfTheDayPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams

  return (
    <CollectionView
      heading="Deal of the Day"
      subtitle="Today's picks across the collection. Deals reset at midnight."
      page={parsePage(pageParam)}
      basePath="/deal-of-the-day"
      listPath="/deal-of-the-day"
      breadcrumb={[
        { name: 'Home', path: '/' },
        { name: 'Deal of the Day', path: '/deal-of-the-day' },
      ]}
    />
  )
}
