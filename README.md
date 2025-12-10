# Local DeepSeek OCR

<div align="center">

**完全ローカル環境で動作する、プライバシー重視のOCRアプリケーション**

OllamaとDeepSeek-OCRモデルを利用した自炊（書籍電子化）支援デスクトップアプリ

</div>

---

## 📖 概要

Local DeepSeek OCRは、画像からテキストを抽出する光学文字認識（OCR）アプリケーションです。
完全にローカル環境で動作するため、機密情報やプライベートな文書を安全に処理できます。
Electronベースのデスクトップアプリとして、Windows、macOS、Linuxで動作します。

## ✨ 特徴

- **🔒 完全ローカル動作**: インターネット接続不要。データが外部サーバーに送信されることは一切ありません
- **🤖 高性能AI**: DeepSeek-OCRなどの最新視覚言語モデルを使用し、日本語を含む多言語のテキスト認識が可能
- **⚡ リアルタイム処理**: ストリーミング方式でテキストを生成し、処理状況をリアルタイムで確認
- **🎨 モダンなUI**: 直感的でシンプルなインターフェース。ドラッグ＆ドロップで簡単に画像をアップロード
- **🛠️ カスタマイズ可能**: 複数のOllamaモデルから選択可能。用途に応じて最適なモデルを使用
- **💾 結果の保存**: 抽出したテキストをクリップボードにコピー、またはファイルとして保存
- **📝 Markdownサポート**: 見出しや箇条書きなどの書式をMarkdown形式で再現
- **⏸️ 処理の中断**: 長時間の処理でも、いつでも中断可能

## 🛠️ 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **UIフレームワーク**: TailwindCSS
- **デスクトップフレームワーク**: Electron
- **ビルドツール**: Vite
- **AIバックエンド**: Ollama (ローカルLLM実行環境)
- **アイコン**: Lucide React

## 📋 前提条件

このアプリを使用するには、以下のソフトウェアが必要です。

### 必須ソフトウェア

