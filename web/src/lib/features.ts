/**
 * Danh sách tính năng — CHỈ liệt kê những gì bot thực sự có (đã xác minh trong index.js)
 * hoặc kết nối được qua dashboard trong dự án này. Trạng thái:
 *   available = đang chạy thật    beta = có nhưng còn hạn chế    planned = dự kiến
 * Không quảng bá 'planned' như đã có.
 */

export type FeatureStatus = 'available' | 'beta' | 'planned';

export interface Feature {
  id: string;
  title: string;
  desc: string;
  useCase: string;
  status: FeatureStatus;
  group: 'playback' | 'discovery' | 'queue' | 'personalization' | 'community' | 'administration' | 'reliability' | 'dashboard';
  commands: string[];
  /** kích thước ô bento: lg chiếm 2 cột */
  size?: 'sm' | 'lg';
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  available: 'Đang hoạt động',
  beta: 'Thử nghiệm',
  planned: 'Dự kiến',
};

export const GROUP_LABEL: Record<Feature['group'], string> = {
  playback: 'Phát nhạc',
  discovery: 'Khám phá',
  queue: 'Hàng chờ',
  personalization: 'Cá nhân hoá',
  community: 'Cộng đồng',
  administration: 'Quản trị',
  reliability: 'Ổn định',
  dashboard: 'Dashboard',
};

export const features: Feature[] = [
  {
    id: 'smart-player',
    title: 'Trình phát thông minh',
    desc: 'Player Discord với nút bấm pause, skip, dừng, lặp, âm lượng và thanh tiến trình trực quan — không cần nhớ lệnh.',
    useCase: 'Cả phòng cùng điều khiển nhạc chỉ bằng cách bấm nút, không gõ lệnh phức tạp.',
    status: 'available',
    group: 'playback',
    commands: ['play', 'queue'],
    size: 'lg',
  },
  {
    id: 'youtube-search',
    title: 'Tìm nhạc từ YouTube',
    desc: 'Tìm theo tên bài hát hoặc dán link YouTube. Mimi tự bỏ qua video riêng tư / giới hạn độ tuổi để luôn phát được.',
    useCase: 'Gõ tên bài hát bất kỳ, Mimi tìm và phát bản khả dụng đầu tiên.',
    status: 'available',
    group: 'discovery',
    commands: ['play'],
  },
  {
    id: 'queue',
    title: 'Hàng chờ cộng tác',
    desc: 'Xem và quản lý hàng chờ, xoá bài, mọi người cùng thêm nhạc vào danh sách phát chung.',
    useCase: 'Mỗi thành viên thêm một bài, cả nhóm nghe lần lượt không tranh cãi.',
    status: 'available',
    group: 'queue',
    commands: ['queue'],
  },
  {
    id: 'loop',
    title: 'Lặp bài & hàng chờ',
    desc: 'Lặp một bài yêu thích hoặc lặp toàn bộ hàng chờ chỉ bằng một nút.',
    useCase: 'Bật lặp cả playlist để nghe nền suốt buổi học chung.',
    status: 'available',
    group: 'playback',
    commands: ['play'],
  },
  {
    id: 'tts',
    title: 'Đọc tin nhắn (TTS)',
    desc: 'Chuyển tin nhắn văn bản thành giọng nói tiếng Việt trong kênh thoại, dùng Google TTS.',
    useCase: 'Thành viên không có mic vẫn "nói" được trong voice qua tin nhắn.',
    status: 'available',
    group: 'community',
    commands: ['setupdoctin'],
  },
  {
    id: 'voice-rooms',
    title: 'Phòng thoại tự động',
    desc: 'Tạo phòng thoại riêng khi thành viên vào kênh kích hoạt, kèm bảng điều khiển đổi tên, giới hạn, khoá phòng.',
    useCase: 'Mỗi nhóm bạn có phòng riêng tự sinh, tự xoá khi rời đi.',
    status: 'available',
    group: 'community',
    commands: ['setupvoiceroom'],
  },
  {
    id: 'economy',
    title: 'Kinh tế & cấp độ',
    desc: 'Hệ thống xu, XP và cấp độ thưởng cho hoạt động cộng đồng, kèm trò chơi như Blackjack.',
    useCase: 'Thành viên tích cực nhận xu, lên cấp và tham gia mini-game.',
    status: 'available',
    group: 'community',
    commands: ['resetbalance'],
  },
  {
    id: 'welcome',
    title: 'Chào mừng tuỳ biến',
    desc: 'Tin nhắn chào thành viên mới với nội dung, ảnh và bố cục tuỳ chỉnh theo từng server.',
    useCase: 'Thành viên mới được chào bằng banner riêng của server.',
    status: 'available',
    group: 'community',
    commands: ['configwelcome', 'setwelcome'],
  },
  {
    id: 'tickets',
    title: 'Hệ thống ticket',
    desc: 'Tạo phòng hỗ trợ riêng tư qua nút bấm, quản lý yêu cầu của thành viên gọn gàng.',
    useCase: 'Thành viên mở ticket để được admin hỗ trợ 1-1 kín đáo.',
    status: 'available',
    group: 'administration',
    commands: ['configticket', 'sendticket'],
  },
  {
    id: 'verify',
    title: 'Xác thực thành viên',
    desc: 'Yêu cầu xác thực trước khi truy cập server, có chế độ xác thực hằng ngày tuỳ chọn.',
    useCase: 'Lọc tài khoản rác, chỉ thành viên xác thực mới vào được kênh chính.',
    status: 'available',
    group: 'administration',
    commands: ['setupverify', 'resetverify'],
  },
  {
    id: 'reaction-roles',
    title: 'Vai trò qua reaction',
    desc: 'Thành viên tự nhận vai trò bằng cách thả emoji vào bảng chọn.',
    useCase: 'Chọn vai trò sở thích để nhận thông báo đúng kênh quan tâm.',
    status: 'available',
    group: 'administration',
    commands: ['reactionrole-create', 'reactionrole-add'],
  },
  {
    id: 'moderation',
    title: 'Kiểm duyệt & nhật ký',
    desc: 'Kick, ban, mute, cảnh cáo, kỷ luật kèm nhật ký hành động minh bạch.',
    useCase: 'Admin xử lý vi phạm và tra lại lịch sử khi cần.',
    status: 'available',
    group: 'administration',
    commands: ['kick', 'ban', 'mute', 'canhcao', 'kyluat', 'setupmodlog'],
  },
  {
    id: 'giveaway',
    title: 'Giveaway',
    desc: 'Tổ chức sự kiện tặng quà, chọn người thắng ngẫu nhiên công bằng.',
    useCase: 'Tạo giveaway mừng mốc thành viên, bốc thăm tự động.',
    status: 'available',
    group: 'community',
    commands: ['setupgiveaway', 'giveawaycreate'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard realtime',
    desc: 'Điều khiển player và chỉnh cấu hình server từ trình duyệt, đồng bộ với bot qua Internal API.',
    useCase: 'Quản lý nhạc và cài đặt server ngay trên web, không cần gõ lệnh trong Discord.',
    status: 'beta',
    group: 'dashboard',
    commands: [],
    size: 'lg',
  },
];
