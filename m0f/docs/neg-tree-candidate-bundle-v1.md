# NEG-TREE exact-negative candidate bundle v1

## Status and scope

`NEG-TREE-V1` is a project-authored candidate regression bundle for the closed `parseOrderedTreeInputV1` boundary. It is not registered in `tests/fixtures/manifest.json`, does not claim canonical promotion, does not define, select, or imply a SupportProfile or ToleranceProfile, makes no scientific claim, and does not evaluate the global M0F gate. The parser's 2..20 leaf range is a current defensive implementation limit only.

“Exact-negative” has a deliberately narrow meaning here: from the committed UTF-8/LF source bytes, a fresh call to `parseOrderedTreeInputV1` must reject and reproduce the ledger's complete ordered `{code, path}` array. The verifier does not infer a stronger result from a matching code alone.

This is parser-regression evidence. It is not evidence that a tree method is feasible or infeasible, that a construction exists, that a crease pattern is valid, or that a model is foldable.

## Accepted controls

Generation and verification require two in-code controls to parse successfully:

1. `primary-star-four-leaf-control-v1` is a five-node tree with one center and four leaves. It keeps the structural negative cases away from accidental leaf-underflow cascades.
2. `two-center-twenty-leaf-control-v1` is a connected acyclic tree with twenty leaves and degree below the defensive maximum. The overflow vector appends exactly one leaf, edge, center incidence, and leaf rotation.

The second control isolates the implemented upper leaf-count branch. A connected acyclic tree necessarily has at least two leaves, so this bundle does not claim an independently reachable leaf-underflow oracle and does not turn that graph fact into a feasibility claim.

## Closed case ledger

The ledger fixes case order, control ID, mutation description, complete ordered JSON-difference paths, source artifact ID/path, rejection outcome, and complete parser issue sequence.

| Index | Case ID                                | Fixed mutation boundary                      | Ordered parser result summary                                             |
| ----: | -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
|     0 | `NEG-TREE-DUPLICATE-NODE-ID`           | `$.nodes[1].id`                              | duplicate ID followed by its exact topology/reference/rotation cascade    |
|     1 | `NEG-TREE-DUPLICATE-EDGE-ID`           | `$.edges[1].id`                              | duplicate edge ID followed by its exact disconnected/rotation cascade     |
|     2 | `NEG-TREE-DUPLICATE-ID-NAMESPACE`      | `$.edges[0].id`                              | collision between the shared node/edge ID namespace and its exact cascade |
|     3 | `NEG-TREE-SELF-LOOP`                   | append `$.edges[4]`                          | edge-count mismatch, then self-loop                                       |
|     4 | `NEG-TREE-PARALLEL-EDGE`               | append edge and both rotation incidences     | edge-count mismatch, parallel edge, then cycle                            |
|     5 | `NEG-TREE-CYCLE`                       | append leaf-to-leaf edge and both incidences | edge-count mismatch, then cycle                                           |
|     6 | `NEG-TREE-DISCONNECTED`                | remove one terminal edge and both incidences | edge-count mismatch, then disconnected                                    |
|     7 | `NEG-TREE-NONPOSITIVE-LENGTH`          | `$.edges[0].length` becomes zero             | invalid bound followed by the exact omission cascade                      |
|     8 | `NEG-TREE-NEGATIVE-WIDTH`              | `$.edges[0].width` becomes negative          | invalid bound followed by the exact omission cascade                      |
|     9 | `NEG-TREE-ROTATION-COVERAGE-MISSING`   | remove `$.rotation[4]`                       | rotation coverage mismatch                                                |
|    10 | `NEG-TREE-ROTATION-INCIDENCE-MISMATCH` | replace `$.rotation[0].edgeIds[0]`           | rotation incidence mismatch                                               |
|    11 | `NEG-TREE-LEAF-COUNT-OUT-OF-RANGE`     | append the twenty-first leaf/edge/rotations  | leaf count out of range                                                   |

The JSON Schema uses `prefixItems` with exact case-row constants, so row swaps, changed paths, reordered issues, altered codes, and added claim fields fail schema validation. The runtime ledger parser independently compares the same fixed rows.

## Artifacts, provenance, and hashes

The payload is exactly one README plus twelve individual JSON sources. Every artifact row fixes:

- a unique artifact ID, role, and relative path;
- media type and MIT license;
- project-authored provenance with no artifact dependencies;
- a lowercase `sha256:` digest of the exact committed bytes.

The ledger itself is stable JSON plus one LF. Its deterministic regeneration check is an additional byte oracle: coherently changing a source and its ledger hash still fails even when the modified source has the same difference paths and the same parser issue sequence.

The verifier rejects extra directory entries and expected paths implemented as symbolic links, junctions, directories, or other non-regular entries. It reads the ledger first, checks the exact file set and hashes, freshly parses both controls and all sources, checks control differences and complete issue arrays, verifies the `NEG-TREE-` prefix is absent from the canonical manifest, then compares every saved byte with a fresh deterministic build.

This is a repository-local committed-artifact check. It assumes the repository root as the current working directory and does not promise a file-handle-pinned or TOCTOU-resistant protocol against concurrent hostile replacement.

## Commands

Verify without writing:

```text
npx tsx m0f/neg-tree-candidate-bundle-cli.ts --verify
```

Regenerate the closed file set and immediately verify it:

```text
npx tsx m0f/neg-tree-candidate-bundle-cli.ts --write
```

`--json` emits the closed candidate verification result. Success means only that this exact-negative parser bundle is reproducible; it does not promote the cases or widen the claim boundary.
