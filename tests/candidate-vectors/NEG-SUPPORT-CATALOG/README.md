# NEG-SUPPORT-CATALOG exact-negative candidate vectors

This closed directory contains one project-authored accepted SupportProfile candidate catalog and exact-negative mutations for the current `parseSupportProfileCandidatesV1` boundary only.

The `NEG-SUPPORT-CATALOG-*` IDs are deliberately distinct from the canonical `NEG-SUPPORT-BOUNDARY-*` family. They are not registered in `tests/fixtures/manifest.json`, do not satisfy canonical `support:boundary` coverage, and make no canonical promotion claim.

Every catalog selection remains pending in the accepted control, including the termination-model candidates. This bundle establishes no termination guarantee. It does not freeze or define a SupportProfile, implement `checkSupport`, decide whether any actual input is supported, validate a construction, make a scientific claim, or evaluate M0F GO. It includes no ToleranceProfile.

Exact-negative means only that `parseSupportProfileCandidatesV1` rejects each saved mutation with the complete ordered issue code/path list fixed by the ledger. This is candidate-catalog parser regression evidence, not measured support-boundary evidence.

Verify with `npx tsx m0f/neg-support-catalog-candidate-bundle-cli.ts --verify`. Regenerate with `npx tsx m0f/neg-support-catalog-candidate-bundle-cli.ts --write`.
