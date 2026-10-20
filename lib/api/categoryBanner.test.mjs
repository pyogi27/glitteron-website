// lib/api/categoryBanner.test.mjs
//
// Self-check for findCategoryBanner. Run with:
//   node --experimental-strip-types lib/api/categoryBanner.test.mjs
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// Node's ESM loader needs the extension the bundler fills in.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const bare = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)
    return nextResolve(bare ? `${specifier}.ts` : specifier, context)
  },
})
const { findCategoryBanner } = await import('./categoryBanner.ts')

const cats = [
  { id: 1, name: 'Pendant Lights', bannerImage: null },
  { id: 2, name: 'Chandelier Lights', bannerImage: 'https://s3/chandelier.jpg' },
  { id: 3, name: 'Wall Lights', bannerImage: 'https://s3/wall.jpg' },
  { id: 4, name: 'Floor Lamps' },
]

// Own banner wins.
assert.equal(findCategoryBanner(cats, 'Wall Lights'), 'https://s3/wall.jpg')
// No own banner: first of `names` that has one (umbrella page).
assert.equal(findCategoryBanner(cats, 'Pendant Lights', ['Pendant Lights', 'Chandelier Lights']), 'https://s3/chandelier.jpg')
// Own banner beats the umbrella list.
assert.equal(findCategoryBanner(cats, 'Wall Lights', ['Chandelier Lights']), 'https://s3/wall.jpg')
// Nothing anywhere, unknown name, empty API: no banner.
assert.equal(findCategoryBanner(cats, 'Floor Lamps'), undefined)
assert.equal(findCategoryBanner(cats, 'Nope', ['Also nope']), undefined)
assert.equal(findCategoryBanner([], 'Wall Lights'), undefined)

console.log('categoryBanner: ok')
