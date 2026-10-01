// lib/keyFeatures.ts
//
// Server-only: imported by lib/api/server.ts, never by a client component, so
// sanitize-html stays out of the browser bundle.
import sanitizeHtml from "sanitize-html";

// Ported from server/src/utils/sanitizeRichText.js. The backend already sanitizes on
// write; this second pass guards rows written before that existed or by another path,
// because the result goes straight into dangerouslySetInnerHTML. Keep the two in step.

// #rgb, #rgba, #rrggbb, #rrggbbaa, or rgb()/rgba() with plain numeric channels.
// Nothing else reaches a style attribute: no url(), expression(), var() or keywords.
const COLOR_VALUE = /^(#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*(0|1|0?\.\d+|\d{1,3}%)\s*)?\))$/i;
const COLOR_STYLES = { color: [COLOR_VALUE], "background-color": [COLOR_VALUE] };

// sanitize-html treats scheme-less hrefs ("/admin", "javascript%3A...") as relative
// and keeps them, which allowedSchemes alone doesn't stop.
const SAFE_HREF = /^(https?:|mailto:)/i;

// sanitize-html strips "!important" before matching allowedStyles, then re-adds it.
// Colour values never contain "!", so deleting it from the raw style closes that gap.
const stripImportant: sanitizeHtml.Transformer = (tagName, attribs) => ({
  tagName,
  attribs: attribs.style ? { ...attribs, style: attribs.style.replace(/!/g, "") } : attribs,
});

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "a", "span", "mark"],
  allowedAttributes: {
    a: ["href", "rel", "target"],
    span: ["style"],
    mark: ["style"],
  },
  allowedStyles: { span: COLOR_STYLES, mark: COLOR_STYLES },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    // Force rel/target on every link, overwriting whatever the editor sent.
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...(SAFE_HREF.test(attribs.href || "") && { href: attribs.href }),
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    span: stripImportant,
    mark: stripImportant,
  },
  // A link whose href was dropped would still render link-styled; keep only its text.
  exclusiveFilter: (frame) => (frame.tag === "a" && !frame.attribs.href ? "excludeTag" : false),
};

/**
 * Reduce key-features HTML to the allowlist.
 *
 * @returns sanitized HTML, or null when nothing visible remains (the editor's
 *   empty state is "<p></p>"), so callers can hide the section on null alone.
 */
export function sanitizeKeyFeatures(html: unknown): string | null {
  if (typeof html !== "string") return null;
  const clean = sanitizeHtml(html, OPTIONS).trim();
  const text = sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} });
  return text.trim() ? clean : null;
}
