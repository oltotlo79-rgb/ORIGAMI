# solver boundary

ツリー法と本来の箱ひだの候補CP生成を置く。方式別工程を分離し、共通部は明示した共通契約だけを共有する。

- 候補生成の成功だけで「検証済み」を返さない。
- verifierやreference verifierの合格を捏造しない。
- M0F Go前は製品solverを実装しない。
