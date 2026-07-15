# Nonlinear rigid-motion CCD research candidate v1

Status: research and next-slice contract only. This document does not provide a
continuous-collision detector, a collision-free result, a legal-contact
classifier, a product `verified` result, or evidence for a global M0F `GO`.

The immediate recommendation is an independently implemented, exact-rational
swept-AABB culler for one deliberately narrow rigid-motion family. It is a
broad-phase feasibility component, not CCD. A later nonlinear event solver
must build on a convergent motion enclosure and return indeterminate results
when subdivision or arithmetic budgets are exhausted.

## Research boundary

Only author-hosted papers, publisher/project pages, and the ECMAScript standard
are used as source material below. Source facts and ORIGAMI design inferences
are kept separate. No implementation source from a paper or research project
is to be copied. The proposed TypeScript and BigInt arithmetic are to be
written independently under this repository's MIT license.

The research questions are:

1. why constant-vertex-velocity CCD cannot be reused for nonlinear rigid
   folding;
2. what swept bounds are available for rotations and screw motion;
3. whether interval branch-and-bound can retain vertex-face and edge-edge
   events, including tangencies;
4. where the existing static exact predicates can be connected;
5. why legal contact must remain a separate policy; and
6. what can actually be claimed under finite browser work caps.

## Primary-source facts

The following are source facts, not claims about the current repository.

### S1. Constant-velocity triangle CCD

Brochu, Edwards, and Bridson formulate point-triangle and segment-segment CCD
with each vertex moving at constant velocity and each triangle linearly
interpolated during a time step. The resulting point-triangle map is
tri-affine in time and two barycentric coordinates. Their method evaluates root
parity and exact boundary predicates rather than constructing every root.

Wang et al. later report benchmark cases in which root parity cannot distinguish
zero roots from two roots, and they identify degeneracies not handled by the
2012 reference algorithm. Their inclusion method is instead based on a
convergent range enclosure and subdivision. Its particularly tight eight-corner
box follows from the linear-trajectory and bilinear structure of its event
maps; that derivation is not stated for nonlinear trajectories. When its work
limit is reached it can retain a conservative earlier interval, but it may no
longer meet the requested time accuracy.

- Tyson Brochu, Essex Edwards, and Robert Bridson, “Efficient Geometrically
  Exact Continuous Collision Detection,” SIGGRAPH 2012:
  <https://www.cs.ubc.ca/~rbridson/docs/brochu-siggraph2012-ccd.pdf>
- Bolun Wang et al., “A Large Scale Benchmark and an Inclusion-Based Algorithm
  for Continuous Collision Detection,” ACM Transactions on Graphics 2021:
  <https://cims.nyu.edu/gcl/papers/2021-CCD.pdf>
- Tight Inclusion author project page:
  <https://continuous-collision-detection.github.io/tight_inclusion/>

### S2. General interval collision methods

Snyder et al. apply inclusion functions, subdivision, tangency conditions, and
interval Newton methods to time-dependent parametric and implicit surfaces.
Their method can retain multiple contacts and contact regions. Interval Newton
can contract or reject a candidate region, but ineffective contraction still
requires subdivision. Their geometric collision computation is separate from
the physical collision response.

- John M. Snyder et al., “Interval Methods for Multi-Point Collisions between
  Time-Dependent Curved Surfaces,” SIGGRAPH 1993:
  <https://www.microsoft.com/en-us/research/wp-content/uploads/2017/01/p321-snyder.pdf>

### S3. Rigid-body trajectories and curved CCD

Rigid IPC interpolates rigid generalized coordinates, producing curved point
trajectories through a rotation map. It uses interval arithmetic for
conservative broad-phase trajectory boxes. Its curved narrow phase bounds the
deviation between a curved trajectory and a chord, then reduces a query to
linear CCD with minimum separation and adaptive subdivision. The paper also
describes direct multivariate interval root finding as conservative but
expensive and discusses univariate rigid-motion formulations as vulnerable to
degenerate or spurious roots.

