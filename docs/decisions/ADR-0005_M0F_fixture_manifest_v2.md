# ADR-0005: M0F fixture manifest v2

- 日付: 2026-07-14
- ステータス: Accepted for M0F harness
- 対象: M0F fixture provenance / license / coverage

## 背景

manifest v1はfixture全体に一つのprovenanceを置き、入力・README・既知artifact・
benchmarkのpath/hashを別々の欄で管理していた。この形では、配布不可の原データと
独自等価fixtureを区別できず、fixture directoryへ未登録ファイルを追加しても検出
できない。またlicenseは任意文字列、coverageは未定義であった。

## 決定

1. schemaVersion 2へ一括移行し、v1はhard-rejectする。
2. 出典メタデータ`sourceReferences`と、実際の配布物台帳
   `distributedArtifacts`を分離する。
3. 各配布物にstable ID、role、path、raw SHA-256、固定6種のSPDX、出典、
   source-use分類を必須化する。用途欄はpathではなくartifact IDで参照する。
4. 配布可の出典rightsとmetadata-only rightsを判別unionにする。metadata-onlyは
   URL、原データhash、取得手順を必須とし、独自等価fixtureからの参照だけを許す。
5. fixture directoryを再帰走査し、全regular fileの一意登録を必須化する。
   symlink、reparse相当のrealpath変化、root外脱出、非regular fileを拒否する。
6. coverage tagを固定語彙とし、canonical fixture familyごとに必須subsetを定める。
7. manifest合格はcatalog整合だけであり、科学的検証結果には使用しない。

## 却下した案

### v1とv2を恒久的に併用する

却下。どちらの意味でlicense/provenanceを解釈したかが曖昧になり、弱いv1へ
ダウングレードできる。

### fixture全体に一つのlicenseだけを置く

却下。原データ、独自生成物、説明、benchmarkで由来や利用条件が異なる場合を
表現できない。

### manifest記載pathだけを読む

却下。未登録の第三者ファイルを同じdirectoryへ置く抜け道が残る。

## 影響

- smoke fixtureの4ファイルもすべて台帳・hash・MIT出典へ束縛される。
- 科学fixture追加時は、ファイルを置くだけでなく出典、rights、license、coverage、
  artifact pointerを同じ変更で登録する。
- 再配布できない原データはrepositoryへ入れず、取得情報と独自等価fixtureを使う。
