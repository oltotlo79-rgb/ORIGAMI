# Static exact-rational triangle overlap candidate v1

Status: candidate feasibility component only. This classifier asks whether two
nondegenerate **closed** triangles intersect at one fixed 3D configuration. It
does not prove collision freedom over a motion interval and cannot produce a
product `verified` result.

## Closed input boundary

`parseStaticRationalTriangleOverlapInputV1` accepts exactly two dense
three-vertex arrays. Every vertex must use the canonical finite homogeneous
BigInt representation `(x, y, z, w)`, with positive `w`, greatest common divisor
one, and a defensive per-coordinate bit ceiling. Unknown properties, accessors,
non-plain objects, sparse or oversized arrays, noncanonical points, hostile
inspection failures, and zero-area triangles fail closed as bounded issues.
Property-key text included in a diagnostic path is capped at 128 code units per
segment, including hostile `Symbol` descriptions.

The bit and diagnostic ceilings bound this experiment call. They are not a
selected browser runtime profile or SupportProfile.

## Result meaning

The exact static result is one of:

- `disjoint`;
- `intersecting-coplanar`; or
- `intersecting-noncoplanar`.

Triangles are closed sets, so shared vertices, shared edge portions, tangency,
and other boundary contact count as intersection. The result deliberately does
not decide whether an intersection is a legal origami contact, forbidden
penetration, or an adjacency that should be excluded from collision testing.
Those policies need mesh identities, incidence, layer/contact semantics, and a
separate closed contract.

Every record fixes the candidate/no-claim flags: no packing or feasibility
decision, no continuous-time evaluation, no rigid-motion interval, no CCD, no
collision-free claim, no `verified`, and no global M0F `GO`.

## Exact method

The classifier uses homogeneous BigInt plane signs and 2D orientation signs.
Coplanar triangles are projected by dropping the dominant plane-normal axis and
checked as closed 2D triangles. For distinct planes, triangle edges are tested
against the other triangle's plane; crossing points are constructed exactly in
homogeneous coordinates and tested in a nondegenerate exact projection.

This is an independent TypeScript formulation. No third-party implementation
source is copied. The orientation-predicate formulation is informed by:

- Philippe Guigue and Olivier Devillers, “Fast and Robust Triangle-Triangle
  Overlap Test Using Orientation Predicates,” _Journal of Graphics Tools_ 8(1),
  2003: <https://doi.org/10.1080/10867651.2003.10487580>

## Bounded set ledger and independent pair audit

`static-rational-triangle-overlap-census.ts` supplies a separate fail-closed
set boundary. It canonicalizes caller-supplied stable triangle IDs and records
all unordered pair results under defensive 64-triangle/2,016-pair ceilings.
Its shared-vertex incidence labels are coordinate counts only, not mesh
topology or legal-contact decisions. See
[the census contract](static-rational-triangle-overlap-census-v1.md).

`reference-verifier/static-rational-triangle-overlap-audit.ts` independently
rechecks one complete producer record without importing this classifier, the
projective-rational kernel, or another geometry module. Its exact barycentric
feasibility method provides candidate consistency evidence only. See
[the independent audit contract](static-rational-triangle-overlap-audit-v1.md).

`reference-verifier/static-rational-triangle-overlap-census-audit.ts` derives
the complete canonical pair set from the supplied triangles and independently
replays every pair record, incidence label, and aggregate counter. It imports
the independent pair auditor but not this classifier, census, projective
kernel, or shared clone helper. See
[the whole-census audit contract](static-rational-triangle-overlap-census-audit-v1.md).

## Continuous-time boundary

The exact CCD construction described by Brochu, Edwards, and Bridson assumes
constant vertex velocity. Rigid-origami face motion is generally a nonlinear
rotation, so a static result—or linear interpolation of two static poses—cannot
certify the interval between those poses.

- Tyson Brochu, Essex Edwards, and Robert Bridson, “Efficient Geometrically
  Exact Continuous Collision Detection,” SIGGRAPH 2012:
  <https://www.cs.ubc.ca/~rbridson/docs/brochu-siggraph2012-ccd.pdf>

Required next work includes legal-contact semantics, incident-triangle
exclusions, conservative nonlinear-motion interval bounds, contact-event
subdivision, an independent audit of the implemented exact intersection-locus
constructor, external canonical mesh/triangulation provenance, Worker execution
evidence, and measured browser limits.
