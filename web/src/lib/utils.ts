type ClassValue = string | number | null | false | undefined | ClassValue[];

/**
 * Gộp className có điều kiện. Bản gọn nhẹ không cần dependency ngoài:
 * làm phẳng mảng, bỏ giá trị falsy, nối bằng khoảng trắng.
 * (Không dedupe lớp Tailwind — trong dự án này các chỗ dùng không đặt lớp
 * xung đột nên không cần tailwind-merge.)
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(String(v));
  };
  inputs.forEach(walk);
  return out.join(' ');
}

/** Định dạng số lớn theo kiểu Việt Nam (1.234.567). */
export function formatNumberVN(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('vi-VN').format(Math.round(n));
}

/** Đổi mili-giây sang chuỗi thời lượng MM:SS hoặc HH:MM:SS. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x: number) => x.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Đổi giây uptime sang chuỗi "Xd Yh Zm" dễ đọc. */
export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} ngày`);
  if (h > 0) parts.push(`${h} giờ`);
  if (m > 0 || parts.length === 0) parts.push(`${m} phút`);
  return parts.join(' ');
}
