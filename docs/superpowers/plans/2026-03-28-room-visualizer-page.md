# Room Visualizer Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-step Room Lighting Visualizer page where users first pick a room type, then upload a photo, get AI-ranked fixture suggestions, and drag-and-drop lights onto their room with live perspective scaling.

**Architecture:** New route at `/room-visualizer` rendered within the existing global layout (site Header stays). The page mounts a `'use client'` orchestrator that owns step flow. Cross-panel state lives in a Zustand store. Drag logic and Canvas 2D drawing are managed with refs inside `CanvasArea` to avoid re-render churn. Room analysis is simulated (deterministic mock keyed by room type — drop-in replaceable with a real API call later).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand 5, Tailwind CSS 4, HTML Canvas API (light cone), no extra dependencies.

> **No test runner is configured.** Each task ends with a visual verification step (run `npm run dev`, navigate to `/room-visualizer`, confirm behavior) instead of automated test commands.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/data/visualizer.ts` | `VisualizerProduct` type, 5 mock products, room analysis mock |
| Create | `lib/stores/visualizerStore.ts` | Zustand store — step, roomType, image, analysis, products, fixture settings |
| Modify | `lib/stores/index.ts` | Export `useVisualizerStore` |
| Create | `app/room-visualizer/page.tsx` | Server component, metadata |
| Create | `components/visualizer/StepBar.tsx` | 5-step progress indicator |
| Create | `components/visualizer/RoomTypeStep.tsx` | Step 1 — room type card picker |
| Create | `components/visualizer/UploadStep.tsx` | Step 2 — drag-drop upload + demo link |
| Create | `components/visualizer/ScanOverlay.tsx` | Scanning animation overlay |
| Create | `components/visualizer/ProductPanel.tsx` | Left panel — room analysis + ranked products + place button |
| Create | `components/visualizer/CanvasArea.tsx` | Center — room image, draggable fixture, light cone canvas, toolbar |
| Create | `components/visualizer/RightPanel.tsx` | Right panel — perspective engine, fine-tune sliders, CTA |
| Create | `components/visualizer/RoomVisualizerClient.tsx` | `'use client'` orchestrator — layout shell, wires all panels |
| Modify | `app/globals.css` | Add `/* VISUALIZER */` CSS block (scan animation, range input, fixture styles) |
| Modify | `components/layout/Header.tsx` | Add "Visualizer" nav link |

---

## Task 1: Visualizer Data Layer

**Files:**
- Create: `lib/data/visualizer.ts`

- [ ] **Step 1: Create `lib/data/visualizer.ts`**

```typescript
// lib/data/visualizer.ts

export interface VisualizerProduct {
  id: number
  name: string
  type: string
  price: string
  match: number // 0-100 style match score
  thumb: string // 120×120 crop
  full: string  // ~300px wide, used as fixture overlay
  iw: number    // rendered width in canvas (px, at 1× scale)
  ih: number    // rendered height in canvas (px, at 1× scale)
}

export interface RoomAnalysis {
  roomType: string
  ceiling: string
  style: string
  tone: string
  matchScore: string
}

// Mock products — swap thumb/full for real product images when backend is ready
export const VISUALIZER_PRODUCTS: VisualizerProduct[] = [
  {
    id: 1,
    name: 'Lumière Cascade',
    type: 'Crystal Chandelier',
    price: '₹ 42,000',
    match: 97,
    thumb: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 78,
    ih: 110,
  },
  {
    id: 2,
    name: 'Aura Pendant Trio',
    type: 'Pendant Cluster',
    price: '₹ 28,500',
    match: 91,
    thumb: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 76,
    ih: 100,
  },
  {
    id: 3,
    name: 'Solstice Orb',
    type: 'Globe Pendant',
    price: '₹ 18,000',
    match: 85,
    thumb: 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 88,
    ih: 88,
  },
  {
    id: 4,
    name: 'Celeste Flush',
    type: 'Flush Mount',
    price: '₹ 14,200',
    match: 77,
    thumb: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 96,
    ih: 56,
  },
  {
    id: 5,
    name: 'Arc Minimal',
    type: 'Single Pendant',
    price: '₹ 8,900',
    match: 70,
    thumb: 'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
    full: 'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=300',
    iw: 58,
    ih: 105,
  },
]

// Room-type-specific analysis mock. Replace with real AI API call later.
const ANALYSIS_MAP: Record<string, RoomAnalysis> = {
  'Living Room': {
    roomType: 'Living Room',
    ceiling: '~9.5 ft — detected',
    style: 'Modern Eclectic',
    tone: 'Warm Neutral',
    matchScore: '94% Style Match',
  },
  'Dining Room': {
    roomType: 'Dining Room',
    ceiling: '~8.5 ft — detected',
    style: 'Contemporary',
    tone: 'Cool White',
    matchScore: '91% Style Match',
  },
  'Bedroom': {
    roomType: 'Bedroom',
    ceiling: '~9 ft — detected',
    style: 'Soft Minimalist',
    tone: 'Warm Amber',
    matchScore: '88% Style Match',
  },
  'Kitchen': {
    roomType: 'Kitchen',
    ceiling: '~8 ft — detected',
    style: 'Industrial Modern',
    tone: 'Neutral White',
    matchScore: '85% Style Match',
  },
  'Home Office': {
    roomType: 'Home Office',
    ceiling: '~8 ft — detected',
    style: 'Scandinavian',
    tone: 'Cool Daylight',
    matchScore: '82% Style Match',
  },
}

export function getAnalysisForRoom(roomType: string): RoomAnalysis {
  return ANALYSIS_MAP[roomType] ?? ANALYSIS_MAP['Living Room']
}

// Reorder products by match score with a slight shuffle per room type
// so different rooms show slightly different rankings
export function getProductsForRoom(roomType: string): VisualizerProduct[] {
  const seed = roomType.length % 5
  return [...VISUALIZER_PRODUCTS]
    .map((p) => ({ ...p, match: Math.min(99, p.match + (seed % 3) - 1) }))
    .sort((a, b) => b.match - a.match)
}

export const ROOM_TYPE_OPTIONS = [
  { label: 'Living Room', icon: '🛋️', desc: 'Chandeliers & statement pendants' },
  { label: 'Dining Room', icon: '🍽️', desc: 'Over-table pendants & clusters' },
  { label: 'Bedroom', icon: '🛏️', desc: 'Ambient & flush mounts' },
  { label: 'Kitchen', icon: '🍳', desc: 'Task & island pendants' },
  { label: 'Home Office', icon: '💻', desc: 'Focused & desk-side lighting' },
]
```

- [ ] **Step 2: Verify**

Run `npx tsc --noEmit` from the `glitteron/` directory.
Expected: no errors in `lib/data/visualizer.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/data/visualizer.ts
git commit -m "feat(visualizer): add data types, mock products, room analysis"
```

---

## Task 2: Zustand Visualizer Store

**Files:**
- Create: `lib/stores/visualizerStore.ts`
- Modify: `lib/stores/index.ts`

- [ ] **Step 1: Create `lib/stores/visualizerStore.ts`**

```typescript
// lib/stores/visualizerStore.ts
import { create } from 'zustand'
import type { VisualizerProduct, RoomAnalysis } from '@/lib/data/visualizer'

