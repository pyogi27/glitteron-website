import type { Product } from "@/lib/types";
import { availableStock, DEFAULT_MAX_QTY, mapVariations } from "@/lib/variations";
import { sanitizeKeyFeatures } from "@/lib/keyFeatures";
import { slugify } from "./slug";
import { toVideoItems, type VideoItem } from "./videos";
import {
  normalizeDimension,
  productBodyCopy,
  productHeadline,
  productSpecs,
  splitList,
  type ProductCopyInput,
} from "@/lib/seo/product-copy";
import type {
  ApiCategory,
  ApiProduct,
  ApiProductDetail,
} from "./types";

const BACKEND = process.env.API_URL ?? "http://localhost:3000";

const PLACEHOLDER_IMAGE =
  "https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop";

export { slugify };

function extractImageUrl(img: string | { url: string }): string {
  return typeof img === "string" ? img : (img?.url ?? "");
}

/**
 * Category id -> display name.
 *
 * Seeded from GET /api/categories as measured 2026-08-08 so that the synchronous
 * mappers can resolve a name without awaiting a fetch, and refreshed by
 * fetchCategories() whenever it runs. An id missing from both simply yields an
 * empty category rather than a wrong one.
 */
const categoryNames = new Map<number, string>([
  [1, "Wall Lights"],
  [2, "Ceiling Lights"],
  [3, "Floor Lamps"],
  [4, "Chandelier Lights"],
  [5, "Pendant Lights"],
  [6, "Bulbs"],
  [7, "Table Lamp"],
]);

/**
 * The product's category id, whatever shape the backend used.
 *
 * The wire format is `category: "5"` — a stringified id, with no `categoryId`
 * key at all. Callers that read `p.categoryId` directly got undefined for every
 * product; go through here instead.
 */
export function categoryIdOf(p: Partial<ApiProduct>): number {
  if (p.categoryId != null) return toNumber(p.categoryId);
  const category = p.category;
  if (category == null) return 0;
  if (typeof category === "object") return toNumber(category.id);
  return toNumber(category);
}

/** Display name for a product's category, or "" when the id is unknown. */
export function resolveCategoryName(p: Partial<ApiProduct>): string {
  if (typeof p.category === "object" && p.category?.name) return p.category.name;
  return categoryNames.get(categoryIdOf(p)) ?? "";
}

/** The fields productCopy reads, lifted off an API record of either shape. */
function copyInput(p: ApiProduct | ApiProductDetail): ProductCopyInput {
  const detail = p as ApiProductDetail;
  return {
    name: p.name,
    categoryName: resolveCategoryName(p),
    materials: detail.materials,
    bodyColors: detail.bodyColors,
    lightSource: detail.lightSource,
    wattage: detail.wattage,
    productHeight: detail.productHeight,
    productWidth: detail.productWidth,
    productLength: detail.productLength,
    diameter: detail.diameter,
    weight: detail.weight,
    price: toNumber(p.price),
    sku: p.sku,
    whereUsed: detail.whereUsed,
    description: p.description,
  };
}

// Backend serializes numeric columns as strings (e.g. price "7800.00").
// Coerce defensively so downstream arithmetic and toLocaleString work.
/**
 * Available stock for a product, in units.
 *
 * The API has no `stock` field. It reports availability as `quantity` (the row's own
 * stock), `totalStock` (summed across variations), `reservedQuantity` (held by pending
 * payments) and an `inStock` boolean. Reading `p.stock` returned undefined for every
 * product, so `toNumber()` coerced it to 0 — which read as "out of stock" and pinned
 * the quantity stepper at 1 across the whole site.
 *
 *   hasVariations -> totalStock (variation stock is the real constraint)
 *   otherwise     -> quantity - reservedQuantity
 *   neither set   -> fall back to the backend's own inStock verdict
 */
function resolveStock(p: Partial<ApiProduct>): number {
  const totalStock = p.totalStock != null ? toNumber(p.totalStock, -1) : -1;
  if (p.hasVariations && totalStock >= 0) return totalStock;

  // Negative stock exists in this catalogue (9 products measured 2026-08-04);
  // availableStock clamps so callers never see a negative max.
  if (p.quantity != null) return availableStock(p.quantity, p.reservedQuantity);

  if (totalStock >= 0) return totalStock;
  // Nothing numeric available: trust the boolean, but we cannot know the real ceiling.
  return p.inStock ? DEFAULT_MAX_QTY : 0;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

// Extracts an array from any common API response shape:
// { data: [...] } | { products: [...] } | { categories: [...] } | [...] directly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractArray<T>(body: any, ...keys: string[]): T[] {
  if (Array.isArray(body)) return body as T[];
  for (const key of keys) {
    if (Array.isArray(body?.[key])) return body[key] as T[];
  }
  return [];
}

