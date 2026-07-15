# Static exact-rational triangle intersection-strata candidate v1

Status: raw relative-interior refinement of one exact static triangle-pair
locus. It does not bind mesh topology, decide legal contact or penetration,
follow motion, perform CCD, classify self-intersection, establish collision
freedom, verify a product result, or imply M0F `GO`.

## Purpose

An intersection locus alone does not say whether its open part lies on a
triangle boundary or crosses both triangle relative interiors. The strata
classifier keeps the exact locus and evaluates either its point or the exact
open-segment midpoint against each source triangle in an injective dominant
axis projection. The per-triangle result is `none`, `vertex`, `edge`, or
`interior`.

The segment midpoint is constructed as a canonical homogeneous rational point.
Its raw coordinates are checked against the locus constructor's 524,288-bit
intermediate ceiling before normalization. Hostile input parsing, input limits,
and locus construction remain fail-closed through the underlying exact locus
contract.

## Raw characters

The closed candidate result distinguishes:

- disjoint triangles;
- noncoplanar point contact candidates;
- noncoplanar segments supported by at least one triangle boundary;
- noncoplanar segments whose open midpoint is interior to both triangles;
- coplanar point or segment contact candidates; and
- coplanar positive-area overlap that requires a later layer order.

An interior-interior noncoplanar segment is an exact static surface crossing.
It still is not named a self-intersection here because the pair has no canonical
mesh identity or declared incidence policy. Point and boundary-supported
segments remain contact candidates because side history is required to reject
through-passage. Coplanar area overlap requires both motion history and a
region-scoped acyclic layer order.

The classifier fails closed if a point is reported interior to both triangles,
or if a zero-area coplanar locus has an interior-interior sample: either state
would contradict local openness and indicates an upstream construction error.

## Evidence boundary

Tests cover disjoint planes, exact interior-interior crossing, vertex-face
contact, shared edges, an edge lying on a face, coplanar point/segment/area
cases, non-unit rational midpoint construction, every triangle permutation,
A/B exchange, hostile accessors, deep freeze, limits, and all negative claim
flags.

Remaining work includes an independent strata/locus verifier, canonical mesh
and declared hinge binding, a legal-contact policy, region-scoped layer order,
side history before and after contact, complete pair/time coverage, nonlinear
narrow-phase CCD, saved execution evidence, and global-gate integration.
