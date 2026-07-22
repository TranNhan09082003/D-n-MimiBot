'use client';

import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '@/lib/utils';

/**
 * Player DEMO tương tác — mô phỏng giao diện player thật của Mimi.
 * - Âm thanh sinh bằng Web Audio API (oscillator nhẹ), KHÔNG dùng file bản quyền.
 * - Tôn trọng autoplay policy: chỉ tạo AudioContext + phát sau khi người dùng bấm.
 * - Gắn nhãn rõ "Chế độ demo" để không nhầm với player điều khiển bot thật.
 */

const DEMO_TRACK = {
  title: 'Mimi Sound Check',
  author: 'Mimi Audio Lab',
  durationMs: 213_000, // 3:33 — chỉ là con số minh hoạ cho thanh tiến trình
};

// Một chuỗi nốt nhẹ nhàng (tần số Hz) để demo phát bằng oscillator.
const NOTES: readonly number[] = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
const FALLBACK_HZ = 523.25;

export function DemoPlayer({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [volume, setVolume] = useState(70);

  const audioRef = useRef<{
    ctx: AudioContext;
    gain: GainNode;
    osc: OscillatorNode;
    noteTimer: number;
  } | null>(null);
  const rafRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAudio() {
    cancelAnimationFrame(rafRef.current);
    const a = audioRef.current;
    if (a) {
      clearInterval(a.noteTimer);
      try {
        a.osc.stop();
        a.ctx.close();
      } catch {
        /* noop */
      }
      audioRef.current = null;
    }
  }

  function tick() {
    const elapsed = performance.now() - startedAtRef.current;
    const pos = baseRef.current + elapsed;
    if (pos >= DEMO_TRACK.durationMs) {
      setPositionMs(0);
      baseRef.current = 0;
      startedAtRef.current = performance.now();
    } else {
      setPositionMs(pos);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  async function play() {
    // Tạo AudioContext CHỈ khi người dùng chủ động bấm (đúng chính sách trình duyệt).
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 0.06; // rất nhỏ, tránh chói tai
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = NOTES[0] ?? FALLBACK_HZ;
    osc.connect(gain).connect(ctx.destination);
    osc.start();

    let n = 0;
    const noteTimer = window.setInterval(() => {
      n = (n + 1) % NOTES.length;
      osc.frequency.setTargetAtTime(NOTES[n] ?? FALLBACK_HZ, ctx.currentTime, 0.05);
    }, 500);

    audioRef.current = { ctx, gain, osc, noteTimer };
    startedAtRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    setPlaying(true);
  }

  function pause() {
    baseRef.current = positionMs;
    stopAudio();
    setPlaying(false);
  }

  function toggle() {
    if (playing) pause();
    else void play();
  }

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.gain.gain.value = (volume / 100) * 0.06;
  }, [volume]);

  const pct = Math.min(100, (positionMs / DEMO_TRACK.durationMs) * 100);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-mimi-surface/80 p-5 shadow-glow backdrop-blur-sm ${className ?? ''}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mimi-lilac/15 px-2.5 py-1 text-xs font-medium text-mimi-lilac">
          <span aria-hidden>◈</span> Chế độ demo
        </span>
        <span className="font-mono text-xs text-mimi-muted">Không phát nhạc bản quyền</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Artwork minh hoạ dạng gradient, không dùng ảnh bản quyền */}
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-mimi-lilac via-mimi-pink to-mimi-cyan"
          aria-hidden
        >
          <span className="text-2xl">♪</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold text-mimi-text">{DEMO_TRACK.title}</p>
          <p className="truncate text-sm text-mimi-muted">{DEMO_TRACK.author}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Tạm dừng nhạc demo' : 'Phát nhạc demo'}
          aria-pressed={playing}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-r from-mimi-lilac to-mimi-pink text-mimi-night transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-mimi-surface"
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Thanh tiến trình + thời gian dạng text (không chỉ dựa hình ảnh) */}
      <div className="mt-4">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.round(DEMO_TRACK.durationMs / 1000)}
          aria-valuenow={Math.round(positionMs / 1000)}
          aria-label="Tiến trình bài hát demo"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-mimi-lilac to-mimi-pink transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-xs text-mimi-muted">
          <span>{formatDuration(positionMs)}</span>
          <span>{formatDuration(DEMO_TRACK.durationMs)}</span>
        </div>
      </div>

      {/* Âm lượng */}
      <div className="mt-4 flex items-center gap-3">
        <span aria-hidden className="text-mimi-muted">🔊</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Âm lượng nhạc demo"
          className="mimi-range h-1.5 flex-1 cursor-pointer"
        />
        <span className="w-10 text-right font-mono text-xs text-mimi-muted">{volume}%</span>
      </div>
    </div>
  );
}
