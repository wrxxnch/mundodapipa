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

export interface StoryContent {
  badge: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  value1Title?: string;
  value1Desc?: string;
  value2Title?: string;
  value2Desc?: string;
  value3Title?: string;
  value3Desc?: string;
}


