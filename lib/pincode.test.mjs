import assert from 'node:assert/strict'
import { PINCODE_RE, placeFromIndiaPost } from './pincode.ts'

// Shape taken from a live api.postalpincode.in reply (2026-11-16).
const surat = [{
  Message: 'Number of pincode(s) found:11',
  Status: 'Success',
  PostOffice: [
    { Name: 'Abhva', District: 'Surat', State: 'Gujarat', Pincode: '395007' },
    { Name: 'Athwa', District: 'Surat', State: 'Gujarat', Pincode: '395007' },
  ],
}]
assert.deepEqual(placeFromIndiaPost(surat), { city: 'Surat', state: 'Gujarat' })

// Unknown pincode.
assert.equal(placeFromIndiaPost([{ Message: 'No records found', Status: 'Error', PostOffice: null }]), null)

// Skips a post office missing a field rather than returning half a place.
assert.deepEqual(
  placeFromIndiaPost([{ Status: 'Success', PostOffice: [{ District: ' ', State: 'Delhi' }, { District: 'Central Delhi ', State: 'Delhi' }] }]),
  { city: 'Central Delhi', state: 'Delhi' },
)

// Garbage in.
for (const bad of [null, {}, [], 'x', [{ Status: 'Success', PostOffice: 'nope' }]]) {
  assert.equal(placeFromIndiaPost(bad), null)
}

assert.ok(PINCODE_RE.test('395007'))
for (const bad of ['095007', '39500', '3950071', '39500a']) assert.ok(!PINCODE_RE.test(bad))

console.log('pincode ok')
