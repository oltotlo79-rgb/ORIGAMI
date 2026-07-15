# Width-aware ordered-tree input candidate v1

`box-pleating/ordered-tree-input.ts` defines the closed topology boundary used
before any tree or box-pleating placement experiment. It preserves stable
node/edge IDs, finite embedded positions, labels, branch lengths, branch
widths, and the caller's cyclic edge order at every node.

The result is candidate-only with `scientificClaim: false`. It validates input
consistency and derives topology classes; it does not place the tree on paper.

## Structural checks

- The undirected graph is connected, acyclic, free of self-loops and parallel
  edges, and has exactly `nodes - 1` edges.
- Every edge endpoint and every rotation entry resolves exactly once.
- Each rotation contains every incident edge exactly once. Outer node, edge,
  and rotation arrays are canonicalized by ID while each supplied cyclic order
  is retained.
- The accepted requirement range is 2..20 leaves. The 40-node, 39-edge, and
  degree-20 ceilings bound this implementation slice and are not a measured
  SupportProfile.
- Branch width is retained for both terminal and internal edges. Terminal and
  internal classifications are derived from endpoint degrees rather than
  trusted from the caller.
- Caller accessors, cycles, sparse arrays, exotic objects, oversized arrays,
  wide objects, overlong keys/strings, and excessive aggregate properties are
  rejected before a validation snapshot is exposed.

## Mirror metadata

When mirror references are present, node and edge references must be
reciprocal. Axis nodes are self-mirrored. Mirrored edges must connect the
mirrored endpoint pair and must have exactly equal binary64 length and width.
The mirrored node rotation must equal the reverse mirrored-edge cycle, with an
arbitrary cyclic shift allowed. Partial mirror mappings fail closed.

This is metadata consistency only. The current slice does not infer a symmetry
axis from coordinates or prove that node positions are geometric reflections.
Position quantization and geometric symmetry evidence remain later work.

## Deliberate exclusions

The result fixes placement, packing, CP generation, pleat routing, M/V,
foldability, feasibility, and global M0F GO fields to false. Run the fixed
internal-width example with:

```text
npm run m0f:ordered-tree
```
