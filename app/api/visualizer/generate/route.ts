// app/api/visualizer/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateComposite } from '@/lib/ai/adapter'
import type { AIGenerateRequest } from '@/lib/ai/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024  // 5 MB
const BACKEND = process.env.API_URL ?? 'http://localhost:3000'

// Logged-in users only, 4 generations per rolling 24h — enforced against the
// backend's persistent count so it can't be bypassed by calling this route directly.
async function consumeVisualizerQuota(authorization: string | null): Promise<NextResponse | null> {
  if (!authorization) {
    return NextResponse.json({ error: 'Sign in to use the room visualizer' }, { status: 401 })
  }

  let backendRes: Response
  try {
    backendRes = await fetch(`${BACKEND}/api/v1/visualizer/usage`, {
      method: 'POST',
      headers: { authorization, 'Content-Type': 'application/json' },
    })
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
  }

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: data.message ?? 'Visualizer quota check failed', resetAt: data.resetAt },
      { status: backendRes.status },
    )
  }

  return null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { imageDataUrl?: string; productImageUrl?: string; productName?: string; productCategory?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { imageDataUrl, productImageUrl, productName, productCategory } = body

  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 })
  }
  if (!productImageUrl || typeof productImageUrl !== 'string') {
    return NextResponse.json({ error: 'productImageUrl is required' }, { status: 400 })
  }
  if (!productName || typeof productName !== 'string') {
    return NextResponse.json({ error: 'productName is required' }, { status: 400 })
  }

  // Parse "data:<mime>;base64,<data>"
  const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)
  if (!match) {
    return NextResponse.json(
      { error: 'imageDataUrl must be a JPEG, PNG, or WebP base64 data URL' },
      { status: 400 }
    )
  }

  const roomMimeType = match[1] as AIGenerateRequest['roomMimeType']
  const roomImageBase64 = match[2]

  const byteLen = Math.ceil((roomImageBase64.length * 3) / 4)
  if (byteLen > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `Image is too large (~${Math.round(byteLen / 1024 / 1024)} MB). Maximum is 5 MB.` },
      { status: 413 }
    )
  }

  // Quota consumed only once the request is known-valid, so a malformed
  // request never costs the user one of their 4 daily generations.
  const quotaError = await consumeVisualizerQuota(req.headers.get('authorization'))
  if (quotaError) return quotaError

  try {
    const result = await generateComposite({ roomImageBase64, roomMimeType, productImageUrl, productName, productCategory: productCategory ?? 'Pendant Light' })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/visualizer/generate] inpainting failed:', err)
    return NextResponse.json(
      { error: 'AI generation failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }
}
