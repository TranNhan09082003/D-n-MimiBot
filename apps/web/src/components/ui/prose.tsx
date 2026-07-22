import { Section } from './section';

/**
 * Bố cục trang văn bản dài (pháp lý, tài liệu). Giới hạn độ rộng dòng để dễ đọc.
 */
export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-28 pb-24">
      <Section className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-mimi-text sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-mimi-muted">Cập nhật lần cuối: {updatedAt}</p>
        <div className="prose-mimi mt-10 space-y-6">{children}</div>
      </Section>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-mimi-text">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-mimi-muted">{children}</div>
    </section>
  );
}
