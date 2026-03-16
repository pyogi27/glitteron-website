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
      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#2C2825] mb-3 flex items-center gap-1.5">
        {label}
        <span className="text-[#A09488] font-light tracking-[0.04em] normal-case">— {value}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => select(opt)}
            className={`px-4 py-[7px] border rounded-[20px] text-[12px] transition-all
              ${disabledOptions.includes(opt)
                ? 'opacity-40 line-through cursor-not-allowed border-[#D8D0C4] text-[#2C2825]'
                : value === opt
                  ? 'bg-[#2C2825] border-[#2C2825] text-[#EDE8E0]'
                  : 'bg-transparent border-[#D8D0C4] text-[#2C2825] hover:border-[#C4714A] hover:text-[#8B5E3C]'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