export function mapApiProduct(p: ApiProduct, categoryName?: string): Product {
  const rest: string[] = p.imageUrls?.length
    ? p.imageUrls
    : Array.isArray(p.images)
      ? (p.images as Array<string | { url: string }>)
          .map(extractImageUrl)
          .filter(Boolean)
      : [];

  // thumbnailImage is always the first — used by ProductCard for the listing view.
  // Fall back to mainImage / arImages when neither imageUrls nor images is present.
  const lead = p.thumbnailImage ?? p.mainImage ?? p.arImages;
  const merged = lead
    ? [lead, ...rest.filter((u) => u !== lead)]
    : rest;

  const images = merged.length > 0 ? merged : [PLACEHOLDER_IMAGE];

  // The catalogue names 903 of 1,028 products with a bare model code and leaves
  // description and specs empty, so headline/description/specs are composed from
  // the physical attributes instead. An authored description still wins — see
  // productBodyCopy.
  const copy = copyInput(p);
  const resolvedCategory = categoryName ?? resolveCategoryName(p);
  const generated = { ...copy, categoryName: resolvedCategory };

  return {
    id: String(p.id),
    slug: p.slug ?? slugify(p.name),
    apiProductId: p.id,
    name: p.name,
    headline: productHeadline(generated),
    subtitle: p.description ?? "",
    category: resolvedCategory,
    badge: p.badge,
    price: toNumber(p.price),
    originalPrice: p.originalPrice != null ? toNumber(p.originalPrice) : undefined,
    discount: p.discount != null ? toNumber(p.discount) : undefined,
    rating: toNumber(p.rating),
    reviewCount: toNumber(p.reviewCount),
    sku: p.sku ?? "",
    stock: resolveStock(p),
    images,
    description: productBodyCopy(generated),
    specs: productSpecs(generated),
    variants: { sizes: [], finishes: [], crystalTones: [] },
    reviews: [],
    whereUsed: (p as ApiProductDetail).whereUsed,
    arImage: p.arImages,
    lightOnImage: p.lightOnImage || undefined,
  };
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const url = `${BACKEND}/api/categories`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[fetchCategories] ${res.status} from ${url}`);
      return [];
    }
    const body = await res.json();
    const categories = extractArray<ApiCategory>(body, "data", "categories");
    // Keep the synchronous id -> name seed honest as the taxonomy grows.
    for (const c of categories) {
      if (c.name) categoryNames.set(toNumber(c.id), c.name);
    }
    console.log(
      `[fetchCategories] ${categories.length} categories from ${url}`,
    );
    return categories;
  } catch (err) {
    console.error(`[fetchCategories] failed to reach ${url}:`, err);
    return [];
  }
}

export async function fetchProducts(params?: {
  categoryId?: number;
  /**
   * Several categories at once, for the /hanging-lights umbrella. The backend
   * ORs repeated `category` params (verified 2026-08-21: `category=4&category=5`
   * returns 658, the sum of chandeliers and pendants). A comma-joined list is
   * NOT understood — `category=4,5` returns 0 — so these must be repeated keys.
   */
  categoryIds?: number[];
  /**
   * Backend attribute filters, ANDed with the category and with each other.
   * Comma-joined values inside one param are ORed (`materials=Glass,Wood` → 454).
   * Both verified against the live API 2026-08-21.
   */
  materials?: string;
  bodyColors?: string;
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  whereUsed?: string;
  /**
   * Listings ask the backend for `stockStatus=in_stock`, so an out-of-stock product
   * never lists and `total`/`totalPages` count only what can be bought. The catalog
   * below opts out: a product page must still resolve (showing "out of stock") for
   * Google, shared links and wishlists while the product waits for a restock.
   */
  includeOutOfStock?: boolean;
}): Promise<{ products: ApiProduct[]; total: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (!params?.includeOutOfStock) qs.set("stockStatus", "in_stock");
  if (params?.categoryId) qs.set("category", String(params.categoryId));
  for (const id of params?.categoryIds ?? []) qs.append("category", String(id));
  if (params?.materials) qs.set("materials", params.materials);
  if (params?.bodyColors) qs.set("bodyColors", params.bodyColors);
  if (params?.search) qs.set("search", params.search);
  if (params?.whereUsed) qs.set("whereUsed", params.whereUsed);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.minPrice !== undefined)
    qs.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined)
    qs.set("maxPrice", String(params.maxPrice));
  qs.set("limit", String(params?.limit ?? 100));

  const url = `${BACKEND}/api/products?${qs}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`[fetchProducts] ${res.status} from ${url}`);
      return { products: [], total: 0, totalPages: 1 };
    }
    const body = await res.json();
    const products = extractArray<ApiProduct>(
      body,
      "data",
      "products",
      "items",
    );
    const total: number =
      body?.pagination?.total ??
      body?.total ??
      body?.meta?.total ??
      products.length;
    const limit = params?.limit ?? 100;
    const totalPages: number =
      body?.pagination?.totalPages ??
      body?.totalPages ??
      Math.ceil(total / limit);
    console.log(
      `[fetchProducts] ${products.length} products (total: ${total}, pages: ${totalPages}) from ${url}`,
    );
    return { products, total, totalPages };
  } catch (err) {
    console.error(`[fetchProducts] failed to reach ${url}:`, err);
    return { products: [], total: 0, totalPages: 1 };
  }
}

