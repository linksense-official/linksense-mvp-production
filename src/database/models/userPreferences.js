const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    
    // プライバシー設定
    privacy: {
        optedOut: {
            type: Boolean,
            default: false,
        },
        optOutDate: Date,
        optOutReason: String,
        
        // 細かい制御
        allowLinkTracking: {
            type: Boolean,
            default: true,
        },
        allowAnonymousAnalytics: {
            type: Boolean,
            default: true,
        },
        shareDataWithGuildOwner: {
            type: Boolean,
            default: true,
        },
    },
    
    // 通知設定
    notifications: {
        weeklyReport: {
            type: Boolean,
            default: false,
        },
        monthlyReport: {
            type: Boolean,
            default: true,
        },
    },
    
    // メタデータ
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    
    // GDPR対応
    dataExportRequests: [{
        requestedAt: Date,
        completedAt: Date,
        exportUrl: String,
    }],
    
    deletionRequested: {
        type: Boolean,
        default: false,
    },
    deletionRequestedAt: Date,
});

// インデックス
userPreferencesSchema.index({ userId: 1 });
userPreferencesSchema.index({ 'privacy.optedOut': 1 });

// メソッド
userPreferencesSchema.methods.optOut = async function(reason = '') {
    this.privacy.optedOut = true;
    this.privacy.optOutDate = new Date();
    this.privacy.optOutReason = reason;
    this.privacy.allowLinkTracking = false;
    return this.save();
};

userPreferencesSchema.methods.optIn = async function() {
    this.privacy.optedOut = false;
    this.privacy.allowLinkTracking = true;
    this.privacy.optOutDate = null;
    return this.save();
};

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

// ヘルパー関数
async function isUserOptedOut(userId) {
    const prefs = await UserPreferences.findOne({ userId });
    return prefs?.privacy?.optedOut || false;
}

async function createOrUpdateUserPreferences(userId, preferences) {
    return UserPreferences.findOneAndUpdate(
        { userId },
        { $set: preferences },
        { new: true, upsert: true }
    );
}

module.exports = {
    UserPreferences,
    isUserOptedOut,
    createOrUpdateUserPreferences,
};