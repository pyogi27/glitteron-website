import Image from 'next/image'
import Link from 'next/link'
import { rooms } from '@/lib/data'

export default function RoomGrid() {
  return (
    <section className="py-[100px] px-4 md:px-12 bg-[#EDE8E0]">
      {/* Header */}
      <div className="flex items-end justify-between mb-14">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
            <span className="w-8 h-px bg-[#C4714A] inline-block" />
            Shop by Space
          </div>
          <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light leading-[1.15]">
            Light for Every <em className="italic">Room</em>
          </h2>
        </div>
        <Link
          href="/collections"
          className="text-[12px] font-medium tracking-[0.1em] uppercase text-[#2C2825] opacity-50 hover:opacity-100 flex items-center gap-2 no-underline border-b border-[#D8D0C4] pb-1 transition-all hover:gap-3.5"
        >
          All Collections
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Asymmetric grid — desktop */}
      <div className="room-grid hidden md:grid">
        {rooms.map((room, i) => (
          <Link
            key={room.id}
            href={`/rooms/${room.slug}`}
            className="rg-card no-underline block"
          >
            {/* Image */}
            <Image
              src={room.image}
              alt={room.name}
              fill
              className="rg-img object-cover object-center"
              sizes="(max-width: 1024px) 50vw, 33vw"
              priority={i === 0}
            />

            {/* Base gradient overlay */}
            <div
              className="rg-overlay absolute inset-0 z-[1] transition-all duration-[400ms]"
              style={{
                background: 'linear-gradient(to top, rgba(26,18,16,0.82) 0%, rgba(26,18,16,0.22) 45%, rgba(26,18,16,0.05) 100%)',
              }}
            />

            {/* Frosted pill — top left */}
            <div
              className="rg-pill absolute top-4 left-4 z-[3] rounded-[40px] px-3 py-[5px] text-[10px] font-medium tracking-[0.12em] uppercase"
              style={{
                background: 'rgba(26,18,16,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(250,247,243,0.12)',
                color: 'rgba(250,247,243,0.75)',
              }}
            >
              {room.count} designs
            </div>

            {/* Info bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-[3] p-[28px_26px_26px]">
              <div
                className="text-[9px] font-semibold tracking-[0.2em] uppercase mb-1.5 transition-opacity duration-300"
                style={{ color: '#E8A87C', opacity: 0.8 }}
              >
                {room.tag}
              </div>
              <div
                className="font-serif font-light leading-[1.15] mb-2.5 text-[#EDE8E0]"
                style={{ fontSize: i === 0 ? 'clamp(24px, 2.4vw, 36px)' : 'clamp(18px, 1.8vw, 26px)' }}
                dangerouslySetInnerHTML={{ __html: i === 0 ? room.name.replace(' ', '<br>') : room.name }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.08em]" style={{ color: 'rgba(250,247,243,0.48)' }}>
                  {room.subtitle}
                </span>
                <span
                  className="rg-arrow w-[34px] h-[34px] rounded-full border-[1.5px] flex items-center justify-center text-white flex-shrink-0"
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

      {/* Mobile: simple 2-col grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {rooms.map((room, i) => (
          <Link
            key={room.id}
            href={`/rooms/${room.slug}`}
            className={`relative rounded-2xl overflow-hidden no-underline block ${i === 0 ? 'col-span-2 h-[220px]' : 'h-[160px]'}`}
          >
            <Image
              src={room.image}
              alt={room.name}
              fill
              className="object-cover object-center"
              sizes="50vw"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,18,16,0.78) 0%, transparent 60%)' }} />
            <div className="absolute bottom-3 left-4">
              <div className="text-[9px] font-medium tracking-[0.16em] uppercase text-[#E8A87C] mb-0.5">{room.tag}</div>
              <div className="font-serif text-[16px] font-light text-[#EDE8E0]">{room.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
