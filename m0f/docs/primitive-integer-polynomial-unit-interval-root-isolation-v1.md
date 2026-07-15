# Primitive integer polynomial unit-interval root isolation candidate v1

Status: exact distinct-real-root and multiplicity isolation for one primitive
integer polynomial of degree at most six on the closed unit interval. It is a
generic arithmetic candidate, not a collision classifier, CCD result,
collision-free result, SupportProfile, product verification, or global M0F
`GO` evidence.

## Closed polynomial contract

`isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1` accepts exactly a
bounded stable polynomial ID and a dense coefficient array in
constant-to-highest-degree order. Coefficients must be `BigInt`, contain no
trailing zero, have integer content one when nonzero, and fit the 262,144-bit
ceiling. Degree is at most six. `[0n]` is the sole canonical identically-zero
representation.

Unknown fields, accessors, sparse or extended arrays, non-plain containers,
nonprimitive input, over-degree input, and revoked proxies fail without
invoking caller getters. These limits are experiment guards, not supported
product sizes.

## Endpoints and square-free interior

The zero polynomial is reported as `entire-unit-interval`; it has no finite
root list and multiplicity sum is `null`. A nonzero polynomial is handled in
three parts.

Factors of `x` are removed exactly to obtain the root multiplicity at zero.
Exact division by `x - 1` similarly obtains the multiplicity at one. The
remaining polynomial is nonzero at both endpoints.

For the open interior, exact rational Euclidean division computes

`gcd(P, P')`

and the monic square-free part `P / gcd(P, P')`. No coefficient is converted to
binary floating point.

## Sturm isolation

The monic square-free polynomial and its derivative begin a classical Sturm
sequence. Each later row is the negated exact rational remainder of the two
preceding rows. At a rational endpoint, zero sequence values are skipped and
the number of distinct roots in an interval is the exact difference in sign
variations.

The open interval `(0,1)` is recursively subdivided. A cell with zero roots is
discarded; a cell with one root becomes an isolating interval. For a cell with
multiple roots, the implementation tries seven dyadic internal split fractions.
A degree-six nonzero polynomial cannot vanish at all seven, so at least one
valid nonroot split exists. Left and right Sturm counts must sum to the parent
count before recursion continues.

Every reported interior interval has rational open endpoints, contains exactly
one distinct root, and is disjoint from every other reported interior interval.
Exact endpoint roots are separate records. Defensive exhaustion occurs at
4,096 subdivision levels or 16,384 visited nonempty nodes and rejects the
result rather than returning partial intervals.

## Multiplicity

For each isolated interior root, repeated gcd layers recover multiplicity. A
root of multiplicity `m` remains in

`gcd(P,P')`, then in the corresponding repeated-factor gcd chain exactly
`m - 1` times. Because each interval already contains one distinct root of
`P`, exact Sturm counts on each gcd layer cannot confuse it with another root.

The finite result records endpoint multiplicities, every interior
multiplicity, distinct-root count, and total multiplicity on `[0,1]`.

## Tested evidence and claim boundary

Tests cover zero and constant polynomials, a simple rational root, endpoint
multiplicities two and three, unequal repeated rational roots, a repeated
irrational root, six distinct roots placed on initial split candidates, closed
input rejection, accessors, sparse arrays, revoked proxies, and deep freeze.
An additional 32 deterministic factorized-polynomial cases mix repeated roots
at zero, rational interior points, one, and points outside the unit interval;
all isolated roots and multiplicities are checked against the construction
oracle.

The component does not associate a polynomial root with geometric feature
containment, contact, penetration, or self-intersection. The downstream event
root census, common refinement, and global time partition now compose its
arithmetic records, but those geometric semantics remain unresolved.
