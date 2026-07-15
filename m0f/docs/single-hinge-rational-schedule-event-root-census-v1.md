# Single-hinge rational schedule event-root census candidate v1

Status: complete independent closed-unit-interval root isolation for every
necessary event polynomial of one accepted rational single-hinge schedule. It
does not merge roots across events, classify geometric contact, establish CCD
completeness, prove collision freedom, verify a product result, or imply global
M0F `GO`.

## Exact composition

`computeSingleHingeRationalScheduleEventRootCensusV1` reruns the complete event
polynomial census, then passes each exact primitive integer coefficient array
to the degree-six Sturm root isolator. The returned polynomial ID and complete
coefficient array must equal the source event row before the result is
accepted.

Each output row retains the original face-pair and primitive-event identity,
its source polynomial, and its full isolation record. Persistent zero
polynomials are represented as roots on the entire unit interval. Finite rows
retain exact multiplicities at zero and one, disjoint rational open intervals
for every interior root, and each interior multiplicity.

The aggregate ledger counts persistent and finite rows, rows with start,
interior, or end roots, distinct finite roots and multiplicities before
cross-event merging, subdivision nodes, and maximum subdivision depth. It is
bounded by 30,240 events, 181,440 distinct finite roots, and 262,144 aggregate
subdivision nodes. Exhaustion rejects the entire ledger rather than returning a
partial result.

## Tested evidence

Tests cover all 60 events in the two-face fixture and all 180 events in the
three-face fixture, including nonadjacent source faces. They replay every row
binding, root flag, aggregate count, subdivision count, and maximum depth from
the retained records. Triangle-order invariance, upstream rejection
propagation, deep freeze, and every no-claim field are also checked.

## Claim boundary

The census isolates each polynomial independently. Overlapping rational
isolating intervals from different events do not establish whether their
algebraic roots are equal, and this record emits no global time-cell partition.
The downstream exact common-refinement and global event-time partition
candidates now provide those two operations while retaining this independent
ledger for replay.
Coplanarity is only a necessary event condition: feature containment,
orientation around the event, topology/legal-contact policy, and persistent
contact still require exact geometric classification. Consequently nonlinear
narrow phase, continuous collision detection, self-intersection decisions,
collision freedom, SupportProfile, verification, scientific claims, and global
M0F `GO` remain explicitly false.
