import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Section } from '@/components/ui/section';
import { getSession } from '@/lib/auth/session';
import { fetchUserGuilds, canManageGuild, guildIconUrl, type DiscordGuild } from '@/lib/auth/discord';
import { isOAuthConfigured } from '@/lib/env';
import { LoginCta } from '@/components/dashboard/login-cta';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Quản lý Mimi trên các server của bạn.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!isOAuthConfigured) {
    return (
      <NotReady
        title="Dashboard đang chờ cấu hình"
        desc="Đăng nhập Discord chưa được bật trên bản triển khai này. Vui lòng quay lại sau."
      />
    );
  }

  const session = await getSession();
  if (!session) {
    return (
      <div className="pt-28 pb-24">
        <Section className="max-w-lg text-center">
          <h1 className="font-display text-3xl font-bold text-mimi-text">Đăng nhập để tiếp tục</h1>
          <p className="mt-3 text-sm text-mimi-muted">
            Đăng nhập bằng Discord để xem và quản lý những server có Mimi. Mimi chỉ đọc thông tin cơ bản và
            danh sách server của bạn.
          </p>
          <div className="mt-8 flex justify-center">
            <LoginCta />
          </div>
        </Section>
      </div>
    );
  }

  // Lấy guilds; nếu token hết hạn/hỏng -> yêu cầu đăng nhập lại.
  let guilds: DiscordGuild[] = [];
  let fetchFailed = false;
  try {
    guilds = await fetchUserGuilds(session.accessToken);
  } catch {
    fetchFailed = true;
  }

  const manageable = guilds.filter(canManageGuild);

  return (
    <div className="pt-28 pb-24">
      <Section className="pb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-3xl font-bold text-mimi-text">
              Xin chào, {session.user.globalName || session.user.username}
            </h1>
            <p className="mt-1 text-sm text-mimi-muted">Chọn một server để quản lý Mimi.</p>
          </div>
          <Link
            href="/api/auth/logout"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-mimi-text hover:bg-white/10"
          >
            Đăng xuất
          </Link>
        </div>
      </Section>

      <Section>
        {fetchFailed ? (
          <div className="mimi-card px-6 py-12 text-center">
            <p className="text-sm text-mimi-muted">
              Không lấy được danh sách server từ Discord. Phiên đăng nhập có thể đã hết hạn.
            </p>
            <div className="mt-4 flex justify-center">
              <LoginCta label="Đăng nhập lại" />
            </div>
          </div>
        ) : manageable.length === 0 ? (
          <div className="mimi-card px-6 py-12 text-center text-sm text-mimi-muted">
            Bạn chưa có server nào với quyền &quot;Quản lý máy chủ&quot;. Hãy tạo hoặc xin quyền ở một server,
            rồi mời Mimi vào đó.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {manageable.map((g) => {
              const icon = guildIconUrl(g, 64);
              return (
                <li key={g.id}>
                  <Link
                    href={`/dashboard/${g.id}`}
                    className="mimi-card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac"
                  >
                    {icon ? (
                      <Image
                        src={icon}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full"
                        unoptimized
                      />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-mimi-lilac/20 font-display text-lg text-mimi-lilac">
                        {g.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-mimi-text">{g.name}</span>
                      <span className="text-xs text-mimi-muted">{g.owner ? 'Chủ sở hữu' : 'Quản trị viên'}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-6 text-center text-xs text-mimi-muted/70">
          Chỉ những server bạn có quyền quản lý mới hiển thị ở đây. Nếu chưa thấy Mimi trong server, hãy mời
          Mimi trước.
        </p>
      </Section>
    </div>
  );
}

function NotReady({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pt-28 pb-24">
      <Section className="max-w-lg text-center">
        <h1 className="font-display text-3xl font-bold text-mimi-text">{title}</h1>
        <p className="mt-3 text-sm text-mimi-muted">{desc}</p>
      </Section>
    </div>
  );
}
