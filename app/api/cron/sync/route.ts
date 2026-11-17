import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/supabase";
import { runDailySync } from "@/lib/sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Vercel Cron เรียกทุกวัน (ดู vercel.json) พร้อม header Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (isDemoMode) return NextResponse.json({ skipped: "demo mode" });
  return NextResponse.json(await runDailySync());
}
