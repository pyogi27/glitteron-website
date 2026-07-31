import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PageBanner from '@/components/collections/PageBanner'
import { fetchProducts } from '@/lib/api/server'
import { rooms } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Shop by Room — LitMeUp',
  description:
    'Find the right light for every space — living room, dining, bedroom, kitchen and home office.',
}

export default async function RoomsPage() {
  const totals = await Promise.all(
    rooms.map(async room => {
      const { total } = await fetchProducts({ whereUsed: room.whereUsed, page: 1, limit: 1 })
      return total
    }),
  )

  return (
    <>
      <PageBanner
        title="Shop by Room"
        subtitle="Every space asks for a different kind of light. Start with the room — we'll show you the pieces that belong there."
        stats={[
          { num: String(rooms.length), label: 'Spaces' },
          { num: '500+', label: 'Designs' },
          { num: '5yr', label: 'Warranty' },
        ]}
      />

      <section className="bg-[#EDE8E0] py-14 px-4 md:px-12 min-h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {rooms.map((room, i) => (
            <Link
              key={room.id}
              href={`/rooms/${room.slug}`}
              className={`group relative rounded-2xl overflow-hidden no-underline block h-[300px] md:h-[360px] ${i === 0 ? 'sm:col-span-2 lg:col-span-2 md:h-[420px]' : ''}`}
            >
              <Image
                src={room.image}
                alt={room.name}
                fill
                priority={i === 0}
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes={i === 0 ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
              />

              <div
                className="absolute inset-0 transition-all duration-[400ms]"
                style={{
                  background:
                    'linear-gradient(to top, rgba(26,18,16,0.82) 0%, rgba(26,18,16,0.22) 45%, rgba(26,18,16,0.05) 100%)',
                }}
              />

              {totals[i] > 0 && (
                <div
                  className="absolute top-4 left-4 rounded-[40px] px-3 py-[5px] text-[10px] font-medium tracking-[0.12em] uppercase"
                  style={{
                    background: 'rgba(26,18,16,0.55)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(250,247,243,0.12)',
                    color: 'rgba(250,247,243,0.75)',
                  }}
                >
                  {totals[i]} {totals[i] === 1 ? 'design' : 'designs'}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-[28px_26px_26px]">
                <div
                  className="text-[9px] font-semibold tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: '#E8A87C', opacity: 0.8 }}
                >
                  {room.tag}
                </div>
                <div
                  className="font-serif font-light leading-[1.15] mb-2.5 text-[#EDE8E0]"
                  style={{ fontSize: i === 0 ? 'clamp(24px, 2.4vw, 36px)' : 'clamp(18px, 1.8vw, 26px)' }}
                >
                  {room.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-[0.08em]" style={{ color: 'rgba(250,247,243,0.48)' }}>
                    {room.subtitle}
                  </span>
                  <span
                    className="w-[34px] h-[34px] rounded-full border-[1.5px] flex items-center justify-center text-white flex-shrink-0 transition-all duration-300 group-hover:bg-[#C4714A] group-hover:border-[#C4714A]"
                    style={{ borderColor: 'rgba(250,247,243,0.3)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
