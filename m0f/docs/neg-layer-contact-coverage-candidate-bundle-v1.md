# NEG-LAYER-CONTACT-COVERAGE exact-negative candidate bundle v1

Status: noncanonical candidate parser-regression evidence.

## Boundary

This bundle has exactly one detector boundary: `parseArtifactContractV1` in
`m0f/artifacts/contract.ts`. A successful replay means the saved project-authored
FOLD control is freshly accepted and the saved mutation is freshly rejected with
the ledger's complete ordered `{path, code}` array.

The control declares one `coplanar-overlap` contact over `[0,1]` and one
same-direction layer relation over all of `[0,1]`. The sole
`NEG-LAYER-CONTACT-COVERAGE` mutation changes only the layer relation start from
`0` to `0.25`. The exact control/source difference is
`["$.layerEvents[0].interval[0]"]`; the current parser's exact ordered issue
signature is
`[{"path":"$.layerEvents","code":"incomplete-layer-contact-coverage"}]`.

For this parser rule, valid `coplanar-overlap` records with the same overlap
region and unordered face pair form one continuous contact component while
their closed intervals overlap or touch, including transitively. Matching
valid layer relations in either direction are clipped to the contact interval;
their closed interval union must cover the component. Touching layer intervals
cover continuously, while a positive prefix, internal, or suffix gap does not.
The saved negative isolates the prefix-gap case; component merging and the other
coverage cases are fixed independently by artifact-contract unit tests.
Generic coverage inference is suppressed if overlap, contact, or layer-event
participant parsing adds a structural or duplicate-ID issue, if a temporal
`layer-cycle` exists, or for a contact that already establishes the specific
`layer-order-reversal` diagnostic.

This is evidence only for the current artifact-contract declared-participant
interval-union parser. It does not complete a canonical contact fixture, infer
physical contact, establish contact completeness or legality, determine a
physical layer order or provide order-reversal evidence, establish path
continuity, perform CCD or collision detection, establish collision freedom or
foldability, verify certificate hashes or cryptographic authenticity, define a
SupportProfile or ToleranceProfile, claim scientific verification, or evaluate
M0F GO.

## Saved-control anchor and provenance

`control-fold.json` is a self-contained project-authored two-face FOLD
artifact-contract control derived from the established local control with its
contact and layer-relation intervals both fixed to `[0,1]`. Verification parses
these saved bytes; it does not silently replace them with a mutable external
fixture. The negative artifact's fixed provenance depends on `control-fold`,
and verification compares the saved source to that saved control before running
the parser oracle.

The bundle remains outside `tests/fixtures/manifest.json`. It neither registers
nor promotes the canonical fixture ID `NEG-LAYER-CONTACT-COVERAGE`.

## Closed byte contract

The Draft 2020-12 schema and runtime parser fix:

- one ordered case row, including its saved-control link, mutation identity,
  exact one-path delta, source path, and complete ordered parser issue oracle;
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
npx tsx m0f/neg-layer-contact-coverage-candidate-bundle-cli.ts --verify
npx tsx m0f/neg-layer-contact-coverage-candidate-bundle-cli.ts --write
npx tsx m0f/neg-layer-contact-coverage-candidate-bundle-cli.ts --verify --json
```
