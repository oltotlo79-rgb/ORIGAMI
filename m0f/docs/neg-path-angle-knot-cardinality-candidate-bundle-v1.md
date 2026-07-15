# NEG-PATH-MUTATION-ANGLE-KNOT-CARDINALITY-MISMATCH candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has one bounded-interpolation segment with knot times `[0,0.5,1]`, one
`e-hinge` angle row `[0,pi/2,pi]`, and two unchanged interval bounds.

The sole mutation deletes only the terminal angle at
`$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[2]`. The complete
ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.anglesByCrease[0].angles","code":"parallel-array-mismatch"}]`.
The invalid angle row is excluded from endpoint inference, while its declared
edge ID still pairs with the bound map. Consequently there is no
`motion-map-mismatch`, `angle-outside-bound`, `incomplete-time-coverage`,
`path-endpoint-map-mismatch`, or `path-endpoint-discontinuity` secondary issue.

## Claim boundary

This is only a declared angle-row versus local-knot-array cardinality check. It
does not establish bound/knot-interval cardinality, crease-map or path
representation completeness, piecewise-polynomial cardinality or endpoint
semantics, a radian convention, a physical angle schedule, physical or
conservative bounds, kinematic feasibility, physical or endpoint path
continuity, rigidity, face isometry, or hinge geometry. It includes no
certificate-hash verification, cryptographic-authenticity evidence, contact
analysis, CCD, collision detection or freedom, or foldability proof. It does
not complete the canonical path-mutation family, define a SupportProfile or
ToleranceProfile, claim scientific verification, or evaluate M0F GO. Artifact
SHA-256 rows detect only local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-ANGLE-KNOT-CARDINALITY-MISMATCH` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact terminal deletion, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
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
npx tsx m0f/neg-path-angle-knot-cardinality-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-angle-knot-cardinality-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-angle-knot-cardinality-candidate-bundle-cli.ts --verify --json
```
