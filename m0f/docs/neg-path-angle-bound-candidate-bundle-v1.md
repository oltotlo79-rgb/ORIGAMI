# NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. The saved project-authored FOLD control contains
one valid `bounded-interpolation` segment over `[0,1]`, with knot times
`[0,0.5,1]`, declared hinge angles `[0,pi/2,pi]`, and consecutive interval
bounds `[0,pi/2]` and `[pi/2,pi]`.

The sole mutation changes the middle angle from `pi/2` to `3*pi/4`. The changed
value is outside the unchanged first interval bound and remains inside the
unchanged second interval bound. The exact saved-control difference is
`["$.pathCandidate.segments[0].motion.anglesByCrease[0].angles[1]"]`; the
complete ordered parser issue signature is
`[{"path":"$.pathCandidate.segments[0].motion.intervalAngleBoundsByCrease","code":"angle-outside-bound"}]`.

The replay fixes only the parser's literal containment of each adjacent declared
angle pair within its corresponding declared interval bound. It does not turn
the declarations into physical bounds or infer any missing crease-map entry.
Piecewise-polynomial coefficient basis and endpoint semantics are not frozen,
so this bundle does not infer their endpoint values.

## Claim boundary

This is declared-angle parser evidence, not a physical folding result. It does
not establish physically valid angle bounds, a radian convention, conservative
bounds, kinematic feasibility, endpoint or physical path continuity, rigidity,
face isometry, hinge geometry, crease-map completeness, contact semantics, CCD,
collision detection or freedom, or foldability. It includes no certificate-hash
verification and makes no cryptographic-authenticity claim; artifact SHA-256
rows detect only local saved byte drift. It does not complete the canonical
path-mutation family, define a SupportProfile or ToleranceProfile, claim
scientific verification, or evaluate M0F GO.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes `NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND` canonically.

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
npx tsx m0f/neg-path-angle-bound-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-angle-bound-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-angle-bound-candidate-bundle-cli.ts --verify --json
```
