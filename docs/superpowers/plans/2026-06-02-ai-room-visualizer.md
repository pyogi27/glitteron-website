# AI Room Inpainting Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user selects a product and clicks "Generate AI Preview", send their room photo + the product's AR image to an AI inpainting API and display the photorealistic composite result, then let them save a shareable link.

**Architecture:** No room analysis step. The existing 5-step flow (Room → Upload → Analyse → Select → Visualise) keeps steps 1, 2, and 4 unchanged. Step 3 ("Analyse") is removed from the StepBar — after upload the user goes directly to step 4 (product selection). Step 5 ("Visualise") becomes the drag-and-drop canvas as today. A new step 6 ("Generate") is added: clicking "Generate AI Preview" in RightPanel POSTs the room image (as base64) + the product's `arImages` URL to a new server-side Next.js route `/api/visualizer/generate`, which calls a provider-agnostic inpainting adapter. The result URL replaces the canvas background and fixture overlays are hidden. A "Share" button saves the result and returns a `/room-visualizer/share/[id]` public page. The AI generation provider is swappable via `AI_GENERATION_PROVIDER` env var (default: `replicate`, alternative: `openai`).

**Tech Stack:** Next.js 16 App Router, TypeScript, Zustand (`visualizerStore`), Replicate SDXL-inpainting (via REST polling), Next.js API routes (API key server-side only), `crypto.randomUUID()` + `fs` for share storage (dev), public share page as a server component.

---

## What changes and what stays the same

| Component | Change |
|-----------|--------|
| `StepBar` | Remove step 3 "Analyse", add step 6 "Generate" — steps become: Room · Upload · Select · Visualise · Generate |
| `CanvasArea` | Remove the mock scan `useEffect` entirely. Add generated image display at step 6. |
| `UploadStep` | Capture base64 data URL alongside the object URL (needed for API call) |
| `RightPanel` | Add "Generate AI Preview" button + share UI at the bottom |
| `visualizerStore` | `VisualizerStep` becomes `1|2|4|5|6` (skip 3). Add `imageDataUrl`, `generatedImageUrl`, share state |
| `app/api/visualizer/generate/route.ts` | **New** — server-side inpainting call |
| `app/api/visualizer/share/route.ts` | **New** — POST save + GET fetch |
| `app/room-visualizer/share/[id]/page.tsx` | **New** — public share page |
| `lib/ai/types.ts` | **New** — shared request/response interfaces |
| `lib/ai/adapter.ts` | **New** — provider dispatch (reads `AI_GENERATION_PROVIDER` env var) |
| `lib/ai/providers/replicate.ts` | **New** — Replicate SDXL inpainting (stub + real) |
| `lib/ai/providers/openai.ts` | **New** — OpenAI stub (throws until implemented) |
| All other visualizer components | **Unchanged** |

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| **Create** | `lib/ai/types.ts` | Shared TS interfaces for generate + share |
| **Create** | `lib/ai/providers/replicate.ts` | Replicate SDXL inpainting (stub + real behind env flag) |
| **Create** | `lib/ai/providers/openai.ts` | OpenAI stub (throws, placeholder for future) |
| **Create** | `lib/ai/adapter.ts` | Dispatch to correct provider via `AI_GENERATION_PROVIDER` env var |
| **Create** | `app/api/visualizer/generate/route.ts` | POST: base64 room + product AR URL → composite image URL |
| **Create** | `app/api/visualizer/share/route.ts` | POST: save result JSON; GET: fetch by id |
| **Create** | `app/room-visualizer/share/[id]/page.tsx` | Public server-rendered share page |
| **Modify** | `lib/stores/visualizerStore.ts` | Add `imageDataUrl`, generation state, share state; remove step 3; add step 6 |
| **Modify** | `components/visualizer/UploadStep.tsx` | Read file as base64 data URL before calling `setImage` |
| **Modify** | `components/visualizer/CanvasArea.tsx` | Remove mock scan `useEffect`; show generated image at step 6; skip step 3 |
| **Modify** | `components/visualizer/StepBar.tsx` | Remove step 3 "Analyse", add step 6 "Generate" |
| **Modify** | `components/visualizer/RightPanel.tsx` | Add `GenerateBlock` component with Generate + Share buttons |

---

## Task 1: Define shared AI types

**Files:**
- Create: `lib/ai/types.ts`

