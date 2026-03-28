// lib/data/visualizer.ts

export interface VisualizerProduct {
  id: number
  name: string
  type: string
  price: string       // display-only (e.g. '₹ 42,000')
  priceValue: number  // numeric value for cart integration
  match: number // 0-100 style match score
  thumb: string // 120×120 crop
  full: string  // ~300px wide, used as fixture overlay
  iw: number    // rendered width in canvas (px, at 1× scale)
  ih: number    // rendered height in canvas (px, at 1× scale)
}

export interface RoomAnalysis {
  roomType: string
  ceiling: string
  style: string
  tone: string
  matchScore: string
}

export type RoomType = 'Living Room' | 'Dining Room' | 'Bedroom' | 'Kitchen' | 'Home Office'

// Mock products — swap thumb/full for real product images when backend is ready
export const VISUALIZER_PRODUCTS: readonly VisualizerProduct[] = [
  {
    id: 1,
    name: 'Lumière Cascade',
    type: 'Crystal Chandelier',
    price: '₹ 42,000',
    priceValue: 42000,
    match: 97,
    thumb: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 78,
    ih: 110,
  },
  {
    id: 2,
    name: 'Aura Pendant Trio',
    type: 'Pendant Cluster',
    price: '₹ 28,500',
    priceValue: 28500,
    match: 91,
    thumb: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 76,
    ih: 100,
  },
  {
    id: 3,
    name: 'Solstice Orb',
    type: 'Globe Pendant',
    price: '₹ 18,000',
    priceValue: 18000,
    match: 85,
    thumb: 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 88,
    ih: 88,
  },
  {
    id: 4,
    name: 'Celeste Flush',
    type: 'Flush Mount',
    price: '₹ 14,200',
    priceValue: 14200,
    match: 77,
    thumb: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 96,
    ih: 56,
  },
  {
    id: 5,
    name: 'Arc Minimal',
    type: 'Single Pendant',
    price: '₹ 8,900',
    priceValue: 8900,
    match: 70,
    thumb: 'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 58,
    ih: 105,
  },
]

// Room-type-specific analysis mock. Replace with real AI API call later.
const ANALYSIS_MAP: Record<RoomType, RoomAnalysis> = {
  'Living Room': {
    roomType: 'Living Room',
    ceiling: '~9.5 ft — detected',
    style: 'Modern Eclectic',
    tone: 'Warm Neutral',
    matchScore: '94% Style Match',
  },
  'Dining Room': {
    roomType: 'Dining Room',
    ceiling: '~8.5 ft — detected',
    style: 'Contemporary',
    tone: 'Cool White',
    matchScore: '91% Style Match',
  },
  'Bedroom': {
    roomType: 'Bedroom',
    ceiling: '~9 ft — detected',
    style: 'Soft Minimalist',
    tone: 'Warm Amber',
    matchScore: '88% Style Match',
  },
  'Kitchen': {
    roomType: 'Kitchen',
    ceiling: '~8 ft — detected',
    style: 'Industrial Modern',
    tone: 'Neutral White',
    matchScore: '85% Style Match',
  },
  'Home Office': {
    roomType: 'Home Office',
    ceiling: '~8 ft — detected',
    style: 'Scandinavian',
    tone: 'Cool Daylight',
    matchScore: '82% Style Match',
  },
}

export function getAnalysisForRoom(roomType: string): RoomAnalysis {
  const result = ANALYSIS_MAP[roomType as RoomType]
  if (!result && process.env.NODE_ENV === 'development') {
    console.warn(`[visualizer] Unknown roomType: "${roomType}", falling back to Living Room`)
  }
  return result ?? ANALYSIS_MAP['Living Room']
}

// Fetch real products from the backend, filtered by room type
export async function fetchProductsForRoom(roomType: string): Promise<VisualizerProduct[]> {
  const res = await fetch(`/api/products?whereUsed=${encodeURIComponent(roomType)}`)
  if (!res.ok) throw new Error(`Products API returned ${res.status}`)
  const data = await res.json()
  const raw: Array<{
    id: number
    name: string
    price: string
    mainImage: string
    thumbnailImage: string
    arImages: string
    productHeight: string
    productWidth: string
    materials: string
    lightSource: string
    best_seller: boolean
    new_product: boolean
    inStock: boolean
  }> = data.products ?? []

  return raw
    .filter((p) => p.inStock)
    .map((p) => {
      // Scale product dimensions so the largest side = 90px on the canvas
      const w = parseFloat(p.productWidth) || 80
      const h = parseFloat(p.productHeight) || 80
      const factor = 90 / Math.max(w, h, 1)
      const match =
        p.best_seller && p.new_product ? 97
        : p.best_seller ? 91
        : p.new_product ? 82
        : 72
      return {
        id: p.id,
        name: p.name,
        type: [p.materials, p.lightSource].filter(Boolean).join(' · ') || 'Decorative Light',
        price: `₹ ${Math.round(parseFloat(p.price)).toLocaleString('en-IN')}`,
        priceValue: parseFloat(p.price),
        match,
        thumb: p.thumbnailImage || p.mainImage,
        full: p.arImages || p.mainImage,
        iw: Math.round(w * factor),
        ih: Math.round(h * factor),
      }
    })
    .sort((a, b) => b.match - a.match)
}

// Reorder products by match score with a slight shuffle per room type
// so different rooms show slightly different rankings
export function getProductsForRoom(roomType: string): VisualizerProduct[] {
  const seed = [...roomType].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return [...VISUALIZER_PRODUCTS].sort(
    (a, b) => (b.match + ((seed * b.id) % 5)) - (a.match + ((seed * a.id) % 5))
  )
}

// ─── Room image mapping (static files in public/rooms/) ──────────────────────
export const ROOM_IMAGE_MAP: Record<RoomType, string> = {
  'Living Room':  '/rooms/living-room.jpg',
  'Dining Room':  '/rooms/dining-room.jpg',
  'Bedroom':      '/rooms/bedroom.jpg',
  'Kitchen':      '/rooms/kitchen.jpg',
  'Home Office':  '/rooms/home-office.jpg',
}

// Parse a product's whereUsed string into an array of known RoomTypes
const VALID_ROOM_TYPES = new Set<RoomType>(['Living Room', 'Dining Room', 'Bedroom', 'Kitchen', 'Home Office'])

export function parseWhereUsed(whereUsed?: string): RoomType[] {
  if (!whereUsed) return []
  return whereUsed
    .split(',')
    .map((s) => s.trim() as RoomType)
    .filter((s) => VALID_ROOM_TYPES.has(s))
}

export const ROOM_TYPE_OPTIONS: Array<{ label: RoomType; icon: string; desc: string }> = [
  { label: 'Living Room', icon: '🛋️', desc: 'Chandeliers & statement pendants' },
  { label: 'Dining Room', icon: '🍽️', desc: 'Over-table pendants & clusters' },
  { label: 'Bedroom', icon: '🛏️', desc: 'Ambient & flush mounts' },
  { label: 'Kitchen', icon: '🍳', desc: 'Task & island pendants' },
  { label: 'Home Office', icon: '💻', desc: 'Focused & desk-side lighting' },
]
