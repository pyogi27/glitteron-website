/**
 * Shape of a lighting guide.
 *
 * Guides are written to be quoted, not just ranked: every one opens with a
 * direct answer in its first 40–60 words, states its numbers in a table rather
 * than burying them in prose, and phrases its headings as the question a reader
 * actually types. That is what an answer engine can lift cleanly, and it
 * happens to be what a hurried reader wants too.
 */

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; caption?: string; head: string[]; rows: string[][] }
  | { type: 'note'; text: string }

export interface GuideSection {
  /** Anchor id, also used by the sticky section index. */
  id: string
  heading: string
  blocks: GuideBlock[]
}

export interface GuideFaq {
  question: string
  answer: string
}

export interface Guide {
  slug: string
  /** Page <h1>. */
  title: string
  /** <title> tag — question-shaped, distinct from the commercial room pages. */
  metaTitle: string
  description: string
  /** Kicker above the title. */
  category: string
  /**
   * The lead answer. Kept to a couple of sentences so it can stand alone as a
   * quoted response, with the specific numbers in it rather than a promise
   * that the numbers appear further down.
   */
  answer: string
  /** ISO date. Shown on the page and emitted as dateModified. */
  updated: string
  sections: GuideSection[]
  faqs: GuideFaq[]
  /** Where to go next — commercial pages this guide should feed. */
  shop: { label: string; href: string }[]
}
