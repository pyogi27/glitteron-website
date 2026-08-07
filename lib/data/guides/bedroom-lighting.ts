import type { Guide } from './types'

export const bedroomLighting: Guide = {
  slug: 'bedroom-lighting-ideas',
  title: 'How to light a bedroom',
  metaTitle: 'How to Light a Bedroom: Heights, Kelvin and Bedside Options',
  description:
    'Hang bedside pendants 20 to 26 inches above the mattress, keep everything at 2700K or warmer, and never light a bedroom from one central fixture alone.',
  category: 'Planning guide',
  answer:
    'Hang bedside pendants so the bottom sits 20 to 26 inches above the mattress top, or mount wall lights 30 to 36 inches above it. Keep every source at 2700K or warmer, dim everything, and add a second layer — a bedroom lit only from the ceiling has no evening setting.',
  updated: '2026-08-07',
  sections: [
    {
      id: 'bedside',
      heading: 'The bedside decision: pendant, wall light or lamp',
      blocks: [
        {
          type: 'p',
          text: 'This is the choice that defines the room. All three work; they differ in what they cost you in nightstand space and in wiring.',
        },
        {
          type: 'table',
          caption: 'Bedside options compared',
          head: ['Option', 'Height', 'Trade-off'],
          rows: [
            ['Pendant', '20–26 in above mattress', 'Frees the whole nightstand. Needs a ceiling point in the right place.'],
            ['Wall light', '30–36 in above mattress', 'Frees the nightstand, swing arms adjust. Needs wall wiring.'],
            ['Table lamp', '24–30 in overall height', 'No wiring work. Eats half the nightstand.'],
          ],
        },
        {
          type: 'note',
          text: 'Whatever you choose, the bottom of the shade should sit near eye level when you are sitting up in bed. Too high and you are looking straight at the bulb; too low and the book is in shadow.',
        },
      ],
    },
    {
      id: 'layers',
      heading: 'Three settings, not one',
      blocks: [
        {
          type: 'list',
          items: [
            'Bright: the ambient fixture at full, for finding things and making the bed. A chandelier or ceiling light sized by the room — length plus width in feet, read as inches of diameter.',
            'Reading: bedside lights only, warm, controlled from the bed. If a switch for the bedside light is across the room, it will not get used.',
            'Low: something at 2200–2400K near the floor or behind furniture, for the last hour of the evening. Amber light at low level is what the body reads as night.',
            'Wardrobe or dressing area: this one is task light, not mood. It wants a higher CRI so colour is true when you are choosing what to wear.',
          ],
        },
      ],
    },
    {
      id: 'ceiling',
      heading: 'The ceiling fixture, if you have one',
      blocks: [
        {
          type: 'list',
          items: [
            'Centre it on the room, not on the bed. A fixture centred on the bed hangs over the face of whoever is lying under it.',
            'Keep 7 ft of clearance from the floor in the walking areas around the bed.',
            'On an 8 ft ceiling, a semi-flush fixture usually beats a hanging one — a bedroom is a room you move around half-asleep.',
            'Never point a downlight at the pillow. If there are downlights, they belong over the circulation space and the wardrobe.',
          ],
        },
      ],
    },
    {
      id: 'controls',
      heading: 'Controls are half the job',
      blocks: [
        {
          type: 'p',
          text: 'A bedroom is the one room where getting out of bed to turn off a light is a design failure. Two-way switching at the door and the bedside is the traditional fix and still the best one. Dim-to-warm lamps at the bedside are worth the extra: as they dim they shift towards amber, which is exactly what you want at 11pm.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'How high should bedside pendants hang?',
      answer:
        '20 to 26 inches above the top of the mattress, so the bottom of the shade sits near eye level when you are sitting up in bed. Wall lights go higher, at 30 to 36 inches above the mattress.',
    },
    {
      question: 'What is the best colour temperature for a bedroom?',
      answer:
        '2700K for the main and bedside lights, and 2200 to 2400K for any low-level evening light. Nothing in a bedroom should be cooler than 3000K.',
    },
    {
      question: 'Should a bedroom chandelier be centred over the bed?',
      answer:
        'No. Centre it on the room. A fixture directly over the bed hangs above the face of whoever is lying beneath it, and it makes the room harder to use around the edges.',
    },
    {
      question: 'Can I use a chandelier in a small bedroom?',
      answer:
        'Yes, with two constraints: size it to the room (length plus width in feet, read as inches of diameter) and keep 7 feet of clearance where people walk. On an 8 ft ceiling a semi-flush design is usually the safer choice.',
    },
  ],
  shop: [
    { label: 'Bedroom lighting', href: '/rooms/bedroom' },
    { label: 'Shop pendant lights', href: '/collections?category=Pendant+Lights' },
    { label: 'Shop wall lights', href: '/collections?category=Wall+Lights' },
  ],
}
