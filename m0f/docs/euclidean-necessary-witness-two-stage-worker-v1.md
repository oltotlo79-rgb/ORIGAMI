# Euclidean necessary-witness two-stage Worker candidate v1

Status: candidate execution boundary only. This pipeline moves both the bounded
necessary-filter witness search and its separate canonical replay away from the
browser main thread. It is not a polygon/river packing solver, a construction
feasibility decision, or no-solution evidence.

## Two-stage flow

1. The main-thread runner closes and canonicalizes one bounded request, creates
   one Search Worker, and sends it the normalized source input.
2. The Search Worker consumes only its first message and runs the producer DFS.
   A successful response carries a candidate result, source echo, and job ID.
3. The main thread performs bounded envelope, claim, ID, source, and candidate
   shape checks. It performs no DFS and has no search fallback.
4. The Search Worker is terminated before one Validation Worker is created.
   The relay binds a fresh validation ID, the same normalized source, and the
   candidate.
5. The Validation Worker consumes only its first message and invokes the
   independent result validator, which separately rebuilds the finite problem
   and replays the canonical bounded DFS.
6. The main thread accepts only a bounded validation response with matching job,
   validation ID, source, and canonical stable serialization. It never runs the replay
   itself.

The two Workers have distinct module entries and handlers. The Search Worker
imports the producer search; the Validation Worker imports the independent
result validator. Neither expensive implementation is used as a main-thread
fallback by the runner.

## Cancellation and lifecycle

Every stage is one-job. A caller `AbortSignal` is the sole cancellation
mechanism; there is no forced timeout. Pre-abort creates neither Worker.
Cancellation during search, during the transition, or during validation settles
to the same fixed candidate-only cancellation result. Listeners are removed and
every created Worker is terminated at most once on completion, rejection,
protocol failure, host execution failure, or cancellation. Duplicate and late
events cannot reopen a settled run.

An invalid first message is consumed silently by a Worker entry because its IDs
are untrusted. Under a broken or substituted entry that never responds, the
runner remains pending until the caller aborts; it does not invent a timeout or
fall back to main-thread work.

## Closed messages and fixed outcomes

Both protocols create owned accessor-free snapshots with finite container,
array, string, property, and depth limits. Diagnostics are capped at the public
`maxIssues: 512` ceiling. That defensive ceiling is not a measured browser
SupportProfile.

Successful messages fix every scientific and product claim to false. Failure
reasons are closed and do not include host exception text. In particular:

- producer rejection is not packing infeasibility;
- independent replay rejection is not construction-level no-solution evidence;
- `domain-exhausted` describes only the modeled pairwise necessary-filter
  domain; and
- no result can set packing, feasibility, `verified`, or global M0F `GO`.

The Validation Worker remains an execution trust boundary: a correctly bound
accepted response establishes consistency with the replay implemented in that
module, not proof that arbitrary substituted Worker code executed honestly.
Browser bundling, source-set identity, and scientific evidence policy remain
separate concerns.

## Verification scope

Unit tests cover witness-found, budget-exhausted, domain-exhausted, 20 leaves /
190 pairs, the eight-witness ceiling, arithmetic and nested-claim tampering,
bounded hostile diagnostics, factory/listener/post/message failures, stage
transition races, cancellation in both stages, duplicate events, and one-message
entries. Real module-Worker smoke checks cover successful two-stage execution,
search-stage cancellation before validation is created, and pre-abort with no
Worker creation in Chromium, Edge, and Firefox. They do not freeze
response-time, cancellation-latency, memory, or message-size limits.
