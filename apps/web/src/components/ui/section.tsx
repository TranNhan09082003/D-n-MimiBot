import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  /** Tiêu đề tùy chọn — nếu có sẽ render SectionHeading ở đầu. */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  align?: 'left' | 'center';
}

export function Section({ id, className, children, title, subtitle, eyebrow, align = 'center' }: SectionProps) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>
      {title && (
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={subtitle}
          align={align}
          className="mb-10"
        />
      )}
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      {eyebrow && (
        <span className="rounded-full border border-mimi-lilac/30 bg-mimi-lilac/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-mimi-lilac">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-mimi-text sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={cn('max-w-2xl text-mimi-muted', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      )}
    </div>
  );
}
