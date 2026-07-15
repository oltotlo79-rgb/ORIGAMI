import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  type PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
} from './primitive-integer-polynomial-unit-interval-root-isolation.js';
import {
  computeSingleHingeRationalScheduleEventPolynomialCensusV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS,
  type SingleHingeRationalScheduleEventPolynomialCensusRecordV1,
  type SingleHingeRationalScheduleEventPolynomialV1,
} from './single-hinge-rational-schedule-event-polynomial-census.js';

export const SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_ROOT_CENSUS_LIMITS = deepFreezeOwned({
  maxEvents: SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxEvents,
  maxDistinctFiniteRoots: SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxEvents * 6,
  maxTotalSubdivisionNodes: 262_144,
});

export type SingleHingeRationalScheduleEventRootV1 = Readonly<{
  eventIndex: number;
  eventId: string;
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  eventKind: SingleHingeRationalScheduleEventPolynomialV1['eventKind'];
  polynomial: SingleHingeRationalScheduleEventPolynomialV1;
  isolation: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1;
  persistentOnEntireUnitInterval: boolean;
  hasAnyUnitIntervalRoot: boolean;
  hasStartRoot: boolean;
  hasInteriorRoot: boolean;
  hasEndRoot: boolean;
}>;

export type SingleHingeRationalScheduleEventRootCensusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-event-root-census';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'independent-root-isolation-for-all-necessary-event-polynomials';
  arithmetic: 'exact-rational-sturm-bigint';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  triangleCount: number;
  unorderedTrianglePairCount: number;
  eventCount: number;
  persistentEventCount: number;
  finiteRootSetEventCount: number;
  eventsWithAnyUnitIntervalRootCount: number;
  eventsWithStartRootCount: number;
  eventsWithInteriorRootCount: number;
  eventsWithEndRootCount: number;
  totalDistinctFiniteRootCountBeforeCrossEventMerge: number;
  totalFiniteRootMultiplicityBeforeCrossEventMerge: number;
  totalSubdivisionNodeCount: number;
  maximumSubdivisionDepthUsed: number;
  events: readonly SingleHingeRationalScheduleEventRootV1[];
  polynomialCensus: SingleHingeRationalScheduleEventPolynomialCensusRecordV1;
  everyEventPolynomialRootSetCoveredOnClosedUnitInterval: true;
  endpointRootsHandledExactly: true;
  repeatedRootMultiplicitiesIncluded: true;
  persistentZeroPolynomialsRetained: true;
  independentEventRootIsolationIncluded: true;
  simultaneousCrossEventRootsMerged: false;
  globalEventCellPartitionIncluded: false;
  featureContainmentAtRootsIncluded: false;
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

