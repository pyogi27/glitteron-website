import { categories } from '@/lib/data/categories'

// Only profiles we can verify. Dead href="#" links are worse than no link, and
// each real one is a sameAs signal for the Organization schema.
// TODO: add facebook / pinterest / youtube here once those profiles exist.
export const SOCIAL_LINKS = [
  { platform: 'Instagram', href: 'https://www.instagram.com/litmeup.in/' },
] as const

// Category links point at the flat landing pages (/pendant-lights), not the
// ?category= filter view — those are the indexed URLs and the ones carrying the
// category copy. Room links point at the real /rooms/[slug] pages.
export const FOOTER_COLUMNS = [
  {
    title: 'Shop by Category',
    links: [
      ...categories.map(c => ({ label: c.heading, href: `/${c.slug}` })),
      { label: 'Shop All Lights', href: '/collections' },
    ],
  },
  {
    title: 'Shop by Room',
    links: [
      { label: 'Living Room', href: '/rooms/living-room' },
      { label: 'Dining Room', href: '/rooms/dining-room' },
      { label: 'Bedroom', href: '/rooms/bedroom' },
      { label: 'Kitchen & Island', href: '/rooms/kitchen' },
      { label: 'Shop All Rooms', href: '/rooms' },
    ],
  },
  {
    title: 'Help & Policies',
    links: [
      { label: 'Lighting Guides', href: '/guides' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Shipping Policy', href: '/shipping' },
      { label: 'Returns & Exchange', href: '/returns' },
      { label: 'Room Visualizer', href: '/room-visualizer' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
] as const

// Shared hover/focus treatment: clay colour plus an underline that draws in.
// Focus-visible gets the same cue plus a ring so keyboard users are not left
// with the browser default.
export const FOOTER_LINK_CLASS =
  'relative inline-block text-[13px] text-[#5C5449] no-underline cursor-none transition-colors duration-200 ' +
  'after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#A8552C] after:transition-transform after:duration-300 ' +
  'hover:text-[#A8552C] hover:after:scale-x-100 ' +
  'focus-visible:text-[#A8552C] focus-visible:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8552C] rounded-sm'
