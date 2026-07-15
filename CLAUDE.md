# CLAUDE.md — OriDesign 開発規約

このリポジトリは、ツリー法と本来の格子型箱ひだに対応する折り紙設計 Web/PWA である。

## 現在のフェーズ

- M0の開発基盤、M0Fハーネス、M0F-0の基準モデル／schema／数値kernel／profile候補は実装済み。現在はM0F-2〜5の候補実験として配置前提、exact面再構築、静的3D交差、単一ヒンジ必要イベント細分を進めているが、M0F `GO`には未達である。
- M0 の空シェルと M0F 試作を除く本番機能の実装は、`docs/05_実現性検証仕様書.md` の M0F が Go になるまで開始しない。
- M0F の spike／checker／benchmark は実現性を判断するためのコードであり、製品コードとして流用する場合も本番品質 AC を改めて満たすこと。
- M0F が No-Go なら、要件を暗黙に弱めず ADR とユーザー承認を経てから計画を変更する。
- `npm run m0f:catalog-gate`は必須fixture ID群の完備性だけを検査する。最終`npm run m0f:gate`は独立検証器、mutation、測定済みprofile、M0F reportが揃うまでfail-closedとし、IDやhashだけで`GO`にしない。

## 規範文書の優先順位と変更記録

入口は `docs/00_文書索引.md`。規範上の優先順位は次のとおり。

1. `docs/01_要件定義書_v1.1.md` — 何を保証し、何を作るか
2. `docs/02_技術設計書.md` — データモデル、契約、アーキテクチャ
3. `docs/03_画面仕様書.md` — UI と状態遷移
4. `docs/06_受入テスト仕様書.md` — 客観的な合否
5. `docs/05_実現性検証仕様書.md` — M0F の実験・Go/No-Go
6. `docs/04_開発計画_マイルストーン.md` — 実施順序
7. `docs/07_要件トレーサビリティ.md` — 要件、設計、計画、test ID の対応
8. `docs/decisions/` — 決定理由と変更履歴。単独で上位仕様を上書きしない

`docs/01_要件定義書_v1.0.md` は旧版であり、実装判断に使わない。

文書間で矛盾した場合は、勝手に都合のよい解釈を選ばず、上位文書と受入テストを照合する。仕様変更が必要なら `docs/decisions/` に ADR（背景・選択肢・決定・影響）を追加し、関連文書と AC を同じ変更で更新する。

## 絶対に弱めてはいけない保証契約

- 「検証済み」は、versioned SupportProfile の範囲内で、厚さゼロ・面剛体・折り線ヒンジモデル上の連続折り経路、連続衝突判定、積層順序、目標一致を証跡付きで再検証できる場合だけ表示する。
- 前川・川崎、離散 frame、3D の見た目、エネルギー収束だけを根拠に「検証済み」にしない。
- 接触と順序付けされた重なりは許可し、面の貫通は許可しない。
- 対応範囲内の計算を時間切れで `解なし` にしない。`解なし` は独立 checker が確認できる certificate を持つ。
- 未検証 candidate の表示・編集・出力は可能だが、UI と export metadata で必ず未検証と明示する。
- 手動 M/V、幾何、SupportProfile、ToleranceProfile、verifier version、または成果物が依存する revision vector 成分の変更は既存証跡を stale にする。名称、ラベル、表示設定は revision vector を進めない。
- ツリー法と箱ひだの違いを葉配置だけに縮退させない。本来の箱ひだは axial+N 等を含む別生成パイプラインである。

## 進め方

1. 着手する milestone と test ID を読む。
2. AC を満たす失敗テスト／fixture を先に追加する。
3. 最小実装を行う。
4. unit、property、golden、該当 E2E を通す。
5. 文書、diagnostic、license inventory を更新する。
6. 全 AC を満たしたときだけ milestone 完了とする。

大きな milestone は複数 PR に分けてよい。未完成部分は feature flag で無効化し、M 完了と偽らない。

## 想定コマンド

