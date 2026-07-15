# Static exact-rational triangle intersection-locus research v1

Status: research and candidate design note. The pair-level producer described
here has since been implemented; see
`static-rational-triangle-intersection-locus-v1.md`. An independent locus
audit, legal-contact policy, continuous-collision detector, and product
verification remain unimplemented.

## Decision

The smallest useful next slice is a pair-level constructor for the complete raw
intersection set of two nondegenerate closed projective-rational triangles at
one static configuration. Its canonical result shape should be exactly one of:

- `empty`, with zero vertices;
- `point`, with one vertex;
- `segment`, with two distinct ordered endpoints; or
- `coplanar-polygon`, with three through six strictly convex ordered vertices.

`point` and `segment` can arise from either coplanar or noncoplanar triangles,
so the shape alone is insufficient. The record also needs the exact supporting
plane relation: `coplanar`, `parallel-distinct`, or `intersecting-planes`.
`coplanar-polygon` is valid only with `coplanar`; `parallel-distinct` is valid
only with `empty`.

This is a raw geometry record. It may report a point, segment, or area polygon,
but it must not label that geometry as a shared hinge, penetration, legal
contact, or self-intersection. Those names belong to a later policy that is
bound to mesh identity and declared topology.

## Source facts and ORIGAMI inferences

The distinction is important because none of the cited algorithms validates
this proposed TypeScript/BigInt construction or its contract.

### Source facts

- Möller separates the noncoplanar case into the line where the two supporting
  planes intersect, computes one interval on that line for each triangle, and
  tests the two intervals for overlap. The paper projects the line onto a
  coordinate axis. It handles the coplanar case separately in 2D. Its published
  implementation uses a caller-selected epsilon near a plane and explicitly
  does not handle degenerate input triangles.
- Guigue and Devillers formulate a robust triangle-overlap predicate using
  signs of homogeneous orientation determinants and avoid explicit
  intersection-point construction. That supports the predicate foundation,
  but it does not supply the locus vertices required here.
- Sutherland and Hodgman describe an ordered polygon representation and
  repeated clipping against successive boundaries of a convex window. New
  vertices are introduced in sequence at clipping boundaries.
- Shewchuk demonstrates the role of exact arithmetic and exact orientation
  predicates in robust geometric algorithms. His expansion arithmetic is not
  the representation proposed here and no source code is copied.
- Lévy's exact mesh-CSG pipeline stores constructed intersection points in an
  exact representation and consumes them in later predicates and
  combinatorics. That is evidence that exact constructions matter downstream,
  not evidence of product readiness for ORIGAMI.

### ORIGAMI inferences and design choices

- For rational input, all required static intersections are rational, so the
  existing canonical finite homogeneous `BigInt` quadruple is closed under the
  proposed constructions.
- The intersection of two compact convex triangles is compact and convex. If
  their planes differ, it is a convex subset of a line and is therefore empty,
  a point, or a segment. If they are coplanar, exact convex clipping yields the
  same three lower-dimensional cases or an area polygon.
- Sequentially clipping a triangle by the three half-planes of another triangle
  can add at most one extreme vertex per stage. Therefore a normalized
  full-dimensional intersection polygon has at most six vertices.
- Closed-set geometry retains zero-sign boundary cases. No epsilon, snapping,
  symbolic perturbation, or inferred adjacency is appropriate in this static
  exact-rational slice.
- Canonical coordinates and canonical vertex order are needed so triangle
  permutation, pair swapping, Worker transfer, golden comparison, and
  independent replay do not create multiple encodings of the same locus.

## Proposed candidate contract

The exact field names can be finalized with implementation review, but the
semantic union should be closed and non-optional:

```ts
type LocusKind = 'empty' | 'point' | 'segment' | 'coplanar-polygon';

type SupportingPlaneRelation =
  | 'coplanar'
  | 'parallel-distinct'
  | 'intersecting-planes';

type StaticTriangleIntersectionLocusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-intersection-locus';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-static-configuration-of-two-closed-triangles';
  arithmetic: 'exact-projective-rational-bigint';
  supportingPlaneRelation: SupportingPlaneRelation;
  canonicalProjectionDropAxis: 'x' | 'y' | 'z' | null;
  locusKind: LocusKind;
  vertices: readonly ProjectivePoint3[];
  derivedStaticClassification:
    | 'disjoint'
    | 'intersecting-coplanar'
    | 'intersecting-noncoplanar';
  closedTrianglesIntersect: boolean;
  boundaryContactCountsAsIntersection: true;
  rawGeometricLocusIncluded: true;
  meshIdentityBindingIncluded: false;
  declaredHingePolicyIncluded: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  independentAuditIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  rigidMotionIntervalIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;
```

