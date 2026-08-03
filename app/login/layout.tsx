import type { Metadata } from 'next'

// Client-component pages cannot export metadata; a layout carries it.
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
