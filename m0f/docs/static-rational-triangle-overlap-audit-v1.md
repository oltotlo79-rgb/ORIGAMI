# Independent static triangle-overlap audit candidate v1

Status: independent candidate consistency audit only. This module rechecks one
static closed-triangle producer record without importing the producer
classifier, its projective-rational kernel, or any geometry module. It does not
decide legal contact, penetration, a motion interval, CCD, collision freedom,
`verified`, or global M0F `GO`.

## Independent method

Two closed triangles intersect exactly when their convex hulls share a point.
The auditor expresses that condition as six nonnegative barycentric variables,
two sum-to-one equations, and three coordinate-equality equations. The feasible
set is bounded; if it is nonempty it has a basic feasible point with at most
five active variables. The implementation enumerates those finite active sets
and solves every candidate system with its own normalized BigInt rational
Gaussian elimination. A separate homogeneous determinant decides whether an
intersecting pair is coplanar.

This is intentionally different from the producer's edge-plane construction
and projected orientation tests. The audit source has no imports. Passing both
implementations therefore provides a useful candidate consistency check, not a
formal proof that either implementation or its execution environment is free
of defects.

## Input boundaries

The recommended unknown-data API,
`auditStaticRationalTriangleOverlapCandidateV1`, accepts one closed audit bundle:

- schema and record literals;
- coordinate encoding `bigint` or `canonical-decimal`;
- two dense, nondegenerate canonical homogeneous triangles; and
- the complete static producer record being checked.

One encoding applies to every coordinate; mixed primitive types fail the input
contract. BigInt coordinates are limited to 16,384 bits. Decimal coordinates
must use canonical integer text, are limited to 4,933 digits, and are checked
against the same bit ceiling after parsing. Property, metadata-string, and
diagnostic ceilings bound hostile inspection. Unknown keys, accessors, sparse
arrays, revoked proxies, noncanonical weights/gcds, degenerate triangles, and
over-limit input fail closed without an audit decision.

The parser returns a deeply frozen BigInt form for
`auditTrustedStaticRationalTriangleOverlapCandidateV1`. That second API skips
hostile inspection and limits; callers must not construct or cast its trusted
input themselves.

All ceilings are defensive experiment limits, not a SupportProfile or browser
capacity claim.

## Result meaning

A structurally valid and matching producer record returns `ok: true` with
`auditOutcome: "consistent"`. If the geometry is valid but the producer's
classification, closed-intersection boolean, metadata, or any no-claim flag is
changed, the auditor returns `ok: false`, a fixed
`auditOutcome: "inconsistent"` record, and bounded semantic issues. A malformed
input returns only a closed contract failure and no decision record.

Both outcomes independently state the audited static classification, but only
`consistent` states that the supplied producer record matched it. Boundary
touch remains a closed-set intersection. Neither outcome classifies that touch
as legal, distinguishes penetration, or says anything about times other than
the one supplied configuration.

## Verification scope

Tests cover all three classifications, non-unit homogeneous weights, a plane
offset by `2^-4096`, rank-deficient coplanar containment, coincidence, and edge
overlap, noncoplanar point/edge/face tangency, producer and affirmative-claim
tampering, both coordinate encodings, mixed/noncanonical input, degenerate
triangles, hostile inspection, public ceilings, deep freeze, deterministic
triangle permutations, a rational differential corpus against the edge-plane
producer, and a separate exact-SAT differential corpus.

A separate bounded whole-census auditor now derives every expected unordered
pair, invokes this pair auditor, and replays the producer ledger and counters;
see
[the census-audit contract](static-rational-triangle-overlap-census-audit-v1.md).
The whole-census evidence record now saves the embedded triangle set and
producer ledger and reruns this pair auditor through the whole audit. A
standalone pair-evidence contract, external canonical mesh identity,
triangulation provenance, independent locus audit, legal-contact policy,
complete time coverage, nonlinear narrow phase, continuous collision
detection, browser measurements, and global gate integration remain open.
