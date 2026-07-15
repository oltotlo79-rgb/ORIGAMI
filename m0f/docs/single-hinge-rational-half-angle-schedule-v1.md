# Single-hinge rational half-angle schedule candidate v1

Status: exact continuous rigid-component vertex schedule for the finite
principal tangent-half-angle chart of one accepted single-hinge endpoint
transition. It selects zero winding and does not support a half-turn endpoint.
It is not nonlinear narrow-phase CCD, a legal-contact rule, a
self-intersection decision, a collision-free result, a SupportProfile,
`verified`, or evidence for global M0F `GO`.

## Input and inherited proof

`constructSingleHingeRationalHalfAngleScheduleV1` accepts the same closed input
as `bindSingleHingeRigidPoseTransitionV1` and first reruns that complete
composition. Therefore success already requires:

- complete exact start and end pose bindings for one matching topology ledger;
- one declared active hinge that is a bridge in the source-face dual graph;
- graph-derived moving and stationary components;
- exact equality of every stationary vertex and the hinge axis; and
- one common orientation-preserving endpoint rotation for every moving vertex,
  established by exact axial/radial invariants and the Rodrigues equation.

Transition failures are retained without partial schedule output. The caller
mesh revisions are still labels, not source hashes; the embedded transition
keeps that claim boundary explicit.

## Selected finite chart

Let ordered axis direction be `D`, `L = D dot D`, endpoint cosine be `c`, and
endpoint oriented-sine parameter be `h = sin(theta)/sqrt(L)`. For `c != -1`,
the schedule derives the reduced exact parameter

`K = h / (1 + c)`.

`K` is `tan(theta/2)/sqrt(L)` in the finite principal chart. With normalized
time

`s = (t - t0) / (t1 - t0)`, for `0 <= s <= 1`,

the schedule uses the affine half-angle parameter `K(s) = K*s`. Define

`q = L*K*K` and `den(s) = 1 + q*s*s`.

Because `L > 0` and `q >= 0`, the common denominator is strictly positive on
the complete real unit interval. The corresponding exact rotation parameters
are

`c(s) = (1 - q*s*s) / den(s)`

and

`h(s) = 2*K*s / den(s)`.

The constructor independently reconstructs the accepted endpoint `c` and `h`
from `K` and `q`. A half-turn has `c = -1` and is the point at infinity of this
chart, so it fails explicitly with `half-turn-chart-singularity`; no numeric
approximation is substituted.

The selected branch is the monotone finite principal half-angle path with zero
winding. This is a deterministic candidate path choice, not evidence that an
M/V assignment or user-authored fold sequence intended that direction or
winding.

## Complete vertex polynomial ledger

Every bound mesh vertex receives one quadratic numerator for x, y, and z and
shares the exact quadratic denominator `[1, 0, q]`. For a moving vertex, split
its start offset from axis point `A` into an axis projection point `Base` and a
perpendicular vector `U`. Its complete path is

`P(s) = ((Base + U) + 2*K*(D cross U)*s + q*(Base - U)*s*s) / den(s)`.

`Base + U` is the exact start point. Substitution of `s = 1` produces the exact
end point proved by the transition binder. Vertices on the hinge use the same
formula and remain fixed. A stationary-only vertex with point `P` receives
numerator `P*(1 + q*s*s)`, so division by the common denominator is exactly
constant.

The constructor evaluates every generated path at exact `s = 0` and `s = 1`
and compares it with both complete pose bindings before success. There is one
row per mesh vertex in stable binding order; no caller vertex subset is
accepted.

For all real `s` in the unit interval, every moving row uses the same `K(s)`
and Rodrigues rotation about the same fixed axis. The formula therefore defines
a continuous rigid-component schedule, not linear vertex interpolation.

## Tested evidence and remaining boundary

Tests cover quarter-turn midpoint evaluation, exact `3/5`--`4/5` endpoint
parameters, a non-unit axis, identity, half-turn rejection, start/end
reproduction, positive denominator samples, and exact preservation of every
moving vertex-pair distance at five rational times. They also cover stationary
vertices, complete ledger counts, triangle-order invariance, hostile accessors,
and deep freeze/no-claim fields.

A separate exact dyadic sampler now rebuilds the complete mesh pose and static
intersection strata at one selected schedule time, including positive
nonadjacent crossing evidence. No fixed-axis vertex-face or edge-edge roots are
yet isolated. Tangency, persistent contact, incidence exclusions, legal
contact, event-cell coverage, complete multi-step time coverage, independent
replay, Worker execution, and representative Windows measurements remain
absent. Half-turn transitions need a second chart or a proven subdivision.
Closed kinematic loops and chained/simultaneous hinges remain outside this
single-bridge slice.
