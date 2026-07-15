# Square-grid quantization Worker candidate v1

The dedicated square-grid Worker runs finite candidate enumeration away from
the browser main thread. It uses one module Worker for one job and exposes no
forced timeout. A caller can cancel only with `AbortSignal`; every terminal
path removes listeners and terminates the Worker.

## Closed protocol

Requests and responses are owned, bounded, accessor-free snapshots with fixed
candidate/no-claim literals. Invalid requests are rejected before a Worker is
created. Invalid Worker messages, host execution errors, and cancellation map
to fixed public results without exposing host exception text.

Every response includes the normalized `sourceInput`. The response parser
checks completed-result paper, enumeration bounds, error limit, and the
result-level canonical `sourceBranches` against it, including when the candidate
array is empty. Every nonempty candidate also must match those source branches.
The client then compares the echoed source with the request it retained.
Consequently, a response for a different input is not accepted merely because
it reuses the same job ID. This binding detects stale or misrouted results; it
is not a proof that candidate enumeration is complete.

The paper/bounds/error/branch comparison lives in a box-pleating core binding
module shared with the ordered-tree composition, so the two entry points cannot
silently drift to different source-binding rules.

An empty `candidates` array is a valid completed enumeration and never a
no-solution certificate. The completed-result integrity checker remains
candidate-only.

## Browser checks and exclusions

The test-only Vite harness runs success/repeatability, immediate cancellation,
and pre-abort cases for this Worker and the FOLD Worker in Chromium, Edge, and
Firefox. These are smoke checks, not a selected latency or memory profile.

The defensive protocol ceiling is deliberately broader than the current
candidate measurement points. A near-ceiling synthetic response (1,023 grid
candidates and 65,472 branch records) remained bounded and parsed correctly in
local Node measurements, but took about four seconds and roughly 441 MiB after
parsing. A future UI must apply a measured SupportProfile below or otherwise
account for this main-thread response-validation cost; the defensive ceiling is
not an interactive product promise.

Progress reporting, measured message/memory limits, candidate selection,
branch placement, axial/axial+N construction, pleat routing, and foldability
remain outside this Worker slice.
