const { 
    Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, 
    SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    Partials, StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { colors, buildBaseEmbed, generateProgressBar } = require('./uiBuilder');

// -----------------------------------------------------------------
// 🕐 HELPER MÚI GIỜ VIỆT NAM CỐ ĐỊNH (UTC+7)
// -----------------------------------------------------------------
const VN_OFFSET = 7;

function nowVN() { return new Date(Date.now() + VN_OFFSET * 3_600_000); }

function toDateStringVN() {
    const d = nowVN();
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function formatTimeVN(dateOrMs) {
    const ts = dateOrMs instanceof Date ? dateOrMs.getTime() : Number(dateOrMs);
    const d = new Date(ts + VN_OFFSET * 3_600_000);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    const DD = String(d.getUTCDate()).padStart(2, '0');
    const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const YYYY = d.getUTCFullYear();
    return `${hh}:${mm}:${ss} ${DD}/${MM}/${YYYY}`;
}

// -----------------------------------------------------------------
// 👑 HẰNG SỐ ĐẶC BIỆT
// -----------------------------------------------------------------
const OWNER_ID = '1143387904064888942';  // ID duy nhất có quyền quản lý xu đặc biệt
const MAX_BALANCE = 999_999_999_999;    // Giới hạn xu tối đa (vĩnh viễn cho OWNER)
const HOME_GUILD_ID = '1517068246493429852'; // Server cố định — chỉ cho phép dùng /resetbot tại đây
const SUPPORT_LINK = 'https://discord.gg/cn535DxCn7';

const configPath = path.join(__dirname, 'config.json');
let config = {};

try {
    if (fs.existsSync(configPath)) {
        config = require(configPath);
    } else {
        config = { token: "", clientId: "", guilds: {} };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
} catch (e) {
    console.error("❌ Không thể đọc file config.json, khởi tạo object trống.");
    config = { token: "", clientId: "", guilds: {} };
}

if (!config.guilds) config.guilds = {};

const ticketTimeouts = new Map();
const buttonCooldowns = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

// Nếu Client (là 1 EventEmitter) tự phát ra sự kiện 'error' mà KHÔNG có ai lắng nghe,
// Node.js sẽ throw ngay lập tức (hành vi đặc biệt riêng của sự kiện 'error' trong EventEmitter).
// Gắn 2 listener này để chặn đứng khả năng đó — chỉ log ra console, không crash bot.
client.on('error', (err) => console.error('❌ [Discord Client Error]', err));
client.on('shardError', (err) => console.error('❌ [Discord Shard Error]', err));

// -----------------------------------------------------------------
// 🛡️ BẮT LỖI TOÀN CỤC — QUAN TRỌNG
// Node.js (từ bản 15+) sẽ TỰ THOÁT TOÀN BỘ TIẾN TRÌNH nếu có 1 Promise bị
// reject mà không ai .catch() (unhandledRejection), hoặc 1 lỗi throw ra ngoài
// mọi try/catch (uncaughtException). Thêm 2 handler dưới đây để bot chỉ log
// lỗi ra console và tiếp tục chạy, thay vì sập toàn bộ vì 1 lệnh bị lỗi.
// -----------------------------------------------------------------
process.on('unhandledRejection', (reason) => {
    console.error('❌ [Unhandled Rejection] Có Promise bị lỗi mà không được xử lý:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('❌ [Uncaught Exception] Có lỗi thoát ra ngoài try/catch:', err);
});

function saveConfig() {
    const tempPath = configPath + '.tmp';
    try {
        fs.writeFileSync(tempPath, JSON.stringify(config, null, 2));
        fs.renameSync(tempPath, configPath);
    } catch (e) {
        console.error("❌ Không thể lưu file config.json an toàn:", e);
    }
}

function getGuildConfig(guildId) {
    if (!config.guilds) config.guilds = {}; // Đảm bảo object guilds tồn tại
    
    if (!config.guilds[guildId]) {
        // Tạo cấu hình mặc định nếu server chưa được setup
        config.guilds[guildId] = { 
            isSetupCompleted: false, 
            unverifiedRoleId: "", 
            verifiedRoleId: "", 
            verifyChannelId: "",
            isVerifySetup: false,
            verifyDailyMode: false,
            verifyDailyMembers: {},
            attendance: {}, 
            history: {},
            reactionRoles: {},
            feedbackChannelId: "",
            isFeedbackSetup: false,
            prefix: "mi",
            giveawayChannelId: "",
            isGiveawaySetup: false,
            giveaways: {},
            isVoiceRoomSetup: false,
            voiceRoomCategoryId: "",
            voiceRoomTriggerId: "",
            voiceRoomControlChannelId: "",
            voiceRooms: {},
            isModLogSetup: false,
            modLogChannelId: "",
            modHistory: {},
            verifyMissCount: {},
            verifyReminded: {},
            bannedWordsChannelId: "",
            bannedWords: [],
            unverifyOnMute: false,
            donateChannelId: ""
        };
        saveConfig(); // Lưu ngay vào file config.json
        console.log(`✅ Đã khởi tạo cấu hình mới cho server: ${guildId}`);
    }
    return config.guilds[guildId];
}

function getAdminRoleMention(guild) {
    if (!guild || !guild.roles) return '@everyone';
    
    const adminRoles = guild.roles.cache.filter(role => 
        role.id !== guild.id && 
        role.permissions.has(PermissionFlagsBits.ManageChannels)
    );
    
    if (adminRoles.size === 0) return '@everyone';

    const top3Roles = Array.from(adminRoles.values())
        .sort((a, b) => b.position - a.position)
        .slice(0, 3);

    return top3Roles.map(r => `<@&${r.id}>`).join(', ');
}

// -----------------------------------------------------------------
// ☕ EMBED THÔNG TIN DONATE (gửi vào kênh donate tự động tạo bởi /setup)
// -----------------------------------------------------------------
function buildDonateEmbed() {
    const bankBin = '970436';      // Mã BIN VietQR của Vietcombank
    const accountNo = '9369144188';
    const accountName = 'DAO NGOC QUANG';

    const qrParams = new URLSearchParams();
    qrParams.set('addInfo', 'Ung ho MI BOT');
    qrParams.set('accountName', accountName);
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?${qrParams.toString()}`;

    const embed = new EmbedBuilder()
        .setColor(colors.THEME)
        .setTitle('💖 THÔNG TIN ỦNG HỘ (DONATE)')
        .setDescription(
            `> Mọi sự đóng góp của bạn đều giúp dự án duy trì máy chủ 24/7 tại VibeHost!\n\n` +
            `- **Ngân hàng:** Vietcombank (VCB)\n` +
            `- **Số tài khoản:** \`${accountNo}\`\n` +
            `- **Chủ tài khoản:** \`${accountName}\`\n` +
            `- **Nội dung chuyển khoản:** \`Ung ho MI BOT\`\n\n` +
            `Quét mã QR dưới đây bằng ứng dụng ngân hàng bất kỳ để chuyển khoản nhanh.`
        )
        .setImage(qrUrl)
        .setFooter({ text: 'Mọi khoản ủng hộ đều được dùng để duy trì máy chủ & phát triển bot' })
        .setTimestamp();

    const button = new ButtonBuilder()
        .setLabel('🔗 Tải mã QR gốc')
        .setStyle(ButtonStyle.Link)
        .setUrl(qrUrl);

    const row = new ActionRowBuilder().addComponents(button);

    return { embed, components: [row] };
}

function removeAccentsAndSpaces(str) {
    if (!str) return 'ticket';
    const result = str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    return result || 'ho-tro';
}

// -----------------------------------------------------------------
// 🎭 HỆ THỐNG THÊM VAI TRÒ BẰNG REACTION EMOJI (TÁCH BIỆT VỚI /setup)
// -----------------------------------------------------------------
// Chuẩn hóa input emoji của admin thành "key" duy nhất để lưu vào config:
// - Emoji Unicode (😀): dùng chính ký tự đó làm key
// - Emoji tùy chỉnh server (<:name:id> hoặc <a:name:id>): dùng ID làm key
// Key này khớp với cách discord.js định danh reaction.emoji.id || reaction.emoji.name
function resolveEmojiKey(input) {
    const customMatch = input.match(/^<a?:(\w+):(\d+)>$/);
    if (customMatch) {
        return { key: customMatch[2], display: input, isCustom: true };
    }
    return { key: input, display: input, isCustom: false };
}

// Vẽ lại embed của bảng Reaction Role dựa trên danh sách emoji -> vai trò hiện tại
async function updateReactionRoleEmbed(message, panelData) {
    const lines = Object.values(panelData.roles || {}).map(r => 
        `${r.display} ➜ <@&${r.roleId}>${r.description ? ` — *${r.description}*` : ''}`
    );

    const baseEmbed = message.embeds[0] ? EmbedBuilder.from(message.embeds[0]) : new EmbedBuilder().setColor('#5865F2');
    const headDesc = panelData.baseDescription || '';
    const listText = lines.length > 0 ? lines.join('\n') : '*(Chưa có vai trò nào được gắn)*';

    baseEmbed.setDescription(`${headDesc}${headDesc ? '\n\n' : ''}${listText}`);
    await message.edit({ embeds: [baseEmbed] }).catch(() => null);
}

// -----------------------------------------------------------------
// 📋 HÀM XÂY DỰNG TRANG LỊCH SỬ KỶ LUẬT (PHÂN TRANG /KYLUAT)
// -----------------------------------------------------------------
function buildDisciplinePage(targetUser, gConfig, page = 1, commandAuthorId, filterType = 'all') {
    const record = gConfig.modHistory?.[targetUser.id] || { warnCount: 0, muteCount: 0, kickCount: 0, banCount: 0, historyLog: [] };
    const historyLog = record.historyLog || [];

    const filteredLog = filterType === 'all'
        ? historyLog
        : historyLog.filter(item => item.type === filterType);

    // Sắp xếp vi phạm mới nhất lên đầu
    const sortedLog = [...filteredLog].sort((a, b) => b.timestamp - a.timestamp);

    const itemsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(sortedLog.length / itemsPerPage));
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = sortedLog.slice(startIndex, startIndex + itemsPerPage);

    const typeLabelMap = {
        'warn': '⚠️ Cảnh cáo',
        'mute': '🔇 Mute',
        'kick': '👢 Kick',
        'ban': '🔨 Ban',
        'admin_edit': '⚙️ Điều chỉnh'
    };

    let detailText = '';
    if (pageItems.length === 0) {
        detailText = '*(Không tìm thấy lịch sử vi phạm phù hợp)*';
    } else {
        detailText = pageItems.map((item, idx) => {
            const dateStr = formatTimeVN(item.timestamp);
            const typeStr = typeLabelMap[item.type] || item.type.toUpperCase();
            return `### ${startIndex + idx + 1}. [${dateStr}] ${typeStr}\n> **Lý do:** ${item.reason}\n> **Bởi:** ${item.moderator}`;
        }).join('\n\n');
    }

    const embed = new EmbedBuilder()
        .setColor(colors.THEME)
        .setTitle(`📋 LỊCH SỬ KỶ LUẬT — ${targetUser.username.toUpperCase()}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(
            `## 📜 Lịch sử vi phạm của ${targetUser}\n` +
            `> Tổng số cảnh cáo: **${record.warnCount || 0}**\n\n` +
            `**Tóm tắt số lần vi phạm:**\n` +
            `- ⚠️ Cảnh cáo: \`${record.warnCount || 0}\`\n` +
            `- 🔇 Mute: \`${record.muteCount || 0}\`\n` +
            `- 👢 Kick: \`${record.kickCount || 0}\`\n` +
            `- 🔨 Ban: \`${record.banCount || 0}\`\n\n` +
            `**Chi tiết lịch sử (Trang ${currentPage}/${totalPages}):**\n\n${detailText}`
        )
        .setTimestamp();

    const components = [];

    // Bộ lọc Select Menu
    const filterSelect = new StringSelectMenuBuilder()
        .setCustomId(`kyluat_filter_${targetUser.id}_${currentPage}_${commandAuthorId}`)
        .setPlaceholder('🔍 Chọn loại vi phạm để lọc...')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Xem tất cả').setValue('all').setDefault(filterType === 'all'),
            new StringSelectMenuOptionBuilder().setLabel('Cảnh cáo').setValue('warn').setDefault(filterType === 'warn'),
            new StringSelectMenuOptionBuilder().setLabel('Mute').setValue('mute').setDefault(filterType === 'mute'),
            new StringSelectMenuOptionBuilder().setLabel('Kick').setValue('kick').setDefault(filterType === 'kick'),
            new StringSelectMenuOptionBuilder().setLabel('Ban').setValue('ban').setDefault(filterType === 'ban'),
            new StringSelectMenuOptionBuilder().setLabel('Điều chỉnh Admin').setValue('admin_edit').setDefault(filterType === 'admin_edit')
        );

    components.push(new ActionRowBuilder().addComponents(filterSelect));

    // Nút chuyển trang
    const prevButton = new ButtonBuilder()
        .setCustomId(`kyluat_prev_${targetUser.id}_${currentPage}_${commandAuthorId}_${filterType}`)
        .setLabel('◀️ Trước')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1);

    const nextButton = new ButtonBuilder()
        .setCustomId(`kyluat_next_${targetUser.id}_${currentPage}_${commandAuthorId}_${filterType}`)
        .setLabel('Sau ▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages);

    components.push(new ActionRowBuilder().addComponents(prevButton, nextButton));

    return { embeds: [embed], components };
}

// -----------------------------------------------------------------
// 🎰 HỆ THỐNG LƯU TRỮ GIẢI TRÍ TOÀN CẦU (ĐỒNG BỘ HÓA LIÊN SERVER)
// -----------------------------------------------------------------
const economyPath = path.join(__dirname, 'economy.json');
let economyData = {};

if (fs.existsSync(economyPath)) {
    try {
        economyData = JSON.parse(fs.readFileSync(economyPath, 'utf-8'));
    } catch (e) {
        economyData = {};
    }
}

function saveEconomy() {
    const tempPath = economyPath + '.tmp';
    try {
        fs.writeFileSync(tempPath, JSON.stringify(economyData, null, 2));
        fs.renameSync(tempPath, economyPath);
    } catch (e) {
        console.error("❌ Không thể lưu file economy.json an toàn:", e);
    }
}

// -----------------------------------------------------------------
// 📈 SERVICE TÍNH TOÁN VÀ THĂNG CẤP XP
// -----------------------------------------------------------------
const MAX_LEVEL = 9999;

function checkLevelUp(currentXp, currentLevel) {
    let xp = currentXp;
    let level = currentLevel;
    let leveledUp = false;

    while (level < MAX_LEVEL) {
        const xpNeeded = Math.max(500000, level * 500000);
        if (xp >= xpNeeded) {
            xp -= xpNeeded;
            level++;
            leveledUp = true;
        } else {
            break;
        }
    }
    return { leveledUp, level, remainingXp: xp };
}

function addXp(userId, amount) {
    const user = getUserData(userId);
    if (user.level >= MAX_LEVEL) {
        user.xp = 0;
        saveEconomy();
        return { leveledUp: false, oldLevel: user.level, newLevel: user.level };
    }

    user.xp += amount;
    const oldLevel = user.level;
    const check = checkLevelUp(user.xp, user.level);

    if (check.leveledUp) {
        const levelsGained = check.level - oldLevel;
        user.level = check.level;
        user.xp = check.remainingXp;

        const levelBonus = 5000 * levelsGained;
        if (userId === OWNER_ID) {
            user.balance = MAX_BALANCE;
        } else {
            user.balance += levelBonus;
        }
        saveEconomy();
        return { leveledUp: true, oldLevel, newLevel: user.level, levelsGained, levelBonus };
    }

    saveEconomy();
    return { leveledUp: false, oldLevel, newLevel: user.level };
}

// -----------------------------------------------------------------
// 🔑 HỆ THỐNG GHI NHỚ KÊNH ĐÃ TẠO (PERSISTENCE)
// -----------------------------------------------------------------
const channelsPath = path.join(__dirname, 'created_channels.json');
let createdChannels = [];

if (fs.existsSync(channelsPath)) {
    try {
        createdChannels = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));
    } catch (e) {
        createdChannels = [];
    }
}

function saveCreatedChannels() {
    const tempPath = channelsPath + '.tmp';
    try {
        fs.writeFileSync(tempPath, JSON.stringify(createdChannels, null, 2));
        fs.renameSync(tempPath, channelsPath);
    } catch (e) {
        console.error("❌ Không thể lưu file created_channels.json an toàn:", e);
    }
}

function registerCreatedChannel(channelId, guildId) {
    if (!createdChannels.some(c => c.channelId === channelId)) {
        createdChannels.push({ channelId, guildId });
        saveCreatedChannels();
    }
}

function unregisterCreatedChannel(channelId) {
    createdChannels = createdChannels.filter(c => c.channelId !== channelId);
    saveCreatedChannels();
}

async function syncChannels() {
    console.log("🔄 Bắt đầu đồng bộ hóa và kết nối lại các kênh đã tạo...");
    const activeList = [];

    for (const entry of createdChannels) {
        try {
            const channel = client.channels.cache.get(entry.channelId) || await client.channels.fetch(entry.channelId).catch(() => null);
            if (channel) {
                activeList.push(entry);
                if (channel.isTextBased()) {
                    await channel.send({ content: "🤖 Bot đã khởi động lại và sẵn sàng hỗ trợ!" }).catch(() => null);
                }
            } else {
                console.log(`🧹 Dọn rác DB: Kênh ${entry.channelId} đã bị người dùng xóa thủ công.`);
            }
        } catch (err) {
            console.error(`❌ Lỗi khi đồng bộ kênh ${entry.channelId}:`, err);
        }
    }

    createdChannels = activeList;
    saveCreatedChannels();
    console.log("✅ Đồng bộ hóa kênh hoàn tất!");
}

// -----------------------------------------------------------------
// 🔤 STATE TRÒ CHƠI NỐI TỪ (LƯU TRONG BỘ NHỚ, TÁCH BIỆT MỖI KÊNH)
// Key: channelId → { active, lastWord, lastUserId, usedWords: Set }
// -----------------------------------------------------------------
// Map lưu setInterval ID của các giveaway đang chạy (messageId → intervalId)
const giveawayTimers = new Map();

// -----------------------------------------------------------------
// 🃏 STATE TRÒ CHƠI BLACKJACK (LƯU TRONG BỘ NHỚ, KEY = userId — mỗi người chỉ chơi 1 ván cùng lúc)
// -----------------------------------------------------------------
const blackjackGames = new Map();

function bjCreateDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const s of suits) for (const r of ranks) deck.push({ r, s });
    // Xáo bài kiểu Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function bjDraw(deck) {
    if (deck.length === 0) deck.push(...bjCreateDeck());
    return deck.pop();
}

function bjCardLabel(card) {
    return `\`${card.r}${card.s}\``;
}

function bjHandValue(hand) {
    let total = 0;
    let aces = 0;
    for (const c of hand) {
        if (c.r === 'A') { total += 11; aces++; }
        else if (c.r === 'J' || c.r === 'Q' || c.r === 'K') total += 10;
        else total += parseInt(c.r, 10);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function bjIsBlackjack(hand) {
    return hand.length === 2 && bjHandValue(hand) === 21;
}

function bjBuildEmbed(game, { reveal = false, resultText = null, resultColor = null } = {}) {
    const playerVal = bjHandValue(game.playerHand);
    const dealerVal = bjHandValue(game.dealerHand);
    const playerText = game.playerHand.map(bjCardLabel).join(' ');
    const dealerText = reveal
        ? game.dealerHand.map(bjCardLabel).join(' ')
        : `${bjCardLabel(game.dealerHand[0])} 🂠`;

    const embed = new EmbedBuilder()
        .setColor(resultColor || '#5865F2')
        .setTitle('🃏 Blackjack')
        .addFields(
            { name: `🤖 Bot${reveal ? ` (${dealerVal})` : ''}`, value: dealerText, inline: false },
            { name: `🧑 ${game.username} (${playerVal})`, value: playerText, inline: false },
        )
        .setFooter({ text: `Cược: ${game.totalBet.toLocaleString()} xu${game.doubled ? ' (đã nhân đôi)' : ''}` });
    if (resultText) embed.setDescription(resultText);
    return embed;
}

function bjBuildRow(game) {
    const canDouble = game.playerHand.length === 2 && !game.doubled;
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bj_hit_${game.userId}`).setLabel('🃏 Rút Bài').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`bj_stand_${game.userId}`).setLabel('✋ Dừng').setStyle(ButtonStyle.Secondary),
    );
    if (canDouble) {
        row.addComponents(new ButtonBuilder().setCustomId(`bj_double_${game.userId}`).setLabel('💰 Nhân Đôi Cược').setStyle(ButtonStyle.Success));
    }
    return [row];
}

// Bot rút bài theo luật chuẩn: rút tới khi đạt tối thiểu 17 điểm, dừng ở mọi mức 17
function bjDealerPlay(game) {
    while (bjHandValue(game.dealerHand) < 17) {
        game.dealerHand.push(bjDraw(game.deck));
    }
}

// Kết thúc ván: tính toán kết quả, cộng/trừ xu, sửa tin nhắn, dọn state
async function bjEndGame(game, message, outcomeOverride = null) {
    if (blackjackGames.get(game.userId) !== game) return; // Ván đã kết thúc bởi luồng khác
    if (game.timeoutHandle) clearTimeout(game.timeoutHandle);
    blackjackGames.delete(game.userId);

    const userData = getUserData(game.userId);
    const playerVal = bjHandValue(game.playerHand);
    let outcome = outcomeOverride;

    if (!outcome) {
        bjDealerPlay(game);
        const dealerVal = bjHandValue(game.dealerHand);
        if (dealerVal > 21) outcome = 'win';
        else if (dealerVal > playerVal) outcome = 'lose';
        else if (dealerVal < playerVal) outcome = 'win';
        else outcome = 'push';
    }

    let resultText, resultColor, payout = 0;
    if (outcome === 'blackjack') {
        payout = Math.round(game.totalBet * 2.5);
        resultText = `🎉 **BLACKJACK!** Bạn có 21 điểm ngay từ đầu! +**${(payout - game.totalBet).toLocaleString()} xu** (x1.5)`;
        resultColor = '#57F287';
    } else if (outcome === 'push') {
        payout = game.totalBet;
        resultText = `🤝 **HÒA!** Hoàn lại tiền cược — không lời không lỗ.`;
        resultColor = '#FEE75C';
    } else if (outcome === 'win') {
        payout = game.totalBet * 2;
        resultText = playerVal > 21
            ? `🎉 **THẮNG!** +**${game.totalBet.toLocaleString()} xu**`
            : `🎉 **THẮNG!** Bot quắc/thấp điểm hơn. +**${game.totalBet.toLocaleString()} xu**`;
        resultColor = '#57F287';
    } else { // lose
        payout = 0;
        resultText = playerVal > 21
            ? `💸 **QUẮC (Bust)!** Bạn vượt quá 21 điểm — Mất **-${game.totalBet.toLocaleString()} xu**`
            : `💸 **THUA!** Mất **-${game.totalBet.toLocaleString()} xu**`;
        resultColor = '#ED4245';
    }

    if (payout > 0) {
        userData.balance = game.userId === OWNER_ID ? MAX_BALANCE : userData.balance + payout;
    }
    saveEconomy();
    resultText += `\nSố dư: **${userData.balance.toLocaleString()} xu**`;

    const embed = bjBuildEmbed(game, { reveal: true, resultText, resultColor });
    return message.edit({ embeds: [embed], components: [] }).catch(() => null);
}

// Cập nhật embed đếm ngược giveaway
async function updateGiveawayEmbed(channel, msgId, gData, ended = false) {
    const msg = await channel.messages.fetch(msgId).catch(() => null);
    if (!msg) return;

    const now = Date.now();
    const remaining = gData.endTime - now;
    const participantCount = (gData.participants || []).length;

    let timeLeft = '';
    if (!ended && remaining > 0) {
        const totalSec = Math.floor(remaining / 1000);
        const d = Math.floor(totalSec / 86400);
        const h = Math.floor((totalSec % 86400) / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        timeLeft = [d && `${d} ngày`, h && `${h} giờ`, m && `${m} phút`, `${s} giây`].filter(Boolean).join(' ');
    }

    const embed = new EmbedBuilder()
        .setColor(ended ? '#95A5A6' : '#F1C40F')
        .setTitle(`🎉 ${gData.title}`)
        .setDescription(
            `**🎁 Phần thưởng:** ${gData.prize}\n` +
            `**👥 Số người thắng:** ${gData.winners}\n` +
            `**📅 Kết thúc lúc:** ${formatTimeVN(gData.endTime)}\n\n` +
            (ended
                ? `🏁 **Giveaway đã kết thúc!** Có **${participantCount} người** tham dự.`
                : `⏳ **Thời gian còn lại:** \`${timeLeft}\`\n👥 **Đang tham dự:** ${participantCount} người`)
        )
        .setFooter({ text: ended ? `Kết thúc • Tạo bởi ${gData.createdBy}` : `Bấm 🎉 Tham Gia để tham dự! • Tạo bởi ${gData.createdBy}` })
        .setTimestamp();

    let row;
    if (ended) {
        // Khi kết thúc: hiện nút End (đã kết thúc - disabled) + Reroll + Link hỗ trợ
        row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${msgId}`)
                .setLabel('🏁 Đã kết thúc')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`giveaway_reroll_${msgId}`)
                .setLabel('🎲 Reroll')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setLabel('🌐 Máy Chủ Hỗ Trợ')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/cn535DxCn7')
        );
    } else {
        // Đang chạy: nút Tham Gia + End sớm + Link hỗ trợ
        row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${msgId}`)
                .setLabel(`🎉 Tham Gia (${participantCount})`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`giveaway_end_${msgId}`)
                .setLabel('⏹️ End sớm')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setLabel('🌐 Máy Chủ Hỗ Trợ')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/cn535DxCn7')
        );
    }

    await msg.edit({ embeds: [embed], components: [row] }).catch(() => null);
}

// Bỏ phụ thuộc vào guildId để dữ liệu đồng bộ ở mọi server có bot
function getUserData(userId) {
    if (!economyData[userId]) {
        economyData[userId] = {
            userId: userId,
            xp: 0,
            level: 1,
            balance: userId === OWNER_ID ? MAX_BALANCE : 100,
            lastDaily: ""
        };
        saveEconomy();
    }
    // Đảm bảo OWNER luôn giữ MAX_BALANCE vĩnh viễn
    if (userId === OWNER_ID) {
        economyData[userId].balance = MAX_BALANCE;
    }
    // Đảm bảo OWNER luôn giữ MAX_BALANCE vĩnh viễn
    if (userId === OWNER_ID) {
        economyData[userId].balance = MAX_BALANCE;
    }
    return economyData[userId];
}

// -----------------------------------------------------------------
// 🔐 HÀM ĐÓNG TICKET: XÓA KÊNH TRƯỚC, SAO LƯU VÀ GỬI LOG SAU
// -----------------------------------------------------------------
async function closeAndArchiveTicket(channel, guild, userWhoClosed, gConfig, creatorId) {
    let logChatText = `==== BẢN LƯU TRỮ CHAT TICKET: #${channel.name} ====\n\n`;
    const logFileName = `Log_${channel.id}.txt`;
    const logFilePath = path.join(__dirname, logFileName);
    const channelNameBackup = channel.name; 

    let messageArray = [];
    try {
        const fetchedMessages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
        if (fetchedMessages && fetchedMessages.size > 0) {
            messageArray = Array.from(fetchedMessages.values()).reverse();
        }
    } catch (err) {
        console.error("Lỗi khi đọc tin nhắn trước khi xóa phòng:", err);
    }

    try {
        await channel.delete('Đóng Ticket').catch(err => console.error("❌ Không thể xóa kênh:", err.message));
    } catch (err) {
        console.error("Lỗi khi thực hiện xóa kênh:", err);
    }

    if (ticketTimeouts.has(channel.id)) {
        clearTimeout(ticketTimeouts.get(channel.id));
        ticketTimeouts.delete(channel.id);
    }

    process.nextTick(async () => {
        if (messageArray.length > 0) {
            messageArray.forEach(msg => {
                if (msg.author.bot && msg.embeds.length > 0) return; 
                logChatText += `[${formatTimeVN(msg.createdAt)}] ${msg.author.tag}: ${msg.content}\n`;
            });
        } else {
            logChatText += `(Kênh không có tin nhắn hoặc Bot thiếu quyền đọc lịch sử tin nhắn)\n`;
        }

        fs.writeFileSync(logFilePath, logChatText, 'utf-8');

        try {
            const fileAttachment = new AttachmentBuilder(logFilePath);
            const archiveChan = gConfig.ticketArchiveChannelId ? guild.channels.cache.get(gConfig.ticketArchiveChannelId) : null;
            const nameDisplay = userWhoClosed && userWhoClosed.tag ? userWhoClosed.tag : (typeof userWhoClosed === 'string' ? userWhoClosed : "Hệ thống");

            if (archiveChan) {
                await archiveChan.send({ 
                    content: `📁 **Lưu trữ phòng:** \`#${channelNameBackup}\` (Đã xóa phòng bởi: **${nameDisplay}**)`, 
                    files: [fileAttachment] 
                }).catch(() => null);
            }

            if (creatorId) {
                try {
                    const targetUser = await client.users.fetch(creatorId);
                    if (targetUser) {
                        await targetUser.send({ 
                            content: `📁 **Bản sao lưu lịch sử chat phòng \`#${channelNameBackup}\` từ Server ${guild.name} đã đóng:**\n*(Phòng đã được xóa thành công bởi thành viên: ${nameDisplay})*`, 
                            files: [new AttachmentBuilder(logFilePath)] 
                        }).catch(() => null);
                    }
                } catch (dmError) {
                    console.error(`❌ Không thể gửi DM cho người tạo ticket (ID: ${creatorId}):`, dmError.message);
                }
            }
        } catch (error) {
            console.error("Lỗi trong quá trình gửi log chạy ngầm:", error);
        }

        if (fs.existsSync(logFilePath)) {
            try { fs.unlinkSync(logFilePath); } catch(e){}
        }
    });
}

async function scanAndRescueTickets(guild, gConfig) {
    if (!gConfig.ticketCategoryId) return;
    const category = guild.channels.cache.get(gConfig.ticketCategoryId);
    if (!category) return;

    const ticketChannels = guild.channels.cache.filter(ch => 
        ch.parentId === category.id && 
        ch.type === ChannelType.GuildText &&
        (ch.name.startsWith('🎫') || ch.name.includes('ticket-')) &&
        ch.id !== gConfig.ticketControlChannelId &&
        ch.id !== gConfig.ticketArchiveChannelId
    );
    
    for (const [chId, chan] of ticketChannels) {
        if (ticketTimeouts.has(chan.id)) continue; 

        try {
            const messages = await chan.messages.fetch({ limit: 10 }).catch(() => null);
            if (!messages) continue;
            
            const setupMsg = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);
            if (!setupMsg) {
                const tId = setTimeout(() => closeAndArchiveTicket(chan, guild, "Hệ thống dọn phòng lỗi", gConfig, null), 60000);
                ticketTimeouts.set(chan.id, tId);
                continue;
            }

            const embed = setupMsg.embeds[0];
            const footerText = embed.footer?.text || "";
            const creatorId = footerText.replace('ID Người tạo: ', '').split('|')[0].trim();
            if (!creatorId) continue;

            const desc = embed.description || "";
            
            if (desc.includes('⏳ Đang chờ hỗ trợ') || desc.includes('⚠️ CẢNH BÁO HỆ THỐNG')) {
                console.log(`🔍 [Cứu hộ Ticket] Phát hiện phòng ẩn chờ duyệt: #${chan.name}. Bắt đầu đếm ngoại 5 phút tự hủy.`);
                
                const timeoutId = setTimeout(async () => {
                    try {
                        const checkChan = guild.channels.cache.get(chan.id);
                        if (checkChan) {
                            await checkChan.send({ content: `⏰ **Quá hạn thời gian chờ phục hồi hệ thống!** Kênh tự động hủy bảo mật.` }).catch(() => null);
                            await closeAndArchiveTicket(checkChan, guild, "Hệ thống tự động đóng phòng (Hết hạn cứu hộ Cooldown)", gConfig, creatorId);
                        }
                    } catch (e) {}
                }, 5 * 60 * 1000);

                ticketTimeouts.set(chan.id, timeoutId);
            }
        } catch (err) {
            console.error(`Lỗi khi quét cứu hộ kênh ${chan.name}:`, err);
        }
    }
}

// -----------------------------------------------------------------
// 🧹 HÀM XỬ LÝ: XÓA SẠCH SẼ TOÀN BỘ TIN NHẮN BOT (BAO GỒM BẢNG NÚT CŨ)
// -----------------------------------------------------------------
async function clearBotMessages(channel) {
    if (!channel) return;
    try {
        const fetched = await channel.messages.fetch({ limit: 100 }).catch(() => null);
        if (!fetched) return;
        
        const botMsgs = fetched.filter(m => m.author.id === client.user.id);
        
        for (const [_, msg] of botMsgs) {
            await msg.delete().catch(() => null);
        }
    } catch (e) {
        console.error(`Không thể lọc tin nhắn cũ trong kênh ${channel.name}:`, e.message);
    }
}

// -----------------------------------------------------------------
// 📋 KÊNH NHẬT KÝ QUẢN TRỊ — Kênh riêng chỉ Admin thấy được, ghi lại
// kick/ban/mute, tin nhắn bị sửa/xóa, đổi biệt danh/tên/avatar.
// -----------------------------------------------------------------
async function getOrCreateModLogChannel(guild, gConfig) {
    if (!gConfig.isModLogSetup) return null;

    if (gConfig.modLogChannelId) {
        const existing = guild.channels.cache.get(gConfig.modLogChannelId);
        if (existing) return existing;
    }

    try {
        const chan = await guild.channels.create({
            name: '📋-nhật-ký-quản-trị',
            type: ChannelType.GuildText,
            topic: 'Nhật ký quản trị — chỉ Admin xem được. Tự động ghi kick/ban/mute, tin nhắn sửa/xóa, đổi tên/avatar.',
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
            ]
        });
        gConfig.modLogChannelId = chan.id;
        saveConfig();
        return chan;
    } catch (err) {
        console.error('❌ [ModLog] Không thể tạo kênh nhật ký:', err.message);
        return null;
    }
}

async function sendModLog(guild, gConfig, payload) {
    if (!gConfig.isModLogSetup) return;
    const chan = await getOrCreateModLogChannel(guild, gConfig);
    if (chan) chan.send(payload).catch(() => null);
}

// -----------------------------------------------------------------
// ⏱️ LEO THANG THỜI GIAN MUTE — 1 PHÚT → 7 NGÀY QUA 5 LẦN
// Dùng CHUNG 1 bộ đếm (gConfig.modHistory[id].muteCount) cho cả /mute thủ
// công của Admin lẫn mute tự động (vi phạm từ cấm...). Từ lần thứ 6 trở đi
// giữ nguyên mức tối đa 7 ngày.
// -----------------------------------------------------------------
const MUTE_ESCALATION_MS = [
    60 * 1000,                  // Lần 1: 1 phút
    60 * 60 * 1000,             // Lần 2: 1 giờ
    24 * 60 * 60 * 1000,        // Lần 3: 1 ngày
    3 * 24 * 60 * 60 * 1000,    // Lần 4: 3 ngày
    7 * 24 * 60 * 60 * 1000     // Lần 5 (và các lần sau): 7 ngày
];
const MUTE_ESCALATION_LABEL = ['1 phút', '1 giờ', '1 ngày', '3 ngày', '7 ngày'];

function getEscalatedMuteMs(previousMuteCount) {
    const idx = Math.min(previousMuteCount, MUTE_ESCALATION_MS.length - 1);
    return { ms: MUTE_ESCALATION_MS[idx], stage: idx + 1, label: MUTE_ESCALATION_LABEL[idx] };
}

// -----------------------------------------------------------------
// 🔁 GỠ XÁC THỰC TRƯỚC KHI MUTE
// Admin bật tùy chọn này trong /setup (phần xác thực) để mỗi khi 1 thành
// viên bị mute (thủ công hoặc tự động), bot sẽ thu hồi role Đã Xác Thực và
// cấp lại role Chưa Xác Thực cho họ (bỏ qua nếu mục tiêu là bot).
// -----------------------------------------------------------------
async function unverifyBeforeMute(guild, gConfig, targetMember) {
    if (!gConfig.unverifyOnMute) return;
    if (targetMember.user.bot) return; // trừ bot
    if (!gConfig.verifiedRoleId || !gConfig.unverifiedRoleId) return;

    if (targetMember.roles.cache.has(gConfig.verifiedRoleId)) {
        await targetMember.roles.remove(gConfig.verifiedRoleId).catch(() => null);
    }
    if (!targetMember.roles.cache.has(gConfig.unverifiedRoleId)) {
        await targetMember.roles.add(gConfig.unverifiedRoleId).catch(() => null);
    }
}

// -----------------------------------------------------------------
// 🚫 HỆ THỐNG TỪ CẤM
// Admin gõ trực tiếp vào kênh quản lý (gConfig.bannedWordsChannelId) để
// thêm/xóa từ cấm. Bot dò toàn bộ tin nhắn trong server, xóa + cảnh cáo +
// tự mute (leo thang) khi phát hiện từ cấm.
// -----------------------------------------------------------------
function normalizeForBadWordCheck(str) {
    return (str || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'd')
        .toLowerCase();
}

function findBannedWord(content, gConfig) {
    if (!gConfig.bannedWords || gConfig.bannedWords.length === 0) return null;
    const normContent = normalizeForBadWordCheck(content);
    for (const word of gConfig.bannedWords) {
        const normWord = normalizeForBadWordCheck(word);
        if (normWord && normContent.includes(normWord)) return word;
    }
    return null;
}

// -----------------------------------------------------------------
// ⚖️ LỊCH SỬ KỶ LUẬT + TỰ ĐỘNG LEO THANG
// Cứ mỗi 5 lần Mute -> tự động Kick. Cứ mỗi 5 lần Kick -> tự động Ban.
// -----------------------------------------------------------------
// -----------------------------------------------------------------
// 📢 MÔ TẢ LỖI LEO THANG (Mute/Kick/Ban thất bại do quyền/role bot)
// Dùng chung cho bộ lọc từ cấm tự động và lệnh /canhcao thủ công.
// -----------------------------------------------------------------
function describeEscalationFailures(actionResult, targetTag) {
    const messages = [];
    const muteErr = actionResult?.muteResult?.error;
    const kickErr = actionResult?.muteResult?.kickResult?.error || actionResult?.kickResult?.error;
    const banErr = actionResult?.muteResult?.banResult?.error || actionResult?.kickResult?.banResult?.error || actionResult?.banResult?.error;

    if (muteErr) {
        const reasonText = muteErr === 'not_moderatable'
            ? 'Bot không đủ quyền/role để mute thành viên này (role bot đang thấp hơn hoặc bằng role thành viên, hoặc thiếu quyền "Timeout Members").'
            : `Discord từ chối yêu cầu mute: ${actionResult.muteResult.message || 'lỗi không xác định'}.`;
        messages.push(`⚠️ **Tự động Mute thất bại!** ${targetTag} — ${reasonText}\n👉 Kéo role bot lên **cao hơn** role thành viên này và đảm bảo bot có quyền **Timeout Members**.`);
    }
    if (kickErr) {
        const reasonText = kickErr === 'not_kickable'
            ? 'Bot không đủ quyền/role để kick thành viên này (role bot đang thấp hơn hoặc bằng role thành viên, hoặc thiếu quyền "Kick Members").'
            : kickErr === 'member_not_found'
                ? 'Thành viên có thể đã rời server trước khi bot kịp kick.'
                : `Discord từ chối yêu cầu kick.`;
        messages.push(`⚠️ **Tự động Kick thất bại!** ${targetTag} — ${reasonText}\n👉 Kéo role bot lên **cao hơn** role thành viên này và đảm bảo bot có quyền **Kick Members**.`);
    }
    if (banErr) {
        messages.push(`⚠️ **Tự động Ban thất bại!** ${targetTag} — Bot không đủ quyền/role để ban thành viên này (role bot đang thấp hơn hoặc bằng role thành viên, hoặc thiếu quyền **Ban Members**).`);
    }
    return messages;
}

async function recordModAction(guild, gConfig, targetId, type, reason = 'Không có lý do', executorTag = 'MimiBot (Tự động)') {
    if (!gConfig.modHistory) gConfig.modHistory = {};
    if (!gConfig.modHistory[targetId]) gConfig.modHistory[targetId] = { warnCount: 0, muteCount: 0, kickCount: 0, banCount: 0 };
    const record = gConfig.modHistory[targetId];
    if (record.warnCount === undefined) record.warnCount = 0; // Tương thích ngược với bản ghi cũ chưa có warnCount

    if (!record.historyLog) record.historyLog = [];
    record.historyLog.push({
        type: type,
        reason: reason,
        moderator: executorTag,
        timestamp: Date.now()
    });

    if (type === 'warn') {
        record.warnCount++;
        saveConfig();

        if (record.warnCount % 5 === 0) {
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (member) {
                const muteResult = await applyEscalatedMute(
                    guild, gConfig, member,
                    `${client.user.tag} (Tự động)`,
                    `Tự động Mute — đã bị Cảnh Cáo đủ ${record.warnCount} lần`
                );
                if (muteResult?.embed) {
                    const escalateEmbed = new EmbedBuilder()
                        .setColor('#E67E22')
                        .setTitle('⚖️ Tự Động Mute — Leo Thang Kỷ Luật')
                        .setDescription(`Thành viên đã bị **Cảnh Cáo đủ ${record.warnCount} lần**, hệ thống tự động **Mute** theo quy tắc "cứ 5 lần Cảnh Cáo = 1 lần Mute".`)
                        .addFields({ name: '👤 Thành viên', value: `${member.user.tag} (\`${targetId}\`)` })
                        .setTimestamp();
                    await sendModLog(guild, gConfig, { embeds: [escalateEmbed] });
                }
                return { muteResult };
            }
            console.error(`❌ [AutoWarn] Không thể fetch thành viên ${targetId} để mute (có thể đã rời server).`);
        }
        return null;
    }

    if (type === 'mute') {
        record.muteCount++;
        saveConfig();

        if (record.muteCount % 5 === 0) {
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (!member) {
                console.error(`❌ [AutoKick] Không thể fetch thành viên ${targetId} để kick (có thể đã rời server).`);
                return { kickResult: { error: 'member_not_found' } };
            }
            if (!member.kickable) {
                console.error(`❌ [AutoKick] Không thể kick ${member.user.tag} (${targetId}) — member.kickable = false.`);
                return { kickResult: { error: 'not_kickable' } };
            }

            try {
                await member.kick(`Tự động Kick — đã bị Mute đủ ${record.muteCount} lần`);
            } catch (err) {
                console.error(`❌ [AutoKick] Discord API từ chối kick ${member.user.tag} (${targetId}):`, err.message);
                return { kickResult: { error: 'kick_failed', message: err.message } };
            }

            const escalateEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('⚖️ Tự Động Kick — Leo Thang Kỷ Luật')
                .setDescription(`Thành viên đã bị **Mute đủ ${record.muteCount} lần**, hệ thống tự động **Kick** theo quy tắc "cứ 5 lần Mute = 1 lần Kick".`)
                .addFields({ name: '👤 Thành viên', value: `${member.user.tag} (\`${targetId}\`)` })
                .setTimestamp();
            await sendModLog(guild, gConfig, { embeds: [escalateEmbed] });

            // Tính luôn lần leo thang này là 1 lượt Kick trong lịch sử -> có thể tiếp tục leo thang lên Ban
            const nextResult = await recordModAction(guild, gConfig, targetId, 'kick', `Tự động Kick — đã bị Mute đủ ${record.muteCount} lần`, 'MimiBot (Tự động)');
            return { kickResult: { success: true }, banResult: nextResult?.banResult };
        }
        return null;
    }

    if (type === 'kick') {
        record.kickCount++;
        saveConfig();

        if (record.kickCount % 5 === 0) {
            try {
                await guild.members.ban(targetId, { reason: `Tự động Ban — đã bị Kick đủ ${record.kickCount} lần` });

                const escalateEmbed = new EmbedBuilder()
                    .setColor('#C0392B')
                    .setTitle('⚖️ Tự Động Ban — Leo Thang Kỷ Luật')
                    .setDescription(`Thành viên đã bị **Kick đủ ${record.kickCount} lần**, hệ thống tự động **Ban vĩnh viễn** theo quy tắc "cứ 5 lần Kick = 1 lần Ban".`)
                    .addFields({ name: '👤 Thành viên', value: `<@${targetId}> (\`${targetId}\`)` })
                    .setTimestamp();
                await sendModLog(guild, gConfig, { embeds: [escalateEmbed] });

                const nextResult = await recordModAction(guild, gConfig, targetId, 'ban', `Tự động Ban — đã bị Kick đủ ${record.kickCount} lần`, 'MimiBot (Tự động)');
                return { banResult: { success: true } };
            } catch (err) {
                console.error(`❌ [AutoBan] Không thể tự động Ban ${targetId}:`, err.message);
                return { banResult: { error: 'ban_failed', message: err.message } };
            }
        }
        return null;
    }

    if (type === 'ban') {
        record.banCount++;
        saveConfig();
    }
}

// -----------------------------------------------------------------
// 🔇 THỰC HIỆN MUTE THEO LEO THANG — DÙNG CHUNG CHO /mute (THỦ CÔNG) VÀ
// MUTE TỰ ĐỘNG (VI PHẠM TỪ CẤM...). Cả 2 nguồn đều tính chung 1 bộ đếm
// gConfig.modHistory[id].muteCount, và thời lượng luôn do hệ thống quyết
// định (1 phút → 7 ngày qua 5 lần), không dùng thời lượng tự nhập tay.
// -----------------------------------------------------------------
async function applyEscalatedMute(guild, gConfig, targetMember, executorTag, reason) {
    if (!targetMember || targetMember.user.bot) return null;
    if (!targetMember.moderatable) {
        console.error(`❌ [AutoMute] Không thể mute ${targetMember.user.tag} (${targetMember.id}) — targetMember.moderatable = false. Nguyên nhân thường gặp: (1) Role của BOT đang thấp hơn hoặc ngang role cao nhất của thành viên này trong danh sách Role của server — cần kéo role bot lên CAO HƠN; (2) Bot thiếu quyền "Timeout Members" (Moderate Members); (3) Thành viên này là chủ server (owner) — Discord không cho phép mute owner.`);
        return { error: 'not_moderatable' };
    }

    const previousCount = (gConfig.modHistory && gConfig.modHistory[targetMember.id] && gConfig.modHistory[targetMember.id].muteCount) || 0;
    const { ms, stage, label } = getEscalatedMuteMs(previousCount);

    // Gỡ xác thực trước khi mute (nếu admin đã bật tùy chọn này qua /setup)
    await unverifyBeforeMute(guild, gConfig, targetMember);

    try {
        await targetMember.timeout(ms, reason);
    } catch (err) {
        console.error(`❌ [AutoMute] Discord API từ chối timeout ${targetMember.user.tag} (${targetMember.id}):`, err.message);
        return { error: 'timeout_failed', message: err.message };
    }

    const expireVN = formatTimeVN(Date.now() + ms);
    const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('🔇 Thành Viên Đã Bị Mute (Leo Thang)')
        .addFields(
            { name: '👤 Thành viên', value: `${targetMember.user.tag} (\`${targetMember.id}\`)`, inline: true },
            { name: '🛡️ Thực hiện bởi', value: executorTag, inline: true },
            { name: '📶 Lần mute thứ', value: `${previousCount + 1} (mức leo thang ${stage}/5)`, inline: true },
            { name: '⏱️ Thời gian', value: `**${label}**`, inline: true },
            { name: '🕐 Hết hạn lúc', value: expireVN, inline: true },
            { name: '📋 Lý do', value: reason }
        )
        .setTimestamp();

    await sendModLog(guild, gConfig, { embeds: [embed] });
    const nextResult = await recordModAction(guild, gConfig, targetMember.id, 'mute', reason, executorTag);

    return { ms, stage, label, embed, expireVN, muteNumber: previousCount + 1, kickResult: nextResult?.kickResult, banResult: nextResult?.banResult };
}

// -----------------------------------------------------------------
// 🔄 HÀM GỬI LẠI TOÀN BỘ NÚT BẤM (TICKET / CHẤM CÔNG / XÁC THỰC)
// Idempotent: xóa tin nhắn bot cũ trước, gửi lại mới — dùng trong /resetbot
// -----------------------------------------------------------------
async function rebuildGuildPanels(targetGuild, gCfg) {
    const rebuildLog = [];

    // Helper: tạm thời cho bot quyền SendMessages vào kênh nếu chưa có,
    // gửi tin nhắn, sau đó xóa overwrite tạm (kênh trở lại chế độ chỉ xem)
    async function sendToRestrictedChannel(chan, payload) {
        const botId = client.user.id;
        const existingOw = chan.permissionOverwrites.cache.get(botId);
        const canSend = chan.permissionsFor(targetGuild.members.me)?.has(PermissionFlagsBits.SendMessages);

        if (!canSend) {
            await chan.permissionOverwrites.edit(botId, { SendMessages: true, ViewChannel: true, EmbedLinks: true }).catch(() => null);
        }

        const sent = await chan.send(payload).catch(err => { console.error(`❌ [Rebuild] Không thể gửi vào #${chan.name}:`, err.message); return null; });

        // Khôi phục lại overwrite gốc nếu đã thêm tạm
        if (!canSend) {
            if (existingOw) {
                await chan.permissionOverwrites.edit(botId, existingOw.allow, existingOw.deny).catch(() => null);
            } else {
                await chan.permissionOverwrites.delete(botId).catch(() => null);
            }
        }
        return sent;
    }

    // ── TICKET ──
    const ticketChan = gCfg.ticketControlChannelId ? targetGuild.channels.cache.get(gCfg.ticketControlChannelId) : null;
    if (ticketChan) {
        try {
            await clearBotMessages(ticketChan);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('create_ticket_btn:Default').setLabel('📩 Tạo Ticket').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
            );
            const sent = await sendToRestrictedChannel(ticketChan, {
                embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('📩 Hệ Thống Hỗ Trợ').setDescription('Nhấn vào nút bên dưới để điền Form mở Ticket ẩn.')],
                components: [row]
            });
            rebuildLog.push(sent ? `  🎫 Gửi lại nút Ticket → <#${ticketChan.id}>` : `  ❌ Gửi nút Ticket thất bại`);
        } catch (err) {
            rebuildLog.push(`  ❌ Lỗi Ticket: ${err.message}`);
        }
    } else {
        rebuildLog.push(`  ⚠️ Kênh Ticket không tìm thấy, bỏ qua`);
    }

    // ── CHẤM CÔNG ──
    const attChan = gCfg.attendanceChannelId ? targetGuild.channels.cache.get(gCfg.attendanceChannelId) : null;
    if (attChan) {
        try {
            await clearBotMessages(attChan);
            const attRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('check_in_btn').setLabel('🟢 Check-In').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('check_out_btn').setLabel('🔴 Check-Out').setStyle(ButtonStyle.Danger)
            );
            const sent = await sendToRestrictedChannel(attChan, {
                embeds: [new EmbedBuilder().setColor('#2ECC71').setTitle('🕒 KHU VỰC CHẤM CÔNG TRỰC TUYẾN').setDescription('Vui lòng nhấn nút dưới đây để khai báo giờ bắt đầu làm việc và kết thúc ca.')],
                components: [attRow]
            });
            rebuildLog.push(sent ? `  🕒 Gửi lại nút Chấm Công → <#${attChan.id}>` : `  ❌ Gửi nút Chấm Công thất bại`);
        } catch (err) {
            rebuildLog.push(`  ❌ Lỗi Chấm Công: ${err.message}`);
        }
    } else {
        rebuildLog.push(`  ⚠️ Kênh Chấm Công không tìm thấy, bỏ qua`);
    }

    // ── XÁC THỰC ──
    if (gCfg.isVerifySetup) {
        const verifyChan = gCfg.verifyChannelId ? targetGuild.channels.cache.get(gCfg.verifyChannelId) : null;
        if (verifyChan) {
            try {
                await clearBotMessages(verifyChan);
                const verifyEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🛡️ XÁC THỰC THÀNH VIÊN')
                    .setDescription(gCfg.verifyMessage || 'Chào mừng bạn đến với server! Vui lòng nhấn nút bên dưới để xác thực và mở khóa toàn bộ kênh.')
                    .setThumbnail(targetGuild.iconURL({ dynamic: true, size: 256 }) || null)
                    .setFooter({ text: 'Nhấn nút dưới đây để xác thực bạn không phải là Bot' });
                const verifyRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('verify_btn').setLabel('✅ Xác Thực Ngay').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
                );
                const sent = await sendToRestrictedChannel(verifyChan, { embeds: [verifyEmbed], components: [verifyRow] });
                rebuildLog.push(sent ? `  🛡️ Gửi lại nút Xác Thực → <#${verifyChan.id}>` : `  ❌ Gửi nút Xác Thực thất bại`);
            } catch (err) {
                rebuildLog.push(`  ❌ Lỗi Xác Thực: ${err.message}`);
            }
        } else {
            rebuildLog.push(`  ⚠️ Kênh Xác Thực không tìm thấy (isVerifySetup=true nhưng kênh đã xóa)`);
        }
    }

    // ── GÓP Ý ──
    if (gCfg.isFeedbackSetup) {
        const feedbackChan = gCfg.feedbackChannelId ? targetGuild.channels.cache.get(gCfg.feedbackChannelId) : null;
        if (feedbackChan) {
            try {
                await clearBotMessages(feedbackChan);
                const infoEmbed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('📬 KÊNH GÓP Ý')
                    .setDescription(
                        'Bạn muốn đóng góp ý kiến cho server?\n\n' +
                        '• Dùng `/gopy` và chọn **Góp ý công khai** (hiển thị tên bạn)\n' +
                        '• Hoặc chọn **Góp ý ẩn danh** để ẩn danh tính\n\n' +
                        '> Mọi góp ý đều được ban quản trị đọc và xem xét.'
                    )
                    .setTimestamp();
                const sent = await sendToRestrictedChannel(feedbackChan, { embeds: [infoEmbed] });
                rebuildLog.push(sent ? `  📬 Gửi lại bảng Góp Ý → <#${feedbackChan.id}>` : `  ❌ Gửi bảng Góp Ý thất bại`);
            } catch (err) {
                rebuildLog.push(`  ❌ Lỗi Góp Ý: ${err.message}`);
            }
        } else {
            rebuildLog.push(`  ⚠️ Kênh Góp Ý không tìm thấy (isFeedbackSetup=true nhưng kênh đã xóa)`);
        }
    }

    // ── VOICE ROOM (kênh điều khiển) ──
    if (gCfg.isVoiceRoomSetup) {
        const vrControlChan = gCfg.voiceRoomControlChannelId ? targetGuild.channels.cache.get(gCfg.voiceRoomControlChannelId) : null;
        const vrTriggerChan = gCfg.voiceRoomTriggerId ? targetGuild.channels.cache.get(gCfg.voiceRoomTriggerId) : null;
        if (vrControlChan) {
            try {
                await clearBotMessages(vrControlChan);
                const vrEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🔊 HỆ THỐNG PHÒNG VOICE RIÊNG')
                    .setDescription(
                        `👉 Vào kênh thoại ${vrTriggerChan ? vrTriggerChan : '**➕ Tạo Phòng Voice**'} để **tự động được tạo một phòng voice riêng** mang tên bạn.\n\n` +
                        `⚙️ Sau khi có phòng riêng, hãy quay lại kênh này và bấm nút **"Quản Lý Phòng Của Tôi"** để đổi tên, giới hạn thành viên, khóa/ẩn phòng, kick hoặc chuyển quyền chủ phòng.\n\n` +
                        `🗑️ Phòng sẽ **tự động bị xóa** khi không còn ai ở bên trong.`
                    )
                    .setFooter({ text: 'Voice Room System — Tự động & riêng tư' });
                const vrRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('voiceroom_settings_btn').setLabel('⚙️ Quản Lý Phòng Của Tôi').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
                );
                const sent = await sendToRestrictedChannel(vrControlChan, { embeds: [vrEmbed], components: [vrRow] });
                rebuildLog.push(sent ? `  🔊 Gửi lại bảng Voice Room → <#${vrControlChan.id}>` : `  ❌ Gửi bảng Voice Room thất bại`);
            } catch (err) {
                rebuildLog.push(`  ❌ Lỗi Voice Room: ${err.message}`);
            }
        } else {
            rebuildLog.push(`  ⚠️ Kênh điều khiển Voice Room không tìm thấy (isVoiceRoomSetup=true nhưng kênh đã xóa)`);
        }
    }

    return rebuildLog;
}

// -----------------------------------------------------------------
// 🛡️ HÀM KHỞI TẠO HỆ THỐNG XÁC THỰC (CHẠY KÈM TRONG /setup, IDEMPOTENT)
// -----------------------------------------------------------------
async function setupVerifySystem(guild, gConfig) {
    // Nếu đã setup xác thực từ trước thì giữ nguyên kênh + tin nhắn + role, không đụng vào nữa
    if (gConfig.isVerifySetup && gConfig.verifyChannelId && guild.channels.cache.get(gConfig.verifyChannelId)) {
        return;
    }

    try {
        let unverifiedRole = gConfig.unverifiedRoleId ? guild.roles.cache.get(gConfig.unverifiedRoleId) : null;
        if (!unverifiedRole) {
            unverifiedRole = await guild.roles.create({ name: '🔒 Chưa Xác Thực', color: '#95A5A6', reason: 'Khởi tạo hệ thống xác thực (kèm /setup)' });
        }
        gConfig.unverifiedRoleId = unverifiedRole.id;

        let verifiedRole = gConfig.verifiedRoleId ? guild.roles.cache.get(gConfig.verifiedRoleId) : null;
        if (!verifiedRole) {
            verifiedRole = await guild.roles.create({ name: '✅ Đã Xác Thực', color: '#2ECC71', reason: 'Khởi tạo hệ thống xác thực (kèm /setup)' });
        }
        gConfig.verifiedRoleId = verifiedRole.id;

        let verifyChannel = gConfig.verifyChannelId ? guild.channels.cache.get(gConfig.verifyChannelId) : null;
        if (!verifyChannel) {
            verifyChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('xác-thực'));
        }
        if (!verifyChannel) {
            verifyChannel = await guild.channels.create({
                name: '✅-xác-thực',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: unverifiedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
                    { id: verifiedRole.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });
        } else {
            await verifyChannel.permissionOverwrites.edit(unverifiedRole.id, { ViewChannel: true, SendMessages: false }).catch(() => null);
            await verifyChannel.permissionOverwrites.edit(verifiedRole.id, { ViewChannel: false }).catch(() => null);
            await verifyChannel.permissionOverwrites.edit(guild.id, { ViewChannel: false }).catch(() => null);
        }
        gConfig.verifyChannelId = verifyChannel.id;

        // 🔒 Khóa toàn bộ các kênh/danh mục còn lại khỏi tầm nhìn của role chưa xác thực
        const lockPromises = [];
        guild.channels.cache.forEach(ch => {
            if (ch.id === verifyChannel.id) return;
            if (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildVoice && ch.type !== ChannelType.GuildCategory) return;
            lockPromises.push(ch.permissionOverwrites.edit(unverifiedRole.id, { ViewChannel: false }).catch(() => null));
        });
        await Promise.all(lockPromises);

        if (!gConfig.verifyMessage) {
            gConfig.verifyMessage = 'Chào mừng bạn đến với server! Vui lòng nhấn nút bên dưới để xác thực và mở khóa toàn bộ kênh.';
        }

        // Chỉ gửi tin nhắn nút xác thực 1 lần duy nhất (không xóa/gửi lại khi /setup chạy lần sau)
        await clearBotMessages(verifyChannel);
        const verifyEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛡️ XÁC THỰC THÀNH VIÊN')
            .setDescription(gConfig.verifyMessage)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || null)
            .setFooter({ text: 'Nhấn nút dưới đây để xác thực bạn không phải là Bot' });
        const verifyRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_btn').setLabel('✅ Xác Thực Ngay').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
        );
        await verifyChannel.send({ embeds: [verifyEmbed], components: [verifyRow] });

        gConfig.isVerifySetup = true;
        saveConfig();
        console.log(`✅ [Verify] Đã khởi tạo hệ thống xác thực cho server: ${guild.id}`);
    } catch (err) {
        console.error(`❌ Lỗi khi khởi tạo hệ thống xác thực cho server ${guild.id}:`, err);
    }
}

// -----------------------------------------------------------------
// 🛡️ GÁN VAI TRÒ XÁC THỰC CHO TOÀN BỘ THÀNH VIÊN HIỆN CÓ CỦA SERVER
// Chạy mỗi khi BẬT /setupverify (cả chế độ Bật thường lẫn 24 Giờ), vì
// setupVerifySystem() chỉ tạo role + khóa kênh, KHÔNG tự gán role cho
// thành viên đã có mặt từ trước (guildMemberAdd chỉ xử lý người MỚI vào).
// Không có role Chưa Xác Thực → thành viên cũ vẫn nhìn thấy mọi kênh
// như bình thường, khiến hệ thống xác thực coi như không có tác dụng.
// -----------------------------------------------------------------
async function assignVerifyRolesToAllMembers(guild, gConfig) {
    const stats = { unverifiedAssigned: 0, verifiedBotAssigned: 0, alreadyVerified: 0, failed: 0 };
    if (!gConfig.unverifiedRoleId && !gConfig.verifiedRoleId) return stats;

    try {
        await guild.members.fetch(); // Đảm bảo cache có đầy đủ thành viên (kể cả người chưa tương tác gần đây)
    } catch (err) {
        console.error(`❌ Không thể fetch toàn bộ thành viên server ${guild.id}:`, err.message);
    }

    for (const member of guild.members.cache.values()) {
        if (member.id === client.user.id) continue; // Bỏ qua chính bot

        try {
            if (member.user.bot) {
                // Bot khác trong server → cấp thẳng role Đã Xác Thực, bỏ qua bước xác thực thủ công
                if (gConfig.verifiedRoleId && !member.roles.cache.has(gConfig.verifiedRoleId)) {
                    await member.roles.add(gConfig.verifiedRoleId);
                    stats.verifiedBotAssigned++;
                }
                continue;
            }

            // Thành viên đã có sẵn role Đã Xác Thực thì giữ nguyên, không gán Chưa Xác Thực đè lên
            if (gConfig.verifiedRoleId && member.roles.cache.has(gConfig.verifiedRoleId)) {
                stats.alreadyVerified++;
                continue;
            }

            if (gConfig.unverifiedRoleId && !member.roles.cache.has(gConfig.unverifiedRoleId)) {
                await member.roles.add(gConfig.unverifiedRoleId);
                stats.unverifiedAssigned++;
            }
        } catch (err) {
            stats.failed++;
            console.error(`❌ Không thể gán vai trò xác thực cho ${member.user.tag}:`, err.message);
        }
    }

    return stats;
}

// -----------------------------------------------------------------
// ⏰ HÀM BÁO CÁO TUẦN CHẤM CÔNG GỐC
// -----------------------------------------------------------------
function checkWeeklyReset() {
    setInterval(async () => {
        const now = nowVN(); // Múi giờ Việt Nam
        if (now.getUTCDay() === 1 && now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
            for (const guildId in config.guilds) {
                const gConfig = config.guilds[guildId];
                if (!gConfig.history || Object.keys(gConfig.history).length === 0) continue;

                let reportChannel = gConfig.weeklyReportChannelId ? await client.channels.fetch(gConfig.weeklyReportChannelId).catch(() => null) : null;
                if (!reportChannel) continue;

                let reportText = `==== TỔNG HỢP GIỜ CÔNG TUẦN QUA ====\n\n`;
                for (const userId in gConfig.history) {
                    const userObj = gConfig.history[userId];
                    let total = 0; userObj.records.forEach(r => total += r.hours);
                    reportText += `👤 ${userObj.username}: ${total.toFixed(2)} GIỜ\n`;
                }

                const filePath = path.join(__dirname, `BaoCao_${guildId}.txt`);
                fs.writeFileSync(filePath, reportText, 'utf-8');
                await reportChannel.send({ content: '📊 Báo cáo chấm công tuần mới:', files: [new AttachmentBuilder(filePath)] }).catch(() => {});
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                gConfig.history = {};
            }
            saveConfig();
        }
    }, 60000);
}

// -----------------------------------------------------------------
// 🔄 JOB RESET XÁC THỰC 24 GIỜ (00:00 MÚI GIỜ VIỆT NAM UTC+7)
// Kiểm tra mỗi 30 giây, kích hoạt đúng khi giờ VN = 00:00
// -----------------------------------------------------------------
function startDailyVerifyReset() {
    let lastResetDate = null;

    setInterval(async () => {
        // Lấy giờ hiện tại theo múi giờ Việt Nam (UTC+7)
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const hhVN = nowVN.getUTCHours();
        const mmVN = nowVN.getUTCMinutes();
        const dateKeyVN = `${nowVN.getUTCFullYear()}-${nowVN.getUTCMonth()}-${nowVN.getUTCDate()}`;

        // Kích hoạt đúng 00:00 VN và chỉ 1 lần mỗi ngày
        if (hhVN !== 0 || mmVN !== 0) return;
        if (lastResetDate === dateKeyVN) return;
        lastResetDate = dateKeyVN;

        console.log(`🔄 [Verify 24h] Bắt đầu reset xác thực 00:00 VN — ${new Date().toISOString()}`);
        const dayOfWeekVN = nowVN.getUTCDay(); // 0=CN, 1=Thứ 2, ... 6=Thứ 7

        for (const guildId in config.guilds) {
            const gConfig = config.guilds[guildId];
            if (!gConfig.isVerifySetup || !gConfig.verifyDailyMode) continue;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;

            const verifiedRole = gConfig.verifiedRoleId ? guild.roles.cache.get(gConfig.verifiedRoleId) : null;
            const unverifiedRole = gConfig.unverifiedRoleId ? guild.roles.cache.get(gConfig.unverifiedRoleId) : null;
            if (!verifiedRole || !unverifiedRole) continue;

            const verifiedTodayIds = new Set(Object.keys(gConfig.verifyDailyMembers || {}));

            // ── Reset về Chưa Xác Thực cho những ai đã xác thực hôm qua ──
            let resetCount = 0;
            for (const memberId of verifiedTodayIds) {
                const member = await guild.members.fetch(memberId).catch(() => null);
                if (!member) { delete gConfig.verifyDailyMembers[memberId]; continue; }

                await member.roles.remove(verifiedRole).catch(() => null);
                await member.roles.add(unverifiedRole).catch(() => null);
                delete gConfig.verifyDailyMembers[memberId];
                resetCount++;
            }

            // ── Đầu tuần (Thứ 2, 00:00 VN) -> reset bộ đếm bỏ lỡ của tuần mới ──
            if (dayOfWeekVN === 1) {
                gConfig.verifyMissCount = {};
                gConfig.verifyReminded = {};
            }
            if (!gConfig.verifyMissCount) gConfig.verifyMissCount = {};
            if (!gConfig.verifyReminded) gConfig.verifyReminded = {};

            // ── Đếm số ngày bỏ lỡ xác thực trong tuần, nhắc nhở nếu bỏ lỡ QUÁ 5 ngày/tuần ──
            const subjectMembers = new Set([
                ...unverifiedRole.members.keys(),
                ...verifiedRole.members.keys()
            ]);
            for (const memberId of subjectMembers) {
                if (verifiedTodayIds.has(memberId)) continue; // Hôm nay đã xác thực -> không tính là bỏ lỡ

                gConfig.verifyMissCount[memberId] = (gConfig.verifyMissCount[memberId] || 0) + 1;

                // Nhắc nhở tổng cộng 6 lần (1 lần gốc + 5 lần thêm), mỗi lần bỏ lỡ thêm 1 ngày
                // sau khi đã vượt mốc 5 ngày sẽ nhắc thêm 1 lần, cho đến khi đủ 6 lần thì dừng.
                const remindedCount = gConfig.verifyReminded[memberId] || 0;
                const MAX_REMINDS = 6;
                if (gConfig.verifyMissCount[memberId] > 5 && remindedCount < MAX_REMINDS) {
                    gConfig.verifyReminded[memberId] = remindedCount + 1;
                    const member = guild.members.cache.get(memberId) || await guild.members.fetch(memberId).catch(() => null);
                    if (member) {
                        const verifyChan = gConfig.verifyChannelId ? guild.channels.cache.get(gConfig.verifyChannelId) : null;
                        const lanThu = remindedCount + 1;
                        member.send({
                            content: `🔔 Chào **${member.displayName}**, bạn đã **bỏ lỡ xác thực hằng ngày hơn 5 ngày** trong tuần này tại **${guild.name}**. (Nhắc nhở lần ${lanThu}/${MAX_REMINDS})` +
                                (verifyChan ? `\n👉 Vào ${verifyChan} để xác thực lại${lanThu >= MAX_REMINDS ? '' : ' và không bị nhắc nữa nhé'}!` : '')
                        }).catch(() => null);
                    }
                }
            }

            saveConfig();
            console.log(`✅ [Verify 24h] Server ${guildId}: Đã reset ${resetCount} thành viên về Chưa Xác Thực.`);
        }
    }, 30000); // Kiểm tra mỗi 30 giây để đảm bảo không bỏ lỡ mốc 00:00
}

// -----------------------------------------------------------------
// 🎵 HỆ THỐNG NGHE NHẠC YOUTUBE (TÌM KIẾM + ĐIỀU KHIỂN BẰNG NÚT BẤM)
// Yêu cầu cài thêm: npm install @discordjs/voice yt-dlp-exec libsodium-wrappers
// Yêu cầu cài thêm trên máy chủ (không phải qua npm): yt-dlp
//   - Windows/macOS/Linux: xem hướng dẫn cài tại https://github.com/yt-dlp/yt-dlp#installation
//   - yt-dlp cần được cập nhật thường xuyên (yt-dlp -U) vì YouTube liên tục thay đổi cơ chế chống bot.
// GHI CHÚ: đã bỏ @distube/ytdl-core + yt-search vì @distube/ytdl-core đã ngừng bảo trì (archived 16/08/2025)
// và bị YouTube chặn hoàn toàn (lỗi "Sign in to confirm you're not a bot" / HTTP 410) — đây là lý do
// bot cũ "tìm được nhạc nhưng không phát được". yt-dlp-exec gọi trực tiếp binary yt-dlp (được cộng đồng
// vá lỗi rất nhanh mỗi khi YouTube đổi thuật toán) nên ổn định hơn nhiều cho cả việc tìm kiếm lẫn phát nhạc.
// -----------------------------------------------------------------
let voiceLib = null;
try { voiceLib = require('@discordjs/voice'); } catch {
    console.warn('⚠️ [Music] Chưa cài @discordjs/voice — tính năng nghe nhạc sẽ không hoạt động.');
}
let ytDlpExec = null;
try { ytDlpExec = require('yt-dlp-exec'); } catch {
    console.warn('⚠️ [Music] Chưa cài yt-dlp-exec — tính năng nghe nhạc sẽ không hoạt động.');
}

// -----------------------------------------------------------------
// 🔧 TỰ ĐỘNG TẢI BINARY yt-dlp NẾU BỊ THIẾU
// Nguyên nhân lỗi "spawn .../yt-dlp-exec/bin/yt-dlp ENOENT": gói yt-dlp-exec cài qua npm
// THÀNH CÔNG nhưng script postinstall (tải file thực thi yt-dlp) đã KHÔNG chạy được —
// rất hay gặp trên các host chạy panel dạng Pterodactyl vì họ tắt postinstall khi npm install.
// Đoạn dưới đây tự tải file yt-dlp trực tiếp từ GitHub Releases và đặt đúng chỗ mà
// yt-dlp-exec đang tìm, không cần quyền truy cập shell/console của host.
// -----------------------------------------------------------------
const YTDLP_BIN_DIR = path.join(__dirname, 'node_modules', 'yt-dlp-exec', 'bin');
const YTDLP_BIN_NAME = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const YTDLP_BIN_PATH = path.join(YTDLP_BIN_DIR, YTDLP_BIN_NAME);

function getYtDlpDownloadUrl() {
    const base = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/';
    if (process.platform === 'win32') return base + 'yt-dlp.exe';
    if (process.platform === 'darwin') return base + 'yt-dlp_macos';
    return base + 'yt-dlp'; // Linux — đúng với hầu hết các host chạy bot 24/7
}

function downloadFileFollowRedirect(url, destPath, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'MI-BOT' } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                if (redirectsLeft <= 0) return reject(new Error('Quá nhiều lần chuyển hướng khi tải yt-dlp.'));
                return downloadFileFollowRedirect(res.headers.location, destPath, redirectsLeft - 1).then(resolve, reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`Tải yt-dlp thất bại — máy chủ trả về HTTP ${res.statusCode}.`));
            }
            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => fileStream.close(() => resolve()));
            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

// Dùng chung 1 Promise để nhiều lệnh /play gọi cùng lúc không tải trùng nhiều bản
let ytDlpEnsurePromise = null;
async function ensureYtDlpBinary() {
    if (!ytDlpExec) return false; // Chưa cài gói yt-dlp-exec qua npm thì chịu, không tự cài được
    if (fs.existsSync(YTDLP_BIN_PATH)) return true;
    if (ytDlpEnsurePromise) return ytDlpEnsurePromise;

    ytDlpEnsurePromise = (async () => {
        try {
            console.log('⚠️ [Music] Không tìm thấy binary yt-dlp tại ' + YTDLP_BIN_PATH + ' — đang tự động tải về...');
            fs.mkdirSync(YTDLP_BIN_DIR, { recursive: true });
            const tmpPath = YTDLP_BIN_PATH + '.download';
            await downloadFileFollowRedirect(getYtDlpDownloadUrl(), tmpPath);
            fs.renameSync(tmpPath, YTDLP_BIN_PATH);
            if (process.platform !== 'win32') fs.chmodSync(YTDLP_BIN_PATH, 0o755);
            console.log('✅ [Music] Đã tải xong binary yt-dlp — tính năng nghe nhạc đã sẵn sàng!');
            return true;
        } catch (err) {
            console.error('❌ [Music] Không thể tự động tải yt-dlp:', err.message);
            console.error('   → Nếu host chặn kết nối ra ngoài lúc chạy, hãy tự tải file tại https://github.com/yt-dlp/yt-dlp/releases/latest và đặt vào: ' + YTDLP_BIN_PATH);
            return false;
        } finally {
            ytDlpEnsurePromise = null;
        }
    })();

    return ytDlpEnsurePromise;
}

// Thử tải ngay lúc khởi động (không chặn phần còn lại của bot nếu mạng chậm/lỗi)
ensureYtDlpBinary().catch(() => null);

// guildId -> { connection, player, voiceChannelId, textChannel, queue, current, currentResource, currentProcess, volume, loop, nowPlayingMessage, idleTimeout }
const musicQueues = new Map();

function isMusicReady() { return !!(voiceLib && ytDlpExec); }

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return 'Trực tiếp/??:??';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

const YT_URL_REGEX = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\//i;

// Số kết quả sẽ lấy khi tìm bằng từ khóa — lấy nhiều hơn 1 để có cái mà "lược bỏ"
// nếu vài kết quả đầu bị riêng tư / giới hạn độ tuổi / không khả dụng.
const SEARCH_CANDIDATE_COUNT = 5;

// Kiểm tra 1 video có bị chặn phát (riêng tư / giới hạn độ tuổi / cần đăng nhập / không khả dụng) hay không.
function isBlockedVideo(info) {
    if (!info) return true;
    const availability = String(info.availability || '').toLowerCase();
    if (['private', 'needs_auth', 'subscriber_only', 'premium_only'].includes(availability)) return true;
    if (Number(info.age_limit) > 0) return true; // Giới hạn độ tuổi (thường là 18+)
    return false;
}

function toTrack(info) {
    return {
        title: info.title || 'Không rõ tiêu đề',
        url: info.webpage_url || info.original_url || `https://www.youtube.com/watch?v=${info.id}`,
        duration: Number(info.duration) || 0,
        thumbnail: info.thumbnail || (Array.isArray(info.thumbnails) ? info.thumbnails[info.thumbnails.length - 1]?.url : null) || null
    };
}

// Tìm bài hát bằng yt-dlp: nếu là link YouTube hợp lệ thì lấy info trực tiếp,
// ngược lại nhờ yt-dlp tìm kiếm trên YouTube (ytsearchN:) rồi tự động BỎ QUA những
// kết quả riêng tư / giới hạn độ tuổi / cần đăng nhập, chỉ trả về kết quả đầu tiên phát được.
async function searchYoutube(query) {
    const isDirectUrl = YT_URL_REGEX.test(query.trim());

    // Trường hợp dán thẳng link YouTube: kiểm tra luôn, báo lỗi rõ ràng nếu link đó bị chặn.
    if (isDirectUrl) {
        const info = await ytDlpExec(query.trim(), {
            dumpSingleJson: true,
            noPlaylist: true,
            skipDownload: true,
            noWarnings: true,
            noCheckCertificates: true,
            preferFreeFormats: true
        });
        if (!info || (!info.id && !info.webpage_url)) return null;
        if (isBlockedVideo(info)) {
            const err = new Error('Video này đang ở chế độ riêng tư hoặc bị giới hạn độ tuổi, bot không thể phát.');
            err.code = 'RESTRICTED_VIDEO';
            throw err;
        }
        return toTrack(info);
    }

    // Trường hợp tìm bằng từ khóa: lấy nhiều kết quả rồi lọc bỏ video riêng tư/giới hạn tuổi/không khả dụng.
    const raw = await ytDlpExec(`ytsearch${SEARCH_CANDIDATE_COUNT}:${query}`, {
        dumpSingleJson: true,
        noPlaylist: true,
        skipDownload: true,
        noWarnings: true,
        noCheckCertificates: true,
        preferFreeFormats: true,
        ignoreErrors: true // 1 video lỗi/không trích xuất được trong danh sách sẽ không làm hỏng cả kết quả tìm kiếm
    });

    const entries = raw?.entries ? raw.entries : (raw ? [raw] : []);
    for (const info of entries) {
        if (!info || (!info.id && !info.webpage_url)) continue;
        if (isBlockedVideo(info)) continue; // ⛔ Bỏ qua — riêng tư / giới hạn độ tuổi / cần đăng nhập
        return toTrack(info);
    }

    return null; // Không còn kết quả nào phát được (toàn bộ đều bị chặn hoặc không tìm thấy)
}

function buildMusicEmbed(mq) {
    const track = mq.current;
    const currentSecs = mq.currentResource ? Math.floor(mq.currentResource.playbackDuration / 1000) : 0;
    const totalSecs = track.duration || 0;
    const progressStr = `\`${formatDuration(currentSecs)}\` ${generateProgressBar(currentSecs, totalSecs)} \`${formatDuration(totalSecs)}\``;

    return new EmbedBuilder()
        .setColor(colors.THEME)
        .setTitle('🎵 Đang phát')
        .setDescription(`### **[${track.title}](${track.url})**\n\n${progressStr}`)
        .addFields(
            { name: '🔊 Âm lượng', value: `${Math.round(mq.volume * 100)}%`, inline: true },
            { name: '🔁 Lặp lại', value: mq.loop === 'track' ? 'Bài hiện tại' : mq.loop === 'queue' ? 'Cả hàng đợi' : 'Tắt', inline: true },
            { name: '📜 Hàng đợi', value: mq.queue.length > 0 ? `${mq.queue.length} bài tiếp theo` : 'Trống', inline: true }
        )
        .setThumbnail(track.thumbnail || null)
        .setFooter({ text: `Yêu cầu bởi ${track.requestedBy}` })
        .setTimestamp();
}

function buildMusicRows(mq) {
    const isPaused = mq.player.state.status === voiceLib.AudioPlayerStatus.Paused;
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('music_pauseresume').setLabel(isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('music_skip').setLabel('⏭️ Bỏ qua').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_stop').setLabel('⏹️ Dừng & Thoát').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('music_queue').setLabel('📃 Hàng đợi').setStyle(ButtonStyle.Secondary)
        )
    ];
}

// Menu chọn 1 bài để xoá khỏi hàng đợi (tối đa 25 bài do giới hạn của Discord Select Menu).
// Dùng chung cho /queue và nút "📜 Hàng đợi". Trả về [] nếu hàng đợi trống (không có gì để xoá).
function buildQueueRemoveRow(mq) {
    if (!mq.queue || mq.queue.length === 0) return [];
    const options = mq.queue.slice(0, 25).map((t, i) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(`${i + 1}. ${t.title}`.slice(0, 100))
            .setDescription(formatDuration(t.duration))
            .setValue(String(i))
    );
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('music_queue_remove_select')
        .setPlaceholder('🗑️ Chọn 1 bài để xoá khỏi hàng đợi...')
        .addOptions(options);
    return [new ActionRowBuilder().addComponents(selectMenu)];
}

// Dừng tiến trình yt-dlp con hiện tại (nếu có) để tránh rò rỉ tiến trình khi skip/stop/rời kênh
function killCurrentProcess(mq) {
    if (mq?.currentProcess && !mq.currentProcess.killed) {
        try { mq.currentProcess.kill('SIGKILL'); } catch { /* đã thoát rồi thì bỏ qua */ }
    }
    mq.currentProcess = null;
}

// Phát bài tiếp theo trong hàng đợi (tự động gọi khi player Idle hoặc khi bắt đầu /play)
async function playNextTrack(guildId) {
    const mq = musicQueues.get(guildId);
    if (!mq) return;

    killCurrentProcess(mq);

    if (mq.loop === 'track' && mq.current) mq.queue.unshift(mq.current);
    else if (mq.loop === 'queue' && mq.current) mq.queue.push(mq.current);

    const next = mq.queue.shift();

    // Vô hiệu hóa nút bấm ở tin nhắn "Đang phát" cũ trước khi chuyển bài / dừng
    if (mq.nowPlayingMessage) {
        mq.nowPlayingMessage.edit({ components: [] }).catch(() => null);
    }

    if (!next) {
        mq.current = null;
        mq.currentResource = null;
        if (mq.textChannel) {
            mq.nowPlayingMessage = await mq.textChannel.send({ content: '⏹️ Hàng đợi đã hết — bot sẽ rời kênh thoại sau 2 phút nếu không có bài mới.' }).catch(() => null);
        }
        mq.idleTimeout = setTimeout(() => {
            const m = musicQueues.get(guildId);
            if (m && !m.current && m.queue.length === 0) {
                m.connection.destroy();
                musicQueues.delete(guildId);
            }
        }, 120000);
        return;
    }

    if (mq.idleTimeout) { clearTimeout(mq.idleTimeout); mq.idleTimeout = null; }
    mq.current = next;

    try {
        // Gọi yt-dlp dưới dạng tiến trình con, xuất thẳng audio (webm/opus) ra stdout,
        // discord.js/voice sẽ tự demux Opus từ webm mà KHÔNG cần cài thêm ffmpeg riêng.
        const ytdlProcess = ytDlpExec.exec(next.url, {
            output: '-',
            format: 'bestaudio[acodec=opus]/bestaudio',
            noPlaylist: true,
            noWarnings: true,
            noCheckCertificates: true,
            quiet: true,
            limitRate: '500K'
        }, { stdio: ['ignore', 'pipe', 'pipe'] });

        let stderrBuffer = '';
        ytdlProcess.stderr?.on('data', (chunk) => {
            stderrBuffer += chunk.toString();
            if (stderrBuffer.length > 4000) stderrBuffer = stderrBuffer.slice(-4000); // tránh phình bộ nhớ
        });

        // Bắt lỗi khi tiến trình yt-dlp thoát bất thường (đây là lỗi BẤT ĐỒNG BỘ,
        // không được try/catch phía trên bắt được — phải lắng nghe riêng như thế này)
        ytdlProcess.catch((err) => {
            if (mq.current !== next) return; // đã chuyển bài khác, bỏ qua lỗi cũ
            console.error(`❌ [Music] yt-dlp lỗi khi phát "${next.title}" ở server ${guildId}:`, stderrBuffer || err.message);
            if (mq.textChannel) {
                const shortErr = (stderrBuffer.split('\n').filter(Boolean).pop() || err.message || 'Không rõ lỗi').slice(0, 300);
                mq.textChannel.send(`❌ Không thể phát **${next.title}**: \`${shortErr}\`\nTự động chuyển bài kế tiếp.`).catch(() => null);
            }
            // Dừng hẳn resource lỗi -> AudioPlayer chuyển sang Idle -> listener Idle tự gọi playNextTrack
            // (đây là cách CHỦ ĐỘNG chuyển bài, tránh trường hợp resource lỗi bị "treo" không tự chuyển)
            mq.player.stop();
        });

        mq.currentProcess = ytdlProcess;

        const resource = voiceLib.createAudioResource(ytdlProcess.stdout, { inputType: voiceLib.StreamType.WebmOpus, inlineVolume: true });
        resource.volume.setVolume(mq.volume);
        mq.currentResource = resource;
        mq.player.play(resource);

        const newEmbed = buildMusicEmbed(mq);
        const newComponents = buildMusicRows(mq);
        let edited = false;

        if (mq.nowPlayingMessage) {
            try {
                const updated = await mq.nowPlayingMessage.edit({ embeds: [newEmbed], components: newComponents }).catch(() => null);
                if (updated) edited = true;
            } catch (e) {
                // Ignore
            }
        }

        if (!edited) {
            mq.nowPlayingMessage = await mq.textChannel.send({ embeds: [newEmbed], components: newComponents }).catch(() => null);
        }
    } catch (err) {
        console.error(`❌ [Music] Lỗi phát nhạc ở server ${guildId}:`, err.message);
        if (mq.textChannel) mq.textChannel.send(`❌ Lỗi khi phát **${next.title}**: ${err.message}\nTự động bỏ qua bài này.`).catch(() => null);
        return playNextTrack(guildId);
    }
}

// Lấy music queue hiện có của server, hoặc tạo kết nối voice mới nếu chưa có.
// Dùng chung cho cả lệnh slash (/play) và lệnh prefix (miplay) để tránh lặp code.
// Trả về { mq } nếu thành công, hoặc { error } nếu thất bại (kèm nội dung lỗi để gửi cho user).
async function getOrCreateMusicQueue(guild, voiceChannel, textChannel) {
    let mq = musicQueues.get(guild.id);
    if (mq && mq.connection && mq.connection.state.status !== voiceLib.VoiceConnectionStatus.Destroyed) {
        // Bot đang phát nhạc ở MỘT kênh thoại khác với kênh của người vừa dùng lệnh
        if (mq.voiceChannelId !== voiceChannel.id) {
            const oldChannel = guild.channels.cache.get(mq.voiceChannelId);
            const stillHasListeners = oldChannel && oldChannel.members.filter(m => !m.user.bot).size > 0;

            if (stillHasListeners) {
                // Vẫn còn người đang nghe ở kênh cũ -> không thể tự ý chuyển kênh, báo rõ cho người dùng
                return { error: `❌ Bot đang phát nhạc ở kênh thoại ${oldChannel} — vui lòng vào kênh đó để thêm bài hát vào hàng đợi.` };
            }

            // Kênh cũ không còn ai nghe -> tự động chuyển bot sang kênh thoại mới rồi tiếp tục hàng đợi
            voiceLib.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true
            });
            mq.voiceChannelId = voiceChannel.id;
            if (mq.textChannel) mq.textChannel.send(`🔀 Đã chuyển sang kênh thoại ${voiceChannel} theo yêu cầu mới.`).catch(() => null);
        }
        mq.textChannel = textChannel;
        return { mq };
    }

    const connection = voiceLib.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    const player = voiceLib.createAudioPlayer({ behaviors: { noSubscriber: voiceLib.NoSubscriberBehavior.Pause } });
    connection.subscribe(player);

    mq = {
        connection, player,
        voiceChannelId: voiceChannel.id,
        textChannel,
        queue: [], current: null, currentResource: null, currentProcess: null,
        volume: 0.5, loop: 'off',
        nowPlayingMessage: null, idleTimeout: null
    };
    musicQueues.set(guild.id, mq);

    player.on(voiceLib.AudioPlayerStatus.Idle, () => playNextTrack(guild.id));
    player.on('error', (err) => {
        console.error(`❌ [Music] Player error ở server ${guild.id}:`, err.message);
        if (mq.textChannel && mq.current) {
            mq.textChannel.send(`❌ Lỗi phát nhạc với **${mq.current.title}**: ${err.message}\nTự động chuyển bài kế tiếp.`).catch(() => null);
        }
        playNextTrack(guild.id);
    });
    connection.on(voiceLib.VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                voiceLib.entersState(connection, voiceLib.VoiceConnectionStatus.Signalling, 5000),
                voiceLib.entersState(connection, voiceLib.VoiceConnectionStatus.Connecting, 5000),
            ]);
        } catch {
            connection.destroy();
            musicQueues.delete(guild.id);
        }
    });

    try {
        await voiceLib.entersState(connection, voiceLib.VoiceConnectionStatus.Ready, 15000);
    } catch (err) {
        connection.destroy();
        musicQueues.delete(guild.id);
        return { error: '❌ Không thể kết nối vào kênh thoại (quá thời gian chờ).' };
    }

    return { mq };
}


client.on('voiceStateUpdate', (oldState) => {
    const guildId = oldState.guild.id;
    const mq = musicQueues.get(guildId);
    if (!mq) return;
    const vc = oldState.guild.channels.cache.get(mq.voiceChannelId);
    if (!vc) return;
    const humanMembers = vc.members.filter(m => !m.user.bot);
    if (humanMembers.size === 0) {
        if (mq.idleTimeout) clearTimeout(mq.idleTimeout);
        killCurrentProcess(mq);
        mq.player.stop();
        mq.connection.destroy();
        musicQueues.delete(guildId);
        if (mq.textChannel) mq.textChannel.send('👋 Đã rời kênh thoại do không còn ai nghe nhạc.').catch(() => null);
    }
});

// -----------------------------------------------------------------
// 🔊 HỆ THỐNG VOICE ROOM TỰ ĐỘNG (Join-to-Create)
// - Vào kênh "trigger" → tự tạo phòng riêng mang tên mình rồi đẩy vào đó
// - Phòng riêng tự xóa khi không còn ai bên trong
// -----------------------------------------------------------------
function cleanupEmptyVoiceRoom(guild, gConfig, voiceChannel) {
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return;
    const humanMembers = voiceChannel.members.filter(m => !m.user.bot);
    if (humanMembers.size > 0) return;
    voiceChannel.delete().catch(() => null);
    if (gConfig.voiceRooms && gConfig.voiceRooms[voiceChannel.id]) {
        delete gConfig.voiceRooms[voiceChannel.id];
        saveConfig();
    }
}

client.on('channelDelete', (channel) => {
    unregisterCreatedChannel(channel.id);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        const guild = newState.guild || oldState.guild;
        const gConfig = getGuildConfig(guild.id);
        if (!gConfig.voiceRooms) gConfig.voiceRooms = {};

        // 1) Người dùng vào kênh kích hoạt → Tạo phòng riêng và đẩy họ vào
        if (gConfig.isVoiceRoomSetup && newState.channelId && newState.channelId === gConfig.voiceRoomTriggerId) {
            const member = newState.member;
            if (!member || member.user.bot) return;

            const category = gConfig.voiceRoomCategoryId ? guild.channels.cache.get(gConfig.voiceRoomCategoryId) : null;
            const roomName = `🔊 Phòng của ${member.displayName}`.slice(0, 100);

            const newRoom = await guild.channels.create({
                name: roomName,
                type: ChannelType.GuildVoice,
                parent: category ? category.id : undefined,
                userLimit: 5,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel
                        ]
                    }
                ]
            }).catch(() => null);

            if (!newRoom) return;

            gConfig.voiceRooms[newRoom.id] = member.id;
            saveConfig();
            registerCreatedChannel(newRoom.id, guild.id);

            const moved = await member.voice.setChannel(newRoom).catch(() => null);
            if (!moved) {
                delete gConfig.voiceRooms[newRoom.id];
                saveConfig();
                await newRoom.delete().catch(() => null);
            }
            return;
        }

        // 2) Người dùng rời khỏi 1 phòng riêng → Xóa phòng nếu đã trống
        if (oldState.channelId && oldState.channelId !== gConfig.voiceRoomTriggerId) {
            const oldChannel = oldState.channel || guild.channels.cache.get(oldState.channelId);
            if (!oldChannel || oldChannel.type !== ChannelType.GuildVoice) return;
            if (!gConfig.voiceRoomCategoryId || oldChannel.parentId !== gConfig.voiceRoomCategoryId) return;
            if (!(oldChannel.id in gConfig.voiceRooms)) return; // Không phải phòng riêng do hệ thống tạo
            cleanupEmptyVoiceRoom(guild, gConfig, oldChannel);
        }
    } catch (err) {
        console.error('❌ [VoiceRoom] Lỗi xử lý voiceStateUpdate:', err);
    }
});

// -----------------------------------------------------------------
// 🚀 ĐỒNG BỘ LỆNH SLASH COMMANDS
// -----------------------------------------------------------------
client.once('ready', async () => {
    console.log(`🤖 Bot ${client.user.tag} đã Online thành công!`);
    await syncChannels();


    const activities = [
        { name: 'Danh Sách Lương', type: 0 }, 
        { name: 'Danh Sách Nhân Sự', type: 2 }, 
        { name: 'Danh Sách Chấm Công', type: 3 }  
    ];
    let activityIndex = 0;

    client.user.setActivity(activities[activityIndex].name, { type: activities[activityIndex].type });
    setInterval(() => {
        activityIndex = (activityIndex + 1) % activities.length;
        client.user.setActivity(activities[activityIndex].name, { type: activities[activityIndex].type });
    }, 15000);

    const commands = [
        new SlashCommandBuilder()
            .setName('configwelcome')
            .setDescription('Thiết lập cố định kênh hiển thị lời chào (Khóa tính năng tự động của setup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addChannelOption(option => 
                option.setName('kênh_welcome')
                .setDescription('Chọn kênh Welcome thủ công')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('setwelcome')
            .setDescription('Chỉnh sửa nội dung và hình ảnh của tin nhắn chào mừng')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(option => option.setName('tin_nhắn_ngoài').setDescription('Sửa chữ phía trên khung Embed'))
            .addStringOption(option => option.setName('nội_dung_chính').setDescription('Sửa phần mô tả chính (Dùng \\n để xuống dòng, "xóa" để ẩn)'))
            .addStringOption(option => option.setName('ảnh_nhỏ_phải').setDescription('Dán link ảnh nhỏ, gõ "xóa" để về mặc định logo server'))
            .addStringOption(option => option.setName('ảnh_lớn_dưới').setDescription('Dán link ảnh lớn, gõ "xóa" để ẩn ảnh')),

        new SlashCommandBuilder()
            .setName('resetwelcome')
            .setDescription('Xóa kênh tùy chỉnh đã ghim và đưa cấu hình lời chào về mặc định ban đầu')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Tự động khởi tạo hoặc sử dụng lại các kênh để làm mới nút bấm')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        new SlashCommandBuilder()
            .setName('donate')
            .setDescription('Xem thông tin donate ủng hộ duy trì bot và mã QR chuyển khoản'),

        new SlashCommandBuilder()
            .setName('resetsetup')
            .setDescription('Xóa các bảng nút bấm cũ để chuẩn bị làm mới hệ thống')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        new SlashCommandBuilder()
            .setName('configticket')
            .setDescription('Custom tin nhắn chào mừng hiển thị bên trong phòng Ticket ẩn')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(option => option.setName('nội_dung').setDescription('Nội dung lời nhắn mới (Dùng \\n để xuống dòng)').setRequired(true)),

        new SlashCommandBuilder()
            .setName('sendticket')
            .setDescription('Gửi bảng tạo Ticket hỗ trợ tùy biến nâng cao')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addChannelOption(option => option.setName('kênh_gửi').setDescription('Kênh hiển thị bảng Ticket').addChannelTypes(ChannelType.GuildText))
            .addChannelOption(option => option.setName('danh_mục_ticket').setDescription('Danh mục chứa các phòng ẩn').addChannelTypes(ChannelType.GuildCategory))
            .addStringOption(option => option.setName('tiêu_đề').setDescription('Tiêu đề của bảng Ticket'))
            .addStringOption(option => option.setName('nội_dung').setDescription('Nội dung mô tả'))
            .addStringOption(option => option.setName('chữ_nút_bấm').setDescription('Thay đổi chữ trên nút mở Ticket chính'))
            .addStringOption(option => option.setName('nút_phụ_tạo_ticket').setDescription('Nhập tên hiển thị cho nút phụ tạo Ticket thứ hai'))
            .addStringOption(option => option.setName('tên_nút_gắn_link').setDescription('Nhập tên hiển thị cho nút liên kết ngoài'))
            .addStringOption(option => option.setName('đường_dẫn_nút_gắn_link').setDescription('Đường dẫn URL của trang web')),

        new SlashCommandBuilder()
            .setName('setupverify')
            .setDescription('Chủ động Bật/Tắt hệ thống xác thực (Tách biệt hoàn toàn khỏi /setup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(option => 
                option.setName('trạng_thái')
                .setDescription('Chọn Bật, Tắt hoặc chế độ Xác Thực 24 Giờ')
                .setRequired(true)
                .addChoices(
                    { name: '✅ Bật', value: 'on' },
                    { name: '🔌 Tắt', value: 'off' },
                    { name: '⏰ Xác Thực 24 Giờ (reset lúc 00:00 VN)', value: '24h' }
                )
            )
            .addBooleanOption(option =>
                option.setName('gỡ_xác_thực_khi_mute')
                .setDescription('Khi mute 1 người (trừ bot), tự động gỡ role Đã Xác Thực và trả về Chưa Xác Thực')
            ),

        new SlashCommandBuilder()
            .setName('resetverify')
            .setDescription('(Tùy chọn) Tắt và xóa riêng cấu hình hệ thống xác thực, không ảnh hưởng phần khác')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

        new SlashCommandBuilder()
            .setName('reactionrole-create')
            .setDescription('Tạo bảng chọn vai trò bằng Reaction Emoji (Tính năng riêng, không ảnh hưởng /setup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
            .addChannelOption(option => 
                option.setName('kênh')
                .setDescription('Kênh hiển thị bảng chọn vai trò')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
            .addStringOption(option => option.setName('tiêu_đề').setDescription('Tiêu đề bảng chọn vai trò').setRequired(true))
            .addStringOption(option => option.setName('nội_dung').setDescription('Mô tả hướng dẫn phía trên (Dùng \\n để xuống dòng)')),

        new SlashCommandBuilder()
            .setName('reactionrole-add')
            .setDescription('Gắn 1 Emoji vào 1 Vai trò trên bảng Reaction Role đã tạo')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
            .addStringOption(option => option.setName('id_tin_nhắn').setDescription('ID tin nhắn của bảng chọn vai trò').setRequired(true))
            .addStringOption(option => option.setName('emoji').setDescription('Emoji dùng để thả (VD: 🎮 hoặc emoji server <:tên:id>)').setRequired(true))
            .addRoleOption(option => option.setName('vai_trò').setDescription('Vai trò sẽ được cấp khi thả Emoji này').setRequired(true))
            .addStringOption(option => option.setName('mô_tả').setDescription('Mô tả ngắn cho vai trò này (hiện trong bảng)')),

        new SlashCommandBuilder()
            .setName('reactionrole-remove')
            .setDescription('Gỡ 1 Emoji khỏi bảng chọn vai trò (Không xóa cả bảng)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
            .addStringOption(option => option.setName('id_tin_nhắn').setDescription('ID tin nhắn của bảng chọn vai trò').setRequired(true))
            .addStringOption(option => option.setName('emoji').setDescription('Emoji cần gỡ khỏi bảng').setRequired(true)),

        new SlashCommandBuilder()
            .setName('reactionrole-reset')
            .setDescription('Xóa toàn bộ bảng + dữ liệu Reaction Role (Không ảnh hưởng /setup, /resetsetup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

        new SlashCommandBuilder()
            .setName('setupfeedback')
            .setDescription('Thiết lập kênh góp ý (Tách biệt /setup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addStringOption(o => o.setName('trạng_thái').setDescription('Bật hoặc Tắt hệ thống góp ý').setRequired(true)
                .addChoices({ name: '✅ Bật', value: 'on' }, { name: '🔌 Tắt', value: 'off' })),

        new SlashCommandBuilder()
            .setName('gopy')
            .setDescription('Gửi góp ý về kênh góp ý của server')
            .addStringOption(o => o.setName('loại').setDescription('Chọn loại góp ý').setRequired(true)
                .addChoices(
                    { name: '📢 Góp ý công khai (hiển thị tên bạn)', value: 'public' },
                    { name: '🔒 Góp ý ẩn danh (ẩn danh tính)', value: 'anonymous' }
                ))
            .addStringOption(o => o.setName('nội_dung').setDescription('Nội dung góp ý của bạn').setRequired(true).setMaxLength(1000)),

        new SlashCommandBuilder()
            .setName('invite')
            .setDescription('Tạo link mời vĩnh viễn cho server này')
            .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),

        new SlashCommandBuilder()
            .setName('setupgiveaway')
            .setDescription('Tạo phòng Giveaway (Tách biệt /setup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addStringOption(o => o.setName('trạng_thái').setDescription('Bật hoặc Tắt').setRequired(true)
                .addChoices({ name: '✅ Bật', value: 'on' }, { name: '🔌 Tắt', value: 'off' })),

        new SlashCommandBuilder()
            .setName('giveawaycreate')
            .setDescription('Tạo Giveaway mới trong kênh Giveaway')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName('tiêu_đề').setDescription('Tiêu đề Giveaway').setRequired(true))
            .addStringOption(o => o.setName('phần_thưởng').setDescription('Mô tả phần thưởng').setRequired(true))
            .addIntegerOption(o => o.setName('thời_gian').setDescription('Thời gian diễn ra').setRequired(true).setMinValue(1))
            .addStringOption(o => o.setName('đơn_vị').setDescription('Đơn vị thời gian').setRequired(true)
                .addChoices(
                    { name: 'Phút', value: 'minutes' },
                    { name: 'Giờ', value: 'hours' },
                    { name: 'Ngày', value: 'days' }
                ))
            .addIntegerOption(o => o.setName('số_người_thắng').setDescription('Số người thắng (mặc định: 1)').setMinValue(1).setMaxValue(20)),

        new SlashCommandBuilder()
            .setName('setupvoiceroom')
            .setDescription('Tạo hệ thống phòng Voice riêng tự động (Tách biệt /setup)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addStringOption(o => o.setName('trạng_thái').setDescription('Bật hoặc Tắt hệ thống Voice Room').setRequired(true)
                .addChoices({ name: '✅ Bật', value: 'on' }, { name: '🔌 Tắt', value: 'off' })),

        new SlashCommandBuilder()
            .setName('resetbot')
            .setDescription('[Owner Only] Quét toàn bộ server, dọn config, đồng bộ kênh, nhắc server chưa setup')
            .setDefaultMemberPermissions('0'),

        new SlashCommandBuilder()
            .setName('resetgame')
            .setDescription('[Owner Only] Khởi động lại toàn bộ trạng thái các trò chơi đang chạy')
            .setDefaultMemberPermissions('0'),

        new SlashCommandBuilder()
            .setName('serverlist')
            .setDescription('[Owner Only] Xem toàn bộ server bot đang tham gia kèm link mời')
            .setDefaultMemberPermissions('0'),

        new SlashCommandBuilder()
            .setName('broadcast')
            .setDescription('[Owner Only] Gửi thông báo tới tất cả server bot đang tham gia')
            .setDefaultMemberPermissions('0')
            .addStringOption(o => o.setName('noi_dung').setDescription('Nội dung thông báo').setRequired(true).setMaxLength(3000))
            .addStringOption(o => o.setName('tieu_de').setDescription('Tiêu đề thông báo (mặc định: 📢 Thông Báo Từ MI BOT)').setRequired(false).setMaxLength(200)),

        new SlashCommandBuilder()
            .setName('setprefix')
            .setDescription('Thay đổi tiền tố lệnh prefix cho server này (mặc định: mi)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName('prefix').setDescription('Tiền tố mới (VD: m, bot, sv — không dấu cách)').setRequired(true).setMaxLength(5)),

        new SlashCommandBuilder()
            .setName('resetbalance')
            .setDescription('Quản lý xu (Chỉ Owner)')
            .setDefaultMemberPermissions('0')  // Ẩn hoàn toàn với mọi người trừ OWNER tự dùng
            .addStringOption(o => o.setName('action').setDescription('Chọn hành động').setRequired(true)
                .addChoices(
                    { name: '➕ add — Thêm xu cho bản thân', value: 'add' },
                    { name: '💯 max — Đặt xu bản thân về mức tối đa', value: 'max' },
                    { name: '👤 resetuser — Reset xu 1 người cụ thể về 0', value: 'resetuser' },
                    { name: '🌐 resetall — Xóa xu toàn bộ người dùng (trừ Owner)', value: 'resetall' }
                ))
            .addIntegerOption(o => o.setName('amount').setDescription('Số xu cần thêm (dùng với action=add)').setMinValue(1))
            .addUserOption(o => o.setName('người_dùng').setDescription('Tag người cần reset xu (dùng với action=resetuser)')),

        new SlashCommandBuilder()
            .setName('avatar')
            .setDescription('Xem ảnh đại diện của bản thân hoặc người dùng khác')
            .addUserOption(o => o.setName('người_dùng').setDescription('Thành viên muốn xem (mặc định: bản thân)'))
            .addStringOption(o => o.setName('loại').setDescription('Loại ảnh (mặc định: profile toàn cầu)')
                .addChoices(
                    { name: '🌐 Ảnh Profile (toàn cầu)', value: 'global' },
                    { name: '🏠 Ảnh tại máy chủ này', value: 'server' }
                )),

        new SlashCommandBuilder()
            .setName('addemoji')
            .setDescription('Thêm emoji từ server khác vào server này')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
            .addStringOption(o => o.setName('emoji').setDescription('Paste emoji tùy chỉnh (<:tên:id> hoặc <a:tên:id>)').setRequired(true))
            .addStringOption(o => o.setName('tên').setDescription('Tên emoji trong server này (mặc định: tên gốc)')),

        new SlashCommandBuilder()
            .setName('sendembed')
            .setDescription('Tạo và gửi tin nhắn Embed với nút bấm tùy chỉnh')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .addChannelOption(o => o.setName('kênh').setDescription('Kênh gửi embed').addChannelTypes(ChannelType.GuildText).setRequired(true))
            .addStringOption(o => o.setName('tiêu_đề').setDescription('Tiêu đề embed').setRequired(true))
            .addStringOption(o => o.setName('nội_dung').setDescription('Nội dung embed (\\n để xuống dòng)').setRequired(true))
            .addStringOption(o => o.setName('màu').setDescription('Màu HEX (VD: #FF0000 — mặc định: #5865F2)'))
            .addStringOption(o => o.setName('ảnh_nhỏ').setDescription('URL ảnh thumbnail góc phải'))
            .addStringOption(o => o.setName('ảnh_lớn').setDescription('URL ảnh banner phía dưới'))
            .addStringOption(o => o.setName('footer').setDescription('Chữ footer'))
            .addStringOption(o => o.setName('nút1_tên').setDescription('Tên nút link 1'))
            .addStringOption(o => o.setName('nút1_link').setDescription('URL nút link 1'))
            .addStringOption(o => o.setName('nút2_tên').setDescription('Tên nút link 2'))
            .addStringOption(o => o.setName('nút2_link').setDescription('URL nút link 2'))
            .addStringOption(o => o.setName('nút3_tên').setDescription('Tên nút link 3'))
            .addStringOption(o => o.setName('nút3_link').setDescription('URL nút link 3')),

        new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Xóa một số lượng tin nhắn gần nhất trong kênh hiện tại')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .addIntegerOption(o => o.setName('số_lượng').setDescription('Số tin nhắn cần xóa (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick một thành viên khỏi server')
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
            .addUserOption(o => o.setName('thành_viên').setDescription('Thành viên cần kick').setRequired(true))
            .addStringOption(o => o.setName('lý_do').setDescription('Lý do kick (tùy chọn)')),

        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban một thành viên khỏi server')
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
            .addUserOption(o => o.setName('thành_viên').setDescription('Thành viên cần ban').setRequired(true))
            .addStringOption(o => o.setName('lý_do').setDescription('Lý do ban (tùy chọn)'))
            .addIntegerOption(o => o.setName('xóa_tin_nhắn').setDescription('Xóa tin nhắn trong N ngày gần đây (0-7, mặc định 0)').setMinValue(0).setMaxValue(7)),

        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Mute thành viên — thời gian tự động leo thang (1 phút → 7 ngày qua 5 lần)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addUserOption(o => o.setName('thành_viên').setDescription('Thành viên cần mute').setRequired(true))
            .addStringOption(o => o.setName('lý_do').setDescription('Lý do mute (tùy chọn)')),

        new SlashCommandBuilder()
            .setName('canhcao')
            .setDescription('Cảnh cáo thủ công — đủ 5 lần cảnh cáo (kể cả tự động) sẽ tự động Mute')
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addUserOption(o => o.setName('thành_viên').setDescription('Thành viên cần cảnh cáo').setRequired(true))
            .addStringOption(o => o.setName('lý_do').setDescription('Lý do cảnh cáo (tùy chọn)')),

        new SlashCommandBuilder()
            .setName('kyluat')
            .setDescription('Xem lịch sử vi phạm kỷ luật của bản thân hoặc thành viên khác')
            .addUserOption(o => o.setName('thành_viên').setDescription('Thành viên cần xem (bỏ trống để tự kiểm tra)').setRequired(false))
            .addStringOption(o => o.setName('loại').setDescription('Loại số đếm muốn chỉnh (Admin Only)')
                .addChoices(
                    { name: 'Cảnh cáo', value: 'warnCount' },
                    { name: 'Mute', value: 'muteCount' },
                    { name: 'Kick', value: 'kickCount' },
                    { name: 'Ban', value: 'banCount' }
                ))
            .addIntegerOption(o => o.setName('giá_trị').setDescription('Giá trị mới muốn đặt cho loại số đếm ở trên (Admin Only)').setMinValue(0)),

        new SlashCommandBuilder()
            .setName('setupmodlog')
            .setDescription('Bật/Tắt kênh nhật ký quản trị riêng cho Admin (kick/ban/mute, sửa/xóa tin nhắn, đổi tên/avatar)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addStringOption(o => o.setName('trạng_thái').setDescription('Bật hoặc Tắt hệ thống nhật ký').setRequired(true)
                .addChoices({ name: '✅ Bật', value: 'on' }, { name: '🔌 Tắt', value: 'off' })),

        new SlashCommandBuilder()
            .setName('play')
            .setDescription('Phát nhạc từ YouTube — tìm theo tên bài hát hoặc dán link')
            .addStringOption(o => o.setName('từ_khóa').setDescription('Tên bài hát hoặc link YouTube').setRequired(true)),

        new SlashCommandBuilder()
            .setName('queue')
            .setDescription('Xem danh sách hàng đợi nhạc hiện tại của server'),

        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Xem bảng hướng dẫn sử dụng tất cả các tính năng của bot')
    ];

    const botId = config.clientId || client.user.id;
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        await rest.put(Routes.applicationCommands(botId), { body: commands });
    } catch (error) {
        console.error('❌ Lỗi đồng bộ lệnh:', error);
    }

    // ── Quét & dọn config của các server bot không còn tham gia (bị kick/rời khi bot offline) ──
    let removedGuildCount = 0;
    for (const guildId in config.guilds) {
        if (!client.guilds.cache.has(guildId)) {
            delete config.guilds[guildId];
            removedGuildCount++;
            console.log(`🗑️ Đã xóa config server \`${guildId}\` (bot không còn ở server này).`);
        }
    }
    if (removedGuildCount > 0) saveConfig();

    client.guilds.cache.forEach(guild => {
        if (config.guilds && config.guilds[guild.id]) {
            scanAndRescueTickets(guild, config.guilds[guild.id]);

            const gConfig = config.guilds[guild.id];
            if (gConfig.voiceRooms) {
                Object.keys(gConfig.voiceRooms).forEach(channelId => {
                    const vc = guild.channels.cache.get(channelId);
                    if (!vc) { delete gConfig.voiceRooms[channelId]; return; }
                    cleanupEmptyVoiceRoom(guild, gConfig, vc);
                });
                saveConfig();
            }
        }
    });

    checkWeeklyReset();
    startDailyVerifyReset();

    // Khôi phục timer đếm ngược cho các giveaway còn đang chạy sau khi bot restart
    for (const guildId in config.guilds) {
        const gCfg = config.guilds[guildId];
        if (!gCfg.isGiveawaySetup || !gCfg.giveawayChannelId || !gCfg.giveaways) continue;
        const giveChan = client.channels.cache.get(gCfg.giveawayChannelId);
        if (!giveChan) continue;

        for (const [msgId, g] of Object.entries(gCfg.giveaways)) {
            if (g.ended) continue;
            if (Date.now() >= g.endTime) {
                g.ended = true; saveConfig();
                await updateGiveawayEmbed(giveChan, msgId, g, true);
                const parts = g.participants || [];
                if (parts.length === 0) {
                    giveChan.send({ content: `🎉 **Giveaway "${g.title}" đã kết thúc!**\n😔 Không có ai tham gia.` }).catch(() => null);
                } else {
                    const winnerIds = [...parts].sort(() => Math.random() - 0.5).slice(0, Math.min(g.winners, parts.length));
                    giveChan.send({ content: `🎉 **Giveaway "${g.title}" đã kết thúc!**\n🏆 Người thắng: ${winnerIds.map(id => `<@${id}>`).join(', ')}\n🎁 Phần thưởng: **${g.prize}**\n\nChúc mừng! 🎊` }).catch(() => null);
                }
                continue;
            }

            const intervalId = setInterval(async () => {
                const fresh = gCfg.giveaways?.[msgId];
                if (!fresh || fresh.ended) { clearInterval(intervalId); giveawayTimers.delete(msgId); return; }
                if (Date.now() >= fresh.endTime) {
                    clearInterval(intervalId); giveawayTimers.delete(msgId);
                    fresh.ended = true; saveConfig();
                    await updateGiveawayEmbed(giveChan, msgId, fresh, true);
                    const parts = fresh.participants || [];
                    if (parts.length === 0) {
                        giveChan.send({ content: `🎉 **Giveaway "${fresh.title}" đã kết thúc!**\n😔 Không có ai tham gia.` }).catch(() => null);
                    } else {
                        const winnerIds = [...parts].sort(() => Math.random() - 0.5).slice(0, Math.min(fresh.winners, parts.length));
                        giveChan.send({ content: `🎉 **Giveaway "${fresh.title}" đã kết thúc!**\n🏆 Người thắng: ${winnerIds.map(id => `<@${id}>`).join(', ')}\n🎁 Phần thưởng: **${fresh.prize}**\n\nChúc mừng! 🎊` }).catch(() => null);
                    }
                } else {
                    await updateGiveawayEmbed(giveChan, msgId, fresh, false);
                }
            }, 30_000);
            giveawayTimers.set(msgId, intervalId);
        }
    }
});

// -----------------------------------------------------------------
// 👋 HỆ THỐNG XỬ LÝ LỜI CHÀO (WELCOME) KHI THÀNH VIÊN VÀO SERVER
// -----------------------------------------------------------------
// -----------------------------------------------------------------
// 🆕 TỰ ĐỘNG KHÓA KÊNH MỚI TẠO SAU KHI ĐÃ SETUP XÁC THỰC
// -----------------------------------------------------------------
client.on('channelCreate', async (channel) => {
    const guild = channel.guild; if (!guild) return;
    const gConfig = getGuildConfig(guild.id);
    if (!gConfig.isVerifySetup || !gConfig.unverifiedRoleId) return;
    if (channel.id === gConfig.verifyChannelId) return;
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildCategory) return;

    channel.permissionOverwrites.edit(gConfig.unverifiedRoleId, { ViewChannel: false }).catch(err => {
        console.error(`❌ Không thể tự khóa kênh mới "${channel.name}" với role Chưa Xác Thực:`, err.message);
    });
});

// -----------------------------------------------------------------
// 🎉 LỜI CẢM ƠN KHI BOT ĐƯỢC THÊM VÀO MÁY CHỦ MỚI
// -----------------------------------------------------------------
client.on('guildCreate', async (guild) => {
    try {
        const me = guild.members.me;
        const targetChannel = (guild.systemChannel && me && guild.systemChannel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages))
            ? guild.systemChannel
            : guild.channels.cache.find(c => c.type === ChannelType.GuildText && me &&
                c.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages) && c.permissionsFor(me)?.has(PermissionFlagsBits.ViewChannel));

        const thanksEmbed = new EmbedBuilder()
            .setColor('#F5B942')
            .setTitle('🎉 Cảm ơn vì đã thêm MI BOT!')
            .setDescription(
                `Xin chào **${guild.name}**! Mình là **MI BOT** — trợ lý đa năng cho server của bạn 🤖\n\n` +
                `👉 Gõ \`/setup\` để khởi tạo nhanh các hệ thống cơ bản (Welcome, Ticket, Chấm công).\n` +
                `👉 Gõ \`/help\` để xem toàn bộ tính năng và lệnh có sẵn.\n\n` +
                `Cảm ơn bạn đã tin tưởng MI BOT! 💛`
            )
            .setFooter({ text: 'MI BOT — Một bot, toàn bộ server' })
            .setTimestamp();

        if (targetChannel) await targetChannel.send({ embeds: [thanksEmbed] }).catch(() => null);

        // Gửi thêm cho chủ server qua DM (không chặn nếu họ tắt DM từ thành viên lạ)
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner) owner.send({ embeds: [thanksEmbed] }).catch(() => null);
    } catch (err) {
        console.error('❌ [GuildCreate] Lỗi gửi lời cảm ơn:', err.message);
    }
});

// -----------------------------------------------------------------
// 📋 NHẬT KÝ: TIN NHẮN BỊ SỬA
// -----------------------------------------------------------------
client.on('messageUpdate', async (oldMsg, newMsg) => {
    try {
        if (!newMsg.guild || newMsg.author?.bot) return;
        if (oldMsg.content === newMsg.content) return; // Bỏ qua nếu chỉ đổi embed/ghim, nội dung văn bản không đổi
        if (!oldMsg.content && !newMsg.content) return;

        const gConfig = getGuildConfig(newMsg.guild.id);
        if (!gConfig.isModLogSetup) return;

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('✏️ Tin Nhắn Đã Bị Sửa')
            .addFields(
                { name: '👤 Tác giả', value: `${newMsg.author?.tag || 'Không rõ'} (\`${newMsg.author?.id || '?'}\`)`, inline: true },
                { name: '📍 Kênh', value: `${newMsg.channel}`, inline: true },
                { name: '📝 Nội dung cũ', value: (oldMsg.content || '*Trống*').slice(0, 1000) },
                { name: '📝 Nội dung mới', value: (newMsg.content || '*Trống*').slice(0, 1000) }
            )
            .setTimestamp();

        await sendModLog(newMsg.guild, gConfig, { embeds: [embed] });
    } catch (err) {
        console.error('❌ [ModLog] Lỗi ghi log sửa tin nhắn:', err.message);
    }
});

// -----------------------------------------------------------------
// 📋 NHẬT KÝ: TIN NHẮN BỊ XÓA
// -----------------------------------------------------------------
client.on('messageDelete', async (msg) => {
    try {
        if (!msg.guild || msg.author?.bot) return;

        const gConfig = getGuildConfig(msg.guild.id);
        if (!gConfig.isModLogSetup) return;
        if (!msg.content && (!msg.attachments || msg.attachments.size === 0)) return; // Không có gì để log

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('🗑️ Tin Nhắn Đã Bị Xóa')
            .addFields(
                { name: '👤 Tác giả', value: `${msg.author?.tag || 'Không rõ'} (\`${msg.author?.id || '?'}\`)`, inline: true },
                { name: '📍 Kênh', value: `${msg.channel}`, inline: true },
                { name: '📝 Nội dung', value: (msg.content || '*Không có nội dung văn bản (có thể là ảnh/file)*').slice(0, 1000) }
            )
            .setTimestamp();

        if (msg.attachments && msg.attachments.size > 0) {
            embed.addFields({ name: '📎 Tệp đính kèm', value: msg.attachments.map(a => a.name).join(', ').slice(0, 1000) });
        }

        await sendModLog(msg.guild, gConfig, { embeds: [embed] });
    } catch (err) {
        console.error('❌ [ModLog] Lỗi ghi log xóa tin nhắn:', err.message);
    }
});

// -----------------------------------------------------------------
// 📋 NHẬT KÝ: ĐỔI BIỆT DANH (NICKNAME) TRONG SERVER
// -----------------------------------------------------------------
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        if (oldMember.nickname === newMember.nickname) return;
        if (newMember.user.bot) return;

        const gConfig = getGuildConfig(newMember.guild.id);
        if (!gConfig.isModLogSetup) return;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('✏️ Biệt Danh Đã Thay Đổi')
            .addFields(
                { name: '👤 Thành viên', value: `${newMember.user.tag} (\`${newMember.id}\`)`, inline: true },
                { name: '📝 Biệt danh cũ', value: oldMember.nickname || '*Không có*', inline: true },
                { name: '📝 Biệt danh mới', value: newMember.nickname || '*Không có*', inline: true }
            )
            .setTimestamp();

        await sendModLog(newMember.guild, gConfig, { embeds: [embed] });
    } catch (err) {
        console.error('❌ [ModLog] Lỗi ghi log đổi biệt danh:', err.message);
    }
});

// -----------------------------------------------------------------
// 📋 NHẬT KÝ: ĐỔI TÊN TÀI KHOẢN (USERNAME) / AVATAR TOÀN CỤC
// Sự kiện toàn cục (không theo server) -> phát lại cho MỌI server chung
// mà thành viên đó đang tham gia và đang bật nhật ký quản trị.
// -----------------------------------------------------------------
client.on('userUpdate', async (oldUser, newUser) => {
    try {
        if (newUser.bot) return;
        const usernameChanged = oldUser.username !== newUser.username;
        const avatarChanged = oldUser.avatar !== newUser.avatar;
        if (!usernameChanged && !avatarChanged) return;

        for (const guild of client.guilds.cache.values()) {
            const gConfig = getGuildConfig(guild.id);
            if (!gConfig.isModLogSetup) continue;
            if (!guild.members.cache.has(newUser.id)) continue; // Chỉ log nếu người này còn ở trong server đó

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(usernameChanged && avatarChanged ? '✏️ Đổi Tên & Avatar Tài Khoản' : (usernameChanged ? '✏️ Đổi Tên Tài Khoản' : '🖼️ Đổi Avatar Tài Khoản'))
                .addFields({ name: '👤 Người dùng', value: `${newUser.tag} (\`${newUser.id}\`)` });

            if (usernameChanged) embed.addFields(
                { name: '📝 Tên cũ', value: oldUser.username, inline: true },
                { name: '📝 Tên mới', value: newUser.username, inline: true }
            );
            if (avatarChanged) embed.setThumbnail(newUser.displayAvatarURL());

            embed.setTimestamp();
            await sendModLog(guild, gConfig, { embeds: [embed] });
        }
    } catch (err) {
        console.error('❌ [ModLog] Lỗi ghi log đổi tên/avatar:', err.message);
    }
});

// -----------------------------------------------------------------
// 🔍 TRA CỨU LỊCH SỬ MUTE/KICK/BAN TẠI KÊNH NHẬT KÝ QUẢN TRỊ
// Admin gửi ID (hoặc @mention) một thành viên vào kênh nhật ký -> bot
// trả lại số lần mute/kick/ban của người đó trong server này.
// -----------------------------------------------------------------
client.on('messageCreate', async (msg) => {
    try {
        if (msg.author.bot || !msg.guild) return;

        const gConfig = getGuildConfig(msg.guild.id);
        if (!gConfig.isModLogSetup || msg.channel.id !== gConfig.modLogChannelId) return;
        if (!msg.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;

        const raw = msg.content.trim();
        let targetId = null;
        if (/^\d{17,20}$/.test(raw)) {
            targetId = raw;
        } else {
            const mentionMatch = raw.match(/^<@!?(\d{17,20})>$/);
            if (mentionMatch) targetId = mentionMatch[1];
        }
        if (!targetId) return; // Không phải ID/mention hợp lệ -> bỏ qua, không phải mọi tin nhắn trong kênh đều là tra cứu

        const history = (gConfig.modHistory && gConfig.modHistory[targetId]) || { warnCount: 0, muteCount: 0, kickCount: 0, banCount: 0 };
        const targetUser = await client.users.fetch(targetId).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('📋 Lịch Sử Kỷ Luật')
            .addFields(
                { name: '👤 Thành viên', value: targetUser ? `${targetUser.tag} (\`${targetId}\`)` : `\`${targetId}\` (không tìm thấy người dùng)` },
                { name: '⚠️ Số lần Cảnh cáo', value: `${history.warnCount || 0}`, inline: true },
                { name: '🔇 Số lần Mute', value: `${history.muteCount}`, inline: true },
                { name: '👢 Số lần Kick', value: `${history.kickCount}`, inline: true },
                { name: '🔨 Số lần Ban', value: `${history.banCount}`, inline: true },
                { name: '📐 Quy tắc leo thang', value: 'Cứ **5 lần Cảnh Cáo** → tự động **Mute**\nCứ **5 lần Mute** → tự động **Kick**\nCứ **5 lần Kick** → tự động **Ban**' }
            )
            .setTimestamp();

        if (targetUser) embed.setThumbnail(targetUser.displayAvatarURL());

        await msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false } }).catch(() => null);
    } catch (err) {
        console.error('❌ [ModLog Lookup] Lỗi tra cứu lịch sử:', err.message);
    }
});

// -----------------------------------------------------------------
// 🚫 KÊNH ADMIN QUẢN LÝ TỪ CẤM
// Admin (quyền Manage Guild) gõ trực tiếp vào kênh này để thêm từ cấm.
// Gõ "-từ" để xóa 1 từ khỏi danh sách. Gõ "list" để xem danh sách hiện tại.
// -----------------------------------------------------------------
client.on('messageCreate', async (msg) => {
    try {
        if (msg.author.bot || !msg.guild) return;
        const gConfig = getGuildConfig(msg.guild.id);
        if (!gConfig.bannedWordsChannelId || msg.channel.id !== gConfig.bannedWordsChannelId) return;
        if (!msg.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
            await msg.delete().catch(() => null);
            return;
        }

        const raw = msg.content.trim();
        if (!gConfig.bannedWords) gConfig.bannedWords = [];

        if (raw.toLowerCase() === 'list') {
            await msg.reply({
                content: gConfig.bannedWords.length
                    ? `📋 **Danh sách từ cấm (${gConfig.bannedWords.length}):**\n\`\`\`${gConfig.bannedWords.join(', ')}\`\`\``
                    : '📋 Danh sách từ cấm hiện đang trống.',
                allowedMentions: { repliedUser: false }
            }).catch(() => null);
            return;
        }

        if (raw.startsWith('-')) {
            const word = raw.slice(1).trim().toLowerCase();
            const idx = gConfig.bannedWords.findIndex(w => w.toLowerCase() === word);
            if (idx === -1) {
                await msg.reply({ content: `⚠️ \`${word}\` không có trong danh sách từ cấm.`, allowedMentions: { repliedUser: false } }).catch(() => null);
            } else {
                gConfig.bannedWords.splice(idx, 1);
                saveConfig();
                await msg.reply({ content: `🗑️ Đã xóa \`${word}\` khỏi danh sách từ cấm.`, allowedMentions: { repliedUser: false } }).catch(() => null);
            }
            return;
        }

        const word = raw.toLowerCase();
        if (!word) return;
        if (gConfig.bannedWords.some(w => w.toLowerCase() === word)) {
            await msg.reply({ content: `⚠️ \`${word}\` đã có trong danh sách rồi.`, allowedMentions: { repliedUser: false } }).catch(() => null);
            return;
        }
        gConfig.bannedWords.push(word);
        saveConfig();
        await msg.reply({ content: `✅ Đã thêm \`${word}\` vào danh sách từ cấm. (Gõ \`-${word}\` để xóa, \`list\` để xem toàn bộ danh sách)`, allowedMentions: { repliedUser: false } }).catch(() => null);
    } catch (err) {
        console.error('❌ [BannedWords Manage] Lỗi:', err.message);
    }
});

// -----------------------------------------------------------------
// 🚫 LỌC TỪ CẤM TOÀN SERVER — TỰ ĐỘNG XÓA + CẢNH CÁO
// Quét TẤT CẢ kênh (trừ kênh quản lý từ cấm). Vi phạm -> xóa tin nhắn +
// cảnh cáo (dùng chung 1 bộ đếm với /canhcao thủ công).
// Cứ 5 lần Cảnh Cáo -> tự động Mute -> cứ 5 Mute -> Kick -> cứ 5 Kick -> Ban.
// -----------------------------------------------------------------
client.on('messageCreate', async (msg) => {
    try {
        if (msg.author.bot || !msg.guild || !msg.member) return;
        const gConfig = getGuildConfig(msg.guild.id);
        if (!gConfig.bannedWords || gConfig.bannedWords.length === 0) return;
        if (msg.channel.id === gConfig.bannedWordsChannelId) return; // Kênh quản lý từ cấm không bị lọc
        if (msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return; // Admin không bị lọc

        const hit = findBannedWord(msg.content, gConfig);
        if (!hit) return;

        await msg.delete().catch(() => null);
        const actionResult = await recordModAction(msg.guild, gConfig, msg.author.id, 'warn', `Sử dụng từ cấm trong chat: "${hit}"`, 'MimiBot (Tự động)');

        const record = gConfig.modHistory[msg.author.id];
        const warnCount = record ? record.warnCount : 1;
        const remainder = warnCount % 5;
        const untilMute = remainder === 0 ? 0 : 5 - remainder;

        const warnMsg = await msg.channel.send({
            content: `🚫 ${msg.author} tin nhắn chứa **từ cấm** đã bị xóa — **Cảnh cáo lần ${warnCount}**.` +
                (untilMute > 0 ? ` Còn **${untilMute} lần** nữa sẽ bị tự động **Mute**.` : ' Đã đủ 5 lần cảnh cáo → tự động **Mute**!')
        }).catch(() => null);
        setTimeout(() => warnMsg?.delete().catch(() => null), 8000);

        // Nếu leo thang (Mute/Kick/Ban) thất bại ở bất kỳ tầng nào do role/quyền bot -> báo rõ cho Admin biết
        const failureMessages = describeEscalationFailures(actionResult, `${msg.author}`);
        for (const fm of failureMessages) {
            await msg.channel.send({ content: fm }).catch(() => null);
        }
    } catch (err) {
        console.error('❌ [BannedWords Filter] Lỗi:', err.message);
    }
});

client.on('guildMemberAdd', async (member) => {
    const guild = member.guild; if (!guild) return; 
    const gConfig = getGuildConfig(guild.id);

    if (gConfig.isVerifySetup) {
        if (member.user.bot) {
            // Bot vào server → tự động cấp role ĐÃ XÁC THỰC (bỏ qua bước xác thực thủ công)
            if (gConfig.verifiedRoleId) {
                member.roles.add(gConfig.verifiedRoleId).catch(err => 
                    console.error(`❌ Không thể cấp role Đã Xác Thực cho bot ${member.user.tag}:`, err.message)
                );
            }
        } else {
            // Người dùng thường → cấp role CHƯA XÁC THỰC như bình thường
            if (gConfig.unverifiedRoleId) {
                member.roles.add(gConfig.unverifiedRoleId).catch(err => 
                    console.error(`❌ Không thể gán role Chưa Xác Thực cho ${member.user.tag}:`, err.message)
                );
            }
        }
    }

    let welcomeChannel = gConfig.welcomeChannelId ? guild.channels.cache.get(gConfig.welcomeChannelId) : null;
    if (!welcomeChannel) return;

    let finalThumbnail = gConfig.embedThumbnail || member.user.displayAvatarURL({ dynamic: true, size: 256 }) || null;
    let contentText = gConfig.contentMessage ? gConfig.contentMessage.replace(/{user}/g, `<@${member.id}>`).replace(/{server}/g, guild.name) : `Welcome <@${member.id}> to ${guild.name}`;

    const welcomeEmbed = new EmbedBuilder()
        .setColor('#1E1F22') 
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) }) 
        .setTitle(guild.name) 
        .setThumbnail(finalThumbnail)  // Avatar cá nhân của người mới vào
        .setDescription(gConfig.embedDescription ? gConfig.embedDescription.replace(/\\n/g, '\n') : `Chào mừng bạn đã tham gia vào máy chủ nhé! 🎉`)
        .setFooter({ text: `You are member #${guild.memberCount}` })
        .setTimestamp();

    if (gConfig.embedImage) welcomeEmbed.setImage(gConfig.embedImage);

    if (gConfig.isVerifySetup && gConfig.verifyChannelId && guild.channels.cache.get(gConfig.verifyChannelId)) {
        welcomeEmbed.addFields({
            name: '🛡️ Nhắc Nhở Xác Thực',
            value: `Vui lòng vào kênh <#${gConfig.verifyChannelId}> và nhấn nút **"✅ Xác Thực Ngay"** để mở khóa toàn bộ kênh của server!`
        });
    }

    welcomeChannel.send({ content: contentText, embeds: [welcomeEmbed] }).catch(() => {});
});

// -----------------------------------------------------------------
// 📩 FORWARD TIN NHẮN TAG BOT / DM BOT VỀ CHO OWNER
// -----------------------------------------------------------------
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const isDM = !msg.guild;
    const isMention = msg.guild && msg.mentions.users.has(client.user.id);

    if (!isDM && !isMention) return;

    const owner = await client.users.fetch(OWNER_ID).catch(() => null);
    if (!owner) return;

    let contentText = msg.content || '';
    if (msg.attachments.size > 0) {
        const attachmentUrls = msg.attachments.map(att => `[Tải tệp tin](${att.url})`).join('\n');
        contentText = (contentText ? contentText + '\n\n' : '') + `📎 **Tệp đính kèm:**\n${attachmentUrls}`;
    }
    if (!contentText) {
        contentText = '*(Không có nội dung tin nhắn)*';
    }

    const embed = new EmbedBuilder()
        .setColor(isDM ? '#9B59B6' : '#E67E22')
        .setTitle(isDM ? '📩 Tin nhắn riêng mới gửi cho Bot' : '📣 Có người tag Bot trong Server')
        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '👤 Tên người gửi', value: `${msg.author.username}`, inline: true },
            { name: '🆔 User ID', value: `\`${msg.author.id}\``, inline: true },
            { name: '🏠 Server', value: isDM ? 'Tin nhắn riêng (DM)' : `${msg.guild.name} (\`${msg.guild.id}\`)`, inline: true },
            { name: '💬 Nội dung tin nhắn', value: contentText.slice(0, 1024) }
        )
        .setTimestamp(msg.createdAt);

    if (!isDM) {
        embed.addFields({ name: '🔗 Kênh', value: `<#${msg.channel.id}> (\`${msg.channel.id}\`)`, inline: true });
    }

    await owner.send({ embeds: [embed] }).catch(() => null);
});

// -----------------------------------------------------------------
// 🎭 HỆ THỐNG XỬ LÝ THẢ/GỠ REACTION ĐỂ CẤP/GỠ VAI TRÒ (RIÊNG BIỆT)
// -----------------------------------------------------------------
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch().catch(() => null);
        if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

        const message = reaction.message;
        const guild = message.guild; if (!guild) return;

        const gConfig = getGuildConfig(guild.id);
        if (!gConfig.reactionRoles) return;
        const panelData = gConfig.reactionRoles[message.id];
        if (!panelData) return;

        const key = reaction.emoji.id || reaction.emoji.name;
        const roleEntry = panelData.roles[key];
        if (!roleEntry) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        await member.roles.add(roleEntry.roleId).catch(err => 
            console.error(`❌ [Reaction Role] Không thể cấp vai trò cho ${user.tag}:`, err.message)
        );
    } catch (err) {
        console.error('❌ Lỗi hệ thống messageReactionAdd (Reaction Role):', err);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    try {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch().catch(() => null);
        if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

        const message = reaction.message;
        const guild = message.guild; if (!guild) return;

        const gConfig = getGuildConfig(guild.id);
        if (!gConfig.reactionRoles) return;
        const panelData = gConfig.reactionRoles[message.id];
        if (!panelData) return;

        const key = reaction.emoji.id || reaction.emoji.name;
        const roleEntry = panelData.roles[key];
        if (!roleEntry) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        await member.roles.remove(roleEntry.roleId).catch(err => 
            console.error(`❌ [Reaction Role] Không thể gỡ vai trò của ${user.tag}:`, err.message)
        );
    } catch (err) {
        console.error('❌ Lỗi hệ thống messageReactionRemove (Reaction Role):', err);
    }
});

// -----------------------------------------------------------------
// 💬 HỆ THỐNG GIẢI TRÍ VÀ CÀY CUỐC QUA TIN NHẮN (PREFIX + ALIASES TOÀN CẦU)
// -----------------------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const chId = message.channel.id;
    const gConfig = getGuildConfig(message.guild.id);
    const serverPrefix = gConfig.prefix || 'mi';
    const args = message.content.trim().split(/ +/);
    const command = args[0].toLowerCase();

    // --- A. LẮNG NGHE LỆNH GIẢI TRÍ VIẾT LIỀN (CÓ HỖ TRỢ VIẾT TẮT) ---

    // 1. Lệnh điểm danh: midaily hoặc mid
    if (command === 'midaily' || command === 'mid') {
        const userData = getUserData(userId);
        
        const today = toDateStringVN();

        if (userData.lastDaily === today) {
            return message.reply({ content: '❌ Bạn đã nhận quà điểm danh ngày hôm nay rồi, hãy quay lại vào ngày mai!', allowedMentions: { repliedUser: false } });
        }

        const reward = 1000;
        userData.balance += reward;
        userData.lastDaily = today;
        saveEconomy();

        return message.reply({ content: `🎁 **${message.author.username}** điểm danh thành công và nhận được **+${reward.toLocaleString()} xu**!`, allowedMentions: { repliedUser: false } });
    }

    // 2. Lệnh xem hồ sơ: miprofile hoặc mip
    if (command === 'miprofile' || command === 'mip') {
        const userData = getUserData(userId);
        const xpNeeded = Math.max(500000, userData.level * 500000);
        const userAvatar = message.author.displayAvatarURL({ dynamic: true, size: 256 });

        const profileEmbed = buildBaseEmbed(
            `📊 HỒ SƠ TOÀN CẦU CỦA ${message.author.username.toUpperCase()}`,
            `### 👤 **Thông tin tài khoản:**\n` +
            `> Thành viên: ${message.author} (\`${message.author.id}\`)\n\n` +
            `**Chi tiết tài sản & tiến trình:**\n` +
            `- 🌟 Cấp độ: \`Level ${userData.level}\`\n` +
            `- 💰 Ví tiền: \`${userData.balance.toLocaleString()} xu\`\n` +
            `- ✨ Kinh nghiệm: \`${userData.xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP\`\n` +
            `  ${generateProgressBar(userData.xp, xpNeeded, 10)}`,
            'THEME',
            client.user
        ).setThumbnail(userAvatar);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('profile_give').setLabel('💸 Chuyển Xu').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('profile_shop').setLabel('🛒 Mua Sắm').setStyle(ButtonStyle.Secondary)
        );

        return message.reply({
            embeds: [profileEmbed],
            components: [row],
            allowedMentions: { repliedUser: false }
        });
    }

    // 3. Lệnh tung đồng xu: micf | micoinflip | giới hạn 250,000 xu / lần, hỗ trợ 'all'
    if (command === 'micf' || command === 'micoinflip') {
        const MAX_BET = 250_000;
        const userData = getUserData(userId);

        let rawBet = args[1] ? args[1].toLowerCase() : null;
        let sideInput = args[2] ? args[2].toLowerCase() : null;

        if (!rawBet) {
            return message.reply({ 
                content: `❌ Cú pháp sai! Vd: \`${command} 50000 ngua\` hoặc \`${command} all sap\`\n⚠️ Cược tối đa **${MAX_BET.toLocaleString()} xu/lần**.`, 
                allowedMentions: { repliedUser: false } 
            });
        }

        // 'all' → cược tối đa (250k hoặc toàn bộ xu nếu ít hơn)
        let bet;
        if (rawBet === 'all') {
            bet = Math.min(userData.balance, MAX_BET);
        } else {
            bet = parseInt(rawBet);
            if (isNaN(bet) || bet <= 0) {
                return message.reply({ content: `❌ Số tiền cược không hợp lệ!`, allowedMentions: { repliedUser: false } });
            }
            if (bet > MAX_BET) {
                return message.reply({ content: `❌ Cược tối đa mỗi lần là **${MAX_BET.toLocaleString()} xu**!`, allowedMentions: { repliedUser: false } });
            }
        }

        if (bet <= 0) {
            return message.reply({ content: `❌ Bạn không có xu để đặt cược!`, allowedMentions: { repliedUser: false } });
        }

        if (sideInput === 'ngửa') sideInput = 'ngua';
        if (sideInput === 'sấp') sideInput = 'sap';
        if (sideInput !== 'ngua' && sideInput !== 'sap') {
            return message.reply({ content: '❌ Bạn phải chọn `ngua` (Ngửa) hoặc `sap` (Sấp)!', allowedMentions: { repliedUser: false } });
        }

        if (userData.balance < bet) {
            return message.reply({ content: `❌ Bạn không đủ xu (Số dư: **${userData.balance.toLocaleString()} xu**)`, allowedMentions: { repliedUser: false } });
        }

        const result = Math.random() < 0.5 ? 'ngua' : 'sap';
        const resultText = result === 'ngua' ? 'Ngửa 🪙' : 'Sấp 🪙';

        if (sideInput === result) {
            const winAmount = bet;
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + winAmount;
            saveEconomy();
            return message.reply({ content: `🪙 Kết quả: **${resultText}**\n🎉 Đúng rồi! Bạn thắng **+${winAmount.toLocaleString()} xu**! Số dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `🪙 Kết quả: **${resultText}**\n💸 Sai rồi! Mất **-${bet.toLocaleString()} xu**. Số dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }
    // 4. Lệnh chuyển xu cho người khác: migive @user [số_tiền]
    if (command === 'migive' || command === 'mig') {
        const targetMember = message.mentions.members.first();
        const amount = parseInt(args[2]);

        // Kiểm tra cú pháp
        if (!targetMember || !amount || isNaN(amount) || amount <= 0) {
            return message.reply({ 
                content: `❌ Cú pháp sai! Vui lòng gõ:\n\`migive @người_nhận [số_tiền]\`\nVí dụ: \`migive @Username 500\``, 
                allowedMentions: { repliedUser: false } 
            });
        }

        // Kiểm tra tự chuyển cho chính mình
        if (targetMember.id === userId) {
            return message.reply({ content: '❌ Bạn không thể chuyển xu cho chính mình!', allowedMentions: { repliedUser: false } });
        }

        // Kiểm tra số dư người gửi
        const senderData = getUserData(userId);
        if (senderData.balance < amount) {
            return message.reply({ content: `❌ Bạn không đủ xu để thực hiện giao dịch này (Số dư: ${senderData.balance.toLocaleString()} xu)!`, allowedMentions: { repliedUser: false } });
        }

        // Thực hiện giao dịch
        const receiverData = getUserData(targetMember.id);
        
        senderData.balance -= amount;
        receiverData.balance += amount;
        
        saveEconomy();

        return message.reply({ 
            content: `✅ **Giao dịch thành công!**\n💸 Bạn đã chuyển **${amount.toLocaleString()} xu** cho **${targetMember.user.username}**.`, 
            allowedMentions: { repliedUser: false } 
        });
    }
    // 5. Lệnh xem số dư: micash hoặc mic
    if (command === 'micash' || command === 'mic' || command === `${gConfig.prefix}cash` || command === `${gConfig.prefix}c`) {
        const userData = getUserData(userId);
        return message.reply({ content: `💰 **Ví tiền của bạn:** \`${userData.balance.toLocaleString()} xu\``, allowedMentions: { repliedUser: false } });
    }

    // 5b. Lệnh top xu: mitop / mit — xem bảng xếp hạng người nhiều xu nhất
    if (command === 'mitop' || command === 'mit') {
        const sorted = Object.values(economyData)
            .filter(u => u.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);

        if (!sorted.length) return message.reply({ content: 'ℹ️ Chưa có dữ liệu xu nào.', allowedMentions: { repliedUser: false } });

        const medals = ['🥇', '🥈', '🥉'];
        const lines = sorted.map((u, i) => {
            const tag = `<@${u.userId}>`;
            return `${medals[i] || `**${i + 1}.**`} ${tag} — \`${u.balance.toLocaleString()} xu\``;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🏆 BẢNG XẾP HẠNG XU TOÀN HỆ THỐNG')
            .setDescription(lines)
            .setFooter({ text: 'Top 10 người nhiều xu nhất' })
            .setTimestamp();

        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }

    // ==========================================
    // 🎮 HELPER DÙNG CHUNG: PHÂN TÍCH SỐ CƯỢC
    // Trả về { bet, error } — 'all' = min(số dư, 250,000)
    // ==========================================
    function parseBet(rawArg, balance) {
        const MAX_BET = 250_000;
        if (!rawArg) return { bet: 0, error: `❌ Thiếu số tiền cược!\n• Cú pháp: \`[lệnh] [số_tiền] ...\` hoặc \`[lệnh] all ...\`\n• Cược tối đa: **${MAX_BET.toLocaleString()} xu/lần**` };
        if (rawArg.toLowerCase() === 'all') {
            const bet = Math.min(balance, MAX_BET);
            if (bet <= 0) return { bet: 0, error: '❌ Bạn không có xu để đặt cược!' };
            return { bet, error: null };
        }
        const bet = parseInt(rawArg);
        if (isNaN(bet) || bet <= 0) return { bet: 0, error: '❌ Số tiền cược không hợp lệ!' };
        if (bet > MAX_BET) return { bet: 0, error: `❌ Cược tối đa mỗi lần là **${MAX_BET.toLocaleString()} xu**! Dùng \`all\` để cược tối đa.` };
        if (bet > balance) return { bet: 0, error: `❌ Không đủ xu! Số dư: **${balance.toLocaleString()} xu**` };
        return { bet, error: null };
    }

    // 6. Xúc xắc: mid6 | mixucxac — Tung 2 xúc xắc, đặt cao(cao)/thap(thap), tổng lẻ(le)/chẵn(chan)
    if (command === 'mid6' || command === 'mixucxac') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all] [cao/thap/le/chan]\`\nVí dụ: \`${command} all cao\``, allowedMentions: { repliedUser: false } });

        const choice = args[2] ? args[2].toLowerCase() : null;
        const validChoices = ['cao', 'thap', 'le', 'chan'];
        if (!choice || !validChoices.includes(choice)) {
            return message.reply({ content: `❌ Chọn 1 trong 4 lựa chọn: \`cao\` / \`thap\` / \`le\` / \`chan\`\nCú pháp: \`${command} [số/all] [lựa chọn]\``, allowedMentions: { repliedUser: false } });
        }

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

        const win = (choice === 'cao' && total >= 7) || (choice === 'thap' && total < 7) ||
                    (choice === 'le' && total % 2 !== 0) || (choice === 'chan' && total % 2 === 0);

        if (win) {
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + bet;
            saveEconomy();
            return message.reply({ content: `${diceEmojis[d1]}${diceEmojis[d2]} Tổng: **${total}** — Bạn đặt **${choice}** → **ĐÚNG!** +**${bet.toLocaleString()} xu** 🎉\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `${diceEmojis[d1]}${diceEmojis[d2]} Tổng: **${total}** — Bạn đặt **${choice}** → **SAI!** -**${bet.toLocaleString()} xu** 💸\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }

    // 7. Tài Xỉu: mitx | mitaixiu — Tài (4-6) / Xỉu (1-3) với 1 xúc xắc
    if (command === 'mitx' || command === 'mitaixiu') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all] [tai/xiu]\``, allowedMentions: { repliedUser: false } });

        const choice = args[2] ? args[2].toLowerCase() : null;
        if (choice !== 'tai' && choice !== 'xiu' && choice !== 'tài' && choice !== 'xỉu') {
            return message.reply({ content: `❌ Chọn \`tai\` (Tài: 4-6) hoặc \`xiu\` (Xỉu: 1-3)\nCú pháp: \`${command} [số/all] [tai/xiu]\``, allowedMentions: { repliedUser: false } });
        }

        const pick = (choice === 'tai' || choice === 'tài') ? 'tai' : 'xiu';
        const roll = Math.floor(Math.random() * 6) + 1;
        const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const result = roll >= 4 ? 'tai' : 'xiu';
        const resultLabel = result === 'tai' ? 'Tài 🔴' : 'Xỉu 🔵';

        if (pick === result) {
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + bet;
            saveEconomy();
            return message.reply({ content: `${diceEmojis[roll]} Xúc xắc ra **${roll}** — ${resultLabel} → **ĐÚNG!** +**${bet.toLocaleString()} xu** 🎉\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `${diceEmojis[roll]} Xúc xắc ra **${roll}** — ${resultLabel} → **SAI!** -**${bet.toLocaleString()} xu** 💸\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }

    // 8. Đoán số: mig3 | midoanso — Đoán đúng số 1-10, thắng x5 cược
    if (command === 'mig3' || command === 'midoanso') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all] [số_đoán 1-10]\`\nThắng nhận **x5** số tiền cược!`, allowedMentions: { repliedUser: false } });

        const guess = parseInt(args[2]);
        if (!guess || isNaN(guess) || guess < 1 || guess > 10) {
            return message.reply({ content: `❌ Hãy đoán một số từ **1 đến 10**!\nCú pháp: \`${command} [số/all] [số_đoán]\`\nThắng nhận **x5** số tiền cược!`, allowedMentions: { repliedUser: false } });
        }

        const answer = Math.floor(Math.random() * 10) + 1;
        if (guess === answer) {
            const prize = bet * 5;
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + prize;
            saveEconomy();
            return message.reply({ content: `🎯 Con số bí ẩn là **${answer}** — Bạn đoán **${guess}** → **CHÍNH XÁC!** +**${prize.toLocaleString()} xu** (x5) 🎉\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `🎯 Con số bí ẩn là **${answer}** — Bạn đoán **${guess}** → **SAI!** -**${bet.toLocaleString()} xu** 💸\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }

    // 9. Bầu Cua Tôm Cá: mibc | mibaucua — Chọn con vật, tung 3 xúc xắc bầu cua
    //    - Có gõ tên con vật ngay (vd: mibc 1000 cua) => giữ cơ chế cũ, ra kết quả tức thì.
    //    - Không gõ tên con vật (vd: mibc 1000) => mở phiên chọn bằng REACTION EMOJI:
    //        • Có thể react NHIỀU con cùng lúc (cược riêng từng con).
    //        • Có 30 giây để react, sau 30s reaction thêm không được tính.
    //        • Không react con nào trong 30s => không mất/nhận xu (hoàn tiền).
    if (command === 'mibc' || command === 'mibaucua') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all] [bau/cua/tom/ca/ga/nai]\` hoặc \`${command} [số/all]\` để chọn bằng reaction`, allowedMentions: { repliedUser: false } });

        const symbols = { bau: '🍐 Bầu', cua: '🦀 Cua', tom: '🦐 Tôm', ca: '🐟 Cá', ga: '🐓 Gà', nai: '🦌 Nai' };
        const emojiOf = { bau: '🍐', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐓', nai: '🦌' };
        const keys = Object.keys(symbols);
        let choice = args[2] ? args[2].toLowerCase() : null;
        if (choice === 'tôm') choice = 'tom';
        if (choice === 'cá') choice = 'ca';
        if (choice === 'gà') choice = 'ga';

        // ------ Chế độ cũ: đã gõ sẵn tên con vật => xử lý tức thì như trước ------
        if (choice) {
            if (!keys.includes(choice)) {
                return message.reply({ content: `❌ Chọn 1 trong 6 con: \`bau\` \`cua\` \`tom\` \`ca\` \`ga\` \`nai\`\nCú pháp: \`${command} [số/all] [con_vật]\``, allowedMentions: { repliedUser: false } });
            }

            const rollOnce = () => keys[Math.floor(Math.random() * keys.length)];
            const dice = [rollOnce(), rollOnce(), rollOnce()];
            const matches = dice.filter(d => d === choice).length;

            const diceText = dice.map(d => symbols[d]).join('  |  ');

            if (matches > 0) {
                const winAmount = bet * matches;
                userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + winAmount;
                saveEconomy();
                return message.reply({ content: `🎲 Kết quả: ${diceText}\n🎉 Bạn đặt **${symbols[choice]}** → trúng **${matches}** viên! +**${winAmount.toLocaleString()} xu** (x${matches})\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
            } else {
                userData.balance -= bet;
                saveEconomy();
                return message.reply({ content: `🎲 Kết quả: ${diceText}\n💸 Bạn đặt **${symbols[choice]}** → không trúng viên nào! Mất **-${bet.toLocaleString()} xu**\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
            }
        }

        // ------ Chế độ mới: chọn bằng REACTION EMOJI, có thể chọn nhiều con, 30 giây ------
        const animalOrder = keys; // ['bau','cua','tom','ca','ga','nai']

        const setupEmbed = new EmbedBuilder()
            .setColor(0xF5A623)
            .setTitle('🎲 BẦU CUA TÔM CÁ — Chọn bằng Reaction')
            .setDescription(
                `${message.author}, hãy **react** vào emoji bên dưới để chọn (các) con vật muốn đặt cược.\n` +
                `💰 Mức cược: **${bet.toLocaleString()} xu** / mỗi con bạn chọn\n` +
                `✅ Có thể chọn **nhiều con** cùng lúc\n` +
                `⏱️ Thời gian chọn: **30 giây** — reaction sau 30 giây sẽ **không được tính**\n` +
                `🔄 Không react con nào → **hoàn tiền**, không mất/nhận xu\n\n` +
                animalOrder.map(k => `${emojiOf[k]} ${symbols[k].split(' ')[1]}`).join('   ')
            )
            .setFooter({ text: 'Bầu Cua Tôm Cá — react để chọn, có hiệu lực trong 30s' });

        const setupMsg = await message.reply({ embeds: [setupEmbed], allowedMentions: { repliedUser: false } });

        for (const k of animalOrder) {
            try { await setupMsg.react(emojiOf[k]); } catch (e) { /* bỏ qua nếu bot thiếu quyền react */ }
        }

        const chosen = new Set();
        const filter = (reaction, reactUser) => reactUser.id === userId && Object.values(emojiOf).includes(reaction.emoji.name);
        const collector = setupMsg.createReactionCollector({ filter, time: 30_000 });

        collector.on('collect', (reaction) => {
            const key = animalOrder.find(k => emojiOf[k] === reaction.emoji.name);
            if (key) chosen.add(key);
        });

        collector.on('end', async () => {
            try { await setupMsg.reactions.removeAll(); } catch (e) { /* bỏ qua nếu bot thiếu quyền */ }

            // Lấy lại dữ liệu số dư mới nhất phòng khi thay đổi trong lúc chờ 30s
            const freshUserData = getUserData(userId);

            // Không chọn con nào sau 30s => hoàn tiền (không trừ/không cộng gì)
            if (chosen.size === 0) {
                const doneEmbed = new EmbedBuilder()
                    .setColor(0x95A5A6)
                    .setTitle('🎲 BẦU CUA TÔM CÁ — Hết giờ chọn')
                    .setDescription(`${message.author}, bạn không chọn con nào trong 30 giây → **hoàn tiền, không mất/nhận xu gì cả.**\nSố dư: **${freshUserData.balance.toLocaleString()} xu**`);
                return setupMsg.edit({ embeds: [doneEmbed] }).catch(() => {});
            }

            const totalBet = bet * chosen.size;
            if (totalBet > freshUserData.balance && userId !== OWNER_ID) {
                const doneEmbed = new EmbedBuilder()
                    .setColor(0xE74C3C)
                    .setTitle('🎲 BẦU CUA TÔM CÁ — Không đủ số dư')
                    .setDescription(`${message.author}, bạn chọn **${chosen.size}** con (cần **${totalBet.toLocaleString()} xu**) nhưng không đủ số dư → **hủy phiên, hoàn tiền.**\nSố dư: **${freshUserData.balance.toLocaleString()} xu**`);
                return setupMsg.edit({ embeds: [doneEmbed] }).catch(() => {});
            }

            const rollOnce = () => animalOrder[Math.floor(Math.random() * animalOrder.length)];
            const dice = [rollOnce(), rollOnce(), rollOnce()];
            const diceText = dice.map(d => symbols[d]).join('  |  ');

            let totalWin = 0;
            let totalLose = 0;
            const lines = [];
            for (const key of chosen) {
                const matches = dice.filter(d => d === key).length;
                if (matches > 0) {
                    const win = bet * matches;
                    totalWin += win;
                    lines.push(`${emojiOf[key]} ${symbols[key].split(' ')[1]}: trúng **${matches}** viên → +**${win.toLocaleString()} xu**`);
                } else {
                    totalLose += bet;
                    lines.push(`${emojiOf[key]} ${symbols[key].split(' ')[1]}: không trúng → -**${bet.toLocaleString()} xu**`);
                }
            }

            const net = totalWin - totalLose;
            freshUserData.balance = userId === OWNER_ID ? MAX_BALANCE : freshUserData.balance + net;
            saveEconomy();

            const resultEmbed = new EmbedBuilder()
                .setColor(net >= 0 ? 0x2ECC71 : 0xE74C3C)
                .setTitle('🎲 BẦU CUA TÔM CÁ — Kết quả')
                .setDescription(
                    `Kết quả xúc xắc: ${diceText}\n\n` +
                    lines.join('\n') +
                    `\n\n${net >= 0 ? '🎉' : '💸'} Tổng cộng: **${net >= 0 ? '+' : ''}${net.toLocaleString()} xu**\n` +
                    `Số dư: **${freshUserData.balance.toLocaleString()} xu**`
                );

            setupMsg.edit({ embeds: [resultEmbed] }).catch(() => {});
        });

        return;
    }

    // 10. Kéo Búa Giấy: mikbg | mikeobuagiay — Đấu tay đôi với Bot, thắng nhân đôi cược
    if (command === 'mikbg' || command === 'mikeobuagiay') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all] [keo/bua/giay]\``, allowedMentions: { repliedUser: false } });

        const moves = { keo: '✌️ Kéo', bua: '✊ Búa', giay: '✋ Giấy' };
        const keys = Object.keys(moves);
        let choice = args[2] ? args[2].toLowerCase() : null;
        if (choice === 'giấy') choice = 'giay';
        if (choice === 'kéo') choice = 'keo';
        if (choice === 'búa') choice = 'bua';
        if (!choice || !keys.includes(choice)) {
            return message.reply({ content: `❌ Chọn 1 trong 3: \`keo\` (Kéo) / \`bua\` (Búa) / \`giay\` (Giấy)\nCú pháp: \`${command} [số/all] [lựa_chọn]\``, allowedMentions: { repliedUser: false } });
        }

        const beats = { keo: 'giay', bua: 'keo', giay: 'bua' }; // key thắng value tương ứng
        const botMove = keys[Math.floor(Math.random() * keys.length)];

        const outcome = choice === botMove ? 'draw' : (beats[choice] === botMove ? 'win' : 'lose');

        const resultLine = `Bạn: ${moves[choice]}  —  Bot: ${moves[botMove]}`;

        if (outcome === 'win') {
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + bet;
            saveEconomy();
            return message.reply({ content: `${resultLine}\n🎉 Bạn thắng! +**${bet.toLocaleString()} xu**\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else if (outcome === 'draw') {
            return message.reply({ content: `${resultLine}\n🤝 Hòa! Không mất/nhận xu.\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `${resultLine}\n💸 Bạn thua! -**${bet.toLocaleString()} xu**\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }

    // 11. Máy Kéo Slot: misl | mislot — Quay 3 ô, trúng 2-3 ký hiệu giống nhau ăn tiền theo hệ số
    if (command === 'misl' || command === 'mislot') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all]\``, allowedMentions: { repliedUser: false } });

        // Hệ số thưởng khi trúng 3 ký hiệu giống nhau (thấp → cao)
        const REEL = [
            { s: '🍒', mult: 2 }, { s: '🍋', mult: 3 }, { s: '🍇', mult: 4 },
            { s: '🔔', mult: 5 }, { s: '💎', mult: 7 }, { s: '7️⃣', mult: 10 }
        ];
        const spinOnce = () => REEL[Math.floor(Math.random() * REEL.length)];

        const spin = [spinOnce(), spinOnce(), spinOnce()];
        const isTriple = spin[0].s === spin[1].s && spin[1].s === spin[2].s;
        const isDouble = !isTriple && (spin[0].s === spin[1].s || spin[1].s === spin[2].s || spin[0].s === spin[2].s);

        const spinText = spin.map(x => x.s).join('  ');

        if (isTriple) {
            const winAmount = bet * spin[0].mult;
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + winAmount;
            saveEconomy();
            return message.reply({ content: `🎰 | ${spinText} |\n🎉 **NỔ HŨ 3 KÝ HIỆU!** +**${winAmount.toLocaleString()} xu** (x${spin[0].mult})\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else if (isDouble) {
            return message.reply({ content: `🎰 | ${spinText} |\n🤝 Trúng cặp đôi — Hoàn lại tiền cược, không lời không lỗ.\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `🎰 | ${spinText} |\n💸 Không trúng gì cả! Mất **-${bet.toLocaleString()} xu**\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }

    // 11b. Xóc Đĩa: mixd | mixocdia — Lắc 4 đĩa, mỗi đĩa 1 mặt Đỏ/Trắng, đặt Chẵn/Lẻ số mặt Đỏ, thắng nhân đôi cược
    if (command === 'mixd' || command === 'mixocdia') {
        const userData = getUserData(userId);
        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all] [chan/le]\``, allowedMentions: { repliedUser: false } });

        let choice = args[2] ? args[2].toLowerCase() : null;
        if (choice === 'chẵn') choice = 'chan';
        if (choice === 'lẻ') choice = 'le';
        if (choice !== 'chan' && choice !== 'le') {
            return message.reply({ content: `❌ Chọn \`chan\` (Chẵn) hoặc \`le\` (Lẻ)!\nCú pháp: \`${command} [số/all] [chan/le]\``, allowedMentions: { repliedUser: false } });
        }

        const rollDisc = () => (Math.random() < 0.5 ? '🔴' : '⚪');
        const discs = [rollDisc(), rollDisc(), rollDisc(), rollDisc()];
        const redCount = discs.filter(d => d === '🔴').length;
        const result = redCount % 2 === 0 ? 'chan' : 'le';

        const discsText = discs.join(' ');
        const resultLabel = result === 'chan' ? `Chẵn (${redCount} đỏ)` : `Lẻ (${redCount} đỏ)`;

        if (choice === result) {
            userData.balance = userId === OWNER_ID ? MAX_BALANCE : userData.balance + bet;
            saveEconomy();
            return message.reply({ content: `🥣 Đĩa lắc ra: ${discsText}\n${resultLabel} → **ĐÚNG!** +**${bet.toLocaleString()} xu** 🎉\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        } else {
            userData.balance -= bet;
            saveEconomy();
            return message.reply({ content: `🥣 Đĩa lắc ra: ${discsText}\n${resultLabel} → **SAI!** -**${bet.toLocaleString()} xu** 💸\nSố dư: **${userData.balance.toLocaleString()} xu**`, allowedMentions: { repliedUser: false } });
        }
    }

    // 11c. Blackjack: mibj | miblackjack — Xì dách kiểu Mỹ, tương tác bằng nút bấm (Rút/Dừng/Nhân đôi)
    if (command === 'mibj' || command === 'miblackjack') {
        const userData = getUserData(userId);

        if (blackjackGames.has(userId)) {
            return message.reply({ content: `❌ Bạn đang có 1 ván Blackjack chưa xong! Hãy bấm nút trên tin nhắn cũ để tiếp tục.`, allowedMentions: { repliedUser: false } });
        }

        const { bet, error } = parseBet(args[1], userData.balance);
        if (error) return message.reply({ content: error + `\nCú pháp: \`${command} [số/all]\``, allowedMentions: { repliedUser: false } });

        // Trừ tiền cược ngay (giữ cọc), hoàn/trả lại khi ván kết thúc
        userData.balance -= bet;
        saveEconomy();

        const deck = bjCreateDeck();
        const playerHand = [bjDraw(deck), bjDraw(deck)];
        const dealerHand = [bjDraw(deck), bjDraw(deck)];

        const game = {
            userId, username: message.author.username, guildId: message.guild.id,
            deck, playerHand, dealerHand, totalBet: bet, doubled: false, timeoutHandle: null,
        };
        blackjackGames.set(userId, game);

        const playerBJ = bjIsBlackjack(playerHand);
        const dealerBJ = bjIsBlackjack(dealerHand);

        const sent = await message.reply({
            embeds: [bjBuildEmbed(game)],
            components: playerBJ || dealerBJ ? [] : bjBuildRow(game),
            allowedMentions: { repliedUser: false }
        });

        // Cả hai đều Blackjack tự nhiên → Hòa. Chỉ người chơi → Blackjack. Chỉ bot → Thua ngay.
        if (playerBJ || dealerBJ) {
            const outcome = playerBJ && dealerBJ ? 'push' : (playerBJ ? 'blackjack' : 'lose');
            return bjEndGame(game, sent, outcome);
        }

        // Tự động Dừng nếu không bấm nút sau 60 giây
        game.timeoutHandle = setTimeout(() => {
            bjEndGame(game, sent).catch(() => null);
        }, 60_000);

        return;
    }


    if (command === 'misay' || command === 'mis') {
        const hasPermission = message.member.permissions.has(PermissionFlagsBits.ManageGuild) || message.member.permissions.has(PermissionFlagsBits.ManageMessages);

        if (!hasPermission) {
            const warnMsg = await message.reply({ content: '❌ Bạn không có quyền sử dụng lệnh thông báo này!', allowedMentions: { repliedUser: false } }).catch(() => null);
            setTimeout(() => { 
                if (warnMsg) warnMsg.delete().catch(() => null); 
                message.delete().catch(() => null); 
            }, 4000);
            return;
        }

        const announceText = message.content.slice(args[0].length).trim();
        if (!announceText) {
            const warnMsg = await message.reply({ 
                content: `❌ Vui lòng nhập nội dung cần thông báo!\nCú pháp: \`${command} [nội dung thông báo]\``, 
                allowedMentions: { repliedUser: false } 
            }).catch(() => null);
            setTimeout(() => { 
                if (warnMsg) warnMsg.delete().catch(() => null); 
                message.delete().catch(() => null); 
            }, 4000);
            return;
        }

        await message.delete().catch(() => null);
        return message.channel.send({ content: announceText });
    }

    // 8. Lệnh phát nhạc bằng prefix: miplay hoặc mipl [tên bài hát / link YouTube]
    if (command === 'miplay' || command === 'mipl') {
        if (!isMusicReady()) {
            return message.reply({
                content: '❌ Bot chưa được cài đủ thư viện nghe nhạc.\nAdmin vui lòng chạy trên máy chủ bot:\n`npm install @discordjs/voice yt-dlp-exec opusscript libsodium-wrappers`\n**và** cài binary `yt-dlp` (xem https://github.com/yt-dlp/yt-dlp#installation), sau đó khởi động lại bot.',
                allowedMentions: { repliedUser: false }
            });
        }

        const voiceChannel = message.member.voice?.channel;
        if (!voiceChannel) {
            return message.reply({ content: '❌ Bạn cần vào một kênh thoại trước khi dùng lệnh này.', allowedMentions: { repliedUser: false } });
        }

        const botPerms = voiceChannel.permissionsFor(message.guild.members.me);
        if (!botPerms?.has(PermissionFlagsBits.Connect) || !botPerms?.has(PermissionFlagsBits.Speak)) {
            return message.reply({ content: '❌ Bot không có quyền **Kết nối** hoặc **Nói** trong kênh thoại này.', allowedMentions: { repliedUser: false } });
        }

        const query = message.content.slice(args[0].length).trim();
        if (!query) {
            return message.reply({
                content: `❌ Vui lòng nhập tên bài hát hoặc link YouTube!\nCú pháp: \`${command} [tên bài hát / link]\``,
                allowedMentions: { repliedUser: false }
            });
        }

        const statusMsg = await message.reply({ content: `🔎 Đang tìm: **${query}**...`, allowedMentions: { repliedUser: false } }).catch(() => null);

        let track;
        try {
            track = await searchYoutube(query);
        } catch (err) {
            console.error('❌ [Music] Lỗi tìm kiếm (prefix):', err.message);
            const msg = err.code === 'RESTRICTED_VIDEO'
                ? '🔞 Video này đang **riêng tư** hoặc **bị giới hạn độ tuổi**, bot không thể phát. Vui lòng thử link/từ khóa khác.'
                : '❌ Không thể tìm bài hát này (link có thể bị lỗi, riêng tư hoặc bị chặn độ tuổi).';
            if (statusMsg) statusMsg.edit({ content: msg }).catch(() => null);
            return;
        }
        if (!track) {
            if (statusMsg) statusMsg.edit({ content: `❌ Không tìm thấy kết quả nào phát được cho **"${query}"** (các kết quả gần nhất có thể đều riêng tư hoặc bị giới hạn độ tuổi).` }).catch(() => null);
            return;
        }
        track.requestedBy = message.author.username;

        const { mq, error } = await getOrCreateMusicQueue(message.guild, voiceChannel, message.channel);
        if (error) {
            if (statusMsg) statusMsg.edit({ content: error }).catch(() => null);
            return;
        }

        mq.queue.push(track);

        if (mq.current) {
            if (statusMsg) statusMsg.edit({ content: `✅ Đã thêm vào hàng đợi: **${track.title}** (vị trí #${mq.queue.length})` }).catch(() => null);
        } else {
            if (statusMsg) statusMsg.edit({ content: `🔎 Đang tải: **${track.title}**...` }).catch(() => null);
            await playNextTrack(message.guild.id);
        }
        return;
    }

    // --- B. TÍNH NĂNG TỰ ĐỘNG CÀY XP KHI CHAT BÌNH THƯỜNG ---
    const allowedPrefixes = [
        'midaily','mid','miprofile','mip','micf','micoinflip',
        'migive','mig','micash','mic','misay','mis',
        'mid6','mixucxac','mitx','mitaixiu','mig3','midoanso','mitop','mit',
        'mibc','mibaucua','mikbg','mikeobuagiay','misl','mislot',
        'mixd','mixocdia',
        'mibj','miblackjack',
        'miplay','mipl',
        // Prefix động của server
        `${serverPrefix}daily`,`${serverPrefix}d`,`${serverPrefix}profile`,`${serverPrefix}p`,
        `${serverPrefix}coinflip`,`${serverPrefix}cf`,`${serverPrefix}sl`,
        `${serverPrefix}give`,`${serverPrefix}cash`,`${serverPrefix}c`,
        `${serverPrefix}say`,`${serverPrefix}s`,
        `${serverPrefix}dice`,`${serverPrefix}taixiu`,`${serverPrefix}tx`,
        `${serverPrefix}guess`,`${serverPrefix}top`,`${serverPrefix}t`,
        `${serverPrefix}play`,`${serverPrefix}pl`,
        `${serverPrefix}xocdia`,`${serverPrefix}xd`,
    ];
    if (!allowedPrefixes.includes(command)) {
        const xpGain = Math.floor(Math.random() * 11) + 15;
        const coinGain = 5;

        // Cộng xu chat hàng ngày trước
        const user = getUserData(userId);
        if (userId === OWNER_ID) {
            user.balance = MAX_BALANCE;
        } else {
            user.balance += coinGain;
        }

        // Gọi addXp xử lý thăng cấp, cộng xu thăng cấp và lưu DB nguyên tử
        const xpResult = addXp(userId, xpGain);

        if (xpResult.leveledUp) {
            message.reply({ 
                content: `# 🎉 THĂNG CẤP!\n> Chúc mừng ${message.author} đã đạt **Level ${xpResult.newLevel}**!\n- 💰 Thưởng nóng: **+${xpResult.levelBonus.toLocaleString()} xu**`,
                allowedMentions: { repliedUser: false } 
            }).catch(() => null);
        }
    }
});

// -----------------------------------------------------------------
// 🖥️ GỘP CHUNG SỰ KIỆN XỬ LÝ INTERACTION (SLASH, BUTTON, MODAL)
// -----------------------------------------------------------------
client.on('interactionCreate', async interaction => {
  try {
    const { guild, user, member, channel, customId } = interaction;
    if (!guild) return;
    const gConfig = getGuildConfig(guild.id);

    // Debounce / Cooldown cho Button, Select Menu, Modal Submit để tránh spam click và crash
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        const cooldownKey = `${interaction.user.id}:${interaction.customId || 'interaction'}`;
        if (buttonCooldowns.has(cooldownKey)) {
            return interaction.reply({ content: '⏳ Thao tác quá nhanh! Vui lòng thử lại sau giây lát.', ephemeral: true }).catch(() => null);
        }
        buttonCooldowns.set(cooldownKey, true);
        setTimeout(() => buttonCooldowns.delete(cooldownKey), 1200); // 1.2s cooldown
    }

    // ==========================================
    // 📋 XỬ LÝ PHÂN TRANG & BỘ LỌC KỶ LUẬT (/kyluat)
    // ==========================================
    if (customId && customId.startsWith('kyluat_')) {
        const parts = customId.split('_'); // ['kyluat', action, targetUserId, page, cmdUserId, filterType]
        const action = parts[1];
        const targetUserId = parts[2];
        const page = parseInt(parts[3], 10);
        const cmdUserId = parts[4];
        let filterType = parts[5] || 'all';

        if (user.id !== cmdUserId) {
            return interaction.reply({ content: '❌ Bạn không thể tương tác với bảng của người khác!', ephemeral: true });
        }

        const targetUser = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUser) {
            return interaction.reply({ content: '❌ Không tìm thấy thông tin người dùng này.', ephemeral: true });
        }

        let newPage = page;
        if (action === 'prev') newPage--;
        if (action === 'next') newPage++;
        if (action === 'filter') {
            filterType = interaction.values[0];
            newPage = 1; // Reset to page 1 on filter change
        }

        const pageData = buildDisciplinePage(targetUser, gConfig, newPage, cmdUserId, filterType);
        return interaction.update({ embeds: pageData.embeds, components: pageData.components }).catch(() => null);
    }

    // ==========================================
    // KHỐI 1: XỬ LÝ LỆNH SLASH COMMANDS (/)
    // ==========================================
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        // ==========================================
        // 🛡️ MIDDLEWARE / GUARD CHO CÁC LỆNH GIỚI HẠN
        // ==========================================
        const RESTRICTED_COMMANDS = {
            'resetgame': { ownerOnly: true, supportGuildOnly: true },
            'resetbot': { ownerOnly: true, supportGuildOnly: true },
            'serverlist': { ownerOnly: true },
            'broadcast': { ownerOnly: true },
            'resetbalance': { ownerOnly: true }
        };

        const guard = RESTRICTED_COMMANDS[commandName];
        if (guard) {
            const allowedOwners = [OWNER_ID]; // Hỗ trợ danh sách Owner IDs
            const isOwner = allowedOwners.includes(interaction.user.id);
            const isSupportGuild = interaction.guild.id === HOME_GUILD_ID;

            if (guard.ownerOnly && !isOwner) {
                return interaction.reply({ content: '🚫 Unauthorized', ephemeral: true });
            }
            if (guard.supportGuildOnly && !isSupportGuild) {
                return interaction.reply({ content: '🚫 Unauthorized', ephemeral: true });
            }
        }

        // ==========================================
        // 📬 LỆNH /setupfeedback — Thiết lập kênh góp ý (tách biệt /setup)
        // ==========================================
        if (commandName === 'setupfeedback') {
            await interaction.deferReply({ ephemeral: true });
            const state = options.getString('trạng_thái');

            if (state === 'off') {
                if (!gConfig.isFeedbackSetup) return interaction.editReply({ content: 'ℹ️ Hệ thống góp ý chưa được bật.' });
                gConfig.isFeedbackSetup = false; saveConfig();
                return interaction.editReply({ content: '🔌 Đã **TẮT** hệ thống góp ý.\n(Kênh vẫn còn, dùng `/setupfeedback Bật` để kết nối lại.)' });
            }

            // Tạo hoặc dùng lại kênh góp ý
            let feedbackChan = gConfig.feedbackChannelId ? guild.channels.cache.get(gConfig.feedbackChannelId) : null;
            if (!feedbackChan) {
                feedbackChan = await guild.channels.create({
                    name: '📬-góp-ý',
                    type: ChannelType.GuildText,
                    topic: 'Kênh nhận góp ý từ thành viên — Dùng lệnh /gopy để gửi góp ý.',
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
                    ]
                }).catch(() => null);
                if (!feedbackChan) return interaction.editReply({ content: '❌ Không thể tạo kênh góp ý (kiểm tra quyền Bot).' });
            } else {
                // Cập nhật lại quyền kênh cũ phòng ai đổi
                await feedbackChan.permissionOverwrites.set([
                    { id: guild.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
                ]).catch(() => null);
            }

            gConfig.feedbackChannelId = feedbackChan.id;
            gConfig.isFeedbackSetup = true;
            saveConfig();

            const infoEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📬 KÊNH GÓP Ý')
                .setDescription(
                    'Bạn muốn đóng góp ý kiến cho server?\n\n' +
                    '• Dùng `/gopy` và chọn **Góp ý công khai** (hiển thị tên bạn)\n' +
                    '• Hoặc chọn **Góp ý ẩn danh** để ẩn danh tính\n\n' +
                    '> Mọi góp ý đều được ban quản trị đọc và xem xét.'
                )
                .setTimestamp();

            await clearBotMessages(feedbackChan);
            await feedbackChan.send({ embeds: [infoEmbed] });

            return interaction.editReply({ content: `✅ Đã **BẬT** hệ thống góp ý tại ${feedbackChan}!` });
        }

        // ==========================================
        // 📝 LỆNH /gopy — Gửi góp ý về kênh góp ý
        // ==========================================
        if (commandName === 'gopy') {
            await interaction.deferReply({ ephemeral: true });

            if (!gConfig.isFeedbackSetup || !gConfig.feedbackChannelId) {
                return interaction.editReply({ content: '❌ Server chưa thiết lập kênh góp ý. Hãy nhờ Admin dùng `/setupfeedback`.' });
            }

            const feedbackChan = guild.channels.cache.get(gConfig.feedbackChannelId);
            if (!feedbackChan) {
                return interaction.editReply({ content: '❌ Không tìm thấy kênh góp ý (có thể đã bị xóa). Nhờ Admin chạy lại `/setupfeedback`.' });
            }

            const loai = options.getString('loại');
            const noiDung = options.getString('nội_dung');
            const isAnon = loai === 'anonymous';

            const embed = new EmbedBuilder()
                .setColor(isAnon ? '#95A5A6' : '#3498DB')
                .setTitle(isAnon ? '🔒 Góp Ý Ẩn Danh' : '📢 Góp Ý Công Khai')
                .setDescription(noiDung)
                .setFooter({ text: isAnon ? 'Người gửi: Ẩn danh' : `Người gửi: ${interaction.user.tag}` })
                .setTimestamp();

            if (!isAnon) embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

            await feedbackChan.send({ embeds: [embed] });

            const typeLabel = isAnon ? 'ẩn danh' : 'công khai';
            return interaction.editReply({ content: `✅ **Đã gửi góp ý ${typeLabel} thành công!**\nBan quản trị sẽ đọc và xem xét góp ý của bạn.` });
        }

        // ==========================================
        // 🔧 LỆNH /setprefix — Thay đổi tiền tố prefix cho server
        // ==========================================
        // ==========================================
        // 🔗 LỆNH /invite — Tạo link mời vĩnh viễn
        // ==========================================
        if (commandName === 'invite') {
            await interaction.deferReply({ ephemeral: false });

            // Ưu tiên kênh chính, fallback về kênh đầu tiên có quyền tạo invite
            const targetChan = guild.channels.cache.find(c =>
                c.type === ChannelType.GuildText &&
                c.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)
            );

            if (!targetChan) return interaction.editReply({ content: '❌ Bot không có quyền tạo invite trong bất kỳ kênh nào.' });

            const invite = await targetChan.createInvite({ maxAge: 0, maxUses: 0, unique: false }).catch(() => null);
            if (!invite) return interaction.editReply({ content: '❌ Không thể tạo link mời (kiểm tra quyền **Create Instant Invite** của Bot).' });

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(`🔗 Link mời vĩnh viễn — ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }) || null)
                .setDescription(`**Link:** https://discord.gg/${invite.code}\n\n• ♾️ Không giới hạn thời gian\n• ♾️ Không giới hạn lượt dùng`)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // ==========================================
        // 🎉 LỆNH /setupgiveaway — Tạo phòng giveaway
        // ==========================================
        if (commandName === 'setupgiveaway') {
            await interaction.deferReply({ ephemeral: true });
            const state = options.getString('trạng_thái');

            if (state === 'off') {
                if (!gConfig.isGiveawaySetup) return interaction.editReply({ content: 'ℹ️ Hệ thống giveaway chưa được bật.' });
                gConfig.isGiveawaySetup = false; saveConfig();
                return interaction.editReply({ content: '🔌 Đã **TẮT** hệ thống giveaway.\n(Kênh vẫn giữ nguyên, dùng `/setupgiveaway Bật` để kết nối lại.)' });
            }

            let giveChan = gConfig.giveawayChannelId ? guild.channels.cache.get(gConfig.giveawayChannelId) : null;
            if (!giveChan) {
                giveChan = await guild.channels.create({
                    name: '🎉-giveaway',
                    type: ChannelType.GuildText,
                    topic: 'Kênh Giveaway — Xem và tham gia các sự kiện tặng quà tại đây!',
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
                    ]
                }).catch(() => null);
                if (!giveChan) return interaction.editReply({ content: '❌ Không thể tạo kênh giveaway (kiểm tra quyền Bot).' });
            } else {
                await giveChan.permissionOverwrites.set([
                    { id: guild.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
                ]).catch(() => null);
            }

            gConfig.giveawayChannelId = giveChan.id;
            gConfig.isGiveawaySetup = true;
            if (!gConfig.giveaways) gConfig.giveaways = {};
            saveConfig();

            const infoEmbed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('🎉 KÊNH GIVEAWAY')
                .setDescription('Theo dõi kênh này để không bỏ lỡ các sự kiện tặng quà!\n\nAdmin sẽ tạo giveaway bằng lệnh `/giveawaycreate`.')
                .setTimestamp();

            await clearBotMessages(giveChan);
            await giveChan.send({ embeds: [infoEmbed] });

            return interaction.editReply({ content: `✅ Đã **BẬT** hệ thống giveaway tại ${giveChan}!` });
        }

        // ==========================================
        // 🔊 LỆNH /setupvoiceroom — Hệ thống Voice Room tự động
        // ==========================================
        if (commandName === 'setupvoiceroom') {
            await interaction.deferReply({ ephemeral: true });
            const state = options.getString('trạng_thái');

            if (state === 'off') {
                if (!gConfig.isVoiceRoomSetup) return interaction.editReply({ content: 'ℹ️ Hệ thống Voice Room chưa được bật.' });
                gConfig.isVoiceRoomSetup = false; saveConfig();
                return interaction.editReply({ content: '🔌 Đã **TẮT** hệ thống Voice Room.\n(Kênh vẫn giữ nguyên, dùng `/setupvoiceroom Bật` để bật lại. Vào kênh kích hoạt sẽ không còn tự tạo phòng mới cho tới khi bật lại; các phòng riêng cũ vẫn tự dọn khi trống.)' });
            }

            let vrCategory = gConfig.voiceRoomCategoryId ? guild.channels.cache.get(gConfig.voiceRoomCategoryId) : null;
            if (!vrCategory) {
                vrCategory = await guild.channels.create({ name: '🔊 VOICE ROOM', type: ChannelType.GuildCategory }).catch(() => null);
                if (!vrCategory) return interaction.editReply({ content: '❌ Không thể tạo danh mục Voice Room (kiểm tra quyền Bot).' });
            }
            gConfig.voiceRoomCategoryId = vrCategory.id;

            let triggerChan = gConfig.voiceRoomTriggerId ? guild.channels.cache.get(gConfig.voiceRoomTriggerId) : null;
            if (!triggerChan) {
                triggerChan = await guild.channels.create({
                    name: '➕ Tạo Phòng Voice',
                    type: ChannelType.GuildVoice,
                    parent: vrCategory.id
                }).catch(() => null);
                if (!triggerChan) return interaction.editReply({ content: '❌ Không thể tạo kênh thoại kích hoạt (kiểm tra quyền Bot).' });
            } else if (triggerChan.parentId !== vrCategory.id) {
                await triggerChan.setParent(vrCategory.id).catch(() => null);
            }
            gConfig.voiceRoomTriggerId = triggerChan.id;

            let controlChan = gConfig.voiceRoomControlChannelId ? guild.channels.cache.get(gConfig.voiceRoomControlChannelId) : null;
            const controlPerms = [
                { id: guild.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
            ];
            if (!controlChan) {
                controlChan = await guild.channels.create({
                    name: '🔧-quản-lý-voice',
                    type: ChannelType.GuildText,
                    parent: vrCategory.id,
                    topic: 'Bấm nút bên dưới để quản lý phòng Voice riêng của bạn.',
                    permissionOverwrites: controlPerms
                }).catch(() => null);
                if (!controlChan) return interaction.editReply({ content: '❌ Không thể tạo kênh điều khiển (kiểm tra quyền Bot).' });
            } else {
                if (controlChan.parentId !== vrCategory.id) await controlChan.setParent(vrCategory.id).catch(() => null);
                await controlChan.permissionOverwrites.set(controlPerms).catch(() => null);
            }
            gConfig.voiceRoomControlChannelId = controlChan.id;
            gConfig.isVoiceRoomSetup = true;
            if (!gConfig.voiceRooms) gConfig.voiceRooms = {};
            saveConfig();

            const vrEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🔊 HỆ THỐNG PHÒNG VOICE RIÊNG')
                .setDescription(
                    `👉 Vào kênh thoại ${triggerChan} để **tự động được tạo một phòng voice riêng** mang tên bạn.\n\n` +
                    `⚙️ Sau khi có phòng riêng, hãy quay lại kênh này và bấm nút **"Quản Lý Phòng Của Tôi"** để đổi tên, giới hạn thành viên, khóa/ẩn phòng, kick hoặc chuyển quyền chủ phòng.\n\n` +
                    `🗑️ Phòng sẽ **tự động bị xóa** khi không còn ai ở bên trong.`
                )
                .setFooter({ text: 'Voice Room System — Tự động & riêng tư' });

            const vrRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('voiceroom_settings_btn').setLabel('⚙️ Quản Lý Phòng Của Tôi').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL(SUPPORT_LINK)
            );

            await clearBotMessages(controlChan);
            await controlChan.send({ embeds: [vrEmbed], components: [vrRow] });

            return interaction.editReply({ content: `✅ Đã **BẬT** hệ thống Voice Room!\n• Vào thoại: ${triggerChan}\n• Điều khiển: ${controlChan}` });
        }

        // ==========================================
        // 🎁 LỆNH /giveawaycreate — Tạo giveaway mới
        // ==========================================
        if (commandName === 'giveawaycreate') {
            await interaction.deferReply({ ephemeral: true });

            if (!gConfig.isGiveawaySetup || !gConfig.giveawayChannelId) {
                return interaction.editReply({ content: '❌ Chưa thiết lập kênh giveaway. Dùng `/setupgiveaway Bật` trước.' });
            }

            const giveChan = guild.channels.cache.get(gConfig.giveawayChannelId);
            if (!giveChan) return interaction.editReply({ content: '❌ Không tìm thấy kênh giveaway (có thể đã bị xóa).' });

            const title = options.getString('tiêu_đề');
            const prize = options.getString('phần_thưởng');
            const duration = options.getInteger('thời_gian');
            const unit = options.getString('đơn_vị');
            const winners = options.getInteger('số_người_thắng') || 1;

            const unitMs = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 };
            const unitLabel = { minutes: 'phút', hours: 'giờ', days: 'ngày' };
            const endTime = Date.now() + duration * unitMs[unit];

            const gData = {
                title, prize, winners,
                endTime,
                createdBy: interaction.user.username,
                participants: [],
                ended: false
            };

            // Tính thời gian còn lại ban đầu
            const totalSec = duration * (unitMs[unit] / 1000);
            const d = Math.floor(totalSec / 86400);
            const h = Math.floor((totalSec % 86400) / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = Math.floor(totalSec % 60);
            const initTimeLeft = [d && `${d} ngày`, h && `${h} giờ`, m && `${m} phút`, s && `${s} giây`].filter(Boolean).join(' ');

            const initEmbed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle(`🎉 ${title}`)
                .setDescription(
                    `**🎁 Phần thưởng:** ${prize}\n` +
                    `**👥 Số người thắng:** ${winners}\n` +
                    `**📅 Kết thúc lúc:** ${formatTimeVN(endTime)}\n\n` +
                    `⏳ **Thời gian còn lại:** \`${initTimeLeft}\`\n👥 **Đang tham dự:** 0 người`
                )
                .setFooter({ text: `Bấm 🎉 Tham Gia để tham dự! • Tạo bởi ${interaction.user.username}` })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('giveaway_join_PLACEHOLDER').setLabel('🎉 Tham Gia (0)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('giveaway_end_PLACEHOLDER').setLabel('⏹️ End sớm').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
            );

            const sent = await giveChan.send({ embeds: [initEmbed], components: [row] }).catch(() => null);
            if (!sent) return interaction.editReply({ content: '❌ Bot không thể gửi vào kênh giveaway.' });

            // Cập nhật customId nút với msgId thực
            const realRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`giveaway_join_${sent.id}`).setLabel('🎉 Tham Gia (0)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`giveaway_end_${sent.id}`).setLabel('⏹️ End sớm').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
            );
            await sent.edit({ components: [realRow] }).catch(() => null);

            // Lưu vào config
            if (!gConfig.giveaways) gConfig.giveaways = {};
            gConfig.giveaways[sent.id] = gData;
            saveConfig();

            // Timer cập nhật đếm ngược mỗi 30 giây
            const intervalId = setInterval(async () => {
                const g = gConfig.giveaways?.[sent.id];
                if (!g || g.ended) { clearInterval(intervalId); giveawayTimers.delete(sent.id); return; }

                if (Date.now() >= g.endTime) {
                    clearInterval(intervalId);
                    giveawayTimers.delete(sent.id);
                    g.ended = true;
                    saveConfig();
                    await updateGiveawayEmbed(giveChan, sent.id, g, true);

                    // Chọn người thắng ngẫu nhiên
                    const parts = g.participants || [];
                    if (parts.length === 0) {
                        await giveChan.send({ content: `🎉 **Giveaway "${g.title}" đã kết thúc!**\n😔 Không có ai tham gia.` }).catch(() => null);
                    } else {
                        const shuffled = [...parts].sort(() => Math.random() - 0.5);
                        const winnerIds = shuffled.slice(0, Math.min(g.winners, parts.length));
                        const winnerMentions = winnerIds.map(id => `<@${id}>`).join(', ');
                        await giveChan.send({ content: `🎉 **Giveaway "${g.title}" đã kết thúc!**\n🏆 Người thắng: ${winnerMentions}\n🎁 Phần thưởng: **${g.prize}**\n\nChúc mừng! 🎊` }).catch(() => null);
                    }
                } else {
                    await updateGiveawayEmbed(giveChan, sent.id, g, false);
                }
            }, 30_000);

            giveawayTimers.set(sent.id, intervalId);

            return interaction.editReply({ content: `✅ Đã tạo Giveaway **"${title}"** trong ${giveChan}!\n⏱️ Kết thúc sau **${duration} ${unitLabel[unit]}** (lúc ${formatTimeVN(endTime)})` });
        }

        // ==========================================
        // 🎰 LỆNH /resetgame — Chỉ Owner, chỉ tại server hỗ trợ
        // ==========================================
        if (commandName === 'resetgame') {
            await interaction.deferReply({ ephemeral: true });
            blackjackGames.clear();
            return interaction.editReply({ content: '✅ Đã reset toàn bộ trạng thái trò chơi (Blackjack) thành công!' });
        }

        // ==========================================
        // 🔄 LỆNH /resetbot — Chỉ Owner, chỉ tại server cố định
        // ==========================================
        if (commandName === 'resetbot') {
            // Chỉ OWNER mới dùng được
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '🚫 Lệnh này chỉ dành riêng cho Owner của bot.', ephemeral: true });
            }

            // Chỉ chạy được tại HOME_GUILD (server có link hỗ trợ cố định)
            if (guild.id !== HOME_GUILD_ID) {
                return interaction.reply({ content: `🚫 Lệnh này chỉ có thể dùng tại server hỗ trợ cố định.\n🔗 ${SUPPORT_LINK}`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const report = [];
            let totalConfigFixed = 0;  // Số server được bổ sung field config còn thiếu
            let totalIdFixed    = 0;   // Số kênh được cập nhật lại ID từ tên
            let totalMissingWarn = 0;  // Số server nhắc thiếu kênh
            let totalRoleWarn   = 0;   // Số server bị vô hiệu hóa xác thực do mất vai trò
            let totalRemoved    = 0;   // Số server bị xóa khỏi config vì bot đã bị kick/rời

            // ─────────────────────────────────────────────────────────
            // BƯỚC 1: Đồng bộ — đảm bảo MỌI server bot đang tham gia
            //         đều có entry trong config.guilds (sync mới vào)
            // ─────────────────────────────────────────────────────────
            for (const g of client.guilds.cache.values()) {
                if (!config.guilds[g.id]) {
                    getGuildConfig(g.id); // Tự tạo entry mặc định + saveConfig bên trong
                    report.push(`🆕 \`${g.name}\` (\`${g.id}\`) — Khởi tạo config mới (bot đã vào nhưng chưa có entry)`);
                    totalConfigFixed++;
                }
            }

            // ─────────────────────────────────────────────────────────
            // BƯỚC 2: Quét từng server trong config
            // ─────────────────────────────────────────────────────────

            // Mapping tên kênh cố định của bot -> field config tương ứng
            // Dùng để tự phục hồi ID khi kênh bị xóa-tạo lại hoặc ID bị lệch
            const CHANNEL_NAME_MAP = [
                // [ tên kênh (lowercase, khớp includes), field config, loại kênh ]
                { name: 'welcome',           field: 'welcomeChannelId',          type: ChannelType.GuildText },
                { name: 'hỗ-trợ-ticket',     field: 'ticketControlChannelId',    type: ChannelType.GuildText },
                { name: 'lưu-trữ-ticket',    field: 'ticketArchiveChannelId',    type: ChannelType.GuildText },
                { name: 'chấm-công',         field: 'attendanceChannelId',       type: ChannelType.GuildText, exclude: ['lịch-sử', 'báo-cáo'] },
                { name: 'lịch-sử-chấm-công', field: 'logChannelId',              type: ChannelType.GuildText },
                { name: 'báo-cáo-tuần',      field: 'weeklyReportChannelId',     type: ChannelType.GuildText },
                { name: 'xác-thực',          field: 'verifyChannelId',           type: ChannelType.GuildText },
                { name: 'feedback',          field: 'feedbackChannelId',         type: ChannelType.GuildText },
                { name: 'giveaway',          field: 'giveawayChannelId',         type: ChannelType.GuildText },
                { name: 'pick-roles',        field: 'pickRolesChannelId',        type: ChannelType.GuildText },
                { name: 'voice room',        field: 'voiceRoomCategoryId',       type: ChannelType.GuildCategory },
                { name: 'tạo phòng voice',   field: 'voiceRoomTriggerId',        type: ChannelType.GuildVoice },
                { name: 'quản-lý-voice',     field: 'voiceRoomControlChannelId', type: ChannelType.GuildText },
                { name: 'nhật-ký-quản-trị',  field: 'modLogChannelId',           type: ChannelType.GuildText },
            ];

            // Field config mặc định cần đảm bảo tồn tại trên mọi server
            const CONFIG_DEFAULTS = {
                verifyDailyMode: false,
                verifyDailyMembers: {},
                reactionRoles: {},
                feedbackChannelId: '',
                isFeedbackSetup: false,
                prefix: 'mi',
                giveawayChannelId: '',
                isGiveawaySetup: false,
                giveaways: {},
                pickRolesChannelId: ''
            };

            const guildIdsToRemove = [];

            for (const guildId in config.guilds) {
                const gCfg = config.guilds[guildId];
                const targetGuild = client.guilds.cache.get(guildId);

                if (!targetGuild) {
                    guildIdsToRemove.push(guildId);
                    report.push(`🗑️ \`${guildId}\` — Bot không còn ở server này (đã bị kick/rời) → **đã xóa toàn bộ config**`);
                    continue;
                }

                const guildReport = [];

                // ── 2a. Bổ sung field mặc định còn thiếu trong config ──
                let patched = 0;
                for (const [key, val] of Object.entries(CONFIG_DEFAULTS)) {
                    if (gCfg[key] === undefined) { gCfg[key] = val; patched++; }
                }
                if (patched > 0) {
                    totalConfigFixed++;
                    guildReport.push(`  🛠️ Bổ sung **${patched}** field config còn thiếu`);
                }

                // ── 2b. Quét kênh trùng tên → cập nhật ID cũ bị lệch ──
                for (const map of CHANNEL_NAME_MAP) {
                    const savedId = gCfg[map.field];

                    // Tìm kênh thực tế khớp tên trong server
                    const found = targetGuild.channels.cache.find(ch => {
                        if (ch.type !== map.type) return false;
                        if (!ch.name.toLowerCase().includes(map.name)) return false;
                        if (map.exclude && map.exclude.some(ex => ch.name.toLowerCase().includes(ex))) return false;
                        return true;
                    });

                    if (!found) continue; // Kênh chưa có trong server -> bỏ qua (sẽ nhắc ở bước 2c)

                    if (savedId !== found.id) {
                        gCfg[map.field] = found.id;
                        totalIdFixed++;
                        guildReport.push(`  🔄 \`${map.field}\`: \`${savedId || 'trống'}\` → \`${found.id}\` (\`#${found.name}\`)`);
                    }
                }

                // ── 2c. Nhắc server thiếu kênh quan trọng chưa được tạo ──
                const missingChannels = [];
                for (const map of CHANNEL_NAME_MAP) {
                    // Chỉ kiểm tra những kênh cốt lõi (bỏ qua optional như giveaway, feedback, pick-roles)
                    const coreFields = ['welcomeChannelId','ticketControlChannelId','ticketArchiveChannelId','attendanceChannelId','logChannelId','weeklyReportChannelId'];
                    if (!coreFields.includes(map.field)) continue;

                    const id = gCfg[map.field];
                    const exists = id && targetGuild.channels.cache.has(id);
                    const foundByName = targetGuild.channels.cache.find(ch => {
                        if (ch.type !== map.type) return false;
                        if (!ch.name.toLowerCase().includes(map.name)) return false;
                        if (map.exclude && map.exclude.some(ex => ch.name.toLowerCase().includes(ex))) return false;
                        return true;
                    });
                    if (!exists && !foundByName) missingChannels.push(`\`#${map.name}\``);
                }

                if (missingChannels.length > 0) {
                    totalMissingWarn++;
                    guildReport.push(`  ⚠️ Thiếu kênh: ${missingChannels.join(', ')} — nhắc admin dùng \`/setup\``);

                    // Gửi nhắc nhở trực tiếp vào server đó
                    const topRoles = targetGuild.roles.cache
                        .filter(r => !r.managed && r.id !== targetGuild.id)
                        .sort((a, b) => b.position - a.position)
                        .first(3);
                    const mentions = topRoles.map(r => `<@&${r.id}>`).join(' ');
                    const sysChannel = targetGuild.systemChannel || targetGuild.channels.cache.find(c =>
                        c.type === ChannelType.GuildText &&
                        c.permissionsFor(targetGuild.members.me)?.has(PermissionFlagsBits.SendMessages)
                    );
                    if (sysChannel) {
                        await sysChannel.send({
                            content: `${mentions}\n⚠️ **Server đang thiếu các kênh: ${missingChannels.join(', ')}**\nAdmin vui lòng dùng lệnh \`/setup\` để tạo lại các kênh còn thiếu.`
                        }).catch(() => null);
                    }
                }

                // ── 2d. Kiểm tra vai trò xác thực còn tồn tại không (trước khi cập nhật lại config) ──
                if (gCfg.isVerifySetup) {
                    let unverifiedRole = gCfg.unverifiedRoleId ? targetGuild.roles.cache.get(gCfg.unverifiedRoleId) : null;
                    let verifiedRole = gCfg.verifiedRoleId ? targetGuild.roles.cache.get(gCfg.verifiedRoleId) : null;

                    // Vai trò bị lệch/mất ID (ví dụ xóa nhầm rồi tạo lại cùng tên) → thử khôi phục
                    // lại theo TÊN trước khi kết luận là mất hẳn. Nhờ vậy /setupverify sau này sẽ
                    // KHÔNG tạo vai trò mới — giữ nguyên đúng vai trò cũ và toàn bộ phân quyền kênh.
                    if (!unverifiedRole) {
                        const byName = targetGuild.roles.cache.find(r => r.name.toLowerCase().includes('chưa xác thực'));
                        if (byName) {
                            gCfg.unverifiedRoleId = byName.id; unverifiedRole = byName; totalIdFixed++;
                            guildReport.push(`  🔄 Khôi phục vai trò \`Chưa Xác Thực\` theo tên → \`${byName.id}\``);
                        }
                    }
                    if (!verifiedRole) {
                        const byName = targetGuild.roles.cache.find(r => r.name.toLowerCase().includes('đã xác thực'));
                        if (byName) {
                            gCfg.verifiedRoleId = byName.id; verifiedRole = byName; totalIdFixed++;
                            guildReport.push(`  🔄 Khôi phục vai trò \`Đã Xác Thực\` theo tên → \`${byName.id}\``);
                        }
                    }

                    const missingRoles = [];
                    if (!unverifiedRole) missingRoles.push('`Chưa Xác Thực`');
                    if (!verifiedRole) missingRoles.push('`Đã Xác Thực`');

                    if (missingRoles.length > 0) {
                        totalRoleWarn++;
                        guildReport.push(`  🛡️⚠️ Thiếu vai trò xác thực: ${missingRoles.join(', ')} — vô hiệu hóa xác thực, nhắc admin dùng \`/setup\` để tạo lại`);

                        // Vai trò đã bị xóa khỏi server (không tìm được cả theo ID lẫn theo tên)
                        // -> tắt xác thực để tránh lỗi khi bot gán vai trò không tồn tại
                        gCfg.isVerifySetup = false;
                    }
                }

                if (!gCfg.isSetupCompleted) {
                    guildReport.push(`  📋 Server chưa hoàn thành \`/setup\``);
                }

                if (guildReport.length > 0) {
                    report.push(`\n**${targetGuild.name}**`);
                    report.push(...guildReport);
                }
            }

            // ── Dọn hẳn config của các server bot đã bị kick/rời ──
            for (const goneId of guildIdsToRemove) {
                delete config.guilds[goneId];
                totalRemoved++;
            }

            saveConfig();

            // ─────────────────────────────────────────────────────────
            // BƯỚC 3: Gửi lại toàn bộ nút bấm (Ticket / Chấm Công / Xác Thực)
            //         cho mọi server đã hoàn thành /setup
            // ─────────────────────────────────────────────────────────
            let totalRebuilt = 0;
            for (const guildId in config.guilds) {
                const gCfg = config.guilds[guildId];
                if (!gCfg.isSetupCompleted) continue;
                const targetGuild = client.guilds.cache.get(guildId);
                if (!targetGuild) continue;

                const rebuildLog = await rebuildGuildPanels(targetGuild, gCfg);
                totalRebuilt++;
                if (rebuildLog.length > 0) {
                    report.push(`\n🔁 **[Rebuild] ${targetGuild.name}**`);
                    report.push(...rebuildLog);
                }
            }

            // ─────────────────────────────────────────────────────────
            // TỔNG KẾT
            // ─────────────────────────────────────────────────────────
            const totalGuilds   = client.guilds.cache.size;
            const totalInConfig = Object.keys(config.guilds).length;

            const summary = [
                `🔄 **Reset Bot hoàn tất!**`,
                `📊 Tổng server bot đang có mặt: **${totalGuilds}**`,
                `📂 Tổng entry trong config: **${totalInConfig}**`,
                `🛠️ Config được vá/bổ sung: **${totalConfigFixed} server**`,
                `🔄 ID kênh được cập nhật lại: **${totalIdFixed} kênh**`,
                `📢 Server được nhắc thiếu kênh: **${totalMissingWarn} server**`,
                `🛡️ Server bị vô hiệu hóa xác thực do mất vai trò: **${totalRoleWarn} server**`,
                `🗑️ Server bị xóa khỏi config (bot đã bị kick/rời): **${totalRemoved} server**`,
                `🔁 Server được gửi lại nút bấm: **${totalRebuilt} server**`,
                ``,
                report.length ? report.slice(0, 50).join('\n') : '✅ Không phát hiện vấn đề nào.',
                report.length > 50 ? `\n...và ${report.length - 50} mục khác (xem log console)` : ''
            ].join('\n');

            return interaction.editReply({ content: summary.slice(0, 2000) });
        }

        // ==========================================
        // 🌐 LỆNH /serverlist — Chỉ Owner, chỉ tại server cố định
        // Xem toàn bộ server bot đang tham gia kèm link mời
        // ==========================================
        if (commandName === 'serverlist') {
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '🚫 Lệnh này chỉ dành riêng cho Owner của bot.', ephemeral: true });
            }
            if (guild.id !== HOME_GUILD_ID) {
                return interaction.reply({ content: `🚫 Lệnh này chỉ có thể dùng tại server hỗ trợ cố định.\n🔗 ${SUPPORT_LINK}`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const guildsList = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
            const lines = [];

            for (const g of guildsList) {
                let inviteUrl = '_Không thể tạo link mời (thiếu quyền hoặc không có kênh phù hợp)_';
                try {
                    const me = g.members.me;
                    const targetChannel = g.channels.cache.find(c =>
                        c.type === ChannelType.GuildText && me &&
                        c.permissionsFor(me)?.has(PermissionFlagsBits.CreateInstantInvite) &&
                        c.permissionsFor(me)?.has(PermissionFlagsBits.ViewChannel)
                    );
                    if (targetChannel) {
                        const invite = await targetChannel.createInvite({ maxAge: 0, maxUses: 0, unique: false, reason: `Owner (${interaction.user.tag}) xem danh sách server` });
                        inviteUrl = `https://discord.gg/${invite.code}`;
                    }
                } catch { /* Giữ nguyên thông báo "Không thể tạo link mời" */ }

                lines.push(`**${g.name}**\n🆔 \`${g.id}\` · 👥 ${g.memberCount.toLocaleString()} thành viên\n🔗 ${inviteUrl}`);
            }

            const header = `🌐 **DANH SÁCH SERVER — MI BOT (${guildsList.length} server)**\n\n`;
            const chunks = [];
            let current = header;
            for (const line of lines) {
                if ((current + line + '\n\n').length > 1900) {
                    chunks.push(current);
                    current = '';
                }
                current += line + '\n\n';
            }
            if (current.trim()) chunks.push(current);

            await interaction.editReply({ content: chunks[0] || 'ℹ️ Bot chưa tham gia server nào.' });
            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i], ephemeral: true }).catch(() => null);
            }
            return;
        }

        // ==========================================
        // 📢 LỆNH /broadcast — Chỉ Owner, chỉ tại server cố định
        // Gửi thông báo tới tất cả server bot đang tham gia
        // ==========================================
        if (commandName === 'broadcast') {
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '🚫 Lệnh này chỉ dành riêng cho Owner của bot.', ephemeral: true });
            }
            if (guild.id !== HOME_GUILD_ID) {
                return interaction.reply({ content: `🚫 Lệnh này chỉ có thể dùng tại server hỗ trợ cố định.\n🔗 ${SUPPORT_LINK}`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const bContent = options.getString('noi_dung');
            const bTitle = options.getString('tieu_de') || '📢 Thông Báo Từ MI BOT';

            const broadcastEmbed = new EmbedBuilder()
                .setColor('#8C7CF0')
                .setTitle(bTitle)
                .setDescription(bContent)
                .setFooter({ text: 'Thông báo hệ thống từ đội ngũ phát triển MI BOT' })
                .setTimestamp();

            const guildsList = [...client.guilds.cache.values()];
            let sentCount = 0;
            const failedGuilds = [];

            for (const g of guildsList) {
                try {
                    const me = g.members.me;
                    const canSend = (c) => c && me && c.type === ChannelType.GuildText &&
                        c.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages) &&
                        c.permissionsFor(me)?.has(PermissionFlagsBits.ViewChannel) &&
                        c.permissionsFor(me)?.has(PermissionFlagsBits.EmbedLinks);

                    const targetChannel = canSend(g.systemChannel)
                        ? g.systemChannel
                        : g.channels.cache.find(canSend);

                    if (!targetChannel) throw new Error('Không tìm thấy kênh phù hợp');
                    await targetChannel.send({ embeds: [broadcastEmbed] });
                    sentCount++;
                } catch {
                    failedGuilds.push(g.name);
                }
            }

            let summary = `📢 **Đã gửi thông báo tới ${sentCount}/${guildsList.length} server.**`;
            if (failedGuilds.length > 0) {
                summary += `\n⚠️ Thất bại tại **${failedGuilds.length}** server (thiếu quyền hoặc không có kênh phù hợp):\n` +
                    failedGuilds.slice(0, 15).map(n => `• ${n}`).join('\n') +
                    (failedGuilds.length > 15 ? `\n...và ${failedGuilds.length - 15} server khác` : '');
            }

            return interaction.editReply({ content: summary.slice(0, 2000) });
        }

        if (commandName === 'setprefix') {
            await interaction.deferReply({ ephemeral: true });

            const newPrefix = options.getString('prefix').toLowerCase().replace(/\s+/g, '');
            if (!newPrefix || newPrefix.length > 5) {
                return interaction.editReply({ content: '❌ Tiền tố không hợp lệ! Phải từ 1-5 ký tự, không dấu cách.' });
            }

            const oldPrefix = gConfig.prefix || 'mi';
            gConfig.prefix = newPrefix;
            saveConfig();

            return interaction.editReply({
                content: `✅ **Đã thay đổi tiền tố lệnh!**\n• Cũ: \`${oldPrefix}\`\n• Mới: \`${newPrefix}\`\n\nVí dụ: \`${newPrefix}daily\`, \`${newPrefix}top\`, \`${newPrefix}cash\``
            });
        }

        // ==========================================
        // 💰 LỆNH ADMIN: RESET XU NGƯỜI DÙNG
        // ==========================================
        if (commandName === 'resetbalance') {
            await interaction.deferReply({ ephemeral: true });

            // Chặn tất cả trừ OWNER — kể cả admin thấy lệnh nhờ cache
            if (interaction.user.id !== OWNER_ID) {
                return interaction.editReply({ content: '🚫 Bạn không có quyền dùng lệnh này.' });
            }

            const action = options.getString('action');
            const amount = options.getInteger('amount') || 0;
            const ownerData = getUserData(OWNER_ID);

            if (action === 'add') {
                if (amount <= 0) return interaction.editReply({ content: '❌ Nhập số xu cần thêm.' });
                ownerData.balance = Math.min(MAX_BALANCE, ownerData.balance + amount);
                saveEconomy();
                return interaction.editReply({ content: `✅ Đã thêm **+${amount.toLocaleString()} xu**.\nSố dư hiện tại: **${ownerData.balance.toLocaleString()} xu**` });
            }

            if (action === 'max') {
                ownerData.balance = MAX_BALANCE;
                saveEconomy();
                return interaction.editReply({ content: `✅ Đã đặt xu về mức tối đa: **${MAX_BALANCE.toLocaleString()} xu**` });
            }

            if (action === 'resetuser') {
                const targetUser = options.getUser('người_dùng');
                if (!targetUser) return interaction.editReply({ content: '❌ Vui lòng tag hoặc chọn người dùng cần reset xu.' });
                if (targetUser.id === OWNER_ID) return interaction.editReply({ content: '⚠️ Không thể reset xu của chính mình qua lệnh này.' });

                if (!economyData[targetUser.id]) {
                    return interaction.editReply({ content: `❌ **${targetUser.username}** chưa có dữ liệu xu nào trong hệ thống.` });
                }
                const oldBalance = economyData[targetUser.id].balance;
                economyData[targetUser.id].balance = 0;
                saveEconomy();
                return interaction.editReply({ content: `✅ Đã reset xu của **${targetUser.username}** (${targetUser.id})\n💰 **${oldBalance.toLocaleString()} xu** → **0 xu**` });
            }

            if (action === 'resetall') {
                let count = 0;
                for (const uid in economyData) {
                    if (uid === OWNER_ID) continue;
                    economyData[uid].balance = 0;
                    count++;
                }
                saveEconomy();
                return interaction.editReply({ content: `✅ Đã xóa xu của **${count} người dùng**.\n(Xu của Owner được bảo toàn.)` });
            }
        }

        // ==========================================
        // 📝 LỆNH /sendembed — Tạo và gửi embed tùy chỉnh
        // ==========================================
        if (commandName === 'sendembed') {
            await interaction.deferReply({ ephemeral: true });

            const targetChannel = options.getChannel('kênh');
            const title = options.getString('tiêu_đề');
            const rawContent = options.getString('nội_dung').replace(/\\n/g, '\n');
            const color = options.getString('màu') || '#5865F2';
            const thumbnail = options.getString('ảnh_nhỏ');
            const image = options.getString('ảnh_lớn');
            const footer = options.getString('footer');
            const addSupport = true; // Nút hỗ trợ luôn bắt buộc

            // Validate màu HEX
            const hexColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#5865F2';

            const embed = new EmbedBuilder()
                .setColor(hexColor)
                .setTitle(title)
                .setDescription(rawContent)
                .setTimestamp();

            if (thumbnail) embed.setThumbnail(thumbnail);
            if (image) embed.setImage(image);
            if (footer) embed.setFooter({ text: footer });

            // Xây dựng hàng nút bấm (tối đa 3 nút custom + 1 nút hỗ trợ cố định)
            const buttons = [];

            for (let i = 1; i <= 3; i++) {
                const btnName = options.getString(`nút${i}_tên`);
                const btnLink = options.getString(`nút${i}_link`);
                if (btnName && btnLink) {
                    buttons.push(
                        new ButtonBuilder().setLabel(btnName).setStyle(ButtonStyle.Link).setURL(btnLink)
                    );
                }
            }

            if (addSupport) {
                buttons.push(
                    new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7')
                );
            }

            const components = buttons.length > 0
                ? [new ActionRowBuilder().addComponents(buttons)]
                : [];

            const sent = await targetChannel.send({ embeds: [embed], components }).catch(() => null);
            if (!sent) return interaction.editReply({ content: '❌ Bot không thể gửi vào kênh đó (Kiểm tra quyền).' });

            return interaction.editReply({ content: `✅ Đã gửi embed vào ${targetChannel}!` });
        }

        // ==========================================
        // 🖼️ LỆNH /avatar — 2 loại: profile toàn cầu / ảnh tại server
        // ==========================================
        if (commandName === 'avatar') {
            const targetUser = options.getUser('người_dùng') || interaction.user;
            const loai = options.getString('loại') || 'global';

            let avatarURL, title;

            if (loai === 'server') {
                const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
                if (!targetMember) {
                    return interaction.reply({ content: '❌ Không tìm thấy thành viên này trong server.', ephemeral: true });
                }
                // displayAvatarURL lấy ảnh server nếu có, fallback về global
                avatarURL = targetMember.displayAvatarURL({ dynamic: true, size: 1024 });
                const hasServerAvatar = targetMember.avatar !== null;
                title = hasServerAvatar
                    ? `🏠 Ảnh tại máy chủ của ${targetUser.username}`
                    : `🏠 ${targetUser.username} chưa đặt ảnh riêng tại server — hiển thị ảnh profile`;
            } else {
                avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
                title = `🌐 Ảnh Profile của ${targetUser.username}`;
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(title)
                .setImage(avatarURL)
                .setDescription(`[📥 Tải ảnh gốc](${avatarURL})`)
                .setFooter({ text: `ID: ${targetUser.id}` })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        // ==========================================
        // 😄 LỆNH /addemoji — Thêm emoji từ server khác
        // ==========================================
        if (commandName === 'addemoji') {
            await interaction.deferReply({ ephemeral: true });

            const emojiInput = options.getString('emoji').trim();
            const customName = options.getString('tên');

            // Parse <:name:id> hoặc <a:name:id>
            const match = emojiInput.match(/^<(a?):(\w+):(\d+)>$/);
            if (!match) {
                return interaction.editReply({ content: '❌ Định dạng không hợp lệ! Hãy paste emoji dạng `<:tên:id>` hoặc `<a:tên:id>`.' });
            }

            const animated = match[1] === 'a';
            const originalName = match[2];
            const emojiId = match[3];
            const finalName = customName ? customName.replace(/[^a-zA-Z0-9_]/g, '_') : originalName;
            const ext = animated ? 'gif' : 'png';
            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=128&quality=lossless`;

            const newEmoji = await guild.emojis.create({ attachment: emojiURL, name: finalName }).catch(err => {
                console.error('❌ [addemoji]', err.message);
                return null;
            });

            if (!newEmoji) {
                return interaction.editReply({ content: '❌ Không thể thêm emoji! Có thể server đã đầy slot emoji hoặc Bot thiếu quyền **Manage Emojis**.' });
            }

            return interaction.editReply({ content: `✅ Đã thêm emoji **${newEmoji}** (\`${finalName}\`) vào server thành công!` });
        }

        // ==========================================
        // 🗑️ LỆNH /clear — Xóa tin nhắn hàng loạt
        // ==========================================
        if (commandName === 'clear') {
            await interaction.deferReply({ ephemeral: true });

            const amount = options.getInteger('số_lượng');
            const deleted = await interaction.channel.bulkDelete(amount, true).catch(err => {
                console.error('❌ [clear]', err.message);
                return null;
            });

            if (!deleted) {
                return interaction.editReply({ content: '❌ Không thể xóa tin nhắn! Có thể tin nhắn quá cũ (>14 ngày) hoặc Bot thiếu quyền **Manage Messages**.' });
            }

            const reply = await interaction.editReply({ content: `🗑️ Đã xóa **${deleted.size} tin nhắn** thành công!` });
            setTimeout(() => interaction.deleteReply().catch(() => null), 4000);
            return;
        }

        // ==========================================
        // 👢 LỆNH /kick — Kick thành viên
        // ==========================================
        if (commandName === 'kick') {
            await interaction.deferReply({ ephemeral: true });

            const target = options.getMember('thành_viên');
            const reason = options.getString('lý_do') || 'Không có lý do';

            if (!target) return interaction.editReply({ content: '❌ Không tìm thấy thành viên này.' });
            if (!target.kickable) return interaction.editReply({ content: '❌ Bot không thể kick người này (Role của họ cao hơn hoặc bằng Bot).' });
            if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ Bạn không thể tự kick chính mình!' });

            await target.kick(reason).catch(() => null);

            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('👢 Thành Viên Đã Bị Kick')
                .addFields(
                    { name: '👤 Thành viên', value: `${target.user.tag} (\`${target.id}\`)`, inline: true },
                    { name: '🛡️ Thực hiện bởi', value: `${interaction.user.tag}`, inline: true },
                    { name: '📋 Lý do', value: reason }
                )
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] }).catch(() => null);
            await sendModLog(guild, gConfig, { embeds: [embed] });
            await recordModAction(guild, gConfig, target.id, 'kick', reason, interaction.user.tag);
            return interaction.editReply({ content: `✅ Đã kick **${target.user.tag}** khỏi server.` });
        }

        // ==========================================
        // 🔨 LỆNH /ban — Ban thành viên
        // ==========================================
        if (commandName === 'ban') {
            await interaction.deferReply({ ephemeral: true });

            const target = options.getMember('thành_viên');
            const reason = options.getString('lý_do') || 'Không có lý do';
            const deletedays = options.getInteger('xóa_tin_nhắn') || 0;

            if (!target) return interaction.editReply({ content: '❌ Không tìm thấy thành viên này.' });
            if (!target.bannable) return interaction.editReply({ content: '❌ Bot không thể ban người này (Role của họ cao hơn hoặc bằng Bot).' });
            if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ Bạn không thể tự ban chính mình!' });

            await target.ban({ reason, deleteMessageDays: deletedays }).catch(() => null);

            const embed = new EmbedBuilder()
                .setColor('#C0392B')
                .setTitle('🔨 Thành Viên Đã Bị Ban')
                .addFields(
                    { name: '👤 Thành viên', value: `${target.user.tag} (\`${target.id}\`)`, inline: true },
                    { name: '🛡️ Thực hiện bởi', value: `${interaction.user.tag}`, inline: true },
                    { name: '📋 Lý do', value: reason },
                    { name: '🗑️ Xóa tin nhắn', value: deletedays > 0 ? `${deletedays} ngày gần đây` : 'Không xóa', inline: true }
                )
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] }).catch(() => null);
            await sendModLog(guild, gConfig, { embeds: [embed] });
            await recordModAction(guild, gConfig, target.id, 'ban', reason, interaction.user.tag);
            return interaction.editReply({ content: `✅ Đã ban **${target.user.tag}** khỏi server.` });
        }

        // ==========================================
        // 🔇 LỆNH /mute — Timeout thành viên
        // ==========================================
        if (commandName === 'mute') {
            await interaction.deferReply({ ephemeral: true });

            const target = options.getMember('thành_viên');
            const reason = options.getString('lý_do') || 'Không có lý do';

            if (!target) return interaction.editReply({ content: '❌ Không tìm thấy thành viên này.' });
            if (!target.moderatable) return interaction.editReply({ content: '❌ Bot không thể mute người này (Role của họ cao hơn hoặc bằng Bot).' });
            if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ Bạn không thể tự mute chính mình!' });
            if (target.user.bot) return interaction.editReply({ content: '❌ Không thể mute bot.' });

            // Thời gian mute LUÔN do hệ thống leo thang quyết định (1 phút → 7 ngày qua 5 lần),
            // dùng chung 1 bộ đếm với mute tự động (vi phạm từ cấm...).
            const result = await applyEscalatedMute(guild, gConfig, target, interaction.user.tag, reason);
            if (!result) return interaction.editReply({ content: '❌ Không thể mute thành viên này.' });

            await interaction.channel.send({ embeds: [result.embed] }).catch(() => null);
            return interaction.editReply({ content: `✅ Đã mute **${target.user.tag}** — lần thứ **${result.muteNumber}** → thời gian **${result.label}** (hết hạn lúc ${result.expireVN}).` });
        }

        // ==========================================
        // ⚠️ LỆNH /canhcao — Cảnh cáo thủ công, dùng chung bộ đếm với cảnh cáo tự động
        // Cứ 5 lần Cảnh Cáo (thủ công + tự động) -> tự động Mute
        // ==========================================
        if (commandName === 'canhcao') {
            await interaction.deferReply({ ephemeral: true });

            const target = options.getMember('thành_viên');
            const reason = options.getString('lý_do') || 'Không có lý do';

            if (!target) return interaction.editReply({ content: '❌ Không tìm thấy thành viên này.' });
            if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ Bạn không thể tự cảnh cáo chính mình!' });
            if (target.user.bot) return interaction.editReply({ content: '❌ Không thể cảnh cáo bot.' });

            const actionResult = await recordModAction(guild, gConfig, target.id, 'warn', reason, interaction.user.tag);
            const record = gConfig.modHistory[target.id];
            const warnCount = record.warnCount;
            const remainder = warnCount % 5;
            const untilMute = remainder === 0 ? 0 : 5 - remainder;

            const embed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('⚠️ Thành Viên Đã Bị Cảnh Cáo')
                .addFields(
                    { name: '👤 Thành viên', value: `${target.user.tag} (\`${target.id}\`)`, inline: true },
                    { name: '🛡️ Thực hiện bởi', value: `${interaction.user.tag}`, inline: true },
                    { name: '📶 Lần cảnh cáo thứ', value: `${warnCount}`, inline: true },
                    { name: '📋 Lý do', value: reason }
                )
                .setFooter({ text: untilMute > 0 ? `Còn ${untilMute} lần nữa sẽ tự động Mute` : 'Đã đủ 5 lần cảnh cáo → tự động Mute!' })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] }).catch(() => null);
            await sendModLog(guild, gConfig, { embeds: [embed] });

            const failureMessages = describeEscalationFailures(actionResult, target.user.tag);
            for (const fm of failureMessages) {
                await interaction.channel.send({ content: fm }).catch(() => null);
            }

            return interaction.editReply({ content: `✅ Đã cảnh cáo **${target.user.tag}** — lần thứ **${warnCount}**.` });
        }

        // ==========================================
        // 🛠️ LỆNH /kyluat — Xem hoặc chỉnh tay số đếm Cảnh cáo/Mute/Kick/Ban
        // Dùng khi admin cần "chia lại" cho khớp mốc thời gian mong muốn.
        // ==========================================
        if (commandName === 'kyluat') {
            await interaction.deferReply({ ephemeral: true });

            const targetUser = options.getUser('thành_viên') || interaction.user;
            const field = options.getString('loại');
            const value = options.getInteger('giá_trị');

            const isSelf = targetUser.id === interaction.user.id;
            const hasManageGuild = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

            if (!isSelf && !hasManageGuild) {
                return interaction.editReply({ content: '🚫 Bạn không có quyền kiểm tra lịch sử kỷ luật của người khác.' });
            }
            if ((field || value !== null) && !hasManageGuild) {
                return interaction.editReply({ content: '🚫 Bạn không có quyền chỉnh sửa số đếm kỷ luật.' });
            }

            if (!gConfig.modHistory) gConfig.modHistory = {};
            if (!gConfig.modHistory[targetUser.id]) {
                gConfig.modHistory[targetUser.id] = { warnCount: 0, muteCount: 0, kickCount: 0, banCount: 0, historyLog: [] };
            }
            const record = gConfig.modHistory[targetUser.id];
            if (record.warnCount === undefined) record.warnCount = 0;
            if (!record.historyLog) record.historyLog = [];

            // Admin chỉnh sửa số đếm kỷ luật
            if (field && value !== null) {
                const labelMap = { warnCount: 'Cảnh cáo', muteCount: 'Mute', kickCount: 'Kick', banCount: 'Ban' };
                const oldValue = record[field] || 0;
                record[field] = value;
                record.historyLog.push({
                    type: 'admin_edit',
                    reason: `Chỉnh sửa số lần ${labelMap[field]}: ${oldValue} -> ${value}`,
                    moderator: interaction.user.tag,
                    timestamp: Date.now()
                });
                saveConfig();
                return interaction.editReply({ content: `✅ Đã cập nhật **${labelMap[field]}** = **${value}** cho ${targetUser.username}.` });
            } else if (field && value === null) {
                return interaction.editReply({ content: '❌ Bạn chọn **loại** nhưng chưa nhập **giá_trị** muốn đặt.' });
            }

            // Hiển thị lịch sử vi phạm chi tiết dạng phân trang
            const pageData = buildDisciplinePage(targetUser, gConfig, 1, interaction.user.id);
            return interaction.editReply({ embeds: pageData.embeds, components: pageData.components });
        }

        // ==========================================
        // 📋 LỆNH /setupmodlog — Bật/Tắt kênh nhật ký quản trị riêng cho Admin
        // ==========================================
        if (commandName === 'setupmodlog') {
            await interaction.deferReply({ ephemeral: true });
            const state = options.getString('trạng_thái');

            if (state === 'off') {
                if (!gConfig.isModLogSetup) return interaction.editReply({ content: 'ℹ️ Hệ thống nhật ký quản trị chưa được bật.' });
                gConfig.isModLogSetup = false; saveConfig();
                return interaction.editReply({ content: '🔌 Đã **TẮT** hệ thống nhật ký quản trị. (Kênh cũ vẫn giữ nguyên, dùng `/setupmodlog Bật` để ghi log trở lại.)' });
            }

            gConfig.isModLogSetup = true;
            const modLogChan = await getOrCreateModLogChannel(guild, gConfig);
            if (!modLogChan) {
                gConfig.isModLogSetup = false; saveConfig();
                return interaction.editReply({ content: '❌ Không thể tạo kênh nhật ký (kiểm tra quyền **Manage Channels** của Bot).' });
            }
            saveConfig();

            return interaction.editReply({ content: `✅ Đã **BẬT** hệ thống nhật ký quản trị tại ${modLogChan} — chỉ **Admin** thấy được kênh này.\n📋 Từ giờ mọi lượt kick/ban/mute, tin nhắn bị sửa/xóa, đổi biệt danh/tên/avatar đều sẽ được ghi lại tự động.` });
        }

        if (commandName === 'help') {
            const introEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
                .setTitle('👋 Xin chào! Mình là MI BOT')
                .setDescription(
                    '> Mình là bot đa năng được thiết kế riêng để hỗ trợ quản lý và vận hành cộng đồng Discord của bạn.\n\n' +
                    '**Mình có thể làm được những gì?**\n' +
                    '🛠️ Khởi tạo và quản lý hệ thống kênh, ticket hỗ trợ\n' +
                    '🛡️ Xác thực thành viên mới tự động\n' +
                    '🎭 Phân vai trò bằng Emoji Reaction\n' +
                    '🕒 Chấm công và báo cáo giờ làm hàng tuần\n' +
                    '📢 Công cụ thông báo ẩn danh cho Admin\n' +
                    '🎰 Hệ thống giải trí & cày cuốc XP/xu\n\n' +
                    '👇 **Chọn một danh mục bên dưới để xem hướng dẫn chi tiết:**'
                )
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setFooter({ text: `Phục vụ tại: ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) || undefined })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder('📂 Chọn tính năng muốn xem hướng dẫn...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Khởi Tạo Hệ Thống')
                        .setDescription('Lệnh /setup và /resetsetup để khởi tạo server')
                        .setValue('help_setup')
                        .setEmoji('⚙️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Lời Chào Thành Viên Mới')
                        .setDescription('Tùy chỉnh tin nhắn welcome khi có người vào server')
                        .setValue('help_welcome')
                        .setEmoji('👋'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Hệ Thống Ticket Hỗ Trợ')
                        .setDescription('Tạo và quản lý phòng hỗ trợ 1-1 qua Ticket')
                        .setValue('help_ticket')
                        .setEmoji('🎫'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Xác Thực Thành Viên (Verify)')
                        .setDescription('Bật/Tắt hệ thống xác thực và quản lý quyền kênh')
                        .setValue('help_verify')
                        .setEmoji('🛡️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Reaction Role (Vai Trò Bằng Emoji)')
                        .setDescription('Cho thành viên tự chọn vai trò bằng cách thả Emoji')
                        .setValue('help_reaction')
                        .setEmoji('🎭'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Chấm Công Nhân Sự')
                        .setDescription('Hệ thống Check-In/Out và báo cáo giờ làm tuần')
                        .setValue('help_attendance')
                        .setEmoji('🕒'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Lệnh Admin Thông Báo')
                        .setDescription('Gửi thông báo ẩn danh thay mặt server (prefix)')
                        .setValue('help_admin')
                        .setEmoji('📢'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Kiểm Duyệt & Quản Lý Server')
                        .setDescription('Avatar, Emoji, Xóa tin nhắn, Kick, Ban, Mute')
                        .setValue('help_mod')
                        .setEmoji('🛡️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Hệ Thống Giveaway')
                        .setDescription('Tạo kênh và tổ chức giveaway tặng quà')
                        .setValue('help_giveaway')
                        .setEmoji('🎉'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Hệ Thống Góp Ý')
                        .setDescription('Tạo kênh nhận góp ý công khai và ẩn danh')
                        .setValue('help_feedback')
                        .setEmoji('📬'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Tạo Embed Tùy Chỉnh')
                        .setDescription('Gửi tin nhắn embed với nút bấm từ bot')
                        .setValue('help_embed')
                        .setEmoji('📝'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Giải Trí & Cày Cuốc')
                        .setDescription('Hệ thống XP, xu, lật đồng xu và chuyển xu')
                        .setValue('help_game')
                        .setEmoji('🎰'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Nghe Nhạc YouTube')
                        .setDescription('Tìm và phát nhạc từ YouTube, điều khiển bằng nút bấm')
                        .setValue('help_music')
                        .setEmoji('🎵'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Phòng Voice Riêng Tự Động')
                        .setDescription('Tự tạo phòng voice riêng khi vào kênh kích hoạt')
                        .setValue('help_voiceroom')
                        .setEmoji('🔊'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Ủng Hộ Bot')
                        .setDescription('Thông tin donate & mã QR chuyển khoản duy trì bot')
                        .setValue('help_donate')
                        .setEmoji('☕')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            return interaction.reply({ embeds: [introEmbed], components: [row], ephemeral: true });
        }

        if (commandName === 'configwelcome') {
            const chosenChannel = options.getChannel('kênh_welcome');
            gConfig.welcomeChannelId = chosenChannel.id;
            saveConfig();
            return interaction.reply({ content: `✅ Đã ghim kênh <#${chosenChannel.id}> làm kênh Welcome mặc định thành công!`, ephemeral: true });
        }

        if (commandName === 'setwelcome') {
            const outMsg = options.getString('tin_nhắn_ngoài');
            const mainMsg = options.getString('nội_dung_chính');
            const thumb = options.getString('ảnh_nhỏ_phải');
            const bigImg = options.getString('ảnh_lớn_dưới');

            if (outMsg) gConfig.contentMessage = outMsg;
            if (mainMsg) gConfig.embedDescription = mainMsg === 'xóa' ? "" : mainMsg;
            
            if (thumb) {
                if (thumb === 'xóa') gConfig.embedThumbnail = null;
                else if (thumb.startsWith('http')) gConfig.embedThumbnail = thumb;
            }
            if (bigImg) {
                if (bigImg === 'xóa') gConfig.embedImage = null;
                else if (bigImg.startsWith('http')) gConfig.embedImage = bigImg;
            }

            saveConfig();
            return interaction.reply({ content: '✅ Đã cập nhật cấu hình nội dung hiển thị Welcome thành công!', ephemeral: true });
        }

        if (commandName === 'resetwelcome') {
            gConfig.welcomeChannelId = ""; 
            gConfig.contentMessage = "Welcome {user} to {server}";
            gConfig.embedDescription = "Chào mừng bạn đã tham gia vào máy chủ nhé! 🎉";
            gConfig.embedThumbnail = null;
            gConfig.embedImage = null;
            saveConfig();
            return interaction.reply({ content: '🔄 **Đã reset cấu hình Welcome hoàn toàn!**' });
        }

        if (commandName === 'configticket') {
            const msg = options.getString('nội_dung');
            gConfig.ticketWelcomeMessage = msg; saveConfig();
            return interaction.reply({ content: `✅ Đã cấu hình lời chào Ticket thành công!`, ephemeral: true });
        }

        if (commandName === 'resetsetup') {
            await interaction.deferReply({ ephemeral: true });
            
            const ticketControlChan = guild.channels.cache.get(gConfig.ticketControlChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('hỗ-trợ-ticket'));
            if (ticketControlChan) await clearBotMessages(ticketControlChan);

            const attChan = guild.channels.cache.get(gConfig.attendanceChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('chấm-công') && !ch.name.includes('lịch-sử') && !ch.name.includes('báo-cáo'));
            if (attChan) await clearBotMessages(attChan);

            gConfig.isSetupCompleted = false; 
            saveConfig();

            return interaction.editReply({ content: '🔄 **Đã dọn dẹp các bảng nút bấm cũ thành công! (Dữ liệu giải trí toàn cầu được bảo toàn)**' });
        }

        // ==========================================
        // 🛡️ LỆNH: CHỦ ĐỘNG BẬT/TẮT XÁC THỰC (TÁCH BIỆT HOÀN TOÀN VỚI /setup, /resetsetup)
        // ==========================================
        if (commandName === 'setupverify') {
            await interaction.deferReply({ ephemeral: true });
            const state = options.getString('trạng_thái');
            const unverifyOnMuteOpt = options.getBoolean('gỡ_xác_thực_khi_mute');

            if (unverifyOnMuteOpt !== null) {
                gConfig.unverifyOnMute = unverifyOnMuteOpt;
                saveConfig();
                await interaction.followUp({
                    content: unverifyOnMuteOpt
                        ? '🔁 Đã **BẬT**: từ giờ khi mute 1 người (trừ bot), bot sẽ tự gỡ role **Đã Xác Thực** và trả về **Chưa Xác Thực**.'
                        : '🔁 Đã **TẮT** tùy chọn gỡ xác thực khi mute.',
                    ephemeral: true
                }).catch(() => null);
            }

            if (state === 'on') {
                if (gConfig.isVerifySetup && !gConfig.verifyDailyMode && gConfig.verifyChannelId && guild.channels.cache.get(gConfig.verifyChannelId)) {
                    return interaction.editReply({ content: '⚠️ Hệ thống xác thực đã đang **BẬT** từ trước.\nDùng `/resetverify` nếu muốn ngắt kết nối hiện tại.' });
                }

                gConfig.verifyDailyMode = false;
                gConfig.verifyDailyMembers = {};
                await setupVerifySystem(guild, gConfig);
                const statsOn = await assignVerifyRolesToAllMembers(guild, gConfig);
                saveConfig();

                return interaction.editReply({ 
                    content: '✅ **Đã BẬT hệ thống xác thực thành công!**\n' +
                             `🔒 Đã cấp vai trò **Chưa Xác Thực** cho **${statsOn.unverifiedAssigned}** thành viên hiện có.\n` +
                             (statsOn.verifiedBotAssigned > 0 ? `🤖 Đã cấp vai trò **Đã Xác Thực** cho **${statsOn.verifiedBotAssigned}** bot khác.\n` : '') +
                             (statsOn.alreadyVerified > 0 ? `✅ **${statsOn.alreadyVerified}** thành viên đã có sẵn vai trò Đã Xác Thực, giữ nguyên.\n` : '') +
                             (statsOn.failed > 0 ? `⚠️ **${statsOn.failed}** thành viên gán role thất bại (kiểm tra vị trí role Bot).\n` : '') +
                             '⚠️ Lưu ý: Hãy đảm bảo role của Bot có vị trí (position) **cao hơn** role Chưa/Đã Xác Thực trong danh sách Roles của server.' 
                });
            }

            if (state === '24h') {
                if (gConfig.isVerifySetup && gConfig.verifyDailyMode && gConfig.verifyChannelId && guild.channels.cache.get(gConfig.verifyChannelId)) {
                    return interaction.editReply({ content: '⚠️ Chế độ **Xác Thực 24 Giờ** đã đang hoạt động từ trước.\nDùng `/resetverify` nếu muốn ngắt và tạo lại.' });
                }

                await setupVerifySystem(guild, gConfig);

                gConfig.verifyDailyMode = true;
                if (!gConfig.verifyDailyMembers) gConfig.verifyDailyMembers = {};
                const stats24h = await assignVerifyRolesToAllMembers(guild, gConfig);
                saveConfig();

                return interaction.editReply({ 
                    content: '⏰ **Đã BẬT chế độ Xác Thực 24 Giờ thành công!**\n\n' +
                             '• Khi thành viên xác thực → nhận role **Đã Xác Thực** đến **23:59**.\n' +
                             '• Đúng **00:00 (múi giờ Việt Nam)** — toàn bộ thành viên bị thu hồi role Đã Xác Thực và trả về Chưa Xác Thực.\n' +
                             '• Họ cần xác thực lại vào ngày hôm sau.\n\n' +
                             `🔒 Đã cấp vai trò **Chưa Xác Thực** cho **${stats24h.unverifiedAssigned}** thành viên hiện có.\n` +
                             (stats24h.verifiedBotAssigned > 0 ? `🤖 Đã cấp vai trò **Đã Xác Thực** cho **${stats24h.verifiedBotAssigned}** bot khác.\n` : '') +
                             (stats24h.failed > 0 ? `⚠️ **${stats24h.failed}** thành viên gán role thất bại (kiểm tra vị trí role Bot).\n` : '') +
                             '\n⚠️ Hãy đảm bảo role Bot có vị trí **cao hơn** role Chưa/Đã Xác Thực trong danh sách Roles.'
                });
            }

            if (state === 'off') {
                if (!gConfig.isVerifySetup) {
                    return interaction.editReply({ content: 'ℹ️ Hệ thống xác thực hiện đang ở trạng thái **TẮT**.' });
                }

                await reopenLockedChannels(guild, gConfig);

                let donateChan = guild.channels.cache.get(gConfig.donateChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('donate'));
                if (donateChan) {
                    await clearBotMessages(donateChan);
                    const donateData = buildDonateEmbed();
                    await donateChan.send({ embeds: [donateData.embed], components: donateData.components }).catch(() => null);
                }
                gConfig.isVerifySetup = false;
                gConfig.verifyDailyMode = false;
                gConfig.verifyDailyMembers = {};
                saveConfig();

                return interaction.editReply({ 
                    content: '🔓 **Đã TẮT hệ thống xác thực và mở lại toàn bộ kênh cho mọi người!**\n(Role và kênh xác thực vẫn được ghi nhớ — gõ `/setupverify` chọn **Bật** hoặc **Xác Thực 24 Giờ** khi cần.)' 
                });
            }
        }

        if (commandName === 'resetverify') {
            await interaction.deferReply({ ephemeral: true });

            const oldUnverifiedRole = gConfig.unverifiedRoleId ? guild.roles.cache.get(gConfig.unverifiedRoleId) : null;
            if (oldUnverifiedRole) {
                guild.channels.cache.forEach(ch => {
                    if (ch.permissionOverwrites?.cache?.has(oldUnverifiedRole.id)) {
                        ch.permissionOverwrites.delete(oldUnverifiedRole.id).catch(() => null);
                    }
                });
            }

            const oldVerifyChan = gConfig.verifyChannelId ? guild.channels.cache.get(gConfig.verifyChannelId) : null;
            if (oldVerifyChan) await clearBotMessages(oldVerifyChan);

            gConfig.unverifiedRoleId = "";
            gConfig.verifiedRoleId = "";
            gConfig.verifyChannelId = "";
            gConfig.isVerifySetup = false;
            saveConfig();

            return interaction.editReply({ content: '🔄 **Đã tắt và xóa cấu hình hệ thống xác thực thành công!**\n(Lưu ý: Bot không tự xóa role/kênh, bạn có thể xóa thủ công nếu không cần dùng nữa.)' });
        }

        // ==========================================
        // 🎭 KHỐI LỆNH: REACTION ROLE (TÁCH BIỆT HOÀN TOÀN VỚI /setup, /resetsetup)
        // ==========================================
        if (commandName === 'reactionrole-create') {
            await interaction.deferReply({ ephemeral: true });

            const targetChannel = options.getChannel('kênh');
            const title = options.getString('tiêu_đề');
            const rawDesc = options.getString('nội_dung');
            const baseDescription = rawDesc ? rawDesc.replace(/\\n/g, '\n') : 'Thả Emoji tương ứng bên dưới để nhận vai trò!';

            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`🎭 ${title}`)
                .setDescription(`${baseDescription}\n\n*(Chưa có vai trò nào được gắn)*`)
                .setFooter({ text: 'Hệ thống Reaction Role' })
                .setTimestamp();

            const sentMessage = await targetChannel.send({ embeds: [panelEmbed] }).catch(() => null);
            if (!sentMessage) {
                return interaction.editReply({ content: '❌ Bot không thể gửi tin nhắn vào kênh đã chọn (Kiểm tra lại quyền của Bot tại kênh đó).' });
            }

            if (!gConfig.reactionRoles) gConfig.reactionRoles = {};
            gConfig.reactionRoles[sentMessage.id] = {
                channelId: targetChannel.id,
                baseDescription: baseDescription,
                roles: {}
            };
            saveConfig();

            return interaction.editReply({ 
                content: `✅ Đã tạo bảng chọn vai trò tại ${targetChannel}!\n🆔 **ID tin nhắn:** \`${sentMessage.id}\`\n➡️ Dùng \`/reactionrole-add\` kèm ID này để gắn Emoji vào Vai trò.` 
            });
        }

        if (commandName === 'reactionrole-add') {
            await interaction.deferReply({ ephemeral: true });

            const msgId = options.getString('id_tin_nhắn').trim();
            const emojiInput = options.getString('emoji').trim();
            const role = options.getRole('vai_trò');
            const desc = options.getString('mô_tả') || '';

            if (!gConfig.reactionRoles) gConfig.reactionRoles = {};
            const panelData = gConfig.reactionRoles[msgId];
            if (!panelData) {
                return interaction.editReply({ content: '❌ Không tìm thấy bảng Reaction Role với ID tin nhắn này. Hãy tạo bảng bằng `/reactionrole-create` trước.' });
            }

            const targetChannel = guild.channels.cache.get(panelData.channelId);
            if (!targetChannel) {
                return interaction.editReply({ content: '❌ Không tìm thấy kênh chứa bảng (Có thể kênh đã bị xóa).' });
            }

            const targetMessage = await targetChannel.messages.fetch(msgId).catch(() => null);
            if (!targetMessage) {
                return interaction.editReply({ content: '❌ Không tìm thấy tin nhắn bảng (Có thể đã bị xóa thủ công).' });
            }

            const { key, isCustom } = resolveEmojiKey(emojiInput);

            if (panelData.roles[key]) {
                return interaction.editReply({ content: '⚠️ Emoji này đã được gắn vai trò khác rồi. Hãy `/reactionrole-remove` trước nếu muốn đổi.' });
            }

            let reactTarget = emojiInput;
            if (isCustom) {
                const customEmoji = guild.emojis.cache.get(key);
                if (!customEmoji) {
                    return interaction.editReply({ content: '❌ Không tìm thấy Emoji tùy chỉnh này trong server (Emoji có thể thuộc server khác mà Bot không truy cập được).' });
                }
                reactTarget = customEmoji;
            }

            const reacted = await targetMessage.react(reactTarget).catch(err => {
                console.error('❌ Lỗi khi thả reaction lên bảng Reaction Role:', err.message);
                return null;
            });
            if (!reacted) {
                return interaction.editReply({ content: '❌ Bot không thể thả Emoji này lên tin nhắn (Emoji không hợp lệ hoặc Bot thiếu quyền).' });
            }

            panelData.roles[key] = { roleId: role.id, display: emojiInput, description: desc };
            saveConfig();

            await updateReactionRoleEmbed(targetMessage, panelData);

            return interaction.editReply({ content: `✅ Đã gắn ${emojiInput} ➜ ${role} thành công vào bảng!` });
        }

        if (commandName === 'reactionrole-remove') {
            await interaction.deferReply({ ephemeral: true });

            const msgId = options.getString('id_tin_nhắn').trim();
            const emojiInput = options.getString('emoji').trim();

            const panelData = gConfig.reactionRoles ? gConfig.reactionRoles[msgId] : null;
            if (!panelData) {
                return interaction.editReply({ content: '❌ Không tìm thấy bảng Reaction Role với ID tin nhắn này.' });
            }

            const { key } = resolveEmojiKey(emojiInput);
            if (!panelData.roles[key]) {
                return interaction.editReply({ content: '⚠️ Emoji này chưa được gắn vào vai trò nào trong bảng.' });
            }

            delete panelData.roles[key];
            saveConfig();

            const targetChannel = guild.channels.cache.get(panelData.channelId);
            const targetMessage = targetChannel ? await targetChannel.messages.fetch(msgId).catch(() => null) : null;
            if (targetMessage) {
                const existingReaction = targetMessage.reactions.cache.get(key);
                if (existingReaction) await existingReaction.remove().catch(() => null);
                await updateReactionRoleEmbed(targetMessage, panelData);
            }

            return interaction.editReply({ content: `✅ Đã gỡ Emoji ${emojiInput} khỏi bảng thành công!` });
        }

        if (commandName === 'reactionrole-reset') {
            await interaction.deferReply({ ephemeral: true });

            if (!gConfig.reactionRoles || Object.keys(gConfig.reactionRoles).length === 0) {
                return interaction.editReply({ content: 'ℹ️ Hiện không có dữ liệu Reaction Role nào để xóa.' });
            }

            for (const msgId in gConfig.reactionRoles) {
                const panelData = gConfig.reactionRoles[msgId];
                const targetChannel = guild.channels.cache.get(panelData.channelId);
                if (targetChannel) {
                    const targetMessage = await targetChannel.messages.fetch(msgId).catch(() => null);
                    if (targetMessage) await targetMessage.delete().catch(() => null);
                }
            }

            gConfig.reactionRoles = {};
            saveConfig();

            return interaction.editReply({ 
                content: '🔄 **Đã xóa toàn bộ bảng và dữ liệu Reaction Role thành công!**\n(Không ảnh hưởng đến `/setup`, `/resetsetup` hoặc bất kỳ tính năng nào khác)' 
            });
        }

        if (commandName === 'donate') {
            const donateData = buildDonateEmbed();
            return interaction.reply({ embeds: [donateData.embed], components: donateData.components });
        }

        if (commandName === 'setup') {
            try { await interaction.deferReply({ ephemeral: true }); } catch (e) { return; }
            if (gConfig.isSetupCompleted === true) return interaction.editReply({ content: '⚠️ Hệ thống đã ở trạng thái setup trước đó.' });
            
            try {
                if (!gConfig.welcomeChannelId) {
                    let welcomeChan = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('welcome'));
                    if (!welcomeChan) welcomeChan = await guild.channels.create({ name: '👋-welcome', type: ChannelType.GuildText });
                    gConfig.welcomeChannelId = welcomeChan.id;
                }

                let ticketCategory = guild.channels.cache.get(gConfig.ticketCategoryId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase().includes('ticket system'));
                if (!ticketCategory) ticketCategory = await guild.channels.create({ name: '🎫 Ticket System', type: ChannelType.GuildCategory });
                gConfig.ticketCategoryId = ticketCategory.id;

                let ticketControlChannel = guild.channels.cache.get(gConfig.ticketControlChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('hỗ-trợ-ticket'));
                if (!ticketControlChannel) {
                    ticketControlChannel = await guild.channels.create({ 
                        name: '⚙️-hỗ-trợ-ticket', type: ChannelType.GuildText, parent: ticketCategory.id,
                        permissionOverwrites: [{ id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }]
                    });
                }
                gConfig.ticketControlChannelId = ticketControlChannel.id;

                let archiveChan = guild.channels.cache.get(gConfig.ticketArchiveChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('lưu-trữ-ticket'));
                const adminOverwrites = [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
                ];
                guild.roles.cache.forEach(role => {
                    if (role.id !== guild.id && role.permissions.has(PermissionFlagsBits.ManageChannels)) {
                        adminOverwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                    }
                });

                if (!archiveChan) {
                    archiveChan = await guild.channels.create({ name: '📁-lưu-trữ-ticket', type: ChannelType.GuildText, parent: ticketCategory.id, permissionOverwrites: adminOverwrites });
                }
                gConfig.ticketArchiveChannelId = archiveChan.id;

                await clearBotMessages(ticketControlChannel);
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('create_ticket_btn:Default').setLabel('📩 Tạo Ticket').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL('https://discord.gg/cn535DxCn7') 
                );
                
                await ticketControlChannel.send({ 
                    embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('📩 Hệ Thống Hỗ Trợ').setDescription('Nhấn vào nút bên dưới để điền Form mở Ticket ẩn.')], 
                    components: [row] 
                });

                let attCategory = guild.channels.cache.get(gConfig.attendanceCategoryId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildCategory && ch.name.includes('chấm công'));
                if (!attCategory) attCategory = await guild.channels.create({ name: '📊 Hệ thống chấm công', type: ChannelType.GuildCategory });
                gConfig.attendanceCategoryId = attCategory.id;

                let attendanceChan = guild.channels.cache.get(gConfig.attendanceChannelId) || await guild.channels.create({ name: '🕒-chấm-công', type: ChannelType.GuildText, parent: attCategory.id });
                gConfig.attendanceChannelId = attendanceChan.id;

                let logChan = guild.channels.cache.get(gConfig.logChannelId) || await guild.channels.create({ name: '📜-lịch-sử-chấm-công', type: ChannelType.GuildText, parent: attCategory.id });
                gConfig.logChannelId = logChan.id;

                let reportChan = guild.channels.cache.get(gConfig.weeklyReportChannelId) || await guild.channels.create({ name: '📅-báo-cáo-tuần', type: ChannelType.GuildText, parent: attCategory.id, permissionOverwrites: adminOverwrites });
                gConfig.weeklyReportChannelId = reportChan.id;

                await clearBotMessages(attendanceChan);
                const attRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('check_in_btn').setLabel('🟢 Check-In').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('check_out_btn').setLabel('🔴 Check-Out').setStyle(ButtonStyle.Danger)
                );
                const attEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('🕒 KHU VỰC CHẤM CÔNG TRỰC TUYẾN')
                    .setDescription('Vui lòng nhấn nút dưới đây để khai báo giờ bắt đầu làm việc và kết thúc ca.');
                
                await attendanceChan.send({ embeds: [attEmbed], components: [attRow] });

                // ── Kênh quản lý từ cấm (chỉ Admin thấy được) ──
                let bannedWordsChan = guild.channels.cache.get(gConfig.bannedWordsChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('quan-ly-tu-cam'));
                if (!bannedWordsChan) {
                    bannedWordsChan = await guild.channels.create({ name: '📵-quản-lý-từ-cấm', type: ChannelType.GuildText, permissionOverwrites: adminOverwrites });
                }
                gConfig.bannedWordsChannelId = bannedWordsChan.id;
                if (!gConfig.bannedWords) gConfig.bannedWords = [];
                await bannedWordsChan.send({
                    embeds: [new EmbedBuilder()
                        .setColor('#E67E22')
                        .setTitle('🚫 Quản Lý Từ Cấm')
                        .setDescription(
                            'Gõ trực tiếp vào kênh này để quản lý danh sách từ cấm (chỉ Admin có quyền **Manage Guild** dùng được):\n' +
                            '• Gõ 1 từ/cụm từ → **thêm** vào danh sách cấm.\n' +
                            '• Gõ `-từ` → **xóa** từ đó khỏi danh sách.\n' +
                            '• Gõ `list` → xem toàn bộ danh sách hiện tại.\n\n' +
                            'Bot quét **TẤT CẢ** kênh trong server. Khi phát hiện từ cấm, bot sẽ tự động **xóa tin nhắn** và **Cảnh Cáo** người vi phạm.\n' +
                            'Cứ **5 lần Cảnh Cáo** → tự động **Mute** (1 phút → 1 giờ → 1 ngày → 3 ngày → 7 ngày qua 5 lần) → cứ **5 Mute** → **Kick** → cứ **5 Kick** → **Ban**.'
                        )]
                }).catch(() => null);

                // ── Kênh donate (mọi người chỉ xem được, không nhắn tin được) ──
                let donateChan = guild.channels.cache.get(gConfig.donateChannelId) || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.includes('donate'));
                if (!donateChan) {
                    donateChan = await guild.channels.create({
                        name: '☕-donate', type: ChannelType.GuildText,
                        permissionOverwrites: [{ id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }]
                    });
                }
                gConfig.donateChannelId = donateChan.id;
                await clearBotMessages(donateChan);
                const donateData = buildDonateEmbed();
                await donateChan.send({ embeds: [donateData.embed], components: donateData.components }).catch(() => null);

                gConfig.isSetupCompleted = true; saveConfig();
                await scanAndRescueTickets(guild, gConfig);

                return interaction.editReply({ content: '✅ **Hệ thống đã kết nối và khởi tạo bảng nút gốc thành công!**\n🛡️ Hệ thống xác thực **không còn tự động chạy theo `/setup`** — dùng lệnh `/setupverify` riêng để bật khi cần.' });
            } catch (err) { console.error(err); }
        }

        if (commandName === 'sendticket') {
            let targetChannel = options.getChannel('kênh_gửi') || guild.channels.cache.get(gConfig.ticketControlChannelId);
            let category = options.getChannel('danh_mục_ticket') || guild.channels.cache.get(gConfig.ticketCategoryId);

            if (!targetChannel || !category) return interaction.reply({ content: '❌ Vui lòng dùng `/setup` trước.', ephemeral: true });

            const title = options.getString('tiêu_đề') || '📩 Hệ Thống Hỗ Trợ & Báo Lỗi';
            const rawDescription = options.getString('nội_dung') || 'Nhấn nút phía dưới để gửi Form yêu cầu hỗ trợ đến admin.';
            const buttonLabel = options.getString('chữ_nút_bấm') || '📩 Tạo Ticket';
            const customTicketButtonLabel = options.getString('nút_phụ_tạo_ticket');
            
            const linkLabel = options.getString('tên_nút_gắn_link');
            const linkURL = options.getString('đường_dẫn_nút_gắn_link') || 'https://discord.gg/cn535DxCn7';

            gConfig.ticketCategoryId = category.id; saveConfig();

            const ticketEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(title).setDescription(rawDescription.replace(/\\n/g, '\n'));
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`create_ticket_btn:${buttonLabel}`).setLabel(buttonLabel).setStyle(ButtonStyle.Primary));

            if (customTicketButtonLabel) {
                row.addComponents(new ButtonBuilder().setCustomId(`create_ticket_btn:${customTicketButtonLabel}`).setLabel(customTicketButtonLabel).setStyle(ButtonStyle.Success));
            }

            if (linkLabel) {
                row.addComponents(new ButtonBuilder().setLabel(linkLabel).setStyle(ButtonStyle.Link).setURL(linkURL));
            }

            await targetChannel.send({ embeds: [ticketEmbed], components: [row] });
            return interaction.reply({ content: `✅ Đã gửi bảng Ticket phụ thành công!`, ephemeral: true });
        }

        // ==========================================
        // 🎵 LỆNH: NGHE NHẠC TỪ YOUTUBE
        // ==========================================
        if (commandName === 'play') {
            await interaction.deferReply();

            if (!isMusicReady()) {
                return interaction.editReply({ content: '❌ Bot chưa được cài đủ thư viện nghe nhạc.\nAdmin vui lòng chạy trên máy chủ bot:\n`npm install @discordjs/voice yt-dlp-exec libsodium-wrappers`\n**và** cài binary `yt-dlp` (xem https://github.com/yt-dlp/yt-dlp#installation), sau đó khởi động lại bot.' });
            }

            const voiceChannel = member.voice?.channel;
            if (!voiceChannel) return interaction.editReply({ content: '❌ Bạn cần vào một kênh thoại trước khi dùng lệnh này.' });

            const botPerms = voiceChannel.permissionsFor(guild.members.me);
            if (!botPerms?.has(PermissionFlagsBits.Connect) || !botPerms?.has(PermissionFlagsBits.Speak)) {
                return interaction.editReply({ content: '❌ Bot không có quyền **Kết nối** hoặc **Nói** trong kênh thoại này.' });
            }

            const query = options.getString('từ_khóa');
            let track;
            try {
                track = await searchYoutube(query);
            } catch (err) {
                console.error('❌ [Music] Lỗi tìm kiếm:', err.message);
                const msg = err.code === 'RESTRICTED_VIDEO'
                    ? '🔞 Video này đang **riêng tư** hoặc **bị giới hạn độ tuổi**, bot không thể phát. Vui lòng thử link/từ khóa khác.'
                    : '❌ Không thể tìm bài hát này (link có thể bị lỗi, riêng tư hoặc bị chặn độ tuổi).';
                return interaction.editReply({ content: msg });
            }
            if (!track) return interaction.editReply({ content: `❌ Không tìm thấy kết quả nào phát được cho **"${query}"** (các kết quả gần nhất có thể đều riêng tư hoặc bị giới hạn độ tuổi).` });
            track.requestedBy = user.username;

            const { mq, error } = await getOrCreateMusicQueue(guild, voiceChannel, interaction.channel);
            if (error) return interaction.editReply({ content: error });

            mq.queue.push(track);

            if (mq.current) {
                return interaction.editReply({ content: `✅ Đã thêm vào hàng đợi: **${track.title}** (vị trí #${mq.queue.length})` });
            } else {
                await interaction.editReply({ content: `🔎 Đang tải: **${track.title}**...` });
                await playNextTrack(guild.id);
            }
        }

        if (commandName === 'queue') {
            const mq = musicQueues.get(guild.id);
            if (!mq || (!mq.current && mq.queue.length === 0)) {
                return interaction.reply({ content: 'ℹ️ Hàng đợi nhạc hiện đang trống.', ephemeral: true });
            }
            const lines = mq.queue.slice(0, 10).map((t, i) => `**${i + 1}.** ${t.title} (${formatDuration(t.duration)})`);
            const embed = new EmbedBuilder()
                .setColor('#1DB954')
                .setTitle('📜 Hàng Đợi Nhạc')
                .setDescription(
                    (mq.current ? `**🎵 Đang phát:** [${mq.current.title}](${mq.current.url})\n\n` : '') +
                    (lines.length > 0 ? lines.join('\n') : 'Không có bài nào trong hàng đợi tiếp theo.') +
                    (mq.queue.length > 10 ? `\n...và ${mq.queue.length - 10} bài khác` : '')
                );
            return interaction.reply({ embeds: [embed], components: buildQueueRemoveRow(mq), ephemeral: true });
        }
    }

    // ==========================================
    // KHỐI 2: XỬ LÝ SỰ KIỆN KHI BẤM NÚT (BUTTON)
    // ==========================================
    // ==========================================
    // 🎵 HANDLER SELECT MENU: XOÁ BÀI KHỎI HÀNG ĐỢI NHẠC
    // ==========================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'music_queue_remove_select') {
        const mq = musicQueues.get(guild.id);
        if (!mq) return interaction.update({ content: '❌ Hiện không có nhạc nào đang phát.', embeds: [], components: [] }).catch(() => null);

        const voiceChannel = member.voice?.channel;
        if (!voiceChannel || voiceChannel.id !== mq.voiceChannelId) {
            return interaction.reply({ content: '❌ Bạn cần ở cùng kênh thoại với bot để xoá bài khỏi hàng đợi.', ephemeral: true });
        }

        const idx = parseInt(interaction.values[0], 10);
        if (isNaN(idx) || idx < 0 || idx >= mq.queue.length) {
            return interaction.update({ content: '⚠️ Bài này không còn trong hàng đợi (danh sách có thể đã thay đổi).', embeds: [], components: buildQueueRemoveRow(mq) }).catch(() => null);
        }

        const removed = mq.queue.splice(idx, 1)[0];

        // Cập nhật lại số lượng hàng đợi hiển thị trên tin nhắn "Đang phát" (nếu có)
        if (mq.nowPlayingMessage && mq.current) {
            mq.nowPlayingMessage.edit({ embeds: [buildMusicEmbed(mq)], components: buildMusicRows(mq) }).catch(() => null);
        }

        if (mq.queue.length === 0) {
            return interaction.update({ content: `🗑️ Đã xoá **${removed.title}** khỏi hàng đợi. Hàng đợi hiện đã trống.`, embeds: [], components: [] }).catch(() => null);
        }

        const lines = mq.queue.slice(0, 10).map((t, i) => `**${i + 1}.** ${t.title} (${formatDuration(t.duration)})`);
        return interaction.update({
            content: `🗑️ Đã xoá **${removed.title}** khỏi hàng đợi.\n\n` + lines.join('\n') + (mq.queue.length > 10 ? `\n...và ${mq.queue.length - 10} bài khác` : ''),
            embeds: [],
            components: buildQueueRemoveRow(mq)
        }).catch(() => null);
    }

    // ==========================================
    // 📂 HANDLER SELECT MENU: PHÂN NHÁNH /HELP
    // ==========================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_select') {
        const selected = interaction.values[0];

        const HELP_PAGES = {
            help_setup: {
                emoji: '⚙️', title: 'Khởi Tạo Hệ Thống',
                color: '#57F287',
                desc: 'Nhóm lệnh dùng để thiết lập và làm mới toàn bộ hệ thống kênh, bảng nút bấm của bot trên server.',
                fields: [
                    { name: '`/setup`', value: 'Tự động tạo đầy đủ: kênh Welcome, Ticket, Chấm công và toàn bộ bảng nút tương tác.\nBot sẽ phân quyền và gửi bảng điều khiển vào các kênh tương ứng.' },
                    { name: '`/resetsetup`', value: 'Dọn sạch các bảng nút bấm cũ và gửi lại bộ bảng mới tại phòng tương tác chính.\n⚠️ Dữ liệu giải trí (XP, xu) được bảo toàn, chỉ làm mới giao diện.' },
                ]
            },
            help_welcome: {
                emoji: '👋', title: 'Lời Chào Thành Viên Mới',
                color: '#FEE75C',
                desc: 'Tùy biến tin nhắn và hình ảnh chào mừng khi có thành viên mới gia nhập server.',
                fields: [
                    { name: '`/configwelcome [kênh]`', value: 'Ghim cố định kênh hiển thị tin nhắn chào mừng. Bot sẽ ưu tiên kênh này thay vì kênh mặc định.' },
                    { name: '`/setwelcome [tin_nhắn] [nội_dung] [ảnh_nhỏ] [ảnh_lớn]`', value: 'Tùy biến sâu nội dung Embed: văn bản ngoài, mô tả embed, ảnh thumbnail góc phải và ảnh banner phía dưới.\n• `{user}` → tag thành viên mới\n• `{server}` → tên server' },
                    { name: '`/resetwelcome`', value: 'Đặt lại toàn bộ cấu hình lời chào về mặc định ban đầu.' },
                ]
            },
            help_ticket: {
                emoji: '🎫', title: 'Hệ Thống Ticket Hỗ Trợ',
                color: '#EB459E',
                desc: 'Hệ thống phòng chat ẩn 1-1 giữa thành viên và đội hỗ trợ. Ticket được tạo tự động khi `/setup` chạy.',
                fields: [
                    { name: 'Quy trình hoạt động', value: '① Thành viên bấm nút tạo Ticket → Bot mở phòng chat riêng\n② Staff bấm "Nhận ca" → Được gán vào phòng đó\n③ Staff bấm "Đóng Ticket" → Bot lưu log toàn bộ chat\n④ Log được gửi vào kênh lưu trữ + DM cho người tạo Ticket' },
                    { name: '`/configticket [nội_dung]`', value: 'Tùy chỉnh lời nhắc hướng dẫn hiển thị bên trong phòng Ticket khi vừa được tạo.' },
                    { name: '`/sendticket [kênh] [danh_mục] [tiêu_đề] [nội_dung]`', value: 'Gửi bảng tạo Ticket tùy chỉnh sang một kênh bất kỳ, có thể đặt embed riêng và chọn danh mục lưu phòng.' },
                    { name: '⏱️ Tự động', value: 'Ticket không được nhận ca sau **24 giờ** sẽ tự đóng và gửi thông báo. Hủy nhận ca có cooldown **12 giờ**.' },
                ]
            },
            help_verify: {
                emoji: '🛡️', title: 'Xác Thực Thành Viên (Verify)',
                color: '#5865F2',
                desc: 'Hệ thống xác thực hoạt động **độc lập hoàn toàn** khỏi `/setup`. Bạn chủ động bật/tắt khi cần.',
                fields: [
                    { name: '`/setupverify` → chọn **Bật**', value: 'Bot tạo (hoặc dùng lại) kênh xác thực + 2 role (Chưa/Đã xác thực).\nThành viên mới tự động được gán role **Chưa Xác Thực** và bị hạn chế xem kênh cho đến khi bấm xác thực.' },
                    { name: '`/setupverify` → chọn **⏰ Xác Thực 24 Giờ**', value: 'Hoạt động giống chế độ Bật nhưng có thêm cơ chế tự động reset:\n• Thành viên xác thực → nhận role **Đã Xác Thực** đến hết ngày.\n• Đúng **00:00 múi giờ Việt Nam** — toàn bộ thành viên đã xác thực bị thu hồi role và trả về **Chưa Xác Thực**.\n• Họ cần bấm xác thực lại vào ngày hôm sau.\n• 🔔 Ai **bỏ lỡ xác thực quá 5 ngày** trong tuần (từ Thứ 2) sẽ được bot **nhắc nhở qua DM** một lần duy nhất trong tuần đó.\n• Chuyển từ **Bật** sang chế độ này **giữ nguyên** role/kênh cũ, không tạo role mới.' },
                    { name: '`/setupverify` → chọn **Tắt**', value: 'Tắt tính năng xác thực và **mở lại toàn bộ kênh** cho mọi người.\nRole và kênh được ghi nhớ để bật lại nhanh, không mất cấu hình.' },
                    { name: '`/resetverify`', value: 'Chỉ ngắt kết nối và xóa tin nhắn bảng xác thực.\nRole + kênh vẫn tồn tại và được ghi nhớ. Dùng khi muốn gửi lại bảng xác thực mới.' },
                    { name: '⚠️ Lưu ý', value: 'Role của Bot phải có vị trí (position) **cao hơn** role Chưa/Đã Xác Thực trong danh sách Roles của server.' },
                ]
            },
            help_reaction: {
                emoji: '🎭', title: 'Reaction Role — Vai Trò Bằng Emoji',
                color: '#ED4245',
                desc: 'Tạo bảng để thành viên tự chọn vai trò bằng cách thả Emoji. Hệ thống này độc lập hoàn toàn với `/setup`.',
                fields: [
                    { name: '`/reactionrole-create [kênh] [tiêu_đề] [nội_dung]`', value: 'Tạo bảng chọn vai trò mới tại kênh chỉ định. Bot trả về **ID tin nhắn** để dùng cho các bước tiếp theo.' },
                    { name: '`/reactionrole-add [id_tin_nhắn] [emoji] [vai_trò] [mô_tả]`', value: 'Gắn 1 Emoji vào 1 Vai trò trên bảng. Bot tự thả Emoji lên tin nhắn và cập nhật danh sách hiển thị.\n• Hỗ trợ cả Emoji Unicode (😀) và Emoji tùy chỉnh server (`<:tên:id>`).' },
                    { name: '`/reactionrole-remove [id_tin_nhắn] [emoji]`', value: 'Gỡ 1 Emoji khỏi bảng. Bot tự gỡ reaction và cập nhật lại danh sách — không xóa cả bảng.' },
                    { name: '`/reactionrole-reset`', value: 'Xóa **toàn bộ** bảng và dữ liệu Reaction Role trên server. Không ảnh hưởng các tính năng khác.' },
                ]
            },
            help_attendance: {
                emoji: '🕒', title: 'Chấm Công Nhân Sự',
                color: '#57F287',
                desc: 'Hệ thống chấm công tự động được khởi tạo cùng với `/setup`. Không cần cấu hình thêm sau khi setup.',
                fields: [
                    { name: 'Check-In / Check-Out', value: 'Thành viên bấm nút trong kênh chấm công để bắt đầu và kết thúc ca làm.\nBot ghi nhận thời gian và tính số giờ tự động.' },
                    { name: '📊 Báo cáo tuần', value: 'Tự động tổng hợp và gửi báo cáo giờ công của toàn bộ thành viên vào kênh báo cáo.\n🔄 Reset dữ liệu tuần vào **00:00 Thứ Hai** hàng tuần.' },
                    { name: '📋 Lịch sử', value: 'Toàn bộ lịch sử check-in/out được lưu vào config theo từng người và từng server.' },
                ]
            },
            help_admin: {
                emoji: '📢', title: 'Lệnh Admin Thông Báo (Prefix)',
                color: '#FEE75C',
                desc: '⚠️ Yêu cầu quyền **Quản Lý Server** hoặc **Quản Lý Tin Nhắn**.\nLệnh prefix — **không** bắt đầu bằng dấu `/`, gõ thẳng vào kênh chat.',
                fields: [
                    { name: '`misay [nội dung]` hoặc `mis [nội dung]`', value: 'Bot gửi lại đúng nội dung đó trong kênh hiện tại, đồng thời **tự xóa tin nhắn gốc** của Admin.\nDùng để thông báo "thay mặt" server mà không lộ danh tính.' },
                    { name: '💡 Ví dụ', value: '`mis 🔔 Server sẽ bảo trì vào 22:00 tối nay, mọi người lưu ý nhé!`\n→ Bot xóa tin nhắn đó và gửi lại thông báo sạch sẽ.' },
                ]
            },
            help_giveaway: {
                emoji: '🎉', title: 'Hệ Thống Giveaway',
                color: '#F1C40F',
                desc: 'Tổ chức tặng quà ngẫu nhiên cho thành viên. Tách biệt hoàn toàn khỏi `/setup`.\nKênh giveaway chỉ đọc — thành viên không tự nhắn được.',
                fields: [
                    { name: '`/setupgiveaway [Bật/Tắt]`', value: 'Tạo kênh `🎉-giveaway`, khóa chat mọi người, gửi embed giới thiệu.\nYêu cầu quyền **Manage Channels**.' },
                    { name: '`/giveawaycreate [tiêu_đề] [phần_thưởng] [thời_gian] [đơn_vị] [số_người_thắng]`', value: 'Tạo giveaway mới gửi vào kênh giveaway, có 2 nút:\n• **🎉 Tham Gia** — bấm để vào/rút khỏi, số người cập nhật realtime\n• **🌐 Máy Chủ Hỗ Trợ** — link cố định\n\nEmbed hiển thị tiêu đề, phần thưởng, số người thắng, giờ kết thúc và **đếm ngược realtime** (cập nhật mỗi 30 giây).\nKhi hết giờ, bot tự chọn người thắng ngẫu nhiên và thông báo.\nYêu cầu quyền **Manage Server**.' },
                    { name: '🔗 `/invite`', value: 'Tạo link mời **vĩnh viễn** (không hết hạn, không giới hạn lượt dùng) cho server.\nYêu cầu quyền **Create Instant Invite**.' },
                ]
            },
            help_feedback: {
                emoji: '📬', title: 'Hệ Thống Góp Ý',
                color: '#3498DB',
                desc: 'Tách biệt hoàn toàn khỏi `/setup`. Admin tự bật bằng `/setupfeedback`.\nKênh góp ý chỉ đọc — thành viên **không thể tự nhắn**, chỉ bot mới gửi được.',
                fields: [
                    { name: '`/setupfeedback [Bật/Tắt]`', value: '**Bật:** Tạo (hoặc kết nối lại) kênh 📬-góp-ý, khóa quyền nhắn của mọi người, gửi embed hướng dẫn.\n**Tắt:** Tắt tính năng, giữ nguyên kênh để bật lại nhanh.\nYêu cầu quyền **Manage Channels**.' },
                    { name: '`/gopy [loại] [nội_dung]`', value: '**Góp ý công khai** — Embed hiển thị tên và avatar của bạn.\n**Góp ý ẩn danh** — Embed chỉ ghi "Ẩn danh", không lộ danh tính.\nGóp ý được gửi thẳng vào kênh góp ý của server.' },
                ]
            },
            help_embed: {
                emoji: '📝', title: 'Tạo Embed Tùy Chỉnh',
                color: '#5865F2',
                desc: 'Dùng `/sendembed` để tạo và gửi tin nhắn Embed chuyên nghiệp với nút bấm link tùy chỉnh từ bot.\nYêu cầu quyền **Manage Messages**.',
                fields: [
                    { name: '📋 Các trường cơ bản (bắt buộc)', value: '• `kênh` — Kênh gửi embed\n• `tiêu_đề` — Tiêu đề nằm trên cùng\n• `nội_dung` — Nội dung chính (dùng `\\n` để xuống dòng)' },
                    { name: '🎨 Tùy chỉnh giao diện (tùy chọn)', value: '• `màu` — Màu cạnh trái dạng HEX (VD: `#FF5733`)\n• `ảnh_nhỏ` — URL ảnh thumbnail góc phải\n• `ảnh_lớn` — URL ảnh banner phía dưới nội dung\n• `footer` — Dòng chữ nhỏ bên dưới' },
                    { name: '🔘 Nút bấm link (tùy chọn, tối đa 3 nút)', value: '• `nút1_tên` + `nút1_link` — Nút link thứ nhất\n• `nút2_tên` + `nút2_link` — Nút link thứ hai\n• `nút3_tên` + `nút3_link` — Nút link thứ ba\n⚠️ Nút **🌐 Máy Chủ Hỗ Trợ** luôn được thêm tự động, không thể tắt.' },
                    { name: '💡 Ví dụ', value: '`/sendembed kênh:#thông-báo tiêu_đề:🎉 Sự Kiện Mới nội_dung:Hãy tham gia sự kiện... màu:#FF5733 nút1_tên:Đăng Ký nút1_link:https://...`' },
                ]
            },
            help_mod: {
                emoji: '🛡️', title: 'Kiểm Duyệt & Quản Lý Server',
                color: '#E74C3C',
                desc: 'Các lệnh quản lý thành viên, tin nhắn và emoji. Mỗi lệnh yêu cầu quyền tương ứng.',
                fields: [
                    { name: '🖼️ `/avatar [@người]`', value: 'Xem ảnh đại diện (kích thước gốc) của bản thân hoặc bất kỳ thành viên nào trong server. Có link tải ảnh.' },
                    { name: '😄 `/addemoji [emoji] [tên]`', value: 'Thêm emoji từ server khác vào server này. Paste emoji tùy chỉnh dạng `<:tên:id>` hoặc `<a:tên:id>`. Bot có thể nhận emoji từ mọi server nó tham gia.\nYêu cầu quyền **Manage Emojis**.' },
                    { name: '🗑️ `/clear [số_lượng]`', value: 'Xóa hàng loạt tin nhắn gần nhất trong kênh hiện tại (1-100 tin).\n⚠️ Chỉ xóa được tin nhắn trong **14 ngày** gần đây.\nYêu cầu quyền **Manage Messages**.' },
                    { name: '👢 `/kick [@thành_viên] [lý_do]`', value: 'Kick thành viên khỏi server. Họ có thể tham gia lại nếu có link invite.\nYêu cầu quyền **Kick Members**.' },
                    { name: '🔨 `/ban [@thành_viên] [lý_do] [xóa_tin_nhắn]`', value: 'Ban vĩnh viễn thành viên khỏi server. Tùy chọn xóa tin nhắn 0-7 ngày gần đây.\nYêu cầu quyền **Ban Members**.' },
                    { name: '⚠️ `/canhcao [@thành_viên] [lý_do]`', value: 'Cảnh cáo thủ công. Dùng chung 1 bộ đếm với cảnh cáo tự động (vi phạm từ cấm).\nCứ **5 lần Cảnh Cáo** → tự động **Mute**.\nYêu cầu quyền **Moderate Members**.' },
                    { name: '🔇 `/mute [@thành_viên] [lý_do]`', value: 'Timeout thành viên — thời gian **tự động leo thang theo số lần**: 1 phút → 1 giờ → 1 ngày → 3 ngày → 7 ngày (từ lần 5 trở đi giữ 7 ngày).\nDùng chung 1 bộ đếm với mute tự động (đủ 5 lần Cảnh Cáo).\nVí dụ: `/mute @user spam`\nYêu cầu quyền **Moderate Members**.' },
                    { name: '🚫 Hệ thống Từ Cấm', value: 'Gõ vào kênh **📵-quản-lý-từ-cấm** (tạo tự động qua `/setup`) để thêm/xóa từ cấm (`-từ` để xóa, `list` để xem).\nBot quét TẤT CẢ kênh, tự xóa tin nhắn vi phạm + **Cảnh Cáo** người gửi.\nCứ **5 Cảnh Cáo → 1 Mute → (5 Mute → 1 Kick → 5 Kick → 1 Ban)**.' },
                    { name: '🛠️ `/kyluat [@thành_viên] [loại] [giá_trị]`', value: 'Xem hoặc chỉnh tay số đếm Cảnh cáo/Mute/Kick/Ban của 1 người — dùng để "chia lại" cho khớp mốc thời gian mong muốn.\nYêu cầu quyền **Manage Guild**.' },
                    { name: '🔁 Gỡ xác thực khi mute', value: 'Bật bằng `/setupverify gỡ_xác_thực_khi_mute:True`. Khi mute ai đó (trừ bot), bot sẽ tự gỡ role Đã Xác Thực và trả về Chưa Xác Thực.' },
                    { name: '📋 `/setupmodlog [Bật/Tắt]`', value: 'Tạo kênh **📋-nhật-ký-quản-trị** riêng — chỉ Admin thấy được. Tự động ghi lại: kick/ban/mute, tin nhắn bị sửa/xóa, đổi biệt danh/tên tài khoản/avatar.\nYêu cầu quyền **Manage Guild**.' },
                    { name: '🔍 Tra cứu lịch sử kỷ luật', value: 'Tại kênh **📋-nhật-ký-quản-trị**, Admin gửi thẳng **ID** (hoặc @tag) một thành viên → bot trả lại số lần người đó từng bị **Mute / Kick / Ban**.' },
                    { name: '⚖️ Tự động leo thang kỷ luật', value: 'Hệ thống tự đếm dồn theo từng thành viên:\n• Cứ **5 lần Mute** → bot tự động **Kick** người đó.\n• Cứ **5 lần Kick** (kể cả kick thủ công lẫn tự động) → bot tự động **Ban vĩnh viễn**.' },
                ]
            },
            help_game: {
                emoji: '🎰', title: 'Giải Trí & Cày Cuốc',
                color: '#ED4245',
                desc: '🌐 Dữ liệu XP và xu **đồng bộ toàn cầu** giữa tất cả server có bot.\n⚠️ **Tất cả lệnh cược giới hạn tối đa 250,000 xu/lần. Dùng `all` thay cho 250,000.**\nLệnh prefix — **không** bắt đầu bằng `/`.',
                fields: [
                    { name: '`midaily` / `mid`', value: 'Điểm danh hàng ngày nhận **1,000 xu**. Reset lúc **00:00 VN** mỗi ngày.' },
                    { name: '`miprofile` / `mip`', value: 'Xem hồ sơ cá nhân: Cấp độ, thanh XP, số dư xu.' },
                    { name: '`micash` / `mic`', value: 'Xem nhanh số dư ví.' },
                    { name: '`migive @người [số]` / `mig`', value: 'Chuyển xu cho người khác.' },
                    { name: '🪙 `micf` / `micoinflip [số/all] [ngua/sap]`', value: 'Lật đồng xu — đoán đúng nhân đôi cược.\nVd: `micf all ngua`' },
                    { name: '⚀ `mid6` / `mixucxac [số/all] [cao/thap/le/chan]`', value: 'Tung 2 xúc xắc — đặt Cao (tổng ≥7) / Thấp (<7) / Lẻ / Chẵn.\nVd: `mid6 all cao`' },
                    { name: '🎲 `mitx` / `mitaixiu [số/all] [tai/xiu]`', value: 'Tung 1 xúc xắc — Tài (4-6) / Xỉu (1-3). Đoán đúng nhân đôi.\nVd: `mitx all tai`' },
                    { name: '🎯 `mig3` / `midoanso [số/all] [1-10]`', value: 'Đoán đúng số bí ẩn từ 1-10 → thắng **x5** tiền cược!\nVd: `mig3 all 7`' },
                    { name: '🎲 `mibc` / `mibaucua [số/all] [bau/cua/tom/ca/ga/nai]`', value: 'Bầu Cua Tôm Cá — chọn 1 trong 6 con vật, tung 3 xúc xắc. Trúng bao nhiêu viên ăn gấp bấy nhiêu lần cược (x1/x2/x3).\nVd: `mibc all cua`' },
                    { name: '✂️ `mikbg` / `mikeobuagiay [số/all] [keo/bua/giay]`', value: 'Kéo Búa Giấy — đấu trực tiếp với Bot. Thắng nhân đôi cược, hòa hoàn lại, thua mất cược.\nVd: `mikbg all bua`' },
                    { name: '🎰 `misl` / `mislot [số/all]`', value: 'Máy Kéo Slot — quay 3 ô ngẫu nhiên. Trúng 3 ký hiệu giống nhau ăn theo hệ số (x2 → x10), trúng cặp đôi hoàn cược, không trúng gì mất cược.\nVd: `misl all`' },
                    { name: '🥣 `mixd` / `mixocdia [số/all] [chan/le]`', value: 'Xóc Đĩa — lắc 4 đĩa, đặt Chẵn hoặc Lẻ số mặt Đỏ. Đoán đúng nhân đôi cược.\nVd: `mixd all chan`' },
                    { name: '🃏 `mibj` / `miblackjack [số/all]`', value: 'Blackjack — chơi bằng nút bấm 🃏 Rút / ✋ Dừng / 💰 Nhân Đôi. Blackjack tự nhiên (21 ngay từ đầu) thắng **x1.5**, thắng thường **x1**, hòa hoàn cược. Tự động Dừng nếu không thao tác sau 60 giây.\nVd: `mibj all`' },
                    { name: '🤖 Tự động cộng XP khi chat', value: 'Chat bình thường tự cộng XP + 5 xu. Đủ ngưỡng bot thông báo **Level Up** và thưởng **5,000 xu**.' },
                    { name: '🏆 `mitop` / `mit`', value: 'Xem bảng xếp hạng **Top 10 người nhiều xu nhất** toàn hệ thống.' },
                    { name: '🛠️ `/resetbalance` (Chỉ Owner)', value: '`add [số]` — Thêm xu | `max` — Về tối đa | `resetuser [@tag]` — Reset 1 người | `resetall` — Xóa toàn bộ' },
                    { name: '🔧 `/setprefix [tiền_tố]` (Admin)', value: 'Thay tiền tố lệnh prefix cả server (mặc định: `mi`). VD: `/setprefix m` → `mdaily`, `mcash`, `mtop`...' },
                    { name: '🛠️ `/resetbalance` (Chỉ Owner — ẩn với người khác)', value: '• `add [số]` — Thêm xu cho bản thân\n• `max` — Đặt xu về mức tối đa\n• `resetuser [@người]` — Reset xu 1 người bằng cách tag\n• `resetall` — Xóa xu toàn bộ (trừ Owner)' },
                ]
            },
            help_music: {
                emoji: '🎵', title: 'Nghe Nhạc YouTube',
                color: '#1DB954',
                desc: 'Tìm và phát nhạc trực tiếp từ YouTube trong kênh thoại. Toàn bộ điều khiển thao tác qua **nút bấm**, không cần gõ lệnh thêm.',
                fields: [
                    { name: '`/play [từ_khóa]` hoặc `miplay` / `mipl` *(prefix)*', value: 'Bạn cần đang ở trong **kênh thoại** trước.\nNhập tên bài hát để bot tự tìm trên YouTube, hoặc dán thẳng **link YouTube**.\nNếu đang có bài phát → bài mới được thêm vào **hàng đợi**.\nNếu bot đang phát ở kênh khác mà kênh đó **hết người nghe**, bot sẽ tự chuyển sang kênh của bạn.' },
                    { name: '`/queue`', value: 'Xem nhanh bài đang phát và danh sách hàng đợi kèm **menu xoá bài** (chỉ mình bạn thấy).' },
                    { name: '🗑️ Xoá bài khỏi hàng đợi', value: 'Mở `/queue` hoặc bấm nút **📜 Hàng đợi**, sau đó chọn bài muốn xoá trong menu — bài đó sẽ bị loại khỏi hàng đợi ngay lập tức.' },
                    { name: '🎛️ Nút điều khiển (hiện dưới mỗi bài đang phát)', value: '• ⏸️/▶️ **Tạm dừng / Tiếp tục**\n• ⏭️ **Bỏ qua** bài hiện tại\n• ⏹️ **Dừng** hẳn và rời kênh thoại\n• 🔁 **Lặp** — bấm để chuyển vòng: Tắt → Bài hiện tại → Cả hàng đợi\n• 🔉/🔊 **Giảm/Tăng âm lượng** mỗi lần 10%\n• 📜 **Hàng đợi** — xem nhanh các bài tiếp theo + xoá bài' },
                    { name: '⚠️ Lưu ý', value: '• Chỉ thành viên đang ở **cùng kênh thoại** với bot mới bấm được nút điều khiển hoặc xoá bài trong hàng đợi.\n• Nếu bot đang phát ở kênh khác và kênh đó **vẫn còn người nghe**, bạn cần vào đúng kênh đó mới thêm được bài.\n• Bot tự rời kênh thoại sau **2 phút** nếu hết hàng đợi, hoặc rời ngay nếu không còn ai trong kênh.\n• Cần quyền **Kết nối** và **Nói** trong kênh thoại.' },
                ]
            },
            help_voiceroom: {
                emoji: '🔊', title: 'Phòng Voice Riêng Tự Động',
                color: '#5865F2',
                desc: 'Hệ thống tạo phòng voice riêng tự động (Join-to-Create). Tách biệt hoàn toàn khỏi `/setup`.',
                fields: [
                    { name: '`/setupvoiceroom` → chọn **Bật**', value: 'Bot tạo danh mục **🔊 VOICE ROOM** gồm:\n• Kênh thoại **➕ Tạo Phòng Voice** — vào đây để tự động có phòng riêng.\n• Kênh **🔧-quản-lý-voice** — khóa chat, chỉ chứa bảng nút quản lý + nút **🌐 Máy Chủ Hỗ Trợ** cố định.' },
                    { name: '🚪 Cách hoạt động', value: '① Vào kênh **➕ Tạo Phòng Voice** → Bot tự tạo 1 phòng thoại mang tên bạn và đẩy bạn sang đó ngay.\n② Bạn là **chủ phòng riêng** đó, có toàn quyền quản lý.\n③ Rời khỏi phòng và không còn ai bên trong → Bot **tự động xóa phòng**.' },
                    { name: '⚙️ Bảng quản lý phòng (tại kênh 🔧-quản-lý-voice)', value: 'Bấm nút **"Quản Lý Phòng Của Tôi"** trong khi đang ở phòng riêng để mở bảng chỉ mình bạn thấy, gồm:\n• 🔒/🔓 Khóa / Mở phòng\n• 🙈/👁️ Ẩn / Hiện phòng\n• ✏️ Đổi tên phòng\n• 🔢 Đặt giới hạn thành viên (0-99)\n• 👢 Kick thành viên ra khỏi phòng\n• 👑 Chuyển quyền chủ phòng cho người khác\n• 🗑️ Xóa phòng ngay lập tức' },
                    { name: '`/setupvoiceroom` → chọn **Tắt**', value: 'Tắt tính năng — kênh vẫn được giữ nguyên để bật lại nhanh, không mất cấu hình.' },
                ]
            },
            help_donate: {
                emoji: '☕', title: 'Ủng Hộ Duy Trì MI BOT',
                color: '#F5B942',
                desc: 'MI BOT được duy trì và phát triển thêm tính năng mới nhờ sự ủng hộ từ cộng đồng.',
                fields: [
                    { name: '☕ Kênh donate tự động', value: 'Chạy `/setup` sẽ tự tạo kênh **☕-donate** — mọi người chỉ **xem** được, không nhắn tin được, luôn hiển thị sẵn thông tin chuyển khoản + mã QR.' },
                    { name: '🏦 Ngân hàng', value: 'Vietcombank' },
                    { name: '💳 Số tài khoản', value: '`9369144188`' },
                    { name: '👤 Chủ tài khoản', value: '`DAO NGOC QUANG`' },
                ]
            },
        };

        const page = HELP_PAGES[selected];
        if (!page) return interaction.update({});

        const pageEmbed = new EmbedBuilder()
            .setColor(page.color)
            .setTitle(`${page.emoji} ${page.title}`)
            .setDescription(page.desc)
            .addFields(page.fields)
            .setFooter({ text: '← Chọn lại danh mục khác từ menu bên dưới để tiếp tục xem' })
            .setTimestamp();

        return interaction.update({ embeds: [pageEmbed], components: interaction.message.components });
    }

    if (interaction.isButton()) {
        // ==========================================
        // 👤 XỬ LÝ NÚT PHÁT SINH TỪ HỒ SƠ (/profile)
        // ==========================================
        if (customId === 'profile_give') {
            return interaction.reply({ content: '💡 **Cách chuyển xu:** Bạn hãy dùng lệnh `migive <@thành_viên> <số_xu>` (hoặc `/give` nếu có) để chuyển xu cho người khác nhé!', ephemeral: true });
        }
        if (customId === 'profile_shop') {
            return interaction.reply({ content: '🛒 **Cửa hàng:** Tính năng mua sắm hiện đang được phát triển và sẽ sớm ra mắt trong các phiên bản sau!', ephemeral: true });
        }
        // ==========================================
        // 🎵 XỬ LÝ NÚT ĐIỀU KHIỂN NGHE NHẠC
        // ==========================================
        if (customId.startsWith('music_')) {
            const mq = musicQueues.get(guild.id);
            if (!mq || !mq.current) {
                return interaction.reply({ content: '❌ Hiện không có nhạc nào đang phát.', ephemeral: true });
            }

            const voiceChannel = member.voice?.channel;
            if (!voiceChannel || voiceChannel.id !== mq.voiceChannelId) {
                return interaction.reply({ content: '❌ Bạn cần ở cùng kênh thoại với bot để điều khiển nhạc.', ephemeral: true });
            }

            if (customId === 'music_pauseresume') {
                if (mq.player.state.status === voiceLib.AudioPlayerStatus.Playing) mq.player.pause();
                else if (mq.player.state.status === voiceLib.AudioPlayerStatus.Paused) mq.player.unpause();
                return interaction.update({ embeds: [buildMusicEmbed(mq)], components: buildMusicRows(mq) }).catch(() => null);
            }

            if (customId === 'music_skip') {
                await interaction.deferUpdate().catch(() => null);
                killCurrentProcess(mq);
                mq.player.stop(); // Chuyển player sang Idle -> tự động phát bài kế tiếp
                return;
            }

            if (customId === 'music_stop') {
                mq.queue = [];
                mq.loop = 'off';
                if (mq.idleTimeout) clearTimeout(mq.idleTimeout);
                killCurrentProcess(mq);
                mq.player.stop();
                mq.connection.destroy();
                musicQueues.delete(guild.id);
                return interaction.update({ content: '⏹️ Đã dừng phát nhạc và rời kênh thoại.', embeds: [], components: [] }).catch(() => null);
            }

            if (customId === 'music_loop') {
                mq.loop = mq.loop === 'off' ? 'track' : (mq.loop === 'track' ? 'queue' : 'off');
                return interaction.update({ embeds: [buildMusicEmbed(mq)], components: buildMusicRows(mq) }).catch(() => null);
            }

            if (customId === 'music_volup' || customId === 'music_voldown') {
                const delta = customId === 'music_volup' ? 0.1 : -0.1;
                mq.volume = Math.max(0, Math.min(1.5, Math.round((mq.volume + delta) * 100) / 100));
                if (mq.currentResource) mq.currentResource.volume.setVolume(mq.volume);
                return interaction.update({ embeds: [buildMusicEmbed(mq)], components: buildMusicRows(mq) }).catch(() => null);
            }

            if (customId === 'music_queue') {
                if (mq.queue.length === 0) {
                    return interaction.reply({ content: 'ℹ️ Không có bài nào trong hàng đợi tiếp theo.', ephemeral: true });
                }
                const lines = mq.queue.slice(0, 10).map((t, i) => `**${i + 1}.** ${t.title} (${formatDuration(t.duration)})`);
                return interaction.reply({
                    content: lines.join('\n') + (mq.queue.length > 10 ? `\n...và ${mq.queue.length - 10} bài khác` : ''),
                    components: buildQueueRemoveRow(mq),
                    ephemeral: true
                });
            }
        }

        // ==========================================
        // 🃏 XỬ LÝ NÚT BLACKJACK (Rút / Dừng / Nhân đôi)
        // ==========================================
        if (customId.startsWith('bj_')) {
            const parts = customId.split('_'); // ['bj', action, userId]
            const action = parts[1];
            const ownerId = parts.slice(2).join('_');

            if (user.id !== ownerId) {
                return interaction.reply({ content: '❌ Đây không phải ván Blackjack của bạn!', ephemeral: true });
            }

            const game = blackjackGames.get(ownerId);
            if (!game) {
                return interaction.reply({ content: '❌ Ván này đã kết thúc hoặc không còn tồn tại.', ephemeral: true }).catch(() => null);
            }

            if (game.timeoutHandle) clearTimeout(game.timeoutHandle);

            if (action === 'hit') {
                game.playerHand.push(bjDraw(game.deck));
                const val = bjHandValue(game.playerHand);

                if (val >= 21) {
                    // 21 điểm hoặc quắc → tự động kết thúc lượt, không cần chờ bấm Dừng
                    await interaction.deferUpdate().catch(() => null);
                    return bjEndGame(game, interaction.message, val > 21 ? 'lose' : null);
                }

                await interaction.update({ embeds: [bjBuildEmbed(game)], components: bjBuildRow(game) }).catch(() => null);
                game.timeoutHandle = setTimeout(() => { bjEndGame(game, interaction.message).catch(() => null); }, 60_000);
                return;
            }

            if (action === 'stand') {
                await interaction.deferUpdate().catch(() => null);
                return bjEndGame(game, interaction.message);
            }

            if (action === 'double') {
                const userData = getUserData(ownerId);
                if (userData.balance < game.totalBet) {
                    game.timeoutHandle = setTimeout(() => { bjEndGame(game, interaction.message).catch(() => null); }, 60_000);
                    return interaction.reply({ content: `❌ Không đủ xu để nhân đôi cược! Số dư: **${userData.balance.toLocaleString()} xu**`, ephemeral: true });
                }
                userData.balance -= game.totalBet;
                game.totalBet *= 2;
                game.doubled = true;
                saveEconomy();

                game.playerHand.push(bjDraw(game.deck));
                const val = bjHandValue(game.playerHand);
                await interaction.deferUpdate().catch(() => null);
                return bjEndGame(game, interaction.message, val > 21 ? 'lose' : null);
            }
        }

        // Nút End sớm Giveaway (chỉ admin)
        if (customId.startsWith('giveaway_end_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '🚫 Chỉ admin (quyền Manage Server) mới có thể kết thúc giveaway sớm.', ephemeral: true });
            }

            const msgId = customId.replace('giveaway_end_', '');
            const g = gConfig.giveaways?.[msgId];
            if (!g) return interaction.reply({ content: '❌ Không tìm thấy dữ liệu giveaway.', ephemeral: true });
            if (g.ended) return interaction.reply({ content: '🏁 Giveaway này đã kết thúc rồi.', ephemeral: true });

            // Dừng timer
            if (giveawayTimers.has(msgId)) {
                clearInterval(giveawayTimers.get(msgId));
                giveawayTimers.delete(msgId);
            }

            g.ended = true;
            g.endTime = Date.now(); // Ghi lại thời điểm kết thúc thực
            saveConfig();

            const giveChan = guild.channels.cache.get(gConfig.giveawayChannelId);
            if (giveChan) await updateGiveawayEmbed(giveChan, msgId, g, true);

            const parts = g.participants || [];
            if (parts.length === 0) {
                await interaction.channel.send({ content: `🎉 **Giveaway "${g.title}" đã bị kết thúc sớm bởi ${interaction.user.username}!**\n😔 Không có ai tham gia.` }).catch(() => null);
            } else {
                const winnerIds = [...parts].sort(() => Math.random() - 0.5).slice(0, Math.min(g.winners, parts.length));
                await interaction.channel.send({ content: `🎉 **Giveaway "${g.title}" đã bị kết thúc sớm bởi ${interaction.user.username}!**\n🏆 Người thắng: ${winnerIds.map(id => `<@${id}>`).join(', ')}\n🎁 Phần thưởng: **${g.prize}**\n\nChúc mừng! 🎊` }).catch(() => null);
            }

            return interaction.reply({ content: `✅ Đã kết thúc giveaway **"${g.title}"** sớm.`, ephemeral: true });
        }

        // Nút Reroll Giveaway (chỉ admin)
        if (customId.startsWith('giveaway_reroll_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '🚫 Chỉ admin (quyền Manage Server) mới có thể reroll giveaway.', ephemeral: true });
            }

            const msgId = customId.replace('giveaway_reroll_', '');
            const g = gConfig.giveaways?.[msgId];
            if (!g) return interaction.reply({ content: '❌ Không tìm thấy dữ liệu giveaway.', ephemeral: true });
            if (!g.ended) return interaction.reply({ content: '⚠️ Giveaway chưa kết thúc, không thể reroll.', ephemeral: true });

            const parts = g.participants || [];
            if (parts.length === 0) {
                return interaction.reply({ content: '😔 Không có ai tham gia giveaway này để reroll.', ephemeral: true });
            }

            const winnerIds = [...parts].sort(() => Math.random() - 0.5).slice(0, Math.min(g.winners, parts.length));
            await interaction.channel.send({
                content: `🎲 **Reroll Giveaway "${g.title}"!**\n🏆 Người thắng mới: ${winnerIds.map(id => `<@${id}>`).join(', ')}\n🎁 Phần thưởng: **${g.prize}**\n\nChúc mừng! 🎊`
            }).catch(() => null);

            return interaction.reply({ content: `✅ Đã reroll thành công!`, ephemeral: true });
        }

        // Nút tham gia Giveaway
        if (customId.startsWith('giveaway_join_')) {
            const msgId = customId.replace('giveaway_join_', '');
            const g = gConfig.giveaways?.[msgId];

            if (!g) return interaction.reply({ content: '❌ Không tìm thấy dữ liệu giveaway này.', ephemeral: true });
            if (g.ended) return interaction.reply({ content: '🏁 Giveaway này đã kết thúc rồi!', ephemeral: true });

            if (!g.participants) g.participants = [];

            if (g.participants.includes(user.id)) {
                // Rút khỏi giveaway
                g.participants = g.participants.filter(id => id !== user.id);
                saveConfig();
                const giveChan = guild.channels.cache.get(gConfig.giveawayChannelId);
                if (giveChan) await updateGiveawayEmbed(giveChan, msgId, g, false);
                return interaction.reply({ content: '↩️ Bạn đã **rút khỏi** giveaway này.', ephemeral: true });
            }

            g.participants.push(user.id);
            saveConfig();
            const giveChan = guild.channels.cache.get(gConfig.giveawayChannelId);
            if (giveChan) await updateGiveawayEmbed(giveChan, msgId, g, false);
            return interaction.reply({ content: `✅ Bạn đã **tham gia** giveaway **"${g.title}"** thành công!\n🎁 Phần thưởng: **${g.prize}**\n⏳ Kết thúc lúc: ${formatTimeVN(g.endTime)}\n\n*(Bấm lại nút để rút khỏi giveaway)*`, ephemeral: true });
        }

        if (customId === 'verify_btn') {
            if (!gConfig.isVerifySetup) {
                await interaction.reply({ content: '⚠️ Hệ thống xác thực chưa được kích hoạt.', ephemeral: true });
                return;
            }

            try {
                if (gConfig.verifiedRoleId && member.roles.cache.has(gConfig.verifiedRoleId)) {
                    const modeNote = gConfig.verifyDailyMode ? '\n⏰ Xác thực của bạn sẽ được **reset lúc 00:00** hôm nay (múi giờ Việt Nam).' : '';
                    await interaction.reply({ content: `✅ Bạn đã xác thực trước đó rồi!${modeNote}`, ephemeral: true });
                    setTimeout(() => interaction.deleteReply().catch(() => null), 5000);
                    return;
                }

                if (gConfig.unverifiedRoleId) await member.roles.remove(gConfig.unverifiedRoleId).catch(() => null);
                if (gConfig.verifiedRoleId) await member.roles.add(gConfig.verifiedRoleId).catch(() => null);

                // Ghi nhớ thành viên nếu đang dùng chế độ 24h
                if (gConfig.verifyDailyMode) {
                    if (!gConfig.verifyDailyMembers) gConfig.verifyDailyMembers = {};
                    gConfig.verifyDailyMembers[member.id] = true;
                    saveConfig();
                }

                const modeMsg = gConfig.verifyDailyMode
                    ? '🎉 **Xác thực thành công!** Chào mừng bạn đến với server.\n⏰ Lưu ý: Xác thực của bạn sẽ **hết hạn lúc 00:00** (múi giờ Việt Nam) và cần xác thực lại vào ngày hôm sau.'
                    : '🎉 **Xác thực thành công!** Chào mừng bạn đến với server, giờ bạn đã có thể xem toàn bộ kênh.';

                await interaction.reply({ content: modeMsg, ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(() => null), 8000);
            } catch (err) {
                console.error('Lỗi khi xác thực thành viên:', err);
                await interaction.reply({ content: '❌ Có lỗi xảy ra, vui lòng báo Admin (có thể do Bot thiếu quyền Manage Roles hoặc vị trí role).', ephemeral: true }).catch(() => null);
            }
            return;
        }

        if (customId === 'check_in_btn' || customId === 'check_out_btn') {
            if (!gConfig.attendance) gConfig.attendance = {};
            if (!gConfig.history) gConfig.history = {};

            const logChannel = gConfig.logChannelId ? guild.channels.cache.get(gConfig.logChannelId) : null;
            
            const now = nowVN();
            const dateString = `${String(now.getUTCDate()).padStart(2,'0')}/${String(now.getUTCMonth()+1).padStart(2,'0')}/${now.getUTCFullYear()}`;

            if (customId === 'check_in_btn') {
                if (gConfig.attendance[user.id]) {
                    await interaction.reply({ content: '⚠️ Bạn đã check-in trước đó rồi và chưa kết thúc ca làm cũ!', ephemeral: true });
                    setTimeout(() => interaction.deleteReply().catch(() => null), 5000);
                    return;
                }
                gConfig.attendance[user.id] = new Date().toISOString(); saveConfig();
                
                await interaction.reply({ content: `🟢 **Check-In Thành Công!** Lúc: \`${formatTimeVN(Date.now()).split(' ')[0]} ${dateString}\``, ephemeral: true });
                setTimeout(() => interaction.deleteReply().catch(() => null), 5000);
                
                if (logChannel) {
                    logChannel.send({ embeds: [
                        new EmbedBuilder()
                            .setColor('#2ECC71')
                            .setTitle('📥 THÔNG BÁO VÀO CA (CHECK-IN)')
                            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Nhân sự **${user.tag}** vừa kích hoạt chấm công trực tuyến.`)
                            .addFields(
                                { name: '👤 Nhân Sự', value: `${user}`, inline: true },
                                { name: '📅 Ngày Làm Việc', value: `\`${dateString}\``, inline: true },
                                { name: '⏰ Giờ Vào Ca', value: `\`${formatTimeVN(Date.now()).split(' ')[0]}\``, inline: true }
                            ).setTimestamp()
                    ] }).catch(() => null);
                }
                return;
            }

            if (customId === 'check_out_btn') {
                if (!gConfig.attendance[user.id]) {
                    await interaction.reply({ content: '❌ Bạn chưa bấm Check-In đầu ca!', ephemeral: true });
                    setTimeout(() => interaction.deleteReply().catch(() => null), 5000);
                    return;
                }
                
                const checkInTime = new Date(gConfig.attendance[user.id]);
                const nowReal = new Date();
                const diffMs = nowReal - checkInTime;
                const diffHours = diffMs / (1000 * 60 * 60);

                delete gConfig.attendance[user.id];
                if (!gConfig.history[user.id]) gConfig.history[user.id] = { username: user.username, records: [] };
                gConfig.history[user.id].records.push({ checkIn: checkInTime.toISOString(), checkOut: nowReal.toISOString(), hours: diffHours });
                saveConfig();

                const totalSeconds = Math.floor(diffMs / 1000);
                const displayHours = Math.floor(totalSeconds / 3600);
                const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
                const displaySeconds = totalSeconds % 60;

                await interaction.reply({ 
                    content: `🔴 **Check-Out Thành Công!**\n• Thời gian làm việc: \`${displayHours} giờ ${displayMinutes} phút ${displaySeconds} giây\`.`, 
                    ephemeral: true 
                });
                setTimeout(() => interaction.deleteReply().catch(() => null), 5000);
                
                if (logChannel) {
                    logChannel.send({ embeds: [
                        new EmbedBuilder()
                            .setColor('#E74C3C')
                            .setTitle('📤 THÔNG BÁO RA CA (CHECK-OUT)')
                            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Nhân sự **${user.tag}** đã hoàn thành ca làm việc.`)
                            .addFields(
                                { name: '👤 Nhân Sự', value: `${user}`, inline: true },
                                { name: '📅 Ngày Làm Việc', value: `\`${dateString}\``, inline: true },
                                { name: '⏰ Giờ Vào Ca', value: `\`${formatTimeVN(checkInTime).split(' ')[0]}\``, inline: true }, 
                                { name: '⏰ Giờ Rời Ca', value: `\`${formatTimeVN(Date.now()).split(' ')[0]}\``, inline: true },   
                                { name: '⏱️ Tổng Thời Gian Làm', value: `\`${displayHours} giờ ${displayMinutes} phút ${displaySeconds} giây\``, inline: false }
                            ).setTimestamp()
                    ] }).catch(() => null);
                }
                return;
            }
        }

        if (customId.startsWith('create_ticket_btn')) {
            if (!gConfig.isSetupCompleted) {
                await interaction.reply({ content: '⚠️ Hệ thống chưa sẵn sàng, vui lòng liên hệ admin.', ephemeral: true });
                return;
            }
            const buttonLabel = customId.includes(':') ? customId.split(':')[1] : 'Ticket';
            const modal = new ModalBuilder().setCustomId(`ticket_modal:${buttonLabel}`).setTitle(`Form Gửi Nội Dung Hỗ Trợ`);
            const contentInput = new TextInputBuilder()
                .setCustomId('ticket_reason_input').setLabel('Nội dung cần hỗ trợ ngắn gọn là gì?').setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Ví dụ: loi-game, nap-the...').setRequired(true).setMaxLength(50); 

            modal.addComponents(new ActionRowBuilder().addComponents(contentInput));
            return interaction.showModal(modal);
        }

        try {
            if (customId === 'accept_ticket_btn') {
                if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    await interaction.reply({ content: '❌ Bạn không có quyền tiếp nhận Ticket này!', ephemeral: true });
                    return;
                }
                if (ticketTimeouts.has(channel.id)) { clearTimeout(ticketTimeouts.get(channel.id)); ticketTimeouts.delete(channel.id); }

                const originEmbed = interaction.message.embeds[0]; if (!originEmbed) return;
                const creatorId = originEmbed.footer?.text?.replace('ID Người tạo: ', '').trim() || '';
                
                const updatedEmbed = EmbedBuilder.from(originEmbed)
                    .setColor('#2ECC71') 
                    .setDescription(
                        originEmbed.description.split('\n\n• **Phân loại:**')[0] + 
                        `\n\n• **Phân loại:** Ticket\n• **Trạng thái:** 🟢 ĐÃ TIẾP NHẬN\n• **Nhân sự hỗ trợ:** ${user}`
                    )
                    .setFooter({ text: `ID Người tạo: ${creatorId} | Thợ xử lý: ${user.id}` }); 

                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('reject_ticket_btn').setLabel('❌ Hủy Nhận').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('close_ticket_btn').setLabel('🔒 Đóng Ticket').setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ embeds: [updatedEmbed], components: [updatedRow] });
                return channel.send({ content: `🔔 <@${creatorId}> ơi, quản trị viên ${user} đã nhận xử lý ca hỗ trợ này!` });
            }

            if (customId === 'reject_ticket_btn') {
                const originEmbed = interaction.message.embeds[0]; if (!originEmbed) return;
                const footerText = originEmbed?.footer?.text || "";
                const creatorId = footerText.replace('ID Người tạo: ', '').split('|')[0].trim();
                const staffPart = footerText.split('Thợ xử lý: ')[1];
                const previousStaffId = staffPart ? staffPart.trim() : null;

                if (user.id !== previousStaffId) {
                    await interaction.reply({ content: '❌ Bạn không phải là người đã nhận ca này!', ephemeral: true });
                    return;
                }

                const cooldownTime = 12 * 60 * 60 * 1000; 
                const targetTime = new Date(Date.now() + cooldownTime);
                const autoCloseTimestamp = Math.floor(targetTime.getTime() / 1000);
                const timeString = formatTimeVN(targetTime);
                const reasonField = originEmbed.fields?.find(f => f.name.includes('Chi tiết yêu cầu'))?.value || "Không rõ";

                const rolledBackEmbed = new EmbedBuilder()
                    .setColor('#F1C40F') 
                    .setTitle(originEmbed.title || `🎫 Kênh Ticket`)
                    .setDescription(
                        `${gConfig.ticketWelcomeMessage ? gConfig.ticketWelcomeMessage.replace(/\\n/g, '\n') : "Vui lòng ghi rõ nội dung cần hỗ trợ."}\n\n` +
                        `⚠️ **CẢNH BÁO HỆ THỐNG:** Ca hỗ trợ này vừa bị hủy nhận bởi một Quản trị viên trước đó.\n` +
                        `• **Trạng thái:** ⏳ Đang chờ người khác tiếp nhận\n` +
                        `• **Tự động xóa phòng vào lúc:** \`${timeString}\``
                    )
                    .addFields({ name: '📝 Chi tiết yêu cầu mở phòng:', value: reasonField })
                    .setFooter({ text: `ID Người tạo: ${creatorId}` });

                const rolledBackRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('accept_ticket_btn').setLabel('✅ Chấp Nhận').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('close_ticket_btn').setLabel('🔒 Đóng Ticket').setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ embeds: [rolledBackEmbed], components: [rolledBackRow] });

                if (ticketTimeouts.has(channel.id)) clearTimeout(ticketTimeouts.get(channel.id));

                const timeoutId = setTimeout(async () => {
                    const checkChan = guild.channels.cache.get(channel.id);
                    if (checkChan) {
                        await checkChan.send({ content: `⏰ **Đã hết thời gian chờ 12 tiếng sau khi hủy ca!** Kênh tự động hủy bảo mật.` }).catch(() => null);
                        await closeAndArchiveTicket(checkChan, guild, "Hệ thống tự động đóng phòng (Quá hạn Cooldown 12 tiếng)", gConfig, creatorId);
                    }
                }, cooldownTime);

                ticketTimeouts.set(channel.id, timeoutId);

                return channel.send({ 
                    content: `⚠️ **CẢNH BÁO COOLDOWN (HỦY CA)**\n• **Nhân sự vừa hủy:** ${user}\n• **Chủ phòng hỗ trợ:** <@${creatorId}>\n⏱️ **Hệ thống tự động xóa kênh:** **<t:${autoCloseTimestamp}:R>**` 
                });
            }

            if (customId === 'close_ticket_btn') {
                const originEmbed = interaction.message.embeds[0];
                const footerText = originEmbed?.footer?.text || "";
                const creatorId = footerText.replace('ID Người tạo: ', '').split('|')[0].trim();

                if (user.id !== creatorId && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    await interaction.reply({ content: '❌ Bạn không có quyền đóng phòng này!', ephemeral: true });
                    return;
                }

                await interaction.reply({ content: `💾 **Đang xóa phòng và lưu trữ dữ liệu vĩnh viễn...**` });
                await closeAndArchiveTicket(channel, guild, user, gConfig, creatorId);
                return;
            }

            // ==========================================
            // 🔊 NÚT MỞ BẢNG QUẢN LÝ PHÒNG VOICE RIÊNG
            // ==========================================
            if (customId === 'voiceroom_settings_btn') {
                const voiceChannel = member.voice?.channel;
                if (!gConfig.voiceRooms) gConfig.voiceRooms = {};

                if (!voiceChannel || !(voiceChannel.id in gConfig.voiceRooms)) {
                    return interaction.reply({ content: '❌ Bạn cần đang ở trong **phòng Voice riêng** của mình để dùng chức năng này.', ephemeral: true });
                }

                const ownerId = gConfig.voiceRooms[voiceChannel.id];
                if (ownerId !== user.id && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return interaction.reply({ content: '❌ Chỉ **chủ phòng** mới có quyền quản lý phòng này.', ephemeral: true });
                }

                const everyoneOverwrite = voiceChannel.permissionOverwrites.cache.get(guild.id);
                const isLocked = everyoneOverwrite?.deny.has(PermissionFlagsBits.Connect) || false;
                const isHidden = everyoneOverwrite?.deny.has(PermissionFlagsBits.ViewChannel) || false;

                const settingsEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`⚙️ Quản Lý: ${voiceChannel.name}`)
                    .setDescription(
                        `👑 Chủ phòng: <@${ownerId}>\n` +
                        `👥 Giới hạn hiện tại: **${voiceChannel.userLimit === 0 ? 'Không giới hạn' : voiceChannel.userLimit}**\n` +
                        `🔒 Trạng thái khóa: **${isLocked ? 'Đã khóa' : 'Đang mở'}**\n` +
                        `🙈 Trạng thái ẩn: **${isHidden ? 'Đã ẩn' : 'Đang hiện'}**`
                    );

                const vrRow1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`vr_lock:${voiceChannel.id}`).setLabel(isLocked ? '🔓 Mở Phòng' : '🔒 Khóa Phòng').setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId(`vr_hide:${voiceChannel.id}`).setLabel(isHidden ? '👁️ Hiện Phòng' : '🙈 Ẩn Phòng').setStyle(isHidden ? ButtonStyle.Success : ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`vr_rename:${voiceChannel.id}`).setLabel('✏️ Đổi Tên').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`vr_limit:${voiceChannel.id}`).setLabel('🔢 Giới Hạn').setStyle(ButtonStyle.Primary)
                );
                const vrRow2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`vr_kick:${voiceChannel.id}`).setLabel('👢 Kick Thành Viên').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`vr_transfer:${voiceChannel.id}`).setLabel('👑 Chuyển Chủ Phòng').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`vr_delete:${voiceChannel.id}`).setLabel('🗑️ Xóa Phòng').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setLabel('🌐 Máy Chủ Hỗ Trợ').setStyle(ButtonStyle.Link).setURL(SUPPORT_LINK)
                );

                return interaction.reply({ embeds: [settingsEmbed], components: [vrRow1, vrRow2], ephemeral: true });
            }

            // ==========================================
            // 🔊 CÁC NÚT THAO TÁC TRÊN PHÒNG VOICE RIÊNG (vr_*)
            // ==========================================
            if (customId.startsWith('vr_') && customId.includes(':')) {
                const [vrAction, targetChanId] = customId.split(':');
                if (!gConfig.voiceRooms) gConfig.voiceRooms = {};

                const voiceChannel = guild.channels.cache.get(targetChanId);
                if (!voiceChannel || !(targetChanId in gConfig.voiceRooms)) {
                    return interaction.reply({ content: '❌ Phòng này không còn tồn tại.', ephemeral: true });
                }

                const ownerId = gConfig.voiceRooms[targetChanId];
                if (ownerId !== user.id && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return interaction.reply({ content: '❌ Chỉ **chủ phòng** mới có quyền quản lý phòng này.', ephemeral: true });
                }

                if (vrAction === 'vr_lock') {
                    const everyoneOverwrite = voiceChannel.permissionOverwrites.cache.get(guild.id);
                    const isLocked = everyoneOverwrite?.deny.has(PermissionFlagsBits.Connect) || false;
                    await voiceChannel.permissionOverwrites.edit(guild.id, { Connect: isLocked ? null : false }).catch(() => null);
                    return interaction.reply({ content: isLocked ? '🔓 Đã **mở** phòng, mọi người có thể vào lại.' : '🔒 Đã **khóa** phòng, không ai vào thêm được nữa.', ephemeral: true });
                }

                if (vrAction === 'vr_hide') {
                    const everyoneOverwrite = voiceChannel.permissionOverwrites.cache.get(guild.id);
                    const isHidden = everyoneOverwrite?.deny.has(PermissionFlagsBits.ViewChannel) || false;
                    await voiceChannel.permissionOverwrites.edit(guild.id, { ViewChannel: isHidden ? null : false }).catch(() => null);
                    return interaction.reply({ content: isHidden ? '👁️ Đã **hiện** phòng trở lại trong danh sách kênh.' : '🙈 Đã **ẩn** phòng khỏi danh sách kênh.', ephemeral: true });
                }

                if (vrAction === 'vr_delete') {
                    await interaction.reply({ content: '🗑️ Đang xóa phòng...', ephemeral: true });
                    delete gConfig.voiceRooms[targetChanId];
                    saveConfig();
                    await voiceChannel.delete().catch(() => null);
                    return;
                }

                if (vrAction === 'vr_rename') {
                    const modal = new ModalBuilder().setCustomId(`vr_rename_modal:${voiceChannel.id}`).setTitle('Đổi Tên Phòng Voice');
                    const nameInput = new TextInputBuilder()
                        .setCustomId('vr_new_name').setLabel('Tên phòng mới').setStyle(TextInputStyle.Short)
                        .setValue(voiceChannel.name).setMaxLength(90).setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                    return interaction.showModal(modal);
                }

                if (vrAction === 'vr_limit') {
                    const modal = new ModalBuilder().setCustomId(`vr_limit_modal:${voiceChannel.id}`).setTitle('Giới Hạn Thành Viên Phòng');
                    const limitInput = new TextInputBuilder()
                        .setCustomId('vr_new_limit').setLabel('Số người tối đa (0 = không giới hạn, tối đa 99)')
                        .setStyle(TextInputStyle.Short).setValue(String(voiceChannel.userLimit || 0)).setMaxLength(2).setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
                    return interaction.showModal(modal);
                }

                if (vrAction === 'vr_kick' || vrAction === 'vr_transfer') {
                    const humanMembers = voiceChannel.members.filter(m => !m.user.bot && m.id !== ownerId);
                    if (humanMembers.size === 0) {
                        return interaction.reply({ content: '❌ Không có thành viên nào khác trong phòng để chọn.', ephemeral: true });
                    }

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`${vrAction}_select:${voiceChannel.id}`)
                        .setPlaceholder(vrAction === 'vr_kick' ? '👢 Chọn thành viên cần kick...' : '👑 Chọn người nhận quyền chủ phòng...')
                        .addOptions(humanMembers.map(m => new StringSelectMenuOptionBuilder().setLabel(m.displayName).setValue(m.id)).slice(0, 25));

                    return interaction.reply({ components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
                }
            }
        } catch (err) { console.error(err); }
    }

    // ==========================================
    // KHỐI 3: XỬ LÝ KHI USER SUBMIT FORM MODAL
    // ==========================================
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal:')) {
        const buttonText = interaction.customId.split(':')[1] || 'Ticket';
        const userReason = interaction.fields.getTextInputValue('ticket_reason_input');
        
        const cleanReasonPrefix = removeAccentsAndSpaces(userReason);
        const cleanUsername = removeAccentsAndSpaces(user.username);
        const channelName = `🎫-${cleanReasonPrefix}-${cleanUsername}`;

        const existingChannel = guild.channels.cache.find(ch => ch.parentId === gConfig.ticketCategoryId && ch.name === channelName);
        if (existingChannel) {
            await interaction.reply({ content: `⚠️ Bạn có một kênh hỗ trợ tương tự đang mở: ${existingChannel}`, ephemeral: true });
            return;
        }

        const baseOverwrites = [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }, 
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } 
        ];
        guild.roles.cache.forEach(role => {
            if (role.id !== guild.id && role.permissions.has(PermissionFlagsBits.ManageChannels)) {
                baseOverwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
            }
        });

        const ticketChannel = await guild.channels.create({
            name: channelName, type: ChannelType.GuildText, parent: gConfig.ticketCategoryId || null, permissionOverwrites: baseOverwrites
        });

        registerCreatedChannel(ticketChannel.id, guild.id);

        const waitTime = 24 * 60 * 60 * 1000;
        const targetExpireTime = new Date(Date.now() + waitTime);
        const expireTimestamp = Math.floor(targetExpireTime.getTime() / 1000);
        const expireTimeString = formatTimeVN(targetExpireTime);

        const customWelcomeText = gConfig.ticketWelcomeMessage ? gConfig.ticketWelcomeMessage.replace(/\\n/g, '\n') : "Vui lòng ghi rõ nội dung cần hỗ trợ.";
        const insideEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle(`🎫 Kênh Ticket - ${user.username}`)
            .setDescription(`${customWelcomeText}\n\n• **Phân loại:** \`${buttonText}\`\n• **Người tạo:** ${user}\n• **Trạng thái:** ⏳ Đang chờ hỗ trợ\n• **Tự động xóa phòng vào lúc:** \`${expireTimeString}\``)
            .addFields({ name: '📝 Chi tiết yêu cầu mở phòng:', value: `\`\`\`${userReason}\`\`\`` })
            .setFooter({ text: `ID Người tạo: ${user.id}` });

        const ticketRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accept_ticket_btn').setLabel('✅ Chấp Nhận').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('close_ticket_btn').setLabel('🔒 Đóng Ticket').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `🔔 **Yêu cầu mới!** ${user} | Ban Quản Trị: ${getAdminRoleMention(guild)}`, embeds: [insideEmbed], components: [ticketRow] });
        await ticketChannel.send({ content: `⚠️ **THÔNG BÁO CHỜ DUYỆT:** Tự động xóa sau **<t:${expireTimestamp}:R>** nếu không có admin nhận.` }).catch(() => null);

        if (ticketTimeouts.has(ticketChannel.id)) clearTimeout(ticketTimeouts.get(ticketChannel.id));
        const timeoutId = setTimeout(async () => {
            const checkChan = guild.channels.cache.get(ticketChannel.id);
            if (checkChan) await closeAndArchiveTicket(checkChan, guild, "Hệ thống tự động đóng phòng (Quá hạn duyệt 24 tiếng)", gConfig, user.id);
        }, waitTime);
        ticketTimeouts.set(ticketChannel.id, timeoutId);
        
        await interaction.reply({ content: `🎉 Đã tạo phòng hỗ trợ thành công: ${ticketChannel}`, ephemeral: true });
        setTimeout(() => interaction.deleteReply().catch(() => null), 5000);
        return;
    }

    // ==========================================
    // 🔊 XỬ LÝ MODAL ĐỔI TÊN / GIỚI HẠN PHÒNG VOICE RIÊNG
    // ==========================================
    if (interaction.isModalSubmit() && (interaction.customId.startsWith('vr_rename_modal:') || interaction.customId.startsWith('vr_limit_modal:'))) {
        const [modalType, targetChanId] = interaction.customId.split(':');
        if (!gConfig.voiceRooms) gConfig.voiceRooms = {};

        const voiceChannel = guild.channels.cache.get(targetChanId);
        if (!voiceChannel || !(targetChanId in gConfig.voiceRooms)) {
            return interaction.reply({ content: '❌ Phòng này không còn tồn tại.', ephemeral: true });
        }

        const ownerId = gConfig.voiceRooms[targetChanId];
        if (ownerId !== user.id && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ Bạn không còn là chủ phòng này.', ephemeral: true });
        }

        if (modalType === 'vr_rename_modal') {
            const newName = interaction.fields.getTextInputValue('vr_new_name').trim().slice(0, 100);
            if (!newName) return interaction.reply({ content: '❌ Tên phòng không được để trống.', ephemeral: true });
            try {
                await voiceChannel.setName(newName);
                return interaction.reply({ content: `✏️ Đã đổi tên phòng thành **${newName}**.`, ephemeral: true });
            } catch (err) {
                console.error("❌ Lỗi đổi tên kênh voice:", err);
                return interaction.reply({ content: '❌ Không thể đổi tên phòng. Có thể bạn đã chạm giới hạn tần suất của Discord (tối đa 2 lần đổi tên trong 10 phút). Vui lòng thử lại sau!', ephemeral: true }).catch(() => null);
            }
        }

        if (modalType === 'vr_limit_modal') {
            const raw = interaction.fields.getTextInputValue('vr_new_limit').trim();
            const limit = parseInt(raw, 10);
            if (isNaN(limit) || limit < 0 || limit > 99) {
                return interaction.reply({ content: '❌ Vui lòng nhập số từ 0 đến 99 (0 = không giới hạn).', ephemeral: true });
            }
            try {
                await voiceChannel.setUserLimit(limit);
                return interaction.reply({ content: `🔢 Đã đặt giới hạn thành viên: **${limit === 0 ? 'Không giới hạn' : limit}**.`, ephemeral: true });
            } catch (err) {
                console.error("❌ Lỗi đặt giới hạn kênh voice:", err);
                return interaction.reply({ content: '❌ Không thể đặt giới hạn phòng. Có thể bạn đã chạm giới hạn tần suất của Discord (tối đa 2 lần thay đổi trong 10 phút). Vui lòng thử lại sau!', ephemeral: true }).catch(() => null);
            }
        }
    }

    // ==========================================
    // 🔊 XỬ LÝ CHỌN THÀNH VIÊN ĐỂ KICK / CHUYỂN CHỦ PHÒNG VOICE RIÊNG
    // ==========================================
    if (interaction.isStringSelectMenu() && (interaction.customId.startsWith('vr_kick_select:') || interaction.customId.startsWith('vr_transfer_select:'))) {
        const [selectAction, targetChanId] = interaction.customId.split(':');
        if (!gConfig.voiceRooms) gConfig.voiceRooms = {};

        const voiceChannel = guild.channels.cache.get(targetChanId);
        if (!voiceChannel || !(targetChanId in gConfig.voiceRooms)) {
            return interaction.update({ content: '❌ Phòng này không còn tồn tại.', components: [] });
        }

        const ownerId = gConfig.voiceRooms[targetChanId];
        if (ownerId !== user.id && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.update({ content: '❌ Bạn không còn là chủ phòng này.', components: [] });
        }

        const targetId = interaction.values[0];
        const targetMember = guild.members.cache.get(targetId);

        if (selectAction === 'vr_kick_select') {
            if (targetMember?.voice.channelId === voiceChannel.id) await targetMember.voice.disconnect().catch(() => null);
            return interaction.update({ content: `👢 Đã kick <@${targetId}> khỏi phòng.`, components: [] });
        }

        if (selectAction === 'vr_transfer_select') {
            await voiceChannel.permissionOverwrites.edit(targetId, {
                ManageChannels: true, MoveMembers: true, MuteMembers: true,
                DeafenMembers: true, Connect: true, ViewChannel: true
            }).catch(() => null);
            await voiceChannel.permissionOverwrites.edit(ownerId, {
                ManageChannels: null, MoveMembers: null, MuteMembers: null, DeafenMembers: null
            }).catch(() => null);

            gConfig.voiceRooms[targetChanId] = targetId;
            saveConfig();

            return interaction.update({ content: `👑 Đã chuyển quyền chủ phòng cho <@${targetId}>.`, components: [] });
        }
    }
  } catch (err) {
    console.error(`❌ [interactionCreate] Lỗi khi xử lý "${interaction.commandName || interaction.customId || 'unknown'}":`, err);
    const errMsg = { content: '❌ Đã xảy ra lỗi khi xử lý yêu cầu này. Vui lòng thử lại, nếu vẫn lỗi hãy báo Admin kiểm tra console.', ephemeral: true };
    if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
            interaction.editReply(errMsg).catch(() => null);
        } else {
            interaction.reply(errMsg).catch(() => null);
        }
    }
  }
});

// -----------------------------------------------------------------
// 🔑 ĐĂNG NHẬP BOT
// -----------------------------------------------------------------
if (!config.token || config.token.trim() === "") {
    console.error("❌ LỖI: Chưa nhập token trong config.json!"); 
    process.exit(1);
} else {
    client.login(config.token.trim()).catch((err) => {
        console.error("❌ LỖI ĐĂNG NHẬP BOT — chi tiết:", err);
        console.error("👉 Nếu thấy 'disallowed intents': vào Discord Developer Portal → Bot → bật 'Server Members Intent' và 'Message Content Intent'.");
    });
}