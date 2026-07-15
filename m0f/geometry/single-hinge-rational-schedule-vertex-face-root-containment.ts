import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  equalExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import type { ProjectiveAxis3 } from '../reference-verifier/projective-rational-3d.js';
import {
  determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1,
  PRIMITIVE_INTEGER_POLYNOMIAL_ALGEBRAIC_ROOT_SIGN_LIMITS,
  type PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1,
} from './primitive-integer-polynomial-algebraic-root-sign.js';
import {
  computeSingleHingeRationalScheduleEventPolynomialCensusV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS,
  type SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  type SingleHingeRationalScheduleVertexFaceEventV1,
} from './single-hinge-rational-schedule-event-polynomial-census.js';
import type {
  ExactRationalQuadraticPolynomialV1,
  SingleHingeRationalHalfAngleVertexPathV1,
} from './single-hinge-rational-half-angle-schedule.js';

type RationalPolynomial = readonly ExactRational[];
type PolynomialPoint3 = Readonly<{
  x: ExactRationalQuadraticPolynomialV1;
  y: ExactRationalQuadraticPolynomialV1;
  z: ExactRationalQuadraticPolynomialV1;
}>;

export const SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS = deepFreezeOwned({
  maxEventIndex: SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxEvents - 1,
  maxDefiningRootIndex: SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree,
  maxClassificationIdCodeUnits: 64,
  maxAuxiliaryPolynomialDegree: 4,
  maxAuxiliaryCoefficientBits:
    SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxCanonicalCoefficientBits,
  projectionCandidateCount: 3,
  edgeOrientationCount: 3,
  algebraicSignEvaluationCount: 6,
});

export type SingleHingeRationalScheduleVertexFaceContainmentClassV1 =
  'outside' | 'vertex' | 'edge' | 'interior';

export type SingleHingeRationalScheduleAuxiliaryPolynomialV1 = Readonly<{
  polynomialId: string;
  primitiveIntegerCoefficientsLowToHigh: readonly bigint[];
  polynomialDegree: number | null;
  identicallyZero: boolean;
  coefficientOrder: 'constant-to-highest-degree';
  normalization: 'positive-denominator-lcm-then-integer-content-gcd-or-zero';
}>;

export type SingleHingeRationalScheduleProjectionAreaAtRootV1 = Readonly<{
  projectionDropAxis: ProjectiveAxis3;
  projectedCoordinateAxes: readonly [ProjectiveAxis3, ProjectiveAxis3];
  polynomial: SingleHingeRationalScheduleAuxiliaryPolynomialV1;
  signAtDefiningRoot: -1 | 0 | 1;
  signEvidence: PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1;
}>;

export type SingleHingeRationalScheduleEdgeOrientationAtRootV1 = Readonly<{
  edgeIndex: 0 | 1 | 2;
  edgeVertexIndices: readonly [0 | 1 | 2, 0 | 1 | 2];
  edgeVertexIds: readonly [string, string];
  projectionDropAxis: ProjectiveAxis3;
  projectedCoordinateAxes: readonly [ProjectiveAxis3, ProjectiveAxis3];
  polynomial: SingleHingeRationalScheduleAuxiliaryPolynomialV1;
  signAtDefiningRoot: -1 | 0 | 1;
  signEvidence: PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1;
}>;

