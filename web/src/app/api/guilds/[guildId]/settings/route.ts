import { NextResponse } from "next/server";
import { requireGuildManager } from "@/lib/auth/guard";
import { getGuildSettings, patchGuildSettings } from "@/lib/bot-api";
import type { GuildSettings } from "@/lib/types";

// Proxy có xác thực: client -> route này -> Internal API của bot.
// Token bot KHÔNG bao giờ lộ ra client; quyền được kiểm tra lại tại đây.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { guildId: string } }) {
  const fail = await requireGuildManager(params.guildId);
  if (fail) return NextResponse.json({ ok: false, error: fail }, { status: fail.status });

  const res = await getGuildSettings(params.guildId);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true, settings: res.data.settings, guild: res.data.guild });
}

// Chỉ cho phép chỉnh các khoá an toàn (khớp allowlist phía bot).
const EDITABLE: (keyof Pick<GuildSettings, "prefix" | "unverifyOnMute" | "verifyDailyMode">)[] = [
  "prefix",
  "unverifyOnMute",
  "verifyDailyMode",
];

export async function PATCH(req: Request, { params }: { params: { guildId: string } }) {
  const fail = await requireGuildManager(params.guildId);
  if (fail) return NextResponse.json({ ok: false, error: fail }, { status: fail.status });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Dữ liệu không hợp lệ." } },
      { status: 400 },
    );
  }

  // Lọc chỉ giữ khoá được phép + validate kiểu cơ bản.
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (!(key in body)) continue;
    const v = body[key];
    if (key === "prefix") {
      if (typeof v !== "string" || v.length < 1 || v.length > 5) {
        return NextResponse.json(
          { ok: false, error: { code: "BAD_REQUEST", message: "Prefix phải dài 1–5 ký tự." } },
          { status: 400 },
        );
      }
      patch[key] = v;
    } else {
      if (typeof v !== "boolean") {
        return NextResponse.json(
          { ok: false, error: { code: "BAD_REQUEST", message: `${key} phải là true/false.` } },
          { status: 400 },
        );
      }
      patch[key] = v;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "NO_CHANGES", message: "Không có thay đổi hợp lệ." } },
      { status: 400 },
    );
  }

  const res = await patchGuildSettings(params.guildId, patch);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true, applied: res.data.applied });
}
