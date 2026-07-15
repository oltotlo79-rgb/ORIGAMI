# m0f ツール群 改善提案書（Codex 実装用）

- 作成日: 2026-07-16
- 作成者: Claude Code（読み取り専用レビュー。コードは一切変更していない）
- 対象: `m0f/`、`tests/m0f/`、`m0f/schemas/`、`m0f/docs/`、`package.json` の m0f 関連スクリプト
- 位置づけ: 提案であり決定ではない。仕様（保証契約）の変更は一切含まない。着手前に CLAUDE.md と `docs/05_実現性検証仕様書.md` を再確認すること。

---

## 0. 全提案に共通する絶対条件

1. **出力バイト完全一致**: 各候補バンドルは「書き出したファイルのバイト列が台帳の SHA-256 と一致すること」「決定的再生成が既存ファイルと一致すること」を検証している。リファクタリング後も、**全バンドルの生成物（README.md / control / source / ledger）は 1 バイトも変わってはならない**。変更前に全バンドルを `--write` した結果のハッシュ一覧を退避し、変更後に完全一致することを機械的に確認するチェックを先に用意する。
2. **fail-closed の維持**: 「証跡が揃うまで合格にしない」設計思想を共通化後の骨組みにそのまま引き継ぐ。理由コード（reasonCodes）の種類・順序・意味を変えない。
3. **決定性の維持**: 乱数・現在時刻・ホスト情報・例外メッセージを生成物に混入させない現行方針を維持する。出力は引き続き `stableStringify`（キー順固定）経由とする。
4. **契約の縮退禁止**: `contractStatus: 'candidate'`、`scientificClaim: false`、`globalM0fGate: 'not-evaluated'` などの宣言フィールドの意味・値を変えない。M0F GO 判定に影響する変更はしない。
5. **段階的移行**: 一度に全 37 バンドルを書き換えない。まず 1〜2 バンドルを新骨組みへ移行して全テスト・全 CLI・バイト一致を確認し、その後に残りを機械的に移行する。

---

## 1. 【最優先】候補バンドル 37 個の共通骨組み化

### 現状（実測）

- `m0f/*-candidate-bundle.ts` が 37 ファイル、合計 38,340 行（平均 約1,040 行、範囲 811–1,333 行）。
- 隣接する 2 バンドルを識別子名だけ正規化して diff すると、2,316 行中差分は 324 行（**約 86% が完全一致**。組によっては約 95%）。
- 以下のヘルパーが全 37 ファイルにほぼ逐語コピーされている:
  - `isRecord` / `addLedgerIssue`（または `addIssue`）/ `exactKeys` / `sameStableJson`
  - `MutableVerificationState` / `initialState` / `resultFromState`
  - `parseJsonText` / `canonicalCaseIsAbsent`（または複数形）/ `jsonDifferencePaths`
  - `build* / write* / verify*` の一連の流れ（台帳検証 → ディレクトリ厳密照合 → ハッシュ照合 → control 受理確認 → source 拒否・issue 署名照合 → 決定的再生成一致）
- バンドル固有の実質的内容は 1 ファイルあたり 250〜350 行程度:
  - ケース定義（mutationKind / changedPaths / expectedIssues / source 生成関数）
  - スキーマ ID・scope・vectorSetId 等の定数
  - `declaredXxxParserOnly` フラグの真偽の組
  - README 本文

### 提案

`m0f/candidate-bundle-framework.ts`（名称は任意）を新設し、次を汎用実装として 1 回だけ書く:

1. **台帳パーサ生成器**: `ROOT_KEYS` / `FIXED_LITERALS` / generator / provenance / cases / artifacts の検証を、バンドル定義オブジェクトから構築する。issue コード集合（`invalid-snapshot` 〜 `invalid-hash`）は現行と同一にする。
2. **build / write / verify の共通実装**: 現行の検証順序・reasonCodes 付与条件・checks フィールドを厳密に踏襲する。
3. **バンドル定義型**: 各バンドルは「定義オブジェクト 1 個（+固有の source 生成関数）」だけを書く。目安として各バンドル本体を 1,000 行超 → 300 行前後にする。

### 注意点

- 台帳 JSON のキー順は `stableStringify` がソートするため骨組み化の影響を受けないが、**README 文字列・scope 文字列・エラーメッセージ文字列は各バンドル固有の逐語データとして定義側に残す**こと（自動生成に置き換えるのは提案 6 で別途検討。まずはバイト一致を最優先）。
- 型レベルのリテラル固定（`as const` / `satisfies`）による「フィールド値のコンパイル時固定」が現行の強みなので、ジェネリクス化で型の厳密さを落とさない。落ちる場合は、定義オブジェクト側に `satisfies` を残す形にする。
- 期待削減量: 本体 + CLI で **約 2 万〜2.5 万行**。

### 受入条件

