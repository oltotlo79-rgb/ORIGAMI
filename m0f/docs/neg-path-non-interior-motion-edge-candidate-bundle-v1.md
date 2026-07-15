# NEG-PATH-MUTATION-NON-INTERIOR-MOTION-EDGE candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
declares `e-hinge` as the sole interior crease (`role: "hinge"`, assignment
`"V"`) and `e-top-left` as an existing boundary edge (`role: "boundary"`,
assignment `"B"`). Both bounded-interpolation motion maps initially reference
`e-hinge`.

The sole mutation replaces only these two references with the existing boundary
edge `e-top-left`, in this order:

1. `$.pathCandidate.segments[0].motion.anglesByCrease[0].edgeId`
2. `$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].edgeId`

The complete ordered parser issue signature contains `missing-reference` at
those same two paths. The two map key sets remain equal, so there is no
`motion-map-mismatch`; the rejected rows do not yield
`angle-outside-bound`, `incomplete-time-coverage`,
`path-endpoint-map-mismatch`, or `path-endpoint-discontinuity` secondary
issues. The source guard distinguishes this existing boundary-edge reference
from an unknown edge ID.

## Claim boundary

This is only a declared interior-crease motion-reference parser check. It does
not detect physical hinge drift, infer edge roles or assignment physics,
establish crease-map or path-representation completeness, or establish angle
knot or bound knot-interval cardinality. It does not establish
piecewise-polynomial cardinality or endpoint semantics, a radian convention, a
physical angle schedule, physical or conservative bounds, kinematic
feasibility, physical or endpoint path continuity, rigidity, face isometry, or
hinge geometry. It includes no certificate-hash verification,
cryptographic-authenticity evidence, contact analysis, CCD, collision detection
or freedom, or foldability proof. It does not complete the canonical
path-mutation family, define a SupportProfile or ToleranceProfile, claim
scientific verification, or evaluate M0F GO. Artifact SHA-256 rows detect only
local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-NON-INTERIOR-MOTION-EDGE` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, checks the exact ordered two-reference
delta, and replays the complete ordered two-issue oracle. The strict Draft
2020-12 schema and closed runtime ledger parser fix the case, delta, issue
signature, claims, ordered artifact rows, lowercase SHA-256 values, MIT
licensing, and provenance.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-non-interior-motion-edge-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-non-interior-motion-edge-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-non-interior-motion-edge-candidate-bundle-cli.ts --verify --json
```
