import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  equalExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1,
  type PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1,
} from './primitive-integer-polynomial-algebraic-root-sign.js';
import { PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS } from './primitive-integer-polynomial-unit-interval-root-isolation.js';
import type {
  ExactRationalQuadraticPolynomialV1,
  SingleHingeRationalHalfAngleVertexPathV1,
} from './single-hinge-rational-half-angle-schedule.js';
import {
  SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS,
  type SingleHingeRationalScheduleEdgeEdgeEventV1,
} from './single-hinge-rational-schedule-event-polynomial-census.js';
import {
  computeSingleHingeRationalScheduleEventRootCensusV1,
  type SingleHingeRationalScheduleEventRootCensusRecordV1,
} from './single-hinge-rational-schedule-event-root-census.js';

type RationalPolynomial = readonly ExactRational[];
type PolynomialPoint3 = readonly [
  x: ExactRationalQuadraticPolynomialV1,
  y: ExactRationalQuadraticPolynomialV1,
  z: ExactRationalQuadraticPolynomialV1,
];
type ProjectedPolynomialPoint2 = readonly [u: RationalPolynomial, v: RationalPolynomial];

export const SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS =
  deepFreezeOwned({
    nonparallelAuxiliaryPolynomialCount: 7,
    parallelNoncollinearAuxiliaryPolynomialCount: 12,
    collinearAuxiliaryPolynomialCount: 14,
    maxAuxiliaryPolynomialCount: 14,
    maxAuxiliaryPolynomialDegree: 4,
    maxCanonicalCoefficientBits:
      SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxCanonicalCoefficientBits,
    maxStableIdCodeUnits:
      PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxStableIdCodeUnits,
  });

export type SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1 = 'x' | 'y' | 'z';

export type SingleHingeRationalScheduleEdgeEdgeContainmentClassV1 =
  'disjoint' | 'endpoint-contact' | 'proper-interior-crossing' | 'collinear-overlap';

export type SingleHingeRationalScheduleEdgeEdgeDirectionRelationV1 =
  'nonparallel' | 'parallel-noncollinear' | 'collinear';

export type SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 = Readonly<{
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
  z: -1 | 0 | 1;
}>;

export type SingleHingeRationalScheduleEdgeEdgeCollinearEndpointOrderV1 = Readonly<{
  firstLowerVertexId: string;
  firstUpperVertexId: string;
  secondLowerVertexId: string;
  secondUpperVertexId: string;
}>;

export type SingleHingeRationalScheduleEdgeEdgeAuxiliaryRoleV1 =
  | 'direction-cross-x'
  | 'direction-cross-y'
  | 'direction-cross-z'
  | 'first-direction-x'
  | 'first-direction-y'
  | 'first-direction-z'
  | 'second-direction-x'
  | 'second-direction-y'
  | 'second-direction-z'
  | 'carrier-offset-cross-x'
  | 'carrier-offset-cross-y'
  | 'carrier-offset-cross-z'
  | 'interval-second-lower-minus-first-upper'
  | 'interval-first-lower-minus-second-upper'
  | 'first-line-to-second-start'
  | 'first-line-to-second-end'
  | 'second-line-to-first-start'
  | 'second-line-to-first-end';

export type SingleHingeRationalScheduleEdgeEdgeAuxiliarySignV1 = Readonly<{
  role: SingleHingeRationalScheduleEdgeEdgeAuxiliaryRoleV1;
  polynomialId: string;
  primitiveIntegerCoefficientsLowToHigh: readonly bigint[];
  polynomialDegree: number | null;
  signAtSelectedRoot: -1 | 0 | 1;
  signEvidence: PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1;
}>;