export type SingleHingeRationalScheduleEventRootCensusIssueV1 = Readonly<{
  stage: 'polynomial-census' | 'root-isolation' | 'root-census';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleEventRootCensusResultV1 =
  | Readonly<{ ok: true; value: SingleHingeRationalScheduleEventRootCensusRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleEventRootCensusIssueV1[];
    }>;

function issue(
  stage: SingleHingeRationalScheduleEventRootCensusIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleEventRootCensusIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleEventRootCensusIssueV1[],
): SingleHingeRationalScheduleEventRootCensusResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

/** Runs exact closed-unit-interval root isolation for every event polynomial. */
export function computeSingleHingeRationalScheduleEventRootCensusV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleEventRootCensusResultV1 {
  const polynomialCensus =
    computeSingleHingeRationalScheduleEventPolynomialCensusV1(suppliedTransition);
  if (!polynomialCensus.ok) {
    return failure(
      polynomialCensus.error.map((entry) =>
        issue('polynomial-census', entry.path, entry.code, entry.message),
      ),
    );
  }
  try {
    const events: SingleHingeRationalScheduleEventRootV1[] = [];
    let persistentEventCount = 0;
    let eventsWithAnyUnitIntervalRootCount = 0;
    let eventsWithStartRootCount = 0;
    let eventsWithInteriorRootCount = 0;
    let eventsWithEndRootCount = 0;
    let totalDistinctFiniteRootCountBeforeCrossEventMerge = 0;
    let totalFiniteRootMultiplicityBeforeCrossEventMerge = 0;
    let totalSubdivisionNodeCount = 0;
    let maximumSubdivisionDepthUsed = 0;
    for (const polynomial of polynomialCensus.value.events) {
      const isolation = isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1({
        polynomialId: polynomial.eventId,
        coefficients: polynomial.primitiveIntegerCoefficientsLowToHigh,
      });
      if (!isolation.ok) {
        return failure(
          isolation.error.map((entry) =>
            issue(
              'root-isolation',
              `$.events[${polynomial.eventId}]${entry.path.slice(1)}`,
              entry.code,
              entry.message,
            ),
          ),
        );
      }
      if (
        isolation.value.polynomialId !== polynomial.eventId ||
        isolation.value.primitiveIntegerCoefficientsLowToHigh.length !==
          polynomial.primitiveIntegerCoefficientsLowToHigh.length ||
        isolation.value.primitiveIntegerCoefficientsLowToHigh.some(
          (coefficient, index) =>
            coefficient !== polynomial.primitiveIntegerCoefficientsLowToHigh[index],
        )
      ) {
        return failure([
          issue(
            'root-census',
            `$.events[${polynomial.eventId}]`,
            'root-isolation-source-mismatch',
            'root isolation output is not bound to the exact event polynomial',
          ),
        ]);
      }
      const persistentOnEntireUnitInterval = isolation.value.rootSetKind === 'entire-unit-interval';
      const hasStartRoot = isolation.value.startRootMultiplicity > 0;
      const hasInteriorRoot = isolation.value.interiorDistinctRootCount > 0;
      const hasEndRoot = isolation.value.endRootMultiplicity > 0;
      const hasAnyUnitIntervalRoot =
        persistentOnEntireUnitInterval || hasStartRoot || hasInteriorRoot || hasEndRoot;
      if (persistentOnEntireUnitInterval) persistentEventCount += 1;
      if (hasAnyUnitIntervalRoot) eventsWithAnyUnitIntervalRootCount += 1;
      if (hasStartRoot) eventsWithStartRootCount += 1;
      if (hasInteriorRoot) eventsWithInteriorRootCount += 1;
      if (hasEndRoot) eventsWithEndRootCount += 1;
      totalDistinctFiniteRootCountBeforeCrossEventMerge += isolation.value.distinctRootCount;
      totalFiniteRootMultiplicityBeforeCrossEventMerge += isolation.value.rootMultiplicitySum ?? 0;
      totalSubdivisionNodeCount += isolation.value.subdivisionNodeCount;
      if (isolation.value.maximumSubdivisionDepthUsed > maximumSubdivisionDepthUsed) {
        maximumSubdivisionDepthUsed = isolation.value.maximumSubdivisionDepthUsed;
      }
      if (
        totalDistinctFiniteRootCountBeforeCrossEventMerge >
          SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_ROOT_CENSUS_LIMITS.maxDistinctFiniteRoots ||
        totalSubdivisionNodeCount >
          SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_ROOT_CENSUS_LIMITS.maxTotalSubdivisionNodes
      ) {
        return failure([
          issue(
            'root-census',
            '$.events',
            'aggregate-root-limit-exceeded',
            'aggregate isolated roots or subdivision nodes exceed the defensive census limit',
          ),
        ]);
      }
      events.push({
        eventIndex: polynomial.eventIndex,
        eventId: polynomial.eventId,
        pairIndex: polynomial.pairIndex,
        firstTriangleId: polynomial.firstTriangleId,
        secondTriangleId: polynomial.secondTriangleId,
        eventKind: polynomial.eventKind,
        polynomial,
        isolation: isolation.value,
        persistentOnEntireUnitInterval,
        hasAnyUnitIntervalRoot,
        hasStartRoot,
        hasInteriorRoot,
        hasEndRoot,
      });
    }
    if (
      events.length !== polynomialCensus.value.eventCount ||
      events.length > SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_ROOT_CENSUS_LIMITS.maxEvents ||
      events.some(
        (event, index) =>
          event.eventIndex !== index ||
          event.eventId !== polynomialCensus.value.events[index]?.eventId,
      ) ||
      persistentEventCount !== polynomialCensus.value.identicallyZeroEventCount
    ) {
      return failure([
        issue(
          'root-census',
          '$.events',
          'root-ledger-invariant',
          'polynomial and isolated-root event ledgers or counters disagree',
        ),
      ]);
    }
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-event-root-census' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'independent-root-isolation-for-all-necessary-event-polynomials' as const,
        arithmetic: 'exact-rational-sturm-bigint' as const,
        transitionRevisionId: polynomialCensus.value.transitionRevisionId,
        stepId: polynomialCensus.value.stepId,
        meshRevisionId: polynomialCensus.value.meshRevisionId,
        triangulationRevisionId: polynomialCensus.value.triangulationRevisionId,
        triangleCount: polynomialCensus.value.triangleCount,
        unorderedTrianglePairCount: polynomialCensus.value.unorderedTrianglePairCount,
        eventCount: events.length,
        persistentEventCount,
        finiteRootSetEventCount: events.length - persistentEventCount,
        eventsWithAnyUnitIntervalRootCount,
        eventsWithStartRootCount,
        eventsWithInteriorRootCount,
        eventsWithEndRootCount,
        totalDistinctFiniteRootCountBeforeCrossEventMerge,
        totalFiniteRootMultiplicityBeforeCrossEventMerge,
        totalSubdivisionNodeCount,
        maximumSubdivisionDepthUsed,
        events,
        polynomialCensus: polynomialCensus.value,
        everyEventPolynomialRootSetCoveredOnClosedUnitInterval: true as const,
        endpointRootsHandledExactly: true as const,
        repeatedRootMultiplicitiesIncluded: true as const,
        persistentZeroPolynomialsRetained: true as const,
        independentEventRootIsolationIncluded: true as const,
        simultaneousCrossEventRootsMerged: false as const,
        globalEventCellPartitionIncluded: false as const,
        featureContainmentAtRootsIncluded: false as const,
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
        'root-census',
        '$',
        'root-census-invariant-failed',
        'complete event root census failed closed unexpectedly',
      ),
    ]);
  }
}
