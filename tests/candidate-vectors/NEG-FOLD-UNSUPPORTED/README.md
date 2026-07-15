# NEG-FOLD-UNSUPPORTED exact-negative candidate vectors

This directory contains project-authored exact-negative inputs for the closed FOLD NOFACES adapter boundary.

It is intentionally outside `tests/fixtures/manifest.json`; none of its `NEG-FOLD-UNSUPPORTED-*` case IDs is registered in the canonical manifest. No canonical promotion is claimed. No ToleranceProfile is defined, selected, or implied. Scientific verification is not claimed, and the global M0F gate is not evaluated.

Here, exact-negative means only that this closed adapter deterministically rejects the saved bytes with the complete ordered issue code/path sequence in the ledger. It is not a numerical or scientific impossibility proof. Each source is replayed only through `adaptFoldDocumentToFaceReconstructionInputV1`.

Verify without writing:

```text
npx tsx m0f/neg-fold-unsupported-candidate-bundle-cli.ts --verify
```

Regenerate and immediately verify:

```text
npx tsx m0f/neg-fold-unsupported-candidate-bundle-cli.ts --write
```
