'use client';

import { useMemo, useState } from 'react';
import { Search, Copy, Check, ShieldAlert } from 'lucide-react';
import type { CommandInfo } from '@/lib/types';

/**
 * Bảng lệnh tương tác — dữ liệu commands được truyền TỪ SERVER (đồng bộ thật từ bot).
 * Client chỉ lo tìm kiếm/lọc, không bịa thêm lệnh nào.
 */
export function CommandsExplorer({ commands }: { commands: CommandInfo[] }) {
  const [query, setQuery] = useState('');
  const [onlyAdmin, setOnlyAdmin] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return commands.filter((cmd) => {
      if (onlyAdmin && !cmd.defaultMemberPermissions) return false;
      if (!q) return true;
      return (
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q)
      );
    });
  }, [commands, query, onlyAdmin]);

  function copy(name: string) {
    navigator.clipboard?.writeText(`/${name}`).then(
      () => {
        setCopied(name);
        setTimeout(() => setCopied((c) => (c === name ? null : c)), 1800);
      },
      () => {
        /* clipboard bị chặn — bỏ qua, không làm hỏng UX */
      },
    );
  }

  return (
    <div>
      {/* Thanh tìm kiếm + lọc */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mimi-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm lệnh theo tên hoặc mô tả…"
            aria-label="Tìm lệnh"
            className="w-full rounded-xl border border-white/10 bg-mimi-surface py-2.5 pl-9 pr-3 text-sm text-mimi-text placeholder:text-mimi-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
          />
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-mimi-muted">
          <input
            type="checkbox"
            checked={onlyAdmin}
            onChange={(e) => setOnlyAdmin(e.target.checked)}
            className="h-4 w-4 accent-mimi-lilac"
          />
          <ShieldAlert className="h-4 w-4 text-mimi-warning" aria-hidden />
          Chỉ lệnh quản trị
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mimi-card px-6 py-12 text-center text-sm text-mimi-muted">
          Không tìm thấy lệnh nào khớp với &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((cmd) => (
            <div key={cmd.name} className="mimi-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <code className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-sm text-mimi-cyan">
                    /{cmd.name}
                  </code>
                  {cmd.defaultMemberPermissions && (
                    <span className="rounded-full border border-mimi-warning/30 px-2 py-0.5 text-[10px] text-mimi-warning">
                      cần quyền quản trị
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => copy(cmd.name)}
                  aria-label={`Sao chép /${cmd.name}`}
                  title="Sao chép"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mimi-muted transition-colors hover:text-mimi-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
                >
                  {copied === cmd.name ? (
                    <Check className="h-4 w-4 text-mimi-success" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-mimi-muted">{cmd.description || 'Chưa có mô tả.'}</p>
              {cmd.options.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/5 pt-3">
                  {cmd.options.map((o) => (
                    <li key={o.name} className="flex items-baseline gap-2 text-xs">
                      <code className="font-mono text-mimi-lilac">{o.name}</code>
                      {o.required && <span className="text-[10px] text-mimi-danger">bắt buộc</span>}
                      <span className="text-mimi-muted/80">{o.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
