import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/** Routes with no search value: account, transactional and auth surfaces. */
const PRIVATE_PATHS = [
  '/api/',
  '/cart',
  '/checkout',
  '/profile',
  '/orders',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/room-visualizer/share/',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE_PATHS }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
