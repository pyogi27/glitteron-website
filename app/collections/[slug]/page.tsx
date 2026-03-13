// app/collections/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductBySlug, getRelatedProducts, products } from '@/lib/data/products'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import RelatedProducts from '@/components/product/RelatedProducts'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return products.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found — GlitterOn' }
  return {
    title: `${product.name} — GlitterOn`,
    description: product.subtitle,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()
  const related = getRelatedProducts(product.id)

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-[72px] bg-white border-b border-[#E8E4DC]">
        <div className="px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#9A958C]">
          <Link href="/" className="hover:text-[#9A7840] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <Link href="/collections" className="hover:text-[#9A7840] transition-colors">Collections</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#1A1714] font-normal">{product.name}</span>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-2 min-h-[calc(100vh-110px)]">
        <ProductGallery images={product.images} name={product.name} />
        <ProductInfo product={product} />
      </div>

      <RelatedProducts products={related} />
    </>
  )
}
