export default function TickerStrip() {
  const items = ['Handcrafted Chandeliers', 'Free Delivery Above ₹15,000', '5-Year Warranty', '12,000+ Happy Customers', 'Expert Installation Available', '500+ Designs In Stock']
  return (
    <div className="bg-[#2C2825] text-[#C4714A] flex items-center overflow-hidden py-3.5">
      <div className="flex gap-16 animate-[ticker_18s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={`${item}-${i}`} className="text-[11px] font-medium tracking-[0.18em] uppercase flex items-center gap-4">
            {item} <span className="text-[#A09488]">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
