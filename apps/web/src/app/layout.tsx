import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Font chính — hỗ trợ đầy đủ tiếng Việt (subset "vietnamese"). Dùng cho cả
// body lẫn tiêu đề để chỉ có MỘT nguồn font, tránh lệch chữ/nhấp nháy.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mimi",
  display: "swap",
});

// Chỉ dùng cho code, ID server, số liệu độ trễ (latency) — giữ chữ đơn cách.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mimi — Bot phát nhạc Discord dành cho cộng đồng",
    template: "%s · Mimi",
  },
  description:
    "Mời Mimi vào server Discord để phát nhạc, quản lý hàng chờ, tạo playlist và điều khiển trải nghiệm nghe nhạc bằng giao diện trực quan.",
  keywords: ["Discord bot", "music bot", "bot phát nhạc", "Mimi", "Discord music", "bot nhạc tiếng Việt"],
  authors: [{ name: "Mimi" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Mimi",
    title: "Mimi — Bot phát nhạc Discord dành cho cộng đồng",
    description:
      "Biến voice channel Discord thành không gian âm nhạc sống động. Phát nhạc, quản lý hàng chờ và điều khiển bằng dashboard trực quan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimi — Bot phát nhạc Discord",
    description: "Biến voice channel Discord thành không gian âm nhạc sống động.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  themeColor: "#070711",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="mimi-noise min-h-screen antialiased">
        <div className="mimi-bg" aria-hidden />
        <a href="#main" className="skip-link">
          Bỏ qua tới nội dung chính
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
