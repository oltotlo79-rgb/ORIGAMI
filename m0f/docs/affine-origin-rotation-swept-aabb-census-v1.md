# Affine-origin rotation swept-AABB census candidate v1

Status: bounded all-pairs broad-phase ledger for one primitive set and one
dyadic time slab. It is not nonlinear narrow-phase CCD, a collision event
test, a legal-contact policy, a self-intersection decision, a collision-free
result, a product `verified` result, or evidence for global M0F `GO`.

## Closed set contract

`computeAffineOriginRotationSweptAabbCensusV1` accepts one motion-family token,
one canonical dyadic slab, and a dense set of exact triangle primitives. Each
primitive has a distinct stable ASCII ID, three nondegenerate canonical
projective-rational local vertices, and exact affine-origin endpoints `q0` and
`q1`. The parser reuses the closed pair contract for the shared slab and every
primitive, then sorts the accepted set by ID code-unit order.

Unknown properties, accessors, sparse arrays, non-plain or hostile objects,
duplicate IDs, malformed primitives, and over-limit input fail atomically. No
partial pair ledger is returned. Diagnostic path segments are capped at 128
code units and issues at 512. The current defensive ceiling is 64 primitives,
hence 2,016 unordered pairs. These are experiment guards, not a SupportProfile,
supported mesh-size claim, or browser performance result.

## Complete bounded pair ledger

For the accepted canonical set, every unordered pair `i < j` is classified
exactly once and recorded in first-ID/second-ID order with a contiguous
`pairIndex`. The ledger retains all three pair outcomes without exclusion or
promotion:

- `separated-by-certified-swept-aabb`, including both exact primitive bounds
  and the strict-gap certificate;
- `swept-aabb-overlap-candidate`, including both exact primitive bounds; or
- `indeterminate`, including the fixed reason and motion-family support flag.

An unsupported supplied motion family requires every pair to remain
`indeterminate` with reason `unsupported-motion-family`. A separated or
overlap-candidate dependency record for that input is an invariant failure and
rejects the whole census.

The record publishes separated, candidate, and indeterminate counts, and
checks all counters against the full `n choose 2` ledger before success.
`completePairEnumeration: true` means only that all pairs in this one accepted
bounded input were visited. It says nothing about whether the input contains
every face triangle of a model, covers every motion slab, or is bound to a
current source revision.

## Dependency and evidence checks

Each pair result must satisfy the complete no-claim record contract of the
single-pair swept-AABB classifier. The status discriminator must remain stable
through closed-record inspection. For separated and overlap-candidate results,
the census independently reconstructs the expected L1-radius/endpoint AABB
from the supplied primitive geometry and requires exact equality. A canonical
but input-unbound bound or certificate therefore rejects the entire census.
The strict gap, axis tie order, primitive order, slab, motion family, fixed
metadata, and all negative claim flags are also checked before the pair enters
the ledger. Classifier rejection, exceptions, malformed success records, or
counter disagreement fail atomically.

This semantic check protects the aggregator boundary, but it is not an
independent nonlinear collision method: both components use the same exact
rational substrate and the same deliberately loose swept-bound equation.

## Claim boundary and remaining work

The census fixes continuous CCD, collision freedom, legal contact,
penetration, self-intersection classification, `verified`, scientific claim,
support claim, and global M0F `GO` to `false`. An empty candidate list is not a
model-wide collision-free result unless later evidence proves complete source
triangle identity, complete primitive and time coverage, motion binding, and
all unsupported or indeterminate branches absent.

Remaining work includes a persisted independent replay contract, actual
origami face-motion generation, conservative nonlinear vertex-face and
edge-edge narrow phase, tangency and persistent-contact handling, an
incidence-aware legal-contact policy, Worker cancellation, evidence hashing,
and measured Windows browser limits.
