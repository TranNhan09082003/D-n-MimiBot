import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Section } from '@/components/ui/section';
import { StatusBadge } from '@/components/ui/status-badge';
import { getSession } from '@/lib/auth/session';
import { fetchUserGuilds, canManageGuild } from '@/lib/auth/discord';
import { getGuildSettings, getPlayer } from '@/lib/bot-api';
import { isOAuthConfigured } from '@/lib/env';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { LivePlayer } from '@/components/dashboard/live-player';

export const metadata: Metadata = {
  title: 'Quản lý server',
};

export const dynamic = 'force-dynamic';

export default async function GuildDashboardPage({ params }: { params: { guildId: string } }) {
  if (!isOAuthConfigured) redirect('/dashboard');

  const session = await getSession();
  if (!session) redirect('/dashboard');

  const { guildId } = params;

  // Xác thực người dùng THỰC SỰ quản lý được server này (chống truy cập trái phép qua URL).
  let authorized = false;
  try {
    const guilds = await fetchUserGuilds(session.accessToken);
    const g = guilds.find((x) => x.id === guildId);
    authorized = Boolean(g && canManageGuild(g));
  } catch {
    redirect('/dashboard');
  }
  if (!authorized) notFound();

  // Lấy settings + player song song từ bot.
  const [settingsRes, playerRes] = await Promise.all([
    getGuildSettings(guildId),
    getPlayer(guildId),
  ]);

  const botUnavailable =
    !settingsRes.ok &&
    (settingsRes.error.code === 'NOT_CONFIGURED' ||
      settingsRes.error.code === 'BOT_UNREACHABLE' ||
      settingsRes.error.code === 'TIMEOUT');

  return (
    <div className="pt-28 pb-24">
      <Section className="pb-6">
        <Link href="/dashboard" className="text-sm text-mimi-muted hover:text-mimi-text">
          ← Tất cả server
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-mimi-text">
            {settingsRes.ok ? settingsRes.data.guild.name : 'Quản lý server'}
          </h1>
          {botUnavailable ? (
            <StatusBadge tone="offline" label="Bot chưa sẵn sàng" />
          ) : settingsRes.ok ? (
            <StatusBadge tone="online" label="Đã kết nối bot" pulse />
          ) : (
            <StatusBadge tone="unknown" label="Đang đồng bộ" />
          )}
        </div>
      </Section>

      {botUnavailable ? (
        <Section>
          <div className="mimi-card px-6 py-12 text-center text-sm text-mimi-muted">
            Chưa kết nối được với bot. Điều này xảy ra khi bot đang offline hoặc Internal API chưa được cấu
            hình. Cấu hình và player sẽ hiển thị ngay khi bot sẵn sàng.
          </div>
        </Section>
      ) : (
        <Section className="grid gap-6 lg:grid-cols-2">
          {/* Player trực tiếp */}
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-mimi-text">Trình phát</h2>
            <LivePlayer
              guildId={guildId}
              initialPlayer={playerRes.ok ? playerRes.data.player : null}
            />
          </div>

          {/* Cấu hình server */}
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-mimi-text">Cấu hình</h2>
            {settingsRes.ok ? (
              <SettingsForm guildId={guildId} initial={settingsRes.data.settings} />
            ) : (
              <div className="mimi-card p-6 text-sm text-mimi-muted">
                Không đọc được cấu hình server: {settingsRes.error.message}
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
