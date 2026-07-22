// =====================================================================
// 🎵 musicStore.js — TẦNG LƯU TRỮ DỮ LIỆU NHẠC (persistence)
// ---------------------------------------------------------------------
// Gom mọi thứ cần ghi ra đĩa cho hệ thống nhạc vào 1 chỗ, dùng ĐÚNG pattern
// an toàn của repo: ghi ra file .tmp rồi renameSync đè lên file thật (atomic,
// tránh hỏng file khi tiến trình bị kill giữa chừng — giống saveEconomy /
// saveCreatedChannels trong index.js).
//
// 3 nhóm dữ liệu, mỗi nhóm 1 file JSON riêng trong thư mục bot:
//   • music_sessions.json      — trạng thái phiên phát để KHÔI PHỤC sau restart
//   • music_library.json       — Favorites + Album cá nhân, theo từng user
//   • music_guild_config.json  — cấu hình mỗi server (DJ role, âm lượng mặc định)
//
// TẤT CẢ file trên là DỮ LIỆU RUNTIME -> đã thêm vào .gitignore và .sftpignore,
// KHÔNG commit, KHÔNG để deploy ghi đè dữ liệu thật trên host.
// =====================================================================

const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------
// Tiện ích đọc/ghi JSON an toàn dùng chung
// -----------------------------------------------------------------
function loadJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        return data == null ? fallback : data;
    } catch (e) {
        console.error(`❌ [musicStore] Không đọc được ${path.basename(filePath)}:`, e.message);
        return fallback;
    }
}

function saveJson(filePath, data) {
    const tempPath = filePath + '.tmp';
    try {
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
        fs.renameSync(tempPath, filePath);
        return true;
    } catch (e) {
        console.error(`❌ [musicStore] Không lưu được ${path.basename(filePath)}:`, e.message);
        return false;
    }
}

class MusicStore {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.sessionsPath = path.join(baseDir, 'music_sessions.json');
        this.libraryPath = path.join(baseDir, 'music_library.json');
        this.guildConfigPath = path.join(baseDir, 'music_guild_config.json');

