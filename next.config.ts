import type { NextConfig } from 'next'

/**
 * The one hostname the store is allowed to answer on. Everything else that
 * reaches this app is redirected here so the catalogue exists at exactly one
 * address.
 */
const CANONICAL_HOST = 'www.litmeup.in'

/**
 * Hosts that currently serve the full storefront but should not.
 *
 * App Runner keeps its generated domain publicly reachable alongside the custom
 * one, so https://eqmpgafg6h.us-east-1.awsapprunner.com serves the entire
 * catalogue with `Allow: /` in robots.txt — a complete duplicate of the site on
 * a second hostname. The canonical tags point at www, which mitigates it, but a
 * 301 settles it outright and costs nothing.
 *
 * The apex, litmeup.in, is included for the day its DNS is repointed here. It
 * does not reach this app today — see docs/DOMAIN-SETUP.md.
 */
const REDIRECTED_HOSTS = [
  'litmeup.in',
  'eqmpgafg6h.us-east-1.awsapprunner.com',
]

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return REDIRECTED_HOSTS.map(host => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    }))
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
}

export default nextConfig;