export type VisualizerStep = 1 | 2 | 3 | 4 | 5
// Step meaning: 1=RoomType, 2=Upload, 3=Analyse, 4=Select, 5=Visualise

export interface PerspData {
  dScale: number
  dr: number
  conv: number
}

interface VisualizerState {
  // Flow
  step: VisualizerStep
  roomType: string | null

  // Image
  imageUrl: string | null
  isDemo: boolean

  // Analysis (populated after scan)
  analysisData: RoomAnalysis | null
  products: VisualizerProduct[]

  // Fixture selection & placement
  selectedProduct: VisualizerProduct | null
  placedProductId: number | null // null = no fixture on canvas

  // Fine-tune controls (read by CanvasArea to re-render fixture)
  litVal: number    // 0-100
  opVal: number     // 30-100
  cordVal: number   // 0-100
  manVal: number    // -50 to 50
  nudgeVal: number  // -0.45 to 0.65 (zoom nudge)
  showCone: boolean

  // Perspective data (written by CanvasArea, read by RightPanel)
  perspData: PerspData | null

  // Actions
  setStep: (step: VisualizerStep) => void
  setRoomType: (roomType: string) => void
  setImage: (url: string, isDemo: boolean) => void
  setAnalysis: (data: RoomAnalysis, products: VisualizerProduct[]) => void
  setSelectedProduct: (product: VisualizerProduct | null) => void
  setPlacedProductId: (id: number | null) => void
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
  isDemo: false,
  analysisData: null,
  products: [],
  selectedProduct: null,
  placedProductId: null,
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
  setImage: (url, isDemo) => set({ imageUrl: url, isDemo, step: 3 }),
  setAnalysis: (analysisData, products) => set({ analysisData, products, step: 4 }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setPlacedProductId: (placedProductId) => set({ placedProductId }),
  setLitVal: (litVal) => set({ litVal }),
  setOpVal: (opVal) => set({ opVal }),
  setCordVal: (cordVal) => set({ cordVal }),
  setManVal: (manVal) => set({ manVal }),
  setNudgeVal: (nudgeVal) => set({ nudgeVal }),
  toggleCone: () => set((s) => ({ showCone: !s.showCone })),
  setPerspData: (perspData) => set({ perspData }),

  resetControls: () => set({
    litVal: 60,
    opVal: 95,
    cordVal: 50,
    manVal: 0,
    nudgeVal: 0,
  }),

  resetAll: () => set(initialState),
}))
```

- [ ] **Step 2: Export from `lib/stores/index.ts`**

Add to the bottom of `lib/stores/index.ts`:

```typescript
export { useVisualizerStore } from './visualizerStore'
export type { VisualizerStep, PerspData } from './visualizerStore'
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/stores/visualizerStore.ts lib/stores/index.ts
git commit -m "feat(visualizer): add zustand store for step flow and fixture state"
```

---

## Task 3: Visualizer CSS in globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add visualizer CSS block at the bottom of `app/globals.css`**

Append the following at the very end of `app/globals.css`:

```css
/* ─── VISUALIZER ─────────────────────────────────────────────────────────── */

/* Scan animation */
@keyframes vizScan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
@keyframes vizDot {
  0%, 100% { opacity: 0.25; transform: scale(0.75); }
  50%       { opacity: 1;    transform: scale(1); }
}

.viz-scan-line {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(196, 113, 74, 0.05) 47%,
    rgba(196, 113, 74, 0.18) 50%,
    rgba(196, 113, 74, 0.05) 53%,
    transparent 100%
  );
  animation: vizScan 1.7s ease-in-out infinite;
  pointer-events: none;
}

/* Fixture drag element */
.viz-fx {
  position: absolute;
  transform-origin: top center;
  cursor: grab;
  z-index: 20;
  user-select: none;
}
.viz-fx:active { cursor: grabbing; }
.viz-fx.dragging { z-index: 50; }

/* Fixture hover controls (scale/delete buttons) */
.viz-fx-ctrl {
  position: absolute;
  top: -10px;
  right: -10px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.16s;
}
.viz-fx:hover .viz-fx-ctrl { opacity: 1; }

/* Depth badge on hover */
.viz-depth-badge {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-mid-gray);
  white-space: nowrap;
  background: rgba(237, 232, 224, 0.92);
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid var(--color-warm-gray);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s;
}
.viz-fx:hover .viz-depth-badge { opacity: 1; }

/* Vanishing-point crosshair */
.viz-vp-mark {
  position: absolute;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  z-index: 15;
  pointer-events: none;
}
.viz-vp-mark::before {
  content: '';
  position: absolute;
  left: 50%; top: -30px; bottom: -30px;
  transform: translateX(-50%);
  width: 1px;
  background: repeating-linear-gradient(
    180deg,
    var(--color-gold) 0, var(--color-gold) 3px,
    transparent 3px, transparent 7px
  );
  opacity: 0.3;
}
.viz-vp-mark::after {
  content: '';
  position: absolute;
  top: 50%; left: -30px; right: -30px;
  transform: translateY(-50%);
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-gold) 0, var(--color-gold) 3px,
    transparent 3px, transparent 7px
  );
  opacity: 0.3;
}

/* Range slider — visualizer theme */
.viz-range {
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background: var(--color-warm-gray);
  border-radius: 2px;
  outline: none;
}
.viz-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--color-dark);
  cursor: pointer;
  border: 2px solid var(--color-white);
  box-shadow: 0 1px 4px rgba(26, 18, 16, 0.18);
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`. Navigate to `/` (home page). Confirm no style regressions — the page looks the same as before.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(visualizer): add visualizer CSS to globals (scan anim, fixture, range)"
```

---

## Task 4: Page Route & Layout Shell

**Files:**
- Create: `app/room-visualizer/page.tsx`
- Create: `components/visualizer/RoomVisualizerClient.tsx` (stub)
- Create: `components/visualizer/StepBar.tsx`

- [ ] **Step 1: Create `app/room-visualizer/page.tsx`**

```typescript
// app/room-visualizer/page.tsx
import type { Metadata } from 'next'
import RoomVisualizerClient from '@/components/visualizer/RoomVisualizerClient'

export const metadata: Metadata = {
  title: 'Room Lighting Visualizer — GlitterOn',
  description: 'Select your room type, upload a photo, and see how our decorative lights look in your space.',
}

export default function RoomVisualizerPage() {
  return <RoomVisualizerClient />
}
```