        // Nạp dữ liệu sẵn có vào bộ nhớ khi khởi động
        this.sessions = loadJson(this.sessionsPath, {});        // { [guildId]: sessionObject }
        this.library = loadJson(this.libraryPath, {});          // { [userId]: { favorites: [], albums: {} } }
        this.guildConfig = loadJson(this.guildConfigPath, {});  // { [guildId]: { djRoleId, defaultVolume } }
    }

    // =============================================================
    // 🔄 PHIÊN PHÁT (session-restore sau khi bot khởi động lại)
    // =============================================================
    // Lưu ảnh chụp trạng thái 1 server để lần khởi động sau vào lại phòng phát tiếp.
    // session = { voiceChannelId, textChannelId, current, queue, loop, volume,
    //             positionSec, ownerId, autoplay, stay247, effect }
    saveSession(guildId, session) {
        if (!guildId || !session) return;
        this.sessions[guildId] = { ...session, savedAt: Date.now() };
        saveJson(this.sessionsPath, this.sessions);
    }

    clearSession(guildId) {
        if (this.sessions[guildId]) {
            delete this.sessions[guildId];
            saveJson(this.sessionsPath, this.sessions);
        }
    }

    getAllSessions() {
        return this.sessions;
    }

    // Ghi TẤT CẢ phiên đang phát cùng lúc (dùng khi lưu định kỳ / trước khi tắt).
    // buildFn(guildId) -> trả về sessionObject hoặc null (bỏ qua) cho từng guild đang active.
    flushSessions(guildIds, buildFn) {
        const next = {};
        for (const guildId of guildIds) {
            const s = buildFn(guildId);
            if (s) next[guildId] = { ...s, savedAt: Date.now() };
        }
        this.sessions = next;
        saveJson(this.sessionsPath, this.sessions);
    }

    // =============================================================
    // ❤️ FAVORITES + 📁 ALBUM CÁ NHÂN (theo từng user)
    // =============================================================
    // Cấu trúc mỗi user: { favorites: [track...], albums: { [tênAlbum]: [track...] } }
    // track = { title, url, duration, thumbnail }
    _ensureUser(userId) {
        if (!this.library[userId]) {
            this.library[userId] = { favorites: [], albums: {} };
        }
        // Vá dữ liệu cũ thiếu trường (an toàn khi nâng cấp)
        if (!Array.isArray(this.library[userId].favorites)) this.library[userId].favorites = [];
        if (!this.library[userId].albums || typeof this.library[userId].albums !== 'object') this.library[userId].albums = {};
        return this.library[userId];
    }

    _saveLibrary() {
        saveJson(this.libraryPath, this.library);
    }

    // Chuẩn hóa track về đúng 4 trường cần lưu (bỏ requestedBy... cho gọn file)
    static normalizeTrack(track) {
        if (!track || !track.url) return null;
        return {
            title: track.title || 'Không rõ tên',
            url: track.url,
            duration: track.duration || 0,
            thumbnail: track.thumbnail || null
        };
    }

    // ---- Favorites ----
    isFavorite(userId, url) {
        const u = this._ensureUser(userId);
        return u.favorites.some(t => t.url === url);
    }

    // Bật/tắt tim. Trả về true nếu SAU thao tác bài đang được yêu thích, false nếu đã bỏ.
    toggleFavorite(userId, track) {
        const u = this._ensureUser(userId);
        const norm = MusicStore.normalizeTrack(track);
        if (!norm) return this.isFavorite(userId, track?.url);
        const idx = u.favorites.findIndex(t => t.url === norm.url);
        if (idx >= 0) {
            u.favorites.splice(idx, 1);
            this._saveLibrary();
            return false;
        }
        u.favorites.unshift(norm); // thêm lên đầu cho bài mới nằm trên
        this._saveLibrary();
        return true;
    }

    getFavorites(userId) {
        return this._ensureUser(userId).favorites;
    }

    // ---- Album ----
    getAlbumNames(userId) {
        return Object.keys(this._ensureUser(userId).albums);
    }

    getAlbum(userId, name) {
        const u = this._ensureUser(userId);
        return u.albums[name] || null;
    }

    // Trả về { ok, reason }. reason: 'exists' | 'limit_name' | 'invalid'
    createAlbum(userId, name) {
        const u = this._ensureUser(userId);
        const clean = String(name || '').trim().slice(0, 50);
        if (!clean) return { ok: false, reason: 'invalid' };
        if (u.albums[clean]) return { ok: false, reason: 'exists' };
        u.albums[clean] = [];
        this._saveLibrary();
        return { ok: true, name: clean };
    }

    deleteAlbum(userId, name) {
        const u = this._ensureUser(userId);
        if (!u.albums[name]) return false;
        delete u.albums[name];
        this._saveLibrary();
        return true;
    }

    // Thêm bài vào album. Trả về { ok, reason } — reason: 'no_album' | 'duplicate'
    addToAlbum(userId, name, track) {
        const u = this._ensureUser(userId);
        if (!u.albums[name]) return { ok: false, reason: 'no_album' };
        const norm = MusicStore.normalizeTrack(track);
        if (!norm) return { ok: false, reason: 'invalid' };
        if (u.albums[name].some(t => t.url === norm.url)) return { ok: false, reason: 'duplicate' };
        u.albums[name].push(norm);
        this._saveLibrary();
        return { ok: true };
    }

    removeFromAlbum(userId, name, index) {
        const u = this._ensureUser(userId);
        if (!u.albums[name] || index < 0 || index >= u.albums[name].length) return false;
        u.albums[name].splice(index, 1);
        this._saveLibrary();
        return true;
    }

    // =============================================================
    // ⚙️ CẤU HÌNH MỖI SERVER (DJ role, âm lượng mặc định)
    // =============================================================
    getGuildConfig(guildId) {
        if (!this.guildConfig[guildId]) {
            this.guildConfig[guildId] = { djRoleId: null, defaultVolume: 1 };
        }
        return this.guildConfig[guildId];
    }

    setGuildConfig(guildId, patch) {
        const cfg = this.getGuildConfig(guildId);
        Object.assign(cfg, patch);
        saveJson(this.guildConfigPath, this.guildConfig);
        return cfg;
    }
}

module.exports = { MusicStore };
