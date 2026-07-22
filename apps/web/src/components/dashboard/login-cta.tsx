import Link from 'next/link';

/**
 * Nút bắt đầu đăng nhập Discord. Là link tới route handler /api/auth/login
 * (server sinh state + redirect). Không cần 'use client'.
 */
export function LoginCta({ label = 'Đăng nhập bằng Discord' }: { label?: string }) {
  return (
    <Link
      href="/api/auth/login"
      className="mimi-cta inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-cyan"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.43.845-.588 1.23a18.27 18.27 0 0 0-3.94 0A12.6 12.6 0 0 0 11.44 3a19.74 19.74 0 0 0-3.76 1.37C3.9 8.06 3.19 11.64 3.5 15.17a19.9 19.9 0 0 0 6.06 3.08c.49-.67.93-1.38 1.3-2.13-.71-.27-1.4-.6-2.04-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.1 0c.17.14.33.27.5.4-.65.39-1.33.72-2.05.99.38.75.81 1.46 1.3 2.13a19.86 19.86 0 0 0 6.06-3.08c.37-4.09-.63-7.64-2.71-10.8ZM9.68 13.6c-.9 0-1.63-.83-1.63-1.85s.72-1.85 1.63-1.85c.91 0 1.65.84 1.63 1.85 0 1.02-.72 1.85-1.63 1.85Zm4.64 0c-.9 0-1.63-.83-1.63-1.85s.72-1.85 1.63-1.85c.91 0 1.65.84 1.63 1.85 0 1.02-.72 1.85-1.63 1.85Z" />
      </svg>
      {label}
    </Link>
  );
}