The implementation should expose a closed `unknown`-data API and may expose a
separate trusted-data API only for deeply frozen parser output. It should reuse
the static triangle input contract: two dense three-vertex arrays,
nondegenerate triangles, canonical finite projective points, positive weights,
and bounded coordinates. A cast TypeScript value is not trusted data.

`canonicalProjectionDropAxis` is non-null exactly when the supporting planes
are coplanar; it records the deterministic projection even when the resulting
locus is empty, a point, or a segment. It is null for both distinct-plane
relations.

The vertex list is useful positive witness data for a nonempty result. By
itself it is not a proof of completeness, and an empty list is not a proof of
disjointness. The independent replay below is therefore a required later stage.
The v1 record must also say that source/mesh identity and persisted evidence
binding are absent; caller-supplied census IDs cannot silently fill that gap.

## Canonical homogeneous vertices

The existing `ProjectivePoint3` representation is the right in-memory form:

```text
P = (x, y, z, w), w > 0, gcd(|x|, |y|, |z|, w) = 1
affine(P) = (x / w, y / w, z / w)
```

Every constructed point must immediately pass through
`canonicalProjectivePoint3`. This removes a common factor, makes the weight
positive, and gives one finite homogeneous representation independent of plane
orientation, edge direction, and input scale.

For an oriented homogeneous plane `pi` and finite segment endpoints `S` and
`E`, let the exact integer evaluations be `s = pi dot S` and `e = pi dot E`.
When the closed segment crosses or touches the plane, its intersection is:

```text
Q = canonical(s * E - e * S)
```

The expression applies component-wise to `x`, `y`, `z`, and `w`. It has exact
zero plane evaluation because `pi dot Q = s*e - e*s`. In a strict crossing the
endpoint signs are opposite; in a boundary transition one evaluation can be
zero and the canonical result is that endpoint. The constructor must never call
this formula for two zero evaluations or for a same-strict-side segment.

For coplanar projected clipping, choose retained coordinates `(u,v)` from the
existing axis-drop convention. The exact line evaluation for a directed clip
edge `C0 -> C1` is the homogeneous 2D determinant:

```text
l(P) = det([
  [C0.u, C0.v, C0.w],
  [C1.u, C1.v, C1.w],
  [ P.u,  P.v,  P.w],
])
```

A subject edge transition uses the same construction
`canonical(l(S) * E - l(E) * S)`. No affine division or floating-point
coordinate is required.

In-memory Worker messages may use deeply validated `BigInt` values. A future
persisted JSON evidence schema must encode each coordinate as a canonical
decimal string because JSON does not encode `BigInt`; that serialization and
its source binding are deliberately outside this first slice.

## Exact construction

### 1. Supporting-plane partition

1. Construct the exact plane of each already-validated nondegenerate triangle.
2. If every vertex of B has zero sign against A's plane, the triangles are
   `coplanar`.
3. Otherwise cross the two plane normals. A zero cross product means
   `parallel-distinct`, whose locus is `empty`.
4. A nonzero cross product means `intersecting-planes`; use the interval
   construction below.

This branch is exact. Near-coplanar rational input remains noncoplanar unless
its determinant is exactly zero.

### 2. Noncoplanar point or segment

For each triangle, slice it by the other triangle's plane:

1. retain each triangle vertex whose plane evaluation is zero;
2. for each of the three edges with strict opposite endpoint signs, construct
   the exact segment-plane point;
3. canonicalize and deduplicate all retained points; and
4. require the resulting slice to contain zero, one, or two points. More points
   are an internal invariant failure, not a result to truncate.

The two triangle slices lie on the same supporting-plane intersection line.
Sort each nonempty slice with the existing exact affine lexicographic point
comparison. Along one line that order is monotone because the first coordinate
that varies on the line is monotone. Intersect the two closed intervals by
taking the greater lower endpoint and lesser upper endpoint:

