# NEG-PATH-MUTATION-ENDPOINT-DISCONTINUITY candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. The saved project-authored FOLD control contains
two valid adjacent `bounded-interpolation` segments. Their declared hinge angles
are `0 -> pi/2` over `[0,0.5]` and `pi/2 -> pi` over `[0.5,1]`, so the shared
endpoint map agrees exactly.

The sole mutation changes the second segment's first angle from `pi/2` to
`3*pi/4`. Both values lie inside its unchanged `[pi/2,pi]` declared bound. The
exact saved-control difference is
`["$.pathCandidate.segments[1].motion.anglesByCrease[0].angles[0]"]`; the
complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[1].motion.anglesByCrease","code":"path-endpoint-discontinuity"}]`.

The rule compares only structurally valid adjacent bounded-interpolation
segments with matching declared crease sets. A differing valid crease set is a
`path-endpoint-map-mismatch`. A malformed segment does not participate in the
endpoint comparison. Piecewise-polynomial coefficient basis and endpoint
semantics are not frozen, so this bundle and parser do not infer their endpoint
values.

## Claim boundary

This is declared-map parser evidence, not a physical folding result. It does not
establish physical path continuity, rigidity, face isometry, hinge geometry,
crease-map completeness, contact semantics, collision detection or freedom, or
foldability. It includes no certificate-hash verification and makes no
cryptographic-authenticity claim; artifact SHA-256 rows detect only local saved
byte drift. It does not complete the canonical path-mutation family, define a
SupportProfile or ToleranceProfile, claim scientific verification, or evaluate
M0F GO.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-ENDPOINT-DISCONTINUITY` canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses its bytes, compares the saved negative against that saved control, and
then replays the complete ordered issue oracle. The Draft 2020-12 schema and
closed runtime ledger parser fix one case, one exact changed path, three ordered
artifact rows, lowercase SHA-256 values, MIT licensing, and the negative's
provenance dependency on the control.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, rejected controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-endpoint-continuity-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-endpoint-continuity-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-endpoint-continuity-candidate-bundle-cli.ts --verify --json
```
