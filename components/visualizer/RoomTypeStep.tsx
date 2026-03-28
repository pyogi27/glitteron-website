// components/visualizer/RoomTypeStep.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { ROOM_TYPE_OPTIONS } from '@/lib/data/visualizer'

export default function RoomTypeStep() {
  const setRoomType = useVisualizerStore((s) => s.setRoomType)

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 bg-offwhite">
      <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-3 font-sans">
        Step 1 of 5
      </p>
      <h1 className="font-serif text-3xl mb-2 text-dark text-center">
        What room are we lighting?
      </h1>
      <p className="text-sm text-mid-gray mb-10 text-center max-w-sm">
        We&apos;ll tailor fixture suggestions to your room type before you upload.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-3xl">
        {ROOM_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setRoomType(opt.label)}
            className="flex flex-col items-center gap-3 p-5 rounded-lg border border-warm-gray bg-white hover:border-gold hover:bg-[rgba(196,113,74,0.06)] transition-all duration-200 cursor-pointer"
          >
            <span className="text-3xl">{opt.icon}</span>
            <div>
              <div className="font-serif text-sm text-dark mb-1 text-center">
                {opt.label}
              </div>
              <div className="text-[10px] text-mid-gray text-center leading-snug">
                {opt.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
