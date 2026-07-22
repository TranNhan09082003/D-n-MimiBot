import { Suspense } from 'react';
import Link from 'next/link';
import { Sparkles, Rocket, MessageSquareHeart } from 'lucide-react';
import { HeroVisual } from '@/components/home/hero-visual';
import { DemoPlayer } from '@/components/home/demo-player';
import { LiveStats } from '@/components/home/live-stats';
import { BentoGrid } from '@/components/home/bento-grid';
import { Section } from '@/components/ui/section';
import { CtaLink, ButtonLink } from '@/components/ui/button';
import { site } from '@/lib/site';

// Trang chủ là Server Component; LiveStats fetch dữ liệu thật của bot (có fallback).
export default function HomePage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mimi-lilac">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Âm nhạc cho cả cộng đồng
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-mimi-text sm:text-5xl lg:text-6xl">
              Âm nhạc dành cho{' '}
              <span className="mimi-gradient-text">cả cộng đồng</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-mimi-muted">
              Mimi mang trải nghiệm nghe nhạc mượt mà, tương tác và đầy cảm xúc đến voice channel Discord của
              bạn — điều khiển bằng nút bấm hoặc ngay trên dashboard web.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaLink href={site.inviteUrl} variant="primary" pendingLabel="Link mời đang được cấu hình">
                Mời Mimi vào server
              </CtaLink>
              <ButtonLink href="#trai-nghiem" variant="secondary">
                Trải nghiệm Mimi
              </ButtonLink>
            </div>
          </div>

          {/* Sound Core orb (canvas thật) + chip quỹ đạo trung thực */}
          <div className="relative">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ================= SOCIAL PROOF (dữ liệu thật) ================= */}
      <Section className="py-12">
        <Suspense fallback={<StatsSkeleton />}>
          <LiveStats />
        </Suspense>
      </Section>

      {/* ================= VẤN ĐỀ → GIẢI PHÁP ================= */}
      <Section
        title="Tại sao cộng đồng cần Mimi?"
        subtitle="Những khó chịu thường gặp khi nghe nhạc trên Discord — và cách Mimi xử lý."
        className="py-16"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {problems.map((p) => (
            <div key={p.problem} className="mimi-card p-5">
              <p className="flex items-start gap-2 text-sm text-mimi-muted">
                <span className="mt-0.5 text-mimi-danger" aria-hidden>
                  ✕
                </span>
                {p.problem}
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm text-mimi-text">
                <span className="mt-0.5 text-mimi-success" aria-hidden>
                  ✓
                </span>
                {p.solution}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ================= BENTO TÍNH NĂNG ================= */}
      <Section
        title="Mimi làm được gì?"
        subtitle="Tất cả tính năng dưới đây đều đang chạy thật trên bot."
        className="py-16"
      >
        <BentoGrid />
      </Section>

      {/* ================= TRẢI NGHIỆM PLAYER ================= */}
      <Section
        id="trai-nghiem"
        title="Trải nghiệm player"
        subtitle="Bản demo tương tác ngay trên web. Player thật trong Discord còn nhiều nút điều khiển hơn."
        className="py-16"
      >
        <div className="mx-auto max-w-md">
          <DemoPlayer />
          <p className="mt-4 text-center text-xs text-mimi-muted">
            Đây là chế độ demo dùng âm thanh tổng hợp. Đăng nhập và mở{' '}
            <Link href="/dashboard" className="text-mimi-lilac underline">
              dashboard
            </Link>{' '}
            để điều khiển player thật của server bạn.
          </p>
        </div>
      </Section>

      {/* ================= CÁCH HOẠT ĐỘNG ================= */}
      <Section title="Mimi hoạt động như thế nào?" className="py-16">
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="mimi-card relative p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-mimi-night/60">
                    <Icon className="h-5 w-5 text-mimi-lilac" aria-hidden />
                  </span>
                  <span className="font-display text-3xl font-bold text-mimi-lilac/30">{i + 1}</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-mimi-text">{s.title}</h3>
                <p className="mt-2 text-sm text-mimi-muted">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* ================= FAQ ================= */}
      <Section title="Câu hỏi thường gặp" className="py-16">
        <div className="mx-auto max-w-3xl divide-y divide-white/10">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-mimi-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mimi-lilac">
                {f.q}
                <span className="ml-4 text-mimi-muted transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-mimi-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ================= CTA CUỐI ================= */}
      <Section className="py-20">
        <div className="mimi-card relative overflow-hidden px-6 py-14 text-center">
          <h2 className="font-display text-3xl font-bold text-mimi-text sm:text-4xl">
            Bật nhạc lên.
            <br />
            Mimi lo phần còn lại.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaLink href={site.inviteUrl} variant="primary" pendingLabel="Link mời đang được cấu hình">
              Mời Mimi
            </CtaLink>
            <CtaLink href={site.supportUrl} variant="secondary" pendingLabel="Link cộng đồng đang được cấu hình">
              Tham gia cộng đồng
            </CtaLink>
          </div>
        </div>
      </Section>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mimi-card h-28 animate-pulse p-5" aria-hidden />
      ))}
    </div>
  );
}

