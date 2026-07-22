"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Music, Menu, X, Sparkles, LogIn, ExternalLink } from "lucide-react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const inviteUrl = "https://discord.com/api/oauth2/authorize?client_id=1143387904064888942&permissions=8&scope=bot%20applications.commands";
  const supportUrl = "https://discord.gg/awYxnqfqRr";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#070711]/85 backdrop-blur-md border-b border-[#1e1e32] py-3 shadow-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b89cff] via-[#ff86c8] to-[#65e6ff] p-[2px] shadow-lg shadow-[#b89cff]/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070711] rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-[#b89cff] group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-[#f7f4ff] via-[#b89cff] to-[#ff86c8] bg-clip-text text-transparent">
              Mimi
            </span>
            <span className="text-[10px] text-[#a5a1b5] font-mono tracking-widest -mt-1">
              SOUND UNIVERSE
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors font-medium">
            Tính Năng
          </Link>
          <Link href="/commands" className="text-sm text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors font-medium">
            Danh Sách Lệnh
          </Link>
          <Link href="/status" className="text-sm text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#73f5ae] animate-pulse"></span>
            Trạng Thái
          </Link>
          <Link href="/support" className="text-sm text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors font-medium">
            Hỗ Trợ
          </Link>
          <Link href="/changelog" className="text-sm text-[#a5a1b5] hover:text-[#f7f4ff] transition-colors font-medium">
            Changelog
          </Link>
        </nav>

        {/* CTA Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#f7f4ff] bg-[#10101c] border border-[#1e1e32] hover:border-[#b89cff]/50 hover:bg-[#171728] transition-all"
          >
            <LogIn className="w-4 h-4 text-[#65e6ff]" />
            Dashboard
          </Link>

          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#070711] bg-gradient-to-r from-[#b89cff] via-[#ff86c8] to-[#65e6ff] hover:opacity-90 transition-opacity shadow-lg shadow-[#b89cff]/20"
          >
            <Sparkles className="w-4 h-4" />
            Mời Mimi
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-[#a5a1b5] hover:text-[#f7f4ff] hover:bg-[#10101c] focus:outline-none"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070711]/95 border-b border-[#1e1e32] px-4 pt-4 pb-6 mt-3 space-y-3">
          <Link
            href="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base text-[#a5a1b5] hover:text-[#f7f4ff]"
          >
            Tính Năng
          </Link>
          <Link
            href="/commands"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base text-[#a5a1b5] hover:text-[#f7f4ff]"
          >
            Danh Sách Lệnh
          </Link>
          <Link
            href="/status"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base text-[#a5a1b5] hover:text-[#f7f4ff]"
          >
            Trạng Thái
          </Link>
          <Link
            href="/support"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base text-[#a5a1b5] hover:text-[#f7f4ff]"
          >
            Hỗ Trợ
          </Link>
          <Link
            href="/changelog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base text-[#a5a1b5] hover:text-[#f7f4ff]"
          >
            Changelog
          </Link>

          <div className="pt-4 border-t border-[#1e1e32] flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl font-medium text-sm text-[#f7f4ff] bg-[#10101c] border border-[#1e1e32]"
            >
              Dashboard Quản Trị
            </Link>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2.5 rounded-xl font-semibold text-sm text-[#070711] bg-gradient-to-r from-[#b89cff] to-[#ff86c8]"
            >
              Mời Mimi Vào Server
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
