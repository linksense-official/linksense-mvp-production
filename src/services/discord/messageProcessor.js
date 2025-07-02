const { extractURLsFromText } = require('../../utils/urlExtractor');
const { isUserOptedOut } = require('../../database/userPreferences');
const crypto = require('crypto');

class PrivacyFirstMessageProcessor {
    constructor() {
        this.processedMessages = new Map(); // 重複処理防止
        this.MESSAGE_CACHE_TTL = 60000; // 1分後に自動削除
    }
    
    /**
     * メッセージを処理（プライバシー保護付き）
     */
    async processMessage(message) {
        try {
            // 1. 基本的なフィルタリング
            if (this.shouldIgnoreMessage(message)) {
                return null;
            }
            
            // 2. ユーザーのオプトアウト確認
            const isOptedOut = await isUserOptedOut(message.author.id);
            if (isOptedOut) {
                console.log(`User ${message.author.id} has opted out`);
                return null;
            }
            
            // 3. 重複処理の防止
            const messageHash = this.generateMessageHash(message);
            if (this.processedMessages.has(messageHash)) {
                return null;
            }
            
            // 4. URLの抽出（メッセージ内容は保持しない）
            const urls = extractURLsFromText(message.content);
            
            // 5. メッセージ内容を即座にクリア
            const processedData = {
                messageId: message.id,
                channelId: message.channel.id,
                guildId: message.guild?.id,
                authorId: this.hashUserId(message.author.id), // 匿名化
                urls: urls,
                timestamp: new Date().toISOString(),
                channelType: message.channel.type,
                // メッセージ内容は含めない
            };
            
            // 6. 処理済みとしてマーク（TTL付き）
            this.markAsProcessed(messageHash);
            
            return processedData;
            
        } catch (error) {
            console.error('Error processing message:', error);
            return null;
        }
    }
    
    /**
     * メッセージを無視すべきか判定
     */
    shouldIgnoreMessage(message) {
        // Botのメッセージは無視
        if (message.author.bot) return true;
        
        // DMは処理しない
        if (!message.guild) return true;
        
        // システムメッセージは無視
        if (message.system) return true;
        
        // 空のメッセージは無視
        if (!message.content || message.content.trim() === '') return true;
        
        return false;
    }
    
    /**
     * ユーザーIDを匿名化
     */
    hashUserId(userId) {
        // 環境変数からソルトを取得
        const salt = process.env.USER_HASH_SALT || 'default-salt';
        return crypto
            .createHash('sha256')
            .update(userId + salt)
            .digest('hex')
            .substring(0, 16); // 短縮版
    }
    
    /**
     * メッセージのハッシュを生成（重複検出用）
     */
    generateMessageHash(message) {
        const content = `${message.id}-${message.author.id}-${message.createdTimestamp}`;
        return crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }
    
    /**
     * メッセージを処理済みとしてマーク
     */
    markAsProcessed(messageHash) {
        this.processedMessages.set(messageHash, Date.now());
        
        // TTL後に自動削除
        setTimeout(() => {
            this.processedMessages.delete(messageHash);
        }, this.MESSAGE_CACHE_TTL);
    }
    
    /**
     * メモリクリーンアップ（定期実行）
     */
    cleanup() {
        const now = Date.now();
        for (const [hash, timestamp] of this.processedMessages) {
            if (now - timestamp > this.MESSAGE_CACHE_TTL) {
                this.processedMessages.delete(hash);
            }
        }
    }
}

module.exports = PrivacyFirstMessageProcessor;