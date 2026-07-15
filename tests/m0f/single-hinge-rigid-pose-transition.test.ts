import { describe, expect, it } from 'vitest';

import {
  bindSingleHingeRigidPoseTransitionV1,
  type SingleHingeRigidPoseTransitionRecordV1,
} from '../../m0f/geometry/single-hinge-rigid-pose-transition.js';
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
  addExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';
import {
  projectivePoint3FromRationalComponents,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

type RationalPoint3 = readonly [x: ExactRational, y: ExactRational, z: ExactRational];
type Pose = (x: ExactRational, y: ExactRational) => RationalPoint3;

const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const HALF = exactRational(1n, 2n);
const SLAB = {
  t0: { numerator: 0n, exponent: 0 },
  t1: { numerator: 1n, exponent: 0 },
} as const;

function twoFaceSource(height = 1): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, height],
      [0.5, height],
      [0, height],
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

function reconstruct(source: Record<string, unknown>): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('FOLD reconstruction fixture must succeed');
  return result.value;
}

function sourceCoordinates(
  vertex: CandidateFoldFaceReconstructionV1['vertices'][number],
): readonly [ExactRational, ExactRational] {
  return [
    exactRational(
      BigInt(vertex.exactCoordinate.x.numerator),
      BigInt(vertex.exactCoordinate.x.denominator),
    ),
    exactRational(
      BigInt(vertex.exactCoordinate.y.numerator),
      BigInt(vertex.exactCoordinate.y.denominator),
    ),
  ];
}

function projective(point: RationalPoint3): ProjectivePoint3 {
  return projectivePoint3FromRationalComponents(
    [point[0].numerator, point[0].denominator],
    [point[1].numerator, point[1].denominator],
    [point[2].numerator, point[2].denominator],
  );
}