- [ ] **Step 1: Create `lib/ai/types.ts`**

```ts
// lib/ai/types.ts

export interface AIGenerateRequest {
  roomImageBase64: string                                        // raw base64, no data: prefix
  roomMimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  productImageUrl: string                                        // public URL of product arImages
  productName: string
}

export interface AIGenerateResponse {
  compositeImageUrl: string   // data URL or remote URL of the inpainted result
  provider: string            // which provider produced it
}

export interface SharePayload {
  roomType: string
  compositeImageUrl: string
  products: Array<{
    id: number
    name: string
    price: string
    thumb: string
  }>
  createdAt: string           // ISO string
}

export interface ShareResult {
  id: string
  url: string                 // e.g. /room-visualizer/share/<id>
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add lib/ai/types.ts && git commit -m "feat(visualizer): add shared AI inpainting types"
```

---

## Task 2: Replicate inpainting provider

**Files:**
- Create: `lib/ai/providers/replicate.ts`

Starts as a stub (returns original room image unchanged) so the rest of the pipeline can be built and tested before you have a Replicate API key. Set `ENABLE_AI_GENERATION=true` to activate the real call.

- [ ] **Step 1: Create `lib/ai/providers/replicate.ts`**

```ts
// lib/ai/providers/replicate.ts
import type { AIGenerateRequest, AIGenerateResponse } from '@/lib/ai/types'

type ReplicatePrediction = {
  id: string
  urls: { get: string }
  status: string
  output?: string[]
  error?: string
}

export async function generateCompositeWithReplicate(
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const useReal = process.env.ENABLE_AI_GENERATION === 'true'

  if (!useReal) {
    // Stub: return the original room image so the UI pipeline works end-to-end
    return {
      compositeImageUrl: `data:${req.roomMimeType};base64,${req.roomImageBase64}`,
      provider: 'replicate-stub',
    }
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN is not set in environment')

  // SDXL-inpainting on Replicate
  // Model: stability-ai/stable-diffusion-inpainting
  const startRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'c11bac58203367db93a3c552bd49a25a5567e5e1a432f9b5836e67e4e8e2e43e',
      input: {
        image: `data:${req.roomMimeType};base64,${req.roomImageBase64}`,
        // Use the product AR image as the inpainting reference
        inpaint_image: req.productImageUrl,
        prompt: `A ${req.productName} hanging from the ceiling, photorealistic interior design photo, high quality lighting fixture`,
        negative_prompt: 'blurry, cartoon, unrealistic, low quality, distorted',
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    }),
  })

  if (!startRes.ok) {
    const body = await startRes.text()
    throw new Error(`Replicate prediction start failed (${startRes.status}): ${body}`)
  }

  const prediction = await startRes.json() as ReplicatePrediction

  // Poll every 3 seconds, up to 20 attempts (60s total)
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 3000))

    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${token}` },
    })
    const polled = await pollRes.json() as ReplicatePrediction

    if (polled.status === 'succeeded' && polled.output?.[0]) {
      return { compositeImageUrl: polled.output[0], provider: 'replicate' }
    }
    if (polled.status === 'failed') {
      throw new Error(`Replicate inpainting failed: ${polled.error ?? 'unknown error'}`)
    }
  }

  throw new Error('Replicate inpainting timed out after 60 seconds')
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add lib/ai/providers/replicate.ts && git commit -m "feat(visualizer): add Replicate inpainting provider (stub + real)"
```

---

## Task 3: OpenAI stub + provider adapter

**Files:**
- Create: `lib/ai/providers/openai.ts`
- Create: `lib/ai/adapter.ts`

The OpenAI file is a stub so the import in `adapter.ts` doesn't fail at runtime when `AI_GENERATION_PROVIDER=openai` is set. The adapter reads the env var and dispatches.

- [ ] **Step 1: Create `lib/ai/providers/openai.ts`**

```ts
// lib/ai/providers/openai.ts
import type { AIGenerateRequest, AIGenerateResponse } from '@/lib/ai/types'

export async function generateCompositeWithOpenAI(
  _req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  throw new Error(
    'OpenAI inpainting provider is not yet implemented. Set AI_GENERATION_PROVIDER=replicate.'
  )
}
```

- [ ] **Step 2: Create `lib/ai/adapter.ts`**

```ts
// lib/ai/adapter.ts
import type { AIGenerateRequest, AIGenerateResponse } from '@/lib/ai/types'