export async function fetchFeaturedProducts(
  limit: number = 20,
): Promise<Product[]> {
  const { products: apiProducts } = await fetchProducts({ limit });
  return apiProducts.map((p) => mapApiProduct(p));
}

/**
 * The whole catalog, fetched once and reused.
 *
 * findApiProductBySlug used to page through the API per product. Prerendering
 * ~1000 products meant ~5000 requests, which blew the backend's 1000-per-15min
 * rate limit partway through a build — every later lookup then returned empty
 * and the page called notFound(), so every product built as a 404 shell.
 * React's cache() collapses this to one pass per build/request.
 */
let catalogPromise: Promise<ApiProduct[]> | null = null;
let catalogFetchedAt = 0;
/** Declared here rather than beside getSlugIndex: getCatalog invalidates it. */
let slugIndexPromise: Promise<Map<string, ApiProduct>> | null = null;

/**
 * How long a memoised catalog stays authoritative.
 *
 * The memo used to live for the lifetime of the process, which meant a product
 * added after the last deploy was never in the slug index — findApiProductBySlug
 * returned null and the page called notFound(), while the sitemap (rebuilt daily)
 * already listed the URL. Sampling 41 sitemap product URLs on 2026-08-08 caught
 * one such 404 (/collections/dg-p184a, created that morning); a sitemap serving
 * 404s costs crawl budget and trust.
 *
 * An hour matches the product route's own `revalidate`, so a new product is
 * reachable within an hour of being added rather than requiring a redeploy.
 */
const CATALOG_TTL_MS = 60 * 60 * 1000;

/** Past this the home page renders without Watch & Shop rather than wait. */
const VIDEOS_TIMEOUT_MS = 5_000;

const getCatalog = (): Promise<ApiProduct[]> => {
  // Memoised on the module, not via React cache(): a build renders pages across
  // several worker processes and cache() is per-request, so it deduped nothing.
  // One in-flight promise per worker turns ~5000 requests into ~5 per worker.
  if (catalogPromise && Date.now() - catalogFetchedAt > CATALOG_TTL_MS) {
    catalogPromise = null;
    slugIndexPromise = null;
  }

  if (!catalogPromise) {
    catalogFetchedAt = Date.now();
    catalogPromise = (async () => {
      const limit = 250;
      const firstPage = await fetchProducts({ page: 1, limit, includeOutOfStock: true });
      if (firstPage.products.length === 0) {
        catalogPromise = null; // let a transient failure be retried
        return [];
      }

      const rest: ApiProduct[] = [];
      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const { products } = await fetchProducts({ page, limit, includeOutOfStock: true });
        rest.push(...products);
      }
      return [...firstPage.products, ...rest];
    })().catch(err => {
      catalogPromise = null;
      throw err;
    });
  }
  return catalogPromise;
};

/** Every product in the catalog, deduped. Shared by the sitemap and SSG params. */
export async function fetchAllProducts(): Promise<ApiProduct[]> {
  return getCatalog();
}

/** Slug → product, rebuilt whenever the memoised catalog is refreshed. */
const getSlugIndex = (): Promise<Map<string, ApiProduct>> => {
  // Resolve the catalog first: an expired memo clears slugIndexPromise as a
  // side effect, so this must run before the null check below.
  const catalog = getCatalog();

  if (!slugIndexPromise) {
    slugIndexPromise = catalog
      .then(products => {
        const index = new Map<string, ApiProduct>();
        for (const p of products) {
          const key = (p.slug ?? slugify(p.name)).trim().toLowerCase();
          if (key && !index.has(key)) index.set(key, p);
        }
        // An empty catalog means the fetch failed — do not cache that.
        if (index.size === 0) slugIndexPromise = null;
        return index;
      })
      .catch(err => {
        slugIndexPromise = null;
        throw err;
      });
  }
  return slugIndexPromise;
};

