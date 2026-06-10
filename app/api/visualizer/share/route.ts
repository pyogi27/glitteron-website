// app/api/visualizer/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import path from 'path'
import type { SharePayload, ShareResult } from '@/lib/ai/types'

const SHARE_DIR = path.join('/tmp', 'viz-shares')
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

async function ensureDir(): Promise<void> {
  await mkdir(SHARE_DIR, { recursive: true })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: SharePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!payload.compositeImageUrl || !payload.roomType) {
    return NextResponse.json(
      { error: 'compositeImageUrl and roomType are required' },
      { status: 400 }
    )
  }

  const id = crypto.randomUUID()

  try {
    await ensureDir()
    await writeFile(
      path.join(SHARE_DIR, `${id}.json`),
      JSON.stringify({ ...payload, id }),
      'utf-8'
    )
  } catch (err) {
    console.error('[/api/visualizer/share] write failed:', err)
    return NextResponse.json({ error: 'Failed to save visualization' }, { status: 500 })
  }

  const origin = req.headers.get('origin') ?? ''
  const result: ShareResult = {
    id,
    url: `${origin}/room-visualizer/share/${id}`,
  }
  return NextResponse.json(result, { status: 201 })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id') ?? ''

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Valid UUID id query param required' }, { status: 400 })
  }

  try {
    const raw = await readFile(path.join(SHARE_DIR, `${id}.json`), 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
  }
}
