# Box-pleating packing semantics candidate v1

Status: candidate meaning contract for a future necessary-condition filter;
**not** a polygon/river geometry model, packing constraint, solver, or
feasibility decision

This contract prevents an integer tree-path summary from silently acquiring a
different geometric meaning at each stage. It fixes the following narrow
interpretation for a future filter:

- a leaf variable denotes a projected flap tip and the center of its minimum
  leaf polygon;
- one grid-index unit denotes one quantized length step;
- `lengthSteps` denotes a classical uniaxial tree-edge weight;
- a leaf pair may later be checked with squared Euclidean distance at least the
  square of its tree-path length sum;
- equality is admitted by that filter, and the result is necessary only.

No distance test is evaluated by this artifact. Even when evaluated later, the
Euclidean inequality cannot establish polygon/river packing sufficiency.

## Width and construction boundary

The product's independent finished-branch width is not identified with the
single classical tree weight. `maximumWidthSteps` remains trace-only and has no
separation, river-capacity, junction, or packing semantics.

The construction family remains unresolved. The contract does not silently
select pure minimum squares, Pythagorean stretch, GOPS, or any mixture of them.
Finished-width geometry, actual leaf polygons, river banks and turns,
junctions, overlap ownership and gadgets, boundary contact, residual paper,
and full-paper coverage also remain unresolved. General Manhattan and
Chebyshev packing metrics are not selected.

Accordingly, actual geometry and global packing constraints are not evaluable;
placement, packing, crease construction, M/V, foldability, feasibility, and
global GO claims remain false. This is a closed candidate semantics record, not
a support profile or verified scientific result.

The separation of a necessary filter from later construction follows the
source distinction between circle/tree lower bounds and actual polygon/river
construction:

- Erik D. Demaine, Sándor P. Fekete, and Robert J. Lang,
  [Circle Packing for Origami Design Is Hard](https://erikdemaine.org/papers/DiskPacking_Origami5/paper.pdf)
- Robert J. Lang and Roger C. Alperin,
  [Graph Paper for Polygon-Packed Origami Design](https://www.researchgate.net/publication/308300073_GRAPH_PAPER_FOR_POLYGON-PACKED_ORIGAMI_DESIGN)
- Erik D. Demaine and Jason S. Ku,
  [Box Pleating Is Hard](https://erikdemaine.org/papers/BoxPleatingHard_JCDCGG2015full/)