- `npm run dev` — 開発サーバー
- `npm run build` — 静的 build
- `npm test` — Vitest
- `npm run test:e2e` — Playwright
- `npm run test:golden` — golden／certificate
- `npm run test:perf` — 固定 fixture benchmark
- `npm run lint` — lint／format check
- `npm run licenses:check` — SPDX allowlist

M0 で scripts を実際に定義し、本書と `package.json` を一致させる。

## コーディング規約

- TypeScript strict。`any` は原則禁止。外部境界の一時値は `unknown` と runtime schema を使う。
- React は関数 component + hooks。UI と `model/`、`geometry/`、`solver/`、`verify/` を混在させない。
- domain API は例外を通常制御に使わず `Result<T, DomainError>` を返す。
- 幾何判定は単一 EPS を使い回さず、versioned `ToleranceProfile` の距離・角度・面積・接触・貫通の値を使う。
- 乱数を使う solver は seed を入力として受け、diagnostic と certificate に残す。
- 出力順は canonicalize し、OS、browser、実行順で golden が変わらないようにする。
- stable ID、`jobId`、必要な revision vector 成分、input／mesh／path hash を境界で検証する。
- 重い計算は専用 Web Worker。progress と cancel に対応し、cancel 時は worker を terminate して既存結果を維持する。
- 3D renderer は保証判定を行わない。`verify/` の証跡を表示するだけにする。
- ユーザー向け文字列は `src/strings/ja.ts` に集約する。

## データ保全

- `.orid.json` と `.fold` は runtime schema を通す。型 assertion だけで信用しない。
- project input と derived result を revision／hash で結ぶ。
- stale result を verified として export しない。
- snapshot は IndexedDB、編集停止2秒後、最近10 project。起動時は復元／破棄を選ばせる。
- 同一 project の複数タブ編集は read-only + 明示 takeover とし、自動 merge しない。
- 保存成功前に dirty を解除しない。
- service worker 更新で未保存作業を reload しない。

## テスト規約

- `model/`、`geometry/`、`solver/`、`verify/` は unit test 必須。行カバレッジだけでなく不変条件を property test する。
- `docs/06_受入テスト仕様書.md` の fixture catalog を正とする。
- M0F で確定した SupportProfile、ToleranceProfile、経路表現の範囲内では、CCD に false negative を許さない。離散 frame 間をすり抜ける adversarial fixture と保守性の根拠を必須とする。
- `NoSolutionCertificate`、`VerificationRecord`、hash は独立 checker で再検証する。
- golden は生配列順の snapshot ではなく canonical geometry／FOLD／certificate を比較する。
- E2E は Chrome、Edge、Firefox の主要 flow、保存復旧、multi-tab、PWA update を含む。
- 性能の3秒／30秒は努力目標であり、domain timeout ではない。
- 必須3D性能は基準端末で1,000 triangles・30fps、2,000は努力目標。

## 依存とライセンス

- 初期許可 SPDX ID：`MIT`、`0BSD`、`BSD-2-Clause`、`BSD-3-Clause`、`Apache-2.0`、`ISC`。追加は ADR と CI allowlist 更新を必須とする。
- 禁止：GPL、AGPL、LGPL の直接・推移依存、および GPL 実装からのコード移植。
- TreeMaker 等は論文・manual の数理記述から独立実装し、参考資料と由来を記録する。
- 依存追加時は理由、SPDX identifier、代替案を PR に記載し、CI allowlist を更新する。
- 想定候補：react、zustand、immer、three、earcut、jspdf、svg2pdf.js、nanoid。採用は M0／M0F で license と必要性を確認する。

## 禁止事項

- backend、外部 API、analytics、広告、crash upload、外部 font、CDN の追加
- localStorage（IndexedDB を使う）
- 連続衝突判定を離散 sampling だけで代用すること
- solver failure／timeout を `解なし` に変換すること
- verification metadata を証跡照合なしで信用すること
- M0F No-Go のまま本番 UI／solver 実装へ進むこと
- AC 未達の milestone を完了扱いにすること
