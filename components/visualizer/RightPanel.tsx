// components/visualizer/RightPanel.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { useCartStore } from '@/lib/stores/cartStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'
import type { AIGenerateResponse, ShareResult } from '@/lib/ai/types'

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

      {/* Generate AI Preview — only when a real image is uploaded and a product is placed */}
      <GenerateBlock />
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

function GenerateBlock() {
  const imageDataUrl       = useVisualizerStore((s) => s.imageDataUrl)
  const placedProductIds   = useVisualizerStore((s) => s.placedProductIds)
  const products           = useVisualizerStore((s) => s.products)
  const isGenerating       = useVisualizerStore((s) => s.isGenerating)
  const generationError    = useVisualizerStore((s) => s.generationError)
  const generatedImageUrl  = useVisualizerStore((s) => s.generatedImageUrl)
  const step               = useVisualizerStore((s) => s.step)
  const roomType           = useVisualizerStore((s) => s.roomType)
  const shareUrl           = useVisualizerStore((s) => s.shareUrl)
  const isSharing          = useVisualizerStore((s) => s.isSharing)
  const shareError         = useVisualizerStore((s) => s.shareError)
  const setIsGenerating    = useVisualizerStore((s) => s.setIsGenerating)
  const setGeneratedImage  = useVisualizerStore((s) => s.setGeneratedImage)
  const setGenerationError = useVisualizerStore((s) => s.setGenerationError)
  const setIsSharing       = useVisualizerStore((s) => s.setIsSharing)
  const setShareResult     = useVisualizerStore((s) => s.setShareResult)
  const setShareError      = useVisualizerStore((s) => s.setShareError)

  const lastId = placedProductIds[placedProductIds.length - 1] ?? null
  const lastProduct = lastId !== null ? products.find((p) => p.id === lastId) ?? null : null

  // Only show when a real image is available (not demo mode) and a product is placed
  if (!imageDataUrl || !lastProduct) return null

  async function handleGenerate() {
    if (isGenerating || !lastProduct) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const res = await fetch('/api/visualizer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          productImageUrl: lastProduct.full,
          productName: lastProduct.name,
          productCategory: lastProduct.category,
        }),
      })
      if (!res.ok) throw new Error(`generate API returned ${res.status}`)
      const data = await res.json() as AIGenerateResponse
      setGeneratedImage(data.compositeImageUrl)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed')
    }
  }

  async function handleShare() {
    if (isSharing || !generatedImageUrl) return
    setIsSharing(true)
    setShareError(null)

    const payload = {
      roomType: roomType ?? 'Room',
      compositeImageUrl: generatedImageUrl,
      products: products
        .filter((p) => placedProductIds.includes(p.id))
        .map((p) => ({ id: p.id, name: p.name, price: p.price, thumb: p.thumb })),
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/visualizer/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`share API returned ${res.status}`)
      const data = await res.json() as ShareResult
      setShareResult(data.id, data.url)
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Share failed')
    }
  }

  async function handleCopyLink() {
    if (shareUrl) await navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="border-t border-warm-gray pt-4">
      <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">AI Preview</p>

      {step < 6 && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-[11px] text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] transition-all font-sans mb-1.5 ${
            isGenerating
              ? 'bg-warm-gray text-mid-gray cursor-not-allowed'
              : 'bg-gold text-white hover:opacity-90 cursor-pointer'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : (
            'Generate AI Preview'
          )}
        </button>
      )}

      {generationError && (
        <p className="text-[10px] text-red-400 mt-1">{generationError}</p>
      )}

      {step === 6 && generatedImageUrl && (
        <div className="mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl}
            alt="AI-generated composite"
            className="w-full rounded-md border border-warm-gray mb-3"
          />

          {!shareUrl ? (
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className={`w-full py-[11px] text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] transition-all font-sans ${
                isSharing
                  ? 'bg-warm-gray text-mid-gray cursor-not-allowed'
                  : 'bg-dark text-white hover:bg-[#2e2c2a] cursor-pointer'
              }`}
            >
              {isSharing ? 'Saving…' : 'Share Result'}
            </button>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-[10px] border border-warm-gray rounded-[4px] px-2 py-1.5 bg-offwhite truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[10px] tracking-[1px] uppercase bg-dark text-white px-2.5 py-1.5 rounded-[4px] hover:bg-[#2e2c2a] transition-colors cursor-pointer font-sans"
              >
                Copy
              </button>
            </div>
          )}

          {shareError && (
            <p className="text-[10px] text-red-400 mt-1">{shareError}</p>
          )}
        </div>
      )}
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
