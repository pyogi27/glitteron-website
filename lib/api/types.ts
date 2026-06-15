export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
}

// NOTE: The backend serializes numeric columns as strings (e.g. price "7800.00",
// stock via totalStock/quantity). Fields are widened to `number | string` and must
// be coerced with toNumber() before use. See mapApiProduct / mapRawProduct.
export interface ApiProduct {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  categoryId: number;
  category?: ApiCategory;
  stock: number | string;
  hasVariations: boolean;
  sku?: string;
  slug?: string;
  thumbnailImage?: string;
  mainImage?: string;
  arImages?: string;
  imageUrls?: string[];
  images?: Array<string | { url: string }>;
  rating?: number | string;
  reviewCount?: number | string;
  badge?: "new" | "sale" | "best";
  originalPrice?: number | string;
  discount?: number | string;
}

export interface ApiVariation {
  id: number;
  productId: number;
  type: "size" | "finish" | "color" | "tone";
  value: string;
  hex?: string;
  stock: number;
  price?: number;
  priceModifier?: number;
  sku?: string;
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
