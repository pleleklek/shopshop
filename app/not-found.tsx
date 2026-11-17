import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20 space-y-3">
      <h1 className="text-2xl font-bold">ไม่พบสินค้านี้</h1>
      <Link href="/" className="text-orange-600 underline">กลับหน้าแรก</Link>
    </div>
  );
}
