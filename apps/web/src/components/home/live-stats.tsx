import { getBotStatus } from '@/lib/bot-api';
import { formatNumberVN, formatUptime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';

/**
 * Social proof lấy TỪ DỮ LIỆU THẬT của bot qua Internal API.
 * - Không bịa số liệu. Khi bot chưa cấu hình / offline -> hiển thị trạng thái
 *   trung tính ("Đang đồng bộ") thay vì số giả.
 * - Là Server Component: fetch chạy phía server, token không lộ ra client.
 */
export async function LiveStats() {
  const res = await getBotStatus();

  const online = res.ok && res.data.online;
  const stats = res.ok
    ? [
        { label: 'Server đang phục vụ', value: formatNumberVN(res.data.guildCount), hint: 'Cộng đồng đang dùng Mimi' },
        { label: 'Thành viên tiếp cận', value: formatNumberVN(res.data.reachableUsers), hint: 'Trên tất cả server' },
        { label: 'Phiên nghe nhạc', value: formatNumberVN(res.data.activeVoiceSessions), hint: 'Đang phát trực tiếp' },
        { label: 'Thời gian hoạt động', value: formatUptime(res.data.uptimeSeconds), hint: 'Kể từ lần khởi động gần nhất' },
      ]
    : [
        { label: 'Server đang phục vụ', value: 'Đang đồng bộ', hint: 'Dữ liệu đang được cập nhật' },
        { label: 'Thành viên tiếp cận', value: 'Đang đồng bộ', hint: 'Dữ liệu đang được cập nhật' },
        { label: 'Phiên nghe nhạc', value: 'Đang đồng bộ', hint: 'Dữ liệu đang được cập nhật' },
        { label: 'Thời gian hoạt động', value: 'Đang đồng bộ', hint: 'Dữ liệu đang được cập nhật' },
      ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-3">
        <StatusBadge
          tone={online ? 'online' : res.ok ? 'offline' : 'unknown'}
          label={online ? 'Mimi đang hoạt động trực tiếp' : res.ok ? 'Mimi tạm ngoại tuyến' : 'Đang kết nối với hệ thống Mimi'}
          pulse={online}
        />
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="mimi-card p-5 text-center">
            <dt className="text-xs text-mimi-muted">{s.label}</dt>
            <dd className="mt-2 font-display text-2xl font-bold text-mimi-text">{s.value}</dd>
            <p className="mt-1 text-[11px] text-mimi-muted/70">{s.hint}</p>
          </div>
        ))}
      </dl>
    </div>
  );
}
