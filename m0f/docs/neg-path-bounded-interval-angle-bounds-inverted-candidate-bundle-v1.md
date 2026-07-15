
# NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUNDS-INVERTED candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has representation version 1, status `candidate`, and one bounded-interpolation
segment with knot times `[0,0.5,1]`, one `e-hinge` angle row
`[0,pi/2,pi]`, and one matching interval-bound row
`[[0,pi/2],[pi/2,pi]]`.

The sole mutation raises only
`$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0][0]`
from `0` to `3*pi/4`, turning the first bound into `[3*pi/4,pi/2]`.
The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[0].bounds[0]","code":"invalid-bounds"},{"path":"$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease","code":"angle-outside-bound"}]`.
The messages are respectively `lower bound must not exceed upper bound` and
`interval bound for e-hinge must contain both adjacent knot angles`. The parser
retains the finite inverted pair in its bound map and therefore performs
containment after reporting the ordering failure. Tuple size, outer bounds-row
length, interval count, and crease-reference set remain unchanged; no
cardinality, finite-value, or motion-map issue is emitted.

## Claim boundary

This is only the bounded-interpolation interval-angle-bound ordering and
continued literal containment parser boundary. It does not establish
finite-value handling,
representation-version, representation-status, or
supported-representation-kind handling, bounded-interpolation angle- or
interval-bound-row uniqueness, tuple, angle/knot, or outer bound/knot-interval
cardinality, motion- or crease-map completeness, strict knot ordering,
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
nor promotes `NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUNDS-INVERTED` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact lower-bound replacement,
and replays the complete ordered two-issue oracle. The strict Draft 2020-12
schema and closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: replacing the inverted lower bound
with `-pi/4` preserves the exact leaf delta but restores parser acceptance;
retaining the inversion while changing angle index 0 from `0` to `pi/4` adds a
benign ordered angle-leaf delta, while a control-only copy remains accepted and
the complete two-issue oracle is preserved; and changing the inverted lower
bound from `3*pi/4` to `pi` preserves the exact leaf delta and oracle while
changing deterministic bytes.

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
npx tsx m0f/neg-path-bounded-interval-angle-bounds-inverted-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-bounded-interval-angle-bounds-inverted-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-bounded-interval-angle-bounds-inverted-candidate-bundle-cli.ts --verify --json
```
