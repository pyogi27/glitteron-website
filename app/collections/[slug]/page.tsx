// app/collections/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { getProductBySlug, getRelatedProducts } from '@/lib/data/products'
import { categoryIdOf, fetchProducts, fetchRelatedProducts, findApiProductBySlug, fetchProductById, mapApiProduct, resolveCategoryName, slugify } from '@/lib/api/server'
import { productMetaDescription, productTitle } from '@/lib/seo/product-copy'
import ProductHero from '@/components/product/ProductHero'
import ProductReviews from '@/components/product/ProductReviews'
import RelatedProducts from '@/components/product/RelatedProducts'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, productSchema } from '@/lib/seo/schema'
import { listingPrice } from '@/lib/pricing'
import GoogleReviewsBanner from '@/components/reviews/GoogleReviewsBanner'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Only the newest in-stock products are prerendered; the rest render on first
 * visit and are then cached (ISR).
 *
 * A full prerender needs one fetchProductById per product (~1000 requests), but
 * the backend allows 1000 requests per 15 minutes, so building every page
 * tripped the limit and emitted 404 shells.
 *
 * generateStaticParams must exist for ISR at all: without it Next renders this
 * route on every request and ignores `revalidate` (measured 2026-11-16: the
 * route built as dynamic and was served `no-store`). Returning [] on a backend
 * failure still keeps ISR on.
 */
const PRERENDERED_PRODUCTS = 24

export async function generateStaticParams() {
  const { products } = await fetchProducts({ limit: PRERENDERED_PRODUCTS })
  return products.map(p => ({ slug: (p.slug ?? slugify(p.name)).trim().toLowerCase() }))
}

export const dynamicParams = true
// Price and stock are in the HTML, so the page may be at most 60 s stale.
export const revalidate = 60

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
    // Price from the detail fetch (60 s), not the catalog memo (up to 1 h old).
    // Same cached request the page body makes, so no extra backend call.
    const detail = await fetchProductById(apiProduct.id)
    const copy = {
      ...apiProduct,
      categoryName: resolveCategoryName(apiProduct),
      price: detail?.price ?? listingPrice(apiProduct).price,
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

  let apiRelated: Product[] = []
  if (apiProduct) {
    // categoryIdOf, not apiProduct.categoryId: the wire format is `category: "5"`.
    // Related needs only the listing record, so it runs alongside the detail fetch.
    const categoryId = categoryIdOf(apiProduct)
    const [detail, sameCategory] = await Promise.all([
      fetchProductById(apiProduct.id),
      categoryId ? fetchRelatedProducts(categoryId, apiProduct.id, 4) : Promise.resolve([]),
    ])
    apiRelated = sameCategory
    // GET /api/products/:id omits lightOnImage; the listing record carries it.
    if (detail) product = {
      ...detail,
      apiProductId: apiProduct.id,
      lightOnImage: detail.lightOnImage ?? apiProduct.lightOnImage ?? undefined,
    }
  }

  if (!product) {
    product = getProductBySlug(slug)
  }

  if (!product) notFound()

  let related = getRelatedProducts(product.id)
  if (apiProduct) {
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

      <ProductHero product={product} />

      <GoogleReviewsBanner />

      {/* Description and specs sit in the buy column (ProductDetails); reviews run
          full width below. */}
      <section className="bg-white border-t border-[#D8D0C4] px-5 lg:px-12 py-10 lg:py-14">
        <div className="max-w-5xl mx-auto">
          <ProductReviews product={product} />
        </div>
      </section>

      <RelatedProducts products={related} />
    </>
  )
}
