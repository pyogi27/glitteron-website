import Image from 'next/image'
import Link from 'next/link'
import { rooms } from '@/lib/data'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

export default function RoomGrid() {
  return (
    <section className="py-[100px] px-4 md:px-12 bg-[#F4F1EB]">
      <RevealOnScroll className="text-center mb-14">
        <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">By Room</div>
        <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light leading-[1.15]">
          Shop by <em className="italic">space</em>
        </h2>
      </RevealOnScroll>
      <div className="grid grid-cols-2 md:grid-cols-3 md:grid-rows-2 gap-4 h-auto md:h-[520px]">
        {/* Large featured room */}
        <Link href={`/collections?room=${rooms[0].slug}`}
          className="col-span-2 md:col-span-1 md:row-span-2 relative rounded-2xl overflow-hidden group no-underline aspect-[4/3] md:aspect-auto">
          <Image src={rooms[0].image} alt={rooms[0].name} fill priority className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" sizes="33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-5 left-5 text-white">
            <div className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#C8A96E] mb-1">{rooms[0].tag}</div>
            <div className="font-serif text-[22px] font-light">{rooms[0].name}</div>
            <div className="text-[11px] text-white/60">{rooms[0].count} styles</div>
          </div>
        </Link>
        {/* 4 smaller rooms */}
        {rooms.slice(1).map((room) => (
          <Link key={room.id} href={`/collections?room=${room.slug}`}
            className="relative rounded-2xl overflow-hidden group no-underline aspect-[4/3] md:aspect-auto">
            <Image src={room.image} alt={room.name} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" sizes="33vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <div className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#C8A96E] mb-0.5">{room.tag}</div>
              <div className="font-serif text-[17px] font-light">{room.name}</div>
              <div className="text-[10px] text-white/60">{room.count} styles</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
