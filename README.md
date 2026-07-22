# Mimi — Hệ sinh thái bot nhạc Discord

Mimi gồm ba phần chạy cùng nhau:

| Thành phần | Vị trí | Vai trò |
|-----------|--------|---------|
| **Bot Discord** | gốc repo (`index.js`) | Phát nhạc, TTS, kinh tế, xác minh, ticket… |
| **Internal API** | `internalApi.js` | HTTP server nội bộ trong tiến trình bot, cho website gọi vào |
| **Website + Dashboard** | `web/` | Trang giới thiệu (Next.js) + dashboard quản lý qua đăng nhập Discord |

Website và bot **không dùng chung tiến trình**. Web gọi bot qua Internal API bằng một service token bí mật, theo mô hình server-to-server.

```
Trình duyệt ──▶ Next.js (server) ──Bearer token──▶ Internal API ──▶ Bot Discord
     ▲               │
     └── OAuth Discord (identify + guilds)
```

## Bắt đầu nhanh

### 1. Bot

```bash
npm install
# Điền token vào config.json: { "token": "...", "clientId": "..." }
# (tuỳ chọn) đặt MIMI_API_TOKEN để bật Internal API — xem .env.example
node index.js
```

Nếu không đặt `MIMI_API_TOKEN`, bot vẫn chạy bình thường nhưng Internal API sẽ **không** khởi động (an toàn — không mở cổng không xác thực).

### 2. Website

```bash
cd web
cp .env.example .env.local   # rồi điền giá trị
npm install
npm run dev                  # http://localhost:3000
```

## Tài liệu

- [Kiến trúc](docs/ARCHITECTURE.md) — cách các phần ghép với nhau, luồng dữ liệu
- [Triển khai](docs/DEPLOYMENT.md) — deploy bot (VibeHost/SFTP) và web (Nhân Hòa)
- [Bảo mật](docs/SECURITY.md) — mô hình xác thực, token, quyền, xử lý dữ liệu
- [AGENTS.md](AGENTS.md) — quy ước cho người/agent làm việc trên repo này

## Nguyên tắc dự án

- **An toàn dữ liệu trước tiên**: không thay đổi phá vỡ cấu hình bot hiện có; ghi file cấu hình theo kiểu ghi tạm rồi rename.
- **Không bịa số liệu**: mọi số liệu (server, người dùng, uptime) đều lấy thật từ bot; khi chưa có thì hiển thị trạng thái trung tính ("Đang đồng bộ").
- **Chỉ quảng bá tính năng có thật**: danh sách tính năng đối chiếu trực tiếp với mã nguồn bot.
- **Tối thiểu quyền**: OAuth chỉ xin `identify` + `guilds`; Internal API dùng allowlist cho các khoá cấu hình được sửa.
