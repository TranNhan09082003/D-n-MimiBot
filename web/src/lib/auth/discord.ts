import "server-only";
import { serverEnv } from "@/lib/env";
import type { SessionUser } from "./session";

// =====================================================================
// 🌐 DISCORD OAUTH2 (Authorization Code Flow)
// ---------------------------------------------------------------------
// Scope tối thiểu: identify + guilds. Không xin email/tin nhắn.
// Mọi hàm ở đây chạy phía server (client secret không lộ ra browser).
// =====================================================================

const DISCORD_API = "https://discord.com/api/v10";
const OAUTH_SCOPE = "identify guilds";

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

/** Quyền MANAGE_GUILD (0x20) — dùng để lọc server người dùng có thể quản lý. */
const MANAGE_GUILD = 0x20n;

export function canManageGuild(g: DiscordGuild): boolean {
  if (g.owner) return true;
  try {
    return (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

/** Tạo URL để chuyển hướng người dùng tới trang cấp quyền Discord. */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: serverEnv.DISCORD_CLIENT_ID ?? "",
    redirect_uri: serverEnv.DISCORD_REDIRECT_URI ?? "",
    response_type: "code",
    scope: OAUTH_SCOPE,
    state,
    prompt: "consent",
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/** Đổi authorization code lấy access token. */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: serverEnv.DISCORD_CLIENT_ID ?? "",
    client_secret: serverEnv.DISCORD_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: serverEnv.DISCORD_REDIRECT_URI ?? "",
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange thất bại: HTTP ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

interface DiscordUserRaw {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

/** Lấy thông tin người dùng hiện tại từ access token. */
export async function fetchUser(accessToken: string): Promise<SessionUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Không lấy được thông tin người dùng: HTTP ${res.status}`);
  const u = (await res.json()) as DiscordUserRaw;
  return {
    id: u.id,
    username: u.username,
    globalName: u.global_name,
    avatar: u.avatar,
  };
}

/** Lấy danh sách guild của người dùng. */
export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Không lấy được danh sách server: HTTP ${res.status}`);
  return (await res.json()) as DiscordGuild[];
}

/** URL avatar Discord (hoặc null để UI dùng ảnh mặc định). */
export function userAvatarUrl(user: SessionUser, size = 64): string | null {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
}

/** URL icon guild. */
export function guildIconUrl(guild: Pick<DiscordGuild, "id" | "icon">, size = 64): string | null {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
}
