# Independent static triangle-overlap census audit candidate v1

Status: independent whole-ledger consistency replay for one bounded static
triangle set. It does not decide mesh adjacency, legal contact, penetration,
self-intersection, a motion interval, CCD, collision freedom, product
`verified`, or global M0F `GO`.

## Independence boundary

`static-rational-triangle-overlap-census-audit.ts` has one runtime dependency:
the import-free exact barycentric pair auditor. It does not import the producer
census, the producer pair classifier, the projective-rational kernel, or the
shared clone helper. The whole-census module owns its portable parser, BigInt
canonicalization, triangle degeneracy check, stable ID ordering, raw shared
vertex incidence, `n choose 2` enumeration, counter replay, and result freeze.

This separation catches producer-ledger and producer-classifier disagreement.
It is still candidate consistency evidence, not a formal proof that both
implementations, the JavaScript runtime, or the supplied source binding are
correct.

## Portable closed snapshot

The recommended unknown-data API accepts one versioned snapshot containing:

- coordinate encoding `bigint` or `canonical-decimal`;
- up to 64 stable-ID-bound, nondegenerate canonical homogeneous triangles; and
- the complete 39-field producer census record, including its pair ledger and
  every no-claim flag.

The parser is closed, descriptor-based, accessor-free, and fail-closed. It
rejects sparse arrays, unknown keys, non-plain or revoked objects,
noncanonical points or decimal text, duplicate IDs, over-limit coordinates,
and values outside the defensive work surface without producing a geometry
decision. Accepted triangles are sorted by stable ASCII ID and converted to a
deeply frozen BigInt form.

Current defensive ceilings are 64 triangles, 2,016 producer pairs, 2,016
independent pair audits, 512 issues, 128 code units for IDs, metadata, and
diagnostic path segments, 16,384 coordinate bits, and 4,933 decimal digits.
Hostile `Symbol` descriptions are truncated before a full diagnostic string is
constructed. These ceilings are not a SupportProfile or browser capacity
claim.

## Complete independent replay

The auditor derives canonical triangle IDs and every expected unordered pair
from the input geometry, rather than trusting producer counts or pair rows.
Every expected pair is sent exactly once to the independent exact barycentric
auditor. A missing producer row receives a structurally valid synthetic
no-claim pair snapshot so the geometry replay is still performed. Duplicate,
misordered, or shifted producer rows therefore cannot suppress an expected
geometry decision.

For each pair, the whole-census audit independently checks:

- contiguous pair index and canonical first/second IDs;
- static classification and closed-intersection boolean;
- exact shared canonical vertex count and raw incidence class; and
- the incidence invariants that shared geometry cannot be disjoint and three
  shared canonical vertices must be coplanar intersection.

It then recomputes all classification, overlap, and incidence counters and
checks the producer's ID list, counts, ordering metadata, fixed contract
literals, and negative claim flags. Empty and singleton sets replay zero pairs
with exact numeric zero, not JavaScript negative zero.

## Result semantics

A fully matching record returns `ok: true` and `auditOutcome: "consistent"`.
A structurally valid snapshot with any semantic difference returns `ok: false`
with a fixed `auditOutcome: "inconsistent"` decision, independently audited
counters, and bounded issues. Malformed, hostile, over-limit, or unexpected
pair-auditor failure returns only a contract failure with no decision value.

Both decision variants fix scientific claim, mesh adjacency, legal contact,
penetration, self-intersection, collision freedom, continuous time, CCD,
SupportProfile, support claim, `verified`, and global M0F `GO` to `false`.

## Remaining evidence work

A separate canonical-decimal evidence record now binds the embedded triangle
set, producer ledger, fresh audit result, and this auditor's declared source
closure under domain-separated hashes; see
`static-rational-triangle-overlap-census-evidence-v1.md`. It is not a signature
and does not bind an external canonical mesh revision, triangulation
provenance, or Worker execution record. Product verification still needs those
external bindings, declared topology and legal-contact policy, an independent
locus audit, complete nonlinear motion coverage, conservative CCD, measured
browser limits, and global-gate integration.
