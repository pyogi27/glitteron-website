'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <h2 className="font-serif text-3xl text-dark mb-4">Something went wrong</h2>
        <p className="text-mid-gray mb-6">{error.message}</p>
        <button onClick={reset} className="bg-dark text-white px-6 py-2.5 rounded-2xl text-sm font-medium hover:bg-gold-dark transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}
