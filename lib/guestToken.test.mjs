// lib/guestToken.test.mjs
//
// Guest order links (/orders/guest#t=…) and the guest email check. Run with:
//   node --test lib/guestToken.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { tokenFromHash, isPlausibleEmail, markGuestSession, takeGuestSessionMark } = await import('./guestToken.ts')

const TOKEN = 'Ab3_-'.repeat(8) + 'xyz' // 43 base64url chars

test('reads a well-formed token from the fragment', () => {
  assert.equal(tokenFromHash(`#t=${TOKEN}`), TOKEN)
  assert.equal(tokenFromHash(`t=${TOKEN}`), TOKEN)
})

test('anything else is no token: the page then shows "link expired", never a lookup', () => {
  assert.equal(tokenFromHash(''), null)
  assert.equal(tokenFromHash('#t='), null)
  assert.equal(tokenFromHash(`#t=${TOKEN}x`), null) // too long
  assert.equal(tokenFromHash(`#t=${TOKEN.slice(1)}`), null) // too short
  assert.equal(tokenFromHash(`#t=${TOKEN.slice(0, 42)}+`), null) // not base64url
  assert.equal(tokenFromHash(`#x=${TOKEN}`), null)
})

test('email check matches the backend rule', () => {
  assert.equal(isPlausibleEmail('asha@example.com'), true)
  assert.equal(isPlausibleEmail('asha@example'), false)
  assert.equal(isPlausibleEmail('asha example.com'), false)
  assert.equal(isPlausibleEmail(`${'a'.repeat(250)}@x.in`), false)
})

test('the guest-session mark is taken once, so sign-in ends a guest session only when checkout started one', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
  assert.equal(takeGuestSessionMark(), false)
  markGuestSession()
  assert.equal(takeGuestSessionMark(), true)
  assert.equal(takeGuestSessionMark(), false)
  globalThis.localStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  assert.doesNotThrow(() => markGuestSession())
  assert.equal(takeGuestSessionMark(), false)
})
