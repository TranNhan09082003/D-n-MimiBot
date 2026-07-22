import "server-only";
import { getSession } from "./session";
import { fetchUserGuilds, canManageGuild } from "./discord";

// =====================================================================
// 🛡️ GUARD: xác thực người dùng quản lý được guild (dùng trong route proxy)
// ---------------------------------------------------------------------
// Trả về null nếu hợp lệ, hoặc { status, message } để route trả lỗi.
// Luôn kiểm tra lại quyền ở SERVER — không tin tham số từ client.
// =====================================================================

export interface GuardFail {
  status: number;
  code: string;
  message: string;
}

export async function requireGuildManager(guildId: string): Promise<GuardFail | null> {
  const session = await getSession();
  if (!session) {
    return { status: 401, code: "UNAUTHENTICATED", message: "Bạn chưa đăng nhập." };
  }
  try {
    const guilds = await fetchUserGuilds(session.accessToken);
    const g = guilds.find((x) => x.id === guildId);
    if (!g || !canManageGuild(g)) {
      return { status: 403, code: "FORBIDDEN", message: "Bạn không có quyền quản lý server này." };
    }
  } catch {
    return { status: 401, code: "SESSION_EXPIRED", message: "Phiên đăng nhập đã hết hạn." };
  }
  return null;
}
