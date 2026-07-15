# M0F unresolved items v1

This list separates experimental measurements from decisions that would alter
the product contract. M0F-0 is not complete until every later item has an owner
and M0F `GO` is impossible while any required value remains unresolved.

## Determined in M0F-0A

- Stored paper axes and the explicit right-handed world transform.
- Front-face winding and reference normal.
- FOLD-compatible M/V fold-angle sign.
- Symbolic `above -> below` layer direction and acyclicity.
- Convention-vector canonicalization and domain-separated hash.

## Determined in M0F-0B

- Tree-method, true box-pleating, and FOLD verification use separate,
  discriminated SupportProfile candidate schemas.
- Candidate profiles cannot select a value, carry a profile hash, attach
  evidence, or claim frozen support.
- Generation and FOLD experiment inputs have separate closed contracts and
  target kinds; mixing them is rejected.
- Stable IDs, tree validity, mesh incidence, complete time coverage, contact
  region references, and layer DAG validity are runtime contract checks.
- The experiment artifact contract remains explicitly candidate-only and can
  never encode `verified` or `no-solution-certified`.

## Must be determined by experiment

- Every numeric value in `tolerance-profile-v1.json`, including sensitivity
  and holdout evidence.
- Fast orientation filter boundary and the optimized-vs-always-exact
  differential result.
- `coordMergeAbs` metric, threshold inclusion, and chain-merge policy.
- The single path representation, interval evidence schema, and closure bounds.
- Stable triangle identities and the face triangulation payload used by CCD.
- Region-scoped goal layer-order representation and its FOLD sign mapping.
- Typed evidence unions, evidence byte-length basis, and every semantic hash
  domain used by scientific artifact bundles.
- Conservative CCD bounds and the exact/extended-precision fallback boundary.
- Contact-event subdivision and overlap-region construction rules.
- Tree-method and box-pleating construction preconditions.
- Generation and FOLD `SupportProfile` limits and termination arguments.
- Square-cell treatment for arbitrary rectangular paper and `Nx`/`Ny` limits.
- Every value and safety margin in `runtime-limits-v1.json`.
- Browser memory, cancellation response, artifact-size, and repeatability limits.

## Experiment plumbing fixed in M0F-1A

- Candidate experiment records always set `scientificClaim: false` and cannot
  encode a product verification outcome.
- Parameter/input hashes, seed, repetition, reason code, and semantic hash are
  deterministic; clocks, durations, host text, and exception text are excluded.
- Parser and runner boundaries validate one owned plain-JSON snapshot before
  hashing and deep-freeze the accepted value.
- The orientation differential probe is runnable, but its filter threshold,
  coverage corpus, performance boundary, and scientific conclusion remain
  unresolved measurements listed above.

## Candidate M0F-2 square-grid prerequisite implemented

- A closed width-aware ordered-tree boundary now verifies tree topology,
  complete cyclic rotations, 2..20 leaves, internal widths, and reciprocal
  mirror dimensions/endpoints/reverse rotations. It does not quantize positions
  or establish geometric reflection evidence.
- A closed adapter now maps every validated tree edge one-to-one into the
  square-grid quantization input, preserving derived terminal/internal class,
  length, and width. It performs no enumeration or placement.
- A composed candidate slice now carries that traceable edge mapping through
  finite exact grid enumeration. It does not select a candidate or infer that
  an empty bounded result is a construction-level no-solution result.
- A metric-independent packing-input slice now records the unique integer edge
  path for all leaf pairs (190 at 20 leaves), including internal widths. The
  geometric separation metric and polygon/river placement remain unresolved.
- A compact finite-domain problem description now retains unassigned active-grid
  leaf domains, tree-edge dimensions, all leaf-pair path summaries, and positive
  residual paper. Metric selection, actual evaluable constraints, coordinate
  placement, polygon/river geometry, and residual-strip handling remain
  unresolved; this input skeleton is not a packing solver or feasibility result.
- An exact raw search-space audit now counts the active-grid vertices and the
  unconstrained Cartesian leaf-assignment surface with BigInt without
  materializing assignments. It applies no distinctness, non-overlap, river,
  boundary, symmetry, or residual-strip constraint and does not establish a
  solver capacity or support profile.
- A candidate packing-semantics record now limits a future squared-Euclidean
  leaf-pair check to a classical-tree-weight necessary filter. It does not
  adopt that filter as a global metric. The finished-width mapping,
  construction family, polygon/river/junction geometry, overlap gadgets,
  boundary contact, and residual-paper policy remain unresolved.
- A selected-candidate validator and independent polygon/river completed-result
  validator now check exact arithmetic, tree paths, residual paper, and source
  binding without repeating the full enumeration. A closed one-job Worker now
  runs the producer builder off the main thread and the client independently
  checks the source echo and completed result. Real-browser checks cover
  repeatability, cancellation, and pre-abort, but a measured response profile
  remains unresolved.
- A candidate-semantics Euclidean filter now evaluates exact leaf-pair lower
  bounds for one caller assignment. A bounded deterministic DFS can enumerate
  projected-anchor witnesses under only that relation and records whether it
  stopped at a witness limit, a state budget, or complete exhaustion of its
  modeled domain. A separate validator rebinds the finite problem and replays
  that DFS without calling the producer, problem builder, or full candidate
  enumerator. The producer and independent replay can run in two distinct
  one-job Workers with bounded main-thread relay checks, `AbortSignal`
  cancellation, no forced timeout, and no main-thread DFS fallback. Passing
  remains insufficient for packing; domain exhaustion is not a
  construction-level no-solution result. Three-browser smoke checks cover
  successful two-stage execution, search-stage cancellation, and pre-abort;
  measured response, cancellation, memory, and message profiles and the actual
  polygon, river, junction, overlap, boundary, residual-paper, and
  finished-width constraints remain unresolved.
- Rectangular paper is enumerated as finite exact square-cell candidates; one
  axis fills exactly and any unused extent on the other axis is retained as an
  explicit nonnegative positive-boundary strip.
- Terminal and internal branch lengths and widths use the same exact-rational
  nearest-integer rule. Zero width remains exactly zero, while every positive
  dimension must satisfy the caller-provided relative-error limit.
