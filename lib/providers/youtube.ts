import "server-only";
import type { VideoInput } from "../types";

// YouTube Data API v3 — โควตาฟรี 10,000 หน่วย/วัน, search.list = 100 หน่วย
// จึงต้องเก็บผลลง DB แล้ว refresh เป็นรอบ ไม่เรียกทุกครั้งที่มีคนเปิดหน้า
const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY;

export const isYoutubeConfigured = Boolean(KEY);

export async function searchReviewVideos(keyword: string, max = 6): Promise<VideoInput[]> {
  if (!KEY) throw new Error("ยังไม่ได้ตั้งค่า YOUTUBE_API_KEY");

  const search = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: keyword,
    maxResults: String(max),
    regionCode: "TH",
    relevanceLanguage: "th",
    safeSearch: "moderate",
    videoEmbeddable: "true",
    key: KEY,
  });
  const res = await fetch(`${API}/search?${search}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(`YouTube API: ${json.error?.message ?? res.statusText}`);

  const items: { id: { videoId: string } }[] = json.items ?? [];
  const ids = items.map((i) => i.id.videoId).filter(Boolean);
  if (!ids.length) return [];

  // videos.list = 1 หน่วย ใช้ดึงยอดวิว
  const detail = new URLSearchParams({ part: "snippet,statistics", id: ids.join(","), key: KEY });
  const res2 = await fetch(`${API}/videos?${detail}`, { cache: "no-store" });
  const json2 = await res2.json();
  if (!res2.ok) throw new Error(`YouTube API: ${json2.error?.message ?? res2.statusText}`);

  return (json2.items ?? []).map((v: any): VideoInput => ({
    youtube_id: v.id,
    title: v.snippet.title,
    channel_title: v.snippet.channelTitle ?? null,
    thumbnail_url: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.medium?.url ?? null,
    published_at: v.snippet.publishedAt ?? null,
    view_count: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
  }));
}
