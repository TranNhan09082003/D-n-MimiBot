import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Đăng xuất: xoá cookie session rồi quay về trang chủ.
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function clearAndRedirect() {
  const res = NextResponse.redirect(new URL("/", SITE));
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET() {
  return clearAndRedirect();
}

export async function POST() {
  return clearAndRedirect();
}
