"use client";

import { Activity, Server, Radio, Database, ShieldCheck } from "lucide-react";

export default function StatusWidget() {
  const statusItems = [
    { name: "Bot Discord Gateway", status: "Hoạt động trực tiếp", ping: "24ms", ok: true },
    { name: "Website Internal API", status: "Kết nối thành công", ping: "12ms", ok: true },
    { name: "Audio Node (Lavalink)", status: "Mimi Sound Node #1", ping: "18ms", ok: true },
    { name: "Atomic File Database", status: "Đồng bộ realtime", ping: "< 1ms", ok: true },
  ];

  return (
    <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-[#1e1e32] pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#73f5ae]" />
          <h3 className="font-heading font-bold text-lg text-[#f7f4ff]">Trạng Thái Hệ Thống</h3>
        </div>
        <span className="text-xs font-mono text-[#73f5ae] bg-[#73f5ae]/10 px-2.5 py-1 rounded-full border border-[#73f5ae]/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#73f5ae] animate-pulse"></span>
          TẤT CẢ HỆ THỐNG ONLINE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statusItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#070711] border border-[#1e1e32] rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-[#f7f4ff]">{item.name}</p>
              <p className="text-[11px] text-[#a5a1b5] mt-0.5">{item.status}</p>
            </div>
            <span className="text-xs font-mono text-[#65e6ff] bg-[#10101c] px-2 py-1 rounded-lg border border-[#1e1e32]">
              {item.ping}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
