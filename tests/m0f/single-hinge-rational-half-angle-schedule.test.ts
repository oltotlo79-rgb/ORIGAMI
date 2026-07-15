import { describe, expect, it } from 'vitest';

import {
  constructSingleHingeRationalHalfAngleScheduleV1,
  type ExactRationalQuadraticPolynomialV1,
  type SingleHingeRationalHalfAngleScheduleRecordV1,
  type SingleHingeRationalHalfAngleVertexPathV1,
} from '../../m0f/geometry/single-hinge-rational-half-angle-schedule.js';
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
  equalExactRational,
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
    meshRevisionId: 'Mesh:half-angle:fixture:1',
    triangulationRevisionId: 'Triangulation:half-angle:fixture:1',
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

function rotateRight(cosine: ExactRational, sine: ExactRational): Pose {
  return (x, y) => {
    const offset = subtractExactRational(x, HALF);
    if (offset.numerator <= 0n) return [x, y, ZERO];
    return [
      addExactRational(HALF, multiplyExactRational(cosine, offset)),
      y,
      multiplyExactRational(sine, offset),
    ];
  };
}

function transitionInput(cosine: ExactRational, sine: ExactRational, source = twoFaceSource()) {
  const reconstruction = reconstruct(source);
  const startBindingInput = bindingInput(reconstruction, 'Pose:start:1', planarPose);
  const endBindingInput = bindingInput(reconstruction, 'Pose:end:1', rotateRight(cosine, sine));
  const startBinding = bind(startBindingInput);
  const hinge = startBinding.edges.find((edge) => edge.structuralKind === 'declared-hinge');
  if (hinge === undefined) throw new TypeError('hinge fixture must exist');
  const sourceXById = new Map(
    reconstruction.vertices.map((vertex) => [vertex.id, sourceCoordinates(vertex)[0]]),
  );
  const movingSideFaceId = hinge.incidentFaceIds.find((faceId) => {
    const face = reconstruction.faces.find((candidate) => candidate.id === faceId);
    return face?.triangles.some((triangle) =>
      triangle.vertexIds.some((vertexId) => {
        const x = sourceXById.get(vertexId);
        return x !== undefined && x.numerator * 2n > x.denominator;
      }),
    );
  });
  if (movingSideFaceId === undefined) throw new TypeError('moving face fixture must exist');
  return {
    transitionRevisionId: 'Transition:half-angle:fixture:1',
    stepId: 'Step:half-angle:fixture:1',
    activeHingeEdgeId: hinge.edgeId,
    movingSideFaceId,
    slab: SLAB,
    startBindingInput,
    endBindingInput,
  };
}

function schedule(
  supplied = transitionInput(ZERO, ONE),
): SingleHingeRationalHalfAngleScheduleRecordV1 {
  const result = constructSingleHingeRationalHalfAngleScheduleV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('half-angle schedule fixture must succeed');
  return result.value;
}

function evaluatePolynomial(
  coefficients: ExactRationalQuadraticPolynomialV1,
  parameter: ExactRational,
): ExactRational {
  return addExactRational(
    coefficients[0],
    multiplyExactRational(
      parameter,
      addExactRational(coefficients[1], multiplyExactRational(parameter, coefficients[2])),
    ),
  );
}

function evaluatePath(
  record: SingleHingeRationalHalfAngleScheduleRecordV1,
  path: SingleHingeRationalHalfAngleVertexPathV1,
  parameter: ExactRational,
): ProjectivePoint3 {
  const denominator = evaluatePolynomial(record.commonDenominator, parameter);
  return projectivePoint3FromRationalComponents(
    [
      evaluatePolynomial(path.xNumerator, parameter).numerator * denominator.denominator,
      evaluatePolynomial(path.xNumerator, parameter).denominator * denominator.numerator,
    ],
    [
      evaluatePolynomial(path.yNumerator, parameter).numerator * denominator.denominator,
      evaluatePolynomial(path.yNumerator, parameter).denominator * denominator.numerator,
    ],
    [
      evaluatePolynomial(path.zNumerator, parameter).numerator * denominator.denominator,
      evaluatePolynomial(path.zNumerator, parameter).denominator * denominator.numerator,
    ],
  );
}

