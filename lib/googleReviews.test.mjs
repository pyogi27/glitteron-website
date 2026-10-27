// lib/googleReviews.test.mjs
//
// The Google Places (New) → banner mapping. Run with:
//   node --test lib/googleReviews.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { mapPlaceReviews, trustedCountLabel } = await import('./googleReviews.ts')

const review = (text, extra = {}) => ({
  name: 'places/x/reviews/1',
  rating: 5,
  text: text == null ? undefined : { text, languageCode: 'en' },
  relativePublishTimeDescription: '2 weeks ago',
  googleMapsUri: 'https://www.google.com/maps/reviews/1',
  authorAttribution: { displayName: 'Asha K', uri: 'https://www.google.com/maps/contrib/1', photoUri: 'https://lh3.googleusercontent.com/a/1' },
  ...extra,
})

const place = (reviews, extra = {}) => ({
  rating: 4.76,
  userRatingCount: 1234,
  googleMapsUri: 'https://maps.google.com/?cid=1',
  googleMapsLinks: { reviewsUri: 'https://www.google.com/maps/place//data=reviews' },
  reviews,
  ...extra,
})

test('maps the place and review fields', () => {
  const out = mapPlaceReviews(place([review('Lovely lamp.')]))
  assert.deepEqual(out, {
    rating: 4.76,
    count: 1234,
    mapsUrl: 'https://maps.google.com/?cid=1',
    reviewsUrl: 'https://www.google.com/maps/place//data=reviews',
    reviews: [{
      id: 'places/x/reviews/1',
      rating: 5,
      text: 'Lovely lamp.',
      relativeTime: '2 weeks ago',
      reviewUrl: 'https://www.google.com/maps/reviews/1',
      author: 'Asha K',
      authorUrl: 'https://www.google.com/maps/contrib/1',
      authorPhoto: 'https://lh3.googleusercontent.com/a/1',
    }],
  })
})

test('drops reviews without text and keeps Google order', () => {
  const out = mapPlaceReviews(place([review('First'), review('   '), review(null), review('Second', { name: 'b' })]))
  assert.deepEqual(out.reviews.map(r => r.text), ['First', 'Second'])
})

test('falls back to originalText, and reviewsUrl to mapsUrl', () => {
  const out = mapPlaceReviews(place([review(null, { originalText: { text: 'Bahut sundar' } })], { googleMapsLinks: undefined }))
  assert.equal(out.reviews[0].text, 'Bahut sundar')
  assert.equal(out.reviewsUrl, 'https://maps.google.com/?cid=1')
})

test('keeps only https links from the API', () => {
  const out = mapPlaceReviews(place(
    [review('ok', { googleMapsUri: 'javascript:alert(1)', authorAttribution: { displayName: 'A', uri: 'http://x', photoUri: 'data:image/png,1' } })],
    { googleMapsUri: 'javascript:alert(1)', googleMapsLinks: undefined },
  ))
  assert.equal(out.mapsUrl, undefined)
  assert.equal(out.reviewsUrl, undefined)
  assert.equal(out.reviews[0].reviewUrl, undefined)
  assert.equal(out.reviews[0].authorUrl, undefined)
  assert.equal(out.reviews[0].authorPhoto, undefined)
})

test('returns null when nothing real can be shown', () => {
  assert.equal(mapPlaceReviews(place([review('  ')])), null)
  assert.equal(mapPlaceReviews(place([])), null)
  assert.equal(mapPlaceReviews(place([review('ok')], { rating: undefined })), null)
  assert.equal(mapPlaceReviews(place([review('ok')], { userRatingCount: 0 })), null)
  assert.equal(mapPlaceReviews(null), null)
  assert.equal(mapPlaceReviews({ error: { code: 403 } }), null)
})

test('the title count rounds down to the hundred, exact below 100', () => {
  assert.equal(trustedCountLabel(1234), '1,200+')
  assert.equal(trustedCountLabel(100), '100+')
  assert.equal(trustedCountLabel(199), '100+')
  assert.equal(trustedCountLabel(87), '87')
  assert.equal(trustedCountLabel(12999), '12,900+')
})