- [ ] **Step 2: Create `components/visualizer/StepBar.tsx`**

```typescript
// components/visualizer/StepBar.tsx
'use client'
import { useVisualizerStore, type VisualizerStep } from '@/lib/stores/visualizerStore'

const STEPS: { n: VisualizerStep; label: string }[] = [
  { n: 1, label: 'Room' },
  { n: 2, label: 'Upload' },
  { n: 3, label: 'Analyse' },
  { n: 4, label: 'Select' },
  { n: 5, label: 'Visualise' },
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
              <div className="w-10 h-px bg-warm-gray mx-2.5" />
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
```

- [ ] **Step 3: Create stub `components/visualizer/RoomVisualizerClient.tsx`**

```typescript
// components/visualizer/RoomVisualizerClient.tsx
'use client'
import StepBar from './StepBar'

export default function RoomVisualizerClient() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      <StepBar />
      <div className="flex-1 flex items-center justify-center bg-offwhite">
        <p className="text-mid-gray text-sm">Visualizer panels coming soon…</p>
      </div>
    </div>
  )
}
```

> **Note:** `64px` is the global Header height (`h-16`). Verify this matches the actual rendered header. If the Header height differs, adjust this value.

- [ ] **Step 4: Verify**

Run `npm run dev`. Navigate to `/room-visualizer`.
Expected:
- Page shows site Header at top
- StepBar below header showing 5 steps: Room · Upload · Analyse · Select · Visualise
- Step 1 "Room" is active (dark filled circle), others inactive
- Placeholder text in body area
- No console errors

- [ ] **Step 5: Commit**

```bash
git add app/room-visualizer/page.tsx components/visualizer/StepBar.tsx components/visualizer/RoomVisualizerClient.tsx
git commit -m "feat(visualizer): add page route and step bar"
```

---

## Task 5: Room Type Step (Step 1)

**Files:**
- Create: `components/visualizer/RoomTypeStep.tsx`

- [ ] **Step 1: Create `components/visualizer/RoomTypeStep.tsx`**

```typescript
// components/visualizer/RoomTypeStep.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { ROOM_TYPE_OPTIONS } from '@/lib/data/visualizer'

export default function RoomTypeStep() {
  const setRoomType = useVisualizerStore((s) => s.setRoomType)

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 bg-offwhite">
      <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-3 font-sans">
        Step 1 of 5
      </p>
      <h1 className="font-serif text-3xl mb-2 text-dark text-center">
        What room are we lighting?
      </h1>
      <p className="text-sm text-mid-gray mb-10 text-center max-w-sm">
        We&apos;ll tailor fixture suggestions to your room type before you upload.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-3xl">
        {ROOM_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setRoomType(opt.label)}
            className="group flex flex-col items-center gap-3 p-5 rounded-lg border border-warm-gray bg-white hover:border-gold hover:bg-[rgba(196,113,74,0.06)] transition-all duration-200 cursor-pointer text-left"
          >
            <span className="text-3xl">{opt.icon}</span>
            <div>
              <div className="font-serif text-sm text-dark mb-1 text-center">
                {opt.label}
              </div>
              <div className="text-[10px] text-mid-gray text-center leading-snug">
                {opt.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `RoomVisualizerClient.tsx`**

Replace the stub content with:

```typescript
// components/visualizer/RoomVisualizerClient.tsx
'use client'
import StepBar from './StepBar'
import RoomTypeStep from './RoomTypeStep'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'

