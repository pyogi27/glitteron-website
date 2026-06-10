// components/visualizer/UploadStep.tsx
'use client'
import { useRef } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'

export default function UploadStep() {
  const fileRef = useRef<HTMLInputElement>(null)
  const prevUrlRef = useRef<string | null>(null)
  const roomType = useVisualizerStore((s) => s.roomType)
  const setImage = useVisualizerStore((s) => s.setImage)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return

    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    prevUrlRef.current = objectUrl

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      setImage(objectUrl, dataUrl, false)
    }
    reader.readAsDataURL(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function runDemo() {
    // Demo mode: no real image, dataUrl is null
    setImage('', null, true)
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 bg-offwhite gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[9.5px] tracking-[2px] uppercase text-mid-gray">Room selected:</span>
        <span className="text-[9.5px] tracking-[1.5px] uppercase text-gold font-medium border border-gold rounded-full px-3 py-0.5">
          {roomType}
        </span>
      </div>

      <h2 className="font-serif text-2xl text-dark">Upload your room photo</h2>

      <div
        className="w-80 h-56 border-[1.5px] border-dashed border-warm-gray rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 hover:border-gold hover:bg-[rgba(196,113,74,0.06)]"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <svg viewBox="0 0 24 24" className="w-9 h-9 stroke-mid-gray fill-none" strokeWidth={1.2}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <div className="font-serif text-lg text-dark">Drop your room photo</div>
        <div className="text-[11.5px] text-mid-gray text-center leading-relaxed">
          Bedroom · Living room · Dining room
        </div>
        <div className="flex gap-1.5">
          {(['JPG', 'PNG', 'WEBP'] as const).map((f) => (
            <span
              key={f}
              className="text-[9px] tracking-[1.5px] uppercase border border-warm-gray px-2 py-0.5 text-mid-gray rounded-sm"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={runDemo}
        className="text-[11px] text-gold underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        → Try the interactive demo
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
