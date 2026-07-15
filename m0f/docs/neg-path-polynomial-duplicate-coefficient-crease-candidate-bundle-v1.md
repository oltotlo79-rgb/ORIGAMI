# NEG-PATH-MUTATION-POLYNOMIAL-DUPLICATE-COEFFICIENT-CREASE candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted design control
is an owned clone of
`NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1`. Its single
segment declares degree 1, one valid `e-hinge` coefficient row `[[0,pi]]`, and
one matching derivative-bound row `[0,pi]`.

The sole mutation appends a valid clone of the coefficient row at
`$.pathCandidate.segments[0].motion.coefficientsByCrease[1]`. The complete
ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.coefficientsByCrease[1].edgeId","code":"duplicate-reference"}]`.
The coefficient edge-ID set remains equal to the derivative-bound edge-ID set,
and both coefficient rows retain valid degree cardinality. Consequently there
is no `motion-map-mismatch`, `coefficient-degree-mismatch`, or other path
secondary issue.

## Claim boundary

This is only uniqueness of declared coefficient-row crease references, as
identified by `edgeId`; it is not a general byte-identical-row detector. It does
not establish derivative-bound-row reference uniqueness, coefficient/degree
cardinality, motion- or crease-map completeness, path-time coverage or physical
continuity, select a representation, freeze a polynomial basis, establish
coefficient ordering or semantics, associate coefficient rows with time
intervals, establish derivative semantics or validation, prove conservative
derivative bounds, or infer polynomial endpoints. It does not establish a
radian convention, physical angle schedules or bounds, kinematic feasibility,
path-representation completeness, rigidity, face isometry, or hinge geometry.
It includes no certificate-hash verification, cryptographic-authenticity
evidence, contact analysis, CCD, collision detection or freedom, or foldability
proof. It does not complete the canonical path-mutation family, define a
SupportProfile or ToleranceProfile, claim scientific verification, or evaluate
M0F GO. Artifact SHA-256 rows detect only local saved-byte drift and are not
signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-POLYNOMIAL-DUPLICATE-COEFFICIENT-CREASE`
canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact row addition, and
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
npx tsx m0f/neg-path-polynomial-duplicate-coefficient-crease-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-polynomial-duplicate-coefficient-crease-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-polynomial-duplicate-coefficient-crease-candidate-bundle-cli.ts --verify --json
```
