// components/visualizer/ProductPanel.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'

export default function ProductPanel() {
  const analysisData = useVisualizerStore((s) => s.analysisData)
  const products = useVisualizerStore((s) => s.products)
  const selectedProduct = useVisualizerStore((s) => s.selectedProduct)
  const placedProductIds = useVisualizerStore((s) => s.placedProductIds)
  const compositedProductIds = useVisualizerStore((s) => s.compositedProductIds)
  const setSelectedProduct = useVisualizerStore((s) => s.setSelectedProduct)

  return (
    <div className="w-[272px] shrink-0 bg-white border-r border-warm-gray flex flex-col overflow-hidden">
      {/* Room Analysis */}
      <div className="px-[18px] py-4 border-b border-warm-gray shrink-0">
        <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-3">
          Room Analysis
        </p>
        {[
          { label: 'Room Type', value: analysisData?.roomType },
          { label: 'Ceiling', value: analysisData?.ceiling },
          { label: 'Style', value: analysisData?.style },
          { label: 'Tone', value: analysisData?.tone },
          { label: 'AI Match', value: analysisData?.matchScore, accent: true },
        ].map(({ label, value, accent }) => (
          <div key={label} className="flex justify-between items-baseline text-xs mb-[7px]">
            <span className="text-[11px] text-mid-gray">{label}</span>
            {value ? (
              <span className={`font-normal ${accent ? 'text-gold font-medium' : 'text-dark'}`}>
                {value}
              </span>
            ) : (
              <span className="text-warm-gray">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Suggested Fixtures header */}
      <div className="px-[18px] pt-[13px] pb-0 shrink-0">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[9.5px] tracking-[2px] uppercase text-mid-gray">
            Suggested Fixtures
          </span>
          {products.length > 0 && (
            <span className="text-[10px] text-gold">{products.length} found</span>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="overflow-y-auto flex-1 px-3 pb-3">
        {products.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <p className="font-serif text-sm italic text-mid-gray mb-1">
              Upload a room to see matches
            </p>
            <p className="text-[11px] text-warm-gray">AI ranks by style compatibility</p>
          </div>
        ) : (
          products.map((p, i) => (
            <ProductItem
              key={p.id}
              product={p}
              isFirst={i === 0}
              isSelected={selectedProduct?.id === p.id}
              isPlaced={placedProductIds.includes(p.id)}
              isInRender={compositedProductIds.includes(p.id)}
              onClick={() => setSelectedProduct(p)}
            />
          ))
        )}
      </div>

      {/* Place button */}
      <PlaceButton />
    </div>
  )
}

function ProductItem({
  product: p,
  isFirst,
  isSelected,
  isPlaced,
  isInRender,
  onClick,
}: {
  product: VisualizerProduct
  isFirst: boolean
  isSelected: boolean
  isPlaced: boolean
  isInRender: boolean
  onClick: () => void
}) {
  const dotCount = Math.round(p.match / 20) // 0-5 dots filled

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`relative flex gap-2.5 items-center p-2.5 rounded-md border cursor-pointer transition-all duration-150 mb-1.5 ${
        isSelected
          ? 'border-gold bg-[rgba(196,113,74,0.12)]'
          : 'border-transparent hover:border-warm-gray hover:bg-offwhite'
      }`}
    >
      {isFirst && (
        <span className="absolute top-1.5 right-1.5 text-[7.5px] tracking-[1px] uppercase bg-gold text-white px-1.5 py-0.5 rounded-full font-medium">
          Best
        </span>
      )}
      {(isPlaced || isInRender) && (
        <span className={`absolute top-1.5 left-1.5 text-[7.5px] tracking-[1px] uppercase px-1.5 py-0.5 rounded-full font-medium text-white ${isInRender ? 'bg-gold' : 'bg-dark'}`}>
          {isInRender ? 'In preview' : 'On canvas'}
        </span>
      )}
      <div className="w-[52px] h-[52px] shrink-0 rounded-[5px] overflow-hidden bg-offwhite border border-warm-gray">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.thumb}
          alt={p.name}
          className="w-full h-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[13px] mb-0.5 truncate">{p.name}</div>
        <div className="text-[10px] tracking-[1px] uppercase text-mid-gray mb-1">{p.type}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark">{p.price}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, j) => (
              <div
                key={j}
                className={`w-[5px] h-[5px] rounded-full ${j < dotCount ? 'bg-gold' : 'bg-warm-gray'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlaceButton() {
  const selectedProduct  = useVisualizerStore((s) => s.selectedProduct)
  const placedProductIds = useVisualizerStore((s) => s.placedProductIds)
  const compositedProductIds = useVisualizerStore((s) => s.compositedProductIds)
  const step             = useVisualizerStore((s) => s.step)
  const setStep          = useVisualizerStore((s) => s.setStep)
  const addPlacedProduct = useVisualizerStore((s) => s.addPlacedProduct)

  const isPlaced =
    selectedProduct !== null &&
    (placedProductIds.includes(selectedProduct.id) ||
      compositedProductIds.includes(selectedProduct.id))

  function handlePlace() {
    if (!selectedProduct || isPlaced) return
    addPlacedProduct(selectedProduct.id)
    // From the result view (step 6) this returns to placement mode on top of
    // the generated render; from step 4 it advances to Visualise as before.
    if (step !== 5) setStep(5)
  }

  return (
    <div className="px-3.5 py-3 border-t border-warm-gray shrink-0">
      <button
        type="button"
        disabled={!selectedProduct || isPlaced}
        onClick={handlePlace}
        className={`w-full py-[11px] text-[11px] tracking-[1.5px] uppercase rounded-[5px] transition-all duration-150 font-sans ${
          isPlaced
            ? 'bg-gold text-white cursor-default'
            : selectedProduct
            ? 'bg-dark text-white hover:bg-[#2e2c2a] cursor-pointer'
            : 'bg-dark text-white opacity-30 cursor-not-allowed'
        }`}
      >
        {isPlaced
          ? `✓ ${selectedProduct!.name} Placed`
          : selectedProduct
          ? `Place ${selectedProduct.name}`
          : 'Select a Fixture First'}
      </button>
    </div>
  )
}
