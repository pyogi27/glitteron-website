// lib/keyFeatures.test.mjs
//
// Key-features HTML is rendered with dangerouslySetInnerHTML on the PDP, so this is
// the trust boundary. Run with:
//   node --test lib/keyFeatures.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { sanitizeKeyFeatures } = await import('./keyFeatures.ts')

test('non-strings and empty editor states are null', () => {
  for (const v of [undefined, null, 42, {}, '', '   ', '<p></p>', '<p> </p>', '<p><br></p>', '<ul><li></li></ul>']) {
    assert.equal(sanitizeKeyFeatures(v), null, JSON.stringify(v))
  }
})

test('markup that only held disallowed content is null', () => {
  assert.equal(sanitizeKeyFeatures('<p><img src=x onerror=alert(1)></p>'), null)
  assert.equal(sanitizeKeyFeatures('<script>alert(1)</script>'), null)
})

test('allowed formatting passes through unchanged', () => {
  const html = '<h3>Light</h3><p><strong>Dimmable</strong> <em>warm</em> <u>white</u></p><ul><li>IP44</li></ul><ol><li>One</li></ol>'
  assert.equal(sanitizeKeyFeatures(html), html)
})

test('scripts, event handlers and unknown tags are stripped', () => {
  assert.equal(
    sanitizeKeyFeatures('<p onclick="x()" class="c">Hi</p><script>alert(1)</script><iframe src="//e"></iframe><style>p{}</style>'),
    '<p>Hi</p>',
  )
})

test('unsafe link targets keep only their text', () => {
  assert.equal(sanitizeKeyFeatures('<p><a href="javascript:alert(1)">x</a></p>'), '<p>x</p>')
  assert.equal(sanitizeKeyFeatures('<p><a href="javascript%3Aalert(1)">x</a></p>'), '<p>x</p>')
  assert.equal(sanitizeKeyFeatures('<p><a href="/admin">x</a></p>'), '<p>x</p>')
  assert.equal(sanitizeKeyFeatures('<p><a href="//evil.com">x</a></p>'), '<p>x</p>')
  assert.equal(sanitizeKeyFeatures('<p><a>x</a></p>'), '<p>x</p>')
})

test('safe links are forced to open in a new tab without an opener', () => {
  assert.equal(
    sanitizeKeyFeatures('<a href="https://a.com" target="_self" rel="opener" onclick="x">a</a>'),
    '<a href="https://a.com" rel="noopener noreferrer" target="_blank">a</a>',
  )
  assert.equal(
    sanitizeKeyFeatures('<a href="mailto:hi@a.com">m</a>'),
    '<a href="mailto:hi@a.com" rel="noopener noreferrer" target="_blank">m</a>',
  )
})

test('only colour styles with plain values survive on span/mark', () => {
  assert.equal(
    sanitizeKeyFeatures('<span style="color:#fff;position:fixed;top:0">x</span>'),
    '<span style="color:#fff">x</span>',
  )
  assert.equal(
    sanitizeKeyFeatures('<mark style="background-color:rgb(255, 0, 0)">x</mark>'),
    '<mark style="background-color:rgb(255, 0, 0)">x</mark>',
  )
  assert.equal(sanitizeKeyFeatures('<span style="color:url(https://e/x)">x</span>'), '<span>x</span>')
  assert.equal(sanitizeKeyFeatures('<span style="color:red">x</span>'), '<span>x</span>')
  assert.equal(sanitizeKeyFeatures('<p style="color:#fff">x</p>'), '<p>x</p>')
})

// Deleting "!" leaves "#fff important", which fails COLOR_VALUE: the declaration is
// dropped outright, same as the backend.
test('!important drops the declaration rather than riding along', () => {
  assert.equal(sanitizeKeyFeatures('<span style="color:#fff !important">x</span>'), '<span>x</span>')
  assert.equal(sanitizeKeyFeatures('<span style="color:#fff!important">x</span>'), '<span>x</span>')
})