- lower greater than upper gives `empty`;
- equal endpoints give `point`; and
- lower less than upper gives `segment`.

Segment endpoints remain in increasing affine lexicographic order. This does
not depend on plane normal sign, triangle winding, edge direction, or which
triangle is called A.

This branch naturally covers distinct-plane degeneracies important to
origami: a shared vertex is a point, a declared-or-undeclared common hinge edge
is a segment, a vertex-on-face touch is a point, and a transverse crossing is a
segment. The geometry record does not assign policy meaning to any of them.

### 3. Coplanar convex clipping

Choose the projection axis by the largest absolute component of the canonical
plane normal, with the existing stable `x`, then `y`, then `z` tie order. That
component is nonzero, so dropping it is injective on the supporting plane.
Normalize both projected triangle windings to counterclockwise without
mutating caller input.

Use triangle A as the initial ordered subject and apply the three closed
counterclockwise half-planes of triangle B in sequence. For every subject edge
`S -> E`, exact line evaluations determine the standard four cases:

- inside to inside: emit `E`;
- inside to outside: emit the exact boundary point;
- outside to inside: emit the exact boundary point, then `E`; and
- outside to outside: emit nothing.

Inside includes zero. Thus a shared edge is preserved instead of perturbed or
dropped. Canonicalize each new point and remove consecutive duplicates after
every stage. After clipping by stage `k` in `1..3`, the deduplicated convex
sequence may contain at most `3 + k` vertices. A larger sequence is an internal
invariant failure.

After all three stages, normalize the result independently of clipping order:

1. deduplicate canonical equal points;
2. sort in exact projected lexicographic order;
3. run an exact monotone-chain convex hull using the projected orientation
   determinant and discard collinear interior points;
4. map zero, one, or two hull points to `empty`, `point`, or `segment`;
5. require an area hull to contain three through six vertices, keep it
   counterclockwise in the selected projected coordinates, and rotate it so
   the affine-lexicographically smallest 3D point is first; and
6. never repeat the first polygon vertex at the end.

The hull is normalization of the already-clipped points, not a replacement for
the clipping membership calculation. It makes containment, coincident
triangles, collinear boundary overlap, input reversal, and A/B swapping produce
one byte-stable geometric sequence.

## Required result invariants

A successful producer result must atomically establish all of these local
invariants before returning it:

- every vertex is finite, canonical, within the output bit cap, and deeply
  frozen;
- vertex counts are exactly `0`, `1`, `2`, or `3..6` for their respective kind;
- vertex lists contain no duplicates;
- segment endpoints are distinct and strictly affine-lexicographically ordered;
- a polygon is coplanar with both inputs, strictly convex after removal of
  collinear boundary points, counterclockwise in its declared projection, and
  canonically rotated;
- every returned vertex lies in both closed triangles by exact predicates;
- `closedTrianglesIntersect` is exactly `locusKind !== "empty"`;
- the derived old classifier result is `disjoint` for empty, otherwise
  `intersecting-coplanar` for `coplanar` and
  `intersecting-noncoplanar` for `intersecting-planes`;
- `parallel-distinct` cannot return a nonempty shape and
  `coplanar-polygon` cannot return a noncoplanar relation; and
- every legal-contact, penetration, self-intersection, continuous-time,
  collision-free, verification, scientific, and GO flag remains false.

If arithmetic, canonicalization, or an invariant check fails, return a bounded
failure with no partial locus. In particular, budget exhaustion is not
`empty`, Worker cancellation is not `disjoint`, and classifier disagreement is
not silently resolved in favor of either implementation.

## Shared hinges and legal-contact policy

The existing census incidence label counts shared canonical coordinates only.
It is not mesh topology. The locus constructor must likewise retain all raw
geometry and must not exclude a pair because it shares one, two, or three
vertices.

A later policy input needs at least stable source face identities, declared
edge/vertex incidence, the exact declared hinge segment, and the selected
contact rules. It can then ask separate questions such as whether an incident
pair's raw locus is exactly contained in its declared hinge or whether an extra
point/segment/area exists off that hinge. Nonincident boundary touch also
cannot automatically be renamed penetration; a chosen legal-contact model may
distinguish touch, crossing, overlap area, motion direction, and layer state.

Consequently:

