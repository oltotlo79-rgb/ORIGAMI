# NEG-LAYER-CONTACT-COVERAGE exact-negative candidate vector

This closed directory contains one saved project-authored FOLD artifact-contract control and one exact-negative mutation for the current `parseArtifactContractV1` declared coplanar-contact layer-interval coverage check. The accepted control declares one coplanar contact and one same-direction layer relation over `[0,1]`. The mutation changes only the layer relation start from `0` to `0.25`, leaving a declared prefix gap.

The bundle is intentionally outside `tests/fixtures/manifest.json`; `NEG-LAYER-CONTACT-COVERAGE` is not canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects the saved bytes with the complete ordered issue signature fixed in the ledger.

This parser replay establishes only that the current parser compares the closed interval union of valid declared participants for one saved source. It does not complete a canonical contact fixture, infer physical contacts, establish contact completeness or legality, establish a physical layer order or order-reversal evidence, prove path continuity, perform CCD or collision detection, establish collision freedom or foldability, define a SupportProfile or ToleranceProfile, make a scientific verification claim, or evaluate M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with `npx tsx m0f/neg-layer-contact-coverage-candidate-bundle-cli.ts --verify`. Regenerate with `npx tsx m0f/neg-layer-contact-coverage-candidate-bundle-cli.ts --write`.
