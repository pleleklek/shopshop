import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/data";
import { siteUrl } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ฐานข้อมูลยังไม่พร้อม (เช่นยังไม่ได้รัน schema.sql) ต้องไม่ทำให้ build ล้ม
  const products = await listProducts().catch((err) => {
    console.error("sitemap: โหลดสินค้าไม่ได้", err);
    return [];
  });
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({ url: `${siteUrl}/p/${p.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
