'use client';

import { useState } from 'react';
import type { GuildSettings } from '@/lib/types';

// Chỉ những khoá này được phép chỉnh (khớp allowlist ở bot + route proxy).
type EditableKey = 'prefix' | 'unverifyOnMute' | 'verifyDailyMode';

/**
 * Form cấu hình server. Gửi PATCH tới route proxy có xác thực (không gọi thẳng bot).
 * Hiển thị trạng thái lưu rõ ràng và không mất dữ liệu người dùng khi lỗi.
 */
export function SettingsForm({ guildId, initial }: { guildId: string; initial: GuildSettings }) {
  const [prefix, setPrefix] = useState(initial.prefix);
  const [unverifyOnMute, setUnverifyOnMute] = useState(initial.unverifyOnMute);
  const [verifyDailyMode, setVerifyDailyMode] = useState(initial.verifyDailyMode);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const patch: Partial<Record<EditableKey, string | boolean>> = {
      prefix,
      unverifyOnMute,
      verifyDailyMode,
    };
    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg({ tone: 'err', text: json?.error?.message ?? 'Lưu thất bại. Thử lại sau.' });
      } else {
        setMsg({ tone: 'ok', text: 'Đã lưu cấu hình.' });
      }
    } catch {
      setMsg({ tone: 'err', text: 'Không kết nối được. Kiểm tra mạng và thử lại.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mimi-card space-y-5 p-6">
      <div>
        <label htmlFor="prefix" className="mb-1 block text-sm font-medium text-mimi-text">
          Prefix lệnh
        </label>
        <input
          id="prefix"
          type="text"
          value={prefix}
          maxLength={5}
          onChange={(e) => setPrefix(e.target.value)}
          className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-mimi-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
        />
        <p className="mt-1 text-xs text-mimi-muted">Ký tự đứng trước lệnh dạng chữ (1–5 ký tự).</p>
      </div>

      <Toggle
        id="unverifyOnMute"
        label="Gỡ xác minh khi bị mute"
        desc="Khi thành viên bị mute, tự động gỡ trạng thái đã xác minh."
        checked={unverifyOnMute}
        onChange={setUnverifyOnMute}
      />

      <Toggle
        id="verifyDailyMode"
        label="Chế độ xác minh hằng ngày"
        desc="Yêu cầu xác minh lại theo chu kỳ ngày."
        checked={verifyDailyMode}
        onChange={setVerifyDailyMode}
      />

      <div className="flex items-center gap-3 border-t border-white/5 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="mimi-cta rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-cyan"
        >
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
        {msg && (
          <span
            role="status"
            aria-live="polite"
            className={msg.tone === 'ok' ? 'text-sm text-mimi-success' : 'text-sm text-mimi-danger'}
          >
            {msg.tone === 'ok' ? '✓ ' : '✕ '}
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

function Toggle({
  id,
  label,
  desc,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <span className="block text-sm font-medium text-mimi-text">{label}</span>
        <span className="mt-0.5 block text-xs text-mimi-muted">{desc}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac ${
          checked ? 'bg-mimi-lilac' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
