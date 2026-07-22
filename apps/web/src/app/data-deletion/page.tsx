import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/ui/prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Xóa dữ liệu',
  description: 'Cách yêu cầu xóa dữ liệu bạn đã cung cấp cho Mimi.',
};

const UPDATED = '22/07/2026';

export default function DataDeletionPage() {
  return (
    <LegalLayout title="Yêu cầu xóa dữ liệu" updatedAt={UPDATED}>
      <p>
        Bạn có quyền yêu cầu xóa dữ liệu mà {site.name} lưu trữ. Trang này giải thích những gì được lưu và cách
        xóa.
      </p>

      <LegalSection heading="1. Dữ liệu có thể bị xóa">
        <p>
          {site.name} lưu chủ yếu là cấu hình theo server (prefix, kênh TTS, kênh chào mừng, thiết lập xác
          minh...). Bot không xây dựng hồ sơ cá nhân và không lưu nội dung tin nhắn hay âm thanh.
        </p>
      </LegalSection>

      <LegalSection heading="2. Tự xóa nhanh">
        <p>
          Cách nhanh nhất để dừng mọi xử lý dữ liệu của một server là <strong className="text-mimi-text">gỡ
          bot khỏi server</strong> đó. Khi bot rời server, cấu hình liên quan sẽ không còn được sử dụng.
        </p>
      </LegalSection>

      <LegalSection heading="3. Yêu cầu xóa thủ công">
        <p>Nếu muốn xóa hoàn toàn dữ liệu cấu hình đã lưu, hãy làm theo các bước:</p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>Tham gia server cộng đồng của Mimi (liên kết ở chân trang).</li>
          <li>Mở một ticket hoặc liên hệ quản trị viên, nêu rõ ID server cần xóa dữ liệu.</li>
          <li>
            Chúng tôi sẽ xác minh bạn có quyền quản lý server đó (thường là quyền &quot;Quản lý máy chủ&quot;)
            trước khi xử lý.
          </li>
        </ol>
        <p>
          Yêu cầu hợp lệ sẽ được xử lý trong thời gian sớm nhất. Sau khi xóa, cấu hình sẽ trở về mặc định nếu
          bạn dùng lại bot.
        </p>
      </LegalSection>

      <LegalSection heading="4. Liên quan">
        <p>
          Xem thêm{' '}
          <Link href="/privacy" className="text-mimi-lilac underline">
            Chính sách quyền riêng tư
          </Link>{' '}
          để hiểu chi tiết dữ liệu được thu thập và sử dụng như thế nào.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
