// lib/api/videos.test.mjs
//
// Self-check for the Watch & Shop video mapping. Run with:
//   node --experimental-strip-types lib/api/videos.test.mjs
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// The app imports siblings without an extension (the bundler resolves them);
// Node's ESM loader does not, so point extensionless relative imports at .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const bare = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)
    return nextResolve(bare ? `${specifier}.ts` : specifier, context)
  },
})
const { toVideoItems } = await import('./videos.ts')
const { slugify } = await import('./slug.ts')

const S3 = 'https://glitteron-image-prod-storage.s3.amazonaws.com'
const row = (over = {}) => ({
  id: 1669,
  name: 'Chain-Link Glass Pendant Light',
  sku: 'CL-1',
  category: '5',
  price: '17800.00',
  thumbnailImage: `${S3}/thumbnails/main/1.webp`,
  mainImage: `${S3}/main/1.png`,
  productVideos: [`${S3}/product-videos/a.mp4`],
  updatedAt: '2026-09-29T10:00:00.000Z',
  ...over,
})

// The happy path: one card, every field mapped, slug derived the way the
// product route derives it (a divergent slug would link to a 404).
const [item] = toVideoItems([row()])
assert.deepEqual(item, {
  productId: 1669,
  slug: 'chain-link-glass-pendant-light',
  name: 'Chain-Link Glass Pendant Light',
  price: 17800,
  poster: `${S3}/main/1.png`,
  src: `${S3}/product-videos/a.mp4`,
  type: 'video/mp4',
  uploadDate: '2026-09-29T10:00:00.000Z',
})
assert.equal(item.slug, slugify(item.name))
// The product route slugifies the untrimmed name, so the card must too.
const padded = toVideoItems([row({ name: 'Bonbon Pendant Light ' })])[0]
assert.deepEqual([padded.name, padded.slug], ['Bonbon Pendant Light', slugify('Bonbon Pendant Light ')])

// Non-https video URLs drop out: an http:// video is mixed content on the
// storefront. A product left with none drops out entirely.
assert.equal(toVideoItems([row({ productVideos: ['http://x.example.com/a.mp4'] })]).length, 0)
assert.equal(
  toVideoItems([row({ productVideos: ['http://x.example.com/a.mp4', 'not a url', `${S3}/product-videos/b.mp4`] })])[0].src,
  `${S3}/product-videos/b.mp4`,
)
assert.equal(toVideoItems([row({ productVideos: [] })]).length, 0)
assert.equal(toVideoItems([row({ productVideos: null })]).length, 0)

// One card per product: a product repeated in the response keeps its first row.
const deduped = toVideoItems([row(), row({ productVideos: [`${S3}/product-videos/other.mp4`] }), row({ id: 7, name: 'Bonbon Pendant Light' })])
assert.deepEqual(deduped.map(v => [v.productId, v.src]), [[1669, `${S3}/product-videos/a.mp4`], [7, `${S3}/product-videos/a.mp4`]])

// Poster: mainImage first, thumbnailImage when mainImage is null or blank,
// empty when the product has no image at all.
assert.equal(toVideoItems([row({ mainImage: null })])[0].poster, `${S3}/thumbnails/main/1.webp`)
assert.equal(toVideoItems([row({ mainImage: '' })])[0].poster, `${S3}/thumbnails/main/1.webp`)
assert.equal(toVideoItems([row({ mainImage: null, thumbnailImage: null })])[0].poster, '')

// Catalogue URLs contain raw spaces ("AR CH IMAGES 3.png"); they come out
// percent-encoded so they are valid in JSON-LD and in a src attribute.
assert.equal(
  toVideoItems([row({ mainImage: `${S3}/main/AR CH IMAGES 3.png` })])[0].poster,
  `${S3}/main/AR%20CH%20IMAGES%203.png`,
)

// A JSON column can arrive as its serialised string; read it the same way.
const webm = toVideoItems([row({ productVideos: JSON.stringify([`${S3}/product-videos/c.webm`]) })])[0]
assert.equal(webm.src, `${S3}/product-videos/c.webm`)
// The MIME type comes from the extension, so a browser without WebM (iOS < 17.4)
// can skip the video and keep the image instead of fetching bytes it cannot play.
assert.equal(webm.type, 'video/webm')
assert.equal(toVideoItems([row({ productVideos: [`${S3}/product-videos/D.WEBM?v=2`] })])[0].type, 'video/webm')

// No date from the API (it is not deployed everywhere yet): the key is absent,
// never a made-up date. A garbage date is treated the same way.
assert.equal('uploadDate' in toVideoItems([row({ updatedAt: undefined })])[0], false)
assert.equal('uploadDate' in toVideoItems([row({ updatedAt: 'yesterday' })])[0], false)

// A card that would print a broken price or name, or has no usable id, is dropped.
assert.equal(toVideoItems([row({ price: 'n/a' })]).length, 0)
assert.equal(toVideoItems([row({ price: '0.00' })]).length, 0)
assert.equal(toVideoItems([row({ name: '   ' })]).length, 0)
assert.equal(toVideoItems([row({ id: 'abc' })]).length, 0)
assert.equal(toVideoItems([row({ id: '1669' })])[0].productId, 1669)

// Garbage from the wire never throws.
assert.deepEqual(toVideoItems([null, 42, {}]), [])
assert.deepEqual(toVideoItems(undefined), [])

console.log('videos: ok')
