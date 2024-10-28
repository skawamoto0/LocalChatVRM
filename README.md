# LocalChatVRM

LocalChatVRMは[ChatVRM](https://github.com/pixiv/ChatVRM)派生のプロジェクトです。
元のChatVRMのようにブラウザで簡単に3Dキャラクターと会話をすることができます。

## 元のChatVRMとの差分

- [local-simple-realtime-api](https://github.com/nyosegawa/local-simple-realtime-api)と連動し、完全ローカルで動作します。
- OpenAIのRealtime APIのように音声をlocal-simple-realtime-apiに送信するだけで、返答音声が帰ってきます。

## 実行

事前に[local-simple-realtime-api](https://github.com/nyosegawa/local-simple-realtime-api)を起動してください。

次に、このリポジトリをクローンするか、ダウンロードしてください。

```bash
git clone git@github.com:nyosegawa/LocalChatVRM.git
```

必要なパッケージをインストールしてください。

```bash
npm install
```

パッケージのインストールが完了した後、以下のコマンドで開発用のWebサーバーを起動します。

```bash
npm run dev
```

実行後、以下のURLにアクセスして動作を確認して下さい。

[http://localhost:3000](http://localhost:3000)

マイクボタンを押すと会話が開始します。