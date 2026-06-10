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
