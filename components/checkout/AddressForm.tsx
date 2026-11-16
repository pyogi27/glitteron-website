'use client'

import { useEffect, useRef, useState } from 'react'
import { PINCODE_RE, type PincodePlace } from '@/lib/pincode'

export interface AddressFormData {
  fullName: string
  phone: string
  addressLine1: string
  city: string
  state: string
  zipCode: string
  /** Guests only: the receipt and the order link are sent here. */
  email: string
}

interface Props {
  value: AddressFormData
  onChange: (data: AddressFormData) => void
  disabled?: boolean
  showEmail?: boolean
}

type Lookup = 'idle' | 'loading' | 'failed'

export default function AddressForm({ value, onChange, disabled, showEmail }: Props) {
  const set = (field: keyof AddressFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value })

  // The lookup answers ~1s later; merge into the form as it is then, not as it was when
  // the pincode was typed, or anything entered meanwhile would be wiped.
  const latest = useRef(value)
  useEffect(() => { latest.current = value })

  const [lookup, setLookup] = useState<Lookup>('idle')
  const inFlight = useRef<AbortController | null>(null)
  // What the last lookup filled in, so a later failed lookup can clear it rather than
  // leave the previous pincode's city on a new one. Typed values are never cleared.
  const autofilled = useRef<PincodePlace | null>(null)
  useEffect(() => () => inFlight.current?.abort(), [])

  // Runs on typing only, so a saved address prefilled from the account is left alone.
  async function lookUp(pin: string) {
    inFlight.current?.abort()
    const ctrl = new AbortController()
    inFlight.current = ctrl
    setLookup('loading')
    try {
      const res = await fetch(`/api/pincode/${pin}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(String(res.status))
      const { city, state } = (await res.json()) as PincodePlace
      if (latest.current.zipCode.trim() !== pin) return // pincode changed while we waited
      autofilled.current = { city, state }
      onChange({ ...latest.current, city, state })
      setLookup('idle')
    } catch (err) {
      if (ctrl.signal.aborted) return
      // Manual fallback: the fields stay editable, the hint asks for them.
      console.error('[checkout] pincode lookup failed', pin, err instanceof Error ? err.message : err)
      const prev = autofilled.current
      const cur = latest.current
      if (prev && cur.city === prev.city && cur.state === prev.state) {
        onChange({ ...cur, city: '', state: '' })
      }
      autofilled.current = null
      setLookup('failed')
    }
  }

  function onPincode(e: React.ChangeEvent<HTMLInputElement>) {
    const zipCode = e.target.value.replace(/\D/g, '').slice(0, 6)
    onChange({ ...value, zipCode })
    if (PINCODE_RE.test(zipCode)) lookUp(zipCode)
    else {
      inFlight.current?.abort()
      setLookup('idle')
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#D8D0C4] bg-white text-[14px] text-[#2C2825] placeholder-[#C4B8AC] focus:outline-none focus:border-[#C9A84C] transition-colors disabled:opacity-50"
  const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488] mb-1.5"

  return (
    <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-5 md:p-8">
      <h2 className="font-serif text-[28px] leading-[1.1] text-[#2C2825] mb-6">Shipping Address</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} value={value.fullName} onChange={set('fullName')} placeholder="John Doe" disabled={disabled} />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input className={inputClass} value={value.phone} onChange={set('phone')} placeholder="9876543210" disabled={disabled} />
          </div>
        </div>
        {showEmail && (
          <div>
            <label htmlFor="checkout-email" className={labelClass}>Email *</label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={inputClass}
              value={value.email}
              onChange={set('email')}
              placeholder="you@example.com"
              disabled={disabled}
              aria-describedby="checkout-email-hint"
            />
            <p id="checkout-email-hint" className="text-[12px] text-[#A09488] mt-1.5">
              We&apos;ll send your receipt and a link to view your order here.
            </p>
          </div>
        )}
        <div>
          <label className={labelClass}>Address Line *</label>
          <input className={inputClass} value={value.addressLine1} onChange={set('addressLine1')} placeholder="123 Main Street" disabled={disabled} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="checkout-pincode" className={labelClass}>Pincode *</label>
            <input
              id="checkout-pincode"
              className={inputClass}
              value={value.zipCode}
              onChange={onPincode}
              placeholder="400001"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              disabled={disabled}
              aria-describedby="checkout-pincode-hint"
            />
          </div>
          <div>
            <label htmlFor="checkout-city" className={labelClass}>City *</label>
            <input id="checkout-city" className={inputClass} value={value.city} onChange={set('city')} placeholder="Mumbai" autoComplete="address-level2" disabled={disabled} />
          </div>
          <div>
            <label htmlFor="checkout-state" className={labelClass}>State *</label>
            <input id="checkout-state" className={inputClass} value={value.state} onChange={set('state')} placeholder="Maharashtra" autoComplete="address-level1" disabled={disabled} />
          </div>
        </div>
        <p id="checkout-pincode-hint" role="status" aria-live="polite" className="text-[12px] text-[#A09488] -mt-1 min-h-[18px]">
          {lookup === 'loading' && 'Finding your city and state…'}
          {lookup === 'failed' && "We couldn't find that pincode. Please enter your city and state."}
          {lookup === 'idle' && 'City and state fill in from your pincode.'}
        </p>
      </div>
    </div>
  )
}
