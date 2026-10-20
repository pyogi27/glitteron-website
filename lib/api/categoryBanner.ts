import type { ApiCategory } from './types'

/**
 * Banner for a category page: the category named `name` if it has one, otherwise
 * the first of `names` (an umbrella page's categories) that does.
 */
export function findCategoryBanner(
  categories: ApiCategory[],
  name: string,
  names: string[] = [],
): string | undefined {
  const bannerOf = (n: string) => categories.find(c => c.name === n)?.bannerImage || undefined
  return bannerOf(name) ?? names.map(bannerOf).find(Boolean)
}
