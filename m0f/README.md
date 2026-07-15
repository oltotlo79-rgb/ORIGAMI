# M0F feasibility harness and candidate components

This directory contains the M0F fixture metadata, deterministic JSONL,
command-line harness, and candidate feasibility-research modules documented
below. It does **not** implement a product origami generator, general solver,
collision-complete rigid-fold path planner/detector, or final reference
verifier.

The only populated fixture is `_harness-smoke`. Its `harness-only` outcome
tests plumbing and makes no claim that any crease pattern is valid,
foldable, collision-free, or verified.

Commands (when the repository's TypeScript runner is installed):

```text
tsx m0f/cli.ts validate
tsx m0f/cli.ts list
tsx m0f/cli.ts list --canonical
tsx m0f/cli.ts smoke
tsx m0f/cli.ts validate --complete
tsx m0f/cli.ts gate
tsx m0f/face-complex-subgate-cli.ts
```

Normal validation permits an incomplete fixture population and reports every
missing canonical ID as a warning. `--complete` checks only whether all required
exact IDs and wildcard families are populated; it is a fixture catalog gate,
not scientific evidence and not an M0F `GO` decision.

`gate` is intentionally fail-closed until artifact schemas, all scientific
fixtures, the independent reference verifier, mutation tests, measured
profiles, and the signed-off M0F report are implemented. Merely adding IDs and
hash-valid files can never make this command claim `GO`.

M0F-0 convention work lives under `model/`, `schemas/`, and `docs/`. The
two-face convention vector under `tests/vectors/m0f-0` is deliberately outside
the scientific manifest and sets `scientificClaim: false`.

`geometry/` contains the M0F reference numeric kernel and the first candidate
M0F-3 face slice: filtered orientation with exact dyadic fallback, exact
BigInt-rational intersection construction and segment splitting, half-edge face
enumeration, deterministic triangulation, and FOLD face projection. The O(n²)
vertex canonicalizer remains a separate tolerance experiment. These are
feasibility/reference components, not a completed product arrangement engine
or verifier.

`box-pleating/square-grid-candidates.ts` starts the M0F-2 prerequisite work by
enumerating exact, finite square-cell quantization candidates on rectangular
paper. It preserves one cell size across both axes, records any positive-edge
residual strip, and quantizes terminal and internal branch lengths and widths
through the same exact-rational rule. Every result retains its canonical source
branches, including an empty candidate result. `npm run m0f:box-grid-candidates`
emits a fixed candidate-only example. This slice contains no branch placement, axial
or river routing, crease generation, M/V assignment, folding path, or
collision check. Defensive axis and candidate-by-branch ceilings bound its
finite work surface but do not select a product support profile; see
`docs/square-grid-candidates-v1.md`.

`box-pleating/branch-grid-allocation.ts` adds a second closed boundary which
recomputes each candidate's terminal and internal branch length/width steps
from exact rationals and rejects the whole input on any error. It intentionally
does not assign coordinates or claim packing, placement, pleat routing, or
foldability.

`box-pleating/ordered-tree-input.ts` accepts a closed width-aware ordered tree,
checks connected/acyclic topology, complete cyclic rotations, 2..20 leaves,
and reciprocal mirror metadata, then derives terminal/internal node and edge
classes. Mirrored branch dimensions and reverse-cyclic rotations must agree.
Positions remain unquantized input metadata; placement and construction are
excluded. `npm run m0f:ordered-tree` emits a fixed internal-width example. See
`docs/ordered-tree-input-v1.md`.

`box-pleating/ordered-tree-grid-quantization.ts` now connects that validated
tree to the existing square-grid quantization input. Every canonical tree edge
maps one-to-one to a terminal or internal grid branch while preserving length
and width, including internal widths. Both boundaries revalidate and fail
atomically; enumeration, placement, packing, creases, routing, foldability,
feasibility, and GO remain false. Run
`npm run m0f:ordered-tree-grid-quantization`; see
`docs/ordered-tree-grid-quantization-v1.md`.

`box-pleating/ordered-tree-square-grid-candidates.ts` composes that adapter
with the finite exact grid enumerator. The retained tree mapping and canonical
source branches make every quantized dimension traceable, including an empty
candidate result. It still selects no grid and performs no polygon/river
packing or downstream construction. Run
`npm run m0f:ordered-tree-grid-candidates`; see
`docs/ordered-tree-square-grid-candidates-v1.md`.

`box-pleating/ordered-tree-path-demands.ts` resolves one caller-referenced grid
candidate and produces every unordered leaf pair's unique integer tree path.
It retains per-edge length and width steps, their exact length sum, and a
maximum-width summary with no implied geometric metric. No candidate is chosen
automatically and no polygon/river placement is claimed. Run
`npm run m0f:ordered-tree-path-demands`; see
`docs/ordered-tree-path-demands-v1.md`.

`box-pleating/polygon-river-packing-problem.ts` turns those path demands into a
compact finite-domain input skeleton only. Leaf coordinates remain unassigned;
the metric, evaluable constraints, placement, polygon/river geometry, solver,
and feasibility are all absent or false. Positive residual paper is retained
with handling unresolved. Run `npm run m0f:polygon-river-packing-problem`; see
`docs/polygon-river-packing-problem-v1.md`.

`box-pleating/polygon-river-packing-problem-result-validation.ts` independently
checks one completed problem description without invoking the builder or any
candidate enumerator. It rebinds the selected candidate, tree edges, all leaf
paths, residual paper, and claim flags under a dedicated response budget. This
is a future Worker prerequisite, not packing or enumeration-completeness
evidence. See `docs/polygon-river-packing-problem-result-validation-v1.md`.

The polygon/river problem builder also has a closed one-job module-Worker
boundary. It binds every response to the normalized source input and job ID,
then applies the independent completed-result validator on the client side.
`AbortSignal` is the only cancellation mechanism and there is no forced
timeout. A builder failure is never reported as packing infeasibility or a
no-solution result. See
`docs/polygon-river-packing-problem-worker-v1.md`.

`box-pleating/polygon-river-search-space.ts` audits the resulting raw finite
work surface with exact BigInt cardinalities. It computes the active-grid
vertex count and unconstrained Cartesian assignment count without materializing
assignments. Coordinate distinctness, geometric constraints, solver capacity,
placement, and feasibility remain excluded. Run
`npm run m0f:polygon-river-search-space`; see
`docs/polygon-river-search-space-v1.md`.

`box-pleating/packing-semantics.ts` fixes one narrow candidate meaning for a
future squared-Euclidean necessary filter: grid units map to classical
tree-weight length steps, while the independent finished width remains
unbound and trace-only. It evaluates no filter, selects no global metric or
construction family, and leaves all polygon/river/junction geometry policies
unresolved. See `docs/packing-semantics-v1.md`.

`box-pleating/square-grid-selected-candidate-validation.ts` independently
checks one candidate's exact grid arithmetic and source-branch binding without
re-running the full enumeration. It is a prerequisite for bounded Worker
response validation, not evidence that enumeration is complete or that the
candidate can be packed. See
`docs/square-grid-selected-candidate-validation-v1.md`.

`box-pleating/euclidean-necessary-filter.ts` evaluates the candidate
tree-weight lower bound for one complete caller-supplied set of projected leaf
anchors using exact squared BigInt distances. Failure rejects only that anchor
assignment; success is not polygon/river packing evidence. Width, construction
families, geometry, automatic search, and global feasibility remain outside
the filter. See `docs/euclidean-necessary-filter-v1.md`.

`box-pleating/euclidean-necessary-witness-search.ts` adds a bounded,
deterministic depth-first search over those projected active-grid anchors. It
prunes only with the same pairwise necessary relation and distinguishes witness
limit, work-budget exhaustion, and complete exhaustion of the modeled domain.
Returned witnesses remain filter-only assignments, not polygon/river
placements or feasibility evidence. See
`docs/euclidean-necessary-witness-search-v1.md`. Run the fixed probe with
`npm run m0f:euclidean-necessary-witness-search`; the CLI emits the result only
after the separate validator reproduces it.

`tests/perf/m0f-euclidean-necessary-witness-search.bench.ts` records both a
complete 13,806-state small-domain traversal and an exact 200,000-state budget
stop on a 512 by 512 active grid. The benchmark has no pass threshold and does
not freeze a runtime limit or SupportProfile.

`box-pleating/euclidean-necessary-witness-search-result-validation.ts`
independently rebinds the source problem and replays the canonical bounded DFS
without invoking the producer search, problem builder, or full grid
enumerator. It validates witness arithmetic and all three stopping states, but
its successful decision remains filter-only consistency rather than packing
or no-solution evidence. See
`docs/euclidean-necessary-witness-search-result-validation-v1.md`.

The producer search and that independent replay now also have distinct one-job
module Workers connected by a bounded main-thread relay. The Search Worker is
terminated before the Validation Worker starts; the main thread checks closed
envelopes, job/validation IDs, source binding, and canonical response equality
but runs neither DFS. `AbortSignal` is the only cancellation mechanism and no
forced timeout or main-thread fallback exists. See
`docs/euclidean-necessary-witness-two-stage-worker-v1.md`.
The real-browser matrix covers successful search plus independent replay,
search-stage cancellation before validation is created, and pre-abort with
neither Worker created in Chromium, Edge, and Firefox. These are smoke checks,
not a frozen runtime profile.

`box-pleating/square-grid-lattice.ts` materializes one internally consistent
candidate as exact lattice vertices plus horizontal, vertical, and both 45
degree unit direction primitives. It retains positive-edge residual-strip data
and applies a composite output ceiling before allocation. Direction primitives
are substrate choices only: they are not creases, selected axial lines, branch
placements, or pleat routes.

`box-pleating/square-grid-paper-partition.ts` represents the complete exact
paper boundary and partitions it into the active square-grid rectangle plus an
optional positive-boundary residual strip. The separating interface is fixed
to geometry-only semantics and is not a crease. The deterministic
`npm run m0f:box-grid-paper-partition` example exercises a nonzero residual;
saved CP/FOLD integration remains explicitly excluded. See
`docs/square-grid-paper-partition-v1.md`.

`npm run m0f:experiment -- --square-grid-quantization` runs the fixed grid case
through the generic candidate experiment runner. The saved envelope binds the
closed parameter and input hashes, fixed provenance, result, and semantic hash.
Its built-in result validator independently checks exact cell arithmetic,
half-up steps, error limits, candidate identity/order, and defensive text/work
budgets. This integrity check cannot prove that a persisted candidate array is
complete without the separately bound input artifact; an empty array is only a
completed enumeration and never a no-solution certificate.

`runSquareGridQuantizationWorkerV1` and its browser factory execute that finite
enumeration in a one-job module Worker with no forced timeout. `AbortSignal`
terminates work, all terminal paths clean up, and responses bind a normalized
source input to result-level source branches so a same-job response from
another input fails closed even when the candidate array is empty. Empty
candidate arrays still complete normally. The three-browser harness now covers
repeatability, cancellation, and pre-abort for this Worker; see
`docs/square-grid-quantization-worker-v1.md`.

`npm run m0f:experiment` runs a fixed-seed candidate-only differential probe
that compares filtered orientation results with the always-exact dyadic path.
The deterministic record includes parameter/input hashes, seed, repetition,
reason code, and semantic hash, while fixing `scientificClaim` to false. It is
experiment plumbing and measurement data, not proof that the kernel or any
origami input is verified.

`npm run m0f:faces` runs a fixed non-dyadic `faces_vertices: null` reference
case through exact planarization, face enumeration, triangulation, and a
display-only FOLD projection. See
`docs/face-reconstruction-experiment-v1.md`. A completed record still has
`scientificClaim: false` and does not establish foldability, a continuous path,
or collision freedom.

`adaptFoldDocumentToFaceReconstructionInputV1` adds a standard-named FOLD
1.1/1.2 NOFACES boundary, and `reconstructFoldDocumentFacesCandidateV1` runs
that adapter and the face pipeline in one call. This closed candidate subset
requires numeric `file_spec`, snake-case geometry arrays, one top-level
keyframe, absent `faces_vertices`, absent or empty `file_frames`, and a 2D
`creasePattern` classification when those frame metadata fields are present.
Unknown/custom fields, unsupported frame attributes, `C`/`J`, malformed
geometry, and non-plain inputs fail closed. This is not the full product FOLD
importer: it does not preserve unknown custom fields or an original source
spec/hash, import already-present faces, or establish compatibility with an
independent external FOLD implementation.

The normalized candidate DTO can be executed off the browser main thread with
`runFaceReconstructionWorkerV1` and
`createBrowserFaceReconstructionWorkerV1`. The closed protocol validates both
directions, fixes all claims to candidate-only, runs one job per Worker, ignores
valid stale-job responses, and terminates on completion, failure, or caller
`AbortSignal`. It has no forced timeout. These are execution-safety mechanics,
not measured browser limits or scientific evidence; real-browser cancellation
latency, memory, message size, and repeatability remain pending.

For file import,
`runFoldDocumentFaceReconstructionWorkerV1` transfers an owned nonempty
`ArrayBuffer` containing UTF-8 FOLD JSON. The main thread does not decode,
parse, snapshot, or normalize the document; the dedicated Worker performs
fatal UTF-8 decoding, JSON parsing, standard-FOLD adaptation, and exact face
reconstruction. Successful transfer detaches the caller buffer. Invalid text or
documents return fixed candidate-only reasons without host text. No byte limit
is invented before `maxWorkerMessageBytes` is selected by browser measurement.
`npm run test:e2e:m0f-worker` provides a Chromium test-page smoke check for real
module-Worker transfer, repeatability, and abort behavior;
`npm run test:e2e:m0f-worker:matrix` repeats it in Chromium, Edge, and Firefox.
Its loose timing assertion is not a measured runtime profile or scientific
evidence.

`reference-verifier/` now contains a separate candidate audit for this face
slice. `auditFaceComplexCandidateV1` does not import the producer arrangement,
face traversal, triangulation, result parser, experiment engine, or exact
rational model. It uses canonical homogeneous BigInt points, reconstructs the
source intersection/sub-edge set, traverses its own angular dart rotation, and
checks exact face and triangle coverage. Its only successful decision is
`auditOutcome: "consistent"` with `scientificClaim: false` and a
face-complex-only scope. See `docs/face-complex-audit-v1.md`; it is not the full
path/CCD/layer reference verifier and does not make the M0F gate ready.
`npm run m0f:face-audit` runs the fixed non-dyadic bundle through this checker
and emits the standard deterministic experiment envelope with parameter, input,
and semantic SHA-256 hashes. A completed record still cannot be promoted to
scientific evidence merely by storing or re-hashing it.

`reference-verifier/projective-rational-3d.ts` adds an independent exact
homogeneous-BigInt substrate for static 3D signs: point normalization and
comparison, four-point orientation, oriented plane evaluation, and axis-drop
2D orientation. The kernel itself does not classify triangle contact or
overlap and does not evaluate any time interval. In particular, exact CCD work
that assumes
constant vertex velocity cannot be applied directly to nonlinear rigid-origami
rotation. See `docs/projective-rational-3d-v1.md`.

`geometry/static-rational-triangle-overlap.ts` composes those signs into an
exact classifier for two nondegenerate closed triangles at one fixed 3D
configuration. It distinguishes disjoint, coplanar intersection, and
noncoplanar intersection; every boundary contact counts as intersection. It
does not decide legal contact versus penetration and does not inspect a motion
interval. Hostile property-key text is capped at 128 code units per diagnostic
path segment. The component is not CCD or collision-freedom evidence. See
`docs/static-rational-triangle-overlap-v1.md`.

`geometry/static-rational-triangle-overlap-census.ts` applies that classifier
once to every unordered pair in one caller-ID-bound triangle set. The closed,
fail-closed parser canonicalizes stable ASCII IDs, rejects duplicate or
malformed entries atomically, and currently caps one call at 64 triangles,
2,016 pairs, and 512 issues. Rendered diagnostic path segments are separately
capped at 128 code units. Those are defensive experiment ceilings, not a
SupportProfile. Shared-coordinate incidence labels are raw counts only: the
census does not decide mesh adjacency, legal contact, penetration,
self-intersection, continuous collision freedom, CCD, verification, or GO. See
`docs/static-rational-triangle-overlap-census-v1.md`.

`reference-verifier/static-rational-triangle-overlap-audit.ts` independently
rechecks one complete static pair record with its own closed parser, exact
barycentric active-set feasibility solver, rational Gaussian elimination, and
coplanarity determinant. The audit source imports neither the producer
classifier nor its projective-rational kernel. A `consistent` result means only
that both candidate implementations agreed on that supplied static pair; it is
not legal-contact, penetration, CCD, collision-free, `verified`, or M0F `GO`
evidence. See `docs/static-rational-triangle-overlap-audit-v1.md`.

`reference-verifier/static-rational-triangle-overlap-census-audit.ts` extends
that independence boundary to the complete bounded set ledger. It owns its
closed portable snapshot parser, canonical ID ordering, nondegeneracy and raw
incidence checks, derives every expected unordered pair from the supplied
geometry, calls the independent pair auditor exactly once per pair, and
recomputes all counters instead of trusting producer rows. A matching result is
still only candidate consistency for one supplied static set. It is not source
identity, topology, legal-contact, penetration, motion-interval, CCD,
collision-free, `verified`, or M0F `GO` evidence. See
`docs/static-rational-triangle-overlap-census-audit-v1.md`.

`geometry/static-rational-triangle-intersection-locus.ts` constructs the exact
raw closed intersection set for one static triangle pair. It distinguishes
empty, point, ordered segment, and canonical three-through-six-vertex coplanar
polygon loci and records the exact supporting-plane relation. Every output
point is checked against both planes and both closed triangles. The result does
not name a hinge, legal contact, penetration, or self-intersection and has no
time interval or independent locus audit. See
`docs/static-rational-triangle-intersection-locus-v1.md`.

`geometry/static-rational-triangle-intersection-strata.ts` refines a nonempty
locus by locating its point or exact open-segment midpoint at a source-triangle
vertex, edge, or relative interior. It separates an exact noncoplanar segment
through both relative interiors from boundary-supported contact candidates and
from coplanar area overlap that needs layer order. It deliberately leaves mesh
identity, declared incidence, side history, legal contact, penetration, and
self-intersection undecided. See
`docs/static-rational-triangle-intersection-strata-v1.md`.

`geometry/static-rational-triangle-intersection-strata-census.ts` retains that
full exact locus/strata record for every unordered pair in the same bounded
64-triangle, 2,016-pair set contract. It checks dependency contracts, pair
ordering, raw shared-coordinate incidence, character counters, history/layer
requirements, and atomic failure without silently excluding adjacent-looking
pairs. This is complete only for one accepted caller-supplied static set; it
still has no external mesh binding, declared hinge policy, legal-contact
decision, motion interval, CCD, self-intersection verdict, verification, or GO
claim. See
`docs/static-rational-triangle-intersection-strata-census-v1.md`.

`geometry/static-rational-triangle-fold-mesh-binding.ts` bridges one validated
candidate FOLD face reconstruction to one exact static 3D pose. It binds every
reconstructed triangle ID to its face and ordered mesh vertex IDs, requires one
consistent exact point per mesh vertex, retains boundary and two-face hinge
segments, and labels every triangle pair as same-face, hinge-adjacent, or
nonadjacent. Extra flat-fold coordinate coincidence remains distinct from mesh
incidence. Caller revision IDs are labels rather than hashes, and no legal
contact, self-intersection, CCD, verification, or GO decision is made. See
`docs/static-rational-triangle-fold-mesh-binding-v1.md`.

`geometry/static-rational-triangle-fold-mesh-strata.ts` joins that topology to
the exact all-pair locus/strata census. Exact feature-containment tests separate
same-face triangulation contact, contact on one declared hinge segment,
hinge-adjacent off-axis intersection, nonadjacent point/boundary contact,
coplanar area, and nonadjacent relative-interior 3D crossing. The latter is
retained as actual static self-intersection evidence at the bound pose, while
the final self-intersection decision remains false until source hashes,
contact/history/layer policy, and complete nonlinear CCD exist. See
`docs/static-rational-triangle-fold-mesh-strata-v1.md`.

`geometry/static-rational-triangle-nonadjacent-crossing-witness.ts` serializes
every detected nonadjacent interior crossing as canonical-decimal triangle and
strict-interior-point evidence. The import-free
`reference-verifier/static-rational-triangle-nonadjacent-crossing-audit.ts`
independently checks nonadjacency against the complete declared hinge face-pair
ledger, nonparallel exact planes, plane membership, and strict relative
interiority in both triangles. A nonempty consistent audit confirms positive
static crossing evidence, not absence, source provenance, continuous CCD, or a
final product decision. See
`docs/static-rational-triangle-nonadjacent-crossing-audit-v1.md`.

`reference-verifier/static-rational-triangle-overlap-census-evidence.ts`
creates JSON-portable canonical-decimal evidence only after a successful fresh
whole-census replay. Separate domain-separated SHA-256 values bind the complete
triangle-ID/geometry set, producer census, fresh audit, and full payload; the
payload also fixes the independent auditor source closure. Parsing captures an
owned hostile-data snapshot, reruns the current whole audit, and checks every
saved field and hash. This is deterministic candidate damage-detection and
replay evidence, not a signature, external mesh revision, contact policy,
self-intersection result, `verified`, or GO claim. See
`docs/static-rational-triangle-overlap-census-evidence-v1.md`.

`geometry/affine-origin-rotation-swept-aabb.ts` supplies an exact conservative
broad-phase bound for one triangle pair on one dyadic slab. Its only supported
motion contract has an origin that is affine between exact endpoints while the
local triangle may undergo any `SO(3)` rotation. The L1 radius of each local
vertex encloses every such rotation; only a strict exact gap between the two
swept AABBs produces a local pair/slab separation certificate. Boundary
equality and box overlap remain candidates, and unsupported motion or exhausted
arithmetic returns `indeterminate`. Independent tests cover 25 exact rotations,
750 sampled points, 200 deterministic pair oracles, hostile input, and both
arithmetic-budget stages. This is not nonlinear narrow-phase CCD, a legal
contact decision, complete model coverage, collision freedom, `verified`, or
M0F `GO` evidence. See
`docs/affine-origin-rotation-swept-aabb-v1.md` and
`docs/nonlinear-rigid-motion-ccd-research-v1.md`.

`geometry/affine-origin-rotation-swept-aabb-census.ts` canonicalizes up to 64
motion primitives and records all 2,016 possible unordered pairs in stable ID
order. Separated, overlap-candidate, and indeterminate results are retained
without promotion. The aggregator independently reconstructs each determinate
pair's exact AABB from its input primitive, rejects unsupported-motion
promotion, status-changing dependency records, false certificates, and partial
classifier failures, and checks every counter against the complete bounded
ledger. Independent integer-oracle tests replay 24 deterministic random sets.
`completePairEnumeration` applies only to the accepted supplied set; it does
not prove source completeness, time coverage, CCD, collision freedom,
verification, or GO. See
`docs/affine-origin-rotation-swept-aabb-census-v1.md`.

`geometry/single-hinge-rotation-swept-aabb-step.ts` binds that census to one
complete exact-rational FOLD mesh pose and one declared hinge that is a bridge
in the source-face dual graph. It derives the moving component by deleting the
active adjacency, gives every moving triangle the same exact hinge-point
origin, gives each stationary triangle its first vertex as a tighter fixed
origin, and joins every broad-phase row back to the complete topology pair
ledger. Arbitrary `SO(3)` enclosures conservatively contain the declared
fixed-axis rotation and stationary identity pose, but no angle schedule,
nonlinear narrow phase, legal-contact decision, complete path coverage,
collision-free result, verification, or GO claim is made. See
`docs/single-hinge-rotation-swept-aabb-step-v1.md`.

`geometry/single-hinge-rigid-pose-transition.ts` then binds complete start and
end poses to that same derived graph cut. Exact rational axial coordinates,
axis distances, a common cosine and oriented-sine parameter, the rotation unit
identity, and the Rodrigues endpoint equation must agree for every moving mesh
vertex; every stationary vertex and the full hinge segment must remain fixed.
This rejects a chained second-hinge pose even when every individual source face
is rigid. It proves one orientation-preserving fixed-axis endpoint map, not an
angle branch/winding, intermediate schedule, nonlinear CCD, source hash,
collision-free result, verification, or GO. See
`docs/single-hinge-rigid-pose-transition-v1.md`.

`geometry/single-hinge-rational-half-angle-schedule.ts` selects a finite
principal, zero-winding tangent-half-angle path for an accepted non-half-turn
transition. It emits one exact quadratic-over-quadratic x/y/z path per mesh
vertex with a shared denominator that is strictly positive on the whole time
slab. All moving vertices share one Rodrigues rotation; stationary vertices
cancel the common denominator exactly; both complete endpoint poses are
re-evaluated before success. This is a real continuous rigid-component path,
but it does not handle the half-turn chart, check M/V direction, isolate
collision roots, decide legal contact/self-intersection, prove collision
freedom, verify a product result, or imply GO. See
`docs/single-hinge-rational-half-angle-schedule-v1.md`.

`geometry/single-hinge-rational-schedule-static-sample.ts` evaluates that
schedule at one canonical dyadic time, rebuilds every mesh triangle, rechecks
source-face rigidity and topology, and runs the complete exact mesh-bound 3D
intersection-strata census. A detected nonadjacent relative-interior crossing
is actual static self-intersection evidence at that schedule time. The sampler
has a regression where one accepted rigid component rotation ends in such a
crossing across all six triangles and fifteen pairs. An empty sample still says
nothing about unsampled time; event-root isolation, interval CCD, legal-contact
policy, collision freedom, verification, and GO remain false. See
`docs/single-hinge-rational-schedule-static-sample-v1.md`.

`geometry/single-hinge-rational-schedule-event-polynomial-census.ts` derives
all six vertex-face plane and nine edge-edge coplanarity conditions for every
inter-source-face triangle pair as exact primitive integer polynomials in
normalized time. The common positive schedule denominator is removed without
changing sign; degree is at most six; persistent zero polynomials are retained.
Tests compare every polynomial sign with the actual exact 3D orientation at
three times. These are necessary event conditions only. This layer itself does
not isolate roots or test feature containment. The downstream root and time
partition candidates do the former; the single-root adapters and the global
finite-root ledger below do the latter for every finite occurrence. CCD, contact
policy, collision freedom, verification, and GO remain false. See
`docs/single-hinge-rational-schedule-event-polynomial-census-v1.md`.

`geometry/primitive-integer-polynomial-unit-interval-root-isolation.ts`
provides the next arithmetic layer: exact endpoint multiplicities,
square-free reduction, Sturm sign-variation counts, and disjoint rational open
intervals for every distinct interior root of a primitive integer polynomial
of degree at most six. Tests include repeated rational and irrational roots,
six split-point roots, and 32 deterministic factorization oracles. It has no
geometry/contact semantics by itself. See
`docs/primitive-integer-polynomial-unit-interval-root-isolation-v1.md`.

`geometry/single-hinge-rational-schedule-event-root-census.ts` composes those
two layers and isolates the complete closed-unit-interval root set of every
necessary event polynomial. It retains persistent zero rows, endpoint and
repeated-root multiplicities, exact rational interior isolating intervals, and
aggregate subdivision counters in one source-bound ledger. Roots belonging to
different events are intentionally independent in this record. The downstream
common-refinement and time-partition candidates merge them, but coplanarity
alone is not feature containment or collision; legal-contact policy, CCD,
collision freedom, verification, and GO remain false. See
`docs/single-hinge-rational-schedule-event-root-census-v1.md`.

`geometry/primitive-integer-polynomial-unit-interval-root-common-refinement.ts`
isolates a bounded polynomial set, proves equality of overlapping algebraic
roots with exact polynomial GCD plus Sturm counts, and refines unequal roots
until their rational certificates are strictly ordered and separated. Exact
endpoint roots are merged; persistent zero polynomials remain outside the
discrete classes. See
`docs/primitive-integer-polynomial-unit-interval-root-common-refinement-v1.md`.

`geometry/primitive-integer-polynomial-algebraic-root-sign.ts` determines the
exact sign of one primitive integer query polynomial at one selected isolated
root of another polynomial. A persistent or same-root query gives zero;
endpoints use exact substitution; an unequal interior query uses the rational
midpoint of a common-refinement certificate proven free of query roots.
Homogeneous integer Horner evaluation preserves the original query sign and
has a defensive bit ceiling. This is the arithmetic prerequisite for exact
feature containment, not containment or collision classification itself. See
`docs/primitive-integer-polynomial-algebraic-root-sign-v1.md`.

`geometry/single-hinge-rational-schedule-vertex-face-root-containment.ts`
binds one selected finite vertex-face coplanarity root to its exact triangle
feature. Three projected face-area signs select the first nondegenerate cyclic
projection, and three area-relative edge-orientation signs classify the vertex
as `outside`, `vertex`, `edge`, or `interior`. A representative irrational root
is proven to lie on the named face edge. Persistent coplanarity and degenerate
faces fail closed. The global finite-root ledger below batches this adapter over
every finite occurrence; persistent-event subdivision, geometric history,
legal-contact policy, CCD, collision freedom, verification, and GO remain
unresolved. See
`docs/single-hinge-rational-schedule-vertex-face-root-containment-v1.md`.

`geometry/single-hinge-rational-schedule-edge-edge-algebraic-containment.ts`
binds one selected finite edge-edge coplanarity event root to its exact segment
features. Nonparallel directions use three direction-cross plus four projected
endpoint-orientation signs. Parallel directions additionally bind both exact
direction vectors and their carrier-line offset cross product; noncollinear
carriers are disjoint, while a collinear branch orders both intervals on the
first nonzero exact coordinate and distinguishes a gap, endpoint contact, and
positive-length overlap. The branch-specific evidence ledgers contain 7, 12,
or 14 algebraic sign proofs. The shared positive schedule denominator and
primitive normalization preserve every source sign. Degenerate edges and
persistent coplanarity still fail closed. The global finite-root ledger below
composes this adapter with the vertex-face classifier over every finite
occurrence; persistent-event subdivision, geometric history, legal-contact
policy, collision completeness, CCD, collision freedom, verification, and GO
remain unresolved. See
`docs/single-hinge-rational-schedule-edge-edge-algebraic-containment-v1.md`.

`geometry/single-hinge-rational-schedule-global-event-time-partition.ts`
replays that refinement over every event polynomial, joins every finite root
occurrence back to its exact event row, and emits start/end plus ordered
algebraic boundaries. Each intervening open time cell receives a canonical
dyadic actual-time sample inside a certified rational gap. A symmetric
two-face regression merges 30 independent rows into one interior boundary.
The partition proves that its finite necessary-event polynomials have no root
inside each open cell; it still does not classify feature containment,
persistent contact, self-intersection, legal contact, or CCD. See
`docs/single-hinge-rational-schedule-global-event-time-partition-v1.md`.

`geometry/single-hinge-rational-schedule-global-event-cell-static-samples.ts`
uses one bounded owned transition snapshot for that partition and every
downstream sample, then retains the complete exact static mesh strata at the
canonical dyadic time in every open cell. On the symmetric three-face
irrational-event fixture, the first cell contains three nonadjacent interior
crossing pairs and the second contains none. A negative sample does not prove
cell-wide constancy: complete boundary-pose static strata, persistent events,
left/right geometric history, collision completeness, legal-contact policy,
CCD, collision freedom, verification, and GO remain unresolved. See
`docs/single-hinge-rational-schedule-global-event-cell-static-samples-v1.md`.

`geometry/single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger.ts`
joins every global boundary to its immediate left and/or right open-cell
sample, compares every canonical triangle-pair strata signature on two-sided
boundaries, and retains exact categorical counter deltas plus only the changed
pair rows. The symmetric three-face fixture changes three of fifteen pair rows
across its single interior algebraic boundary. This is sample-side change
evidence only: it neither evaluates geometry at the root nor proves that a
sample difference occurs at that boundary, that strata are constant within an
open cell, or that the necessary event family is collision-complete. Persistent
events, legal contact, CCD, collision freedom, verification, and GO remain
unresolved. See
`docs/single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger-v1.md`.

`geometry/single-hinge-rational-schedule-global-event-boundary-finite-root-classification-ledger.ts`
composes that delta ledger once, reuses its single owned polynomial/root census,
and classifies every finite vertex-face and edge-edge root occurrence in
canonical boundary order through compact single-root adapters. Per-occurrence
rows retain their exact auxiliary sign evidence without duplicating the central
census. The symmetric three-face fixture classifies 82 occurrences while the
same interior boundary has only three changed static triangle-pair rows, so
occurrence counts are explicitly not deduplicated collision-event counts.
The four-face loopback fixture reaches four finite, multiplicity-two
`collinear-overlap` start roots and exercises the complete fourteen-row branch.
Persistent events, approach/separation history, open-cell constancy,
legal-contact policy, collision completeness, CCD, collision freedom,
verification, and GO remain unresolved. See
`docs/single-hinge-rational-schedule-global-event-boundary-finite-root-classification-ledger-v1.md`.

`geometry/single-hinge-rational-schedule-global-event-boundary-finite-root-side-sign-ledger.ts`
composes the finite-root ledger once and evaluates each defining primitive
integer polynomial at every available adjacent canonical open-cell sample by
exact homogeneous Horner arithmetic. A root-free connected cell makes that
nonzero oriented sign constant throughout the cell; every interior root is
also checked against the odd/even multiplicity sign-parity theorem. Endpoint
history remains one-sided. A four-face loopback fixture fixes the interior
multiplicity-two same-sign branch as well as collinear-overlap containment.
The retained sign is convention-dependent, not a
Euclidean distance: it proves neither magnitude monotonicity nor geometric
approach/separation, feature-strata constancy, collision-event causality, legal
contact, or CCD. See
`docs/single-hinge-rational-schedule-global-event-boundary-finite-root-side-sign-ledger-v1.md`.

`geometry/single-hinge-rational-schedule-persistent-event-cell-static-pair-sample-ledger.ts`
composes the global event-cell sampler once, proves each root-census persistent
polynomial and isolation record have the canonical `[0]` identity, joins that
event exactly to its partition row and common-refinement reference, then
records its associated exact static triangle-pair signature at every canonical
open-cell sample. The symmetric fixture contains five persistent
edge-edge rows whose associated pair category changes from a nonadjacent
interior crossing in the first cell to disjoint in the second. This is
pair-level sampled evidence, not event-specific feature containment. It does
not establish category constancy inside a cell, persistent-event subdivision,
boundary-pose geometry, legal contact, CCD, or collision freedom. See
`docs/single-hinge-rational-schedule-persistent-event-cell-static-pair-sample-ledger-v1.md`.

The affine-origin rotation swept-AABB census also has a closed one-job
module-Worker boundary. Its protocol
preserves `BigInt` through bounded structured-clone snapshots, binds every
terminal response to stable source/job IDs and the exact canonical source
input, and independently reconstructs source-derived AABBs, the producer's
first-axis certificate, pair order, and counters without running the census on
the main thread. There is no forced timeout, main-thread fallback, or invented
progress message. `AbortSignal` terminates the Worker; every terminal path
removes listeners and releases it. Real same-origin module-Worker smoke checks
cover repeatable success, in-flight cancellation, and pre-abort in Chromium,
Edge, and Firefox. This remains a broad-phase transport boundary, not CCD or a
SupportProfile. See
`docs/affine-origin-rotation-swept-aabb-census-worker-v1.md`.

`npm run m0f:face-evidence` emits the same candidate slice as a closed,
source-set-hash-bound persisted evidence record which can be re-audited.
`npm run m0f:face-mutations` emits the canonical eleven-case mutation result;
`-- --suite` emits its closed suite definition. Both remain candidate-only and
are inputs to the stage subgate, not scientific decisions.

`npm run m0f:ref-fold-nofaces-candidate` verifies a committed, project-authored
`REF-FOLD-NOFACES` candidate vector outside the canonical fixture manifest.
`-- --write` deterministically regenerates its eight hash-bound artifacts and
closed ledger before replaying reconstruction, the separate audit, persisted
audit-evidence reaudit, and all eleven mutations. Success means reproducible
candidate evidence only: no ToleranceProfile, canonical promotion, scientific
verification, or global M0F gate is included. See
`docs/ref-fold-nofaces-candidate-bundle-v1.md`.

`npm run m0f:neg-fold-unsupported-candidate` verifies ten project-authored
exact-negative FOLD adapter vectors outside the canonical manifest. Independent
files cover multi-frame, initial 3D metadata, a four-vertex 3D-coordinate input,
three unsupported topology attributes, cuts, joins, and C/J assignments. The
accepted square control is replayed first; every negative source must then
reproduce its complete ordered issue code/path list. Here “exact-negative”
means deterministic rejection by this closed candidate adapter only, not full
FOLD invalidity, nonplanarity proof, or non-foldability. The eleven payload
hashes, provenance, exact file set, and regenerated bytes are checked without a
ToleranceProfile, canonical promotion, scientific claim, or global gate. See
`docs/neg-fold-unsupported-candidate-bundle-v1.md`.

`npm run m0f:neg-tree-candidate` verifies twelve project-authored
exact-negative ordered-tree parser vectors outside the canonical manifest. A
four-leaf star and a separate twenty-leaf boundary control must both parse
before every saved source replays its complete JSON-difference path list and
ordered issue code/path sequence. The thirteen payload hashes, provenance,
exact file set, and regenerated bytes are checked. This is regression evidence
for the current parser boundary only: it selects neither a SupportProfile nor a
ToleranceProfile and proves no tree-method feasibility, constructibility,
crease-pattern validity, or foldability. The twenty-first-leaf vector isolates
only the implemented upper bound; it does not independently cover leaf
underflow. No canonical promotion, scientific claim, or global gate is made.
See `docs/neg-tree-candidate-bundle-v1.md`.

`npm run m0f:neg-topology-candidate` verifies five project-authored
exact-negative artifact-contract topology sources outside the canonical
manifest. Two saved, hash-bound controls must parse first: the primary two-face
design contract and a connected filled-annulus FOLD contract with V8/E12/F5.
The negatives then fix complete control-difference paths and ordered parser
issue code/path arrays for an unsplit crossing, duplicate edge, zero-area face,
connected one-hole annulus, and edge with three incident face rings. The hole
source coherently removes the center face and becomes V8/E12/F4, isolating the
current connected-disk Euler check. This is only regression evidence for
`parseArtifactContractV1`; it does not prove planarization or reconstruction,
general hole recognition, manifold-checking completeness, CP validity,
constructibility, foldability, or collision freedom. It defines no
SupportProfile or ToleranceProfile and makes no canonical, scientific, or
global-gate claim. See `docs/neg-topology-candidate-bundle-v1.md`.

`npm run m0f:neg-layer-cycle-candidate` verifies one project-authored
exact-negative artifact-contract layer relation source outside the canonical
manifest. A saved, hash-bound accepted FOLD control is replayed first. The
negative adds one reverse relation at the same terminal time as the existing
relation, fixes the complete control-difference path, and requires the exact
single `$.layerEvents / layer-cycle` parser issue. This checks only acyclicity
of the declared relation graph at sampled active times. It does not establish
physical layer order or exercise the separate time-disjoint order-reversal
check, prove contact or path continuity, perform CCD, or establish collision
freedom. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made.
See `docs/neg-layer-cycle-candidate-bundle-v1.md`.

`npm run m0f:neg-order-reversal-candidate` verifies one project-authored
exact-negative artifact-contract source outside the canonical manifest. A
saved accepted FOLD control has a terminal point contact and one terminal layer
relation. The negative extends that same declared coplanar contact across
`[0,1]` and adds the opposite relation only at the initial point, so the two
directions remain time-disjoint while occurring within one continuous contact.
The complete saved-control difference and exact single
`$.layerEvents / layer-order-reversal` parser issue are replayed. This is only
declared contact/relation consistency; it does not infer contacts, establish
contact completeness or physical layer order, prove path continuity, perform
CCD, or establish collision freedom. No canonical, SupportProfile,
ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-order-reversal-candidate-bundle-v1.md`.

`npm run m0f:neg-layer-contact-coverage-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved accepted FOLD control declares one coplanar-overlap contact
and one same-direction layer relation over `[0,1]`. The negative delays only
the relation start to `0.25`, fixing the exact one-path difference and sole
`$.layerEvents / incomplete-layer-contact-coverage` parser issue. The parser
clips valid matching relation intervals to each continuous declared contact
and compares their closed union; touching intervals cover, while a positive
prefix, internal, or suffix gap does not. This checks declared participants
only. It does not complete a canonical contact fixture, infer physical contact,
establish contact completeness or legality, determine physical layer order or
order-reversal evidence, prove path continuity, perform CCD, establish
collision freedom or foldability, or verify certificate hashes. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-layer-contact-coverage-candidate-bundle-v1.md`.

`npm run m0f:neg-path-empty-segments-candidate` verifies one project-authored
exact-negative artifact-contract source outside the canonical manifest. Its
saved accepted bounded-interpolation control has one segment covering `[0,1]`.
The negative deletes only segment index 0, fixing one exact deletion path and
the sole parent-array `invalid-array` issue. This is only the current parser
boundary requiring at least one path segment. It does not establish time
coverage, select or complete a representation, establish angle, bound,
endpoint, derivative, or physical path semantics, prove rigidity, face
isometry, or hinge geometry, verify certificate hashes or cryptographic
authenticity, perform contact analysis or CCD, establish collision freedom or
foldability, or complete the canonical path-mutation family. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-empty-segments-candidate-bundle-v1.md`.

`npm run m0f:neg-path-unsupported-representation-kind-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved accepted bounded-interpolation control keeps a supported
motion kind. The negative changes only that kind to unsupported `spline`, fixing
one exact path and the sole leaf `invalid-enum` issue. This is only the current
representation-kind enumeration boundary. It does not select or complete a
representation, establish time coverage, angle, bound, endpoint, derivative, or
physical path semantics, prove rigidity, face isometry, or hinge geometry,
verify certificate hashes or cryptographic authenticity, perform contact
analysis or CCD, establish collision freedom or foldability, or complete the
canonical path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-unsupported-representation-kind-candidate-bundle-v1.md`.

`npm run m0f:neg-path-representation-version-mismatch-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved accepted bounded-interpolation control declares
`representationVersion` 1. The negative changes only that leaf to 2, fixing one
exact path and the sole `invalid-literal` issue. This is only the current fixed
representation-version boundary. It does not select or complete a
representation, establish time coverage, angle, bound, endpoint, derivative, or
physical path semantics, prove rigidity, face isometry, or hinge geometry,
verify certificate hashes or cryptographic authenticity, perform contact
analysis or CCD, establish collision freedom or foldability, or complete the
canonical path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-representation-version-mismatch-candidate-bundle-v1.md`.

`npm run m0f:neg-path-representation-status-escalation-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved accepted bounded-interpolation control keeps
`pathCandidate.representationStatus` at `candidate`. The negative changes only
that leaf to `verified`, fixing one exact path and the sole leaf
`claim-boundary` issue. This is only the current parser boundary that prevents
an unverified path declaration from promoting its own representation status. It
does not select or complete a representation, establish angle, bound, time,
endpoint, derivative, or physical path semantics, prove rigidity, face
isometry, or hinge geometry, verify certificate hashes or cryptographic
authenticity, perform contact analysis or CCD, establish collision freedom or
foldability, or complete the canonical path-mutation family. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-representation-status-escalation-candidate-bundle-v1.md`.

`npm run m0f:neg-path-endpoint-continuity-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. A saved accepted FOLD control splits one bounded-interpolation motion
into two contiguous segments whose declared hinge angles agree at `pi/2`. The
negative changes only the second segment's first angle to an in-bound `3*pi/4`
and fixes the exact one-path difference plus the single
`path-endpoint-discontinuity` parser issue. This checks exact agreement of
locally valid declarations only. It does not complete the canonical
`NEG-PATH-MUTATION-*` family, infer polynomial endpoints, prove rigid or
physical path continuity, face isometry, hinge geometry, crease-map
completeness, certificate hashes, or CCD. No canonical, SupportProfile,
ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-endpoint-continuity-candidate-bundle-v1.md`.

`npm run m0f:neg-path-endpoint-map-mismatch-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved accepted control expands the primary design to three faces
and two interior hinges; both contiguous bounded-interpolation segments declare
the same two-edge angle and interval-bound maps. The negative removes only the
`e-hinge-far` row from both maps of the second segment, fixing the exact two-path
difference and sole `path-endpoint-map-mismatch` issue while both segments stay
locally valid. This is adjacent declared-map comparison only, not physical hinge
drift or mesh completeness. It does not establish crease-map completeness,
endpoint or physical path continuity, polynomial endpoint semantics, rigidity,
face isometry, hinge geometry, certificate hashes, contacts, CCD, collision
freedom, foldability, or completeness of the canonical path-mutation family. No
canonical, SupportProfile, ToleranceProfile, scientific, or global-gate claim is
made. See `docs/neg-path-endpoint-map-mismatch-candidate-bundle-v1.md`.

`npm run m0f:neg-path-motion-map-mismatch-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved accepted three-face/two-hinge control declares two angle
rows and two interval-bound rows in each bounded-interpolation segment. The
negative deletes only the first segment's `e-hinge-far` bound row, fixing one
exact deletion path and the sole `motion-map-mismatch` issue; because that
segment is invalid, no adjacent endpoint-map secondary issue is inferred. This
is only equality of declared angle/bound row ID sets within one motion object,
not physical hinge-drift, mesh crease-map-completeness, or physical/conservative
angle-bound evidence. It does not establish endpoint or physical path
continuity, polynomial endpoint semantics, rigidity, face isometry, hinge
geometry, certificate hashes or authenticity, contacts, CCD, collision freedom,
foldability, or completeness of the canonical path-mutation family. No
canonical, SupportProfile, ToleranceProfile, scientific, or global-gate claim is
made. See `docs/neg-path-motion-map-mismatch-candidate-bundle-v1.md`.

`npm run m0f:neg-path-time-coverage-candidate` verifies four project-authored
exact-negative artifact-contract sources outside the canonical manifest. One
saved accepted two-segment bounded-interpolation FOLD control is reused for a
missing start prefix, an internal segment gap, a missing terminal suffix, and
a bounded-motion knot prefix gap. Every row fixes its complete saved-control
difference and exact sole `incomplete-time-coverage` parser issue. This is only
declared JSON time-coverage regression evidence. It does not complete the
canonical `NEG-PATH-MUTATION-*` family, establish endpoint or physical path
continuity, infer piecewise-polynomial coverage, prove rigidity, face isometry,
hinge geometry, or crease-map completeness, verify certificate hashes, infer
contacts, perform CCD, or establish collision freedom or foldability. No
canonical, SupportProfile, ToleranceProfile, scientific, or global-gate claim
is made. See `docs/neg-path-time-coverage-candidate-bundle-v1.md`.

`npm run m0f:neg-path-non-monotonic-knot-time-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment bounded-interpolation control declares
knot times `[0,0.5,1]` with matching angle and interval-bound cardinalities.
The negative replaces only the middle knot time with `0`, fixing one exact path
and the sole parent-array `non-monotonic-time` issue without secondary path
diagnostics. This is only the current parser's strict ordering boundary for
declared knot times. It does not establish time units, parameterization or
sampling semantics, a physical angle schedule or conservative bounds,
kinematic feasibility, endpoint or physical path continuity, representation
selection, crease-map completeness, polynomial semantics, rigidity, face
isometry, hinge geometry, certificate-hash verification or cryptographic
authenticity, contacts, CCD, collision freedom, or foldability; or complete the
canonical path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-non-monotonic-knot-time-candidate-bundle-v1.md`.

`npm run m0f:neg-path-angle-bound-candidate` verifies one project-authored
exact-negative artifact-contract source outside the canonical manifest. Its
saved accepted single-segment bounded-interpolation FOLD control declares three
knots, angles `[0,pi/2,pi]`, and two consecutive interval bounds. The negative
changes only the middle angle to `3*pi/4`, which is outside the first unchanged
bound and inside the second, fixing one exact path difference and the sole
`angle-outside-bound` issue. This is literal declared-angle containment only.
It does not establish physically valid angle bounds, a radian convention,
conservative bounds, kinematic feasibility, endpoint or physical path
continuity, crease-map completeness, polynomial endpoint semantics, rigidity,
face isometry, hinge geometry, certificate hashes, contacts, CCD, collision
freedom, foldability, or completeness of the canonical path-mutation family.
No canonical, SupportProfile, ToleranceProfile, scientific, or global-gate
claim is made. See `docs/neg-path-angle-bound-candidate-bundle-v1.md`.

`npm run m0f:neg-path-angle-knot-cardinality-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. It reuses the accepted single-segment three-knot control and deletes
only the terminal `e-hinge` angle, fixing one exact deletion path and the sole
`parallel-array-mismatch` issue. The invalid angle row produces no
`motion-map-mismatch`, `angle-outside-bound`, coverage, or endpoint secondary
issue. This is only declared angle-row cardinality against the local knot array.
It does not establish bound/knot-interval cardinality, crease-map or
representation completeness, a radian convention, physical angle schedules or
bounds, conservative bounds, kinematic feasibility, endpoint or physical path
continuity, polynomial semantics, rigidity, face isometry, hinge geometry,
certificate-hash verification or cryptographic authenticity, contacts, CCD, collision freedom,
foldability, or completeness of the canonical path-mutation family. No
canonical, SupportProfile, ToleranceProfile, scientific, or global-gate claim is
made. See `docs/neg-path-angle-knot-cardinality-candidate-bundle-v1.md`.

`npm run m0f:neg-path-duplicate-angle-crease-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment bounded-interpolation control declares
one valid `e-hinge` angle row and one matching interval-bound row. The negative
appends a valid clone of the angle row at index 1, fixing one exact addition
path and the sole leaf `duplicate-reference` issue. Set equality with the
interval-bound map remains unchanged, so there is no `motion-map-mismatch` or
other secondary path diagnostic. This is only declared angle-row
crease-reference uniqueness. It does not establish interval-bound-row
uniqueness, angle/knot or bound/knot-interval cardinality, motion- or crease-map
completeness, angle containment, knot ordering, time coverage, endpoint or
physical path continuity, representation selection, polynomial semantics,
rigidity, face isometry, hinge geometry, certificate-hash verification or
cryptographic authenticity, contacts, CCD, collision freedom, or foldability;
or complete the canonical path-mutation family. No canonical, SupportProfile,
ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-duplicate-angle-crease-candidate-bundle-v1.md`.

`npm run m0f:neg-path-bound-knot-interval-cardinality-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. It reuses the accepted single-segment three-knot/two-bound control and
deletes only the terminal interval bound, fixing one exact deletion path and
the sole `parallel-array-mismatch` issue. The invalid bound row produces no
motion-map, angle-containment, coverage, or endpoint secondary issue. This is
only declared bound-row cardinality against the local knot-interval count. It
does not establish the sibling angle/knot boundary, crease-map or
representation completeness, a radian convention, physical or conservative
bounds, kinematic feasibility, endpoint or physical path continuity, polynomial
semantics, rigidity, face isometry, hinge geometry, certificate-hash
verification or cryptographic authenticity, contacts, CCD, collision freedom,
foldability, or completeness of the canonical path-mutation family. No
canonical, SupportProfile, ToleranceProfile, scientific, or global-gate claim is
made. See
`docs/neg-path-bound-knot-interval-cardinality-candidate-bundle-v1.md`.

`npm run m0f:neg-path-duplicate-interval-bound-crease-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment bounded-interpolation control declares
one valid `e-hinge` angle row and one matching interval-bound row. The negative
appends a valid clone of the interval-bound row at index 1, fixing one exact
addition path and the sole leaf `duplicate-reference` issue. Set equality with
the angle map remains unchanged, so there is no `motion-map-mismatch` or other
secondary path diagnostic. This is only declared interval-bound-row
crease-reference uniqueness. It does not establish angle-row uniqueness,
angle/knot or bound/knot-interval cardinality, motion- or crease-map
completeness, angle containment, knot ordering, time coverage, endpoint or
physical path continuity, representation selection, polynomial semantics,
rigidity, face isometry, hinge geometry, certificate-hash verification or
cryptographic authenticity, contacts, CCD, collision freedom, or foldability;
or complete the canonical path-mutation family. No canonical, SupportProfile,
ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-duplicate-interval-bound-crease-candidate-bundle-v1.md`.

`npm run m0f:neg-path-non-interior-motion-edge-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment control references the interior
`e-hinge` from both bounded-interpolation motion maps. The negative replaces
both row IDs with the existing boundary edge `e-top-left`, fixing the exact
ordered two-path delta and two `missing-reference` issues. The map key sets stay
equal, so no motion-map, angle-containment, coverage, or endpoint secondary
issue is inferred. This is only the current parser's declared interior-crease
motion-reference boundary. It does not detect physical hinge drift, infer edge
roles or assignment physics, establish crease-map or representation
completeness, angle/knot or bound/knot-interval cardinality, physical angle or
path semantics, rigidity, face isometry, hinge geometry, certificate-hash
verification or cryptographic authenticity, contacts, CCD, collision freedom,
foldability, or completeness of the canonical path-mutation family. No
canonical, SupportProfile, ToleranceProfile, scientific, or global-gate claim
is made. See
`docs/neg-path-non-interior-motion-edge-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-degree-range-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted control has two contiguous, locally valid degree-one
piecewise-polynomial segments. The negative replaces only the first segment's
degree with `0`, fixing one exact path and the sole `out-of-range` issue without
a coefficient-cardinality or other secondary path diagnostic. This exercises
only the zero-valued lower edge of the current parser's combined positive
safe-integer degree predicate; it does not exhaust fractional or unsafe-integer
inputs. It also does not select a representation, freeze a polynomial basis,
establish coefficient ordering, semantics or interval association, establish
derivative semantics or validation, infer polynomial endpoints, establish time
coverage or physical angle/path semantics, prove crease- or motion-map
completeness, rigidity, face isometry, hinge geometry, certificate-hash
verification or cryptographic authenticity, contacts, CCD, collision freedom,
or foldability; or complete the canonical path-mutation family. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-degree-range-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-coefficient-degree-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved single-segment design control is an owned clone of the
accepted degree-one piecewise-polynomial control and remains value-equal to the
raw-hash-anchored M0F design vector. The negative deletes only the terminal
coefficient from `[0,pi]`, fixing one exact deletion path and the sole
`coefficient-degree-mismatch` issue without motion-map or other path secondary
diagnostics. This is only declared coefficient-row cardinality against declared
degree. It does not select a representation, freeze a basis, establish
coefficient ordering, semantics, or interval association, establish derivative
semantics or validation, infer polynomial endpoints, establish physical angle
or path semantics, prove crease-map completeness, rigidity, face isometry,
hinge geometry, certificate-hash verification or cryptographic authenticity,
contacts, CCD, collision freedom, foldability, or completeness of the canonical
path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-coefficient-degree-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-empty-coefficient-rows-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment degree-one polynomial control declares
one `e-hinge` coefficient entry containing one valid row `[0,pi]` and one
matching derivative-bound entry. The negative deletes only that coefficient
row, fixing one exact deletion path and the sole parent `invalid-array` issue.
The coefficient edge ID remains registered, so map-set equality is unchanged
and there is no coefficient-degree, motion-map, or other secondary path
diagnostic. This is only the declared nonempty coefficient-row-array boundary.
It does not establish coefficient/degree cardinality, coefficient- or
derivative-bound-row reference uniqueness, motion- or crease-map completeness,
representation selection, polynomial basis, coefficient ordering, semantics,
or interval association, derivative semantics, endpoints, time coverage,
physical angle/path semantics, rigidity, face isometry, hinge geometry,
certificate-hash verification or cryptographic authenticity, contacts, CCD,
collision freedom, or foldability; or complete the canonical path-mutation
family. No canonical, SupportProfile, ToleranceProfile, scientific, or
global-gate claim is made. See
`docs/neg-path-polynomial-empty-coefficient-rows-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-non-finite-coefficient-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment degree-one polynomial control declares
one valid `e-hinge` coefficient row `[0,pi]` and matching derivative bounds.
The negative replaces only the terminal coefficient with JSON `null`, fixing
one exact path and the sole leaf `non-finite-number` issue. Row cardinality and
coefficient/derivative-bound edge-ID equality remain unchanged, so there is no
cardinality, motion-map, or other secondary path diagnostic. This is only the
current parser's finite-binary64 boundary for saved declared coefficient
values. It does not establish nonempty coefficient rows, coefficient/degree
cardinality, coefficient- or derivative-bound-row reference uniqueness,
motion- or crease-map completeness, representation selection, polynomial
basis, coefficient ordering, semantics, or interval association, derivative
semantics, endpoints, time coverage, physical angle/path semantics, rigidity,
face isometry, hinge geometry, certificate-hash verification or cryptographic
authenticity, contacts, CCD, collision freedom, or foldability; or complete the
canonical path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-non-finite-coefficient-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-duplicate-coefficient-crease-candidate`
verifies one project-authored exact-negative artifact-contract source outside
the canonical manifest. Its accepted single-segment degree-one polynomial
control declares one valid `e-hinge` coefficient row and one matching
derivative-bound row. The negative appends a valid clone of the coefficient row
at index 1, fixing one exact addition path and the sole leaf
`duplicate-reference` issue. Set equality with the derivative map remains
unchanged, so there is no `motion-map-mismatch` or other secondary path
diagnostic. This is only declared coefficient-row crease-reference uniqueness.
It does not establish derivative-bound-row uniqueness, coefficient/degree
cardinality, motion- or crease-map completeness, representation selection,
polynomial basis or coefficient semantics, derivative semantics, endpoints,
time coverage, physical angle/path semantics, rigidity, face isometry, hinge
geometry, certificate-hash verification or cryptographic authenticity,
contacts, CCD, collision freedom, or foldability; or complete the canonical
path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-duplicate-coefficient-crease-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-duplicate-derivative-bound-crease-candidate`
verifies one project-authored exact-negative artifact-contract source outside
the canonical manifest. Its accepted single-segment degree-one polynomial
control declares one valid `e-hinge` coefficient row and one matching
derivative-bound row. The negative appends a valid clone of the derivative-bound
row at index 1, fixing one exact addition path and the sole leaf
`duplicate-reference` issue. Set equality with the coefficient map remains
unchanged, so there is no `motion-map-mismatch` or other secondary path
diagnostic. This is only declared derivative-bound-row crease-reference
uniqueness. It does not establish coefficient-row uniqueness,
coefficient/degree cardinality, motion- or crease-map completeness,
representation selection, polynomial basis or coefficient semantics,
derivative semantics, validation, or conservative bounds, endpoints, time
coverage, physical angle/path semantics, rigidity, face isometry, hinge
geometry, certificate-hash verification or cryptographic authenticity,
contacts, CCD, collision freedom, or foldability; or complete the canonical
path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-duplicate-derivative-bound-crease-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-derivative-bounds-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved single-segment design control is an owned clone of the
accepted degree-one piecewise-polynomial control and remains value-equal to the
separately raw-hash-anchored M0F design vector. The negative replaces only the
`e-hinge` derivative lower bound from `0` to `2*pi`, fixing one exact path and
the sole parent-row `invalid-bounds` issue without secondary path diagnostics.
This is only the current parser's declared derivative lower/upper ordering
boundary. It does not establish derivative semantics, conservative proof, or
units; select a representation; freeze a polynomial basis; establish
coefficient ordering, semantics, or interval association; infer polynomial
endpoints; establish physical angle or path semantics; prove crease-map
completeness, rigidity, face isometry, hinge geometry, certificate-hash
verification or cryptographic authenticity, contacts, CCD, collision freedom,
or foldability; or complete the canonical path-mutation family. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-derivative-bounds-candidate-bundle-v1.md`.

`npm run m0f:neg-path-polynomial-motion-map-mismatch-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its accepted single-segment degree-one polynomial control declares
coefficient and derivative-bound rows for `e-hinge` and `e-hinge-far`. The
negative deletes only the far-hinge derivative-bound row, fixing one exact path
and the sole local `motion-map-mismatch` issue without secondary path
diagnostics. This is only the current parser's declared coefficient-row and
derivative-bound-row ID-set pairing boundary. It does not establish physical
hinge drift, mesh crease-map completeness, derivative semantics or conservative
proof, polynomial basis or coefficient semantics, endpoints, representation
selection, rigidity, face isometry, hinge geometry, certificate-hash
verification or cryptographic authenticity, contacts, CCD, collision freedom,
or foldability; or complete the canonical path-mutation family. No canonical,
SupportProfile, ToleranceProfile, scientific, or global-gate claim is made. See
`docs/neg-path-polynomial-motion-map-mismatch-candidate-bundle-v1.md`.

`npm run m0f:neg-path-mixed-representation-candidate` verifies one
project-authored exact-negative artifact-contract source outside the canonical
manifest. Its saved control has two contiguous, locally valid
bounded-interpolation segments with exact shared endpoint agreement. The
negative replaces only the second motion with a locally valid degree-one
piecewise-polynomial declaration, fixing the exact seven-path replacement and
sole `mixed-path-representation` issue without endpoint secondary inference.
This is only declared one-representation-per-path uniformity. It does not select
a representation, freeze either basis, establish polynomial coefficient,
derivative-bound, endpoint, or cross-representation semantics, include an
interval proof, establish endpoint or physical path continuity, rigidity, face
isometry, hinge geometry, certificate-hash verification or cryptographic authenticity,
contacts, CCD, collision freedom, foldability, or completeness of the canonical
path-mutation family. No canonical, SupportProfile, ToleranceProfile,
scientific, or global-gate claim is made. See
`docs/neg-path-mixed-representation-candidate-bundle-v1.md`.

`npm run m0f:neg-support-catalog-candidate` verifies project-authored
exact-negative mutations of the SupportProfile candidate catalog outside the
canonical manifest. A saved, hash-bound accepted catalog remains wholly
candidate-only: selections are null, evidence is pending, and profile hashes
are null. Independent mutations attempt premature frozen status, profile hash,
selected numeric boundaries, evidence, or other catalog-schema escalation and
must replay their complete difference paths and ordered parser issues. This is
only claim-boundary regression for `parseSupportProfileCandidatesV1`; it is not
the canonical `NEG-SUPPORT-BOUNDARY-*` family, a frozen SupportProfile, an
actual-input support check, or a termination argument. No canonical,
scientific, or global-gate claim is made. See
`docs/neg-support-catalog-candidate-bundle-v1.md`.

`npm run m0f:face-subgate` is a separate, stage-scoped candidate gate for the
canonical `REF-FOLD-NOFACES` fixture. It requires a typed evidence index, then
reruns both registered reconstruction and audit records from the registered
source and compares their full semantic hashes. It also reaudits the
source-set-hash-bound saved evidence and reruns the complete semantic mutation
suite against the fresh source-bound audit input. Manifest v2
`expectedOutcome` is observed but explicitly never accepted as stage evidence.
The current unpopulated fixture fails closed. Even a pass reports
`scientificClaim: false` and `globalM0fGate: "not-evaluated"`; see
`docs/face-complex-candidate-subgate-v1.md`.

`profiles/runtime-limits-v1.candidates.json` enumerates measurement search
points only. Every selection and evidence reference remains null/pending; the
runtime parser refuses to interpret that file as a frozen profile.

M0F-0B adds two other candidate-only boundaries:

- `profiles/support-profile-v1.candidates.json` keeps tree method, true grid
  box pleating, and FOLD verification in three closed constraint schemas. It
  contains no selected values, profile hash, or evidence.
- `schemas/artifact-contract-v1.schema.json` and `artifacts/contract.ts` define
  experiment inputs, normalized CP topology, targets, candidate paths,
  contacts, and layer events. Runtime validation checks cross-references,
  topology, time coverage, bounded-interpolation angle containment and adjacent
  endpoint declarations,
  layer acyclicity, opposite declared face orders, and closed layer-event
  interval-union coverage within one continuous coplanar contact, but never
  claims verification. The coverage check compares declared valid participant
  intervals only; it neither detects physical contact nor establishes contact
  completeness or a physically correct layer order.

See `docs/artifact-contract-v1.md` and
`docs/support-profile-candidates-v1.md` for the exact claim boundaries and the
data that must still be frozen before scientific certificate/profile schemas
can exist.

The fixture catalog uses manifest schema v2. It separates source metadata from
distributed-file records, applies the six-license allowlist to every file,
requires complete directory registration, and rejects link/realpath escapes.
See `docs/fixture-manifest-v2.md`.