The guarantees and progress assumptions of the complete Rigid IPC simulation
algorithm depend on its own barrier method, line search, motion parameterization,
and linear minimum-separation CCD. Those assumptions are not a generic result
for an origami path validator.

- Zachary Ferguson et al., “Intersection-free Rigid Body Dynamics,” ACM
  Transactions on Graphics 2021, author project and paper:
  <https://ipc-sim.github.io/rigid-ipc/>
  <https://ipc-sim.github.io/rigid-ipc/assets/rigid_ipc_paper.pdf>
- Adobe Research publication page:
  <https://research.adobe.com/publication/intersection-free-rigid-body-dynamics/>

### S4. Screw-motion and toleranced-motion alternatives

Redon, Kheddar, and Coquillart present continuous collision detection for
polyhedral rigid bodies with first-contact computation built into the method.
The later Rigid IPC comparison characterizes this family as a lower-dimensional
univariate rigid/screw-motion route and notes its degeneracy costs.

Schröcker, Jüttler, and Pottmann represent a toleranced motion by covered
regions in affine-displacement space. They derive simple orbit bounds and
propose motion subdivision with bounding balls that can certify no collision.

- Stéphane Redon, Abderrahmane Kheddar, and Sabine Coquillart, “Fast Continuous
  Collision Detection between Rigid Bodies,” Computer Graphics Forum 2002,
  publisher record:
  <https://onlinelibrary.wiley.com/doi/abs/10.1111/1467-8659.t01-1-00587>
- Hans-Peter Schröcker, Bert Jüttler, and Helmut Pottmann, “Guaranteed Collision
  Detection With Toleranced Motions,” 2013 author preprint record:
  <https://arxiv.org/abs/1310.8097>

### S5. Static exact predicates

Shewchuk's adaptive orientation predicates compute determinant signs robustly,
including cases where ordinary floating-point evaluation has the wrong sign.
Guigue and Devillers express a static triangle-triangle overlap test using
orientation predicates. These are fixed-configuration predicates; neither
source turns an arbitrary nonlinear rigid trajectory into a continuous proof.

- Jonathan Richard Shewchuk, “Fast Robust Predicates for Computational
  Geometry,” author page:
  <https://www.cs.cmu.edu/~quake/robust.html>
- Philippe Guigue and Olivier Devillers, “Fast and Robust Triangle-Triangle
  Overlap Test Using Orientation Predicates,” Journal of Graphics Tools 2003,
  publisher record:
  <https://www.tandfonline.com/doi/abs/10.1080/10867651.2003.10487580>

### S6. Browser transcendental functions

ECMAScript specifies `Math.sin` and `Math.cos` results as
implementation-approximated Number values. It does not define a common,
correctly-rounded transcendental algorithm on which an interval proof can
silently rely.

- ECMA-262, Numbers and Dates, `Math.sin` and `Math.cos`:
  <https://tc39.es/ecma262/2025/multipage/numbers-and-dates.html>

## ORIGAMI design inferences

Everything in this section is a local design inference from the source facts
and the current exact-rational static modules. It is not a claim made by the
papers.

### Why the Brochu construction is not directly reusable

For affine vertex motion,

```text
x_i(t) = (1 - t) x_i(0) + t x_i(1),
```

the vertex-face and edge-edge maps have the multi-affine structure used by the
Brochu and Tight Inclusion derivations. Under a rigid rotation,

```text
x_i(t) = q(t) + R(t) r_i,
```

a point normally follows an arc or helix. Even if the angle or rotation vector
is affine in `t`, the matrix entries and point coordinates are not affine in
`t`. Consequently:

- the linear endpoint interpolation is a different motion, not a conservative
  representation of the rigid path;
- the cubic coplanarity and root-parity construction cannot simply be applied
  to the curved path;
- the eight-corner Tight Inclusion box is not established for the nonlinear
  event map; and
- exact static signs at two endpoints say nothing about an event between them.

A nonlinear method may reuse the *event parameterization* and the principle of
discarding only certified root-free domains. It may not reuse the linear-motion
proof without a new convergent enclosure proof.

