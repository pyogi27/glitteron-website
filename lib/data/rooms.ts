import { Room } from '@/lib/types'

/**
 * Below this, a room-filtered grid is treated as "not tagged yet" and the page
 * falls back to the wider catalogue rather than showing a near-empty shelf.
 * Room tagging is being backfilled in the product catalogue; once a room has
 * real coverage its pages narrow on their own, with no code change here.
 *
 * Measured 2026-08-11: `whereUsed` returns 0–4 products for every room, so every
 * room grid is currently falling back. /rooms/kitchen and /rooms/home-office were
 * rendering the "still curating" empty state to shoppers and to Googlebot.
 */
export const MIN_ROOM_PRODUCTS = 8

export const rooms: Room[] = [
  {
    id: '1',
    slug: 'living-room',
    whereUsed: 'Living Room',
    name: 'Living Room',
    tag: 'Statement Lighting',
    subtitle: 'Chandeliers · Pendants · Clusters',
    count: 128,
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop',
  },
  {
    id: '2',
    slug: 'dining-room',
    whereUsed: 'Dining Room',
    name: 'Dining Room',
    tag: 'Pendant Clusters',
    subtitle: 'Pendants · Clusters',
    count: 72,
    image: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800&h=640&fit=crop',
  },
  {
    id: '3',
    slug: 'bedroom',
    whereUsed: 'Bedroom',
    name: 'Bedroom',
    tag: 'Soft Ambience',
    subtitle: 'Domes · Teardrops',
    count: 58,
    image: 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=700&h=640&fit=crop',
  },
  {
    id: '4',
    slug: 'kitchen',
    whereUsed: 'Kitchen',
    name: 'Kitchen & Island',
    tag: 'Kitchen',
    subtitle: 'Linear · Bar Pendants',
    count: 44,
    image: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800&h=520&fit=crop',
  },
  {
    id: '5',
    slug: 'home-office',
    whereUsed: 'Home Office',
    name: 'Home Office',
    tag: 'Focus Lighting',
    subtitle: 'Track · Directional',
    count: 34,
    image: 'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=700&h=520&fit=crop',
  },
]
