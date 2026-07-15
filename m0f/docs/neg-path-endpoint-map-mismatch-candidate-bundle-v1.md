# NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. The saved project-authored design control expands
the primary topology control to three faces and two interior hinges,
`e-hinge` and `e-hinge-far`. Both valid adjacent `bounded-interpolation`
segments declare the same two-edge angle and interval-bound maps, with exact
shared endpoint agreement.

The sole mutation removes only the `e-hinge-far` row from both
`anglesByCrease` and `intervalAngleBoundsByCrease` in the second segment. Each
segment remains locally valid, but the adjacent declared crease maps differ.
The exact saved-control difference is
`["$.pathCandidate.segments[1].motion.anglesByCrease[1]","$.pathCandidate.segments[1].motion.intervalAngleBoundsByCrease[1]"]`;
the complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[1].motion.anglesByCrease","code":"path-endpoint-map-mismatch"}]`.

The rule compares only structurally valid adjacent bounded-interpolation
segments. Differing valid crease sets produce `path-endpoint-map-mismatch`; a
malformed segment does not participate in the adjacent comparison.
Piecewise-polynomial coefficient basis and endpoint semantics are not frozen,
so this bundle and parser do not infer their endpoint values.

## Claim boundary

This is declared-map parser evidence, not a physical hinge-drift detector, mesh
completeness check, or physical folding result. Rejecting this one mismatch does
not establish crease-map completeness, endpoint or physical path continuity,
rigidity, face isometry, hinge geometry, or piecewise-polynomial endpoint
semantics. It includes no contact analysis, CCD, collision detection or freedom,
foldability proof, or certificate-hash verification and makes no
cryptographic-authenticity claim; artifact SHA-256 rows detect only local saved
byte drift. It does not complete the canonical path-mutation family, define a
SupportProfile or ToleranceProfile, claim scientific verification, or evaluate
M0F GO.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH` canonically.

## Closed saved-byte contract

`control-design.json` is a self-contained saved control. Verification freshly
parses its bytes, compares the saved negative against that saved control, and
then replays the complete ordered issue oracle. The Draft 2020-12 schema and
closed runtime ledger parser fix one case, two exact changed paths, three ordered
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
npx tsx m0f/neg-path-endpoint-map-mismatch-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-endpoint-map-mismatch-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-endpoint-map-mismatch-candidate-bundle-cli.ts --verify --json
```

