import { cn } from '@/lib/utils';

interface LogoProps {
  /**
   * - `full` / `horizontal`: icon + chữ "Mimi" nằm ngang.
   * - `icon`: chỉ icon (dùng cho favicon/mobile).
   */
  variant?: 'full' | 'horizontal' | 'icon';
  /** Đơn sắc (dùng trên nền đặc biệt). */
  monochrome?: boolean;
  className?: string;
}

/**
 * Logo Mimi: chữ M ẩn trong waveform.
 * Không sao chép mascot bot khác — hình dạng dựng từ các cột sóng âm
 * xếp theo dáng chữ M (thấp - cao - thấp - cao - thấp).
 */
export function Logo({ variant = 'full', monochrome = false, className }: LogoProps) {
  const gradientId = 'mimi-logo-grad';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="Mimi"
        className="shrink-0"
      >
        {!monochrome && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b89cff" />
              <stop offset="0.5" stopColor="#ff86c8" />
              <stop offset="1" stopColor="#65e6ff" />
            </linearGradient>
          </defs>
        )}
        {/* 5 cột sóng tạo dáng chữ M: cao ở 2 chân và đỉnh giữa hạ xuống */}
        {[
          { x: 3, h: 20 },
          { x: 9, h: 12 },
          { x: 15, h: 16 },
          { x: 21, h: 12 },
          { x: 27, h: 20 },
        ].map((bar, i) => (
          <rect
            key={i}
            x={bar.x - 2}
            y={16 - bar.h / 2}
            width="4"
            height={bar.h}
            rx="2"
            fill={monochrome ? 'currentColor' : `url(#${gradientId})`}
          />
        ))}
      </svg>
      {variant !== 'icon' && (
        <span className="font-display text-xl font-bold tracking-tight text-mimi-text">
          Mimi
        </span>
      )}
    </span>
  );
}
