const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Discord Bot設定
const DISCORD_CONFIG = {
    // 必要なIntentsを明示的に指定
    intents: [
        // 基本的なギルド情報
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildIntegrations,
        
        // Privileged Intents
        GatewayIntentBits.MessageContent,  // メッセージ内容の読み取り
        GatewayIntentBits.GuildMembers,    // メンバー情報の取得
        
        // オプション（必要に応じて）
        // GatewayIntentBits.GuildPresences,
    ],
    
    // Partialsの設定（キャッシュされていないデータも処理）
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
    ],
    
    // その他の最適化設定
    shards: 'auto',
    failIfNotExists: false,
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true,
    },
};

// クライアント作成関数
function createDiscordClient() {
    const client = new Client(DISCORD_CONFIG);
    
    // エラーハンドリング
    client.on('error', (error) => {
        console.error('Discord client error:', error);
    });
    
    client.on('warn', (warning) => {
        console.warn('Discord client warning:', warning);
    });
    
    return client;
}

module.exports = {
    createDiscordClient,
    DISCORD_CONFIG,
};