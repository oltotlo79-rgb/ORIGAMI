# M0F face-complex candidate subgate v1

Status: stage-scoped candidate evidence check; **not** scientific verification
or the global M0F `GO` gate

## Purpose and claim boundary

`npm run m0f:face-subgate` checks only the `REF-FOLD-NOFACES` face
reconstruction and separate face-complex audit slice. Its successful outcome is
`candidate-stage-ready`, with `contractStatus: "candidate"`,
`scientificClaim: false`, scope
`face-reconstruction-and-audit-only`, and `globalM0fGate: "not-evaluated"`.
It cannot establish foldability, target attainment, a continuous rigid path,
collision freedom, contact legality, layer ordering, full FOLD compatibility,
or M0F `GO`.

The fixture manifest v2 `expectedOutcome` is reported as
`expectedOutcomeObserved` but is fixed to
`expectedOutcomeUsedAsEvidence: false`. In particular, a manifest declaration
of `expectedOutcome.kind: "verified"` is an intended catalog outcome, not a
candidate-stage decision and not evidence that this subgate may trust.

## Required registered evidence

The manifest repository must be valid and contain exactly the canonical
`REF-FOLD-NOFACES` entry with the `fold-verification` workflow, positive
polarity, null leaf count, and both `fold:face-reconstruction` and
`cp:topology` tags. An unregistered fixture fails closed even when the local
default experiments pass.

The fixture's `knownArtifacts` ledger must point to an `evidence-blob` whose
closed JSON record is:

```json
{
  "schemaVersion": 1,
  "recordType": "m0f-face-complex-candidate-evidence-index",
  "contractStatus": "candidate",
  "scientificClaim": false,
  "scope": "face-reconstruction-and-audit-only",
  "fixtureId": "REF-FOLD-NOFACES",
  "manifestExpectedOutcomePolicy": "observed-only-not-stage-evidence",
  "sourceInputArtifactId": "...",
  "reconstructionExperimentArtifactId": "...",
  "auditExperimentArtifactId": "...",
  "auditEvidenceArtifactId": "...",
  "mutationSuiteArtifactId": "...",
  "mutationResultArtifactId": "..."
}
```

All six artifact IDs must be distinct. The source pointer must equal the
fixture manifest's input pointer. Every non-source pointer must resolve to a
registered `known-artifact` file that also has an `evidence-blob` semantic
pointer. Unknown fields, claim escalation, duplicate roles, invalid IDs,
missing files, invalid JSON, hash-invalid repository files, failed records,
wrong experiment/engine IDs, and unsupported FOLD input all block the stage.
Every artifact is path/reparse-checked and SHA-256-checked again on the exact
file-handle bytes consumed after repository validation; a post-validation
replacement produces the fixed `artifact-hash-changed` blocker.

## Executed checks

The gate does not trust saved success fields. It:

1. validates the complete manifest repository, file ledger, and hashes;
   every artifact is hashed again on the exact bytes consumed after repository
   validation. The consumer captures the registered path/hash before I/O,
   confines the canonical path to the fixture root, rejects linked/reparse
   paths, and checks the opened file identity before and after reading. Changed
   bytes block with `artifact-hash-changed`; path or link retargeting blocks as
   unreadable;
2. adapts the registered standard snake-case FOLD input through the candidate
   NOFACES boundary;
3. parses the saved reconstruction and audit experiment envelopes, including
   their claim boundaries and semantic hashes;
4. reruns exact face reconstruction from the registered source with the saved
   seed and repetition, then requires the complete semantic hash to match;
5. prepares a fresh compact audit input from that rerun result; and
6. reruns the separate projective-BigInt face audit and requires its complete
   semantic hash to match the saved audit record;
7. parses the hash-bound audit evidence, requires its embedded input to equal
   the freshly prepared input, checks its current independent-auditor source
   set hash, reruns the audit, and compares the saved audit result; and
8. requires the complete canonical mutation-suite definition, reruns all
   semantic mutations on the fresh audit input, and exactly compares the
   deterministic saved suite result.

Reason codes are emitted in a fixed order, and JSON output uses deterministic
stable serialization. A source/evidence mismatch blocks both applicable rerun
checks even when each saved record is internally well-formed.

## Reproduction

```text
npm run m0f:face-subgate
npm run m0f:face-subgate -- --json
npm run test:unit -- tests/m0f/face-complex-candidate-evidence.test.ts
npm run test:unit -- tests/m0f/face-complex-candidate-subgate.test.ts
npm run test:unit -- tests/m0f/face-complex-subgate-cli.test.ts
```

The committed fixture catalog currently has no `REF-FOLD-NOFACES` entry, so
the command intentionally exits with status 1 and reason `fixture-missing`.
That fail-closed result is distinct from both catalog completeness and the
always-separate global `npm run m0f:gate` decision.
