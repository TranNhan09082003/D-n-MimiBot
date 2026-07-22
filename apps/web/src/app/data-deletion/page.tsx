import { Trash2, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Yêu Cầu Xóa Dữ Liệu — Mimi Bot Data Deletion",
  description: "Hướng dẫn và quy trình gửi yêu cầu xóa dữ liệu máy chủ/cá nhân khỏi Mimi Bot.",
};

export default function DataDeletionPage() {
  const supportUrl = "https://discord.gg/awYxnqfqRr";

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#ff718b]">
            <Trash2 className="w-3.5 h-3.5" />
            <span>DATA DELETION REQUEST</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Hướng Dẫn Yêu Cầu Xóa Dữ Liệu
          </h1>
          <p className="text-sm text-[#a5a1b5]">
            Mimi tôn trọng quyền riêng tư dữ liệu của bạn. Dưới đây là các phương thức xóa dữ liệu.
          </p>
        </div>

        <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-6 text-sm text-[#a5a1b5] leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">Cách 1: Xóa Tự Động Trong Discord</h2>
            <p>
              Quản trị viên máy chủ có thể gõ lệnh <code className="text-[#65e6ff] font-mono">/resetsetup</code> trong server. Lệnh này sẽ ngay lập tức xóa toàn bộ cấu hình kênh, vai trò và dữ liệu lưu trữ của server đó khỏi bộ nhớ MimiBot.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">Cách 2: Gửi Yêu Cầu Thủ Công</h2>
            <p>
              Nếu bạn muốn xóa toàn bộ thông tin tài khoản cá nhân (hồ sơ economy, lịch sử chấm công), bạn có thể gửi yêu cầu trực tiếp qua Máy Chủ Hỗ Trợ Discord:
            </p>
            <div className="bg-[#070711] border border-[#1e1e32] rounded-2xl p-4 text-xs font-mono text-[#b89cff]">
              1. Tham gia Discord Support Server: https://discord.gg/awYxnqfqRr<br />
              2. Tạo Ticket yêu cầu "Xóa Dữ Liệu Cá Nhân"<br />
              3. Cung cấp User ID Discord của bạn.
            </div>
            <p className="text-xs text-[#a5a1b5]/70">
              Yêu cầu của bạn sẽ được xử lý và xóa hoàn toàn khỏi cơ sở dữ liệu trong vòng 24-48 giờ làm việc.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