- A separate closed boundary independently recomputes the selected candidate's
  exact branch steps and fails atomically on an error or defensive step limit;
  it still assigns no paper coordinates.
- An exact lattice substrate now enumerates canonical vertices and the four
  permitted unit direction families while retaining the residual strip. Those
  primitives are unselected construction inputs, not creases or axial routes.
- The complete rectangular paper now has an exact counterclockwise boundary
  and a disjoint region partition retaining an optional positive-edge residual
  strip. Its grid/residual interface is geometry only and never implied to be
  a crease or fold assignment.
- Candidate enumeration now has a dedicated one-job browser Worker with no
  forced timeout, AbortSignal cancellation, deterministic cleanup, bounded
  closed messages, and result-level source-branch binding even for empty
  candidate arrays. Its real-browser checks are smoke tests rather than a
  frozen runtime profile.
- Near the defensive response ceiling, local validation remained finite but
  required about four seconds and roughly 441 MiB after parsing. Interactive
  limits and representative device measurements therefore remain unresolved.
- The result is limited to `square-grid-quantization-only`, fixes
  `scientificClaim: false`, and explicitly excludes placement and pleat routing.
- Axial/ridge/hinge creases, axial+N contours, rivers, junction gadgets, M/V,
  layer order, continuous paths, CCD, construction termination, and a measured
  support profile remain unresolved. The defensive enumeration ceilings and
  CLI error value are not selected product limits.
- The generic artifact contract still cannot persist the new exact cell-size
  and paper-region partition. Before a residual-strip candidate can feed a
  saved CP artifact, its schema and runtime checks must adopt that geometry and
  decide how a geometry-only interface is represented. This integration
  remains deliberately unresolved rather than silently discarding the strip or
  treating its interface as a crease.

## Candidate M0F-3A face slice implemented

- Binary64 source coordinates are converted exactly to dyadics; constructed
  intersections remain normalized BigInt rationals through arrangement, face
  enumeration, and triangulation.
- The reference pipeline reconstructs `faces_vertices: null` for one connected
  disk, emits a closed candidate result, and embeds lossless exact-coordinate
  metadata beside its display-only numeric FOLD projection.
- Input-array permutation and edge-direction metamorphic tests, exact topology
  invariants, Euler checks, triangle winding/count/coverage, and exact area
  preservation are automated.
- A same-kernel roundtrip parser restores exact metadata and rejects changed
  face/triangle IDs, indices, assignments, provenance, or display projection.
  It explicitly does not count as the independent reference verifier.
- This is a candidate reference slice only. Vertex-merge tolerance, holes and
  multiple components, product-stable IDs, independent external-FOLD
  compatibility, target construction, M/V solving, and layer ordering remain
  unresolved. The separate face-complex audit below covers only the saved exact
  topology subset.

## Candidate M0F-3A Worker boundary implemented

- A closed candidate-only request/response protocol validates owned snapshots
  and never permits a scientific claim.
- The browser client owns one Worker per job, has no forced timeout, terminates
  on every terminal path, and uses `AbortSignal` termination for cancellation.
- Standard FOLD JSON can be transferred as an owned UTF-8 `ArrayBuffer`; decode,
  parse, adaptation, and geometry then remain off the main thread. A successful
  transfer consumes and detaches that buffer.
- Stale valid job IDs, malformed responses, host exceptions, repeated messages,
  and late events are covered by deterministic unit tests with fixed outcomes.
- A test-only Vite page and Chromium, Edge, and Firefox E2E probes now exercise
  actual module Workers. They check transfer detachment, three-run byte-for-byte
  result repeatability, immediate abort settlement below a deliberately loose
  two second test ceiling, and non-consumption for pre-aborted work.
- Those smoke measurements do not freeze a runtime profile. Representative
  device cancellation distributions, memory, message-size, stress
  repeatability, and `maxWorkerMessageBytes` remain unresolved.

## Candidate M0F-3B separate face-complex audit implemented

- A closed saved bundle contains the raw NOFACES source and only the exact
  candidate vertex, edge, face, triangle, provenance, and topology fields.
- The checker has no producer geometry or exact-rational imports. It uses a
  separate homogeneous BigInt representation, rebuilds intersections and
  source subdivisions, and traverses an independently constructed dart rotation
  to recover face cycles.
- Exact endpoint bijections, assignment incidence, Euler counts, non-crossing
  diagonals, and triangle area coverage are checked without trusting producer
  ID generation; consistent full ID renaming remains valid.
- The result is limited to candidate `face-complex-only` consistency. A closed
  persisted evidence bundle binds the input, result, implementation identity,
  normalized auditor source-set hash, and domain-separated payload hash. A
  strict eleven-case semantic mutation suite and stage-scoped saved-rerun gate
  are implemented. The project-authored `REF-FOLD-NOFACES` source and all eight
  hash-bound candidate artifacts now exist in a deterministic, replayed bundle
  outside the canonical manifest. Its closed ledger rejects claim escalation,
  invented ToleranceProfile fields, artifact rewrites, and linked or unexpected
  entries. The canonical fixture remains intentionally unregistered and the
  stage gate therefore fails closed.
- Ten project-authored `NEG-FOLD-UNSUPPORTED-*` sources now form a separate
  deterministic candidate bundle outside the canonical manifest. One accepted
  square control and each source are replayed through the existing closed FOLD
  adapter; all ordered issue code/path rows, eleven payload hashes, provenance,
  and generated bytes must match. The 3D-coordinate row proves only rejection
  by the 2D tuple boundary, and the topology-named rows replay declared frame
  attributes rather than independently detecting those geometric properties.
  These are adapter regression vectors, not scientific negative results.
- Twelve project-authored `NEG-TREE-*` sources now form a separate deterministic
  candidate bundle outside the canonical manifest. A four-leaf star and a
  two-center twenty-leaf boundary control must remain accepted; every negative
  source then fixes its complete control-difference paths and ordered parser
  issue code/path list. Thirteen payload hashes, provenance, the exact file set,
  and regenerated bytes are checked. These are current ordered-tree parser
  regression vectors only, not a selected SupportProfile or evidence of
  tree-method feasibility, constructibility, CP validity, or foldability. The
  twenty-first-leaf row isolates only the implemented upper leaf bound; a
  separately reachable connected-tree leaf-underflow vector remains open.
