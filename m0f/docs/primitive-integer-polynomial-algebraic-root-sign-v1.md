# Primitive integer polynomial algebraic-root sign candidate v1

Status: exact sign of one primitive integer query polynomial at one selected
isolated root of another primitive integer polynomial on `[0,1]`. This is an
arithmetic candidate, not feature containment, contact classification, CCD,
collision freedom, SupportProfile evidence, verification, or global M0F `GO`.

## Source and root binding

`determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1` accepts a stable
evaluation ID, two closed polynomial inputs, and one defining root index. Both
source polynomials are first isolated independently with their caller IDs and
original primitive coefficient signs preserved.

The two coefficient arrays are then replayed through common refinement under
fixed internal `definition` and `query` role IDs. This permits the valid case
where both caller polynomial IDs are equal, including `Q = P`. Every root,
coefficient array, square-free array, Sturm counter, subdivision counter, and
isolating interval must match the independent source isolation before a sign
can be emitted.

An identically zero defining polynomial has no selectable discrete root and is
rejected. The chosen finite root index must occur exactly once in the common
root classes.

## Exact sign cases

If the query is identically zero, its sign is zero everywhere. If a query-root
member belongs to the selected defining-root class, the sign is also exactly
zero. This includes shared irrational roots proven by GCD and Sturm counts and
shared exact endpoints.

For a nonshared endpoint root, the query is evaluated directly at zero or one.
For a nonshared interior root, the common-refinement certificate is rechecked
against every query-root class. Its rational midpoint lies in an interval
containing the defining root and no query root, so continuity makes the query
sign at that midpoint equal to its sign at the algebraic root.

The midpoint evaluation uses homogeneous integer Horner arithmetic. For
`x = a/b` with `b > 0`, it computes the sign of `b^degree * Q(a/b)` and
therefore preserves the caller's original coefficient sign without floating
point or square-free leading-sign normalization. Intermediate integer values
are capped at 2,097,152 bits; exhaustion rejects the result.

## Tested evidence and claim boundary

Tests cover positive, negative, and zero queries at `sqrt(1/2)`; a rational
interior root; start and end roots; a persistent-zero query; a repeated
defining root; equal caller IDs with `Q = P`; a negative-leading query; invalid
root selection; hostile closed-input cases; deep freeze; and all no-claim
fields.

The result covers one query at one root. It does not construct the projection,
barycentric, segment-order, or other auxiliary polynomials required for
vertex-face and edge-edge containment, and it does not inspect left/right time
cells or apply legal-contact policy.
