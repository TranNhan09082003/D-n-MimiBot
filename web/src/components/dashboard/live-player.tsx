'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicPlayerState } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';

// Nhãn tiếng Việt cho chế độ lặp.
const REPEAT_LABEL: Record<PublicPlayerState['repeatMode'], string> = {
  off: 'Không lặp',
  track: 'Lặp bài',
  queue: 'Lặp hàng chờ',
};

/**
 * Trình phát trực tiếp trong dashboard.
 * - Nhận trạng thái ban đầu từ server (SSR), sau đó poll nhẹ để cập nhật.
 * - Mọi hành động đi qua route proxy có xác thực (/api/guilds/:id/player/:action).
 * - Khi bot không phát gì -> hiển thị trạng thái trung tính, không bịa dữ liệu.
 */
export function LivePlayer({
  guildId,
  initialPlayer,
}: {
  guildId: string;
  initialPlayer: PublicPlayerState | null;
}) {
  const [player, setPlayer] = useState<PublicPlayerState | null>(initialPlayer);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const volumeRef = useRef<number>(initialPlayer?.volume ?? 100);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/player`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setPlayer(json.player as PublicPlayerState);
        setOffline(false);
      } else {
        setOffline(true);
      }
    } catch {
      setOffline(true);
    }
  }, [guildId]);

  // Poll mỗi 5s. Dừng khi tab ẩn để đỡ tốn tài nguyên.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(refresh, 5000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVis = () => (document.hidden ? stop() : (refresh(), start()));
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);

  async function act(action: string, body?: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/guilds/${guildId}/player/${action}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setPlayer(json.player as PublicPlayerState);
      } else {
        setErr(json?.error?.message ?? 'Không thực hiện được.');
      }
    } catch {
      setErr('Không kết nối được tới bot.');
    } finally {
      setBusy(false);
    }
  }

  if (offline && !player) {
    return (
      <div className="mimi-card p-6">
        <StatusBadge tone="offline" label="Bot tạm ngoại tuyến" />
        <p className="mt-3 text-sm text-mimi-muted">
          Không lấy được trạng thái player. Trang sẽ tự thử lại sau vài giây.
        </p>
      </div>
    );
  }

  const track = player?.track ?? null;
  const connected = player?.connected ?? false;
  const paused = player?.paused ?? false;

  return (
    <div className="mimi-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <StatusBadge
          tone={connected ? 'online' : 'unknown'}
          label={connected ? 'Đang trong kênh thoại' : 'Chưa vào kênh thoại'}
          pulse={connected && !paused}
        />
        {player && <span className="text-xs text-mimi-muted">{REPEAT_LABEL[player.repeatMode]}</span>}
      </div>

      {track ? (
        <div>
          <p className="truncate font-display text-lg font-semibold text-mimi-text" title={track.title}>
            {track.title}
          </p>
          {track.author && <p className="text-sm text-mimi-muted">{track.author}</p>}
          <div className="mt-3">
            <ProgressBar positionMs={player?.positionMs ?? 0} durationMs={track.durationMs} isStream={track.isStream} />
          </div>
        </div>
      ) : (
        <p className="py-4 text-sm text-mimi-muted">
          Hiện chưa phát bài nào. Dùng lệnh <code className="font-mono text-mimi-cyan">/play</code> trong Discord
          để bắt đầu.
        </p>
      )}

      {/* Điều khiển */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {paused ? (
          <ControlButton disabled={busy || !connected} onClick={() => act('resume')} label="Tiếp tục">
            ▶
          </ControlButton>
        ) : (
          <ControlButton disabled={busy || !connected} onClick={() => act('pause')} label="Tạm dừng">
            ❚❚
          </ControlButton>
        )}
        <ControlButton disabled={busy || !connected} onClick={() => act('skip')} label="Bỏ qua">
          ⏭
        </ControlButton>
        <ControlButton disabled={busy || !connected} onClick={() => act('stop')} label="Dừng hẳn">
          ■
        </ControlButton>
      </div>

      {/* Âm lượng */}
      <div className="mt-5">
        <label htmlFor="volume" className="mb-1 block text-xs text-mimi-muted">
          Âm lượng: {player?.volume ?? volumeRef.current}%
        </label>
        <input
          id="volume"
          type="range"
          min={0}
          max={150}
          defaultValue={player?.volume ?? 100}
          disabled={busy || !connected}
          onMouseUp={(e) => act('volume', { volume: Number((e.target as HTMLInputElement).value) })}
          onTouchEnd={(e) => act('volume', { volume: Number((e.target as HTMLInputElement).value) })}
          className="mimi-range w-full"
        />
      </div>

      {err && (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-mimi-danger">
          ✕ {err}
        </p>
      )}
    </div>
  );
}

function ProgressBar({
  positionMs,
  durationMs,
  isStream,
}: {
  positionMs: number;
  durationMs: number;
  isStream: boolean;
}) {
  if (isStream) {
    return <p className="text-xs text-mimi-cyan">● Phát trực tiếp</p>;
  }
  const pct = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-mimi-lilac to-mimi-pink" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-mimi-muted">
        <span>{formatDuration(positionMs)}</span>
        <span>{formatDuration(durationMs)}</span>
      </div>
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-mimi-text transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
    >
      {children}
    </button>
  );
}
