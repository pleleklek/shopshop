import type { Offer, ProductDetail, Store } from "./types";

// ข้อมูลตัวอย่างสำหรับดูหน้าตาเว็บก่อนต่อ Supabase (ราคาสมมติ)
const now = new Date().toISOString();

function offer(productId: string, n: number, store: Store, price: number, original: number | null, shop: string, keyword: string): Offer {
  const q = encodeURIComponent(keyword);
  const searchUrl: Record<Store, string> = {
    shopee: `https://shopee.co.th/search?keyword=${q}`,
    lazada: `https://www.lazada.co.th/catalog/?q=${q}`,
    tiktok: `https://www.tiktok.com/search?q=${q}`,
    other: `https://www.google.com/search?q=${q}`,
  };
  return {
    id: `${productId}-o${n}`,
    product_id: productId,
    store,
    external_id: null,
    title: keyword,
    shop_name: shop,
    image_url: null,
    product_url: searchUrl[store],
    affiliate_url: null,
    price,
    original_price: original,
    rating: 4.8,
    sold_count: 1200 * n,
    commission_rate: null,
    in_stock: true,
    is_auto: false,
    last_synced_at: now,
  };
}

function product(id: string, slug: string, name: string, brand: string, category: string, description: string, prices: [Store, number, number | null, string][]): ProductDetail {
  return {
    id,
    slug,
    name,
    brand,
    category,
    image_url: `https://placehold.co/600x600/f1f5f9/334155?text=${encodeURIComponent(brand)}`,
    description,
    youtube_keyword: null,
    is_active: true,
    videos_synced_at: null,
    created_at: now,
    offers: prices.map(([store, price, original, shop], i) => offer(id, i + 1, store, price, original, shop, name)),
    videos: [],
  };
}

export const DEMO_PRODUCTS: ProductDetail[] = [
  product("demo-1", "xiaomi-robot-vacuum-x20", "Xiaomi Robot Vacuum X20", "Xiaomi", "เครื่องใช้ไฟฟ้า",
    "หุ่นยนต์ดูดฝุ่นถูพื้น ซักผ้าถูอัตโนมัติ เหมาะกับคอนโดและบ้าน", [
      ["shopee", 12990, 15990, "Xiaomi Official Store"],
      ["lazada", 13290, 15990, "Xiaomi Thailand"],
      ["tiktok", 12790, 15990, "Mi Home TH"],
    ]),
  product("demo-2", "sony-wh-1000xm5", "Sony WH-1000XM5", "Sony", "หูฟัง",
    "หูฟังตัดเสียงรบกวนระดับท็อป แบตอึด 30 ชั่วโมง", [
      ["shopee", 10990, 14990, "Sony Official"],
      ["lazada", 10490, 14990, "Sony Thailand"],
    ]),
  product("demo-3", "philips-air-fryer-hd9252", "Philips Air Fryer HD9252", "Philips", "เครื่องครัว",
    "หม้อทอดไร้น้ำมัน 4.1 ลิตร เทคโนโลยี Rapid Air", [
      ["shopee", 2590, 3990, "Philips Official"],
      ["lazada", 2690, 3990, "Philips Thailand"],
      ["other", 2790, null, "Power Buy"],
    ]),
];
