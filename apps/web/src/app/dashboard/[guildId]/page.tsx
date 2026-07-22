"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Pause, SkipForward, Square, Volume2, Music, ListMusic, Settings, ShieldCheck, Sliders, FileText, ArrowLeft, RefreshCw, Check } from "lucide-react";

export default function ServerDashboardPage({ params }: { params: { guildId: string } }) {
  const [activeTab, setActiveTab] = useState("player");
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [prefix, setPrefix] = useState("mi");
  const [autoplay, setAutoplay] = useState(true);
  const [repeatMode, setRepeatMode] = useState("off");
  const [verifyMode, setVerifyMode] = useState("off");

  // Audio filter toggles
  const [bassboost, setBassboost] = useState(false);
  const [nightcore, setNightcore] = useState(false);
  const [vaporwave, setVaporwave] = useState(false);
  const [eightD, setEightD] = useState(false);

  const tabs = [
    { id: "player", label: "Live Player & Queue", icon: Music },
    { id: "settings", label: "Cài Đặt Chung", icon: Settings },
    { id: "permissions", label: "Phân Quyền DJ / Admin", icon: ShieldCheck },
    { id: "audio", label: "Bộ Lọc Audio Filters", icon: Sliders },
    { id: "logs", label: "Nhật Ký Thay Đổi", icon: FileText },
  ];

  const queueTracks = [
    { id: "1", title: "Chăm Hoa (Mimi Community Remix)", artist: "MONO", duration: "03:42", requestedBy: "Mimi Fan" },
    { id: "2", title: "Từng Là", artist: "Vũ Cát Tường", duration: "04:15", requestedBy: "Chủ Server" },
    { id: "3", title: "Lạc Trôi (Acoustic)", artist: "Sơn Tùng M-TP", duration: "03:50", requestedBy: "AudioChill" },
  ];

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Back Navigation & Server Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1e1e32] pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl bg-[#10101c] border border-[#1e1e32] text-[#a5a1b5] hover:text-[#f7f4ff] hover:border-[#b89cff]/40 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-2xl text-[#f7f4ff]">Mimi Community Server</h1>
                <span className="w-2.5 h-2.5 rounded-full bg-[#73f5ae] animate-pulse"></span>
              </div>
              <p className="text-xs font-mono text-[#a5a1b5] mt-0.5">Guild ID: {params.guildId || "1517068246493429852"}</p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-heading font-semibold text-xs text-[#070711] bg-gradient-to-r from-[#b89cff] to-[#ff86c8] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã Lưu Cài Đặt!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>
        </div>

        {/* Dashboard Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1e1e32] no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "bg-[#10101c] text-[#b89cff] border border-[#b89cff]/40 shadow-lg"
                    : "text-[#a5a1b5] hover:text-[#f7f4ff] hover:bg-[#10101c]/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Live Player & Queue */}
        {activeTab === "player" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Controller Card */}
            <div className="lg:col-span-2 bg-[#10101c] border border-[#1e1e32] rounded-3xl p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1e1e32] pb-4">
                <span className="text-xs font-mono text-[#65e6ff]">🔊 Kênh Voice: Chill Lounge #1</span>
                <span className="text-xs font-mono text-[#73f5ae]">● LATENCY 18MS</span>
              </div>

              {/* Now Playing Info */}
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#b89cff] to-[#ff86c8] p-0.5 shadow-lg shrink-0">
                  <div className="w-full h-full bg-[#070711] rounded-[14px] flex items-center justify-center">
                    <Music className="w-10 h-10 text-[#b89cff]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#ff86c8]">Đang Phát</span>
                  <h3 className="font-heading font-bold text-xl text-[#f7f4ff]">Chăm Hoa (Mimi Community Remix)</h3>
                  <p className="text-sm text-[#a5a1b5]">MONO x Mimi Studio</p>
                  <p className="text-xs font-mono text-[#a5a1b5]/70">Yêu cầu bởi: Mimi Fan</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1e1e32]">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#a5a1b5]" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 accent-[#b89cff] bg-[#1e1e32] h-1.5 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-[#b89cff] to-[#ff86c8] text-[#070711] flex items-center justify-center font-bold shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <button className="p-3 rounded-full bg-[#171728] border border-[#1e1e32] text-[#a5a1b5] hover:text-[#f7f4ff]">
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button className="p-3 rounded-full bg-[#171728] border border-[#1e1e32] text-[#ff718b] hover:opacity-90">
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Queue Box */}
            <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1e1e32] pb-3">
                <h3 className="font-heading font-bold text-base text-[#f7f4ff] flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-[#b89cff]" />
                  Hàng Chờ ({queueTracks.length})
                </h3>
              </div>

              <div className="space-y-3">
                {queueTracks.map((t, idx) => (
                  <div key={t.id} className="bg-[#070711] border border-[#1e1e32] rounded-2xl p-3.5 flex items-center justify-between text-xs">
                    <div className="truncate">
                      <p className="font-semibold text-[#f7f4ff] truncate">{idx + 1}. {t.title}</p>
                      <p className="text-[#a5a1b5] text-[11px] truncate">{t.artist}</p>
                    </div>
                    <span className="font-mono text-[#a5a1b5] shrink-0 ml-2">{t.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: General Settings */}
        {activeTab === "settings" && (
          <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-6 max-w-3xl shadow-xl">
            <h3 className="font-heading font-bold text-lg text-[#f7f4ff]">Cài Đặt Tổng Quan Máy Chủ</h3>

            <div className="space-y-4 text-sm text-[#a5a1b5]">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#f7f4ff] mb-1.5">
                  Tiền tố Prefix
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-[#070711] border border-[#1e1e32] rounded-xl px-4 py-2.5 text-xs text-[#f7f4ff] font-mono focus:outline-none focus:border-[#b89cff]"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1e1e32]">
                <div>
                  <p className="font-semibold text-[#f7f4ff]">Tự Động Phát Nhạc (Autoplay)</p>
                  <p className="text-xs text-[#a5a1b5]">Tự động tìm bài hát tương tự khi hàng chờ kết thúc.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="w-5 h-5 accent-[#b89cff] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1e1e32]">
                <div>
                  <p className="font-semibold text-[#f7f4ff]">Chế Độ Xác Thực Hàng Ngày (24 Hours Reset)</p>
                  <p className="text-xs text-[#a5a1b5]">Tự động reset role xác thực đúng 00:00 múi giờ Việt Nam.</p>
                </div>
                <select
                  value={verifyMode}
                  onChange={(e) => setVerifyMode(e.target.value)}
                  className="bg-[#070711] border border-[#1e1e32] rounded-xl px-3 py-1.5 text-xs text-[#f7f4ff] font-mono"
                >
                  <option value="off">Tắt</option>
                  <option value="on">Bật Thường</option>
                  <option value="24h">Bật 24 Giờ (00:00 VN)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Audio Filters */}
        {activeTab === "audio" && (
          <div className="bg-[#10101c] border border-[#1e1e32] rounded-3xl p-8 space-y-6 max-w-3xl shadow-xl">
            <h3 className="font-heading font-bold text-lg text-[#f7f4ff]">Bộ Lọc Hiệu Ứng Âm Thanh (Audio Filters)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Bassboost", state: bassboost, set: setBassboost, desc: "Tăng cường âm trầm uy lực" },
                { label: "Nightcore", state: nightcore, set: setNightcore, desc: "Tăng tốc độ & cao độ sôi động" },
                { label: "Vaporwave", state: vaporwave, set: setVaporwave, desc: "Chậm rãi, hoài niệm retro" },
                { label: "8D Audio", state: eightD, set: setEightD, desc: "Âm thanh xoay vòng 3D surround" },
              ].map((f, idx) => (
                <div
                  key={idx}
                  onClick={() => f.set(!f.state)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    f.state
                      ? "bg-[#b89cff]/10 border-[#b89cff] text-[#f7f4ff]"
                      : "bg-[#070711] border-[#1e1e32] text-[#a5a1b5] hover:border-[#1e1e32]/80"
                  }`}
                >
                  <p className="font-heading font-bold text-base">{f.label}</p>
                  <p className="text-xs text-[#a5a1b5] mt-1">{f.desc}</p>
                  <span className={`text-[10px] font-mono mt-3 inline-block px-2 py-0.5 rounded ${f.state ? "bg-[#b89cff] text-[#070711] font-bold" : "bg-[#1e1e32]"}`}>
                    {f.state ? "ACTIVE" : "OFF"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
