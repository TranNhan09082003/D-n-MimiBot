"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Server, Shield, Sparkles, SlidersHorizontal, ArrowRight, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Demo servers list simulating Discord user's managed servers (with Administrator/Manage Guild permissions)
  const servers = [
    {
      id: "1517068246493429852",
      name: "Mimi Community Server",
      icon: null,
      installed: true,
      role: "Server Owner",
      members: 846,
    },
    {
      id: "123456789012345678",
      name: "Chill Music Lounge",
      icon: null,
      installed: true,
      role: "Administrator",
      members: 312,
    },
    {
      id: "987654321098765432",
      name: "Gaming & Squad VN",
      icon: null,
      installed: false,
      role: "Manage Guild",
      members: 1540,
    },
  ];

  const inviteUrl = "https://discord.com/api/oauth2/authorize?client_id=1143387904064888942&permissions=8&scope=bot%20applications.commands";

  const filteredServers = servers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* User Welcome Banner */}
        <div className="bg-gradient-to-r from-[#b89cff]/20 via-[#ff86c8]/15 to-[#65e6ff]/20 border border-[#b89cff]/30 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#b89cff] to-[#ff86c8] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#070711] rounded-full flex items-center justify-center font-heading font-bold text-xl text-[#f7f4ff]">
                M
              </div>
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl text-[#f7f4ff]">
                Chào mừng trở lại, Administrator!
              </h1>
              <p className="text-sm text-[#a5a1b5] mt-0.5">
                Chọn máy chủ bên dưới để quản lý trình phát nhạc, hàng chờ và cấu hình xác thực.
              </p>
            </div>
          </div>

          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl font-heading font-bold text-xs text-[#070711] bg-gradient-to-r from-[#b89cff] to-[#ff86c8] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Mời Vào Server Mới
          </a>
        </div>

        {/* Server List Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#b89cff]" />
            <h2 className="font-heading font-bold text-xl text-[#f7f4ff]">
              Danh Sách Máy Chủ Bạn Quản Lý ({filteredServers.length})
            </h2>
          </div>

          <input
            type="text"
            placeholder="Tìm máy chủ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-[#10101c] border border-[#1e1e32] rounded-xl px-4 py-2 text-xs text-[#f7f4ff] placeholder-[#a5a1b5]/60 focus:outline-none focus:border-[#b89cff]"
          />
        </div>

        {/* Server Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <div
              key={server.id}
              className="bg-[#10101c] border border-[#1e1e32] hover:border-[#b89cff]/40 rounded-3xl p-6 flex flex-col justify-between transition-all group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#070711] border border-[#1e1e32] flex items-center justify-center font-heading font-bold text-lg text-[#b89cff]">
                    {server.name.charAt(0)}
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                      server.installed
                        ? "bg-[#73f5ae]/10 text-[#73f5ae] border-[#73f5ae]/30"
                        : "bg-[#a5a1b5]/10 text-[#a5a1b5] border-[#a5a1b5]/30"
                    }`}
                  >
                    {server.installed ? "Đã cài Mimi" : "Chưa cài Mimi"}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-[#f7f4ff] mb-1 group-hover:text-[#b89cff] transition-colors truncate">
                  {server.name}
                </h3>
                <p className="text-xs text-[#a5a1b5] font-mono">Quyền: {server.role}</p>
                <p className="text-xs text-[#a5a1b5]/70 mt-1 font-mono">Thành viên: {server.members}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#1e1e32]">
                {server.installed ? (
                  <Link
                    href={`/dashboard/${server.id}`}
                    className="w-full py-2.5 rounded-xl font-heading font-semibold text-xs text-[#070711] bg-gradient-to-r from-[#b89cff] to-[#ff86c8] flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <span>Mở Bảng Điều Khiển</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <a
                    href={`${inviteUrl}&guild_id=${server.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl font-heading font-semibold text-xs text-[#f7f4ff] bg-[#171728] border border-[#1e1e32] hover:border-[#b89cff]/50 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Mời Mimi Ngay</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#65e6ff]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
