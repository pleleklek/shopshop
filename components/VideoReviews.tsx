import { formatCompact } from "@/lib/format";
import type { Video } from "@/lib/types";
import { YouTubeLite } from "./YouTubeLite";

export function VideoReviews({ videos }: { videos: Video[] }) {
  if (!videos.length) return <p className="text-slate-500 text-sm">ยังไม่มีวิดีโอรีวิว</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <div key={v.id} className="space-y-2">
          <YouTubeLite id={v.youtube_id} title={v.title} />
          <p className="text-sm font-medium line-clamp-2">{v.title}</p>
          <p className="text-xs text-slate-500">
            {v.channel_title}
            {v.view_count != null && <> · {formatCompact(v.view_count)} ครั้ง</>}
          </p>
        </div>
      ))}
    </div>
  );
}
