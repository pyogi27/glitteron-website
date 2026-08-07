import type { Guide } from './types'

export const livingRoomLighting: Guide = {
  slug: 'how-to-light-a-living-room',
  title: 'How to light a living room',
  metaTitle: 'How to Light a Living Room: The Three-Layer Method',
  description:
    'One ceiling light is not a lighting plan. Build three layers — ambient, task and accent — with at least five sources, all on 2700K and all dimmable.',
  category: 'Planning guide',
  answer:
    'Use three layers rather than one fixture: an ambient layer overhead, a task layer beside every seat you read in, and an accent layer washing walls or art. Aim for at least five separate light sources in an average living room, all at 2700K, and put each layer on its own switch or dimmer.',
  updated: '2026-08-07',
  sections: [
    {
      id: 'why-layers',
      heading: 'Why one ceiling light never works',
      blocks: [
        {
          type: 'p',
          text: 'A single fixture in the middle of the ceiling lights the floor, flattens every face in the room and throws the corners into shadow. It is the cheapest way to make a well-furnished room look like a waiting area. Layering fixes it by giving light more than one height and more than one direction.',
        },
        {
          type: 'table',
          caption: 'The three layers',
          head: ['Layer', 'What it does', 'Typical fixtures'],
          rows: [
            ['Ambient', 'Fills the room, sets the level', 'Chandelier, ceiling light, uplighting'],
            ['Task', 'Light where you actually do something', 'Floor lamp by the chair, table lamp, reading wall light'],
            ['Accent', 'Depth — walls, art, texture', 'Wall lights, picture lights, shelf lighting'],
          ],
        },
      ],
    },
    {
      id: 'the-plan',
      heading: 'Building the plan',
      blocks: [
        {
          type: 'list',
          items: [
            'Start with the ambient fixture and size it properly: add the room’s length and width in feet and read the total in inches as the diameter.',
            'Add a task light to every seat someone might read in. A floor lamp behind and to the side of a chair, with the shade bottom near seated eye level, does more for a room than any amount of overhead wattage.',
            'Add accent light on at least two walls. Wall lights at roughly 60 to 66 in from the floor, or a pair of picture lights, stop the room dying at its edges.',
            'Count the sources. Five is a reasonable minimum for a 12 × 16 ft room; eight is not excessive.',
            'Split the layers across switches so the room can be bright for cleaning and dim for a film without rewiring your evening.',
          ],
        },
        {
          type: 'note',
          text: 'Put lamps on the diagonal. Sources at opposite corners of the room give it depth; sources in a line give it a corridor.',
        },
      ],
    },
    {
      id: 'heights',
      heading: 'Heights and positions worth memorising',
      blocks: [
        {
          type: 'table',
          caption: 'Standard heights',
          head: ['Fixture', 'Height', 'Measured to'],
          rows: [
            ['Ceiling fixture (walkways)', '7 ft minimum', 'Lowest point of the fixture'],
            ['Wall lights', '60–66 in', 'Centre of the fixture'],
            ['Floor lamp beside a chair', '58–64 in', 'Top of the shade'],
            ['Table lamp on a side table', '24–30 in', 'Overall lamp height'],
            ['Picture light', '6–12 in above the frame', 'Fixture body'],
          ],
        },
        {
          type: 'p',
          text: 'The one rule underneath all of these: when you are seated, you should not be able to see the bulb. If you can, the shade is too high, too small or too open.',
        },
      ],
    },
    {
      id: 'common-mistakes',
      heading: 'Five mistakes worth avoiding',
      blocks: [
        {
          type: 'list',
          items: [
            'Buying the fixture before measuring the room. Undersized chandeliers are the single most common error in a living room.',
            'Lighting the floor instead of the walls. Bright walls make a room feel larger; a bright floor does not.',
            'Mixing colour temperatures across one sightline — keep everything within 500K.',
            'Skipping dimmers to save a small amount at first fix, then living with one brightness for a decade.',
            'Forgetting the television wall. A dim wall behind a bright screen is the fastest route to eye strain.',
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'How many lights should a living room have?',
      answer:
        'At least five separate sources in an average 12 × 16 ft room, spread across three layers: one ambient fixture overhead, a task light at every reading seat, and accent light on two or more walls.',
    },
    {
      question: 'What colour temperature is best for a living room?',
      answer:
        '2700K, on dimmers. It is the warm light people read as restful, and dimming lets one room serve both a bright afternoon and a quiet evening.',
    },
    {
      question: 'How high should living room wall lights be?',
      answer:
        'Around 60 to 66 inches from the floor to the centre of the fixture — roughly eye level for someone standing. Lower them slightly if they flank a sofa rather than a doorway.',
    },
    {
      question: 'Do I need a chandelier in a living room?',
      answer:
        'No, but you need an ambient layer, and a chandelier is the usual way to supply it with some presence. What matters more is that the overhead light is not the only light in the room.',
    },
  ],
  shop: [
    { label: 'Living room lighting', href: '/rooms/living-room' },
    { label: 'Shop floor lamps', href: '/collections?category=Floor+Lamps' },
    { label: 'Shop wall lights', href: '/collections?category=Wall+Lights' },
  ],
}