export type SingleHingeRationalScheduleVertexFaceRootContainmentRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-vertex-face-root-containment';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-vertex-against-one-triangle-at-one-selected-finite-event-root';
  arithmetic: 'exact-rational-polynomial-common-refinement-gcd-sturm-bigint';
  classificationId: string;
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  definingEventIndex: number;
  definingEventId: string;
  definingRootIndex: number;
  vertexId: string;
  faceTriangleId: string;
  faceVertexIds: readonly [string, string, string];
  topologyRelation: SingleHingeRationalScheduleVertexFaceEventV1['topologyRelation'];
  classification: SingleHingeRationalScheduleVertexFaceContainmentClassV1;
  insideClosedTriangle: boolean;
  insideOpenTriangle: boolean;
  onTriangleBoundary: boolean;
  containingFaceVertexIndex: 0 | 1 | 2 | null;
  containingFaceVertexId: string | null;
  containingFaceEdgeIndex: 0 | 1 | 2 | null;
  containingFaceEdgeVertexIds: readonly [string, string] | null;
  projectionAreaCandidates: readonly SingleHingeRationalScheduleProjectionAreaAtRootV1[];
  selectedProjectionDropAxis: ProjectiveAxis3;
  edgeOrientationEvaluationDropAxis: ProjectiveAxis3;
  selectedProjectionArea: SingleHingeRationalScheduleProjectionAreaAtRootV1;
  edgeOrientations: readonly SingleHingeRationalScheduleEdgeOrientationAtRootV1[];
  zeroEdgeOrientationCount: number;
  maximumObservedAuxiliaryPolynomialDegree: number;
  definingEvent: SingleHingeRationalScheduleVertexFaceEventV1;
  polynomialCensus: SingleHingeRationalScheduleEventPolynomialCensusRecordV1;
  sourceTransitionRevalidated: true;
  vertexFaceEventBoundExactly: true;
  faceAndVertexSchedulePathsBoundExactly: true;
  definingRootSelectedExactly: true;
  definingEventPlaneCoplanarityEstablishedAtRoot: true;
  allThreeProjectionAreaCandidatesIncluded: true;
  degenerateFaceAtEventRootRejectedFailClosed: true;
  canonicalProjectionSelectionCompletedExactly: true;
  allThreeEdgeOrientationPolynomialsIncluded: true;
  allAuxiliaryPolynomialSignsDeterminedExactly: true;
  commonPositiveScheduleDenominatorSquaredRemoved: true;
  featureContainmentAtOneVertexFaceRootIncluded: true;
  allEventRootsClassified: false;
  edgeEdgeContainmentIncluded: false;
  staticTrianglePairIntersectionIncluded: false;
  legalContactPolicyIncluded: false;
  penetrationClassificationIncluded: false;
  continuousCollisionDetectionIncluded: false;
  selfIntersectionDecisionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type SingleHingeRationalScheduleVertexFaceRootContainmentCompactRecordV1 = Readonly<
  Omit<SingleHingeRationalScheduleVertexFaceRootContainmentRecordV1, 'polynomialCensus'>
>;

export type SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1 = Readonly<{
  stage:
    | 'input'
    | 'event-census'
    | 'event-selection'
    | 'auxiliary-polynomial'
    | 'algebraic-sign'
    | 'classification';
  path: string;
  code: string;
  message: string;
}>;

type SingleHingeRationalScheduleVertexFaceRootContainmentFailureV1 = Readonly<{
  ok: false;
  error: readonly SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1[];
}>;

export type SingleHingeRationalScheduleVertexFaceRootContainmentResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleVertexFaceRootContainmentRecordV1;
    }>
  | SingleHingeRationalScheduleVertexFaceRootContainmentFailureV1;

export type SingleHingeRationalScheduleVertexFaceRootContainmentCompactResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleVertexFaceRootContainmentCompactRecordV1;
    }>
  | SingleHingeRationalScheduleVertexFaceRootContainmentFailureV1;

type SingleHingeRationalScheduleVertexFaceRootContainmentCoreResultV1 =
  SingleHingeRationalScheduleVertexFaceRootContainmentCompactResultV1;

type InspectedInput = Readonly<{
  classificationId: string;
  transition: unknown;
  eventIndex: number;
  definingRootIndex: number;
}>;

const ROOT_KEYS = ['classificationId', 'transition', 'eventIndex', 'definingRootIndex'] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ZERO = exactRational(0n);
const PROJECTIONS = [
  { drop: 'x', coordinates: ['y', 'z'] },
  { drop: 'y', coordinates: ['z', 'x'] },
  { drop: 'z', coordinates: ['x', 'y'] },
] as const satisfies readonly Readonly<{
  drop: ProjectiveAxis3;
  coordinates: readonly [ProjectiveAxis3, ProjectiveAxis3];
}>[];
const TRIANGLE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const;