- Five project-authored `NEG-TOPOLOGY-*` sources now form a separate
  deterministic candidate bundle outside the canonical manifest. Two saved
  controls anchor complete JSON-difference paths and ordered issue code/path
  arrays for an unsplit crossing, duplicate edge, exact zero-area face,
  connected one-hole annulus, and three-face edge incidence. The filled-annulus
  control is an accepted V8/E12/F5 disk; coherently removing its center yields
  V8/E12/F4 and isolates the current disk Euler rejection. This is exact
  regression evidence for the current artifact-contract parser, not evidence
  that the planarizer or reconstruction pipeline is complete, that holes are
  generally recognized or supported, or that manifold checking, CP validity,
  constructibility, foldability, or collision checking is complete.
- One project-authored `NEG-LAYER-CYCLE` source now forms a separate
  deterministic candidate bundle outside the canonical manifest. A saved
  accepted FOLD control anchors the exact one-entry difference and the single
  `$.layerEvents / layer-cycle` parser issue. This covers only a simultaneous
  directed cycle in declared relations; the separate candidate below covers a
  time-disjoint reversal only when one continuous contact is already declared.
  Physical layer inference, contact completeness, path continuity, and CCD
  remain open.
- One project-authored `NEG-ORDER-REVERSAL` source now forms a separate
  deterministic candidate bundle outside the canonical manifest. It fixes a
  continuous declared coplanar contact with opposite, time-disjoint endpoint
  layer relations and the single `$.layerEvents / layer-order-reversal` parser
  issue. This checks only consistency of supplied contact/relation records;
  contact inference and completeness, physical layer correctness, path
  continuity, CCD, and collision freedom remain open.
- One project-authored `NEG-LAYER-CONTACT-COVERAGE` source now forms a separate
  deterministic candidate bundle outside the canonical manifest. Its accepted
  control declares one coplanar contact and one same-direction layer relation
  over `[0,1]`; delaying only the relation start to `0.25` fixes an exact
  one-path delta and the sole
  `$.layerEvents / incomplete-layer-contact-coverage` issue. This is only a
  closed-union check over valid declared participant intervals. Canonical
  contact-fixture completeness, physical contact inference and completeness,
  contact legality, physical layer order, reversal evidence, path continuity,
  CCD, collision freedom, certificate verification, and foldability remain
  open.
- One project-authored `NEG-PATH-MUTATION-EMPTY-SEGMENTS` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted bounded-interpolation control has one segment covering `[0,1]`; the
  negative deletes only segment index 0, fixes the exact deletion path, and
  replays the sole parent-array `invalid-array` issue. This is only the current
  parser's nonempty-segments boundary. Time coverage, representation selection
  and completeness, angle, bound, endpoint, derivative, and physical path
  semantics, rigidity, face isometry, hinge geometry, certificate hashes and
  authenticity, the remaining canonical path mutations, contacts, CCD,
  collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-UNSUPPORTED-REPRESENTATION-KIND` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted bounded-interpolation control changes only the motion kind to the
  unsupported `spline` value, fixing the exact one-path delta and sole
  `invalid-enum` issue. This is only the current representation-kind
  enumeration boundary. Representation selection and completeness, time
  coverage, angle, bound, endpoint, derivative, and physical path semantics,
  rigidity, face isometry, hinge geometry, certificate hashes and authenticity,
  the remaining canonical path mutations, contacts, CCD, collision freedom,
  and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-REPRESENTATION-VERSION-MISMATCH` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted bounded-interpolation control declares representation version 1;
  the negative changes only that leaf to 2, fixes the exact one-path delta, and
  replays the sole `invalid-literal` issue. This is only the current fixed
  representation-version boundary. Representation selection and completeness,
  time coverage, angle, bound, endpoint, derivative, and physical path
  semantics, rigidity, face isometry, hinge geometry, certificate hashes and
  authenticity, the remaining canonical path mutations, contacts, CCD,
  collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-BOUNDED-FINITE-KNOT-TIMES` source now forms a separate
  deterministic candidate bundle outside the canonical manifest. Its accepted
  single-segment bounded-interpolation control declares knot times
  `[0,0.5,1]`; the negative appends JSON `null` only at index 3, fixes the exact
  one-path addition, and replays the sole leaf `non-finite-number` issue. The
  three valid knots remain, so angle/knot and bound/knot-interval cardinality,
  strict monotonicity, and endpoint coverage produce no secondary issue. This
  is only the current parser's finite-binary64 boundary for saved declared knot
  times. Time units, parameterization, sampling, cardinality, ordering,
  coverage, representation selection and completeness, angle, bound, endpoint,
  derivative and physical path semantics, rigidity, face isometry, hinge
  geometry, certificate hashes and authenticity, the remaining canonical path
  mutations, contacts, CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-BOUNDED-FINITE-ANGLES` source now forms a separate
  deterministic candidate bundle outside the canonical manifest. Its accepted
  single-segment bounded-interpolation control declares one `e-hinge` angle row
  `[0,pi/2,pi]`; the negative replaces only angle index 0 with JSON `null`,
  fixes the exact one-path delta, and replays the sole leaf `non-finite-number`
  issue. The array length and crease-reference set remain unchanged, and failed
  finite validation prevents containment inference, so cardinality, map, and
  containment produce no secondary issue. This is only the current parser's
  finite-binary64 boundary for saved declared angle values. Finite-knot
  handling, radian conventions, physical angle schedules and bounds,
  conservative bounds, kinematic feasibility, endpoint and physical path
  semantics, representation selection and completeness, rigidity, face
  isometry, hinge geometry, certificate hashes and authenticity, the remaining
  canonical path mutations, contacts, CCD, collision freedom, and foldability
  remain open.
