import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Baskervville, Nunito_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import TrustFactors from '@/components/layout/TrustFactors'
import BrandBanner from '@/components/layout/BrandBanner'
import CustomCursor from '@/components/ui/CustomCursor'
import GrainOverlay from '@/components/ui/GrainOverlay'
import NewsletterPopup from '@/components/ui/NewsletterPopup'
import SessionRestorer from '@/components/auth/SessionRestorer'
import { SITE_NAME, SITE_URL } from '@/lib/site'

// Self-hosted, preloaded, swap-on-fallback. Both are variable fonts, so one
// file per style covers every weight the site uses.
// Baskervville (transitional serif, the free cousin of the Baskerville cuts
// HAY and Schoolhouse use) is headings only: it has no ₹ glyph, so every price
// must be set in the sans.
const baskervville = Baskervville({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-baskervville',
})

// Nunito Sans is the free Avenir-alike (Flos, Brilliant Earth) and carries ₹.
const nunito = Nunito_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-nunito',
})

// "Buy … Online in India" is the head-term shape every competitor ranking for
// these queries uses; the old title led with a craft claim nobody searches for.
const TITLE = 'Buy Decorative Lights Online in India | LitMeUp'
// "Jhoomar" and "hanging lights" are the words a large share of Indian shoppers
// actually types; both were absent from the whole site while every competitor
// ranking above us carries them in the title tag or a parent category.
const DESCRIPTION =
  'Buy handcrafted chandeliers and jhoomars, hanging and pendant lights, ceiling and wall lights online in India. Free shipping, 5-year warranty, 7-day returns.'

export const metadata: Metadata = {
  // Makes every relative OG/Twitter/canonical URL absolute.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Pages set a bare title; the brand suffix is appended here.
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
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

// Brand palette for every Clerk screen (sign-in, sign-up, password reset).
// The card is transparent so the form sits straight on the page ground, the
// way premium stores lay out sign-in. Primary is brand clay (#A85B3B) darkened
// just enough that it, muted and danger all clear 4.5:1 text contrast on #EDE8E0.
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#9C5335',
    colorPrimaryForeground: '#EDE8E0',
    colorBackground: '#EDE8E0',
    colorForeground: '#1A1210',
    colorMutedForeground: '#5A5249',
    colorInput: '#FFFFFF',
    colorInputForeground: '#2C2825',
    colorDanger: '#A0362A',
    fontFamily: 'var(--font-sans)',
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', boxShadow: 'none', border: 'none', background: 'transparent' },
    card: { background: 'transparent', boxShadow: 'none', border: 'none', paddingInline: 0 },
    footer: { background: 'transparent' },
    // The site header already carries the logo.
    logoBox: { display: 'none' },
    headerTitle: { fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 400, letterSpacing: '-0.01em' },
    formFieldInput: { height: '3rem' },
    socialButtonsBlockButton: { height: '3rem', background: '#FFFFFF' },
    formButtonPrimary: {
      height: '3rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      // Flat like the site's CTAs. Clerk's solid-variant rules are [data-*]
      // qualified, so these match that specificity to win on source order.
      '&[data-variant="solid"][data-color="primary"]': { boxShadow: 'none' },
      '&[data-variant="solid"]::after': { display: 'none' },
      '&[data-variant="solid"][data-color="primary"]:hover': { backgroundColor: '#7E4229' },
      '&:focus-visible': { outline: '2px solid #2C2825', outlineOffset: '2px' },
    },
  },
}

// Next already emits a high-priority preload for the hero <video poster>, so no
// manual <link rel="preload"> is needed in <head>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${baskervville.variable} ${nunito.variable}`}>
      <body className="bg-white text-dark font-sans font-normal leading-relaxed overflow-x-hidden" suppressHydrationWarning>
        {/* Inside <body>, not around <html>, per Clerk's App Router setup. */}
        <ClerkProvider signInUrl="/login" signUpUrl="/signup" appearance={CLERK_APPEARANCE}>
          <SessionRestorer />
          <CustomCursor />
          <GrainOverlay />
          <NewsletterPopup />
          <Header />
          <main>{children}</main>
          <TrustFactors />
          <BrandBanner />
          <Footer />
          <WhatsAppButton />
        </ClerkProvider>
      </body>
    </html>
  )
}
