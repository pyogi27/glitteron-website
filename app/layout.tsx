import type { Metadata } from 'next'
import { Cormorant_Garamond, Outfit } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/ui/CustomCursor'
import GrainOverlay from '@/components/ui/GrainOverlay'
import NewsletterPopup from '@/components/ui/NewsletterPopup'
import SessionRestorer from '@/components/auth/SessionRestorer'
import { SITE_NAME, SITE_URL } from '@/lib/site'

// Self-hosted, preloaded, swap-on-fallback. Weights match the old Google
// Fonts request exactly so nothing shifts visually.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-outfit',
})

// "Buy … Online in India" is the head-term shape every competitor ranking for
// these queries uses; the old title led with a craft claim nobody searches for.
const TITLE = 'Buy Decorative Lights Online in India | LitMeUp'
const DESCRIPTION =
  'Buy handcrafted chandeliers, pendant lights, ceiling and wall lights online in India. 500+ designs, free shipping, 5-year warranty, 7-day returns.'

export const metadata: Metadata = {
  // Makes every relative OG/Twitter/canonical URL absolute.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Pages set a bare title; the brand suffix is appended here.
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: 'en_IN',
    type: 'website',
    // No images here: app/opengraph-image.png is the card, and an entry in this
    // object overrides that file rather than adding to it.
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

// Next already emits a high-priority preload for the hero <video poster>, so no
// manual <link rel="preload"> is needed in <head>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${outfit.variable}`}>
      <body className="bg-white text-dark font-sans font-light leading-relaxed overflow-x-hidden" suppressHydrationWarning>
        <SessionRestorer />
        <CustomCursor />
        <GrainOverlay />
        <NewsletterPopup />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
