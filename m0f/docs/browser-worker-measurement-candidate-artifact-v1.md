# Browser Worker measurement candidate artifact v1

Status: candidate diagnostic only. This artifact is not final M0F performance
evidence, a frozen runtime-limit profile, a supported-environment claim, or a
scientific result.

`npm run test:e2e:m0f-worker:matrix` exercises five candidate Worker flows in
Chromium, Edge, and Firefox. Each successful scenario is repeated five times.
In-progress cancellation and pre-abort remain one smoke run each, so one
complete project run contains 35 raw records. Witness search now records the
same top-level elapsed time as the other four flows.

The run writes two ignored transient files below
`.artifacts/m0f-worker-measurements/<project>/`:

- `measurements.raw.jsonl`: one closed candidate record per execution;
- `manifest.json`: environment, source binding, five-run summaries, byte count,
  and hashes.

CI runs the project-specific suite after ordinary E2E and uploads this directory
even when a later check fails. The CI measurements are trend and regression
diagnostics only. Linux Chromium/Firefox jobs and the Windows Edge job are not
the frozen Windows reference environment required by the feasibility
specification. Playwright `chromium` is also not a Google Chrome support claim.

## Closed claim boundary

Every raw record fixes all of the following:

- `contractStatus: candidate`;
- `scientificClaim: false`;
- `finalPerformanceEvidence: false`;
- `runtimeLimitEvidence: false`;
- `globalM0fGo: false`;
- success outcome `completed`, or cancellation/pre-abort outcome `cancelled`;
- a flow/scenario-specific exact measurement key set and mode;
- one non-negative `durationMs`, `runGroupId`, unique `runId`, repetition, and
  UTC start time.

The parser also rejects nested scientific, global-GO, collision-free, or
non-candidate contract escalation. A successful five-run summary requires
indexes 0 through 4, only `completed`, and one non-null raw result hash.

This is intentionally separate from the existing benchmark record and fixture
manifest contracts. It is not fed to the final M0F gate or the
browser/runtime/license diagnostic flow.

## Input and result binding

Each record stores the exact candidate JSON representation used by the harness
and its SHA-256. The hash basis is explicitly named as UTF-8 harness input JSON,
not a semantic input hash. FOLD uses the exact JSON bytes transferred to its
Worker. Object-input flows store their harness JSON representation. The swept
AABB input represents each BigInt as an explicit `$m0fBigIntDecimal` tagged
object so it cannot collide with an ordinary JSON string.

Completed records store the raw diagnostic result JSON and its SHA-256. This is
only a hash of that serialization. It is not a certificate hash, semantic hash,
signature, or proof of correctness.

The raw JSONL file is serialized with the project stable-JSON convention and
ordered by flow, scenario, repetition, and start time. The manifest stores the
exact raw byte length and ordinary SHA-256. A second domain-separated SHA-256
binds the manifest payload, including raw hash, source identity, and environment,
while excluding only its own hash field.

The verifier fails closed on noncanonical JSONL, claim or schema drift, input or
result hash changes, derived-field changes, duplicate run slots, ordering
changes, raw byte/hash changes, repeatability-summary changes, and manifest
payload changes.

## Deliberate limitations

The harness runs through the Vite development server. It records Git revision,
dirty/clean state, a hash of the declared harness/config source files, OS release,
CPU, memory, Node and browser versions, user agent, screen, device-memory hint,
and WebGL vendor/renderer when exposed. It does not contain a production build
artifact hash, a frozen complete environment description, peak working set,
Worker memory, warm-up policy, percentile aggregation, outlier policy, frozen
profile IDs, or a performance threshold decision.

Five repetitions satisfy only the current repeatability diagnostic. They do not
define a statistically sufficient p95 sample, and the one-run cancellation
smokes must not be used to claim the 500 ms cancellation objective.
