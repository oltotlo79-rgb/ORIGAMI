# Single-hinge rational-schedule global event-boundary cell-static delta ledger candidate v1

Status: complete adjacency and sample-side categorical static-strata deltas for
every boundary of one global necessary-event partition. The record compares the
exact static mesh samples in the immediately adjacent open cells. It does not
evaluate geometry at a boundary or prove that a sample difference occurs at
that boundary.

## Source composition

`analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1`
delegates transition capture, global event partitioning, and exact open-cell
sampling to the global event-cell static sample adapter. The returned frozen
sample record is retained as the single owned source composition. Consequently,
the partition, every boundary, and every adjacent sample share the same bounded
caller snapshot and revision labels.

The labels remain caller-provided labels. This ledger does not compare them to
an external reconstruction and does not add a cryptographic source binding.
Invalid, accessor-bearing, cyclic, exotic, over-budget, or otherwise rejected
inputs fail closed through the upstream sample stage.

## Boundary adjacency

Every ordered global boundary has exactly one row:

- the start boundary joins only to open cell 0 on its right;
- each interior boundary joins to the immediately preceding and following open
  cells; and
- the end boundary joins only to the final open cell on its left.

One-sided rows retain the available sample and its exact static counter
snapshot, but have no counter delta and no pair comparison. Each two-sided row
compares the complete canonical unordered triangle-pair ledger. Pair identity
is joined by canonical pair index, triangle IDs, face IDs, and stable mesh
topology identity. A mismatch fails closed instead of producing a partial
delta.

## Counters and changed pairs

Each available side records all mesh-strata category counters and the raw
intersection-strata counters. A two-sided row additionally records exact
safe-integer `right - left` deltas for every counter.

For every canonical pair, the comparison covers its mesh category and the
categorical static-strata signature: intersection character, relative
locations, representative relative-location sample, supporting-plane relation,
locus kind, containment flags, crossing/contact/area flags, and unresolved
motion-history or layer-order requirements. Only changed pair rows are retained;
each retained row includes both signatures and explicit category, signature,
and nonadjacent-crossing change flags. Compared, changed, and unchanged counts
remain available per boundary and in aggregate.

The two-face fixture has only start and end boundaries, so both rows are
one-sided. The symmetric three-face algebraic fixture has one interior boundary:
all 15 pairs are compared, the three canonical nonadjacent crossing pairs change
to disjoint, and the crossing-evidence counter changes from 3 to 0.

## Bounds and immutability

Boundary rows, aggregate two-sided pair comparisons, and retained changed-pair
rows are defensively bounded by the upstream complete-sample limits. Cardinality,
canonical ordering, sidedness, and complete-join invariants fail closed. Success
and failure records, including all nested source evidence, counter snapshots,
signatures, and issue arrays, are deeply frozen.

## Claim boundary

This is a comparison of one exact sample on each available side. It does not
establish open-cell strata constancy, evaluate root-boundary geometry, prove
that a left/right sample difference is caused at the boundary, classify feature
containment at roots, subdivide persistent events, or establish collision-event
completeness. It also does not supply continuous collision detection, legal
contact policy, layer policy, a final self-intersection decision, or collision
freedom.

Accordingly, SupportProfile, verification, scientific claims, and global M0F
`GO` remain false.
