import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PriceTable } from "@/components/PriceTable";
import { VideoReviews } from "@/components/VideoReviews";
import { getProductBySlug } from "@/lib/data";
import { formatPrice, siteUrl } from "@/lib/format";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(decodeURIComponent((await params).slug));
  if (!product) return {};
  const best = product.offers.find((o) => o.in_stock && o.price != null);
  const title = `${product.name} ราคาถูกสุด ${best ? formatPrice(best.price) : ""} + รีวิว`;
  return {
    title,
    description: `เปรียบเทียบราคา ${product.name} จาก ${product.offers.length} ร้าน พร้อมรีวิวจาก YouTube`,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { title, images: product.image_url ? [product.image_url] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(decodeURIComponent((await params).slug));
  if (!product) notFound();

  const inStock = product.offers.filter((o) => o.in_stock && o.price != null);
  const best = inStock[0];
  const prices = inStock.map((o) => Number(o.price));
  const saving = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;

  // Structured data ให้ Google แสดงช่วงราคาในผลค้นหา
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.image_url ?? undefined,
    description: product.description ?? undefined,
    url: `${siteUrl}/p/${product.slug}`,
    ...(prices.length && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "THB",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: prices.length,
      },
    }),
  };

  return (
    <article className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden">
          {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
        </div>
        <div className="space-y-3">
          {product.brand && <p className="text-sm text-slate-500">{product.brand}</p>}
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {best && (
            <div className="rounded-xl bg-white border border-orange-200 p-4 space-y-2">
              <p className="text-sm text-slate-600">ราคาถูกสุดตอนนี้</p>
              <p className="text-3xl font-bold text-orange-600">{formatPrice(best.price)}</p>
              {saving > 0 && <p className="text-sm text-green-700">ประหยัดได้สูงสุด {formatPrice(saving)} เมื่อเทียบกับร้านที่แพงที่สุด</p>}
              <a
                href={`/go/${best.id}`}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="inline-block rounded-lg bg-orange-600 hover:bg-orange-700 px-6 py-3 font-medium text-white"
              >
                สั่งซื้อราคานี้
              </a>
            </div>
          )}
          {product.description && <p className="text-slate-700 whitespace-pre-line">{product.description}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">เปรียบเทียบราคา {product.offers.length} ร้าน</h2>
        <PriceTable offers={product.offers} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">รีวิวจาก YouTube</h2>
        <VideoReviews videos={product.videos} />
      </section>
    </article>
  );
}
