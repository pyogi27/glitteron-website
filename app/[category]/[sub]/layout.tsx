import { notFound } from 'next/navigation'
import { generateStaticParams } from './page'

/**
 * Rejects unknown sub slugs above loading.tsx, so they get a real 404 rather than
 * a streamed 200 + noindex. generateStaticParams already lists every band, facet
 * and room page the route serves, so it doubles as the allow-list.
 */
export default async function CategorySubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ category: string; sub: string }>
}) {
  const { category, sub } = await params
  if (!generateStaticParams().some(p => p.category === category && p.sub === sub)) notFound()
  return children
}
