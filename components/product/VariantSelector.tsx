// components/product/VariantSelector.tsx
'use client'
import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string
  options: string[]
  disabledOptions?: string[]
  /** Appended to a disabled option's accessible name, e.g. "not available in D600". */
  disabledReason?: string
  /** Optional picture of an option (finish photo or colour dot), shown before its name. */
  visual?: (opt: string) => ReactNode
  onChange: (val: string) => void
}

const LABEL = 'text-[11px] font-semibold tracking-[0.14em] uppercase text-[#2C2825]'

export default function VariantSelector({
  label,
  value,
  options,
  disabledOptions = [],
  disabledReason = 'not available',
  visual,
  onChange,
}: Props) {
  // Nothing to choose from — render nothing rather than a bare "SIZE —" row.
  if (options.length === 0) return null

  // One option is a fact, not a choice: state it once, with no button.
  if (options.length === 1) {
    return (
      <div className="mb-5 flex items-center gap-3">
        <span className={LABEL}>{label}</span>
        <span className="flex items-center gap-2 text-[13px] text-[#2C2825]">
          {visual?.(options[0])}
          {options[0]}
        </span>
      </div>
    )
  }

  // Several options: the label stays bare. Every pill shows its own name and the
  // selected one is filled, so "Size — D480" above a filled "D480" said it twice.
  return (
    <div className="mb-5">
      <div className={`${LABEL} mb-3`}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const disabled = disabledOptions.includes(opt)
          const selected = value === opt
          const pic = visual?.(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={disabled ? `${opt}, ${disabledReason}` : undefined}
              title={disabled ? `${opt}, ${disabledReason}` : undefined}
              className={`flex items-center gap-2 min-h-11 border rounded-full text-[12px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4714A]
                ${pic ? 'pl-1 pr-4 py-1' : 'px-4'}
                ${disabled
                  ? 'opacity-40 line-through cursor-not-allowed border-[#D8D0C4] text-[#2C2825]'
                  : selected
                    ? 'bg-[#2C2825] border-[#2C2825] text-[#EDE8E0]'
                    : 'bg-transparent border-[#D8D0C4] text-[#2C2825] hover:border-[#C4714A] hover:text-[#8B5E3C]'
                }`}
            >
              {pic}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
