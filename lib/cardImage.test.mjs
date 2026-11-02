// lib/cardImage.test.mjs
//
// Which card shots fill the tile (room backdrop) and which stay padded (on white). Run with:
//   node --test lib/cardImage.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { hasBackdrop } = await import('./cardImage.ts')

const SIZE = 8

function buffer(fill, edit = () => {}) {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4)
  for (let i = 0; i < SIZE * SIZE; i++) data.set(fill, i * 4)
  edit(data)
  return data
}

function setPixel(data, x, y, rgba) {
  data.set(rgba, (y * SIZE + x) * 4)
}

test('a shot on white stays padded', () => {
  assert.equal(hasBackdrop(buffer([255, 255, 255, 255]), SIZE), false)
})

test('a transparent cutout stays padded', () => {
  assert.equal(hasBackdrop(buffer([0, 0, 0, 0]), SIZE), false)
})

test('a grey room backdrop fills the tile', () => {
  assert.equal(hasBackdrop(buffer([214, 210, 204, 255]), SIZE), true)
})

test('a product on white touching one edge pixel stays padded', () => {
  const data = buffer([255, 255, 255, 255], (d) => setPixel(d, 3, 0, [20, 20, 20, 255]))
  assert.equal(hasBackdrop(data, SIZE), false)
})

test('a dark product in the middle does not count as backdrop', () => {
  const data = buffer([255, 255, 255, 255], (d) => {
    for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) setPixel(d, x, y, [0, 0, 0, 255])
  })
  assert.equal(hasBackdrop(data, SIZE), false)
})
