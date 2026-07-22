# AGENTS.md — HƯỚNG DẪN CHO AI AGENTS & DEVELOPERS

Tài liệu này chứa các quy tắc phát triển, vận hành và bảo trì bắt buộc đối với hệ sinh thái Discord Music Bot Mimi và Website Dashboard.

---

## 1. TỔNG QUAN KIẾN TRÚC & HẠ TẦNG

- **Dự án:** Mimi — Discord Music Bot Ecosystem
- **Bot Stack:** Node.js (v20+), `discord.js` (v14), `@discordjs/voice`, `yt-dlp-exec`, `google-tts-api`, `node-cron`.
- **Database:** File-based JSON Database (`config.json`, `economy.json`, `created_channels.json`) sử dụng ghi đè nguyên tử qua file tạm (`.tmp`).
- **Support Link:** `https://discord.gg/awYxnqfqRr` (Cấu hình qua `DISCORD_SUPPORT_URL`).
- **Deployment:** GitHub Actions SFTP deploy tới VibeHost (`hcm3.vibehost.vn`) kết hợp Pterodactyl REST API để restart service.

---

## 2. QUY TRÌNH PHÁT TRIỂN & TEST (DEVELOPMENT WORKFLOW)

Trước khi gửi báo cáo hoàn thành công việc, Agent/Developer **bắt buộc** phải chạy và xác nhận thành công các lệnh:

```bash
npm run check    # Kiểm tra syntax JS (node --check index.js)
npm run test     # Chạy toàn bộ unit test suite (node --test)
```

---

## 3. NGUYÊN TẮC AN TOÀN & BẢO MẬT BẮT BUỘC

1. **Không log Credential:** Tuyệt đối không log `BOT_TOKEN`, `INTERNAL_API_SECRET`, `SFTP_PASSWORD`, cookie hoặc session token ra console hoặc log file.
2. **Atomic File Write:** Mọi thao tác lưu database JSON phải qua file tạm `.tmp` rồi rename (`fs.renameSync`) để chống hỏng file khi bot crash mid-write.
3. **Role Hierarchy Safety:** Khi thao tác role (`add`, `remove`), luôn bắt buộc bọc trong `try/catch` có xử lý lỗi tường minh. Trả về mã lỗi chuẩn `MIMI-VERIFY-ROLE-002` nếu thiếu quyền hoặc vị trí role không đủ cao.
4. **Cấm các lệnh phá hủy tự động:**
   - Không chạy `rm -rf /`, `git reset --hard`, xóa database hoặc xóa volume production nếu chưa được xác nhận.
5. **Giới hạn Rate Limit Discord API:**
   - Khi thao tác hàng loạt (Reset xác thực toàn server), bắt buộc chia theo batch (tối đa 5-10 thành viên/đợt) kèm delay tối thiểu 200-250ms giữa các batch.

---

## 4. HƯỚNG DẪN BÁO CÁO THAY ĐỔI

Khi thực hiện refactor hoặc sửa lỗi:
- Liệt kê file đã sửa kèm dòng bị ảnh hưởng.
- Nêu rõ nguyên nhân gốc rễ (Root Cause) thay vì patch triệu chứng.
- Đính kèm kết quả test (`npm run test` & `npm run check`).
