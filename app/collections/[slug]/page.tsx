// app/collections/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { getProductBySlug, getRelatedProducts, products } from '@/lib/data/products'
import { fetchProducts, fetchRelatedProducts, findApiProductBySlug, fetchProductById, mapApiProduct } from '@/lib/api/server'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import RelatedProducts from '@/components/product/RelatedProducts'

interface Props {
  params: Promise<{ slug: string }>
}

// Generate static params from API products (limit high for coverage)
export async function generateStaticParams() {
  const limit = 250
  const { products: firstPageProducts, totalPages } = await fetchProducts({ page: 1, limit })
  if (firstPageProducts.length > 0) {
    const allProducts = [...firstPageProducts]
    for (let page = 2; page <= totalPages; page += 1) {
      const { products: pageProducts } = await fetchProducts({ page, limit })
      allProducts.push(...pageProducts)
    }
    return allProducts.map(p => ({ slug: p.slug ?? '' })).filter(p => p.slug)
  }

  // Fallback to static data
  return products.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const apiProduct = await findApiProductBySlug(slug)
  if (apiProduct) {
    return {
      title: `${apiProduct.name} — LitMeUp`,
      description: apiProduct.description ?? apiProduct.name,
    }
  }
  
  // Fallback to static
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found — LitMeUp' }
  return {
    title: `${product.name} — LitMeUp`,
    description: product.subtitle,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const apiProduct = await findApiProductBySlug(slug)
  let product = null

  if (apiProduct) {
    product = await fetchProductById(apiProduct.id)
    if (product) product = { ...product, apiProductId: apiProduct.id }
  }

  if (!product) {
    product = getProductBySlug(slug)
  }

  if (!product) notFound()

  let related = getRelatedProducts(product.id)
  if (apiProduct) {
    let apiRelated: Product[] = []
    if (apiProduct.categoryId) {
      apiRelated = await fetchRelatedProducts(apiProduct.categoryId, apiProduct.id, 4)
    }
    if (apiRelated.length === 0) {
      // Fallback: fetch any real products excluding the current one
      const { products: allProducts } = await fetchProducts({ limit: 5 })
      apiRelated = allProducts
        .filter((p) => p.id !== apiProduct.id)
        .slice(0, 4)
        .map((p) => mapApiProduct(p))
    }
    if (apiRelated.length > 0) {
      related = apiRelated
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-[72px] bg-white border-b border-[#D8D0C4]">
        <div className="px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <Link href="/collections" className="hover:text-[#8B5E3C] transition-colors">Collections</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">{product.name}</span>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-110px)]">
        <ProductGallery images={product.images} name={product.name} />
        <ProductInfo product={product} />
      </div>

      <RelatedProducts products={related} />
    </>
  )
}