### Comparison of candidate routes

| Route | Primary-source fact | ORIGAMI inference |
| --- | --- | --- |
| Constant-velocity exact/parity CCD | Brochu assumes linearly moving vertices; Wang et al. report even-root and degeneracy limitations. | Do not bind a rigid fold to this route. It remains useful background for exact predicates and linear subqueries only. |
| Constant screw/univariate interval CCD | Redon computes first contact for rigid bodies; Rigid IPC describes the formulation as lower-dimensional and potentially degenerate. | Potentially efficient for one precisely specified screw segment. It does not cover an arbitrary composed hinge path, and every spurious/infinite-root case needs a fail-closed outcome. |
| Direct nonlinear multivariate interval branch-and-bound | Snyder supports general time-dependent surfaces; interval inclusion can reject boxes and interval Newton can contract them. | Most general eventual route if a convergent outward-rounded motion oracle is implemented. The three-dimensional event domain is expensive, and grazing/contact manifolds may not isolate under ordinary bisection. |
| Curved-to-linear envelope plus minimum-separation CCD | Rigid IPC bounds curved/chord deviation and invokes linear minimum-separation CCD adaptively. | Attractive after ORIGAMI owns both a certified chord-error enclosure and a trusted linear MSCCD. Neither prerequisite currently exists, and Rigid IPC's barrier-specific progress shortcut must not be inherited. |
| Bounding balls or swept AABBs | Toleranced-motion work uses subdivision and bounding balls for no-collision guarantees; Rigid IPC uses conservative interval trajectory boxes in broad phase. | Best next feasibility slice. A separated bound can safely cull a primitive pair; overlapping bounds remain unknown and are not a collision event. |
| Static exact triangle overlap | Shewchuk and Guigue/Devillers support exact fixed-pose sign decisions. | Use at exactly representable endpoints and for static degeneracy checks. Do not coerce irrational rotated coordinates to rationals and call the rounded pose exact. |

The recommended sequence is therefore:

1. exact-rational swept-bound culling for a narrow motion family;
2. an independently tested outward interval arithmetic layer and motion
   enclosure;
3. nonlinear vertex-face/edge-edge candidate subdivision;
4. optional interval-Newton or other root-existence refinement;
5. independent replay and a separate legal-contact policy; and only then
6. measured evidence for any wider collision claim.

## Implemented minimal code slice: exact affine-origin swept AABB

The implementation described by this research is now present as
`m0f/geometry/affine-origin-rotation-swept-aabb.ts`, with its contract in
`m0f/docs/affine-origin-rotation-swept-aabb-v1.md`. It remains a broad-phase
candidate only.

### Supported motion family

For each primitive, accept exact local vertices `r_j`, an exact world-space
origin at each slab endpoint `q0` and `q1`, and the contract

```text
x_j(t) = q(t) + R(t) r_j
q(t)   = (1 - s) q0 + s q1,  s in [0, 1]
R(t)   is any member of SO(3)
```

over one exact dyadic time slab. No rotation samples, angle, `Math.sin`, or
`Math.cos` are needed. Treating `R(t)` as any rotation makes the result loose,
but covers nonlinear angle variation, constant screw rotation with affine
origin translation, and all intermediate orientations for this one-body
contract.

This family does **not** cover a face whose chosen origin follows an unbounded
or merely sampled nonlinear path. In particular, simultaneous/chained hinge
rotations generally compose transforms and need a separate interval transform
bound. Such input must return `unsupported-motion-family`, not be silently
approximated as affine.

### Exact enclosure

For local vertex `r = (rx, ry, rz)`, define the exact rational radius

```text
rho(r) = |rx| + |ry| + |rz|.
```

For every rotation `R`,

```text
|(R r)_k| <= ||R r||_2 = ||r||_2 <= ||r||_1 = rho(r).
```

Because each component of affine `q(t)` reaches its extrema at a slab endpoint,
the following closed interval encloses coordinate `k` of the vertex for the
whole slab:

```text
[min(q0_k, q1_k) - rho(r), max(q0_k, q1_k) + rho(r)].
```

