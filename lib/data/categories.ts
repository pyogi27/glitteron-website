/**
 * Flat, keyword-bearing category landing pages — `/chandelier-lights` rather
 * than `/collections?category=Chandelier+Lights`.
 *
 * Every competitor that outranks us in Indian decorative lighting (White Teak,
 * Lights & Living, Orange Tree, Grover) puts its money categories on a static
 * path with a transactional "Buy X Online in India" title and real copy under
 * the grid. A query string carries none of that weight.
 *
 * `name` must match the backend category exactly — the grid filters by name.
 */

export interface CategoryFaq {
  question: string
  answer: string
}

/**
 * A "under ₹X" landing page beneath a category — `/chandelier-lights/under-25000`.
 *
 * Bands were chosen against the live catalogue so none of them lands on a thin
 * page; the counts at the time of writing are in each `note`'s category. Adding
 * a band whose ceiling excludes most of the category is worse than no band.
 */
export interface PriceBand {
  /** Inclusive ceiling in INR. The slug is `under-${max}`. */
  max: number
  /** What this budget actually buys here. Shown as the page lede. */
  note: string
}

export interface LightCategory {
  slug: string
  /** Backend category name. Changing this silently empties the grid. */
  name: string
  /**
   * Backend category names this page's grid spans, when it spans more than one.
   *
   * Only `/hanging-lights` uses it: "hanging lights" is the term Indian shoppers
   * actually search, and it covers chandeliers and pendants together — the same
   * grouping White Teak ranks with at /decorative-lights/hanging-lights/. The
   * API ORs repeated `category` params, so this is one request, not two.
   * Omitted everywhere else, where `name` alone is the whole grid.
   */
  names?: string[]
  /** H1. The plain category noun, not the stuffed title. */
  heading: string
  /** The noun people search with, used in price-band headings. */
  shortName: string
  title: string
  description: string
  /** Lede under the H1. One sentence, human. */
  subtitle: string
  /** Copy under the grid: what the shopper is actually choosing between. */
  intro: string[]
  faqs: CategoryFaq[]
  /** Guides that answer this category's pre-purchase questions. */
  guides: string[]
  /**
   * Room slugs this category gets a sub-tier landing page for. Each pairing
   * needs copy in lib/data/category-rooms.ts or it is skipped.
   */
  rooms: string[]
  /** Budget landing pages. Empty where the category is too small to slice. */
  priceBands: PriceBand[]
  /**
   * Material and finish landing pages — see lib/data/facets.ts.
   *
   * Listed only where the category holds enough of that attribute to fill a
   * grid; the live counts behind each decision are in the comment beside it.
   */
  facets: string[]
}

