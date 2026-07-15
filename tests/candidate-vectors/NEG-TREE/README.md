# NEG-TREE exact-negative candidate vectors

This directory contains project-authored exact-negative inputs for the closed ordered-tree input parser boundary.

It is intentionally outside `tests/fixtures/manifest.json`; none of its `NEG-TREE-*` case IDs is registered in the canonical manifest. No canonical promotion is claimed. No SupportProfile or ToleranceProfile is defined, selected, or implied. The 2..20 leaf range is only the current defensive parser limit. Scientific verification is not claimed, and the global M0F gate is not evaluated.

Here, exact-negative means only that `parseOrderedTreeInputV1` deterministically rejects the saved bytes with the complete ordered issue code/path sequence in the ledger. These vectors are parser regression evidence, not a proof of tree-method feasibility, constructibility, crease-pattern validity, or foldability. The twenty-first-leaf vector isolates the implemented upper leaf-count boundary; it does not claim a separately reachable connected-tree leaf-underflow result.

The primary four-leaf star control and the separate two-center twenty-leaf boundary control must both remain accepted before generation or verification can succeed. Each ledger row also fixes its control, mutation description, and complete ordered JSON-difference path list.

Verify without writing:

```text
npx tsx m0f/neg-tree-candidate-bundle-cli.ts --verify
```

Regenerate and immediately verify:

```text
npx tsx m0f/neg-tree-candidate-bundle-cli.ts --write
```
