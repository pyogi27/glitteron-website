'use client'

interface LightToggleProps {
  on: boolean
  onChange: (on: boolean) => void
  /** Rendered next to the switch; hidden when false */
  label?: string
}

export default function LightToggle({ on, onChange, label = 'Light' }: LightToggleProps) {
  // Deliberately not a <label>: label activation forwards a second click to the
  // inner button, which cancels the toggle out. The wrapper owns the click so the
  // text stays clickable, and the button is a passive visual target.
  return (
    <span
      className="flex items-center gap-2 select-none cursor-pointer"
      onClick={() => onChange(!on)}
    >
      {label && (
        <span className="text-[12px] tracking-[0.04em] text-[#5C4A3A]">{label}:</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? 'Turn product light off' : 'Turn product light on'}
        className={`relative w-[42px] h-[22px] rounded-full border transition-colors duration-300 outline-none
          focus-visible:ring-2 focus-visible:ring-[#C4714A] focus-visible:ring-offset-1
          ${on
            ? 'bg-[#E8A87C]/45 border-[#C4714A]'
            : 'bg-transparent border-[#5C1A1A]/45'
          }`}
      >
        {/* Glow behind the knob when lit */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-0'}`}
          style={{ boxShadow: '0 0 10px 1px rgba(232,168,124,0.75)' }}
        />
        <span
          aria-hidden="true"
          className={`absolute top-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full bg-[#5C1A1A]
            transition-[left,background-color] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
            ${on ? 'left-[23px] bg-[#C4714A]' : 'left-[2px]'}`}
        />
      </button>
    </span>
  )
}
