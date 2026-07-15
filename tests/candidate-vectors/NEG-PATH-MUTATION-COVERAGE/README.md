# NEG-PATH-MUTATION-COVERAGE exact-negative candidate vectors

This closed directory contains one saved project-authored accepted two-segment bounded-interpolation FOLD artifact-contract control and four exact-negative mutations for the current `parseArtifactContractV1` path-time coverage checks: a missing start prefix, an internal segment gap, a missing terminal suffix, and a bounded-motion knot prefix gap. Each mutation is compared byte-for-byte with the same saved control and replayed against its complete ordered parser issue signature.

All four case IDs are intentionally outside `tests/fixtures/manifest.json`; none is canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects each saved source with the exact changed paths and complete ordered issue signature fixed in the ledger.

This parser replay establishes only the four declared JSON time-coverage boundaries above. It does not establish endpoint continuity, physical path continuity, rigidity, face isometry, hinge geometry, crease-map completeness, piecewise-polynomial coverage, contact semantics, CCD or collision detection, collision freedom or foldability, certificate-hash verification or cryptographic authenticity, completeness of the canonical path-mutation family, a SupportProfile or ToleranceProfile, scientific verification, or M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with `npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --verify`. Regenerate with `npx tsx m0f/neg-path-time-coverage-candidate-bundle-cli.ts --write`.
