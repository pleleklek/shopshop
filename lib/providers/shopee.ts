import "server-only";
import crypto from "node:crypto";
import type { ExternalOffer } from "../types";

// Shopee Affiliate Open API (GraphQL)
// เอกสาร: affiliate.shopee.co.th -> Open API  (ต้องสมัคร Shopee Affiliate และขอ AppID/Secret)
const ENDPOINT = process.env.SHOPEE_AFFILIATE_ENDPOINT || "https://open-api.affiliate.shopee.co.th/graphql";
const APP_ID = process.env.SHOPEE_APP_ID;
const SECRET = process.env.SHOPEE_APP_SECRET;

export const isShopeeConfigured = Boolean(APP_ID && SECRET);

interface ShopeeNode {
  itemId: number;
  shopId: number;
  productName: string;
  shopName: string | null;
  imageUrl: string | null;
  price: string | null;
  priceMin: string | null;
  priceDiscountRate: number | null;
  ratingStar: string | null;
  sales: number | null;
  commissionRate: string | null;
  productLink: string;
  offerLink: string;
}

const NODE_FIELDS = "itemId shopId productName shopName imageUrl price priceMin priceDiscountRate ratingStar sales commissionRate productLink offerLink";

async function gql<T>(query: string): Promise<T> {
  if (!APP_ID || !SECRET) throw new Error("ยังไม่ได้ตั้งค่า SHOPEE_APP_ID / SHOPEE_APP_SECRET");
  const payload = JSON.stringify({ query });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash("sha256").update(`${APP_ID}${timestamp}${payload}${SECRET}`).digest("hex");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
    },
    body: payload,
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) throw new Error(`Shopee API: ${json.errors?.[0]?.message ?? res.statusText}`);
  return json.data as T;
}

function toOffer(n: ShopeeNode): ExternalOffer {
  const price = Number(n.priceMin ?? n.price) || null;
  const rate = n.priceDiscountRate ?? 0;
  return {
    store: "shopee",
    external_id: `${n.shopId}:${n.itemId}`,
    title: n.productName,
    shop_name: n.shopName,
    image_url: n.imageUrl,
    product_url: n.productLink,
    affiliate_url: n.offerLink,
    price,
    original_price: price && rate > 0 && rate < 100 ? Math.round(price / (1 - rate / 100)) : null,
    rating: n.ratingStar ? Number(n.ratingStar) : null,
    sold_count: n.sales,
    commission_rate: n.commissionRate ? Number(n.commissionRate) : null,
  };
}

/** ค้นหาสินค้าด้วยคีย์เวิร์ด (sortType 2 = ขายดี) */
export async function searchShopee(keyword: string, limit = 12): Promise<ExternalOffer[]> {
  // JSON.stringify ให้ string literal ที่ escape แล้ว ใช้ใน GraphQL ได้
  const data = await gql<{ productOfferV2: { nodes: ShopeeNode[] } }>(
    `{ productOfferV2(keyword: ${JSON.stringify(keyword)}, sortType: 2, page: 1, limit: ${Math.min(limit, 50)}) { nodes { ${NODE_FIELDS} } } }`,
  );
  return data.productOfferV2.nodes.map(toOffer);
}

/** ดึงราคาล่าสุดของสินค้าชิ้นเดียว external_id = "<shopId>:<itemId>" */
export async function getShopeeOffer(externalId: string): Promise<ExternalOffer | null> {
  const m = /^(\d+):(\d+)$/.exec(externalId);
  if (!m) return null;
  const data = await gql<{ productOfferV2: { nodes: ShopeeNode[] } }>(
    `{ productOfferV2(shopId: ${m[1]}, itemId: ${m[2]}, page: 1, limit: 1) { nodes { ${NODE_FIELDS} } } }`,
  );
  const node = data.productOfferV2.nodes[0];
  return node ? toOffer(node) : null;
}
