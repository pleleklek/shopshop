"use client";

import { useState } from "react";

/** แสดงแค่รูปปกก่อน โหลด iframe เมื่อกดเล่น หน้าเว็บจะได้ไม่ช้า */
export function YouTubeLite({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        className="w-full aspect-video rounded-lg"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} className="relative block w-full aspect-video rounded-lg overflow-hidden bg-black group" aria-label={`เล่น ${title}`}>
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
      <span className="absolute inset-0 m-auto w-16 h-11 rounded-xl bg-red-600 flex items-center justify-center">
        <span className="ml-1 border-y-8 border-y-transparent border-l-[14px] border-l-white" />
      </span>
    </button>
  );
}
