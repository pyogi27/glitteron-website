// lib/api/proxyGuard.test.mjs
//
// The /api proxies' cross-site check and the shopper IP they vouch for. Run with:
//   node --test lib/api/proxyGuard.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { isCrossSite, clientIpFrom, backendHeaders } = await import('./proxyGuard.ts')

const h = (o) => new Headers(o)

test('a POST from another site is refused; same-site and Origin-less ones pass', () => {
  assert.equal(isCrossSite('POST', h({ host: 'www.litmeup.in', origin: 'https://evil.example' })), true)
  assert.equal(isCrossSite('POST', h({ host: 'www.litmeup.in', origin: 'null' })), true)
  assert.equal(isCrossSite('DELETE', h({ host: 'www.litmeup.in', origin: 'https://litmeup.in' })), true)
  assert.equal(isCrossSite('POST', h({ host: 'www.litmeup.in', origin: 'https://www.litmeup.in' })), false)
  assert.equal(isCrossSite('PATCH', h({ host: 'localhost:3001', origin: 'http://localhost:3001' })), false)
  assert.equal(isCrossSite('POST', h({ host: 'www.litmeup.in' })), false)
  assert.equal(isCrossSite('GET', h({ host: 'www.litmeup.in', origin: 'https://evil.example' })), false)
})

test('the shopper IP is the last forwarded hop, which the client cannot type', () => {
  assert.equal(clientIpFrom(h({ 'x-forwarded-for': '1.2.3.4, 49.36.1.2' })), '49.36.1.2')
  assert.equal(clientIpFrom(h({ 'x-forwarded-for': '49.36.1.2' })), '49.36.1.2')
  assert.equal(clientIpFrom(h({ 'x-real-ip': '49.36.1.2' })), '49.36.1.2')
  assert.equal(clientIpFrom(h({})), null)
})

test('the IP is sent only with the shared secret; auth and cookie pass through', () => {
  const incoming = h({ authorization: 'Bearer t', cookie: 'a=1', 'x-forwarded-for': '49.36.1.2', 'x-client-ip': 'spoofed' })
  assert.deepEqual(backendHeaders(incoming, 's3cret'), {
    'Content-Type': 'application/json',
    authorization: 'Bearer t',
    cookie: 'a=1',
    'x-client-ip': '49.36.1.2',
    'x-proxy-secret': 's3cret',
  })
  assert.equal(backendHeaders(incoming, undefined)['x-client-ip'], undefined)
})