Union the three vertex boxes for a triangle. A rigid triangle at each instant
is the convex hull of its vertices, so it remains inside that box. If the two
primitive boxes are strictly disjoint on any axis, their closed triangles
cannot meet anywhere in the slab. Equality is not separation: touching box
boundaries must remain an overlap candidate.

This proof uses only rational comparison, absolute value, addition, and
subtraction. It therefore avoids an unproved cross-browser transcendental
rounding assumption. The L1 radius is intentionally looser than an algebraic
Euclidean radius; avoiding a square root keeps the first slice exact and small.

### Closed input boundary

The parser should accept one dense pair of triangle records with:

- stable body, face, and triangle IDs;
- exactly three canonical projective-rational local vertices per triangle;
- canonical exact `q0` and `q1` points;
- one canonical dyadic slab with `t0 < t1`;
- the literal motion family/version discriminator; and
- explicit arithmetic and diagnostic ceilings owned by the experiment.

Unknown keys, accessors, proxies that throw during inspection, non-plain
records, sparse arrays, duplicate IDs, noncanonical rationals, invalid dyadics,
zero-area local triangles, or input beyond a defensive ceiling must fail
closed. Programmatic constructors that bypass this parser are trusted internal
APIs, not hostile-input boundaries.

No caller callback may supply a supposedly conservative box. A bound supplied
without a proof-carrying contract would only move the unsoundness to the
caller.

### Proposed result union

Names are candidates for the implementation review; their semantics are the
important part.

```ts
type AffineOriginSweptAabbResultV1 =
  | {
      status: "separated-by-certified-swept-aabb";
      slab: DyadicTimeSlabV1;
      bounds: readonly [ExactAabb3V1, ExactAabb3V1];
      certificate: {
        axis: "x" | "y" | "z";
        order: "a-before-b" | "b-before-a";
        strictGap: CanonicalRationalV1;
      };
      pairSlabSeparationCertified: true;
      continuousCollisionDetectionIncluded: false;
      collisionFreeClaim: false;
      legalContactPolicyIncluded: false;
      verified: false;
      globalM0fGo: false;
      scientificClaim: false;
    }
  | {
      status: "swept-aabb-overlap-candidate";
      slab: DyadicTimeSlabV1;
      bounds: readonly [ExactAabb3V1, ExactAabb3V1];
      pairSlabSeparationCertified: false;
      continuousCollisionDetectionIncluded: false;
      collisionFreeClaim: false;
      legalContactPolicyIncluded: false;
      verified: false;
      globalM0fGo: false;
      scientificClaim: false;
    }
  | {
      status: "indeterminate";
      reason:
        | "invalid-input"
        | "unsupported-motion-family"
        | "arithmetic-budget-exhausted"
        | "bound-construction-failed";
      pairSlabSeparationCertified: false;
      continuousCollisionDetectionIncluded: false;
      collisionFreeClaim: false;
      legalContactPolicyIncluded: false;
      verified: false;
      globalM0fGo: false;
      scientificClaim: false;
    };
```

`separated-by-certified-swept-aabb` means only that this one closed primitive
pair is separated on this one bound motion slab. It is not full-model CCD and
cannot be promoted to a global collision-free result unless a later layer proves
complete pair generation, complete time coverage, motion binding, and policy
coverage.

### Minimum tests for the slice

- exact separation of stationary primitives;
- separation caused by strictly disjoint swept boxes;
- endpoint-disjoint primitives whose conservative boxes overlap, producing
  `swept-aabb-overlap-candidate`;
- exact boundary equality retained as overlap candidate;
- containment of sampled rotations as a regression check, clearly not the
  mathematical proof;
- pair-order symmetry and deterministic certificate-axis tie breaking;
- large exact rational values at and beyond the arithmetic ceiling;
- malformed, sparse, accessor-bearing, unknown-key, and noncanonical inputs;
- explicit rejection of a chained or nonlinear-origin motion family; and
- result-flag tests on every success and failure branch.

## Later nonlinear event subdivision

