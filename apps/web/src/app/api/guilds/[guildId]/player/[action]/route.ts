import { NextResponse } from "next/server";
import { requireGuildManager } from "@/lib/auth/guard";
import { playerAction } from "@/lib/bot-api";

// Thực thi hành động điều khiển player: pause/resume/skip/stop/volume.
export const dynamic = "force-dynamic";

const ALLOWED = ["pause", "resume", "skip", "stop", "volume"] as const;
type Action = (typeof ALLOWED)[number];

function isAction(x: string): x is Action {
  return (ALLOWED as readonly string[]).includes(x);
}

export async function POST(
  req: Request,
  { params }: { params: { guildId: string; action: string } },
) {
  const fail = await requireGuildManager(params.guildId);
  if (fail) return NextResponse.json({ ok: false, error: fail }, { status: fail.status });

  if (!isAction(params.action)) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_ACTION", message: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  }

  let body: { volume?: number } | undefined;
  if (params.action === "volume") {
    try {
      const raw = (await req.json()) as { volume?: unknown };
      const vol = Number(raw?.volume);
      if (!Number.isFinite(vol) || vol < 0 || vol > 150) {
        return NextResponse.json(
          { ok: false, error: { code: "BAD_REQUEST", message: "Âm lượng phải từ 0 đến 150." } },
          { status: 400 },
        );
      }
      body = { volume: Math.round(vol) };
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Thiếu giá trị âm lượng." } },
        { status: 400 },
      );
    }
  }

  const res = await playerAction(params.guildId, params.action, body);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true, player: res.data.player });
}
