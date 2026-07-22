# Deploy Mimi Web lên cPanel Nhân Hòa (Node.js App)

Hosting Nhân Hòa gói STARTUP chạy Node.js qua **Phusion Passenger**. Web Mimi là
Next.js **động** (có dashboard, đăng nhập Discord, API routes) nên bắt buộc phải
chạy ở chế độ Node.js App, không phải upload tĩnh.

> ⚠️ Điều kiện tiên quyết: trong cPanel phải có mục **Setup Node.js App**
> (Software → Setup Node.js App). Nếu KHÔNG có mục này thì gói hosting không hỗ
> trợ Node.js và web động sẽ không chạy được — khi đó cần đổi sang VPS hoặc Vercel.

## 1. Chuẩn bị nguồn

Repo: <https://github.com/TranNhan09082003/Website-Mini-Bot> (nhánh `main`).
Toàn bộ file web nằm ở gốc repo (next.config.mjs, package.json, server.js, src/…).

## 2. Tạo Node.js App trong cPanel

Software → **Setup Node.js App** → **Create Application**:

- **Node.js version**: chọn 18.x hoặc 20.x (khớp `engines`, xem bên dưới).
- **Application mode**: `Production`.
- **Application root**: ví dụ `mimibot-web` (thư mục chứa mã nguồn).
- **Application URL**: domain `mimibot.id.vn` (hoặc subdomain).
- **Application startup file**: `server.js`  ← quan trọng, Passenger gọi file này.

Bấm **Create**. cPanel tạo virtualenv Node và một `.htaccess` Passenger.

## 3. Upload mã nguồn

Đưa mã vào `Application root` (KHÔNG upload `node_modules/` và `.next/`):

- Cách A (khuyên dùng): dùng **Git Version Control** của cPanel clone repo trên,
  hoặc `git pull` mỗi lần cập nhật.
- Cách B: nén rồi upload qua File Manager / FTP, giải nén vào Application root.

## 4. Cài dependencies + build

Trong trang Setup Node.js App, mở **"Run NPM Install"**, hoặc vào terminal
virtualenv (cPanel hiển thị lệnh `source /home/.../bin/activate`) rồi chạy:

```bash
npm install
npm run build       # tạo thư mục .next (production)
```

`server.js` sẽ phục vụ bản build này. Mỗi lần đổi code phải `npm run build` lại.

## 5. Biến môi trường (Environment variables)

Thêm trong phần **Environment variables** của Node.js App (KHÔNG commit `.env`):

Xem `.env.example` để biết đủ danh sách. Tối thiểu:

- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI` = `https://mimibot.id.vn/api/auth/callback`
- `SESSION_SECRET` (chuỗi ngẫu nhiên dài)
- `MIMI_API_TOKEN`, `MIMI_API_HOST`, `MIMI_API_PORT` — để dashboard gọi Internal
  API của bot (bot chạy ở VibeHost). Host phải là địa chỉ bot **truy cập được từ
  ngoài**; nếu bot chỉ mở nội bộ thì phần điều khiển nhạc sẽ không kết nối được.
- `NEXT_PUBLIC_DISCORD_SUPPORT_URL` = `https://discord.gg/q8CfajzPuc`

Nhớ khai báo redirect URI trên trong **Discord Developer Portal → OAuth2**.

## 6. Khởi động lại

Sau khi build + set env: bấm **Restart** trong Setup Node.js App. Passenger nạp
lại `server.js`. Mở `https://mimibot.id.vn` để kiểm tra.

## 7. Lưu ý kết nối bot (Internal API)

Dashboard điều khiển nhạc bằng cách gọi Internal API của bot. Bot ở VibeHost, web
ở Nhân Hòa — hai host khác nhau. Để hoạt động:

- Bot phải expose Internal API ra Internet (cổng `MIMI_API_PORT`) có Bearer token.
- `MIMI_API_HOST` trên web trỏ tới IP/domain công khai của VibeHost.
- Nếu không mở được, các trang tĩnh (giới thiệu, lệnh, tính năng) vẫn chạy bình
  thường; chỉ phần điều khiển realtime trong dashboard là không kết nối.
