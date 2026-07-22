import { z } from "zod";

// =====================================================================
// 🔐 VALIDATE BIẾN MÔI TRƯỜNG (nguồn duy nhất)
// ---------------------------------------------------------------------
// Fail-fast ở production: thiếu biến bắt buộc -> build/khởi động báo lỗi rõ
// ràng thay vì lỗi mơ hồ lúc chạy. Các biến OAuth + Bot API để optional vì
// chủ dự án cấp sau — khi chưa có, tính năng tương ứng hiển thị trạng thái
// "chưa cấu hình" thay vì crash.
//
// Tên biến ở đây là CHUẨN, khớp với web/.env.example và MIMI_API_TOKEN bên bot.
// =====================================================================

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // URL nội bộ tới Internal API của bot (vd: http://127.0.0.1:8787 hoặc qua tunnel)
  BOT_API_INTERNAL_URL: z.string().url().optional(),
  // Service token — PHẢI trùng với MIMI_API_TOKEN đặt ở phía bot
  MIMI_API_TOKEN: z.string().min(1).optional(),

  // Discord OAuth — chủ dự án cấp sau
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z.string().url().optional(),

  // Bí mật ký/mã hoá session cookie (>= 32 ký tự khuyến nghị)
  AUTH_SECRET: z.string().min(16).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_BOT_NAME: z.string().default("Mimi"),
  NEXT_PUBLIC_BOT_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_BOT_INVITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_DISCORD_SUPPORT_URL: z.string().url().optional(),
});

function parse<T extends z.ZodTypeAny>(schema: T, source: Record<string, unknown>): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    const msg = `❌ Biến môi trường không hợp lệ:\n${issues}`;
    // Chỉ throw ở production để không chặn dev khi mới clone chưa cấu hình.
    if (process.env.NODE_ENV === "production") throw new Error(msg);
    // eslint-disable-next-line no-console
    console.warn(msg);
    // dev: vẫn chạy, bỏ qua field lỗi để dùng default ở nơi có default
    const relaxed = schema.safeParse(source);
    if (relaxed.success) return relaxed.data;
    // fallback tối thiểu: parse object rỗng để lấy default
    return schema.parse({});
  }
  return result.data;
}

export const serverEnv = parse(serverSchema, process.env);

// NEXT_PUBLIC_* phải được truy cập tĩnh để Next inline vào client bundle.
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BOT_NAME: process.env.NEXT_PUBLIC_BOT_NAME,
  NEXT_PUBLIC_BOT_CLIENT_ID: process.env.NEXT_PUBLIC_BOT_CLIENT_ID,
  NEXT_PUBLIC_BOT_INVITE_URL: process.env.NEXT_PUBLIC_BOT_INVITE_URL,
  NEXT_PUBLIC_DISCORD_SUPPORT_URL: process.env.NEXT_PUBLIC_DISCORD_SUPPORT_URL,
});

/** Object gộp tiện dùng ở cả server & client (chỉ chứa field an toàn cho client qua clientEnv). */
export const env = { ...serverEnv, ...clientEnv };

/** Bot API đã được cấu hình đủ để gọi chưa? */
export const isBotApiConfigured = Boolean(
  serverEnv.BOT_API_INTERNAL_URL && serverEnv.MIMI_API_TOKEN,
);

/** Discord OAuth đã được cấu hình đủ chưa? */
export const isOAuthConfigured = Boolean(
  serverEnv.DISCORD_CLIENT_ID &&
    serverEnv.DISCORD_CLIENT_SECRET &&
    serverEnv.DISCORD_REDIRECT_URI &&
    serverEnv.AUTH_SECRET,
);
