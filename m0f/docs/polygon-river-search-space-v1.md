# Polygon/river raw search-space audit v1

Status: exact finite work-surface description; **not** assignment enumeration,
a solver, a packing result, a support profile, or a feasibility decision

`buildPolygonRiverSearchSpaceAuditV1` rebuilds the closed polygon/river packing
problem for one caller-supplied square-grid candidate ID. It computes the
active-grid vertex-domain cardinality
`(columns + 1) * (rows + 1)` and its raw Cartesian power for all leaves using
`BigInt`. Both values are emitted as canonical base-10 integers. Assignments
are never materialized.

The Cartesian count intentionally allows multiple leaves to occupy the same
coordinate. No distinctness, polygon non-overlap, river separation, boundary,
symmetry, or residual-strip constraint has been applied. It is therefore a raw
finite search surface, not the number of valid placements, a lower bound on
solutions, or evidence that any solution exists.

## Retained source boundary

The audit retains the caller-referenced candidate and finite packing-problem
description, including its compact per-leaf integer domains, branch dimensions,
leaf-pair path inputs, and positive-edge residual strips. An unknown candidate,
including a reference against an empty enumeration, fails without substituting
another candidate and without making a no-solution claim.

The maximum input boundary of 512 by 512 grid cells and 20 leaves still has a
finite exact raw count. These defensive ceilings are not a supported-input
profile, memory or duration target, candidate-selection policy, or solver
capacity promise.

## Deliberate stopping point

This stage selects no distance metric and evaluates no geometric constraint.
It does not enumerate or assign coordinates, require distinct vertices, create
polygon or river geometry, handle residual paper, prove a packing, or construct
hinges, ridges, axial or axial+N contours, junctions, a crease pattern, M/V,
layers, or a folding path. Materialization, solver, placement, packing,
foldability, feasibility, and global GO flags remain false.

Run the fixed exact audit with:

```text
npm run m0f:polygon-river-search-space
```
