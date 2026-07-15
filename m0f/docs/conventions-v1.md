# M0F conventions v1

Status: fixed for M0F convention vectors; **not** an M0F `GO` decision  
Identifier: `oridesign-m0f-conventions-v1`

This document removes interpretation ambiguity before scientific fixtures are
created. A document using these conventions is not evidence that a crease
pattern is rigid-foldable or collision-free. Convention vectors therefore set
`scope: "conventions-only"` and `scientificClaim: false`.

## Coordinates and units

- Stored paper coordinates use the normalized short side as `1`.
- The paper origin is its upper-left corner; stored `x` points right and stored
  `y` points down.
- Stored 2D coordinates enter the right-handed verification world through
  `(X, Y, Z) = (x, -y, z)`. World `+X` points right, `+Y` points up, and `+Z`
  points toward the observer looking at the editor's front side.
- Distances and widths are dimensionless. Angles inside M0F certificates use
  radians unless a field explicitly says degrees.

## Face winding and normals

- Canonical faces are counter-clockwise when viewed from world `+Z` toward the
  paper.
- Because stored `y` points down, such a face has a **negative** signed area in
  stored `(x, y)` coordinates.
- Its unfolded reference normal is world `[0, 0, 1]`.
- Reversing a face ring changes its normal and is not canonicalization.
  Canonicalization may only cyclically rotate the ring.

## Oriented edges and incident faces

An edge is directed from `vertices[0]` to `vertices[1]`. `leftFaceId` and
`rightFaceId` are evaluated in the right-handed world coordinates. Consequently:

- a world-left face has a negative orientation sign in stored paper coordinates;
- a world-right face has a positive orientation sign in stored paper coordinates;
- `B` has exactly one incident face; `M`, `V`, `F`, and `U` have two.

This naming follows oriented-manifold semantics, even when the result appears
reversed on a screen whose vertical coordinate grows downward.

## Mountain and valley

M0F adopts FOLD 1.2's fold-angle sign:

- positive fold angle: valley (`V`);
- negative fold angle: mountain (`M`);
- zero fold angle in a convention sample: flat (`F`).

An unfolded CP may still label a future crease `M` or `V`; the zero-angle rule
above applies only when a sample asserts the assignment implied by that sampled
angle. The primary format definition is the
[FOLD 1.2 specification](https://edemaine.github.io/fold/doc/spec.html).

## Layer order

- `aboveFaceId` means closer to the world `+Z` observer than `belowFaceId`.
- At an exactly flat zero-thickness overlap this is a symbolic order, not a
  measurable nonzero distance.
- Each relation belongs to one stable overlap-region ID.
- Directed edges run `above -> below`; their graph must be acyclic.
- Rendering offsets may place an above face at a larger display-only `Z`, but
  those offsets are never verification geometry.

## Exact convention checks

The reference evaluator converts every finite IEEE-754 binary64 coordinate to
an exact dyadic rational and uses `BigInt` for orientation and polygon-area
signs. No distance epsilon changes a sign or turns a crossing into contact.
This is deliberately an always-exact M0F reference path, not yet the optimized
production predicate.

## Canonicalization and hash

- Canonicalization ID is `oridesign-canonical-v1`.
- Object keys use the deterministic rules in `m0f/stable-json.ts`.
- Vertex, edge, face, sample, and overlap collections are sorted by stable ID.
- Face rings are cyclically rotated to their code-unit-smallest presentation;
  they are never reversed.
- Oriented edge endpoints and left/right faces retain their semantic order.
- The SHA-256 input is domain-separated by project marker, canonicalization
  version, and `m0f-reference-model` domain.

The checked-in two-face vector and golden hash exercise these rules. It is kept
outside the canonical scientific fixture manifest.
