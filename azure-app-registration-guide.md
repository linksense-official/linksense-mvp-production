# Microsoft Teams統合 - Azure App Registration設定ガイド

## 🔷 Azure App Registrationの作成手順

### Step 1: Azure Portalにアクセス
1. [Azure Portal](https://portal.azure.com) にアクセス
2. Microsoft アカウントでサインイン

### Step 2: App Registrationを作成
1. 左側メニューから「Azure Active Directory」を選択
2. 「App registrations」をクリック
3. 「New registration」をクリック
4. アプリケーション情報を入力：
   - **Name**: LinkSense Teams Integration
   - **Supported account types**: Accounts in any organizational directory (Any Azure AD directory - Multitenant)
   - **Redirect URI**: Web - `https://YOUR_NGROK_URL.ngrok-free.app/api/auth/teams/callback`

### Step 3: Client IDとSecretを取得
1. 作成されたアプリの「Overview」ページで **Application (client) ID** をコピー
2. 「Certificates & secrets」→「New client secret」をクリック
3. Description: LinkSense Teams Secret
4. Expires: 24 months
5. 「Add」をクリックし、**Value** をコピー（一度しか表示されません）

### Step 4: API権限を設定
1. 「API permissions」をクリック
2. 「Add a permission」→「Microsoft Graph」→「Delegated permissions」
3. 以下の権限を追加：
   - **User.Read** - ユーザー基本情報の読み取り
   - **Team.ReadBasic.All** - チーム基本情報の読み取り
   - **Chat.Read** - チャットメッセージの読み取り
   - **OnlineMeetings.Read** - オンライン会議情報の読み取り
   - **Presence.Read** - プレゼンス情報の読み取り
   - **ChannelMessage.Read.All** - チャンネルメッセージの読み取り
   - **TeamMember.Read.All** - チームメンバー情報の読み取り

### Step 5: 管理者の同意
1. 「Grant admin consent for [Your Organization]」をクリック
2. 「Yes」で確認

## 🔧 環境変数の設定

.env.localファイルに以下を設定：

```bash
# Microsoft Teams OAuth設定
TEAMS_CLIENT_ID=your-application-client-id-here
TEAMS_CLIENT_SECRET=your-client-secret-value-here

# ngrok URL（Redirect URIと一致させる）
NGROK_URL=https://your-ngrok-url.ngrok-free.app