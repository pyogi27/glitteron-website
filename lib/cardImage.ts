// Most catalogue shots are a product on white (or an alpha cutout), which the card
// pads and fits whole. Some are full photos on a room backdrop; padded, they read as
// a framed picture inside the white card, so those fill the tile instead.

/** Side of the square the image is shrunk to before its border is sampled. */
export const SAMPLE_SIZE = 24

// A pixel counts as "white ground" when it is near-white or near-transparent.
const WHITE_MIN = 236
const ALPHA_MAX = 16
// Share of border pixels that must be white ground for the shot to count as on white.
// Below 1 so a shadow or a cable touching the edge does not flip a white shot.
const WHITE_EDGE_SHARE = 0.85

/** Whether the border of an RGBA buffer (size × size) is mostly something other than white. */
export function hasBackdrop(data: ArrayLike<number>, size: number): boolean {
  let edge = 0
  let white = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x !== 0 && y !== 0 && x !== size - 1 && y !== size - 1) continue
      const i = (y * size + x) * 4
      edge++
      const isClear = data[i + 3] <= ALPHA_MAX
      const isWhite = data[i] >= WHITE_MIN && data[i + 1] >= WHITE_MIN && data[i + 2] >= WHITE_MIN
      if (isClear || isWhite) white++
    }
  }
  return white / edge < WHITE_EDGE_SHARE
}

/**
 * Reads a loaded <img>'s border. Next serves card images from same-origin
 * /_next/image, so the canvas is not tainted; if it ever is (unoptimized remote
 * src), getImageData throws and the shot keeps the default padded fit.
 */
export function imageHasBackdrop(img: HTMLImageElement): boolean {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = SAMPLE_SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return false
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    return hasBackdrop(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data, SAMPLE_SIZE)
  } catch {
    return false
  }
}
