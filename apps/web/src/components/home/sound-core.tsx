'use client';

import { useEffect, useRef } from 'react';

/**
 * Mimi Sound Core — vòng sóng âm phản ứng nhẹ, vẽ bằng canvas 2D (nhẹ, không cần WebGL).
 * - Tôn trọng prefers-reduced-motion: đứng yên, chỉ hiển thị trạng thái tĩnh.
 * - Tự dừng khi tab ẩn để tiết kiệm CPU.
 * - Không phát âm thanh; chỉ mô phỏng thị giác.
 */
export function SoundCore({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let running = true;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    size();
    window.addEventListener('resize', size);

    const bars = 64;
    const draw = (t: number) => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      const baseR = Math.min(w, h) * 0.18;
      // Lõi trung tâm
      const grad = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, baseR);
      grad.addColorStop(0, 'rgba(255,134,200,0.9)');
      grad.addColorStop(0.6, 'rgba(184,156,255,0.55)');
      grad.addColorStop(1, 'rgba(101,230,255,0.05)');
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Vòng sóng phóng xạ
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const phase = reduced ? 0.5 : (Math.sin(t / 600 + i * 0.35) + 1) / 2;
        const len = baseR * (0.35 + phase * 0.7);
        const x1 = cx + Math.cos(angle) * (baseR * 1.05);
        const y1 = cy + Math.sin(angle) * (baseR * 1.05);
        const x2 = cx + Math.cos(angle) * (baseR * 1.05 + len);
        const y2 = cy + Math.sin(angle) * (baseR * 1.05 + len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${180 - i}, ${156 + (i % 60)}, 255, ${0.25 + phase * 0.5})`;
        ctx.lineWidth = 2 * dpr;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      running = !document.hidden;
      if (running && !reduced) raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Hình ảnh minh hoạ lõi âm thanh Mimi đang phát ra các vòng sóng"
    />
  );
}
