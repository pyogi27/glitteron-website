import { testimonials } from '@/lib/data'
import StarRating from '@/components/ui/StarRating'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

export default function ReviewsSection() {
  return (
    <section className="py-[100px] px-12 bg-[#FAFAF8]">
      <RevealOnScroll className="text-center mb-14">
        <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">Testimonials</div>
        <h2 className="font-serif text-[clamp(32px,4vw,48px)] font-light">
          Loved by <em className="italic">12,000+</em> homes
        </h2>
      </RevealOnScroll>
      <div className="grid grid-cols-3 gap-7 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <RevealOnScroll key={t.id} delay={i * 0.12} className="bg-[#F4F1EB] rounded-2xl p-8 flex flex-col">
            <StarRating rating={t.rating} size={14} />
            <p className="font-serif text-[18px] italic leading-[1.7] text-[#2C2825] mt-5 flex-1">&ldquo;{t.text}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8E4DC] border border-[#E8E4DC] flex items-center justify-center font-serif text-[15px] text-[#9A7840]">
                {t.author[0]}
              </div>
              <div>
                <div className="text-[13px] font-medium text-[#1A1714]">{t.author}</div>
                <div className="text-[11px] text-[#9A958C]">{t.location}</div>
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  )
}
