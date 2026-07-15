import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  divideExactRational,
  equalExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  equalProjectivePoints3,
  projectivePoint3FromRationalComponents,
  type ProjectiveAxis3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';
import type { CanonicalDyadicTimeSlabV1 } from './affine-origin-rotation-swept-aabb.js';
import {
  bindSingleHingeRigidPoseTransitionV1,
  type SingleHingeRigidPoseTransitionRecordV1,
} from './single-hinge-rigid-pose-transition.js';

type RationalVector3 = readonly [x: ExactRational, y: ExactRational, z: ExactRational];

export type ExactRationalQuadraticPolynomialV1 = readonly [
  constant: ExactRational,
  linear: ExactRational,
  quadratic: ExactRational,
];

export type SingleHingeRationalHalfAngleVertexPathV1 = Readonly<{
  vertexId: string;
  motionClass: 'moving-component' | 'stationary-only';
  xNumerator: ExactRationalQuadraticPolynomialV1;
  yNumerator: ExactRationalQuadraticPolynomialV1;
  zNumerator: ExactRationalQuadraticPolynomialV1;
}>;

export type SingleHingeRationalHalfAngleScheduleRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-half-angle-schedule';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-zero-winding-principal-chart-single-hinge-rigid-transition';
  arithmetic: 'exact-rational-bigint-quadratic-over-quadratic';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  startPoseRevisionId: string;
  endPoseRevisionId: string;
  activeHingeEdgeId: string;
  movingSideFaceId: string;
  slab: CanonicalDyadicTimeSlabV1;
  normalizedTimeDefinition: 's=(t-t0)/(t1-t0), 0<=s<=1';
  rotationChart: 'finite-tangent-half-angle-principal-zero-winding';
  halfAngleOverAxisLengthEndpoint: ExactRational;
  axisDirectionSquaredLength: ExactRational;
  rotationParameterQuadratic: ExactRational;
  commonDenominator: ExactRationalQuadraticPolynomialV1;
  vertexPaths: readonly SingleHingeRationalHalfAngleVertexPathV1[];
  vertexCount: number;
  movingComponentVertexCount: number;
  stationaryOnlyVertexCount: number;
  transition: SingleHingeRigidPoseTransitionRecordV1;
  completeMeshVertexPathIncluded: true;
  oneSharedMovingRotationParameterIncluded: true;
  exactStartPoseReproduced: true;
  exactEndPoseReproduced: true;
  commonDenominatorStrictlyPositiveOnUnitInterval: true;
  continuousRigidComponentScheduleConstructed: true;
  principalHalfAngleChartSelected: true;
  zeroWindingSelected: true;
  monotoneHalfAngleParameterIncluded: true;
  halfTurnEndpointSupported: false;
  foldAssignmentDirectionConsistencyIncluded: false;
  chainedOrSimultaneousHingesIncluded: false;
  nonlinearNarrowPhaseIncluded: false;
  continuousCollisionDetectionIncluded: false;
  legalContactPolicyIncluded: false;
  selfIntersectionDecisionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type SingleHingeRationalHalfAngleScheduleIssueV1 = Readonly<{
  stage: 'transition' | 'schedule';
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
}>;

export type SingleHingeRationalHalfAngleScheduleResultV1 =
  | Readonly<{ ok: true; value: SingleHingeRationalHalfAngleScheduleRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalHalfAngleScheduleIssueV1[];
    }>;

const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const TWO = exactRational(2n);

function issue(
  stage: SingleHingeRationalHalfAngleScheduleIssueV1['stage'],
  path: string,
  code: string,
  message: string,
  relatedIds?: readonly string[],
): SingleHingeRationalHalfAngleScheduleIssueV1 {
  return relatedIds === undefined
    ? { stage, path, code, message }
    : { stage, path, code, message, relatedIds: [...relatedIds] };
}

function failure(
  errors: readonly SingleHingeRationalHalfAngleScheduleIssueV1[],
): SingleHingeRationalHalfAngleScheduleResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function coordinate(point: ProjectivePoint3, axis: ProjectiveAxis3): ExactRational {
  return exactRational(point[axis], point.w);
}

