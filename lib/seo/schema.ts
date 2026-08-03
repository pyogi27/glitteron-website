import type { Product } from '@/lib/types'
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site'
import { COMPANY } from '@/lib/company'

/** Prices are quoted in INR across the catalog. */
const CURRENCY = 'INR'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/icon.png'),
    description:
      '500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow.',
    email: COMPANY.email,
    telephone: COMPANY.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '69 Jalaram Industrial Estate, Navjivan Circle, Udhana Magdalla Road',
      addressLocality: 'Surat',
      addressRegion: 'Gujarat',
      postalCode: '395007',
      addressCountry: 'IN',
    },
    // Keep in sync with SOCIAL_LINKS in components/layout/Footer.tsx.
    sameAs: ['https://www.instagram.com/litmeup.in/'],
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export function productSchema(product: Product) {
  const url = absoluteUrl(`/collections/${product.slug}`)
  const inStock = product.stock > 0

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.subtitle || product.name,
    sku: product.sku,
    category: product.category,
    url,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url,
      price: product.price,
      priceCurrency: CURRENCY,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  }

  if (product.images.length > 0) schema.image = product.images

  // Only emit review markup that a real review backs — Google penalises
  // aggregateRating with no reviewCount behind it.
  if (product.rating > 0 && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    }
  }

  if (product.reviews?.length > 0) {
    schema.review = product.reviews.slice(0, 5).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.date,
      reviewBody: r.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }))
  }

  return schema
}

/** Collection/room listing pages — an ItemList of the products shown. */
export function itemListSchema(products: Product[], listUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: absoluteUrl(listUrl),
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/collections/${p.slug}`),
      name: p.name,
    })),
  }
}
