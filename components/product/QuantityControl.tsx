// components/product/QuantityControl.tsx
'use client'
import { useState } from 'react'

interface Props {
  max?: number
  onChange?: (qty: number) => void
}

export default function QuantityControl({ max = 99, onChange }: Props) {
  const [qty, setQty] = useState(1)
  const update = (val: number) => {
    const clamped = Math.max(1, Math.min(max, val))
    setQty(clamped)
    onChange?.(clamped)
  }
  return (
    <div className="flex items-center border border-[#E8E4DC] rounded-2xl overflow-hidden w-fit">
      <button
        type="button"
        onClick={() => update(qty - 1)}
        aria-label="Decrease quantity"
        className="w-9 h-9 flex items-center justify-center text-[#9A958C] hover:text-[#1A1714] hover:bg-[#E8E4DC] transition-all text-[18px] font-light"
      >
        −
      </button>
      <span className="w-10 text-center text-[14px] font-medium text-[#1A1714]">{qty}</span>
      <button
        type="button"
        onClick={() => update(qty + 1)}
        aria-label="Increase quantity"
        className="w-9 h-9 flex items-center justify-center text-[#9A958C] hover:text-[#1A1714] hover:bg-[#E8E4DC] transition-all text-[18px] font-light"
      >
        +
      </button>
    </div>
  )
}
