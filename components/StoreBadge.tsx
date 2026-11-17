import { STORES } from "@/lib/stores";
import type { Store } from "@/lib/types";

export function StoreBadge({ store }: { store: Store }) {
  const s = STORES[store] ?? STORES.other;
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}
