# NEG-PATH-MUTATION-REPRESENTATION-STATUS-ESCALATION candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has representation version 1, status `candidate`, and one bounded-interpolation
segment with knot times `[0,0.5,1]`, one `e-hinge` angle row
`[0,pi/2,pi]`, and one matching interval-bound row
`[[0,pi/2],[pi/2,pi]]`.

The sole mutation changes only `$.pathCandidate.representationStatus` from
`candidate` to `verified`. The complete ordered parser issue signature is
`[{"path":"$.pathCandidate.representationStatus","code":"claim-boundary"}]`;
the diagnostic message is `must remain candidate`. No secondary parser issue
is emitted.

## Claim boundary

This is only the path-candidate representation-status parser boundary; it does
not verify a representation. It does not establish bounded-interpolation angle-
or interval-bound-row uniqueness, angle/knot or bound/knot-interval cardinality,
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
nor promotes `NEG-PATH-MUTATION-REPRESENTATION-STATUS-ESCALATION` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact status-leaf change, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: deleting `representationStatus`
preserves the same status-leaf delta but changes the ordered oracle to
`missing-field` followed by `claim-boundary` at that path; retaining `verified`
while changing the accepted angle row's first angle from `0` to `pi/4` adds the
ordered child delta
`$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[0]`, while a
control-only copy remains accepted and the sole claim-boundary oracle is
preserved; and changing the status to `self-verified` preserves the same delta
and oracle while changing deterministic bytes.

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
npx tsx m0f/neg-path-representation-status-escalation-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-representation-status-escalation-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-representation-status-escalation-candidate-bundle-cli.ts --verify --json
```