export const categories: LightCategory[] = [
  {
    slug: 'chandelier-lights',
    name: 'Chandelier Lights',
    heading: 'Chandelier Lights',
    shortName: 'Chandeliers',
    // "Jhoomar" is not decoration here. Every site ahead of us for these
    // queries carries it in the title tag — White Teak ships "Chandelier: Buy
    // Chandeliers (Jhoomar) Online In India", Lights & Living "Buy Chandelier
    // Online | Jhoomar Lights India", Jainsons "Chandelier, Small Jhoomar for
    // Hall & Double Height Chandelier". It is the word a large share of Indian
    // shoppers types, it was absent from every page on this site, and no amount
    // of ranking for "chandelier" answers a search for "jhoomar".
    title: 'Buy Chandeliers (Jhoomar) Online in India — Handcrafted',
    description:
      'Buy handcrafted chandeliers and jhoomar lights online in India — brass, hand-blown glass and crystal. Free shipping, 5-year warranty, 7-day returns.',
    subtitle: 'Handcrafted chandeliers and jhoomars in brass, hand-blown glass and solid steel.',
    intro: [
      'A chandelier is the one fixture in a room that people look up at, so it is worth getting the scale right before the style. The usual rule: add the room’s length and width in feet, and the answer in inches is a sensible diameter. A 14 by 16 foot living room takes a 30-inch chandelier comfortably.',
      'Every chandelier here is assembled and inspected in our Surat workshop — brass turned and plated in-house, glass hand-blown, steel cut to size. All fixtures are dimmable as standard, so the same piece can carry a dinner party and a quiet Tuesday.',
      'Hang height matters as much as diameter. Over a dining table, the bottom of the fixture sits 30–36 inches above the surface. In an open room, keep at least 7 feet of clearance underneath.',
      'Jhoomar and chandelier mean the same fixture, and both words are used here for that reason. If you are shopping for a jhoomar for a hall, a double-height chandelier for an entrance, or a small jhoomar for a bedroom, they are all on this page — filter by size and by finish rather than by which word you started with.',
    ],
    faqs: [
      {
        question: 'What size chandelier do I need?',
        answer:
          'Add the room’s length and width in feet; that number in inches is a good diameter. A 14 by 16 foot room suits a 30-inch chandelier. Over a dining table, size to the table instead — roughly half to two-thirds of the table’s width.',
      },
      {
        question: 'How high should a chandelier hang?',
        answer:
          'Over a dining table, 30 to 36 inches from the tabletop to the bottom of the fixture. In an open space or hallway, leave at least 7 feet of clearance from the floor. For double-height ceilings, hang the fixture so it fills the upper third of the volume.',
      },
      {
        question: 'Are your chandeliers dimmable?',
        answer:
          'Yes. Every LitMeUp fixture is dimmable as standard, and works with the trailing-edge dimmers common in Indian homes.',
      },
      {
        question: 'What is the difference between a jhoomar and a chandelier?',
        answer:
          'None — jhoomar is the Hindi and Gujarati word for a chandelier, and the two are used interchangeably in Indian lighting. A jhoomar for a hall usually means a larger multi-tier fixture, and a small jhoomar a single-tier one for a bedroom or a passage, but both are chandeliers and both are on this page.',
      },
      {
        question: 'Do you deliver chandeliers across India?',
        answer:
          'Yes — free shipping on every order anywhere in India, with no minimum order value. Delivery is 5 to 7 days from dispatch by registered courier, tracked by email.',
      },
    ],
    guides: ['what-size-chandelier', 'how-high-to-hang-a-dining-light'],
    rooms: ['living-room', 'dining-room'],
    priceBands: [
      {
        max: 25000,
        note: 'The entry point for a real chandelier rather than a ceiling fixture with arms. Expect a single tier, a 20 to 28 inch spread, and brass or steel with glass — enough presence for a bedroom or a compact living room.',
      },
      {
        max: 50000,
        note: 'The band most living and dining rooms land in. Two tiers or a wider single tier, 28 to 36 inches across, hand-blown glass, and the finish options open up considerably.',
      },
      {
        max: 100000,
        note: 'Multi-tier and larger-span pieces built for double-height entrances and long dining tables — 36 inches and up, heavier brass, and more hand-work in the glass.',
      },
    ],
    // Live counts, 2026-08-21: glass 124, gold 134, black 64. Wood (13) and
    // marble (15) are real keywords with too little stock behind them here.
    facets: ['glass', 'gold', 'black'],
  },
  {
    slug: 'pendant-lights',
    name: 'Pendant Lights',
    heading: 'Pendant Lights',
    shortName: 'Pendant Lights',
    title: 'Buy Pendant Lights Online in India — Handcrafted',
    description:
      'Buy handcrafted pendant lights online in India for kitchen islands, dining tables and bedsides. Twelve finishes, free shipping, 5-year warranty.',
    subtitle: 'Single pendants and clusters for islands, tables and bedsides.',
    intro: [
      'Pendants do their best work in threes over an island, in pairs beside a bed, or singly above a reading chair. The spacing convention for an island is 24 to 30 inches between centres, with the outer pendants set in from the counter edge by about 12 inches.',
      'Hang height is fixed by what is underneath. Over a kitchen island or dining table, the bottom of the shade sits 30 to 36 inches above the surface — low enough to pool light, high enough to see across.',
      'Shade material changes the light more than the bulb does. Hand-blown glass throws light in every direction and suits a dining table; a solid brass or steel shade pushes it straight down, which is what a worktop wants.',
    ],
    faqs: [
      {
        question: 'How many pendants do I need over a kitchen island?',
        answer:
          'Divide the island length in inches by 24 to 30 and round down. A 72-inch island takes three pendants at 24-inch spacing; a 48-inch island takes two. Keep the outermost pendants about 12 inches in from each end.',
      },
      {
        question: 'How high should a pendant light hang?',
        answer:
          'Thirty to thirty-six inches from the countertop or tabletop to the bottom of the shade. Beside a bed, hang the shade at roughly seated shoulder height, about 20 to 24 inches above the mattress.',
      },
      {
        question: 'Can pendant lights be shortened after delivery?',
        answer:
          'Yes. Rod and cable drops are adjustable at installation, so the fitted height can be set to the ceiling you actually have.',
      },
    ],
    guides: ['how-many-pendants-over-a-kitchen-island', 'how-high-to-hang-a-dining-light'],
    rooms: ['kitchen', 'dining-room'],
    priceBands: [
      {
        max: 5000,
        note: 'Single pendants in spun metal or plain glass. This is the band to buy in when you need three over an island and the total matters more than any one shade.',
      },
      {
        max: 10000,
        note: 'Where most kitchen and dining pendants sit. Hand-blown glass appears here, along with the full run of twelve finishes and larger shade diameters.',
      },
      {
        max: 20000,
        note: 'Statement single pendants and larger clusters — bigger glass, heavier brass, and shades wide enough to light a dining table on their own.',
      },
    ],
    // Live counts, 2026-08-21: glass 147, gold 81, black 58, wood 32, marble 22.
    facets: ['glass', 'gold', 'black', 'wood', 'marble'],
  },
  {
    slug: 'ceiling-lights',
    name: 'Ceiling Lights',
    heading: 'Ceiling Lights',
    shortName: 'Ceiling Lights',
    title: 'Buy Ceiling Lights Online in India — Handcrafted',
    description:
      'Buy handcrafted ceiling lights online in India — flush and semi-flush fixtures for low ceilings, bedrooms and hallways. Free shipping, 5-year warranty.',
    subtitle: 'Flush and semi-flush fixtures for rooms that cannot take a drop.',
    intro: [
      'Ceiling lights are the answer wherever a hanging fixture would be in the way: bedrooms with ceiling fans, hallways, bathrooms, and any room under nine feet. A flush mount sits tight to the ceiling; a semi-flush drops three to eight inches and reads less utilitarian.',
      'Because a ceiling light is usually the only source in the room, colour temperature does more work here than anywhere else. Warm white, around 2700K, is right for bedrooms and living rooms; a neutral 3500K to 4000K suits kitchens and utility spaces.',
      'For general lighting, budget roughly 20 lumens per square foot of floor area, and layer a lamp or two on top rather than pushing a single fixture brighter than the room wants.',
    ],
    faqs: [
      {
        question: 'What is the difference between a flush and semi-flush ceiling light?',
        answer:
          'A flush mount sits directly against the ceiling and is the safest choice under nine feet. A semi-flush hangs three to eight inches below, which adds shape and lets light wash upward, but needs a little more headroom.',
      },
      {
        question: 'What colour temperature should I choose?',
        answer:
          'Warm white at about 2700K for bedrooms and living rooms, neutral 3500K to 4000K for kitchens, bathrooms and workspaces. Keep one temperature per room — mixing them is what makes a space feel unresolved.',
      },
      {
        question: 'Will a ceiling light work with a ceiling fan in the same room?',
        answer:
          'Yes, and a flush mount is the usual pairing. Mount the light clear of the blade sweep so the blades do not chop the beam into a flicker.',
      },
    ],
    guides: ['warm-or-cool-light', 'bedroom-lighting-ideas'],
    rooms: ['bedroom', 'home-office'],
    priceBands: [
      {
        max: 10000,
        note: 'Flush mounts for bedrooms, passages and utility rooms — clean glass or metal diffusers, sized for a standard nine-foot ceiling.',
      },
      {
        max: 20000,
        note: 'Semi-flush fixtures with more shape to them, and the wider diameters a large bedroom or an open living area needs from a single ceiling source.',
      },
    ],
    // 47 ceiling lights in total. Every attribute slice lands under 30, which is
    // a thin page pretending to be a category — add these as the range grows.
    facets: [],
  },
  {
    slug: 'wall-lights',
    name: 'Wall Lights',
    heading: 'Wall Lights',
    shortName: 'Wall Lights',
    title: 'Buy Wall Lights Online in India — Handcrafted',
    description:
      'Buy handcrafted wall lights and sconces online in India for bedsides, hallways and mirrors. Twelve finishes, free shipping, 5-year warranty.',
    subtitle: 'Sconces and wall lights for bedsides, hallways and mirrors.',
    intro: [
      'Wall lights are the layer that makes a room feel finished. They light faces rather than floors, which is why they belong beside mirrors and beds, and why a hallway lit by sconces reads warmer than the same hallway lit from above.',
      'Standard mounting height for a general sconce is 60 to 66 inches from the floor — roughly eye level. Beside a bed, drop to 30 to 36 inches above the mattress so the light lands on a book, not on your neighbour.',
      'Flanking a bathroom mirror, mount a pair at eye level about 36 to 40 inches apart. Light from the sides removes the shadows that an overhead fixture casts under the eyes.',
    ],
    faqs: [
      {
        question: 'How high should wall lights be mounted?',
        answer:
          'Sixty to sixty-six inches from the floor for general wall lighting. Beside a bed, 30 to 36 inches above the mattress. Flanking a mirror, at eye level, roughly 36 to 40 inches apart.',
      },
      {
        question: 'Do wall lights need a switch of their own?',
        answer:
          'They are best on a separate circuit or switch so the room can be lit softly without the ceiling fixture. All our wall lights are dimmable as standard.',
      },
      {
        question: 'Can wall lights be used in a bathroom?',
        answer:
          'Yes, mounted clear of the shower zone and away from direct water contact. A pair flanking the mirror gives shadow-free light for shaving or make-up.',
      },
    ],
    guides: ['bedroom-lighting-ideas', 'how-to-light-a-living-room'],
    rooms: ['bedroom', 'living-room'],
    priceBands: [
      {
        max: 3000,
        note: 'Simple single sconces — the band to buy in when you need six of them down a corridor or a matched pair either side of a bed.',
      },
      {
        max: 5000,
        note: 'Where most bedside and mirror sconces sit: glass shades, adjustable arms, and the full range of finishes.',
      },
      {
        max: 10000,
        note: 'Larger wall lights and picture arms — heavier brass, wider shades, and pieces substantial enough to carry a bare wall on their own.',
      },
    ],
    // Live counts, 2026-08-21: gold 141, glass 102, black 59, marble 24.
    facets: ['gold', 'glass', 'black', 'marble'],
  },
  {
    slug: 'table-lamps',
    // Backend spells it singular; the URL and every heading use the plural
    // people actually search for.
    name: 'Table Lamp',
    heading: 'Table Lamps',
    shortName: 'Table Lamps',
    title: 'Buy Table Lamps Online in India — Handcrafted',
    description:
      'Buy handcrafted table lamps online in India for bedsides, consoles and desks. Brass, glass and steel, free shipping, 5-year warranty.',
    subtitle: 'Bedside, console and desk lamps in brass, glass and steel.',
    intro: [
      'A table lamp is the light you actually live by — the one on at 10pm when the ceiling fixture is off. Two matched lamps on a console or either side of a bed do more for a room than any amount of overhead brightness.',
      'Height is set by what it sits on. Beside a bed, the bottom of the shade should land near eye level when you are sitting up, which usually means a lamp 24 to 27 inches tall on a standard nightstand. On a console or sideboard, aim for a total height of about 30 inches.',
      'The shade decides the mood. An opaque shade throws two clean pools of light up and down; a translucent one turns the whole lamp into a soft glow, which is what a bedroom usually wants.',
    ],
    faqs: [
      {
        question: 'How tall should a bedside table lamp be?',
        answer:
          'Twenty-four to twenty-seven inches on a standard nightstand, so the bottom of the shade sits near eye level when you are sitting up in bed. If the nightstand is unusually low or high, adjust so the lamp and mattress top total roughly 44 to 47 inches.',
      },
      {
        question: 'Should the two lamps beside a bed match?',
        answer:
          'They should match in height and light output; the design can differ. Uneven height is what makes a bedroom read as unfinished, far more than a mismatch of shape.',
      },
      {
        question: 'Are table lamps dimmable?',
        answer:
          'Yes. Every LitMeUp fixture is dimmable as standard, and table lamps ship with an inline or base switch that works with plug-in dimmers.',
      },
    ],
    guides: ['bedroom-lighting-ideas', 'warm-or-cool-light'],
    rooms: ['bedroom', 'living-room'],
    // Fourteen table lamps in the catalogue. Slicing that by price would leave
    // a landing page with single digits on it — add bands when the range grows.
    priceBands: [],
    facets: [],
  },
  {
    slug: 'floor-lamps',
    name: 'Floor Lamps',
    heading: 'Floor Lamps',
    shortName: 'Floor Lamps',
    title: 'Buy Floor Lamps Online in India — Handcrafted',
    description:
      'Buy handcrafted floor lamps online in India — reading, arc and task lamps in brass and steel. Free shipping, 5-year warranty, 7-day returns.',
    subtitle: 'Reading, arc and task lamps in brass and solid steel.',
    intro: [
      'A floor lamp is the cheapest way to fix a badly lit room, because it adds light where the ceiling cannot reach — a corner, a reading chair, the dark end of a sofa. No wiring, no electrician, no holes in the ceiling.',
      'For reading, the bottom of the shade should sit at about eye level when seated, roughly 47 to 49 inches from the floor, and slightly behind the shoulder so the page is lit and the eye is not.',
      'An arc lamp reaches over a sofa or table and does the job of a pendant in a room where hanging one is not an option — rented flats, concrete ceilings, or a seating layout that has not settled yet.',
    ],
    faqs: [
      {
        question: 'How tall should a floor lamp be for reading?',
        answer:
          'The bottom of the shade wants to sit near eye level when you are seated — about 47 to 49 inches from the floor for most chairs. Place it just behind and to the side of the shoulder.',
      },
      {
        question: 'Are floor lamps dimmable?',
        answer:
          'Yes, every LitMeUp fixture is dimmable as standard. Floor lamps ship with a switch on the cord or the body, and work with plug-in dimmers.',
      },
      {
        question: 'Do floor lamps come with bulbs?',
        answer:
          'Lamps ship ready to fit standard E27 bulbs unless the product page states otherwise. Choose a warm 2700K bulb for living rooms and bedrooms.',
      },
    ],
    guides: ['how-to-light-a-living-room', 'warm-or-cool-light'],
    rooms: ['living-room', 'home-office'],
    priceBands: [
      {
        max: 20000,
        note: 'Reading and task lamps in brass and solid steel, tall enough to light a chair properly — the range most living rooms and studies buy from.',
      },
    ],
    // 25 floor lamps. Same reason as ceiling lights: no slice fills a grid.
    facets: [],
  },
  {
    /*
     * The umbrella page: chandeliers and pendants under one roof.
     *
     * "Hanging lights" is the term Indian shoppers use for the whole class, and
     * it was on no page of this site. White Teak ranks with exactly this
     * grouping at /decorative-lights/hanging-lights/, describing it as "a wide
     * range of decorative hanging lights consisting of chandeliers and pendant
     * lights"; Jainsons runs `hanging-light`, `led-hanging-lights`,
     * `cluster-hanging-lights` and a dozen more.
     *
     * It overlaps its two children completely, which is what a parent category
     * is. The copy answers the question the parent term is actually asked —
     * chandelier or pendant — rather than restating either child page, and it
     * carries no sub-tiers of its own so it never competes with them.
     */
    slug: 'hanging-lights',
    // Primary for anything that needs a single name; `names` is what the grid uses.
    name: 'Pendant Lights',
    names: ['Chandelier Lights', 'Pendant Lights'],
    heading: 'Hanging Lights',
    shortName: 'Hanging Lights',
    title: 'Buy Hanging Lights Online in India — Chandeliers & Pendants',
    description:
      'Buy handcrafted hanging lights online in India — chandeliers, jhoomars, pendants and clusters. Free shipping, 5-year warranty, 7-day returns.',
    subtitle: 'Chandeliers, jhoomars, pendants and clusters — everything that hangs.',
    intro: [
      'Hanging light is the whole family: anything suspended from the ceiling on a rod, chain or cable. In practice it splits two ways. A chandelier — jhoomar — carries several lamps on one frame and is bought to be the thing you look at. A pendant carries one, and is bought to light what is underneath it. Everything else, clusters and linear bars included, is one of those two repeated.',
      'Which one a room wants is usually settled by what is under it rather than by taste. A dining table, a kitchen island, a bedside, a reading chair — anywhere with a defined surface — takes pendants, sized and spaced to that surface. A room with no single focus, or a double-height entrance, takes a chandelier, sized to the room: add the length and width in feet and read the answer in inches.',
      'The hang height is the same for both and is the thing most often got wrong. Over any surface you eat or work at, the bottom of the fixture sits 30 to 36 inches above it. Anywhere people walk underneath, leave at least seven feet of clearance from the floor. Get those two numbers right and almost any fixture in this range will look deliberate.',
      'All of it is assembled in our Surat workshop, dimmable as standard, and shipped free anywhere in India.',
    ],
    faqs: [
      {
        question: 'What is the difference between a hanging light, a pendant and a chandelier?',
        answer:
          'Hanging light is the umbrella term for any ceiling-suspended fixture. A pendant is a hanging light with a single lamp and shade, used to light a specific surface. A chandelier — jhoomar — is a hanging light with several lamps on one frame, used to light and furnish a whole room. All three are on this page.',
      },
      {
        question: 'How high should a hanging light be hung?',
        answer:
          'Thirty to thirty-six inches from the tabletop or countertop to the bottom of the fixture over any surface, and at least seven feet of floor clearance anywhere people walk beneath it. Rod and cable drops are adjustable at installation, so the fitted height is set to your ceiling.',
      },
      {
        question: 'How many hanging lights do I need over a kitchen island or dining table?',
        answer:
          'Divide the length in inches by 24 to 30 and round down — a 48-inch island takes two, a 72-inch island three — keeping the end fixtures about 12 inches in from each edge. One wide pendant covers a table up to about 48 inches; past that, use a run of two or three, or a single chandelier sized to half or two-thirds of the table width.',
      },
      {
        question: 'Are hanging lights suitable for a low ceiling?',
        answer:
          'Under about nine feet, a hanging light only works where nobody walks under it — over a table, an island or a bedside. Elsewhere in a low room, a flush or semi-flush ceiling light is the right fixture instead.',
      },
    ],
    guides: ['what-size-chandelier', 'how-high-to-hang-a-dining-light', 'how-many-pendants-over-a-kitchen-island'],
    // No sub-tiers. The children already own the room and budget cuts; giving the
    // parent its own would put two of our pages on the same query.
    rooms: [],
    priceBands: [],
    facets: [],
  },
]

export const categorySlugs = categories.map(c => c.slug)

/** 25000 → "₹25,000". Indian digit grouping, which en-IN gives us. */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function bandSlug(band: PriceBand): string {
  return `under-${band.max}`
}

export function getPriceBand(category: LightCategory, sub: string): PriceBand | undefined {
  return category.priceBands.find(band => bandSlug(band) === sub)
}

export function getCategoryBySlug(slug: string): LightCategory | undefined {
  return categories.find(c => c.slug === slug)
}

/** Flat landing-page path for a backend category name, if one exists. */
export function categoryPath(name: string): string | undefined {
  const match = categories.find(c => c.name === name)
  return match ? `/${match.slug}` : undefined
}
