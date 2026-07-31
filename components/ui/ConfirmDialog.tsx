// components/ui/ConfirmDialog.tsx
'use client'
import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Styles the confirm button as destructive (red) rather than gold. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// ponytail: native <dialog> — free focus trap, Esc handling, top-layer stacking
// and ::backdrop. No a11y wiring or portal library needed.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      // Esc and backdrop-click both route through onCancel so state stays in sync.
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel()
      }}
      aria-labelledby="confirm-dialog-title"
      className="
        m-auto w-[min(340px,calc(100vw-2rem))] rounded-[8px] border border-warm-gray
        bg-white p-5 text-dark shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)]
        backdrop:bg-black/45 backdrop:backdrop-blur-[2px]
        open:animate-[popupIn_180ms_cubic-bezier(0.16,1,0.3,1)]
        motion-reduce:open:animate-none
      "
    >
      <h2
        id="confirm-dialog-title"
        className="font-serif text-[19px] leading-tight tracking-[0.2px] mb-1.5"
      >
        {title}
      </h2>
      <p className="text-[11.5px] leading-relaxed text-dark/70 mb-4">{message}</p>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-[9px] text-[10px] tracking-[1.2px] uppercase rounded-[5px] border border-warm-gray text-mid-gray hover:border-mid-gray hover:text-dark transition-colors cursor-pointer font-sans"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className={`flex-1 py-[9px] text-[10px] tracking-[1.2px] uppercase rounded-[5px] text-white transition-colors cursor-pointer font-sans ${
            destructive ? 'bg-gold hover:opacity-90' : 'bg-dark hover:bg-[#2e2c2a]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
