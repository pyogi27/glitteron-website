/**
 * Check for productMetaDescription's authored-copy branches.
 *
 *   node --experimental-strip-types scripts/check-meta-description.mts
 *
 * Separate from generate-descriptions.mjs's `selftest` only because this imports
 * TypeScript and so needs the type-stripping flag. No test runner is configured in
 * this repo; asserts and a non-zero exit are the whole contract.
 *
 * What it guards: once scripts/generate-descriptions.mjs backfills the catalogue,
 * every product suddenly HAS a description, and the naive `return clamp(description,
 * 158)` turned each SERP snippet into a body paragraph cut mid-clause. These four
 * cases pin the fallback order that replaced it.
 */
import assert from 'node:assert/strict'
import { productMetaDescription } from '../lib/seo/product-copy.ts'

const base = {
  name: 'H8907-1',
  categoryName: 'Pendant Lights',
  materials: 'Marble, Metal',
  bodyColors: 'Golden, White',
  lightSource: 'LED',
  productHeight: '160',
  productWidth: '100',
  productLength: '100',
  price: 8600,
}

// 1. No authored description: compose from attributes, inside the SERP budget,
//    keeping the price and commercial terms that earn the click.
const built = productMetaDescription(base)
assert.ok(built.length <= 158, `attribute build too long: ${built.length}`)
assert.ok(built.includes('₹8,600'), 'attribute build must keep the price')

// 2. Authored copy that fits: used verbatim.
const short = 'A compact marble pendant on a slim golden collar, throwing a tight downward pool.'
assert.equal(productMetaDescription({ ...base, description: short }), short)

// 3. Authored body copy that overflows: first complete sentence, never an ellipsis.
const long =
  'A compact marble pendant that reads as a single turned form. The shade throws light downward in a tight pool, which suits a kitchen island or a bedside drop where glare matters. At 160mm tall it hangs comfortably under a nine-foot slab.'
const picked = productMetaDescription({ ...base, description: long })
assert.equal(picked, 'A compact marble pendant that reads as a single turned form.')
assert.ok(!picked.includes('…'), 'must not emit a truncated fragment')

// 4. Authored copy whose first sentence ALSO overflows: fall back to attributes
//    rather than shipping a fragment.
assert.equal(
  productMetaDescription({ ...base, description: `${'x'.repeat(200)}. Second sentence.` }),
  built,
  'unusable authored copy falls back to the attribute build',
)

console.log('check-meta-description: all assertions passed')
