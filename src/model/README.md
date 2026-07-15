# model boundary

Project、tree、FOLD、crease mesh、path certificate等のデータ型と純粋な状態遷移を置く。

- React、DOM、Worker APIへ依存しない。
- 外部入力は`unknown`として受け、M1以降にruntime schemaで検証する。
- 入力状態と派生成果物、および各成果物のrevision vector/hashを分離する。
