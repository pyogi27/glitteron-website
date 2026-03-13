interface Stat { num: string; label: string }
interface Props {
  title: string
  subtitle: string
  stats: Stat[]
}

export default function PageBanner({ title, subtitle, stats }: Props) {
  return (
    <div className="pt-[72px] bg-[#1A1714] text-white pb-12 px-12">
      <div className="max-w-[900px] pt-12">
        <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">Collections</div>
        <h1 className="font-serif text-[clamp(36px,5vw,64px)] font-light leading-[1.1] mb-4">{title}</h1>
        <p className="text-[14px] font-light text-white/55 max-w-[480px] leading-[1.8] mb-10">{subtitle}</p>
        <div className="flex gap-10">
          {stats.map(s => (
            <div key={s.label}>
              <div className="font-serif text-[28px] font-light text-[#C8A96E]">{s.num}</div>
              <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-white/45 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
