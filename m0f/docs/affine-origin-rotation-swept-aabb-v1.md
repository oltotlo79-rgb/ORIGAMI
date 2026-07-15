# Affine-origin arbitrary-rotation swept AABB candidate v1

Status: exact, conservative broad-phase candidate for one primitive pair and
one dyadic time slab. It is not continuous collision detection, a collision
event test, a legal-contact policy, a full-model self-intersection result, a
product `verified` result, or evidence for a global M0F `GO`.

## Supported motion contract

The only supported discriminator is
`affine-origin-with-arbitrary-so3-rotation-enclosure-v1`. For every local point
`r` of a triangle, the world trajectory is

```text
x(t) = q(t) + R(t) r,
```

where `q(t)` is affine between the supplied exact projective-rational endpoint
origins `q0` and `q1`, and `R(t)` may be any member of `SO(3)` at every time in
the supplied canonical dyadic slab. The component does not sample, receive, or
validate a rotation path. This makes the bound deliberately loose, while
covering every rotation that satisfies the stated contract.

The motion family does not model a nonlinear origin path, a general chained
hinge transform, deformation, scaling, or reflection. A different bounded
motion-family token returns `indeterminate`; it is never silently approximated
by the supported family.

## Enclosure and local certificate

For each canonical local vertex `(x, y, z, w)`, the implementation computes
the exact affine rational radius

```text
rho = (|x| + |y| + |z|) / w.
```

For every `R` in `SO(3)` and coordinate `k`,
`|(R r)_k| <= ||r||2 <= ||r||1 = rho`. Each affine origin coordinate reaches
its extrema at an endpoint. The interval

```text
[min(q0_k, q1_k) - rho, max(q0_k, q1_k) + rho]
```

therefore encloses that rotated vertex for the complete slab. Taking the union
over all three vertices also encloses their convex hull, hence the closed rigid
triangle at every time.

Only strict exact separation of the two closed swept AABBs on one axis returns
`separated-by-certified-swept-aabb`. Its certificate records the canonical
primitive order, first separating axis in `x`, `y`, `z` order, and a positive
exact-rational gap. Boundary equality and every box overlap return
`swept-aabb-overlap-candidate`. An overlap candidate does not assert that the
triangles intersect.

The separation result is local to the named primitive pair, supplied slab, and
supported motion contract. It cannot become a model-wide collision-free result
without complete primitive-pair generation, complete time coverage, motion
binding, narrow-phase event handling, and legal-contact policy.

## Closed input and defensive ceilings

`classifyAffineOriginRotationSweptAabbV1` first applies an accessor-free,
closed, bounded parser. It requires two distinct stable ASCII IDs, two
nondegenerate canonical projective-rational local triangles, canonical endpoint
origins, and one canonical dyadic slab with `t0 < t1`. Pair order is
canonicalized by ID. Unknown properties, accessors, sparse arrays, non-plain or
hostile objects, noncanonical coordinates or dyadics, invalid IDs, degenerate
triangles, and values beyond the published limits fail atomically with bounded
issues and no partial classification.

The public defensive limits include 4,096 coordinate decimal digits, 16,384
coordinate bits, 1,024 time-numerator decimal digits, 4,096 time-numerator bits,
a 4,096 dyadic exponent, 128-code-unit IDs and motion tokens, 16 own properties
per inspected container, 32 issues, and a 131,072-bit intermediate arithmetic
budget. Exceeding the intermediate budget returns `indeterminate`; it is not
converted into separation or an overlap candidate. These are experiment
guards, not a browser SupportProfile or performance claim.

## Claim boundary and next work

Every result fixes `continuousCollisionDetectionIncluded`,
`collisionFreeClaim`, `legalContactClassificationIncluded`,
`penetrationClassificationIncluded`,
`selfIntersectionClassificationIncluded`, `verified`, `verifiedClaim`,
`scientificClaim`, and `globalM0fGo` to `false`.

The next collision work still needs a bound motion representation tied to
actual origami face trajectories, complete pair/slab coverage, a conservative
nonlinear vertex-face and edge-edge narrow phase, tangency and persistent
contact handling, an incidence-aware legal-contact policy, independent replay,
Worker cancellation, and measured Windows browser limits. See
`nonlinear-rigid-motion-ccd-research-v1.md` for those obligations.

`affine-origin-rotation-swept-aabb-census-v1.md` specifies a separate bounded
aggregator that visits every unordered pair in one supplied primitive set. Its
pair completeness is not source-bound model completeness and does not change
any of the remaining obligations above.
