import type { Product } from '@/lib/types'
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site'
import { COMPANY } from '@/lib/company'

/** Prices are quoted in INR across the catalog. */
const CURRENCY = 'INR'

/**
 * Free all-India shipping, 5–7 day delivery — the numbers published on
 * /shipping. Google needs shipping cost in the offer or it discounts the
 * merchant listing; keep these in sync with app/shipping/page.tsx.
 */
const shippingDetails = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: CURRENCY },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 5, maxValue: 7, unitCode: 'DAY' },
  },
} as const

/**
 * 7-day window with a 15% re-stocking fee, per /returns. `restockingFee` as a
 * bare number is read as a percentage of the item price.
 */
const returnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IN',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 7,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/RestockingFees',
  restockingFee: 15,
} as const

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    // OnlineStore is the Organization subtype for a direct-to-consumer shop;
    // it lets the same node carry the storefront's return policy.
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/icon.png'),
    image: absoluteUrl('/opengraph-image.png'),
    description:
      '500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow.',
    slogan: 'Illuminate every corner of your story.',
    foundingDate: '2016',
    email: COMPANY.email,
    telephone: COMPANY.phone,
    areaServed: { '@type': 'Country', name: 'India' },
    currenciesAccepted: CURRENCY,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '69 Jalaram Industrial Estate, Navjivan Circle, Udhana Magdalla Road',
      addressLocality: 'Surat',
      addressRegion: 'Gujarat',
      postalCode: '395007',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: COMPANY.email,
      telephone: COMPANY.phone,
      areaServed: 'IN',
      availableLanguage: 'en',
    },
    hasMerchantReturnPolicy: returnPolicy,
    // Keep in sync with SOCIAL_LINKS in components/layout/Footer.tsx.
    sameAs: ['https://www.instagram.com/litmeup.in/'],
  }
}

/**
 * The Surat workshop, and the only physical location LitMeUp has.
 *
 * Deliberately a single node. Emitting a LocalBusiness per city we ship to
 * would claim a presence that does not exist — the city pages are delivery
 * areas, and `areaServed` on the organisation already says we cover India.
 *
 * No `geo` block: we do not have surveyed coordinates, and guessing them puts
 * a wrong pin on a map that people navigate by.
 */
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LightingStore',
    '@id': `${SITE_URL}/surat-store#localbusiness`,
    name: `${SITE_NAME} — Surat Workshop`,
    url: absoluteUrl('/surat-store'),
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    image: absoluteUrl('/opengraph-image.png'),
    description:
      'The LitMeUp workshop in Udhana, Surat, where every fixture is assembled and inspected. Open to visitors Monday to Saturday.',
    email: COMPANY.email,
    telephone: COMPANY.phone,
    priceRange: '₹₹',
    currenciesAccepted: CURRENCY,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '69 Jalaram Industrial Estate, Navjivan Circle, Udhana Magdalla Road',
      addressLocality: 'Surat',
      addressRegion: 'Gujarat',
      postalCode: '395007',
      addressCountry: 'IN',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00',
      },
    ],
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

/**
 * Editorial guide markup. The organisation is both author and publisher —
 * these are house guides, not bylined columns, and claiming a named author
 * that does not exist is worse than claiming none.
 */
export function articleSchema(article: {
  title: string
  description: string
  path: string
  updated: string
}) {
  const url = absoluteUrl(article.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.description,
    url,
    mainEntityOfPage: url,
    datePublished: article.updated,
    dateModified: article.updated,
    inLanguage: 'en-IN',
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    image: absoluteUrl('/opengraph-image.png'),
  }
}

/** Q&A markup for /faq. Answers are plain text, matching the rendered page. */
export function faqSchema(items: { question: string; answer: string }[], path = '/faq') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
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
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
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
