# Static exact-rational triangle to FOLD mesh binding candidate v1

Status: candidate identity/incidence bridge between one validated FOLD face
reconstruction and one exact static 3D triangle pose. It does not prove a
cryptographic source revision, apply a legal-contact policy, inspect motion
side history, classify penetration or self-intersection, perform CCD, establish
collision freedom, verify a result, select a SupportProfile, or imply M0F
`GO`.

## Two validated inputs

`bindStaticRationalTrianglePoseToFoldMeshV1` accepts one closed root containing:

- caller labels for the mesh, triangulation, and pose revisions;
- a complete candidate FOLD face-reconstruction record; and
- a complete exact projective-rational static triangle set.

The FOLD record is reparsed by the existing reconstruction-result contract,
which checks its exact 2D metadata, face/edge incidence, triangulation,
display-only projection roundtrip, and candidate claim boundary. The exact 3D
set is reparsed by the bounded static-census input contract. The triangle ID
sets must be a bijection. Numeric-leading length-prefixed IDs emitted by the
face triangulator are valid stable IDs; whitespace, non-ASCII punctuation,
duplicates, and over-limit IDs remain invalid.

The order of the three 3D triangle vertices is semantic: it corresponds to the
reconstructed triangle's `vertexIds`. Every occurrence of one reconstructed
mesh vertex must therefore have one identical canonical 3D point across all
incident triangles. Every reconstructed vertex must occur in the pose. Missing,
renamed, partial, degenerate, or inconsistently positioned triangles reject the
entire binding.

For every reconstructed source face, all exact 2D vertex-pair squared distances
are compared with their exact 3D pose distances by rational cross
multiplication. Every face vertex is also checked against one exact pose plane.
A stretched, sheared, or bent source face therefore fails before topology is
used to interpret intersection contact.

## Bound topology and exact pose

The result retains canonical ledgers for:

- reconstructed vertex IDs and exact 3D pose points;
- source face IDs and their triangle/boundary-edge IDs;
- triangle IDs, face IDs, ordered and semantic vertex IDs, and exact geometry;
- boundary edges and two-face interior edges with assignments and exact pose
  segments; and
- all unordered triangle pairs.

Every non-`B` reconstructed edge has two incident faces and is retained as a
structural declared-hinge edge. This does not say that all contact on those two
faces is legal. Pair rows separately record:

- `same-source-face`, `declared-hinge-adjacent-faces`, or
  `distinct-nonadjacent-faces`;
- shared mesh vertex IDs;
- shared exact-coordinate count;
- additional coordinate coincidence caused by folding/contact;
- a directly shared internal triangulation or declared-hinge edge; and
- all declared hinge segments for the source-face pair.

This distinction matters at a flat fold: different mesh vertex IDs may occupy
the same exact point, while a declared hinge remains identified by topology and
not guessed from coordinates. Conversely, sharing a source-face pair does not
authorize intersection away from the retained hinge segment.

## Revision and decision boundary

The three revision IDs are validated caller labels. No source hash, signature,
manifest artifact, or external triangulation evidence is attached, so
`cryptographicSourceRevisionBindingIncluded` and `productStableIdentityIncluded`
remain false. The reconstructed IDs are still explicitly candidate IDs.

Tests use a reconstructed two-face FOLD model and an exact 90-degree folded
pose. They check all ID/point/edge/face/triangle/pair ledgers, exact hinge
segment retention, same-face triangulation edges, flat-fold coordinate
coincidence distinct from mesh identity, input-order invariance, atomic ID and
vertex-position mismatch rejection, staged parser failures, accessors without
invocation, revoked proxies, deep freeze, and all negative decision flags.

The next composition must join this topology ledger to the exact strata census
and then apply an explicitly versioned contact policy. It must compare each raw
locus with the exact declared hinge segment, require side history for point or
boundary contact, require a region-scoped layer order for coplanar area, retain
forbidden static crossing evidence, and still avoid claiming continuous-time
collision freedom until complete nonlinear CCD coverage exists.

That static composition is implemented as
`static-rational-triangle-fold-mesh-strata-v1.md`; it remains candidate evidence
under the same revision and continuous-time limitations.
