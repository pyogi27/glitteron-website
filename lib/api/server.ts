import type { Product } from "@/lib/types";
import type {
  ApiCategory,
  ApiProduct,
  ApiVariation,
  ApiProductDetail,
} from "./types";

const BACKEND = process.env.API_URL ?? "http://localhost:3000";

const PLACEHOLDER_IMAGE =
  "https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop";

function slugify(name: string): string {
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
    stock: toNumber(p.stock),
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

export async function findApiProductBySlug(
  slug: string,
): Promise<ApiProduct | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const limit = 250;

  const matchesSlug = (p: ApiProduct): boolean => {
    const candidate = (p.slug ?? slugify(p.name)).trim().toLowerCase();
    return candidate === normalizedSlug;
  };

  const firstPage = await fetchProducts({ page: 1, limit });
  const firstMatch = firstPage.products.find(matchesSlug);
  if (firstMatch) return firstMatch;

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const { products } = await fetchProducts({ page, limit });
    const match = products.find(matchesSlug);
    if (match) return match;
  }

  return null;
}

// Map ApiVariation[] to Product's variant format
function mapVariations(variations: ApiVariation[] = []): Product["variants"] {
  const sizes: string[] = [];
  const finishes: string[] = [];
  const crystalTones: Array<{ name: string; hex: string }> = [];

  variations.forEach((v) => {
    if (v.type === "size" && !sizes.includes(v.value)) {
      sizes.push(v.value);
    } else if (v.type === "finish" && !finishes.includes(v.value)) {
      finishes.push(v.value);
    } else if (v.type === "color" || v.type === "tone") {
      if (!crystalTones.find((ct) => ct.name === v.value)) {
        crystalTones.push({
          name: v.value,
          hex: v.hex ?? "#E8E8E8",
        });
      }
    }
  });

  return { sizes, finishes, crystalTones };
}

// Fetch single product by ID with variations and specs
export async function fetchProductById(id: number): Promise<Product | null> {
  const url = `${BACKEND}/api/products/${id}`;
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

    // Fetch variations separately
    const variations = await fetchProductVariations(id);
    const mappedVariants = mapVariations(variations);

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
      reviews,
      whereUsed: productData.whereUsed,
    };
  } catch (err) {
    console.error(`[fetchProductById] failed to reach ${url}:`, err);
    return null;
  }
}

// Fetch variations for a product
export async function fetchProductVariations(
  productId: number,
): Promise<ApiVariation[]> {
  const url = `${BACKEND}/api/products/${productId}/variations`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.warn(`[fetchProductVariations] ${res.status} from ${url}`);
      return [];
    }
    const body = await res.json();
    const variations = extractArray<ApiVariation>(body, "data", "variations");
    console.log(
      `[fetchProductVariations] ${variations.length} variations for product ${productId}`,
    );
    return variations;
  } catch (err) {
    console.error(`[fetchProductVariations] failed to reach ${url}:`, err);
    return [];
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
