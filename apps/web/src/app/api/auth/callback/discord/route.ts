import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = req.cookies.get("mimi_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/dashboard?error=invalid_state", req.url));
  }

  // Session cookie setup
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("mimi_session", "demo_authenticated_session_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400 * 7, // 7 days
  });

  return response;
}
