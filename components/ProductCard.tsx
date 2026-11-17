import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/p/${product.slug}`} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
      <div className="aspect-square bg-slate-100">
        {product.image_url && <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-orange-600">{product.name}</h3>
        <p className="text-orange-600 font-bold">
          {product.min_price != null ? <>เริ่ม {formatPrice(product.min_price)}</> : "ยังไม่มีราคา"}
        </p>
        <p className="text-xs text-slate-500">เทียบ {product.store_count} ร้าน</p>
      </div>
    </Link>
  );
}
