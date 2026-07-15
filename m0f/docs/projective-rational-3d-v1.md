# Exact projective-rational 3D predicate candidate v1

Status: candidate feasibility component only. This module supplies exact static
sign predicates for later M0F collision experiments. It is not a triangle
contact classifier, a continuous-collision detector, a rigid-fold path checker,
or evidence that any crease pattern is collision-free.

## Representation

A finite 3D point is represented by four canonical `BigInt` coordinates
`(x, y, z, w)` with `w > 0` and greatest common divisor one. This homogeneous
form keeps decimal-rational input exact without choosing a floating-point
tolerance. The closed decimal parser rejects noncanonical text, unsupported
keys, non-finite values, and inputs beyond its defensive budget of 4,096
decimal digits per numerator or denominator. Property-key text included in a
diagnostic path is capped at 128 code units per segment, including hostile
`Symbol` descriptions. Unknown caller data must enter through that parser. The
typed programmatic constructors accept unbounded `BigInt` values and are a
trusted internal API, not a hostile-input boundary.

## Candidate operations

- canonical construction and exact projective-point equality;
- lexicographic comparison of the represented affine coordinates;
- exact four-point orientation sign;
- an exact homogeneous plane through three points;
- exact point-versus-plane sign; and
- exact 2D orientation after dropping one selected axis.

Degenerate inputs produce a zero sign where that is the mathematical sign
predicate result. The oriented-plane constructor instead rejects three
collinear points with a fixed `RangeError`; callers must handle that condition
at their own closed boundary.

## Scope boundary

These operations are static algebraic predicates. They do not distinguish legal
boundary contact from penetration, construct an overlap region, classify two
triangles, interpolate a fold, or prove anything over a time interval. The
Brochu--Edwards--Bridson exact CCD formulation is useful evidence for exact sign
evaluation, but its derivation assumes vertices with constant velocity. A rigid
origami rotation is generally nonlinear in time, so that method cannot be
treated as a ready-made rigid-fold CCD proof.

The implementation is an independent TypeScript formulation; no third-party
source code is copied. Mathematical references:

- Philippe Guigue and Olivier Devillers, “Fast and Robust Triangle-Triangle
  Overlap Test Using Orientation Predicates,” _Journal of Graphics Tools_ 8(1),
  2003: <https://doi.org/10.1080/10867651.2003.10487580>
- Tyson Brochu, Essex Edwards, and Robert Bridson, “Efficient Geometrically
  Exact Continuous Collision Detection,” SIGGRAPH 2012:
  <https://www.cs.ubc.ca/~rbridson/docs/brochu-siggraph2012-ccd.pdf>

## Still unresolved

- source/evidence-bound independent replay of a complete triangle-set census;
- legal-contact versus forbidden-penetration semantics;
- conservative bounds for nonlinear rigid motion over an interval;
- contact-event subdivision and overlap-region construction;
- identity and adjacency rules for incident triangles; and
- measured browser work, memory, and message limits.

No successful result from this module can set `scientificClaim: true`, select a
SupportProfile, or contribute a product-level `verified` outcome by itself.
