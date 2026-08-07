import type { CategoryFaq } from './categories'

/**
 * Room sub-tier landing pages — `/chandelier-lights/dining-room`.
 *
 * "dining room chandelier" and "kitchen island pendant lights" are separate
 * searches from "chandelier" and "pendant lights", and every competitor
 * ranking for them has a dedicated URL. The grid narrows by the product's
 * `whereUsed` tag; while tagging is still being filled in, the page falls back
 * to the whole category rather than showing an empty shelf (see
 * MIN_ROOM_PRODUCTS in CollectionView).
 *
 * Keys are `${categorySlug}/${roomSlug}`. A pairing listed in a category's
 * `rooms` but missing here is skipped, not auto-generated — a room page with
 * no room-specific copy is the thin page this whole exercise exists to avoid.
 */
export interface RoomSubPage {
  title: string
  description: string
  /** H1. */
  heading: string
  subtitle: string
  intro: string[]
  faqs: CategoryFaq[]
}

export const categoryRoomPages: Record<string, RoomSubPage> = {
  'chandelier-lights/living-room': {
    title: 'Living Room Chandeliers — Buy Online in India',
    description:
      'Handcrafted chandeliers sized for Indian living rooms. Sizing and hang-height guidance, free shipping, 5-year warranty, 7-day returns.',
    heading: 'Living Room Chandeliers',
    subtitle: 'Sized, hung and dimmed for the room you actually sit in.',
    intro: [
      'A living room chandelier is not sized to the room’s furniture, it is sized to the room. Add the length and width in feet and read the answer in inches: a 14 by 18 foot room takes a 32-inch fixture. Going smaller is the single most common mistake, and it reads as an afterthought from the doorway.',
      'Clearance is the other half. Keep at least seven feet from the floor to the bottom of the fixture in any space people walk under. On a nine-foot ceiling that leaves roughly two feet of drop to play with; over a coffee table, where nobody walks, you can hang lower and let the piece do more work.',
      'A living room is used at every brightness from film-watching to hosting, so the chandelier should never be the only source. Pair it with wall lights or a floor lamp and put the chandelier on a dimmer — every LitMeUp fixture is dimmable as standard.',
    ],
    faqs: [
      {
        question: 'What size chandelier suits a living room?',
        answer:
          'Add the room’s length and width in feet; that figure in inches is a good diameter. A 12 by 14 foot room suits a 26-inch chandelier, an 14 by 18 foot room a 32-inch one. For ceilings above ten feet, add two to three inches of height for every extra foot.',
      },
      {
        question: 'How low should a chandelier hang in a living room?',
        answer:
          'Leave at least seven feet of clearance from the floor to the bottom of the fixture wherever people walk. Over a coffee table or a seating island you can drop lower, to roughly seven feet six from the floor at most.',
      },
    ],
  },

  'chandelier-lights/dining-room': {
    title: 'Dining Room Chandeliers — Buy Online in India',
    description:
      'Chandeliers sized to the dining table, not the room. Handcrafted in brass and hand-blown glass, free shipping across India, 5-year warranty.',
    heading: 'Dining Room Chandeliers',
    subtitle: 'Sized to the table, hung 30–36 inches above it.',
    intro: [
      'A dining chandelier is the one case where you ignore the room and size to the table. Aim for a diameter between half and two-thirds of the table’s width — a 42-inch round table takes a 22 to 28 inch fixture, a 36-inch wide rectangular table the same. Wider than two-thirds and people knock it standing up.',
      'Hang the bottom of the fixture 30 to 36 inches above the tabletop. Lower feels intimate and is correct for a dining room; the instinct to raise it for headroom is what leaves so many dining tables lit from too far away.',
      'For a long rectangular table, two smaller chandeliers or a linear fixture beat one large round one. Centre them on the table, not the room — the table almost never sits exactly where the ceiling point does.',
    ],
    faqs: [
      {
        question: 'What size chandelier for a dining table?',
        answer:
          'Between half and two-thirds of the table’s width. A 42-inch round table takes 22 to 28 inches; a 72 by 36 inch rectangular table takes 18 to 24 inches, or two smaller fixtures spaced along its length.',
      },
      {
        question: 'How high should a chandelier hang over a dining table?',
        answer:
          'Thirty to thirty-six inches from the tabletop to the bottom of the fixture, on a standard eight to nine foot ceiling. Add about three inches of height for each additional foot of ceiling.',
      },
    ],
  },

  'pendant-lights/kitchen': {
    title: 'Kitchen Island Pendant Lights Online in India',
    description:
      'Handcrafted pendant lights for kitchen islands and breakfast counters. Spacing and hang-height guidance, free shipping, 5-year warranty.',
    heading: 'Kitchen Island Pendant Lights',
    subtitle: 'Spaced 24–30 inches apart, hung 30–36 inches above the counter.',
    intro: [
      'Pendants over an island are a spacing problem before they are a style one. Set centres 24 to 30 inches apart and keep the outermost pendants about 12 inches in from each end of the island. A 72-inch island takes three at 24-inch spacing; a 48-inch island takes two.',
      'Hang the bottom of the shade 30 to 36 inches above the countertop. That is low enough to pool light on the work surface and high enough to see the person opposite you across the island.',
      'Shade shape matters more in a kitchen than anywhere else. An opaque metal shade throws light straight down onto the worktop, which is what prep needs; open glass spreads it around the room and is better over a breakfast counter than a chopping station.',
    ],
    faqs: [
      {
        question: 'How many pendant lights over a kitchen island?',
        answer:
          'Divide the island length in inches by 24 to 30 and round down. A 48-inch island takes two, a 72-inch island three, a 96-inch island three or four. Keep the end pendants about 12 inches in from each edge.',
      },
      {
        question: 'How high should kitchen pendants hang?',
        answer:
          'Thirty to thirty-six inches from the countertop to the bottom of the shade. If the pendants sit in a sightline across the room, hang at the upper end so they do not block it.',
      },
    ],
  },

  'pendant-lights/dining-room': {
    title: 'Dining Table Pendant Lights Online in India',
    description:
      'Pendant lights and clusters for dining tables, handcrafted in brass and hand-blown glass. Free shipping across India, 5-year warranty.',
    heading: 'Dining Table Pendant Lights',
    subtitle: 'Single pendants, pairs and clusters for the table.',
    intro: [
      'A pendant over a dining table does the same job as a chandelier with less ceremony, and it suits a rectangular table better. One wide pendant works up to about 48 inches of table; past that, use two or three spaced evenly along the length.',
      'The hang height is the same as everywhere else you eat: 30 to 36 inches from the tabletop to the bottom of the shade. Centre the run on the table rather than the room, and if the ceiling point is off-centre, a cable or rod offset fixes it at installation.',
      'Hand-blown glass earns its place here. It throws light sideways as well as down, so faces across the table are lit rather than just the plates.',
    ],
    faqs: [
      {
        question: 'How many pendants over a dining table?',
        answer:
          'One wide pendant for tables up to about 48 inches. Two for a 60 to 72 inch table, three for anything longer, spaced evenly and set in from the ends.',
      },
      {
        question: 'Pendant or chandelier over a dining table?',
        answer:
          'A chandelier suits a round or square table and a formal room; a run of pendants suits a long rectangular table and reads more relaxed. Both hang at the same 30 to 36 inches above the tabletop.',
      },
    ],
  },

  'ceiling-lights/bedroom': {
    title: 'Bedroom Ceiling Lights — Buy Online in India',
    description:
      'Flush and semi-flush bedroom ceiling lights, dimmable as standard and fan-compatible. Free shipping across India, 5-year warranty.',
    heading: 'Bedroom Ceiling Lights',
    subtitle: 'Flush and semi-flush fixtures that clear a ceiling fan.',
    intro: [
      'Most Indian bedrooms have a ceiling fan, which settles the question: a flush mount, sited clear of the blade sweep so the blades do not chop the light into a flicker. A semi-flush works too if the ceiling is over nine feet and the fan is on a short downrod.',
      'A bedroom ceiling light should be the dimmest bright thing in the room. Warm white around 2700K, dimmable, and never the only source — pair it with wall lights at the bedside so the room can be lit at reading level without the ceiling on at all.',
      'For general light, budget roughly 20 lumens per square foot. A 12 by 14 foot bedroom wants about 3,400 lumens across everything in it, most of which does not need to come from the ceiling.',
    ],
    faqs: [
      {
        question: 'What kind of ceiling light works with a ceiling fan?',
        answer:
          'A flush mount, positioned clear of the blade sweep. Mounting a drop fixture inside the sweep produces a strobing shadow whenever the fan runs.',
      },
      {
        question: 'How bright should a bedroom ceiling light be?',
        answer:
          'Around 20 lumens per square foot of floor area across all the light in the room, at about 2700K. Put the ceiling fixture on a dimmer and let bedside wall lights or table lamps carry the evening.',
      },
    ],
  },

  'ceiling-lights/home-office': {
    title: 'Home Office Ceiling Lights Online in India',
    description:
      'Ceiling lights for home offices and study rooms — neutral-white, glare-controlled, dimmable. Free shipping across India, 5-year warranty.',
    heading: 'Home Office Ceiling Lights',
    subtitle: 'Even, glare-free light for a desk you sit at all day.',
    intro: [
      'A home office wants a cooler, flatter light than the rest of the house: 3500K to 4000K keeps you alert, where a living room’s 2700K does the opposite. It is the one room where a neutral white is the right answer.',
      'Position matters as much as output. A ceiling fixture directly behind you throws your own shadow across the desk, and one directly in front lands in your eyes and on the screen. Site it to the side, and add a task light on the desk itself.',
      'Screens make glare the real enemy. A diffused shade beats a bare or clear-glass fixture here, because a point source reflects straight off a monitor.',
    ],
    faqs: [
      {
        question: 'What colour temperature is best for a home office?',
        answer:
          'Between 3500K and 4000K. It reads as neutral daylight and keeps focus better than the 2700K warm white used elsewhere in the house. Keep the whole room on one temperature.',
      },
      {
        question: 'Where should a ceiling light go in a home office?',
        answer:
          'To the side of the desk rather than directly behind or in front of it — behind casts your own shadow onto the work surface, in front reflects off the screen. Add a task lamp for detail work.',
      },
    ],
  },

  'wall-lights/bedroom': {
    title: 'Bedroom Wall Lights — Buy Online in India',
    description:
      'Bedside wall lights and sconces, dimmable as standard, in twelve finishes. Free shipping across India, 5-year warranty, 7-day returns.',
    heading: 'Bedroom Wall Lights',
    subtitle: 'Bedside sconces that free the nightstand and light the page.',
    intro: [
      'A pair of bedside wall lights does everything a table lamp does and gives you the nightstand back. Mount them 30 to 36 inches above the mattress, roughly in line with the outer edge of each bedside table, so the light lands on a book rather than on the person next to you.',
      'An adjustable arm or a shade that directs light downward is worth paying for here. A fixed open sconce at bedside height lights the whole room, which is exactly what you do not want at 11pm.',
      'Wire them to their own switch if you can — ideally one you can reach lying down. Every LitMeUp wall light is dimmable as standard, which matters more at a bedside than anywhere in the house.',
    ],
    faqs: [
      {
        question: 'How high should bedside wall lights be mounted?',
        answer:
          'Thirty to thirty-six inches above the mattress top, which puts the light at roughly seated shoulder height. Align each one with the outer edge of the bedside table rather than centring it on the table.',
      },
      {
        question: 'Are wall lights better than table lamps beside a bed?',
        answer:
          'They free up the nightstand and give a cleaner line, and an adjustable arm aims light at the page. A table lamp is the easier choice if you rent or do not want to run new wiring.',
      },
    ],
  },

  'wall-lights/living-room': {
    title: 'Living Room Wall Lights — Buy Online in India',
    description:
      'Handcrafted living room wall lights and sconces in brass, glass and steel. Free shipping across India, 5-year warranty, 7-day returns.',
    heading: 'Living Room Wall Lights',
    subtitle: 'The layer that stops a living room looking flat.',
    intro: [
      'Wall lights are what a living room is usually missing. A ceiling fixture lights the floor and the tops of people’s heads; sconces light the walls, and a room with lit walls reads larger and warmer than the same room lit only from above.',
      'Mount general wall lights 60 to 66 inches from the floor — about eye level standing. Flanking a fireplace, a sofa or artwork, keep the pair symmetrical and at the same height; unevenness is more noticeable on a wall than on a ceiling.',
      'Put them on a separate switch from the ceiling light. That single change gives the room a second, softer setting for evenings without buying anything else.',
    ],
    faqs: [
      {
        question: 'How high should living room wall lights be mounted?',
        answer:
          'Sixty to sixty-six inches from the floor for general wall lighting — roughly eye level standing. Either side of a sofa or fireplace, keep the pair level with each other and symmetrical about the centre.',
      },
      {
        question: 'How many wall lights does a living room need?',
        answer:
          'A pair on the main wall is the usual starting point, with a second pair opposite in a larger room. Space them evenly along the wall rather than clustering them near the seating.',
      },
    ],
  },

  'table-lamps/bedroom': {
    title: 'Bedside Table Lamps — Buy Online in India',
    description:
      'Handcrafted bedside table lamps in brass, glass and steel, dimmable as standard. Free shipping across India, 5-year warranty.',
    heading: 'Bedside Table Lamps',
    subtitle: 'Sized so the shade lands at eye level when you sit up.',
    intro: [
      'The one measurement that matters at a bedside is where the bottom of the shade sits. It should land near eye level when you are sitting up in bed, which for a standard nightstand means a lamp 24 to 27 inches tall. Too tall and you look straight into the bulb; too short and it lights the table, not the book.',
      'A translucent shade turns the lamp into a soft glow for the room; an opaque one throws a clean pool down onto the page. For a bedroom, most people want the second on the reading side and are happier with the first everywhere else.',
      'Match the pair on height and output even if the designs differ. Uneven lamp heights either side of a bed are the thing that makes an otherwise finished bedroom look unresolved.',
    ],
    faqs: [
      {
        question: 'How tall should a bedside lamp be?',
        answer:
          'Twenty-four to twenty-seven inches on a standard nightstand, so the bottom of the shade sits near eye level when you are sitting up. As a check, the nightstand height plus the lamp height should total roughly 44 to 47 inches.',
      },
      {
        question: 'Do bedside lamps need to match?',
        answer:
          'They should match in height and brightness; the design can differ. Mismatched heights are far more noticeable across a bed than mismatched shapes.',
      },
    ],
  },

  'table-lamps/living-room': {
    title: 'Living Room Table Lamps Online in India',
    description:
      'Table lamps for consoles, side tables and sideboards, handcrafted in brass and glass. Free shipping across India, 5-year warranty.',
    heading: 'Living Room Table Lamps',
    subtitle: 'Console, side table and sideboard lamps in brass and glass.',
    intro: [
      'A table lamp is the light a living room is actually used by after dark. On a console or sideboard, aim for a total height of about 30 inches; on a low side table beside a chair, the bottom of the shade wants to sit near eye level when seated.',
      'Two lamps at opposite corners of a room beat one bright one in the middle every time. Light coming from two directions removes the flat, shadowless look a single ceiling source produces.',
      'Because a table lamp sits at eye level, the shade is doing as much work as the base. An opaque shade gives two clean pools of light and keeps the bulb out of your sightline across the room.',
    ],
    faqs: [
      {
        question: 'How tall should a living room table lamp be?',
        answer:
          'About 30 inches in total on a console or sideboard. Beside a chair, size it so the bottom of the shade is near eye level when seated — usually a lamp of 24 to 28 inches on a low side table.',
      },
      {
        question: 'How many table lamps does a living room need?',
        answer:
          'Two, placed apart rather than together, will light a normal living room better than one. Add a floor lamp at the reading chair rather than making any single lamp brighter.',
      },
    ],
  },

  'floor-lamps/living-room': {
    title: 'Living Room Floor Lamps — Buy Online in India',
    description:
      'Reading and arc floor lamps for living rooms, handcrafted in brass and solid steel. Free shipping across India, 5-year warranty.',
    heading: 'Living Room Floor Lamps',
    subtitle: 'Reading and arc lamps for the corners the ceiling misses.',
    intro: [
      'A floor lamp is the fastest fix for a badly lit living room, because it needs no electrician and no holes in the ceiling. Put one in the darkest corner and one at the reading chair and most rooms stop feeling gloomy immediately.',
      'For reading, the bottom of the shade should sit near eye level when seated — about 47 to 49 inches from the floor — and slightly behind your shoulder, so the page is lit and the bulb is not in your eye.',
      'An arc lamp reaches out over a sofa or coffee table and does a pendant’s job without touching the ceiling. It is the right answer in a rented flat, under a concrete slab, or wherever the furniture layout has not settled.',
    ],
    faqs: [
      {
        question: 'Where should a floor lamp go in a living room?',
        answer:
          'In a corner the ceiling light does not reach, or just behind and to the side of a reading chair. Two lamps placed apart light a room better than one placed centrally.',
      },
      {
        question: 'How tall should a living room floor lamp be?',
        answer:
          'Around 58 to 64 inches overall for a general lamp, with the bottom of the shade at 47 to 49 inches for reading — roughly eye level when seated.',
      },
    ],
  },

  'floor-lamps/home-office': {
    title: 'Home Office Floor Lamps Online in India',
    description:
      'Task and reading floor lamps for home offices and studies, in brass and solid steel. Free shipping across India, 5-year warranty.',
    heading: 'Home Office Floor Lamps',
    subtitle: 'Task lamps that light the desk without hitting the screen.',
    intro: [
      'A floor lamp in a home office is there to fix what the ceiling cannot: the shadow across your own desk. Stand it to the side of the work surface, on the opposite side to your writing hand, so nothing you do casts a shadow over what you are doing.',
      'Aim the light at the desk, not the room, and keep it out of the monitor’s reflection. An adjustable or downward-directing shade is worth more here than a decorative one; a bare source at eye level next to a screen is the definition of glare.',
      'Pair a neutral 3500K to 4000K bulb with the room’s ceiling light at the same temperature. Mixing a warm task lamp with a cool ceiling fixture is what makes a study feel unsettled without anyone being able to say why.',
    ],
    faqs: [
      {
        question: 'Where should a floor lamp go in a home office?',
        answer:
          'Beside the desk, on the opposite side to your writing hand, and angled at the work surface rather than the room. Keep it out of the direct line between your eyes and the screen.',
      },
      {
        question: 'What bulb should a home office floor lamp take?',
        answer:
          'A neutral white between 3500K and 4000K, matching the ceiling light in the same room. Warm 2700K is comfortable in a living room but works against focus at a desk.',
      },
    ],
  },
}

export function getRoomSubPage(categorySlug: string, roomSlug: string): RoomSubPage | undefined {
  return categoryRoomPages[`${categorySlug}/${roomSlug}`]
}
