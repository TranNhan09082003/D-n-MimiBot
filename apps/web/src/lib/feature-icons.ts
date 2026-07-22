import {
  Music,
  Search,
  ListMusic,
  Repeat,
  Mic2,
  Users,
  Coins,
  PartyPopper,
  Ticket,
  ShieldCheck,
  Tags,
  Gavel,
  Gift,
  MonitorPlay,
  type LucideIcon,
} from 'lucide-react';
import type { FeatureIcon } from '@/lib/features';

// Map tên icon (trong features.ts) -> component lucide.
// Dùng chung cho bento (trang chủ) và trang /features để chỉ khai báo một chỗ.
export const FEATURE_ICONS: Record<FeatureIcon, LucideIcon> = {
  music: Music,
  search: Search,
  list: ListMusic,
  repeat: Repeat,
  mic: Mic2,
  users: Users,
  coins: Coins,
  party: PartyPopper,
  ticket: Ticket,
  shield: ShieldCheck,
  tags: Tags,
  gavel: Gavel,
  gift: Gift,
  monitor: MonitorPlay,
};
