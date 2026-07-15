# Polygon/river packing-problem Worker candidate v1

Status: bounded off-main-thread construction of one finite problem description;
**not** placement, packing, a solver result, feasibility evidence, or M0F `GO`

The dedicated module Worker runs
`buildPolygonRiverPackingProblemV1` away from the browser main thread. One
Worker owns one job. There is no forced timeout: an optional `AbortSignal`
terminates the Worker, while every completion, protocol failure, host error,
and cancellation path removes listeners and releases the Worker.

## Closed one-job protocol

Requests and responses are bounded, accessor-free, closed snapshots. Their
schema, message type, operation, candidate status, and `scientificClaim: false`
values are fixed. A malformed request is rejected before a Worker is created.
Worker exceptions and malformed messages map to fixed public reason codes; host
exception text is never returned.

A response carries the normalized source input and the job ID. The client
checks both against the retained request. A completed result must also pass
`validatePolygonRiverPackingProblemResultV1`, which independently reconstructs
the selected-candidate binding, tree paths, integer demands, residual paper,
cardinalities, and all no-claim flags without invoking the producer builder or
the full candidate enumerator. This detects stale, misrouted, truncated, and
mutated responses; it does not prove that the producer enumerated every grid
candidate.

Builder rejection returns `packing-problem-build-failed`. This means only that
the requested finite problem description was not produced. It is never a
packing `no solution` result. Likewise, a completed description contains
unassigned leaf variables and no polygon, river, junction, routing, crease, or
folding geometry.

## Browser checks and remaining work

The test-only Vite harness exercises repeatable success, immediate
cancellation, and pre-abort with real same-origin module Workers in Chromium,
Edge, and Firefox. These checks establish transport and cleanup behavior only;
they do not select latency, memory, or message-size values for a future
SupportProfile.

Progress messages, bounded necessary-filter search, general polygon/river
constraints, placement, axial/axial+N and junction construction, pleat routing,
M/V, a continuous rigid-fold path, and continuous self-collision detection all
remain separate work.
