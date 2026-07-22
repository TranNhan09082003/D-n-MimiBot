# CHANGELOG.md — NHẬT KÝ THAY ĐỔI

## [1.1.0] - 2026-07-22

### 🔴 Đã sửa lỗi (Bug Fixes & P0 Fixes)
- **Xác thực:** Định nghĩa hàm `reopenLockedChannels` khi tắt xác thực (`/setupverify state:off`), khắc phục hoàn toàn lỗi không thể tắt xác thực.
- **Tái sử dụng Role:** Sửa `setupVerifySystem` tự động tìm và sử dụng lại role `"🔒 Chưa Xác Thực"` và `"✅ Đã Xác Thực"` hiện có thay vì tự tạo role trùng lặp.
- **Nút Xác thực (`verify_btn`):** Xử lý giao dịch gán role Đã Xác Thực & gỡ role Chưa Xác Thực an toàn; trả về mã lỗi `MIMI-VERIFY-ROLE-002` chuẩn khi thiếu quyền; tự động dọn role cũ nếu thành viên đã xác thực trước đó.
- **Support Link:** Cập nhật đồng bộ toàn bộ link máy chủ hỗ trợ về `https://discord.gg/q8CfajzPuc`.

### 🌟 Tính năng mới (New Features & P1)
- **Bulk Reset Verification:** Thêm lệnh `/resetverify-all` dành cho Administrator với bảng xác nhận nguy hiểm, xử lý theo đợt (batch/queue) tránh rate limit và báo cáo kết quả chi tiết.
- **Tách Chấm Công:** Thêm lệnh `/setupattendance` quản lý bật/tắt độc lập hệ thống chấm công nhân sự.
- **Cảnh Báo Economy Anomaly:** Tự động theo dõi tổng thu nhập trong ngày (múi giờ `Asia/Ho_Chi_Minh`), gửi DM & Log Alert cho Owner khi thu nhập vượt 5.000.000 xu.
- **Owner Forwarding System:** Chuyển tiếp tin nhắn DM trực tiếp và Tag Mention của người dùng tới Bot Owner kèm cooldown chống spam.
