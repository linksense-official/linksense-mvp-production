const { createDiscordClient } = require('./config/discord.config');
const PrivacyFirstMessageProcessor = require('./services/discord/messageProcessor');
const { connectDatabase } = require('./database/connection');
const { registerCommands } = require('./utils/commandRegistrar');
const { startMetricsCollection } = require('./services/metrics');

// 環境変数の読み込み
require('dotenv').config();

// グローバルエラーハンドリング
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

class LinkSenseBot {
    constructor() {
        this.client = createDiscordClient();
        this.messageProcessor = new PrivacyFirstMessageProcessor();
        this.isReady = false;
    }
    
    async start() {
        try {
            // データベース接続
            await connectDatabase();
            console.log('✅ Database connected');
            
            // イベントハンドラーの設定
            this.setupEventHandlers();
            
            // コマンドの登録
            await registerCommands(this.client);
            console.log('✅ Commands registered');
            
            // メトリクス収集の開始
            startMetricsCollection();
            console.log('✅ Metrics collection started');
            
            // Discordにログイン
            await this.client.login(process.env.DISCORD_BOT_TOKEN);
            
        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }
    
    setupEventHandlers() {
        // Ready イベント
        this.client.once('ready', () => {
            console.log(`✅ Bot is ready! Logged in as ${this.client.user.tag}`);
            console.log(`📊 Serving ${this.client.guilds.cache.size} guilds`);
            this.isReady = true;
            
            // ステータスの設定
            this.client.user.setActivity('Analyzing shared links', { 
                type: 'WATCHING' 
            });
            
            // 定期的なクリーンアップ
            setInterval(() => {
                this.messageProcessor.cleanup();
            }, 300000); // 5分ごと
        });
        
        // メッセージ作成イベント（Message Content Intent使用）
        this.client.on('messageCreate', async (message) => {
            if (!this.isReady) return;
            
            try {
                const processedData = await this.messageProcessor.processMessage(message);
                
                if (processedData && processedData.urls.length > 0) {
                    // URLが含まれている場合の処理
                    await this.handleProcessedMessage(processedData);
                }
                
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });
        
        // ギルド参加イベント（Server Members Intent使用）
        this.client.on('guildMemberAdd', async (member) => {
            if (!this.isReady) return;
            
            try {
                // 新規メンバーの初期設定
                console.log(`New member joined: ${member.user.tag} in ${member.guild.name}`);
                // 必要に応じて初期設定を行う
                
            } catch (error) {
                console.error('Error handling new member:', error);
            }
        });
        
        // インタラクション（スラッシュコマンド）
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;
            
            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;
            
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                
                const errorMessage = 'There was an error executing this command!';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: errorMessage, 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: errorMessage, 
                        ephemeral: true 
                    });
                }
            }
        });
        
        // エラーハンドリング
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
        });
        
        this.client.on('warn', (warning) => {
            console.warn('Discord client warning:', warning);
        });
    }
    
    async handleProcessedMessage(processedData) {
        // ここでURLの分析、保存、統計更新などを行う
        console.log(`Processed ${processedData.urls.length} URLs from channel ${processedData.channelId}`);
        
        // TODO: 実際の分析ロジックを実装
        // - URL分類
        // - 統計更新
        // - レポート生成
    }
    
    async shutdown() {
        console.log('Shutting down bot...');
        
        // クリーンアップ処理
        this.messageProcessor.cleanup();
        
        // Discordクライアントの破棄
        this.client.destroy();
        
        // データベース接続のクローズ
        // await closeDatabase();
        
        console.log('Bot shutdown complete');
    }
}

// ボットの起動
const bot = new LinkSenseBot();

// グレースフルシャットダウン
process.on('SIGINT', async () => {
    await bot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.shutdown();
    process.exit(0);
});

// 起動
bot.start().catch(console.error);