export async function generateComposite(
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const provider = process.env.AI_GENERATION_PROVIDER ?? 'replicate'

  if (provider === 'replicate') {
    const { generateCompositeWithReplicate } = await import('./providers/replicate')
    return generateCompositeWithReplicate(req)
  }

  if (provider === 'openai') {
    const { generateCompositeWithOpenAI } = await import('./providers/openai')
    return generateCompositeWithOpenAI(req)
  }

  throw new Error(
    `Unknown AI_GENERATION_PROVIDER: "${provider}". Valid values: "replicate", "openai".`
  )
}
```

- [ ] **Step 3: Add env vars to `.env.local`**

Open `.env.local` and append:

```
AI_GENERATION_PROVIDER=replicate
ENABLE_AI_GENERATION=false
# REPLICATE_API_TOKEN=r8_...your-key-here...
```

- [ ] **Step 4: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add lib/ai/providers/openai.ts lib/ai/adapter.ts && git commit -m "feat(visualizer): add provider adapter with OpenAI stub and Replicate dispatch"
```

---

## Task 4: `/api/visualizer/generate` route

**Files:**
- Create: `app/api/visualizer/generate/route.ts`

Server-side POST. Validates input, strips data-URL prefix, enforces 5 MB limit, calls `generateComposite()`, returns `{ compositeImageUrl, provider }`.

- [ ] **Step 1: Create the route**

```ts
// app/api/visualizer/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateComposite } from '@/lib/ai/adapter'
import type { AIGenerateRequest } from '@/lib/ai/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024  // 5 MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { imageDataUrl?: string; productImageUrl?: string; productName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { imageDataUrl, productImageUrl, productName } = body

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

  try {
    const result = await generateComposite({ roomImageBase64, roomMimeType, productImageUrl, productName })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/visualizer/generate] inpainting failed:', err)
    return NextResponse.json(
      { error: 'AI generation failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Build check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npm run build 2>&1 | grep "visualizer"
```

