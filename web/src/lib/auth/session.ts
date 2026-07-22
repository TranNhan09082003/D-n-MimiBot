import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { serverEnv } from "@/lib/env";

// =====================================================================
// 🔑 SESSION COOKIE (ký bằng JWT/jose)
// ---------------------------------------------------------------------
// - Chỉ lưu thông tin tối thiểu để hiển thị: id, username, avatar.
// - KHÔNG lưu access_token của Discord trong cookie gửi về client dạng
//   đọc được — cả payload được ký (HS256) và cookie đặt httpOnly.
// - Guilds không nhét vào cookie (có thể lớn) — fetch lại khi cần.
// =====================================================================

export const SESSION_COOKIE = "mimi_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 ngày

export interface SessionUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface SessionData {
  user: SessionUser;
  // access_token dùng để gọi Discord API (lấy guilds). Được ký + httpOnly.
  accessToken: string;
  // thời điểm hết hạn access_token (epoch giây) để biết khi nào cần refresh/login lại.
  tokenExpiresAt: number;
}

function secretKey(): Uint8Array {
  const secret = serverEnv.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET chưa được cấu hình.");
  return new TextEncoder().encode(secret);
}

export async function createSession(data: SessionData): Promise<string> {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const data = payload as unknown as SessionData;
    if (!data?.user?.id || !data.accessToken) return null;
    return data;
  } catch {
    return null;
  }
}

/** Đọc session hiện tại từ cookie (Server Component / Route Handler). */
export async function getSession(): Promise<SessionData | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Ghi cookie session (dùng trong Route Handler sau khi login thành công). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
