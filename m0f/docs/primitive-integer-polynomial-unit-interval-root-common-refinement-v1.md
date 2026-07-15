# Primitive integer polynomial unit-interval root common refinement candidate v1

Status: exact common refinement of the finite roots of a bounded set of
primitive integer polynomials of degree at most six on `[0,1]`. This is an
arithmetic candidate, not geometry classification, CCD, collision freedom,
SupportProfile evidence, product verification, or global M0F `GO`.

## Closed input and independent isolation

`refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1` accepts one stable
refinement ID and at most 30,240 uniquely identified polynomial rows. The input
is closed, dense, data-property-only, and getter-safe. Every row is first
reprocessed by the existing exact unit-interval root isolator; invalid or
over-budget rows reject the complete refinement.

Identically zero polynomials are retained as persistent root sets and never
converted into discrete root classes. Finite roots retain their source
polynomial index, stable ID, source root index, and multiplicity. Exact roots
at zero and one form at most one class per endpoint.

## Exact interior identity and order

An interior root begins with its source square-free polynomial and one exact
rational open interval containing exactly one root. Disjoint intervals give an
immediate order. For overlapping intervals, the implementation computes the
exact polynomial GCD over the rationals and uses a Sturm count on their
intersection. A positive count proves that both one-root certificates name the
same algebraic number.

If the GCD has no root in the overlap, one certificate is subdivided with exact
rational arithmetic and its retained half is selected by Sturm count. This
continues until the two distinct roots are strictly separated. The final
classes satisfy `0 < lower < root < upper < 1`, and adjacent interior class
intervals have a strict rational gap. No floating-point comparison is used.

Defensive limits cover 181,440 finite occurrences, 4,194,304 comparisons,
1,048,576 additional refinements, and 4,096 added levels per root. Exhaustion
rejects the entire result.

## Tested evidence and claim boundary

Tests cover initially identical `(0,1)` intervals containing unequal roots,
shared rational and irrational roots across different polynomials, repeated
multiplicities, endpoints, persistent zeros, complete counters, input-order
invariance, closed-input rejection, deep freeze, and all no-claim fields.

The output provides ordered algebraic time identities only. The downstream
algebraic-root sign candidate can query another polynomial at one selected
root, but neither layer states what a geometric primitive does at that root or
between roots.
