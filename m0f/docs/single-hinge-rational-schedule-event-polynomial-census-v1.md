# Single-hinge rational schedule event-polynomial census candidate v1

Status: complete exact necessary-coplanarity polynomial ledger for every
inter-source-face triangle pair on one accepted rational single-hinge schedule.
It does not isolate roots, prove that every root is contact, establish complete
collision-event coverage, decide legal contact or self-intersection, perform
CCD, prove collision freedom, verify a product result, or imply global M0F
`GO`.

## Schedule composition and domain

`computeSingleHingeRationalScheduleEventPolynomialCensusV1` first reruns the
closed exact endpoint transition and finite principal half-angle schedule. The
schedule supplies one quadratic x/y/z numerator per mesh vertex and one common
quadratic denominator `den(s) = 1 + q*s*s`, proven strictly positive for the
complete normalized interval `0 <= s <= 1`.

The census consumes the complete stable triangle and topology-pair ledgers from
that schedule. Triangle pairs inside one source face are structurally excluded:
their triangulation features are part of one rigid polygonal face, and their
persistent coplanarity is handled by the static mesh join. Every pair belonging
to two different source faces is retained, including declared-hinge-adjacent
and distinct nonadjacent faces. This is a structural domain choice, not a broad
legal-contact exemption.

The inherited defensive ceiling is 64 triangles and 2,016 unordered pairs.
Each retained pair produces exactly fifteen event rows, for at most 30,240
rows.

## Exact polynomial construction

All vertex coordinates have the same positive denominator. For four scheduled
points `A(s)`, `B(s)`, `C(s)`, and `D(s)`, the sign of

`det(B-A, C-A, D-A)`

is therefore the sign of the determinant formed directly from their quadratic
coordinate numerators; the removed common denominator is `den(s)^3 > 0`.
Subtracting quadratic polynomials, taking one cross product, and one dot
product yields a polynomial of degree at most six.

For every retained triangle pair, the ledger includes:

- six `vertex-face-plane` rows: each of the three vertices of either triangle
  against the oriented plane of the other triangle; and
- nine `edge-edge-coplanarity` rows: every one of three edges against every one
  of three edges, using the exact four-endpoint orientation determinant.

A zero of one such polynomial is a necessary coplanarity condition for its
named primitive event. It is not sufficient for feature containment or
collision: barycentric/segment parameters and incidence policy still have to
be evaluated at isolated roots and interval cells.

## Primitive integer normalization

Polynomial coefficients are first computed as reduced exact rationals in
constant-to-highest-degree order. The least common multiple of all positive
denominators clears fractions with a positive scale. The greatest common
divisor of all integer coefficients then removes content. Trailing zero
coefficients are removed. The orientation sign is preserved because no
arbitrary sign flip is applied.

An identically zero polynomial is represented only as `[0n]` with degree
`null`. Such rows are retained as persistent coplanarity candidates, especially
around shared hinge structure; they are never silently treated as collision
free. Nonzero degree is bounded by six and every canonical coefficient by
262,144 bits. Limit exhaustion rejects the whole census.

Each row records exact signs at `s = 0` and `s = 1`, plus whether it is
identically zero, zero at either boundary, or nonzero at both boundaries. The
boundary root counts include persistent zero polynomials. Interior roots remain
uncomputed.

## Tested evidence and claim boundary

Tests check the full 60-event two-face ledger and 180-event three-face ledger;
all pair and kind counters; unique contiguous IDs; primitive integer content;
degree and bit limits; boundary signs; persistent shared-hinge zeros;
nonadjacent-pair inclusion; order invariance; failure propagation; and deep
freeze/no-claim fields.

For every event row, an independent test evaluates both the integer polynomial
and the actual scheduled projective-rational 3D points at `s = 0`, `1/2`, and
`1`, then requires the signs to match the independent 3D orientation
predicate. That exercises all vertex-face and edge-edge rows rather than only
selected examples.

The separate event-root census now composes exact square-free/Sturm processing,
closed-unit-interval endpoint handling, and disjoint rational isolating
intervals over every row. Remaining work is cross-event deduplication and
common refinement, feature-containment tests at algebraic events,
sign-invariant cell samples, persistent-contact policy, and a proof that the
resulting event set suffices for complete triangle-pair CCD.