const problems = [
  {
    problem: 'Bot khó dùng vì phải nhớ quá nhiều lệnh.',
    solution: 'Player của Mimi điều khiển bằng nút bấm — pause, skip, lặp, âm lượng ngay trên tin nhắn.',
  },
  {
    problem: 'Hàng chờ gián đoạn khi bot mất kết nối.',
    solution: 'Mimi bắt lỗi tiến trình phát và tự chuyển bài kế tiếp thay vì đứng im.',
  },
  {
    problem: 'Video riêng tư / giới hạn tuổi làm bot đứng hình.',
    solution: 'Mimi tự động bỏ qua video bị chặn và phát bản khả dụng đầu tiên.',
  },
  {
    problem: 'Giao diện player thiếu trực quan.',
    solution: 'Embed hiển thị tên bài, thời lượng, thanh tiến trình, âm lượng và trạng thái lặp.',
  },
  {
    problem: 'Trải nghiệm giữa website và Discord bị tách rời.',
    solution: 'Dashboard web đồng bộ trực tiếp với bot qua Internal API — điều khiển từ trình duyệt.',
  },
  {
    problem: 'Thành viên không có mic khó tham gia voice.',
    solution: 'Tính năng đọc tin nhắn (TTS) tiếng Việt giúp mọi người "lên tiếng" bằng văn bản.',
  },
];

const steps = [
  { icon: Rocket, title: 'Mời Mimi vào server', desc: 'Bấm nút mời và cấp quyền cần thiết cho Mimi chỉ trong vài giây.' },
  { icon: Sparkles, title: 'Vào voice và dùng /play', desc: 'Tham gia kênh thoại rồi gõ /play kèm tên bài hát hoặc link YouTube.' },
  { icon: MessageSquareHeart, title: 'Điều khiển bằng nút hoặc dashboard', desc: 'Dùng nút trên player Discord, hoặc mở dashboard web để quản lý.' },
];

const faqs = [
  { q: 'Mimi có miễn phí không?', a: 'Có. Mimi là dự án cộng đồng, bạn có thể mời và sử dụng miễn phí. Mọi khoản ủng hộ chỉ dùng để duy trì máy chủ.' },
  { q: 'Mimi hỗ trợ nguồn nhạc nào?', a: 'Hiện Mimi phát nhạc từ YouTube — tìm theo tên bài hát hoặc dán trực tiếp link YouTube.' },
  { q: 'Có cần nhớ nhiều lệnh không?', a: 'Không. Sau khi dùng /play, bạn điều khiển toàn bộ bằng nút bấm trên player hoặc qua dashboard web.' },
  { q: 'Mimi có chế độ đọc tin nhắn không?', a: 'Có. Tính năng TTS tiếng Việt đọc tin nhắn trong kênh được cấu hình, dùng Google TTS.' },
  { q: 'Làm sao báo lỗi bài hát?', a: 'Vào trang Hỗ trợ, điền mẫu báo lỗi kèm link bài hát và mô tả. Mỗi lỗi có mã riêng để tra cứu nhanh.' },
  { q: 'Website dùng dữ liệu Discord nào?', a: 'Khi đăng nhập, Mimi chỉ đọc thông tin cơ bản (identify) và danh sách server (guilds) để hiển thị dashboard. Xem trang Quyền riêng tư để biết chi tiết.' },
  { q: 'Khi bot offline thì điều gì xảy ra?', a: 'Website vẫn hoạt động và hiển thị trạng thái "ngoại tuyến". Các nút điều khiển player sẽ tạm khoá cho tới khi bot online lại.' },
  { q: 'Làm sao nhận hỗ trợ?', a: 'Tham gia server hỗ trợ của Mimi qua liên kết ở chân trang, hoặc xem trang Hỗ trợ.' },
];
