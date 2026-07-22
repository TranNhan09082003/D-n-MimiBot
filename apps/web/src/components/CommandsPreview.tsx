"use client";

import { useState } from "react";
import { Search, Copy, Check, Terminal, ShieldAlert, Sparkles } from "lucide-react";

export default function CommandsPreview() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "Tất Cả Lệnh" },
    { id: "music", label: "🎵 Âm Nhạc" },
    { id: "verify", label: "🛡️ Xác Thực" },
    { id: "attendance", label: "🕒 Chấm Công" },
    { id: "economy", label: "💰 Economy" },
    { id: "admin", label: "⚙️ Quản Trị" },
  ];

  const commandsList = [
    { name: "/play", desc: "Phát bài hát từ YouTube hoặc link nhạc vào Voice Channel", category: "music", djOnly: false, adminOnly: false },
    { name: "/queue", desc: "Xem và quản lý danh sách các bài hát đang chờ phát", category: "music", djOnly: false, adminOnly: false },
    { name: "/setupverify", desc: "Cấu hình hệ thống xác thực thành viên (Bật/Tắt/24h)", category: "verify", djOnly: false, adminOnly: true },
    { name: "/resetverify-all", desc: "Gỡ role Đã Xác Thực và cấp lại Chưa Xác Thực toàn server", category: "verify", djOnly: false, adminOnly: true },
    { name: "/setupattendance", desc: "Bật hoặc Tắt hệ thống chấm công nhân sự độc lập", category: "attendance", djOnly: false, adminOnly: true },
    { name: "/midaily", desc: "Điểm danh hàng ngày nhận 1,000 xu thưởng", category: "economy", djOnly: false, adminOnly: false },
    { name: "/miprofile", desc: "Xem thông tin tài khoản, số dư và cấp độ cá nhân", category: "economy", djOnly: false, adminOnly: false },
    { name: "/setup", desc: "Khởi tạo tự động toàn bộ hệ thống kênh gốc của server", category: "admin", djOnly: false, adminOnly: true },
    { name: "/setupmodlog", desc: "Cấu hình kênh nhật ký quản lý thành viên", category: "admin", djOnly: false, adminOnly: true },
  ];

  const filteredCommands = commandsList.filter((cmd) => {
    const matchesCat = activeCategory === "all" || cmd.category === activeCategory;
    const matchesQuery =
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleCopy = (cmdName: string) => {
    navigator.clipboard.writeText(cmdName);
    setCopiedCmd(cmdName);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <section className="py-20 relative bg-[#070711]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#65e6ff]">
            <Terminal className="w-3.5 h-3.5 text-[#65e6ff]" />
            <span>COMMAND REGISTRY SYNC</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Danh Sách Lệnh Đồng Bộ
          </h2>
          <p className="text-base text-[#a5a1b5]">
            Mọi lệnh Slash Commands của Mimi được thiết kế trực quan, dễ nhớ và tự động cập nhật từ bot registry.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-[#b89cff] to-[#ff86c8] text-[#070711] font-semibold shadow-md"
                    : "bg-[#10101c] text-[#a5a1b5] border border-[#1e1e32] hover:text-[#f7f4ff]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#a5a1b5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm lệnh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#10101c] border border-[#1e1e32] rounded-xl pl-10 pr-4 py-2 text-xs text-[#f7f4ff] placeholder-[#a5a1b5]/60 focus:outline-none focus:border-[#b89cff]"
            />
          </div>
        </div>

        {/* Commands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCommands.map((cmd, idx) => (
            <div
              key={idx}
              className="bg-[#10101c] border border-[#1e1e32] hover:border-[#b89cff]/40 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-base text-[#65e6ff] group-hover:text-[#b89cff] transition-colors">
                    {cmd.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {cmd.adminOnly && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ff718b]/10 text-[#ff718b] border border-[#ff718b]/20">
                        Admin
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(cmd.name)}
                      className="p-1.5 rounded-lg text-[#a5a1b5] hover:text-[#f7f4ff] hover:bg-[#1e1e32] transition-colors"
                      title="Sao chép lệnh"
                    >
                      {copiedCmd === cmd.name ? (
                        <Check className="w-3.5 h-3.5 text-[#73f5ae]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#a5a1b5] leading-relaxed mb-4">
                  {cmd.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