- 全バンドル CLI の `--verify` が exit 0、`--json` 出力が変更前と完全一致。
- `npm run m0f:test` 全件パス（変更前: 2,678 件）。
- 変更前後で全バンドル生成物のバイト列が完全一致（前述の退避ハッシュとの照合）。

---

## 2. CLI 37 個の共通化

### 現状

- `m0f/*-candidate-bundle-cli.ts` が 37 ファイル、合計約 2,900 行。インポートするシンボル名と 2 つのメッセージ文字列以外は**ほぼバイト単位で同一**。
- 共通パターン: `--help/-h` → USAGE、`--verify|--write` 排他、未知オプション/複数 positional は exit 2、`--json` は `stableStringify`、成功メッセージ、失敗時 `BLOCKED <reasonCode>` を stderr、包括 catch で固定文字列 + exit 1、`import.meta.url` による main ガード。

### 提案

- `runCandidateBundleCli(bundle, argv, io)` を骨組み側に 1 つ実装。各 CLI ファイルは「バンドル定義を import して 10 行程度で委譲」だけにする。
- exit コード規約（0 = 再現可能、1 = ブロック/失敗、2 = 引数エラー）と stdout/stderr の出し分けは現行のまま。
- USAGE 文・成功/失敗メッセージ文字列は各バンドル定義から供給する（逐語維持）。

### 受入条件

- 各 CLI の `--help` / `--verify` / `--write` / `--json` / 引数エラー時の**標準出力・標準エラー・exit コードが変更前と完全一致**。

---

## 3. バンドルテスト 37 ファイルの共通ハーネス化

### 現状

- `tests/m0f/*candidate-bundle.test.ts` が 37 ファイル、合計 19,375 行（平均 約524 行）。
- 全ファイルが独立に `mkdtemp` → バンドル書き出し → 破壊（ハッシュ改ざん、余分ファイル、symlink、台帳の再帰的変異 `recursiveClosedLedgerMutations` 等）→ 拒否確認、という同一手順を手書きしている。`record` / `array` / `jsonFile` / `copyBundle` / `coherentlyRewriteArtifact*` などのヘルパーも逐語コピー。

### 提案

- `tests/m0f/helpers/candidate-bundle-harness.ts`（名称任意）を新設し、共通シナリオ（再現成功、各 reasonCode を誘発する破壊操作、CLI の exit/出力検証、スキーマ照合）をパラメータ化して 1 回だけ実装する。
- 各テストファイルは「バンドル定義 + 固有ケース（そのバンドル特有の変異や境界）」だけを書く。
- **テスト削減はカバレッジ削減ではない**: 共通ハーネスは現行の全アサーションを網羅すること。移行前後で `vitest run tests/m0f` のテスト件数が大きく減る場合は、共通化漏れを疑う。

---

## 4. package.json スクリプトの集約

### 現状

- `m0f:neg-*` 系スクリプトが 40 個以上あり、全て `tsx m0f/<名前>-cli.ts` の一行定義。バンドル追加のたびに 1 行増える。

### 提案

- ディスパッチャ CLI（例: `tsx m0f/candidate-bundle-cli.ts <bundle-id> [--verify|--write] ...`）を 1 つ用意し、スクリプトを 1 本に集約する。バンドル ID 一覧は骨組みのレジストリから取得し、`--list` で列挙できるようにする。
- 既存スクリプト名を CI や文書が参照している場合は、削除ではなく段階的な移行（一定期間は両方維持）とする。

---

## 5. 数値計算ホットパスの性能改善

いずれも生成物のバイト列・計算結果には影響しない、内部実装のみの変更。**計算結果が変わらないことは property テストで担保すること。**

### 5-1. 使い捨て ArrayBuffer/DataView の排除（最も効く）

- `m0f/model/exact-dyadic.ts:20` 付近: `finiteNumberToDyadic` が呼び出しごとに 8 バイトの `ArrayBuffer` + `DataView` を新規生成している。
- `exactOrientationSign` は 1 回の向き判定で 6 回、`exactPolygonAreaSign` は頂点ごとに 2 回これを呼ぶため、census / overlap 系の内側ループで大量の使い捨てアロケーションが発生する。
- **対策**: モジュールレベルで `DataView` を 1 個確保して使い回す（このコードは同期処理のみなので共有再利用は安全。Worker 間で共有はしない）。
- 同一パターン: `m0f/model/exact-rational.ts:52` の `finiteBinary64ToExactRational`。

### 5-2. 有理数演算の約分（GCD）を毎回行っている

- `m0f/model/exact-rational.ts:67-88`: `add/subtract/multiply/divide` が毎回 `exactRational()` 経由で Euclid の互除法を実行する。
- **対策**: 連鎖計算用に「正規化を遅延する」内部経路（最後に 1 回だけ約分）を追加する。公開 API の結果値は変えない。

### 5-3. 厳密フォールバック時の再変換

