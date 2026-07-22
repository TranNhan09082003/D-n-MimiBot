import { Music, Search, ListOrdered, Sparkles, HeartHandshake, Mic2, Sliders, ShieldCheck, Clock, MonitorPlay, Globe, Settings } from "lucide-react";

export default function BentoGrid() {
  const features = [
    {
      icon: Music,
      title: "Smart Music Player",
      desc: "Trình phát nhạc thông minh với giao diện Embed trực quan, thanh tiến trình sinh động và các nút điều khiển nhanh.",
      tag: "Playback",
      span: "md:col-span-2",
      color: "from-[#b89cff]/20 to-[#b89cff]/5 border-[#b89cff]/30",
      accent: "text-[#b89cff]",
    },
    {
      icon: Search,
      title: "Multi-source Search",
      desc: "Tìm kiếm bài hát cực nhanh từ YouTube, SoundCloud, Spotify và danh sách phát cá nhân.",
      tag: "Discovery",
      span: "md:col-span-1",
      color: "from-[#ff86c8]/20 to-[#ff86c8]/5 border-[#ff86c8]/30",
      accent: "text-[#ff86c8]",
    },
    {
      icon: ListOrdered,
      title: "Queue Cộng Tác",
      desc: "Thành viên trong voice channel có thể cùng thêm bài hát, đổi thứ tự hàng chờ và vote skip dân chủ.",
      tag: "Community",
      span: "md:col-span-1",
      color: "from-[#65e6ff]/20 to-[#65e6ff]/5 border-[#65e6ff]/30",
      accent: "text-[#65e6ff]",
    },
    {
      icon: Sparkles,
      title: "Autoplay Thông Minh",
      desc: "Tự động gợi ý và phát các bài hát có giai điệu tương tự khi hàng chờ kết thúc.",
      tag: "AI Audio",
      span: "md:col-span-2",
      color: "from-[#73f5ae]/20 to-[#73f5ae]/5 border-[#73f5ae]/30",
      accent: "text-[#73f5ae]",
    },
    {
      icon: Sliders,
      title: "Audio Filters Chuyên Nghiệp",
      desc: "Tùy chỉnh hiệu ứng âm thanh sống động: Bassboost, Nightcore, Vaporwave, 8D Audio và Equalizer presets.",
      tag: "Audio Filters",
      span: "md:col-span-2",
      color: "from-[#ffd475]/20 to-[#ffd475]/5 border-[#ffd475]/30",
      accent: "text-[#ffd475]",
    },
    {
      icon: ShieldCheck,
      title: "DJ & Admin Permissions",
      desc: "Phân quyền chi tiết: Vai trò DJ, giới hạn âm lượng tối đa, quản lý lệnh cấm và lịch sử thao tác.",
      tag: "Administration",
      span: "md:col-span-1",
      color: "from-[#b89cff]/20 to-[#b89cff]/5 border-[#b89cff]/30",
      accent: "text-[#b89cff]",
    },
    {
      icon: Clock,
      title: "24/7 Mode Trực Tuyến",
      desc: "Giữ bot luôn ở lại voice channel ngay cả khi không có ai nghe, sẵn sàng phát nhạc bất cứ lúc nào.",
      tag: "Reliability",
      span: "md:col-span-1",
      color: "from-[#65e6ff]/20 to-[#65e6ff]/5 border-[#65e6ff]/30",
      accent: "text-[#65e6ff]",
    },
    {
      icon: MonitorPlay,
      title: "Realtime Web Dashboard",
      desc: "Bảng điều khiển trực tiếp trên web giúp quản lý server, phát nhạc và đổi cài đặt mượt mà.",
      tag: "Dashboard",
      span: "md:col-span-2",
      color: "from-[#ff86c8]/20 to-[#ff86c8]/5 border-[#ff86c8]/30",
      accent: "text-[#ff86c8]",
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10101c] border border-[#1e1e32] text-xs font-mono text-[#b89cff]">
            <Sparkles className="w-3.5 h-3.5 text-[#ff86c8]" />
            <span>MIMI SOUND SYSTEM</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Tại Sao Cộng Đồng Cần Mimi?
          </h2>
          <p className="text-base text-[#a5a1b5]">
            Mimi giải quyết các phiền thoái khi nghe nhạc nhóm trên Discord: không gián đoạn queue, giao diện trực quan và điều khiển cực kỳ đơn giản.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`bg-gradient-to-br ${item.color} bg-[#10101c] border rounded-3xl p-7 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 shadow-xl ${item.span}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-[#070711] border border-[#1e1e32] flex items-center justify-center ${item.accent}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#070711] border border-[#1e1e32] text-[#a5a1b5]">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-[#f7f4ff] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#a5a1b5] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
