# Bảo mật

Tài liệu này mô tả mô hình bảo mật của hệ sinh thái Mimi: xác thực, phân quyền, xử lý token và dữ liệu.

## Nguyên tắc

- **Tối thiểu quyền**: chỉ xin/cho đúng phần cần thiết.
- **Không tin client**: mọi quyền đều kiểm tra lại ở server.
- **Token không rời server**: service token của bot chỉ tồn tại phía server Next.js, không bao giờ gửi ra trình duyệt.
- **Suy giảm an toàn**: thiếu cấu hình thì tắt tính năng, không mở cổng/quyền mặc định.

## Internal API (bot)

- **Xác thực**: mọi `/internal/*` yêu cầu `Authorization: Bearer <MIMI_API_TOKEN>`, so khớp bằng `crypto.timingSafeEqual` (chống timing attack).
- **Không token → không mở cổng**: nếu `MIMI_API_TOKEN` trống, server API không khởi động.
- **Bind nội bộ**: khuyến nghị `MIMI_API_HOST=127.0.0.1` khi web cùng máy. Nếu khác máy, mở `0.0.0.0` nhưng **chặn firewall** chỉ cho IP của web.
- **Rate limit**: cửa sổ trượt theo IP để hạn chế lạm dụng.
- **Allowlist ghi cấu hình**: PATCH settings chỉ nhận các khoá trong `editableSettingKeys` (`prefix`, `unverifyOnMute`, `verifyDailyMode`); giá trị được validate theo kiểu. Không cho ghi khoá tùy ý.
- **Không lộ dữ liệu nhạy cảm**: chỉ trả dạng "public" (không token, không ID nội bộ), không trả stack trace.
- **Giới hạn payload**: body JSON tối đa 256 KiB; request-id gắn cho mỗi request để truy vết log.

## OAuth Discord (web)

- **Scope tối thiểu**: chỉ `identify` + `guilds`. Không xin email, không đọc tin nhắn.
- **Chống CSRF**: tham số `state` ngẫu nhiên, lưu cookie httpOnly 10 phút, kiểm khớp ở callback.
- **Client secret** chỉ dùng phía server khi đổi code lấy token.

## Session

- Lưu trong cookie `mimi_session`, là JWT ký HS256 bằng `AUTH_SECRET` (jose).
- Cookie đặt `httpOnly`, `sameSite=lax`, `secure` ở production, hạn 7 ngày.
- Payload chỉ chứa thông tin hiển thị (id, username, avatar) và access token để gọi Discord API. Không lưu refresh token trong cookie.

## Phân quyền dashboard

- Danh sách server lọc bằng `canManageGuild` (chủ sở hữu hoặc có `MANAGE_GUILD`).
- **Kiểm tra hai lần**: khi mở `/dashboard/[guildId]` (Server Component) và mỗi lần gọi route proxy `/api/guilds/[guildId]/*` (`requireGuildManager`). Không dựa vào việc ẩn UI.
- Route proxy là ranh giới tin cậy: client → proxy (kiểm quyền) → Internal API (token bot).

## Xử lý dữ liệu

- Bot lưu cấu hình theo guild trong `config.json`, ghi kiểu tạm-rồi-rename để tránh hỏng file.
- Không ghi âm, không lưu nội dung âm thanh; truy vấn nhạc chỉ gửi tới nguồn phát.
- Người dùng có thể gỡ bot để dừng xử lý, hoặc yêu cầu xóa dữ liệu (xem trang `/data-deletion`).

## Danh sách kiểm tra khi triển khai

- [ ] `MIMI_API_TOKEN` là chuỗi ngẫu nhiên mạnh, trùng khớp hai đầu.
- [ ] `AUTH_SECRET` ≥ 32 ký tự, ngẫu nhiên, không tái sử dụng.
- [ ] Cổng Internal API không mở công khai (firewall hoặc bind 127.0.0.1).
- [ ] `DISCORD_REDIRECT_URI` chạy trên HTTPS ở production và khớp Developer Portal.
- [ ] Không commit `.env`, `config.json` chứa bí mật lên repo.
- [ ] Secret GitHub Actions (`SFTP_PASSWORD`, Pterodactyl) đặt trong repo secrets, không hardcode.

## Báo lỗi bảo mật

Nếu phát hiện lỗ hổng, liên hệ qua server cộng đồng (link ở chân trang web) thay vì mở issue công khai.
