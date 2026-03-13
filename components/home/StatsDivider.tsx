import RevealOnScroll from '@/components/ui/RevealOnScroll'

const stats = [
  { num: '12K+', label: 'Happy Customers' },
  { num: '500+', label: 'Designs In Stock' },
  { num: '5yr', label: 'Warranty' },
  { num: '98%', label: 'Satisfaction Rate' },
]

export default function StatsDivider() {
  return (
    <div className="bg-[#E8E4DC] py-14 px-12">
      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <RevealOnScroll key={s.num} delay={i * 0.1} className="text-center">
            <div className="font-serif text-[clamp(36px,4vw,52px)] font-light text-[#1A1714] leading-none mb-2">{s.num}</div>
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#9A958C]">{s.label}</div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  )
}
