# NEG-PATH-MUTATION-COVERAGE candidate bundle v1

Status: noncanonical exact-negative parser-regression evidence.

## Detector boundary

This bundle replays only `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. The saved project-authored FOLD control contains
two valid adjacent `bounded-interpolation` segments covering `[0,1]`. Four
independent mutations preserve the current time-coverage parser boundaries:

- `NEG-PATH-MUTATION-COVERAGE-START-GAP` moves segment 0 `t0` and its first
  knot from `0` to `0.125`; the sole issue is
  `$.pathCandidate.segments[0].t0 / incomplete-time-coverage`.
- `NEG-PATH-MUTATION-COVERAGE-INTERNAL-GAP` moves segment 1 `t0` and its first
  knot from `0.5` to `0.75`; the sole issue is
  `$.pathCandidate.segments[1].t0 / incomplete-time-coverage`.
- `NEG-PATH-MUTATION-COVERAGE-TERMINAL-GAP` moves segment 1 `t1` and its last
  knot from `1` to `0.875`; the sole issue is
  `$.pathCandidate.segments / incomplete-time-coverage`.
- `NEG-PATH-MUTATION-COVERAGE-KNOT-GAP` moves only segment 1's first knot from
  `0.5` to `0.75`; the sole issue is
  `$.pathCandidate.segments[1].motion.knotTimes / incomplete-time-coverage`.

Each ledger row fixes the full ordered JSON-difference path list as well as the
complete ordered parser issue signature. These checks are declaration-level
coverage checks only; they do not establish endpoint continuity or infer
piecewise-polynomial coverage.

## Claim boundary

This is declared time-coverage parser evidence, not a physical folding result.
It does not establish endpoint continuity, physical path continuity, rigidity,
face isometry, hinge geometry, crease-map completeness, piecewise-polynomial
coverage, contact semantics, CCD, collision detection or freedom, or
foldability. It includes no certificate-hash verification and makes no
cryptographic-authenticity claim; artifact SHA-256 rows detect only local saved
byte drift. It does not complete the canonical path-mutation family, define a
SupportProfile or ToleranceProfile, claim scientific verification, or evaluate
M0F GO.

The bundle stays outside `tests/fixtures/manifest.json`; it neither registers
nor promotes any of its four case IDs canonically.

## Closed saved-byte contract

`control-fold.json` is a self-contained saved control. Verification freshly
parses its bytes, compares all four saved negatives against that saved control,
and then replays every complete ordered issue oracle. The Draft 2020-12 schema
and closed runtime ledger parser fix four cases, their exact changed paths, six
ordered artifact rows, lowercase SHA-256 values, MIT licensing, and every
negative's provenance dependency on the single control.

Including the ledger, the directory contains exactly seven regular files.
Writers refuse unexpected entries. Verification rejects links, extra entries,
hash drift, rejected controls, delta drift, issue-oracle drift, canonical
registration, and deterministic regenerated-byte drift. Stable JSON uses UTF-8
with one trailing LF. Deterministic replay is not a signature and provides no
TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --write
npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --verify --json
```

