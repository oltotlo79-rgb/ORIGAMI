import { describe, expect, it } from 'vitest';

import {
  computeSingleHingeRotationSweptAabbStepV1,
  type SingleHingeRotationSweptAabbStepRecordV1,
} from '../../m0f/geometry/single-hinge-rotation-swept-aabb-step.js';
import {
  bindStaticRationalTrianglePoseToFoldMeshV1,
  type StaticRationalTriangleFoldMeshBindingRecordV1,
} from '../../m0f/geometry/static-rational-triangle-fold-mesh-binding.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

const SLAB = {
  t0: { numerator: 0n, exponent: 0 },
  t1: { numerator: 1n, exponent: 0 },
} as const;

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

function threeFaceStripSource(): Record<string, unknown> {
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

function fourFaceCycleSource(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 0.5],
      [1, 1],
      [0.5, 1],
      [0, 1],
      [0, 0.5],
      [0.5, 0.5],
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
      [1, 8],
      [8, 5],
      [7, 8],
      [8, 3],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M', 'V', 'M'],
    facesVertices: null,
  };
}

function reconstruct(source: Record<string, unknown>): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('FOLD reconstruction fixture must succeed');
  return result.value;
}

function planarPoint(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
): ProjectivePoint3 {
  const xNumerator = BigInt(vertex.exactCoordinate.x.numerator);
  const xDenominator = BigInt(vertex.exactCoordinate.x.denominator);
  const yNumerator = BigInt(vertex.exactCoordinate.y.numerator);
  const yDenominator = BigInt(vertex.exactCoordinate.y.denominator);
  return canonicalProjectivePoint3(
    xNumerator * yDenominator,
    yNumerator * xDenominator,
    0n,
    xDenominator * yDenominator,
  );
}

function bindingInput(source: Record<string, unknown>) {
  const reconstruction = reconstruct(source);
  const pointById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, planarPoint(vertex)]),
  );
  return {
    meshRevisionId: 'Mesh:single-hinge:fixture:1',
    triangulationRevisionId: 'Triangulation:single-hinge:fixture:1',
    poseRevisionId: 'Pose:single-hinge:planar:1',
    reconstruction,
    staticTriangleSet: {
      triangles: reconstruction.faces.flatMap((face) =>
        face.triangles.map((triangle) => {
          const points = triangle.vertexIds.map((vertexId) => pointById.get(vertexId));
          const first = points[0];
          const second = points[1];
          const third = points[2];
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('pose fixture vertex must resolve');
          }
          return {
            triangleId: triangle.id,
            triangle: [first, second, third] as StaticRationalTriangle3,
          };
        }),
      ),
    },
  };
}

function bind(
  supplied: ReturnType<typeof bindingInput>,
): StaticRationalTriangleFoldMeshBindingRecordV1 {
  const result = bindStaticRationalTrianglePoseToFoldMeshV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('mesh binding fixture must succeed');
  return result.value;
}

function activeHinges(binding: StaticRationalTriangleFoldMeshBindingRecordV1) {
  return binding.edges.filter(
    (edge) => edge.structuralKind === 'declared-hinge' && edge.incidentFaceIds.length === 2,
  );
}

function stepInput(source: Record<string, unknown>, hingeIndex = 0, incidentSideIndex = 0) {
  const suppliedBinding = bindingInput(source);
  const binding = bind(suppliedBinding);
  const activeHinge = activeHinges(binding)[hingeIndex];
  if (activeHinge === undefined) throw new TypeError('active hinge fixture must exist');
  const movingSideFaceId = activeHinge.incidentFaceIds[incidentSideIndex];
  if (movingSideFaceId === undefined) throw new TypeError('moving side fixture must exist');
  return {
    bindingInput: suppliedBinding,
    step: {
      pathRevisionId: 'Path:fixture:1',
      stepId: 'Step:fixture:1',
      activeHingeEdgeId: activeHinge.edgeId,
      movingSideFaceId,
      slab: SLAB,
    },
  };
}

function compute(supplied = stepInput(twoFaceSource())): SingleHingeRotationSweptAabbStepRecordV1 {
  const result = computeSingleHingeRotationSweptAabbStepV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('single-hinge step fixture must succeed');
  return result.value;
}

function addProjective(left: ProjectivePoint3, right: ProjectivePoint3): ProjectivePoint3 {
  return canonicalProjectivePoint3(
    left.x * right.w + right.x * left.w,
    left.y * right.w + right.y * left.w,
    left.z * right.w + right.z * left.w,
    left.w * right.w,
  );
}

