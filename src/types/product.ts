/**
 * Product-related TypeScript definitions
 */

export interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  tag: string;
  rating?: number;
  originalPrice?: string;
  discount?: number;
  color?: string;
}

export interface ProductVariant {
  variantId: number;
  sizes: string[];
  colors: string[];
  stock: number;
}

export interface ProductDetails {
  id: number;
  name: string;
  price: number;
  image: string;
  tag?: string;
  rating?: number;
  description?: string;
  details?: string;
  features?: string;
  originalPrice?: number;
  discountPercentage?: number;
  date?: string;
  category?: { id: number; name: string };
  images: string[];
  variants: ProductVariant[];
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  alt?: string;
  poster?: string;
  embedUrl?: string;
}

export interface Review {
  id: number;
  name?: string;
  user?: { name: string };
  rating: number;
  title: string;
  body: string;
  date?: string;
  verified?: boolean;
}

export interface RatingSummary {
  average: number;
  total: number;
}

export interface DeliveryFeature {
  icon: React.ReactNode;
  label: string;
  sub: string;
}

export interface Offer {
  info: string;
  code: string;
}

export interface SizeGuideRow {
  size: string;
  width: string;
  depth: string;
  height: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
  variantId?: number;
}

export type StockState = 'out' | 'critical' | 'low' | 'in';

export type CountdownUnits = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};
