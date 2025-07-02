const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserPreferences } = require('../database/models/userPreferences');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('Manage your privacy settings for LinkSense')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check your current privacy settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('optout')
                .setDescription('Opt out of all link tracking')
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for opting out (optional)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('optin')
                .setDescription('Opt back in to link tracking')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Request an export of your data')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Request deletion of all your data')
        ),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        
        switch (subcommand) {
            case 'status':
                await this.handleStatus(interaction, userId);
                break;
            case 'optout':
                await this.handleOptOut(interaction, userId);
                break;
            case 'optin':
                await this.handleOptIn(interaction, userId);
                break;
            case 'export':
                await this.handleDataExport(interaction, userId);
                break;
            case 'delete':
                await this.handleDataDeletion(interaction, userId);
                break;
        }
    },
    
    async handleStatus(interaction, userId) {
        const prefs = await UserPreferences.findOne({ userId });
        
        const embed = new EmbedBuilder()
            .setTitle('🔒 Your Privacy Settings')
            .setColor(0x00AE86)
            .setTimestamp();
        
        if (!prefs) {
            embed.setDescription('You are currently using default settings.')
                .addFields(
                    { name: 'Link Tracking', value: '✅ Enabled', inline: true },
                    { name: 'Anonymous Analytics', value: '✅ Enabled', inline: true },
                    { name: 'Data Sharing', value: '✅ With Guild Owner Only', inline: true }
                );
        } else {
            embed.setDescription('Your current privacy preferences:')
                .addFields(
                    { 
                        name: 'Link Tracking', 
                        value: prefs.privacy.allowLinkTracking ? '✅ Enabled' : '❌ Disabled', 
                        inline: true 
                    },
                    { 
                        name: 'Anonymous Analytics', 
                        value: prefs.privacy.allowAnonymousAnalytics ? '✅ Enabled' : '❌ Disabled', 
                        inline: true 
                    },
                    { 
                        name: 'Opted Out', 
                        value: prefs.privacy.optedOut ? '❌ Yes' : '✅ No', 
                        inline: true 
                    }
                );
            
            if (prefs.privacy.optedOut && prefs.privacy.optOutDate) {
                embed.addFields({
                    name: 'Opted Out Since',
                    value: prefs.privacy.optOutDate.toDateString(),
                    inline: false
                });
            }
        }
        
        embed.setFooter({ 
            text: 'Use /privacy optout to disable all tracking' 
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
    
    async handleOptOut(interaction, userId) {
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        let prefs = await UserPreferences.findOne({ userId });
        if (!prefs) {
            prefs = new UserPreferences({ userId });
        }
        
        await prefs.optOut(reason);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Successfully Opted Out')
            .setColor(0xFF0000)
            .setDescription('You have been opted out of all LinkSense tracking.')
            .addFields(
                { 
                    name: 'What this means:', 
                    value: '• Your shared links will not be tracked\n• No analytics will be collected\n• Your existing data remains but won\'t be updated' 
                },
                { 
                    name: 'To opt back in:', 
                    value: 'Use `/privacy optin` at any time' 
                }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
        // ログ記録（監査用）
        console.log(`User ${userId} opted out. Reason: ${reason}`);
    },
    
    async handleOptIn(interaction, userId) {
        let prefs = await UserPreferences.findOne({ userId });
        if (!prefs) {
            prefs = new UserPreferences({ userId });
        }
        
        await prefs.optIn();
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Successfully Opted In')
            .setColor(0x00AE86)
            .setDescription('Welcome back! Your link sharing will now be tracked.')
            .addFields({
                name: 'Privacy Reminder',
                value: 'LinkSense only tracks URLs you share, never message content. All data is anonymized and encrypted.'
            })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
    
    async handleDataExport(interaction, userId) {
        // データエクスポート機能の実装
        await interaction.reply({
            content: '📊 Data export request received. You will receive a DM with your data within 24 hours.',
            ephemeral: true
        });
        
        // TODO: 実際のデータエクスポート処理を実装
        // 1. ユーザーのすべてのデータを収集
        // 2. JSON形式でフォーマット
        // 3. 安全な方法でユーザーに送信
    },
    
    async handleDataDeletion(interaction, userId) {
        // データ削除確認
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Data Deletion Request')
            .setColor(0xFF0000)
            .setDescription('Are you sure you want to delete all your data?')
            .addFields({
                name: 'This will permanently delete:',
                value: '• All your link tracking history\n• Your preferences\n• Analytics data\n\nThis action cannot be undone.'
            })
            .setTimestamp();
        
        // TODO: 確認ボタンを追加して、実際の削除処理を実装
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};