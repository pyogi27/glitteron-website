// components/visualizer/RightPanel.tsx
'use client'
import { useEffect, useState } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { useCartStore } from '@/lib/stores/cartStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { getVisualizerUsage } from '@/lib/auth/api'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { VisualizerProduct } from '@/lib/data/visualizer'
import type { AIGenerateResponse, ShareResult } from '@/lib/ai/types'

interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

export default function RightPanel() {
  const perspData        = useVisualizerStore((s) => s.perspData)
  const placedProductIds = useVisualizerStore((s) => s.placedProductIds)
  const compositedProductIds = useVisualizerStore((s) => s.compositedProductIds)
  const products         = useVisualizerStore((s) => s.products)
  const opVal            = useVisualizerStore((s) => s.opVal)
  const manVal           = useVisualizerStore((s) => s.manVal)
  const setOpVal         = useVisualizerStore((s) => s.setOpVal)
  const setManVal        = useVisualizerStore((s) => s.setManVal)

  // Show CTA for the most recently placed product; after a generation the
  // pending list is empty, so fall back to the last product in the render.
  const lastId =
    placedProductIds[placedProductIds.length - 1] ??
    compositedProductIds[compositedProductIds.length - 1] ??
    null
  const placedProduct = lastId !== null
    ? products.find((p) => p.id === lastId) ?? null
    : null

  return (
    <div className="w-[224px] shrink-0 bg-white border-l border-warm-gray overflow-y-auto flex flex-col gap-[18px] px-3.5 py-4">

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

// Only data URLs can be fed back into the generate API as the next base image
function isChainableDataUrl(url: string): boolean {
  return /^data:image\/(jpeg|png|webp);base64,/.test(url)
}

// Composite a list of fixtures onto a base image, one API call per fixture,
// feeding each result into the next call. Returns the final composite.
async function generateChain(
  baseImage: string,
  items: VisualizerProduct[],
  token: string | null,
  onProgress: (progress: { current: number; total: number; productName: string }) => void,
): Promise<string> {
  let current = baseImage
  for (let i = 0; i < items.length; i++) {
    const product = items[i]
    onProgress({ current: i + 1, total: items.length, productName: product.name })
    const res = await fetch('/api/visualizer/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        imageDataUrl: current,
        productImageUrl: product.full,
        productName: product.name,
        productCategory: product.category,
      }),
    })
    if (res.status === 401) throw new Error('Sign in to use the room visualizer')
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}))
      const resetAt = data.resetAt ? new Date(data.resetAt) : null
      throw new Error(
        resetAt
          ? `Daily visualizer limit reached. Try again after ${resetAt.toLocaleTimeString()}.`
          : 'Daily visualizer limit reached. Try again later.',
      )
    }
    if (!res.ok) throw new Error(`Could not add ${product.name} (API ${res.status})`)
    const data = await res.json() as AIGenerateResponse
    if (!isChainableDataUrl(data.compositeImageUrl) && i < items.length - 1) {
      throw new Error('Provider returned a non-chainable image; cannot add further fixtures')
    }
    current = data.compositeImageUrl
  }
  return current
}

