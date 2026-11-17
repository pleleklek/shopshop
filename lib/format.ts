const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 });

export const formatPrice = (n: number | null | undefined) => (n == null ? "-" : baht.format(n));
export const formatCompact = (n: number | null | undefined) => (n == null ? "-" : compact.format(n));

export function discountPercent(price: number | null, original: number | null) {
  if (!price || !original || original <= price) return null;
  return Math.round((1 - price / original) * 100);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9฀-๿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ShopShop";
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
