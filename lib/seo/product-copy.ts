// lib/seo/product-copy.ts
/**
 * Descriptive copy for a product, composed from the structured attributes the
 * backend actually populates.
 *
 * Why this exists: 903 of 1,028 products are named with a bare SKU ("1011",
 * "DG-P184A") and only 3 carry any description, so every product page shipped
 * the title "1011 | LitMeUp", a boilerplate meta description shared with ~1,000
 * siblings, and a body that said "we haven't written this piece up yet". Google
 * crawled them and declined to index — there was no query they could answer.
 *
 * The attributes needed to say something real were on the record the whole time
 * (measured 2026-08-08 across the full catalogue):
 *
 *   materials      1003/1028      lightSource   990/1028
 *   bodyColors      932/1028      productHeight 728/1028
 *
 * Everything below is derived from those stored values. Nothing is invented: a
 * field the backend left blank is dropped from the sentence rather than guessed,
 * so a sparse record yields short copy instead of wrong copy.
 */

/** Brand suffix appended by the root layout's title template, in characters. */
const TITLE_SUFFIX_LENGTH = ' | LitMeUp'.length

/** Titles are truncated in search around 60 characters including the suffix. */
const MAX_TITLE_LENGTH = 60 - TITLE_SUFFIX_LENGTH

const MAX_DESCRIPTION_LENGTH = 158

/**
 * Singular, shopper-facing noun per category. The backend names categories in
 * the plural for navigation ("Pendant Lights"), which reads wrong inside a
 * sentence about one product.
 *
 * ponytail: 7 rows, unchanged since 2025 — hardcoded rather than threading an
 * async category lookup through every synchronous mapper. An unknown category
 * falls back to a de-pluralised form, so adding one degrades to plain English
 * rather than breaking.
 */
const CATEGORY_NOUN: Record<string, string> = {
  'Pendant Lights': 'Pendant Light',
  'Chandelier Lights': 'Chandelier',
  'Ceiling Lights': 'Ceiling Light',
  'Wall Lights': 'Wall Light',
  'Floor Lamps': 'Floor Lamp',
  'Table Lamp': 'Table Lamp',
  Bulbs: 'Bulb',
}

export interface ProductCopyInput {
  name: string
  /** Resolved category name, e.g. "Pendant Lights". Empty when unknown. */
  categoryName?: string | null
  materials?: string | null
  bodyColors?: string | null
  lightSource?: string | null
  wattage?: string | number | null
  productHeight?: string | null
  productWidth?: string | null
  productLength?: string | null
  diameter?: string | null
  weight?: string | null
  price?: number
  sku?: string | null
  /** Comma-separated room list, e.g. "Living Room, Dining Room". */
  whereUsed?: string | null
  /** Authored description. When present it wins over anything generated here. */
  description?: string | null
}

/**
 * Split a combined attribute value into its parts.
 * "Resin, Acrylic" | "White+Golden" | "Black/Gold" | "Chrome & Glass"
 */
