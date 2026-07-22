import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, fetchUser } from "@/lib/auth/discord";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { isOAuthConfigured } from "@/lib/env";

// Nhận callback từ Discord: kiểm tra state, đổi code lấy token, tạo session.
export const dynamic = "force-dynamic";

const STATE_COOKIE = "mimi_oauth_state";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  if (!isOAuthConfigured) {
    return NextResponse.redirect(new URL("/?auth=not_configured", SITE));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const jar = cookies();
  const savedState = jar.get(STATE_COOKIE)?.value;
  // Dọn state cookie ngay dù thành công hay không.
  jar.delete(STATE_COOKIE);

  if (error) {
    return NextResponse.redirect(new URL("/?auth=denied", SITE));
  }
  if (!code || !state || !savedState || state !== savedState) {
    // state không khớp -> nghi ngờ CSRF, từ chối.
    return NextResponse.redirect(new URL("/?auth=invalid_state", SITE));
  }

  try {
    const token = await exchangeCode(code);
    const user = await fetchUser(token.access_token);

    const session = await createSession({
      user,
      accessToken: token.access_token,
      tokenExpiresAt: Math.floor(Date.now() / 1000) + token.expires_in,
    });

    const res = NextResponse.redirect(new URL("/dashboard", SITE));
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.redirect(new URL("/?auth=error", SITE));
  }
}
