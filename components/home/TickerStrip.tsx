export default function TickerStrip() {
  const items = ['Handcrafted Chandeliers', 'Free Delivery Above ₹15,000', '5-Year Warranty', '12,000+ Happy Customers', 'Expert Installation Available', '500+ Designs In Stock']
  return (
    <div className="bg-[#1A1714] text-[#C8A96E] flex items-center overflow-hidden py-3.5">
      <div className="flex gap-16 animate-[ticker_18s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={`${item}-${i}`} className="text-[11px] font-medium tracking-[0.18em] uppercase flex items-center gap-4">
            {item} <span className="text-[#9A958C]">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
