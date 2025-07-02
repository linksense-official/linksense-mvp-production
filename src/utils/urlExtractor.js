const { URL } = require('url');
const tldjs = require('tldjs');

/**
 * テキストからURLを安全に抽出
 */
function extractURLsFromText(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    // 基本的なURL正規表現
    const urlRegex = /(https?:\/\/[^\s<>"\{\}\|\\\^\[\]`]+)/gi;
    const matches = text.match(urlRegex) || [];
    
    // 各URLを検証・正規化
    const validUrls = [];
    for (const match of matches) {
        try {
            const url = new URL(match);
            
            // 基本的な検証
            if (!['http:', 'https:'].includes(url.protocol)) {
                continue;
            }
            
            // ドメインの検証
            const domain = tldjs.getDomain(url.hostname);
            if (!domain) {
                continue;
            }
            
            // プライバシー保護: クエリパラメータを除去（オプション）
            const cleanUrl = {
                original: match,
                protocol: url.protocol,
                hostname: url.hostname,
                pathname: url.pathname,
                domain: domain,
                // クエリパラメータは含めない（プライバシー保護）
            };
            
            validUrls.push(cleanUrl);
            
        } catch (error) {
            // 無効なURLは無視
            console.debug('Invalid URL:', match);
        }
    }
    
    return validUrls;
}

/**
 * URLをカテゴリ分類
 */
function categorizeURL(urlData) {
    const { hostname, pathname } = urlData;
    
    // ドキュメント
    if (hostname.includes('docs.') || hostname.includes('documentation.')) {
        return 'documentation';
    }
    
    // コード関連
    if (hostname.includes('github.com') || hostname.includes('gitlab.com')) {
        return 'code';
    }
    
    // メディア
    if (hostname.includes('youtube.com') || hostname.includes('vimeo.com')) {
        return 'media';
    }
    
    // ソーシャル
    if (hostname.includes('twitter.com') || hostname.includes('facebook.com')) {
        return 'social';
    }
    
    // その他
    return 'other';
}

module.exports = {
    extractURLsFromText,
    categorizeURL,
};