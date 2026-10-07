import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Newsreader, Jost } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/ui/CustomCursor'
import GrainOverlay from '@/components/ui/GrainOverlay'
import NewsletterPopup from '@/components/ui/NewsletterPopup'
import SessionRestorer from '@/components/auth/SessionRestorer'
import { SITE_NAME, SITE_URL } from '@/lib/site'

// Self-hosted, preloaded, swap-on-fallback. Both are variable fonts, so one
// file per style covers every weight the site uses (300–600).
// Newsreader's opsz axis lets the browser pick a display cut for the 92px hero
// and a text cut for 20px card names automatically (font-optical-sizing: auto).
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-newsreader',
})

// Jost is the logotype face (see LitMeUp brand-assets/README.txt), so UI text
// and the wordmark now share one voice.
const jost = Jost({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jost',
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
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#C4714A',
    colorPrimaryForeground: '#EDE8E0',
    colorBackground: '#F5F1EB',
    colorForeground: '#1A1210',
    colorMutedForeground: '#A09488',
    colorInput: '#FFFFFF',
    colorInputForeground: '#2C2825',
    colorDanger: '#C4714A',
    fontFamily: 'var(--font-jost)',
    borderRadius: '0.5rem',
  },
}

// Next already emits a high-priority preload for the hero <video poster>, so no
// manual <link rel="preload"> is needed in <head>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${newsreader.variable} ${jost.variable}`}>
      <body className="bg-white text-dark font-sans font-light leading-relaxed overflow-x-hidden" suppressHydrationWarning>
        {/* Inside <body>, not around <html>, per Clerk's App Router setup. */}
        <ClerkProvider signInUrl="/login" signUpUrl="/signup" appearance={CLERK_APPEARANCE}>
          <SessionRestorer />
          <CustomCursor />
          <GrainOverlay />
          <NewsletterPopup />
          <Header />
          <main>{children}</main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  )
}
