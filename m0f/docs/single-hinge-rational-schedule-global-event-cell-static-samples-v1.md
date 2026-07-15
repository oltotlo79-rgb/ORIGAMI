# Single-hinge rational-schedule global event-cell static samples candidate v1

Status: one complete exact static 3D mesh sample in every certified open cell
of one global necessary-event partition. A positive nonadjacent
relative-interior crossing is actual self-intersection evidence at that sample.
A negative sample covers only that time and is not an interval certificate,
continuous collision detection, collision freedom, verification, or global
M0F `GO`.

## One owned transition snapshot

`analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1` first copies
the caller transition into one bounded owned plain-data snapshot. The snapshot
supports finite numbers and `BigInt`, preserves noncyclic aliases, and accepts
only ordinary objects, arrays, enumerable data properties, and bounded strings
and containers. Accessors, symbols, exotic prototypes, cycles, sparse arrays,
hostile or revoked proxies, and exhausted snapshot budgets fail closed.

The exact same frozen snapshot is then supplied to both the global event-time
partition and every static sampler invocation. This prevents a caller from
changing geometry between composition stages while retaining the same revision
labels. The labels are still caller-provided labels: this adapter does not
compare against an external reconstruction or add a cryptographic source hash.

## Complete open-cell join

The upstream partition supplies ordered boundaries and one canonical dyadic
actual time strictly inside each certified normalized gap. For every open cell,
the adapter reruns the complete exact static schedule sampler at that time and
requires all of the following to agree:

- transition, step, mesh, and triangulation revision labels;
- cell index, cell ID, sample ID, and dyadic actual time;
- the exact normalized sample time and strict certified-gap containment; and
- the complete unordered triangle-pair count.

Every open cell must have exactly one joined sample. The retained sample is the
full mesh-bound static intersection-strata record, not a selected pair or a
broad-phase approximation. Aggregate pair rows are prebounded by the exact
`openCellCount * unorderedTrianglePairCount` product before any per-cell work.

## Static evidence

Each cell row exposes the complete exact triangle-pair strata and the count of
nonadjacent relative-interior 3D crossing pairs at its sample. The outer ledger
records the indices of cells whose samples contain such evidence and the total
positive pair count.

The symmetric three-face algebraic fixture has one genuine irrational interior
event boundary and two open cells. Its canonical sample in cell 0 contains
three nonadjacent interior-crossing pairs; cell 1 contains none. Tests also
cover the two-face single-cell case, triangle-order determinism, a non-unit
actual-time slab, upstream rejection, deep freeze, no-claim fields, and a
stateful-proxy attempt to swap equal-label geometry between stages.

## Claim boundary

The partition proves only that its finite necessary event polynomials have no
root inside an emitted cell. This composition does not establish that all
static intersection strata are constant throughout a cell, that the event
family is collision-complete, or that a negative sample represents the whole
cell. It does not evaluate geometry at algebraic boundaries, batch the
available one-root feature-containment classifiers, subdivide persistent-zero
events, compare left/right motion history, or apply legal-contact and layer
policy.

Accordingly, complete nonlinear CCD, a final self-intersection decision,
collision freedom, SupportProfile, verification, scientific claims, and global
M0F `GO` remain false.
