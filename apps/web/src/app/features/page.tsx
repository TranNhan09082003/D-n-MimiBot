import BentoGrid from "@/components/BentoGrid";
import { Sparkles, Music, Sliders, ShieldCheck, Clock, Radio, ListMusic } from "lucide-react";

export const metadata = {
  title: "Tính Năng — Mimi Discord Music Bot",
  description: "Khám phá toàn bộ tính năng phát nhạc, filter âm thanh, phân quyền DJ và hệ thống xác thực của Mimi Bot.",
};

export default function FeaturesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#b89cff]">
            <Sparkles className="w-3.5 h-3.5 text-[#ff86c8]" />
            <span>MIMI FEATURES OVERVIEW</span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-[#f7f4ff]">
            Tính Năng Chuyên Nghiệp Dành Cho Server
          </h1>
          <p className="text-base text-[#a5a1b5]">
            Mimi kết hợp trải nghiệm phát nhạc đỉnh cao với hệ thống quản trị và xác thực thành viên mượt mà.
          </p>
        </div>

        <BentoGrid />
      </div>
    </div>
  );
}
