import Image from 'next/image'
import { Room } from '@/lib/types'

interface Props {
  room: Room
  total: number
}

export default function RoomBanner({ room, total }: Props) {
  return (
    <div className="relative pt-header bg-[#2C2825] text-white overflow-hidden">
      {/* Room image — right side, fading into the dark banner */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[55%]">
        <Image
          src={room.image}
          alt={room.name}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 55vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #2C2825 0%, rgba(44,40,37,0.86) 30%, rgba(44,40,37,0.45) 70%, rgba(44,40,37,0.35) 100%)',
          }}
        />
      </div>

      <div className="relative z-[1] max-w-[900px] px-6 md:px-12 pt-12 pb-12">
        <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#E8A87C] mb-4">
          <span className="w-8 h-px bg-[#E8A87C] inline-block" />
          Shop by Space · {room.tag}
        </div>
        <h1 className="font-serif text-[clamp(36px,5vw,64px)] font-light leading-[1.1] mb-4">
          {room.name}
        </h1>
        <p className="text-[14px] font-light text-white/55 max-w-[480px] leading-[1.8] mb-8">
          {room.subtitle}
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-[28px] font-light text-[#C4714A]">{total}</span>
          <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-white/45">
            {total === 1 ? 'Design' : 'Designs'} curated for this space
          </span>
        </div>
      </div>
    </div>
  )
}
