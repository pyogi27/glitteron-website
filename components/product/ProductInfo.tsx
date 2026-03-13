// components/product/ProductInfo.tsx
'use client'
import { useState } from 'react'
import { Product } from '@/lib/types'
import StarRating from '@/components/ui/StarRating'
import VariantSelector from './VariantSelector'
import QuantityControl from './QuantityControl'
import ProductTabs from './ProductTabs'
import { useCartStore } from '@/lib/stores/cartStore'
import { useWishlistStore } from '@/lib/stores/wishlistStore'

const PERKS = [
  { icon: '🚚', label: 'Free Delivery', sub: 'Above ₹15,000' },
  { icon: '🛡️', label: '5yr Warranty', sub: 'On all products' },
  { icon: '🔧', label: 'Expert Install', sub: 'Available on request' },
]

export default function ProductInfo({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState(product.variants.sizes[0])
  const [finish, setFinish] = useState(product.variants.finishes[0])
  const [crystalTone, setCrystalTone] = useState(product.variants.crystalTones?.[0]?.name ?? '')

  const addItem = useCartStore(s => s.addItem)
  const { toggle, has } = useWishlistStore()
  const wishlisted = has(product.id)

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: qty,
      size,
      finish,
    })
  }

  const emi = Math.round(product.price / 12)

  return (
    <div className="p-[40px_48px_48px_40px] overflow-y-auto h-[calc(100vh-72px)] bg-white">
      {/* Category */}
      <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#C8A96E] mb-3">{product.category}</div>

      {/* Title */}
      <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-light leading-[1.2] text-[#1A1714] mb-2">
        {product.name}
      </h1>
      <p className="text-[13px] text-[#9A958C] mb-3">{product.subtitle}</p>

      {/* SKU + Stock */}
      <div className="flex items-center gap-4 text-[11px] text-[#9A958C] mb-4">
        <span>SKU: {product.sku}</span>
        <span className="text-green-600 font-medium">{product.stock} in stock</span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-5">
        <StarRating rating={product.rating} size={14} />
        <span className="text-[12px] text-[#9A958C]">({product.reviewCount} reviews)</span>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-serif text-[32px] font-light text-[#1A1714]">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-[15px] text-[#9A958C] line-through font-light">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {product.discount && (
            <span className="text-[11px] text-green-600 bg-green-600/10 px-2 py-0.5 rounded-lg font-medium">
              Save {product.discount}%
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#9A958C]">
          or ₹{emi.toLocaleString('en-IN')}/mo with 0% EMI
        </div>
      </div>

      {/* Variants */}
      <VariantSelector label="Size" options={product.variants.sizes} onChange={setSize} />
      <VariantSelector label="Finish" options={product.variants.finishes} onChange={setFinish} />

      {/* Crystal tones */}
      {product.variants.crystalTones?.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1A1714] mb-3">
            Crystal Tone
            <span className="text-[#9A958C] font-light tracking-[0.04em] normal-case ml-1.5">— {crystalTone}</span>
          </div>
          <div className="flex gap-2.5">
            {product.variants.crystalTones.map(ct => (
              <button
                key={ct.name}
                type="button"
                title={ct.name}
                aria-label={ct.name}
                onClick={() => setCrystalTone(ct.name)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${crystalTone === ct.name ? 'border-[#C8A96E] scale-110' : 'border-[#E8E4DC] hover:border-[#C8A96E]'}`}
                style={{ backgroundColor: ct.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quantity + Actions */}
      <div className="flex items-center gap-3 mb-4">
        <QuantityControl max={product.stock} onChange={setQty} />
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 bg-[#1A1714] text-white border-none py-3 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase transition-all hover:bg-[#9A7840] hover:-translate-y-0.5"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${wishlisted ? 'bg-[#E8D5A3] border-[#C8A96E]' : 'border-[#E8E4DC] hover:border-[#C8A96E] hover:bg-[#F4F1EB]'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? '#9A7840' : 'none'} stroke={wishlisted ? '#9A7840' : '#9A958C'} strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <button
        type="button"
        className="w-full bg-[#C8A96E] text-[#1A1714] border-none py-3 rounded-3xl font-sans text-[13px] font-semibold tracking-[0.08em] uppercase mb-7 transition-all hover:bg-[#E8D5A3] hover:-translate-y-0.5"
      >
        Buy Now
      </button>

      {/* Perks */}
      <div className="flex gap-4 py-5 border-y border-[#E8E4DC] mb-7">
        {PERKS.map(p => (
          <div key={p.label} className="flex items-center gap-2.5 flex-1">
            <span className="text-[20px]">{p.icon}</span>
            <div>
              <div className="text-[11px] font-semibold text-[#1A1714]">{p.label}</div>
              <div className="text-[10px] text-[#9A958C]">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ProductTabs product={product} />
    </div>
  )
}