- One project-authored
  `NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment bounded-interpolation control declares one `e-hinge`
  interval-angle-bound row `[[0,pi/2],[pi/2,pi]]`; the negative replaces only
  the first lower-bound coordinate with JSON `null`, fixes the exact one-path
  delta, and replays the sole leaf `non-finite-number` issue. Bound-row length,
  interval cardinality, and the crease-reference set remain unchanged, and
  failed finite-tuple validation prevents containment inference, so
  cardinality, map, and containment produce no secondary issue. This is only
  the current parser's finite-binary64 boundary for saved declared interval
  angle bounds. Finite-knot and finite-angle handling, radian conventions,
  physical angle schedules and bounds, conservative bounds, kinematic
  feasibility, endpoint and physical path semantics, representation selection
  and completeness, rigidity, face isometry, hinge geometry, certificate
  hashes and authenticity, the remaining canonical path mutations, contacts,
  CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUND-TUPLE-CARDINALITY-MISMATCH`
  source now forms a separate deterministic candidate bundle outside the
  canonical manifest. Its accepted single-segment bounded-interpolation
  control declares one `e-hinge` interval-angle-bound row
  `[[0,pi/2],[pi/2,pi]]`; the negative appends the finite third coordinate
  `pi` at index 2 of the first bound tuple, fixes the exact one-path addition,
  and replays the sole parent-row `invalid-tuple` issue, `must contain exactly
  2 finite numbers`. Outer bound-row length, interval count, and the
  crease-reference set remain unchanged, and failed tuple-cardinality
  validation prevents finite-coordinate, bound-map, and containment inference,
  so none produces a secondary issue. This is only the current parser's
  exact-size-two boundary for an inner bound tuple. Value finiteness, angle and
  knot handling, outer bound and knot-interval cardinality, ordering,
  containment, radian conventions, physical angle schedules and bounds,
  conservative bounds, kinematic feasibility, endpoint and physical path
  semantics, representation selection and completeness, rigidity, face
  isometry, hinge geometry, certificate hashes and authenticity, the remaining
  canonical path mutations, contacts, CCD, collision freedom, and foldability
  remain open.
- One project-authored
  `NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUNDS-INVERTED` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment bounded-interpolation control declares the first
  `e-hinge` interval angle bound `[0,pi/2]`; the negative raises only its lower
  bound from `0` to `3*pi/4`, fixes the exact one-leaf replacement, and replays
  the complete ordered parser oracle: parent-bound `invalid-bounds`, `lower
  bound must not exceed upper bound`, followed by parent-map
  `angle-outside-bound`, `interval bound for e-hinge must contain both adjacent
  knot angles`. The parser retains the finite inverted pair in its bound map,
  so literal containment follows the ordering failure. Tuple and outer-row
  lengths, interval cardinality, and the crease-reference set remain unchanged,
  and no finite, cardinality, or motion-map issue is added. This is only the
  current parser's saved literal bound-ordering and continued adjacent-angle
  containment boundary. Physically valid angle schedules and bounds,
  conservative bounds, kinematic feasibility, endpoint and physical path
  semantics, representation selection and completeness, rigidity, face
  isometry, hinge geometry, certificate hashes and authenticity, the remaining
  canonical path mutations, contacts, CCD, collision freedom, and foldability
  remain open.
- One project-authored
  `NEG-PATH-MUTATION-REPRESENTATION-STATUS-ESCALATION` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted bounded-interpolation control keeps
  `pathCandidate.representationStatus` at `candidate`; the negative changes
  only that leaf to `verified`, fixes the exact one-path delta, and replays the
  sole `claim-boundary` issue. This is only the current parser boundary against
  self-promoting an unverified path declaration. Representation selection and
  completeness, angle, bound, time, endpoint, derivative, and physical path
  semantics, rigidity, face isometry, hinge geometry, certificate hashes and
  authenticity, the remaining canonical path mutations, contacts, CCD,
  collision freedom, and foldability remain open.
- One project-authored `NEG-PATH-MUTATION-ENDPOINT-DISCONTINUITY` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. It fixes one exact angle change between two locally valid adjacent
  bounded-interpolation segments and the single endpoint-discontinuity parser
  issue. This is only declared-map equality. Polynomial endpoint semantics,
  face isometry, hinge geometry, physical rigidity, certificate hashes, the
  other canonical path mutations, and CCD remain open.
