const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

async function testIntents() {
    console.log('🧪 Testing Discord Intents Configuration...\n');
    
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
        ],
    });
    
    client.once('ready', () => {
        console.log('✅ Bot connected successfully');
        console.log(`📊 Bot tag: ${client.user.tag}`);
        console.log(`📊 Guilds: ${client.guilds.cache.size}`);
        
        // Intentsの確認
        console.log('\n🔍 Testing Intents:');
        
        // メッセージコンテンツのテスト
        client.on('messageCreate', (message) => {
            if (message.author.bot) return;
            console.log('✅ Message Content Intent working');
            console.log(`   Content preview: ${message.content.substring(0, 50)}...`);
        });
        
        // メンバー情報のテスト
        const testGuild = client.guilds.cache.first();
        if (testGuild) {
            testGuild.members.fetch().then(members => {
                console.log('✅ Guild Members Intent working');
                console.log(`   Members fetched: ${members.size}`);
            }).catch(error => {
                console.error('❌ Guild Members Intent failed:', error.message);
            });
        }
    });
    
    client.on('error', (error) => {
        console.error('❌ Client error:', error);
    });
    
    try {
        await client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
        console.error('❌ Login failed:', error.message);
    }
    
    // 30秒後に終了
    setTimeout(() => {
        console.log('\n🏁 Test completed');
        client.destroy();
        process.exit(0);
    }, 30000);
}

// テスト実行
testIntents();