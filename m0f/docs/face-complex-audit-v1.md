# M0F candidate face-complex audit v1

Status: implementation experiment; **not** a complete reference verifier,
scientific evidence, or M0F `GO`

## Boundary

This audit is a second implementation for the M0F-3 face-complex slice. It
accepts a closed bundle containing the raw internal NOFACES input and only the
exact-coordinate face-complex fields copied from a candidate reconstruction.
It does not accept a producer success flag, the display-only FOLD projection,
or any `verified` claim.

`prepareFaceComplexAuditInputV1` is a producer-side convenience adapter that
extracts this compact bundle from one normalized source and one complete
candidate result. It is deliberately located under `geometry/` and is not part
of the independent checker. `auditFaceComplexCandidateV1` re-parses and
recomputes the bundle; callers may also construct the closed bundle directly
from saved JSON without running the producer.

The audit implementation may share the plain-data snapshot/freezing utility,
but it must not import the producer `geometry/` arrangement, face enumeration,
triangulation, result parser, experiment runner, or `model/exact-rational`
implementation. A source-boundary test enforces this rule.

## Separate computation

The audit uses canonical homogeneous BigInt points `[X:Y:W]`, with positive
`W`, rather than the producer's pair of reduced rational coordinates. It
independently:

1. converts every finite binary64 source coordinate without decimal rounding;
2. constructs the expected endpoint and pairwise-intersection point set;
3. proves that candidate sub-edges partition each source edge without gaps,
   extras, assignment changes, or provenance changes;
4. rejects unsplit crossings, T-junctions, overlaps, duplicate geometry, and
   disconnected or non-cellular graphs;
5. builds its own angular rotation system and traverses every directed dart to
   recover the exterior and bounded face cycles; and
6. checks candidate face rings, assignment incidence, Euler counts, triangle
   edge incidence, non-crossing diagonals, winding, and exact area coverage.

Comparisons use exact coordinates and endpoint bijections, not producer vertex,
edge, face, or triangle ID generation rules. Pure renaming therefore does not
change the geometric audit result. Display coordinates are representation data
only and are not used as topology evidence; the producer's separate complete
result parser remains responsible for their exact-metadata correspondence.

## Claim boundary

A consistent result fixes `contractStatus: "candidate"`,
`scientificClaim: false`, and a face-complex-only scope. It says that two
separate implementations agree on this saved arrangement; it does not establish
a rigid folding path, target attainment, collision freedom, legal contact,
layer ordering, a certified no-solution result, or full FOLD compatibility.

The candidate plumbing now has a hash-bound persisted evidence bundle, a
normalized auditor source-set hash, a complete typed semantic mutation suite,
and a stage-scoped subgate which reruns the checker instead of trusting stored
success fields. These artifacts remain `candidate` and make no scientific
claim. Before this slice can contribute scientific evidence, M0F still needs
registered project-authored and holdout fixtures, independent review of the
declared source set and evidence policy, representative performance evidence,
and integration into the still fail-closed global M0F gate.

## Reproduction

```text
npm run m0f:face-audit
npm run m0f:face-evidence
npm run m0f:face-mutations
npm run m0f:face-subgate -- --json
npm run test:unit -- tests/m0f/projective-rational.test.ts
npm run test:unit -- tests/m0f/face-complex-contract.test.ts
npm run test:unit -- tests/m0f/prepare-face-complex-audit-input.test.ts
npm run test:unit -- tests/m0f/face-complex-v1.test.ts
npm run test:unit -- tests/m0f/face-complex-evidence.test.ts
npm run test:unit -- tests/m0f/face-complex-mutation-suite.test.ts
npm run test:perf -- tests/perf/m0f-face-complex-audit.bench.ts
```

The CLI wraps the fixed non-dyadic audit bundle in the candidate experiment
runner, producing deterministic parameter, input, result, and semantic hashes.
The completed payload is revalidated both when produced and when a persisted
experiment record is parsed. `m0f:face-evidence` additionally emits the closed
input, successful result, implementation identity, normalized source-set hash,
and a domain-separated canonical payload hash. Parsing detects damage, while
`reauditFaceComplexAuditEvidenceV1` rejects a foreign source set and recomputes
the decision before comparing the saved result. This is reproducibility and
tamper-detection plumbing, not fixture provenance, a signed decision, or a
scientific conclusion.

The tests include a constructed non-dyadic `1/3` intersection, full ID
renaming, collection permutations, segmented and unsplit grids, and a closed
eleven-case mutation suite covering exact coordinates, provenance, assignment,
faces, triangle incidence and area, counters, duplicate semantics, disconnected
components, bridges, and the explicitly accepted display-only mutation. The
saved suite result has its own strict parser and the subgate reruns every case.
This is still not a registered holdout fixture result.

The benchmark has no pass threshold. It records small `3x2`, medium `8x6`, and
non-dyadic candidate timings only; those observations do not select a runtime
profile or establish a supported input size.
