import { cn } from '@/lib/utils';

export type StatusTone = 'online' | 'offline' | 'degraded' | 'unknown';

const config: Record<StatusTone, { label: string; dot: string; text: string; symbol: string }> = {
  online: { label: 'Hoạt động', dot: 'bg-mimi-success', text: 'text-mimi-success', symbol: '●' },
  offline: { label: 'Ngoại tuyến', dot: 'bg-mimi-danger', text: 'text-mimi-danger', symbol: '■' },
  degraded: { label: 'Gián đoạn', dot: 'bg-mimi-warning', text: 'text-mimi-warning', symbol: '▲' },
  unknown: { label: 'Đang đồng bộ', dot: 'bg-mimi-muted', text: 'text-mimi-muted', symbol: '○' },
};

/**
 * Badge trạng thái. Truyền đạt bằng CẢ màu, ký hiệu và chữ — không chỉ dựa vào màu
 * (yêu cầu accessibility: không dùng màu là kênh thông tin duy nhất).
 */
export function StatusBadge({
  tone,
  label,
  className,
  pulse = false,
}: {
  tone: StatusTone;
  label?: string;
  className?: string;
  pulse?: boolean;
}) {
  const c = config[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium',
        c.text,
        className,
      )}
    >
      <span className={cn('relative flex h-2 w-2')}>
        {pulse && tone === 'online' && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', c.dot)} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', c.dot)} />
      </span>
      <span aria-hidden className="font-mono">{c.symbol}</span>
      {label ?? c.label}
    </span>
  );
}
