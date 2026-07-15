# Static exact-rational triangle intersection-strata census candidate v1

Status: complete raw strata ledger for one bounded static triangle set. It does
not bind mesh identities, apply a declared-incidence or legal-contact policy,
follow motion, perform CCD, classify self-intersection, establish collision
freedom, verify a product result, select a SupportProfile, or imply M0F `GO`.

## Closed input and complete enumeration

`computeStaticRationalTriangleIntersectionStrataCensusV1` reuses the closed
triangle-set parser from the raw overlap census. The parser accepts stable
caller IDs and nondegenerate canonical projective-rational triangles, captures
owned data without invoking accessors, rejects malformed or duplicate entries
atomically, and sorts triangle IDs in code-unit order.

The defensive ceiling remains 64 triangles, 2,016 unordered pairs, and 512
diagnostics. These are experiment work guards, not measured Windows/browser
support limits. Empty and singleton sets are valid and contain no invented
pairs. For every accepted set, all `n(n-1)/2` pairs are retained exactly once;
there is no topology-based or contact-based silent exclusion.

## Pair ledger

Every canonical pair runs through the exact intersection-locus and relative
strata classifier. Each row retains the full pair strata and locus records,
plus convenient copies of:

- canonical pair index and triangle IDs;
- the raw shared-coordinate incidence count and label;
- intersection character and each triangle's relative locus location;
- exact static interior-interior crossing evidence;
- unresolved contact-candidate status;
- coplanar positive-area overlap; and
- requirements for motion-side history and region layer order.

The aggregate record independently checks its retained rows against counts for
disjoint pairs, interior-interior static crossings, contact candidates,
coplanar-area overlaps, history requirements, layer-order requirements, and all
four raw incidence classes. The producer also checks the complete closed
contract of each dependency record and rejects incidence-impossible output.
Any pair rejection, exception, malformed success, or counter disagreement
rejects the whole census; a partial ledger is never returned.

Shared canonical coordinates are still only
`shared-canonical-vertex-count-only-not-mesh-topology`. They do not prove that
two triangle IDs belong to a particular mesh revision, share a declared hinge,
or may legally contact. An exact interior-interior segment is strong static
geometry evidence, but this layer deliberately does not rename it to product
self-intersection without those bindings. A point or boundary-supported
segment remains undecided until motion-side history is available. Coplanar area
overlap remains undecided until a region-scoped acyclic layer order is bound.

## Evidence and remaining boundary

Tests compare every retained row with a fresh direct exact strata result,
independently recompute all pair keys and counters, cover all four high-level
characters and raw incidence classes, exercise input/vertex/winding/rational
invariance, hostile inputs and revoked proxies, deep freeze, empty/singleton
sets, and the complete 64-triangle/2,016-pair ceiling. Mutation tests require
atomic rejection of a dependency failure with no issue detail and a forged
determinate success.

This is still one static configuration of a caller-supplied set. Remaining work
includes external canonical mesh/face/triangulation provenance, declared
incidence and hinge policy, an independent strata/locus census verifier,
motion-side samples around events, region-scoped layer DAG evidence, complete
pair and time-slab coverage, nonlinear narrow-phase CCD, Worker execution and
persisted evidence, representative measurements, and global-gate integration.
