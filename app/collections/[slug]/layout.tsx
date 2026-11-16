import { notFound } from 'next/navigation'
import { findApiProductBySlug } from '@/lib/api/server'
import { getProductBySlug } from '@/lib/data/products'

/**
 * Rejects unknown slugs above loading.tsx. Once the skeleton streams, the page's
 * own notFound() can only send a 200 + noindex (a soft 404); thrown here, before
 * anything is flushed, the response is a real 404. The lookup is the memoised
 * slug index the page uses anyway.
 */
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!(await findApiProductBySlug(slug)) && !getProductBySlug(slug)) notFound()
  return children
}