- One project-authored `NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. Its accepted expanded design declares identical two-edge angle and
  bound maps in adjacent bounded-interpolation segments; the negative removes
  the far-hinge row from both second-segment maps and fixes the exact two-path
  delta plus sole map-mismatch issue. This is not physical hinge-drift or mesh
  completeness evidence. Crease-map completeness, endpoint and physical path
  continuity, polynomial endpoint semantics, rigidity, face isometry, hinge
  geometry, certificate hashes, the remaining canonical path mutations,
  contacts, CCD, and collision freedom remain open.
- One project-authored
  `NEG-PATH-MUTATION-BOUND-KNOT-INTERVAL-CARDINALITY-MISMATCH` source now forms
  a separate deterministic candidate bundle outside the canonical manifest. It
  reuses the accepted three-knot/two-bound control, deletes only the terminal
  bound, fixes the exact one-path delta, and replays the sole
  `parallel-array-mismatch` issue without map, containment, coverage, or
  endpoint secondary diagnostics. This is only declared bound/knot-interval
  cardinality. The sibling angle/knot boundary, a radian convention, physical
  and conservative bounds, kinematic feasibility, endpoint and physical path
  continuity, polynomial semantics, rigidity, face isometry, hinge geometry,
  certificate hashes, the remaining canonical path mutations, contacts, CCD,
  and collision freedom remain open.
- One project-authored
  `NEG-PATH-MUTATION-DUPLICATE-INTERVAL-BOUND-CREASE` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment bounded-interpolation control has one valid
  interval-bound row; the negative appends a valid clone for the same
  `e-hinge`, fixes the exact one-path addition, and replays the sole leaf
  `duplicate-reference` issue without motion-map or other secondary path
  diagnostics. This is only declared interval-bound-row crease-reference
  uniqueness. Angle-row uniqueness, angle/knot and bound/knot-interval
  cardinality, motion- and crease-map completeness, containment, knot ordering,
  time coverage, endpoint and physical path semantics, polynomial semantics,
  rigidity, face isometry, hinge geometry, certificate hashes and authenticity,
  the remaining canonical path mutations, contacts, CCD, collision freedom,
  and foldability remain open.
- One project-authored `NEG-PATH-MUTATION-NON-INTERIOR-MOTION-EDGE` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. Its accepted control references interior `e-hinge` from both
  bounded motion maps; the negative replaces both IDs with the existing
  boundary edge `e-top-left`, fixes the exact ordered two-path delta, and
  replays two `missing-reference` issues without map, containment, coverage,
  or endpoint secondary diagnostics. This is only the current parser's
  declared interior-crease reference boundary. Physical hinge drift, edge-role
  inference, assignment physics, crease-map and representation completeness,
  angle and bound cardinality, endpoint and physical path continuity,
  polynomial semantics, rigidity, face isometry, hinge geometry, certificate
  hashes, the remaining canonical path mutations, contacts, CCD, and collision
  freedom remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted control has two contiguous valid degree-one polynomial segments;
  the negative replaces only the first degree with `0`, fixes the exact
  one-path delta, and replays the sole `out-of-range` issue without coefficient
  cardinality or other secondary path diagnostics. This exercises only the
  zero-valued lower edge of the current parser's combined positive safe-integer
  predicate and does not exhaust fractional or unsafe-integer inputs.
  Representation selection, basis freezing, coefficient ordering, semantics
  and interval association, derivative semantics and validation, polynomial
  endpoints, time coverage, physical angle and path semantics, crease- and
  motion-map completeness, rigidity, face isometry, hinge geometry,
  certificate hashes and authenticity, the remaining canonical path mutations,
  contacts, CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-COEFFICIENT-DEGREE-MISMATCH` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment degree-one polynomial control is value-equal to the
  separately raw-hash-anchored M0F design vector; the negative deletes only the
  terminal coefficient from `[0,pi]`, fixes the exact one-path delta, and
  replays the sole `coefficient-degree-mismatch` issue without secondary path
  diagnostics. This is only declared coefficient-row cardinality against
  degree. Representation selection, basis freezing, coefficient ordering,
  semantics and interval association, derivative semantics and validation,
  polynomial endpoints, physical angle and path semantics, crease-map
  completeness, rigidity, face isometry, hinge geometry, certificate hashes,
  the remaining canonical path mutations, contacts, CCD, and collision freedom
  remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-EMPTY-COEFFICIENT-ROWS` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment degree-one polynomial control has one `e-hinge`
  coefficient entry containing one valid row; the negative deletes only that
  row, fixes the exact one-path deletion, and replays the sole parent
  `invalid-array` issue without coefficient-degree, motion-map, or other
  secondary path diagnostics. This is only declared nonempty coefficient-row
  arrays. Coefficient/degree cardinality, coefficient- and derivative-bound-row
  reference uniqueness, motion- and crease-map completeness, representation
  selection, basis and coefficient semantics, derivative and endpoint
  semantics, time coverage, physical path semantics, rigidity, face isometry,
  hinge geometry, certificate hashes and authenticity, the remaining canonical
  path mutations, contacts, CCD, collision freedom, and foldability remain
  open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment degree-one polynomial control has coefficient row
  `[0,pi]`; the negative replaces only the terminal value with JSON `null`,
  fixes the exact one-path delta, and replays the sole leaf
  `non-finite-number` issue without cardinality, motion-map, or other secondary
  path diagnostics. This is only the current parser's finite-binary64 boundary
  for saved declared coefficient values. Nonempty rows, coefficient/degree
  cardinality, coefficient- and derivative-bound-row reference uniqueness,
  motion- and crease-map completeness, representation selection, basis and
  coefficient semantics, derivative and endpoint semantics, time coverage,
  physical path semantics, rigidity, face isometry, hinge geometry,
  certificate hashes and authenticity, the remaining canonical path mutations,
  contacts, CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-DUPLICATE-COEFFICIENT-CREASE` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment degree-one polynomial control has one valid
  coefficient row; the negative appends a valid clone for the same `e-hinge`,
  fixes the exact one-path addition, and replays the sole leaf
  `duplicate-reference` issue without motion-map or other secondary path
  diagnostics. This is only declared coefficient-row crease-reference
  uniqueness. Derivative-bound-row uniqueness, coefficient/degree cardinality,
  motion- and crease-map completeness, representation selection, basis and
  coefficient semantics, derivative and endpoint semantics, time coverage,
  physical path semantics, rigidity, face isometry, hinge geometry,
  certificate hashes and authenticity, the remaining canonical path mutations,
  contacts, CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-DUPLICATE-DERIVATIVE-BOUND-CREASE` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. Its accepted single-segment degree-one polynomial control has one
  valid derivative-bound row; the negative appends a valid clone for the same
  `e-hinge`, fixes the exact one-path addition, and replays the sole leaf
  `duplicate-reference` issue without motion-map or other secondary path
  diagnostics. This is only declared derivative-bound-row crease-reference
  uniqueness. Coefficient-row uniqueness, coefficient/degree cardinality,
  motion- and crease-map completeness, representation selection, basis and
  coefficient semantics, derivative validation and endpoint semantics, time
  coverage, physical path semantics, rigidity, face isometry, hinge geometry,
  certificate hashes and authenticity, the remaining canonical path mutations,
  contacts, CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment degree-one polynomial control is value-equal to the
  separately raw-hash-anchored M0F design vector; the negative replaces only
  the `e-hinge` derivative lower bound from `0` to `2*pi`, fixes the exact
  one-path delta, and replays the sole parent-row `invalid-bounds` issue without
  secondary path diagnostics. This is only declared derivative lower/upper
  ordering. Derivative semantics, conservative proof and units, representation
  selection, basis freezing, coefficient ordering, semantics and interval
  association, polynomial endpoints, physical angle and path semantics,
  crease-map completeness, rigidity, face isometry, hinge geometry,
  certificate hashes and authenticity, the remaining canonical path mutations,
  contacts, CCD, collision freedom, and foldability remain open.
- One project-authored
  `NEG-PATH-MUTATION-POLYNOMIAL-MOTION-MAP-MISMATCH` source now forms a
  separate deterministic candidate bundle outside the canonical manifest. Its
  accepted single-segment degree-one polynomial control declares coefficient
  and derivative-bound rows for two hinges; the negative deletes only the
  far-hinge derivative-bound row, fixes the exact one-path delta, and replays
  the sole local `motion-map-mismatch` issue without secondary path
  diagnostics. This is only declared coefficient-row and derivative-bound-row
  ID-set pairing within one polynomial motion. Physical hinge drift, mesh
  crease-map and representation completeness, derivative semantics and
  conservative proof, polynomial basis and coefficient semantics, endpoints,
  representation selection, rigidity, face isometry, hinge geometry,
  certificate hashes and authenticity, the remaining canonical path mutations,
  contacts, CCD, collision freedom, and foldability remain open.
- One project-authored `NEG-PATH-MUTATION-MIXED-REPRESENTATION` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. Its accepted control has two contiguous valid bounded segments;
  the negative replaces only the second motion with a locally valid degree-one
  polynomial declaration and fixes the exact seven-path delta plus sole
  `mixed-path-representation` issue without endpoint secondary inference. This
  is only declared one-representation-per-path uniformity. Representation
  selection, both candidate bases, polynomial and cross-representation
  semantics, interval proofs, endpoint and physical path continuity, rigidity,
  face isometry, hinge geometry, certificate hashes, the remaining canonical
  path mutations, contacts, CCD, and collision freedom remain open.
- One project-authored `NEG-PATH-MUTATION-MOTION-MAP-MISMATCH` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. From the accepted two-hinge control it deletes only the first
  bounded segment's far-hinge bound row, fixes the exact one-path deletion,
  and replays the sole local `motion-map-mismatch` issue without an adjacent
  endpoint secondary. This is only declared angle/bound row-ID set equality.
  Physical hinge drift, mesh crease-map completeness, physical or conservative
  angle bounds, endpoint and physical path continuity, polynomial endpoint
  semantics, rigidity, face isometry, hinge geometry, certificate hashes, the
  remaining canonical path mutations, contacts, CCD, and collision freedom
  remain open.
- Four project-authored `NEG-PATH-MUTATION-COVERAGE-*` sources now form a
  separate deterministic candidate bundle outside the canonical manifest.
  They reuse one accepted two-segment bounded-interpolation FOLD control and
  fix the exact start-prefix, internal-segment, terminal-suffix, and motion-knot
  coverage deltas plus their sole `incomplete-time-coverage` parser issues.
  This is only declared JSON time-coverage regression. Endpoint and physical
  path continuity, piecewise-polynomial coverage, rigidity, face isometry,
  hinge geometry, crease-map completeness, certificate hashes, the remaining
  canonical path mutations, contacts, CCD, and collision freedom remain open.
- One project-authored `NEG-PATH-MUTATION-NON-MONOTONIC-KNOT-TIME` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. Its accepted single-segment bounded-interpolation control declares
  knot times `[0,0.5,1]`; the negative replaces only the middle value with `0`,
  fixes the exact one-path delta, and replays the sole parent-array
  `non-monotonic-time` issue without secondary path diagnostics. This is only
  strict ordering of declared knot times. Time units, parameterization and
  sampling, a physical angle schedule and conservative bounds, kinematic
  feasibility, endpoint and physical path continuity, representation
  selection, crease-map completeness, polynomial semantics, rigidity, face
  isometry, hinge geometry, certificate hashes and authenticity, the remaining
  canonical path mutations, contacts, CCD, collision freedom, and foldability
  remain open.
- One project-authored `NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND` source now forms
  a separate deterministic candidate bundle outside the canonical manifest.
  Its accepted single-segment bounded-interpolation control declares three
  angles and two interval bounds; the negative changes only the middle angle,
  fixes the exact one-path delta, and replays the sole `angle-outside-bound`
  issue. This is only literal declared-angle containment. Physical angle-bound
  validity, a radian convention, conservative bounds, kinematic feasibility,
  endpoint and physical path continuity, crease-map completeness, polynomial
  endpoint semantics, rigidity, face isometry, hinge geometry, certificate
  hashes, the remaining canonical path mutations, contacts, CCD, and collision
  freedom remain open.
- One project-authored `NEG-PATH-MUTATION-ANGLE-KNOT-CARDINALITY-MISMATCH`
  source now forms a separate deterministic candidate bundle outside the
  canonical manifest. It reuses the accepted three-knot bounded-interpolation
  control, deletes only the terminal angle, fixes the exact one-path delta, and
  replays the sole `parallel-array-mismatch` issue without map, bound, coverage,
  or endpoint secondary diagnostics. This is only declared angle/knot
  cardinality. Bound/knot-interval cardinality, a radian convention, physical
  angle schedules and bounds, kinematic feasibility, endpoint and physical
  path continuity, polynomial semantics, rigidity, face isometry, hinge
  geometry, certificate hashes, the remaining canonical path mutations,
  contacts, CCD, and collision freedom remain open.
- One project-authored `NEG-PATH-MUTATION-DUPLICATE-ANGLE-CREASE` source now
  forms a separate deterministic candidate bundle outside the canonical
  manifest. Its accepted single-segment bounded-interpolation control has one
  valid angle row; the negative appends a valid clone for the same `e-hinge`,
  fixes the exact one-path addition, and replays the sole leaf
  `duplicate-reference` issue without motion-map or other secondary path
  diagnostics. This is only declared angle-row crease-reference uniqueness.
  Interval-bound-row uniqueness, angle/knot and bound/knot-interval
  cardinality, motion- and crease-map completeness, angle containment, knot
  ordering, time coverage, endpoint and physical path semantics, polynomial
  semantics, rigidity, face isometry, hinge geometry, certificate hashes and
  authenticity, the remaining canonical path mutations, contacts, CCD,
  collision freedom, and foldability remain open.
- Project-authored `NEG-SUPPORT-CATALOG-*` sources now form a separate
  deterministic candidate bundle outside the canonical manifest. They protect
  the candidate catalog from premature frozen status, profile hashes,
  selections, evidence, and schema escalation. This is not the canonical
  `NEG-SUPPORT-BOUNDARY-*` family: no boundary has been selected, no frozen
  profile or `checkSupport` exists, and actual-input support remains open.
- Independently reviewed evidence policy, project-authored and holdout fixture
  registration, representative measurements, and global-gate integration
  remain unresolved. Path rigidity, CCD, contact completeness, target
  attainment, and physical layer correctness are not checked.

## Candidate exact static 3D predicates implemented

- A separate canonical homogeneous-BigInt kernel now supplies exact static
  orient3D, oriented-plane, point-plane, and axis-drop orient2D signs. Its
  closed decimal-rational input boundary is bounded independently from the
  unbounded trusted typed API.
- A closed candidate classifier now distinguishes disjoint, coplanar
  intersection, and noncoplanar intersection for two nondegenerate closed
  triangles at one fixed configuration. Shared vertices, edge overlap, and
  tangency count as intersection.
- A fail-closed raw census now sorts caller-supplied stable triangle IDs and
  classifies every unordered pair exactly once under defensive ceilings of 64
  triangles, 2,016 pairs, and 512 issues, with diagnostic path segments capped
  at 128 code units. Its shared-coordinate incidence labels are not mesh
  topology or a legal-contact decision.
- An import-free independent auditor now rechecks one complete static pair
  record with an exact barycentric active-set method. Its `consistent` outcome
  is candidate agreement for that supplied record only, not verification.
- A separate whole-census auditor now derives every expected canonical pair
  from the supplied geometry, invokes the independent pair auditor, and
  independently replays pair ordering, raw incidence, and all aggregate
  counters. It does not import the producer classifier, producer census,
  projective-rational kernel, or shared clone helper.
- A pair-level exact constructor now returns the complete raw static
  intersection locus as empty, point, ordered segment, or a canonical
  three-through-six-vertex coplanar polygon. It does not interpret that locus
  as a legal contact, penetration, or self-intersection.
- A strata refinement now distinguishes boundary-supported contact candidates,
  exact noncoplanar segments through both triangle relative interiors, and
  coplanar area overlap that needs layer order. It still has no canonical mesh
  identity, declared incidence policy, or motion-side history, so it makes no
  legal-contact or self-intersection decision.
- A bounded strata census now retains that exact locus and relative-interior
  evidence for every one of the 2,016 possible pairs at the 64-triangle
  defensive ceiling. It checks all row/counter contracts and never silently
  excludes coordinate-incident pairs, but completeness applies only to the
  accepted caller-supplied static set and not to an external mesh or time
  interval.
- A candidate bridge now binds a complete reconstructed FOLD triangulation to
  one exact 3D pose, including face/triangle/vertex identities, structural
  hinge segments, and every topology pair relation. It detects additional
  flat-fold coordinate coincidence without confusing it with mesh incidence.
  Its revision IDs remain caller labels rather than an external source hash,
  and no contact-policy or self-intersection decision is promoted.
- A mesh-bound exact strata composition now separates internal triangulation
  contact, declared-hinge-contained contact, off-hinge intersection, and an
  exact relative-interior crossing between nonadjacent source faces. The last
  is retained as actual static 3D self-intersection evidence at one bound pose.
  Point/tangent/persistent/coplanar policy, independent replay, source hashes,
  and all-time CCD remain unresolved, so no final self-intersection or
  collision-free decision is claimed.
- Each positive nonadjacent interior crossing can now be exported as a portable
  exact strict-interior-point witness. An import-free auditor independently
  rechecks declared nonadjacency, nonparallel planes, plane membership, and
  strict inclusion in both triangles. This confirms positive supplied
  witnesses only; complete negative replay, source provenance, contact policy,
  and continuous-time coverage remain unresolved.
- JSON-portable evidence now binds the embedded canonical triangle-ID/geometry
  set, complete producer census, fresh whole-census audit, and current auditor
  source closure with separate domain-separated SHA-256 values. Its parser
  reruns the whole audit before accepting a saved record. The hashes are not a
  signature or external mesh/triangulation provenance.
- These static results do not distinguish legal adjacency/contact from
  penetration and do not establish a continuous collision-free interval. The
  raw locus is not a contact-policy decision. Exact CCD results that assume
  constant vertex velocity cannot be applied directly to nonlinear
  rigid-origami rotation.
- Binding caller IDs to an external canonical mesh revision and triangulation
  provenance, declared incidence exclusions, contact policy, an independent
  locus audit, conservative nonlinear-motion bounds, event subdivision,
  Worker execution evidence, signatures if required, representative
  measurements, and global-gate integration remain unresolved.

## Candidate nonlinear-motion broad phase implemented

- One exact swept-AABB candidate now encloses a local triangle under arbitrary
  `SO(3)` rotation plus an origin that is affine between exact endpoints on one
  canonical dyadic slab. Strict axis separation yields only a local pair/slab
  certificate; equality and overlap remain candidates.
- The enclosure and certificate were independently exercised with 25 exact
  rotations, 750 points, 200 deterministic pair oracles, and forced arithmetic
  budget failures. This is evidence for the candidate contract, not a product
  SupportProfile or a scientific claim.
- A bounded census now canonicalizes at most 64 supplied primitives and retains
  all 2,016 possible pair outcomes. It independently reconstructs determinate
  pair bounds, refuses unsupported-motion promotion, and was cross-checked on
  24 random sets with a separate integer oracle. Its completeness is limited to
  that accepted caller-supplied set.
- A single-hinge step adapter now binds the complete exact FOLD mesh pose to
  that census when the active declared hinge is a bridge in the source-face
  dual graph. It derives the moving component by graph cut, retains every
  triangle and topology pair, and encloses moving triangles about one exact
  hinge point. Stationary triangles use their first vertex as a tighter origin.
  The arbitrary-rotation supersets contain the declared fixed-axis rotation and
  stationary identity pose, but do not construct or verify an angle schedule.
- A complete start/end transition binder now proves, with exact rational
  axial/radial invariants and the Rodrigues equation, that every moving vertex
  shares one orientation-preserving rotation about that fixed hinge while all
  stationary vertices remain fixed. It rejects a chained second-hinge endpoint
  that per-face rigidity alone accepts. The endpoint parameters do not choose
  angle winding or define intermediate time, and caller mesh revisions still
  lack cryptographic source/reconstruction binding.
- For every accepted non-half-turn transition, a finite principal
  tangent-half-angle adapter now selects zero winding and emits the complete
  moving and stationary mesh-vertex paths as exact quadratic-over-quadratic
  functions of normalized time. One common denominator is proven positive on
  the unit interval, both endpoints are replayed exactly, and sampled tests
  preserve every moving pair distance. Every finite necessary-event occurrence
  is now classified across all global boundaries, but half-turn chart
  subdivision, M/V direction binding, persistent-event subdivision, and a
  collision-complete event family remain unresolved.
- One exact dyadic-time sampler now evaluates every vertex path, rebuilds every
  triangle, rechecks source-face rigidity/topology, and joins the complete
  static 3D intersection strata. A locked three-face moving component rotated
  about one active hinge produces independently classified nonadjacent interior
  crossing evidence at its endpoint. Global necessary-event cells now provide
  one exact sample per open interval. Every finite vertex-face and nondegenerate
  edge-edge occurrence on every global boundary is now classified exactly,
  including parallel carrier separation and a collinear interval branch.
  Occurrence rows are not deduplicated into physical collision events;
  persistent-event subdivision remains unresolved.
- A bounded event census now derives, for every inter-source-face triangle
  pair, all six vertex-face and nine edge-edge necessary coplanarity conditions
  as primitive integer polynomials of degree at most six. Every row's sign is
  cross-checked against exact 3D schedule evaluation at three times, and
  persistent zero polynomials are retained.
- A standalone degree-six primitive-integer root isolator now handles exact
  endpoint multiplicities, square-free reduction, Sturm counts, repeated-root
  gcd layers, and disjoint rational open intervals over `[0,1]`.
- The root isolator is now composed over every event row in one bound ledger,
  including persistent zeros, endpoint roots, repeated-root multiplicities,
  and aggregate subdivision accounting.
- A generic common refinement now proves simultaneous algebraic roots across
  polynomials with exact GCD and Sturm counts, and strictly separates unequal
  roots by further exact refinement. Persistent zero polynomials are kept out
  of the discrete root classes.
- A single-query arithmetic adapter now determines the exact sign of one
  primitive integer polynomial at a selected isolated root of another. It
  handles persistent/shared roots as zero, exact endpoints by substitution,
  and distinct interior roots by a certified root-free rational probe.
- A selected vertex-face adapter now evaluates all three projected face areas,
  chooses the first exact nondegenerate cyclic projection, and classifies three
  area-relative edge signs as outside, vertex, edge, or interior. A genuine
  irrational event root is retained as exact edge containment. Persistent
  events and a face degenerate at the root fail closed; the result covers one
  root only and is not a collision or legal-contact claim.
- A selected edge-edge adapter now binds one finite coplanarity event and root.
  A nonparallel pair uses three direction-cross and four projected orientation
  signs. A parallel pair also binds both direction vectors and the carrier
  offset cross product; noncollinear carriers are disjoint, while a collinear
  interval comparison distinguishes a gap, endpoint contact, and
  positive-length overlap. The branch-specific ledgers contain 7, 12, or 14
  exact sign proofs. Degenerate edges and persistent-zero events fail closed;
  the result is one-root feature evidence, not a collision or legal-contact
  claim.
- Every event root is now joined into one ordered global boundary ledger with
  exact start/end handling and one canonical dyadic actual-time sample in each
  certified open cell. Every boundary is also joined to its immediate left
  and/or right static sample; all canonical triangle-pair strata signatures are
  compared on two-sided boundaries and exact counter deltas plus changed rows
  are retained. The sample-side delta ledger itself does not evaluate root
  geometry or prove that a sample difference occurs at that boundary. A
  finite-root ledger now applies the
  selected-root classifiers exactly once to every finite occurrence, reusing
  one owned census and retaining compact per-row evidence. It does not
  deduplicate occurrence rows into collision events. The defining polynomial's
  exact oriented sign is now retained on every available adjacent root-free
  open cell, and interior sign parity is checked against root multiplicity.
  That scalar sign is not distance or geometric approach/separation.
  Persistent zero events are now joined exactly across the census, partition,
  and common refinement, and their associated static triangle pair is sampled
  in every canonical open cell. Five symmetric-fixture persistent edge-edge
  rows change associated pair category across the two cells. These pair-level
  samples do not establish event-specific feature containment or cell-wide
  constancy. Persistent-contact subdivision, complete left/right geometric
  history, open-cell strata constancy, and proof that the necessary polynomial
  family is collision-event complete remain unresolved.
- The census now has a bounded one-job module-Worker protocol with exact
  source/job binding and `BigInt` structured-clone input. Its main-thread
  response validator independently reconstructs every determinate source AABB,
  requires the producer's first x/y/z separation certificate, and checks the
  complete pair ledger without rerunning the census. Abort terminates the
  Worker; there is no timeout, fallback, or fabricated progress message.
- Real Worker smoke checks cover repeatable success, in-flight cancellation,
  and pre-abort in Chromium, Edge, and Firefox. They establish transport and
  cleanup behavior only, not a product runtime profile.
- General face-motion binding for dual cycles, chained/simultaneous hinges and
  multi-segment hinges, source-hash-bound angle schedules, complete slab
  coverage, collision-complete subdivision for general nonlinear motion
  including persistent and tangent cases, legal-contact policy, independent
  saved-result replay, Worker progress/cooperative
  checkpoints, representative
  latency/memory/message-size limits, persisted evidence, and global-gate
  integration remain unresolved.
  The broad phase is not CCD and cannot establish self-intersection absence or
  collision freedom.

## Requires a product decision if experiments cannot satisfy the fixed contract

- Any reduction below both methods, leaves `2..20`, internal-branch width, or
  rectangular box pleating.
- Any relaxation of continuous-path, actual self-intersection, legal-contact,
  or independent-verifier requirements.
- Any license outside the approved SPDX allowlist or any need for a paid or
  external compute service.
- Any fixture whose provenance cannot be redistributed and cannot be replaced
  by a project-authored equivalent.
- The bounded-interpolation finite knot-time parser boundary remains a
  candidate-only negative-artifact regression case; it is not a canonical
  promotion or scientific claim.

These decisions are not pre-approved. A failed experiment must produce a
minimal counterexample and ADR before asking the product owner to change scope.
