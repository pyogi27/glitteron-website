#!/usr/bin/env node
/**
 * Backfill product descriptions in the LitMeUp catalogue.
 *
 * WHY THIS EXISTS
 * 998 of 1,000 products ship an empty `description`, and 990 are named with a bare
 * model code. lib/seo/product-copy.ts therefore composes every title, snippet and
 * body paragraph from the physical attributes — which works until two SKUs share
 * those attributes. Measured 2026-08-11, product pages were median 82% identical to
 * each other, and `H8907-1` / `H8907-2` were 99% identical: same materials, colours,
 * light source and all three dimensions, differing only in price. Google filed the
 * result as "Crawled, currently not indexed".
 *
 * THE PART THAT MATTERS
 * Generating from attributes alone would reproduce the duplication exactly — identical
 * inputs, identical output. The product photograph is the only input that separates
 * SKU siblings, so it is the primary input here, and siblings are generated as a
 * group with each one shown what its predecessors already said. That is what makes
 * the output distinct rather than merely longer.
 *
 * TWO PHASES, ALWAYS
 *   generate  reads the catalogue, writes descriptions to a local JSONL. Touches nothing.
 *   apply     reads that JSONL and PATCHes the catalogue. Requires --yes.
 * Review the JSONL between them. `generate` is resumable: it skips ids already in the
 * ledger, so an interrupted run costs nothing to restart.
 *
 * USAGE
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node scripts/generate-descriptions.mjs generate --limit 20     # cheap trial
 *   node scripts/generate-descriptions.mjs report                  # duplication check
 *   node scripts/generate-descriptions.mjs generate                # the rest
 *   export ADMIN_TOKEN=<admin JWT>
 *   node scripts/generate-descriptions.mjs apply --limit 20 --yes  # trial write
 *   node scripts/generate-descriptions.mjs apply --yes             # the rest
 *   node scripts/generate-descriptions.mjs selftest                # no network, no key
 *
 * FLAGS
 *   --limit N      process at most N products
 *   --only a,b,c   process only these product ids
 *   --force        regenerate ids already in the ledger (generate), or rewrite rows
 *                  that already have a description (apply)
 *   --ledger PATH  override the JSONL path
 *   --yes          required by `apply`; without it apply prints what it would do
 *   --concurrency  parallel SKU families, default 6
 */

import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import assert from 'node:assert/strict'

const API = process.env.API_URL ?? 'https://msyevmpefs.us-east-1.awsapprunner.com'
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5'
const DEFAULT_LEDGER = 'scripts/out/descriptions.jsonl'

/** Matches MAX_DESCRIPTION_LENGTH in the PATCH endpoint. */
const MAX_CHARS = 2000
/** Editorial target. Long enough to be substantive, short enough to stay factual. */
const TARGET_WORDS = [45, 95]
/** Anything shorter is a failed generation, not a terse description. */
const MIN_CHARS = 120

// ---------------------------------------------------------------------------
// Pure logic. Exercised by `selftest` — no network, no key, no catalogue.
// ---------------------------------------------------------------------------

/**
 * The SKU family a model code belongs to: the code minus a trailing variant
 * suffix. `H8907-1` and `H8907-2` share `H8907`; `HY-318-2` and `HY-318-3` share
 * `HY-318`. Products in one family are the pages at risk of reading identically,
 * so they are generated together.
 *
 * Only a `-N` / `-NA` style suffix is stripped, never a bare trailing number:
 * `JC-23034` and `JC-23032` are distinct designs, not variants of `JC-230`.
 */
export function skuFamily(name) {
  const code = String(name ?? '').trim().toUpperCase()
  if (!code) return ''
  const stripped = code.replace(/[-_\s]\d{1,2}[A-Z]?$/, '')
  // A suffix that ate the whole code means there was no family prefix to keep.
  return stripped.length >= 2 ? stripped : code
}

/** Group products by SKU family, preserving input order within each group. */
export function groupFamilies(products) {
  const families = new Map()
  for (const product of products) {
    const key = skuFamily(product.name) || `#${product.id}`
    if (!families.has(key)) families.set(key, [])
    families.get(key).push(product)
  }
  return [...families.entries()].map(([key, members]) => ({ key, members }))
}