1. **Ollama** (v0.1.0以上)
   - ローカルでAIモデルを実行するためのツール
   - [公式サイト](https://ollama.com/download)からダウンロードしてインストール
   - インストール後、バックグラウンドで自動的に起動します

2. **Node.js** (v18以上推奨)
   - アプリを実行するためのJavaScriptランタイム
   - [公式サイト](https://nodejs.org/)からLTS版をダウンロードしてインストール

### システム要件

- **OS**: Windows 10/11、macOS 10.15以上、Linux (Ubuntu 20.04以上推奨)
- **RAM**: 最低8GB（16GB以上推奨）
- **ストレージ**: 10GB以上の空き容量（モデルファイル用）
- **CPU**: マルチコア推奨（GPUは不要ですが、あると高速化）

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/local-llm-ocr.git
cd local-llm-ocr
```

### 2. Ollamaの準備

ターミナル（コマンドプロンプト）を開き、以下のコマンドを実行してOCR用モデルをダウンロードします。

```bash
# 推奨: DeepSeek OCRモデル（3Bパラメータ、軽量で高速）
ollama pull deepseek-ocr:3b

# または: DeepSeek VLモデル（より高精度）
ollama pull deepseek-vl

# その他の利用可能なモデル
ollama pull llava
ollama pull bakllava
```

**モデルサイズの目安:**
- `deepseek-ocr:3b`: 約2GB（推奨、軽量で高速）
- `deepseek-vl`: 約5GB（高精度）
- `llava`: 約4GB
- `bakllava`: 約4.5GB

### 3. 依存関係のインストール

プロジェクトのフォルダでターミナルを開き、依存関係をインストールします。

```bash
npm install
```

### 4. Ollamaの起動確認

Ollamaが正常に起動しているか確認します。

```bash
# Ollamaのステータス確認
ollama list

# 手動でOllamaを起動する場合
ollama serve
```

## 📱 使い方

### アプリの起動

以下のいずれかの方法でアプリを起動します。

**方法1: npmコマンドを使用（推奨）**
```bash
npm run dev
```

**方法2: スタートスクリプトを使用（macOS/Linux）**
```bash
./start.command
```

アプリが起動すると、Electronアプリのウィンドウが開き、左側にサイドバー、中央にメインエリアが表示されます。

### 基本的な使い方

#### 1. Ollama接続の確認

- 左サイドバーの上部に接続ステータスが表示されます
- **緑のドット**: Ollamaに接続済み（正常）
- **赤のドット**: Ollama未接続（Ollamaの起動が必要）

#### 2. 画像のアップロード

画像をアップロードする方法は2つあります：

**ドラッグ＆ドロップ:**
1. エクスプローラーやFinderから画像ファイルを選択
2. アプリのウィンドウ中央のエリアにドラッグ＆ドロップ

**ファイル選択:**
1. 「Browse Files」ボタンをクリック
2. ファイル選択ダイアログから画像を選択

**対応フォーマット:**
- JPEG (.jpg, .jpeg)
- PNG (.png)

#### 3. OCRの実行

1. 画像がアップロードされると、画面が2分割されます
   - 左側: 元の画像
   - 右側: OCR結果表示エリア
2. 右上の「Run OCR」ボタンをクリック
3. テキストがリアルタイムで生成・表示されます
4. 処理中は「Stop」ボタンが表示され、いつでも中断可能

#### 4. 結果の活用

抽出されたテキストは以下の方法で利用できます：

**クリップボードにコピー:**
- 📋 コピーアイコンをクリック
- テキストがクリップボードにコピーされます
- チェックマークが表示され、コピー完了を確認できます

**ファイルとして保存:**
- 💾 保存アイコンをクリック
- 保存先とファイル名を指定
- テキストファイル (.txt) として保存されます

**再処理:**
- ⬅️ 「Back」ボタンで画像選択画面に戻る
- 別の画像をアップロードして処理を続行

### モデルの設定

デフォルトでは `deepseek-ocr:3b` が使用されますが、設定画面でモデルを変更できます。

1. 左サイドバーの⚙️ 設定アイコンをクリック
2. 「Ollama Model Name」のドロップダウンから使用したいモデルを選択
   - Ollamaにインストール済みのモデルが自動的に表示されます
   - モデルが表示されない場合は、Ollamaが起動しているか確認してください
3. 「Save Settings」ボタンをクリックして設定を保存
4. 次回のOCR実行から新しいモデルが使用されます

**モデル選択のヒント:**
- **軽量・高速**: `deepseek-ocr:3b`（日常的な使用に最適）
- **高精度**: `deepseek-vl`（複雑なレイアウトや小さな文字に適している）
- **汎用**: `llava`、`bakllava`（英語に強い）

## 🔧 トラブルシューティング

### Ollama関連

#### "Ollama Disconnected" と表示される

**原因:** Ollamaがバックグラウンドで実行されていない

**解決方法:**
```bash
# Ollamaのステータス確認
ollama list

# Ollamaを手動で起動
ollama serve
```

通常、Ollamaはインストール後に自動起動しますが、手動で起動が必要な場合もあります。

#### モデル一覧が表示されない

**原因:** Ollamaとの通信に問題がある、またはモデルがインストールされていない

**解決方法:**
1. Ollamaが起動していることを確認
2. モデルをインストール
   ```bash
   ollama list  # インストール済みモデルの確認
   ollama pull deepseek-ocr:3b  # モデルのインストール
   ```
3. ファイアウォールで `localhost:11434` がブロックされていないか確認

### OCR実行関連

#### OCR結果が出ない / エラーになる

**原因1: メモリ不足**
- **解決方法:** 他の重いアプリケーションを終了する
- より軽量なモデル（`deepseek-ocr:3b`）を使用する
- システムの空きメモリを確認: 最低4GB以上の空きメモリが必要

**原因2: モデルが正しくダウンロードされていない**
- **解決方法:**
  ```bash
  ollama list  # モデルの確認
  ollama pull deepseek-ocr:3b  # 再ダウンロード
  ```

**原因3: 画像が大きすぎる**
- **解決方法:** 画像を圧縮またはリサイズする（推奨: 2000x3000ピクセル以下）

#### 処理が途中で止まる

**原因:** モデルのタイムアウトまたはメモリ不足

**解決方法:**
1. 「Stop」ボタンで処理を中断
2. より軽量なモデルを選択
3. 画像サイズを縮小
4. システムを再起動してメモリをクリア

### アプリ起動関連

#### "Cannot find module" エラーが出る

**原因:** 依存関係が正しくインストールされていない

**解決方法:**
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### Electronウィンドウが開かない

**原因:** ポート衝突またはビルドエラー

**解決方法:**
1. 既存のプロセスを終了
2. 再度起動を試みる
   ```bash
   npm run dev
   ```
3. エラーメッセージを確認し、該当するポートが使用中でないか確認

### その他

#### テキストの認識精度が低い

**改善方法:**
- 高解像度の画像を使用する
- 画像のコントラストを調整する
- より高精度なモデル（`deepseek-vl`）を試す
- OCRプロンプトのカスタマイズ（開発者向け）

#### 日本語が正しく認識されない

**解決方法:**
- `deepseek-ocr` または `deepseek-vl` モデルを使用（日本語に対応）
- 他のモデル（`llava`など）は英語に特化している場合があります

## 👨‍💻 開発者向け情報

### ビルドとパッケージング

**開発モードでの起動:**
```bash
npm run dev
```

**本番ビルド:**
```bash
npm run build
```

**プロダクション実行:**
```bash
npm run preview
```

### プロジェクト構造

```
local-llm-ocr/
├── electron/           # Electronメインプロセス
│   ├── main.ts        # メインプロセスのエントリーポイント
│   └── preload.ts     # プレロードスクリプト（IPC通信）
├── src/               # Reactフロントエンド
│   ├── components/    # UIコンポーネント
│   │   ├── ImageUploader.tsx  # 画像アップロード
│   │   ├── OCRViewer.tsx      # OCR実行・結果表示
│   │   ├── Settings.tsx       # 設定画面
│   │   └── Sidebar.tsx        # サイドバー
│   ├── App.tsx        # アプリケーションルート
│   └── main.tsx       # Reactエントリーポイント
├── package.json       # プロジェクト設定
├── tsconfig.json      # TypeScript設定（フロントエンド）
├── tsconfig.electron.json  # TypeScript設定（Electron）
├── vite.config.ts     # Vite設定
└── tailwind.config.js # TailwindCSS設定
```

### カスタマイズ

#### OCRプロンプトの変更

`electron/main.ts` の `ollama:run-ocr` ハンドラー内の `system` プロンプトを編集：

```typescript
system: `画像内のテキストを読み取り、読み順どおりに抽出してください。
見出し・太字・箇条書きなどは可能な限りMarkdownで再現してください。
ページ番号やフッターは無視してください。`,
```

#### モデルパラメータの調整

同じハンドラー内の `options` を編集：

```typescript
options: {
    temperature: 0,      // 0-1: 生成のランダム性（0=確定的）
    repeat_penalty: 1.2  // 繰り返しペナルティ
}
```

#### UIテーマのカスタマイズ

`tailwind.config.js` でカラースキームを変更可能。

### APIリファレンス

#### Electron IPC通信

**利用可能なAPI:**

- `checkOllamaConnection()`: Ollama接続状態を確認
- `getModels()`: インストール済みモデル一覧を取得
- `runOCR(imageBase64, model)`: OCRを実行
- `abortOCR()`: OCR処理を中断
- `saveFile(text)`: テキストをファイルに保存

**イベント:**

- `ocr-chunk`: OCRテキストのストリーミング受信
- `ocr-complete`: OCR処理完了
- `ocr-error`: OCRエラー発生

### 貢献

プルリクエストを歓迎します！以下の手順で貢献できます：

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License

このプロジェクトはMITライセンスの下でライセンスされています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Ollama](https://ollama.com/) - ローカルLLM実行環境
- [DeepSeek](https://www.deepseek.com/) - OCRモデル
- [Electron](https://www.electronjs.org/) - クロスプラットフォームデスクトップアプリフレームワーク
- [React](https://react.dev/) - UIフレームワーク
- [TailwindCSS](https://tailwindcss.com/) - ユーティリティファーストCSSフレームワーク

## 📞 サポート

問題が発生した場合は、以下の方法でサポートを受けられます：

- [GitHub Issues](https://github.com/yourusername/local-llm-ocr/issues) - バグ報告や機能リクエスト
- [Ollama Documentation](https://github.com/ollama/ollama) - Ollama関連の問題

---

<div align="center">

**⭐ このプロジェクトが役に立った場合は、ぜひスターを付けてください！**

Made with ❤️ for privacy-conscious OCR users

</div>
