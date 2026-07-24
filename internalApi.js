// =====================================================================
// 🔌 MIMI INTERNAL API
// ---------------------------------------------------------------------
// HTTP server nội bộ chạy TRONG tiến trình bot, cho website (Next.js trên
// Nhân Hòa) gọi để: lấy trạng thái bot, danh sách lệnh, đọc/ghi cấu hình
// server, xem & điều khiển trình phát nhạc.
//
// Nguyên tắc bảo mật:
//   - Chỉ dùng Node built-in (http, crypto) — KHÔNG thêm dependency native.
//   - Mọi request phải kèm header  Authorization: Bearer <MIMI_API_TOKEN>
//     (so khớp bằng timingSafeEqual để chống timing attack).
//   - KHÔNG bao giờ trả token, secret, hay dữ liệu nhạy cảm ra ngoài.
//   - Không trả stack trace ở production.
//   - Có rate-limit đơn giản theo IP + request-id cho mỗi request.
//
// Cách nhúng: gọi startInternalApi({ ...deps }) trong sự kiện 'ready'.
// =====================================================================

const http = require('http');
const crypto = require('crypto');

// ---------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------
function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    try { return crypto.timingSafeEqual(ab, bb); } catch { return false; }
}

function newRequestId() {
    return crypto.randomBytes(8).toString('hex');
}

// Rate limiter cực nhẹ: cửa sổ trượt theo IP.
function createRateLimiter({ windowMs = 10_000, max = 60 } = {}) {
    const hits = new Map(); // ip -> number[] (timestamps)
    return function isLimited(ip) {
        const now = Date.now();
        const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
        arr.push(now);
        hits.set(ip, arr);
        // dọn map định kỳ để không rò rỉ bộ nhớ
        if (hits.size > 5000) hits.clear();
        return arr.length > max;
    };
}

// ---------------------------------------------------------------------
// Bộ chuyển đổi dữ liệu sang dạng "public" (an toàn để trả ra web)
// ---------------------------------------------------------------------
function publicTrack(t) {
    if (!t) return null;
    return {
        title: t.title || 'Không rõ tiêu đề',
        author: t.author || null,
        uri: t.url || null,
        artworkUrl: t.thumbnail || null,
        durationMs: (Number(t.duration) || 0) * 1000,
        isStream: !t.duration || t.duration <= 0,
        requestedBy: t.requestedBy
            ? (typeof t.requestedBy === 'string'
                ? { username: t.requestedBy }
                : { id: t.requestedBy.id, username: t.requestedBy.username, avatarUrl: t.requestedBy.avatarUrl })
            : null
    };
}

function publicPlayerState(guildId, mq, voiceLib) {
    if (!mq) {
        return {
            guildId,
            connected: false,
            track: null,
            queue: [],
            positionMs: 0,
            paused: false,
            volume: 100,
            repeatMode: 'off',
            autoplay: false,
            updatedAt: new Date().toISOString()
        };
    }
    const status = mq.player?.state?.status;
    const paused = voiceLib ? status === voiceLib.AudioPlayerStatus.Paused : false;
    const positionMs = mq.currentResource ? Math.floor(mq.currentResource.playbackDuration) : 0;
    return {
        guildId,
        voiceChannelId: mq.voiceChannelId || null,
        textChannelId: mq.textChannel?.id || null,
        track: publicTrack(mq.current),
        queue: (mq.queue || []).slice(0, 50).map(publicTrack),
        positionMs,
        paused,
        volume: Math.round((mq.volume ?? 1) * 100),
        repeatMode: mq.loop === 'track' ? 'track' : mq.loop === 'queue' ? 'queue' : 'off',
        autoplay: !!mq.autoplay,
        connected: !!mq.connection,
        updatedAt: new Date().toISOString()
    };
}

