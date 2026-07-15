# referenceVerifier boundary

generator/plannerから独立した、M0Fおよび受入試験用の低速なreference checkerを置く。

- solver/plannerの高レベル制約実装や内部cacheを再利用しない。
- 低レベル幾何述語を共有する場合はdifferential testまたは既知の正確解を必須とする。
- 製品verifierと同じバグで合格する構成を避ける。
