// lib/dealOfTheDay.test.mjs
//
// The homepage Deal of the Day countdown and product pick. Run with:
//   node --test lib/dealOfTheDay.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { dealTimeLeft, splitCountdown, dedupeProducts, selectDealProducts, DEAL_MAX, DEAL_MIN } =
  await import('./dealOfTheDay.ts')

// Asia/Kolkata is UTC+05:30 all year (no DST), so IST wall-clock times map to fixed UTC instants.
const ist = (isoLocal) => Date.parse(`${isoLocal}+05:30`)
const left = (isoLocal) => splitCountdown(dealTimeLeft(ist(isoLocal)))

test('counts down to 23:59:59 IST, not UTC midnight', () => {
  assert.deepEqual(left('2026-10-21T00:00:00'), ['23', '59', '59'])
  assert.deepEqual(left('2026-10-21T12:00:00'), ['11', '59', '59'])
  // 00:00 UTC is 05:30 IST.
  assert.deepEqual(splitCountdown(dealTimeLeft(Date.parse('2026-10-21T00:00:00Z'))), ['18', '29', '59'])
  assert.deepEqual(left('2026-10-21T23:59:57'), ['00', '00', '02'])
})

test('reads exactly 0 at the deadline, then rolls over to the next day', () => {
  assert.equal(dealTimeLeft(ist('2026-10-21T23:59:59')), 0)
  assert.deepEqual(left('2026-10-21T23:59:59'), ['00', '00', '00'])
  assert.deepEqual(left('2026-10-21T23:59:59.001'), ['23', '59', '59'])
  // Across IST midnight the count keeps going down, never jumps to 24:00:00.
  assert.deepEqual(left('2026-10-21T23:59:59.999'), ['23', '59', '59'])
  assert.deepEqual(left('2026-10-22T00:00:00'), ['23', '59', '59'])
  assert.deepEqual(left('2026-10-22T00:00:01'), ['23', '59', '58'])
})

test('never returns a negative or a full day', () => {
  for (let ms = ist('2026-10-21T23:59:58'); ms < ist('2026-10-22T00:00:02'); ms += 137) {
    const t = dealTimeLeft(ms)
    assert.ok(t >= 0 && t < 86_400_000, `${t} at ${new Date(ms).toISOString()}`)
    assert.notEqual(splitCountdown(t)[0], '24')
  }
})

test('splitCountdown pads each unit', () => {
  assert.deepEqual(splitCountdown(3_723_000), ['01', '02', '03'])
  assert.deepEqual(splitCountdown(999), ['00', '00', '00'])
})

const product = (id, discount, extra = {}) => ({ id: String(id), slug: `p-${id}`, price: 1000, discount, ...extra })
const ids = (ps) => ps.map(p => p.id)

test('dedupeProducts keeps the first of each slug (or id when there is no slug)', () => {
  const ps = [product(1), product(2), product(1), { id: '9', slug: '', price: 1 }, { id: '9', slug: '', price: 1 }]
  assert.deepEqual(ids(dedupeProducts(ps)), ['1', '2', '9'])
})

test('0 discounted products: fills to the minimum from the featured catalog', () => {
  const featured = [1, 2, 3, 4, 5, 6, 7].map(i => product(i))
  const picked = selectDealProducts(featured, featured)
  assert.equal(picked.length, DEAL_MIN)
  assert.deepEqual(ids(picked), ['1', '2', '3', '4', '5'])
})

test('3 discounted products: biggest discount first, then featured fill without repeats', () => {
  const featured = [product(1), product(2, 10), product(3), product(4), product(5)]
  const candidates = [...featured, product(20, 35), product(21, 5)]
  assert.deepEqual(ids(selectDealProducts(candidates, featured)), ['20', '2', '21', '1', '3'])
})

test('12+ discounted products: capped at the maximum, sorted by discount', () => {
  const candidates = Array.from({ length: 15 }, (_, i) => product(i + 1, i + 1))
  const picked = selectDealProducts(candidates, [])
  assert.equal(picked.length, DEAL_MAX)
  assert.deepEqual(ids(picked), ['15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4'])
})

test('exactly 12 discounted products are all shown, no fill', () => {
  const candidates = Array.from({ length: 12 }, (_, i) => product(i + 1, 20))
  const picked = selectDealProducts(candidates, [product(99)])
  assert.equal(picked.length, 12)
  assert.ok(!ids(picked).includes('99'))
})

test('duplicates in the API response appear once', () => {
  const candidates = [product(1, 30), product(1, 30), product(2, 20), product(2, 20)]
  const featured = [product(1, 30), product(3), product(3), product(4), product(5)]
  assert.deepEqual(ids(selectDealProducts(candidates, featured)), ['1', '2', '3', '4', '5'])
})

test('ties keep the catalogue order', () => {
  const candidates = [product(1, 20), product(2, 40), product(3, 20), product(4, 20)]
  assert.deepEqual(ids(selectDealProducts(candidates, [])), ['2', '1', '3', '4'])
})

test('never picks a product priced ₹0, as a deal or as fill', () => {
  const zero = product(1, 50, { price: 0 })
  const picked = selectDealProducts([zero, product(2, 10)], [zero, product(3)])
  assert.deepEqual(ids(picked), ['2', '3'])
})

test('an empty catalogue picks nothing', () => {
  assert.deepEqual(selectDealProducts([], []), [])
})
