// lib/ar/helpers.test.mjs
//
// Height parsing, image URL, alpha trim, capture crop and in-app detection for the
// camera overlay. Run with:
//   node --test lib/ar/helpers.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  parseHeightMm, arImageSrc, alphaBounds, coverCrop, inAppBrowser, isAndroid, chromeIntentUrl,
} = await import('./helpers.ts')

test('heights the catalogue states plainly are read in mm', () => {
  // Real productHeight values from GET /api/products, 2026-11-02.
  const cases = {
    '330': 330, ' 400': 400, '600mm': 600, '1600mm ': 1600, '350mm  ': 350,
    'H550mm': 550, ' H150mm': 150, 'H1500mm ': 1500, 'Single H260mm': 260,
    'Lamp Tube - H400mm': 400, 'H600mm W350mm': 600, 'D100mm H300mm': 300,
    'H270mm D140mm': 270, ' D500 H70mm': 70, ' D500mm h240mm': 240,
    'L120mm B120 H175mm': 175, ' Width- 200mm  Height- 400mm': 400,
    'Diameter - 1100mm  Height - 140mm': 140, 'Width - 140mm Height - 500mm': 500,
    'H300/600/900': 300,
  }
  for (const [raw, mm] of Object.entries(cases)) assert.equal(parseHeightMm(raw), mm, raw)
})

test('ambiguous or non-height values are not guessed at', () => {
  for (const raw of [
    'L170xH280', '3H-600 4H-800', '200x300', '370X370', '1730x315x1400', 'Plate 560',
    'tube300', 'Dia500mm', 'L 1200mm', 'D250MM', 'D150mmx3', '130+50', 'Plate L', '0', '',
  ]) assert.equal(parseHeightMm(raw), undefined, raw)
  assert.equal(parseHeightMm(null), undefined)
  assert.equal(parseHeightMm(undefined), undefined)
})

test('arImages load through the same-origin image optimizer', () => {
  const src = 'https://bucket.s3.amazonaws.com/ar/a b&c.png?v=1'
  const u = new URL(arImageSrc(src), 'https://www.litmeup.in')
  assert.equal(u.pathname, '/_next/image')
  assert.equal(u.searchParams.get('url'), src)
  assert.equal(u.searchParams.get('w'), '1080')
  assert.equal(u.searchParams.get('q'), '75')
})

test('alpha bounds find the opaque region and ignore faint pixels', () => {
  const w = 5, h = 4
  const rgba = new Uint8ClampedArray(w * h * 4)
  const set = (x, y, a) => { rgba[(y * w + x) * 4 + 3] = a }
  set(1, 1, 255)
  set(3, 2, 16)
  set(4, 3, 15) // below the threshold
  assert.deepEqual(alphaBounds(rgba, w, h), { x: 1, y: 1, w: 3, h: 2 })
  assert.equal(alphaBounds(new Uint8ClampedArray(w * h * 4), w, h), null)
})

test('cover crop trims the sides of a landscape frame on a portrait stage', () => {
  // 1920x1080 into 390x844: scale = 844/1080, visible width = 390/scale.
  const c = coverCrop(1920, 1080, 390, 844)
  const scale = 844 / 1080
  assert.ok(Math.abs(c.sh - 1080) < 1e-9)
  assert.ok(Math.abs(c.sw - 390 / scale) < 1e-9)
  assert.ok(Math.abs(c.sx - (1920 - c.sw) / 2) < 1e-9)
  assert.equal(c.sy, 0)
  assert.ok(Math.abs(c.k - 1 / scale) < 1e-9)
})

test('cover crop trims top and bottom of a portrait frame on a wide stage', () => {
  const c = coverCrop(1080, 1920, 1000, 500)
  assert.equal(c.sw, 1080)
  assert.equal(c.sh, 540)
  assert.equal(c.sx, 0)
  assert.equal(c.sy, 690)
  assert.equal(c.k, 1.08)
})

test('in-app browsers are recognised from the user agent', () => {
  const ig = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36 Instagram 350.0.0.0'
  const fb = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]'
  const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
  assert.equal(inAppBrowser(ig), 'instagram')
  assert.equal(inAppBrowser(fb), 'facebook')
  assert.equal(inAppBrowser(safari), 'none')
  assert.equal(isAndroid(ig), true)
  assert.equal(isAndroid(fb), false)
})

test('the Chrome intent link reopens the same page and falls back to it', () => {
  const href = 'https://www.litmeup.in/collections/crystal-pendant?v=2#reviews'
  const url = chromeIntentUrl(href)
  assert.ok(url.startsWith('intent://www.litmeup.in/collections/crystal-pendant?v=2#Intent;'))
  assert.ok(url.includes(';scheme=https;'))
  assert.ok(url.includes(';package=com.android.chrome;'))
  assert.ok(url.endsWith(`;S.browser_fallback_url=${encodeURIComponent(href)};end`))
})