function GenerateBlock() {
  const imageDataUrl       = useVisualizerStore((s) => s.imageDataUrl)
  const placedProductIds   = useVisualizerStore((s) => s.placedProductIds)
  const compositedProductIds = useVisualizerStore((s) => s.compositedProductIds)
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
  const applyRender        = useVisualizerStore((s) => s.applyRender)
  const restoreRender      = useVisualizerStore((s) => s.restoreRender)
  const renderHistory      = useVisualizerStore((s) => s.renderHistory)
  const setGenerationError = useVisualizerStore((s) => s.setGenerationError)
  const setGenerationProgress = useVisualizerStore((s) => s.setGenerationProgress)
  const setIsSharing       = useVisualizerStore((s) => s.setIsSharing)
  const setShareResult     = useVisualizerStore((s) => s.setShareResult)
  const setShareError      = useVisualizerStore((s) => s.setShareError)
  const discardGenerated   = useVisualizerStore((s) => s.discardGenerated)
  const removePlacedProduct = useVisualizerStore((s) => s.removePlacedProduct)
  const resetAll           = useVisualizerStore((s) => s.resetAll)
  const addCartItem        = useCartStore((s) => s.addItem)

  const [bulkAdded, setBulkAdded] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [resetAt, setResetAt] = useState<Date | null>(null)

  // A new render means a new set of fixtures — re-enable "Add All to Cart"
  useEffect(() => {
    setBulkAdded(false)
  }, [generatedImageUrl])

  // Show today's remaining quota so the button can be disabled before the
  // user burns a generation on a request the backend would reject anyway.
  useEffect(() => {
    getVisualizerUsage()
      .then((u) => {
        setRemaining(u.remaining)
        setResetAt(u.resetAt ? new Date(u.resetAt) : null)
      })
      .catch(() => {})
  }, [])

  // Fixtures placed on the canvas but not yet baked into the AI render
  const pendingProducts = placedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is VisualizerProduct => p !== undefined)

  // Fixtures already baked into the current render
  const compositedProducts = compositedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is VisualizerProduct => p !== undefined)

  const hasResult = step === 6 && generatedImageUrl !== null

  // Only show when a real image is available (not demo mode)
  if (!imageDataUrl) return null
  if (pendingProducts.length === 0 && !hasResult && !generatedImageUrl) return null

  async function runChain(baseImage: string, items: VisualizerProduct[], resultIds: number[]) {
    setIsGenerating(true)
    setGenerationError(null)
    try {
      const token = useAuthStore.getState().accessToken
      const url = await generateChain(baseImage, items, token, setGenerationProgress)
      applyRender(url, resultIds)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      // Each chained call consumed one backend usage — re-sync rather than
      // guess how many succeeded before an error.
      getVisualizerUsage()
        .then((u) => {
          setRemaining(u.remaining)
          setResetAt(u.resetAt ? new Date(u.resetAt) : null)
        })
        .catch(() => {})
    }
  }

  async function handleGenerate() {
    if (isGenerating || pendingProducts.length === 0) return
    // Chain onto the previous render when one exists so earlier fixtures are
    // kept; each pending fixture is composited in its own API call.
    const base =
      generatedImageUrl && isChainableDataUrl(generatedImageUrl)
        ? generatedImageUrl
        : imageDataUrl!
    const resultIds = [
      ...compositedProductIds,
      ...placedProductIds.filter((id) => !compositedProductIds.includes(id)),
    ]
    await runChain(base, pendingProducts, resultIds)
  }

  // Rebuild the render from the original photo with one fixture taken out
  function handleRemoveFromRender(product: VisualizerProduct) {
    if (isGenerating || !imageDataUrl) return
    setConfirm({
      title: `Remove ${product.name}?`,
      message: 'It will be taken out of this preview and the preview regenerated.',
      confirmLabel: 'Remove',
      onConfirm: () => {
        const remaining = compositedProducts.filter((p) => p.id !== product.id)
        if (remaining.length === 0) {
          // Nothing left to render — fall back to the original photo
          discardGenerated()
          removePlacedProduct(product.id)
          return
        }
        void runChain(imageDataUrl, remaining, remaining.map((p) => p.id))
      },
    })
  }

  function handleAddAllToCart() {
    compositedProducts.forEach((p) =>
      addCartItem({
        productId: String(p.id),
        name: p.name,
        price: p.priceValue,
        image: p.thumb,
        size: 'Standard',
        finish: 'Default',
        quantity: 1,
      }),
    )
    setBulkAdded(true)
  }

  function handleDiscard() {
    setConfirm({
      title: 'Discard this AI preview?',
      message:
        'Your fixtures will go back on the canvas so you can adjust and regenerate.',
      confirmLabel: 'Discard',
      onConfirm: discardGenerated,
    })
  }

  function handleStartOver() {
    setConfirm({
      title: 'Start over?',
      message: 'This removes your photo, fixtures, and AI preview.',
      confirmLabel: 'Start Over',
      onConfirm: resetAll,
    })
  }

  async function handleShare() {
    if (isSharing || !generatedImageUrl) return
    setIsSharing(true)
    setShareError(null)

    const payload = {
      roomType: roomType ?? 'Room',
      compositeImageUrl: generatedImageUrl,
      products: products
        .filter((p) => compositedProductIds.includes(p.id))
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

      {pendingProducts.length > 0 && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || remaining === 0}
          className={`w-full py-[11px] text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] transition-all font-sans mb-1.5 ${
            isGenerating || remaining === 0
              ? 'bg-warm-gray text-mid-gray cursor-not-allowed'
              : 'bg-gold text-white hover:opacity-90 cursor-pointer'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : remaining === 0 ? (
            'Daily limit reached'
          ) : (
            `${generatedImageUrl ? 'Update AI Preview' : 'Generate AI Preview'}${
              pendingProducts.length > 1 ? ` (${pendingProducts.length})` : ''
            }`
          )}
        </button>
      )}

      {pendingProducts.length > 0 && remaining !== null && (
        <p className="text-[10px] text-mid-gray mt-1">
          {remaining === 0
            ? `Try again after ${resetAt ? resetAt.toLocaleTimeString() : 'tomorrow'}.`
            : `${remaining} of 4 AI previews left today`}
        </p>
      )}

      {generationError && (
        <p className="text-[10px] text-red-400 mt-1">{generationError}</p>
      )}

      {hasResult && generatedImageUrl && (
        <div className="mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl}
            alt="AI-generated composite"
            className="w-full rounded-md border border-warm-gray mb-2"
          />

          <p className="text-[10px] text-mid-gray leading-relaxed mb-3">
            Like it? Add to cart or share. Want more? Select another fixture on
            the left and place it — it will be added to this preview.
          </p>

          {/* Fixtures in this render, each individually removable */}
          {compositedProducts.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] tracking-[1.5px] uppercase text-mid-gray mb-1.5">
                In this preview
              </p>
              {compositedProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 shrink-0 rounded-[4px] overflow-hidden bg-offwhite border border-warm-gray">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="flex-1 min-w-0 text-[10.5px] truncate">{p.name}</span>
                  <button
                    type="button"
                    title={`Remove ${p.name} from preview`}
                    aria-label={`Remove ${p.name} from preview`}
                    onClick={() => handleRemoveFromRender(p)}
                    disabled={isGenerating}
                    className="w-[18px] h-[18px] shrink-0 rounded-full border border-warm-gray text-[8px] text-mid-gray flex items-center justify-center hover:border-red-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bulk add — worth showing once more than one fixture is in the render */}
          {compositedProducts.length > 1 && (
            <button
              type="button"
              onClick={handleAddAllToCart}
              disabled={bulkAdded}
              className={`w-full py-[9px] text-[10px] tracking-[1.2px] uppercase rounded-[5px] transition-colors font-sans mb-1.5 ${
                bulkAdded
                  ? 'bg-offwhite text-gold border border-gold cursor-default'
                  : 'bg-dark text-white hover:bg-[#2e2c2a] cursor-pointer'
              }`}
            >
              {bulkAdded ? '✓ All Added to Cart' : `Add All to Cart (${compositedProducts.length})`}
            </button>
          )}

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

      {/* Version history — flip between previous renders without regenerating */}
      {renderHistory.length > 1 && !isGenerating && (
        <div className="mt-3">
          <p className="text-[9px] tracking-[1.5px] uppercase text-mid-gray mb-1.5">
            Versions
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {renderHistory.map((r, i) => (
              <button
                key={r.createdAt}
                type="button"
                title={`Version ${i + 1} — ${r.productIds.length} fixture${r.productIds.length === 1 ? '' : 's'}`}
                onClick={() => restoreRender(i)}
                className={`shrink-0 rounded-[4px] overflow-hidden border-2 transition-colors cursor-pointer ${
                  r.url === generatedImageUrl ? 'border-gold' : 'border-warm-gray hover:border-mid-gray'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt={`Render version ${i + 1}`} className="w-[52px] h-[39px] object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render management — available whenever an AI render exists */}
      {generatedImageUrl && !isGenerating && (
        <div className="flex flex-col gap-1.5 mt-3">
          {isChainableDataUrl(generatedImageUrl) && (
            <a
              href={generatedImageUrl}
              download="glitteron-room-preview.png"
              className="w-full py-2 text-center text-[10px] tracking-[1.2px] uppercase rounded-[5px] border border-warm-gray text-mid-gray hover:border-gold hover:text-gold transition-colors cursor-pointer font-sans"
            >
              ⤓ Download Image
            </a>
          )}
          <button
            type="button"
            onClick={handleDiscard}
            className="w-full py-2 text-[10px] tracking-[1.2px] uppercase rounded-[5px] border border-warm-gray text-mid-gray hover:border-red-400 hover:text-red-400 transition-colors cursor-pointer font-sans"
          >
            Discard &amp; Re-Edit
          </button>
          <button
            type="button"
            onClick={handleStartOver}
            className="w-full py-1.5 text-[10px] tracking-[1.2px] uppercase text-mid-gray hover:text-dark transition-colors cursor-pointer font-sans"
          >
            ↺ Start Over
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        destructive
        onConfirm={() => {
          confirm?.onConfirm()
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
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
