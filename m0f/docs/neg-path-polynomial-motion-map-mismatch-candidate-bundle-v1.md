# NEG-PATH-MUTATION-POLYNOMIAL-MOTION-MAP-MISMATCH candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted design control
is built from an owned clone of
`NEG_PATH_ENDPOINT_MAP_MISMATCH_DESIGN_CONTROL_SOURCE_V1`, preserving that
three-face/two-hinge mesh, target, and input while replacing its path with one
segment over `[0,1]`. The segment declares a degree-one piecewise polynomial
with matching `e-hinge` and `e-hinge-far` coefficient rows `[[0,pi]]` and
matching derivative bounds `[0,pi]`. Construction freshly proves parser
acceptance before the control is frozen.

The sole mutation deletes only the `e-hinge-far` derivative-bound row at
`$.pathCandidate.segments[0].motion.derivativeBoundsByCrease[1]`, leaving the
array nonempty. The two coefficient edge IDs then differ from the sole
derivative-bound edge ID. The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion","code":"motion-map-mismatch"}]`,
with no secondary path issue.

## Claim boundary

This is only equality of the edge-ID sets in the declared polynomial
coefficient and derivative-bound row arrays. It does not detect physical hinge
drift or establish motion-map, mesh crease-map, or path-representation
completeness. It does not establish coefficient degree/cardinality, derivative
semantics, conservative derivative bounds, derivative units, or an interval
proof. It does not select a representation, freeze a polynomial basis,
establish coefficient ordering, coefficient semantics, or coefficient-row
interval association, or infer polynomial endpoints. It does not establish a
radian convention, physical angle schedules or bounds, kinematic feasibility,
physical or endpoint path continuity, rigidity, face isometry, or hinge
geometry. It includes no certificate-hash verification,
cryptographic-authenticity evidence, contact analysis, CCD, collision detection
or freedom, or foldability proof. It does not complete the canonical
path-mutation family, define a SupportProfile or ToleranceProfile, claim
scientific verification, or evaluate M0F GO. Artifact SHA-256 rows detect only
local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-POLYNOMIAL-MOTION-MAP-MISMATCH`
canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact derivative-row deletion,
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
npx tsx m0f/neg-path-polynomial-motion-map-mismatch-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-polynomial-motion-map-mismatch-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-polynomial-motion-map-mismatch-candidate-bundle-cli.ts --verify --json
```
