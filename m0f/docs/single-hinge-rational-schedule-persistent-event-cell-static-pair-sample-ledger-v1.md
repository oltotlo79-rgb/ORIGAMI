# Single-hinge rational-schedule persistent event-cell static-pair sample ledger candidate v1

Status: exact persistent zero-polynomial identity joined to the associated
triangle-pair static strata at every canonical global-event open-cell sample.
This is pair-level sampled evidence. It is not event-specific feature
containment and is not an all-time collision classification.

## Single owned source composition

`analyzeSingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerV1`
calls the global event-cell static sample analyzer once. Its returned frozen
record remains the central source for the global partition, root census, root
refinement, canonical open-cell samples, and complete exact static mesh strata.
The ledger reuses that one owned composition instead of reconstructing or
independently resampling the transition.

The source adapter captures one bounded, acyclic, accessor-free plain-data
snapshot. Upstream rejection is propagated with the source stage preserved.
Revision IDs remain caller labels; this ledger adds neither external geometry
reconstruction equality nor cryptographic revision binding.

## Persistent zero identity join

Each root-census event marked persistent is joined, in canonical order, to the
corresponding persistent-event row in the global partition and persistent
polynomial row in the common root refinement. The row separately records:

- its position in the filtered persistent root-census sequence;
- its position in the partition persistent-event sequence;
- its position in the refinement persistent-polynomial sequence; and
- the refinement `polynomialIndex`, which equals the root-census `eventIndex`.

Event ID, event kind, pair index, triangle IDs, and the polynomial identity must
agree. The defining event polynomial and its isolation record both have the
canonical coefficient sequence `[0]`, null degree, and the
`entire-unit-interval` root-set kind. The isolation record says that every
point is a root and contains no finite isolated-root rows. A mismatch fails
closed.

One row is retained for every persistent defining vertex-face or edge-edge
polynomial. Multiple persistent polynomials associated with the same triangle
pair are intentionally not deduplicated. `persistentPairCount` is only the
number of distinct associated pair indices; event and observation counters
continue to count every defining polynomial row.

## Event-by-cell pair evidence

The complete observation domain is the Cartesian product of persistent event
rows and canonical open-cell samples, ordered event-major and cell-minor. Every
observation joins the event's pair index, triangle IDs, face IDs, and topology
relation to the canonical static pair row in that cell. It retains a compact
categorical signature covering the pair category, static intersection
character and relative locations, representative sample and locus kinds,
containment flags, and unresolved motion-history or layer-order flags.

The compact signature is convenient sampled evidence. The complete projective-
rational strata, topology binding, sample time, and source transition evidence
remain only in the retained central sample record. There is no second copy of
the full exact pair record.

Counters are retained per persistent event, per open cell, and in aggregate for
all eight static pair categories. The per-event variation flag is true only
when the observed **pair category** differs between sampled cells. It does not
detect changes to other signature fields while the category remains the same;
no within-category signature-variation flag is included.

## Bounds and fixture oracles

The contract admits at most 4,096 persistent event rows, 2,016 distinct
persistent pair indices, 4,096 open-cell rows, and, critically, 4,096 rows in
the complete persistent-event-by-cell product. Cardinality and canonical joins
are checked before assembly. Success and failure outputs and all nested owned
evidence are deeply frozen.

The exact fixture oracles are:

| Fixture | Persistent events (VF / EE) | Distinct pairs | Cells | Observations | Category-varying events |
| --- | ---: | ---: | ---: | ---: | ---: |
| Two face quarter turn | 30 (12 / 18) | 4 | 1 | 30 | 0 |
| Symmetric three face algebraic crossing | 66 (24 / 42) | 12 | 2 | 132 | 5 |
| Four face collinear overlap | 108 (36 / 72) | 24 | 5 | 540 | 6 |

For the symmetric fixture, exactly these five persistent edge-edge rows change
associated pair category from
`nonadjacent-static-interior-crossing-evidence` in cell 0 to `disjoint` in cell
1: `ee:3:0:0`, `ee:3:1:1`, `ee:4:1:1`, `ee:8:0:0`, and `ee:8:1:1`. This is a
direct counterexample to treating a persistent defining zero polynomial as
proof that its associated static pair category is constant.

## Claim boundary

An identically zero necessary-event determinant establishes only that its
defining algebraic relation holds throughout the schedule. The associated
triangle-pair strata at one canonical point in each finite-root-free open cell
do not determine whether the specific vertex lies in the specific face, the
specific edges overlap, or any other event-specific feature containment holds
throughout that cell or at its boundaries.

This ledger therefore does not establish static-pair category constancy,
persistent feature-containment constancy, boundary-pose geometry, geometric
approach or separation, collision-event completeness, continuous collision
detection, legal-contact policy, a self-intersection decision, or collision
freedom. Establishing all-time persistent feature containment requires
additional event-specific auxiliary polynomials, their exact roots, and a
further certified subdivision; none is included here.

Accordingly, SupportProfile, verification, scientific claims, and global M0F
`GO` remain false.
