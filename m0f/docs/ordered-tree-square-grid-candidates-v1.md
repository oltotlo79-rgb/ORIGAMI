# Ordered-tree square-grid candidate composition v1

Status: exact M0F-2 quantization enumeration; **not** polygon/river packing,
placement, crease construction, pleat routing, or feasibility

`enumerateOrderedTreeSquareGridCandidatesV1` is the first closed vertical slice
from a width-aware ordered tree to finite exact square-grid candidates. It runs
the ordered-tree/grid adapter and then the bounded quantization enumerator.

The result keeps both stages so every tree edge can be traced through its
terminal/internal classification, source length and width, and every candidate's
integer length/width steps. The quantization result always retains canonical
`sourceBranches`, including when its candidate array is empty. The composition
uses the same core binding check as the Worker protocol: paper, axis bounds,
error limit, canonical source branches, and every nonempty candidate branch
must match the adapter output before returning.

An empty array remains only a completed bounded enumeration. It is not a proof
that no box-pleating construction exists. No candidate is selected, and the
composition does not construct polygon/river regions, hinges, ridges, axial or
axial+N contours, junction gadgets, M/V, a target state, layers, or a folding
path. Every downstream claim remains false.

## Construction-order rationale

Lang and Alperin describe polygon-packed design as: partition paper into
polygons and polygonal rivers whose dimensions come from the edge-weighted tree;
use their boundaries as hinges; construct ridges; then propagate axial contours.
Lang's uniaxial box-pleating description identifies axial+N folds only after
those quantized elevation contours exist. This slice therefore stops at
quantized tree dimensions and does not reinterpret a snapped tree drawing as a
box-pleating construction.

- Robert J. Lang and Roger C. Alperin,
  [Graph Paper for Polygon-Packed Origami Design](https://www.researchgate.net/publication/308300073_GRAPH_PAPER_FOR_POLYGON-PACKED_ORIGAMI_DESIGN)
- Robert J. Lang,
  [Crease Patterns as Art](https://langorigami.com/article/crease-patterns-as-art/)

Run the deterministic internal-width example with:

```text
npm run m0f:ordered-tree-grid-candidates
```
