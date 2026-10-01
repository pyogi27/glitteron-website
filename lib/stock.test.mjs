// lib/stock.test.mjs
//
// Per-variation stock and the cart's stock ceiling. Run with:
//   node --test lib/stock.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

// cartStore persists to localStorage; give it an in-memory one so zustand stays quiet.
const mem = new Map()
globalThis.localStorage = {
  getItem: k => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k),
}

const { mapVariation, variationStock } = await import('./variations.ts')
const { useCartStore } = await import('./stores/cartStore.ts')

const row = (over = {}) => ({ id: 1, productId: 9, price: 100, ...over })

test('variation stock is quantity minus reserved', () => {
  assert.equal(variationStock(row({ quantity: 10, reservedQuantity: 3 })), 7)
  assert.equal(variationStock(row({ quantity: 10 })), 10)
})

test('variation stock never goes below 0', () => {
  assert.equal(variationStock(row({ quantity: 2, reservedQuantity: 5 })), 0)
  assert.equal(variationStock(row({ quantity: -4 })), 0)
})

test('variation stock falls back to inStock when quantity is missing', () => {
  assert.equal(variationStock(row({ inStock: false })), 0)
  assert.ok(variationStock(row({ inStock: true })) > 0)
})

test('mapped variation derives inStock from stock so the two cannot disagree', () => {
  // The backend's own inStock ignores reservations; a fully reserved row is not buyable.
  const v = mapVariation(row({ quantity: 3, reservedQuantity: 3, inStock: true }))
  assert.equal(v.stock, 0)
  assert.equal(v.inStock, false)
  assert.equal(mapVariation(row({ quantity: 3 })).inStock, true)
})

const line = (over = {}) => ({
  productId: 'p1', name: 'Lamp', price: 100, image: '', quantity: 2,
  size: '300', finish: 'Grey', productVariationId: 11, maxQty: 3, ...over,
})
const reset = () => useCartStore.setState({ items: [] })
const items = () => useCartStore.getState().items

test('adding to an existing line stops at its stock and reports what was added', () => {
  reset()
  const { addItem } = useCartStore.getState()
  assert.equal(addItem(line()), 2)
  assert.equal(addItem(line()), 1)
  assert.equal(items().length, 1)
  assert.equal(items()[0].quantity, 3)
})

test('a single add larger than stock is cut down', () => {
  reset()
  assert.equal(useCartStore.getState().addItem(line({ quantity: 9 })), 3)
  assert.equal(items()[0].quantity, 3)
})

test('updateQty cannot go over the line stock', () => {
  reset()
  const s = useCartStore.getState()
  s.addItem(line({ quantity: 1 }))
  s.updateQty({ productId: 'p1', size: '300', finish: 'Grey' }, 8)
  assert.equal(items()[0].quantity, 3)
})

test('lines without a stock limit (persisted before maxQty) are not capped', () => {
  reset()
  const s = useCartStore.getState()
  s.addItem(line({ maxQty: undefined }))
  s.addItem(line({ maxQty: undefined, quantity: 5 }))
  assert.equal(items()[0].quantity, 7)
})
