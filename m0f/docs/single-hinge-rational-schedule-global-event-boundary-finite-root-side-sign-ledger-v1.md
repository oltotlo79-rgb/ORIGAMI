# Single-hinge rational-schedule global event-boundary finite-root side-sign ledger candidate v1

Status: complete exact defining-polynomial side signs for every available side
of every finite root occurrence in one bounded global necessary-event
partition. This is oriented event-polynomial history, not geometric
approach/separation, penetration history, collision policy, complete CCD, or
global M0F `GO`.

## One central owned source

`analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerV1`
invokes the finite-root classification ledger exactly once. That central
owned composition already retains the event/root census, global boundaries,
canonical open-cell samples, root feature classifications, and left/right
static sample deltas. The side-sign adapter does not recapture the transition
or rerun a classifier.

Each output row is joined to its source classification and finite occurrence
by canonical global and boundary indexes, event and root identity, boundary
location, and multiplicity. Each side row copies only the feature-class outcome;
its algebraic classification evidence remains in the central source. The
adjacent sample is joined through the central
boundary delta: start roots have only the right cell, interior roots have the
immediate left and right cells, and end roots have only the left cell. Large
classification-evidence and static-delta records remain only in the central
source.

## Exact homogeneous evaluation

For a degree `d` primitive integer defining polynomial

`p(t) = c0 + c1 t + ... + cd t^d`

and an adjacent normalized sample `t = a / b` with positive `b`, the adapter
computes the integer

`H(a,b) = b^d p(a/b) = sum(ci a^i b^(d-i), i=0..d)`.

An integer-only homogeneous Horner recurrence retains `H` exactly. Because
`b^d` is positive, `sign(H)` is exactly `sign(p(a/b))`. Each side record keeps
the exact homogeneous integer, its sign and bit length, the maximum
intermediate bit length, its source cell IDs, and the coefficient-row work
count. Tests replay every retained value with an independent direct
homogenization formula.

Every selected adjacent open cell is already certified by the central
partition to contain no root of any finite event polynomial. A nonzero real
polynomial is continuous, so one exact nonzero sample sign is constant on that
entire connected open cell. This establishes event-polynomial sign constancy;
it does not establish that the complete triangle-intersection stratum is
constant there.

## Multiplicity parity

At an interior root `alpha` of multiplicity `m`, exact factorization gives
`p(t) = (t - alpha)^m q(t)` with `q(alpha) != 0`. Consequently, the left and
right signs must be opposite when `m` is odd and equal when `m` is even. The
adapter checks this invariant for every interior occurrence and fails the
whole ledger if it does not hold.

Rows label the two algebraic cases as
`odd-multiplicity-oriented-sign-crossing` and
`even-multiplicity-oriented-sign-preserving-zero`. These labels describe only
the defining scalar polynomial. In particular, an odd edge-edge coplanarity
sign change is not by itself a proof that two segments cross, and an even root
is not by itself a physical contact or tangency claim. Endpoint roots remain
explicitly one-sided because the adapter has no source cell outside the closed
unit interval.

## Defensive limits

The adapter accepts at most 4,096 finite-root rows, 8,192 side evaluations, and
57,344 homogeneous Horner coefficient rows. It retains at most 16,777,216 bits
across the exact homogeneous output values.

Each arithmetic intermediate is additionally capped at 286,730 bits. This is
an adapter-specific, deliberately stricter defensive cap, not a theorem that
all inputs accepted upstream fit below that size. In particular, converting
an actual dyadic schedule sample to normalized time can introduce the slab
duration numerator into the normalized denominator, so its bit length is not
bounded solely by the dyadic sample exponent. Every intermediate is measured
at runtime; an otherwise upstream-valid source that exceeds this adapter cap
fails closed atomically. The ceiling is an experiment bound, not a measured
SupportProfile or runtime claim.

## Fixed fixture evidence

The two-face quarter-turn fixture has 30 start-root occurrences and no finite
end roots. Their one available right-side signs are 21 negative and 9
positive. The ledger performs 30 side evaluations and 180 coefficient rows,
retaining 150 homogeneous-value bits; its largest observed intermediate is 6
bits.

The symmetric three-face fixture has 58 start, 12 interior, and 12 end finite
occurrences. Start right-side signs are 35 negative and 23 positive. At the
interior boundary, nine occurrences change from positive to negative and
three from negative to positive. End left-side signs are nine positive and
three negative. In total it performs 94 side evaluations and 616 coefficient
rows, retaining 1,830 homogeneous-value bits; its largest observed
intermediate is 31 bits.

The four-face 3/4/5 loopback fixture adds four start-boundary
`collinear-overlap` occurrences of multiplicity two. Two have a positive
right-side sign and two a negative right-side sign. They prove that endpoint
parity is retained without inventing a missing left side: their interior
behavior and parity-consistency fields remain null.

The reusable interior-even variant rotates the same moving component from
`sin/cos = -4/5,3/5` to `+4/5,3/5`, placing the loopback configuration inside
the actual single-hinge schedule. Direct evaluation of the four selected
collinear event polynomials and their first derivatives is zero at normalized
time `3/8`, while their second derivatives are nonzero. The root census
independently reports multiplicity two. The resulting ledger has 166 finite
occurrences; its first interior boundary contains 40 even-multiplicity rows.
Twenty-nine are negative on both sides and eleven positive on both sides, and
all reach `even-multiplicity-oriented-sign-preserving-zero`. The four
`collinear-overlap` rows have left/right sign pairs `(+,+)`, `(-,-)`, `(-,-)`,
and `(+,+)`.

At the symmetric interior boundary, 12 event occurrences coexist with only
three changed static triangle-pair rows; 11 occurrences belong to those three
pairs and one belongs to an unchanged pair. Event side histories must
therefore not be deduplicated or interpreted as causal static-strata
transitions.

## Claim boundary

The primitive event normalization preserves the source orientation sign, but
that sign depends on the ordered vertex/edge convention and is not a
normalized Euclidean distance. One sample per side proves neither magnitude
monotonicity nor physical approach versus separation. The adapter also does
not prove that a static sample difference occurs exactly at the boundary,
subdivide persistent zero events, deduplicate simultaneous occurrences,
establish collision-event completeness, or apply declared-hinge, legal
contact, layer-order, or penetration policy.

Continuous collision detection, a final self-intersection decision,
collision freedom, SupportProfile, verification, scientific claims, and
global M0F `GO` therefore remain false.