function pointDifference(point: ProjectivePoint3, origin: ProjectivePoint3): RationalVector3 {
  return [
    subtractExactRational(coordinate(point, 'x'), coordinate(origin, 'x')),
    subtractExactRational(coordinate(point, 'y'), coordinate(origin, 'y')),
    subtractExactRational(coordinate(point, 'z'), coordinate(origin, 'z')),
  ];
}

function addVector(left: RationalVector3, right: RationalVector3): RationalVector3 {
  return [
    addExactRational(left[0], right[0]),
    addExactRational(left[1], right[1]),
    addExactRational(left[2], right[2]),
  ];
}

function subtractVector(left: RationalVector3, right: RationalVector3): RationalVector3 {
  return [
    subtractExactRational(left[0], right[0]),
    subtractExactRational(left[1], right[1]),
    subtractExactRational(left[2], right[2]),
  ];
}

function scaleVector(vector: RationalVector3, scale: ExactRational): RationalVector3 {
  return [
    multiplyExactRational(vector[0], scale),
    multiplyExactRational(vector[1], scale),
    multiplyExactRational(vector[2], scale),
  ];
}

function dotVector(left: RationalVector3, right: RationalVector3): ExactRational {
  return addExactRational(
    addExactRational(
      multiplyExactRational(left[0], right[0]),
      multiplyExactRational(left[1], right[1]),
    ),
    multiplyExactRational(left[2], right[2]),
  );
}

function crossVector(left: RationalVector3, right: RationalVector3): RationalVector3 {
  return [
    subtractExactRational(
      multiplyExactRational(left[1], right[2]),
      multiplyExactRational(left[2], right[1]),
    ),
    subtractExactRational(
      multiplyExactRational(left[2], right[0]),
      multiplyExactRational(left[0], right[2]),
    ),
    subtractExactRational(
      multiplyExactRational(left[0], right[1]),
      multiplyExactRational(left[1], right[0]),
    ),
  ];
}

function exactPointFromVector(vector: RationalVector3): ProjectivePoint3 {
  return projectivePoint3FromRationalComponents(
    [vector[0].numerator, vector[0].denominator],
    [vector[1].numerator, vector[1].denominator],
    [vector[2].numerator, vector[2].denominator],
  );
}

function polynomial(
  constant: ExactRational,
  linear: ExactRational,
  quadratic: ExactRational,
): ExactRationalQuadraticPolynomialV1 {
  return [constant, linear, quadratic];
}

