/**
 * Cấu hình site đọc từ biến môi trường PUBLIC (an toàn để lộ ra client).
 * Không hardcode số liệu giả. Link chưa có -> null -> UI hiển thị trạng thái trung tính.
 */

const clientId = process.env.NEXT_PUBLIC_BOT_CLIENT_ID || '';

export const site = {
  name: 'Mimi',
  tagline: 'Bot phát nhạc Discord dành cho cộng đồng',
  description:
    'Mời Mimi vào server Discord để phát nhạc, quản lý hàng chờ và điều khiển trải nghiệm nghe nhạc bằng giao diện trực quan.',
  // Link mời bot: ưu tiên biến môi trường, nếu chưa có nhưng có clientId thì tự dựng.
  inviteUrl:
    process.env.NEXT_PUBLIC_BOT_INVITE_URL ||
    (clientId
      ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=3214336&scope=bot%20applications.commands`
      : null),
  supportUrl: process.env.NEXT_PUBLIC_DISCORD_SUPPORT_URL || null,
  clientId: clientId || null,
} as const;

export const nav = [
  { href: '/features', label: 'Tính năng' },
  { href: '/commands', label: 'Lệnh' },
  { href: '/status', label: 'Trạng thái' },
  { href: '/support', label: 'Hỗ trợ' },
] as const;
