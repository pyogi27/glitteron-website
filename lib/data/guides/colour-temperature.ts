import type { Guide } from './types'

export const colourTemperature: Guide = {
  slug: 'warm-or-cool-light',
  title: 'Warm or cool light: which Kelvin for which room',
  metaTitle: 'Warm or Cool Light? Kelvin Guide for Every Room',
  description:
    '2700K for living rooms and bedrooms, 3000K for kitchens and bathrooms, 4000K for work. What Kelvin and CRI actually mean, and how to pick without guessing.',
  category: 'Light quality',
  answer:
    'Use 2700K in living rooms and bedrooms, 3000K in kitchens and bathrooms, and 4000K only where precise work happens — a study desk, a workshop, a garage. Lower Kelvin is warmer and yellower; higher is cooler and bluer. Keep every fixture in one room within 500K of the others.',
  updated: '2026-08-07',
  sections: [
    {
      id: 'what-kelvin-means',
      heading: 'What the Kelvin number actually tells you',
      blocks: [
        {
          type: 'p',
          text: 'Kelvin describes the colour of the light, not its brightness. A 2700K bulb and a 4000K bulb can be identical in output and look nothing alike: the first is the warm yellow of an incandescent lamp, the second the neutral white of an office. Brightness is lumens, and the two are set independently.',
        },
        {
          type: 'table',
          caption: 'Colour temperature at a glance',
          head: ['Kelvin', 'Reads as', 'Where it belongs'],
          rows: [
            ['2200–2400K', 'Candle, amber', 'Decorative filament bulbs, mood lighting'],
            ['2700K', 'Warm white', 'Living rooms, bedrooms, dining rooms, hallways'],
            ['3000K', 'Soft white', 'Kitchens, bathrooms, islands, dressing areas'],
            ['3500–4000K', 'Neutral white', 'Studies, workshops, laundry, garages'],
            ['5000K +', 'Daylight, blue-white', 'Task inspection. Rarely right in a home.'],
          ],
        },
      ],
    },
    {
      id: 'by-room',
      heading: 'Room by room',
      blocks: [
        {
          type: 'list',
          items: [
            'Living room: 2700K. This is the room people relax in, and warm light is what the eye reads as restful.',
            'Dining room: 2700K, dimmable. Food and skin both look better warm.',
            'Bedroom: 2700K, and 2200K for bedside lamps if you read late — the warmer the light in the hour before sleep, the better.',
            'Kitchen: 3000K. Slightly crisper for a work surface, without tipping into cold.',
            'Bathroom: 3000K, with light at face height beside the mirror rather than only overhead.',
            'Study or workshop: 3500–4000K over the desk or bench, with a warmer ambient layer so the room does not feel like an office after dark.',
            'Entry and stairs: 2700K, matching whatever the adjoining rooms use. Corridors are where mismatches show up most.',
          ],
        },
      ],
    },
    {
      id: 'cri',
      heading: 'CRI: the number that matters more than Kelvin',
      blocks: [
        {
          type: 'p',
          text: 'Colour Rendering Index scores how truthfully a light shows colour, against a maximum of 100. A cheap LED at CRI 70 makes wood look flat, skin look grey and a deep red cushion look brown. The same fixture at CRI 90 makes the room look like itself.',
        },
        {
          type: 'list',
          items: [
            'CRI 90+ anywhere colour is judged: kitchens, bathrooms, dressing areas, anywhere art hangs.',
            'CRI 80+ is the floor for everywhere else. Below that, do not buy it however cheap it is.',
            'CRI is printed on the box far less often than Kelvin. If a seller cannot tell you the CRI, assume it is low.',
          ],
        },
      ],
    },
    {
      id: 'mixing',
      heading: 'The mistake almost everyone makes',
      blocks: [
        {
          type: 'p',
          text: 'Mixing colour temperatures inside one sightline. A 2700K chandelier over the table with 4000K downlights in the ceiling above it will read as broken rather than layered — the eye compares the two and calls one of them wrong.',
        },
        {
          type: 'list',
          items: [
            'Keep every source visible from one spot within 500K of the others.',
            'Replace bulbs in matched sets. One cooler bulb in a five-arm chandelier is instantly visible.',
            'Dim-to-warm LEDs shift towards amber as they dim, mimicking a filament lamp. In a dining or living room they are worth the premium.',
            'Check the dimmer is rated for LED. Trailing-edge dimmers suit most LED drivers; an old incandescent dimmer is the usual cause of flicker and buzz.',
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'Is 2700K or 3000K better for a living room?',
      answer:
        '2700K. It is the warm, slightly yellow light people associate with a relaxed room. Save 3000K for kitchens and bathrooms, where a crisper light suits work surfaces.',
    },
    {
      question: 'What is the difference between warm white and cool white?',
      answer:
        'Colour temperature, measured in Kelvin. Warm white is around 2700K and reads yellow and restful; cool white is 4000K and above and reads blue-white and alert. Neither is brighter — brightness is measured separately, in lumens.',
    },
    {
      question: 'What CRI should I look for in a light?',
      answer:
        'CRI 90 or above wherever colour matters — kitchens, bathrooms, dressing areas and rooms with art. CRI 80 is the minimum worth buying anywhere else.',
    },
    {
      question: 'Can I mix warm and cool bulbs in the same room?',
      answer:
        'Not within one sightline. Keep every visible source within about 500K of the others, or the eye reads the difference as a fault. Layering is done with brightness and placement, not with clashing colour temperatures.',
    },
  ],
  shop: [
    { label: 'Shop all collections', href: '/collections' },
    { label: 'Shop ceiling lights', href: '/collections?category=Ceiling+Lights' },
    { label: 'Shop wall lights', href: '/collections?category=Wall+Lights' },
  ],
}
