'use client';

import { useState } from 'react';

/**
 * Form báo lỗi phía client. KHÔNG gửi dữ liệu ra server ngoài — chỉ tạo mã lỗi
 * cục bộ để người dùng dán kèm khi liên hệ đội hỗ trợ qua Discord.
 * Tránh hứa hẹn backend mà dự án chưa có.
 */
export function SupportForm({ supportUrl }: { supportUrl: string | null }) {
  const [track, setTrack] = useState('');
  const [detail, setDetail] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate(e: React.FormEvent) {
    e.preventDefault();
    // Mã lỗi dạng MIMI-XXXXXX từ thời gian + ngẫu nhiên (chỉ để tra cứu).
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    setCode(`MIMI-${stamp}${rand}`);
    setCopied(false);
  }

  async function copyReport() {
    if (!code) return;
    const text = `Mã lỗi: ${code}\nBài hát/Link: ${track || '(chưa cung cấp)'}\nMô tả: ${detail || '(chưa cung cấp)'}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form onSubmit={generate} className="mimi-card space-y-4 p-6">
      <div>
        <label htmlFor="track" className="mb-1 block text-sm font-medium text-mimi-text">
          Bài hát hoặc link YouTube
        </label>
        <input
          id="track"
          type="text"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-mimi-text placeholder:text-mimi-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
        />
      </div>

      <div>
        <label htmlFor="detail" className="mb-1 block text-sm font-medium text-mimi-text">
          Mô tả lỗi
        </label>
        <textarea
          id="detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={4}
          placeholder="Ví dụ: bài hát không phát, bị ngắt giữa chừng, sai bài..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-mimi-text placeholder:text-mimi-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
        />
      </div>

      <button
        type="submit"
        className="mimi-cta w-full rounded-xl px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-cyan"
      >
        Tạo mã báo lỗi
      </button>

      {code && (
        <div className="rounded-xl border border-mimi-lilac/30 bg-mimi-lilac/10 p-4" role="status" aria-live="polite">
          <p className="text-sm text-mimi-text">
            Mã lỗi của bạn:{' '}
            <code className="font-mono font-bold text-mimi-lilac">{code}</code>
          </p>
          <p className="mt-1 text-xs text-mimi-muted">
            Sao chép nội dung báo lỗi rồi gửi vào server hỗ trợ để được xử lý nhanh.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyReport}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-mimi-text hover:bg-white/10"
            >
              {copied ? 'Đã sao chép ✓' : 'Sao chép báo lỗi'}
            </button>
            {supportUrl && (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-mimi-cyan hover:bg-white/10"
              >
                Mở server hỗ trợ →
              </a>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
