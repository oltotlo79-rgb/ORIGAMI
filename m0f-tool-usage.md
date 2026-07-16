# ORIGAMI / M0F ツール使用ガイド

## Web UI を開く

ローカル開発サーバーを起動します。

```bash
npm ci
npm run dev
```

ブラウザで **http://127.0.0.1:5173/** を開いてください。UI は現在 M0F 実現可能性検証画面です。候補計算の確認はできますが、製品版の折り紙生成結果や M0F GO 判定を提供する画面ではありません。

静的ビルドの確認は次のコマンドです。

```bash
npm run build
npm run preview
```

`preview` の既定URLは **http://127.0.0.1:4173/** です。

## 品質確認

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run licenses:check
```

## M0F CLI

```bash
npm run m0f:list
npm run m0f:validate
npm run m0f:catalog-gate
npm run m0f:gate
npm run m0f:smoke
npm run m0f:readiness-report
```

JSONで結果を取得する場合は、直接CLIを実行します。

```bash
npx tsx m0f/cli.ts gate --json
npx tsx m0f/cli.ts list --canonical --json
npx tsx m0f/cli.ts validate --complete --json
```

現時点の `gate` と `catalog-gate` は、必要なcanonical fixture・証跡・プロファイルが揃うまで fail-closed で終了します。これは未検証の折り可能性を製品機能として公開しないための仕様です。

## GitHub Pages

Pages のビルド smoke は `main` へのpushで実行されます。公開Deployは、リポジトリ変数 `ENABLE_GITHUB_PAGES=true` を設定した場合だけ有効になります。Pages未設定のリポジトリでは公開URLは存在しません。

## 候補bundleについて

`m0f:*candidate` は parser・契約・再現性の候補検証です。`--verify` は保存済みartifactを検証し、`--json` は機械可読結果を出力します。`--write` はartifactを書き換えるため、実行後に `git diff` を確認してください。

候補検証は、物理的な連続折り経路、自己衝突なし、積層順序、製品CP/FOLD生成を保証しません。

## 参照

- 実現性ゲート仕様: `docs/05_実現性検証仕様書.md`
- 開発計画: `docs/04_開発計画_マイルストーン.md`
- 候補レポート: `M0F_READINESS_REPORT.candidate.md`
