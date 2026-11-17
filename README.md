# ShopShop — เว็บ Affiliate เปรียบเทียบราคา + รีวิว YouTube

Next.js 15 (TypeScript, App Router) + Tailwind + Supabase, deploy บน Vercel

## โครงสร้าง

| ส่วน | ไฟล์ |
|---|---|
| หน้าแรก / ค้นหา / หมวดหมู่ | `app/page.tsx` |
| หน้าสินค้า: ตารางเทียบราคา + รีวิว YouTube + SEO JSON-LD | `app/p/[slug]/page.tsx` |
| ลิงก์ไปร้าน (นับคลิก แล้ว redirect ไปลิงก์ affiliate) | `app/go/[offerId]/route.ts` |
| หลังบ้าน (Basic Auth) | `app/admin/**`, `middleware.ts` |
| Cron อัปเดตราคา/รีวิวรายวัน | `app/api/cron/sync/route.ts`, `vercel.json` |
| Shopee Affiliate Open API | `lib/providers/shopee.ts` |
| YouTube Data API v3 | `lib/providers/youtube.ts` |
| ฐานข้อมูล | `supabase/schema.sql` |

ถ้ายังไม่ได้ตั้งค่า Supabase เว็บจะเปิดใน **โหมดเดโม** (ข้อมูลจาก `lib/demo.ts`)

## ติดตั้งบนเครื่อง

ต้องใช้ **Node.js 20 ขึ้นไป** (แนะนำ 22 LTS)

```bash
npm install
cp .env.example .env.local   # แล้วกรอกค่า
npm run dev                  # http://localhost:3000
```

## ขั้นตอนตั้งค่า

1. **Supabase**: สร้างโปรเจกต์ → SQL Editor → รัน `supabase/schema.sql`
   แล้วเอา URL, anon key, service_role key จาก Project Settings → API มาใส่ `.env.local`
2. **YouTube API key**: Google Cloud Console → เปิด *YouTube Data API v3* → สร้าง API key
   (โควตาฟรี 10,000 หน่วย/วัน ค้นหา 1 ครั้ง = 100 หน่วย ระบบจึงเก็บผลไว้และค้นใหม่ทุก 7 วัน)
3. **Shopee Affiliate**: สมัคร affiliate.shopee.co.th → ขอสิทธิ์ Open API → ได้ AppID / Secret
4. **Lazada / TikTok Shop**: ตอนนี้ใช้แบบกรอกลิงก์ affiliate + ราคาเองในหลังบ้าน
   (สร้างลิงก์จาก Lazada Affiliate, Involve Asia หรือ Accesstrade)
5. ตั้ง `ADMIN_PASSWORD` แล้วเข้า `/admin`

## วิธีใช้หลังบ้าน

1. `/admin` → เพิ่มสินค้า (ชื่อ, แบรนด์, หมวดหมู่)
2. ในหน้าสินค้า → **ค้นหาจาก Shopee** → กด "ผูก" ร้านที่ใช่ (ราคาจะอัปเดตอัตโนมัติทุกวัน)
3. เพิ่มร้าน Lazada / อื่นๆ แบบกรอกเอง
4. กด **ค้นหารีวิวใหม่** เพื่อดึงวิดีโอจาก YouTube แล้วปักหมุด/ซ่อนคลิปได้

## Deploy บน Vercel

1. push โค้ดขึ้น GitHub → Import ใน Vercel
2. ใส่ Environment Variables ทั้งหมดจาก `.env.example` (`NEXT_PUBLIC_SITE_URL` = โดเมนจริง)
3. ตั้ง `CRON_SECRET` เป็นค่าสุ่มยาวๆ — Vercel Cron จะเรียก `/api/cron/sync` ทุกวัน 03:00 น. (เวลาไทย)

## ต่อยอด

- เพิ่ม provider ใหม่ใน `lib/providers/` (เช่น Lazada ผ่าน product feed ของ network) แล้วเรียกใน `lib/sync.ts`
- ใช้ตาราง `price_history` ทำกราฟราคาย้อนหลัง
- ใช้ตาราง `clicks` ดูว่าสินค้า/ร้านไหนคนกดเยอะ
