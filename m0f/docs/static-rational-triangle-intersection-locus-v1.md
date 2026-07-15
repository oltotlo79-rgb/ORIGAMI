# Static exact-rational triangle intersection-locus candidate v1

Status: exact raw geometry for two nondegenerate closed triangles at one static
configuration. This component does not decide declared adjacency, legal
contact, penetration, self-intersection, continuous time, CCD, collision
freedom, product `verified`, or global M0F `GO`.

## Closed input and exact construction

`constructStaticRationalTriangleIntersectionLocusV1` reuses the closed hostile
input parser of the static triangle-overlap classifier. Accepted vertices are
canonical finite projective-rational `BigInt` points. Accessors, sparse or open
containers, noncanonical points, degenerate triangles, hostile proxies, and
input resource-limit violations fail atomically without a locus.

The constructor computes exact supporting planes and records one of
`coplanar`, `parallel-distinct`, or `intersecting-planes`. Distinct planes use
the exact closed interval intersection of the two triangle-plane slices.
Coplanar triangles use exact closed convex clipping in the injective dominant
axis projection, followed by a canonical convex hull.

## Canonical result

The raw locus is exactly one of:

- `empty`, with no vertices;
- `point`, with one canonical vertex;
- `segment`, with two distinct affine-lexicographically ordered endpoints; or
- `coplanar-polygon`, with three through six strictly convex counterclockwise
  vertices, rotated to a canonical first vertex.

Every emitted point is checked against both supporting planes and both closed
triangles. Boundary touch is retained. The record derives the existing static
three-way overlap classification from the locus, but does not import or invoke
that classifier after parsing.

## Defensive arithmetic boundary

The candidate counts exact producer-level arithmetic operations and rejects
intermediate values above 524,288 bits, output coordinates above 131,072 bits,
or more than 4,096 counted exact operations. At most six output vertices are
accepted. These are pair-level experiment guards, not browser measurements or
a product SupportProfile.

Tests cover every locus kind, all polygon sizes from three through six,
parallel and intersecting disjoint planes, vertex/edge/face boundary contact,
containment, coincidence, non-unit homogeneous weights, all input
permutations, A/B exchange, canonical order, hostile input, limits, deep
freeze, and fixed negative claim fields. Deterministic regression additionally
compares 300 integer and 120 non-unit-weight rational pairs with the existing
static classifier. That comparison is regression evidence only, not an
independent audit.

## Remaining boundary

The output has no canonical mesh/source identity, declared hinge or incidence
policy, independent locus verifier, saved-result binding, Worker execution
record, or time interval. A later policy layer must distinguish allowed
adjacent-face contact from prohibited nonincident intersection. Nonlinear
rigid-motion event subdivision and narrow-phase CCD remain required before any
self-intersection or collision-free conclusion.

The design rationale and primary references are recorded in
`static-rational-triangle-intersection-locus-research-v1.md`.
