"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/format";
import { getShopeeOffer } from "@/lib/providers/shopee";
import { isStore } from "@/lib/stores";
import { adminClient } from "@/lib/supabase";
import { recordPrice, syncOfferPrices, syncProductVideos } from "@/lib/sync";

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v || null;
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v == null || isNaN(Number(v)) ? null : Number(v);
};

async function slugOf(productId: string) {
  const { data } = await adminClient().from("products").select("slug").eq("id", productId).single();
  return data?.slug as string | undefined;
}

function revalidateProduct(slug?: string) {
  revalidatePath("/");
  if (slug) revalidatePath(`/p/${slug}`);
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ---------- products ----------

export async function saveProduct(form: FormData) {
  const id = str(form, "id");
  const name = str(form, "name");
  if (!name) throw new Error("กรุณาใส่ชื่อสินค้า");
  const row = {
    name,
    slug: slugify(str(form, "slug") ?? name),
    brand: str(form, "brand"),
    category: str(form, "category"),
    image_url: str(form, "image_url"),
    description: str(form, "description"),
    youtube_keyword: str(form, "youtube_keyword"),
    is_active: form.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };
  const db = adminClient();
  if (id) {
    const oldSlug = await slugOf(id);
    fail((await db.from("products").update(row).eq("id", id)).error);
    revalidateProduct(oldSlug);
    revalidateProduct(row.slug);
    revalidatePath(`/admin/products/${id}`);
    return;
  }
  const { data, error } = await db.from("products").insert(row).select("id").single();
  fail(error);
  revalidateProduct(row.slug);
  redirect(`/admin/products/${data!.id}`);
}

export async function deleteProduct(form: FormData) {
  const id = str(form, "id")!;
  const slug = await slugOf(id);
  fail((await adminClient().from("products").delete().eq("id", id)).error);
  revalidateProduct(slug);
  redirect("/admin");
}

// ---------- offers ----------

/** เพิ่ม/แก้ร้านค้าแบบกรอกเอง (Lazada, TikTok หรือร้านที่ยังไม่มี API) */
export async function saveOffer(form: FormData) {
  const productId = str(form, "product_id")!;
  const id = str(form, "id");
  const store = str(form, "store") ?? "other";
  const productUrl = str(form, "product_url");
  if (!isStore(store) || !productUrl) throw new Error("ข้อมูลร้านค้าไม่ครบ");

  const row = {
    product_id: productId,
    store,
    title: str(form, "title"),
    shop_name: str(form, "shop_name"),
    product_url: productUrl,
    affiliate_url: str(form, "affiliate_url"),
    price: num(form, "price"),
    original_price: num(form, "original_price"),
    in_stock: form.get("in_stock") === "on",
    last_synced_at: new Date().toISOString(),
  };
  const db = adminClient();
  if (id) {
    const { data: old } = await db.from("offers").select("price").eq("id", id).single();
    fail((await db.from("offers").update(row).eq("id", id)).error);
    await recordPrice(id, old?.price ?? null, row.price);
  } else {
    const { data, error } = await db.from("offers").insert({ ...row, is_auto: false }).select("id").single();
    fail(error);
    await recordPrice(data!.id, null, row.price);
  }
  revalidateProduct(await slugOf(productId));
  revalidatePath(`/admin/products/${productId}`);
}

/** ผูกสินค้า Shopee ที่ค้นเจอ เข้ากับสินค้าของเรา แล้วให้ cron อัปเดตราคาให้อัตโนมัติ */
export async function attachShopeeOffer(form: FormData) {
  const productId = str(form, "product_id")!;
  const externalId = str(form, "external_id")!;
  const fresh = await getShopeeOffer(externalId);
  if (!fresh) throw new Error("ไม่พบสินค้านี้ใน Shopee Affiliate");

  const { data, error } = await adminClient()
    .from("offers")
    .upsert(
      { ...fresh, product_id: productId, is_auto: true, in_stock: true, last_synced_at: new Date().toISOString() },
      { onConflict: "product_id,store,external_id" },
    )
    .select("id")
    .single();
  fail(error);
  await recordPrice(data!.id, null, fresh.price);

  // ถ้าสินค้ายังไม่มีรูป ใช้รูปจาก Shopee
  await adminClient().from("products").update({ image_url: fresh.image_url }).eq("id", productId).is("image_url", null);

  revalidateProduct(await slugOf(productId));
  redirect(`/admin/products/${productId}`);
}

export async function deleteOffer(form: FormData) {
  const productId = str(form, "product_id")!;
  fail((await adminClient().from("offers").delete().eq("id", str(form, "id")!)).error);
  revalidateProduct(await slugOf(productId));
  revalidatePath(`/admin/products/${productId}`);
}

export async function refreshPrices(form: FormData) {
  const productId = str(form, "product_id")!;
  await syncOfferPrices(productId);
  revalidateProduct(await slugOf(productId));
  revalidatePath(`/admin/products/${productId}`);
}

// ---------- videos ----------

export async function refreshVideos(form: FormData) {
  const productId = str(form, "product_id")!;
  const { data: product, error } = await adminClient().from("products").select("id, name, slug, youtube_keyword").eq("id", productId).single();
  fail(error);
  await syncProductVideos(product!);
  revalidateProduct(product!.slug);
  revalidatePath(`/admin/products/${productId}`);
}

export async function toggleVideo(form: FormData) {
  const productId = str(form, "product_id")!;
  const field = str(form, "field");
  if (field !== "is_pinned" && field !== "is_hidden") return;
  fail((await adminClient().from("videos").update({ [field]: form.get("value") === "true" }).eq("id", str(form, "id")!)).error);
  revalidateProduct(await slugOf(productId));
  revalidatePath(`/admin/products/${productId}`);
}
