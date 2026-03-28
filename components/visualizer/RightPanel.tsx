// components/visualizer/RightPanel.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { useCartStore } from '@/lib/stores/cartStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'

export default function RightPanel() {
  const perspData        = useVisualizerStore((s) => s.perspData)
  const placedProductIds = useVisualizerStore((s) => s.placedProductIds)
  const products         = useVisualizerStore((s) => s.products)
  const opVal            = useVisualizerStore((s) => s.opVal)
  const manVal           = useVisualizerStore((s) => s.manVal)
  const setOpVal         = useVisualizerStore((s) => s.setOpVal)
  const setManVal        = useVisualizerStore((s) => s.setManVal)

  // Show CTA for the most recently placed product
  const lastId = placedProductIds[placedProductIds.length - 1] ?? null
  const placedProduct = lastId !== null
    ? products.find((p) => p.id === lastId) ?? null
    : null

  return (
    <div className="w-[224px] shrink-0 bg-white border-l border-warm-gray overflow-y-auto flex flex-col gap-[18px] px-3.5 py-4">

      {/* Perspective Engine */}
      <div>
        <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">
          Perspective Engine
        </p>
        <div className="bg-offwhite rounded-md p-3 border border-warm-gray">
          {/* SVG diagram */}
          <svg viewBox="0 0 196 72" width="100%" style={{ display: 'block', marginBottom: 4 }}>
            <line x1="98" y1="14" x2="16"  y2="66" stroke="#E0DCD6" strokeWidth="1" />
            <line x1="98" y1="14" x2="180" y2="66" stroke="#E0DCD6" strokeWidth="1" />
            <line x1="16" y1="66" x2="180" y2="66" stroke="#E0DCD6" strokeWidth="1" />
            <circle cx="98" cy="14" r="3" fill="#C4714A" opacity=".75" />
            <text x="98" y="9" textAnchor="middle" fontSize="7" fill="#C4714A" fontFamily="Outfit" letterSpacing="1">VP</text>
            <circle cx="98" cy="23" r="4" fill="none" stroke="#C4714A" strokeWidth="1" />
            <line x1="98" y1="14" x2="98" y2="19" stroke="#C4714A" strokeWidth="1" />
            <text x="98" y="34" textAnchor="middle" fontSize="6" fill="#C4714A" fontFamily="Outfit">
              {perspData ? `${perspData.dScale.toFixed(2)}×` : '0.45×'}
            </text>
            <circle cx="98" cy="56" r="7.5" fill="none" stroke="#C4714A" strokeWidth="1.2" />
            <line x1="98" y1="14" x2="98" y2="48" stroke="#C4714A" strokeWidth="1" strokeDasharray="3,2" />
            <text x="98" y="70" textAnchor="middle" fontSize="6" fill="#C4714A" fontFamily="Outfit">1.0×</text>
          </svg>

          {/* Stats */}
          <div className="flex flex-col gap-[7px] mt-2">
            {[
              {
                label: 'Depth Scale',
                value: perspData ? `${perspData.dScale.toFixed(2)}×` : null,
              },
              {
                label: 'Ceiling Dist',
                value: perspData ? `${Math.round((1 - perspData.dr) * 100)}% from VP` : null,
              },
              {
                label: 'Convergence',
                value: perspData ? `${Math.round(perspData.conv * 100)}%` : null,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[10px] text-mid-gray">{label}</span>
                <span className="text-[11px] font-normal">
                  {value ? (
                    <span className="text-gold">{value}</span>
                  ) : (
                    <span className="text-warm-gray">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fine-Tune sliders */}
      <div>
        <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">
          Fine-Tune
        </p>
        <div className="flex flex-col gap-3.5">
          <Slider
            label="Manual Scale"
            value={manVal}
            min={-50}
            max={50}
            display={(v) => (v > 0 ? '+' : '') + v + '%'}
            onChange={setManVal}
          />
          <Slider
            label="Fixture Opacity"
            value={opVal}
            min={30}
            max={100}
            display={(v) => v + '%'}
            onChange={setOpVal}
          />
        </div>
      </div>

      {/* CTA block — only shown when a fixture is placed */}
      {placedProduct && <CTABlock product={placedProduct} />}
    </div>
  )
}

function Slider({
  label, value, min, max, display, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  display: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10.5px]">
        <span className="text-mid-gray">{label}</span>
        <span className="text-gold font-medium">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="viz-range"
      />
    </div>
  )
}

function CTABlock({ product }: { product: VisualizerProduct }) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    addItem({
      productId: String(product.id),
      name: product.name,
      price: product.priceValue,
      image: product.thumb,
      size: 'Standard',
      finish: 'Default',
      quantity: 1,
    })
  }

  return (
    <div className="border-t border-warm-gray pt-4">
      <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">
        Ready to Order
      </p>
      <div className="font-serif text-[15px] mb-0.5">{product.name}</div>
      <div className="text-sm text-gold font-medium mb-3">{product.price}</div>
      <button
        type="button"
        onClick={handleAddToCart}
        className="w-full py-2.5 bg-dark text-white text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] hover:bg-[#2e2c2a] transition-colors mb-1.5 cursor-pointer font-sans"
      >
        Add to Cart
      </button>
      <button
        type="button"
        className="w-full py-2.5 bg-transparent text-mid-gray text-[10.5px] tracking-[1.2px] uppercase rounded-[5px] border border-warm-gray hover:border-gold hover:text-gold transition-colors cursor-pointer font-sans"
      >
        Book a Consultation
      </button>
    </div>
  )
}
