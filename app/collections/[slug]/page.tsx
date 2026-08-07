// app/collections/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { getProductBySlug, getRelatedProducts } from '@/lib/data/products'
import { fetchProducts, fetchRelatedProducts, findApiProductBySlug, fetchProductById, mapApiProduct } from '@/lib/api/server'
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

/** Trim to a clean sentence boundary near the meta-description sweet spot. */
function clampDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

/**
 * Never fall back to the bare product name — a description identical to the
 * title gets rewritten by Google. Compose a real sentence from what we have.
 */
function productDescription(name: string, category?: string, body?: string): string {
  if (body && body.trim().length > 0) return clampDescription(body)
  const kind = category ? category.toLowerCase() : 'lighting'
  return clampDescription(
    `${name} — handcrafted ${kind} from LitMeUp. Free shipping across India, 5-year warranty and easy returns.`,
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const canonical = `/collections/${slug}`

  const apiProduct = await findApiProductBySlug(slug)
  if (apiProduct) {
    const description = productDescription(
      apiProduct.name,
      apiProduct.category?.name,
      apiProduct.description,
    )
    const image = apiProduct.mainImage ?? apiProduct.thumbnailImage
    return {
      title: apiProduct.name,
      description,
      alternates: { canonical },
      openGraph: {
        title: apiProduct.name,
        description,
        url: canonical,
        type: 'website',
        ...(image ? { images: [{ url: image, alt: apiProduct.name }] } : {}),
      },
    }
  }

  // Fallback to static
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found', robots: { index: false, follow: true } }

  const description = productDescription(
    product.name,
    product.category,
    product.description || product.subtitle,
  )
  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      type: 'website',
      ...(product.images[0] ? { images: [{ url: product.images[0], alt: product.name }] } : {}),
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
