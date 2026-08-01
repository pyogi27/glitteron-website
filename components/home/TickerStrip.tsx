'use client'
import { useEffect, useState } from 'react'

const items = ['Handcrafted Chandeliers', 'Free Delivery Above ₹15,000', '5-Year Warranty', '12,000+ Happy Customers', 'Expert Installation Available', '500+ Designs In Stock']

export default function TickerStrip() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // ponytail: hero is full-viewport, so viewport height is the reveal threshold
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={`fixed top-header left-0 right-0 z-[90] bg-[#EDE8E0] border-b border-[#D8D0C4] flex items-center overflow-hidden py-3.5 transition-transform duration-500 ${
        visible ? 'translate-y-0' : '-translate-y-[calc(100%+var(--spacing-header))]'
      }`}
    >
      <div className="flex gap-16 animate-[ticker_18s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={`${item}-${i}`} className="text-[11px] font-medium tracking-[0.18em] uppercase flex items-center gap-4 text-[#A8552C]">
            {item} <span className="text-[#8B7D6E]">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
