# NEG-PATH-MUTATION-MIXED-REPRESENTATION candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored FOLD control has two
contiguous, locally valid bounded-interpolation segments that use the same
crease map and agree exactly at their shared endpoint.

The mutation replaces only the second segment's complete motion declaration
with a locally valid degree-one piecewise-polynomial motion for `e-hinge`.
Relative to the saved control, the exact ordered changed paths are the removed
`anglesByCrease`, added `coefficientsByCrease`, added `degree`, added
`derivativeBoundsByCrease`, removed `intervalAngleBoundsByCrease`, changed
`kind`, and removed `knotTimes`, all below
`$.pathCandidate.segments[1].motion`. The complete ordered parser issue
signature is
`[{"path":"$.pathCandidate.segments[1].motion.kind","code":"mixed-path-representation"}]`.
Both local declarations remain structurally valid. Entering the polynomial
branch resets bounded-endpoint inference, so no `path-endpoint-map-mismatch` or
`path-endpoint-discontinuity` secondary issue is produced.

## Claim boundary

This is only a declared one-representation-per-path parser check. It neither
selects a representation nor freezes the bounded-interpolation or
piecewise-polynomial basis. It establishes no polynomial coefficient,
derivative-bound, endpoint, or cross-representation semantics; includes no
interval proof; and establishes neither bounded/cross-representation endpoint
continuity nor physical path continuity, rigidity, face isometry, or hinge
geometry. It includes no certificate-hash verification,
cryptographic-authenticity evidence, contact analysis, CCD, collision detection
or freedom, or foldability proof. It does not complete the canonical
path-mutation family, define a SupportProfile or ToleranceProfile, claim
scientific verification, or evaluate M0F GO. Artifact SHA-256 rows detect only
local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-MIXED-REPRESENTATION` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact seven-path replacement
delta, and replays the complete ordered issue oracle. The strict Draft 2020-12
schema and closed runtime ledger parser fix the case, delta, issue signature,
claims, ordered artifact rows, lowercase SHA-256 values, MIT licensing, and
provenance.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-mixed-representation-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-mixed-representation-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-mixed-representation-candidate-bundle-cli.ts --verify --json
```
