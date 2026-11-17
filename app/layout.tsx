import type { Metadata } from "next";
import Link from "next/link";
import { siteName, siteUrl } from "@/lib/format";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteName} — เปรียบเทียบราคา ดูรีวิวก่อนซื้อ`, template: `%s | ${siteName}` },
  description: "เปรียบเทียบราคาสินค้าจาก Shopee, Lazada, TikTok Shop พร้อมรีวิวจาก YouTube ช่วยให้ซื้อได้ถูกที่สุด",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700&display=swap" />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link href="/" className="font-bold text-lg text-orange-600">{siteName}</Link>
            <form action="/" className="flex-1 max-w-md">
              <input name="q" placeholder="ค้นหาสินค้า..." className="w-full rounded-full border border-slate-300 px-4 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
            </form>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-slate-200 bg-white text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 py-6 space-y-1">
            <p>เว็บไซต์นี้มีลิงก์ Affiliate หากคุณซื้อสินค้าผ่านลิงก์ เราอาจได้รับค่าคอมมิชชันโดยที่คุณไม่ต้องจ่ายเพิ่ม</p>
            <p>ราคาอาจเปลี่ยนแปลงได้ โปรดตรวจสอบราคาสุดท้ายที่หน้าร้านค้าก่อนชำระเงิน</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
