# geometry boundary

幾何述語、平面化、half-edge、三角形分割、canonical hash等の低レベル処理を置く。

- 許容誤差を暗黙の定数にせず、呼出側から明示的に受け取る。
- solverの探索方針やUI状態を持たない。
- M0Fで確定するrobustness条件を満たすまで製品保証には使用しない。
