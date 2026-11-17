import { NextResponse, type NextRequest } from "next/server";

// ป้องกันหลังบ้าน /admin ด้วย Basic Auth (ตั้ง ADMIN_USER / ADMIN_PASSWORD)
export function middleware(req: NextRequest) {
  // trim กันช่องว่าง/ขึ้นบรรทัดที่ติดมาตอนวางค่าใน Vercel
  const user = process.env.ADMIN_USER?.trim() || "admin";
  const pass = process.env.ADMIN_PASSWORD?.trim();
  if (!pass) return new NextResponse("กรุณาตั้งค่า ADMIN_PASSWORD", { status: 503 });

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const i = decoded.indexOf(":");
    if (decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };
