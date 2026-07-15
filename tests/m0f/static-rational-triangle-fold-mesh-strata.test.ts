import { describe, expect, it } from 'vitest';

import {
  analyzeStaticRationalTriangleFoldMeshStrataV1,
  type StaticRationalTriangleFoldMeshStrataRecordV1,
} from '../../m0f/geometry/static-rational-triangle-fold-mesh-strata.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function twoFaceSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 1],
      [0.5, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function threeStripSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
      [2, 1],
      [1, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [1, 6],
      [2, 5],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function pentagonSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [2, 0],
      [3, 1],
      [1.5, 3],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

function reconstruct(source: Record<string, unknown>): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('fold mesh strata fixture reconstruction must succeed');
  return result.value;
}

function fractions(vertex: CandidateFoldFaceReconstructionV1['vertices'][number]) {
  return {
    xn: BigInt(vertex.exactCoordinate.x.numerator),
    xd: BigInt(vertex.exactCoordinate.x.denominator),
    yn: BigInt(vertex.exactCoordinate.y.numerator),
    yd: BigInt(vertex.exactCoordinate.y.denominator),
  };
}

function quarterFoldPoint(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
  flatOverlap: boolean,
): ProjectivePoint3 {
  const { xn, xd, yn, yd } = fractions(vertex);
  if (2n * xn <= xd) {
    return canonicalProjectivePoint3(xn * yd, yn * xd, 0n, xd * yd);
  }
  if (flatOverlap) {
    return canonicalProjectivePoint3((xd - xn) * yd, yn * xd, 0n, xd * yd);
  }
  return canonicalProjectivePoint3(xd * yd, 2n * xd * yn, (2n * xn - xd) * yd, 2n * xd * yd);
}

function crossingThreeStripPoint(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
): ProjectivePoint3 {
  const { xn, xd, yn, yd } = fractions(vertex);
  if (xn <= xd) {
    return canonicalProjectivePoint3(xn * yd, yn * xd, 0n, xd * yd);
  }
  if (xn <= 2n * xd) {
    return canonicalProjectivePoint3(
      (8n * xd - 3n * xn) * yd,
      5n * xd * yn,
      4n * (xn - xd) * yd,
      5n * xd * yd,
    );
  }
  return canonicalProjectivePoint3(
    2n * xd * yd,
    5n * xd * yn,
    (14n * xd - 5n * xn) * yd,
    5n * xd * yd,
  );
}

function planarPoint(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
): ProjectivePoint3 {
  const { xn, xd, yn, yd } = fractions(vertex);
  return canonicalProjectivePoint3(xn * yd, yn * xd, 0n, xd * yd);
}

function supplied(
  artifact: CandidateFoldFaceReconstructionV1,
  pointFor: (vertex: CandidateFoldFaceReconstructionV1['vertices'][number]) => ProjectivePoint3,
  poseRevisionId: string,
) {
  const pointById = new Map(artifact.vertices.map((vertex) => [vertex.id, pointFor(vertex)]));
  return {
    meshRevisionId: 'Mesh:strata-fixture:1',
    triangulationRevisionId: 'Triangulation:strata-fixture:1',
    poseRevisionId,
    reconstruction: artifact,
    staticTriangleSet: {
      triangles: artifact.faces.flatMap((face) =>
        face.triangles.map((topology) => {
          const points = topology.vertexIds.map((vertexId) => pointById.get(vertexId));
          const first = points[0];
          const second = points[1];
          const third = points[2];
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('exact pose point must resolve');
          }
          return {
            triangleId: topology.id,
            triangle: [first, second, third] as StaticRationalTriangle3,
          };
        }),
      ),
    },
  };
}