- `shared-edge` plus `segment` is not enough to prove a legal hinge;
- a nonincident nonempty locus is not automatically forbidden penetration;
- a coplanar area polygon is raw overlap, not a layer-order decision; and
- an empty locus at one pose says nothing about the continuous fold interval.

This separation prevents a convenient adjacency heuristic from weakening the
requested actual 3D self-intersection check.

## Independent locus audit

The producer's clipping code and the current overlap classifier share the same
projective kernel, so agreement between them is useful regression evidence but
not independent replay. The next verifier should be an import-free module with
its own closed parser, rational arithmetic, rank computation, canonicalization,
and result contract.

The smallest mathematically different replay extends the current independent
barycentric idea. Use six nonnegative variables `alpha[0..2]` and
`beta[0..2]` with exact rational equations:

```text
sum(alpha) = 1
sum(beta)  = 1
sum(alpha[i] * A[i].x / A[i].w) = sum(beta[j] * B[j].x / B[j].w)
sum(alpha[i] * A[i].y / A[i].w) = sum(beta[j] * B[j].y / B[j].w)
sum(alpha[i] * A[i].z / A[i].w) = sum(beta[j] * B[j].z / B[j].w)
```

The displayed coordinates mean exact affine rationals, not raw homogeneous
numerators. Because each input triangle is nondegenerate, barycentric
coordinates inside that triangle are unique. The feasible polytope is therefore
affinely equivalent to the geometric intersection locus.

The auditor should exact-row-reduce the five-equation system to `r` independent
rows, enumerate every `r`-column subset whose resulting square matrix has
nonzero determinant, set nonbasic variables to zero, solve exactly, retain
nonnegative solutions that satisfy the original equations, map them to
canonical 3D points, and deduplicate degenerate bases. These basic feasible
points give the vertices of the bounded feasible polytope. The auditor then
independently derives the supporting-plane relation and canonical
point/segment/polygon order and compares every producer field and no-claim
flag.

This audit method neither calls nor imports the producer's edge-plane slicing,
2D clipping, projective kernel, or old overlap classifier. A valid but changed
producer record should yield a bounded semantic `inconsistent` result; malformed
input, resource exhaustion, or unexpected audit failure should yield a contract
failure with no decision. Even a `consistent` outcome remains candidate
evidence and cannot set `verified` or GO.

Persisted source coordinates, pair identity, revision/hash, producer version,
auditor version, and job identity still need an evidence-binding contract. The
pair audit alone does not prove that every face pair or every time interval was
covered.

## Defensive budgets and Worker boundary

The producer should start from the existing static parser ceilings and publish
every additional limit. A reasonable review baseline is:

- input coordinate magnitude: `16_384` bits;
- output homogeneous coordinate: `131_072` bits after canonicalization;
- intermediate arithmetic value: provisionally `524_288` bits;
- output vertices: `6`;
- issues: `32` for the producer and `64` for the independent auditor;
- own properties per closed container: the existing fixed contract ceiling;
- diagnostic property-key segment: `128` code units; and
- a fixed exact-operation counter in addition to bit ceilings.

The larger provisional intermediate ceiling allows for three sequential clip
stages whose unreduced expressions can grow even when the final canonical
edge-edge point is small. It is not a browser capacity claim. Implementation
review should derive a conservative expression-growth bound, check operands
before expensive operations where possible, check results after every exact
primitive, and lower or raise the provisional number only with measured
evidence. An over-limit call fails closed as `arithmetic-budget-exceeded` and
returns no shape.

Pair construction has fixed combinatorics, but hostile large `BigInt`
arithmetic and a future 2,016-pair census can still block the UI. App-facing
execution therefore belongs in a dedicated one-job Worker with:

- closed, bounded request and response protocols;
- source/job/revision identifiers checked at every relay;
- one construction job per Worker;
- `AbortSignal` cancellation implemented by terminating the Worker, including
  pre-abort and in-flight abort;
- no main-thread construction or fallback geometry/classifier path;
- no forced 30-second timeout; and
- bounded diagnostics and no partial success after cancellation.

The evidence path should eventually be two-stage: a producer Worker followed
by a separately bundled independent-audit Worker. The main thread only relays
the bound input and candidate record. Chromium, Edge, and Firefox real-browser
success/cancellation tests and measured work/memory/message ceilings are
required before selecting a SupportProfile.

## Test design

### Exact geometry fixtures

