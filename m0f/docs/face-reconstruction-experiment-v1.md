# M0F-3 candidate FOLD face reconstruction v1

Status: active reference experiment; **not** a foldability result, frozen product
contract, or M0F `GO`

## Implemented slice

The geometry core accepts one closed internal candidate representation of a
top-level two-dimensional FOLD 1.1/1.2 crease pattern whose `facesVertices` is
explicitly `null`. It accepts assignments `M`, `V`, `B`, `F`, and `U`; `C` and
`J` remain unsupported. The input arrays are captured once, validated as plain
JSON data, and normalized to coordinate- and endpoint-derived candidate IDs.

`adaptFoldDocumentToFaceReconstructionInputV1` provides the corresponding
standard FOLD 1.1/1.2 NOFACES boundary. This closed candidate subset requires a
numeric `file_spec` (`1.1` or `1.2`) and the snake-case
`vertices_coords`, `edges_vertices`, and `edges_assignment` fields.
`faces_vertices` must be absent; `null` is still considered present and is
rejected because the experiment reconstructs that field. The document
represents one top-level keyframe;
`file_frames` may be absent or an empty array but may not contain nested or
additional frames. When present, `frame_classes` must include
`creasePattern`, and `frame_attributes` must include `2D` while excluding
`3D`, `abstract`, `nonManifold`, `nonOrientable`, `selfIntersecting`, `cuts`,
and `joins`. Known file/frame descriptive metadata is type-checked and then
discarded rather than copied into the internal geometry DTO.

The adapter takes one owned plain-JSON snapshot of the external document,
rejects unknown fields and exotic or malformed data, delegates geometry and
assignment validity to the existing internal normalizer, and maps diagnostic
paths back to FOLD snake_case. `reconstructFoldDocumentFacesCandidateV1` is the
one-call entry point that runs this adapter and then the existing exact face
pipeline. Adapter failures are returned before planarization with stage
`fold-document`; all accepted and rejected boundary values are deeply frozen.

The stages are:

1. convert every finite binary64 source coordinate to its exact dyadic value;
2. construct every proper intersection as a reduced BigInt rational and split
   source segments at proper crossings and T-junctions;
3. enumerate one exterior boundary and negative-winding bounded faces with an
   exact-rational half-edge traversal;
4. triangulate each simple bounded face with deterministic exact-rational ear
   clipping; and
5. emit a JSON-safe candidate record plus a FOLD-shaped numeric projection.

No orientation, intersection, angular ordering, face area, ear selection, or
area-preservation decision converts a rational intersection back to binary64.
The fixed probe contains the intersection `(1, 1/3)` and currently produces 8
planar vertices, 11 planar edges, 4 bounded faces, and 7 triangles.

## Exact and FOLD projections

`fold-face-reconstruction-result-v1.schema.json` is a closed candidate schema.
Exact coordinates use reduced base-10 numerator and positive-denominator
strings under `oridesign-exact-rational-json-v1`; the experiment record thus
contains no JSON BigInt values.

`foldProjection` contains ordinary `vertices_coords`, `edges_vertices`,
`edges_assignment`, and reconstructed `faces_vertices`. Its numeric coordinates
are display/interchange approximations only. The
`_oridesign_m0f_candidate` field preserves exact coordinates, candidate vertex,
edge, and face IDs, source-edge provenance, and triangle indices. Re-reading
the numeric coordinates alone is not topology evidence and must never replace
the exact metadata or a fresh reconstruction.

The projection follows the FOLD interchange type for `file_spec`: it is the
JSON number `1.1` or `1.2`. The internal candidate input keeps its version as a
string only to avoid confusing a data-format version with arithmetic.

The emitter separately re-enumerates the numeric projection with exact-dyadic
predicates and refuses to emit it if rounding creates duplicate vertices,
zero-length edges, a crossing/T-junction/overlap, or different face cycles.
This catches underflow cases such as an exact `MIN_VALUE/3` intersection
rounding onto an existing display vertex.

`parseAndRoundtripCandidateFoldProjectionV1` reads the emitted projection as a
new plain-JSON snapshot, restores BigInt rationals, re-enumerates faces, and
retriangulates every face before accepting IDs and indices. Its result says
`verificationIndependence: not-independent-same-exact-kernel`: this is a
roundtrip integrity check, not the independent M0F reference verifier.

`parseCandidateFoldFaceReconstructionV1` closes the runtime boundary around the
complete reconstruction result, not only its FOLD projection. It captures the
entire record as one plain-JSON snapshot, enforces closed keys and fixed
candidate literals at every level, restores the root exact coordinates, and
then delegates the embedded projection to the roundtrip parser above. Before
acceptance it cross-checks the root and projection vertex, edge, exterior,
face, and triangle IDs, order, coordinates, assignments, indices, and exact
cycles. It also recomputes every topology count, created-intersection and
non-dyadic count, triangle total, and Euler value instead of trusting stored
counters.

Source provenance is checked in both directions: every emitted planar edge has
nonempty source records, a source ID retains one source index and assignment
across all split occurrences, source indices are unique and cover the declared
source-edge count, and the root provenance agrees with
`sourceEdgeIdsByEdge`. Exact face incidence is recomputed again so `B` has one
bounded face while `M/V/F/U` have two, even when root and projection fields are
mutated consistently. Accepted and rejected parser results are owned and
deeply frozen.

Both runtime parsers deliberately reuse the same exact arrangement, face, and
triangulation kernels as the producer. They provide strict serialization and
cross-field integrity checks, but they are **not** an independent scientific
verifier, scientific evidence, or a basis for M0F `GO`.

