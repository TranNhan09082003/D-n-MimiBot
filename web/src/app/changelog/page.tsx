import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';

export const metadata: Metadata = {
  title: 'Nhật ký cập nhật',
  description: 'Những thay đổi và cải tiến gần đây của Mimi.',
};

// Chỉ liệt kê những cột mốc CÓ THẬT trong dự án. Không bịa số phiên bản/ngày.
const entries = [
  {
    tag: 'Hệ sinh thái',
    title: 'Ra mắt website và dashboard',
    items: [
      'Website giới thiệu Mimi với trình phát demo và số liệu trạng thái thật.',
      'Dashboard đăng nhập bằng Discord để xem và điều khiển player theo từng server.',
      'Internal API kết nối web với bot qua token bảo mật.',
    ],
  },
  {
    tag: 'Trình phát',
    title: 'Player điều khiển bằng nút bấm',
    items: [
      'Nút pause, skip, dừng, lặp và chỉnh âm lượng ngay trên embed Discord.',
      'Tự bỏ qua video riêng tư hoặc giới hạn độ tuổi để luôn phát được.',
      'Bắt lỗi tiến trình phát và tự chuyển bài kế tiếp thay vì đứng im.',
    ],
  },
  {
    tag: 'Cộng đồng',
    title: 'Bộ công cụ cộng đồng',
    items: [
      'Đọc tin nhắn (TTS) tiếng Việt cho thành viên không dùng mic.',
      'Phòng thoại tạm thời, hệ thống kinh tế, chào mừng, ticket và xác minh.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="pt-28 pb-24">
      <Section
        title="Nhật ký cập nhật"
        subtitle="Những cột mốc chính của Mimi. Danh sách sẽ được bổ sung theo từng đợt cập nhật."
        className="pb-12"
      />

      <Section className="max-w-3xl">
        <ol className="relative space-y-8 border-l border-white/10 pl-6">
          {entries.map((e) => (
            <li key={e.title} className="relative">
              <span
                className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-mimi-lilac ring-4 ring-mimi-night"
                aria-hidden
              />
              <span className="inline-block rounded-full border border-mimi-lilac/30 bg-mimi-lilac/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-mimi-lilac">
                {e.tag}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold text-mimi-text">{e.title}</h3>
              <ul className="mt-2 space-y-1.5">
                {e.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm text-mimi-muted">
                    <span className="mt-1 text-mimi-cyan" aria-hidden>
                      ·
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-center text-xs text-mimi-muted/70">
          Muốn theo dõi cập nhật mới nhất? Tham gia server cộng đồng của Mimi qua liên kết ở chân trang.
        </p>
      </Section>
    </div>
  );
}
