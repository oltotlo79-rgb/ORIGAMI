# NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted design control
is an owned derivation of
`NEG_PATH_POLYNOMIAL_COEFFICIENT_DEGREE_DESIGN_CONTROL_SOURCE_V1`. Non-path
fields are retained, while the path is replaced with two time-contiguous
segments covering `[0,0.5]` and `[0.5,1]`. Each segment declares the same valid
degree-one piecewise polynomial for `e-hinge`, with coefficient row `[0,pi]`
and derivative bounds `[0,pi]`.

The sole mutation replaces the first segment's degree `1` with `0` at
`$.pathCandidate.segments[0].motion.degree`. The complete ordered parser issue
signature is
`[{"path":"$.pathCandidate.segments[0].motion.degree","code":"out-of-range"}]`.
An invalid degree suppresses coefficient-row cardinality inference, while all
other declarations remain unchanged. Consequently there is no
`coefficient-degree-mismatch`, `motion-map-mismatch`, coverage, or other path
secondary issue.

## Claim boundary

This is only rejection of the saved zero-degree lower-bound example. The parser
uses a combined positive-safe-integer predicate, but this one vector does not
exercise fractional-degree rejection, unsafe-integer or upper-domain coverage,
the general degree domain, or coefficient-row/degree cardinality. It does not
establish path-time coverage or physical continuity, select a representation,
freeze a polynomial basis, establish coefficient ordering or semantics,
associate coefficient rows with time intervals, establish derivative semantics
or validation, prove conservative derivative bounds, or infer polynomial
endpoints. It does not establish a radian convention, physical angle schedules
or bounds, kinematic feasibility, crease-map, motion-map, or path-representation
completeness, rigidity, face isometry, or hinge geometry. It includes no
certificate-hash verification, cryptographic-authenticity evidence, contact
analysis, CCD, collision detection or freedom, or foldability proof. It does
not complete the canonical path-mutation family, define a SupportProfile or
ToleranceProfile, claim scientific verification, or evaluate M0F GO. Artifact
SHA-256 rows detect only local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE`
canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact degree replacement, and
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
npx tsx m0f/neg-path-polynomial-degree-range-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-polynomial-degree-range-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-polynomial-degree-range-candidate-bundle-cli.ts --verify --json
```