The candidate IDs are invariant to input vertex/edge array permutation and
edge direction for the same geometry and assignments. They are deliberately
not frozen product IDs: adding geometry can renumber coordinate-sorted IDs,
and the triangle-ID payload has not passed the M0F fixture/holdout decision.

## Fail-closed boundary

The first slice rejects malformed/non-plain input, duplicate coordinates,
duplicate or zero-length edges, collinear overlaps, undeclared crossings after
planarization, unsupported assignments, disconnected graphs, bridges, holes,
multiple components, and non-simple/non-cellular boundary walks. It also
requires `B` edges to have one bounded-face incidence and `M/V/F/U` edges to
have two, then rechecks Euler consistency, triangle count, winding, vertex
coverage, and exact area preservation.

Current explicit limitations are stored in every result:

- O(n squared) reference implementation;
- exactly one connected disk, with no holes or bridges;
- no tolerance-based vertex merge yet;
- display coordinates are not topology evidence; and
- stable IDs are candidate values, not a frozen product contract.

The direct synchronous entry point checks cancellation before and after the
pipeline. Browser callers can instead run the normalized candidate input in a
dedicated module Worker and cancel by terminating that Worker; measured browser
cancellation-response limits remain unresolved.

## Worker execution boundary

`runFaceReconstructionWorkerV1` creates exactly one injected Worker for one
validated candidate job. Its closed request/response protocol carries a stable
`jobId`, fixes `contractStatus` to `candidate` and `scientificClaim` to `false`,
and re-parses a completed reconstruction before exposing it to the caller.
`createBrowserFaceReconstructionWorkerV1` supplies the Vite-compatible
same-origin module Worker factory.

There is deliberately no forced timeout. An `AbortSignal` cancellation removes
listeners and calls `terminate()`; every completion and failure path also
terminates once. Valid responses for another `jobId` are ignored, late events
after settlement cannot change the result, and host exceptions are reduced to
fixed local reason codes. The Worker entry consumes only its first message, and
an invalid envelope is ignored rather than reflecting an untrusted `jobId`.

The first boundary transports the normalized internal candidate DTO.
`runFoldDocumentFaceReconstructionWorkerV1` is a second entry for an original
standard snake-case FOLD document encoded as UTF-8 JSON in a nonempty
`ArrayBuffer`. The main thread validates only the bounded job ID and buffer
brand, then transfers ownership of the buffer. Fatal UTF-8 decoding, JSON
parsing, the closed FOLD adapter, normalization, arrangement, and face
reconstruction all run inside the dedicated Worker. A successful
`postMessage` detaches the caller's buffer; callers must obtain new bytes for a
new job. Invalid text, JSON, or FOLD documents become the fixed
`invalid-request` outcome without reflecting document or exception text.

No arbitrary byte ceiling is hidden in this candidate path. The future
`maxWorkerMessageBytes` value remains unresolved until representative browser
measurements freeze the runtime profile. Fake-Worker unit tests cover
transferred ownership, detached-buffer rejection, cancellation, stale results,
malformed messages, exceptions, cleanup, and repeat execution.

`npm run test:e2e:m0f-worker` runs a test-only Vite page in Chromium, while
`npm run test:e2e:m0f-worker:matrix` runs the same probe in Chromium, Edge, and
Firefox. They check buffer detachment, five-run serialized-result
repeatability, immediate cancellation under a loose two-second smoke ceiling,
and the pre-abort no-transfer path. This is plumbing evidence only: it does not
measure memory or representative device limits and cannot select a
runtime-profile value.

## Reproduction

```text
npm run m0f:faces
npm run test:unit -- tests/m0f/fold-document-face-adapter.test.ts
npm run test:unit -- tests/m0f/reconstruct-fold-document-faces.test.ts
npm run test:unit -- tests/m0f/reconstruct-fold-faces.test.ts
npm run test:unit -- tests/m0f/fold-projection-roundtrip.test.ts
npm run test:unit -- tests/m0f/fold-face-reconstruction-result.test.ts
npm run test:unit -- tests/m0f/face-reconstruction-worker-protocol.test.ts
npm run test:unit -- tests/m0f/face-reconstruction-worker-handler.test.ts
npm run test:unit -- tests/m0f/run-face-reconstruction-worker.test.ts
npm run test:unit -- tests/m0f/fold-document-face-reconstruction-worker.test.ts
npm run test:unit -- tests/m0f/run-fold-document-face-reconstruction-worker.test.ts
npm run test:unit -- tests/m0f/planarization-metamorphic.test.ts
npm run test:perf -- tests/perf/m0f-face-reconstruction.bench.ts
```

The CLI emits the normal deterministic experiment envelope with parameter,
input, and semantic SHA-256 hashes, a fixed seed, and
`scientificClaim: false`.

## Not completed by this slice

The standard-named boundary above is a closed M0F candidate subset, not the
full product FOLD importer. It rejects rather than preserves unknown custom
fields, does not retain an original source-spec record or source-document
hash, cannot import a document whose `faces_vertices` is already present, and
does not support nonempty `file_frames`. Its same-kernel tests do not establish
compatibility with independent external FOLD implementations.

This does not complete M0F-3. Required scientific fixtures, tolerance/vertex
merge selection, supported hole/component policy, FOLD verification through an
independent implementation, product-stable IDs, target-state construction,
facet orientation, M/V solving, and layer ordering remain open. M0F-4 path
generation and M0F-5 continuous self-collision detection are also untouched. A
separate projective BigInt checker now audits this saved face-complex slice (see
`face-complex-audit-v1.md`), but the full independent path/CCD/contact/layer
reference verifier remains unimplemented.
