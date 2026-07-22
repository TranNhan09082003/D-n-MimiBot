import type { Metadata } from 'next';
import { MessagesSquare, HelpCircle, TerminalSquare, type LucideIcon } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { CtaLink } from '@/components/ui/button';
import { SupportForm } from '@/components/support/support-form';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hỗ trợ',
  description: 'Nhận trợ giúp, báo lỗi bài hát và tham gia cộng đồng Mimi.',
};

export default function SupportPage() {
  return (
    <div className="pt-28 pb-24">
      <Section
        title="Cần trợ giúp?"
        subtitle="Tham gia cộng đồng để được hỗ trợ nhanh, hoặc gửi báo lỗi kèm chi tiết bên dưới."
        className="pb-12"
      />

      <Section className="mb-10">
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
            <div key={c.title} className="mimi-card flex flex-col p-6">
              <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-mimi-night/60">
                <Icon className="h-5 w-5 text-mimi-lilac" aria-hidden />
              </span>
              <h3 className="font-display text-lg font-semibold text-mimi-text">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm text-mimi-muted">{c.desc}</p>
              <div className="mt-4">
                <CtaLink
                  href={c.href}
                  variant="secondary"
                  className="w-full"
                  pendingLabel="Đang được cấu hình"
                >
                  {c.cta}
                </CtaLink>
              </div>
            </div>
            );
          })}
        </div>
      </Section>

      <Section title="Báo lỗi bài hát" align="left" className="max-w-2xl">
        <p className="mb-6 text-sm text-mimi-muted">
          Điền thông tin dưới đây. Hệ thống sẽ tạo một mã lỗi để bạn tra cứu nhanh khi liên hệ đội hỗ trợ.
        </p>
        <SupportForm supportUrl={site.supportUrl} />
      </Section>
    </div>
  );
}

const channels: { title: string; desc: string; href: string | null; cta: string; icon: LucideIcon }[] = [
  {
    title: 'Cộng đồng Discord',
    desc: 'Hỏi đáp, báo lỗi và cập nhật tính năng mới cùng những người dùng Mimi khác.',
    href: site.supportUrl,
    cta: 'Tham gia server',
    icon: MessagesSquare,
  },
  {
    title: 'Câu hỏi thường gặp',
    desc: 'Nhiều thắc mắc phổ biến đã có lời giải ngay tại trang chủ, phần FAQ.',
    href: '/#faq',
    cta: 'Xem FAQ',
    icon: HelpCircle,
  },
  {
    title: 'Bảng lệnh',
    desc: 'Không nhớ lệnh? Xem danh sách đầy đủ các lệnh và tham số của Mimi.',
    href: '/commands',
    cta: 'Xem lệnh',
    icon: TerminalSquare,
  },
];
