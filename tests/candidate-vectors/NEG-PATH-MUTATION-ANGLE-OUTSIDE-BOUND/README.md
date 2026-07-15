# NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND exact-negative candidate vector

This closed directory contains one saved project-authored single-segment FOLD artifact-contract control and one exact-negative mutation for the current `parseArtifactContractV1` declared bounded-interpolation angle-containment check. The accepted control declares knots `[0,0.5,1]`, angles `[0,pi/2,pi]`, and consecutive interval bounds `[0,pi/2]` and `[pi/2,pi]`. The mutation changes only the middle declared angle from `pi/2` to `3*pi/4`; that value is outside the first interval bound while remaining inside the second.

The bundle is intentionally outside `tests/fixtures/manifest.json`; `NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND` is not canonically registered or promoted. Exact-negative means only that the current artifact-contract parser rejects the saved bytes with the complete ordered issue signature fixed in the ledger.

This parser replay establishes only that the saved declared angle fails the parser's literal interval-containment rule. It does not establish physically valid angle bounds, a radian convention, conservative bounds, kinematic feasibility, endpoint or physical path continuity, piecewise-polynomial endpoint inference, rigidity, face isometry, hinge geometry, crease-map completeness, contact semantics, CCD or collision detection, collision freedom or foldability, certificate-hash verification or cryptographic authenticity, completeness of the canonical path-mutation family, a SupportProfile or ToleranceProfile, scientific verification, or M0F GO. Local SHA-256 rows detect saved-byte drift only and are not signatures.

Verify with `npx tsx m0f/neg-path-angle-bound-candidate-bundle-cli.ts --verify`. Regenerate with `npx tsx m0f/neg-path-angle-bound-candidate-bundle-cli.ts --write`.
