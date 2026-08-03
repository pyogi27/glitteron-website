import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-xs mb-4">404</p>
        <h1 className="font-serif text-5xl font-light text-dark mb-4">Page not found</h1>
        <p className="text-mid-gray mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="bg-dark text-white px-6 py-2.5 rounded-2xl text-sm font-medium hover:bg-gold-dark transition-colors no-underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
