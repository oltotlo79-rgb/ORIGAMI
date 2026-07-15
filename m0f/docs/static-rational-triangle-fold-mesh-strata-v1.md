# Static exact-rational FOLD mesh-bound intersection strata candidate v1

Status: exact static intersection evidence joined to candidate FOLD mesh
identity and declared hinge segments. It does not provide a cryptographic
source revision, complete legal-contact policy, motion-side history, layer
decision, continuous-time CCD, collision-free result, verified result,
SupportProfile, scientific claim, or M0F `GO`.

## Composition

`analyzeStaticRationalTriangleFoldMeshStrataV1` first runs the complete static
pose-to-FOLD-mesh binding. That prerequisite requires a bijection between the
reconstructed and exact-pose triangle IDs, one exact 3D point per mesh vertex,
all source-face pairwise distances preserved, exact source-face coplanarity,
complete edge/face incidence, and all topology pairs. It then computes the
exact intersection locus and relative-interior strata for every unordered
triangle pair and joins rows by canonical pair ID and index.

The join independently checks that both complete ledgers contain the same
triangle IDs, pair count, pair order, and declared hinge-edge references. A
dependency rejection or any mismatch rejects the whole composition; no partial
pair result is exposed.

## Exact feature containment

For a point or segment locus, the analyzer uses exact homogeneous-BigInt
collinearity and inclusive interval signs to test containment in one retained
pose segment. No floating tolerance is used.

- Same-source-face triangles may meet on a shared triangulation vertex or
  internal edge. Exact containment in that shared feature is retained as a
  triangulation-contact candidate. Disjoint pairs are harmless at this static
  pose; any other same-face intersection is unexpected geometry evidence.
- For a declared-hinge-adjacent source-face pair, point or segment contact is a
  contained hinge-contact candidate only when its complete locus lies on one
  exact declared hinge segment. Area overlap, an interior crossing, or contact
  away from all such segments is retained as off-axis intersection evidence.
- For distinct nonadjacent source faces, an exact noncoplanar segment through
  both triangle relative interiors is retained as static interior-crossing
  evidence. Point or boundary-segment contact still requires motion-side
  history. Coplanar positive-area overlap still requires a region layer order.

Requiring one containing segment is intentionally conservative for this
candidate. If a future face pair may share a multi-segment collinear hinge
chain and one triangle-pair locus spans subdivisions, an exact union-coverage
contract must replace this test before such a locus can be accepted.

## Actual static 3D evidence boundary

The nonadjacent interior-crossing category is an actual exact 3D surface
crossing at the supplied pose, with mesh identity distinguishing it from an
internal triangulation edge or declared hinge. The record therefore sets
`staticSelfIntersectionEvidenceIncluded: true` and exposes a deterministic
crossing count/boolean.

It deliberately keeps `selfIntersectionDecisionIncluded: false`. The input
revision IDs are still caller labels rather than source hashes, and point,
boundary, tangential, persistent, and coplanar contacts require the selected
motion/history/layer policy. A clean single pose also says nothing about an
unsampled time interval.

Tests cover a two-face exact quarter fold, a flat overlapping fold, a one-face
pentagon whose three triangles share both vertices and edges, and a three-face
strip using an exact 3/5–4/5 rigid transform. The last fixture makes the first
and third nonadjacent faces cross through both relative interiors while both
declared hinges remain exact. Tests also replay every category counter, entry
order invariance, staged failure, deep freeze, and all negative final claims.

An import-free positive-witness audit now independently confirms each supplied
nonadjacent interior crossing; see
`static-rational-triangle-nonadjacent-crossing-audit-v1.md`. Full negative and
complete-locus replay remains outstanding.

Remaining work includes external source/triangulation hash binding, a versioned
contact policy with pre/post side history, overlap-region construction and
acyclic layer evidence, complete motion primitive/slab binding, conservative
nonlinear narrow-phase CCD, persisted evidence, representative measurements,
and global-gate integration.
