import "server-only";
import { DEMO_PRODUCTS } from "./demo";
import { isDemoMode, publicClient } from "./supabase";
import type { Offer, ProductDetail, ProductSummary, Video } from "./types";

/** ร้านที่มีของ ราคาถูกสุดขึ้นก่อน */
export function sortOffers(offers: Offer[]) {
  return [...offers].sort((a, b) => {
    if (a.in_stock !== b.in_stock) return a.in_stock ? -1 : 1;
    return (a.price ?? Infinity) - (b.price ?? Infinity);
  });
}

/** ปักหมุดขึ้นก่อน แล้วเรียงตามยอดวิว */
export function sortVideos(videos: Video[]) {
  return videos
    .filter((v) => !v.is_hidden)
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || (b.view_count ?? 0) - (a.view_count ?? 0));
}

function summarize(p: Omit<ProductSummary, "min_price" | "max_price" | "store_count"> & { offers: Pick<Offer, "price" | "store" | "in_stock">[] }): ProductSummary {
  const { offers, ...rest } = p;
  const prices = offers.filter((o) => o.in_stock && o.price != null).map((o) => Number(o.price));
  return {
    ...rest,
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
    store_count: new Set(offers.map((o) => o.store)).size,
  };
}

export async function listProducts(q?: string, category?: string): Promise<ProductSummary[]> {
  if (isDemoMode) {
    const needle = q?.toLowerCase();
    return DEMO_PRODUCTS.filter((p) => (!needle || p.name.toLowerCase().includes(needle)) && (!category || p.category === category)).map(summarize);
  }
  let query = publicClient()
    .from("products")
    .select("*, offers(price, store, in_stock)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(summarize);
}

export async function listCategories(): Promise<string[]> {
  if (isDemoMode) return [...new Set(DEMO_PRODUCTS.map((p) => p.category!))];
  const { data, error } = await publicClient().from("products").select("category").not("category", "is", null);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.category as string))].sort();
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  let product: ProductDetail | null;
  if (isDemoMode) {
    product = DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  } else {
    const { data, error } = await publicClient().from("products").select("*, offers(*), videos(*)").eq("slug", slug).maybeSingle();
    if (error) throw error;
    product = data;
  }
  if (!product) return null;
  return { ...product, offers: sortOffers(product.offers), videos: sortVideos(product.videos) };
}