/** Word-set overlap between two strings, 0 (disjoint) to 1 (identical). */
export function jaccard(a, b) {
  const wordsOf = text =>
    new Set(
      String(text)
        .toLowerCase()
        .replace(/[^a-z0-9₹\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    )
  const left = wordsOf(a)
  const right = wordsOf(b)
  if (left.size === 0 && right.size === 0) return 1
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1
  return shared / (left.size + right.size - shared)
}

/** Does this catalogue row still need a description? */
export function needsDescription(product) {
  return String(product.description ?? '').trim().length < 40
}

/** Only the attributes the copy may state as fact. Empty values are dropped. */
export function factsOf(product, categoryName) {
  const clean = value => {
    const text = String(value ?? '').trim()
    return text && text !== 'None' && text !== 'null' ? text : ''
  }
  const mm = value => (clean(value) ? `${clean(value)}mm` : '')
  return Object.fromEntries(
    Object.entries({
      'Model code': clean(product.name) || clean(product.sku),
      Category: clean(categoryName),
      Materials: clean(product.materials),
      Colours: clean(product.bodyColors),
      'Light source': clean(product.lightSource),
      Wattage: clean(product.wattage),
      Height: mm(product.productHeight),
      Width: mm(product.productWidth),
      Length: mm(product.productLength),
      Diameter: mm(product.diameter),
      Weight: clean(product.weight),
      'Tagged rooms': Array.isArray(product.where_used) ? product.where_used.join(', ') : '',
    }).filter(([, value]) => value !== ''),
  )
}

const BANNED = [
  'elevate',
  'transform',
  'stunning',
  'exquisite',
  'breathtaking',
  'perfect for any',
  'look no further',
  'unleash',
  'game-changer',
  'must-have',
  'timeless elegance',
  'a touch of',
]

const SYSTEM_PROMPT = `You write product descriptions for LitMeUp, a lighting workshop in Surat, Gujarat that sells handcrafted fixtures direct to Indian homes.

HOUSE STYLE
- Plain, confident, specific. Short declarative sentences. Indian English.
- Describe what the fixture IS and what the photograph SHOWS: form, silhouette, how the shades sit, how the light is likely to fall, the room and ceiling it suits.
- No exclamation marks. No second-person sales pitch. No rhetorical questions.
- Never use: ${BANNED.join(', ')}.

HARD RULES
- ${TARGET_WORDS[0]} to ${TARGET_WORDS[1]} words. Three or four sentences. Plain text, no markdown, no headings, no lists.
- State ONLY what the photograph shows or the supplied facts say. If a fact is not supplied, do not invent it — no invented wattage, bulb count, material, finish, or certification.
- Never mention price, discounts, delivery, warranty or returns. The page already carries those.
- Do not open with the model code, and do not repeat the full attribute list back as a sentence. The specifications table sits directly beneath this text.
- Do not claim the piece is popular, award-winning, bestselling, or customer-favourite.

Reply with the description text and nothing else.`

/**
 * The per-product message.
 *
 * `siblings` are descriptions already written for other SKUs in this family. They
 * are included so the model can see what has been said and write about what is
 * actually different — the one thing that stops sibling pages reading identically.
 */
export function buildUserPrompt(facts, siblings) {
  const lines = [
    'Write the description for this fixture.',
    '',
    'Verified facts (state nothing beyond these and the photograph):',
    ...Object.entries(facts).map(([key, value]) => `- ${key}: ${value}`),
  ]

  if (siblings.length > 0) {
    lines.push(
      '',
      `This fixture shares a model family with ${siblings.length === 1 ? 'another piece' : 'other pieces'} whose description is already written:`,
      ...siblings.map((text, i) => `${i + 1}. ${text}`),
      '',
      'Those are separate pages. Yours must not paraphrase them. Lead with what THIS photograph shows that the others do not — the shade count, proportion, arrangement, drop or profile that differs. If the pieces genuinely look alike, say plainly what scale or configuration sets this one apart rather than restating shared attributes.',
    )
  }

  return lines.join('\n')
}

/** Reject a generation that broke a hard rule, so it is retried rather than stored. */
export function validate(text) {
  const clean = String(text ?? '').trim()
  if (clean.length < MIN_CHARS) return `too short (${clean.length} chars)`
  if (clean.length > MAX_CHARS) return `too long (${clean.length} chars)`
  const words = clean.split(/\s+/).length
  if (words < TARGET_WORDS[0] - 10 || words > TARGET_WORDS[1] + 25) return `${words} words, outside target`
  if (/[#*`]|^\s*[-–]\s/m.test(clean)) return 'contains markdown'
  const lower = clean.toLowerCase()
  const banned = BANNED.find(phrase => lower.includes(phrase))
  if (banned) return `banned phrase "${banned}"`
  if (/₹|\brs\.?\b|\bprice\b|\bwarranty\b|free delivery|free shipping/i.test(clean)) {
    return 'mentions price or commercial terms'
  }
  return null
}

// ---------------------------------------------------------------------------
// Catalogue and model IO
// ---------------------------------------------------------------------------

async function getJson(url, init) {
  const res = await fetch(url, init)
  const body = await res.text()
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url} -> ${res.status} ${body.slice(0, 300)}`)
  return body ? JSON.parse(body) : null
}

function asArray(body) {
  if (Array.isArray(body)) return body
  for (const key of ['products', 'data', 'categories']) {
    if (Array.isArray(body?.[key])) return body[key]
  }
  return []
}

async function fetchCatalogue() {
  const [productBody, categoryBody] = await Promise.all([
    getJson(`${API}/api/products?limit=5000`),
    getJson(`${API}/api/categories`),
  ])
  const categories = new Map(asArray(categoryBody).map(c => [String(c.id), c.name]))
  // The list endpoint repeats products within a page, so dedupe on id before use.
  const seen = new Set()
  const products = []
  for (const product of asArray(productBody)) {
    const id = String(product.id)
    if (seen.has(id)) continue
    seen.add(id)
    products.push(product)
  }
  return { products, categories }
}

/** Detail record — the list payload omits materials, dimensions and images. */
async function fetchDetail(id) {
  const body = await getJson(`${API}/api/products/${id}`)
  return body?.product ?? body?.data ?? body
}

async function callClaude(apiKey, facts, siblings, imageUrl) {
  const content = []
  if (imageUrl) content.push({ type: 'image', source: { type: 'url', url: imageUrl } })
  content.push({ type: 'text', text: buildUserPrompt(facts, siblings) })

  const body = await getJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  })

  return (body.content ?? [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
}

/** Retry on rate limits and transient upstream failures, with backoff. */
async function withRetry(label, fn, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error
      const retriable = /\b(429|500|502|503|504|529)\b|fetch failed|ETIMEDOUT|ECONNRESET/.test(String(error.message))
      if (!retriable || attempt === attempts) break
      const waitMs = 1500 * 2 ** (attempt - 1)
      console.warn(`  ${label}: ${error.message.slice(0, 120)} — retry ${attempt}/${attempts - 1} in ${waitMs}ms`)
      await new Promise(done => setTimeout(done, waitMs))
    }
  }
  throw lastError
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

async function readLedger(path) {
  try {
    const raw = await readFile(path, 'utf8')
    const rows = raw
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
    // Later rows win, so --force regeneration supersedes the earlier entry.
    return new Map(rows.map(row => [String(row.id), row]))
  } catch (error) {
    if (error.code === 'ENOENT') return new Map()
    throw error
  }
}

async function appendLedger(path, row) {
  await mkdir(dirname(path), { recursive: true })
  await appendFile(path, `${JSON.stringify(row)}\n`, 'utf8')
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/** Run `worker` over `items` with at most `limit` in flight. */
async function pool(items, limit, worker) {
  const queue = [...items.entries()]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (;;) {
      const next = queue.shift()
      if (!next) return
      await worker(next[1], next[0])
    }
  })
  await Promise.all(runners)
}

async function generate(opts) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const ledger = await readLedger(opts.ledger)
  const { products, categories } = await fetchCatalogue()

  let candidates = products.filter(p => opts.force || needsDescription(p))
  if (opts.only) candidates = candidates.filter(p => opts.only.has(String(p.id)))
  if (!opts.force) candidates = candidates.filter(p => !ledger.has(String(p.id)))
  if (opts.limit) candidates = candidates.slice(0, opts.limit)

  console.log(
    `catalogue ${products.length} · already described ${products.filter(p => !needsDescription(p)).length} · ` +
      `in ledger ${ledger.size} · to generate ${candidates.length}`,
  )
  if (candidates.length === 0) return

  const families = groupFamilies(candidates)
  console.log(`grouped into ${families.length} SKU families, ${opts.concurrency} at a time\n`)

  let done = 0
  let failed = 0

  await pool(families, opts.concurrency, async family => {
    // Sequential within a family: each member sees what its siblings already said.
    const siblings = []
    for (const product of family.members) {
      const id = String(product.id)
      try {
        const detail = await withRetry(`detail ${id}`, () => fetchDetail(id))
        const facts = factsOf(detail, categories.get(String(detail.category)))
        const imageUrl = detail.mainImage || detail.thumbnailImage || null

        const text = await withRetry(`generate ${id}`, async attempt => {
          const candidate = await callClaude(apiKey, facts, siblings, imageUrl)
          const problem = validate(candidate)
          // A rule break is retriable: same inputs, new sample.
          if (problem) throw new Error(`rejected (${problem}) [attempt ${attempt}]`)
          return candidate
        })

        siblings.push(text)
        await appendLedger(opts.ledger, {
          id,
          name: product.name,
          family: family.key,
          model: MODEL,
          hadImage: Boolean(imageUrl),
          description: text,
        })
        done += 1
        console.log(`  ok  ${id.padEnd(6)} ${String(product.name).padEnd(14)} ${text.split(/\s+/).length}w`)
      } catch (error) {
        failed += 1
        console.error(`  FAIL ${id} ${product.name}: ${error.message.slice(0, 200)}`)
      }
    }
  })

  console.log(`\nwrote ${done} to ${opts.ledger}${failed ? ` · ${failed} failed` : ''}`)
  console.log('review it, then: node scripts/generate-descriptions.mjs report')
}

async function report(opts) {
  const ledger = await readLedger(opts.ledger)
  const rows = [...ledger.values()]
  if (rows.length === 0) return console.log(`${opts.ledger} is empty — nothing to report`)

  const noImage = rows.filter(r => !r.hadImage)
  const words = rows.map(r => r.description.split(/\s+/).length).sort((a, b) => a - b)

  console.log(`${rows.length} descriptions in ${opts.ledger}`)
  console.log(`words: min ${words[0]} · median ${words[words.length >> 1]} · max ${words.at(-1)}`)
  if (noImage.length) console.log(`generated without a photograph: ${noImage.length} (weakest output — review these first)`)

  // The metric the whole exercise is judged on. Compared against the pre-change
  // baseline measured on live pages: median 0.82, max 0.99.
  const pairs = []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      pairs.push({ score: jaccard(rows[i].description, rows[j].description), a: rows[i], b: rows[j] })
    }
  }
  pairs.sort((x, y) => x.score - y.score)
  const median = pairs[pairs.length >> 1]
  console.log(
    `\npairwise similarity over ${pairs.length} pairs: median ${median.score.toFixed(2)} · max ${pairs.at(-1).score.toFixed(2)}`,
  )

  const tooClose = pairs.filter(p => p.score >= 0.6)
  if (tooClose.length === 0) {
    console.log('no pair at or above 0.60 — nothing reads as a duplicate')
  } else {
    console.log(`\n${tooClose.length} pair(s) at or above 0.60 — regenerate with --force --only <ids>:`)
    for (const pair of tooClose.slice(-10).reverse()) {
      console.log(`  ${pair.score.toFixed(2)}  ${pair.a.id} ${pair.a.name}  vs  ${pair.b.id} ${pair.b.name}`)
    }
  }
}

async function apply(opts) {
  const token = process.env.ADMIN_TOKEN
  if (!token) throw new Error('ADMIN_TOKEN is not set (admin JWT, needed by PATCH /api/products/:id/description)')

  const ledger = await readLedger(opts.ledger)
  let rows = [...ledger.values()]
  if (opts.only) rows = rows.filter(r => opts.only.has(String(r.id)))
  if (opts.limit) rows = rows.slice(0, opts.limit)
  if (rows.length === 0) return console.log('nothing to apply')

  // Never silently overwrite copy someone authored by hand.
  const { products } = await fetchCatalogue()
  const described = new Set(products.filter(p => !needsDescription(p)).map(p => String(p.id)))
  const skipped = opts.force ? [] : rows.filter(r => described.has(String(r.id)))
  const writes = opts.force ? rows : rows.filter(r => !described.has(String(r.id)))

  if (skipped.length) {
    console.log(`skipping ${skipped.length} row(s) whose catalogue entry already has a description (--force to overwrite)`)
  }

  if (!opts.yes) {
    console.log(`\nDRY RUN — would PATCH ${writes.length} product(s) at ${API}`)
    for (const row of writes.slice(0, 5)) {
      console.log(`  ${row.id} ${row.name}: ${row.description.slice(0, 90)}…`)
    }
    if (writes.length > 5) console.log(`  … and ${writes.length - 5} more`)
    console.log('\nre-run with --yes to write.')
    return
  }

  console.log(`PATCHing ${writes.length} product(s) at ${API}\n`)
  let ok = 0
  let failed = 0
  // Serial on purpose: a write loop over the production catalogue should be
  // interruptible at a known point, and 1,000 PATCHes take about two minutes.
  for (const row of writes) {
    try {
      await withRetry(`patch ${row.id}`, () =>
        getJson(`${API}/api/products/${row.id}/description`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ description: row.description }),
        }),
      )
      ok += 1
      console.log(`  ok  ${row.id} ${row.name}`)
    } catch (error) {
      failed += 1
      console.error(`  FAIL ${row.id} ${row.name}: ${error.message.slice(0, 200)}`)
    }
  }
  console.log(`\napplied ${ok}${failed ? ` · ${failed} failed` : ''}`)
  if (ok) console.log('product pages revalidate within their 60s TTL; the sitemap is unchanged.')
}

// ---------------------------------------------------------------------------
// selftest — the runnable check. No network, no API key.
// ---------------------------------------------------------------------------

function selftest() {
  // SKU families: variant suffixes group, distinct designs do not.
  assert.equal(skuFamily('H8907-1'), 'H8907')
  assert.equal(skuFamily('H8907-2'), 'H8907')
  assert.equal(skuFamily('HY-318-2'), 'HY-318')
  assert.equal(skuFamily('  hy-318-3 '), 'HY-318')
  // GL16-7P and GL16-8P measured 93% identical as live pages, so a digit-plus-letter
  // suffix must group too, not just a bare digit.
  assert.equal(skuFamily('GL16-7P'), 'GL16')
  assert.equal(skuFamily('GL16-8P'), 'GL16')
  assert.equal(
    skuFamily('JC-23034'),
    'JC-23034',
    'a bare trailing number is part of the design code, not a variant suffix',
  )
  assert.equal(skuFamily('1011'), '1011')
  assert.equal(skuFamily(''), '')
  assert.equal(skuFamily(null), '')

  // The pair that motivated the script must land in one family, so they are
  // generated in sequence and the second sees the first.
  const families = groupFamilies([
    { id: 1, name: 'H8907-1' },
    { id: 2, name: 'HY-318-2' },
    { id: 3, name: 'H8907-2' },
    { id: 4, name: '' },
  ])
  const h8907 = families.find(f => f.key === 'H8907')
  assert.deepEqual(
    h8907.members.map(m => m.id),
    [1, 3],
    'H8907-1 and H8907-2 group together, in input order',
  )
  assert.equal(families.find(f => f.key === '#4').members.length, 1, 'an unnamed product gets its own family')

  // Jaccard: the metric the report is judged on.
  assert.equal(jaccard('a b c', 'a b c'), 1)
  assert.equal(jaccard('a b', 'c d'), 0)
  assert.equal(jaccard('', ''), 1)
  assert.ok(Math.abs(jaccard('a b c d', 'a b x y') - 2 / 6) < 1e-9)
  assert.ok(jaccard('Marble pendant, 160mm.', 'marble pendant 160mm') > 0.9, 'punctuation and case are ignored')

  assert.equal(needsDescription({ description: '' }), true)
  assert.equal(needsDescription({}), true)
  assert.equal(needsDescription({ description: '   ' }), true)
  assert.equal(needsDescription({ description: 'x'.repeat(40) }), false)

  // Facts: empty, "None" and null attributes must never reach the prompt, or the
  // model is invited to invent a value for them.
  const facts = factsOf(
    {
      name: 'H8907-1',
      materials: 'Marble, Metal',
      bodyColors: 'Golden, White',
      lightSource: 'LED',
      wattage: 'None',
      productHeight: '160',
      productWidth: '100',
      diameter: '',
      weight: null,
      where_used: [],
    },
    'Pendant Lights',
  )
  assert.equal(facts.Height, '160mm')
  assert.equal(facts.Category, 'Pendant Lights')
  assert.ok(!('Wattage' in facts), '"None" is dropped')
  assert.ok(!('Diameter' in facts), 'empty string is dropped')
  assert.ok(!('Weight' in facts), 'null is dropped')
  assert.ok(!('Tagged rooms' in facts), 'empty array is dropped')

  // Sibling context is what makes duplicate pages diverge, so it must be present.
  const solo = buildUserPrompt(facts, [])
  assert.ok(solo.includes('- Materials: Marble, Metal'))
  assert.ok(!solo.includes('model family'))
  const withSibling = buildUserPrompt(facts, ['A compact marble pendant on a slim brass stem.'])
  assert.ok(withSibling.includes('model family'))
  assert.ok(withSibling.includes('A compact marble pendant on a slim brass stem.'))
  assert.ok(withSibling.includes('must not paraphrase'))

  // Validation gates every hard rule that would otherwise reach the catalogue.
  const good =
    'A compact marble pendant that reads as a single turned form, its golden collar picking up the veining in the stone. ' +
    'The shade throws light downward in a tight pool, which suits a kitchen island or a bedside drop where glare matters. ' +
    'At 160mm tall it hangs comfortably under a nine-foot slab without crowding the sightline across a room.'
  assert.equal(validate(good), null, `expected the sample to pass, got: ${validate(good)}`)
  assert.match(validate('Too short.'), /too short/)
  assert.match(validate(`${good} It costs ₹8,600.`), /price or commercial/)
  assert.match(validate(good.replace('A compact', 'This will elevate your')), /banned phrase/)
  assert.match(validate(`## Heading\n${good}`), /markdown/)
  assert.match(validate(`${good} ${good} ${good}`), /outside target/)
  assert.match(validate(null), /too short/)

  // The pool must run every item exactly once, even when narrower than the input.
  return (async () => {
    const seen = []
    await pool(['a', 'b', 'c', 'd', 'e'], 2, async item => {
      await new Promise(done => setTimeout(done, 1))
      seen.push(item)
    })
    assert.deepEqual(seen.sort(), ['a', 'b', 'c', 'd', 'e'])
    await pool([], 4, async () => assert.fail('must not run for an empty list'))

    // Ledger round-trip, including last-write-wins for --force.
    const tmp = resolve(process.cwd(), 'scripts/out/.selftest.jsonl')
    await mkdir(dirname(tmp), { recursive: true })
    await writeFile(tmp, '', 'utf8')
    await appendLedger(tmp, { id: '1', description: 'first' })
    await appendLedger(tmp, { id: '2', description: 'other' })
    await appendLedger(tmp, { id: '1', description: 'regenerated' })
    const reloaded = await readLedger(tmp)
    assert.equal(reloaded.size, 2)
    assert.equal(reloaded.get('1').description, 'regenerated', 'a later row supersedes the earlier one')
    assert.equal((await readLedger(resolve(tmp, '../nope.jsonl'))).size, 0, 'a missing ledger reads as empty')
    await writeFile(tmp, '', 'utf8')

    console.log('selftest: all assertions passed')
  })()
}

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { concurrency: 6, ledger: DEFAULT_LEDGER, force: false, yes: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--force') opts.force = true
    else if (arg === '--yes') opts.yes = true
    else if (arg === '--limit') opts.limit = Number(argv[++i])
    else if (arg === '--concurrency') opts.concurrency = Number(argv[++i])
    else if (arg === '--ledger') opts.ledger = argv[++i]
    else if (arg === '--only') opts.only = new Set(argv[++i].split(',').map(s => s.trim()))
    else throw new Error(`unknown flag ${arg}`)
  }
  if (opts.limit !== undefined && !Number.isInteger(opts.limit)) throw new Error('--limit needs an integer')
  return opts
}

const COMMANDS = { generate, apply, report, selftest: () => selftest() }

const [command, ...rest] = process.argv.slice(2)
if (!command || !COMMANDS[command]) {
  console.error(`usage: node scripts/generate-descriptions.mjs <${Object.keys(COMMANDS).join('|')}> [flags]

  generate   write descriptions to the ledger (needs ANTHROPIC_API_KEY). Touches no catalogue data.
  report     duplication and length check over the ledger.
  apply      PATCH the catalogue from the ledger (needs ADMIN_TOKEN and --yes).
  selftest   assert the pure logic. No network, no key.

  --limit N  --only a,b  --force  --ledger PATH  --yes  --concurrency N`)
  process.exit(1)
}

try {
  await COMMANDS[command](parseArgs(rest))
} catch (error) {
  console.error(`\n${command} failed: ${error.message}`)
  process.exit(1)
}
