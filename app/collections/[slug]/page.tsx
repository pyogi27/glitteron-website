// app/collections/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { getProductBySlug, getRelatedProducts } from '@/lib/data/products'
import { categoryIdOf, fetchProducts, fetchRelatedProducts, findApiProductBySlug, fetchProductById, mapApiProduct, resolveCategoryName } from '@/lib/api/server'
import { productMetaDescription, productTitle } from '@/lib/seo/product-copy'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import ProductTabs from '@/components/product/ProductTabs'
import RelatedProducts from '@/components/product/RelatedProducts'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, productSchema } from '@/lib/seo/schema'

interface Props {
  params: Promise<{ slug: string }>
}

// Generate static params from API products (limit high for coverage)
/**
 * Products render on demand and are then cached, rather than prerendered.
 *
 * A full prerender needs one fetchProductById per product (~1000 requests for
 * variations and specs), but the backend allows 1000 requests per 15 minutes —
 * so building every page always tripped the limit and every product emitted a
 * 404 shell. On-demand keeps the build at a handful of calls; each product is
 * rendered once on first visit and served from cache afterwards. All 1017 URLs
 * are still listed in the sitemap, so discovery is unaffected.
 */
export const dynamicParams = true
export const revalidate = 3600

/**
 * Titles and descriptions come from lib/seo/product-copy.ts, not from the bare
 * catalogue name. 903 of 1,028 products are named with a model code, so this
 * route used to emit "1011 | LitMeUp" against a meta description shared with
 * every sibling — nothing a shopper would ever search for, and nothing Google
 * would index.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const canonical = `/collections/${slug}`

  const apiProduct = await findApiProductBySlug(slug)
  if (apiProduct) {
    const copy = {
      ...apiProduct,
      categoryName: resolveCategoryName(apiProduct),
      price: Number(apiProduct.price) || 0,
    }
    const title = productTitle(copy)
    const description = productMetaDescription(copy)
    const image = apiProduct.mainImage ?? apiProduct.thumbnailImage
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'website',
        ...(image ? { images: [{ url: image, alt: title }] } : {}),
      },
    }
  }

  // Fallback to static
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found', robots: { index: false, follow: true } }

  const copy = {
    name: product.name,
    categoryName: product.category,
    price: product.price,
    sku: product.sku,
    description: product.description || product.subtitle,
  }
  const title = productTitle(copy)
  const description = productMetaDescription(copy)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      ...(product.images[0] ? { images: [{ url: product.images[0], alt: title }] } : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const apiProduct = await findApiProductBySlug(slug)
  let product = null

  if (apiProduct) {
    product = await fetchProductById(apiProduct.id)
    // GET /api/products/:id omits lightOnImage; the listing record carries it.
    if (product) product = {
      ...product,
      apiProductId: apiProduct.id,
      lightOnImage: product.lightOnImage ?? apiProduct.lightOnImage ?? undefined,
    }
  }

  if (!product) {
    product = getProductBySlug(slug)
  }

  if (!product) notFound()

  let related = getRelatedProducts(product.id)
  if (apiProduct) {
    let apiRelated: Product[] = []
    // categoryIdOf, not apiProduct.categoryId: the wire format is `category: "5"`,
    // so this branch never ran and every product showed the same four unrelated
    // pieces from the generic fallback below.
    const categoryId = categoryIdOf(apiProduct)
    if (categoryId) {
      apiRelated = await fetchRelatedProducts(categoryId, apiProduct.id, 4)
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
      <JsonLd data={productSchema(product)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Collections', path: '/collections' },
          { name: product.name, path: `/collections/${product.slug}` },
        ])}
      />

      {/* Breadcrumb */}
      <div className="pt-header bg-white border-b border-[#D8D0C4]">
        <div className="px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <Link href="/collections" className="hover:text-[#8B5E3C] transition-colors">Collections</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">{product.name}</span>
        </div>
      </div>

      {/* Split layout — gallery sticks, buy box scrolls with the page.
          One scroll container for the whole route. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
        <ProductGallery images={product.images} name={product.name} lightOnImage={product.lightOnImage} />
        <ProductInfo product={product} />
      </div>

      {/* Description / specs / reviews run full width below the fold rather than
          inside the narrow buy column, where they used to force a nested scroll. */}
      <section className="bg-white border-t border-[#D8D0C4] px-5 lg:px-12 py-10 lg:py-14">
        <div className="max-w-5xl mx-auto">
          <ProductTabs product={product} />
        </div>
      </section>

      <RelatedProducts products={related} />
    </>
  )
}
