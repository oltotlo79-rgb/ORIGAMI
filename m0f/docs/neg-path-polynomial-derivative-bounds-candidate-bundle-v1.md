# NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted design control
is the owned clone of `NEG_TOPOLOGY_PRIMARY_CONTROL_SOURCE_V1` and is
value-equal to `tests/vectors/m0f-0/artifact-contract-design-v1.json`. The
upstream file's raw bytes are separately SHA-256 anchored; the saved control's
stable JSON serialization is intentionally not byte-identical to that pretty
printed upstream file. The sole path segment declares a degree-one piecewise
polynomial for `e-hinge`, with coefficient row `[0,pi]` and derivative bounds
`[0,pi]`.

The sole mutation changes only the lower derivative bound from zero to `2*pi`
at
`$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[0].bounds[0]`.
The unchanged upper bound remains `pi`, so the lower value exceeds the upper
value. The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[0].bounds","code":"invalid-bounds"}]`.
The coefficient and derivative-bound edge sets remain equal, so there is no
`motion-map-mismatch` or other path secondary issue.

## Claim boundary

This is only a declared derivative-bound lower/upper ordering check. It does
not establish derivative semantics, conservative derivative bounds, derivative
units, or an interval proof. It does not select a representation, freeze a
polynomial basis, establish coefficient ordering, coefficient semantics, or
coefficient-row interval association, or infer polynomial endpoints. It does
not establish a radian convention, physical angle schedules or bounds,
kinematic feasibility, crease-map or path-representation completeness,
physical or endpoint path continuity, rigidity, face isometry, or hinge
geometry. It includes no certificate-hash verification,
cryptographic-authenticity evidence, contact analysis, CCD, collision detection
or freedom, or foldability proof. It does not complete the canonical
path-mutation family, define a SupportProfile or ToleranceProfile, claim
scientific verification, or evaluate M0F GO. Artifact SHA-256 rows detect only
local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED`
canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact lower-bound replacement,
and replays the complete ordered issue oracle. The strict Draft 2020-12 schema
and closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-polynomial-derivative-bounds-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-polynomial-derivative-bounds-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-polynomial-derivative-bounds-candidate-bundle-cli.ts --verify --json
```
