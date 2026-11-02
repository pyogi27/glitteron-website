/**
 * Pose math for the "View in your room" camera overlay. Pure, so it runs under node --test.
 *
 * A pose is the light's centre as a fraction of the stage (0–1 on each axis), a scale on
 * top of its starting height, and a rotation in radians. Gestures are always computed
 * from where they started, never accumulated per event, so rounding cannot drift.
 */

export type Placement = 'ceiling' | 'wall' | 'floor'

export interface Pose {
  x: number
  y: number
  s: number
  rot: number
}

export interface Point {
  x: number
  y: number
}

export const MIN_SCALE = 0.3
export const MAX_SCALE = 4

/**
 * How much wall a phone's camera frame is assumed to cover, top to bottom.
 * ponytail: a guess — tune it on real phones against a known 30 cm and 1.8 m light.
 */
export const ASSUMED_FRAME_HEIGHT_MM = 2800
/** Starting height bounds, as a fraction of the stage, so tiny or huge lights stay usable. */
const MIN_HEIGHT = 0.15
const MAX_HEIGHT = 0.6
const UNKNOWN_HEIGHT = 0.35

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function placementFor(category: string): Placement {
  const c = category.toLowerCase()
  if (c.includes('wall')) return 'wall'
  if (/floor|table/.test(c)) return 'floor'
  // Chandeliers, pendants, ceiling lights and anything unrecognised hang from above.
  return 'ceiling'
}

/** Starting overlay height as a fraction of the stage height. */
export function heightFraction(heightMm?: number): number {
  if (!heightMm || !(heightMm > 0)) return UNKNOWN_HEIGHT
  return clamp(heightMm / ASSUMED_FRAME_HEIGHT_MM, MIN_HEIGHT, MAX_HEIGHT)
}

/** Centred horizontally; hung from the top, centred on a wall, or stood on the floor. */
export function startPose(placement: Placement, height: number): Pose {
  const y =
    placement === 'ceiling' ? 0.06 + height / 2
    : placement === 'floor' ? 0.9 - height / 2
    : 0.4
  return { x: 0.5, y, s: 1, rot: 0 }
}

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)
const angle = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x)
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Wrap to (-π, π] so crossing atan2's seam does not flip the light a full turn. */
function wrapAngle(a: number): number {
  const w = (a + Math.PI) % (2 * Math.PI)
  return (w <= 0 ? w + 2 * Math.PI : w) - Math.PI
}

/**
 * The pose after a gesture. `from` and `to` are the same pointers (same order, stage
 * pixels) at the gesture's start and now; `width`/`height` are the stage size.
 * One pointer drags. Two pointers drag by their midpoint, scale by the change in their
 * distance and rotate by the change in their angle. Anything else changes nothing.
 */
export function gesturePose(
  start: Pose,
  from: Point[],
  to: Point[],
  width: number,
  height: number,
): Pose {
  if (!(width > 0) || !(height > 0) || from.length !== to.length) return start
  if (from.length === 1) {
    return withMove(start, (to[0].x - from[0].x) / width, (to[0].y - from[0].y) / height)
  }
  if (from.length !== 2) return start

  const [a0, b0] = from
  const [a1, b1] = to
  const m0 = mid(a0, b0)
  const m1 = mid(a1, b1)
  const d0 = dist(a0, b0)
  const ratio = d0 > 0 ? dist(a1, b1) / d0 : 1
  const moved = withMove(start, (m1.x - m0.x) / width, (m1.y - m0.y) / height)
  return {
    ...moved,
    s: clamp(start.s * ratio, MIN_SCALE, MAX_SCALE),
    rot: start.rot + wrapAngle(angle(a1, b1) - angle(a0, b0)),
  }
}

/** Move by a fraction of the stage, keeping the centre on the stage. */
export function withMove(pose: Pose, dx: number, dy: number): Pose {
  return { ...pose, x: clamp(pose.x + dx, 0, 1), y: clamp(pose.y + dy, 0, 1) }
}

/** Multiply the scale (the −/+ buttons), within the gesture limits. */
export function withZoom(pose: Pose, factor: number): Pose {
  return { ...pose, s: clamp(pose.s * factor, MIN_SCALE, MAX_SCALE) }
}
