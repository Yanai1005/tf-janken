# じゃんけん認識アプリ
> [!CAUTION]
ハンズオンイベントでClineとAmazon Bedrockを使用してVibe Codingで開発した、Webカメラを利用したじゃんけん認識アプリケーションです。

## 概要
手のジェスチャーを認識してじゃんけんができるWebアプリケーションです。カメラを使用して手のジェスチャー（グー、チョキ、パー）を認識し、コンピュータと対戦することができます。

## 使用技術

- **フロントエンド**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
- **ライブラリ**:
  - [TensorFlow.js](https://www.tensorflow.org/js) - 機械学習モデルの実行
  - [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html) - 手の検出と追跡
- **開発ツール**:
  - http-server - ローカル開発サーバー

## プロジェクト構成

```
.
├── index.html      # メインのHTMLファイル
├── styles.css      # スタイルシート
├── script.js       # JavaScriptロジック
└── README.md       # プロジェクト説明
```

## 機能

1. **リアルタイム手のジェスチャー認識**:
   - グー（拳を作る）
   - チョキ（人差し指と中指を立てる）
   - パー（すべての指を広げる）

2. **じゃんけんゲーム**:
   - コンピュータとのじゃんけん対戦
   - 3秒カウントダウン機能
   - 勝敗判定とスコア記録

3. **ユーザーインターフェース**:
   - 横並びレイアウト（カメラビューと操作パネルを左側に、ゲーム情報を右側に配置）
   - レスポンシブデザイン（モバイルデバイスにも対応）
   - リアルタイムフィードバック

## 起動方法

1. プロジェクトディレクトリに移動します:
   ```
   cd path/to/handson
   ```

2. ローカルサーバーを起動します:
   ```
   npx http-server -o
   ```
   または、任意のWebサーバーを使用してプロジェクトを提供することもできます。

3. ブラウザが自動的に開き、アプリケーションが表示されます。
   - 手動でアクセスする場合は、ブラウザで `http://localhost:8080` を開きます。

## 使用方法

1. **「カメラ開始」ボタン**をクリックしてカメラを起動します。
   - ブラウザからカメラへのアクセス許可を求められた場合は「許可」をクリックしてください。

2. 手をカメラに映し、グー・チョキ・パーのいずれかのジェスチャーを行います。
   - ジェスチャーが認識されると「あなたの手:」の下に表示されます。

3. ジェスチャーが認識されると「じゃんけんする！」ボタンが有効になります。

4. **「じゃんけんする！」ボタン**をクリックすると、3秒のカウントダウンが表示されます。

5. カウントダウン後、コンピュータの手が表示され、勝敗が判定されます。
   - 結果とスコアが画面に表示されます。

6. 何度でも対戦を続けることができます。

7. 終了するには「カメラ停止」ボタンをクリックします。

## 注意事項

- このアプリケーションはWebカメラへのアクセスが必要です。
- 最新のブラウザ（Chrome、Firefox、Edge、Safariなど）での使用を推奨します。
- 十分な照明がある環境で使用すると、ジェスチャー認識の精度が向上します。
- プライバシーに配慮し、カメラの映像はローカルでのみ処理され、外部に送信されることはありません。
