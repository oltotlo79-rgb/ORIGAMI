# M0F candidate experiment runner v1

Status: active experiment plumbing; **not** scientific evidence or M0F `GO`

The runner executes only definitions registered with both
`contractStatus: candidate` and `scientificClaim: false`. Every result repeats
those fixed literals. There is no `verified` or `no-solution-certified` outcome
in this contract.

## Deterministic semantic record

Each record contains the experiment and engine versions, domain-separated
parameter/input SHA-256 hashes, seed, repetition, stable outcome/reason code,
JSON result, and a domain-separated semantic hash. Timestamps, elapsed time,
host details, exception text, and cancellation details are intentionally absent
from the semantic projection, so identical semantic runs serialize identically.

Malformed IDs, version mismatch, non-finite or non-JSON input, unknown
experiments, exceptions, cancellation, and malformed results all become fixed
fail-closed reason codes. Host-specific exception text is never serialized.
Nested result data also cannot set `scientificClaim: true`, change
`contractStatus` from `candidate`, or encode the product outcomes `verified`
and `no-solution-certified`.

## Engine-specific completed payloads

The generic JSON and claim-boundary checks are necessary but are not sufficient
for a known engine. Completed payloads for built-in experiment/engine
identities are therefore validated against their strict runtime contract twice:

1. immediately after execution and before the deterministic experiment record
   is created; and
2. when a persisted completed record is parsed again, in addition to checking
   its semantic hash.

`numeric-kernel.orientation2d-v1` requires its closed result shape,
safe-integer counters, filter/fallback and sign-count totals, and
oracle/agreement invariants; the enclosing record separately retains its fixed
candidate literals. A generic object that merely avoids forbidden claim strings
is not accepted as that engine's completed payload.

`geometry.fold-face-reconstruction-v1` delegates completed-result validation to
`parseCandidateFoldFaceReconstructionV1`. That parser validates the complete
root record and embedded projection, rehydrates exact rational metadata,
rechecks provenance, counts, assignment/face incidence, faces, and triangles,
and rejects every root/projection cross-field mismatch. It reuses the same
exact kernels as the experiment and is therefore a strict payload integrity
boundary, **not** an independent scientific verifier.

`geometry.fold-face-complex-audit-v1` requires the closed candidate audit
result, all fixed face-complex-only/independence literals, and nine
non-negative topology counters. It rechecks source/created/planar vertex
relations, edge and triangle lower bounds, non-dyadic bounds, and the connected
disk Euler equation. The audit engine itself recomputes the saved bundle with a
separate projective BigInt kernel; persisted payload validation checks the
record shape and counters but does not silently rerun the checker.

`box-pleating.square-grid-quantization-v1` requires the closed square-grid
candidate result and fixes `scope: square-grid-quantization-only`,
`placementIncluded: false`, and `pleatRoutingIncluded: false`. It rechecks
canonical exact rationals, paper/grid/residual equations, exact
nearest-integer-half-up steps and errors, branch identity/order, candidate
identity/order, the largest bounded fitting count on the non-anchor axis, and
defensive work-surface bounds. Its direct completed-payload boundary rejects
accessors and exotic objects before cloning. Before converting decimal strings
to `BigInt`, it limits exact integers to 2,048 digits, step counts to 1,024
digits, and canonical candidate IDs to 4,160 code units. Those budgets are
deliberately above the roughly 633
decimal digits reachable from ratios of finite binary64 extremes in this
bounded engine. A separate clone-before-parse budget rejects any individual
string above 8,192 code units and any array above the 1,024 possible axis
anchors, caps traversal at 700,000 containers and depth 16; these are parser
defenses, not a SupportProfile.

This completed-payload validator is an integrity boundary, not an independent
enumeration-completeness checker. The result does not retain the original
branch list when `candidates` is empty, so result-only validation cannot prove
that candidates were not removed. Provenance hashes make an unchanged runner
record reproducible, but do not turn an empty list into a no-solution proof.

Unknown custom-registry experiment IDs retain the generic candidate boundary
until an explicit completed-payload validator is registered for them. The
strict built-in dispatch never guesses that an unknown payload has the shape of
a known engine.

## Snapshot boundary

Untrusted request values, engine results, and persisted records are captured as
one structured-clone snapshot before validation or hashing. Only plain JSON-data
objects and dense arrays are accepted. The same owned snapshot is validated,
hashed, executed, and recursively frozen. This prevents accessor TOCTOU, Map/Set
prototype smuggling, and caller alias mutation from changing an accepted claim
boundary after validation.

## Registered candidates

`numeric-kernel.orientation2d-v1` compares the filtered orientation result with
the always-exact dyadic sign for the supplied binary64 samples. The fixed CLI
probe is available as:

```text
npm run m0f:experiment
```

Agreement is only differential measurement data. It does not prove the
orientation implementation for every input, select a tolerance, establish a
SupportProfile, or verify foldability.

`box-pleating.square-grid-quantization-v1` runs the fixed M0F-2 prerequisite
probe with rectangular paper and both terminal and internal branch widths:

```text
npm run m0f:experiment -- --square-grid-quantization
```

Its fixed seed (`0x4d304632`) and repetition (`0`) are record-provenance fields,
not stochastic search controls. A zero-candidate bounded enumeration still
completes as candidate data. It is not a no-solution certificate and says
nothing about tree placement, axial/rivers, junctions, M/V assignment, or pleat
routing.

`geometry.fold-face-reconstruction-v1` runs the exact-rational M0F-3 reference
slice on a fixed non-dyadic FOLD CP:

```text
npm run m0f:faces
```

It measures deterministic arrangement, bounded-face enumeration,
triangulation, and FOLD projection. Successful reconstruction is still a
candidate topology result, not evidence of a continuous folding path,
self-intersection freedom, or foldability. See
`face-reconstruction-experiment-v1.md`.

`geometry.fold-face-complex-audit-v1` runs the separately implemented audit on
the corresponding fixed non-dyadic source/result bundle:

```text
npm run m0f:face-audit
```

The deterministic envelope binds the parameters, compact audit input, result,
seed, and semantic hash. Its `auditOutcome: consistent` remains a
face-complex-only candidate observation. It is not a full path/CCD/layer
reference-verifier decision and cannot make the global M0F gate pass. See
`face-complex-audit-v1.md`.
