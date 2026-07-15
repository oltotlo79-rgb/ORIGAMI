# Ordered-tree to square-grid quantization adapter candidate v1

Status: M0F-2 input bridge; **not** enumeration, placement, packing, crease
generation, pleat routing, foldability, feasibility, or global M0F `GO`

`adaptOrderedTreeToSquareGridCandidateInputV1` connects two existing closed
candidate boundaries. It first validates the embedded width-aware ordered tree,
then maps every validated tree edge to exactly one square-grid quantization
branch and revalidates the complete generated grid input.

## Mapping contract

- Tree edges are read from the ordered-tree analyzer's canonical code-unit ID
  order. The output mapping and grid branches retain that order.
- Each tree edge ID is reused as its grid branch ID, so the mapping is one to
  one and stable.
- Terminal/internal classification is derived by the ordered-tree analyzer
  from endpoint degrees; caller-supplied classification is never trusted.
- Length and width are preserved exactly as finite binary64 source values.
  Internal widths use the same path as terminal widths and are not discarded.
- Paper dimensions, grid-axis bounds, relative-error limit, and the generated
  branch set are passed through the closed square-grid input parser. Either
  validation stage fails atomically without a partial result.

The adapter owns and deeply freezes its accepted snapshot. Per-array,
container, depth, object-width, property-name, total-property, per-string, and
aggregate-string ceilings bound validation work. They are defensive ceilings,
not a selected product SupportProfile.

## Claim boundary

The result fixes `scientificClaim` and every downstream inclusion/decision flag
to false. It does not enumerate a cell size, assign a vertex or direction,
place a branch, build polygons/rivers/hinges/ridges/axial contours/junctions,
emit M/V, or assess foldability or collision-free motion.

Run the deterministic internal-width bridge example with:

```text
npm run m0f:ordered-tree-grid-quantization
```
