// components/visualizer/StepBar.tsx
'use client'
import { useVisualizerStore, type VisualizerStep } from '@/lib/stores/visualizerStore'

const STEPS: { n: VisualizerStep; label: string }[] = [
  { n: 1, label: 'Room' },
  { n: 2, label: 'Upload' },
  { n: 4, label: 'Select' },
  { n: 5, label: 'Visualise' },
  { n: 6, label: 'Generate' },
]

export default function StepBar() {
  const step = useVisualizerStore((s) => s.step)

  return (
    <div className="bg-white border-b border-warm-gray flex items-center justify-center h-[42px] gap-0 shrink-0">
      {STEPS.map((s, i) => {
        const isDone = step > s.n
        const isActive = step === s.n
        return (
          <div key={s.n} className="flex items-center">
            {i > 0 && (
              <div className={`w-10 h-px mx-2.5 ${isDone ? 'bg-gold' : 'bg-warm-gray'}`} />
            )}
            <div
              className={`flex items-center gap-2 text-[10.5px] tracking-[1.4px] uppercase transition-colors duration-200 ${
                isDone
                  ? 'text-gold'
                  : isActive
                  ? 'text-dark'
                  : 'text-mid-gray'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-all duration-200 ${
                  isDone
                    ? 'bg-gold border-gold text-white'
                    : isActive
                    ? 'bg-dark border-dark text-white'
                    : 'border-current'
                }`}
              >
                {isDone ? '✓' : s.n}
              </div>
              <span>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
