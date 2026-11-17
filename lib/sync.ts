import "server-only";
import { adminClient } from "./supabase";
import { getShopeeOffer, isShopeeConfigured } from "./providers/shopee";
import { isYoutubeConfigured, searchReviewVideos } from "./providers/youtube";
import type { Offer, Product } from "./types";

const VIDEO_REFRESH_DAYS = 7;

/** บันทึกราคาลง price_history ถ้าราคาเปลี่ยน */
export async function recordPrice(offerId: string, oldPrice: number | null, newPrice: number | null) {
  if (newPrice == null || Number(oldPrice) === Number(newPrice)) return;
  await adminClient().from("price_history").insert({ offer_id: offerId, price: newPrice });
}

/** อัปเดตราคา offer ที่มาจาก API (is_auto) */
export async function syncOfferPrices(productId?: string) {
  if (!isShopeeConfigured) return { updated: 0, skipped: "shopee not configured" };
  const db = adminClient();
  let query = db.from("offers").select("*").eq("is_auto", true).eq("store", "shopee").not("external_id", "is", null);
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) throw error;

  let updated = 0;
  for (const offer of (data ?? []) as Offer[]) {
    try {
      const fresh = await getShopeeOffer(offer.external_id!);
      const now = new Date().toISOString();
      if (!fresh) {
        await db.from("offers").update({ in_stock: false, last_synced_at: now }).eq("id", offer.id);
        continue;
      }
      await db
        .from("offers")
        .update({
          price: fresh.price,
          original_price: fresh.original_price,
          rating: fresh.rating,
          sold_count: fresh.sold_count,
          commission_rate: fresh.commission_rate,
          affiliate_url: fresh.affiliate_url,
          in_stock: true,
          last_synced_at: now,
        })
        .eq("id", offer.id);
      await recordPrice(offer.id, offer.price, fresh.price);
      updated++;
    } catch (e) {
      console.error(`sync offer ${offer.id} failed`, e);
    }
  }
  return { updated };
}

/** ค้นรีวิวจาก YouTube แล้วเก็บลง DB (ไม่ทับค่า is_pinned/is_hidden ที่แอดมินตั้งไว้) */
export async function syncProductVideos(product: Pick<Product, "id" | "name" | "youtube_keyword">) {
  if (!isYoutubeConfigured) return { added: 0, skipped: "youtube not configured" };
  const db = adminClient();
  const videos = await searchReviewVideos(product.youtube_keyword || `รีวิว ${product.name}`);
  if (videos.length) {
    const { error } = await db
      .from("videos")
      .upsert(videos.map((v) => ({ ...v, product_id: product.id })), { onConflict: "product_id,youtube_id" });
    if (error) throw error;
  }
  await db.from("products").update({ videos_synced_at: new Date().toISOString() }).eq("id", product.id);
  return { added: videos.length };
}

/** งานรายวันจาก Vercel Cron */
export async function runDailySync() {
  const prices = await syncOfferPrices();

  // search.list กินโควตา 100 หน่วย/ครั้ง จึงทำทีละไม่เกิน 20 สินค้าต่อวัน
  const staleBefore = new Date(Date.now() - VIDEO_REFRESH_DAYS * 86400_000).toISOString();
  const { data: stale } = await adminClient()
    .from("products")
    .select("id, name, youtube_keyword")
    .eq("is_active", true)
    .or(`videos_synced_at.is.null,videos_synced_at.lt.${staleBefore}`)
    .limit(20);

  let videoProducts = 0;
  for (const p of stale ?? []) {
    try {
      await syncProductVideos(p);
      videoProducts++;
    } catch (e) {
      console.error(`sync videos ${p.id} failed`, e);
    }
  }
  return { prices, videoProducts };
}
