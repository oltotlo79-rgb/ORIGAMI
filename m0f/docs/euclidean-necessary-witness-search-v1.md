# Euclidean necessary-filter witness search v1

Status: bounded deterministic search for projected-anchor witnesses;
**not** polygon/river packing, geometric placement, feasibility, or a global
no-solution certificate

`searchEuclideanNecessaryWitnessesV1` traverses the finite active-grid vertex
domain in canonical leaf-ID order, with vertices ordered by `y` and then `x`.
After assigning each leaf it evaluates every newly closed pair using the exact
squared-`BigInt` relation:

```text
dx^2 + dy^2 >= totalLengthSteps^2
```

Assignments that fail this necessary relation are pruned. Coordinate
distinctness is deliberately absent; coincidence remains possible whenever the
declared pair demand permits it. Finished widths are retained for traceability
but do not participate in the filter.

## Budgets and terminal states

The caller supplies positive `maxVisitedStates` and `maxWitnesses` values below
fixed defensive ceilings. One visited state is one attempted leaf-to-vertex
assignment, including assignments rejected immediately by pruning. The result
distinguishes:

- `witness-found`: the requested witness count was reached before proving the
  rest of the domain;
- `budget-exhausted`: the next assignment would exceed the state budget;
- `domain-exhausted`: every assignment in the modeled active-grid domain was
  traversed without hitting either earlier stop.

Only `domain-exhausted` is a complete statement about this deliberately narrow
search domain. If it contains no witness, the result says only that no
assignment passes this pairwise necessary filter in that domain. It does not
exclude another grid candidate, another construction semantics, or a valid
origami design.

## Claim boundary

Each returned witness is a set of projected flap-tip/minimum-polygon-center
anchors. It includes the exact pair evaluations but no polygons, rivers,
junctions, overlap/contact policy, residual-paper construction, axial lines,
pleat routing, M/V assignment, foldability, or continuous path. Passing the
filter is therefore not sufficient packing evidence. The search is an M0F
experiment component and cannot set a SupportProfile or global M0F `GO`.

The non-scientific performance bench covers a complete 13,806-state default
domain and an exact 200,000-state budget stop on a 512 by 512 active grid. It
records implementation measurements only: there is no timing threshold, and
the defensive state ceiling is not a selected product limit.