describe('single dual-bridge hinge rotation swept-AABB step candidate', () => {
  it('derives the complete graph cut, primitive ledger, topology join, and broad-phase census', () => {
    const record = compute();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rotation-swept-aabb-step',
      contractStatus: 'candidate-no-claim',
      pathRevisionId: 'Path:fixture:1',
      stepId: 'Step:fixture:1',
      triangleCount: 4,
      unorderedPairCount: 6,
      movingFaceIds: [record.movingSideFaceId],
    });
    expect(record.stationaryFaceIds).toHaveLength(1);
    expect(record.primitives).toHaveLength(4);
    expect(record.pairs).toHaveLength(6);
    expect(record.pairs.map((pair) => pair.pairIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(
      record.separatedPairCount +
        record.broadPhaseCandidatePairCount +
        record.indeterminatePairCount,
    ).toBe(6);
    expect(record.narrowPhaseRequiredPairCount).toBe(
      record.pairs.filter((pair) => pair.narrowPhaseRequired).length,
    );
    expect(
      record.pairs.every(
        (pair) => pair.topologyRelation === record.binding.pairs[pair.pairIndex]?.pairRelation,
      ),
    ).toBe(true);
    expect(record.broadPhaseCensus.primitiveIds).toEqual(
      record.primitives.map((primitive) => primitive.id),
    );
  });

  it('uses one exact hinge point for the moving component and preserves every start triangle', () => {
    const record = compute();
    const triangleById = new Map(
      record.binding.triangles.map((triangle) => [triangle.triangleId, triangle]),
    );
    for (const primitive of record.primitives) {
      expect(primitive.q0).toEqual(primitive.q1);
      const triangle = triangleById.get(primitive.id);
      if (triangle === undefined) throw new TypeError('bound triangle must exist');
      const isMoving = record.movingFaceIds.includes(triangle.faceId);
      expect(primitive.q0).toEqual(
        isMoving
          ? record.binding.edges.find((edge) => edge.edgeId === record.activeHingeEdgeId)
              ?.exactPoseSegment[0]
          : triangle.triangle[0],
      );
      expect(primitive.localVertices.map((point) => addProjective(point, primitive.q0))).toEqual(
        triangle.triangle,
      );
    }
  });

  it('derives both sides of a three-face hinge bridge without caller component labels', () => {
    const firstSide = compute(stepInput(threeFaceStripSource(), 0, 0));
    const secondSide = compute(stepInput(threeFaceStripSource(), 0, 1));
    expect(
      [firstSide.movingFaceIds.length, secondSide.movingFaceIds.length].sort((a, b) => a - b),
    ).toEqual([1, 2]);
    expect(firstSide.stationaryFaceIds.length + firstSide.movingFaceIds.length).toBe(3);
    expect(secondSide.stationaryFaceIds.length + secondSide.movingFaceIds.length).toBe(3);
    expect(new Set([...firstSide.movingFaceIds, ...firstSide.stationaryFaceIds]).size).toBe(3);
  });

  it('rejects an active hinge that lies on a cycle in the face dual graph', () => {
    const result = computeSingleHingeRotationSweptAabbStepV1(stepInput(fourFaceCycleSource()));
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('non-bridge hinge must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'step',
        code: 'active-hinge-not-dual-bridge',
      }),
    );
  });

  it('rejects boundary edges and moving-side faces not incident to the hinge', () => {
    const boundaryInput = stepInput(twoFaceSource());
    const boundaryBinding = bind(boundaryInput.bindingInput);
    const boundary = boundaryBinding.edges.find((edge) => edge.structuralKind === 'boundary');
    if (boundary === undefined) throw new TypeError('boundary edge fixture must exist');
    boundaryInput.step.activeHingeEdgeId = boundary.edgeId;
    const boundaryResult = computeSingleHingeRotationSweptAabbStepV1(boundaryInput);
    expect(boundaryResult.ok).toBe(false);
    if (boundaryResult.ok) throw new TypeError('boundary edge must fail');
    expect(boundaryResult.error).toContainEqual(
      expect.objectContaining({ code: 'invalid-active-hinge' }),
    );

    const wrongSideInput = stepInput(threeFaceStripSource());
    const stripBinding = bind(wrongSideInput.bindingInput);
    const active = stripBinding.edges.find(
      (edge) => edge.edgeId === wrongSideInput.step.activeHingeEdgeId,
    );
    if (active === undefined) throw new TypeError('active strip hinge must exist');
    const unrelated = stripBinding.faces.find(
      (face) => !active.incidentFaceIds.includes(face.faceId),
    );
    if (unrelated === undefined) throw new TypeError('unrelated strip face must exist');
    wrongSideInput.step.movingSideFaceId = unrelated.faceId;
    const wrongSide = computeSingleHingeRotationSweptAabbStepV1(wrongSideInput);
    expect(wrongSide.ok).toBe(false);
    if (wrongSide.ok) throw new TypeError('unrelated moving face must fail');
    expect(wrongSide.error).toContainEqual(
      expect.objectContaining({ code: 'moving-side-not-incident' }),
    );
  });

  it('propagates exact dyadic slab failures with the step path and rejects unknown fields', () => {
    const noncanonical = stepInput(twoFaceSource());
    (noncanonical.step as { slab: unknown }).slab = {
      t0: { numerator: 0n, exponent: 0 },
      t1: { numerator: 2n, exponent: 1 },
    };
    const slabResult = computeSingleHingeRotationSweptAabbStepV1(noncanonical);
    expect(slabResult.ok).toBe(false);
    if (slabResult.ok) throw new TypeError('noncanonical slab must fail');
    expect(slabResult.error).toContainEqual(
      expect.objectContaining({
        stage: 'motion-census',
        path: '$.step.slab.t1',
        code: 'invalid-shared-contract',
      }),
    );

    const extra = { ...stepInput(twoFaceSource()), scientificClaim: true };
    const extraResult = computeSingleHingeRotationSweptAabbStepV1(extra);
    expect(extraResult.ok).toBe(false);
    if (extraResult.ok) throw new TypeError('unknown field must fail');
    expect(extraResult.error).toContainEqual(
      expect.objectContaining({ stage: 'root', code: 'unknown-property' }),
    );
  });

  it('is invariant under caller triangle order and fails closed on hostile objects', () => {
    const canonical = stepInput(twoFaceSource());
    const reversed = stepInput(twoFaceSource());
    reversed.bindingInput.staticTriangleSet.triangles.reverse();
    expect(compute(reversed)).toEqual(compute(canonical));

    let getterCalls = 0;
    const accessor = stepInput(twoFaceSource());
    Object.defineProperty(accessor.step, 'stepId', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'Step:hostile';
      },
    });
    expect(computeSingleHingeRotationSweptAabbStepV1(accessor).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => computeSingleHingeRotationSweptAabbStepV1(revoked.proxy)).not.toThrow();
    const revokedResult = computeSingleHingeRotationSweptAabbStepV1(revoked.proxy);
    expect(revokedResult.ok).toBe(false);
    if (revokedResult.ok) throw new TypeError('revoked root must fail');
    expect(revokedResult.error).toContainEqual(
      expect.objectContaining({ stage: 'root', code: 'inspection-failed' }),
    );
  });

  it('deep-freezes output while keeping every downstream decision and claim false', () => {
    const result = computeSingleHingeRotationSweptAabbStepV1(stepInput(twoFaceSource()));
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.movingFaceIds)).toBe(true);
    expect(Object.isFrozen(result.value.primitives[0]?.localVertices)).toBe(true);
    expect(Object.isFrozen(result.value.pairs[0])).toBe(true);
    expect(result.value).toMatchObject({
      activeHingeIsUniqueFacePairEdge: true,
      activeHingeIsDualGraphBridge: true,
      movingComponentDerivedByGraphCut: true,
      exactHingePointOriginIncluded: true,
      exactLocalTriangleOffsetsIncluded: true,
      stationaryTriangleFirstVertexOriginsIncluded: true,
      stationaryFacesConservativelyEnclosed: true,
      stationaryTriangleArbitrarySo3Enclosed: true,
      stationaryIdentityPoseIsSubsetOfEnclosure: true,
      movingComponentArbitrarySo3AboutHingePointEnclosed: true,
      declaredFixedAxisRotationIsSubsetOfEnclosure: true,
      completeTriangleSetIncluded: true,
      completePairEnumerationIncluded: true,
      broadPhaseOnly: true,
      exactRotationScheduleIncluded: false,
      nonlinearNarrowPhaseIncluded: false,
      continuousCollisionDetectionIncluded: false,
      legalContactPolicyIncluded: false,
      selfIntersectionDecisionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });
});
