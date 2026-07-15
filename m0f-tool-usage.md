# M0F ツール使用方法

## セットアップ

```bash
npm ci
```

## 品質確認

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## M0F CLI

```bash
npm run m0f:list          # fixture カタログを表示
npm run m0f:validate      # fixture/catalog を検証
npm run m0f:catalog-gate  # canonical catalog 完備を fail-closed 検証
npm run m0f:gate          # global M0F gate を JSON/診断付きで検証
npm run m0f:smoke         # 最小 smoke 実行
npm run m0f:test          # M0F 専用テスト
```

`validate` の warning は未投入 canonical fixture、error は契約違反です。`catalog-gate` と `m0f:gate` は必要な fixture・evidence・profile・GO record が揃うまで失敗します。

## 実験・幾何検証

```bash
npm run m0f:experiment
npm run m0f:faces
npm run m0f:face-audit
npm run m0f:face-evidence
npm run m0f:face-subgate
npm run m0f:box-grid-candidates
npm run m0f:polygon-river-packing-problem
npm run m0f:euclidean-necessary-filter
npm run m0f:euclidean-necessary-witness-search
```

## 回帰 bundle

各 `m0f:*candidate` script は candidate bundle の CLI です。通常は次の順で使用します。

```bash
npm run m0f:neg-path-bounded-finite-angles-candidate -- --verify
npm run m0f:neg-path-bounded-finite-angles-candidate -- --write
npm run m0f:neg-path-bounded-finite-angles-candidate -- --verify --json
```

`--verify` は保存 artifact の hash、schema、source/control 差分、再生成結果を検証します。`--write` は bundle を再生成するため、実行前後に `git diff` で変更を確認してください。`--json` は機械処理用の安定 JSON を出力します。

## Web UI / Pages

```bash
npm run dev
npm run build
npm run preview
```

GitHub Pages の smoke/build は main push で実行されます。実際の Deploy はリポジトリ変数 `ENABLE_GITHUB_PAGES=true` を設定した場合のみ有効になります。

## 完全性について

M0F candidate bundle の再現性と parser 回帰は検証済みです。一方、canonical fixture、実測 SupportProfile/ToleranceProfile、完全な CCD/collision-free 証明、global M0F `GO` は入力データと仕様確定が必要です。未投入データを推測で補わず、gate は fail-closed で停止します。
