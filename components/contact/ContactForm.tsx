'use client'

import { useState, FormEvent } from 'react'
import { COMPANY } from '@/lib/company'

const TOPICS = [
  'Product question',
  'Order status',
  'Installation help',
  'Returns & warranty',
  'Trade / bulk enquiry',
  'Something else',
] as const

interface FormValues {
  name: string
  email: string
  phone: string
  topic: string
  message: string
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

const EMPTY: FormValues = { name: '', email: '', phone: '', topic: TOPICS[0], message: '' }

// Deliberately permissive — real validation happens server side.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[\d\s+()-]{7,20}$/

export function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {}

  if (values.name.trim().length < 2) errors.name = 'Please tell us your name.'
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter an email we can reply to.'
  if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) errors.phone = 'That phone number looks off.'
  if (values.message.trim().length < 10) errors.message = 'A little more detail helps us help you.'

  return errors
}

const INPUT_CLASS =
  'auth-input w-full rounded-lg px-4 py-3 text-[13.5px] font-light bg-[#2C2825]/[0.05] text-[#2C2825]'

function borderFor(hasError: boolean) {
  return { border: `1px solid ${hasError ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}` }
}

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const update = (field: keyof FormValues) => (value: string) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      setStatus('sent')
      setValues(EMPTY)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div
        className="rounded-2xl p-10 text-center bg-[#E2DAD0]"
        role="status"
        aria-live="polite"
      >
        <span className="w-12 h-12 rounded-full bg-[#A8552C]/12 flex items-center justify-center text-[#A8552C] mx-auto mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </span>
        <h3 className="font-serif text-[28px] font-light text-[#2C2825] mb-3">Message received.</h3>
        <p className="text-[14px] leading-[1.8] text-[#5C5449] max-w-[38ch] mx-auto mb-7">
          A real person reads every one of these. Expect a reply within one working day.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="text-[12.5px] font-medium tracking-[0.06em] text-[#A8552C] underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          id="contact-name"
          label="Your name"
          error={errors.name}
          value={values.name}
          onChange={update('name')}
          autoComplete="name"
          placeholder="Ada Lovelace"
        />
        <Field
          id="contact-email"
          label="Email"
          type="email"
          error={errors.email}
          value={values.email}
          onChange={update('email')}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          id="contact-phone"
          label="Phone (optional)"
          type="tel"
          error={errors.phone}
          value={values.phone}
          onChange={update('phone')}
          autoComplete="tel"
          placeholder="+91 98765 43210"
        />
        <div>
          <Label htmlFor="contact-topic">What is this about?</Label>
          <select
            id="contact-topic"
            name="topic"
            value={values.topic}
            onChange={e => update('topic')(e.target.value)}
            className={`${INPUT_CLASS} h-12`}
            style={borderFor(false)}
          >
            {TOPICS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          value={values.message}
          onChange={e => update('message')(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={`${INPUT_CLASS} resize-y leading-[1.7]`}
          style={borderFor(Boolean(errors.message))}
          placeholder="Ceiling height, room size, the fixture you are eyeing — the more you tell us, the better the answer."
        />
        <FieldError id="contact-message-error" message={errors.message} />
      </div>

      {status === 'error' && (
        <p role="alert" className="text-[12.5px] text-[#A8552C] leading-[1.7]">
          Something went wrong sending that. Please try again, or email us directly at{' '}
          <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-4">
            {COMPANY.email}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center gap-2.5 rounded-full bg-[#2C2825] px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-[#EDE8E0] transition-colors duration-200 hover:bg-[#A8552C] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
        {status !== 'sending' && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </button>

      <p className="text-[11.5px] leading-[1.7] text-[#8B7D6E]">
        We reply within one working day, Monday to Saturday. We never share your details.
      </p>
    </form>
  )
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2 text-[#2C2825]"
    >
      {children}
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-[11.5px] text-[#A8552C]">
      {message}
    </p>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  autoComplete?: string
  placeholder?: string
}

function Field({ id, label, value, onChange, error, type = 'text', autoComplete, placeholder }: FieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={INPUT_CLASS}
        style={borderFor(Boolean(error))}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
