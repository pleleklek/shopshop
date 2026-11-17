import { after, NextResponse, type NextRequest } from "next/server";
import { DEMO_PRODUCTS } from "@/lib/demo";
import { adminClient, isDemoMode } from "@/lib/supabase";

// /go/<offerId> -> บันทึกคลิก แล้ว redirect ไปลิงก์ affiliate
// ใช้ลิงก์ภายในแทนลิงก์ร้านตรงๆ จะได้นับคลิกได้ และเปลี่ยนลิงก์ทีหลังได้โดยไม่ต้องแก้หน้าเว็บ

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeRedirect(url: string | null | undefined, req: NextRequest) {
  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.redirect(url, 302);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;

  if (isDemoMode) {
    const offer = DEMO_PRODUCTS.flatMap((p) => p.offers).find((o) => o.id === offerId);
    return safeRedirect(offer?.affiliate_url || offer?.product_url, req);
  }
  if (!UUID.test(offerId)) return safeRedirect(null, req);

  const db = adminClient();
  const { data: offer } = await db.from("offers").select("id, product_id, store, product_url, affiliate_url").eq("id", offerId).maybeSingle();
  if (!offer) return safeRedirect(null, req);

  after(async () => {
    await db.from("clicks").insert({
      offer_id: offer.id,
      product_id: offer.product_id,
      store: offer.store,
      referrer: req.headers.get("referer")?.slice(0, 500) ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
  });

  return safeRedirect(offer.affiliate_url || offer.product_url, req);
}
