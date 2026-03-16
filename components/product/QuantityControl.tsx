// components/product/QuantityControl.tsx
'use client'

interface Props {
  value: number
  max?: number
  onChange: (qty: number) => void
}

export default function QuantityControl({ value, max = 99, onChange }: Props) {
  const update = (val: number) => {
    onChange(Math.max(1, Math.min(max, val)))
  }
  return (
    <div className="flex items-center border border-[#D8D0C4] rounded-2xl overflow-hidden w-fit">
      <button
        type="button"
        onClick={() => update(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="w-9 h-9 flex items-center justify-center text-[#A09488] hover:text-[#2C2825] hover:bg-[#D8D0C4] transition-all text-[18px] font-light disabled:opacity-30 disabled:cursor-not-allowed"
      >
        −
      </button>
      <span className="w-10 text-center text-[14px] font-medium text-[#2C2825]" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => update(value + 1)}
        aria-label="Increase quantity"
        className="w-9 h-9 flex items-center justify-center text-[#A09488] hover:text-[#2C2825] hover:bg-[#D8D0C4] transition-all text-[18px] font-light"
      >
        +
      </button>
    </div>
  )
}
