import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreBadge } from "@/components/StoreBadge";
import { sortOffers } from "@/lib/data";
import { formatCompact, formatPrice } from "@/lib/format";
import { isShopeeConfigured, searchShopee } from "@/lib/providers/shopee";
import { STORE_KEYS, STORES } from "@/lib/stores";
import { adminClient } from "@/lib/supabase";
import type { ExternalOffer, Offer, ProductDetail, Video } from "@/lib/types";
import {
  attachShopeeOffer, deleteOffer, deleteProduct, refreshPrices, refreshVideos, saveOffer, saveProduct, toggleVideo,
} from "../../actions";
import { btnClass, btnDanger, btnPrimary, Card, Field, inputClass } from "../../ui";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ shopee?: string }> };

export default async function AdminProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { shopee } = await searchParams;

  const { data } = await adminClient().from("products").select("*, offers(*), videos(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const product = data as ProductDetail;
  const offers = sortOffers(product.offers);
  const videos = [...product.videos].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || (b.view_count ?? 0) - (a.view_count ?? 0));

  let shopeeResults: ExternalOffer[] = [];
  let shopeeError: string | null = null;
  if (shopee && isShopeeConfigured) {
    try {
      shopeeResults = await searchShopee(shopee);
    } catch (e) {
      shopeeError = (e as Error).message;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-slate-500">← สินค้าทั้งหมด</Link>
        <h1 className="text-xl font-bold flex-1">{product.name}</h1>
        <Link href={`/p/${product.slug}`} target="_blank" className="text-sm text-orange-700 hover:underline">ดูหน้าเว็บ</Link>
      </div>

      <Card title="ข้อมูลสินค้า">
        <form action={saveProduct} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={product.id} />
          <Field label="ชื่อสินค้า *"><input name="name" required defaultValue={product.name} className={inputClass} /></Field>
          <Field label="Slug"><input name="slug" defaultValue={product.slug} className={inputClass} /></Field>
          <Field label="แบรนด์"><input name="brand" defaultValue={product.brand ?? ""} className={inputClass} /></Field>
          <Field label="หมวดหมู่"><input name="category" defaultValue={product.category ?? ""} className={inputClass} /></Field>
          <Field label="URL รูปภาพ"><input name="image_url" defaultValue={product.image_url ?? ""} className={inputClass} /></Field>
          <Field label="คำค้นรีวิว YouTube (ว่าง = รีวิว + ชื่อสินค้า)"><input name="youtube_keyword" defaultValue={product.youtube_keyword ?? ""} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="รายละเอียด"><textarea name="description" rows={3} defaultValue={product.description ?? ""} className={inputClass} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={product.is_active} /> แสดงบนเว็บ</label>
          <div className="sm:col-span-2"><button className={btnPrimary}>บันทึก</button></div>
        </form>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button className={btnDanger}>ลบสินค้านี้</button>
        </form>
      </Card>

      <Card
        title={`ร้านค้า (${offers.length})`}
        actions={
          <form action={refreshPrices}>
            <input type="hidden" name="product_id" value={product.id} />
            <button className={btnClass} disabled={!isShopeeConfigured}>อัปเดตราคาจาก API ตอนนี้</button>
          </form>
        }
      >
        <ul className="space-y-2">
          {offers.map((o) => <OfferRow key={o.id} offer={o} />)}
        </ul>
        <details className="rounded border border-dashed border-slate-300 p-3">
          <summary className="cursor-pointer text-sm font-medium">+ เพิ่มร้านค้าแบบกรอกเอง (Lazada / TikTok / อื่นๆ)</summary>
          <OfferForm productId={product.id} />
        </details>
      </Card>

      <Card title="ค้นหาจาก Shopee Affiliate แล้วผูกกับสินค้านี้">
        {!isShopeeConfigured ? (
          <p className="text-sm text-slate-500">ตั้งค่า SHOPEE_APP_ID และ SHOPEE_APP_SECRET ก่อน</p>
        ) : (
          <>
            <form className="flex gap-2">
              <input name="shopee" defaultValue={shopee ?? product.name} className={inputClass} />
              <button className={btnClass}>ค้นหา</button>
            </form>
            {shopeeError && <p className="text-sm text-red-600">{shopeeError}</p>}
            <ul className="divide-y divide-slate-100">
              {shopeeResults.map((r) => {
                const attached = offers.some((o) => o.external_id === r.external_id);
                return (
                  <li key={r.external_id} className="flex items-center gap-3 py-2">
                    {r.image_url && <img src={r.image_url} alt="" className="w-14 h-14 rounded object-cover" />}
                    <div className="flex-1 text-sm">
                      <a href={r.product_url} target="_blank" rel="noopener" className="hover:underline line-clamp-2">{r.title}</a>
                      <p className="text-xs text-slate-500">
                        {r.shop_name} · ขายแล้ว {formatCompact(r.sold_count)} · ★ {r.rating ?? "-"}
                        {r.commission_rate != null && <> · ค่าคอม {(r.commission_rate * 100).toFixed(1)}%</>}
                      </p>
                    </div>
                    <b className="text-sm">{formatPrice(r.price)}</b>
                    {attached ? (
                      <span className="text-xs text-green-700">ผูกแล้ว</span>
                    ) : (
                      <form action={attachShopeeOffer}>
                        <input type="hidden" name="product_id" value={product.id} />
                        <input type="hidden" name="external_id" value={r.external_id!} />
                        <button className={btnPrimary}>ผูก</button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <Card
        title={`วิดีโอรีวิว YouTube (${videos.length})`}
        actions={
          <form action={refreshVideos}>
            <input type="hidden" name="product_id" value={product.id} />
            <button className={btnClass}>ค้นหารีวิวใหม่ (ใช้โควตา 100 หน่วย)</button>
          </form>
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => <VideoRow key={v.id} video={v} />)}
        </ul>
      </Card>
    </div>
  );
}

function OfferRow({ offer: o }: { offer: Offer }) {
  return (
    <li className="rounded border border-slate-200">
      <details>
        <summary className="flex flex-wrap items-center gap-3 p-3 cursor-pointer text-sm">
          <StoreBadge store={o.store} />
          <span className="flex-1 truncate">{o.shop_name ?? o.title}</span>
          {o.is_auto && <span className="text-xs text-blue-700">อัปเดตอัตโนมัติ</span>}
          {!o.in_stock && <span className="text-xs text-red-600">หมด</span>}
          <b>{formatPrice(o.price)}</b>
        </summary>
        <div className="border-t border-slate-200 p-3 space-y-3">
          <OfferForm productId={o.product_id} offer={o} />
          <form action={deleteOffer}>
            <input type="hidden" name="id" value={o.id} />
            <input type="hidden" name="product_id" value={o.product_id} />
            <button className={btnDanger}>ลบร้านนี้</button>
          </form>
        </div>
      </details>
    </li>
  );
}

function OfferForm({ productId, offer }: { productId: string; offer?: Offer }) {
  return (
    <form action={saveOffer} className="grid gap-3 sm:grid-cols-2 mt-3">
      <input type="hidden" name="product_id" value={productId} />
      {offer && <input type="hidden" name="id" value={offer.id} />}
      <Field label="ร้าน">
        <select name="store" defaultValue={offer?.store ?? "lazada"} className={inputClass}>
          {STORE_KEYS.map((s) => <option key={s} value={s}>{STORES[s].label}</option>)}
        </select>
      </Field>
      <Field label="ชื่อร้าน"><input name="shop_name" defaultValue={offer?.shop_name ?? ""} className={inputClass} /></Field>
      <Field label="ลิงก์สินค้า *"><input name="product_url" required type="url" defaultValue={offer?.product_url ?? ""} className={inputClass} /></Field>
      <Field label="ลิงก์ Affiliate (จาก Lazada Affiliate / Involve Asia / Accesstrade)"><input name="affiliate_url" type="url" defaultValue={offer?.affiliate_url ?? ""} className={inputClass} /></Field>
      <Field label="ราคา"><input name="price" type="number" step="0.01" defaultValue={offer?.price ?? ""} className={inputClass} /></Field>
      <Field label="ราคาก่อนลด"><input name="original_price" type="number" step="0.01" defaultValue={offer?.original_price ?? ""} className={inputClass} /></Field>
      <input type="hidden" name="title" value={offer?.title ?? ""} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="in_stock" defaultChecked={offer?.in_stock ?? true} /> มีของ</label>
      <div className="sm:col-span-2"><button className={btnPrimary}>{offer ? "บันทึก" : "เพิ่มร้าน"}</button></div>
    </form>
  );
}

function VideoRow({ video: v }: { video: Video }) {
  const toggle = (field: "is_pinned" | "is_hidden", label: string) => (
    <form action={toggleVideo}>
      <input type="hidden" name="id" value={v.id} />
      <input type="hidden" name="product_id" value={v.product_id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!v[field])} />
      <button className="text-xs underline">{label}</button>
    </form>
  );
  return (
    <li className={`space-y-1 ${v.is_hidden ? "opacity-40" : ""}`}>
      <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noopener">
        <img src={v.thumbnail_url ?? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt="" className="w-full aspect-video object-cover rounded" />
      </a>
      <p className="text-xs line-clamp-2">{v.title}</p>
      <p className="text-xs text-slate-500">{v.channel_title} · {formatCompact(v.view_count)} วิว</p>
      <div className="flex gap-3">
        {toggle("is_pinned", v.is_pinned ? "เลิกปักหมุด" : "ปักหมุด")}
        {toggle("is_hidden", v.is_hidden ? "แสดง" : "ซ่อน")}
      </div>
    </li>
  );
}