export type SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-edge-edge-algebraic-containment';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-nondegenerate-edge-pair-at-one-selected-coplanarity-event-root';
  arithmetic: 'exact-rational-polynomial-common-refinement-gcd-sturm-bigint';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  eventIndex: number;
  eventId: string;
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  topologyRelation: SingleHingeRationalScheduleEdgeEdgeEventV1['topologyRelation'];
  firstEdgeIndex: 0 | 1 | 2;
  secondEdgeIndex: 0 | 1 | 2;
  firstEdgeVertexIds: readonly [string, string];
  secondEdgeVertexIds: readonly [string, string];
  definingRootIndex: number;
  definingRootLocation: 'start' | 'interior' | 'end';
  definingRootMultiplicity: number;
  directionRelation: SingleHingeRationalScheduleEdgeEdgeDirectionRelationV1;
  projectionAxisDropped: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1 | null;
  directionCrossSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1;
  firstEdgeDirectionSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 | null;
  secondEdgeDirectionSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 | null;
  carrierOffsetCrossSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 | null;
  collinearProjectionAxis: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1 | null;
  collinearEndpointOrder: SingleHingeRationalScheduleEdgeEdgeCollinearEndpointOrderV1 | null;
  collinearIntervalComparisonSigns:
    | readonly [secondLowerMinusFirstUpper: -1 | 0 | 1, firstLowerMinusSecondUpper: -1 | 0 | 1]
    | null;
  firstLineSecondEndpointSigns: readonly [start: -1 | 0 | 1, end: -1 | 0 | 1] | null;
  secondLineFirstEndpointSigns: readonly [start: -1 | 0 | 1, end: -1 | 0 | 1] | null;
  firstSegmentStraddlesSecondLine: boolean | null;
  secondSegmentStraddlesFirstLine: boolean | null;
  collinearOverlapHasPositiveLength: boolean;
  containmentClass: SingleHingeRationalScheduleEdgeEdgeContainmentClassV1;
  auxiliarySigns: readonly SingleHingeRationalScheduleEdgeEdgeAuxiliarySignV1[];
  event: SingleHingeRationalScheduleEdgeEdgeEventV1;
  rootCensus: SingleHingeRationalScheduleEventRootCensusRecordV1;
  selectedEventIdentityBoundExactly: true;
  selectedDefiningRootBoundExactly: true;
  coplanarityAtSelectedRootEstablishedExactly: true;
  commonPositiveScheduleDenominatorRemoved: true;
  nonparallelProjectionEstablishedExactly: boolean;
  projectedSegmentContainmentClassifiedExactly: boolean;
  parallelDirectionsClassifiedExactly: boolean;
  carrierLineRelationClassifiedExactly: boolean;
  collinearIntervalComparisonIncluded: boolean;
  threeDimensionalContainmentFollowsFromCoplanarityAndProjection: boolean;
  threeDimensionalContainmentClassifiedExactly: true;
  featureContainmentAtSelectedRootIncluded: true;
  parallelOrCollinearCaseSupported: true;
  collinearPositiveLengthOverlapIncluded: true;
  degenerateEdgeCaseSupported: false;
  persistentCoplanarityEventSupported: false;
  floatingPointUsed: false;
  collisionClassificationIncluded: false;
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

export type SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1 = Readonly<{
  stage:
    | 'input'
    | 'root-census'
    | 'event-selection'
    | 'auxiliary-polynomial'
    | 'sign-evaluation'
    | 'classification';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1[];
    }>;

export type SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactRecordV1 = Omit<
  SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentRecordV1,
  'rootCensus'
>;

export type SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1[];
    }>;

type InspectedInput = Readonly<{
  transition: unknown;
  eventId: string;
  definingRootIndex: number;
}>;

const ROOT_KEYS = ['transition', 'eventId', 'definingRootIndex'] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ZERO = exactRational(0n);
const AXES = ['x', 'y', 'z'] as const;
const PROJECTION_COORDINATE_INDICES = {
  x: [1, 2],
  y: [2, 0],
  z: [0, 1],
} as const;
const POINT_COORDINATE_INDICES = { x: 0, y: 1, z: 2 } as const;

