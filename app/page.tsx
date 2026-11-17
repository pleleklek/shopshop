import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listCategories, listProducts } from "@/lib/data";
import { isDemoMode } from "@/lib/supabase";

export const revalidate = 600;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q, cat } = await searchParams;
  const [products, categories] = await Promise.all([listProducts(q, cat), listCategories()]);

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <p className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          โหมดเดโม: ยังไม่ได้ตั้งค่า Supabase ข้อมูลที่เห็นเป็นตัวอย่าง (ดู README.md)
        </p>
      )}

      <section className="space-y-2">
        <h1 className="text-2xl font-bold">{q ? `ผลการค้นหา “${q}”` : "เปรียบเทียบราคา ดูรีวิวก่อนซื้อ"}</h1>
        <p className="text-slate-600 text-sm">รวมราคาจาก Shopee, Lazada, TikTok Shop และรีวิวจาก YouTube ในหน้าเดียว</p>
      </section>

      {categories.length > 0 && (
        <nav className="flex flex-wrap gap-2">
          <Link href="/" className={`rounded-full px-3 py-1 text-sm border ${!cat ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-300"}`}>ทั้งหมด</Link>
          {categories.map((c) => (
            <Link key={c} href={`/?cat=${encodeURIComponent(c)}`} className={`rounded-full px-3 py-1 text-sm border ${cat === c ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-300"}`}>
              {c}
            </Link>
          ))}
        </nav>
      )}

      {products.length ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <p className="text-slate-500">ไม่พบสินค้า</p>
      )}
    </div>
  );
}
