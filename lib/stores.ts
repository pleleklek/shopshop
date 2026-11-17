import type { Store } from "./types";

export const STORES: Record<Store, { label: string; className: string }> = {
  shopee: { label: "Shopee", className: "bg-orange-500 text-white" },
  lazada: { label: "Lazada", className: "bg-indigo-600 text-white" },
  tiktok: { label: "TikTok Shop", className: "bg-black text-white" },
  other: { label: "ร้านอื่น", className: "bg-slate-500 text-white" },
};

export const STORE_KEYS = Object.keys(STORES) as Store[];

export function isStore(value: string): value is Store {
  return value in STORES;
}
