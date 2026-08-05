import type { Product } from "@/lib/types";
import { mapVariations } from "@/lib/variations";
import type {
  ApiCategory,
  ApiProduct,
  ApiProductDetail,
} from "./types";

const BACKEND = process.env.API_URL ?? "http://localhost:3000";

/**
 * Ceiling for the quantity stepper when the API gives no numeric stock but says the
 * product is in stock. Matches QuantityControl's own default.
 */
const DEFAULT_MAX_QTY = 99;

const PLACEHOLDER_IMAGE =
  "https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop";

/**
 * The API returns slug: null for every product, so product URLs are derived
 * from the name. Exported so the sitemap builds the exact same slugs that
 * findApiProductBySlug resolves — a divergent copy would emit 404s.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractImageUrl(img: string | { url: string }): string {
  return typeof img === "string" ? img : (img?.url ?? "");
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

  if (p.quantity != null) {
    const onHand = toNumber(p.quantity);
    const reserved = toNumber(p.reservedQuantity);
    // Negative stock exists in this catalogue (9 products measured 2026-08-04); clamp
    // so callers never see a negative max.
    return Math.max(0, onHand - reserved);
  }

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

  return {
    id: String(p.id),
    slug: p.slug ?? slugify(p.name),
    apiProductId: p.id,
    name: p.name,
    subtitle: p.description ?? "",
    category: categoryName ?? p.category?.name ?? "",
    badge: p.badge,
    price: toNumber(p.price),
    originalPrice: p.originalPrice != null ? toNumber(p.originalPrice) : undefined,
    discount: p.discount != null ? toNumber(p.discount) : undefined,
    rating: toNumber(p.rating),
    reviewCount: toNumber(p.reviewCount),
    sku: p.sku ?? "",
    stock: resolveStock(p),
    images,
    description: p.description ?? "",
    specs: {},
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
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  whereUsed?: string;
}): Promise<{ products: ApiProduct[]; total: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (params?.categoryId) qs.set("category", String(params.categoryId));
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

const getCatalog = (): Promise<ApiProduct[]> => {
  // Memoised on the module, not via React cache(): a build renders pages across
  // several worker processes and cache() is per-request, so it deduped nothing.
  // One in-flight promise per worker turns ~5000 requests into ~5 per worker.
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const limit = 250;
      const firstPage = await fetchProducts({ page: 1, limit });
      if (firstPage.products.length === 0) {
        catalogPromise = null; // let a transient failure be retried
        return [];
      }

      const rest: ApiProduct[] = [];
      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const { products } = await fetchProducts({ page, limit });
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

/** Slug → product, built once per process from the memoised catalog. */
let slugIndexPromise: Promise<Map<string, ApiProduct>> | null = null;

const getSlugIndex = (): Promise<Map<string, ApiProduct>> => {
  if (!slugIndexPromise) {
    slugIndexPromise = getCatalog()
      .then(catalog => {
        const index = new Map<string, ApiProduct>();
        for (const p of catalog) {
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

export async function findApiProductBySlug(
  slug: string,
): Promise<ApiProduct | null> {
  const index = await getSlugIndex();
  return index.get(slug.trim().toLowerCase()) ?? null;
}

// Split combined field values: "White+Golden", "White + Golden", "Black/Gold" -> ["White", "Golden"]
function splitValues(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[+/,]|\s&\s/)
    .map((s) => s.trim())
    .filter(Boolean);
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

// Dimension fields are inconsistent: some rows are pre-labelled ("D90mm", "H970mm"),
// others are bare numbers ("90", "1270"). Normalise to a labelled, united string.
function formatDimension(prefix: "D" | "H", raw?: string): string {
  const value = raw?.trim();
  if (!value) return "";
  // Already carries a letter/unit — trust it as authored.
  if (/[a-z]/i.test(value)) return value;
  return `${prefix}${value}mm`;
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
      ? [
          [
            formatDimension("D", p.diameter),
            formatDimension("H", p.productHeight),
          ]
            .filter(Boolean)
            .join(" "),
        ]
      : []),
  ].map((s) => s.trim()).filter(Boolean));

  // Finish = colour/material treatment of the body.
  const finishes = dedupe([
    ...(p.availableColors ?? []),
    ...(attrs.colors ?? []),
    ...splitValues(p.bodyColors),
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
        text: r.text,
        verified: r.verified ?? false,
      })) ?? [];

    const mappedVariants = mapVariants(productData);

    const product = mapApiProduct(productData, productData.category?.name);

    // Build images for detail page: mainImage first (full-res), then additionalImages
    const mainImage = productData.mainImage;
    const additionalImages = productData.additionalImages ?? [];
    const detailImages = [
      ...(mainImage ? [mainImage] : product.images),
      ...additionalImages.filter((u) => u !== mainImage),
    ];
    const mergedImages = detailImages.length > 0 ? detailImages : product.images;

    return {
      ...product,
      images: mergedImages,
      specs: productData.specs ?? {},
      variants: mappedVariants,
      variations: mapVariations(productData.variations),
      reviews,
      whereUsed: productData.whereUsed,
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
