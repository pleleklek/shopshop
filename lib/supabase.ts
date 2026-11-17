import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** ยังไม่ได้ตั้งค่า Supabase = โหมดเดโม ใช้ข้อมูลจาก lib/demo.ts */
export const isDemoMode = !url || !anonKey;

let pub: SupabaseClient | null = null;
let admin: SupabaseClient | null = null;

/** อ่านข้อมูลหน้าเว็บ (ผ่าน RLS) */
export function publicClient() {
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  return (pub ??= createClient(url, anonKey, { auth: { persistSession: false } }));
}

/** เขียนข้อมูล (ข้าม RLS) ใช้ใน server action / cron / route handler เท่านั้น */
export function adminClient() {
  if (!url || !serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return (admin ??= createClient(url, serviceKey, { auth: { persistSession: false } }));
}
