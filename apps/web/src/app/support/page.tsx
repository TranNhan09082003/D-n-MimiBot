import { HelpCircle, MessageSquare, ExternalLink, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Hỗ Trợ & Báo Lỗi — Mimi Bot Support",
  description: "Trang hỗ trợ kỹ thuật, hướng dẫn báo lỗi bài hát và giải đáp thắc mắc cho Mimi Bot.",
};

export default function SupportPage() {
  const supportUrl = "https://discord.gg/awYxnqfqRr";

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#ff86c8]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>MIMI SUPPORT CENTER</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Trung Tâm Hỗ Trợ Khách Hàng
          </h1>
          <p className="text-base text-[#a5a1b5]">
            Đội ngũ quản trị viên luôn sẵn sàng giải đáp thắc mắc và xử lý sự cố trong thời gian ngắn nhất.
          </p>
        </div>

        {/* Discord Support Server Card */}
        <div className="bg-gradient-to-r from-[#b89cff]/20 via-[#ff86c8]/20 to-[#65e6ff]/20 border border-[#b89cff]/30 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="font-heading font-bold text-2xl text-[#f7f4ff]">
              Máy Chủ Hỗ Trợ Discord Chính Thức
            </h2>
            <p className="text-sm text-[#a5a1b5]">
              Tham gia cộng đồng Mimi để nhận hỗ trợ 24/7, báo lỗi bài hát và giao lưu cùng các quản trị viên.
            </p>
            <p className="text-xs font-mono text-[#65e6ff]">https://discord.gg/awYxnqfqRr</p>
          </div>

          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl font-heading font-bold text-sm text-[#070711] bg-gradient-to-r from-[#b89cff] to-[#ff86c8] hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2 shadow-lg"
          >
            <span>Tham Gia Ngay</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Bug Report Template Box */}
        <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-4">
          <h3 className="font-heading font-bold text-lg text-[#f7f4ff] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#b89cff]" />
            Mẫu Báo Lỗi Bài Hát / Tính Năng
          </h3>
          <p className="text-sm text-[#a5a1b5]">
            Khi gửi yêu cầu hỗ trợ trong Discord Support Server, vui lòng sử dụng mẫu thông tin sau:
          </p>

          <pre className="bg-[#070711] border border-[#1e1e32] rounded-2xl p-4 text-xs font-mono text-[#65e6ff] leading-relaxed overflow-x-auto">
{`Server Name / Guild ID:
Command thực hiện:
Thời gian xảy ra:
Bài hát hoặc URL bị lỗi:
Mô tả sự cố:
Mã lỗi (nếu có): MIMI-XXXX-XXX`}
          </pre>
        </div>
      </div>
    </div>
  );
}
