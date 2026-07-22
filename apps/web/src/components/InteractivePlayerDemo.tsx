"use client";

import { useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, ListMusic, Music, Sparkles, Heart } from "lucide-react";

export default function InteractivePlayerDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [volume, setVolume] = useState(80);

  const demoTrack = {
    title: "Chăm Hoa (Mimi Community Remix)",
    artist: "MONO x Mimi Studio",
    duration: "03:42",
    requestedBy: "Mimi Fan",
    voiceChannel: "🔊 Voice Chill #1",
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#10101c] border border-[#1e1e32] rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background glow overlay */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#b89cff]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#ff86c8]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Status */}
      <div className="flex items-center justify-between border-b border-[#1e1e32] pb-4 mb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#a5a1b5]">
          <span className="w-2 h-2 rounded-full bg-[#73f5ae] animate-pulse"></span>
          <span>{demoTrack.voiceChannel}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e1e32] text-[11px] font-mono text-[#b89cff]">
          <Sparkles className="w-3 h-3 text-[#ff86c8]" />
          <span>Demo Mode</span>
        </div>
      </div>

      {/* Track Info Card */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#b89cff] via-[#ff86c8] to-[#65e6ff] p-0.5 shadow-lg shadow-[#b89cff]/20 shrink-0 relative group">
          <div className="w-full h-full bg-[#070711] rounded-[14px] flex items-center justify-center overflow-hidden">
            <Music className="w-8 h-8 text-[#b89cff] group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <div className="flex-grow min-w-0">
          <h3 className="font-heading font-bold text-lg text-[#f7f4ff] truncate">
            {demoTrack.title}
          </h3>
          <p className="text-sm text-[#a5a1b5] truncate mt-0.5">{demoTrack.artist}</p>
          <p className="text-xs text-[#a5a1b5]/70 mt-1 font-mono">
            Yêu cầu bởi: <span className="text-[#65e6ff]">{demoTrack.requestedBy}</span>
          </p>
        </div>

        <button
          onClick={() => setLiked(!liked)}
          className={`p-2.5 rounded-full border transition-colors ${
            liked
              ? "bg-[#ff718b]/10 border-[#ff718b]/30 text-[#ff718b]"
              : "bg-[#171728] border-[#1e1e32] text-[#a5a1b5] hover:text-[#f7f4ff]"
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-[#ff718b]" : ""}`} />
        </button>
      </div>

      {/* Audio Waveform Bars */}
      <div className="flex items-end justify-between gap-1 h-10 px-2 mb-4">
        {[40, 70, 30, 85, 60, 100, 45, 90, 65, 30, 75, 50, 95, 40, 80, 60, 35, 90, 50, 30].map(
          (val, idx) => (
            <div
              key={idx}
              style={{
                height: isPlaying ? `${val}%` : "20%",
                transition: "height 0.2s ease",
              }}
              className={`flex-grow rounded-full ${
                isPlaying ? "bg-gradient-to-t from-[#b89cff] to-[#ff86c8]" : "bg-[#1e1e32]"
              }`}
            />
          )
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-6">
        <div className="w-full bg-[#1e1e32] h-2 rounded-full overflow-hidden relative cursor-pointer">
          <div
            className="bg-gradient-to-r from-[#b89cff] to-[#ff86c8] h-full rounded-full transition-all duration-300"
            style={{ width: isPlaying ? "45%" : "10%" }}
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-[#a5a1b5]">
          <span>{isPlaying ? "01:38" : "00:20"}</span>
          <span>{demoTrack.duration}</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#a5a1b5]">
          <Volume2 className="w-4 h-4 text-[#a5a1b5]" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-[#b89cff] bg-[#1e1e32] h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#b89cff] to-[#ff86c8] text-[#070711] flex items-center justify-center font-bold shadow-lg shadow-[#b89cff]/25 hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button className="p-2 text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <button className="p-2 text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors">
          <ListMusic className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
