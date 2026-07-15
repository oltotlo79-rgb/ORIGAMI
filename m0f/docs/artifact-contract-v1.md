# M0F artifact contract v1

Status: candidate contract for M0F experiments; **not** a verification result  
Schema: `https://oridesign.local/schemas/m0f/artifact-contract-v1.schema.json`

This contract fixes the minimum in-memory shape needed to run M0F experiments
without letting an experiment result masquerade as product evidence. Every
document must set `contractStatus: "candidate"` and `scientificClaim: false`.
The schema deliberately has no `verified`, `success`, or `result` field.

## Workflow boundary

The input and target are discriminated together:

| Input | Target | Purpose |
|---|---|---|
| `design-generation` + `treeMethod` | `uniaxial-tree-base` | Tree-method experiment |
| `design-generation` + `boxPleating` | `uniaxial-tree-base` | True grid box-pleating experiment |
| `fold-verification` | `flat-folded-cp` | Imported FOLD CP experiment |

Generation inputs contain a connected acyclic tree, explicit cyclic order at
every node, branch length, and branch width including internal branches. FOLD
inputs accept only one top-level 2D crease-pattern frame, FOLD 1.1 or 1.2, and
the `M/V/B/F/U` assignment subset. `faces_vertices` may be null because face
reconstruction remains an M0F experiment; the normalized `creaseMesh` itself
always contains explicit faces and stable IDs.

## Runtime invariants

`parseArtifactContractV1` checks constraints JSON Schema cannot express:

- stable-ID uniqueness and all tree, vertex, edge, face, region, contact, and
  layer references;
- tree connectivity, acyclicity, 2..20 leaf boundary, and exact node-incidence
  coverage by rotation entries;
- exact-dyadic nonzero face area, canonical stored-XY winding, distinct vertex
  coordinates, nonzero edges, undeclared crossing/overlap/T-junction rejection,
  connected-disk Euler characteristic, face-boundary edge coverage, and
  one-face/two-face boundary incidence;
- normalized FOLD paper bounds and exact coordinate/edge/assignment
  correspondence between indexed FOLD input and the stable-ID crease mesh;
- exact workflow/target compatibility and complete target transforms;
- preservation of fixed FOLD M/V/F assignments, resolution of every U interior
  assignment, and length/width measurement of every generation tree edge;
- path-segment and knot coverage of `[0,1]`, motion-array dimensional
  agreement, knot-angle containment by declared bounds, one representation per
  path, restriction of motion IDs to interior creases, and exact agreement of
  declared crease maps and endpoint angles between adjacent valid
  `bounded-interpolation` segments;
- contact/overlap face-pair agreement, an acyclic terminal goal order, an
  acyclic `above -> below` graph at every active event interval, and rejection
  of opposite declared face orders at disjoint times within one continuous
  `coplanar-overlap` contact. Valid contact records for the same overlap region
  and unordered face pair form one contact component when their closed time
  intervals overlap or touch; a positive time gap separates components. For
  each component, valid matching layer-event intervals are clipped to the
  contact and their closed union must cover its full interval. Touching
  declarations cover continuously; a positive prefix, internal, or suffix gap
  is rejected. This is union checking over declared intervals only. It neither
  detects physical contact nor establishes contact completeness or a physically
  correct layer order. Generic coverage inference is suppressed when overlap,
  contact, or layer-event participant parsing adds a structural or duplicate-ID
  issue, when a temporal `layer-cycle` exists, and for any contact that already
  establishes the more specific `layer-order-reversal` diagnostic.

Successful parsing returns a deep-frozen owned clone. Mutating the caller's
input object after parsing cannot alter the candidate or escalate its claim.

Passing these checks means only that a candidate is structurally usable by an
experiment. It does not establish rigidity, continuous foldability, collision
freedom, legal contact, target attainment, or a no-solution result.

## Candidate path representations

Two representations remain available solely for comparative measurement:

- `bounded-interpolation` with knots, angles, and per-interval angle bounds;
- `piecewise-polynomial` with degree, coefficients, and derivative bounds.

M0F must select one representation and freeze its basis, interval proof, error
bounds, and physical closure rules before a scientific certificate schema is
introduced. Exact equality of adjacent bounded-interpolation declarations is a
structural parser boundary only; it is not rigid-motion or face-isometry
evidence. Neither candidate representation can be serialized as
`PathCertificate`.

## Deliberately deferred certificate data

The following do not belong to this candidate contract and must be resolved by
later M0F experiments:

- stable triangulation IDs for CCD evidence;
- overlap-region-scoped final layer orders;
- typed evidence blobs and domain-separated semantic hashes;
- support/tolerance profile hashes and independent checker versions;
- start/goal configuration hashes, interval proof payloads, and complete
  no-solution witnesses.

The future scientific artifact bundle must be a different schema version and
must be accepted by an independent reference verifier before the application
may display `verified` or `no-solution-certified`.
