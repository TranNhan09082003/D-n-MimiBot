'use client';

import { Disc3, Radio, Youtube } from 'lucide-react';
import { SoundCore } from '@/components/home/sound-core';

/**
 * Hero visual — lõi âm thanh canvas + các chip quỹ đạo mô tả ĐÚNG năng lực thật của bot.
 * Nhãn chip chỉ nói những gì Mimi thực sự làm: phát nhạc YouTube, điều khiển bằng nút,
 * ở lại kênh thoại. Không bịa "Lossless / Lavalink / Spotify".
 * Tôn trọng prefers-reduced-motion qua class animate-* (đã tắt trong globals.css).
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
      {/* Vòng sóng lan toả */}
      <div className="pointer-events-none absolute inset-8 rounded-full border border-mimi-lilac/30 animate-wave-ring" aria-hidden />
      <div
        className="pointer-events-none absolute inset-8 rounded-full border border-mimi-pink/25 animate-wave-ring"
        style={{ animationDelay: '1.2s' }}
        aria-hidden
      />

      {/* Lõi âm thanh (canvas thật, có aria-label) */}
      <SoundCore className="h-[300px] w-[300px] max-w-full" />

      {/* Chip quỹ đạo — quay quanh, nội dung trung thực */}
      <div className="pointer-events-none absolute inset-0 animate-orbit" aria-hidden>
        <span className="absolute left-1/2 top-1 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-mimi-lilac/40 bg-mimi-surface/90 px-3 py-1.5 text-xs text-mimi-text shadow-lg backdrop-blur">
          <Youtube className="h-3.5 w-3.5 text-mimi-pink" />
          Phát từ YouTube
        </span>
        <span className="absolute bottom-6 right-4 flex items-center gap-1.5 rounded-full border border-mimi-cyan/40 bg-mimi-surface/90 px-3 py-1.5 text-xs text-mimi-text shadow-lg backdrop-blur">
          <Radio className="h-3.5 w-3.5 text-mimi-cyan" />
          Ở lại kênh thoại
        </span>
        <span className="absolute bottom-10 left-2 flex items-center gap-1.5 rounded-full border border-mimi-success/40 bg-mimi-surface/90 px-3 py-1.5 text-xs text-mimi-text shadow-lg backdrop-blur">
          <Disc3 className="h-3.5 w-3.5 text-mimi-success" />
          Điều khiển bằng nút
        </span>
      </div>

      {/* Nhãn trạng thái trung tính ở tâm-dưới */}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[11px] text-mimi-cyan">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-mimi-success align-middle" />
        MIMI SOUND CORE
      </span>
    </div>
  );
}
