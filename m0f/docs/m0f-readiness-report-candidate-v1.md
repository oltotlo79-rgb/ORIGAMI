# M0F readiness report candidate v1

Status: fail-closed readiness diagnostic only. This is not the normative
`M0F_REPORT.md`, not a final `GO` / `NO-GO` decision, and not authorization to
start product implementation.

`npm run m0f:readiness-report` validates the current fixture repository, runs
the existing product-handoff diagnostic, and writes three ignored transient
files below `.artifacts/m0f-readiness-report/`:

- `M0F_READINESS_REPORT.candidate.md`;
- `readiness-diagnostic.json`;
- `manifest.json`.

An optional output-directory argument changes only that destination. The CLI
returns success when it safely records a blocked/not-ready state. Invalid input,
generation failure, or failed artifact self-verification returns failure.

## Claim boundary

The generator accepts only the existing closed handoff result with all of these
values unchanged:

- `contractStatus: candidate` and `scientificClaim: false`;
- `readinessDecision: not-ready` and `handoffReady: false`;
- `m0fReportIncluded: false` and `m0fDecisionRecorded: false`;
- `finalDecision: not-recorded` and `globalM0fGo: false`;
- `productImplementationStartAuthorized: false`;
- GO conditions 1 through 14 and required deliverables 1 through 14 present in
  exact order.

The Markdown enumerates current catalog gaps, all ten fail-closed evidence
areas, their next actions, and both normative 1-through-14 mappings. It names
`M0F_REPORT.md` only as the reserved final path and explicitly says the candidate
file must not be renamed or cited as that deliverable.

## Integrity binding

The source diagnostic and generated Markdown each carry byte length and SHA-256
over their exact UTF-8 bytes. A domain-separated SHA-256 then binds the complete
manifest payload, including both file hashes and the blocked summary, while
excluding only its own hash field.

Self-verification recomputes all hashes, reparses the diagnostic through the
fail-closed boundary, and rerenders the Markdown byte-for-byte. Therefore manual
changes to either generated file cannot remain consistent with the manifest.
The hashes are integrity keys, not signatures or evidence of correctness.

CI generates and uploads this candidate directory for inspection. Doing so does
not change any final-evidence readiness area from `not-evaluated`, satisfy
required deliverable 13, or open the M0F gate. The normative report and final
decision remain blocked until registered final evidence exists for every area.
