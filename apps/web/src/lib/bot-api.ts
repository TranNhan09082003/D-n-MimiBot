// =====================================================================
// 🔌 CLIENT GỌI INTERNAL API CỦA BOT (chỉ chạy phía server)
// ---------------------------------------------------------------------
// - KHÔNG bao giờ import file này vào Client Component.
// - Token đọc từ env server-side, không lộ ra browser.
// - Có timeout + retry giới hạn cho các request GET (idempotent).
// - Trả về kiểu Result rõ ràng để UI xử lý trạng thái lỗi/offline.
// =====================================================================

import "server-only";
import { serverEnv } from "./env";
import type {
  BotStatus,
  CommandInfo,
  GuildSettings,
  GuildSummary,
  PublicPlayerState,
  PublicTrack,
} from "./types";

export type BotResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string }; status: number };

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  // số lần thử lại tối đa cho request idempotent (GET). Mặc định 1 (không thử lại).
  retries?: number;
  timeoutMs?: number;
  // revalidate cho fetch cache của Next.js (giây). 0 = no-store.
  revalidate?: number;
}

const BASE = (serverEnv.BOT_API_INTERNAL_URL ?? "").replace(/\/+$/, "");
const TOKEN = serverEnv.MIMI_API_TOKEN ?? "";

async function callBot<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<BotResult<T>> {
  const {
    method = "GET",
    body,
    retries = method === "GET" ? 2 : 0,
    timeoutMs = 5000,
    revalidate = 0,
  } = opts;

  // Chưa cấu hình Bot API -> trả lỗi sạch, không fetch URL rỗng.
  if (!BASE || !TOKEN) {
    return {
      ok: false,
      error: { code: "NOT_CONFIGURED", message: "Chưa cấu hình kết nối tới bot." },
      status: 503,
    };
  }

  let attempt = 0;
  let lastError: { code: string; message: string; status: number } = {
    code: "UNKNOWN",
    message: "Không xác định",
    status: 503,
  };

  while (attempt <= retries) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        // Với GET có thể để Next cache ngắn; POST/PATCH luôn no-store.
        ...(method === "GET" && revalidate > 0
          ? { next: { revalidate } }
          : { cache: "no-store" as RequestCache }),
      });
      clearTimeout(timer);

      const json = (await res.json().catch(() => null)) as
        | (Record<string, unknown> & { error?: { code: string; message: string } })
        | null;

      if (!res.ok || !json || json.ok === false) {
        const err = json?.error ?? {
          code: "BOT_ERROR",
          message: `Bot trả về HTTP ${res.status}`,
        };
        // 4xx là lỗi logic — không thử lại. 5xx/timeout mới thử lại.
        if (res.status < 500) {
          return { ok: false, error: err, status: res.status };
        }
        lastError = { ...err, status: res.status };
      } else {
        return { ok: true, data: json as T };
      }
    } catch (e) {
      clearTimeout(timer);
      const aborted = e instanceof Error && e.name === "AbortError";
      lastError = {
        code: aborted ? "TIMEOUT" : "BOT_UNREACHABLE",
        message: aborted
          ? "Bot phản hồi quá chậm."
          : "Không kết nối được tới bot.",
        status: 503,
      };
    }
    // backoff nhẹ trước khi thử lại
    if (attempt <= retries) await new Promise((r) => setTimeout(r, 300 * attempt));
  }

  return {
    ok: false,
    error: { code: lastError.code, message: lastError.message },
    status: lastError.status,
  };
}

// ---------------------------------------------------------------------
// Các hàm cấp cao dùng trong Server Components / Route Handlers
// ---------------------------------------------------------------------

export function getBotStatus() {
  return callBot<{ ok: true } & BotStatus>("/internal/status", {
    revalidate: 15,
  });
}

export function getCommands() {
  return callBot<{ ok: true; commands: CommandInfo[]; count: number }>(
    "/internal/commands",
    { revalidate: 300 },
  );
}

export function getGuildSettings(guildId: string) {
  return callBot<{ ok: true; guild: GuildSummary; settings: GuildSettings }>(
    `/internal/guilds/${encodeURIComponent(guildId)}/settings`,
  );
}

export function patchGuildSettings(
  guildId: string,
  patch: Partial<Pick<GuildSettings, "prefix" | "unverifyOnMute" | "verifyDailyMode">>,
) {
  return callBot<{ ok: true; applied: Record<string, unknown> }>(
    `/internal/guilds/${encodeURIComponent(guildId)}/settings`,
    { method: "PATCH", body: patch },
  );
}

export function getPlayer(guildId: string) {
  return callBot<{ ok: true; player: PublicPlayerState }>(
    `/internal/guilds/${encodeURIComponent(guildId)}/player`,
  );
}

export function playerAction(
  guildId: string,
  action: "pause" | "resume" | "skip" | "stop" | "volume",
  body?: { volume?: number },
) {
  return callBot<{ ok: true; player: PublicPlayerState }>(
    `/internal/guilds/${encodeURIComponent(guildId)}/player/${action}`,
    { method: "POST", body },
  );
}

export type { PublicTrack };