function issue(
  stage: SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1[],
): SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function inspectInput(supplied: unknown):
  | Readonly<{ ok: true; value: InspectedInput }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentIssueV1[];
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
      ownKeys.some(
        (key) => typeof key !== 'string' || !ROOT_KEYS.some((allowed) => allowed === key),
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
    const eventId: unknown = descriptors.eventId?.value;
    if (
      typeof eventId !== 'string' ||
      eventId.length >
        SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.maxStableIdCodeUnits ||
      !STABLE_ID_PATTERN.test(eventId)
    ) {
      return {
        ok: false,
        error: [issue('input', '$.eventId', 'invalid-event-id', 'must be one bounded stable ID')],
      };
    }
    const definingRootIndex: unknown = descriptors.definingRootIndex?.value;
    if (
      typeof definingRootIndex !== 'number' ||
      !Number.isSafeInteger(definingRootIndex) ||
      definingRootIndex < 0 ||
      definingRootIndex > PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxDegree
    ) {
      return {
        ok: false,
        error: [
          issue(
            'input',
            '$.definingRootIndex',
            'invalid-defining-root-index',
            'must be one bounded nonnegative safe integer',
          ),
        ],
      };
    }
    return {
      ok: true,
      value: {
        transition: descriptors.transition?.value,
        eventId,
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

function orient2d(
  first: ProjectedPolynomialPoint2,
  second: ProjectedPolynomialPoint2,
  third: ProjectedPolynomialPoint2,
): RationalPolynomial {
  return subtractPolynomial(
    multiplyPolynomial(
      subtractPolynomial(second[0], first[0]),
      subtractPolynomial(third[1], first[1]),
    ),
    multiplyPolynomial(
      subtractPolynomial(second[1], first[1]),
      subtractPolynomial(third[0], first[0]),
    ),
  );
}

function directionCross2d(
  firstStart: ProjectedPolynomialPoint2,
  firstEnd: ProjectedPolynomialPoint2,
  secondStart: ProjectedPolynomialPoint2,
  secondEnd: ProjectedPolynomialPoint2,
): RationalPolynomial {
  return subtractPolynomial(
    multiplyPolynomial(
      subtractPolynomial(firstEnd[0], firstStart[0]),
      subtractPolynomial(secondEnd[1], secondStart[1]),
    ),
    multiplyPolynomial(
      subtractPolynomial(firstEnd[1], firstStart[1]),
      subtractPolynomial(secondEnd[0], secondStart[0]),
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

function primitiveIntegerPolynomial(polynomial: RationalPolynomial): readonly bigint[] {
  const trimmed = trimPolynomial(polynomial);
  if (trimmed.every((coefficient) => coefficient.numerator === 0n)) return [0n];
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
  return integers.map((coefficient) => coefficient / content);
}

function coefficientBitLength(value: bigint): number {
  return absolute(value).toString(2).length;
}

function polynomialPoint(path: SingleHingeRationalHalfAngleVertexPathV1): PolynomialPoint3 {
  return [path.xNumerator, path.yNumerator, path.zNumerator];
}

function projectPoint(
  point: PolynomialPoint3,
  axis: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1,
): ProjectedPolynomialPoint2 {
  const indices = PROJECTION_COORDINATE_INDICES[axis];
  return [point[indices[0]], point[indices[1]]];
}

function coordinatePolynomial(
  point: PolynomialPoint3,
  axis: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1,
): RationalPolynomial {
  return point[POINT_COORDINATE_INDICES[axis]];
}

function directionComponentPolynomial(
  start: PolynomialPoint3,
  end: PolynomialPoint3,
  axis: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1,
): RationalPolynomial {
  return subtractPolynomial(coordinatePolynomial(end, axis), coordinatePolynomial(start, axis));
}

function straddles(first: -1 | 0 | 1, second: -1 | 0 | 1): boolean {
  return first === 0 || second === 0 || first !== second;
}

function classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusCoreV1(
  rootCensusValue: SingleHingeRationalScheduleEventRootCensusRecordV1,
  eventIndex: number,
  definingRootIndex: number,
  freezeSuccess: boolean,
): SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentResultV1 {
  try {
    const selected = rootCensusValue.events[eventIndex];
    if (selected?.eventIndex !== eventIndex) {
      return failure([
        issue(
          'event-selection',
          '$.eventIndex',
          'event-index-out-of-range',
          'event index does not occur in the exact schedule event ledger',
        ),
      ]);
    }
    if (selected.polynomial.eventKind !== 'edge-edge-coplanarity') {
      return failure([
        issue(
          'event-selection',
          '$.eventId',
          'edge-edge-event-required',
          'selected event must be an edge-edge coplanarity event',
        ),
      ]);
    }
    if (selected.persistentOnEntireUnitInterval) {
      return failure([
        issue(
          'event-selection',
          '$.eventId',
          'persistent-coplanarity-event-unsupported',
          'an identically zero coplanarity polynomial has no selected discrete root',
        ),
      ]);
    }
    const selectedRoot = selected.isolation.roots[definingRootIndex];
    if (selectedRoot?.rootIndex !== definingRootIndex) {
      return failure([
        issue(
          'event-selection',
          '$.definingRootIndex',
          'defining-root-index-out-of-range',
          'selected edge-edge event has no root with this index',
        ),
      ]);
    }
    const event = selected.polynomial;
    const schedule = rootCensusValue.polynomialCensus.schedule;
    const pathById = new Map(schedule.vertexPaths.map((path) => [path.vertexId, path]));
    const endpointPaths = [
      pathById.get(event.firstEdgeVertexIds[0]),
      pathById.get(event.firstEdgeVertexIds[1]),
      pathById.get(event.secondEdgeVertexIds[0]),
      pathById.get(event.secondEdgeVertexIds[1]),
    ] as const;
    if (endpointPaths.some((path) => path === undefined)) {
      throw new TypeError('selected event edge endpoint has no schedule path');
    }
    const [firstStartPath, firstEndPath, secondStartPath, secondEndPath] = endpointPaths;
    if (
      firstStartPath === undefined ||
      firstEndPath === undefined ||
      secondStartPath === undefined ||
      secondEndPath === undefined
    ) {
      throw new TypeError('selected event edge endpoint path narrowing failed');
    }
    const firstStart = polynomialPoint(firstStartPath);
    const firstEnd = polynomialPoint(firstEndPath);
    const secondStart = polynomialPoint(secondStartPath);
    const secondEnd = polynomialPoint(secondEndPath);

    const auxiliarySigns: SingleHingeRationalScheduleEdgeEdgeAuxiliarySignV1[] = [];
    const evaluateAuxiliary = (
      role: SingleHingeRationalScheduleEdgeEdgeAuxiliaryRoleV1,
      polynomial: RationalPolynomial,
    ): SingleHingeRationalScheduleEdgeEdgeAuxiliarySignV1 | undefined => {
      const coefficients = primitiveIntegerPolynomial(polynomial);
      if (
        coefficients.length - 1 >
          SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.maxAuxiliaryPolynomialDegree ||
        coefficients.some(
          (coefficient) =>
            coefficientBitLength(coefficient) >
            SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.maxCanonicalCoefficientBits,
        )
      ) {
        return undefined;
      }
      const polynomialId = `eeaux:${String(event.eventIndex)}:${role}`;
      const sign = determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1({
        evaluationId: `eeeval:${String(event.eventIndex)}:${String(definingRootIndex)}:${role}`,
        definingPolynomial: {
          polynomialId: event.eventId,
          coefficients: event.primitiveIntegerCoefficientsLowToHigh,
        },
        definingRootIndex,
        queryPolynomial: { polynomialId, coefficients },
      });
      if (!sign.ok) {
        throw new AuxiliarySignFailure(role, sign.error);
      }
      if (
        sign.value.definingRootIndex !== definingRootIndex ||
        sign.value.definingRootLocation !== selectedRoot.location ||
        sign.value.definingRootMultiplicity !== selectedRoot.multiplicity ||
        sign.value.queryPolynomialId !== polynomialId ||
        sign.value.queryIsolation.primitiveIntegerCoefficientsLowToHigh.length !==
          coefficients.length ||
        sign.value.queryIsolation.primitiveIntegerCoefficientsLowToHigh.some(
          (coefficient, index) => coefficient !== coefficients[index],
        )
      ) {
        throw new TypeError('auxiliary sign evidence is not bound to the selected event root');
      }
      const record = {
        role,
        polynomialId,
        primitiveIntegerCoefficientsLowToHigh: coefficients,
        polynomialDegree:
          coefficients.length === 1 && coefficients[0] === 0n ? null : coefficients.length - 1,
        signAtSelectedRoot: sign.value.queryPolynomialSignAtDefiningRoot,
        signEvidence: sign.value,
      };
      auxiliarySigns.push(record);
      return record;
    };

    const directionSigns = { x: 0, y: 0, z: 0 } as {
      x: -1 | 0 | 1;
      y: -1 | 0 | 1;
      z: -1 | 0 | 1;
    };
    for (const axis of AXES) {
      const firstStartProjected = projectPoint(firstStart, axis);
      const firstEndProjected = projectPoint(firstEnd, axis);
      const secondStartProjected = projectPoint(secondStart, axis);
      const secondEndProjected = projectPoint(secondEnd, axis);
      const auxiliary = evaluateAuxiliary(
        `direction-cross-${axis}`,
        directionCross2d(
          firstStartProjected,
          firstEndProjected,
          secondStartProjected,
          secondEndProjected,
        ),
      );
      if (auxiliary === undefined) {
        return failure([
          issue(
            'auxiliary-polynomial',
            `$.eventId.${axis}`,
            'auxiliary-polynomial-limit-exceeded',
            'one direction-cross polynomial exceeds its defensive degree or bit limit',
          ),
        ]);
      }
      directionSigns[axis] = auxiliary.signAtSelectedRoot;
    }
    let directionRelation: SingleHingeRationalScheduleEdgeEdgeDirectionRelationV1;
    let projectionAxisDropped: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1 | null = null;
    let firstEdgeDirectionSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 | null =
      null;
    let secondEdgeDirectionSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 | null =
      null;
    let carrierOffsetCrossSignsAtSelectedRoot: SingleHingeRationalScheduleEdgeEdgeAxisSignsV1 | null =
      null;
    let collinearProjectionAxis: SingleHingeRationalScheduleEdgeEdgeProjectionAxisV1 | null = null;
    let collinearEndpointOrder: SingleHingeRationalScheduleEdgeEdgeCollinearEndpointOrderV1 | null =
      null;
    let collinearIntervalComparisonSigns: readonly [-1 | 0 | 1, -1 | 0 | 1] | null = null;
    let firstLineSecondEndpointSigns: readonly [-1 | 0 | 1, -1 | 0 | 1] | null = null;
    let secondLineFirstEndpointSigns: readonly [-1 | 0 | 1, -1 | 0 | 1] | null = null;
    let firstSegmentStraddlesSecondLine: boolean | null = null;
    let secondSegmentStraddlesFirstLine: boolean | null = null;
    let containmentClass: SingleHingeRationalScheduleEdgeEdgeContainmentClassV1;

    const selectedNonparallelAxis = AXES.find((axis) => directionSigns[axis] !== 0);
    if (selectedNonparallelAxis !== undefined) {
      directionRelation = 'nonparallel';
      projectionAxisDropped = selectedNonparallelAxis;
      const firstStartProjected = projectPoint(firstStart, projectionAxisDropped);
      const firstEndProjected = projectPoint(firstEnd, projectionAxisDropped);
      const secondStartProjected = projectPoint(secondStart, projectionAxisDropped);
      const secondEndProjected = projectPoint(secondEnd, projectionAxisDropped);
      const orientationInputs = [
        [
          'first-line-to-second-start',
          orient2d(firstStartProjected, firstEndProjected, secondStartProjected),
        ],
        [
          'first-line-to-second-end',
          orient2d(firstStartProjected, firstEndProjected, secondEndProjected),
        ],
        [
          'second-line-to-first-start',
          orient2d(secondStartProjected, secondEndProjected, firstStartProjected),
        ],
        [
          'second-line-to-first-end',
          orient2d(secondStartProjected, secondEndProjected, firstEndProjected),
        ],
      ] as const;
      const orientationSigns: (-1 | 0 | 1)[] = [];
      for (const [role, polynomial] of orientationInputs) {
        const auxiliary = evaluateAuxiliary(role, polynomial);
        if (auxiliary === undefined) {
          return failure([
            issue(
              'auxiliary-polynomial',
              `$.eventId.${role}`,
              'auxiliary-polynomial-limit-exceeded',
              'one endpoint-orientation polynomial exceeds its defensive degree or bit limit',
            ),
          ]);
        }
        orientationSigns.push(auxiliary.signAtSelectedRoot);
      }
      if (
        auxiliarySigns.length !==
          SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.nonparallelAuxiliaryPolynomialCount ||
        orientationSigns.length !== 4
      ) {
        throw new TypeError('complete nonparallel auxiliary sign ledger is required');
      }
      const [firstToSecondStart, firstToSecondEnd, secondToFirstStart, secondToFirstEnd] =
        orientationSigns as [-1 | 0 | 1, -1 | 0 | 1, -1 | 0 | 1, -1 | 0 | 1];
      firstLineSecondEndpointSigns = [firstToSecondStart, firstToSecondEnd];
      secondLineFirstEndpointSigns = [secondToFirstStart, secondToFirstEnd];
      secondSegmentStraddlesFirstLine = straddles(firstToSecondStart, firstToSecondEnd);
      firstSegmentStraddlesSecondLine = straddles(secondToFirstStart, secondToFirstEnd);
      const intersects = secondSegmentStraddlesFirstLine && firstSegmentStraddlesSecondLine;
      containmentClass = !intersects
        ? 'disjoint'
        : orientationSigns.some((sign) => sign === 0)
          ? 'endpoint-contact'
          : 'proper-interior-crossing';
    } else {
      const firstDirectionSigns = { x: 0, y: 0, z: 0 } as {
        x: -1 | 0 | 1;
        y: -1 | 0 | 1;
        z: -1 | 0 | 1;
      };
      const secondDirectionSigns = { x: 0, y: 0, z: 0 } as {
        x: -1 | 0 | 1;
        y: -1 | 0 | 1;
        z: -1 | 0 | 1;
      };
      for (const axis of AXES) {
        const firstAuxiliary = evaluateAuxiliary(
          `first-direction-${axis}`,
          directionComponentPolynomial(firstStart, firstEnd, axis),
        );
        const secondAuxiliary = evaluateAuxiliary(
          `second-direction-${axis}`,
          directionComponentPolynomial(secondStart, secondEnd, axis),
        );
        if (firstAuxiliary === undefined || secondAuxiliary === undefined) {
          return failure([
            issue(
              'auxiliary-polynomial',
              `$.eventId.${axis}`,
              'auxiliary-polynomial-limit-exceeded',
              'one edge-direction polynomial exceeds its defensive degree or bit limit',
            ),
          ]);
        }
        firstDirectionSigns[axis] = firstAuxiliary.signAtSelectedRoot;
        secondDirectionSigns[axis] = secondAuxiliary.signAtSelectedRoot;
      }
      if (
        AXES.every((axis) => firstDirectionSigns[axis] === 0) ||
        AXES.every((axis) => secondDirectionSigns[axis] === 0)
      ) {
        return failure([
          issue(
            'classification',
            '$.eventId',
            'degenerate-edge-at-event-root',
            'one exact edge direction vanishes at the selected root, so segment containment is undefined',
          ),
        ]);
      }
      firstEdgeDirectionSignsAtSelectedRoot = firstDirectionSigns;
      secondEdgeDirectionSignsAtSelectedRoot = secondDirectionSigns;

      const carrierSigns = { x: 0, y: 0, z: 0 } as {
        x: -1 | 0 | 1;
        y: -1 | 0 | 1;
        z: -1 | 0 | 1;
      };
      for (const axis of AXES) {
        const auxiliary = evaluateAuxiliary(
          `carrier-offset-cross-${axis}`,
          directionCross2d(
            projectPoint(firstStart, axis),
            projectPoint(firstEnd, axis),
            projectPoint(firstStart, axis),
            projectPoint(secondStart, axis),
          ),
        );
        if (auxiliary === undefined) {
          return failure([
            issue(
              'auxiliary-polynomial',
              `$.eventId.carrier-offset-cross-${axis}`,
              'auxiliary-polynomial-limit-exceeded',
              'one carrier-offset cross polynomial exceeds its defensive degree or bit limit',
            ),
          ]);
        }
        carrierSigns[axis] = auxiliary.signAtSelectedRoot;
      }
      carrierOffsetCrossSignsAtSelectedRoot = carrierSigns;
      if (AXES.some((axis) => carrierSigns[axis] !== 0)) {
        directionRelation = 'parallel-noncollinear';
        containmentClass = 'disjoint';
        if (
          auxiliarySigns.length !==
          SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.parallelNoncollinearAuxiliaryPolynomialCount
        ) {
          throw new TypeError('complete parallel noncollinear auxiliary sign ledger is required');
        }
      } else {
        directionRelation = 'collinear';
        const selectedCollinearAxis = AXES.find((axis) => firstDirectionSigns[axis] !== 0);
        if (
          selectedCollinearAxis === undefined ||
          secondDirectionSigns[selectedCollinearAxis] === 0
        ) {
          throw new TypeError(
            'parallel nondegenerate directions require one shared projection axis',
          );
        }
        collinearProjectionAxis = selectedCollinearAxis;
        const firstStartEndpoint = { id: event.firstEdgeVertexIds[0], point: firstStart };
        const firstEndEndpoint = { id: event.firstEdgeVertexIds[1], point: firstEnd };
        const secondStartEndpoint = { id: event.secondEdgeVertexIds[0], point: secondStart };
        const secondEndEndpoint = { id: event.secondEdgeVertexIds[1], point: secondEnd };
        const [firstLower, firstUpper] =
          firstDirectionSigns[selectedCollinearAxis] > 0
            ? [firstStartEndpoint, firstEndEndpoint]
            : [firstEndEndpoint, firstStartEndpoint];
        const [secondLower, secondUpper] =
          secondDirectionSigns[selectedCollinearAxis] > 0
            ? [secondStartEndpoint, secondEndEndpoint]
            : [secondEndEndpoint, secondStartEndpoint];
        collinearEndpointOrder = {
          firstLowerVertexId: firstLower.id,
          firstUpperVertexId: firstUpper.id,
          secondLowerVertexId: secondLower.id,
          secondUpperVertexId: secondUpper.id,
        };
        const intervalInputs = [
          [
            'interval-second-lower-minus-first-upper',
            subtractPolynomial(
              coordinatePolynomial(secondLower.point, selectedCollinearAxis),
              coordinatePolynomial(firstUpper.point, selectedCollinearAxis),
            ),
          ],
          [
            'interval-first-lower-minus-second-upper',
            subtractPolynomial(
              coordinatePolynomial(firstLower.point, selectedCollinearAxis),
              coordinatePolynomial(secondUpper.point, selectedCollinearAxis),
            ),
          ],
        ] as const;
        const intervalSigns: (-1 | 0 | 1)[] = [];
        for (const [role, polynomial] of intervalInputs) {
          const auxiliary = evaluateAuxiliary(role, polynomial);
          if (auxiliary === undefined) {
            return failure([
              issue(
                'auxiliary-polynomial',
                `$.eventId.${role}`,
                'auxiliary-polynomial-limit-exceeded',
                'one collinear interval polynomial exceeds its defensive degree or bit limit',
              ),
            ]);
          }
          intervalSigns.push(auxiliary.signAtSelectedRoot);
        }
        if (
          intervalSigns.length !== 2 ||
          auxiliarySigns.length !==
            SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.collinearAuxiliaryPolynomialCount
        ) {
          throw new TypeError('complete collinear auxiliary sign ledger is required');
        }
        const [secondLowerMinusFirstUpper, firstLowerMinusSecondUpper] = intervalSigns as [
          -1 | 0 | 1,
          -1 | 0 | 1,
        ];
        collinearIntervalComparisonSigns = [secondLowerMinusFirstUpper, firstLowerMinusSecondUpper];
        containmentClass =
          secondLowerMinusFirstUpper > 0 || firstLowerMinusSecondUpper > 0
            ? 'disjoint'
            : secondLowerMinusFirstUpper === 0 || firstLowerMinusSecondUpper === 0
              ? 'endpoint-contact'
              : 'collinear-overlap';
      }
    }

    const success = {
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-edge-edge-algebraic-containment' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'one-nondegenerate-edge-pair-at-one-selected-coplanarity-event-root' as const,
        arithmetic: 'exact-rational-polynomial-common-refinement-gcd-sturm-bigint' as const,
        transitionRevisionId: rootCensusValue.transitionRevisionId,
        stepId: rootCensusValue.stepId,
        meshRevisionId: rootCensusValue.meshRevisionId,
        triangulationRevisionId: rootCensusValue.triangulationRevisionId,
        eventIndex: event.eventIndex,
        eventId: event.eventId,
        pairIndex: event.pairIndex,
        firstTriangleId: event.firstTriangleId,
        secondTriangleId: event.secondTriangleId,
        topologyRelation: event.topologyRelation,
        firstEdgeIndex: event.firstEdgeIndex,
        secondEdgeIndex: event.secondEdgeIndex,
        firstEdgeVertexIds: event.firstEdgeVertexIds,
        secondEdgeVertexIds: event.secondEdgeVertexIds,
        definingRootIndex: selectedRoot.rootIndex,
        definingRootLocation: selectedRoot.location,
        definingRootMultiplicity: selectedRoot.multiplicity,
        directionRelation,
        projectionAxisDropped,
        directionCrossSignsAtSelectedRoot: directionSigns,
        firstEdgeDirectionSignsAtSelectedRoot,
        secondEdgeDirectionSignsAtSelectedRoot,
        carrierOffsetCrossSignsAtSelectedRoot,
        collinearProjectionAxis,
        collinearEndpointOrder,
        collinearIntervalComparisonSigns,
        firstLineSecondEndpointSigns,
        secondLineFirstEndpointSigns,
        firstSegmentStraddlesSecondLine,
        secondSegmentStraddlesFirstLine,
        collinearOverlapHasPositiveLength: containmentClass === 'collinear-overlap',
        containmentClass,
        auxiliarySigns,
        event,
        rootCensus: rootCensusValue,
        selectedEventIdentityBoundExactly: true as const,
        selectedDefiningRootBoundExactly: true as const,
        coplanarityAtSelectedRootEstablishedExactly: true as const,
        commonPositiveScheduleDenominatorRemoved: true as const,
        nonparallelProjectionEstablishedExactly: directionRelation === 'nonparallel',
        projectedSegmentContainmentClassifiedExactly: directionRelation === 'nonparallel',
        parallelDirectionsClassifiedExactly: directionRelation !== 'nonparallel',
        carrierLineRelationClassifiedExactly: directionRelation !== 'nonparallel',
        collinearIntervalComparisonIncluded: directionRelation === 'collinear',
        threeDimensionalContainmentFollowsFromCoplanarityAndProjection:
          directionRelation !== 'parallel-noncollinear',
        threeDimensionalContainmentClassifiedExactly: true as const,
        featureContainmentAtSelectedRootIncluded: true as const,
        parallelOrCollinearCaseSupported: true as const,
        collinearPositiveLengthOverlapIncluded: true as const,
        degenerateEdgeCaseSupported: false as const,
        persistentCoplanarityEventSupported: false as const,
        floatingPointUsed: false as const,
        collisionClassificationIncluded: false as const,
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
    };
    return freezeSuccess ? deepFreezeOwned(success) : success;
  } catch (caught) {
    if (caught instanceof AuxiliarySignFailure) {
      return failure(
        caught.errors.map((entry) =>
          issue(
            'sign-evaluation',
            `$.eventId.${caught.role}${entry.path.slice(1)}`,
            entry.code,
            entry.message,
          ),
        ),
      );
    }
    return failure([
      issue(
        'classification',
        '$',
        'edge-edge-classification-invariant-failed',
        'exact edge-edge algebraic-root classification failed closed unexpectedly',
      ),
    ]);
  }
}

/** @internal Full-record composition for one already owned and revalidated event-root census. */
export function classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusV1(
  rootCensusValue: SingleHingeRationalScheduleEventRootCensusRecordV1,
  eventIndex: number,
  definingRootIndex: number,
): SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentResultV1 {
  return classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusCoreV1(
    rootCensusValue,
    eventIndex,
    definingRootIndex,
    true,
  );
}

/** @internal Compact composition that retains the shared source census only at its parent. */
export function classifySingleHingeRationalScheduleEdgeEdgeCompactFromOwnedEventRootCensusV1(
  rootCensusValue: SingleHingeRationalScheduleEventRootCensusRecordV1,
  eventIndex: number,
  definingRootIndex: number,
): SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactResultV1 {
  const result = classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusCoreV1(
    rootCensusValue,
    eventIndex,
    definingRootIndex,
    false,
  );
  if (!result.ok) return result;
  const { rootCensus, ...value } = result.value;
  if (rootCensus !== rootCensusValue) {
    return failure([
      issue(
        'classification',
        '$',
        'event-root-census-source-mismatch',
        'compact classification is not bound to the supplied owned event-root census',
      ),
    ]);
  }
  return deepFreezeOwned({ ok: true as const, value });
}

/** Classifies one nondegenerate segment pair at one selected exact coplanarity event root. */
export function classifySingleHingeRationalScheduleEdgeEdgeAtAlgebraicRootV1(
  supplied: unknown,
): SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentResultV1 {
  const input = inspectInput(supplied);
  if (!input.ok) return failure(input.error);
  const rootCensus = computeSingleHingeRationalScheduleEventRootCensusV1(input.value.transition);
  if (!rootCensus.ok) {
    return failure(
      rootCensus.error.map((entry) => issue('root-census', entry.path, entry.code, entry.message)),
    );
  }
  const selected = rootCensus.value.events.find((entry) => entry.eventId === input.value.eventId);
  if (selected === undefined) {
    return failure([
      issue(
        'event-selection',
        '$.eventId',
        'event-not-found',
        'event ID does not occur in the exact schedule event ledger',
      ),
    ]);
  }
  return classifySingleHingeRationalScheduleEdgeEdgeFromOwnedEventRootCensusCoreV1(
    rootCensus.value,
    selected.eventIndex,
    input.value.definingRootIndex,
    true,
  );
}

class AuxiliarySignFailure extends Error {
  readonly role: SingleHingeRationalScheduleEdgeEdgeAuxiliaryRoleV1;
  readonly errors: readonly Readonly<{ path: string; code: string; message: string }>[];

  constructor(
    role: SingleHingeRationalScheduleEdgeEdgeAuxiliaryRoleV1,
    errors: readonly Readonly<{ path: string; code: string; message: string }>[],
  ) {
    super('auxiliary algebraic-root sign evaluation failed');
    this.role = role;
    this.errors = errors;
  }
}
