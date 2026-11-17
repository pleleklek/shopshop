export type Store = "shopee" | "lazada" | "tiktok" | "other";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  youtube_keyword: string | null;
  is_active: boolean;
  videos_synced_at: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  product_id: string;
  store: Store;
  external_id: string | null;
  title: string | null;
  shop_name: string | null;
  image_url: string | null;
  product_url: string;
  affiliate_url: string | null;
  price: number | null;
  original_price: number | null;
  rating: number | null;
  sold_count: number | null;
  commission_rate: number | null;
  in_stock: boolean;
  is_auto: boolean;
  last_synced_at: string | null;
}

export interface Video {
  id: string;
  product_id: string;
  youtube_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  view_count: number | null;
  is_pinned: boolean;
  is_hidden: boolean;
}

export interface ProductDetail extends Product {
  offers: Offer[];
  videos: Video[];
}

export interface ProductSummary extends Product {
  min_price: number | null;
  max_price: number | null;
  store_count: number;
}

/** ข้อมูลสินค้าที่ได้จาก affiliate API ก่อนบันทึกลง DB */
export type ExternalOffer = Omit<Offer, "id" | "product_id" | "in_stock" | "is_auto" | "last_synced_at">;

export type VideoInput = Omit<Video, "id" | "product_id" | "is_pinned" | "is_hidden">;
