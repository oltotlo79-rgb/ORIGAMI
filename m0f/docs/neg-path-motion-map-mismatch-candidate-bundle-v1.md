# NEG-PATH-MUTATION-MOTION-MAP-MISMATCH candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored control is the accepted
three-face/two-hinge bounded-interpolation design used by the endpoint-map
regression bundle. Each segment has two angle rows and two interval-bound rows.

The sole mutation deletes only the `e-hinge-far` entry at
`$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[1]`. The first
segment therefore retains angle rows for `e-hinge` and `e-hinge-far` but a bound
row only for `e-hinge`. The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion","code":"motion-map-mismatch"}]`.
Because that segment is locally invalid, it contributes no adjacent endpoint-map
secondary diagnosis.

The rule establishes only exact equality between the declared angle-row and
bound-row edge-ID sets within one bounded-interpolation motion object. It does
not compare those declarations with every mesh crease and does not evaluate the
physical meaning or conservatism of the bounds.

## Claim boundary

This is declared-row pairing evidence, not a physical hinge-drift detector,
mesh crease-map-completeness check, or physical folding result. It establishes
neither physical or endpoint path continuity nor piecewise-polynomial endpoint
semantics, rigidity, face isometry, or hinge geometry. It includes no
certificate-hash verification, cryptographic-authenticity evidence, contact
analysis, CCD, collision detection or freedom, or foldability proof. It does
not complete the canonical path-mutation family, define a SupportProfile or
ToleranceProfile, claim scientific verification, or evaluate M0F GO. Artifact
SHA-256 rows detect only local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-MOTION-MAP-MISMATCH` canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact deletion delta, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, rejected or shifted controls, delta drift, issue-oracle drift,
canonical registration, and deterministic regenerated-byte drift. Stable JSON
uses UTF-8 with one trailing LF. Deterministic replay is not a signature and
provides no TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-motion-map-mismatch-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-motion-map-mismatch-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-motion-map-mismatch-candidate-bundle-cli.ts --verify --json
```
