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
  constructSingleHingeRationalHalfAngleScheduleV1,
  type ExactRationalQuadraticPolynomialV1,
  type SingleHingeRationalHalfAngleScheduleRecordV1,
  type SingleHingeRationalHalfAngleVertexPathV1,
} from './single-hinge-rational-half-angle-schedule.js';
import type { StaticRationalTriangleFoldMeshPairRelationV1 } from './static-rational-triangle-fold-mesh-binding.js';

type RationalPolynomial = readonly ExactRational[];
type PolynomialPoint3 = readonly [
  x: ExactRationalQuadraticPolynomialV1,
  y: ExactRationalQuadraticPolynomialV1,
  z: ExactRationalQuadraticPolynomialV1,
];
type PolynomialVector3 = readonly [
  x: RationalPolynomial,
  y: RationalPolynomial,
  z: RationalPolynomial,
];

export const SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS = deepFreezeOwned({
  maxTriangles: 64,
  maxTrianglePairs: 2_016,
  eventsPerInterSourceFacePair: 15,
  maxEvents: 30_240,
  maxPolynomialDegree: 6,
  maxCanonicalCoefficientBits: 262_144,
});

export type SingleHingeRationalScheduleEventRootBoundaryClassV1 =
  | 'identically-zero'
  | 'nonzero-away-from-both-endpoints'
  | 'zero-at-start-only'
  | 'zero-at-end-only'
  | 'zero-at-both-endpoints';

type EventBaseV1 = Readonly<{
  eventIndex: number;
  eventId: string;
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  topologyRelation: Exclude<StaticRationalTriangleFoldMeshPairRelationV1, 'same-source-face'>;
  primitiveIntegerCoefficientsLowToHigh: readonly bigint[];
  polynomialDegree: number | null;
  startSign: -1 | 0 | 1;
  endSign: -1 | 0 | 1;
  boundaryClass: SingleHingeRationalScheduleEventRootBoundaryClassV1;
  identicallyZero: boolean;
  isolatedRootCount: null;
}>;

export type SingleHingeRationalScheduleVertexFaceEventV1 = EventBaseV1 &
  Readonly<{
    eventKind: 'vertex-face-plane';
    vertexTriangleSide: 'first' | 'second';
    vertexIndex: 0 | 1 | 2;
    vertexId: string;
    faceTriangleId: string;
    faceVertexIds: readonly [string, string, string];
  }>;

export type SingleHingeRationalScheduleEdgeEdgeEventV1 = EventBaseV1 &
  Readonly<{
    eventKind: 'edge-edge-coplanarity';
    firstEdgeIndex: 0 | 1 | 2;
    secondEdgeIndex: 0 | 1 | 2;
    firstEdgeVertexIds: readonly [string, string];
    secondEdgeVertexIds: readonly [string, string];
  }>;

export type SingleHingeRationalScheduleEventPolynomialV1 =
  SingleHingeRationalScheduleVertexFaceEventV1 | SingleHingeRationalScheduleEdgeEdgeEventV1;

export type SingleHingeRationalScheduleEventPolynomialCensusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-event-polynomial-census';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'all-inter-source-face-triangle-pairs-on-one-rational-single-hinge-schedule';
  arithmetic: 'exact-rational-to-primitive-integer-polynomial-bigint';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  triangleCount: number;
  unorderedTrianglePairCount: number;
  sameSourceFacePairExcludedCount: number;
  interSourceFacePairCount: number;
  vertexFaceEventCount: number;
  edgeEdgeEventCount: number;
  eventCount: number;
  identicallyZeroEventCount: number;
  nonzeroEventCount: number;
  startRootEventCount: number;
  endRootEventCount: number;
  maximumObservedPolynomialDegree: number;
  events: readonly SingleHingeRationalScheduleEventPolynomialV1[];
  schedule: SingleHingeRationalHalfAngleScheduleRecordV1;
  polynomialCoefficientOrder: 'constant-to-highest-degree';
  polynomialNormalization: 'positive-denominator-lcm-then-integer-content-gcd-or-zero';
  commonPositiveScheduleDenominatorRemoved: true;
  completeInterSourceFacePairEnumerationIncluded: true;
  allSixVertexFacePlaneEventsPerPairIncluded: true;
  allNineEdgeEdgeCoplanarityEventsPerPairIncluded: true;
  exactNecessaryCoplanarityPolynomialsIncluded: true;
  sameSourceFaceStructuralExclusionIncluded: true;
  identicallyZeroPersistentCandidatesRetained: true;
  eventRootIsolationIncluded: false;
  collisionEventCompletenessEstablished: false;
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

