import { Shield } from "lucide-react";

export const metadata = {
  title: "Chính Sách Bảo Mật — Mimi Bot Privacy Policy",
  description: "Chính sách bảo mật dữ liệu cá nhân và thông tin máy chủ của Mimi Discord Bot.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#b89cff]">
            <Shield className="w-3.5 h-3.5" />
            <span>PRIVACY POLICY</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Chính Sách Bảo Mật Dữ Liệu
          </h1>
          <p className="text-sm text-[#a5a1b5]">Cập nhật lần cuối: 22/07/2026</p>
        </div>

        <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-6 text-sm text-[#a5a1b5] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">1. Dữ Liệu Được Thu Thập</h2>
            <p>MimiBot chỉ thu thập các dữ liệu tối thiểu cần thiết để vận hành dịch vụ:</p>
            <ul className="list-disc pl-5 space-y-1 text-[#a5a1b5]">
              <li>ID máy chủ (Guild ID), ID kênh (Channel ID) và ID vai trò (Role ID) cho cấu hình xác thực/chấm công.</li>
              <li>User ID, Tên hiển thị Discord cho hồ sơ economy và giờ công làm việc.</li>
              <li>Nội dung tin nhắn gửi trực tiếp (DM) tới Bot để chuyển tiếp cho đội ngũ quản trị hỗ trợ.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">2. Mục Đích Sử Dụng Dữ Liệu</h2>
            <p>
              Dữ liệu được thu thập chỉ phục vụ cho việc phát nhạc, điểm danh, xác thực thành viên và xử lý các sự cố kỹ thuật. Chúng tôi tuyệt đối không bán hoặc chia sẻ thông tin cá nhân cho bên thứ ba.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">3. Quyền Xóa Dữ Liệu</h2>
            <p>
              Quản trị viên máy chủ hoặc người dùng có thể gửi yêu cầu xóa toàn bộ thông tin cá nhân/server bằng lệnh <code className="text-[#65e6ff]">/resetsetup</code> hoặc truy cập trang <a href="/data-deletion" className="text-[#b89cff] underline">Yêu Cầu Xóa Dữ Liệu</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
