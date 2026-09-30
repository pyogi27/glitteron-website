export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  /** Absolute S3 URL, or null when no image has been uploaded. */
  image?: string | null;
  productCount?: number;
}

// NOTE: The backend serializes numeric columns as strings (e.g. price "7800.00").
// Fields are widened to `number | string` and must be coerced with toNumber() before
// use. See mapApiProduct / mapRawProduct. Stock needs special handling — see the
// comment on the quantity/totalStock fields below.
export interface ApiProduct {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  /**
   * The category is reported as `category` holding the id AS A STRING ("5"), on
   * both the list and detail endpoints. There is no `categoryId` key on the wire
   * — it was declared here as a required number, so `p.categoryId` was undefined
   * for every product and `categoryMap.get(p.categoryId)` resolved to undefined
   * site-wide. That is why Product.category was an empty string on every page
   * and every Product JSON-LD block shipped `"category": ""`.
   *
   * Verified 2026-08-08 on GET /api/products and GET /api/products/1557.
   * Use categoryIdOf() / resolveCategoryName() in server.ts rather than reading
   * either field directly — the object form is kept only in case the backend
   * starts embedding it.
   */
  categoryId?: number;
  category?: string | number | ApiCategory;
  /**
   * Stock is reported under several names and NOT as `stock` — that field does not
   * exist on the wire. Verified 2026-08-04 on GET /api/products/1390, which returns
   * `quantity: 15, totalStock: 15, inStock: true` and no `stock` key at all.
   *
   *   quantity          the product row's own stock
   *   totalStock        sum across variations when hasVariations, else = quantity
   *   inStock           backend's own boolean verdict
   *   reservedQuantity  held by pending payments; available = quantity - reserved
   *
   * Reading a non-existent `stock` field silently yielded 0 for every product, which
   * disabled the quantity stepper site-wide. Use resolveStock() in server.ts.
   */
  quantity?: number | string;
  totalStock?: number | string;
  reservedQuantity?: number | string;
  inStock?: boolean;
  hasVariations: boolean;
  sku?: string;
  slug?: string;
  thumbnailImage?: string;
  mainImage?: string;
  arImages?: string;
  lightOnImage?: string;
  imageUrls?: string[];
  images?: Array<string | { url: string }>;
  rating?: number | string;
  reviewCount?: number | string;
  badge?: "new" | "sale" | "best";
  originalPrice?: number | string;
  discount?: number | string;
}

/**
 * A row from the backend `ProductVariations` table, as returned by
 * `GET /api/products/:id?includeVariations=true`.
 *
 * This is a WIDE row (~20 columns), not an attribute tuple. Only the fields the
 * storefront actually reads are declared here; the rest (material, wattage, weight,
 * dimensions, arImages, sku, sortOrder, createdAt, updatedAt, reservedQuantity) are
 * returned but unused. See TODOS.md for trimming the
 * payload server-side.
 *
 *   size + color together identify the variation the shopper picked.
 *   price is the AUTHORITATIVE price for that variation and may differ from the
 *   parent product's price — 58% of variation products diverge (measured 2026-08-04).
 */
export interface ApiVariation {
  id: number;
  productId: number;
  name?: string;
  size?: string | null;
  color?: string | null;
  price: number | string;
  quantity?: number;
  inStock?: boolean;
  isActive?: boolean;
  // Per-variation photography. Verified 2026-09-30 on GET /api/products/1337: every
  // row carries these keys; additionalImages is an array (often empty).
  mainImage?: string | null;
  additionalImages?: string[] | null;
  lightOnImage?: string | null;
}

export interface ApiReview {
  id: number | string;
  author: string;
  location: string;
  date: string;
  rating: number;
  title?: string | null;
  text: string;
  verified: boolean;
}

export interface ApiProductDetail extends ApiProduct {
  variations?: ApiVariation[];
  specs?: Record<string, string>;
  reviews?: ApiReview[];
  whereUsed?: string;
  additionalImages?: string[];
  mainImage?: string;
  // Denormalised variant summaries the backend also returns. These are convenient for
  // rendering selectors but carry NO ids and NO per-variation prices — use `variations`
  // above for anything that touches money.
  availableSizes?: string[];
  availableColors?: string[];
  availableAttributes?: {
    colors?: string[];
    sizes?: string[];
    materials?: string[];
    wattages?: string[];
  } | null;
  bodyColors?: string;
  materials?: string;
  productHeight?: string;
  productWidth?: string;
  productLength?: string;
  diameter?: string;
  // Physical attributes both endpoints return but nothing read until the product
  // pages started generating copy from them. Coverage across the 1,028-product
  // catalogue as of 2026-08-08: materials 1003, lightSource 990, bodyColors 932,
  // productHeight 728, diameter 159, wattage 53.
  lightSource?: string | null;
  wattage?: string | number | null;
  weight?: string | null;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
