// lib/variations.test.mjs
//
// Finish options across inconsistently spelled rows. Run with:
//   node --test lib/variations.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { finishOptions, unavailableFinishes } = await import('./variations.ts')

// Product 1645 as of 2026-10-01: the 300mm row spells it "Yellow " (trailing space),
// the 400mm row "Yellow".
const rows = [
  { id: 382, size: '300', color: 'Yellow ' },
  { id: 383, size: '300', color: 'Grey' },
  { id: 437, size: '400', color: 'Yellow' },
  { id: 439, size: '400', color: 'Grey' },
  { id: 436, size: '400', color: 'White' },
].map(r => ({ name: '', price: 1, stock: 1, inStock: true, ...r }))

test('a finish spelled differently per size is still available in both', () => {
  assert.deepEqual(unavailableFinishes(rows, '400'), [])
  assert.deepEqual(unavailableFinishes(rows, '300'), ['White'])
})

test('size-scoped finishes use the same spelling as the full list', () => {
  const all = finishOptions(rows)
  for (const f of finishOptions(rows, '400')) assert.ok(all.includes(f), f)
})
