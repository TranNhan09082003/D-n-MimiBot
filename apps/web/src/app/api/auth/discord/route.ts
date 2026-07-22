import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.BOT_CLIENT_ID || "1143387904064888942";
  const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/callback/discord";

  const state = Math.random().toString(36).substring(2, 15);
  const scope = "identify guilds";

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

  const response = NextResponse.redirect(discordAuthUrl);
  response.cookies.set("mimi_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  return response;
}
