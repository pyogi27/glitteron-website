import RevealOnScroll from '@/components/ui/RevealOnScroll'

const stats = [
  { num: '12K+', label: 'Happy Customers' },
  { num: '500+', label: 'Designs In Stock' },
  { num: '5yr', label: 'Warranty' },
  { num: '98%', label: 'Satisfaction Rate' },
]

export default function StatsDivider() {
  return (
    <div className="bg-[#EDE8E0] py-14 px-4 md:px-12">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-7">
        {/* Card surface was #E2DAD0 on #EDE8E0 — 1.13:1, so the cards read as
            smudges. A border carries the edge instead. Label was #8B7D6E at
            2.89:1, below the 4.5:1 AA floor. */}
        {stats.map((s, i) => (
          <RevealOnScroll key={s.num} delay={i * 0.1} className="bg-[#E6DFD5] border border-[#CFC5B6] rounded-2xl p-8 text-center">
            <div className="font-serif text-[clamp(36px,4vw,52px)] font-light text-[#2C2825] leading-none mb-2">{s.num}</div>
            <div className="text-[12px] font-medium tracking-[0.16em] uppercase text-[#5A5249]">{s.label}</div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  )
}
