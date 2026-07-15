# Single-hinge rational-schedule edge-edge algebraic containment candidate v1

Status: exact segment-containment classification for one nondegenerate edge
pair at one selected discrete root of its edge-edge coplanarity event
polynomial. Nonparallel, parallel-noncollinear, and collinear direction
relations are supported. This remains a candidate/no-claim narrow-phase slice,
not a complete event batch, contact policy, self-intersection decision, CCD,
collision-free certificate, SupportProfile, verification result, or global M0F
`GO`.

## Input, event, and root binding

`classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1` accepts one
closed object containing the transition input, an event ID, and a defining-root
index. It reconstructs the complete event-root census, resolves the ID back to
one exact event row, and requires that row to be an
`edge-edge-coplanarity` event. The triangle IDs, pair index, topology relation,
edge indices, and four endpoint vertex IDs all come from that bound row.

The event must have a finite root set and the selected root index must exist.
An identically zero coplanarity polynomial represents persistent coplanarity,
not a selectable discrete root, and still fails closed as
`persistent-coplanarity-event-unsupported`. This rejection happens before a
direction relation can be classified. Parallel or collinear directions at an
existing finite root are no longer rejected. A direction that vanishes exactly
at the root remains outside the nondegenerate-edge predicate scope and fails
closed as `degenerate-edge-at-event-root`.

Missing events, vertex-face events, invalid root indices, non-closed inputs,
defensive-limit violations, and exact-arithmetic failures are also rejected
rather than classified.

Every auxiliary sign query reuses the selected event polynomial as its defining
polynomial and the same defining-root index. Its returned defining-root
location and multiplicity, query ID, and complete primitive coefficient array
must agree with the selected source records before the result is accepted.

## Shared sign-preserving polynomials

Every scheduled vertex has coordinates `N_v(s) / D(s)`, where the exact common
denominator `D(s)` is strictly positive on `[0,1]`. Let the two segments be
`AB` and `CD`, with direction numerators

```text
u(s) = B(s) - A(s)
v(s) = D(s) - C(s).
```

The adapter first constructs the three numerator components of

```text
K(s) = u(s) x v(s).
```

Removing the common positive denominator factor does not change any sign.
Rational coefficients are converted to a primitive integer polynomial by
multiplying with a positive denominator LCM and dividing by the positive
coefficient-content GCD. There is deliberately no leading-sign normalization,
so a negative source polynomial remains negative.

All three components of `K` are evaluated exactly at the selected algebraic
root. Any nonzero component selects the `nonparallel` branch. When all three
are zero, the adapter evaluates the six coordinate components of `u` and `v`.
They establish that both directions are nonzero and retain their axis signs.
It then evaluates the three components of the carrier-offset cross product

```text
H(s) = u(s) x (C(s) - A(s)).
```

Any nonzero component of `H` selects `parallel-noncollinear`; three zero
components select `collinear`.

## Nonparallel classification

The first nonzero component of `K` in fixed `x`, `y`, `z` order selects a cyclic
2D projection:

| Nonzero component | Retained coordinates | Dropped axis |
| --- | --- | --- |
| `Kx` | `(y,z)` | `x` |
| `Ky` | `(z,x)` | `y` |
| `Kz` | `(x,y)` | `z` |

The cyclic coordinate order makes each projected direction determinant equal
to the correspondingly signed component of `K`. The adapter constructs four
more degree-at-most-four primitive integer polynomials:

```text
q1 = orient(A, B, C)
q2 = orient(A, B, D)
q3 = orient(C, D, A)
q4 = orient(C, D, B).
```

A pair of signs straddles inclusively when either sign is zero or the signs
differ. The result is classified as follows:

| `(q1,q2)` straddles | `(q3,q4)` straddles | Any sign is zero | Result |
| --- | --- | --- | --- |
| No | Any | Any | `disjoint` |
| Any | No | Any | `disjoint` |
| Yes | Yes | Yes | `endpoint-contact` |
| Yes | Yes | No | `proper-interior-crossing` |