This section is a subsequent contract sketch, not part of the minimal code
slice.

### Vertex-face and edge-edge equations

For moving points `p_i(t)`, a vertex-face candidate is a zero of

```text
F_vf(t, a, b) = p0(t)
  - ((1 - a - b) p1(t) + a p2(t) + b p3(t)),

t in [t0, t1], a >= 0, b >= 0, a + b <= 1.
```

An edge-edge candidate is a zero of

```text
F_ee(t, a, b) = (1 - a) p0(t) + a p1(t)
  - ((1 - b) p2(t) + b p3(t)),

t in [t0, t1], a in [0, 1], b in [0, 1].
```

The equations are valid for nonlinear `p_i(t)`, but their convenient
multi-affine range bound is not. A later solver needs a convergent inclusion
function for each moving point and for the composed event map.

### Branch-and-bound rules

1. Begin with the complete constrained event domain.
2. Compute an outward inclusion of all three components of `F`.
3. Discard a box only when at least one component interval excludes zero.
4. Never rely only on endpoint sign changes; tangent and even-multiplicity roots
   must remain candidates.
5. Split time and barycentric dimensions deterministically. Clip or cover the
   triangular vertex-face barycentric domain without dropping its boundary.
6. Process by nondecreasing time lower bound if an earliest interval is needed.
7. Treat `0 in box(F)` only as a possible root. It is not an existence proof.
8. Return a candidate interval at the requested resolution. Use interval Newton
   or another proved existence test before introducing any
   `event-existence-certified` variant.
9. Detect persistent shared-feature/coplanar regions as contact-manifold
   candidates where possible. Otherwise a cap produces indeterminate, never
   separated.

The motion oracle is the central proof boundary. For a single screw segment it
may use an independently implemented directed interval enclosure of the
trigonometric terms. For composed hinge rotations it must enclose the complete
matrix/quaternion composition or subdivide a separately specified path. Plain
`Math.sin`/`Math.cos` plus an assumed number of ULPs is not a portable proof.

### Fail-closed later result categories

```text
slab-separated
event-candidate
initial-static-intersection
contact-manifold-candidate
time-resolution-exhausted
work-budget-exhausted
unsupported-motion
numeric-enclosure-failure
invalid-input
cancelled
```

Only `slab-separated` may carry a local separation certificate, and only for
the exact primitive pair, time slab, and motion binding named by that
certificate. `event-candidate` does not assert that a root exists.
`initial-static-intersection` may assert a static closed-set intersection when
the existing exact-rational predicate applies, but it still says nothing about
whether that contact is legal.

## Static exact predicate connection

The existing projective-rational and static triangle-overlap candidates are
valuable at a deliberately narrow seam:

- validate exact rational geometry at `t0` before motion;
- classify exact rational endpoint poses when their transform matrices and
  resulting coordinates are themselves exactly representable;
- evaluate determinant signs for an exactly representable subdivision boundary;
  and
- independently check static fixtures and degeneracies.

An arbitrary rotated point normally has irrational coordinates. Rounding such a
point to a rational and invoking the static exact classifier would exactly
classify the rounded geometry, not the intended pose. For interval poses, an
interval determinant may safely reject a sign only when its enclosure excludes
zero. If zero remains included, the result remains unresolved unless a valid
exact symbolic fallback exists for that expression.

Thus the static classifier is an endpoint/degeneracy oracle and independent
cross-check, not a substitute for the continuous enclosure.

## Legal contact remains a separate policy

Geometry should operate on closed sets. Shared vertices, shared edge portions,
tangency, and coplanar overlap are geometric intersections. Origami legality
depends on facts not present in a primitive event equation:

- mesh identity and incidence;
- the declared shared hinge or feature locus;
- whether intersection extends beyond that locus;
- face-side, layer-order, and thickness semantics;
- allowed final contact versus forbidden path penetration; and
- treatment of imported `.fold` identities and edited M/V assignments.

Blanket removal of every adjacent triangle pair is unsound: adjacent faces can
intersect away from their declared shared hinge. Conversely, reporting every
shared hinge as a forbidden collision rejects the intended model.