export default function RoomVisualizerClient() {
  const step = useVisualizerStore((s) => s.step)

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
      <StepBar />
      <div className="flex-1 overflow-hidden flex">
        {step === 1 && <RoomTypeStep />}
        {step >= 2 && (
          <div className="flex-1 flex items-center justify-center bg-offwhite">
            <p className="text-mid-gray text-sm">Upload panel coming in Task 6…</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Navigate to `/room-visualizer`.
Expected:
- Step 1 shows 5 room type cards in a grid (Living Room, Dining Room, Bedroom, Kitchen, Home Office)
- Each card has an emoji, name, description
- Hovering a card shows gold border highlight
- Clicking any card advances step bar to step 2 ("Upload" becomes active)
- Body area shows placeholder text for step 2

- [ ] **Step 4: Commit**

```bash
git add components/visualizer/RoomTypeStep.tsx components/visualizer/RoomVisualizerClient.tsx
git commit -m "feat(visualizer): add room type selection step (step 1)"
```

---

## Task 6: Upload Step + Scan Overlay (Steps 2 & 3)

**Files:**
- Create: `components/visualizer/UploadStep.tsx`
- Create: `components/visualizer/ScanOverlay.tsx`

- [ ] **Step 1: Create `components/visualizer/UploadStep.tsx`**

```typescript
// components/visualizer/UploadStep.tsx
'use client'
import { useRef } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'

export default function UploadStep() {
  const fileRef = useRef<HTMLInputElement>(null)
  const roomType = useVisualizerStore((s) => s.roomType)
  const setImage = useVisualizerStore((s) => s.setImage)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImage(url, false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function runDemo() {
    setImage('', true)
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 bg-offwhite gap-4">
      {/* Context chip */}
      <div className="flex items-center gap-2">
        <span className="text-[9.5px] tracking-[2px] uppercase text-mid-gray">
          Room selected:
        </span>
        <span className="text-[9.5px] tracking-[1.5px] uppercase text-gold font-medium border border-gold rounded-full px-3 py-0.5">
          {roomType}
        </span>
      </div>

      <h2 className="font-serif text-2xl text-dark">Upload your room photo</h2>

      {/* Drop zone */}
      <div
        className="w-80 h-56 border-[1.5px] border-dashed border-warm-gray rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 hover:border-gold hover:bg-[rgba(196,113,74,0.06)]"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Upload icon */}
        <svg viewBox="0 0 24 24" className="w-9 h-9 stroke-mid-gray fill-none" strokeWidth={1.2}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <div className="font-serif text-lg text-dark">Drop your room photo</div>
        <div className="text-[11.5px] text-mid-gray text-center leading-relaxed">
          Bedroom · Living room · Dining room
        </div>
        <div className="flex gap-1.5">
          {['JPG', 'PNG', 'WEBP'].map((f) => (
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

- [ ] **Step 2: Create `components/visualizer/ScanOverlay.tsx`**

```typescript
// components/visualizer/ScanOverlay.tsx
// Pure visual overlay — shown during step 3 (Analyse) for ~2.7s

export default function ScanOverlay() {
  return (
    <div className="absolute inset-0 bg-[rgba(244,241,237,0.74)] backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-40">
      <div className="viz-scan-line" />
      <p className="font-serif text-lg italic z-10">Reading your space…</p>
      <p className="text-[10.5px] tracking-[1.5px] uppercase text-mid-gray z-10">
        Detecting ceiling · style · lighting zones
      </p>
      <div className="flex gap-1.5 z-10">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-gold"
            style={{ animation: `vizDot 0.85s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/visualizer/UploadStep.tsx components/visualizer/ScanOverlay.tsx
git commit -m "feat(visualizer): add upload dropzone and scan overlay (steps 2-3)"
```

---

## Task 7: Product Panel — Left Panel (Steps 4 & 5)

**Files:**
- Create: `components/visualizer/ProductPanel.tsx`

- [ ] **Step 1: Create `components/visualizer/ProductPanel.tsx`**

```typescript
// components/visualizer/ProductPanel.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'

export default function ProductPanel() {
  const { analysisData, products, selectedProduct, placedProductId, setSelectedProduct } =
    useVisualizerStore((s) => ({
      analysisData: s.analysisData,
      products: s.products,
      selectedProduct: s.selectedProduct,
      placedProductId: s.placedProductId,
      setSelectedProduct: s.setSelectedProduct,
    }))

  return (
    <div className="w-[272px] shrink-0 bg-white border-r border-warm-gray flex flex-col overflow-hidden">
      {/* Room Analysis */}
      <div className="px-[18px] py-4 border-b border-warm-gray shrink-0">
        <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-3">
          Room Analysis
        </p>
        {[
          { label: 'Room Type', value: analysisData?.roomType },
          { label: 'Ceiling', value: analysisData?.ceiling },
          { label: 'Style', value: analysisData?.style },
          { label: 'Tone', value: analysisData?.tone },
          { label: 'AI Match', value: analysisData?.matchScore, accent: true },
        ].map(({ label, value, accent }) => (
          <div key={label} className="flex justify-between items-baseline text-xs mb-[7px]">
            <span className="text-[11px] text-mid-gray">{label}</span>
            {value ? (
              <span className={`font-normal ${accent ? 'text-gold font-medium' : 'text-dark'}`}>
                {value}
              </span>
            ) : (
              <span className="text-warm-gray">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Suggested Fixtures header */}
      <div className="px-[18px] pt-[13px] pb-0 shrink-0">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[9.5px] tracking-[2px] uppercase text-mid-gray">
            Suggested Fixtures
          </span>
          {products.length > 0 && (
            <span className="text-[10px] text-gold">{products.length} found</span>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="overflow-y-auto flex-1 px-3 pb-3 scrollbar-thin">
        {products.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <p className="font-serif text-sm italic text-mid-gray mb-1">
              Upload a room to see matches
            </p>
            <p className="text-[11px] text-warm-gray">AI ranks by style compatibility</p>
          </div>
        ) : (
          products.map((p, i) => (
            <ProductItem
              key={p.id}
              product={p}
              isFirst={i === 0}
              isSelected={selectedProduct?.id === p.id}
              isPlaced={placedProductId === p.id}
              onClick={() => setSelectedProduct(p)}
            />
          ))
        )}
      </div>

      {/* Place button */}
      <PlaceButton />
    </div>
  )
}

function ProductItem({
  product: p,
  isFirst,
  isSelected,
  isPlaced,
  onClick,
}: {
  product: VisualizerProduct
  isFirst: boolean
  isSelected: boolean
  isPlaced: boolean
  onClick: () => void
}) {
  const dotCount = Math.round(p.match / 20) // 0-5 dots

  return (
    <div
      onClick={onClick}
      className={`relative flex gap-2.5 items-center p-2.5 rounded-md border cursor-pointer transition-all duration-150 mb-1.5 ${
        isSelected
          ? 'border-gold bg-[rgba(196,113,74,0.12)]'
          : 'border-transparent hover:border-warm-gray hover:bg-offwhite'
      }`}
    >
      {isFirst && (
        <span className="absolute top-1.5 right-1.5 text-[7.5px] tracking-[1px] uppercase bg-gold text-white px-1.5 py-0.5 rounded-full font-medium">
          Best
        </span>
      )}
      {/* Thumbnail */}
      <div className="w-[52px] h-[52px] shrink-0 rounded-[5px] overflow-hidden bg-offwhite border border-warm-gray">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.thumb}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[13px] mb-0.5 truncate">{p.name}</div>
        <div className="text-[10px] tracking-[1px] uppercase text-mid-gray mb-1">{p.type}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark">{p.price}</span>
          {/* Match dots */}
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, j) => (
              <div
                key={j}
                className={`w-[5px] h-[5px] rounded-full ${j < dotCount ? 'bg-gold' : 'bg-warm-gray'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlaceButton() {
  const { selectedProduct, placedProductId, step, setStep, setPlacedProductId } =
    useVisualizerStore((s) => ({
      selectedProduct: s.selectedProduct,
      placedProductId: s.placedProductId,
      step: s.step,
      setStep: s.setStep,
      setPlacedProductId: s.setPlacedProductId,
    }))

  const isPlaced = placedProductId === selectedProduct?.id

  function handlePlace() {
    if (!selectedProduct) return
    setPlacedProductId(selectedProduct.id)
    if (step < 5) setStep(5)
  }

  return (
    <div className="px-3.5 py-3 border-t border-warm-gray shrink-0">
      <button
        disabled={!selectedProduct}
        onClick={handlePlace}
        className={`w-full py-[11px] text-[11px] tracking-[1.5px] uppercase rounded-[5px] transition-all duration-150 font-sans ${
          isPlaced
            ? 'bg-gold text-white cursor-default'
            : selectedProduct
            ? 'bg-dark text-white hover:bg-[#2e2c2a] cursor-pointer'
            : 'bg-dark text-white opacity-30 cursor-not-allowed'
        }`}
      >
        {isPlaced
          ? `✓ ${selectedProduct!.name} Placed`
          : selectedProduct
          ? `Place ${selectedProduct.name}`
          : 'Select a Fixture First'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/visualizer/ProductPanel.tsx
git commit -m "feat(visualizer): add left panel with room analysis and product list"
```

---

## Task 8: Canvas Area — Center Panel (Steps 3–5)

This is the most complex component. It owns: room image display, demo room CSS, scan overlay, draggable fixture, light cone Canvas 2D, and the canvas toolbar.

**Files:**
- Create: `components/visualizer/CanvasArea.tsx`

- [ ] **Step 1: Create `components/visualizer/CanvasArea.tsx`**

```typescript
// components/visualizer/CanvasArea.tsx
'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'
import { getAnalysisForRoom, getProductsForRoom } from '@/lib/data/visualizer'
import ScanOverlay from './ScanOverlay'

// ─── Perspective calculation ─────────────────────────────────────────────────
const VP_YR = 0.18 // vanishing point Y ratio (18% from top)
const VP_XR = 0.5  // vanishing point X ratio (center)

interface PerspResult {
  dScale: number
  px: number
  dr: number
  vpX: number
  vpY: number
}

function calcPerspective(x: number, y: number, W: number, H: number): PerspResult {
  const vpY = H * VP_YR
  const vpX = W * VP_XR
  const dy = Math.max(0, y - vpY)
  const maxDy = H - vpY
  const dr = Math.max(0, Math.min(1, dy / maxDy))
  const dScale = 0.45 + dr * 0.55
  const conv = 0.65 + dr * 0.35
  const px = vpX + (x - vpX) * conv
  return { dScale, px, dr, vpX, vpY }
}

// ─── Light cone drawing ──────────────────────────────────────────────────────
function drawLightCone(canvas: HTMLCanvasElement, litVal: number, showCone: boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 200, 150)
  if (!showCone) return
  const a = (litVal / 100) * 0.26
  const g = ctx.createRadialGradient(100, 0, 4, 100, 0, 160)
  g.addColorStop(0, `rgba(255,238,190,${a})`)
  g.addColorStop(0.45, `rgba(255,218,155,${a * 0.45})`)
  g.addColorStop(1, 'rgba(255,200,120,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(100, 0)
  ctx.lineTo(8, 150)
  ctx.lineTo(192, 150)
  ctx.closePath()
  ctx.fill()
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CanvasArea() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<HTMLDivElement>(null)       // the draggable fixture element
  const coneRef = useRef<HTMLCanvasElement>(null)  // light cone canvas
  const vpMarkRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0, manAdj: 0 }) // fixture position (no re-render on drag)

  const {
    step, roomType, imageUrl, isDemo, analysisData,
    selectedProduct, placedProductId,
    litVal, opVal, cordVal, manVal, nudgeVal, showCone,
    setStep, setAnalysis, setPlacedProductId,
    setPerspData, setSelectedProduct,
  } = useVisualizerStore((s) => ({
    step: s.step,
    roomType: s.roomType,
    imageUrl: s.imageUrl,
    isDemo: s.isDemo,
    analysisData: s.analysisData,
    selectedProduct: s.selectedProduct,
    placedProductId: s.placedProductId,
    litVal: s.litVal,
    opVal: s.opVal,
    cordVal: s.cordVal,
    manVal: s.manVal,
    nudgeVal: s.nudgeVal,
    showCone: s.showCone,
    setStep: s.setStep,
    setAnalysis: s.setAnalysis,
    setPlacedProductId: s.setPlacedProductId,
    setPerspData: s.setPerspData,
    setSelectedProduct: s.setSelectedProduct,
  }))

  const placedProduct = placedProductId !== null
    ? useVisualizerStore.getState().products.find((p) => p.id === placedProductId) ?? null
    : null

  // ── Simulate scan (step 3 → step 4) ────────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || !roomType) return
    const timer = setTimeout(() => {
      const data = getAnalysisForRoom(roomType)
      const products = getProductsForRoom(roomType)
      setAnalysis(data, products)
    }, 2700)
    return () => clearTimeout(timer)
  }, [step, roomType, setAnalysis])

  // ── Position VP crosshair ───────────────────────────────────────────────────
  const posVP = useCallback(() => {
    const wrap = wrapRef.current
    const mark = vpMarkRef.current
    if (!wrap || !mark) return
    mark.style.left = wrap.offsetWidth * VP_XR + 'px'
    mark.style.top = wrap.offsetHeight * VP_YR + 'px'
  }, [])

  useEffect(() => {
    posVP()
    window.addEventListener('resize', posVP)
    return () => window.removeEventListener('resize', posVP)
  }, [posVP])

  // ── Apply fixture position & scale ─────────────────────────────────────────
  const applyFixturePos = useCallback(
    (x: number, y: number, product: VisualizerProduct) => {
      const wrap = wrapRef.current
      const fx = fxRef.current
      const cord = document.getElementById('viz-cord')
      const cone = coneRef.current
      if (!wrap || !fx) return

      const W = wrap.offsetWidth
      const H = wrap.offsetHeight
      const p2 = calcPerspective(x, y, W, H)
      const { manAdj } = posRef.current

      const tot = Math.max(0.28, Math.min(1.9, p2.dScale + manAdj * 0.005 + nudgeVal))
      const imgW = product.iw * tot

      fx.style.left = p2.px - imgW / 2 + 'px'
      fx.style.top = y - 16 + 'px'
      fx.style.transform = `scale(${tot})`
      fx.style.opacity = String(opVal / 100)

      if (cord) {
        const ch = 14 + (cordVal / 100) * 70
        cord.style.height = ch + 'px'
      }

      if (cone) drawLightCone(cone, litVal, showCone)

      // Update depth badge
      const db = document.getElementById('viz-depth-badge')
      if (db) db.textContent = `scale ${(p2.dScale + manAdj * 0.005).toFixed(2)}×`

      setPerspData({ dScale: p2.dScale, dr: p2.dr, conv: 0.65 + p2.dr * 0.35 })
    },
    [nudgeVal, opVal, cordVal, litVal, showCone, setPerspData],
  )

  // ── Re-apply when controls change ──────────────────────────────────────────
  useEffect(() => {
    if (!placedProduct) return
    const { x, y } = posRef.current
    if (x === 0 && y === 0) return // not yet placed
    posRef.current.manAdj = manVal
    applyFixturePos(x, y, placedProduct)
  }, [litVal, opVal, cordVal, manVal, nudgeVal, showCone, placedProduct, applyFixturePos])

  // ── Place fixture on canvas ─────────────────────────────────────────────────
  useEffect(() => {
    if (!placedProductId || !wrapRef.current) return
    const wrap = wrapRef.current
    const W = wrap.offsetWidth
    const H = wrap.offsetHeight
    const x = W * 0.5
    const y = H * 0.22
    posRef.current = { x, y, manAdj: 0 }
    const prod = useVisualizerStore.getState().products.find((p) => p.id === placedProductId)
    if (prod) applyFixturePos(x, y, prod)
  }, [placedProductId, applyFixturePos])

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const makeDrag = useCallback(
    (product: VisualizerProduct) => {
      const fx = fxRef.current
      const wrap = wrapRef.current
      if (!fx || !wrap) return

      const startDrag = (startX: number, startY: number) => {
        const wr = wrap.getBoundingClientRect()
        const er = fx.getBoundingClientRect()
        let ox = er.left - wr.left + er.width / 2
        let oy = er.top - wr.top

        fx.classList.add('dragging')

        const move = (cx: number, cy: number) => {
          const nx = Math.max(40, Math.min(wrap.offsetWidth - 40, ox + cx - startX))
          const ny = Math.max(5, Math.min(wrap.offsetHeight * 0.72, oy + cy - startY))
          posRef.current.x = nx
          posRef.current.y = ny
          applyFixturePos(nx, ny, product)
        }

        const end = () => {
          fx.classList.remove('dragging')
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
          document.removeEventListener('touchmove', onTouchMove)
          document.removeEventListener('touchend', onTouchEnd)
        }

        const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY)
        const onMouseUp = end
        const onTouchMove = (e: TouchEvent) => {
          const t = e.touches[0]
          move(t.clientX, t.clientY)
        }
        const onTouchEnd = end

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        document.addEventListener('touchmove', onTouchMove, { passive: true })
        document.addEventListener('touchend', onTouchEnd)
      }

      fx.addEventListener('mousedown', (e) => {
        if ((e.target as Element).closest('.viz-fx-ctrl')) return
        e.preventDefault()
        startDrag(e.clientX, e.clientY)
      })
      fx.addEventListener('touchstart', (e) => {
        if ((e.target as Element).closest('.viz-fx-ctrl')) return
        const t = e.touches[0]
        startDrag(t.clientX, t.clientY)
      }, { passive: true })
    },
    [applyFixturePos],
  )

  // Attach drag when fixture appears
  useEffect(() => {
    if (!placedProductId || !fxRef.current) return
    const prod = useVisualizerStore.getState().products.find((p) => p.id === placedProductId)
    if (prod) makeDrag(prod)
  }, [placedProductId, makeDrag])

  // ── Remove fixture ──────────────────────────────────────────────────────────
  function removeFixture() {
    setPlacedProductId(null)
    posRef.current = { x: 0, y: 0, manAdj: 0 }
    setSelectedProduct(null)
  }

  // ── Toolbar actions ─────────────────────────────────────────────────────────
  function nudgeZoom(delta: number) {
    const cur = useVisualizerStore.getState().nudgeVal
    useVisualizerStore.getState().setNudgeVal(Math.max(-0.45, Math.min(0.65, cur + delta)))
  }
  function toggleVP() {
    const mark = vpMarkRef.current
    if (!mark) return
    mark.style.display = mark.style.display === 'block' ? 'none' : 'block'
  }
  function toggleConeLocal() {
    useVisualizerStore.getState().toggleCone()
    if (placedProduct && coneRef.current) {
      drawLightCone(coneRef.current, useVisualizerStore.getState().litVal, useVisualizerStore.getState().showCone)
    }
  }

  // ── Determine what to show in center ───────────────────────────────────────
  const showUploadPrompt = step <= 2
  const showScan = step === 3
  const showCanvas = step >= 3

  const cordH = 14 + (cordVal / 100) * 70

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden bg-[#ebebe8]">

      {/* ── Demo room (CSS) ── */}
      {showCanvas && isDemo && (
        <div className="absolute inset-0">
          <div
            className="w-full h-full relative overflow-hidden"
            style={{ background: 'linear-gradient(175deg, #d8d0c4, #c8bfaf)' }}
          >
            {/* Ceiling */}
            <div className="absolute top-0 left-0 right-0 h-[36%]"
              style={{ background: 'linear-gradient(180deg, #c4baa8, #b8ae9c)' }} />
            {/* Wall */}
            <div className="absolute left-0 right-0"
              style={{ top: '36%', bottom: '28%', background: 'linear-gradient(180deg, #d4cab8, #ccc2b0)' }} />
            {/* Floor */}
            <div className="absolute bottom-0 left-0 right-0 h-[28%]"
              style={{ background: 'linear-gradient(180deg, #a8a090, #9a9282)' }} />
            {/* Window */}
            <div className="absolute"
              style={{
                top: '9%', left: '11%', width: 86, height: 108,
                border: '1.5px solid rgba(255,255,255,0.45)',
                background: 'linear-gradient(135deg, rgba(200,220,255,0.2), rgba(180,210,240,0.3))',
              }} />
            {/* Sofa */}
            <div className="absolute"
              style={{
                bottom: '26%', left: '50%', transform: 'translateX(-50%)',
                width: 240, height: 62,
                background: '#8c7e6e',
                borderRadius: '8px 8px 3px 3px',
              }} />
          </div>
        </div>
      )}

      {/* ── Uploaded image ── */}
      {showCanvas && !isDemo && imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Room"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* ── Scan overlay ── */}
      {showScan && <ScanOverlay />}

      {/* ── Upload prompt (before image) ── */}
      {showUploadPrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-offwhite z-50">
          <p className="text-sm text-mid-gray">
            {step === 1 ? 'Select a room type first' : 'Waiting for room upload…'}
          </p>
        </div>
      )}

      {/* ── Room type tag ── */}
      {showCanvas && step >= 4 && analysisData && (
        <div className="absolute top-2.5 left-2.5 z-30 bg-white/90 border border-warm-gray px-3 py-1 rounded-full text-[10px] tracking-[1.5px] uppercase text-mid-gray backdrop-blur-sm">
          {analysisData.roomType} · {analysisData.style}
        </div>
      )}

      {/* ── Vanishing point crosshair ── */}
      {step >= 4 && (
        <div ref={vpMarkRef} className="viz-vp-mark" style={{ display: 'none' }} />
      )}

      {/* ── Draggable fixture ── */}
      {placedProductId && (() => {
        const prod = useVisualizerStore.getState().products.find((p) => p.id === placedProductId)
        if (!prod) return null
        return (
          <div ref={fxRef} className="viz-fx" style={{ position: 'absolute' }}>
            <div className="relative flex flex-col items-center">
              {/* Cord */}
              <div
                id="viz-cord"
                style={{
                  width: 1.5,
                  height: cordH,
                  background: 'linear-gradient(180deg, rgba(90,80,70,0.55), rgba(90,80,70,0.2))',
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
              />
              {/* Body */}
              <div className="relative" id="viz-fx-body">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.full}
                  alt={prod.name}
                  width={prod.iw}
                  style={{
                    display: 'block',
                    filter: 'drop-shadow(0 6px 18px rgba(28,27,25,0.2))',
                    pointerEvents: 'none',
                  }}
                  onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')}
                />
                {/* Light cone */}
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
                  <canvas ref={coneRef} width={200} height={150} />
                </div>
                {/* Controls */}
                <div className="viz-fx-ctrl">
                  <button
                    onClick={removeFixture}
                    className="fc-del w-[21px] h-[21px] bg-white border border-warm-gray rounded-full flex items-center justify-center text-[9px] text-mid-gray hover:border-red-400 hover:text-red-400 transition-colors shadow-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                {/* Depth badge */}
                <div id="viz-depth-badge" className="viz-depth-badge">scale —</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Canvas toolbar ── */}
      {step >= 4 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border border-warm-gray rounded-full flex items-center gap-0.5 px-2 py-1 shadow-sm z-40">
          {[
            { title: 'Zoom in',        onClick: () => nudgeZoom(0.12),   icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" /></> },
            { title: 'Zoom out',       onClick: () => nudgeZoom(-0.12),  icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M8 11h6" /></> },
            { title: 'Toggle VP',      onClick: toggleVP,                icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> },
            { title: 'Toggle cone',    onClick: toggleConeLocal,         icon: <><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></> },
            null, // divider
            { title: 'Reset view',     onClick: () => { useVisualizerStore.getState().resetControls(); posRef.current.manAdj = 0 }, icon: <><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></> },
          ].map((btn, i) =>
            btn === null ? (
              <div key={`d-${i}`} className="w-px h-[18px] bg-warm-gray mx-0.5" />
            ) : (
              <button
                key={btn.title}
                title={btn.title}
                onClick={btn.onClick}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-mid-gray hover:bg-offwhite hover:text-dark transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth={1.7}>
                  {btn.icon}
                </svg>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/visualizer/CanvasArea.tsx components/visualizer/ScanOverlay.tsx
git commit -m "feat(visualizer): add canvas area with draggable fixture and perspective engine"
```

---

## Task 9: Right Panel — Perspective Engine + Sliders + CTA

**Files:**
- Create: `components/visualizer/RightPanel.tsx`

- [ ] **Step 1: Create `components/visualizer/RightPanel.tsx`**

```typescript
// components/visualizer/RightPanel.tsx
'use client'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { useCartStore } from '@/lib/stores/cartStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'

export default function RightPanel() {
  const {
    perspData, placedProductId, products,
    litVal, opVal, cordVal, manVal,
    setLitVal, setOpVal, setCordVal, setManVal,
  } = useVisualizerStore((s) => ({
    perspData: s.perspData,
    placedProductId: s.placedProductId,
    products: s.products,
    litVal: s.litVal,
    opVal: s.opVal,
    cordVal: s.cordVal,
    manVal: s.manVal,
    setLitVal: s.setLitVal,
    setOpVal: s.setOpVal,
    setCordVal: s.setCordVal,
    setManVal: s.setManVal,
  }))

  const placedProduct = placedProductId !== null
    ? products.find((p) => p.id === placedProductId) ?? null
    : null

  return (
    <div className="w-[224px] shrink-0 bg-white border-l border-warm-gray overflow-y-auto flex flex-col gap-[18px] px-3.5 py-4">

      {/* Perspective Engine */}
      <div>
        <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">
          Perspective Engine
        </p>
        <div className="bg-offwhite rounded-md p-3 border border-warm-gray">
          {/* SVG diagram */}
          <svg viewBox="0 0 196 72" width="100%" style={{ display: 'block', marginBottom: 4 }}>
            <line x1="98" y1="14" x2="16"  y2="66" stroke="#E0DCD6" strokeWidth="1" />
            <line x1="98" y1="14" x2="180" y2="66" stroke="#E0DCD6" strokeWidth="1" />
            <line x1="16" y1="66" x2="180" y2="66" stroke="#E0DCD6" strokeWidth="1" />
            <circle cx="98" cy="14" r="3" fill="#C4714A" opacity=".75" />
            <text x="98" y="9" textAnchor="middle" fontSize="7" fill="#C4714A" fontFamily="Outfit" letterSpacing="1">VP</text>
            <circle cx="98" cy="23" r="4" fill="none" stroke="#C4714A" strokeWidth="1" />
            <line x1="98" y1="14" x2="98" y2="19" stroke="#C4714A" strokeWidth="1" />
            <text x="98" y="34" textAnchor="middle" fontSize="6" fill="#C4714A" fontFamily="Outfit">
              {perspData ? `${perspData.dScale.toFixed(2)}×` : '0.45×'}
            </text>
            <circle cx="98" cy="56" r="7.5" fill="none" stroke="#C4714A" strokeWidth="1.2" />
            <line x1="98" y1="14" x2="98" y2="48" stroke="#C4714A" strokeWidth="1" strokeDasharray="3,2" />
            <text x="98" y="70" textAnchor="middle" fontSize="6" fill="#C4714A" fontFamily="Outfit">1.0×</text>
          </svg>

          {/* Stats */}
          <div className="flex flex-col gap-[7px] mt-2">
            {[
              { label: 'Depth Scale', value: perspData ? `${perspData.dScale.toFixed(2)}×` : '—' },
              { label: 'Ceiling Dist', value: perspData ? `${Math.round((1 - perspData.dr) * 100)}% from VP` : '—' },
              { label: 'Convergence', value: perspData ? `${Math.round(perspData.conv * 100)}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[10px] text-mid-gray">{label}</span>
                <span className="text-[11px] text-dark font-normal">
                  {perspData
                    ? <span className="text-gold">{value}</span>
                    : <span>—</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fine-Tune sliders */}
      <div>
        <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">
          Fine-Tune
        </p>
        <div className="flex flex-col gap-3.5">
          <Slider
            label="Manual Scale"
            value={manVal}
            min={-50}
            max={50}
            display={(v) => (v > 0 ? '+' : '') + v + '%'}
            onChange={setManVal}
          />
          <Slider
            label="Light Intensity"
            value={litVal}
            min={0}
            max={100}
            display={(v) => v + '%'}
            onChange={setLitVal}
          />
          <Slider
            label="Fixture Opacity"
            value={opVal}
            min={30}
            max={100}
            display={(v) => v + '%'}
            onChange={setOpVal}
          />
          <Slider
            label="Cord Length"
            value={cordVal}
            min={0}
            max={100}
            display={(v) => v + '%'}
            onChange={setCordVal}
          />
        </div>
      </div>

      {/* CTA block — only shown when a fixture is placed */}
      {placedProduct && <CTABlock product={placedProduct} />}
    </div>
  )
}

// ─── Slider sub-component ─────────────────────────────────────────────────────
function Slider({
  label, value, min, max, display, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  display: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10.5px]">
        <span className="text-mid-gray">{label}</span>
        <span className="text-gold font-medium">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="viz-range"
      />
    </div>
  )
}

// ─── CTA block ────────────────────────────────────────────────────────────────
function CTABlock({ product }: { product: VisualizerProduct }) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price.replace(/[₹,\s]/g, '')),
      image: product.thumb,
      size: 'Standard',
      finish: 'Default',
      quantity: 1,
    })
  }

  return (
    <div className="border-t border-warm-gray pt-4">
      <p className="text-[9.5px] tracking-[2px] uppercase text-mid-gray mb-2.5">
        Ready to Order
      </p>
      <div className="font-serif text-[15px] mb-0.5">{product.name}</div>
      <div className="text-sm text-gold font-medium mb-3">{product.price}</div>
      <button
        onClick={handleAddToCart}
        className="w-full py-2.5 bg-dark text-white text-[10.5px] tracking-[1.5px] uppercase rounded-[5px] hover:bg-[#2e2c2a] transition-colors mb-1.5 cursor-pointer font-sans"
      >
        Add to Cart
      </button>
      <button className="w-full py-2.5 bg-transparent text-mid-gray text-[10.5px] tracking-[1.2px] uppercase rounded-[5px] border border-warm-gray hover:border-gold hover:text-gold transition-colors cursor-pointer font-sans">
        Book a Consultation
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/visualizer/RightPanel.tsx
git commit -m "feat(visualizer): add right panel with perspective display, sliders, and CTA"
```

---

## Task 10: Wire Everything — Main Visualizer Client

**Files:**
- Modify: `components/visualizer/RoomVisualizerClient.tsx`

- [ ] **Step 1: Replace `RoomVisualizerClient.tsx` with full implementation**

```typescript
// components/visualizer/RoomVisualizerClient.tsx
'use client'
import { useEffect } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import StepBar from './StepBar'
import RoomTypeStep from './RoomTypeStep'
import UploadStep from './UploadStep'
import ProductPanel from './ProductPanel'
import CanvasArea from './CanvasArea'
import RightPanel from './RightPanel'

export default function RoomVisualizerClient() {
  const step = useVisualizerStore((s) => s.step)

  // Reset store when leaving the page
  useEffect(() => {
    return () => useVisualizerStore.getState().resetAll()
  }, [])

  // Steps 1 & 2: full-screen centered steps (no 3-panel layout)
  const isSetupStep = step <= 2

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100dvh - 64px)' }}
    >
      <StepBar />

      {/* Setup steps (Room Type + Upload) */}
      {isSetupStep && (
        <div className="flex-1 overflow-hidden flex">
          {step === 1 && <RoomTypeStep />}
          {step === 2 && <UploadStep />}
        </div>
      )}

      {/* 3-panel layout (Analyse → Select → Visualise) */}
      {!isSetupStep && (
        <div
          className="flex-1 overflow-hidden"
          style={{ display: 'grid', gridTemplateColumns: '272px 1fr 224px' }}
        >
          <ProductPanel />
          <CanvasArea />
          <RightPanel />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify full flow**

Run `npm run dev`. Walk through the complete user journey:

1. `/room-visualizer` loads → Step 1 active, 5 room type cards visible
2. Click "Living Room" → Step 2 active, upload zone appears with "Living Room" chip
3. Click "Try the interactive demo" → Step 3 active, scanning animation appears (2.7s)
4. After scan → Step 4 active, 3-panel layout appears:
   - Left: Room Analysis filled (Living Room, ~9.5 ft, Modern Eclectic, etc.), 5 products listed
   - Center: Demo CSS room visible, toolbar at bottom
   - Right: Perspective Engine (stats show —), Fine-Tune sliders
5. Click a product in left panel → it gets selected (gold border), "Place…" button enabled
6. Click "Place…" → Step 5 active, fixture appears on canvas at 50% width / 22% height
7. Drag fixture → perspective scales update, right panel stats update live
8. Adjust sliders (Light Intensity, Cord Length, etc.) → fixture updates live
9. Click "Add to Cart" in right panel → product added to cart (cart count in Header increments)
10. Toolbar: zoom in/out shifts scale, VP toggle shows crosshair, cone toggle hides light cone, reset resets sliders

Expected: no console errors.

- [ ] **Step 3: Commit**

```bash
git add components/visualizer/RoomVisualizerClient.tsx
git commit -m "feat(visualizer): wire all panels in main orchestrator component"
```

---

## Task 11: Header Nav Link

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Read `components/layout/Header.tsx`**

Read the file to find the desktop nav links array (typically `<nav>` with `<Link>` items).

- [ ] **Step 2: Add Visualizer link**

Find the nav links array. It likely looks like:
```tsx
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/collections', label: 'Collections' },
  // ...
]
```

Add the Visualizer entry:
```tsx
{ href: '/room-visualizer', label: 'Visualizer' },
```

Also add it to the mobile menu if there is a separate mobile nav links array.

- [ ] **Step 3: Verify**

Navigate to any page. Confirm "Visualizer" appears in the Header nav and clicking it goes to `/room-visualizer`.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(visualizer): add Visualizer nav link to Header"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Covered By |
|---|---|
| Room type input before upload | Task 5 — `RoomTypeStep` (step 1), `setRoomType()` advances to step 2 |
| Upload room image | Task 6 — `UploadStep` drag-drop + file input |
| Demo mode | Task 6 — "Try the interactive demo" triggers `setImage('', true)` |
| AI-style room analysis | Tasks 1+8 — `getAnalysisForRoom()` mock, triggered by 2.7s scan timer |
| Decorative light suggestions ranked by room type | Tasks 1+7 — `getProductsForRoom()` returns sorted products |
| Interactive — drag fixture | Task 8 — `makeDrag()` with mouse + touch events |
| Perspective scaling | Task 8 — `calcPerspective()` and `applyFixturePos()` |
| Fine-tune sliders | Task 9 — Manual Scale, Light Intensity, Fixture Opacity, Cord Length |
| Light cone canvas | Task 8 — `drawLightCone()` using HTML Canvas 2D |
| Step progress bar | Task 4 — `StepBar` with 5 steps |
| Add to Cart | Task 9 — `CTABlock` uses `useCartStore.addItem` |
| Canvas toolbar (zoom, VP, cone, reset) | Task 8 — toolbar buttons |
| Matches GlitterOn theme | All tasks — uses `var(--color-gold)`, `font-serif`, `font-sans`, Tailwind tokens |

### Placeholder Check


No TBD, TODO, "implement later", or "fill in details" in this plan. ✓

### Type Consistency Check

- `VisualizerProduct` defined in Task 1, used in Tasks 7, 8, 9 — consistent `id`, `name`, `type`, `price`, `match`, `thumb`, `full`, `iw`, `ih` ✓
- `useVisualizerStore` — `setManVal`/`manVal` used in Task 2 store and Task 9 RightPanel — consistent ✓
- `calcPerspective` returns `{ dScale, px, dr, vpX, vpY }` — used in Task 8 `applyFixturePos` and stored as `{ dScale, dr, conv }` via `setPerspData` — consistent ✓
- `cordVal` used in both Task 8 (`cord.style.height`) and Task 9 (Cord Length slider) — consistent ✓

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-28-room-visualizer-page.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration. Uses `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execute tasks in this session with checkpoints. Uses `superpowers:executing-plans`.

**Which approach?**