function issue(
  stage: SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1[],
): SingleHingeRationalScheduleVertexFaceRootContainmentFailureV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function inspectInput(supplied: unknown):
  | Readonly<{ ok: true; value: InspectedInput }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1[];
    }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return {
        ok: false,
        error: [issue('input', '$', 'expected-object', 'must be one plain object')],
      };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue('input', '$', 'expected-object', 'must be one plain object')],
      };
    }
    const descriptors = Object.getOwnPropertyDescriptors(supplied);
    const ownKeys = Reflect.ownKeys(supplied);
    if (
      ownKeys.length !== ROOT_KEYS.length ||
      ownKeys.some(
        (key) => typeof key !== 'string' || !(ROOT_KEYS as readonly string[]).includes(key),
      ) ||
      ROOT_KEYS.some((key) => !Object.hasOwn(descriptors, key))
    ) {
      return {
        ok: false,
        error: [
          issue('input', '$', 'expected-closed-object', 'must contain exactly the allowed keys'),
        ],
      };
    }
    for (const key of ROOT_KEYS) {
      const descriptor = descriptors[key];
      if (
        descriptor === undefined ||
        !('value' in descriptor) ||
        !descriptor.enumerable ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined
      ) {
        return {
          ok: false,
          error: [
            issue(
              'input',
              `$.${key}`,
              'data-property-required',
              'must be an enumerable data property',
            ),
          ],
        };
      }
    }
    const classificationId: unknown = descriptors.classificationId?.value;
    if (
      typeof classificationId !== 'string' ||
      classificationId.length === 0 ||
      classificationId.length >
        SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.maxClassificationIdCodeUnits ||
      !STABLE_ID_PATTERN.test(classificationId)
    ) {
      return {
        ok: false,
        error: [
          issue('input', '$.classificationId', 'invalid-classification-id', 'must be a stable ID'),
        ],
      };
    }
    const eventIndex: unknown = descriptors.eventIndex?.value;
    if (
      typeof eventIndex !== 'number' ||
      !Number.isSafeInteger(eventIndex) ||
      eventIndex < 0 ||
      eventIndex > SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.maxEventIndex
    ) {
      return {
        ok: false,
        error: [
          issue(
            'input',
            '$.eventIndex',
            'invalid-event-index',
            'must be a bounded nonnegative safe integer',
          ),
        ],
      };
    }
    const definingRootIndex: unknown = descriptors.definingRootIndex?.value;
    if (
      typeof definingRootIndex !== 'number' ||
      !Number.isSafeInteger(definingRootIndex) ||
      definingRootIndex < 0 ||
      definingRootIndex >
        SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.maxDefiningRootIndex
    ) {
      return {
        ok: false,
        error: [
          issue(
            'input',
            '$.definingRootIndex',
            'invalid-defining-root-index',
            'must be a bounded nonnegative safe integer',
          ),
        ],
      };
    }
    return {
      ok: true,
      value: {
        classificationId,
        transition: descriptors.transition?.value,
        eventIndex,
        definingRootIndex,
      },
    };
  } catch {
    return {
      ok: false,
      error: [issue('input', '$', 'inspection-failed', 'input could not be inspected safely')],
    };
  }
}

function trimPolynomial(polynomial: RationalPolynomial): RationalPolynomial {
  let length = polynomial.length;
  while (length > 1 && equalExactRational(polynomial[length - 1] ?? ZERO, ZERO)) length -= 1;
  return polynomial.slice(0, length);
}

function subtractPolynomial(
  left: RationalPolynomial,
  right: RationalPolynomial,
): RationalPolynomial {
  const length = Math.max(left.length, right.length);
  return trimPolynomial(
    Array.from({ length }, (_, index) =>
      subtractExactRational(left[index] ?? ZERO, right[index] ?? ZERO),
    ),
  );
}

