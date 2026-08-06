interface Stat { num: string; label: string }
interface Props {
  title: string
  subtitle: string
  stats: Stat[]
  /** Eyebrow label above the title. Defaults to 'Collections'. */
  eyebrow?: string
}

export default function PageBanner({ title, subtitle, stats, eyebrow = 'Collections' }: Props) {
  return (
    <div className="pt-header bg-[#EDE8E0] text-[#2C2825] pb-12 px-12">
      <div className="max-w-[900px] pt-12">
        <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">{eyebrow}</div>
        <h1 className="font-serif text-[clamp(36px,5vw,64px)] font-light leading-[1.1] mb-4">{title}</h1>
        <p className="text-[14px] font-light text-[#2C2825]/60 max-w-[480px] leading-[1.8] mb-10">{subtitle}</p>
        <div className="flex gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-[#E2DAD0] rounded-2xl px-6 py-4">
              <div className="font-serif text-[28px] font-light text-[#A85B3B]">{s.num}</div>
              <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#8B7D6E] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
