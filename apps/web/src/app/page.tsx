import Link from "next/link";
import SoundCoreOrb from "@/components/SoundCoreOrb";
import InteractivePlayerDemo from "@/components/InteractivePlayerDemo";
import BentoGrid from "@/components/BentoGrid";
import CommandsPreview from "@/components/CommandsPreview";
import StatusWidget from "@/components/StatusWidget";
import { Sparkles, ArrowRight, Music, Shield, Radio, Users, Play, HelpCircle, CheckCircle2 } from "lucide-react";

export default function Home() {
  const inviteUrl = "https://discord.com/api/oauth2/authorize?client_id=1143387904064888942&permissions=8&scope=bot%20applications.commands";
  const supportUrl = "https://discord.gg/awYxnqfqRr";

  const faqs = [
    {
      q: "Mimi có hoàn toàn miễn phí không?",
      a: "Có! Mimi cung cấp đầy đủ các tính năng phát nhạc chất lượng cao, quản lý hàng chờ, filter và xác thực hoàn toàn miễn phí.",
    },
    {
      q: "Mimi hỗ trợ những nguồn nhạc nào?",
      a: "Mimi hỗ trợ phát nhạc từ YouTube, SoundCloud, Spotify, livestream radio và danh sách phát cá nhân.",
    },
    {
      q: "Làm thế nào để giới hạn người điều khiển nhạc?",
      a: "Quản trị viên có thể gán Vai trò DJ hoặc cấu hình quyền trong lệnh `/setup` để chỉ định các nhóm được phép skip hoặc đổi nhạc.",
    },
    {
      q: "Chế độ Xác Thực 24 Giờ hoạt động ra sao?",
      a: "Khi bật chế độ 24h, quyền xác thực sẽ tự động reset đúng 00:00 (múi giờ Việt Nam UTC+7) mỗi ngày, giúp bảo vệ server khỏi bot tự động.",
    },
    {
      q: "Tôi có thể nhận hỗ trợ ở đâu khi bot gặp sự cố?",
      a: "Bạn có thể tham gia Máy Chủ Hỗ Trợ Discord chính thức tại https://discord.gg/awYxnqfqRr để được hỗ trợ 24/7.",
    },
  ];

  return (
    <div className="relative overflow-hidden pt-28">
      {/* Background Glow Texture */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#b89cff]/15 via-[#ff86c8]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#b89cff]">
              <Sparkles className="w-4 h-4 text-[#ff86c8]" />
              <span>MIMI SOUND UNIVERSE 2.0</span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#f7f4ff] leading-tight">
              Âm nhạc dành cho <br />
              <span className="bg-gradient-to-r from-[#b89cff] via-[#ff86c8] to-[#65e6ff] bg-clip-text text-transparent">
                cả cộng đồng.
              </span>
            </h1>

            <p className="text-lg text-[#a5a1b5] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Mimi mang trải nghiệm nghe nhạc mượt mà, tương tác và đầy cảm xúc đến voice channel Discord của bạn. Không ngắt quãng, không giật lag.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-heading font-bold text-base text-[#070711] bg-gradient-to-r from-[#b89cff] via-[#ff86c8] to-[#65e6ff] hover:opacity-95 transition-all shadow-xl shadow-[#b89cff]/20 flex items-center justify-center gap-2 group"
              >
                <span>Mời Mimi Vào Server</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#demo"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-heading font-semibold text-base text-[#f7f4ff] bg-[#10101c] border border-[#1e1e32] hover:bg-[#171728] hover:border-[#b89cff]/40 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-[#65e6ff] fill-[#65e6ff]" />
                <span>Trải Nghiệm Player</span>
              </a>
            </div>

            {/* Social Proof Counters (Neutral Live Status) */}
            <div className="pt-8 border-t border-[#1e1e32]/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-xs text-[#a5a1b5] font-mono uppercase tracking-wider">Cộng Đồng</p>
                <p className="font-heading font-bold text-lg text-[#f7f4ff] mt-0.5">Đang mở rộng</p>
              </div>
              <div>
                <p className="text-xs text-[#a5a1b5] font-mono uppercase tracking-wider">Trạng Thái Bot</p>
                <p className="font-heading font-bold text-lg text-[#73f5ae] mt-0.5 flex items-center justify-center lg:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#73f5ae] animate-pulse"></span>
                  Trực tiếp
                </p>
              </div>
              <div>
                <p className="text-xs text-[#a5a1b5] font-mono uppercase tracking-wider">Chất Lượng</p>
                <p className="font-heading font-bold text-lg text-[#65e6ff] mt-0.5">High Fidelity</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visualizer Orb */}
          <div className="relative">
            <SoundCoreOrb />
          </div>
        </div>
      </section>

      {/* Interactive Player Demo Section */}
      <section id="demo" className="py-16 bg-[#070711]/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#f7f4ff]">
              Trải Nghiệm Player Trực Quan
            </h2>
            <p className="text-sm text-[#a5a1b5]">
              Mimi hiển thị đầy đủ thông tin bài hát, artwork, progress và bộ điều khiển ngay trong Discord hoặc Web Dashboard.
            </p>
          </div>
          <InteractivePlayerDemo />
        </div>
      </section>

      {/* Bento Grid Features */}
      <BentoGrid />

      {/* How Mimi Works 3-Step Section */}
      <section className="py-20 bg-[#070711]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-heading font-bold text-3xl text-[#f7f4ff]">
              Mimi Hoạt Động Như Thế Nào?
            </h2>
            <p className="text-sm text-[#a5a1b5]">
              Chỉ với 3 bước đơn giản để biến máy chủ Discord của bạn thành không gian âm nhạc sôi động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#b89cff] to-[#ff86c8] text-[#070711] font-heading font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#b89cff]/20">
                1
              </div>
              <h3 className="font-heading font-bold text-xl text-[#f7f4ff]">Mời Mimi Vào Server</h3>
              <p className="text-sm text-[#a5a1b5]">
                Nhấn nút "Mời Mimi" và chọn máy chủ Discord của bạn với quyền truy cập phù hợp.
              </p>
            </div>

            <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff86c8] to-[#65e6ff] text-[#070711] font-heading font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#ff86c8]/20">
                2
              </div>
              <h3 className="font-heading font-bold text-xl text-[#f7f4ff]">Vào Voice & Bật Nhạc</h3>
              <p className="text-sm text-[#a5a1b5]">
                Tham gia Voice Channel bất kỳ và gõ lệnh <code className="text-[#65e6ff] font-mono">/play &lt;tên_bài_hát&gt;</code>.
              </p>
            </div>

            <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#65e6ff] to-[#73f5ae] text-[#070711] font-heading font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#65e6ff]/20">
                3
              </div>
              <h3 className="font-heading font-bold text-xl text-[#f7f4ff]">Tận Hưởng & Quản Lý</h3>
              <p className="text-sm text-[#a5a1b5]">
                Tùy chỉnh hàng chờ, filter âm thanh và quản lý trực tiếp bằng nút bấm Embed hoặc Web Dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commands Preview */}
      <CommandsPreview />

      {/* Realtime Status Widget Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatusWidget />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#070711]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="font-heading font-bold text-3xl text-[#f7f4ff]">
              Câu Hỏi Thường Gặp (FAQ)
            </h2>
            <p className="text-sm text-[#a5a1b5]">
              Giải đáp các thắc mắc phổ biến về tính năng, quyền hạn và cách vận hành Mimi.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-[#10101c] border border-[#1e1e32] rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-base text-[#f7f4ff] mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#b89cff] shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-sm text-[#a5a1b5] pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#b89cff]/20 via-[#ff86c8]/20 to-[#65e6ff]/20 border border-[#b89cff]/30 rounded-3xl p-10 sm:p-14 text-center space-y-6 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
              Bật nhạc lên. <br />
              <span className="bg-gradient-to-r from-[#b89cff] via-[#ff86c8] to-[#65e6ff] bg-clip-text text-transparent">
                Mimi lo phần còn lại.
              </span>
            </h2>
            <p className="text-base text-[#a5a1b5] max-w-xl mx-auto">
              Tham gia hàng ngàn người nghe nhạc trên Discord ngay hôm nay với Mimi Bot.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-heading font-bold text-base text-[#070711] bg-gradient-to-r from-[#b89cff] via-[#ff86c8] to-[#65e6ff] hover:opacity-95 transition-all shadow-xl shadow-[#b89cff]/25"
              >
                Mời Mimi Vào Server
              </a>
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-heading font-semibold text-base text-[#f7f4ff] bg-[#10101c] border border-[#1e1e32] hover:bg-[#171728]"
              >
                Tham Gia Server Hỗ Trợ
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
