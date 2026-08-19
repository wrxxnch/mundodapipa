export type Category = 'todos' | 'pipas' | 'linhas' | 'rabiolas' | 'varetas' | 'kits';

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
}

export interface CartItem {
  product: Product;
  quantity: number;
}

