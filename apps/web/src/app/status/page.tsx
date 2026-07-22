import StatusWidget from "@/components/StatusWidget";

export const metadata = {
  title: "Trạng Thái Hệ Thống — Mimi Bot Status",
  description: "Theo dõi tình trạng hoạt động realtime của Mimi Bot, Gateway, Database và Audio Nodes.",
};

export default function StatusPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#f7f4ff]">
            Trạng Thái Vận Hành Trực Tiếp
          </h1>
          <p className="text-sm text-[#a5a1b5]">
            Kiểm tra trạng thái kết nối realtime giữa Discord Gateway, Website API và hệ thống nút phát nhạc.
          </p>
        </div>

        <StatusWidget />
      </div>
    </div>
  );
}