export type SingleHingeRationalScheduleEventPolynomialCensusIssueV1 = Readonly<{
  stage: 'schedule' | 'polynomial-census';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleEventPolynomialCensusResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleEventPolynomialCensusRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleEventPolynomialCensusIssueV1[];
    }>;

const ZERO = exactRational(0n);
const TRIANGLE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const;

function issue(
  stage: SingleHingeRationalScheduleEventPolynomialCensusIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleEventPolynomialCensusIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleEventPolynomialCensusIssueV1[],
): SingleHingeRationalScheduleEventPolynomialCensusResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function trimPolynomial(polynomial: RationalPolynomial): RationalPolynomial {
  let length = polynomial.length;
  while (length > 1 && equalExactRational(polynomial[length - 1] ?? ZERO, ZERO)) length -= 1;
  return polynomial.slice(0, length);
}

function addPolynomial(left: RationalPolynomial, right: RationalPolynomial): RationalPolynomial {
  const length = Math.max(left.length, right.length);
  return trimPolynomial(
    Array.from({ length }, (_, index) =>
      addExactRational(left[index] ?? ZERO, right[index] ?? ZERO),
    ),
  );
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

function subtractVector(left: PolynomialVector3, right: PolynomialVector3): PolynomialVector3 {
  return [
    subtractPolynomial(left[0], right[0]),
    subtractPolynomial(left[1], right[1]),
    subtractPolynomial(left[2], right[2]),
  ];
}

function crossVector(left: PolynomialVector3, right: PolynomialVector3): PolynomialVector3 {
  return [
    subtractPolynomial(
      multiplyPolynomial(left[1], right[2]),
      multiplyPolynomial(left[2], right[1]),
    ),
    subtractPolynomial(
      multiplyPolynomial(left[2], right[0]),
      multiplyPolynomial(left[0], right[2]),
    ),
    subtractPolynomial(
      multiplyPolynomial(left[0], right[1]),
      multiplyPolynomial(left[1], right[0]),
    ),
  ];
}

function dotVector(left: PolynomialVector3, right: PolynomialVector3): RationalPolynomial {
  return addPolynomial(
    addPolynomial(multiplyPolynomial(left[0], right[0]), multiplyPolynomial(left[1], right[1])),
    multiplyPolynomial(left[2], right[2]),
  );
}

function orientPolynomial(
  first: PolynomialPoint3,
  second: PolynomialPoint3,
  third: PolynomialPoint3,
  fourth: PolynomialPoint3,
): RationalPolynomial {
  const firstVector: PolynomialVector3 = first;
  const secondVector: PolynomialVector3 = second;
  const thirdVector: PolynomialVector3 = third;
  const fourthVector: PolynomialVector3 = fourth;
  return dotVector(
    crossVector(
      subtractVector(secondVector, firstVector),
      subtractVector(thirdVector, firstVector),
    ),
    subtractVector(fourthVector, firstVector),
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

function sign(value: bigint): -1 | 0 | 1 {
  return value < 0n ? -1 : value > 0n ? 1 : 0;
}

function evaluateAtOne(coefficients: readonly bigint[]): bigint {
  return coefficients.reduce((sum, coefficient) => sum + coefficient, 0n);
}

function coefficientBitLength(value: bigint): number {
  return absolute(value).toString(2).length;
}

function boundaryClass(
  identicallyZero: boolean,
  startSign: -1 | 0 | 1,
  endSign: -1 | 0 | 1,
): SingleHingeRationalScheduleEventRootBoundaryClassV1 {
  if (identicallyZero) return 'identically-zero';
  if (startSign === 0 && endSign === 0) return 'zero-at-both-endpoints';
  if (startSign === 0) return 'zero-at-start-only';
  if (endSign === 0) return 'zero-at-end-only';
  return 'nonzero-away-from-both-endpoints';
}

function polynomialPoint(path: SingleHingeRationalHalfAngleVertexPathV1): PolynomialPoint3 {
  return [path.xNumerator, path.yNumerator, path.zNumerator];
}

type EventPolynomialMetadata = Readonly<{
  coefficients: readonly bigint[];
  degree: number | null;
  startSign: -1 | 0 | 1;
  endSign: -1 | 0 | 1;
  boundaryClass: SingleHingeRationalScheduleEventRootBoundaryClassV1;
  identicallyZero: boolean;
}>;

function eventPolynomialMetadata(
  polynomial: RationalPolynomial,
): EventPolynomialMetadata | undefined {
  const coefficients = primitiveIntegerPolynomial(polynomial);
  if (
    coefficients.length - 1 >
      SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree ||
    coefficients.some(
      (coefficient) =>
        coefficientBitLength(coefficient) >
        SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxCanonicalCoefficientBits,
    )
  ) {
    return undefined;
  }
  const identicallyZero = coefficients.length === 1 && coefficients[0] === 0n;
  const startSign = sign(coefficients[0] ?? 0n);
  const endSign = sign(evaluateAtOne(coefficients));
  return {
    coefficients,
    degree: identicallyZero ? null : coefficients.length - 1,
    startSign,
    endSign,
    boundaryClass: boundaryClass(identicallyZero, startSign, endSign),
    identicallyZero,
  };
}

/**
 * Builds exact necessary coplanarity event polynomials for every inter-source-
 * face triangle pair on one accepted rational single-hinge schedule.
 */
export function computeSingleHingeRationalScheduleEventPolynomialCensusV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleEventPolynomialCensusResultV1 {
  const schedule = constructSingleHingeRationalHalfAngleScheduleV1(suppliedTransition);
  if (!schedule.ok) {
    return failure(
      schedule.error.map((entry) => issue('schedule', entry.path, entry.code, entry.message)),
    );
  }
  try {
    const pathByVertexId = new Map(schedule.value.vertexPaths.map((path) => [path.vertexId, path]));
    const triangleById = new Map(
      schedule.value.transition.startBinding.triangles.map((triangle) => [
        triangle.triangleId,
        triangle,
      ]),
    );
    const events: SingleHingeRationalScheduleEventPolynomialV1[] = [];
    let sameSourceFacePairExcludedCount = 0;
    let interSourceFacePairCount = 0;
    let vertexFaceEventCount = 0;
    let edgeEdgeEventCount = 0;
    let identicallyZeroEventCount = 0;
    let startRootEventCount = 0;
    let endRootEventCount = 0;
    let maximumObservedPolynomialDegree = 0;
    const appendMetadata = (
      polynomial: RationalPolynomial,
    ): EventPolynomialMetadata | undefined => {
      const metadata = eventPolynomialMetadata(polynomial);
      if (metadata === undefined) return undefined;
      if (metadata.identicallyZero) identicallyZeroEventCount += 1;
      if (metadata.startSign === 0) startRootEventCount += 1;
      if (metadata.endSign === 0) endRootEventCount += 1;
      if (metadata.degree !== null && metadata.degree > maximumObservedPolynomialDegree) {
        maximumObservedPolynomialDegree = metadata.degree;
      }
      return metadata;
    };
    for (const pair of schedule.value.transition.startBinding.pairs) {
      if (pair.pairRelation === 'same-source-face') {
        sameSourceFacePairExcludedCount += 1;
        continue;
      }
      interSourceFacePairCount += 1;
      const firstTriangle = triangleById.get(pair.firstTriangleId);
      const secondTriangle = triangleById.get(pair.secondTriangleId);
      if (firstTriangle === undefined || secondTriangle === undefined) {
        return failure([
          issue(
            'polynomial-census',
            '$.pairs',
            'triangle-topology-missing',
            'one inter-source-face pair references an unavailable triangle',
          ),
        ]);
      }
      const firstPaths = firstTriangle.vertexIds.map((vertexId) => pathByVertexId.get(vertexId));
      const secondPaths = secondTriangle.vertexIds.map((vertexId) => pathByVertexId.get(vertexId));
      const [first0, first1, first2] = firstPaths;
      const [second0, second1, second2] = secondPaths;
      if (
        first0 === undefined ||
        first1 === undefined ||
        first2 === undefined ||
        second0 === undefined ||
        second1 === undefined ||
        second2 === undefined
      ) {
        return failure([
          issue(
            'polynomial-census',
            '$.vertexPaths',
            'vertex-path-missing',
            'one triangle vertex has no exact schedule path',
          ),
        ]);
      }
      const firstPoints = [
        polynomialPoint(first0),
        polynomialPoint(first1),
        polynomialPoint(first2),
      ] as const;
      const secondPoints = [
        polynomialPoint(second0),
        polynomialPoint(second1),
        polynomialPoint(second2),
      ] as const;
      for (const vertexIndex of [0, 1, 2] as const) {
        const metadata = appendMetadata(
          orientPolynomial(
            secondPoints[0],
            secondPoints[1],
            secondPoints[2],
            firstPoints[vertexIndex],
          ),
        );
        if (metadata === undefined) {
          return failure([
            issue(
              'polynomial-census',
              '$.events',
              'event-polynomial-limit-exceeded',
              'one event polynomial exceeds the defensive degree or coefficient bit limit',
            ),
          ]);
        }
        events.push({
          eventIndex: events.length,
          eventId: `vf:${String(pair.pairIndex)}:first:${String(vertexIndex)}`,
          pairIndex: pair.pairIndex,
          firstTriangleId: pair.firstTriangleId,
          secondTriangleId: pair.secondTriangleId,
          topologyRelation: pair.pairRelation,
          primitiveIntegerCoefficientsLowToHigh: metadata.coefficients,
          polynomialDegree: metadata.degree,
          startSign: metadata.startSign,
          endSign: metadata.endSign,
          boundaryClass: metadata.boundaryClass,
          identicallyZero: metadata.identicallyZero,
          isolatedRootCount: null,
          eventKind: 'vertex-face-plane',
          vertexTriangleSide: 'first',
          vertexIndex,
          vertexId: firstTriangle.vertexIds[vertexIndex],
          faceTriangleId: secondTriangle.triangleId,
          faceVertexIds: secondTriangle.vertexIds,
        });
        vertexFaceEventCount += 1;
      }
      for (const vertexIndex of [0, 1, 2] as const) {
        const metadata = appendMetadata(
          orientPolynomial(
            firstPoints[0],
            firstPoints[1],
            firstPoints[2],
            secondPoints[vertexIndex],
          ),
        );
        if (metadata === undefined) {
          return failure([
            issue(
              'polynomial-census',
              '$.events',
              'event-polynomial-limit-exceeded',
              'one event polynomial exceeds the defensive degree or coefficient bit limit',
            ),
          ]);
        }
        events.push({
          eventIndex: events.length,
          eventId: `vf:${String(pair.pairIndex)}:second:${String(vertexIndex)}`,
          pairIndex: pair.pairIndex,
          firstTriangleId: pair.firstTriangleId,
          secondTriangleId: pair.secondTriangleId,
          topologyRelation: pair.pairRelation,
          primitiveIntegerCoefficientsLowToHigh: metadata.coefficients,
          polynomialDegree: metadata.degree,
          startSign: metadata.startSign,
          endSign: metadata.endSign,
          boundaryClass: metadata.boundaryClass,
          identicallyZero: metadata.identicallyZero,
          isolatedRootCount: null,
          eventKind: 'vertex-face-plane',
          vertexTriangleSide: 'second',
          vertexIndex,
          vertexId: secondTriangle.vertexIds[vertexIndex],
          faceTriangleId: firstTriangle.triangleId,
          faceVertexIds: firstTriangle.vertexIds,
        });
        vertexFaceEventCount += 1;
      }
      for (const [firstEdgeIndex, firstEdge] of TRIANGLE_EDGES.entries()) {
        for (const [secondEdgeIndex, secondEdge] of TRIANGLE_EDGES.entries()) {
          const metadata = appendMetadata(
            orientPolynomial(
              firstPoints[firstEdge[0]],
              firstPoints[firstEdge[1]],
              secondPoints[secondEdge[0]],
              secondPoints[secondEdge[1]],
            ),
          );
          if (metadata === undefined) {
            return failure([
              issue(
                'polynomial-census',
                '$.events',
                'event-polynomial-limit-exceeded',
                'one event polynomial exceeds the defensive degree or coefficient bit limit',
              ),
            ]);
          }
          events.push({
            eventIndex: events.length,
            eventId: `ee:${String(pair.pairIndex)}:${String(firstEdgeIndex)}:${String(secondEdgeIndex)}`,
            pairIndex: pair.pairIndex,
            firstTriangleId: pair.firstTriangleId,
            secondTriangleId: pair.secondTriangleId,
            topologyRelation: pair.pairRelation,
            primitiveIntegerCoefficientsLowToHigh: metadata.coefficients,
            polynomialDegree: metadata.degree,
            startSign: metadata.startSign,
            endSign: metadata.endSign,
            boundaryClass: metadata.boundaryClass,
            identicallyZero: metadata.identicallyZero,
            isolatedRootCount: null,
            eventKind: 'edge-edge-coplanarity',
            firstEdgeIndex: firstEdgeIndex as 0 | 1 | 2,
            secondEdgeIndex: secondEdgeIndex as 0 | 1 | 2,
            firstEdgeVertexIds: [
              firstTriangle.vertexIds[firstEdge[0]],
              firstTriangle.vertexIds[firstEdge[1]],
            ],
            secondEdgeVertexIds: [
              secondTriangle.vertexIds[secondEdge[0]],
              secondTriangle.vertexIds[secondEdge[1]],
            ],
          });
          edgeEdgeEventCount += 1;
        }
      }
    }
    const expectedEventCount =
      interSourceFacePairCount *
      SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.eventsPerInterSourceFacePair;
    if (
      events.length !== expectedEventCount ||
      events.length > SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxEvents ||
      vertexFaceEventCount !== interSourceFacePairCount * 6 ||
      edgeEdgeEventCount !== interSourceFacePairCount * 9 ||
      sameSourceFacePairExcludedCount + interSourceFacePairCount !==
        schedule.value.transition.startBinding.unorderedPairCount ||
      events.some((event, index) => event.eventIndex !== index)
    ) {
      return failure([
        issue(
          'polynomial-census',
          '$.events',
          'event-ledger-invariant',
          'complete pair and event ledgers or counters disagree',
        ),
      ]);
    }
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-event-polynomial-census' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'all-inter-source-face-triangle-pairs-on-one-rational-single-hinge-schedule' as const,
        arithmetic: 'exact-rational-to-primitive-integer-polynomial-bigint' as const,
        transitionRevisionId: schedule.value.transitionRevisionId,
        stepId: schedule.value.stepId,
        meshRevisionId: schedule.value.meshRevisionId,
        triangulationRevisionId: schedule.value.triangulationRevisionId,
        triangleCount: schedule.value.transition.startBinding.triangleCount,
        unorderedTrianglePairCount: schedule.value.transition.startBinding.unorderedPairCount,
        sameSourceFacePairExcludedCount,
        interSourceFacePairCount,
        vertexFaceEventCount,
        edgeEdgeEventCount,
        eventCount: events.length,
        identicallyZeroEventCount,
        nonzeroEventCount: events.length - identicallyZeroEventCount,
        startRootEventCount,
        endRootEventCount,
        maximumObservedPolynomialDegree,
        events,
        schedule: schedule.value,
        polynomialCoefficientOrder: 'constant-to-highest-degree' as const,
        polynomialNormalization:
          'positive-denominator-lcm-then-integer-content-gcd-or-zero' as const,
        commonPositiveScheduleDenominatorRemoved: true as const,
        completeInterSourceFacePairEnumerationIncluded: true as const,
        allSixVertexFacePlaneEventsPerPairIncluded: true as const,
        allNineEdgeEdgeCoplanarityEventsPerPairIncluded: true as const,
        exactNecessaryCoplanarityPolynomialsIncluded: true as const,
        sameSourceFaceStructuralExclusionIncluded: true as const,
        identicallyZeroPersistentCandidatesRetained: true as const,
        eventRootIsolationIncluded: false as const,
        collisionEventCompletenessEstablished: false as const,
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
        'polynomial-census',
        '$',
        'polynomial-census-invariant-failed',
        'exact schedule event polynomial census failed closed unexpectedly',
      ),
    ]);
  }
}
