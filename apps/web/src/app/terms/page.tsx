import { FileText } from "lucide-react";

export const metadata = {
  title: "Điều Khoản Sử Dụng — Mimi Bot Terms of Service",
  description: "Các quy định và điều khoản sử dụng dịch vụ Mimi Discord Bot.",
};

export default function TermsPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#b89cff]">
            <FileText className="w-3.5 h-3.5" />
            <span>TERMS OF SERVICE</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p className="text-sm text-[#a5a1b5]">Cập nhật lần cuối: 22/07/2026</p>
        </div>

        <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-6 text-sm text-[#a5a1b5] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">1. Chấp Nhận Điều Khoản</h2>
            <p>
              Bằng việc mời hoặc sử dụng Mimi Bot trong máy chủ Discord của bạn, bạn đồng ý tuân thủ các quy định trong điều khoản sử dụng này.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">2. Quy Định Sử Dụng</h2>
            <ul className="list-disc pl-5 space-y-1 text-[#a5a1b5]">
              <li>Không lạm dụng bot để cố tình gây lag, spam API hoặc phá hoại dịch vụ của người khác.</li>
              <li>Không phát các nội dung âm thanh vi phạm pháp luật hoặc bản quyền bị cấm.</li>
              <li>Không cố tình khai thác các lỗ hổng hệ thống để làm sai lệch dữ liệu xu economy.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-[#f7f4ff]">3. Giới Hạn Trách Nhiệm</h2>
            <p>
              MimiBot cung cấp dịch vụ theo nguyên tắc "như hiện có" (as-is). Chúng tôi có quyền tạm ngừng hoặc ngắt kết nối dịch vụ đối với các máy chủ vi phạm điều khoản mà không cần báo trước.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
