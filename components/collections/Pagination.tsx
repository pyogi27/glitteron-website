'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Props {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: Props) {
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function pageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    return `/collections?${params.toString()}`
  }

  // Build page number list with ellipsis
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btnBase =
    'flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-medium transition-all duration-200'
  const btnActive = 'bg-[#2C2825] text-[#EDE8E0]'
  const btnIdle = 'text-[#2C2825] hover:bg-[#2C2825]/8'
  const btnDisabled = 'text-[#A09488] cursor-not-allowed pointer-events-none'

  return (
    <div className="flex items-center justify-center gap-1 py-12">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1)} className={`${btnBase} ${btnIdle}`} aria-label="Previous page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`} aria-disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </span>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-[#A09488] text-[13px] select-none">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p as number)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1)} className={`${btnBase} ${btnIdle}`} aria-label="Next page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`} aria-disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      )}
    </div>
  )
}
