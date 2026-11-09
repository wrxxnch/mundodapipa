export type Category = string;

export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
  order?: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  variation?: string;
  comment: string;
  costBenefit?: string;
  resemblance?: string;
  security?: string;
  sellerReply?: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  videoUrl?: string;
  videos?: string[];
  description: string;
  specs: string[];
  inStock: boolean;
  stockQuantity?: number;
  shopeeUrl: string;
  badge?: string;
  rating: number;
  salesCount?: number;
  reviews?: ProductReview[];
  createdAt?: string;
  updatedAt?: string;
}

export type SortOption = 'newest' | 'relevance' | 'sales' | 'price-asc' | 'price-desc' | 'rating';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Post {
  id: string;
  title?: string;
  content: string;
  author?: string;
  authorId?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string; // e.g. "PIPA10"
  discountPercent: number; // 1 to 100
  description?: string;
  active: boolean;
  showOnSite?: boolean; // whether to show/highlight this coupon on the site (Hero promo & cart)
  appliesToAll: boolean; // true = all items in catalog
  applicableProductIds: string[]; // IDs of products if appliesToAll is false
  createdAt?: string;
  updatedAt?: string;
}

