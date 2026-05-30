import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/ui/CustomCursor'
import GrainOverlay from '@/components/ui/GrainOverlay'
import NewsletterPopup from '@/components/ui/NewsletterPopup'
import SessionRestorer from '@/components/auth/SessionRestorer'

export const metadata: Metadata = {
  title: 'LitmeUp — Illuminate Your World',
  description: '500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