function multiplyPolynomial(
  left: RationalPolynomial,
  right: RationalPolynomial,
): RationalPolynomial {
  const coefficients = Array.from({ length: left.length + right.length - 1 }, () => ZERO);
  for (const [leftIndex, leftValue] of left.entries()) {
    for (const [rightIndex, rightValue] of right.entries()) {
      const index = leftIndex + rightIndex;
      coefficients[index] = addExactRational(
        coefficients[index] ?? ZERO,
        multiplyExactRational(leftValue, rightValue),
      );
    }
  }
  return trimPolynomial(coefficients);
}

function projectedOrientationPolynomial(
  first: PolynomialPoint3,
  second: PolynomialPoint3,
  third: PolynomialPoint3,
  axes: readonly [ProjectiveAxis3, ProjectiveAxis3],
): RationalPolynomial {
  const [u, v] = axes;
  return subtractPolynomial(
    multiplyPolynomial(
      subtractPolynomial(second[u], first[u]),
      subtractPolynomial(third[v], first[v]),
    ),
    multiplyPolynomial(
      subtractPolynomial(second[v], first[v]),
      subtractPolynomial(third[u], first[u]),
    ),
  );
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function leastCommonMultiple(left: bigint, right: bigint): bigint {
  return (left / greatestCommonDivisor(left, right)) * right;
}

function coefficientBitLength(value: bigint): number {
  const magnitude = absolute(value);
  return magnitude === 0n ? 0 : magnitude.toString(2).length;
}

function auxiliaryPolynomial(
  polynomialId: string,
  polynomial: RationalPolynomial,
): SingleHingeRationalScheduleAuxiliaryPolynomialV1 | undefined {
  const trimmed = trimPolynomial(polynomial);
  let coefficients: readonly bigint[];
  if (trimmed.every((coefficient) => coefficient.numerator === 0n)) {
    coefficients = [0n];
  } else {
    const denominatorLcm = trimmed.reduce(
      (current, coefficient) => leastCommonMultiple(current, coefficient.denominator),
      1n,
    );
    const integers = trimmed.map(
      (coefficient) => coefficient.numerator * (denominatorLcm / coefficient.denominator),
    );
    const content = integers.reduce(
      (current, coefficient) => greatestCommonDivisor(current, coefficient),
      0n,
    );
    coefficients = integers.map((coefficient) => coefficient / content);
  }
  const identicallyZero = coefficients.length === 1 && coefficients[0] === 0n;
  const degree = identicallyZero ? null : coefficients.length - 1;
  if (
    (degree !== null &&
      degree >
        SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.maxAuxiliaryPolynomialDegree) ||
    coefficients.some(
      (coefficient) =>
        coefficientBitLength(coefficient) >
        SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.maxAuxiliaryCoefficientBits,
    ) ||
    polynomialId.length >
      PRIMITIVE_INTEGER_POLYNOMIAL_ALGEBRAIC_ROOT_SIGN_LIMITS.maxStableIdCodeUnits
  ) {
    return undefined;
  }
  return {
    polynomialId,
    primitiveIntegerCoefficientsLowToHigh: coefficients,
    polynomialDegree: degree,
    identicallyZero,
    coefficientOrder: 'constant-to-highest-degree',
    normalization: 'positive-denominator-lcm-then-integer-content-gcd-or-zero',
  };
}

function polynomialPoint(path: SingleHingeRationalHalfAngleVertexPathV1): PolynomialPoint3 {
  return { x: path.xNumerator, y: path.yNumerator, z: path.zNumerator };
}

function sameCoefficients(left: readonly bigint[], right: readonly bigint[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function determineSign(
  classificationId: string,
  suffix: string,
  definingEvent: SingleHingeRationalScheduleVertexFaceEventV1,
  definingRootIndex: number,
  query: SingleHingeRationalScheduleAuxiliaryPolynomialV1,
):
  | Readonly<{ ok: true; value: PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleVertexFaceRootContainmentIssueV1[];
    }> {
  const evaluationId = `${classificationId}:${suffix}`;
  const result = determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1({
    evaluationId,
    definingPolynomial: {
      polynomialId: definingEvent.eventId,
      coefficients: definingEvent.primitiveIntegerCoefficientsLowToHigh,
    },
    definingRootIndex,
    queryPolynomial: {
      polynomialId: query.polynomialId,
      coefficients: query.primitiveIntegerCoefficientsLowToHigh,
    },
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.map((entry) =>
        issue('algebraic-sign', `$.${suffix}${entry.path.slice(1)}`, entry.code, entry.message),
      ),
    };
  }
  if (
    result.value.definingPolynomialId !== definingEvent.eventId ||
    result.value.definingRootIndex !== definingRootIndex ||
    result.value.queryPolynomialId !== query.polynomialId ||
    !sameCoefficients(
      result.value.definingIsolation.primitiveIntegerCoefficientsLowToHigh,
      definingEvent.primitiveIntegerCoefficientsLowToHigh,
    ) ||
    !sameCoefficients(
      result.value.queryIsolation.primitiveIntegerCoefficientsLowToHigh,
      query.primitiveIntegerCoefficientsLowToHigh,
    )
  ) {
    return {
      ok: false,
      error: [
        issue(
          'algebraic-sign',
          `$.${suffix}`,
          'algebraic-sign-source-mismatch',
          'algebraic sign evidence is not bound to the selected event and auxiliary polynomial',
        ),
      ],
    };
  }
  return { ok: true, value: result.value };
}

function vertexIndexFromZeroEdges(zeroEdges: readonly number[]): 0 | 1 | 2 | undefined {
  if (zeroEdges.includes(0) && zeroEdges.includes(2)) return 0;
  if (zeroEdges.includes(0) && zeroEdges.includes(1)) return 1;
  if (zeroEdges.includes(1) && zeroEdges.includes(2)) return 2;
  return undefined;
}

/** Composition core for an already owned and revalidated polynomial census. */
function classifySingleHingeRationalScheduleVertexFaceRootContainmentCoreFromOwnedPolynomialCensusV1(
  classificationId: string,
  censusValue: SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  eventIndex: number,
  definingRootIndex: number,
): SingleHingeRationalScheduleVertexFaceRootContainmentCoreResultV1 {
  const selected = censusValue.events[eventIndex];
  if (selected?.eventIndex !== eventIndex) {
    return failure([
      issue(
        'event-selection',
        '$.eventIndex',
        'event-index-out-of-range',
        'the selected event index does not exist in the reconstructed event census',
      ),
    ]);
  }
  if (selected.eventKind !== 'vertex-face-plane') {
    return failure([
      issue(
        'event-selection',
        '$.eventIndex',
        'vertex-face-event-required',
        'the selected event must be a vertex-face plane event',
      ),
    ]);
  }
  try {
    const pathByVertexId = new Map(
      censusValue.schedule.vertexPaths.map((path) => [path.vertexId, path]),
    );
    const vertexPath = pathByVertexId.get(selected.vertexId);
    const facePaths = selected.faceVertexIds.map((vertexId) => pathByVertexId.get(vertexId));
    const [face0, face1, face2] = facePaths;
    if (
      vertexPath === undefined ||
      face0 === undefined ||
      face1 === undefined ||
      face2 === undefined
    ) {
      return failure([
        issue(
          'event-selection',
          '$.eventIndex',
          'event-vertex-path-missing',
          'the selected vertex-face event does not resolve to all bound schedule paths',
        ),
      ]);
    }
    const vertexPoint = polynomialPoint(vertexPath);
    const facePoints = [
      polynomialPoint(face0),
      polynomialPoint(face1),
      polynomialPoint(face2),
    ] as const;
    const projectionAreaCandidates: SingleHingeRationalScheduleProjectionAreaAtRootV1[] = [];
    for (const projection of PROJECTIONS) {
      const polynomial = auxiliaryPolynomial(
        `vfaux:${String(selected.eventIndex)}:area:${projection.drop}`,
        projectedOrientationPolynomial(
          facePoints[0],
          facePoints[1],
          facePoints[2],
          projection.coordinates,
        ),
      );
      if (polynomial === undefined) {
        return failure([
          issue(
            'auxiliary-polynomial',
            '$.projectionAreaCandidates',
            'auxiliary-polynomial-limit-exceeded',
            'one projection-area polynomial exceeds its defensive degree, ID, or coefficient limit',
          ),
        ]);
      }
      const evidence = determineSign(
        classificationId,
        `area:${projection.drop}`,
        selected,
        definingRootIndex,
        polynomial,
      );
      if (!evidence.ok) return failure(evidence.error);
      projectionAreaCandidates.push({
        projectionDropAxis: projection.drop,
        projectedCoordinateAxes: projection.coordinates,
        polynomial,
        signAtDefiningRoot: evidence.value.queryPolynomialSignAtDefiningRoot,
        signEvidence: evidence.value,
      });
    }
    const selectedProjection = projectionAreaCandidates.find(
      (candidate) => candidate.signAtDefiningRoot !== 0,
    );
    if (selectedProjection === undefined) {
      return failure([
        issue(
          'classification',
          '$.projectionAreaCandidates',
          'degenerate-face-at-event-root',
          'all three exact projected face areas vanish at the selected event root, so triangle feature containment is undefined',
        ),
      ]);
    }
    const edgeProjection = selectedProjection;
    const edgeOrientations: SingleHingeRationalScheduleEdgeOrientationAtRootV1[] = [];
    for (const [edgeIndex, edge] of TRIANGLE_EDGES.entries()) {
      const firstIndex = edge[0];
      const secondIndex = edge[1];
      const polynomial = auxiliaryPolynomial(
        `vfaux:${String(selected.eventIndex)}:edge:${edgeProjection.projectionDropAxis}:${String(edgeIndex)}`,
        projectedOrientationPolynomial(
          facePoints[firstIndex],
          facePoints[secondIndex],
          vertexPoint,
          edgeProjection.projectedCoordinateAxes,
        ),
      );
      if (polynomial === undefined) {
        return failure([
          issue(
            'auxiliary-polynomial',
            '$.edgeOrientations',
            'auxiliary-polynomial-limit-exceeded',
            'one edge-orientation polynomial exceeds its defensive degree, ID, or coefficient limit',
          ),
        ]);
      }
      const evidence = determineSign(
        classificationId,
        `edge:${String(edgeIndex)}`,
        selected,
        definingRootIndex,
        polynomial,
      );
      if (!evidence.ok) return failure(evidence.error);
      edgeOrientations.push({
        edgeIndex: edgeIndex as 0 | 1 | 2,
        edgeVertexIndices: edge,
        edgeVertexIds: [selected.faceVertexIds[firstIndex], selected.faceVertexIds[secondIndex]],
        projectionDropAxis: edgeProjection.projectionDropAxis,
        projectedCoordinateAxes: edgeProjection.projectedCoordinateAxes,
        polynomial,
        signAtDefiningRoot: evidence.value.queryPolynomialSignAtDefiningRoot,
        signEvidence: evidence.value,
      });
    }

    const areaSign = selectedProjection.signAtDefiningRoot;
    const zeroEdges = edgeOrientations
      .filter((entry) => entry.signAtDefiningRoot === 0)
      .map((entry) => entry.edgeIndex);
    const incompatibleEdge = edgeOrientations.some(
      (entry) => entry.signAtDefiningRoot !== 0 && entry.signAtDefiningRoot !== areaSign,
    );
    let classification: SingleHingeRationalScheduleVertexFaceContainmentClassV1;
    if (incompatibleEdge) classification = 'outside';
    else if (zeroEdges.length === 0) classification = 'interior';
    else if (zeroEdges.length === 1) classification = 'edge';
    else if (zeroEdges.length === 2) classification = 'vertex';
    else {
      return failure([
        issue(
          'classification',
          '$.edgeOrientations',
          'edge-sign-invariant',
          'three zero projected edge orientations contradict a nonzero projected triangle area',
        ),
      ]);
    }
    const containingFaceVertexIndex =
      classification === 'vertex' ? vertexIndexFromZeroEdges(zeroEdges) : undefined;
    if (classification === 'vertex' && containingFaceVertexIndex === undefined) {
      return failure([
        issue(
          'classification',
          '$.edgeOrientations',
          'vertex-feature-invariant',
          'two zero triangle edges do not identify one face vertex',
        ),
      ]);
    }
    const containingFaceEdgeIndex = classification === 'edge' ? zeroEdges[0] : undefined;
    const containingFaceEdge =
      containingFaceEdgeIndex === undefined ? undefined : TRIANGLE_EDGES[containingFaceEdgeIndex];
    const auxiliaryDegrees = [
      ...projectionAreaCandidates.map((entry) => entry.polynomial.polynomialDegree ?? 0),
      ...edgeOrientations.map((entry) => entry.polynomial.polynomialDegree ?? 0),
    ];
    const insideClosedTriangle =
      classification === 'vertex' || classification === 'edge' || classification === 'interior';
    return {
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-vertex-face-root-containment' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'one-vertex-against-one-triangle-at-one-selected-finite-event-root' as const,
        arithmetic: 'exact-rational-polynomial-common-refinement-gcd-sturm-bigint' as const,
        classificationId,
        transitionRevisionId: censusValue.transitionRevisionId,
        stepId: censusValue.stepId,
        meshRevisionId: censusValue.meshRevisionId,
        triangulationRevisionId: censusValue.triangulationRevisionId,
        definingEventIndex: selected.eventIndex,
        definingEventId: selected.eventId,
        definingRootIndex,
        vertexId: selected.vertexId,
        faceTriangleId: selected.faceTriangleId,
        faceVertexIds: selected.faceVertexIds,
        topologyRelation: selected.topologyRelation,
        classification,
        insideClosedTriangle,
        insideOpenTriangle: classification === 'interior',
        onTriangleBoundary: classification === 'vertex' || classification === 'edge',
        containingFaceVertexIndex: containingFaceVertexIndex ?? null,
        containingFaceVertexId:
          containingFaceVertexIndex === undefined
            ? null
            : selected.faceVertexIds[containingFaceVertexIndex],
        containingFaceEdgeIndex: containingFaceEdgeIndex ?? null,
        containingFaceEdgeVertexIds:
          containingFaceEdge === undefined
            ? null
            : [
                selected.faceVertexIds[containingFaceEdge[0]],
                selected.faceVertexIds[containingFaceEdge[1]],
              ],
        projectionAreaCandidates,
        selectedProjectionDropAxis: selectedProjection.projectionDropAxis,
        edgeOrientationEvaluationDropAxis: edgeProjection.projectionDropAxis,
        selectedProjectionArea: selectedProjection,
        edgeOrientations,
        zeroEdgeOrientationCount: zeroEdges.length,
        maximumObservedAuxiliaryPolynomialDegree: Math.max(...auxiliaryDegrees),
        definingEvent: selected,
        sourceTransitionRevalidated: true as const,
        vertexFaceEventBoundExactly: true as const,
        faceAndVertexSchedulePathsBoundExactly: true as const,
        definingRootSelectedExactly: true as const,
        definingEventPlaneCoplanarityEstablishedAtRoot: true as const,
        allThreeProjectionAreaCandidatesIncluded: true as const,
        degenerateFaceAtEventRootRejectedFailClosed: true as const,
        canonicalProjectionSelectionCompletedExactly: true as const,
        allThreeEdgeOrientationPolynomialsIncluded: true as const,
        allAuxiliaryPolynomialSignsDeterminedExactly: true as const,
        commonPositiveScheduleDenominatorSquaredRemoved: true as const,
        featureContainmentAtOneVertexFaceRootIncluded: true as const,
        allEventRootsClassified: false as const,
        edgeEdgeContainmentIncluded: false as const,
        staticTrianglePairIntersectionIncluded: false as const,
        legalContactPolicyIncluded: false as const,
        penetrationClassificationIncluded: false as const,
        continuousCollisionDetectionIncluded: false as const,
        selfIntersectionDecisionIncluded: false as const,
        collisionFreeClaim: false as const,
        isSupportProfile: false as const,
        supportClaim: false as const,
        verifiedClaim: false as const,
        scientificClaim: false as const,
        globalM0fGo: false as const,
      },
    };
  } catch {
    return failure([
      issue(
        'classification',
        '$',
        'vertex-face-root-containment-invariant-failed',
        'exact vertex-face root containment classification failed closed unexpectedly',
      ),
    ]);
  }
}

/** @internal Composition API for an already owned and revalidated polynomial census. */
export function classifySingleHingeRationalScheduleVertexFaceRootContainmentFromOwnedPolynomialCensusV1(
  classificationId: string,
  censusValue: SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  eventIndex: number,
  definingRootIndex: number,
): SingleHingeRationalScheduleVertexFaceRootContainmentResultV1 {
  const result =
    classifySingleHingeRationalScheduleVertexFaceRootContainmentCoreFromOwnedPolynomialCensusV1(
      classificationId,
      censusValue,
      eventIndex,
      definingRootIndex,
    );
  if (!result.ok) return result;
  try {
    return deepFreezeOwned({
      ok: true as const,
      value: {
        ...result.value,
        polynomialCensus: censusValue,
      },
    });
  } catch {
    return failure([
      issue(
        'classification',
        '$',
        'vertex-face-root-containment-invariant-failed',
        'exact vertex-face root containment classification failed closed unexpectedly',
      ),
    ]);
  }
}

/**
 * Compact composition API for an already owned and revalidated polynomial
 * census. The successful result omits the source census and freezes only the
 * emitted classification evidence.
 */
export function classifySingleHingeRationalScheduleVertexFaceRootContainmentCompactFromOwnedPolynomialCensusV1(
  classificationId: string,
  censusValue: SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  eventIndex: number,
  definingRootIndex: number,
): SingleHingeRationalScheduleVertexFaceRootContainmentCompactResultV1 {
  const result =
    classifySingleHingeRationalScheduleVertexFaceRootContainmentCoreFromOwnedPolynomialCensusV1(
      classificationId,
      censusValue,
      eventIndex,
      definingRootIndex,
    );
  if (!result.ok) return result;
  try {
    return deepFreezeOwned(result);
  } catch {
    return failure([
      issue(
        'classification',
        '$',
        'vertex-face-root-containment-invariant-failed',
        'exact vertex-face root containment classification failed closed unexpectedly',
      ),
    ]);
  }
}

/**
 * Classifies one vertex relative to its event face at one selected finite
 * algebraic coplanarity root. The shared positive schedule denominator is
 * removed only after every projected orientation numerator is constructed.
 */
export function classifySingleHingeRationalScheduleVertexFaceRootContainmentV1(
  supplied: unknown,
): SingleHingeRationalScheduleVertexFaceRootContainmentResultV1 {
  const input = inspectInput(supplied);
  if (!input.ok) return failure(input.error);
  const census = computeSingleHingeRationalScheduleEventPolynomialCensusV1(input.value.transition);
  if (!census.ok) {
    return failure(
      census.error.map((entry) => issue('event-census', entry.path, entry.code, entry.message)),
    );
  }
  return classifySingleHingeRationalScheduleVertexFaceRootContainmentFromOwnedPolynomialCensusV1(
    input.value.classificationId,
    census.value,
    input.value.eventIndex,
    input.value.definingRootIndex,
  );
}
