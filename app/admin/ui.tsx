// ชิ้นส่วนฟอร์มที่ใช้ซ้ำในหลังบ้าน
export const inputClass = "w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500";
export const btnClass = "rounded bg-slate-800 hover:bg-slate-900 px-3 py-1.5 text-sm text-white";
export const btnPrimary = "rounded bg-orange-600 hover:bg-orange-700 px-4 py-1.5 text-sm text-white";
export const btnDanger = "rounded border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-sm";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
