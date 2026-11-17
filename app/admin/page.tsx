import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { adminClient } from "@/lib/supabase";
import { saveProduct } from "./actions";
import { btnPrimary, Card, Field, inputClass } from "./ui";

export default async function AdminHome() {
  const db = adminClient();
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [{ data: products }, { count: clicks30d }] = await Promise.all([
    db.from("products").select("id, name, slug, is_active, offers(price, in_stock), videos(id)").order("created_at", { ascending: false }),
    db.from("clicks").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">คลิกไปร้านค้า 30 วันล่าสุด: <b>{clicks30d ?? 0}</b> ครั้ง</p>

      <Card title="เพิ่มสินค้าใหม่">
        <form action={saveProduct} className="grid gap-3 sm:grid-cols-2">
          <Field label="ชื่อสินค้า *"><input name="name" required className={inputClass} /></Field>
          <Field label="Slug (ว่างไว้ = สร้างจากชื่อ)"><input name="slug" className={inputClass} /></Field>
          <Field label="แบรนด์"><input name="brand" className={inputClass} /></Field>
          <Field label="หมวดหมู่"><input name="category" className={inputClass} /></Field>
          <input type="hidden" name="is_active" value="on" />
          <div className="sm:col-span-2"><button className={btnPrimary}>สร้างสินค้า แล้วไปเพิ่มร้านค้า</button></div>
        </form>
      </Card>

      <Card title={`สินค้าทั้งหมด (${products?.length ?? 0})`}>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-1">สินค้า</th><th>ร้าน</th><th>ถูกสุด</th><th>วิดีโอ</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products?.map((p) => {
              const prices = p.offers.filter((o) => o.in_stock && o.price != null).map((o) => Number(o.price));
              return (
                <tr key={p.id}>
                  <td className="py-2">
                    <Link href={`/admin/products/${p.id}`} className="text-orange-700 hover:underline">{p.name}</Link>
                    {!p.is_active && <span className="ml-2 text-xs text-slate-400">(ซ่อน)</span>}
                  </td>
                  <td>{p.offers.length}</td>
                  <td>{prices.length ? formatPrice(Math.min(...prices)) : "-"}</td>
                  <td>{p.videos.length}</td>
                  <td className="text-right"><Link href={`/p/${p.slug}`} target="_blank" className="text-slate-500 hover:underline">ดูหน้าเว็บ</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