Expected: `ƒ /api/visualizer/generate` in the output.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add app/api/visualizer/generate/route.ts && git commit -m "feat(visualizer): add /api/visualizer/generate server route"
```

---

## Task 5: `/api/visualizer/share` route

**Files:**
- Create: `app/api/visualizer/share/route.ts`

POST saves a `SharePayload` JSON to `/tmp/viz-shares/<uuid>.json`. GET fetches by `?id=`. Both validate the UUID to prevent path traversal.

- [ ] **Step 1: Create the route**

```ts
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
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add app/api/visualizer/share/route.ts && git commit -m "feat(visualizer): add /api/visualizer/share route (POST save, GET fetch)"
```

---

## Task 6: Public share page

**Files:**
- Create: `app/room-visualizer/share/[id]/page.tsx`

Server component. Fetches the saved payload by UUID, renders the composite image and product list publicly (no auth needed). UUID is validated server-side before any file read.

- [ ] **Step 1: Create the page**

```tsx
// app/room-visualizer/share/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import type { SharePayload } from '@/lib/ai/types'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Room Visualization — LitmeUp',
    description: `See how LitmeUp fixtures look in a real room. Share ID: ${id}`,
    openGraph: {
      title: 'My Room Lighting Preview — LitmeUp',
      description: 'I used the LitmeUp AI visualizer to preview lighting in my room.',
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-[#EDE8E0]">
        <p className="font-serif text-2xl text-[#2C2825]">Invalid share link.</p>
      </main>
    )
  }

  let payload: SharePayload & { id: string }
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
    const res = await fetch(`${base}/api/visualizer/share?id=${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`${res.status}`)
    payload = await res.json()
  } catch {
    return (
      <main className="flex items-center justify-center min-h-screen bg-[#EDE8E0]">
        <p className="font-serif text-2xl text-[#2C2825]">
          Visualization not found or has expired.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#EDE8E0] py-12 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">
          <p className="text-[9.5px] tracking-[2px] uppercase text-[#A09488] mb-2">
            Room Visualization
          </p>
          <h1 className="font-serif text-3xl text-[#2C2825]">{payload.roomType}</h1>
        </div>

        {/* Composite image */}
        <div className="rounded-xl overflow-hidden shadow-lg mb-8 bg-[#2C2825]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={payload.compositeImageUrl}
            alt="AI-generated room visualization"
            className="w-full object-cover"
          />
        </div>

        {/* Products in visualization */}
        {payload.products.length > 0 && (
          <div className="mb-8">
            <p className="text-[9.5px] tracking-[2px] uppercase text-[#A09488] mb-4">
              Fixtures Used
            </p>
            <div className="flex flex-wrap gap-3">
              {payload.products.map((p) => (
                <Link
                  key={p.id}
                  href="/collections"
                  className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-[#E5DFD8] hover:border-[#C4714A] transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb}
                    alt={p.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div>
                    <div className="font-serif text-sm text-[#2C2825]">{p.name}</div>
                    <div className="text-xs text-[#C4714A]">{p.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/room-visualizer"
            className="inline-block bg-[#2C2825] text-white text-[11px] tracking-[1.5px] uppercase px-8 py-3.5 rounded-[5px] hover:bg-[#3a3734] transition-colors font-sans"
          >
            Try the Visualizer
          </Link>
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_SITE_URL` to `.env.local`**

```
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

(Update to your production domain before deploying.)

- [ ] **Step 3: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 4: Build check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npm run build 2>&1 | grep "visualizer"
```

Expected: `ƒ /room-visualizer/share/[id]` in output.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add "app/room-visualizer/share/[id]/page.tsx" && git commit -m "feat(visualizer): add public share page /room-visualizer/share/[id]"
```

---

## Task 7: Update Zustand store

**Files:**
- Modify: `lib/stores/visualizerStore.ts`

Three changes:
1. `VisualizerStep` becomes `1 | 2 | 4 | 5 | 6` (step 3 removed).
2. `setImage` gains a `dataUrl` parameter.
3. New state fields: `imageDataUrl`, `generatedImageUrl`, `generationError`, `isGenerating`, `shareId`, `shareUrl`, `isSharing`, `shareError`.

- [ ] **Step 1: Replace `lib/stores/visualizerStore.ts`**

```ts
// lib/stores/visualizerStore.ts
import { create } from 'zustand'
import type { VisualizerProduct, RoomAnalysis, RoomType } from '@/lib/data/visualizer'

// Step 3 (Analyse) removed — flow is: 1=RoomType 2=Upload 4=Select 5=Visualise 6=Generate
export type VisualizerStep = 1 | 2 | 4 | 5 | 6

export interface PerspData {
  dScale: number
  dr: number
  conv: number
}

interface VisualizerState {
  // Flow
  step: VisualizerStep
  roomType: RoomType | null

  // Image
  imageUrl: string | null       // object URL for <img> display
  imageDataUrl: string | null   // base64 data URL sent to API
  isDemo: boolean

  // Analysis (kept for ProductPanel display; populated with mock data)
  analysisData: RoomAnalysis | null
  products: VisualizerProduct[]

  // Fixture selection & placement
  selectedProduct: VisualizerProduct | null
  placedProductIds: number[]

  // AI Generation (step 6)
  generatedImageUrl: string | null
  generationError: string | null
  isGenerating: boolean

  // Share
  shareId: string | null
  shareUrl: string | null
  isSharing: boolean
  shareError: string | null

  // Fine-tune controls
  litVal: number
  opVal: number
  cordVal: number
  manVal: number
  nudgeVal: number
  showCone: boolean

  // Perspective data
  perspData: PerspData | null

  // Actions
  setStep: (step: VisualizerStep) => void
  setRoomType: (roomType: RoomType) => void
  setImage: (url: string, dataUrl: string | null, isDemo: boolean) => void
  setAnalysis: (data: RoomAnalysis, products: VisualizerProduct[]) => void
  setSelectedProduct: (product: VisualizerProduct | null) => void
  addPlacedProduct: (id: number) => void
  removePlacedProduct: (id: number) => void
  setGeneratedImage: (url: string) => void
  setGenerationError: (error: string | null) => void
  setIsGenerating: (v: boolean) => void
  setShareResult: (id: string, url: string) => void
  setShareError: (error: string | null) => void
  setIsSharing: (v: boolean) => void
  setLitVal: (v: number) => void
  setOpVal: (v: number) => void
  setCordVal: (v: number) => void
  setManVal: (v: number) => void
  setNudgeVal: (v: number) => void
  toggleCone: () => void
  setPerspData: (data: PerspData) => void
  resetControls: () => void
  resetAll: () => void
}

const initialState = {
  step: 1 as VisualizerStep,
  roomType: null,
  imageUrl: null,
  imageDataUrl: null,
  isDemo: false,
  analysisData: null,
  products: [],
  selectedProduct: null,
  placedProductIds: [],
  generatedImageUrl: null,
  generationError: null,
  isGenerating: false,
  shareId: null,
  shareUrl: null,
  isSharing: false,
  shareError: null,
  litVal: 60,
  opVal: 95,
  cordVal: 50,
  manVal: 0,
  nudgeVal: 0,
  showCone: true,
  perspData: null,
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setRoomType: (roomType) => set({ roomType, step: 2 }),

  // Upload → go directly to step 4 (Select), skip step 3
  setImage: (url, dataUrl, isDemo) =>
    set({ imageUrl: url, imageDataUrl: dataUrl, isDemo, step: 4 }),

  setAnalysis: (analysisData, products) => set({ analysisData, products }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  addPlacedProduct: (id) =>
    set((s) => ({
      placedProductIds: s.placedProductIds.includes(id)
        ? s.placedProductIds
        : [...s.placedProductIds, id],
    })),
  removePlacedProduct: (id) =>
    set((s) => ({ placedProductIds: s.placedProductIds.filter((pid) => pid !== id) })),

  setGeneratedImage: (generatedImageUrl) =>
    set({ generatedImageUrl, step: 6, isGenerating: false, generationError: null }),
  setGenerationError: (generationError) =>
    set({ generationError, isGenerating: false }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setShareResult: (shareId, shareUrl) =>
    set({ shareId, shareUrl, isSharing: false, shareError: null }),
  setShareError: (shareError) => set({ shareError, isSharing: false }),
  setIsSharing: (isSharing) => set({ isSharing }),

  setLitVal: (litVal) => set({ litVal }),
  setOpVal: (opVal) => set({ opVal }),
  setCordVal: (cordVal) => set({ cordVal }),
  setManVal: (manVal) => set({ manVal }),
  setNudgeVal: (nudgeVal) => set({ nudgeVal }),
  toggleCone: () => set((s) => ({ showCone: !s.showCone })),
  setPerspData: (perspData) => set({ perspData }),

  resetControls: () =>
    set({ litVal: 60, opVal: 95, cordVal: 50, manVal: 0, nudgeVal: 0, showCone: true }),

  resetAll: () => set(initialState),
}))
```

- [ ] **Step 2: Type-check** (expect errors in callers of old `setImage` — fixed in Tasks 8 and 9)

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -40
```

Expected: errors only in `UploadStep.tsx` and `CanvasArea.tsx` (wrong `setImage` arity / step 3 references).

- [ ] **Step 3: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add lib/stores/visualizerStore.ts && git commit -m "feat(visualizer): update store — remove step 3, add imageDataUrl + generation + share state"
```

---

## Task 8: Update `UploadStep` to capture data URL

**Files:**
- Modify: `components/visualizer/UploadStep.tsx`

`setImage` now takes `(objectUrl, dataUrl, isDemo)`. Read the file as a base64 data URL before calling it. Demo path passes `null` for `dataUrl`.

- [ ] **Step 1: Replace `UploadStep.tsx`**

```tsx
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
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: `UploadStep.tsx` errors resolved. Only `CanvasArea.tsx` errors remain (step 3 references).

- [ ] **Step 3: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add components/visualizer/UploadStep.tsx && git commit -m "feat(visualizer): capture base64 data URL on upload for inpainting API"
```

---

## Task 9: Update `CanvasArea` — remove step 3 scan, add step 6 display

**Files:**
- Modify: `components/visualizer/CanvasArea.tsx`

Two changes:
1. Delete the mock scan `useEffect` block entirely (the one that calls `setTimeout(..., 2700)`). After upload the store now jumps directly to step 4, so `step === 3` never happens.
2. At step 6, show `generatedImageUrl` instead of the original room photo and hide the draggable overlays.

- [ ] **Step 1: Remove the mock scan `useEffect`**

In `CanvasArea.tsx`, delete this entire block (approximately lines 202–218):

```ts
  // ── Simulate scan: step 3 → step 4 after 2.7s ──────────────────────────────
  useEffect(() => {
    if (step !== 3 || !roomType) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const data = getAnalysisForRoom(roomType)
      let prods
      try {
        prods = await fetchProductsForRoom(roomType)
      } catch (err) {
        console.error('[visualizer] fetchProductsForRoom failed, using mock:', err)
        prods = getProductsForRoom(roomType)
      }
      if (!cancelled) setAnalysis(data, prods)
    }, 2700)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [step, roomType, setAnalysis])
