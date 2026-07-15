# NEG-PATH-MUTATION-DUPLICATE-ANGLE-CREASE candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. Its saved project-authored accepted FOLD control
has one bounded-interpolation segment with knot times `[0,0.5,1]`, one
`e-hinge` angle row `[0,pi/2,pi]`, and two unchanged interval bounds.

The sole mutation appends only a valid clone of the angle row at
`$.pathCandidate.segments[0].motion.anglesByCrease[1]`. The complete
ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.anglesByCrease[1].edgeId","code":"duplicate-reference"}]`.
Both rows retain valid angle/knot cardinality and the angle edge-ID set remains
equal to the interval-bound edge-ID set. Consequently there is no
`motion-map-mismatch`, cardinality, containment, coverage, endpoint, or other
path secondary issue.

## Claim boundary

This is only uniqueness of declared bounded-interpolation angle-row crease
references, as identified by `edgeId`; it is not a general byte-identical-row
detector. It does not establish interval-bound-row uniqueness, angle/knot or
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
nor promotes `NEG-PATH-MUTATION-DUPLICATE-ANGLE-CREASE` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses the control and source bytes, compares the exact row addition, and
replays the complete ordered issue oracle. The strict Draft 2020-12 schema and
closed runtime ledger parser fix the case, delta, issue signature, claims,
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and provenance.

Tamper checks fix three nearby boundaries: replacing the appended row with
`null` preserves the parent delta but changes the sole issue to `invalid-object`;
changing the existing second interval upper bound from `pi` to `2*pi` adds a
benign second delta while preserving the duplicate-reference oracle; and
changing the appended row to `[pi/4,pi/2,pi]` preserves both the parent delta
and oracle while changing deterministic bytes.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, shifted controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-duplicate-angle-crease-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-duplicate-angle-crease-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-duplicate-angle-crease-candidate-bundle-cli.ts --verify --json
```
