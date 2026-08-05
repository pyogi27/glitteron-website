export interface Product {
  id: string
  apiProductId?: number
  slug: string
  name: string
  subtitle: string
  category: string
  badge?: 'new' | 'sale' | 'best'
  price: number
  originalPrice?: number
  discount?: number
  rating: number
  reviewCount: number
  sku: string
  stock: number
  images: string[]
  description: string
  specs: Record<string, string>
  variants: {
    sizes: string[]
    finishes: string[]
    crystalTones: { name: string; hex: string }[]
  }
  /**
   * Real ProductVariation rows, when the detail endpoint returned them.
   *
   * `variants` above is a flattened, de-duplicated view built for rendering selectors.
   * This is the authoritative list: each entry carries the id and the price that
   * checkout will actually charge. Empty when the product has no variations, or when
   * the list endpoint (which omits them) was the source.
   */
  variations?: ProductVariation[]
  reviews: Review[]
  whereUsed?: string   // e.g. "Living Room, Dining Room"
  arImage?: string     // AR/room visualizer image URL
  lightOnImage?: string // same product photographed with the light switched on
}

/**
 * A single purchasable variation of a product, normalised from the API's wide row.
 * `price` is authoritative and may differ from the parent product's price.
 */
export interface ProductVariation {
  id: number
  name: string
  size: string
  color: string
  price: number
  inStock: boolean
}

export interface Review {
  id: string
  author: string
  location: string
  date: string
  rating: number
  text: string
  verified: boolean
}

export interface Room {
  id: string
  name: string
  tag: string
  subtitle: string
  count: number
  image: string
  slug: string
  /** Exact label the backend stores in a product's where_used array */
  whereUsed: string
}

export interface Testimonial {
  id: string
  author: string
  location: string
  rating: number
  text: string
  verified: boolean
}
