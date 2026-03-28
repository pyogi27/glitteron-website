// components/visualizer/ScanOverlay.tsx
// Pure visual overlay — shown during step 3 (Analyse) for ~2.7s

export default function ScanOverlay() {
  return (
    <div className="absolute inset-0 bg-[rgba(244,241,237,0.74)] backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-40">
      <div className="viz-scan-line" />
      <p className="font-serif text-lg italic z-10">Reading your space…</p>
      <p className="text-[10.5px] tracking-[1.5px] uppercase text-mid-gray z-10">
        Detecting ceiling · style · lighting zones
      </p>
      <div className="flex gap-1.5 z-10">
        {([0, 1, 2] as const).map((i) => (
          <span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-gold"
            style={{
              animation: 'vizDot 0.85s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
