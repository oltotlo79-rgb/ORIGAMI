# Single-hinge exact rigid-pose transition candidate v1

Status: exact endpoint proof for one declared dual-bridge hinge step. It proves
that two accepted complete 3D pose bindings differ by one common
orientation-preserving rotation about the fixed hinge axis. It does not choose
an angle branch or winding, construct the intermediate trajectory, perform
nonlinear CCD, decide legal contact or self-intersection, establish collision
freedom, verify a product result, or imply global M0F `GO`.

## Closed composition contract

`bindSingleHingeRigidPoseTransitionV1` accepts stable transition, step,
active-edge, and moving-side IDs; one canonical dyadic slab; and complete start
and end inputs for `bindStaticRationalTrianglePoseToFoldMeshV1`. Unknown fields,
accessors, invalid IDs, non-plain objects, revoked proxies, malformed slabs, and
either failed pose binding reject the whole transition. Diagnostics are mapped
back to the caller's start, end, or slab path. Returned records are owned and
deeply frozen.

The start pose is also passed through the single-hinge swept-AABB step. This
requires exactly one declared hinge segment for the active source-face pair,
requires that adjacency to be a bridge in the source-face dual graph, and
derives both face components rather than accepting caller component lists.

Start and end bindings must have matching mesh and triangulation revision
labels and exact equality of all retained topology ledgers: vertex IDs; edge
IDs, assignments, structural kinds, vertex pairs, and incident faces; face
triangle and boundary-edge lists; triangle/face/vertex identity; and every
unordered topology-pair row. Coordinate-coincidence counts may change with the
pose and are not treated as topology.

These are still caller revision labels. The component does not compare an
external canonical reconstruction byte stream or bind it with a cryptographic
source hash, and its record fixes both stronger claims to false. Each endpoint
binding separately checks its supplied reconstruction against its supplied 3D
pose, including exact source-face metric rigidity and coplanarity.

## Exact fixed-axis proof

Let ordered hinge endpoints be `A` and `B`, axis direction `D = B - A`, and
`L = D dot D`. The exact mesh binding guarantees `L > 0`. Every stationary
component vertex, including the hinge endpoints, must have the identical
canonical projective-rational point in both poses. The complete ordered hinge
segment is checked again explicitly.

For every moving vertex, let `u` and `v` be its start and end offsets from `A`.
The verifier first requires the same exact axial coordinate:

`u dot D = v dot D`.

It then removes the axial component to obtain `U` and `V`. Their exact squared
radii must match. A point on the axis must remain the same point. For every
off-axis point with `R = U dot U`, the verifier derives

`c = (U dot V) / R`

and

`h = D dot (U cross V) / (L R)`.

Here `c` is the rotation cosine and `h` is the oriented sine divided by the
axis length. It requires the exact unit identity

`c*c + L*h*h = 1`

and independently substitutes the values into the rational Rodrigues endpoint
equation

`V = c U + h (D cross U)`.

Every off-axis moving vertex must yield exactly the same reduced `c` and `h`.
This proves one common orientation-preserving axis rotation for the complete
derived moving component, rather than merely checking each source face for
rigidity. Identity and half-turn endpoints are labeled separately; all other
accepted pairs are labeled `general`.

## What endpoint proof does not establish

The pair `(c, h)` does not select a unique angle history. Identity endpoints
cannot distinguish zero motion from one or more full turns, and general
endpoints do not specify a long or short branch. The supplied dyadic slab is
bound to the record and broad phase, but no function from time to angle is
constructed. Consequently the component cannot infer where an intermediate
contact occurs or that an empty endpoint intersection remains empty throughout
the slab.

The embedded arbitrary-`SO(3)` swept-AABB census remains a conservative broad
phase. It may separate some triangle pairs for the whole slab, but every
remaining candidate still needs fixed-axis nonlinear narrow phase and a legal
incidence/contact policy.

## Tested evidence and remaining work

Regression tests cover exact quarter-turn, rational `3/5`--`4/5`, identity,
half-turn, and non-unit-axis cases; rejection of a valid chained second-hinge
pose, translated stationary geometry, changed revision labels, changed hinge
assignment, malformed slab, and malformed end triangle; triangle-order
invariance; accessors and revoked proxies; and deep freeze/no-claim fields.

The record fixes source-geometry hash binding, angle branch/winding,
intermediate angle schedule, chained/simultaneous hinges, nonlinear narrow
phase, continuous collision detection, legal-contact policy,
self-intersection decision, collision-free claim, SupportProfile claim,
`verified`, scientific claim, and global M0F `GO` to false.

A separate finite principal half-angle candidate now constructs one exact
zero-winding schedule for non-half-turn endpoints. Remaining work includes
source-hash-bound reconstruction/path identity, half-turn and multi-chart
subdivision, M/V direction binding, monotone collision-event subdivision,
fixed-axis vertex-face and edge-edge narrow phase, tangency and
persistent-contact handling, complete slab/path coverage, independent replay,
Worker execution, and representative Windows browser measurements.
