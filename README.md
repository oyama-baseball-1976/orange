# 小山少年野球団オレンジ 記録システム

3年生以下チーム「オレンジ」の成績記録・表彰・懇親会運営を支えるシステムです。
父母が試合ごとの成績を入力すると、個人の成長がグラフとスタンプで見られるようになります。

---

## 公開ページ

| ページ | URL | 用途 |
|---|---|---|
| マニュアル | https://oyama-baseball-1976.github.io/orange/ | 父母向けの使い方案内 |
| 成績入力 | https://oyama-baseball-1976.github.io/orange/orange_Award_Production.html | 成績入力・表彰・スタンプ・年度成績 |
| 試合記録 | https://oyama-baseball-1976.github.io/orange/index_Production.html | 協力ログ・試合結果の登録（幹事） |
| 懇親会 会計 | https://oyama-baseball-1976.github.io/orange/accounting_Production.html | 注文入力・家庭別会計 |
| 集金チェック | organizer_Production.html | 幹事専用。**URLは配らないこと** |

---

## 構成
```
orange/
├ index.html                      父母向けマニュアル（トップページ）
├ images/                         マニュアル用の画像
│
├ orange_Award_Production.html    成績入力・表彰・スタンプ
├ index_Production.html           協力ログ・試合記録
├ accounting_Production.html      懇親会 注文・会計
├ organizer_Production.html       集金チェック（URL非公開）
│
├ docs/                           幹事向けドキュメント
│   ├ 幹事引き継ぎ書.pdf      … 読む用（ブラウザで開ける）
│   ├ 幹事引き継ぎ書.docx     … 編集用
│   ├ 本番運用手順書.pdf
│   ├ 本番運用手順書.docx
│   ├ 年度替わり作業手順書.pdf
│   ├ 年度替わり作業手順書.docx
│   └ GASコード.txt
│
└ archive/                        過去の制作物（コードのみ）
    ├ orange_movie.html           変遷映像
    ├ presentation.html           表彰スライド
    └ README.md                   必要な素材フォルダの説明
```
---

## 仕組み

- **フロント**：GitHub Pages（素のHTML/CSS/JS）
- **中間**：Google Apps Script（GAS）
- **データ**：Googleスプレッドシート

サーバー不要・無料枠で運用しています。

---

## 幹事の方へ

- 運用手順・年度替わりの作業は `docs/` を参照してください。
- **GASを修正したら**「デプロイを管理 → 既存を新バージョンで再デプロイ」。
  「新しいデプロイ」を押すとURLが変わり、全ページが動かなくなります。
- **シート名**は半角小文字・前後スペースなし。変更しないこと。
- ファイル更新は**1回のコミットにまとめて**アップロードしてください（分けるとPages公開が失敗しやすい）。
- 公開が失敗したときは「Actions」タブ →失敗したrun →「Re-run jobs」で再実行。

## 素材・アカウント情報

- 写真・動画・音などの素材は、チーム用Googleドライブに保管しています。
- 各アカウントのIDとパスワードは、GitHubには置かず**ドライブで管理**しています。
  （引き継ぎ時に次期幹事へ共有）
