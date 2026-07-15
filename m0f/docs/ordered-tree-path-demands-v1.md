# Ordered-tree path demands candidate v1

Status: metric-independent polygon/river-packing input; **not** a placement,
packing, crease pattern, foldability result, or feasibility decision

`buildOrderedTreePathDemandsV1` re-enumerates the embedded width-aware tree and
exact square-grid source, then resolves one caller-supplied candidate ID. It
never chooses a candidate automatically. An unknown ID, including a reference
against an empty bounded enumeration, fails without substituting another grid
and without making a no-solution claim.

## Integer tree-path data

For every strict unordered pair of leaf IDs, the builder records the unique
tree path from the first leaf to the second. Every path edge retains its stable
tree ID, derived terminal/internal class, integer length steps, and integer width
steps from the referenced quantization candidate.

`totalLengthSteps` is exactly the BigInt sum of length steps along that path.
`maximumWidthSteps` is only the BigInt maximum of the referenced edge widths. It
is retained as a width summary and explicitly has no packing or separation
metric semantics. The complete referenced candidate is embedded so its exact
cell size, residual strips, source values, quantized values, and errors remain
traceable.

The builder verifies one-to-one agreement among tree edges, derived classes,
adapter mappings, grid source branches, and candidate branch quantizations. At
the 20-leaf boundary it deterministically produces all 190 unordered pairs.

## Deliberate stopping point

No geometric separation metric is selected here. In particular, the builder
does not silently choose Euclidean, Manhattan, or Chebyshev distance. It does
not place leaf polygons, route rivers, partition the grid, or construct hinges,
ridges, axial/axial+N contours, junctions, M/V, layers, or a folding path. All
downstream inclusion and decision flags remain false.

This boundary follows the documented construction order in which an
edge-weighted tree supplies polygon/river dimensions before hinge, ridge, and
axial-contour construction:

- Robert J. Lang and Roger C. Alperin,
  [Graph Paper for Polygon-Packed Origami Design](https://www.researchgate.net/publication/308300073_GRAPH_PAPER_FOR_POLYGON-PACKED_ORIGAMI_DESIGN)
- Robert J. Lang,
  [Crease Patterns as Art](https://langorigami.com/article/crease-patterns-as-art/)

Run the fixed internal-width example with:

```text
npm run m0f:ordered-tree-path-demands
```
