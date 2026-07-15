# NEG-TOPOLOGY exact-negative candidate vectors

This closed directory contains project-authored controls and exact-negative sources for the current `parseArtifactContractV1` topology checks only. Both saved controls must freshly parse before generation or verification succeeds. Every negative source is hash-bound to, and names, its saved accepted control.

The bundle is intentionally outside `tests/fixtures/manifest.json`; no `NEG-TOPOLOGY-*` case is canonically registered or promoted. It defines no SupportProfile or ToleranceProfile, makes no scientific verification claim, and does not evaluate M0F GO.

Exact-negative means only that the current artifact-contract parser rejects the saved bytes with the complete ordered issue code/path sequence recorded in the ledger. This is parser regression evidence. It does not prove planarization or reconstruction, general hole recognition, manifold completeness, crease-pattern validity or constructibility, MV validity, foldability, collision freedom, or any scientific topology theorem.

The filled-annulus FOLD control is a connected V8/E12/F5 disk: four annular quadrilaterals plus a center face. Its hole mutation removes the center coherently and isolates the parser's current disk Euler check; that single vector is not a general hole-support claim.

Verify with `npx tsx m0f/neg-topology-candidate-bundle-cli.ts --verify`. Regenerate with `npx tsx m0f/neg-topology-candidate-bundle-cli.ts --write`.
