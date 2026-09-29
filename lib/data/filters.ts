/**
 * Material and colour filters for the product listings.
 *
 * The catalogue's attribute values are hand-typed and drifted: "Marbel" for
 * Marble, "GOLD" beside "Golden", "Black Smokey" and "Black smoky" side by
 * side. So each option a shopper sees stands for every spelling behind it, and
 * a spelling missing here silently drops that stock from the option — and from
 * the facet landing page built on the same slug (`/wall-lights/gold`).
 *
 * The backend matches whole tokens, ignoring case and spaces (tokenMatch in the
 * product controller), so "Gun Black" already covers "GunBlack" and "gun black";
 * only genuinely different spellings need listing. Checked against the live
 * catalogue on 2026-09-29: the smallest options (Pink, Red) hold 21 products,
 * and the lists cover 95% of products by material and 86% by colour. What is
 * left is too thin to fill a grid — neon, leather, rose gold, chrome.
 */

export interface FilterOption {
  /** URL value, and the facet page segment where one exists. */
  slug: string
  label: string
  /** Exact backend values, OR-ed by the API when passed comma-separated. */
  values: string[]
  /** CSS background for the colour dot. */
  swatch?: string
}

export const MATERIALS: FilterOption[] = [
  {
    slug: 'metal',
    label: 'Metal',
    values: ['Metal', 'Matel', 'Meta', 'Mild Steel', 'Mildstee', 'Iron', 'Steel', 'Stainless Steel', 'Aluminum', 'Aluminium', 'Brass'],
  },
  { slug: 'glass', label: 'Glass', values: ['Glass'] },
  { slug: 'acrylic', label: 'Acrylic', values: ['Acrylic', 'Acryalic', 'Acylic'] },
  { slug: 'fabric', label: 'Fabric', values: ['Fabric', 'Fabri', 'Washable Fabric', 'Fabric Washable', 'Silk'] },
  { slug: 'wood', label: 'Wood', values: ['Wood'] },
  { slug: 'marble', label: 'Marble', values: ['Marble', 'Marbel'] },
  { slug: 'resin', label: 'Resin', values: ['Resin', 'Resin Body'] },
  {
    slug: 'stone',
    label: 'Stone & Concrete',
    values: ['Stone', 'Natural Stone', 'Natural Rock', 'Travertine Stone', 'Concrete', 'Terrazzo', 'Terrazzo Concrete'],
  },
  { slug: 'ceramic', label: 'Ceramic', values: ['Ceramic'] },
]

export const COLORS: FilterOption[] = [
  {
    slug: 'gold',
    label: 'Gold',
    values: ['Golden', 'GOLD', 'Brass Gold', 'Antique Brass'],
    swatch: 'linear-gradient(135deg, #F1D78C, #C49A45 55%, #8A6724)',
  },
  { slug: 'black', label: 'Black', values: ['Black', 'Gun Black', 'Black Smokey', 'Black smoky'], swatch: '#1F1B19' },
  { slug: 'white', label: 'White', values: ['White', 'Off White', 'Milky White', 'Milky', 'White Milk'], swatch: '#FFFFFF' },
  { slug: 'cream', label: 'Cream & Beige', values: ['Cream', 'Beige'], swatch: '#E6D8BC' },
  { slug: 'grey', label: 'Grey', values: ['Gray', 'Grey', 'Charcoal Grey', 'Dark Grey'], swatch: '#8E8A86' },
  {
    slug: 'brown',
    label: 'Brown & Wood',
    values: ['Walnut', 'Wooden', 'Brown', 'Light Wooden', 'Dark Wood', 'Wood', 'Light Wood', 'Walnut Wood', 'Wallnut', 'Cane Wood', 'Tan Brown', 'Dark Wooden'],
    swatch: 'linear-gradient(135deg, #A0714A, #5E3B22)',
  },
  {
    slug: 'clear',
    label: 'Clear',
    values: ['Transparent', 'Clear', 'Transperent'],
    swatch: 'linear-gradient(135deg, #FFFFFF 20%, #D5E1E6 50%, #FFFFFF 80%)',
  },
  { slug: 'amber', label: 'Amber', values: ['Amber'], swatch: 'radial-gradient(circle at 35% 35%, #F7B955, #B5620E)' },
  { slug: 'green', label: 'Green', values: ['Green', 'Olive Green', 'Sea Green'], swatch: '#4F7A4A' },
  { slug: 'blue', label: 'Blue', values: ['Blue', 'Sky Blue'], swatch: '#3F6C9E' },
  { slug: 'pink', label: 'Pink', values: ['Pink', 'Bright Pink'], swatch: '#E5A5B5' },
  { slug: 'red', label: 'Red', values: ['Red', 'Maroon'], swatch: '#A8322A' },
]

/** A listing's filter state, in the query params `/collections` reads. */
export interface ListingFilters {
  category?: string
  /** Comma-joined MATERIALS slugs. */
  material?: string
  /** Comma-joined COLORS slugs. */
  color?: string
  minPrice?: string
  maxPrice?: string
}

/**
 * The known slugs in a URL value, in table order; undefined when none are.
 * The value comes straight off the query string, and a repeated key arrives as
 * an array — which String() joins with commas, the same as the joined form.
 */
export function pickSlugs(options: FilterOption[], raw?: string | string[]): string | undefined {
  const wanted = new Set(String(raw ?? '').split(','))
  const slugs = options.filter(o => wanted.has(o.slug)).map(o => o.slug)
  return slugs.length > 0 ? slugs.join(',') : undefined
}

/** The backend `materials`/`bodyColors` param for a comma-joined slug list. */
export function backendValues(options: FilterOption[], slugs?: string): string | undefined {
  const wanted = new Set(slugs?.split(','))
  const values = options.filter(o => wanted.has(o.slug)).flatMap(o => o.values)
  return values.length > 0 ? values.join(',') : undefined
}

/** Adds the slug to a comma-joined list, or removes it if it is already there. */
export function toggleSlug(slugs: string | undefined, slug: string): string | undefined {
  const list = slugs ? slugs.split(',') : []
  const next = list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug]
  return next.length > 0 ? next.join(',') : undefined
}

/**
 * The URL for a filter state on a listing that reads it from its query —
 * `/collections`, or a category landing page. No page param, so it lands on page 1.
 */
export function listingHref(filters: ListingFilters, path = '/collections'): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
