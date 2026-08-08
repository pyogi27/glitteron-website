// lib/seo/product-copy.test.mjs
//
// Self-check for the generated product copy. Run with:
//   npx tsx lib/seo/product-copy.test.mjs
//
// Fixtures are real records copied verbatim from GET /api/products on
// 2026-08-08 — the point is to prove the generator handles the catalogue as it
// actually is (bare model names, blank descriptions, patchy dimensions), not a
// tidied-up version of it.
import assert from 'node:assert/strict'
import {
  productBodyCopy,
  productHeadline,
  productMetaDescription,
  productSpecs,
  productTitle,
} from './product-copy.ts'

// Product 1557. Diameter but no height; two materials.
const pendant = {
  name: '1011',
  categoryName: 'Pendant Lights',
  materials: 'Resin, Acrylic',
  bodyColors: 'White',
  lightSource: 'Led 3 in 1',
  wattage: null,
  productHeight: '',
  productWidth: '850',
  productLength: '850',
  diameter: '850',
  price: 56400,
  sku: '1011 - pendent',
  description: '',
}

// Product 1558. Height and diameter, single material, E27 source.
const wall = {
  name: 'DG-P184A',
  categoryName: 'Wall Lights',
  materials: 'Polystyrene',
  bodyColors: 'Gray Dots',
  lightSource: 'E27',
  productHeight: '450',
  productWidth: '400',
  diameter: '400',
  price: 16800,
  sku: 'DG-P184A-1',
}

// Worst case: nothing but a model code and a category.
const bare = { name: 'W358', categoryName: 'Wall Lights' }

// A product with a real authored name, which must survive untouched.
const named = { name: 'Aurora Crystal Chandelier', categoryName: 'Chandelier Lights', price: 90000 }

// --- headline: the model code becomes a description ------------------------
assert.equal(productHeadline(pendant), 'White Resin Pendant Light')
assert.equal(productHeadline(wall), 'Gray Dots Polystyrene Wall Light')
assert.equal(productHeadline(bare), 'Wall Light')
// "GOLD" is entered shouting in the catalogue; a title must not shout back.
assert.equal(
  productHeadline({ ...bare, bodyColors: 'GOLD', materials: 'Metal' }),
  'Gold Metal Wall Light',
)
// Mixed-case values are left exactly as authored — no re-casing "iGlass".
assert.equal(
  productHeadline({ ...bare, bodyColors: 'Rose Gold', materials: 'Mild Steel' }),
  'Rose Gold Mild Steel Wall Light',
)
// An authored name already containing the noun is left exactly as written.
assert.equal(productHeadline(named), 'Aurora Crystal Chandelier')

// --- title: descriptive, model retained, inside the SERP budget ------------
const SUFFIX = ' | LitMeUp'.length
for (const p of [pendant, wall, bare, named]) {
  const title = productTitle(p)
  assert.ok(title.length + SUFFIX <= 60, `title too long (${title.length + SUFFIX}): ${title}`)
  assert.ok(!/^\s|,\s*—|—\s*$/.test(title), `malformed title: ${title}`)
}
assert.equal(productTitle(pendant), 'White Resin Pendant Light, 850mm — 1011')
// No attributes at all still beats the old bare "W358".
assert.equal(productTitle(bare), 'Wall Light — W358')

// --- meta description: unique, sized, no leftover punctuation --------------
const pendantMeta = productMetaDescription(pendant)
assert.ok(pendantMeta.length <= 158, `meta too long: ${pendantMeta.length}`)
assert.ok(pendantMeta.length >= 90, `meta too short: ${pendantMeta}`)
assert.match(pendantMeta, /850mm pendant light in white resin and acrylic/)
assert.match(pendantMeta, /₹56,400/)
// The two sibling products must not share a description — that was the bug.
assert.notEqual(pendantMeta, productMetaDescription(wall))
// A record with nothing to say still returns a valid sentence, not "undefined".
const bareMeta = productMetaDescription(bare)
assert.ok(bareMeta.length > 0 && !bareMeta.includes('undefined'), bareMeta)

// An authored description always wins over anything generated.
assert.equal(
  productMetaDescription({ ...pendant, description: 'Hand-blown glass, made in Surat.' }),
  'Hand-blown glass, made in Surat.',
)

// --- body copy: enough unique words to be worth indexing -------------------
const body = productBodyCopy(pendant)
assert.match(body, /^1011 is a white resin pendant light\./)
// Diameter and width are both "850" here — it must be stated once, not twice.
assert.equal(body.match(/850mm/g).length, 1, body)
assert.match(body, /a Led 3 in 1 light source/)
// A lamp code read letter-by-letter takes "an": "an E27", never "a E27".
assert.match(productBodyCopy(wall), /Fitted for an E27 light source\./)
assert.ok(!body.includes('undefined'), body)
// The blank-height record must not emit "and  high".
assert.ok(!/\s{2}|\band\s+high\b/.test(body), body)
assert.ok(body.split(/\s+/).length >= 30, `body too thin: ${body}`)

// --- specs: only rows the backend actually filled --------------------------
const specs = productSpecs(pendant)
assert.equal(specs.Material, 'Resin, Acrylic')
assert.equal(specs.Diameter, '850mm')
assert.equal(specs['Light source'], 'Led 3 in 1')
assert.equal(specs.Category, 'Pendant Lights')
assert.equal(specs.Model, '1011')
// Height was "" on this record — the row must be absent, not blank.
assert.ok(!('Height' in specs), 'blank height leaked into the spec table')
// diameter/width/length are all "850" here — stated once, not three times.
assert.ok(!('Width' in specs) && !('Length' in specs), JSON.stringify(specs))
// A rectangular piece still reports both axes.
const rect = productSpecs({ ...bare, productWidth: '400', productLength: '250' })
assert.equal(rect.Width, '400mm')
assert.equal(rect.Length, '250mm')
assert.ok(!('Wattage' in specs), 'null wattage leaked into the spec table')
assert.ok(Object.values(specs).every(v => v.trim().length > 0), 'empty spec value')
// The legacy "D90mm" prefix form normalises rather than doubling its unit.
assert.equal(productSpecs({ ...bare, diameter: 'D90mm' }).Diameter, '90mm')

console.log('product-copy: all assertions passed')
