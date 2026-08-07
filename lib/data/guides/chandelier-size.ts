import type { Guide } from './types'

export const chandelierSize: Guide = {
  slug: 'what-size-chandelier',
  title: 'What size chandelier do you need?',
  metaTitle: 'What Size Chandelier Do You Need? Room-by-Room Sizing',
  description:
    'Add your room’s length and width in feet and read the total in inches — that is your chandelier diameter. Full sizing rules for height, ceiling clearance and over-table fixtures.',
  category: 'Sizing guide',
  answer:
    'Add the room’s length and width in feet, then read that number in inches: a 12 ft × 14 ft room takes a chandelier about 26 inches across. For height, allow 2.5 to 3 inches of fixture for every foot of ceiling — a 10 ft ceiling suits a chandelier 25 to 30 inches tall. Over a table, ignore the room and size to the table instead.',
  updated: '2026-08-07',
  sections: [
    {
      id: 'diameter',
      heading: 'How wide should a chandelier be?',
      blocks: [
        {
          type: 'p',
          text: 'The convention almost every lighting designer starts from: add the length and the width of the room in feet, and treat the total as a diameter in inches. It works because it scales with floor area rather than with any single wall, so a long narrow room and a square room of the same size land in the same place.',
        },
        {
          type: 'table',
          caption: 'Chandelier diameter by room size',
          head: ['Room size', 'Sum (ft)', 'Suggested diameter'],
          rows: [
            ['10 × 10 ft', '20', '20 in (50 cm)'],
            ['12 × 12 ft', '24', '24 in (61 cm)'],
            ['12 × 16 ft', '28', '28 in (71 cm)'],
            ['14 × 18 ft', '32', '32 in (81 cm)'],
            ['16 × 20 ft', '36', '36 in (91 cm)'],
          ],
        },
        {
          type: 'p',
          text: 'Treat the result as the centre of a range, not a fixed figure. Go 10 per cent under if the room is already busy — heavy furniture, a strong rug, art on three walls. Go 10 per cent over if the chandelier is meant to be the thing people notice when they walk in, or if the ceiling is above 11 feet, where a correctly sized fixture can still read as small.',
        },
      ],
    },
    {
      id: 'height',
      heading: 'How tall should the fixture itself be?',
      blocks: [
        {
          type: 'p',
          text: 'Allow 2.5 to 3 inches of fixture height for every foot of ceiling height. This is about proportion in the vertical, and it is the rule people most often skip — a chandelier that is the right width but half the right height looks like a plate stuck to the ceiling.',
        },
        {
          type: 'table',
          caption: 'Fixture height by ceiling height',
          head: ['Ceiling height', 'Fixture height', 'Typical form'],
          rows: [
            ['8 ft', '20–24 in', 'Semi-flush or compact chandelier'],
            ['9 ft', '22–27 in', 'Standard chandelier'],
            ['10 ft', '25–30 in', 'Tiered or multi-arm chandelier'],
            ['12 ft', '30–36 in', 'Tall tiered or cascading fixture'],
            ['14 ft +', '35 in +', 'Cascade or linear suspension'],
          ],
        },
      ],
    },
    {
      id: 'clearance',
      heading: 'How high should it hang?',
      blocks: [
        {
          type: 'list',
          items: [
            'In any space people walk under — an entry, a landing, a corridor — keep at least 7 ft (about 2.1 m) between the floor and the lowest point of the fixture.',
            'Over a dining table or an island, hang the bottom 30 to 36 in above the surface. There is nothing to walk under, so the fixture can come down to where it lights faces rather than heads.',
            'On ceilings above 8 ft, add roughly 3 in of drop for every extra foot of ceiling so the fixture stays in proportion to the wall it hangs against.',
            'In a double-height entry, centre the fixture in the window when seen from outside. The view from the street is the one most people judge it by.',
          ],
        },
        {
          type: 'note',
          text: 'Measure to the lowest point of the fixture, not to the canopy at the ceiling. On a cascading design the difference can be a foot or more.',
        },
      ],
    },
    {
      id: 'over-a-table',
      heading: 'What about over a dining table?',
      blocks: [
        {
          type: 'p',
          text: 'Over a table, the room stops being the reference. Size to the table: the fixture should be roughly half to two-thirds the table’s width, and never wider than the table minus 6 inches at each end. A 42-inch-wide table takes a 21 to 28 inch fixture.',
        },
        {
          type: 'p',
          text: 'That is the whole rule, but the full treatment — hanging heights, multi-pendant spacing, what to do over a long rectangular table — is in the dining table guide.',
        },
      ],
    },
    {
      id: 'sanity-check',
      heading: 'A last check before you buy',
      blocks: [
        {
          type: 'list',
          items: [
            'Cut the diameter out of paper, tape it to the ceiling and live with it for a day. It costs nothing and catches most mistakes.',
            'Check the ceiling box is rated for the fixture’s weight. Anything above 22 kg (50 lb) usually needs a fan-rated brace or a joist fixing.',
            'Check the drop is adjustable. Rods and chains can be shortened; a fixed stem cannot be lengthened.',
            'Photograph the room and try the fixture in it with our room visualizer before committing.',
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'What size chandelier for a 12x12 room?',
      answer:
        'About 24 inches across. Add the room’s length and width in feet (12 + 12 = 24) and read the total in inches. On a 9 ft ceiling, pair that with a fixture 22 to 27 inches tall.',
    },
    {
      question: 'Can a chandelier be too big for a room?',
      answer:
        'Yes, but the more common mistake is far and away the opposite — an undersized fixture that reads as an afterthought. The practical ceiling is walkway clearance and furniture: keep 7 ft of headroom under it, and keep at least 4 ft between the fixture and every wall.',
    },
    {
      question: 'How high should a chandelier hang from the floor?',
      answer:
        'At least 7 feet from the floor to the lowest point of the fixture wherever people walk beneath it. Over a table or island, the measurement changes to 30 to 36 inches above the surface instead.',
    },
    {
      question: 'Does ceiling height change the size of chandelier I need?',
      answer:
        'It changes the height of the fixture, not its width. Diameter comes from the floor area; height comes from the ceiling at 2.5 to 3 inches of fixture per foot of ceiling. On ceilings above 11 feet, size up the diameter by around 10 per cent as well.',
    },
  ],
  shop: [
    { label: 'Shop chandeliers', href: '/collections?category=Chandelier+Lights' },
    { label: 'Living room lighting', href: '/rooms/living-room' },
    { label: 'Try the room visualizer', href: '/room-visualizer' },
  ],
}
