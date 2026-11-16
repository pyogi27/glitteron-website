import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/lib/data/categories'

/**
 * Rejects unknown category slugs above the loading.tsx skeletons. Once a skeleton
 * streams, a page's notFound() can only send a 200 + noindex (a soft 404); thrown
 * here, before anything is flushed, the response is a real 404.
 *
 * The skeletons live under (listing)/ and [sub]/ rather than beside this file so
 * that [sub]/layout.tsx can check its own slug outside them too.
 */
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ category: string }>
}) {
  if (!getCategoryBySlug((await params).category)) notFound()
  return children
}
