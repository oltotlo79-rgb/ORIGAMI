
# NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUND-TUPLE-CARDINALITY-MISMATCH candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has representation version 1, status `candidate`, and one bounded-interpolation
segment with knot times `[0,0.5,1]`, one `e-hinge` angle row
`[0,pi/2,pi]`, and one matching interval-bound row
`[[0,pi/2],[pi/2,pi]]`.

The sole mutation appends the finite coordinate `pi` only at
`$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0][2]`,
turning the first bound into `[0,pi/2,pi]`. The complete ordered parser issue
signature is
`[{"path":"$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0]","code":"invalid-tuple"}]`;
the diagnostic message is `must contain exactly 2 finite numbers`. No
secondary parser issue is emitted. The outer bounds-row length, interval count,
and crease-reference set remain unchanged, and failed tuple-cardinality
validation prevents finite-coordinate, bound-map, and containment inference.

## Claim boundary

This is only the bounded-interpolation interval-angle-bound tuple-cardinality
parser boundary. It does not establish finite-value handling,
representation-version, representation-status, or
supported-representation-kind handling, bounded-interpolation angle- or
interval-bound-row uniqueness, angle/knot or outer bound/knot-interval
cardinality, motion- or crease-map completeness, bound ordering, angle
containment, strict knot ordering,
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
nor promotes `NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUND-TUPLE-CARDINALITY-MISMATCH` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact third-coordinate
addition, and replays the complete ordered issue oracle. The strict Draft
2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: deleting the third coordinate and
widening the first upper bound to `3*pi/4` restores parser acceptance with a
different delta; retaining the third coordinate while changing angle index 0
from `0` to `pi/4` adds a benign ordered angle-leaf delta, while a control-only
copy remains accepted and the sole `invalid-tuple` oracle is preserved; and
changing the third coordinate from `pi` to `-pi` preserves the exact addition
path and oracle while changing deterministic bytes.

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
npx tsx m0f/neg-path-bounded-interval-angle-bound-tuple-cardinality-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-bounded-interval-angle-bound-tuple-cardinality-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-bounded-interval-angle-bound-tuple-cardinality-candidate-bundle-cli.ts --verify --json
```
