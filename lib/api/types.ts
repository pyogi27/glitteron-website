export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface ApiProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  category?: ApiCategory;
  stock: number;
  hasVariations: boolean;
  sku?: string;
  slug?: string;
  thumbnailImage?: string;
  arImages?: string;
  imageUrls?: string[];
  images?: Array<string | { url: string }>;
  rating?: number;
  reviewCount?: number;
  badge?: "new" | "sale" | "best";
  originalPrice?: number;
  discount?: number;
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