- `m0f/geometry/predicates.ts:110` 付近: 浮動小数点の高速フィルタが確定できず厳密計算へ落ちるとき、6 座標の dyadic 変換をゼロからやり直す。同一頂点を O(n) 回再訪する census ループでは、点ごとの変換結果のメモ化（キャッシュ）が有効。
- **対策**: 呼び出し側ループでの変換キャッシュ、または `orientation2D` に変換済み値を受け渡せる内部 API を追加。

### 5-4. 軽微

- `m0f/model/exact-rational.ts:145` `leadingBinaryValue`: BigInt のビット長を `toString(2).length` で取っており O(n) の文字列生成が発生。シフトループ等で置換可能（表示変換のみで使用のため優先度低）。
- `m0f/geometry/triangulate-face.ts`: 耳切り法が O(n² log n)（L619 の while ループ内で毎回リスト再構築+ソート、L438/L508 に O(n²) チェック）。現行の小さい面では問題ないが、頂点数が数百を超える面を扱う際の拡張性上限として記録しておく。今は変更不要。

---

## 6. 品質リスクの低減

### 6-1. エラー握りつぶし（bare catch）への診断経路の追加

- 非テストコードに `catch {}`（捕捉した例外を捨てる）が **421 箇所**。大半は「想定内の失敗 → 理由コード」への変換で意図的だが、各 `verify*` 末尾の包括 catch（例: `neg-tree-candidate-bundle.ts:1097`）は想定外の内部バグまで `unexpected-failure` 一語に潰す。
- **対策**: 骨組み側に 1 箇所だけ、デバッグフラグ（例: 環境変数 `M0F_DEBUG=1`）が立っているときに限り元例外のメッセージ/スタックを **stderr** に出す経路を設ける。**生成物・JSON 出力・理由コードには一切含めない**（決定性維持のため）。

### 6-2. 再帰の深さ上限

- `jsonDifferencePaths`、`stableStringify`、`deepFreeze` / `isPlainSnapshot` 系の再帰は循環参照は防いでいるが**深さの上限がない**。ディスク上のバイト列を入力に取る verify 経路で、異常に深い入れ子の JSON によりスタックオーバーフローし得る。
- **対策**: 深さ上限（例: 512）を追加し、超過時は例外ではなく既存の失敗系（`invalid-snapshot` 等の適切な issue / reasonCode）に落とす。上限値は定数として 1 箇所で定義。

---

## 7. 【将来課題・任意】宣言フラグと散文の二重管理の解消

- 各バンドルの台帳には約 50 個の真偽フラグ（`declaredXxxParserOnly` / `xxxEstablished` 等）があり、同一ファイル内で **5 箇所**（型定義 / ROOT_KEYS / FIXED_LITERALS / build 内リテラル / resultFromState 内リテラル）に反復されている。さらに README・scope 文字列の「保証しないこと」列挙が、これらのフラグと**手動で**二重管理されている。
- 骨組み化（提案 1）でファイル内 5 箇所反復は自動的に 1 箇所になる。その後の任意課題として、README の否定列挙をフラグから自動生成することを検討する。**ただしこれは生成物バイト列が変わる変更**なので、実施する場合はハッシュ更新を伴う明示的な世代交代（ledger の generatorVersion 更新等）として、別 PR・別判断で行うこと。提案 1〜6 と混ぜない。

---

## 8. 推奨実施順序

| 順  | 内容                                          | 出力バイトへの影響 | リスク   |
| --- | --------------------------------------------- | ------------------ | -------- |
| 1   | ハッシュ退避 + バイト一致検証スクリプトの整備 | なし               | 低       |
| 2   | 提案 5-1（DataView 使い回し）                 | なし               | 低       |
| 3   | 提案 1（骨組み化、まず 1〜2 バンドルで試行）  | なし（必須条件）   | 中       |
| 4   | 提案 2（CLI 共通化）                          | なし               | 低       |
| 5   | 提案 3（テストハーネス共通化）                | なし               | 中       |
| 6   | 提案 4（スクリプト集約）                      | なし               | 低       |
| 7   | 提案 6-1 / 6-2（診断経路・深さ上限）          | なし               | 低       |
| 8   | 提案 5-2 / 5-3(有理数・キャッシュ)            | なし               | 中       |
| 9   | 提案 7(散文自動生成)                          | **あり**           | 要別判断 |

各段階の完了条件は共通で:

```
npm run lint && npm run typecheck && npm run m0f:test
全バンドル CLI --verify が exit 0
生成物バイト列が退避ハッシュと完全一致（段階 9 を除く）
```

---

## 付記: 変更してはいけないもの

- `docs/` 配下の規範文書の意味内容（本提案はコード整理であり仕様変更を含まない）
- reasonCodes / issue コードの語彙・順序
- `tests/fixtures/manifest.json` と各バンドルの「canonical 未登録」状態
- 依存パッケージの追加（本提案はすべて依存追加なしで実施可能。追加が必要になった場合は ADR が必要）
