// lib/data/filters.test.mjs
//
// Self-check for the listing filters. Run with:
//   node --experimental-strip-types lib/data/filters.test.mjs
import assert from 'node:assert/strict'
import { COLORS, MATERIALS, MAX_SEARCH_LENGTH, backendValues, listingHref, parseSearch, pickSlugs, toggleSlug } from './filters.ts'
import { facetSlugs, getFacet } from './facets.ts'

// URL values: unknown slugs drop out, order follows the table, and a repeated
// key (an array) reads the same as the comma-joined form.
assert.equal(pickSlugs(COLORS, 'red,gold,bogus'), 'gold,red')
assert.equal(pickSlugs(COLORS, ['red', 'gold']), 'gold,red')
assert.equal(pickSlugs(COLORS, 'bogus'), undefined)
assert.equal(pickSlugs(COLORS, ''), undefined)
assert.equal(pickSlugs(COLORS, undefined), undefined)

// A slug expands to every backend spelling behind it.
assert.equal(backendValues(MATERIALS, 'marble'), 'Marble,Marbel')
assert.equal(backendValues(MATERIALS, 'bogus'), undefined)
assert.equal(backendValues(MATERIALS, undefined), undefined)

// Toggling adds and removes, and an emptied list is undefined so the param drops.
assert.equal(toggleSlug(undefined, 'glass'), 'glass')
assert.equal(toggleSlug('glass', 'metal'), 'glass,metal')
assert.equal(toggleSlug('glass,metal', 'glass'), 'metal')
assert.equal(toggleSlug('glass', 'glass'), undefined)

assert.equal(listingHref({}), '/collections')
assert.equal(
  listingHref({ category: 'Wall Lights', color: 'gold,black', minPrice: undefined }),
  '/collections?category=Wall+Lights&color=gold%2Cblack',
)
// A category landing page keeps its own path; the path names the category.
assert.equal(listingHref({ color: 'gold' }, '/hanging-lights'), '/hanging-lights?color=gold')
assert.equal(listingHref({}, '/hanging-lights'), '/hanging-lights')
// A search rides along with the filters, so filtering a result set narrows it.
assert.equal(listingHref({ q: 'brass lamp', color: 'gold' }), '/collections?q=brass+lamp&color=gold')

// Search terms: trimmed, blank drops out, a repeated key keeps the first, overlong is cut.
assert.equal(parseSearch('  pendant '), 'pendant')
assert.equal(parseSearch('   '), undefined)
assert.equal(parseSearch(undefined), undefined)
assert.equal(parseSearch(['wall', 'floor']), 'wall')
assert.equal(parseSearch('x'.repeat(MAX_SEARCH_LENGTH + 50)).length, MAX_SEARCH_LENGTH)

// Facet landing pages (/wall-lights/gold) filter by these tables through their
// slug. A facet with no matching option would quietly show the whole category.
for (const slug of facetSlugs) {
  const { kind } = getFacet(slug)
  const table = kind === 'materials' ? MATERIALS : COLORS
  assert.ok(table.some(o => o.slug === slug), `facet "${slug}" has no ${kind} option in filters.ts`)
}

console.log('filters: ok')