The collision layer should therefore emit closed geometric evidence with
stable feature IDs. A separate policy layer may return `allowed`, `forbidden`,
or `unclassified`, with `unclassified` failing closed for any global acceptance
gate. Neither layer should overwrite the other's result.

## Termination, completeness, and finite browser caps

### Conditional soundness argument

The minimal swept-AABB slice has a small conditional proof:

1. the parsed local vertices and affine origin endpoints denote the motion
   contract exactly;
2. the L1 inequality encloses every possible rotation of each vertex;
3. endpoint extrema enclose the affine origin path;
4. the union box encloses every triangle point at every slab time; and
5. strict exact AABB separation therefore implies pair/slab separation.

This proves no more than the returned local certificate. Complete-model
collision culling additionally requires every relevant primitive pair and every
motion slab to be covered without an unsupported binding.

### Later branch-and-bound obligations

A nonlinear candidate solver has no-false-negative behavior only if all of the
following hold:

- its point-motion inclusion encloses the specified trajectory with outward
  rounding;
- its event-map inclusion is convergent and preserves all domain boundaries;
- broad-phase culling is itself conservative;
- every relevant vertex-face and edge-edge pair is generated;
- a domain is called separated only when interval exclusion proves it;
- initial intersections and persistent contact manifolds are retained; and
- every cap, cancellation, enclosure failure, or unsupported motion returns an
  unresolved/candidate result.

Finite subdivision alone does not guarantee an exact yes/no decision for
grazing roots, multiple roots, or a continuum of shared contact. Root-existence
or degeneracy-specific logic is needed to turn some candidates into certified
events. Until then, treating candidates as blockers gives a conservative
workflow but can create false positives.

### Proposed experiment caps, not a SupportProfile

The following are starting defensive ceilings for later Worker measurements,
not supported-runtime claims:

```text
maxVisitedBoxes  = 65,536
maxPendingBoxes  = 8,192
maxDepth         = 32
maxEventIntervals = 256
maxIssues        = 256
```

Input decimal/bit ceilings should initially inherit the exact-rational
experiment boundary rather than introducing an unmeasured larger allowance.
Every cap must be injectable at a lower value for deterministic tests. Reaching
any cap returns `work-budget-exhausted` or `time-resolution-exhausted` with all
global claim flags false.

Run nonlinear subdivision in a Worker and support explicit cancellation. A
wall-clock timeout is an operational guard, not a mathematical stopping rule;
browser scheduling differences make it unsuitable for a deterministic proof.
The user may allow work beyond 30 seconds, but no duration, memory, or browser
support claim is justified before a measured Windows browser matrix. An
independent replay Worker remains later work.

## Free and redistributable implementation boundary

The minimal slice requires no paid service, network call, native binary, or new
runtime dependency. Canonical rational arithmetic can use the platform BigInt
already used by the repository, so the Web/PWA can remain locally runnable and
redistributable to other Windows PCs.

Research-paper access is not a license to copy an accompanying implementation.
Equations and proof obligations in this document guide a clean, independently
written implementation. If a third-party interval, exact-predicate, or CCD
library is considered later, its source license, transitive dependencies,
Web/Worker compatibility, and redistribution terms require a separate review.

## Exit criteria before calling any later component CCD

Do not rename a component to CCD, set `collisionFreeClaim: true`, set
`verified: true`, or contribute to a global M0F `GO` until at least:

- a rigid-fold motion contract is closed and bound to actual face trajectories;
- the motion and event inclusion functions have reviewed enclosure and
  convergence arguments;
- vertex-face and edge-edge domains, boundaries, and degeneracies are covered;
- all budget/cancellation paths are demonstrably fail-closed;
- static exact and continuous interval seams are independently tested;
- legal-contact policy is specified and replayable;
- complete pair/time coverage is audited; and
- browser work and memory caps are measured on the claimed Windows matrix.

The implemented swept-AABB slice deliberately satisfies none of those
product-level exit criteria by itself.
