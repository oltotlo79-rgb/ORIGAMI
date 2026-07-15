# NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted design control
is an owned clone of
`NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1`. Its single
segment declares degree 1, one valid `e-hinge` coefficient row `[[0,pi]]`, and
one matching derivative-bound row `[0,pi]`.

The sole mutation replaces terminal coefficient index 1 with JSON `null` at
`$.pathCandidate.segments[0].motion.coefficientsByCrease[0].coefficients[0][1]`.
The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.coefficientsByCrease[0].coefficients[0][1]","code":"non-finite-number"}]`;
the diagnostic message is `must be a finite binary64 number`.
The coefficient edge-ID set remains equal to the derivative-bound edge-ID set,
the coefficient row retains degree-plus-one cardinality, and there is no
`motion-map-mismatch`, `coefficient-degree-mismatch`, or other secondary issue.

## Claim boundary

This is only the declared finite-coefficient-value check. It does not establish
non-empty coefficient rows, coefficient- or derivative-bound-row reference
uniqueness, coefficient/degree cardinality, motion- or crease-map completeness,
path-time coverage or physical
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
nor promotes `NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT`
canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact coefficient-leaf
replacement, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: deleting the terminal `null`
preserves the coefficient leaf delta but changes the sole issue to a parent-row
`coefficient-degree-mismatch` with `row length must equal degree + 1`; changing
the existing derivative upper bound from `pi` to `2*pi` adds a benign second
delta while preserving the non-finite-value oracle; and replacing `null` with
the string `not-a-number` preserves the same delta and oracle while changing
deterministic bytes.

The closed runtime parser and strict schema are recursively equivalent across
the suite's closed-ledger leaf and container mutations: both reject each
mutation without an acceptance mismatch.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-polynomial-non-finite-coefficient-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-polynomial-non-finite-coefficient-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-polynomial-non-finite-coefficient-candidate-bundle-cli.ts --verify --json
```
