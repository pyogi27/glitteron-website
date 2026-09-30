import { slugify } from "./slug";

/**
 * A row from GET /api/products/videos. The endpoint selects a fixed column list
 * (see getProductVideos in the backend's productController) — no slug, no
 * variations, no stock. Everything is typed loosely because it is wire data.
 */
export interface ApiVideoProduct {
  id?: number | string;
  name?: string;
  sku?: string;
  category?: string | number;
  price?: number | string;
  thumbnailImage?: string | null;
  mainImage?: string | null;
  /** JSON column: an array of S3 URLs, or its serialised string. */
  productVideos?: unknown;
  /** Only once the backend selects it; feeds VideoObject.uploadDate. */
  updatedAt?: string;
}

/** One Watch & Shop card: a product and the one video it is shown with. */
export interface VideoItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  /** Product image shown until the video has a frame. "" when there is none. */
  poster: string;
  src: string;
  /** From the file extension; uploads are mp4 or webm only. */
  type: "video/mp4" | "video/webm";
  /** ISO 8601. Absent when the API sent no date — never invented. */
  uploadDate?: string;
}

/** The URL, percent-encoded, when it is https. Catalogue URLs carry raw spaces. */
function httpsUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function videoList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
}

/**
 * API rows -> cards. One card per product, using its first https video; rows
 * that would render a broken card (no video, no name, no price) drop out.
 */
export function toVideoItems(rows: readonly unknown[] | null | undefined): VideoItem[] {
  const seen = new Set<number>();
  const items: VideoItem[] = [];
  for (const raw of rows ?? []) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as ApiVideoProduct;
    const productId = Number(p.id);
    const rawName = typeof p.name === "string" ? p.name : "";
    const name = rawName.trim();
    // Slug from the raw name, as mapApiProduct and the slug index do: "Lamp "
    // lives at /collections/lamp-, and trimming first would miss it.
    const slug = slugify(rawName);
    const price = Number(p.price);
    const src = videoList(p.productVideos).map(httpsUrl).find(Boolean);
    if (!Number.isInteger(productId) || productId <= 0 || seen.has(productId)) continue;
    if (!name || !slug || !src || !(price > 0)) continue;
    seen.add(productId);

    const uploadDate = isoDate(p.updatedAt);
    items.push({
      productId,
      slug,
      name,
      price,
      poster: httpsUrl(p.mainImage) || httpsUrl(p.thumbnailImage),
      src,
      type: /\.webm$/i.test(new URL(src).pathname) ? "video/webm" : "video/mp4",
      ...(uploadDate ? { uploadDate } : {}),
    });
  }
  return items;
}
