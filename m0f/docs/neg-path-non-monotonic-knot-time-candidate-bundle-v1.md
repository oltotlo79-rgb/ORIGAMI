# NEG-PATH-MUTATION-NON-MONOTONIC-KNOT-TIME candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has one bounded-interpolation segment with knot times `[0,0.5,1]`, one
`e-hinge` angle row `[0,pi/2,pi]`, and two unchanged interval bounds.

The sole mutation replaces the middle knot time `0.5` with the unchanged
segment start `0` at
`$.pathCandidate.segments[0].motion.knotTimes[1]`. The complete ordered parser
issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.knotTimes","code":"non-monotonic-time"}]`.
The segment and knot endpoints, angle/knot and bound/knot-interval
cardinalities, edge-ID maps, and angle containment remain unchanged.
Consequently there is no `parallel-array-mismatch`, `motion-map-mismatch`,
`angle-outside-bound`, `incomplete-time-coverage`,
`path-endpoint-map-mismatch`, or `path-endpoint-discontinuity` secondary issue.

## Claim boundary

This is only a strict-increase check for one declared local knot-time array. It
does not establish angle/knot or bound/knot-interval cardinality, full path-time
or knot-endpoint coverage, physical time parameterization or sampling
semantics, crease-map or path-representation completeness, piecewise-polynomial
semantics, a radian convention, a physical angle schedule, physical or
conservative bounds, kinematic feasibility, physical or endpoint path
continuity, rigidity, face isometry, or hinge geometry. It includes no
certificate-hash verification, cryptographic-authenticity evidence, contact
analysis, CCD, collision detection or freedom, or foldability proof. It does
not complete the canonical path-mutation family, define a SupportProfile or
ToleranceProfile, claim scientific verification, or evaluate M0F GO. Artifact
SHA-256 rows detect only local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-NON-MONOTONIC-KNOT-TIME` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact middle-knot replacement,
and replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-non-monotonic-knot-time-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-non-monotonic-knot-time-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-non-monotonic-knot-time-candidate-bundle-cli.ts --verify --json
```
