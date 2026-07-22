import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCommands } from '@/lib/bot-api';
import type { CommandInfo } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Lệnh',
  description: 'Danh sách lệnh slash của Mimi, đồng bộ trực tiếp từ bot.',
};

// Không cache lâu để danh sách lệnh luôn phản ánh bot hiện tại.
export const revalidate = 300;

export default async function CommandsPage() {
  const res = await getCommands();
  const commands: CommandInfo[] = res.ok ? res.data.commands : [];

  return (
    <div className="pt-28 pb-24">
      <Section
        title="Bảng lệnh của Mimi"
        subtitle="Danh sách này được đồng bộ trực tiếp từ bot. Nếu bot đang ngoại tuyến, bảng sẽ tạm trống."
        className="pb-10"
      />

      <Section>
        <div className="mb-6 flex items-center justify-center">
          {res.ok ? (
            <StatusBadge tone="online" label={`${res.data.count} lệnh đang hoạt động`} />
          ) : res.error.code === 'NOT_CONFIGURED' ? (
            <StatusBadge tone="unknown" label="Đang chờ kết nối với bot" />
          ) : (
            <StatusBadge tone="offline" label="Bot tạm ngoại tuyến — thử lại sau" />
          )}
        </div>

        {commands.length === 0 ? (
          <div className="mimi-card px-6 py-12 text-center text-sm text-mimi-muted">
            {res.ok
              ? 'Chưa có lệnh nào được đăng ký.'
              : 'Danh sách lệnh sẽ hiện ở đây ngay khi kết nối được với bot. Trong lúc chờ, bạn vẫn có thể mời Mimi và dùng lệnh /play trong Discord.'}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {commands.map((cmd) => (
              <div key={cmd.name} className="mimi-card p-5">
                <div className="flex items-center gap-2">
                  <code className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-sm text-mimi-cyan">
                    /{cmd.name}
                  </code>
                  {cmd.defaultMemberPermissions && (
                    <span className="rounded-full border border-mimi-warning/30 px-2 py-0.5 text-[10px] text-mimi-warning">
                      cần quyền quản trị
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-mimi-muted">{cmd.description || 'Chưa có mô tả.'}</p>
                {cmd.options.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-white/5 pt-3">
                    {cmd.options.map((o) => (
                      <li key={o.name} className="flex items-baseline gap-2 text-xs">
                        <code className="font-mono text-mimi-lilac">{o.name}</code>
                        {o.required && <span className="text-[10px] text-mimi-danger">bắt buộc</span>}
                        <span className="text-mimi-muted/80">{o.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
