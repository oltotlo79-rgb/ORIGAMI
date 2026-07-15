# Affine-origin rotation swept-AABB census Worker candidate v1

Status: bounded off-main-thread execution of one supplied census; **not**
nonlinear narrow-phase CCD, collision freedom, verification, a product
SupportProfile, or M0F `GO`

## Closed BigInt protocol

One dedicated module Worker consumes at most its first message and invokes
`computeAffineOriginRotationSweptAabbCensusV1` once. Request and response
records fix `schemaVersion`, `recordType`, operation, `candidate-no-claim`, and
all scientific/verification flags. Source and job IDs are bounded stable ASCII.

The protocol inspects accessor-free, acyclic, plain clone data under explicit
depth, container, property, string, array, and `BigInt` budgets, then uses
`structuredClone`. It does not JSON-encode exact integers. Invalid request IDs
are never trusted or echoed. Computation rejection and exceptions become only
the fixed `census-computation-rejected` or `internal-error` terminal reasons;
diagnostic and host exception text does not cross the boundary.

## Main-thread validation without a census fallback

Every terminal response echoes the canonical source input plus source/job IDs.
The runner requires exact structural source equality and rejects stale or
misrouted responses. For a completed record, the protocol independently:

- reconstructs each primitive's exact L1-radius swept AABB from its source
  local vertices and affine-origin endpoints;
- requires complete equality between supplied and reconstructed bounds;
- requires the same first strict separation selected by producer order
  (`x`, then `y`, then `z`, with `a-before-b` checked before `b-before-a`);
- derives stable unordered-pair order and recomputes all status counters; and
- fixes every CCD, collision, legal-contact, penetration, self-intersection,
  verification, scientific, and global-GO claim to false.

This validation performs bounded exact evidence checks. It never calls the
census computer on the main thread. A valid Worker record is still only the
candidate broad-phase result for the accepted caller-supplied primitive set;
the Worker module remains an execution trust boundary.

## Cancellation, races, and browser checks

The runner creates one Worker per accepted request. It has no forced timeout,
main-thread compute fallback, or progress message because the synchronous
census currently exposes no cooperative progress hook. `AbortSignal`
terminates silent work. Pre-abort creates no Worker. Completion, failure,
cancellation, protocol error, and host error all remove listeners and invoke
termination at most once. An already accepted terminal result survives an
abort race; unexpected, same-turn duplicate, malformed, and mismatched
responses fail closed.

Unit tests cover the protocol, handler, runner, browser factory, and dedicated
entry. The test-only Vite harness additionally exercises repeatable success,
in-flight cancellation, and pre-abort with real same-origin module Workers in
Chromium, Edge, and Firefox. Those smoke checks do not freeze representative
latency, memory, cancellation-response, or message-size limits. Cooperative
progress, actual motion/source binding, nonlinear event subdivision, legal
contact policy, persisted evidence, independent replay, and global-gate
integration remain later work.
