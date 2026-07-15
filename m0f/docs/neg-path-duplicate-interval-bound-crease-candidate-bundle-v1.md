# NEG-PATH-MUTATION-DUPLICATE-INTERVAL-BOUND-CREASE candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has one bounded-interpolation segment with knot times `[0,0.5,1]`, one
`e-hinge` angle row `[0,pi/2,pi]`, and one matching interval-bound row
`[[0,pi/2],[pi/2,pi]]`.

The sole mutation appends only a valid clone of the interval-bound row at
`$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[1]`. The
complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease[1].edgeId","code":"duplicate-reference"}]`;
the diagnostic message is `crease motion is repeated`. The angle and
interval-bound edge-ID sets remain equal, so there is no `motion-map-mismatch`
or other secondary parser issue.

## Claim boundary

This is only uniqueness of declared bounded-interpolation interval-bound-row crease
references, as identified by `edgeId`; it is not a general byte-identical-row
detector. It does not establish angle-row uniqueness, angle/knot or
bound/knot-interval cardinality, motion- or crease-map completeness, angle
containment, strict knot ordering, coverage, representation or polynomial
semantics, a radian convention, a physical angle schedule, physical or
conservative bounds, kinematic feasibility, physical or endpoint path
continuity, rigidity, face isometry, or hinge geometry. It includes no
certificate-hash verification, cryptographic-authenticity evidence, contact
analysis, CCD, collision detection or freedom, or foldability proof. It does
not complete the canonical path-mutation family, define a SupportProfile or
ToleranceProfile, claim scientific verification, or evaluate M0F GO. Artifact
SHA-256 rows detect only local saved-byte drift and are not signatures.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-DUPLICATE-INTERVAL-BOUND-CREASE` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact row addition, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: replacing the appended row with
`null` preserves the parent delta but changes the sole issue at index 1 to
`invalid-object` with `crease bounds must be an object`; changing the accepted
angle row's first angle from `0` to `pi/4` adds the ordered child delta
`$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[0]` while a
control-only copy remains accepted and the duplicate-reference oracle is
preserved; and changing only the appended bounds to
`[[-pi/4,pi/2],[pi/2,2*pi]]` preserves the parent delta and oracle while
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
npx tsx m0f/neg-path-duplicate-interval-bound-crease-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-duplicate-interval-bound-crease-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-duplicate-interval-bound-crease-candidate-bundle-cli.ts --verify --json
```
