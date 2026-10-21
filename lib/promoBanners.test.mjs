// lib/promoBanners.test.mjs
//
// The homepage promo banners' image choice and discount line. Run with:
//   node --test lib/promoBanners.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { promoImageOf, promoValueLine } = await import('./promoBanners.ts')

test('the image falls back promoImage → bannerImage → image', () => {
  const all = { promoImage: 'https://x/p.jpg', bannerImage: 'https://x/b.jpg', image: 'https://x/i.jpg' }
  assert.equal(promoImageOf(all), 'https://x/p.jpg')
  assert.equal(promoImageOf({ ...all, promoImage: null }), 'https://x/b.jpg')
  assert.equal(promoImageOf({ image: 'https://x/i.jpg' }), 'https://x/i.jpg')
})

test('blank image fields are skipped, and nothing at all gives null', () => {
  assert.equal(promoImageOf({ promoImage: '  ', bannerImage: '', image: ' https://x/i.jpg ' }), 'https://x/i.jpg')
  assert.equal(promoImageOf({ promoImage: null, bannerImage: null, image: null }), null)
  // The category itself can be missing when /api/categories fails.
  assert.equal(promoImageOf(undefined), null)
})

test('the discount line names the highest real discount', () => {
  assert.equal(promoValueLine([10, undefined, 35, 20], 'Handcrafted'), 'Up to 35% Off')
  assert.equal(promoValueLine([5], 'Handcrafted'), 'Up to 5% Off')
})

test('no discount, or a failed fetch, shows the value line instead of a percentage', () => {
  assert.equal(promoValueLine([], 'Handcrafted statement pieces'), 'Handcrafted statement pieces')
  assert.equal(promoValueLine([undefined, undefined], 'Handcrafted'), 'Handcrafted')
  assert.equal(promoValueLine([0, 0], 'Handcrafted'), 'Handcrafted')
})

test('garbage never becomes a percentage, and fractions round down so we never overstate', () => {
  assert.equal(promoValueLine([NaN, -20, Infinity], 'Handcrafted'), 'Handcrafted')
  assert.equal(promoValueLine([33.9], 'Handcrafted'), 'Up to 33% Off')
  assert.equal(promoValueLine([0.4], 'Handcrafted'), 'Handcrafted')
})
