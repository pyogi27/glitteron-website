'use client'

export interface AddressFormData {
  fullName: string
  phone: string
  addressLine1: string
  city: string
  state: string
  zipCode: string
}

interface Props {
  value: AddressFormData
  onChange: (data: AddressFormData) => void
  disabled?: boolean
}

export default function AddressForm({ value, onChange, disabled }: Props) {
  const set = (field: keyof AddressFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value })

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
        <div>
          <label className={labelClass}>Address Line *</label>
          <input className={inputClass} value={value.addressLine1} onChange={set('addressLine1')} placeholder="123 Main Street" disabled={disabled} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>City *</label>
            <input className={inputClass} value={value.city} onChange={set('city')} placeholder="Mumbai" disabled={disabled} />
          </div>
          <div>
            <label className={labelClass}>State *</label>
            <input className={inputClass} value={value.state} onChange={set('state')} placeholder="Maharashtra" disabled={disabled} />
          </div>
          <div>
            <label className={labelClass}>Pincode *</label>
            <input className={inputClass} value={value.zipCode} onChange={set('zipCode')} placeholder="400001" disabled={disabled} />
          </div>
        </div>
      </div>
    </div>
  )
}
