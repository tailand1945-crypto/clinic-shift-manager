# 📋 Shift Manager — クリニック シフト管理 Web アプリ

ブラウザだけでシフト管理ができるWebアプリです。
URLをスタッフにメールで送るだけで、全員がすぐに使い始められます。

---

## 🚀 Vercel にデプロイする手順（初心者向け）

### 前提条件
- GitHubアカウント（無料）
- Vercelアカウント（無料）

### ステップ 1: GitHubにアップロード

1. [github.com](https://github.com) にログイン
2. 右上の「+」→「New repository」をクリック
3. Repository name に `clinic-shift-manager` と入力
4. 「Create repository」をクリック
5. 表示される手順に従い、このフォルダをアップロード

```bash
# ターミナルでこのフォルダに移動して実行
cd clinic-shift-manager
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/clinic-shift-manager.git
git push -u origin main
```

> 💡 **Gitが初めての方**: GitHubのWebサイト上で「Upload files」からドラッグ&ドロップでもアップロードできます。

### ステップ 2: Vercelでデプロイ

1. [vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントと連携
3. 「Add New...」→「Project」をクリック
4. 先ほど作成した `clinic-shift-manager` リポジトリの「Import」をクリック
5. **設定はそのまま何も変更せず**「Deploy」をクリック
6. 2〜3分待つと完了！

### ステップ 3: URLをスタッフに送る

デプロイ完了後、以下のようなURLが発行されます：

```
https://clinic-shift-manager.vercel.app
```

このURLをスタッフにメールやLINEで送るだけです！

---

## 🌐 独自ドメインの設定（任意）

`shift.worldwing-sannomiya.com` のようなURLにしたい場合：

1. Vercelダッシュボード → プロジェクト → 「Settings」→「Domains」
2. 使いたいドメインを入力して「Add」
3. 表示されるDNS設定をドメイン管理画面で設定
4. 数分〜数時間で反映（SSL証明書も自動発行）

---

## 📱 スマホのホーム画面に追加（PWA）

スタッフがURLを開いた後、ネイティブアプリのように使えます：

**iPhone の場合：**
1. Safariでアプリを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択

**Android の場合：**
1. Chromeでアプリを開く
2. 右上の「⋮」→「ホーム画面に追加」

---

## 📁 プロジェクト構成

```
clinic-shift-manager/
├── app/
│   ├── components/
│   │   └── ShiftManagerApp.jsx  ← メインアプリ（全画面含む）
│   ├── globals.css              ← グローバルスタイル
│   ├── layout.js                ← HTMLレイアウト + メタデータ
│   └── page.js                  ← エントリーポイント
├── public/
│   ├── manifest.json            ← PWA設定
│   ├── icon-192.png             ← アプリアイコン（小）
│   ├── icon-512.png             ← アプリアイコン（大）
│   ├── icon.svg                 ← SVGアイコン
│   └── favicon.ico              ← ブラウザタブアイコン
├── .eslintrc.json
├── .gitignore
├── jsconfig.json
├── next.config.js               ← Next.js設定
├── package.json                 ← 依存パッケージ
├── vercel.json                  ← Vercelデプロイ設定
└── README.md                    ← このファイル
```

---

## 🔧 ローカルで動作確認する場合

```bash
# Node.js 18以上が必要
node --version  # v18.0.0以上を確認

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

---

## 🔐 デモモードについて

現在はデモモードで動作しています（サンプルデータを表示）。
ログイン画面の「デモ: クイックログイン」から、異なる権限のユーザーで動作確認できます。

| ユーザー | 権限 | 自動生成 |
|---------|------|---------|
| 田中 美咲 | 管理者 | ✅ 使える |
| 佐藤 健一 | マネージャー | 🔒 ロック |
| 鈴木 花子 | スタッフ | 🔒 ロック |
| 高橋 太郎 | スタッフ | 🔒 ロック |

---

## 📌 次のステップ（本番運用に向けて）

1. **Supabaseプロジェクト作成** — データベースと認証機能を追加
2. **環境変数の設定** — Vercelのダッシュボードで Supabase の接続情報を設定
3. **マジックリンク認証の有効化** — スタッフがメールリンクでログイン
4. **本番データの投入** — スタッフ情報、シフトテンプレートの登録

これらの設定手順が必要な場合はお気軽にご相談ください。

---

## ⚡ 技術スタック

| 技術 | 用途 |
|-----|------|
| Next.js 14 | Reactフレームワーク |
| React 18 | UIライブラリ |
| Vercel | ホスティング（無料） |
| PWA | ネイティブアプリ風の体験 |

**将来的に追加予定：**
| 技術 | 用途 |
|-----|------|
| Supabase Auth | メール認証・マジックリンク |
| Supabase Database | PostgreSQL データベース |
| Supabase Realtime | リアルタイム同期 |
| Python / FastAPI | シフト自動生成アルゴリズム |