function bindingInput(
  reconstruction: CandidateFoldFaceReconstructionV1,
  poseRevisionId: string,
  pose: Pose,
) {
  const pointById = new Map(
    reconstruction.vertices.map((vertex) => {
      const [x, y] = sourceCoordinates(vertex);
      return [vertex.id, projective(pose(x, y))] as const;
    }),
  );
  return {
    meshRevisionId: 'Mesh:rigid-transition:fixture:1',
    triangulationRevisionId: 'Triangulation:rigid-transition:fixture:1',
    poseRevisionId,
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

function planarPose(x: ExactRational, y: ExactRational): RationalPoint3 {
  return [x, y, ZERO];
}

function rotateRightOf(hingeX: ExactRational, cosine: ExactRational, sine: ExactRational): Pose {
  return (x, y) => {
    const offset = subtractExactRational(x, hingeX);
    if (offset.numerator <= 0n) return [x, y, ZERO];
    return [
      addExactRational(hingeX, multiplyExactRational(cosine, offset)),
      y,
      multiplyExactRational(sine, offset),
    ];
  };
}

function positiveSideIncidentFace(
  reconstruction: CandidateFoldFaceReconstructionV1,
  incidentFaceIds: readonly string[],
  hingeX: ExactRational,
): string {
  const sourceById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const face = reconstruction.faces.find(
    (candidate) =>
      incidentFaceIds.includes(candidate.id) &&
      candidate.triangles.some((triangle) =>
        triangle.vertexIds.some((vertexId) => {
          const x = sourceById.get(vertexId);
          return (
            x !== undefined && x.numerator * hingeX.denominator > hingeX.numerator * x.denominator
          );
        }),
      ),
  );
  if (face === undefined) throw new TypeError('positive-side incident face must exist');
  return face.id;
}

function hingeAtX(
  binding: StaticRationalTriangleFoldMeshBindingRecordV1,
  x: ExactRational,
): StaticRationalTriangleFoldMeshBindingRecordV1['edges'][number] {
  const pointById = new Map(binding.vertices.map((vertex) => [vertex.vertexId, vertex.point]));
  const hinge = binding.edges.find(
    (edge) =>
      edge.structuralKind === 'declared-hinge' &&
      edge.vertexIds.every((vertexId) => {
        const point = pointById.get(vertexId);
        return point !== undefined && point.x * x.denominator === x.numerator * point.w;
      }),
  );
  if (hinge === undefined) throw new TypeError('hinge at target x must exist');
  return hinge;
}

function transitionInput(source: Record<string, unknown>, endPose: Pose, hingeX: ExactRational) {
  const reconstruction = reconstruct(source);
  const startBindingInput = bindingInput(reconstruction, 'Pose:start:1', planarPose);
  const endBindingInput = bindingInput(reconstruction, 'Pose:end:1', endPose);
  const startBinding = bind(startBindingInput);
  const hinge = hingeAtX(startBinding, hingeX);
  const movingSideFaceId = positiveSideIncidentFace(reconstruction, hinge.incidentFaceIds, hingeX);
  expect(hinge.incidentFaceIds).toContain(movingSideFaceId);
  return {
    transitionRevisionId: 'Transition:fixture:1',
    stepId: 'Step:fixture:1',
    activeHingeEdgeId: hinge.edgeId,
    movingSideFaceId,
    slab: SLAB,
    startBindingInput,
    endBindingInput,
  };
}

function twoFaceTransition(cosine: ExactRational, sine: ExactRational) {
  return transitionInput(twoFaceSource(), rotateRightOf(HALF, cosine, sine), HALF);
}

function bindTransition(
  supplied = twoFaceTransition(ZERO, ONE),
): SingleHingeRigidPoseTransitionRecordV1 {
  const result = bindSingleHingeRigidPoseTransitionV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('rigid transition fixture must succeed');
  return result.value;
}

describe('single-hinge exact rigid-pose transition candidate', () => {
  it('establishes one exact quarter-turn endpoint across the complete moving component', () => {
    const record = bindTransition();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rigid-pose-transition',
      contractStatus: 'candidate-no-claim',
      transitionRevisionId: 'Transition:fixture:1',
      stepId: 'Step:fixture:1',
      startPoseRevisionId: 'Pose:start:1',
      endPoseRevisionId: 'Pose:end:1',
      endpointRotationKind: 'general',
      axisDirectionSquaredLength: { numerator: 1n, denominator: 1n },
      rotationCosine: { numerator: 0n, denominator: 1n },
    });
    expect(record.rotationSineOverAxisLength.denominator).toBe(1n);
    expect(record.rotationSineOverAxisLength.numerator ** 2n).toBe(1n);
    expect(record.movingFaceIds).toEqual([record.movingSideFaceId]);
    expect(record.stationaryFaceIds).toHaveLength(1);
    expect(record.movingComponentVertexIds).toContain(record.activeHingeAxisVertexIds[0]);
    expect(record.stationaryComponentVertexIds).toContain(record.activeHingeAxisVertexIds[0]);
    expect(record.startBinding.triangleCount).toBe(4);
    expect(record.endBinding.triangleCount).toBe(4);
    expect(record.broadPhaseStep.unorderedPairCount).toBe(6);
  });

  it('retains exact rational 3/5-4/5 rotation parameters', () => {
    const record = bindTransition(twoFaceTransition(exactRational(3n, 5n), exactRational(4n, 5n)));
    expect(record.rotationCosine).toEqual({ numerator: 3n, denominator: 5n });
    expect(record.rotationSineOverAxisLength.denominator).toBe(5n);
    expect(record.rotationSineOverAxisLength.numerator ** 2n).toBe(16n);
    expect(record.endpointRotationKind).toBe('general');
  });

  it('normalizes the oriented sine parameter against a non-unit hinge axis', () => {
    const supplied = transitionInput(
      twoFaceSource(2),
      rotateRightOf(HALF, exactRational(3n, 5n), exactRational(4n, 5n)),
      HALF,
    );
    const record = bindTransition(supplied);
    expect(record.axisDirectionSquaredLength).toEqual({ numerator: 4n, denominator: 1n });
    expect(record.rotationCosine).toEqual({ numerator: 3n, denominator: 5n });
    expect(record.rotationSineOverAxisLength.denominator).toBe(5n);
    expect(record.rotationSineOverAxisLength.numerator ** 2n).toBe(4n);
  });

  it('distinguishes identity and half-turn endpoint maps without inventing winding', () => {
    const identity = bindTransition(twoFaceTransition(ONE, ZERO));
    expect(identity.endpointRotationKind).toBe('identity');
    expect(identity.rotationCosine).toEqual({ numerator: 1n, denominator: 1n });
    expect(identity.rotationSineOverAxisLength).toEqual({ numerator: 0n, denominator: 1n });

    const halfTurn = bindTransition(twoFaceTransition(exactRational(-1n), ZERO));
    expect(halfTurn.endpointRotationKind).toBe('half-turn');
    expect(halfTurn.rotationCosine).toEqual({ numerator: -1n, denominator: 1n });
    expect(halfTurn.rotationSineOverAxisLength).toEqual({
      numerator: 0n,
      denominator: 1n,
    });
    expect(halfTurn.angleBranchOrWindingIncluded).toBe(false);
  });

  it('rejects a chained second-hinge motion disguised as one active-hinge step', () => {
    const chainedPose: Pose = (x, y) => {
      const fromFirst = subtractExactRational(x, ONE);
      if (fromFirst.numerator <= 0n) return [x, y, ZERO];
      const fromSecond = subtractExactRational(x, exactRational(2n));
      if (fromSecond.numerator <= 0n) return [ONE, y, fromFirst];
      return [subtractExactRational(ONE, fromSecond), y, ONE];
    };
    const supplied = transitionInput(threeFaceStripSource(), chainedPose, ONE);
    const result = bindSingleHingeRigidPoseTransitionV1(supplied);
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('chained hinge motion must fail');
    const transitionError = result.error.find((entry) => entry.stage === 'transition');
    expect([
      'moving-radial-distance-changed',
      'inconsistent-moving-rotation',
      'rodrigues-endpoint-mismatch',
    ]).toContain(transitionError?.code);
  });

  it('rejects a translated model because the stationary component and hinge axis moved', () => {
    const translated: Pose = (x, y) => [addExactRational(x, ONE), y, ZERO];
    const supplied = transitionInput(twoFaceSource(), translated, HALF);
    const result = bindSingleHingeRigidPoseTransitionV1(supplied);
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('translated stationary component must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({ stage: 'transition', code: 'stationary-vertex-moved' }),
    );
  });

  it('requires matching revision labels and full topology semantics', () => {
    const supplied = twoFaceTransition(ZERO, ONE);
    supplied.endBindingInput.meshRevisionId = 'Mesh:different-label:1';
    const labelResult = bindSingleHingeRigidPoseTransitionV1(supplied);
    expect(labelResult.ok).toBe(false);
    if (labelResult.ok) throw new TypeError('mismatched topology revision must fail');
    expect(labelResult.error).toContainEqual(
      expect.objectContaining({ stage: 'topology', code: 'topology-mismatch' }),
    );

    const assignmentChanged = twoFaceTransition(ZERO, ONE);
    const mountainSource = twoFaceSource();
    const assignments = mountainSource.edgesAssignment;
    if (!Array.isArray(assignments)) throw new TypeError('assignment fixture must be an array');
    assignments[6] = 'M';
    assignmentChanged.endBindingInput = bindingInput(
      reconstruct(mountainSource),
      'Pose:end:1',
      rotateRightOf(HALF, ZERO, ONE),
    );
    const topologyResult = bindSingleHingeRigidPoseTransitionV1(assignmentChanged);
    expect(topologyResult.ok).toBe(false);
    if (topologyResult.ok) throw new TypeError('changed hinge assignment must fail');
    expect(topologyResult.error).toContainEqual(
      expect.objectContaining({ stage: 'topology', code: 'topology-mismatch' }),
    );
  });

  it('propagates start-step and end-binding failures without partial success', () => {
    const invalidSlab = twoFaceTransition(ZERO, ONE);
    (invalidSlab as { slab: unknown }).slab = {
      t0: { numerator: 0n, exponent: 0 },
      t1: { numerator: 2n, exponent: 1 },
    };
    const slabResult = bindSingleHingeRigidPoseTransitionV1(invalidSlab);
    expect(slabResult.ok).toBe(false);
    if (slabResult.ok) throw new TypeError('invalid slab must fail');
    expect(slabResult.error).toContainEqual(
      expect.objectContaining({
        stage: 'start-step',
        path: '$.slab.t1',
        code: 'invalid-shared-contract',
      }),
    );

    const invalidEnd = twoFaceTransition(ZERO, ONE);
    const first = invalidEnd.endBindingInput.staticTriangleSet.triangles[0];
    if (first === undefined) throw new TypeError('end triangle fixture must exist');
    first.triangle = [first.triangle[0], first.triangle[0], first.triangle[2]];
    const endResult = bindSingleHingeRigidPoseTransitionV1(invalidEnd);
    expect(endResult.ok).toBe(false);
    if (endResult.ok) throw new TypeError('invalid end pose must fail');
    const endError = endResult.error.find((entry) => entry.code === 'invalid-triangle');
    expect(endError?.stage).toBe('end-binding');
    expect(endError?.path).toContain('$.endBindingInput.staticTriangleSet');
  });

  it('is invariant under pose-triangle order and rejects hostile root data without getter calls', () => {
    const canonical = twoFaceTransition(ZERO, ONE);
    const reordered = twoFaceTransition(ZERO, ONE);
    reordered.startBindingInput.staticTriangleSet.triangles.reverse();
    reordered.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(bindTransition(reordered)).toEqual(bindTransition(canonical));

    let getterCalls = 0;
    const accessor = twoFaceTransition(ZERO, ONE) as Record<string, unknown>;
    Object.defineProperty(accessor, 'stepId', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'Step:hostile';
      },
    });
    expect(bindSingleHingeRigidPoseTransitionV1(accessor).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => bindSingleHingeRigidPoseTransitionV1(revoked.proxy)).not.toThrow();
    const revokedResult = bindSingleHingeRigidPoseTransitionV1(revoked.proxy);
    expect(revokedResult.ok).toBe(false);
    if (revokedResult.ok) throw new TypeError('revoked root must fail');
    expect(revokedResult.error).toContainEqual(
      expect.objectContaining({ stage: 'root', code: 'inspection-failed' }),
    );
  });

  it('deep-freezes the exact result while keeping every continuous decision and claim false', () => {
    const result = bindSingleHingeRigidPoseTransitionV1(twoFaceTransition(ZERO, ONE));
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('transition fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.rotationCosine)).toBe(true);
    expect(Object.isFrozen(result.value.movingComponentVertexIds)).toBe(true);
    expect(Object.isFrozen(result.value.endBinding.vertices[0]?.point)).toBe(true);
    expect(result.value).toMatchObject({
      completeTopologyEqualityChecked: true,
      callerRevisionLabelsOnly: true,
      exactSourceReconstructionGeometryEqualityChecked: false,
      cryptographicSourceRevisionBindingIncluded: false,
      exactStationaryVertexEqualityChecked: true,
      exactHingeAxisEqualityChecked: true,
      exactMovingAxialCoordinatesChecked: true,
      exactMovingRadialDistancesChecked: true,
      commonExactRotationParametersChecked: true,
      exactRodriguesEndpointEquationChecked: true,
      orientationPreservingAxisRotationEstablished: true,
      exactEndpointRigidRotationEstablished: true,
      endpointOnly: true,
      angleBranchOrWindingIncluded: false,
      exactIntermediateAngleScheduleIncluded: false,
      chainedOrSimultaneousHingesIncluded: false,
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
