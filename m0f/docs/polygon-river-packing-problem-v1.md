# Polygon/river packing problem description v1

Status: compact finite CSP input skeleton; **not** a polygon/river placement,
packing solution, crease pattern, foldability result, or feasibility decision

`buildPolygonRiverPackingProblemV1` accepts the same closed ordered-tree source
and caller-supplied square-grid candidate ID as the path-demand stage. It
re-enumerates the embedded width-aware tree and exact square-grid source, then
resolves that ID without selecting a candidate automatically. An unknown ID,
including a reference against an empty bounded enumeration, fails without
substitution and without making a no-solution claim.

## Finite variables and constraint inputs

Every leaf is represented by one unassigned active-grid vertex variable. Its
compact integer domains are `x in [0, columns]` and `y in [0, rows]`; the
problem description does not enumerate the Cartesian product and does not
assign coordinates. For every tree edge it retains the endpoint node IDs,
derived terminal/internal class, integer length steps, and integer width steps.
For every strict unordered leaf pair it retains the canonical path edge IDs,
`totalLengthSteps`, and `maximumWidthSteps` produced by the path-demand stage.

These records are constraint **inputs**, not evaluable geometric constraints.
The separation metric remains `unresolved`, `constraintEvaluable` is false, and
no assignment is included. In particular, `maximumWidthSteps` remains only the
metric-independent maximum of the path-edge widths; it is not silently treated
as a packing or separation rule.

The complete referenced quantization candidate is retained for traceability.
The problem also keeps the active grid, both exact x/y residual strips, and any
positive residual region. Residual-strip handling remains `unresolved`: the
off-grid paper is neither discarded nor claimed to be covered. Full-paper
coverage is false.

## Deliberate stopping point

This artifact is only a bounded CSP input skeleton. It is not a solver and does
not snap a drawing of tree points onto grid vertices. It does not choose a
distance metric, assign leaves, create polygon or river geometry, prove a
packing, or construct hinges, ridges, axial or axial+N contours, junctions, a
crease pattern, M/V, layers, or a folding path. Polygon/river geometry, packing,
all crease-construction stages, CP/M/V, foldability, feasibility, and global GO
inclusion and decision flags therefore remain false.

The defensive ceilings of 20 leaves, 190 unordered leaf pairs, and 39 tree
edges bound validation and computation. They are not a supported-input profile,
capacity promise, performance target, or completeness claim.

This stopping point follows the documented construction order: an
edge-weighted tree first supplies polygon/river dimensions; their boundaries
then provide hinges, followed by ridge and axial-contour construction. It does
not promote the finite problem description into any later-stage claim.

- Robert J. Lang and Roger C. Alperin,
  [Graph Paper for Polygon-Packed Origami Design](https://www.researchgate.net/publication/308300073_GRAPH_PAPER_FOR_POLYGON-PACKED_ORIGAMI_DESIGN)
- Robert J. Lang,
  [Crease Patterns as Art](https://langorigami.com/article/crease-patterns-as-art/)

Run the fixed internal-width example with:

```text
npm run m0f:polygon-river-packing-problem
```
