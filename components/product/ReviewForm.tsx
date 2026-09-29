// components/product/ReviewForm.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  getMyProductReview,
  submitProductReview,
  deleteProductReview,
  type MyReviewState,
} from '@/lib/auth/api'

/**
 * Only a customer whose paid order contained this product can post here — the
 * backend re-checks it on every write, so this component is a UI affordance, not
 * the gate. It renders nothing at all for a signed-in visitor who never bought
 * the piece: an inert "you can't review this" box is noise on a product page.
 */
export default function ReviewForm({ productId }: { productId?: number }) {
  const { user, hydrated } = useAuthStore()
  const router = useRouter()

  const [state, setState] = useState<MyReviewState | null>(null)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user || !productId) return
    let live = true
    getMyProductReview(productId)
      .then(res => {
        if (!live) return
        setState(res)
        if (res.review) {
          setRating(res.review.rating)
          setTitle(res.review.title ?? '')
          setText(res.review.text)
        }
      })
      .catch(() => { /* eligibility unknown — stay silent rather than show a broken form */ })
    return () => { live = false }
  }, [user, productId])

  if (!hydrated || !productId) return null

  if (!user) {
    return (
      <p className="text-[13px] text-[#A09488] mt-6 pt-6 border-t border-[#D8D0C4]">
        Bought this piece?{' '}
        <Link href="/login" className="text-[#C4714A] underline underline-offset-2">Sign in</Link>{' '}
        to leave a review. We only publish reviews from customers who ordered it.
      </p>
    )
  }

  if (!state?.canReview) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (rating < 1) return setError('Please pick a star rating.')
    if (text.trim().length < 10) return setError('Please write at least 10 characters.')

    setBusy(true)
    try {
      await submitProductReview({ productId, rating, text: text.trim(), title: title.trim() || undefined })
      setSaved(true)
      // The published list is server-rendered from the product response; refresh
      // so it reappears with this review in it.
      router.refresh()
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Could not save your review.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!state.review) return
    setBusy(true)
    try {
      await deleteProductReview(state.review.id)
      setState({ ...state, review: null })
      setRating(0); setTitle(''); setText(''); setSaved(false)
      router.refresh()
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Could not remove your review.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 pt-7 border-t border-[#D8D0C4] max-w-xl">
      <h3 className="font-serif text-[20px] text-[#2C2825] mb-1">
        {state.review ? 'Your review' : 'Write a review'}
      </h3>
      <p className="text-[12px] text-[#A09488] mb-5">
        Verified purchase — it will show your first name and city.
      </p>

      <fieldset className="mb-5">
        <legend className="text-[11px] font-medium tracking-[0.1em] uppercase text-[#A09488] mb-2">Rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating === n}
              className="p-1 cursor-pointer transition-transform hover:scale-110"
            >
              <svg width={26} height={26} viewBox="0 0 24 24" fill={n <= rating ? '#C4714A' : '#D8D0C4'}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block mb-4">
        <span className="block text-[11px] font-medium tracking-[0.1em] uppercase text-[#A09488] mb-2">
          Headline <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <input
          type="text"
          value={title}
          maxLength={120}
          onChange={e => setTitle(e.target.value)}
          placeholder="Transformed our dining room"
          className="w-full bg-transparent border border-[#D8D0C4] px-3 py-2.5 text-[14px] text-[#2C2825] placeholder:text-[#C0B7AB] focus:border-[#C4714A] focus:outline-none"
        />
      </label>

      <label className="block mb-4">
        <span className="block text-[11px] font-medium tracking-[0.1em] uppercase text-[#A09488] mb-2">
          Your review
        </span>
        <textarea
          value={text}
          rows={5}
          maxLength={2000}
          onChange={e => setText(e.target.value)}
          placeholder="How does it light the room? How was installation?"
          className="w-full bg-transparent border border-[#D8D0C4] px-3 py-2.5 text-[14px] leading-[1.7] text-[#2C2825] placeholder:text-[#C0B7AB] focus:border-[#C4714A] focus:outline-none resize-y"
        />
        <span className="block text-[11px] text-[#C0B7AB] mt-1">{text.trim().length}/2000</span>
      </label>

      {error && <p role="alert" className="text-[13px] text-[#B4462F] mb-4">{error}</p>}
      {saved && !error && (
        <p role="status" className="text-[13px] text-[#5A7D5A] mb-4">
          Thank you — your review is live.
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="font-sans text-[12px] font-medium tracking-[0.1em] uppercase bg-[#2C2825] text-[#F5F1EA] px-7 min-h-11 cursor-pointer transition-colors hover:bg-[#C4714A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Saving…' : state.review ? 'Update review' : 'Post review'}
        </button>
        {state.review && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-[12px] text-[#A09488] underline underline-offset-2 cursor-pointer hover:text-[#B4462F] disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  )
}
