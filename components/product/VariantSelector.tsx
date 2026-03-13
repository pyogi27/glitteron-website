// components/product/VariantSelector.tsx
'use client'

interface Props {
  label: string
  value: string
  options: string[]
  disabledOptions?: string[]
  onChange: (val: string) => void
}

export default function VariantSelector({ label, value, options, disabledOptions = [], onChange }: Props) {
  const select = (opt: string) => {
    if (disabledOptions.includes(opt)) return
    onChange(opt)
  }
  return (
    <div className="mb-5">
      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1A1714] mb-3 flex items-center gap-1.5">
        {label}
        <span className="text-[#9A958C] font-light tracking-[0.04em] normal-case">— {value}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => select(opt)}
            className={`px-4 py-[7px] border rounded-[20px] text-[12px] transition-all
              ${disabledOptions.includes(opt)
                ? 'opacity-40 line-through cursor-not-allowed border-[#E8E4DC] text-[#1A1714]'
                : value === opt
                  ? 'bg-[#1A1714] border-[#1A1714] text-[#FAFAF8]'
                  : 'bg-transparent border-[#E8E4DC] text-[#1A1714] hover:border-[#C8A96E] hover:text-[#9A7840]'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
