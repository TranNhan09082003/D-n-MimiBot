import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildAuthorizeUrl } from "@/lib/auth/discord";
import { isOAuthConfigured } from "@/lib/env";

// Bắt đầu luồng OAuth: sinh state chống CSRF, đặt cookie tạm, redirect sang Discord.
export const dynamic = "force-dynamic";

const STATE_COOKIE = "mimi_oauth_state";

export async function GET() {
  if (!isOAuthConfigured) {
    // Chưa cấu hình OAuth -> quay về trang chủ kèm thông báo, không lộ chi tiết.
    return NextResponse.redirect(
      new URL("/?auth=not_configured", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    );
  }

  const state = randomBytes(16).toString("hex");
  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 phút đủ để hoàn tất login
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
