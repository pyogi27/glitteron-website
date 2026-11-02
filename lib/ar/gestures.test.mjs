// lib/ar/gestures.test.mjs
//
// Placement, starting size and drag/pinch/twist maths for the camera overlay. Run with:
//   node --test lib/ar/gestures.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  placementFor, heightFraction, startPose, gesturePose, withMove, withZoom,
  MIN_SCALE, MAX_SCALE, ASSUMED_FRAME_HEIGHT_MM,
} = await import('./gestures.ts')

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)
const start = { x: 0.5, y: 0.5, s: 1, rot: 0 }
const W = 400, H = 800

test('placement follows the category, defaulting to the ceiling', () => {
  assert.equal(placementFor('Wall Lights'), 'wall')
  assert.equal(placementFor('Floor Lamps'), 'floor')
  assert.equal(placementFor('Table Lamp'), 'floor')
  assert.equal(placementFor('Chandeliers'), 'ceiling')
  assert.equal(placementFor('Pendant'), 'ceiling')
  assert.equal(placementFor(''), 'ceiling')
})

test('starting height scales with the real height and is clamped', () => {
  near(heightFraction(ASSUMED_FRAME_HEIGHT_MM * 0.3), 0.3)
  assert.equal(heightFraction(10), 0.15)
  assert.equal(heightFraction(100_000), 0.6)
  assert.equal(heightFraction(undefined), 0.35)
  assert.equal(heightFraction(0), 0.35)
  assert.equal(heightFraction(NaN), 0.35)
})

test('ceiling lights hang from the top, floor lights stand on the bottom', () => {
  near(startPose('ceiling', 0.4).y - 0.2, 0.06)
  near(startPose('floor', 0.4).y + 0.2, 0.9)
  assert.deepEqual(startPose('wall', 0.4), { x: 0.5, y: 0.4, s: 1, rot: 0 })
})

test('one finger drags by a fraction of the stage', () => {
  const p = gesturePose(start, [{ x: 100, y: 100 }], [{ x: 140, y: 180 }], W, H)
  near(p.x, 0.6)
  near(p.y, 0.6)
  assert.equal(p.s, 1)
  assert.equal(p.rot, 0)
})

test('dragging keeps the centre on the stage', () => {
  const p = gesturePose(start, [{ x: 0, y: 0 }], [{ x: -5000, y: 9000 }], W, H)
  assert.equal(p.x, 0)
  assert.equal(p.y, 1)
})

test('pinch scales by the distance ratio, clamped to the limits', () => {
  const from = [{ x: 100, y: 400 }, { x: 300, y: 400 }]
  near(gesturePose(start, from, [{ x: 50, y: 400 }, { x: 350, y: 400 }], W, H).s, 1.5)
  assert.equal(gesturePose(start, from, [{ x: 199, y: 400 }, { x: 201, y: 400 }], W, H).s, MIN_SCALE)
  assert.equal(gesturePose(start, from, [{ x: -5000, y: 400 }, { x: 5000, y: 400 }], W, H).s, MAX_SCALE)
})

test('a symmetric pinch does not move the light', () => {
  const p = gesturePose(start, [{ x: 100, y: 400 }, { x: 300, y: 400 }], [{ x: 50, y: 400 }, { x: 350, y: 400 }], W, H)
  near(p.x, 0.5)
  near(p.y, 0.5)
})

test('two fingers move by their midpoint', () => {
  const p = gesturePose(start, [{ x: 100, y: 400 }, { x: 300, y: 400 }], [{ x: 140, y: 480 }, { x: 340, y: 480 }], W, H)
  near(p.x, 0.6)
  near(p.y, 0.6)
  near(p.s, 1)
})

test('twist rotates by the change in angle', () => {
  const p = gesturePose(start, [{ x: 100, y: 400 }, { x: 300, y: 400 }], [{ x: 200, y: 300 }, { x: 200, y: 500 }], W, H)
  near(p.rot, Math.PI / 2)
  near(p.s, 1)
})

test('twisting across the atan2 seam is a small turn, not a full one', () => {
  // From pointing just above due-left (≈ +179°) to just below it (≈ -179°): a 2° turn.
  const deg = Math.PI / 180
  const at = a => [{ x: 200, y: 400 }, { x: 200 + 100 * Math.cos(a), y: 400 + 100 * Math.sin(a) }]
  const p = gesturePose(start, at(179 * deg), at(-179 * deg), W, H)
  near(p.rot, 2 * deg, 1e-6)
})

test('rotation is relative to the pose the gesture started from', () => {
  const p = gesturePose({ ...start, rot: 1, s: 2 }, [{ x: 0, y: 0 }, { x: 10, y: 0 }], [{ x: 0, y: 0 }, { x: 10, y: 0 }], W, H)
  assert.equal(p.rot, 1)
  assert.equal(p.s, 2)
})

test('degenerate input leaves the pose unchanged', () => {
  assert.equal(gesturePose(start, [], [], W, H), start)
  assert.equal(gesturePose(start, [{ x: 0, y: 0 }], [], W, H), start)
  assert.equal(gesturePose(start, [{ x: 0, y: 0 }], [{ x: 9, y: 9 }], 0, H), start)
  const three = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]
  assert.equal(gesturePose(start, three, three, W, H), start)
  // Two fingers starting on the same spot: no division by zero.
  const p = gesturePose(start, [{ x: 5, y: 5 }, { x: 5, y: 5 }], [{ x: 5, y: 5 }, { x: 50, y: 5 }], W, H)
  assert.ok(Number.isFinite(p.s) && Number.isFinite(p.rot))
})

test('buttons and arrow keys stay within limits', () => {
  assert.equal(withZoom({ ...start, s: 3.9 }, 1.15).s, MAX_SCALE)
  assert.equal(withZoom({ ...start, s: 0.31 }, 0.87).s, MIN_SCALE)
  assert.equal(withMove({ ...start, x: 0.99 }, 0.02, 0).x, 1)
  near(withMove(start, -0.02, 0.02).y, 0.52)
})