export function evaluateExactRationalQuadraticPolynomialV1(
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

export function evaluateSingleHingeRationalHalfAngleVertexPathV1(
  path: SingleHingeRationalHalfAngleVertexPathV1,
  commonDenominator: ExactRationalQuadraticPolynomialV1,
  parameter: ExactRational,
): ProjectivePoint3 {
  const denominator = evaluateExactRationalQuadraticPolynomialV1(commonDenominator, parameter);
  const point: RationalVector3 = [
    divideExactRational(
      evaluateExactRationalQuadraticPolynomialV1(path.xNumerator, parameter),
      denominator,
    ),
    divideExactRational(
      evaluateExactRationalQuadraticPolynomialV1(path.yNumerator, parameter),
      denominator,
    ),
    divideExactRational(
      evaluateExactRationalQuadraticPolynomialV1(path.zNumerator, parameter),
      denominator,
    ),
  ];
  return exactPointFromVector(point);
}

function movingVertexPath(
  vertexId: string,
  point: ProjectivePoint3,
  axisOrigin: ProjectivePoint3,
  axis: RationalVector3,
  axisSquaredLength: ExactRational,
  halfAngleOverAxisLengthEndpoint: ExactRational,
  rotationParameterQuadratic: ExactRational,
): SingleHingeRationalHalfAngleVertexPathV1 {
  const offset = pointDifference(point, axisOrigin);
  const axialScale = divideExactRational(dotVector(offset, axis), axisSquaredLength);
  const base = addVector(
    [coordinate(axisOrigin, 'x'), coordinate(axisOrigin, 'y'), coordinate(axisOrigin, 'z')],
    scaleVector(axis, axialScale),
  );
  const perpendicular = subtractVector(offset, scaleVector(axis, axialScale));
  const crossed = crossVector(axis, perpendicular);
  const linear = scaleVector(crossed, multiplyExactRational(TWO, halfAngleOverAxisLengthEndpoint));
  const quadratic = scaleVector(subtractVector(base, perpendicular), rotationParameterQuadratic);
  const constant: RationalVector3 = [
    coordinate(point, 'x'),
    coordinate(point, 'y'),
    coordinate(point, 'z'),
  ];
  return {
    vertexId,
    motionClass: 'moving-component',
    xNumerator: polynomial(constant[0], linear[0], quadratic[0]),
    yNumerator: polynomial(constant[1], linear[1], quadratic[1]),
    zNumerator: polynomial(constant[2], linear[2], quadratic[2]),
  };
}

function stationaryVertexPath(
  vertexId: string,
  point: ProjectivePoint3,
  rotationParameterQuadratic: ExactRational,
): SingleHingeRationalHalfAngleVertexPathV1 {
  const coordinatePolynomial = (axis: ProjectiveAxis3) => {
    const value = coordinate(point, axis);
    return polynomial(value, ZERO, multiplyExactRational(rotationParameterQuadratic, value));
  };
  return {
    vertexId,
    motionClass: 'stationary-only',
    xNumerator: coordinatePolynomial('x'),
    yNumerator: coordinatePolynomial('y'),
    zNumerator: coordinatePolynomial('z'),
  };
}

/**
 * Selects the finite principal tangent-half-angle chart and constructs one
 * exact quadratic-over-quadratic path for every bound mesh vertex.
 */
export function constructSingleHingeRationalHalfAngleScheduleV1(
  suppliedTransition: unknown,
): SingleHingeRationalHalfAngleScheduleResultV1 {
  const transition = bindSingleHingeRigidPoseTransitionV1(suppliedTransition);
  if (!transition.ok) {
    return failure(
      transition.error.map((entry) =>
        issue('transition', entry.path, entry.code, entry.message, entry.relatedIds),
      ),
    );
  }
  try {
    const onePlusCosine = addExactRational(ONE, transition.value.rotationCosine);
    if (equalExactRational(onePlusCosine, ZERO)) {
      return failure([
        issue(
          'schedule',
          '$.endBindingInput.staticTriangleSet',
          'half-turn-chart-singularity',
          'the finite tangent-half-angle chart does not include a half-turn endpoint',
        ),
      ]);
    }
    const halfAngleOverAxisLengthEndpoint = divideExactRational(
      transition.value.rotationSineOverAxisLength,
      onePlusCosine,
    );
    const rotationParameterQuadratic = multiplyExactRational(
      transition.value.axisDirectionSquaredLength,
      multiplyExactRational(halfAngleOverAxisLengthEndpoint, halfAngleOverAxisLengthEndpoint),
    );
    const denominatorAtEnd = addExactRational(ONE, rotationParameterQuadratic);
    const reconstructedCosine = divideExactRational(
      subtractExactRational(ONE, rotationParameterQuadratic),
      denominatorAtEnd,
    );
    const reconstructedSineOverAxisLength = divideExactRational(
      multiplyExactRational(TWO, halfAngleOverAxisLengthEndpoint),
      denominatorAtEnd,
    );
    if (
      !equalExactRational(reconstructedCosine, transition.value.rotationCosine) ||
      !equalExactRational(
        reconstructedSineOverAxisLength,
        transition.value.rotationSineOverAxisLength,
      ) ||
      rotationParameterQuadratic.numerator < 0n
    ) {
      return failure([
        issue(
          'schedule',
          '$',
          'half-angle-parameter-invariant',
          'exact endpoint rotation parameters do not reconstruct in the selected chart',
        ),
      ]);
    }
    const startAxis = transition.value.startBinding.edges.find(
      (edge) => edge.edgeId === transition.value.activeHingeEdgeId,
    );
    if (startAxis === undefined) {
      return failure([
        issue(
          'schedule',
          '$.activeHingeEdgeId',
          'missing-active-axis',
          'active hinge must remain in the bound start mesh',
        ),
      ]);
    }
    const axisOrigin = startAxis.exactPoseSegment[0];
    const axis = pointDifference(startAxis.exactPoseSegment[1], axisOrigin);
    const movingIds = new Set(transition.value.movingComponentVertexIds);
    const commonDenominator = polynomial(ONE, ZERO, rotationParameterQuadratic);
    const vertexPaths = transition.value.startBinding.vertices.map((vertex) =>
      movingIds.has(vertex.vertexId)
        ? movingVertexPath(
            vertex.vertexId,
            vertex.point,
            axisOrigin,
            axis,
            transition.value.axisDirectionSquaredLength,
            halfAngleOverAxisLengthEndpoint,
            rotationParameterQuadratic,
          )
        : stationaryVertexPath(vertex.vertexId, vertex.point, rotationParameterQuadratic),
    );
    const endPointById = new Map(
      transition.value.endBinding.vertices.map((vertex) => [vertex.vertexId, vertex.point]),
    );
    for (const path of vertexPaths) {
      const startPoint = evaluateSingleHingeRationalHalfAngleVertexPathV1(
        path,
        commonDenominator,
        ZERO,
      );
      const endPoint = evaluateSingleHingeRationalHalfAngleVertexPathV1(
        path,
        commonDenominator,
        ONE,
      );
      const expectedStart = transition.value.startBinding.vertices.find(
        (vertex) => vertex.vertexId === path.vertexId,
      )?.point;
      const expectedEnd = endPointById.get(path.vertexId);
      if (
        expectedStart === undefined ||
        expectedEnd === undefined ||
        !equalProjectivePoints3(startPoint, expectedStart) ||
        !equalProjectivePoints3(endPoint, expectedEnd)
      ) {
        return failure([
          issue(
            'schedule',
            '$.vertexPaths',
            'endpoint-reproduction-failed',
            'one generated exact vertex path does not reproduce both bound endpoint poses',
            [path.vertexId],
          ),
        ]);
      }
    }
    const stationaryOnlyVertexCount = vertexPaths.filter(
      (path) => path.motionClass === 'stationary-only',
    ).length;
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-half-angle-schedule' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-zero-winding-principal-chart-single-hinge-rigid-transition' as const,
        arithmetic: 'exact-rational-bigint-quadratic-over-quadratic' as const,
        transitionRevisionId: transition.value.transitionRevisionId,
        stepId: transition.value.stepId,
        meshRevisionId: transition.value.meshRevisionId,
        triangulationRevisionId: transition.value.triangulationRevisionId,
        startPoseRevisionId: transition.value.startPoseRevisionId,
        endPoseRevisionId: transition.value.endPoseRevisionId,
        activeHingeEdgeId: transition.value.activeHingeEdgeId,
        movingSideFaceId: transition.value.movingSideFaceId,
        slab: transition.value.slab,
        normalizedTimeDefinition: 's=(t-t0)/(t1-t0), 0<=s<=1' as const,
        rotationChart: 'finite-tangent-half-angle-principal-zero-winding' as const,
        halfAngleOverAxisLengthEndpoint,
        axisDirectionSquaredLength: transition.value.axisDirectionSquaredLength,
        rotationParameterQuadratic,
        commonDenominator,
        vertexPaths,
        vertexCount: vertexPaths.length,
        movingComponentVertexCount: transition.value.movingComponentVertexIds.length,
        stationaryOnlyVertexCount,
        transition: transition.value,
        completeMeshVertexPathIncluded: true as const,
        oneSharedMovingRotationParameterIncluded: true as const,
        exactStartPoseReproduced: true as const,
        exactEndPoseReproduced: true as const,
        commonDenominatorStrictlyPositiveOnUnitInterval: true as const,
        continuousRigidComponentScheduleConstructed: true as const,
        principalHalfAngleChartSelected: true as const,
        zeroWindingSelected: true as const,
        monotoneHalfAngleParameterIncluded: true as const,
        halfTurnEndpointSupported: false as const,
        foldAssignmentDirectionConsistencyIncluded: false as const,
        chainedOrSimultaneousHingesIncluded: false as const,
        nonlinearNarrowPhaseIncluded: false as const,
        continuousCollisionDetectionIncluded: false as const,
        legalContactPolicyIncluded: false as const,
        selfIntersectionDecisionIncluded: false as const,
        collisionFreeClaim: false as const,
        isSupportProfile: false as const,
        supportClaim: false as const,
        verifiedClaim: false as const,
        scientificClaim: false as const,
        globalM0fGo: false as const,
      },
    });
  } catch {
    return failure([
      issue(
        'schedule',
        '$',
        'schedule-invariant-failed',
        'rational half-angle schedule construction failed closed unexpectedly',
      ),
    ]);
  }
}