```

Also remove the now-unused `setAnalysis` from the store destructuring at the top of `CanvasArea`, and remove its import from `useVisualizerStore`. Keep `getAnalysisForRoom`, `getProductsForRoom`, and `fetchProductsForRoom` imports only if they're used elsewhere in the file — if not, remove them too.

After the deletion, wire up products for step 4 by adding a new, simpler `useEffect` right where the old one was:

```ts
  // ── Load products when entering step 4 ─────────────────────────────────────
  const setAnalysis = useVisualizerStore((s) => s.setAnalysis)

  useEffect(() => {
    if (step !== 4 || !roomType || products.length > 0) return
    let cancelled = false

    async function loadProducts() {
      let prods
      try {
        prods = await fetchProductsForRoom(roomType!)
      } catch {
        prods = getProductsForRoom(roomType!)
      }
      if (!cancelled) setAnalysis(getAnalysisForRoom(roomType!), prods)
    }

    loadProducts()
    return () => { cancelled = true }
  }, [step, roomType, products.length, setAnalysis])
```

- [ ] **Step 2: Add `generatedImageUrl` and step-6 display**

Add this line near the other store reads at the top of the component body (after `const showScan = step === 3`):

```ts
  const generatedImageUrl = useVisualizerStore((s) => s.generatedImageUrl)
