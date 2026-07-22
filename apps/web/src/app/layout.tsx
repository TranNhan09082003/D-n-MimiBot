import type { Metadata } from "next";
import { Sora, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mimi — Bot phát nhạc Discord dành cho cộng đồng",
  description: "Mời Mimi vào server Discord để phát nhạc mượt mà, quản lý hàng chờ, tạo playlist và điều khiển bằng giao diện trực quan.",
  keywords: ["Discord Bot Music", "Mimi Bot", "Bot phát nhạc Discord", "Discord Music Player", "Mimi Discord"],
  openGraph: {
    title: "Mimi — Bot phát nhạc Discord dành cho cộng đồng",
    description: "Trải nghiệm âm nhạc sống động, mượt mà và cá nhân hóa trên Discord cùng Mimi.",
    url: "https://mimi-bot.com",
    siteName: "Mimi Sound Universe",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimi — Discord Music Bot",
    description: "Bot phát nhạc Discord chuyên nghiệp, mượt mà dành cho cộng đồng của bạn.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${sora.variable} ${beVietnam.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#070711] text-[#f7f4ff] antialiased min-h-screen flex flex-col selection:bg-[#b89cff] selection:text-[#070711]">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