export function splitList(raw?: string | null): string[] {
  if (!raw) return []
  return raw
    .split(/[+/,]|\s&\s/)
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * Normalise a dimension to a united value.
 *
 * The column is inconsistent: some rows carry a legacy letter prefix ("D90mm",
 * "H970mm"), others are bare numbers ("850"). Strip the prefix and add mm when
 * no unit was authored.
 */
export function normalizeDimension(raw?: string | number | null): string {
  const value = String(raw ?? '').trim()
  if (!value) return ''
  const stripped = value.replace(/^[a-z]+/i, '').trim()
  if (!stripped) return ''
  // Already carries a unit — trust it as authored.
  if (/[a-z]/i.test(stripped)) return stripped
  return `${stripped}mm`
}

/** "Resin, Acrylic" -> "resin and acrylic". Oxford-free, reads as prose. */
function joinProse(values: string[]): string {
  const items = values.map(v => v.toLowerCase())
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * "a" or "an" for a following word.
 *
 * A vowel *letter* is the right test here rather than a vowel sound, because
 * these values are lamp codes read letter by letter: "an E27", "an A60", but
 * "a Led 3 in 1" and "a G9".
 */
function article(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}

function categoryNoun(categoryName?: string | null): string {
  const name = categoryName?.trim()
  if (!name) return 'Light'
  if (CATEGORY_NOUN[name]) return CATEGORY_NOUN[name]
  return name.endsWith('s') ? name.slice(0, -1) : name
}

/**
 * Does the product name read as words rather than a model code?
 *
 * A run of four or more letters is the signal: "Crystal Cascade" passes,
 * "1011", "DG-P184A" and "H8907-1" do not. Names that pass are kept verbatim —
 * a real name is better copy than anything assembled from attributes.
 */
function hasRealWords(name: string): boolean {
  return /[a-z]{4,}/i.test(name)
}

/** The dimension a shopper actually buys on: width across, else height. */
function primarySize(p: ProductCopyInput): string {
  return (
    normalizeDimension(p.diameter) ||
    normalizeDimension(p.productWidth) ||
    normalizeDimension(p.productHeight) ||
    normalizeDimension(p.productLength)
  )
}

/** Trim to a whole word near `max`, with an ellipsis when anything was cut. */
function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const boundary = cut.lastIndexOf(' ')
  return `${(boundary > 0 ? cut.slice(0, boundary) : cut).replace(/[,—-]$/, '')}…`
}

function formatPrice(price?: number): string {
  if (!price || price <= 0) return ''
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)}`
}

/**
 * The <h1> and the name used in structured data.
 *
 * "1011" becomes "White Resin Pendant Light" — the model code stays visible on
 * the page as the SKU, so nothing is lost for a shopper searching by code.
 */
export function productHeadline(p: ProductCopyInput): string {
  const noun = categoryNoun(p.categoryName)

  if (hasRealWords(p.name)) {
    const alreadyNamed = p.name.toLowerCase().includes(noun.toLowerCase())
    return alreadyNamed ? p.name : `${p.name} ${noun}`
  }

  const finish = calmCase(splitList(p.bodyColors)[0])
  const material = calmCase(splitList(p.materials)[0])
  return [finish, material, noun].filter(Boolean).join(' ')
}

/**
 * Attribute values are entered inconsistently — "GOLD" and "Gold" both appear.
 * An all-caps word reads as shouting in a title, so settle it to Title Case.
 * Mixed-case values are left exactly as authored.
 */
function calmCase(value?: string): string {
  if (!value) return ''
  if (value !== value.toUpperCase()) return value
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, c => c.toUpperCase())
}

/**
 * Page title, sized for the SERP.
 *
 * Longest form first, falling back until one fits — a title truncated
 * mid-attribute reads worse than one that simply carries less.
 */
export function productTitle(p: ProductCopyInput): string {
  const headline = productHeadline(p)
  const size = primarySize(p)
  // Only worth appending when it is not already the headline.
  const model = hasRealWords(p.name) ? '' : p.name.trim()

  // The model code is what makes a title unique across near-identical pieces,
  // so it outranks the size when only one of the two fits.
  const withSize = size ? `${headline}, ${size}` : headline
  const candidates = [
    model ? `${withSize} — ${model}` : withSize,
    model ? `${headline} — ${model}` : withSize,
    withSize,
    headline,
  ]

  return (
    candidates.find(c => c.length <= MAX_TITLE_LENGTH) ??
    clamp(headline, MAX_TITLE_LENGTH)
  )
}

/**
 * Meta description.
 *
 * An authored description wins, but only if it survives the SERP budget whole.
 * The backfilled descriptions (scripts/generate-descriptions.mjs) run 300-600
 * characters of body copy, and clamping one to 158 yields a sentence cut mid-clause
 * with an ellipsis — strictly worse in the SERP than the attribute build below,
 * which is written to fit and closes on price, delivery and warranty. So: take the
 * whole thing if it fits, else its first complete sentence if that fits, else build
 * from attributes.
 */
export function productMetaDescription(p: ProductCopyInput): string {
  const authored = p.description?.trim().replace(/\s+/g, ' ')
  if (authored) {
    if (authored.length <= MAX_DESCRIPTION_LENGTH) return authored
    const firstSentence = authored.match(/^[^.!?]*[.!?]/)?.[0]?.trim()
    if (firstSentence && firstSentence.length <= MAX_DESCRIPTION_LENGTH) return firstSentence
  }

  return attributeMetaDescription(p)
}

/** The composed fallback: physical facts first, commercial terms last. */
function attributeMetaDescription(p: ProductCopyInput): string {
  const noun = categoryNoun(p.categoryName).toLowerCase()
  const size = primarySize(p)
  const finish = splitList(p.bodyColors)[0]?.toLowerCase()
  const materials = joinProse(splitList(p.materials))
  const source = p.lightSource?.trim()

  const composition = [finish, materials].filter(Boolean).join(' ')
  const lead = [size, noun].filter(Boolean).join(' ')

  const facts = [
    composition ? `${lead} in ${composition}` : lead,
    source ? `${source} light source` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const price = formatPrice(p.price)
  const commerce = price
    ? `${price} with free delivery across India and a 5-year warranty.`
    : 'Free delivery across India, 5-year warranty and 7-day returns.'

  // Capitalise the opening fact — it starts the sentence.
  const sentence = facts ? `${facts[0].toUpperCase()}${facts.slice(1)}. ` : ''
  return clamp(`${sentence}${commerce}`, MAX_DESCRIPTION_LENGTH)
}

/**
 * Body copy for the description panel.
 *
 * Short factual sentences over the stored attributes. This is what turns a page
 * with ~50 unique words into one with ~90, and every sentence is specific to the
 * record — no shared paragraph padding the count.
 */
export function productBodyCopy(p: ProductCopyInput): string {
  if (p.description?.trim()) return p.description.trim()

  const headline = productHeadline(p).toLowerCase()
  const model = hasRealWords(p.name) ? '' : p.name.trim()
  const sentences: string[] = []

  // ponytail: article(), not a hardcoded "a" — headline starts with the colour
  // ("olive green glass wall light", "amber glass pendant"), so this read
  // "is a olive green..." on every page whose colour begins with a vowel.
  const an = article(headline)
  sentences.push(
    model
      ? `${model} is ${an} ${headline}.`
      : `${an === 'an' ? 'An' : 'A'} ${headline}.`
  )

  // Square pieces report the same number as diameter and width; listing it twice
  // ("850mm across and 850mm wide") reads like a mistake, so keep first mention.
  const measured = new Set<string>()
  const dimensions = (
    [
      [p.diameter, 'across'],
      [p.productHeight, 'high'],
      [p.productWidth, 'wide'],
    ] as Array<[string | null | undefined, string]>
  ).flatMap(([raw, axis]) => {
    const value = normalizeDimension(raw)
    if (!value || measured.has(value)) return []
    measured.add(value)
    return [`${value} ${axis}`]
  })

  if (dimensions.length > 0) {
    sentences.push(`It measures ${joinProse(dimensions)}.`)
  }

  const source = p.lightSource?.trim()
  const wattage = String(p.wattage ?? '').trim()
  if (source) {
    sentences.push(
      wattage
        ? `Fitted for ${article(source)} ${source} light source at ${wattage}.`
        : `Fitted for ${article(source)} ${source} light source.`,
    )
  }

  const rooms = splitList(p.whereUsed)
  if (rooms.length > 0) {
    sentences.push(`Suited to the ${joinProse(rooms)}.`)
  }

  sentences.push('Ships free anywhere in India with a 5-year warranty and 7-day returns.')

  return sentences.join(' ')
}

/**
 * Specifications table. Only rows the backend actually filled — an empty row
 * reads as a gap in the listing, which is worse than a shorter table.
 */
export function productSpecs(p: ProductCopyInput): Record<string, string> {
  // A round piece records the same number as diameter, width and length. Listing
  // it three times reads as padding, so the across-the-piece axes keep only the
  // first mention. Height is always kept — it is a genuinely different axis.
  const acrossSeen = new Set<string>()
  const across = (raw?: string | number | null): string => {
    const value = normalizeDimension(raw)
    if (!value || acrossSeen.has(value)) return ''
    acrossSeen.add(value)
    return value
  }

  const rows: Array<[string, string]> = [
    ['Category', p.categoryName?.trim() ?? ''],
    ['Material', splitList(p.materials).join(', ')],
    ['Finish', splitList(p.bodyColors).join(', ')],
    ['Light source', p.lightSource?.trim() ?? ''],
    ['Wattage', String(p.wattage ?? '').trim()],
    ['Diameter', across(p.diameter)],
    ['Height', normalizeDimension(p.productHeight)],
    ['Width', across(p.productWidth)],
    ['Length', across(p.productLength)],
    ['Weight', String(p.weight ?? '').trim()],
    ['Model', p.name.trim()],
    ['SKU', p.sku?.trim() ?? ''],
  ]

  return Object.fromEntries(rows.filter(([, value]) => value.length > 0))
}