```

Then update the `showCanvas` and `showScan` constants:

```ts
  const showCanvas = step >= 4          // was: step >= 3
  const showScan   = false              // step 3 no longer exists
```

Replace the uploaded-image `<img>` block:

```tsx
      {/* Uploaded image (steps 4–5) or generated composite (step 6) */}
      {showCanvas && !isDemo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={step === 6 && generatedImageUrl ? generatedImageUrl : (imageUrl ?? '')}
          alt="Room"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
```

Wrap the draggable fixtures to hide them at step 6:

```tsx
      {/* Draggable fixtures — hidden at step 6 where AI composite is shown */}
      {step < 6 && placedProducts.map((product) => (
        <FixtureOverlay
          key={product.id}
          product={product}
          wrapRef={wrapRef}
          onRemove={() => removePlacedProduct(product.id)}
        />
      ))}
```

Also update the room-type tag condition from `step >= 4` to `step >= 4 && step < 6` so it's hidden on the generated result:

```tsx
      {step >= 4 && step < 6 && (
        <div className="absolute top-2.5 left-2.5 z-30 ...">
          {analysisData?.roomType} · {analysisData?.style}
        </div>
      )}
```

- [ ] **Step 3: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add components/visualizer/CanvasArea.tsx && git commit -m "feat(visualizer): remove mock scan step, load products at step 4, show generated image at step 6"
```

---

## Task 10: Update `StepBar`

**Files:**
- Modify: `components/visualizer/StepBar.tsx`

Remove step 3 "Analyse". Add step 6 "Generate". Keep step numbers matching `VisualizerStep`.

- [ ] **Step 1: Update the `STEPS` array in `StepBar.tsx`**

Replace:

```ts
const STEPS: { n: VisualizerStep; label: string }[] = [
  { n: 1, label: 'Room' },
  { n: 2, label: 'Upload' },
  { n: 3, label: 'Analyse' },
  { n: 4, label: 'Select' },
  { n: 5, label: 'Visualise' },
]
```

With:

```ts
const STEPS: { n: VisualizerStep; label: string }[] = [
  { n: 1, label: 'Room' },
  { n: 2, label: 'Upload' },
  { n: 4, label: 'Select' },
  { n: 5, label: 'Visualise' },
  { n: 6, label: 'Generate' },
]
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add components/visualizer/StepBar.tsx && git commit -m "feat(visualizer): update StepBar — remove Analyse, add Generate"
```

---

## Task 11: Add Generate + Share UI to `RightPanel`

**Files:**
- Modify: `components/visualizer/RightPanel.tsx`

Add a `GenerateBlock` component at the bottom of the panel. It appears when at least one product is placed AND the session has a real image (not demo mode). Clicking "Generate AI Preview" calls `/api/visualizer/generate`. After step 6, the generated image thumbnail + "Share Result" button appear.

- [ ] **Step 1: Add imports and `GenerateBlock` to `RightPanel.tsx`**

At the top of the file, add these imports after the existing ones:

```ts
import type { AIGenerateResponse, ShareResult } from '@/lib/ai/types'
```

At the very bottom of `RightPanel.tsx` (after the `CTABlock` function), add:

```tsx
function GenerateBlock() {
  const imageDataUrl      = useVisualizerStore((s) => s.imageDataUrl)
  const placedProductIds  = useVisualizerStore((s) => s.placedProductIds)
  const products          = useVisualizerStore((s) => s.products)
  const isGenerating      = useVisualizerStore((s) => s.isGenerating)
  const generationError   = useVisualizerStore((s) => s.generationError)
  const generatedImageUrl = useVisualizerStore((s) => s.generatedImageUrl)
  const step              = useVisualizerStore((s) => s.step)
  const roomType          = useVisualizerStore((s) => s.roomType)
  const shareUrl          = useVisualizerStore((s) => s.shareUrl)
  const isSharing         = useVisualizerStore((s) => s.isSharing)
  const shareError        = useVisualizerStore((s) => s.shareError)
  const setIsGenerating   = useVisualizerStore((s) => s.setIsGenerating)
  const setGeneratedImage = useVisualizerStore((s) => s.setGeneratedImage)
  const setGenerationError = useVisualizerStore((s) => s.setGenerationError)
  const setIsSharing      = useVisualizerStore((s) => s.setIsSharing)
  const setShareResult    = useVisualizerStore((s) => s.setShareResult)
  const setShareError     = useVisualizerStore((s) => s.setShareError)

  const lastId = placedProductIds[placedProductIds.length - 1] ?? null
  const lastProduct = lastId !== null ? products.find((p) => p.id === lastId) ?? null : null

  // Only show when a real image is available (not demo mode)
  if (!imageDataUrl || !lastProduct) return null

  async function handleGenerate() {
    if (isGenerating || !lastProduct) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const res = await fetch('/api/visualizer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          productImageUrl: lastProduct.full,
          productName: lastProduct.name,
        }),
      })
      if (!res.ok) throw new Error(`generate API returned ${res.status}`)
      const data = await res.json() as AIGenerateResponse
      setGeneratedImage(data.compositeImageUrl)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed')
    }
  }

  async function handleShare() {
    if (isSharing || !generatedImageUrl) return
    setIsSharing(true)
    setShareError(null)

    const payload = {
      roomType: roomType ?? 'Room',
      compositeImageUrl: generatedImageUrl,
      products: products
        .filter((p) => placedProductIds.includes(p.id))
        .map((p) => ({ id: p.id, name: p.name, price: p.price, thumb: p.thumb })),
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/visualizer/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`share API returned ${res.status}`)
      const data = await res.json() as ShareResult
      setShareResult(data.id, data.url)
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Share failed')
    }
  }

  async function handleCopyLink() {
    if (shareUrl) await navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="border-t border-warm-gray pt-4">
      <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">AI Preview</p>

      {step < 6 && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-[11px] text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] transition-all font-sans mb-1.5 ${
            isGenerating
              ? 'bg-warm-gray text-mid-gray cursor-not-allowed'
              : 'bg-gold text-white hover:opacity-90 cursor-pointer'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : (
            'Generate AI Preview'
          )}
        </button>
      )}

      {generationError && (
        <p className="text-[10px] text-red-400 mt-1">{generationError}</p>
      )}

      {step === 6 && generatedImageUrl && (
        <div className="mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl}
            alt="AI-generated composite"
            className="w-full rounded-md border border-warm-gray mb-3"
          />

          {!shareUrl ? (
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className={`w-full py-[11px] text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] transition-all font-sans ${
                isSharing
                  ? 'bg-warm-gray text-mid-gray cursor-not-allowed'
                  : 'bg-dark text-white hover:bg-[#2e2c2a] cursor-pointer'
              }`}
            >
              {isSharing ? 'Saving…' : 'Share Result'}
            </button>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-[10px] border border-warm-gray rounded-[4px] px-2 py-1.5 bg-offwhite truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[10px] tracking-[1px] uppercase bg-dark text-white px-2.5 py-1.5 rounded-[4px] hover:bg-[#2e2c2a] transition-colors cursor-pointer font-sans"
              >
                Copy
              </button>
            </div>
          )}

          {shareError && (
            <p className="text-[10px] text-red-400 mt-1">{shareError}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add `<GenerateBlock />` to the `RightPanel` JSX**

At the bottom of the `RightPanel` return, after `{placedProduct && <CTABlock product={placedProduct} />}`, add:

```tsx
      {/* Generate AI Preview — only when a real image is uploaded and a product is placed */}
      <GenerateBlock />
