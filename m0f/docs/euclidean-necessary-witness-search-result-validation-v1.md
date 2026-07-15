# Euclidean necessary-filter witness-search result validation v1

Status: independent deterministic replay of one bounded filter-only result;
**not** polygon/river packing verification, geometric feasibility, a global
no-solution certificate, or M0F `GO`

`validateEuclideanNecessaryWitnessSearchResultV1(input, result)` validates a
completed witness-search result without calling the search producer, the
polygon/river problem builder, or the full grid-candidate enumerator. It first
parses a closed search input, fixes the candidate semantics, and independently
rebinds the embedded polygon/river problem description with
`validatePolygonRiverPackingProblemResultV1`.

The validator then performs its own canonical depth-first traversal in leaf-ID
order and `y`-then-`x` grid order. It recomputes each squared-`BigInt` pair
test, state count, stopping reason, witness order, assignments, and pair
evaluation payload. Consequently, `domain-exhausted`, `budget-exhausted`, and
`witness-found` are derived again rather than accepted from producer flags.
The replay is independently implemented and does not import producer search
helpers.

The nested selected-candidate check verifies exact arithmetic and source
binding without rerunning the full enumeration. It therefore does not prove
that the producer executed, or that an enumerated candidate list was complete.

Inputs and results are bounded, accessor-free, closed snapshots. Dedicated
ceilings cover container depth and count, strings, properties, arrays, and the
number of reported violations. Successful canonical output is alias-free and
deeply frozen. These are defensive validation limits, not selected product
limits or a SupportProfile.

An empty, fully replayed necessary-filter domain proves only that the selected
active grid contains no projected-anchor assignment satisfying the declared
pairwise relation. It does not rule out another grid candidate or construction
semantics, and it says nothing about polygon, river, junction, boundary,
overlap, finished-width, pleat-routing, M/V, continuous-path, or collision
constraints.
