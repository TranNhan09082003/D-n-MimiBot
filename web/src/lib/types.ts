// =====================================================================
// 📦 KIỂU DỮ LIỆU DÙNG CHUNG GIỮA WEB VÀ BOT
// ---------------------------------------------------------------------
// Phải khớp với dữ liệu "public" mà internalApi.js của bot trả ra.
// Không thêm field nhạy cảm (token, id nội bộ...) vào đây.
// =====================================================================

export interface PublicTrack {
  title: string;
  author: string | null;
  uri: string | null;
  artworkUrl: string | null;
  durationMs: number;
  isStream: boolean;
  requestedBy: {
    id?: string;
    username: string;
    avatarUrl?: string;
  } | null;
}

export type RepeatMode = "off" | "track" | "queue";

export interface PublicPlayerState {
  guildId: string;
  voiceChannelId?: string | null;
  textChannelId?: string | null;
  track: PublicTrack | null;
  queue: PublicTrack[];
  positionMs: number;
  paused: boolean;
  volume: number;
  repeatMode: RepeatMode;
  autoplay: boolean;
  connected: boolean;
  updatedAt: string;
}

export interface BotStatus {
  online: boolean;
  guildCount: number;
  reachableUsers: number;
  activeVoiceSessions: number;
  wsPing: number;
  uptimeSeconds: number;
  updatedAt: string;
}

export interface CommandOption {
  name: string;
  description: string;
  type: number;
  required: boolean;
}

export interface CommandInfo {
  name: string;
  description: string;
  options: CommandOption[];
  defaultMemberPermissions: string | null;
}

export interface GuildSettings {
  prefix: string;
  unverifyOnMute: boolean;
  verifyDailyMode: boolean;
  isSetupCompleted: boolean;
  isVerifySetup: boolean;
  isTtsSetup: boolean;
  isVoiceRoomSetup: boolean;
}

export interface GuildSummary {
  id: string;
  name: string;
  iconUrl: string | null;
  memberCount: number;
}
