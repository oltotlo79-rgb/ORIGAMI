# Single-hinge rational schedule exact static sample candidate v1

Status: complete exact pose evaluation and actual 3D triangle-intersection
strata at one dyadic time on one accepted rational single-hinge schedule. A
positive nonadjacent interior crossing is actual static self-intersection
evidence at that time. A negative sample does not cover an interval and is not
continuous collision detection, collision freedom, a legal-contact decision,
`verified`, or evidence for global M0F `GO`.

## Closed sample input

`analyzeSingleHingeRationalScheduleStaticSampleV1` accepts exactly:

- `transitionInput`, the complete closed start/end transition input; and
- `sample`, containing a bounded stable sample revision ID and one canonical
  dyadic time.

The transition is rerun through exact endpoint binding and finite principal
half-angle schedule construction. A half-turn chart singularity, invalid
topology or pose, hostile accessor, malformed time, or time outside the closed
schedule slab rejects the whole sample. The dyadic parser uses the same
numerator and exponent ceilings as the swept-AABB experiment boundary. Negative
times are allowed only when the declared slab contains them.

The exact normalized parameter is

`s = (sampleTime - t0) / (t1 - t0)`.

The record labels it as start, interior, or end by exact rational comparison;
no floating-point conversion is used.

## Complete exact pose evaluation

Every vertex row from the schedule's stable complete ledger is evaluated by
its exact quadratic numerator and common positive quadratic denominator. The
result is canonicalized as one projective-rational 3D point. Every bound
triangle is then rebuilt from its three mesh vertex IDs; no triangle or pair
subset is accepted from the caller.

The sampler retains the validated start reconstruction from the transition
input and rebinds the generated pose through
`bindStaticRationalTrianglePoseToFoldMeshV1`. This rechecks, at the sampled
time, all vertex identity, complete triangle coverage, source-face pairwise
metric rigidity, source-face coplanarity, edge/face incidence, and unordered
pair order. A schedule arithmetic or topology defect therefore fails before
intersection evidence is returned.

## Actual static 3D intersection evidence

The complete rebound pose is passed to
`analyzeStaticRationalTriangleFoldMeshStrataV1`. That exact pipeline computes
the complete raw triangle-intersection locus and relative-interior strata for
every pair and joins each row to mesh identity and declared hinge segments.
The sample record retains all categories and counters, including:

- same-face triangulation contact candidates;
- contact contained on a declared hinge;
- hinge-adjacent off-axis intersection evidence;
- nonadjacent point or boundary contact needing motion history;
- nonadjacent coplanar area needing layer order; and
- nonadjacent relative-interior 3D crossing evidence.

The last category sets
`staticNonadjacentInteriorCrossingDetected: true`. This is positive exact
evidence for a real static crossing of nonadjacent source faces at the sampled
schedule time; it is not inferred from an AABB or screen-space overlap.

## Tested evidence and claim boundary

Tests evaluate start, midpoint, and end times and an offset `[1,3]` slab; check
the exact midpoint vertex; rerun all four triangles and six pairs of the
two-face fixture; reject noncanonical and out-of-slab times; propagate schedule
diagnostics; preserve triangle-order invariance; and reject accessors and
revoked proxies. A three-face fixture starts from one rigid locked-component
pose, follows one accepted common active-hinge rotation, and at its exact end
detects the known nonadjacent relative-interior crossing across all six
triangles and fifteen pairs.

The output is deeply frozen and fixes interval coverage, event-root isolation,
nonlinear continuous narrow phase, CCD, legal-contact policy,
self-intersection decision, collision-free claim, SupportProfile claim,
`verified`, scientific claim, and global M0F `GO` to false.

Separate exact layers now derive and isolate all necessary coplanarity
polynomials, merge simultaneous event roots into a global partition, sample
every open cell, and classify one selected finite vertex-face or nonparallel
edge-edge root. Remaining work is to batch those boundary classifiers, prove
open-cell strata constancy and event-family completeness, handle parallel,
collinear, tangency, and persistent contact, bind M/V and motion-side history,
prove complete slab/path coverage, and add independent persisted replay and
representative Windows measurements.
