import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { site } from '@/lib/site';

const groups = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tính năng', href: '/features' },
      { label: 'Lệnh', href: '/commands' },
      { label: 'Trạng thái', href: '/status' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm hỗ trợ', href: '/support' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Quyền riêng tư', href: '/privacy' },
      { label: 'Điều khoản', href: '/terms' },
      { label: 'Xóa dữ liệu', href: '/data-deletion' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-mimi-night">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="horizontal" className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-mimi-muted">
              Mimi mang trải nghiệm nghe nhạc mượt mà, tương tác và đầy cảm xúc đến voice channel Discord của
              bạn.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className="text-sm font-semibold text-mimi-text">{g.title}</h2>
              <ul className="mt-4 space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-mimi-muted transition-colors hover:text-mimi-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-mimi-muted">
            © {new Date().getFullYear()} {site.name}. Dự án cộng đồng phi lợi nhuận.
          </p>
          {site.supportUrl && (
            <a
              href={site.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-mimi-muted transition-colors hover:text-mimi-text"
            >
              Tham gia server hỗ trợ
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
