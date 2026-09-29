import type { CategoryFaq } from './categories'

/**
 * Material and finish landing pages — `/chandelier-lights/glass`, `/wall-lights/gold`.
 *
 * Every competitor ahead of us in Indian decorative lighting multiplies its
 * categories by an attribute: Jainsons ships `brass-chandeliers`,
 * `wooden-chandeliers`, `marbel-chandeliers`, `crystal-chandeliers`,
 * `modern-wall-lights`; Orange Tree ships `wooden-hanging-lights`, `glass-lamp`,
 * `black-lamp`. We had none of it, while the catalogue already carries the
 * attributes — 397 glass products, 371 gold, 200 black — and the backend already
 * filters on them (`?materials=`, `?bodyColors=`). The keyword existed and the
 * inventory existed; only the URL was missing.
 *
 * A facet only earns a page where the category has enough of it to fill a grid.
 * The pairings are declared per category in categories.ts, and the counts behind
 * that decision are recorded there. `crystal` is deliberately absent: "crystal
 * chandelier" is the highest-volume term in the whole space, and the catalogue
 * has four crystal products. That is a merchandising gap, not an SEO one, and a
 * four-product page pretending otherwise would be worse than no page.
 */

export type FacetKind = 'materials' | 'bodyColors'

export interface Facet {
  /**
   * URL segment beneath the category. Also the slug of the MATERIALS or COLORS
   * option in filters.ts that holds the backend spellings this page filters on.
   */
  slug: string
  /** Which backend attribute this filters on. */
  kind: FacetKind
  /** Adjective in the heading: "Glass Chandeliers". */
  adjective: string
  /** Noun for prose: "glass", "a gold finish". */
  noun: string
  /** What this material or finish actually does to the light. */
  note: string[]
  faqs: CategoryFaq[]
}

