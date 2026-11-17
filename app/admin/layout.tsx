import Link from "next/link";
import { isShopeeConfigured } from "@/lib/providers/shopee";
import { isYoutubeConfigured } from "@/lib/providers/youtube";
import { isDemoMode } from "@/lib/supabase";

export const metadata = { title: "หลังบ้าน", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const status = [
    ["Supabase", !isDemoMode],
    ["Shopee API", isShopeeConfigured],
    ["YouTube API", isYoutubeConfigured],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/admin" className="font-bold">หลังบ้าน</Link>
        <span className="flex-1" />
        {status.map(([name, ok]) => (
          <span key={name} className={`rounded px-2 py-0.5 ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
            {name}: {ok ? "พร้อม" : "ยังไม่ตั้งค่า"}
          </span>
        ))}
      </div>
      {isDemoMode ? (
        <p className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm">ต้องตั้งค่า Supabase ใน .env.local ก่อนจึงจะใช้หลังบ้านได้ (ดู README.md)</p>
      ) : (
        children
      )}
    </div>
  );
}
