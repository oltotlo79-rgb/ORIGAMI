# Single-hinge rational schedule vertex-face root containment candidate v1

Status: exact feature containment for one vertex against one triangle at one
selected finite root of a vertex-face event polynomial on an accepted rational
single-hinge schedule. This is a narrow-phase candidate for one root, not a
batch event decision, legal-contact classification, complete CCD result, or
global M0F `GO`.

## Source, event, and root binding

`classifySingleHingeRationalScheduleVertexFaceRootContainmentV1` accepts a
stable classification ID, the source transition, an event index, and a
defining root index. It reconstructs the complete event-polynomial census and
requires the selected row to be a bound `vertex-face-plane` event. The event's
vertex ID, face triangle ID, face vertex IDs, triangle-pair topology relation,
and primitive integer defining polynomial remain attached to the result.

The defining polynomial must have a discrete finite root at the selected
index. Finite includes exact start and end roots as well as isolated interior
algebraic roots. An identically zero, persistent defining polynomial has no
selectable discrete root and is rejected. An edge-edge event, unavailable
event index, unavailable root index, or any failure in transition and schedule
revalidation also rejects the operation.

## Three exact projections

Every schedule vertex has three quadratic numerator polynomials and shares the
same denominator `D(s)`, which is strictly positive on `[0,1]`. For face
vertices `a,b,c`, the classifier constructs the projected signed-area
numerators

- `A_x = orient_yz(a,b,c)`,
- `A_y = orient_zx(a,b,c)`, and
- `A_z = orient_xy(a,b,c)`.

Each polynomial has degree at most four. Removing the shared `D(s)^2` does not
change a sign. Rational coefficients are converted to primitive integer
coefficients by a positive denominator LCM followed only by integer-content
GCD division; no arbitrary sign flip is allowed.

The sign of every area polynomial at the selected defining root is established
by exact algebraic-root common refinement. The canonical projection is the
first nonzero area in `x`, `y`, `z` drop-axis order. This avoids relying on a
floating-point dominant-normal comparison and remains valid when one or two
coordinate projections collapse.

If all three areas vanish, the face is a `degenerate-plane` case at that root.
Triangle feature containment is not defined by this contract for such a face,
so the operation fails closed with `degenerate-face-at-event-root`. It does not
emit a success record with
`featureContainmentAtOneVertexFaceRootIncluded: true`. Validated rigid
nondegenerate source triangles should make this branch unreachable; the check
is retained as an explicit claim-boundary invariant. Degenerate input
triangles are already rejected during source event-census reconstruction.

## Area-relative edge signs and classification

On the selected nondegenerate projection, the classifier constructs three
more degree-at-most-four polynomials:

- `E_0 = orient(a,b,p)`,
- `E_1 = orient(b,c,p)`, and
- `E_2 = orient(c,a,p)`,

where `p` is the event vertex. Their signs are determined at the same selected
algebraic root with the same exact common-refinement predicate. The defining
event root establishes that `p` is coplanar with the face. Each nonzero edge
sign is then compared with the selected face-area sign:

- any opposite nonzero sign gives `outside`;
- no opposite sign and no zero edge sign gives `interior`;
- no opposite sign and exactly one zero edge sign gives `edge`; and
- no opposite sign and exactly two zero edge signs gives `vertex`.

Three zero edge signs would contradict a nonzero projected face area and fail
closed. Edge and vertex results retain the exact face feature index and source
vertex IDs. All six auxiliary sign certificates, primitive coefficient arrays,
selected projection, and source event evidence are deeply frozen.

## Tested boundary and exclusions

Tests cover endpoint roots, an interior rational root, the representative
irrational nonadjacent event `vf:3:second:0`, exact edge containment of `v6` on
`[v2,v0]`, vertex and outside outcomes, two collapsed projection candidates,
persistent defining events, edge-edge event rejection, unavailable selectors,
hostile closed input, degenerate source rejection, degree bounds, exact sign
evidence, and deep freeze.

This API classifies only one selected finite vertex-face root. It does not
batch-classify all root boundaries, process persistent coplanarity throughout
an interval, construct the extra roots needed for persistent feature changes,
classify edge-edge containment, or compare the adjacent left and right open
cells. It does not determine approach versus separation, penetration, declared
incidence legality, layer order, or legal contact. Complete nonlinear narrow
phase, continuous collision detection, self-intersection decisions, collision
freedom, SupportProfile claims, verification, scientific claims, and global
M0F `GO` remain false.