The selected event establishes exact coplanarity. The selected nonzero
component of `K` makes the projection injective on that affine plane, so the
2D result is also the 3D segment result. This branch retains three direction-
cross signs and four endpoint-orientation signs, for exactly seven auxiliary
rows.

## Parallel-noncollinear classification

In this branch all three direction-cross signs are zero, both exact direction
vectors are nonzero, and at least one carrier-offset cross sign is nonzero.
The two carrier lines are therefore parallel and distinct, so the segments are
exactly `disjoint`. No endpoint-orientation projection or collinear interval
comparison is needed.

The record sets `directionRelation` to `parallel-noncollinear`, retains the two
direction sign triples and the carrier-offset sign triple, and leaves all
collinear-order and interval fields null. Its auxiliary ledger contains the
three direction-cross rows, six edge-direction rows, and three carrier-offset
rows, for exactly twelve rows.

## Collinear interval classification

When the direction-cross and carrier-offset cross triples are all zero, the
nondegenerate segments lie on the same carrier line. The first `x`, `y`, `z`
axis whose first-edge direction sign is nonzero becomes
`collinearProjectionAxis`. Parallelism and nondegeneracy guarantee that the
second-edge direction is also nonzero on that axis.

Each segment's endpoint order is derived from its exact direction sign on the
selected axis. The record binds the resulting lower and upper vertex IDs and
evaluates two additional coordinate-difference polynomials:

```text
r1 = secondLower - firstUpper
r2 = firstLower - secondUpper.
```

Their signs classify the closed intervals:

| Interval signs | Result |
| --- | --- |
| `r1 > 0` or `r2 > 0` | `disjoint` |
| otherwise, `r1 = 0` or `r2 = 0` | `endpoint-contact` |
| `r1 < 0` and `r2 < 0` | `collinear-overlap` |

`collinearOverlapHasPositiveLength` is true only for
`collinear-overlap`. This branch adds the two interval rows to the twelve
parallel/carrier rows, for exactly fourteen auxiliary rows.

## Defensive limits and evidence

The branch-specific evidence budgets are part of the public contract:

| Direction relation | Auxiliary evidence | Exact row count |
| --- | --- | ---: |
| `nonparallel` | 3 direction-cross + 4 endpoint-orientation | 7 |
| `parallel-noncollinear` | 3 direction-cross + 6 direction + 3 carrier-offset | 12 |
| `collinear` | parallel/carrier rows + 2 interval comparisons | 14 |

Every auxiliary polynomial has degree at most four. Canonical coefficient bit
length uses the event-polynomial census limit, and every sign evaluation
inherits the root-isolation, common-refinement, and homogeneous-evaluation
budgets. The complete output and every failure record are deeply frozen.

The dedicated tests exercise nonparallel disjoint, endpoint-contact, and
proper-interior-crossing results; a genuinely algebraic interior root; and the
existing finite event `ee:2:0:0`, which reaches
`parallel-noncollinear` with its complete twelve-row ledger. A canonical
four-face 3/4/5 loopback fixture places one prefolded face on each side of the
active hinge. Its finite start-root event `ee:5:2:2` reaches `collinear`, proves
positive-length overlap, and retains all fourteen branch rows. The tests also
pin the published 7/12/14 row limits, sign/source/root binding, sign-preserving
negative coefficients, persistent-coplanarity rejection, hostile inputs, deep
freeze, and all downstream no-claim fields.

## Remaining boundary

This adapter handles one caller-selected finite event root only. It does not:

- subdivide or classify persistent-zero event manifolds;
- support an edge that degenerates to a point at the selected root;
- construct vertex-face barycentric containment predicates;
- run over every global event boundary or merge feature results into a batch;
- inspect the exact geometry in adjacent open time cells;
- distinguish allowed shared-feature contact from forbidden contact;
- establish event-family collision completeness, first time of impact,
  self-intersection absence, or collision freedom.

Those omissions are explicit fail-closed boundaries. A successful record is
feature-containment evidence for exactly one nondegenerate edge pair at exactly
one selected finite coplanarity root and makes no broader collision or M0F
claim.
