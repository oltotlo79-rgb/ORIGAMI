# Static triangle-set overlap census candidate v1

Status: raw exact static pair ledger only. This component classifies every
unordered pair in one bounded triangle set at one fixed configuration. It does
not decide mesh adjacency, legal contact, penetration, self-intersection,
collision freedom, continuous time, CCD, `verified`, or global M0F `GO`.

## Closed input

`computeStaticRationalTriangleOverlapCensusV1` accepts a dense array of records
containing a caller-supplied stable ASCII `triangleId` and one nondegenerate
canonical projective-rational triangle. IDs begin with an ASCII letter or digit,
are unique, and are limited to 128 code units. Numeric-leading IDs cover the
length-prefixed canonical triangle IDs emitted by candidate FOLD face
reconstruction. The parser rejects unknown keys, accessors, sparse arrays, revoked
proxies, malformed/noncanonical triangles, duplicate IDs, and defensive work
limits atomically. Property-key text included in a diagnostic path is
independently capped at 128 code units per segment, including hostile `Symbol`
descriptions. Accepted entries are deeply frozen and sorted by ID using code-unit
order.

The current defensive ceiling is 64 triangles and therefore 2,016 unordered
pairs. Diagnostics are capped at 512. These are finite in-memory experiment
guards, not a product SupportProfile or evidence that 64 triangles is an
acceptable supported mesh size.

## Complete raw ledger

For canonical triangles `i < j`, every unordered pair is passed to the existing
exact static closed-triangle classifier exactly once. The result records:

- canonical pair index and triangle IDs;
- exact static classification and closed-intersection boolean;
- shared canonical vertex count `0..3`; and
- a raw incidence label: nonincident, shared vertex, shared edge, or the same
  three canonical vertices.

The incidence basis is explicitly
`shared-canonical-vertex-count-only-not-mesh-topology`. Coordinate sharing alone
does not establish caller mesh topology, a declared hinge, or a legal-contact
policy. No pair is silently excluded, including pairs that share a vertex or
edge.

The record totals disjoint, coplanar-overlap, noncoplanar-overlap, raw incidence,
incident-overlap, and nonincident-overlap counts. All counts are exact safe
integers under the public pair ceiling and are checked against the ledger before
success. A pair classifier exception, rejection, or claim-contract deviation
rejects the entire census; no partial ledger is returned.

Each underlying pair record can also be checked by the import-free independent
barycentric auditor described in
[the pair-audit contract](static-rational-triangle-overlap-audit-v1.md). The
census does not invoke that auditor. A separate whole-ledger verifier derives
every expected pair from the supplied geometry, invokes the independent pair
auditor, and replays ordering, incidence, and all counters as described in
[the census-audit contract](static-rational-triangle-overlap-census-audit-v1.md).
A separate evidence record persists canonical-decimal triangle geometry, the
complete producer ledger, and a fresh whole-audit replay under
domain-separated hashes; see
[the evidence contract](static-rational-triangle-overlap-census-evidence-v1.md).
That record embeds this supplied set but does not bind it to an external mesh
revision or triangulation provenance.

## Result boundary

`nonincidentOverlapPairCount > 0` is useful static geometric evidence, but this
candidate does not rename it to self-intersection or penetration. Conversely,
an empty static overlap ledger says nothing about an unsampled motion interval.
Complete model verification still requires binding caller IDs to canonical
mesh/source identities, declared incidence exclusions, legal-contact semantics,
an independent intersection-locus audit, all-time motion coverage,
conservative CCD, Worker execution evidence, and external source provenance.

Tests cover canonical ordering, input and vertex permutation, all incidence
classes, coplanar/noncoplanar overlap, canonical non-unit homogeneous weights,
empty and singleton inputs, the 64/2,016 ceilings, duplicate and malformed
input, accessors and revoked proxies, the 512-issue cap, deep freeze,
bounded hostile-`Symbol` diagnostic paths, independently recomputed pair/count
invariants, and atomic classifier failure.
