// lib/pricing.test.mjs
//
// Display prices from the backend's discount fields. Run with:
//   node --test lib/pricing.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { displayPrice, serverLineFor, listingPrice, formatListingPrice } = await import('./pricing.ts')

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

test('a variation product with a ₹0 placeholder shows its variation range, not ₹0', () => {
  // Live row, product 1736 (2026-10-20).
  const row = { hasVariations: true, price: '0.00', compareAtPrice: 0, discountedPrice: 0,
    priceRange: { min: 41800, max: 59800 }, discountedPriceRange: { min: 41800, max: 59800 } }
  assert.deepEqual(listingPrice(row), { price: 41800, maxPrice: 59800 })
  assert.equal(formatListingPrice(listingPrice(row)), 'From ₹41,800')
  // One price across all variations: no "From".
  assert.deepEqual(listingPrice({ hasVariations: true, price: 0, priceRange: { min: '9000', max: '9000' } }), { price: 9000 })
  // A discounted range strikes through the list minimum.
  assert.deepEqual(listingPrice({ hasVariations: true, price: 0, priceRange: { min: 1000, max: 2000 }, discountedPriceRange: { min: 800, max: 1600 } }),
    { price: 800, originalPrice: 1000, discount: 20, maxPrice: 1600 })
})

test('plain products and range-less rows keep the old behaviour', () => {
  assert.deepEqual(listingPrice({ hasVariations: false, price: '499.50', priceRange: { min: 499.5, max: 499.5 } }), { price: 499.5 })
  assert.deepEqual(listingPrice({ hasVariations: true, price: '1200' }), { price: 1200 })
  assert.deepEqual(listingPrice({ price: 1000, compareAtPrice: 1000, discountedPrice: 800 }), { price: 800, originalPrice: 1000, discount: 20 })
  assert.equal(formatListingPrice({ price: 1200 }), '₹1,200')
})