function analyze(value: ReturnType<typeof supplied>): StaticRationalTriangleFoldMeshStrataRecordV1 {
  const result = analyzeStaticRationalTriangleFoldMeshStrataV1(value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('mesh-bound strata fixture must succeed');
  return result.value;
}

describe('static exact-rational FOLD mesh-bound intersection strata candidate', () => {
  it('separates same-face triangulation contact and contained hinge contact at a quarter fold', () => {
    const artifact = reconstruct(twoFaceSource());
    const record = analyze(
      supplied(artifact, (vertex) => quarterFoldPoint(vertex, false), 'Pose:quarter-fold:1'),
    );
    expect(record).toMatchObject({
      triangleCount: 4,
      unorderedPairCount: 6,
      sameFaceTriangulationContactCandidatePairCount: 2,
      sameFaceUnexpectedIntersectionEvidencePairCount: 0,
      declaredHingeOffAxisIntersectionEvidencePairCount: 0,
      nonadjacentStaticInteriorCrossingEvidencePairCount: 0,
      staticNonadjacentInteriorCrossingDetected: false,
    });
    expect(record.declaredHingeContactContainedCandidatePairCount).toBeGreaterThan(0);
    expect(
      record.pairs
        .filter((pair) => pair.category === 'same-face-triangulation-contact-candidate')
        .every((pair) => pair.sharedTriangulationFeatureLocusContained),
    ).toBe(true);
    expect(
      record.pairs
        .filter((pair) => pair.category === 'declared-hinge-contact-contained-candidate')
        .every((pair) => pair.declaredHingeLocusContained),
    ).toBe(true);
  });

  it('accepts both shared-edge and shared-vertex contact inside one triangulated face', () => {
    const artifact = reconstruct(pentagonSource());
    expect(artifact.faces).toHaveLength(1);
    expect(artifact.faces[0]?.triangles).toHaveLength(3);
    const record = analyze(supplied(artifact, planarPoint, 'Pose:pentagon-planar:1'));
    expect(record.unorderedPairCount).toBe(3);
    expect(record.sameFaceTriangulationContactCandidatePairCount).toBe(3);
    expect(record.sameFaceUnexpectedIntersectionEvidencePairCount).toBe(0);
    expect(
      record.pairs.every(
        (pair) =>
          pair.category === 'same-face-triangulation-contact-candidate' &&
          pair.sharedTriangulationFeatureLocusContained,
      ),
    ).toBe(true);
    expect(record.pairs.some((pair) => pair.topology.sharedMeshVertexCount === 1)).toBe(true);
    expect(record.pairs.some((pair) => pair.topology.sharedMeshVertexCount === 2)).toBe(true);
  });

  it('retains flat-fold area away from the hinge as off-axis intersection evidence', () => {
    const artifact = reconstruct(twoFaceSource());
    const record = analyze(
      supplied(artifact, (vertex) => quarterFoldPoint(vertex, true), 'Pose:flat-overlap:1'),
    );
    expect(record.declaredHingeOffAxisIntersectionEvidencePairCount).toBeGreaterThan(0);
    const areaRows = record.pairs.filter((pair) => pair.strata.coplanarAreaOverlapDetected);
    expect(areaRows.length).toBeGreaterThan(0);
    expect(
      areaRows.every(
        (pair) =>
          pair.category === 'declared-hinge-off-axis-intersection-evidence' &&
          !pair.declaredHingeLocusContained &&
          pair.requiresLayerOrder,
      ),
    ).toBe(true);
    expect(record.selfIntersectionDecisionIncluded).toBe(false);
  });

  it('detects an exact nonadjacent relative-interior crossing in a three-face strip', () => {
    const artifact = reconstruct(threeStripSource());
    expect(artifact.faces).toHaveLength(3);
    const record = analyze(
      supplied(artifact, crossingThreeStripPoint, 'Pose:nonadjacent-crossing:1'),
    );
    expect(record.triangleCount).toBe(6);
    expect(record.unorderedPairCount).toBe(15);
    expect(record.staticNonadjacentInteriorCrossingDetected).toBe(true);
    expect(record.nonadjacentStaticInteriorCrossingEvidencePairCount).toBeGreaterThan(0);
    const crossingRows = record.pairs.filter(
      (pair) => pair.category === 'nonadjacent-static-interior-crossing-evidence',
    );
    expect(crossingRows.length).toBe(record.nonadjacentStaticInteriorCrossingEvidencePairCount);
    expect(
      crossingRows.every(
        (pair) =>
          pair.topology.pairRelation === 'distinct-nonadjacent-faces' &&
          pair.strata.staticInteriorInteriorIntersectionDetected &&
          pair.strata.triangleARelativeLocation === 'interior' &&
          pair.strata.triangleBRelativeLocation === 'interior' &&
          !pair.requiresMotionSideHistory,
      ),
    ).toBe(true);
  });

  it('retains every joined pair exactly once and recomputes all category counters', () => {
    const artifact = reconstruct(threeStripSource());
    const record = analyze(supplied(artifact, crossingThreeStripPoint, 'Pose:counter-replay:1'));
    expect(record.pairs.map((pair) => pair.pairIndex)).toEqual(
      Array.from({ length: record.unorderedPairCount }, (_, index) => index),
    );
    expect(
      new Set(record.pairs.map((pair) => `${pair.firstTriangleId}\u0000${pair.secondTriangleId}`))
        .size,
    ).toBe(record.unorderedPairCount);
    const count = (category: (typeof record.pairs)[number]['category']) =>
      record.pairs.filter((pair) => pair.category === category).length;
    expect(record.disjointPairCount).toBe(count('disjoint'));
    expect(record.sameFaceTriangulationContactCandidatePairCount).toBe(
      count('same-face-triangulation-contact-candidate'),
    );
    expect(record.sameFaceUnexpectedIntersectionEvidencePairCount).toBe(
      count('same-face-unexpected-intersection-evidence'),
    );
    expect(record.declaredHingeContactContainedCandidatePairCount).toBe(
      count('declared-hinge-contact-contained-candidate'),
    );
    expect(record.declaredHingeOffAxisIntersectionEvidencePairCount).toBe(
      count('declared-hinge-off-axis-intersection-evidence'),
    );
    expect(record.nonadjacentStaticInteriorCrossingEvidencePairCount).toBe(
      count('nonadjacent-static-interior-crossing-evidence'),
    );
    expect(record.nonadjacentContactRequiresMotionHistoryPairCount).toBe(
      count('nonadjacent-contact-requires-motion-history'),
    );
    expect(record.nonadjacentCoplanarAreaRequiresLayerOrderPairCount).toBe(
      count('nonadjacent-coplanar-area-requires-layer-order'),
    );
  });

  it('is invariant under caller static-triangle order and fails through the binding stage', () => {
    const artifact = reconstruct(twoFaceSource());
    const canonicalInput = supplied(
      artifact,
      (vertex) => quarterFoldPoint(vertex, false),
      'Pose:order:1',
    );
    const canonical = analyze(canonicalInput);
    const reversed = analyze({
      ...canonicalInput,
      staticTriangleSet: {
        triangles: [...canonicalInput.staticTriangleSet.triangles].reverse(),
      },
    });
    expect(reversed).toEqual(canonical);

    const malformed = { ...canonicalInput, poseRevisionId: 'bad revision id' };
    const rejected = analyzeStaticRationalTriangleFoldMeshStrataV1(malformed);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('invalid binding input must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'binding', code: 'invalid-revision-id' }),
    );
  });

  it('deeply freezes the joined evidence while keeping every final claim false', () => {
    const artifact = reconstruct(threeStripSource());
    const result = analyzeStaticRationalTriangleFoldMeshStrataV1(
      supplied(artifact, crossingThreeStripPoint, 'Pose:frozen:1'),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('joined fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.pairs)).toBe(true);
    expect(Object.isFrozen(result.value.pairs[0]?.topology)).toBe(true);
    expect(Object.isFrozen(result.value.pairs[0]?.strata.strata.locus)).toBe(true);
    expect(result.value).toMatchObject({
      contractStatus: 'candidate-no-claim',
      allUnorderedPairsIncluded: true,
      meshIdentityJoinedToExactStrata: true,
      declaredHingeLocusContainmentIncluded: true,
      sameFaceTriangulationContactSeparated: true,
      staticSelfIntersectionEvidenceIncluded: true,
      cryptographicSourceRevisionBindingIncluded: false,
      productStableIdentityIncluded: false,
      legalContactPolicyIncluded: false,
      motionSideHistoryIncluded: false,
      layerOrderDecisionIncluded: false,
      penetrationClassificationIncluded: false,
      selfIntersectionDecisionIncluded: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });
});