function pointVector(point: ProjectivePoint3): RationalPoint3 {
  return [
    exactRational(point.x, point.w),
    exactRational(point.y, point.w),
    exactRational(point.z, point.w),
  ];
}

function squaredDistance(left: ProjectivePoint3, right: ProjectivePoint3): ExactRational {
  const a = pointVector(left);
  const b = pointVector(right);
  return [0, 1, 2].reduce((sum, index) => {
    const first = a[index];
    const second = b[index];
    if (first === undefined || second === undefined) throw new TypeError('coordinate must exist');
    const delta = subtractExactRational(first, second);
    return addExactRational(sum, multiplyExactRational(delta, delta));
  }, ZERO);
}

describe('single-hinge rational half-angle continuous schedule candidate', () => {
  it('constructs one complete exact quadratic-over-quadratic quarter-turn path', () => {
    const record = schedule();
    expect(record).toMatchObject({
      recordType: 'm0f-single-hinge-rational-half-angle-schedule',
      contractStatus: 'candidate-no-claim',
      normalizedTimeDefinition: 's=(t-t0)/(t1-t0), 0<=s<=1',
      rotationChart: 'finite-tangent-half-angle-principal-zero-winding',
      rotationParameterQuadratic: { numerator: 1n, denominator: 1n },
      commonDenominator: [
        { numerator: 1n, denominator: 1n },
        { numerator: 0n, denominator: 1n },
        { numerator: 1n, denominator: 1n },
      ],
      vertexCount: 6,
    });
    expect(record.halfAngleOverAxisLengthEndpoint.denominator).toBe(1n);
    expect(record.halfAngleOverAxisLengthEndpoint.numerator ** 2n).toBe(1n);
    expect(record.vertexPaths.map((path) => path.vertexId)).toEqual(
      record.transition.startBinding.vertices.map((vertex) => vertex.vertexId),
    );
    expect(record.movingComponentVertexCount + record.stationaryOnlyVertexCount).toBe(6);
  });

  it('evaluates the selected quarter-turn exactly at its rational midpoint', () => {
    const record = schedule();
    const startVertex = record.transition.startBinding.vertices.find(
      (vertex) => vertex.point.x === 1n && vertex.point.y === 0n && vertex.point.w === 1n,
    );
    if (startVertex === undefined) throw new TypeError('right-bottom vertex must exist');
    const path = record.vertexPaths.find(
      (candidate) => candidate.vertexId === startVertex.vertexId,
    );
    if (path === undefined) throw new TypeError('right-bottom path must exist');
    expect(evaluatePath(record, path, HALF)).toEqual(
      projective([exactRational(4n, 5n), ZERO, exactRational(2n, 5n)]),
    );
  });

  it('preserves every moving pair distance and every stationary point at exact samples', () => {
    const record = schedule();
    const startById = new Map(
      record.transition.startBinding.vertices.map((vertex) => [vertex.vertexId, vertex.point]),
    );
    const movingPaths = record.vertexPaths.filter(
      (path) => path.motionClass === 'moving-component',
    );
    const stationaryPaths = record.vertexPaths.filter(
      (path) => path.motionClass === 'stationary-only',
    );
    const samples = [ZERO, exactRational(1n, 4n), HALF, exactRational(3n, 4n), ONE];
    for (const parameter of samples) {
      const denominator = evaluatePolynomial(record.commonDenominator, parameter);
      expect(denominator.numerator).toBeGreaterThan(0n);
      for (const path of stationaryPaths) {
        expect(evaluatePath(record, path, parameter)).toEqual(startById.get(path.vertexId));
      }
      for (let firstIndex = 0; firstIndex < movingPaths.length; firstIndex += 1) {
        const first = movingPaths[firstIndex];
        if (first === undefined) throw new TypeError('moving path must exist');
        for (let secondIndex = firstIndex + 1; secondIndex < movingPaths.length; secondIndex += 1) {
          const second = movingPaths[secondIndex];
          if (second === undefined) throw new TypeError('moving path must exist');
          const expectedFirst = startById.get(first.vertexId);
          const expectedSecond = startById.get(second.vertexId);
          if (expectedFirst === undefined || expectedSecond === undefined) {
            throw new TypeError('start points must exist');
          }
          expect(
            equalExactRational(
              squaredDistance(
                evaluatePath(record, first, parameter),
                evaluatePath(record, second, parameter),
              ),
              squaredDistance(expectedFirst, expectedSecond),
            ),
          ).toBe(true);
        }
      }
    }
  });

  it('derives exact finite-chart parameters for rational and non-unit-axis endpoints', () => {
    const rational = schedule(transitionInput(exactRational(3n, 5n), exactRational(4n, 5n)));
    expect(rational.halfAngleOverAxisLengthEndpoint.denominator).toBe(2n);
    expect(rational.halfAngleOverAxisLengthEndpoint.numerator ** 2n).toBe(1n);
    expect(rational.rotationParameterQuadratic).toEqual({ numerator: 1n, denominator: 4n });

    const tall = schedule(
      transitionInput(exactRational(3n, 5n), exactRational(4n, 5n), twoFaceSource(2)),
    );
    expect(tall.axisDirectionSquaredLength).toEqual({ numerator: 4n, denominator: 1n });
    expect(tall.halfAngleOverAxisLengthEndpoint.denominator).toBe(4n);
    expect(tall.halfAngleOverAxisLengthEndpoint.numerator ** 2n).toBe(1n);
    expect(tall.rotationParameterQuadratic).toEqual({ numerator: 1n, denominator: 4n });
  });

  it('selects the zero-motion schedule for an identity endpoint', () => {
    const record = schedule(transitionInput(ONE, ZERO));
    expect(record.halfAngleOverAxisLengthEndpoint).toEqual({ numerator: 0n, denominator: 1n });
    expect(record.rotationParameterQuadratic).toEqual({ numerator: 0n, denominator: 1n });
    expect(record.commonDenominator).toEqual([ONE, ZERO, ZERO]);
    for (const path of record.vertexPaths) {
      expect(evaluatePath(record, path, HALF)).toEqual(
        record.transition.startBinding.vertices.find((vertex) => vertex.vertexId === path.vertexId)
          ?.point,
      );
    }
  });

  it('fails closed at the finite-chart half-turn singularity', () => {
    const result = constructSingleHingeRationalHalfAngleScheduleV1(
      transitionInput(exactRational(-1n), ZERO),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('half-turn chart singularity must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({ stage: 'schedule', code: 'half-turn-chart-singularity' }),
    );
  });

  it('is invariant under triangle order and propagates hostile transition rejection', () => {
    const canonical = transitionInput(ZERO, ONE);
    const reordered = transitionInput(ZERO, ONE);
    reordered.startBindingInput.staticTriangleSet.triangles.reverse();
    reordered.endBindingInput.staticTriangleSet.triangles.reverse();
    expect(schedule(reordered)).toEqual(schedule(canonical));

    let getterCalls = 0;
    const accessor = transitionInput(ZERO, ONE) as Record<string, unknown>;
    Object.defineProperty(accessor, 'stepId', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'Step:hostile';
      },
    });
    const rejected = constructSingleHingeRationalHalfAngleScheduleV1(accessor);
    expect(rejected.ok).toBe(false);
    expect(getterCalls).toBe(0);
    if (rejected.ok) throw new TypeError('hostile transition must fail');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ stage: 'transition', code: 'accessor-property' }),
    );
  });

  it('deep-freezes coefficients while keeping collision and product claims false', () => {
    const result = constructSingleHingeRationalHalfAngleScheduleV1(transitionInput(ZERO, ONE));
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('schedule fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.commonDenominator)).toBe(true);
    expect(Object.isFrozen(result.value.vertexPaths[0]?.xNumerator[0])).toBe(true);
    expect(result.value).toMatchObject({
      completeMeshVertexPathIncluded: true,
      oneSharedMovingRotationParameterIncluded: true,
      exactStartPoseReproduced: true,
      exactEndPoseReproduced: true,
      commonDenominatorStrictlyPositiveOnUnitInterval: true,
      continuousRigidComponentScheduleConstructed: true,
      principalHalfAngleChartSelected: true,
      zeroWindingSelected: true,
      monotoneHalfAngleParameterIncluded: true,
      halfTurnEndpointSupported: false,
      foldAssignmentDirectionConsistencyIncluded: false,
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
