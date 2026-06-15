import Link from 'next/link'
import { rooms } from '@/lib/data'

interface Props {
  activeSlug: string
}

export default function RoomSwitcher({ activeSlug }: Props) {
  return (
    <div className="bg-[#EDE8E0] border-b border-[#D8D0C4]">
      <div className="relative px-4 md:px-8 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-end gap-0 min-w-max">
          {rooms.map(room => {
            const isActive = room.slug === activeSlug
            return (
              <Link
                key={room.slug}
                href={`/rooms/${room.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative px-5 py-4 text-[13px] font-medium tracking-[0.04em] whitespace-nowrap no-underline
                  transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A] focus-visible:ring-offset-1
                  ${isActive ? 'text-[#2C2825]' : 'text-[#A09488] hover:text-[#5C4A3A]'}
                `}
              >
                {room.name}
                <span
                  className={`
                    absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full
                    transition-all duration-200
                    ${isActive ? 'bg-[#C4714A] opacity-100' : 'bg-transparent opacity-0'}
                  `}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
