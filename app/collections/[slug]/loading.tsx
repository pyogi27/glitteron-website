/**
 * Product page skeleton. Link prefetch carries this shell, so a card click shows
 * it within a frame instead of freezing the old page while the product renders.
 * Mirrors the real layout (breadcrumb bar, gallery + buy box) to avoid a jump.
 */
export default function ProductLoading() {
  return (
    <div aria-busy="true" className="motion-safe:animate-pulse">
      <span className="sr-only" role="status">Loading product…</span>
      <div className="pt-header bg-white border-b border-[#D8D0C4]">
        <div className="px-12 py-3.5">
          <div className="h-[14px] w-56 rounded bg-[#EDE8E0]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start bg-white">
        <div className="aspect-square bg-[#EDE8E0]" />
        <div className="px-5 lg:px-12 py-8 lg:py-12 space-y-5">
          <div className="h-3 w-28 rounded bg-[#EDE8E0]" />
          <div className="h-10 w-4/5 rounded bg-[#EDE8E0]" />
          <div className="h-7 w-36 rounded bg-[#EDE8E0]" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full rounded bg-[#EDE8E0]" />
            <div className="h-3 w-11/12 rounded bg-[#EDE8E0]" />
            <div className="h-3 w-3/4 rounded bg-[#EDE8E0]" />
          </div>
          <div className="h-12 w-full rounded-full bg-[#EDE8E0]" />
        </div>
      </div>
    </div>
  )
}
