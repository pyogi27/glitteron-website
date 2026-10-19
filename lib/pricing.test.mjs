// lib/pricing.test.mjs
//
// Display prices from the backend's discount fields. Run with:
//   node --test lib/pricing.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { displayPrice, serverLineFor } = await import('./pricing.ts')

test('a discounted row shows the sale price, the struck-through list price and the percent', () => {
  assert.deepEqual(displayPrice(1000, { compareAtPrice: 1000, discountedPrice: 800 }), {
    price: 800, originalPrice: 1000, discount: 20,
  })
  // Backend DECIMALs arrive as strings.
  assert.deepEqual(displayPrice(1000, { compareAtPrice: '1000.00', discountedPrice: '666.70' }), {
    price: 666.7, originalPrice: 1000, discount: 33,
  })
})

test('no discount, or a missing/garbled field, keeps the list price', () => {
  assert.deepEqual(displayPrice(1000, { compareAtPrice: 1000, discountedPrice: 1000 }), { price: 1000 })
  assert.deepEqual(displayPrice(1000, {}), { price: 1000 })
  assert.deepEqual(displayPrice(1000, { compareAtPrice: 'x', discountedPrice: 800 }), { price: 1000 })
  assert.deepEqual(displayPrice(0, { compareAtPrice: 0, discountedPrice: 0 }), { price: 0 })
})

test('a tiny discount still shows a badge of at least 1%', () => {
  assert.equal(displayPrice(1000, { compareAtPrice: 1000, discountedPrice: 999 }).discount, 1)
})

test('manually authored fields survive when there is no automatic discount', () => {
  assert.deepEqual(displayPrice(900, {}, { originalPrice: 1200, discount: 25 }), {
    price: 900, originalPrice: 1200, discount: 25,
  })
  // ...but an automatic discount wins.
  assert.equal(displayPrice(1000, { compareAtPrice: 1000, discountedPrice: 700 }, { originalPrice: 1200 }).originalPrice, 1000)
})

test('serverLineFor matches on product id and variation id', () => {
  const server = [
    { productId: 7, productVariationId: null, discountedPrice: 90 },
    { productId: 7, productVariationId: 70, discountedPrice: 80 },
  ]
  assert.equal(serverLineFor({ productId: '7' }, server)?.discountedPrice, 90)
  assert.equal(serverLineFor({ productId: 'slug', apiProductId: 7, productVariationId: 70 }, server)?.discountedPrice, 80)
  assert.equal(serverLineFor({ productId: '7', productVariationId: 71 }, server), undefined)
  assert.equal(serverLineFor({ productId: 'p1' }, server), undefined) // static catalogue
})
