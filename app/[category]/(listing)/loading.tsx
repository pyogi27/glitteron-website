const PLACEHOLDER_CARDS = 8

/**
 * Category skeleton, shared by /[category] and /[category]/[sub]. Link prefetch
 * carries this shell, so a category click shows it within a frame. Mirrors the
 * banner + grid of CollectionView so the real page lands without a jump.
 */
export default function CategoryLoading() {
  return (
    <div aria-busy="true" className="motion-safe:animate-pulse">
      <span className="sr-only" role="status">Loading products…</span>
      <div className="pt-header bg-[#EDE8E0] pb-12 px-6 md:px-12">
        <div className="max-w-[900px] pt-12 space-y-4">
          <div className="h-3 w-32 rounded bg-[#D8D0C4]" />
          <div className="h-12 w-3/5 rounded bg-[#D8D0C4]" />
          <div className="h-4 w-80 max-w-full rounded bg-[#D8D0C4]" />
        </div>
      </div>
      <div className="min-h-screen bg-[#EDE8E0] p-4 sm:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pt-4">
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
            <div key={i} className="rounded-[20px] overflow-hidden bg-white">
              <div className="aspect-square bg-[#E4DDD2]" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-4/5 rounded bg-[#EDE8E0]" />
                <div className="h-3 w-1/3 rounded bg-[#EDE8E0]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
