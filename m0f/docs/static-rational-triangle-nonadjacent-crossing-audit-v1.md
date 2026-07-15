# Independent static nonadjacent triangle-crossing witness audit v1

Status: import-free positive-witness replay for exact static relative-interior
crossings. It does not independently reconstruct every intersection locus,
prove absence of crossings, bind an external source revision, decide all legal
contact, cover continuous time, perform CCD, establish collision freedom,
verify a product result, or imply M0F `GO`.

## Portable producer witness

`createStaticRationalTriangleNonadjacentCrossingWitnessesV1` runs the complete
mesh-bound static strata analysis and emits one JSON-portable witness for every
pair categorized as a nonadjacent relative-interior crossing. Canonical
projective coordinates are decimal strings, so the record survives ordinary
JSON serialization without a `BigInt` extension.

Each witness retains:

- canonical triangle, face, and mesh-vertex IDs for both source triangles;
- all six exact triangle vertices;
- the producer pair index and fixed crossing character;
- the canonical exact midpoint of the producer's open intersection segment;
  and
- the complete declared-hinge source-face-pair ledger from the bound mesh.

The midpoint is positive evidence rather than a sampled approximation. The
producer still sets `independentAuditIncluded: false`; merely constructing or
persisting the witness does not confirm it.

## Import-free independent audit

`static-rational-triangle-nonadjacent-crossing-audit.ts` has no runtime imports.
It owns its bounded accessor-free JSON snapshot, closed-field parser, canonical
decimal/projective checks, homogeneous plane arithmetic, dominant-axis strict
triangle-interior signs, topology-pair replay, and result contract.

For every witness it independently requires:

1. distinct canonical triangle and face IDs;
2. no matching source-face pair in the complete declared-hinge pair ledger;
3. two nondegenerate triangles with nonparallel supporting planes;
4. the exact witness point on both supporting planes; and
5. nonzero same-sign projected edge orientations for the point in both
   triangles.

The last condition proves that the common point is in both relative interiors,
not on a vertex or edge. Together with nonparallel planes it is an exact
positive witness of a transverse static surface crossing. Repeated triangle IDs
must retain identical face, vertex, and coordinate data across the entire
witness set. Witness/pair indices are bounded, unique, and canonical.

The audit returns a fixed semantic `inconsistent` record for declared adjacency,
degenerate geometry, parallel planes, a point off either plane, or a point not
strictly inside both triangles. Malformed, noncanonical, hostile, over-budget,
or claim-promoted input is a contract failure. Neither path is silently treated
as a clean pose.

## Claim boundary

A consistent nonempty audit sets
`positiveStaticCrossingEvidenceConfirmed: true`. This independently confirms
the supplied positive geometry witness under the supplied complete hinge-pair
ledger. It does not independently prove that the mesh ledger came from the
current external FOLD revision, and it cannot prove that an empty witness set
means no intersections exist. Therefore the self-intersection decision,
continuous-time, CCD, collision-free, verified, scientific, and GO fields all
remain false.

The parser caps one record at 64 declared triangles, 2,016 pairs/witnesses,
2,016 declared hinge face pairs, 4,934 decimal coordinate digits, 200,000 owned
snapshot nodes, and five million total string code units. These are defensive
audit bounds rather than a SupportProfile. A producer point outside this audit
subset fails closed; it is not rounded or accepted by another arithmetic path.

Tests cover a direct hand-derived crossing and the producer's exact 3/5–4/5
three-face fixture, import independence, declared-adjacency mutation, parallel
planes, plane-off point, boundary point, degenerate triangles, noncanonical
coordinates, malformed counts and fields, accessors without invocation,
revoked proxies, empty witness sets, and deep freeze.

Remaining work includes a full independent negative/complete-locus replay,
cryptographic source/triangulation binding, source-closure hashing and persisted
evidence, contact/history/layer policy, all motion slabs, nonlinear
narrow-phase CCD, representative measurements, and global-gate integration.
