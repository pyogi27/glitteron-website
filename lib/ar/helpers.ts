/**
 * Pure helpers for the "View in your room" camera overlay (see docs/AR-VIEW-IN-ROOM.md).
 * Gesture and pose maths live next door in gestures.ts.
 */

const BARE_HEIGHT = /^\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*$/i
// An H/Height label at the start of a word: "H550mm", "D100mm H300mm", "Height - 400mm".
// Not "L170xH280" or "3H-600", where the H is glued to another value.
const LABELLED_HEIGHT = /(?:^|[\s-])(?:h|height)\s*[-:]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?(?![\d.x])/i

/**
 * Height in mm from the catalogue's free-text `productHeight`, or undefined when it is
 * not unambiguously a height. Units are always mm in this catalogue (checked 2026-11-02
 * across the 548 products that set it).
 */
export function parseHeightMm(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined
  const m = BARE_HEIGHT.exec(raw) ?? LABELLED_HEIGHT.exec(raw)
  const mm = m ? Number(m[1]) : NaN
  return mm > 0 ? mm : undefined
}

/**
 * Same-origin, 1080px WebP of an arImage. S3 sends no CORS header, so the original
 * would taint the canvas; this is also ~20x smaller (2.1 MB → 114 KB).
 * 1080 is one of next/image's default device sizes, and **.amazonaws.com is allowed.
 */
export function arImageSrc(url: string): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=1080&q=75`
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Bounding box of pixels with alpha ≥ threshold, or null when the image is empty. */
export function alphaBounds(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 16,
): Box | null {
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < threshold) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

export interface Crop {
  sx: number
  sy: number
  sw: number
  sh: number
  /** Camera pixels per stage pixel. */
  k: number
}

/**
 * The part of a videoW×videoH camera frame visible in a stageW×stageH box under
 * `object-fit: cover`, so a capture matches the screen exactly.
 */
export function coverCrop(videoW: number, videoH: number, stageW: number, stageH: number): Crop {
  const scale = Math.max(stageW / videoW, stageH / videoH)
  const sw = stageW / scale
  const sh = stageH / scale
  return { sx: (videoW - sw) / 2, sy: (videoH - sh) / 2, sw, sh, k: 1 / scale }
}

export type InApp = 'instagram' | 'facebook' | 'none'

/** Instagram/Facebook in-app browsers, which often cannot open the camera on Android. */
export function inAppBrowser(ua: string): InApp {
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(ua)) return 'facebook'
  return 'none'
}

export const isAndroid = (ua: string): boolean => /Android/i.test(ua)

/** An Android intent link that reopens `href` in Chrome, or in the default browser without it. */
export function chromeIntentUrl(href: string): string {
  const u = new URL(href)
  return (
    // No hash: "#Intent" is the separator, so a page fragment would end the URL early.
    `intent://${u.host}${u.pathname}${u.search}` +
    `#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(href)};end`
  )
}
