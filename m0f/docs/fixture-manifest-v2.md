# M0F fixture manifest v2

Status: active harness/catalog contract; not scientific evidence

Manifest v2 makes every distributed fixture byte accountable. Version 1 is
hard-rejected; there is no ambiguous dual-schema mode.

## Source metadata and distributed files

Each fixture separates two inventories:

- `sourceReferences` records where an idea, publication, external data set, or
  generated source came from;
- `distributedArtifacts` records every regular file actually checked into the
  fixture directory.

Every distributed artifact has a stable artifact ID, fixed role, relative
path, raw SHA-256, one of the six approved SPDX licenses, source reference, and
source-use classification. Input, README, known artifacts, and benchmark files
refer to that ledger by artifact ID. A ledger item must have exactly one
semantic pointer and every pointer must resolve to the expected role.

The only accepted distributed-file licenses are:

```text
MIT, 0BSD, BSD-2-Clause, BSD-3-Clause, Apache-2.0, ISC
```

SPDX expressions, exceptions, `LicenseRef`, unknown values, and every other
identifier fail closed for fixture files.

## Rights boundary

Source rights form a discriminated union:

- `redistribution: allowed` requires one approved `licenseSpdx`;
- `redistribution: metadata-only` records `restricted` or `unknown` status and
  requires a source URL, source SHA-256, and acquisition instructions.

A metadata-only source can be cited only by an independently authored
equivalent fixture. Its original bytes cannot be registered as a redistributed
artifact. Project-authored, generated, and directly redistributed files must
use redistributable source metadata, and their artifact license must match the
source license.

## Complete file inventory

Repository validation recursively walks each fixture directory. Every regular
file must occur in `distributedArtifacts` exactly once and every registered
path must exist. Symbolic links, Windows reparse-style path changes, nonregular
entries, lexical escapes, and realpath escapes are rejected before reading
fixture data. Raw hashes are checked for every file; JSON semantic hashes and
benchmark JSONL checks are then applied to their typed roles.

The fixture root itself is closed as well: it may contain only the selected
manifest file and directories whose names are declared fixture IDs. Convention
vectors that deliberately make no scientific fixture claim live under
`tests/vectors`, outside this ledger root. This prevents an undeclared sibling
directory from bypassing provenance, license, and hash accounting.

## Coverage tags

Coverage tags are a fixed vocabulary, not free-form labels. The smoke fixture
must contain exactly the four harness tags. Each canonical scientific fixture
family in `canonical-fixtures.ts` declares its required subset—for example,
internal-width, rectangular-paper, minimum-grid, CCD, layer-order,
no-solution, and mutation coverage. A canonical ID with missing required tags
is invalid even if its files and hashes are otherwise correct.

Manifest validation proves only catalog integrity, provenance accounting, and
deterministic harness behavior. It never proves foldability, collision freedom,
or a no-solution claim; those require the future independent reference
verifier and scientific artifact bundle.
