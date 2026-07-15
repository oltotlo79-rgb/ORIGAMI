# verify boundary

製品内で使う局所条件、運動学、連続衝突、積層順序、目標一致、証跡整合の検査を置く。

- generator/plannerの成功フラグを信用せず、入力と証跡を検査する。
- profile、revision vector、hashが一致した場合だけ検証結果を現在のものとして扱う。
- M0F Go前は製品verifierを実装しない。