const FACETS: Facet[] = [
  {
    slug: 'glass',
    kind: 'materials',
    adjective: 'Glass',
    noun: 'glass',
    note: [
      'Glass is the only shade material that lets a fixture light a room and be looked at in the same moment. Light passes through it rather than off it, so the piece reads as a source instead of a silhouette — which is why glass belongs anywhere people sit facing the fixture: over a dining table, in a stairwell, across a living room.',
      'How much it spreads depends on the surface. Clear glass throws light in every direction and shows the filament, which is handsome with an Edison bulb and harsh with anything brighter than about 400 lumens. Frosted and smoked glass diffuse it into an even glow and hide the bulb entirely. Ribbed and fluted glass sits between the two, scattering light into vertical bands that read well against a plain wall.',
      'Every glass shade here is hand-blown, which means small variations in wall thickness and a slight difference in the way each one carries light. Two of the same fixture will not be optically identical, and that is the point of buying blown glass rather than moulded.',
    ],
    faqs: [
      {
        question: 'Is hand-blown glass fragile in shipping?',
        answer:
          'Glass fixtures ship double-boxed with the shades packed separately from the frame, and breakage in transit is covered — send a photograph within 48 hours of delivery and the part is replaced at no cost.',
      },
      {
        question: 'Clear, frosted or smoked glass — which should I choose?',
        answer:
          'Clear glass for a decorative bulb and a soft output, frosted where the fixture is in a sightline and glare would bother you, smoked where you want the fixture to read dark when it is switched off. Frosted is the safest choice over a dining table.',
      },
      {
        question: 'How do I clean a glass light fixture?',
        answer:
          'Switch it off, let it cool, and wipe with a dry microfibre cloth. For a film that will not lift, a barely damp cloth and no cleaning product — solvents attack the metal finish long before they trouble the glass.',
      },
    ],
  },
  {
    slug: 'gold',
    kind: 'bodyColors',
    adjective: 'Gold',
    noun: 'a gold finish',
    note: [
      'Gold is the finish that does something to the light rather than just to the fixture. A gold or brass interior reflects warm, so the beam coming off it is a degree or two warmer than the bulb inside it — which is why a gold fixture at 2700K reads warmer than a white one running the same lamp.',
      'It also decides how the piece behaves when it is switched off, which is most of the day. Polished gold catches whatever daylight is in the room and stays visible; brushed and antique gold go quiet and read closer to bronze. In a room with a lot of white — the usual Indian living room, with a pale wall and a stone or vitrified floor — gold is what stops a ceiling fixture from disappearing.',
      'Gold sits with warm timber, cane, terracotta and cream, and against a dark wall it is the highest-contrast finish we make. What it does not do is share a room comfortably with chrome or nickel; pick one metal per room and let the other appear only in hardware.',
    ],
    faqs: [
      {
        question: 'Will the gold finish tarnish?',
        answer:
          'No. These are plated and lacquered rather than raw brass, so they hold their colour and do not need polishing. The 5-year warranty covers finish failure as well as electrical faults.',
      },
      {
        question: 'Does gold lighting work in a modern room?',
        answer:
          'Yes, and it is the usual pairing — brushed or matte gold against plain white or charcoal walls reads contemporary, where polished gold with cut glass reads traditional. The finish sets the temperature; the shape sets the era.',
      },
      {
        question: 'Can I mix gold fixtures with black ones?',
        answer:
          'Gold and matte black together is one of the few metal pairings that works, as long as one of them is clearly the lead — for instance gold on the ceiling and black on the walls, rather than an even split.',
      },
    ],
  },
  {
    slug: 'black',
    kind: 'bodyColors',
    adjective: 'Black',
    noun: 'a black finish',
    note: [
      'A black fixture is a shape first and a light second. Against a white or pale wall it draws an outline that stays legible from across the room, which is exactly what you want from a wall light in a corridor or a cluster over an island — and exactly what you do not want in a room already crowded with dark furniture.',
      'Black also controls where the light goes. A matte black interior absorbs rather than reflects, so an opaque black shade throws a tight, directional pool downward instead of washing the ceiling. That makes it the right choice over a worktop or a reading chair and the wrong one where a single fixture has to light a whole room.',
      'Matte and gun-metal black hide dust and fingerprints better than any other finish we make, which matters more than it sounds on a fixture mounted at eye level beside a bed or a mirror.',
    ],
    faqs: [
      {
        question: 'Will a black fixture make the room darker?',
        answer:
          'The fixture reads darker; the room does not, provided you size the light output to the room rather than to the fixture. Because a black shade directs light down instead of bouncing it off the ceiling, budget a second layer — a wall light or a lamp — in any room lit by a single black fixture.',
      },
      {
        question: 'Matte black or gloss black?',
        answer:
          'Matte in almost every case. Gloss picks up every reflection in the room, including the bulb, and shows dust at a glance. Matte black is what reads intentional against both white and colour.',
      },
      {
        question: 'Does black lighting suit a small room?',
        answer:
          'It does, on a pale wall, where the outline gives the room a focal point it would not otherwise have. In a small room with dark walls, the fixture disappears — choose gold or white there instead.',
      },
    ],
  },
  {
    slug: 'wood',
    kind: 'materials',
    adjective: 'Wooden',
    noun: 'wood',
    note: [
      'Wood is the one shade material that warms a room whether the light is on or off. It carries no shine, so it never throws a reflection back at you, and it is the obvious answer in a room that already has cane, jute, stone or a lot of plant life in it.',
      'Because timber is opaque, a wooden shade is a directional shade: it pushes light down in a defined cone rather than spreading it. That makes wooden pendants right over a table or a counter and wrong as the only fixture in a room. Where the wood is used as a frame with glass or fabric inside it, the spread comes back and the fixture behaves like its shade material instead.',
      'Grain means no two are identical, and the finish deepens slightly over the first year in a bright room. Both are properties of the material rather than faults in it.',
    ],
    faqs: [
      {
        question: 'Does the wood get hot around the bulb?',
        answer:
          'No. Every wooden fixture is built around a metal lamp holder with an air gap, and all our fixtures are specified for LED lamps, which put out a fraction of the heat of an incandescent bulb.',
      },
      {
        question: 'Will the wood tone match my furniture?',
        answer:
          'Treat it as a family rather than a match. Timber tones that are close but not identical read as intentional; it is the near-miss on a single shade of walnut that looks wrong. The product page lists the tone, and shade variation within a species is normal.',
      },
      {
        question: 'Are wooden light fixtures suitable for Indian humidity?',
        answer:
          'Yes — the timber is seasoned and sealed before assembly. Avoid mounting one directly above a shower or an unhooded cooking range, which is true of every finish, not only wood.',
      },
    ],
  },
  {
    slug: 'marble',
    kind: 'materials',
    adjective: 'Marble',
    noun: 'marble',
    note: [
      'Marble does something no other opaque material does: at the thickness used in a light shade or base, it lets a little light through, so the stone itself glows faintly and the veining shows. It is worth choosing on that alone — it is the only material here that is both solid and lit from within.',
      'It is also heavy, and that changes the install. A marble pendant needs a ceiling anchored into slab rather than into a false ceiling panel, and a marble wall light wants a masonry fixing rather than a plasterboard plug. Weight is on every product page for exactly this reason; check it before the electrician leaves.',
      'Each piece is cut from natural stone, so the veining, and to a lesser degree the base colour, differs from the photograph. A marble fixture that matched its catalogue image exactly would not be marble.',
    ],
    faqs: [
      {
        question: 'How much does a marble fixture weigh, and can a false ceiling hold it?',
        answer:
          'Weights are listed per product and run well above the metal equivalents. Fix into the structural slab, not into a false-ceiling panel or channel — a gypsum board fixing is not rated for the load.',
      },
      {
        question: 'Will the marble veining match the photograph?',
        answer:
          'The pattern will differ; the stone type and base colour will not. Natural marble is cut from a block, so no two shades share a pattern, and that variation is not a defect.',
      },
      {
        question: 'Does marble stain?',
        answer:
          'It can, but a light fixture is rarely exposed to what stains stone. Wipe with a dry cloth, keep oil and acidic cleaners off it, and it needs nothing else.',
      },
    ],
  },
]

export const facetSlugs = FACETS.map(f => f.slug)

export function getFacet(slug: string): Facet | undefined {
  return FACETS.find(f => f.slug === slug)
}
