export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
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
  categoryId: number;
  category?: ApiCategory;
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
 * dimensions, mainImage, additionalImages, arImages, sku, sortOrder, createdAt,
 * updatedAt, reservedQuantity) are returned but unused. See TODOS.md for trimming the
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
}

export interface ApiReview {
  id: number;
  author: string;
  location: string;
  date: string;
  rating: number;
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
