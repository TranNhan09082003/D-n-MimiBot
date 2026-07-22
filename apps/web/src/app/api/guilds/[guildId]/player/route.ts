import { NextResponse } from "next/server";
import { requireGuildManager } from "@/lib/auth/guard";
import { getPlayer } from "@/lib/bot-api";

// Lấy trạng thái player hiện tại (dùng cho polling nhẹ ở client).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { guildId: string } }) {
  const fail = await requireGuildManager(params.guildId);
  if (fail) return NextResponse.json({ ok: false, error: fail }, { status: fail.status });

  const res = await getPlayer(params.guildId);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true, player: res.data.player });
}
