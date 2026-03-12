import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GlitterOn — Illuminate Your World',
  description: '500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-dark font-sans font-light leading-relaxed overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
