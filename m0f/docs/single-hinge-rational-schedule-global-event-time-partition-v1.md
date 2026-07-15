# Single-hinge rational schedule global event-time partition candidate v1

Status: exact cross-event root boundaries and root-free open cells for all
necessary event polynomials of one accepted rational single-hinge schedule. It
does not classify feature containment, persistent contact, legal contact,
self-intersection, or complete CCD, and does not imply global M0F `GO`.

## Complete replay and event join

`computeSingleHingeRationalScheduleGlobalEventTimePartitionV1` reruns the event
root census, then independently re-isolates every exact event polynomial in the
generic common-refinement layer. Polynomial coefficients, root locations and
multiplicities, square-free coefficients, Sturm and subdivision counters, and
isolating intervals must replay the independent census exactly.

Each finite refined-root member is joined bijectively to its event index, ID,
triangle pair, primitive event kind, source root index, and multiplicity.
Persistent zero events are retained in a separate ledger because they apply to
the complete interval rather than one discrete boundary.

## Boundaries and open cells

Start and end boundaries are always present, even when no finite event occurs
there. Equal interior algebraic roots from different event rows share one
boundary. Every finite event-root occurrence appears at exactly one boundary.

Strict rational gaps around and between the ordered algebraic certificates
provide one open-cell sample region between every adjacent boundary. The
implementation finds the least-exponent canonical dyadic actual time inside
each region, maps it back to normalized schedule time exactly, and rechecks
strict containment. This makes the sample directly consumable by the existing
exact static schedule sampler.

Tests cover the 60-event two-face and 180-event three-face ledgers, endpoint
and persistent events, event-root bijection, triangle-order invariance, a
non-unit actual time slab, upstream rejection, and deep freeze. A symmetric
two-face rotation produces 30 independently isolated interior occurrences
which the exact refinement merges into one simultaneous boundary with two open
cells.

## Claim boundary

Every nonpersistent event polynomial has no root within each emitted open cell;
its sign is therefore constant there. This only partitions the necessary
coplanarity conditions. It does not prove that a root lies within the named
vertex/face or edge/edge features, handle the additional containment roots of
persistent coplanarity, compare left/right geometric strata, or apply legal
contact policy. Nonlinear narrow phase, complete continuous collision
detection, self-intersection decisions, collision freedom, SupportProfile,
verification, scientific claims, and global M0F `GO` remain false.
