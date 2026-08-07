import type { Guide } from './types'

export const diningTableLighting: Guide = {
  slug: 'how-high-to-hang-a-dining-light',
  title: 'How high to hang a light over a dining table',
  metaTitle: 'How High to Hang a Light Over a Dining Table',
  description:
    'Hang the bottom of the fixture 30 to 36 inches above the tabletop, and size it to half or two-thirds the table’s width. Heights, widths and multi-pendant spacing.',
  category: 'Sizing guide',
  answer:
    'Hang the bottom of the fixture 30 to 36 inches (76–91 cm) above the tabletop, measured to its lowest point. Size it to between half and two-thirds of the table’s width, leaving at least 6 inches clear at each end. On ceilings above 8 feet, add about 3 inches of height for every extra foot.',
  updated: '2026-08-07',
  sections: [
    {
      id: 'height',
      heading: 'The hanging height, and why it is lower than you think',
      blocks: [
        {
          type: 'p',
          text: 'Thirty to thirty-six inches above the table feels low if you are standing next to it holding the fixture. Sit down and it is right. Nobody walks under a dining light, so it can drop to where it lights faces and food instead of the tops of heads — that is the whole point of hanging it there.',
        },
        {
          type: 'table',
          caption: 'Hanging height by ceiling height',
          head: ['Ceiling', 'Above tabletop', 'Notes'],
          rows: [
            ['8 ft', '30–32 in', 'The standard. Err low over a narrow table.'],
            ['9 ft', '33–34 in', 'Add roughly 3 in per extra foot of ceiling.'],
            ['10 ft', '36 in', 'Consider a taller fixture rather than a longer rod.'],
            ['12 ft +', '36–40 in', 'A longer drop alone leaves too much empty wall above.'],
          ],
        },
        {
          type: 'note',
          text: 'Go to the upper end of the range if anyone at the table will be looking through the fixture at someone opposite. Go lower if the shade is opaque and the bulb would otherwise be in view.',
        },
      ],
    },
    {
      id: 'width',
      heading: 'How wide should the fixture be?',
      blocks: [
        {
          type: 'p',
          text: 'Half to two-thirds of the table’s width, and never within 6 inches of either long edge. A fixture that overhangs the table looks like a mistake and gets caught by anyone reaching across.',
        },
        {
          type: 'table',
          caption: 'Fixture width by table width',
          head: ['Table width', 'Fixture width', 'Hard maximum'],
          rows: [
            ['36 in', '18–24 in', '24 in'],
            ['42 in', '21–28 in', '30 in'],
            ['48 in', '24–32 in', '36 in'],
            ['60 in (round)', '30–40 in', '48 in'],
          ],
        },
      ],
    },
    {
      id: 'long-tables',
      heading: 'Long rectangular tables: one fixture or several?',
      blocks: [
        {
          type: 'p',
          text: 'Past about 72 inches of table, a single round fixture stops working — it lights the middle and leaves the ends dim. Two choices from there.',
        },
        {
          type: 'list',
          items: [
            'A linear suspension: one fixture, roughly half to two-thirds the table length, centred. The cleanest option, and only one ceiling point to wire.',
            'Two or three pendants in a row: centre the group on the table, space them 24 to 30 in apart, and keep the outer two at least 12 in inside the table ends.',
            'Whichever you choose, centre on the table, not on the room. A table that sits off-centre under a centred light looks wrong from every seat.',
          ],
        },
      ],
    },
    {
      id: 'light-quality',
      heading: 'Getting the light itself right',
      blocks: [
        {
          type: 'list',
          items: [
            'Warm colour temperature: 2700K. Food and skin both look better under it, and anything cooler reads clinical over a table.',
            'Dimmable, always. A dining light does breakfast and it does dinner, and those are not the same light.',
            'CRI 90 or above so colour on the plate is true.',
            'Shield the bulb. At seated eye level a bare filament across the table is glare, however pretty it looks switched off.',
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'How high should a pendant hang over a dining table?',
      answer:
        'Between 30 and 36 inches from the tabletop to the lowest point of the pendant. On ceilings taller than 8 feet, add about 3 inches for every additional foot of ceiling.',
    },
    {
      question: 'How wide should a dining room chandelier be?',
      answer:
        'Half to two-thirds of the table’s width. A 48-inch table takes a fixture of roughly 24 to 32 inches, and it should never come within 6 inches of the table’s long edges.',
    },
    {
      question: 'How many pendants over a dining table?',
      answer:
        'One fixture up to about 72 inches of table. Beyond that, use a linear suspension or two to three pendants spaced 24 to 30 inches apart, centred on the table with the outer pendants at least 12 inches inside the ends.',
    },
    {
      question: 'Should a dining light be centred on the table or the room?',
      answer:
        'On the table. If the table cannot move and the existing ceiling point is off-centre, use a swag hook or a track-mounted fixture to bring the light over the table rather than living with the offset.',
    },
  ],
  shop: [
    { label: 'Dining room lighting', href: '/rooms/dining-room' },
    { label: 'Shop pendant lights', href: '/collections?category=Pendant+Lights' },
    { label: 'Shop chandeliers', href: '/collections?category=Chandelier+Lights' },
  ],
}
