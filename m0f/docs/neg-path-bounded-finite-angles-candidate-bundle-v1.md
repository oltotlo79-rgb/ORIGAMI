
# NEG-PATH-MUTATION-BOUNDED-FINITE-ANGLES candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has representation version 1, status `candidate`, and one bounded-interpolation
segment with knot times `[0,0.5,1]`, one `e-hinge` angle row
`[0,pi/2,pi]`, and one matching interval-bound row
`[[0,pi/2],[pi/2,pi]]`.

The sole mutation replaces only
`$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[0]` with JSON
`null`. The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[0]","code":"non-finite-number"}]`;
the diagnostic message is `must be a finite binary64 number`. No secondary
parser issue is emitted. The angle-array length and crease-reference set remain
unchanged, and failed finite validation prevents containment inference.

## Claim boundary

This is only the bounded-interpolation finite-angle parser boundary. It does
not establish finite-knot handling, representation-version, representation-status, or
supported-representation-kind handling, bounded-interpolation angle- or
interval-bound-row uniqueness, angle/knot or bound/knot-interval cardinality,
motion- or crease-map completeness, angle containment, strict knot ordering,
coverage, representation selection or completeness, polynomial semantics, a
radian convention, a physical angle schedule, physical or conservative bounds,
kinematic feasibility, physical or endpoint path continuity, rigidity, face
isometry, or hinge geometry. It includes no
certificate-hash verification, cryptographic-authenticity evidence, contact
analysis, CCD, collision detection or freedom, or foldability proof. It does
not complete the canonical path-mutation family, define a SupportProfile or
ToleranceProfile, claim scientific verification, or evaluate M0F GO. Artifact
SHA-256 rows detect only local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-BOUNDED-FINITE-ANGLES` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact angle-leaf change, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: replacing JSON `null` with `pi/4`
preserves the same angle-leaf delta but restores parser acceptance; retaining
JSON `null` while changing terminal angle index 2 from `pi` to `3*pi/4` adds a
second ordered angle-leaf delta, while a control-only copy remains accepted and
the sole `non-finite-number` oracle is preserved; and replacing JSON `null`
with the string `not-a-number` preserves the same angle-leaf delta and oracle
while changing deterministic bytes.

The closed runtime parser and strict schema are kept recursively equivalent:
all closed-ledger leaf and container mutations used by the test suite must be
rejected by both, without an acceptance mismatch.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-bounded-finite-angles-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-bounded-finite-angles-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-bounded-finite-angles-candidate-bundle-cli.ts --verify --json
```
