import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/ui/prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Quyền riêng tư',
  description: 'Cách Mimi thu thập, sử dụng và bảo vệ dữ liệu của bạn.',
};

const UPDATED = '22/07/2026';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Chính sách quyền riêng tư" updatedAt={UPDATED}>
      <p>
        Chính sách này mô tả những dữ liệu {site.name} thu thập khi bạn dùng bot Discord và website, mục đích
        sử dụng và cách bạn kiểm soát dữ liệu của mình. Chúng tôi thu thập tối thiểu dữ liệu cần thiết để bot
        và dashboard hoạt động.
      </p>

      <LegalSection heading="1. Dữ liệu khi dùng bot trong Discord">
        <p>
          Để phát nhạc và vận hành các tính năng cộng đồng, bot xử lý các thông tin do Discord cung cấp: ID
          server, ID kênh, ID người dùng, nội dung lệnh bạn gửi tới bot và cấu hình của server (ví dụ: kênh
          TTS, kênh chào mừng). Cấu hình được lưu dưới dạng tệp trên máy chủ của bot, không dùng dịch vụ theo
          dõi bên thứ ba.
        </p>
        <p>
          Bot không lưu trữ nội dung âm thanh và không ghi âm kênh thoại. Truy vấn tìm nhạc chỉ được gửi tới
          nguồn phát (YouTube) để lấy luồng phát.
        </p>
      </LegalSection>

      <LegalSection heading="2. Dữ liệu khi đăng nhập website">
        <p>
          Khi bạn đăng nhập dashboard bằng Discord, chúng tôi yêu cầu hai phạm vi quyền (scope) tối thiểu:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong className="text-mimi-text">identify</strong> — tên hiển thị, ID và ảnh đại diện Discord của
            bạn, để hiển thị bạn đang đăng nhập.
          </li>
          <li>
            <strong className="text-mimi-text">guilds</strong> — danh sách server bạn tham gia, để hiển thị
            những server có thể quản lý bằng Mimi.
          </li>
        </ul>
        <p>
          Chúng tôi không yêu cầu quyền đọc tin nhắn, email hay bất kỳ dữ liệu nào ngoài hai phạm vi trên.
          Phiên đăng nhập được lưu trong một cookie đã ký, chỉ dùng để giữ trạng thái đăng nhập.
        </p>
      </LegalSection>

      <LegalSection heading="3. Cách chúng tôi sử dụng dữ liệu">
        <p>
          Dữ liệu chỉ được dùng để: vận hành tính năng bạn yêu cầu, hiển thị dashboard đúng server, và cải
          thiện độ ổn định. Chúng tôi không bán, không cho thuê và không chia sẻ dữ liệu của bạn cho bên thứ ba
          vì mục đích quảng cáo.
        </p>
      </LegalSection>

      <LegalSection heading="4. Lưu trữ và bảo mật">
        <p>
          Cấu hình server được lưu trên hạ tầng máy chủ vận hành bot. Kết nối giữa website và bot dùng token
          bảo mật, không lộ ra trình duyệt. Dù vậy, không hệ thống nào an toàn tuyệt đối; bạn nên chỉ cấp cho
          bot những quyền thực sự cần thiết.
        </p>
      </LegalSection>

      <LegalSection heading="5. Quyền của bạn">
        <p>
          Bạn có thể gỡ bot khỏi server bất kỳ lúc nào để dừng xử lý dữ liệu của server đó. Để yêu cầu xóa dữ
          liệu cấu hình đã lưu, xem trang{' '}
          <Link href="/data-deletion" className="text-mimi-lilac underline">
            Xóa dữ liệu
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="6. Thay đổi chính sách">
        <p>
          Chính sách có thể được cập nhật khi tính năng thay đổi. Ngày cập nhật gần nhất luôn hiển thị ở đầu
          trang. Mọi thắc mắc, vui lòng liên hệ qua server cộng đồng ở chân trang.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
