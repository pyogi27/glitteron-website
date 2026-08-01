import { NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX = { name: 120, email: 200, phone: 30, topic: 60, message: 4000 }

interface ContactPayload {
  name: string
  email: string
  phone: string
  topic: string
  message: string
}

function parse(body: unknown): ContactPayload | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const payload: ContactPayload = {
    name: str(b.name),
    email: str(b.email),
    phone: str(b.phone),
    topic: str(b.topic),
    message: str(b.message),
  }

  if (payload.name.length < 2 || payload.name.length > MAX.name) return null
  if (!EMAIL_RE.test(payload.email) || payload.email.length > MAX.email) return null
  if (payload.phone.length > MAX.phone) return null
  if (payload.topic.length > MAX.topic) return null
  if (payload.message.length < 10 || payload.message.length > MAX.message) return null

  return payload
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const payload = parse(body)
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid submission' }, { status: 400 })
  }

  // ponytail: enquiries go to the server log until a mail provider is wired up.
  // Swap this line for a Resend/SES call — the validated `payload` is the contract.
  console.info('[contact] enquiry', payload)

  return NextResponse.json({ success: true })
}