// ---------------------------------------------------------------------
// Server chính
// ---------------------------------------------------------------------
function startInternalApi(deps) {
    const {
        client,
        config,
        getGuildConfig,
        saveConfig,
        musicQueues,
        voiceLib,
        killCurrentProcess,
        logger = console,
        // các field cấu hình guild được phép sửa qua API (allowlist — chống ghi bừa)
        editableSettingKeys = [
            'prefix', 'unverifyOnMute', 'verifyDailyMode'
        ]
    } = deps;

    // Token: ưu tiên env MIMI_API_TOKEN; nếu panel không inject env thì lấy
    // từ config.json (config.mimiApiToken) — file này bot chắc chắn đọc được.
    const TOKEN = (process.env.MIMI_API_TOKEN || config?.mimiApiToken || '').trim();
    // Ưu tiên MIMI_API_PORT (đặt thủ công). Nếu trống, dùng port Pterodactyl/VibeHost
    // cấp qua SERVER_PORT (bot Discord không cần port inbound nên port này đang rảnh).
    const PORT = Number(process.env.MIMI_API_PORT || process.env.SERVER_PORT || 8787);
    // Trên panel, phải bind vào IP nội bộ container (SERVER_IP) hoặc 0.0.0.0 thì
    // port mới được map ra ngoài. 127.0.0.1 chỉ hợp khi web cùng máy với bot.
    const HOST = process.env.MIMI_API_HOST || process.env.SERVER_IP || '0.0.0.0';

    if (!TOKEN) {
        logger.warn('⚠️ [InternalAPI] Chưa đặt token — API nội bộ sẽ KHÔNG khởi động (an toàn: tránh mở cổng không xác thực).');
        logger.warn('   → Đặt token bằng 1 trong 2 cách: (a) biến môi trường MIMI_API_TOKEN trên panel, hoặc (b) thêm "mimiApiToken": "<token>" vào config.json.');
        return null;
    }

    const isLimited = createRateLimiter({ windowMs: 10_000, max: 90 });

    function send(res, status, body, reqId) {
        const payload = JSON.stringify(body);
        res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Request-Id': reqId,
            'Cache-Control': 'no-store'
        });
        res.end(payload);
    }

    function fail(res, status, code, message, reqId) {
        send(res, status, { ok: false, error: { code, message }, requestId: reqId }, reqId);
    }

    // Đọc & parse body JSON có giới hạn kích thước
    function readJson(req, limitBytes = 256 * 1024) {
        return new Promise((resolve, reject) => {
            let size = 0;
            const chunks = [];
            req.on('data', (c) => {
                size += c.length;
                if (size > limitBytes) { reject(new Error('PAYLOAD_TOO_LARGE')); req.destroy(); return; }
                chunks.push(c);
            });
            req.on('end', () => {
                if (!chunks.length) return resolve({});
                try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
                catch { reject(new Error('INVALID_JSON')); }
            });
            req.on('error', reject);
        });
    }

    // Lấy danh mục lệnh thật từ Discord (đã đăng ký) — có cache 60s.
    let commandCache = { at: 0, data: null };
    async function getCommandCatalog() {
        const now = Date.now();
        if (commandCache.data && now - commandCache.at < 60_000) return commandCache.data;
        let cmds = [];
        try {
            const fetched = await client.application.commands.fetch();
            cmds = [...fetched.values()].map((c) => ({
                name: c.name,
                description: c.description || '',
                options: (c.options || []).map((o) => ({
                    name: o.name,
                    description: o.description || '',
                    type: o.type,
                    required: !!o.required
                })),
                defaultMemberPermissions: c.defaultMemberPermissions ? String(c.defaultMemberPermissions.bitfield) : null
            })).sort((a, b) => a.name.localeCompare(b.name));
        } catch (err) {
            logger.error('❌ [InternalAPI] Không lấy được danh sách lệnh:', err?.message);
        }
        commandCache = { at: now, data: cmds };
        return cmds;
    }

    const server = http.createServer(async (req, res) => {
        const reqId = newRequestId();
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

        try {
            // CORS: chỉ cho phép nếu web và bot khác origin — mặc định khóa, web gọi server-to-server nên không cần CORS.
            if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

            if (isLimited(ip)) return fail(res, 429, 'RATE_LIMITED', 'Quá nhiều yêu cầu, thử lại sau.', reqId);

            const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const parts = url.pathname.split('/').filter(Boolean); // ['internal', ...]

            // Health & liveness KHÔNG cần token (chỉ trả trạng thái sống, không lộ dữ liệu)
            if (url.pathname === '/health/live') {
                return send(res, 200, { ok: true, status: 'alive' }, reqId);
            }
            if (url.pathname === '/health/ready') {
                const ready = client.isReady?.() ?? !!client.readyAt;
                return send(res, ready ? 200 : 503, {
                    ok: ready,
                    status: ready ? 'ready' : 'starting',
                    discord: ready
                }, reqId);
            }

            // Mọi endpoint /internal/* cần token
            if (parts[0] !== 'internal') return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy tài nguyên.', reqId);

            const auth = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
            if (!safeEqual(auth, TOKEN)) return fail(res, 401, 'UNAUTHORIZED', 'Thiếu hoặc sai service token.', reqId);

            // ---- GET /internal/status ----
            if (req.method === 'GET' && parts[1] === 'status') {
                const ready = client.isReady?.() ?? !!client.readyAt;
                let reachableUsers = 0;
                let voiceSessions = 0;
                for (const g of client.guilds.cache.values()) reachableUsers += g.memberCount || 0;
                for (const mq of musicQueues.values()) if (mq.connection) voiceSessions++;
                return send(res, 200, {
                    ok: true,
                    online: ready,
                    guildCount: client.guilds.cache.size,
                    reachableUsers,
                    activeVoiceSessions: voiceSessions,
                    wsPing: Math.round(client.ws?.ping ?? -1),
                    uptimeSeconds: Math.floor((client.uptime ?? 0) / 1000),
                    updatedAt: new Date().toISOString()
                }, reqId);
            }

            // ---- GET /internal/commands ----
            if (req.method === 'GET' && parts[1] === 'commands') {
                const catalog = await getCommandCatalog();
                return send(res, 200, { ok: true, commands: catalog, count: catalog.length }, reqId);
            }

            // ---- /internal/guilds/:id/... ----
            if (parts[1] === 'guilds' && parts[2]) {
                const guildId = parts[2];
                const guild = client.guilds.cache.get(guildId);

                // Bot có ở guild này không?
                const botInGuild = !!guild;

                // GET settings
                if (req.method === 'GET' && parts[3] === 'settings') {
                    if (!botInGuild) return fail(res, 404, 'BOT_NOT_IN_GUILD', 'Bot chưa ở trong server này.', reqId);
                    const gc = getGuildConfig(guildId);
                    // chỉ trả các field an toàn/hữu ích, không trả dữ liệu lịch sử nặng
                    return send(res, 200, {
                        ok: true,
                        guild: { id: guild.id, name: guild.name, iconUrl: guild.iconURL?.({ size: 128 }) || null, memberCount: guild.memberCount },
                        settings: {
                            prefix: gc.prefix ?? 'mi',
                            unverifyOnMute: !!gc.unverifyOnMute,
                            verifyDailyMode: !!gc.verifyDailyMode,
                            isSetupCompleted: !!gc.isSetupCompleted,
                            isVerifySetup: !!gc.isVerifySetup,
                            isTtsSetup: !!gc.isTtsSetup,
                            isVoiceRoomSetup: !!gc.isVoiceRoomSetup
                        }
                    }, reqId);
                }

                // PATCH settings
                if (req.method === 'PATCH' && parts[3] === 'settings') {
                    if (!botInGuild) return fail(res, 404, 'BOT_NOT_IN_GUILD', 'Bot chưa ở trong server này.', reqId);
                    const body = await readJson(req);
                    const gc = getGuildConfig(guildId);
                    const applied = {};
                    for (const key of editableSettingKeys) {
                        if (!(key in body)) continue;
                        const val = body[key];
                        // validate theo kiểu
                        if (key === 'prefix') {
                            if (typeof val !== 'string' || val.length < 1 || val.length > 5) {
                                return fail(res, 422, 'VALIDATION', 'prefix phải là chuỗi 1–5 ký tự.', reqId);
                            }
                            gc.prefix = val.trim();
                            applied.prefix = gc.prefix;
                        } else if (typeof val === 'boolean') {
                            gc[key] = val;
                            applied[key] = val;
                        } else {
                            return fail(res, 422, 'VALIDATION', `Giá trị không hợp lệ cho "${key}".`, reqId);
                        }
                    }
                    saveConfig();
                    logger.info(`ℹ️ [InternalAPI] PATCH settings guild=${guildId} req=${reqId} keys=${Object.keys(applied).join(',') || 'none'}`);
                    return send(res, 200, { ok: true, applied }, reqId);
                }

                // GET player
                if (req.method === 'GET' && parts[3] === 'player') {
                    const mq = musicQueues.get(guildId);
                    return send(res, 200, { ok: true, player: publicPlayerState(guildId, mq, voiceLib) }, reqId);
                }

                // GET queue
                if (req.method === 'GET' && parts[3] === 'queue') {
                    const mq = musicQueues.get(guildId);
                    return send(res, 200, { ok: true, queue: mq ? (mq.queue || []).map(publicTrack) : [] }, reqId);
                }

                // POST player actions
                if (req.method === 'POST' && parts[3] === 'player' && parts[4]) {
                    const action = parts[4];
                    const mq = musicQueues.get(guildId);
                    if (!mq || !mq.player) return fail(res, 409, 'NO_PLAYER', 'Không có phiên phát nhạc nào đang hoạt động.', reqId);

                    if (action === 'pause') {
                        if (voiceLib && mq.player.state.status === voiceLib.AudioPlayerStatus.Playing) mq.player.pause();
                    } else if (action === 'resume') {
                        if (voiceLib && mq.player.state.status === voiceLib.AudioPlayerStatus.Paused) mq.player.unpause();
                    } else if (action === 'skip') {
                        if (typeof killCurrentProcess === 'function') killCurrentProcess(mq);
                        mq.player.stop(); // -> Idle -> tự phát bài kế
                    } else if (action === 'stop') {
                        mq.queue = [];
                        mq.loop = 'off';
                        if (mq.idleTimeout) clearTimeout(mq.idleTimeout);
                        if (typeof killCurrentProcess === 'function') killCurrentProcess(mq);
                        mq.player.stop();
                        try { mq.connection?.destroy(); } catch {}
                        musicQueues.delete(guildId);
                    } else if (action === 'volume') {
                        const body = await readJson(req);
                        const v = Number(body.volume);
                        if (!Number.isFinite(v) || v < 0 || v > 150) return fail(res, 422, 'VALIDATION', 'volume phải trong khoảng 0–150.', reqId);
                        mq.volume = Math.round(v) / 100;
                        if (mq.currentResource?.volume) mq.currentResource.volume.setVolume(mq.volume);
                    } else {
                        return fail(res, 404, 'UNKNOWN_ACTION', `Hành động không hỗ trợ: ${action}`, reqId);
                    }
                    logger.info(`ℹ️ [InternalAPI] player.${action} guild=${guildId} req=${reqId}`);
                    return send(res, 200, { ok: true, player: publicPlayerState(guildId, musicQueues.get(guildId), voiceLib) }, reqId);
                }
            }

            return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy tài nguyên.', reqId);
        } catch (err) {
            if (err?.message === 'INVALID_JSON') return fail(res, 400, 'INVALID_JSON', 'Body không phải JSON hợp lệ.', reqId);
            if (err?.message === 'PAYLOAD_TOO_LARGE') return fail(res, 413, 'PAYLOAD_TOO_LARGE', 'Payload quá lớn.', reqId);
            logger.error(`❌ [InternalAPI] req=${reqId} lỗi:`, err?.message);
            return fail(res, 500, 'INTERNAL', 'Lỗi nội bộ.', reqId);
        }
    });

    server.on('error', (err) => {
        logger.error('❌ [InternalAPI] Server error:', err?.message);
    });

    server.listen(PORT, HOST, () => {
        logger.info(`🔌 [InternalAPI] Đang lắng nghe tại ${HOST}:${PORT} (đã bật xác thực token).`);
    });

    return server;
}

module.exports = { startInternalApi, publicPlayerState, publicTrack };
