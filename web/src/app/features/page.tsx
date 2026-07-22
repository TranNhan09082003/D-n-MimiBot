import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { StatusBadge } from '@/components/ui/status-badge';
import { CtaLink } from '@/components/ui/button';
import { features, GROUP_LABEL, STATUS_LABEL, type Feature } from '@/lib/features';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Tính năng',
  description: 'Toàn bộ tính năng của Mimi — phát nhạc, hàng chờ, TTS, kinh tế, quản trị và dashboard.',
};

// Gom tính năng theo nhóm để trình bày có cấu trúc.
function groupBy(list: Feature[]) {
  const map = new Map<Feature['group'], Feature[]>();
  for (const f of list) {
    const arr = map.get(f.group) ?? [];
    arr.push(f);
    map.set(f.group, arr);
  }
  return [...map.entries()];
}

function toneOf(status: Feature['status']) {
  return status === 'available' ? 'online' : status === 'beta' ? 'degraded' : 'unknown';
}

export default function FeaturesPage() {
  const groups = groupBy(features);

  return (
    <div className="pt-28 pb-24">
      <Section
        title="Mọi thứ Mimi có thể làm"
        subtitle="Danh sách được đối chiếu trực tiếp với mã nguồn bot. Không có tính năng nào ở đây là quảng cáo suông."
        className="pb-12"
      />

      {groups.map(([group, list]) => (
        <Section key={group} className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-mimi-text">{GROUP_LABEL[group]}</h2>
            <span className="h-px flex-1 bg-white/10" aria-hidden />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((f) => (
              <div key={f.id} className="mimi-card flex flex-col p-6">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-mimi-text">{f.title}</h3>
                  <StatusBadge tone={toneOf(f.status)} label={STATUS_LABEL[f.status]} />
                </div>
                <p className="text-sm text-mimi-muted">{f.desc}</p>
                <p className="mt-3 text-xs text-mimi-muted/80">{f.useCase}</p>
                {f.commands.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                    {f.commands.map((c) => (
                      <code
                        key={c}
                        className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-mimi-cyan"
                      >
                        /{c}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section className="mt-8">
        <div className="mimi-card px-6 py-12 text-center">
          <h2 className="font-display text-2xl font-bold text-mimi-text">Sẵn sàng thử Mimi?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-mimi-muted">
            Mời Mimi vào server và bật bài hát đầu tiên chỉ trong một phút.
          </p>
          <div className="mt-6 flex justify-center">
            <CtaLink href={site.inviteUrl} variant="primary" pendingLabel="Link mời đang được cấu hình">
              Mời Mimi vào server
            </CtaLink>
          </div>
        </div>
      </Section>
    </div>
  );
}
