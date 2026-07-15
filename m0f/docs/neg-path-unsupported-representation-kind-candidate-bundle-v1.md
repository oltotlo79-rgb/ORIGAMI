# NEG-PATH-MUTATION-UNSUPPORTED-REPRESENTATION-KIND candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has representation version 1, status `candidate`, and one bounded-interpolation
segment with knot times `[0,0.5,1]`, one `e-hinge` angle row
`[0,pi/2,pi]`, and one matching interval-bound row
`[[0,pi/2],[pi/2,pi]]`.

The sole mutation changes only
`$.pathCandidate.segments[0].motion.kind` from `bounded-interpolation` to the
unsupported string `spline`. The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.kind","code":"invalid-enum"}]`;
the diagnostic message is `unsupported path representation`. No secondary
parser issue is emitted.

## Claim boundary

This is only the supported path-representation-kind parser boundary. It does
not establish representation-status handling, bounded-interpolation angle- or
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
nor promotes `NEG-PATH-MUTATION-UNSUPPORTED-REPRESENTATION-KIND` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact kind-leaf change, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: deleting the entire segment `motion`
field changes the delta to `$.pathCandidate.segments[0].motion` and changes the
ordered oracle to `missing-field` followed by `invalid-object` at that parent;
retaining `spline` while changing the accepted angle row's first angle from `0`
to `pi/4` adds the ordered child delta
`$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[0]`, while a
control-only copy remains accepted and the sole `invalid-enum` oracle is
preserved; and changing `spline` to the distinct unsupported string `spline-v2`
preserves the same kind-leaf delta and oracle while changing deterministic
bytes.

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
npx tsx m0f/neg-path-unsupported-representation-kind-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-unsupported-representation-kind-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-unsupported-representation-kind-candidate-bundle-cli.ts --verify --json
```
