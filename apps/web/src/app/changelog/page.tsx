import { History, Sparkles, CheckCircle, Bug } from "lucide-react";

export const metadata = {
  title: "Changelog — Mimi Bot Updates",
  description: "Nhật ký phát triển và lịch sử cập nhật phiên bản của Mimi Discord Music Bot.",
};

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.1.0",
      date: "22/07/2026",
      tag: "Major Security & Operation Patch",
      highlights: [
        "Định nghĩa hàm mở lại kênh khi tắt xác thực (`/setupverify state:off`).",
        "Sửa lỗi tái sử dụng Role Đã/Chưa Xác Thực, chống tạo role trùng lặp.",
        "Nâng cấp nút Xác Thực với giao dịch gán/gỡ role an toàn & báo mã lỗi `MIMI-VERIFY-ROLE-002` chuẩn.",
        "Thêm lệnh `/resetverify-all` dọn role xác thực toàn server theo batch rate limit.",
        "Tách biệt hoàn toàn tính năng Chấm công nhân sự (`/setupattendance`).",
        "Thêm cảnh báo Economy Anomaly (> 5.000.000 xu/ngày) & hệ thống Owner Forwarding.",
        "Đồng bộ toàn bộ link máy chủ hỗ trợ về `https://discord.gg/awYxnqfqRr`.",
      ],
    },
    {
      version: "v1.0.0",
      date: "15/07/2026",
      tag: "Official Release",
      highlights: [
        "Phát nhạc chất lượng cao với bộ nút điều khiển Embed trực quan.",
        "Tích hợp hệ thống xác thực 24 giờ tự động reset lúc 00:00 Việt Nam.",
        "Khởi tạo hệ thống kênh tự động qua `/setup`.",
      ],
    },
  ];

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#b89cff]">
            <History className="w-3.5 h-3.5" />
            <span>PRODUCT CHANGELOG</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Nhật Ký Cập Nhật Phiên Bản
          </h1>
          <p className="text-sm text-[#a5a1b5]">
            Theo dõi tiến trình phát triển và các tính năng mới được cập nhật liên tục trên Mimi Bot.
          </p>
        </div>

        <div className="space-y-8">
          {updates.map((item, idx) => (
            <div key={idx} className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e1e32] pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-extrabold text-2xl text-[#b89cff]">{item.version}</span>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#1e1e32] text-[#65e6ff] border border-[#1e1e32]">
                    {item.tag}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#a5a1b5]">{item.date}</span>
              </div>

              <ul className="space-y-3 text-sm text-[#a5a1b5]">
                {item.highlights.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-[#73f5ae] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
