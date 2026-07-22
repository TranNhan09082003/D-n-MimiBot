import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { StatusBadge } from '@/components/ui/status-badge';
import { getBotStatus } from '@/lib/bot-api';
import { formatNumberVN, formatUptime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Trạng thái',
  description: 'Tình trạng hoạt động thời gian thực của Mimi.',
};

// Trang trạng thái luôn lấy dữ liệu mới nhất.
export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const res = await getBotStatus();
  const online = res.ok && res.data.online;

  const tone = online ? 'online' : res.ok ? 'offline' : 'unknown';
  const headline = online
    ? 'Mimi đang hoạt động bình thường'
    : res.ok
      ? 'Mimi hiện đang ngoại tuyến'
      : res.error.code === 'NOT_CONFIGURED'
        ? 'Đang chờ kết nối với hệ thống Mimi'
        : 'Chưa lấy được trạng thái từ Mimi';

  const metrics = res.ok
    ? [
        { label: 'Số server', value: formatNumberVN(res.data.guildCount) },
        { label: 'Thành viên tiếp cận', value: formatNumberVN(res.data.reachableUsers) },
        { label: 'Phiên nghe nhạc', value: formatNumberVN(res.data.activeVoiceSessions) },
        { label: 'Độ trễ WebSocket', value: res.data.wsPing >= 0 ? `${res.data.wsPing} ms` : '—' },
        { label: 'Thời gian hoạt động', value: formatUptime(res.data.uptimeSeconds) },
      ]
    : [];

  return (
    <div className="pt-28 pb-24">
      <Section title="Trạng thái hệ thống" className="pb-10" />

      <Section>
        <div className="mimi-card p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <StatusBadge tone={tone} label={headline} pulse={online} />
            {res.ok && (
              <p className="text-xs text-mimi-muted">
                Cập nhật lúc{' '}
                {new Date(res.data.updatedAt).toLocaleString('vi-VN', { hour12: false })}
              </p>
            )}
          </div>

          {metrics.length > 0 ? (
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-white/5 bg-white/5 p-4 text-center">
                  <dt className="text-xs text-mimi-muted">{m.label}</dt>
                  <dd className="mt-1 font-display text-xl font-bold text-mimi-text">{m.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-8 text-center text-sm text-mimi-muted">
              {res.ok === false && res.error.code === 'NOT_CONFIGURED'
                ? 'Kết nối tới bot chưa được cấu hình. Số liệu sẽ hiển thị khi Internal API sẵn sàng.'
                : 'Không có số liệu để hiển thị lúc này. Trang sẽ tự cập nhật khi Mimi trực tuyến trở lại.'}
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-mimi-muted/70">
          Số liệu lấy trực tiếp từ bot, không phải con số cố định. Làm mới trang để cập nhật.
        </p>
      </Section>
    </div>
  );
}
