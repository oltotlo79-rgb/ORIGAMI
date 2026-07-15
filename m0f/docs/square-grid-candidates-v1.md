# M0F square-grid quantization candidates v1

Status: box-pleating prerequisite experiment; **not** placement, crease
generation, pleat routing, a folding path, or M0F `GO`

## Boundary

`enumerateSquareGridCandidatesV1` explores finite square-cell grids for one
rectangular paper and a set of terminal or internal branch dimensions. Every
record is fixed to `contractStatus: "candidate"` and
`scientificClaim: false`. The result explicitly sets
`placementIncluded: false`, `pleatRoutingIncluded: false`, and scope
`square-grid-quantization-only`.

This is not the prohibited shortcut of snapping a tree-method layout to a
grid. It supplies only one prerequisite for the future independent
box-pleating pipeline. Axial/ridge/hinge creases, axial+N contours, rivers,
junction gadgets, M/V, target state, layers, and a continuous collision-free
path are all absent.

## Exact candidate computation

- Source binary64 dimensions and the caller-provided error limit are converted
  to exact BigInt rationals before comparison.
- A candidate has one exact `cellSize` shared by x and y; rectangular cells are
  never produced.
- One paper axis is filled exactly. Any unused extent on the other axis is an
  explicit nonnegative positive-boundary strip. Exact aspect matches fill both.
- Positive branch lengths and widths use nearest-integer, half-up cell steps.
  Their exact relative errors must be at most the supplied limit. A zero width
  remains exactly zero.
- Internal and terminal branches pass through the same quantization rule.
- The canonical source branch list is retained in every result, including when
  no candidate passes the error bound. Every nonempty candidate branch list
  must match it exactly.
- Results are finite, duplicate-free, branch-order independent, deeply frozen,
  and sorted by a declared deterministic tie-break.

The defensive 512 by 512 axis ceilings and the 65,536
candidate-by-branch-record ceiling are implementation safety bounds, not a
frozen SupportProfile or a claim that those sizes are usable by a future
box-pleating generator. Serialized input byte limits remain the responsibility
of a future file or Worker boundary; this in-memory parser still has to receive
the supplied value before it can validate its closed shape.

## Independent branch-dimension recomputation boundary

`allocateBranchDimensionsToSquareGridV1` accepts one candidate identity and
exact source branch dimensions, then independently recomputes integer length
and width steps. It rejects a noncanonical candidate identity, malformed or
oversized exact integers, a dimension outside the supplied error limit, and a
dimension above its defensive step ceiling. Any failed dimension rejects the
whole call without returning partial allocations. Terminal and internal
branches use the same calculation, including exact zero-width handling.

This second boundary is deliberately still dimension allocation only. It does
not assign any branch to paper coordinates and does not establish packing,
river or junction feasibility, crease roles, M/V, foldability, or M0F `GO`.

## Exact lattice substrate

`buildSquareGridLatticeV1` revalidates one canonical grid identity,
paper extent, and residual-strip pair, then materializes exact row-major lattice
vertices. It enumerates unique unit primitives in the horizontal, vertical,
positive-45-degree, and negative-45-degree direction families. Because the
same exact `cellSize` defines both coordinate axes, each diagonal has a true
45-degree grid direction rather than a stretched rectangular-cell direction.

The lattice preserves the internal grid region separately from any positive-x
or positive-y boundary strip. Composite vertex, primitive, and total-record
ceilings are defensive memory/work bounds and are checked before output
allocation; they are not a selected SupportProfile. A direction primitive is
not a crease, axial/axial+N selection, branch placement, river, junction, M/V
assignment, or foldability result.

## Hashed candidate experiment record

The `box-pleating.square-grid-quantization-v1` experiment runs the same finite
enumerator through the generic M0F experiment envelope. It records deterministic
parameter, input, and semantic SHA-256 hashes plus fixed engine provenance. The
built-in completed-result validator rejects changed exact arithmetic, non-half-up
steps, inconsistent residual strips, cross-candidate branch-set disagreement,
branch-order changes, oversized exact integers and candidate IDs, non-maximal
non-anchor counts, and excessive candidate-by-branch work surfaces.

This is result-integrity checking, not enumeration-completeness evidence. The
result retains its declared canonical source branches even when its candidate
array is empty, which lets protocol boundaries detect stale or misrouted
results. A persisted result still must be paired with and rerun against the
separately bound input before completeness can be assessed. An empty completed
candidate list is not a no-solution certificate.

## Benchmark plumbing

`tests/perf/m0f-square-grid.bench.ts` records local candidate measurements for
the fixed 12 by 12 example, the 128 by 128 / 39-branch candidate profile point,
and a 32 by 24 four-direction lattice. It deliberately defines no pass/fail
threshold and does not freeze a runtime or support profile. Representative
browser/device distributions, cancellation, memory, and serialized artifact
sizes still require registered evidence.

## Reproduction

```text
npm run m0f:box-grid-candidates
npm run m0f:box-grid-lattice
npm run m0f:experiment -- --square-grid-quantization
npm run test:unit -- tests/m0f/square-grid-candidates.test.ts
npm run test:unit -- tests/m0f/box-grid-candidate-cli.test.ts
npm run test:unit -- tests/m0f/branch-grid-allocation.test.ts
npm run test:unit -- tests/m0f/square-grid-lattice.test.ts
npm run test:unit -- tests/m0f/box-grid-lattice-cli.test.ts
npm run test:unit -- tests/m0f/square-grid-quantization-experiment.test.ts
npx vitest bench tests/perf/m0f-square-grid.bench.ts --run
```

The fixed CLI case uses 1.5 by 1 rectangular paper, a zero-width terminal
branch, and a positive-width internal branch. The configured `0.01` is test
input, not a selected tolerance profile; the output records its exact binary64
value.