- parallel-plane disjoint and intersecting-plane but interval-disjoint cases;
- noncoplanar proper segment crossing;
- noncoplanar vertex-face, vertex-edge, and edge-edge point touches;
- distinct-plane shared vertex and full shared hinge edge;
- coplanar disjoint, vertex touch, vertex-on-edge touch, partial collinear edge
  overlap, and full shared edge;
- strict containment, identical triangles, and area intersections with three,
  four, five, and six canonical hull vertices;
- non-unit homogeneous weights, negative affine coordinates, and separations
  on the order of `2^-4096` within the accepted bit budget; and
- explicit arithmetic/output-limit failures with no partial record.

### Canonical and metamorphic checks

- all six permutations of each triangle and A/B swapping yield the same
  relation, shape, coordinates, and vertex sequence;
- equivalent rational components canonicalized by the kernel before entering
  the locus boundary yield the same result (the boundary itself still rejects
  noncanonical quadruples);
- exact rational translation and selected invertible axis permutations preserve
  the transformed locus set;
- every point is in both closed triangles, segment endpoints are ordered, and
  polygon turns are strictly positive in the declared projection;
- polygon count never exceeds six and no closing duplicate is present;
- empty/nonempty and coplanarity-derived classifications agree with the
  existing producer classifier across a deterministic rational corpus; and
- malformed arrays, degeneracy, unexpected keys, accessors, hostile Symbols,
  sparse arrays, oversized values, and revoked proxies fail closed.

Agreement with the old classifier is not an independent oracle. After the
import-free auditor exists, add exact differential corpora that compare full
canonical vertex sets, including rank-deficient and duplicate-basis cases, not
only the three-way overlap classification.

### Worker checks

- success for every locus kind;
- malformed protocol, source/job/revision mismatch, duplicate issue, and
  over-limit response rejection;
- pre-abort, in-flight abort, Worker error, and message-channel cleanup;
- no successful response after cancellation or disposal; and
- Chromium/Edge/Firefox real-browser structured-clone and termination tests.

## Smallest next code slice

Implement only these two files first:

1. `m0f/geometry/static-rational-triangle-intersection-locus.ts`
2. `tests/m0f/static-rational-triangle-intersection-locus.test.ts`

The module should reuse the validated static triangle boundary and existing
projective predicates/construction normalization, implement the supporting-plane
partition, interval intersection, closed convex clipping, canonical hull, fixed
record, and defensive arithmetic failures. It should not yet modify the census,
name a self-intersection, add a legal-contact exception, persist evidence, or
claim a Worker/browser limit.

The initial test file should include all hand-built shape and degeneracy cases,
permutation/A-B invariance, canonical ordering, classifier consistency,
hostile-input rejection, public-limit boundaries, and deep freeze. Before any
set-level integration, add the independent barycentric locus auditor and its
differential corpus. Before any UI call, add and browser-test the two-stage
Worker boundary.

The implementation remains a candidate even when every test passes. Global
M0F GO still requires declared legal-contact semantics, actual mesh/source
binding, complete pair coverage, nonlinear rigid-motion interval coverage,
independent persisted evidence, measured browser limits, and the existing
global gate.

## Primary references

- Tomas Möller, "A Fast Triangle-Triangle Intersection Test," _Journal of
  Graphics Tools_ 2(2), 1997:
  <https://doi.org/10.1080/10867651.1997.10487472>
- Philippe Guigue and Olivier Devillers, "Fast and Robust Triangle-Triangle
  Overlap Test Using Orientation Predicates," _Journal of Graphics Tools_ 8(1),
  2003: <https://doi.org/10.1080/10867651.2003.10487580>
- Ivan E. Sutherland and Gary W. Hodgman, "Reentrant Polygon Clipping,"
  _Communications of the ACM_ 17(1), 1974:
  <https://doi.org/10.1145/360767.360802>
- Jonathan Richard Shewchuk, "Adaptive Precision Floating-Point Arithmetic and
  Fast Robust Geometric Predicates," _Discrete & Computational Geometry_
  18(3), 1997: <https://people.eecs.berkeley.edu/~jrs/papers/robustr.pdf>
- Bruno Lévy, "Exact Predicates, Exact Constructions and Combinatorics for Mesh
  CSG," _ACM Transactions on Graphics_ 44(5), 2025:
  <https://doi.org/10.1145/3744642>
