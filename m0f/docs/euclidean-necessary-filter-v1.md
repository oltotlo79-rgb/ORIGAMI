# Assigned-leaf Euclidean necessary filter v1

Status: exact evaluation of one declared pairwise necessary relation;
**not** polygon/river packing, a solver, a sufficiency result, or a global
no-solution decision

`evaluateEuclideanNecessaryFilterV1` accepts the candidate semantics record, a
closed polygon/river problem input, and exactly one active-grid vertex for each
leaf. Assignments are normalized to canonical leaf-ID order and retained only
as projected flap-tip/minimum-polygon-center anchors. They are not polygon
placements.

For every canonical leaf pair the evaluator computes, using `BigInt`:

```text
actualSquaredDistance = dx^2 + dy^2
requiredSquaredDistance = totalLengthSteps^2
passesNecessaryFilter = actualSquaredDistance >= requiredSquaredDistance
```

Equality is accepted by this filter. Width does not enter the relation;
`maximumWidthSteps` is copied only for traceability.

A failing pair rejects only the supplied anchor assignment under the explicit
candidate semantics. It does not prove that every assignment fails. Passing
all pairs is not evidence that the leaf polygons, rivers, junctions, residual
paper, or crease construction can be packed. In particular, a Manhattan check
is not substituted, and a general Chebyshev packing metric is not selected.

The construction family and finished-width geometry remain unresolved.
Automatic search, solver, polygon/river geometry, packing, placement, crease
construction, M/V, foldability, feasibility, support-profile, and global GO
claims remain false.

The necessary-only scope follows the classical circle/tree separation bound;
actual square-grid polygon/river construction requires additional local and
topological constraints:

- Erik D. Demaine, Sándor P. Fekete, and Robert J. Lang,
  [Circle Packing for Origami Design Is Hard](https://erikdemaine.org/papers/DiskPacking_Origami5/paper.pdf)
- Robert J. Lang and Roger C. Alperin,
  [Graph Paper for Polygon-Packed Origami Design](https://www.researchgate.net/publication/308300073_GRAPH_PAPER_FOR_POLYGON-PACKED_ORIGAMI_DESIGN)
