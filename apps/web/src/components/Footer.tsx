import Link from "next/link";
import { Music, Heart, Shield, FileText, HelpCircle } from "lucide-react";

export default function Footer() {
  const supportUrl = "https://discord.gg/awYxnqfqRr";

  return (
    <footer className="bg-[#070711] border-t border-[#1e1e32] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b89cff] via-[#ff86c8] to-[#65e6ff] p-[2px]">
                <div className="w-full h-full bg-[#070711] rounded-[10px] flex items-center justify-center">
                  <Music className="w-4 h-4 text-[#b89cff]" />
                </div>
              </div>
              <span className="font-heading font-bold text-xl text-[#f7f4ff]">Mimi</span>
            </div>
            <p className="text-sm text-[#a5a1b5] leading-relaxed">
              Mimi biến voice channel Discord thành một không gian âm nhạc sống động, thân thiện và mượt mà cho cả cộng đồng.
            </p>
            <p className="text-xs text-[#a5a1b5]/70">
              © {new Date().getFullYear()} Mimi Ecosystem. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#f7f4ff] uppercase tracking-wider mb-4">
              Khám Phá
            </h4>
            <ul className="space-y-2.5 text-sm text-[#a5a1b5]">
              <li>
                <Link href="/features" className="hover:text-[#b89cff] transition-colors">
                  Tính Năng
                </Link>
              </li>
              <li>
                <Link href="/commands" className="hover:text-[#b89cff] transition-colors">
                  Danh Sách Lệnh
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-[#b89cff] transition-colors">
                  Trạng Thái Hệ Thống
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-[#b89cff] transition-colors">
                  Nhật Ký Cập Nhật
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#f7f4ff] uppercase tracking-wider mb-4">
              Cộng Đồng & Hỗ Trợ
            </h4>
            <ul className="space-y-2.5 text-sm text-[#a5a1b5]">
              <li>
                <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#ff86c8] transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#ff86c8]" />
                  Máy Chủ Hỗ Trợ Discord
                </a>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#b89cff] transition-colors">
                  Báo Lỗi & Góp Ý
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#b89cff] transition-colors">
                  Dashboard Quản Trị
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#f7f4ff] uppercase tracking-wider mb-4">
              Pháp Lý & Điều Khoản
            </h4>
            <ul className="space-y-2.5 text-sm text-[#a5a1b5]">
              <li>
                <Link href="/privacy" className="hover:text-[#b89cff] transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Chính Sách Bảo Mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#b89cff] transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Điều Khoản Sử Dụng
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-[#b89cff] transition-colors">
                  Yêu Cầu Xóa Dữ Liệu
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1e1e32]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a5a1b5]">
          <div className="flex items-center gap-1">
            <span>Được thiết kế với</span>
            <Heart className="w-3.5 h-3.5 text-[#ff718b] fill-[#ff718b]" />
            <span>cho cộng đồng âm nhạc Discord Việt Nam</span>
          </div>
          <div>Support URL: <span className="font-mono text-[#65e6ff]">https://discord.gg/awYxnqfqRr</span></div>
        </div>
      </div>
    </footer>
  );
}
