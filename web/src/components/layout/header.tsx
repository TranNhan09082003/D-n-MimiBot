'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { nav, site } from '@/lib/site';
import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Khóa scroll nền khi mở menu mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-white/10 bg-mimi-night/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
          aria-label={`${site.name} — trang chủ`}
        >
          <Logo variant="horizontal" className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-mimi-muted transition-colors hover:text-mimi-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm text-mimi-muted transition-colors hover:text-mimi-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
          >
            Đăng nhập
          </Link>
          <InviteButton />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-mimi-text md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-mimi-night/95 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Điều hướng di động">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base text-mimi-text hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base text-mimi-text hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
            >
              Đăng nhập
            </Link>
            <div className="pt-2">
              <InviteButton full />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function InviteButton({ full = false }: { full?: boolean }) {
  const className = cn(
    'inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-mimi-lilac to-mimi-pink px-4 py-2 text-sm font-semibold text-mimi-night transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-mimi-night',
    full && 'w-full'
  );
  if (!site.inviteUrl) {
    return (
      <span
        className={cn(className, 'cursor-not-allowed opacity-60')}
        title="Link mời đang được cấu hình"
        aria-disabled="true"
      >
        Mời Mimi
      </span>
    );
  }
  return (
    <a href={site.inviteUrl} target="_blank" rel="noopener noreferrer" className={className}>
      Mời Mimi
    </a>
  );
}
