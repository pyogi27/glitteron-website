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
  reviews: Review[]
  whereUsed?: string   // e.g. "Living Room, Dining Room"
  arImage?: string     // AR/room visualizer image URL
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
}

export interface Testimonial {
  id: string
  author: string
  location: string
  rating: number
  text: string
  verified: boolean
}
