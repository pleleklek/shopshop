import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/data";
import { siteUrl } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({ url: `${siteUrl}/p/${p.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