/**
 * Every slug the product route can actually resolve.
 *
 * The sitemap derives its product URLs from this rather than re-deriving them
 * from names: a slug taken straight from the resolver's own keys cannot 404,
 * which a parallel `products.map(slugify)` demonstrably could when the two
 * disagreed about the catalog.
 */
export async function resolvableProductSlugs(): Promise<string[]> {
  const index = await getSlugIndex();
  return [...index.keys()];
}

export async function findApiProductBySlug(
  slug: string,
): Promise<ApiProduct | null> {
  const index = await getSlugIndex();
  return index.get(slug.trim().toLowerCase()) ?? null;
}

/**
 * Watch & Shop cards from GET /api/products/videos (limit is capped at 50 by
 * the backend). Never throws: a failure logs and yields [], and the home page
 * drops the section.
 *
 * Unlike /api/products, the videos endpoint does not apply the show_on_website
 * or hidden-category filters, so it can return a product whose page 404s. Keep
 * only cards whose slug the product route resolves — the same guard the
 * sitemap relies on. The catalog is only fetched when there are videos.
 *
 * Time-boxed: this is the one optional section on the home page, and a
 * stalled endpoint used to hold the whole render (and a build's prerender).
 */
export async function fetchProductVideos(limit: number = 12): Promise<VideoItem[]> {
  const url = `${BACKEND}/api/products/videos?page=1&limit=${limit}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(VIDEOS_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[fetchProductVideos] ${res.status} from ${url}`);
      return [];
    }
    const body = await res.json();
    const items = toVideoItems(extractArray<unknown>(body, "products", "data"));
    if (items.length === 0) return [];

    // Same slug, same product: two products sharing a name share a slug, and
    // the route serves the first. The check (a catalog crawl when cold) shares
    // the time box; running out drops the section rather than wait.
    const owners = await Promise.race([
      Promise.all(items.map((v) => findApiProductBySlug(v.slug))),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), VIDEOS_TIMEOUT_MS)),
    ]);
    if (!owners) {
      console.error(`[fetchProductVideos] slug check timed out; hiding the section`);
      return [];
    }
    const linkable = items.filter((v, i) => Number(owners[i]?.id) === v.productId);
    console.log(
      `[fetchProductVideos] ${linkable.length} of ${items.length} video cards linkable from ${url}`,
    );
    return linkable;
  } catch (err) {
    console.error(`[fetchProductVideos] failed to reach ${url}:`, err);
    return [];
  }
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => {
    const key = v.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Named colours the backend actually uses, mapped to swatch hexes.
const COLOR_HEX: Record<string, string> = {
  gold: "#C9A227", golden: "#C9A227", brass: "#B5A642",
  "brass gold": "#B5A642", "antique brass": "#8C7853", "antique gold": "#997A45",
  silver: "#C0C0C0", chrome: "#DBDBDB", nickel: "#B8B8B8",
  black: "#1E1E1E", "matte black": "#232323", "black smokey": "#3A3A3A",
  white: "#F5F3EF", "milky white": "#F3EFE7", ivory: "#EFE6D4",
  grey: "#8A8A8A", gray: "#8A8A8A", smoke: "#7A7573", smokey: "#7A7573",
  amber: "#C88A3A", champagne: "#E3CFA3", bronze: "#7B5A3A", copper: "#B06A3B",
  clear: "#E6EEF2", transparent: "#E6EEF2", cognac: "#9A5B2C", tea: "#A9865B",
  green: "#4B6B4A", yellow: "#D8B24A", blue: "#3E5C7A", red: "#9B3B34",
  wooden: "#9A7247", "light wooden": "#BE9A6B", walnut: "#5C4033", oak: "#B08C5A",
  rose: "#B76E79", "rose gold": "#B76E79", gunmetal: "#4A4E54",
};

function toHex(name: string): string {
  return COLOR_HEX[name.trim().toLowerCase()] ?? "#E8E8E8";
}

// Build the "L: 300mm, B: 200mm, H: 150mm" / "⌀: 800mm" size label shown to shoppers.
// Dimension fields are inconsistent ("D90mm" vs a bare "90"); normalizeDimension
// strips any legacy prefix — our own L:/B:/H:/⌀: label supplies that now.
function formatSizeLabel(p: ApiProductDetail): string {
  return [
    p.productLength && `L: ${normalizeDimension(p.productLength)}`,
    p.productWidth && `B: ${normalizeDimension(p.productWidth)}`,
    p.productHeight && `H: ${normalizeDimension(p.productHeight)}`,
    p.diameter && `⌀: ${normalizeDimension(p.diameter)}`,
  ].filter(Boolean).join(", ");
}

// Build the SELECTOR view of variants: flat, de-duplicated display strings for the
// dropdowns and swatches.
//
// This is not the authoritative variation list. Real ProductVariation rows (with ids
// and per-variation prices) come back from GET /api/products/:id?includeVariations=true
// and are mapped separately into Product.variations — use those for anything that
// touches money. An earlier version of this comment claimed no variations endpoint
// existed; that was wrong, and it cost real revenue by sending a null variation id to
// checkout, which then priced from the parent product.
//
// Known wrinkle: sizes here can contain near-duplicates ("300" and "300mm" on product
// 1466) because the catalogue is entered inconsistently. resolveVariation() in
// lib/variations.ts normalises them when matching a selection back to a row.
function mapVariants(p: ApiProductDetail): Product["variants"] {
  const attrs = p.availableAttributes ?? {};

  const sizes = dedupe([
    ...(p.availableSizes ?? []),
    ...(attrs.sizes ?? []),
    // No variant sizes: fall back to the product's own dimensions so the row is useful.
    ...(!(p.availableSizes?.length || attrs.sizes?.length)
      ? [formatSizeLabel(p)]
      : []),
  ].map((s) => s.trim()).filter(Boolean));

  // Finish = colour/material treatment of the body.
  const finishes = dedupe([
    ...(p.availableColors ?? []),
    ...(attrs.colors ?? []),
    ...splitList(p.bodyColors),
  ]);

  const crystalTones = dedupe([
    ...(attrs.colors ?? []),
    ...(p.availableColors ?? []),
  ]).map((name) => ({ name, hex: toHex(name) }));

  return { sizes, finishes, crystalTones };
}

// Fetch single product by ID with variations and specs
export async function fetchProductById(id: number): Promise<Product | null> {
  // includeVariations is passed explicitly: the backend's default is the boolean `true`
  // but its guard also accepts the string form, and relying on a server-side default we
  // cannot see from here is how variations went missing (and prices went wrong) before.
  const url = `${BACKEND}/api/products/${id}?includeVariations=true`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`[fetchProductById] ${res.status} from ${url}`);
      return null;
    }
    const body = await res.json();
    const productData: ApiProductDetail = body?.data ?? body;

    // Map reviews if available
    const reviews =
      productData.reviews?.map((r) => ({
        id: String(r.id),
        author: r.author,
        location: r.location,
        date: r.date,
        rating: r.rating,
        title: r.title ?? null,
        text: r.text,
        verified: r.verified ?? false,
      })) ?? [];

    const mappedVariants = mapVariants(productData);

    const product = mapApiProduct(productData, resolveCategoryName(productData));

    // Build images for detail page: mainImage first (full-res), then additionalImages
    const mainImage = productData.mainImage;
    const additionalImages = productData.additionalImages ?? [];
    const detailImages = [
      ...(mainImage ? [mainImage] : product.images),
      ...additionalImages.filter((u) => u !== mainImage),
    ];
    const mergedImages = detailImages.length > 0 ? detailImages : product.images;

    // `specs` comes back null on every product measured, so mapApiProduct's
    // attribute-derived table is the real source. Authored specs still win when
    // the backend starts sending them.
    const authoredSpecs = productData.specs ?? {};

    return {
      ...product,
      images: mergedImages,
      specs: Object.keys(authoredSpecs).length > 0 ? authoredSpecs : product.specs,
      variants: mappedVariants,
      variations: mapVariations(productData.variations),
      reviews,
      whereUsed: productData.whereUsed,
      keyFeatures: sanitizeKeyFeatures(productData.keyFeatures) ?? undefined,
    };
  } catch (err) {
    console.error(`[fetchProductById] failed to reach ${url}:`, err);
    return null;
  }
}

// Fetch related products by category
export async function fetchRelatedProducts(
  categoryId: number,
  excludeId: number,
  limit: number = 4,
): Promise<Product[]> {
  if (!categoryId) return [];

  const { products: apiProducts } = await fetchProducts({
    categoryId,
    limit: limit + 1, // Fetch extra in case we need to exclude current product
  });

  // Filter out the current product
  const filtered = apiProducts
    .filter((p) => p.id !== excludeId)
    .slice(0, limit);

  return filtered.map((p) => mapApiProduct(p));
}
