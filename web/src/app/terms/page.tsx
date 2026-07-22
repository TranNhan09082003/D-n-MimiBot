import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/ui/prose';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản khi sử dụng bot và website Mimi.',
};

const UPDATED = '22/07/2026';

export default function TermsPage() {
  return (
    <LegalLayout title="Điều khoản sử dụng" updatedAt={UPDATED}>
      <p>
        Bằng việc mời {site.name} vào server hoặc sử dụng website, bạn đồng ý với các điều khoản dưới đây.
        {site.name} là dự án cộng đồng, cung cấp miễn phí và không kèm bảo đảm.
      </p>

      <LegalSection heading="1. Sử dụng hợp lệ">
        <p>
          Bạn đồng ý không dùng Mimi để vi phạm Điều khoản dịch vụ của Discord, phát tán nội dung bất hợp pháp,
          quấy rối người khác hoặc lạm dụng tài nguyên bot (ví dụ: spam lệnh gây quá tải). Chúng tôi có thể hạn
          chế truy cập nếu phát hiện hành vi lạm dụng.
        </p>
      </LegalSection>

      <LegalSection heading="2. Nội dung bên thứ ba">
        <p>
          Mimi phát nội dung từ nguồn bên thứ ba (YouTube). Chúng tôi không sở hữu và không chịu trách nhiệm
          về nội dung đó. Việc sử dụng phải tuân thủ điều khoản của nguồn phát tương ứng và luật bản quyền hiện
          hành.
        </p>
      </LegalSection>

      <LegalSection heading="3. Không bảo đảm">
        <p>
          Dịch vụ được cung cấp &quot;nguyên trạng&quot;. Chúng tôi cố gắng duy trì bot hoạt động ổn định
          nhưng không cam kết luôn sẵn sàng, không lỗi hay không gián đoạn. Tính năng có thể thay đổi hoặc
          ngừng cung cấp mà không cần báo trước.
        </p>
      </LegalSection>

      <LegalSection heading="4. Giới hạn trách nhiệm">
        <p>
          Trong phạm vi pháp luật cho phép, đội ngũ Mimi không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp
          nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
        </p>
      </LegalSection>

      <LegalSection heading="5. Thay đổi điều khoản">
        <p>
          Điều khoản có thể được cập nhật theo thời gian. Việc tiếp tục sử dụng sau khi cập nhật đồng nghĩa bạn
          chấp nhận các thay đổi. Ngày cập nhật gần nhất hiển thị ở đầu trang.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