```

- [ ] **Step 3: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 4: Full build**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npm run build 2>&1 | tail -20
```

Expected: successful build. Routes include `ƒ /api/visualizer/generate`, `ƒ /api/visualizer/share`, `ƒ /room-visualizer/share/[id]`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add components/visualizer/RightPanel.tsx && git commit -m "feat(visualizer): add Generate AI Preview and Share buttons to RightPanel"
```

---

## Task 12: Manual end-to-end smoke test

Run the dev server and verify the full flow works.

- [ ] **Step 1: Start dev server**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npm run dev
```

Open `http://localhost:3001/room-visualizer`.

- [ ] **Step 2: Verify StepBar shows 5 steps (no Analyse)**

Expected: Room → Upload → Select → Visualise → Generate

- [ ] **Step 3: Verify upload goes directly to Select (step 4)**

Pick a room type, upload a photo. Expected: jumps straight to step 4 product panel — no fake scan animation.

- [ ] **Step 4: Verify demo mode still works**

Pick a room type, click "Try the interactive demo". Expected: still jumps to step 4 with demo room rendered.

- [ ] **Step 5: Verify Generate button only appears with a real upload**

In demo mode: "Generate AI Preview" button should NOT appear in RightPanel.
With a real uploaded image + a placed product: button SHOULD appear.

