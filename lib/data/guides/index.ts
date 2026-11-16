import { acrylicVsGlassChandeliers } from './acrylic-vs-glass-chandeliers'
import { bedroomLighting } from './bedroom-lighting'
import { chandelierSize } from './chandelier-size'
import { colourTemperature } from './colour-temperature'
import { diningTableLighting } from './dining-table-lighting'
import { kitchenIslandPendants } from './kitchen-island-pendants'
import { livingRoomLighting } from './living-room-lighting'
import type { Guide } from './types'

export type { Guide, GuideBlock, GuideFaq, GuideSection } from './types'

/**
 * Ordered as the index page lists them: sizing questions first, because those
 * are the ones people search with a tape measure in hand.
 */
export const guides: Guide[] = [
  chandelierSize,
  diningTableLighting,
  kitchenIslandPendants,
  livingRoomLighting,
  bedroomLighting,
  colourTemperature,
  acrylicVsGlassChandeliers,
]

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find(g => g.slug === slug)
}

/** Up to `limit` other guides, for the "keep reading" row. */
export function relatedGuides(slug: string, limit = 3): Guide[] {
  return guides.filter(g => g.slug !== slug).slice(0, limit)
}
