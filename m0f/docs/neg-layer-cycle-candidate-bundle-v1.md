# NEG-LAYER-CYCLE exact-negative candidate bundle v1

Status: noncanonical candidate parser-regression evidence.

## Boundary

This bundle has exactly one detector boundary: `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. A successful replay means the saved project-authored
FOLD control is freshly accepted and the saved mutation is freshly rejected with
the ledger's complete ordered `{path, code}` array.

The control declares `f-right` above `f-left` at the terminal point interval
`[1,1]`. The sole `NEG-LAYER-CYCLE` mutation appends `f-left` above `f-right`
over that same interval. The exact control/source difference is
`["$.layerEvents[1]"]`; the current parser's exact ordered issue signature is
`[{"path":"$.layerEvents","code":"layer-cycle"}]`.

This is evidence for the current artifact-contract temporal layer-DAG parser
only. It is not an independent physical layer-order verifier. In particular it
does not establish order-reversal detection across disjoint times, contact
legality, contact completeness, path continuity, rigid motion, target
attainment, collision detection or freedom, crease-pattern validity,
foldability, a SupportProfile, a ToleranceProfile, scientific verification, or
M0F GO.

## Saved-control anchor and provenance

`control-fold.json` is a self-contained saved copy of the project-authored
two-face FOLD artifact-contract control. Verification parses these saved bytes;
it does not silently replace them with a mutable external fixture. The negative
artifact's fixed provenance depends on `control-fold`, and verification compares
the saved source to that saved control before running the parser oracle.

The bundle remains outside `tests/fixtures/manifest.json`. It neither registers
nor promotes the canonical fixture ID `NEG-LAYER-CYCLE`.

## Closed byte contract

The Draft 2020-12 schema and runtime parser fix:

- one ordered case row, including its saved-control link, mutation identity,
  exact changed path, source path, and complete ordered parser issue oracle;
- three ordered payload rows: README, accepted control, and negative source;
- artifact role, path, media type, lowercase SHA-256, MIT license, and exact
  provenance dependency; and
- candidate-only status plus explicit false scientific and downstream claims.

Including the ledger, the directory contains exactly four regular files.
Writers refuse unexpected entries. Verification rejects unreadable or linked
entries, extra files, hash drift, rejected controls, delta drift, parser-oracle
drift, canonical registration, and regenerated-byte drift.

Stable JSON payloads use UTF-8 with one LF. Deterministic local replay is not a
signature and does not provide TOCTOU protection.

## Commands

```text
npx tsx m0f/neg-layer-cycle-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-layer-cycle-candidate-bundle-cli.ts --write
npx tsx m0f/neg-layer-cycle-candidate-bundle-cli.ts --verify --json
```
