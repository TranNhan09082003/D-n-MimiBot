"use client";

import { motion } from "framer-motion";
import { Music, Radio, Disc, Volume2, Sparkles } from "lucide-react";

export default function SoundCoreOrb() {
  return (
    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center mx-auto">
      {/* Wave propagation rings */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1.8],
          opacity: [0.6, 0.3, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="absolute inset-0 rounded-full border border-[#b89cff]/40 pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.5, 2],
          opacity: [0.5, 0.2, 0],
        }}
        transition={{
          duration: 3.5,
          delay: 1.2,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="absolute inset-0 rounded-full border border-[#ff86c8]/30 pointer-events-none"
      />

      {/* Orbiting Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute w-full h-full pointer-events-none"
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#10101c]/90 border border-[#b89cff]/40 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 text-xs text-[#f7f4ff]">
          <Disc className="w-3.5 h-3.5 text-[#ff86c8] animate-spin" />
          <span>Lossless Stream</span>
        </div>

        <div className="absolute bottom-6 right-8 bg-[#10101c]/90 border border-[#65e6ff]/40 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 text-xs text-[#f7f4ff]">
          <Radio className="w-3.5 h-3.5 text-[#65e6ff]" />
          <span>Voice Channel Connected</span>
        </div>
      </motion.div>

      {/* Main Sound Core Orb */}
      <div className="relative w-56 h-56 rounded-full p-[3px] bg-gradient-to-tr from-[#b89cff] via-[#ff86c8] to-[#65e6ff] shadow-[0_0_80px_rgba(184,156,255,0.4)] flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-[#070711] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative group">
          {/* Inner audio pulse effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#b89cff]/10 via-[#ff86c8]/10 to-[#65e6ff]/10 animate-pulse pointer-events-none" />

          {/* Sound Core Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#b89cff] to-[#ff86c8] p-0.5 shadow-xl shadow-[#ff86c8]/30 mb-3 group-hover:scale-110 transition-transform">
            <div className="w-full h-full bg-[#070711] rounded-[14px] flex items-center justify-center">
              <Music className="w-8 h-8 text-[#f7f4ff]" />
            </div>
          </div>

          <span className="font-heading font-bold text-lg text-[#f7f4ff] tracking-wide">
            Mimi Core
          </span>
          <span className="text-[11px] text-[#65e6ff] font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#73f5ae] animate-ping" />
            LIVE AUDIO ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
