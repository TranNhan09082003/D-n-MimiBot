import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-mimi-night disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-mimi-lilac to-mimi-pink text-mimi-night hover:scale-[1.02] shadow-glow',
  secondary:
    'border border-white/15 bg-white/5 text-mimi-text hover:bg-white/10',
  ghost: 'text-mimi-muted hover:text-mimi-text',
};

interface CommonProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  full?: boolean;
}

/** Link nội bộ (Next). */
export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
  full,
  external,
}: CommonProps & { href: string; external?: boolean }) {
  const cls = cn(base, variants[variant], full && 'w-full', className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/**
 * Nút CTA cho link có thể chưa được cấu hình (vd: invite URL chưa có).
 * Khi href null -> render span disabled, không phải link chết.
 */
export function CtaLink({
  href,
  variant = 'primary',
  className,
  children,
  full,
  pendingLabel = 'Đang được cấu hình',
}: CommonProps & { href: string | null; pendingLabel?: string }) {
  const cls = cn(base, variants[variant], full && 'w-full', className);
  if (!href) {
    return (
      <span
        className={cn(cls, 'cursor-not-allowed opacity-60')}
        title={pendingLabel}
        aria-disabled="true"
        role="link"
      >
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  );
}
