type BadgeVariant = 'new' | 'sale' | 'best'

const STYLES: Record<BadgeVariant, string> = {
  new: 'bg-gold text-dark',
  sale: 'bg-dark text-gold',
  best: 'bg-white/90 text-dark border border-warm-gray',
}

const LABELS: Record<BadgeVariant, string> = {
  new: 'New',
  sale: 'Sale',
  best: 'Bestseller',
}

interface BadgeProps {
  variant: BadgeVariant
}

export default function Badge({ variant }: BadgeProps) {
  return (
    <span
      className={`absolute top-3 left-3 text-[9px] font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-2xl z-10 ${STYLES[variant]}`}
    >
      {LABELS[variant]}
    </span>
  )
}
