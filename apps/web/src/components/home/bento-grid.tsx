import { features, STATUS_LABEL, type Feature } from '@/lib/features';
import { FEATURE_ICONS } from '@/lib/feature-icons';
import { StatusBadge } from '@/components/ui/status-badge';

// Tông màu accent xoay vòng theo nhóm để bento sinh động mà vẫn nhất quán bảng màu.
const ACCENTS = [
  'text-mimi-lilac',
  'text-mimi-pink',
  'text-mimi-cyan',
  'text-mimi-success',
] as const;

function statusTone(status: Feature['status']): 'online' | 'degraded' | 'unknown' {
  if (status === 'available') return 'online';
  if (status === 'beta') return 'degraded';
  return 'unknown';
}

export function BentoGrid({ items = features }: { items?: Feature[] }) {
  return (
    <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((f, i) => {
        const Icon = FEATURE_ICONS[f.icon];
        const accent = ACCENTS[i % ACCENTS.length];
        return (
          <article
            key={f.id}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-mimi-surface-2 to-mimi-surface p-6 transition-transform duration-300 hover:-translate-y-1 ${
              f.size === 'lg' ? 'sm:col-span-2' : ''
            }`}
          >
            {/* Glow nền nhẹ khi hover */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-mimi-lilac/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-mimi-night/60">
                <Icon className={`h-5 w-5 ${accent}`} aria-hidden />
              </span>
              <StatusBadge tone={statusTone(f.status)} label={STATUS_LABEL[f.status]} />
            </div>
            <h3 className="font-display text-lg font-semibold text-mimi-text">{f.title}</h3>
            <p className="mt-2 flex-1 text-sm text-mimi-muted">{f.desc}</p>
            <p className="mt-3 border-t border-white/5 pt-3 text-xs text-mimi-muted/80">{f.useCase}</p>
          </article>
        );
      })}
    </div>
  );
}
