# NEG-ORDER-REVERSAL exact-negative candidate bundle v1

Status: noncanonical candidate parser-regression evidence.

## Boundary

This bundle has exactly one detector boundary: `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. A successful replay means the saved project-authored
FOLD control is freshly accepted and the saved mutation is freshly rejected with
the ledger's complete ordered `{path, code}` array.

The control declares one terminal `coplanar-overlap` contact at `[1,1]` and
`f-right` above `f-left` at that same point. The sole `NEG-ORDER-REVERSAL`
mutation extends that saved contact to `[0,1]` and appends `f-left` above
`f-right` at `[0,0]`. The exact control/source difference is
`["$.contacts[0].interval[0]","$.layerEvents[1]"]`; the current parser's exact
ordered issue signature is
`[{"path":"$.layerEvents","code":"layer-order-reversal"}]`.

For this parser rule, valid `coplanar-overlap` records with the same overlap
region and unordered face pair form one continuous contact component while
their closed intervals overlap or touch, including transitively. Thus splitting
`[0,1]` into `[0,0.5]` and `[0.5,1]` does not evade the rule. A positive gap,
such as `[0,0.4]` followed by `[0.6,1]`, leaves separate components. The saved
negative uses one record; the connected-component rule is fixed independently
by artifact-contract unit tests.

This is evidence for the current artifact-contract declared-order parser only.
It does not independently determine physical layer order or infer contact. In
particular it does not establish contact completeness or legality, path
continuity, rigid motion, target attainment, collision detection or freedom,
crease-pattern validity, foldability, a SupportProfile, a ToleranceProfile,
scientific verification, or M0F GO.

## Saved-control anchor and provenance

`control-fold.json` is a self-contained saved copy of the project-authored
two-face FOLD artifact-contract control. Verification parses these saved bytes;
it does not silently replace them with a mutable external fixture. The negative
artifact's fixed provenance depends on `control-fold`, and verification compares
the saved source to that saved control before running the parser oracle.

The bundle remains outside `tests/fixtures/manifest.json`. It neither registers
nor promotes the canonical fixture ID `NEG-ORDER-REVERSAL`.

## Closed byte contract

The Draft 2020-12 schema and runtime parser fix:

- one ordered case row, including its saved-control link, mutation identity,
  exact two-path delta, source path, and complete ordered parser issue oracle;
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
npx tsx m0f/neg-order-reversal-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-order-reversal-candidate-bundle-cli.ts --write
npx tsx m0f/neg-order-reversal-candidate-bundle-cli.ts --verify --json
```
