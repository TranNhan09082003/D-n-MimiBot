import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { StatusBadge } from '@/components/ui/status-badge';
import { CommandsExplorer } from '@/components/commands/commands-explorer';
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
          <CommandsExplorer commands={commands} />
        )}
      </Section>
    </div>
  );
}
