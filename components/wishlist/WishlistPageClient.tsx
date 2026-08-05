'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import { useWishlistStore } from '@/lib/stores/wishlistStore'
import type { Product } from '@/lib/types'

type LoadState = 'loading' | 'ready' | 'error'

export default function WishlistPageClient() {
  const ids = useWishlistStore((s) => s.ids)
  const toggle = useWishlistStore((s) => s.toggle)

  const [products, setProducts] = useState<Product[]>([])
  const [missing, setMissing] = useState<string[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const load = useCallback(async (targetIds: string[]) => {
    if (targetIds.length === 0) {
      setProducts([])
      setMissing([])
      setState('ready')
      return
    }

    setState('loading')
    try {
      const res = await fetch(`/api/products/batch?ids=${targetIds.join(',')}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const body = await res.json()
      setProducts(body.data ?? [])
      setMissing(body.missing ?? [])
      setState('ready')
    } catch {
      // Loud on purpose: an empty grid and a broken API look identical otherwise, and
      // "your wishlist is empty" is the one thing this page must never say by mistake.
      setState('error')
    }
  }, [])

  /**
   * Fetch once, after mount. `ids` is read via getState rather than taken as a
   * dependency for two reasons: zustand/persist fills it from localStorage during
   * store creation (so it is already correct by the first client effect), and the only
   * id changes that happen *on this page* are removals — handled below by filtering
   * what is already loaded. Depending on `ids` would refetch the whole list per click.
   */
  useEffect(() => {
    if (!mounted) return
    load(useWishlistStore.getState().ids)
  }, [mounted, load])

  const visible = products.filter((p) => ids.includes(p.id))
  const unavailable = missing.filter((id) => ids.includes(id))
  const total = visible.length + unavailable.length

  return (
    <>
      <div className="pt-header bg-white border-b border-[#D8D0C4]">
        <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">Saved Items</span>
        </div>
      </div>

      <section className="bg-[#EDE8E0] min-h-[calc(100vh-var(--spacing-header))] px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-[1320px] mx-auto">
          <header className="mb-6 md:mb-9">
            <h1 className="font-serif text-[clamp(30px,3.2vw,44px)] leading-[1.05] text-[#2C2825]">
              Saved Items
            </h1>
            <p aria-live="polite" className="text-[12px] md:text-[13px] text-[#A09488] mt-1">
              {!mounted || state === 'loading'
                ? 'Gathering your saved pieces…'
                : state === 'error'
                  ? 'We could not load your saved pieces.'
                  : total === 0
                    ? 'Nothing saved yet.'
                    : `${total} piece${total === 1 ? '' : 's'} kept for later`}
            </p>
          </header>

          {!mounted || state === 'loading' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[240px] sm:h-[360px] rounded-[20px] bg-[#E2DAD0] animate-pulse"
                />
              ))}
            </div>
          ) : state === 'error' ? (
            <div className="rounded-[18px] border border-[#D8D0C4] bg-white p-8 md:p-10 text-center">
              <p className="font-serif text-[26px] leading-[1.15] text-[#2C2825] mb-3">
                Your saved items are safe — we just could not reach them
              </p>
              <p className="text-[13px] text-[#A09488] mb-6">
                Nothing has been removed. Try again in a moment.
              </p>
              <button
                type="button"
                onClick={() => load(useWishlistStore.getState().ids)}
                className="inline-flex items-center justify-center bg-[#2C2825] text-white px-6 py-3 rounded-3xl text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#8B5E3C] hover:-translate-y-0.5 cursor-none"
              >
                Try again
              </button>
            </div>
          ) : total === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#D8D0C4] bg-[#F4EFE8] p-8 md:p-10 text-center">
              <p className="font-serif text-[28px] leading-[1.1] text-[#2C2825] mb-3">
                Nothing saved yet
              </p>
              <p className="text-[13px] text-[#A09488] mb-6">
                Tap the heart on any piece to keep it here while you decide.
              </p>
              <Link
                href="/collections"
                className="inline-flex items-center justify-center bg-[#2C2825] text-white no-underline px-6 py-3 rounded-3xl text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#8B5E3C] hover:-translate-y-0.5"
              >
                Explore collections
              </Link>
            </div>
          ) : (
            <div className="cards-track grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}

              {/* A saved piece that no longer exists in the catalog. Shown rather than
                  dropped, so the list never shrinks without the shopper doing it. */}
              {unavailable.map((id) => (
                <div
                  key={`unavailable-${id}`}
                  className="rounded-[20px] border border-dashed border-[#D8D0C4] bg-[#F4EFE8] p-6 flex flex-col items-center justify-center text-center min-h-[240px] sm:min-h-[360px]"
                >
                  <p className="font-serif text-[20px] leading-[1.2] text-[#2C2825] mb-2">
                    No longer available
                  </p>
                  <p className="text-[12px] text-[#A09488] mb-5">
                    This piece has left the collection.
                  </p>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="text-[11px] uppercase tracking-[0.09em] text-[#8B5E3C] hover:text-[#2C2825] transition-colors cursor-none"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
