# REF-FOLD-NOFACES candidate vector

This directory is a project-authored candidate bundle for the closed FOLD 1.1/1.2 NOFACES face-reconstruction boundary.

It is intentionally outside `tests/fixtures/manifest.json` and is not a canonical fixture. Canonical promotion is not claimed. No ToleranceProfile is defined, selected, or implied. Scientific verification is not claimed, and the global M0F gate is not evaluated.

The ledger binds the committed bytes and project provenance of the source, this README, the evidence index, exact reconstruction record, separate audit record, independent audit evidence, canonical eleven-case mutation suite, and saved mutation result.

Regenerate and immediately verify the bundle with:

```text
npx tsx m0f/ref-fold-nofaces-candidate-bundle-cli.ts --write
```

Verify the committed bundle without writing with:

```text
npx tsx m0f/ref-fold-nofaces-candidate-bundle-cli.ts --verify
```
