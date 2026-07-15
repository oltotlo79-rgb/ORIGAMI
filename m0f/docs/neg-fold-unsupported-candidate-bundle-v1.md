# NEG-FOLD-UNSUPPORTED exact-negative candidate bundle v1

Status: project-authored candidate regression vectors for the closed
`adaptFoldDocumentToFaceReconstructionInputV1` boundary. “Exact-negative” means
only that the saved JSON bytes are deterministically rejected with exactly the
ordered issue code/path sequence recorded in the ledger. It is not a numerical
or scientific proof that a model cannot fold.

## Catalog isolation and claim boundary

The bundle is stored under
`tests/candidate-vectors/NEG-FOLD-UNSUPPORTED/`, outside the canonical
`tests/fixtures/manifest.json` repository. No `NEG-FOLD-UNSUPPORTED-*` case ID
is registered in the canonical manifest. The verifier checks that absence but
does not run canonical fixture validation or the global M0F gate.

The ledger and verification record fix `contractStatus: "candidate"`,
`scientificClaim: false`, canonical promotion to false, ToleranceProfile
inclusion to false, scientific verification to false, and
`globalM0fGate: "not-evaluated"`. There is no selected or invented tolerance
profile and no product `verified` outcome.

## Accepted control and negative cases

Every case starts from the same four-vertex, four-boundary-edge square FOLD 1.2
control. The builder first requires that the control is still accepted by the
adapter. Each saved negative source then changes only its named target field:

| Case ID                                        | Source file                              | Complete ordered issue signature                           |
| ---------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `NEG-FOLD-UNSUPPORTED-MULTI-FRAME`             | `multi-frame.fold`                       | `unsupported-file-frames` at `$.file_frames`               |
| `NEG-FOLD-UNSUPPORTED-3D`                      | `frame-attribute-3d.fold`                | missing `2D` at `$.frame_attributes`, then `3D` at index 0 |
| `NEG-FOLD-UNSUPPORTED-NONPLANAR-3D-COORDINATE` | `nonplanar-3d-coordinate.fold`           | `invalid-coordinate` at indices 0, 1, 2, and 3             |
| `NEG-FOLD-UNSUPPORTED-NON-MANIFOLD`            | `frame-attribute-non-manifold.fold`      | unsupported attribute at index 1                           |
| `NEG-FOLD-UNSUPPORTED-NON-ORIENTABLE`          | `frame-attribute-non-orientable.fold`    | unsupported attribute at index 1                           |
| `NEG-FOLD-UNSUPPORTED-SELF-INTERSECTING`       | `frame-attribute-self-intersecting.fold` | unsupported attribute at index 1                           |
| `NEG-FOLD-UNSUPPORTED-CUTS`                    | `frame-attribute-cuts.fold`              | unsupported attribute at index 1                           |
| `NEG-FOLD-UNSUPPORTED-JOINS`                   | `frame-attribute-joins.fold`             | unsupported attribute at index 1                           |
| `NEG-FOLD-UNSUPPORTED-ASSIGNMENT-C`            | `assignment-c.fold`                      | `unsupported-assignment` at index 0                        |
| `NEG-FOLD-UNSUPPORTED-ASSIGNMENT-J`            | `assignment-j.fold`                      | `unsupported-assignment` at index 0                        |

The nonplanar-coordinate case deliberately gives all four vertices three
coordinate components and makes one z component nonzero. Its four issues prove
only that the adapter enforces its exact 2D-tuple input boundary. They are not a
general-purpose 3D coplanarity or nonplanarity classification.

Every semantic category has its own source file. In particular, C and J are not
combined with metadata failures that would prevent the existing geometry
normalizer from being reached.

## Closed ledger, hashes, and provenance

`candidate-bundle-ledger.json` is parsed by the dedicated closed runtime parser
and the matching Draft 2020-12 schema
`neg-fold-unsupported-candidate-bundle-ledger-v1.schema.json`. Both fix the ten
case rows and eleven payload artifacts in canonical order. Each case fixes its
ID, source artifact ID, source path, rejected outcome, and complete ordered
code/path list. Each artifact fixes its role, path, media type, MIT license,
project-authored provenance, empty derivation dependency list, and SHA-256 of
the exact committed bytes.

The ledger itself is not self-hashed, avoiding a recursive digest, but it must
be byte-identical to deterministic regeneration. Unknown `verified`, tolerance,
or GO fields; claim escalation; case permutation; issue-path changes; artifact
path or provenance changes; and hash damage are rejected.

## Replay and regeneration

Read-only replay is:

```text
npx tsx m0f/neg-fold-unsupported-candidate-bundle-cli.ts --verify
```

Deterministic regeneration followed by replay is:

```text
npx tsx m0f/neg-fold-unsupported-candidate-bundle-cli.ts --write
```

The verifier requires the exact twelve-file directory: ten FOLD sources, one
README, and one ledger. It checks all eleven payload hashes, parses each saved
source, calls the existing FOLD document face adapter fresh, projects every
returned issue to code/path, and compares the entire ordered array. It then
regenerates and compares every byte, including the ledger. No alternate
unsupported-input classifier is implemented in the bundle.

The CLI and verifier assume the repository root as the current working
directory so they can confirm canonical-manifest absence. This consumer is for
local committed candidate files. It rejects unexpected and linked directory
entries, but does not implement file-handle identity or concurrent-replacement
defenses; it must not be used as an untrusted concurrently mutable artifact
service.

## Non-claims

Adapter rejection establishes only that an input is outside this closed
candidate NOFACES adapter subset. It does not establish invalidity under the
full FOLD specification, geometric impossibility, non-foldability, collision,
or any scientific negative result. Canonical promotion, a ToleranceProfile,
scientific verification, and global M0F `GO` remain explicitly unclaimed.
