import { discountPercent, formatCompact, formatPrice } from "@/lib/format";
import type { Offer } from "@/lib/types";
import { StoreBadge } from "./StoreBadge";

export function PriceTable({ offers }: { offers: Offer[] }) {
  if (!offers.length) return <p className="text-slate-500 text-sm">ยังไม่มีร้านค้าสำหรับสินค้านี้</p>;
  const best = offers.find((o) => o.in_stock && o.price != null);

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {offers.map((o) => {
        const isBest = o.id === best?.id;
        const off = discountPercent(o.price, o.original_price);
        return (
          <li key={o.id} className={`flex flex-wrap items-center gap-3 p-4 ${isBest ? "bg-orange-50" : ""}`}>
            <div className="flex-1 min-w-48 space-y-1">
              <div className="flex items-center gap-2">
                <StoreBadge store={o.store} />
                {isBest && <span className="text-xs font-bold text-green-700">ถูกที่สุด</span>}
                {!o.in_stock && <span className="text-xs text-red-600">สินค้าหมด</span>}
              </div>
              <p className="text-sm text-slate-700">{o.shop_name}</p>
              <p className="text-xs text-slate-500">
                {o.rating != null && <>★ {Number(o.rating).toFixed(1)} · </>}
                {o.sold_count != null && <>ขายแล้ว {formatCompact(o.sold_count)} ชิ้น</>}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${isBest ? "text-orange-600" : ""}`}>{formatPrice(o.price)}</p>
              {off && (
                <p className="text-xs">
                  <span className="line-through text-slate-400">{formatPrice(o.original_price)}</span>{" "}
                  <span className="text-red-600">-{off}%</span>
                </p>
              )}
            </div>
            <a
              href={`/go/${o.id}`}
              target="_blank"
              rel="nofollow sponsored noopener"
              className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white ${isBest ? "bg-orange-600 hover:bg-orange-700" : "bg-slate-800 hover:bg-slate-900"}`}
            >
              ไปที่ร้าน
            </a>
          </li>
        );
      })}
    </ul>
  );
}
