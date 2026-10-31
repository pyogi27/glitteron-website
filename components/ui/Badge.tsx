type BadgeVariant = 'new' | 'sale' | 'best'

// Tinted pills, as on the Fig Living cards: pale ground, dark text of the same hue.
const STYLES: Record<BadgeVariant, string> = {
  new: 'bg-[#DDF1D6] text-[#24461C]',
  sale: 'bg-[#FBE7D3] text-[#7A3E10]',
  best: 'bg-[#FCE4E1] text-[#A3261C]',
}

const LABELS: Record<BadgeVariant, string> = {
  new: 'New',
  sale: 'Sale',
  best: 'Trending Now',
}

interface BadgeProps {
  variant: BadgeVariant
  /** Replaces the variant's default text, e.g. "20% Off" on a deal card. */
  label?: string
}

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={`absolute top-3 left-3 z-10 rounded-[4px] px-2.5 py-1 text-[12px] font-medium leading-none ${STYLES[variant]}`}
    >
      {label ?? LABELS[variant]}
    </span>
  )
}
