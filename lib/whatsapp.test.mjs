// lib/whatsapp.test.mjs
//
// The wa.me links behind the homepage consultation section. Run with:
//   node --test lib/whatsapp.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { waMeUrl } = await import('./whatsapp.ts')
const { COMPANY } = await import('./company.ts')

test('the company number becomes bare digits in the path', () => {
  const url = new URL(waMeUrl(COMPANY.phone, 'Hi'))
  assert.equal(url.origin + url.pathname, 'https://wa.me/919727800808')
})

test('the message round-trips, including characters that would break the query', () => {
  const text = "Hi LitMeUp, I'd like a 2700K & 3000K quote? #room 1\nThanks"
  assert.equal(new URL(waMeUrl(COMPANY.phone, text)).searchParams.get('text'), text)
})

test('a number that is not 8 to 15 digits throws instead of opening the share picker', () => {
  assert.throws(() => waMeUrl('', 'Hi'))
  assert.throws(() => waMeUrl('+91 9727', 'Hi'))
  assert.throws(() => waMeUrl('+91 97278 00808 00808', 'Hi'))
})

test('the site-wide chat link carries the prefilled message to the company number', async () => {
  const { WHATSAPP_MESSAGE } = await import('./whatsapp.ts')
  const url = new URL(waMeUrl(COMPANY.phone, WHATSAPP_MESSAGE))
  assert.equal(url.pathname, '/919727800808')
  assert.equal(url.searchParams.get('text'), WHATSAPP_MESSAGE)
})