- [ ] **Step 6: Verify stub generation works**

With `ENABLE_AI_GENERATION=false` (default), click "Generate AI Preview". Expected: spinner → step 6 → original room photo displayed as the "composite" (stub behaviour). No error. StepBar shows Generate as active.

- [ ] **Step 7: Verify Share flow**

After stub generation, click "Share Result". Expected: saves and shows a URL like `http://localhost:3001/room-visualizer/share/<uuid>`. Copy link button copies it. Open the link in a new tab — share page renders with the image and product list.

---

## Self-Review Checklist

### 1. Spec Coverage

| Requirement | Task |
|---|---|
| User uploads room image | Task 8 (UploadStep captures data URL) |
| After product selection, inpaint AR image into room photo | Tasks 1–4 (types → provider → adapter → generate route) |
| Show composite result | Task 9 (CanvasArea step 6 display), Task 11 (GenerateBlock thumbnail) |
| Shareable link | Tasks 5, 6, 11 (share route + public page + copy UI) |
| API key never in browser | Tasks 4, 5 (all calls go through Next.js API routes) |
| Provider is swappable | Task 3 (adapter reads `AI_GENERATION_PROVIDER`, OpenAI stub exists) |
| Demo mode unaffected | Task 8 (`null` dataUrl), Task 11 (`!imageDataUrl` guard hides Generate button) |
| Step 3 "Analyse" removed | Tasks 7, 9, 10 |
| Step 6 "Generate" added | Tasks 7, 10 |
| No mock scan timer | Task 9 (deleted) |
| Products still load for step 4 | Task 9 (new lighter `useEffect` at step 4 entry) |

### 2. Placeholder Scan

- No TBD or TODO — Replicate stub is explicit functional code, not a placeholder
- All code blocks are complete
- All commands include expected output

### 3. Type Consistency

- `setImage(url, dataUrl, isDemo)` — defined Task 7, consumed Task 8 ✓
- `AIGenerateResponse` — defined Task 1, returned by Task 2/3, consumed Task 11 ✓
- `SharePayload` / `ShareResult` — defined Task 1, used Tasks 5, 6, 11 ✓
- `VisualizerStep = 1|2|4|5|6` — Task 7, consumed Task 10 ✓
- `generatedImageUrl` / `setGeneratedImage` — Task 7, called Task 11, read Task 9 ✓
- `lastProduct.full` = `arImages` URL (the product's AR image) — confirmed in `lib/data/visualizer.ts` line 178: `full: p.arImages || p.mainImage` ✓
