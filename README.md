# Poolside AI運用指南書

株式会社 Poolside の若手向け、Claude Code / Cursor 運用の指南書です。

## このリポジトリについて

- 社内向け教育コンテンツ
- HTML 静的サイト（追加のビルド工程なし）
- パスワードゲート付き（`assets/gate.js` の `STORED_HASH`）

## 構成

```
.
├── index.html              目次トップ
├── gate.html               パスワード入力画面
├── chapters/               全15章
│   ├── 01_intro.html
│   ├── ...
│   └── 15_qa.html
├── assets/
│   ├── style.css           共通スタイル
│   ├── guidebook.css       指南書専用スタイル
│   ├── guidebook.js        環境変数フォーム・チェックリスト・ゲート連携
│   ├── gate.css            ゲートページ用スタイル
│   ├── gate.js             ゲート認証ロジック（SHA-256 ハッシュ照合）
│   └── illustrations/      章ごとのイラスト（11 枚）
├── firebase.json           Firebase Hosting 設定
├── .gitignore
└── README.md               このファイル
```

## ローカル確認

ブラウザで `index.html` を開くだけで動作確認できます（ゲート → 各章へ）。

```bash
open index.html
# または gate.html から始める場合
open gate.html
```

## デプロイ

```bash
# Firebase CLI でログイン
firebase login

# 初回のみプロジェクトと紐付け
firebase use --add

# 公開
firebase deploy --only hosting
```

## パスワード変更手順

1. SHA-256 ハッシュを生成

   ```bash
   echo -n "新しい合言葉" | shasum -a 256
   ```

2. `assets/gate.js` 内の `STORED_HASH` を新しいハッシュに差し替え

3. デプロイ：`firebase deploy --only hosting`

> 既にゲートを通過済みのユーザーは `localStorage` にフラグが残るため、合言葉変更後も入れます。
> 全ユーザーを再認証させたい時は、`STORAGE_KEY` の末尾を `v1` → `v2` などにバンプしてください。

## ライセンス

社内利用のみ。
