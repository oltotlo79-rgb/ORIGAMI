import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  divideExactRational,
  exactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS,
  type CanonicalDyadicTimeV1,
} from './affine-origin-rotation-swept-aabb.js';
import {
  refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  type PrimitiveIntegerPolynomialCommonRootClassV1,
  type PrimitiveIntegerPolynomialCommonRootMemberV1,
  type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
} from './primitive-integer-polynomial-unit-interval-root-common-refinement.js';
import type { PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1 } from './primitive-integer-polynomial-unit-interval-root-isolation.js';
import {
  computeSingleHingeRationalScheduleEventRootCensusV1,
  type SingleHingeRationalScheduleEventRootCensusRecordV1,
  type SingleHingeRationalScheduleEventRootV1,
} from './single-hinge-rational-schedule-event-root-census.js';

export const SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS = deepFreezeOwned({
  maxBoundaryCount: 181_442,
  maxOpenCellCount: 181_441,
  maxFiniteRootOccurrenceCount: 181_440,
  maxDyadicSampleSearchExponent: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeExponent,
  maxTotalDyadicSampleSearchTrials: 4_194_304,
});

export type SingleHingeRationalScheduleMergedRootMemberV1 =
  PrimitiveIntegerPolynomialCommonRootMemberV1;

export type SingleHingeRationalScheduleMergedRootClassV1 =
  PrimitiveIntegerPolynomialCommonRootClassV1;

export type SingleHingeRationalScheduleRootRefinementViewV1 =
  PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1;

export type SingleHingeRationalScheduleEventOccurrenceV1 = Readonly<{
  eventIndex: number;
  eventId: string;
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  eventKind: SingleHingeRationalScheduleEventRootV1['eventKind'];
  rootIndex: number;
  multiplicity: number;
}>;

export type SingleHingeRationalSchedulePersistentEventV1 = Readonly<{
  eventIndex: number;
  eventId: string;
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  eventKind: SingleHingeRationalScheduleEventRootV1['eventKind'];
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryV1 =
  | Readonly<{
      boundaryIndex: number;
      boundaryId: string;
      location: 'start' | 'end';
      normalizedTimeKind: 'exact-rational';
      exactNormalizedTime: ExactRational;
      finiteEventOccurrences: readonly SingleHingeRationalScheduleEventOccurrenceV1[];
      finiteEventOccurrenceCount: number;
      simultaneousFiniteEventCount: number;
    }>
  | Readonly<{
      boundaryIndex: number;
      boundaryId: string;
      location: 'interior';
      normalizedTimeKind: 'isolated-algebraic';
      normalizedTimeIsolatingInterval: Readonly<{
        lower: ExactRational;
        upper: ExactRational;
        lowerExclusive: true;
        upperExclusive: true;
        distinctRootCount: 1;
      }>;
      finiteEventOccurrences: readonly SingleHingeRationalScheduleEventOccurrenceV1[];
      finiteEventOccurrenceCount: number;
      simultaneousFiniteEventCount: number;
    }>;

export type SingleHingeRationalScheduleGlobalEventOpenCellV1 = Readonly<{
  cellIndex: number;
  cellId: string;
  lowerBoundaryIndex: number;
  lowerBoundaryId: string;
  upperBoundaryIndex: number;
  upperBoundaryId: string;
  certifiedNormalizedSampleGap: Readonly<{
    lower: ExactRational;
    upper: ExactRational;
    lowerExclusive: true;
    upperExclusive: true;
  }>;
  sampleTime: CanonicalDyadicTimeV1;
  normalizedSampleTime: ExactRational;
  sampleSelection: 'least-exponent-canonical-dyadic-in-certified-open-gap';
  finiteEventPolynomialRootFreeOnEntireOpenCell: true;
  persistentEventsApplyThroughoutCell: true;
}>;

export type SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-global-event-time-partition';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'global-root-boundaries-and-open-cells-for-one-rational-single-hinge-schedule';
  arithmetic: 'exact-algebraic-root-classes-rational-bigint-and-dyadic-samples';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  finiteRootOccurrenceCount: number;
  persistentEventCount: number;
  boundaryCount: number;
  interiorBoundaryCount: number;
  openCellCount: number;
  dyadicSampleSearchTrialCount: number;
  boundariesWithSimultaneousFiniteEventsCount: number;
  persistentEvents: readonly SingleHingeRationalSchedulePersistentEventV1[];
  boundaries: readonly SingleHingeRationalScheduleGlobalEventBoundaryV1[];
  openCells: readonly SingleHingeRationalScheduleGlobalEventOpenCellV1[];
  eventRootCensus: SingleHingeRationalScheduleEventRootCensusRecordV1;
  rootRefinement: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1;
  endpointBoundariesAlwaysIncluded: true;
  endpointFiniteRootsJoinedExactly: true;
  persistentEventsRetainedSeparately: true;
  persistentEventsApplyToEveryBoundaryAndOpenCell: true;
  simultaneousCrossEventRootsMerged: true;
  allFiniteRootsAssignedToExactlyOneBoundary: true;
  globalEventCellPartitionIncluded: true;
  exactDyadicSamplePerOpenCellIncluded: true;
  everyOpenCellFiniteEventPolynomialRootFree: true;
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

export type SingleHingeRationalScheduleGlobalEventTimePartitionIssueV1 = Readonly<{
  stage: 'event-root-census' | 'root-refinement' | 'event-join' | 'time-partition' | 'cell-sample';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleGlobalEventTimePartitionResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleGlobalEventTimePartitionIssueV1[];
    }>;

const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const MAX_TIME_DECIMAL_MAGNITUDE =
  10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorDecimalDigits);
const MAX_TIME_BINARY_MAGNITUDE =
  1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorBits);

function issue(
  stage: SingleHingeRationalScheduleGlobalEventTimePartitionIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleGlobalEventTimePartitionIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleGlobalEventTimePartitionIssueV1[],
): SingleHingeRationalScheduleGlobalEventTimePartitionResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function floorRatio(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder !== 0n && numerator < 0n ? quotient - 1n : quotient;
}

function canonicalDyadic(numerator: bigint, exponent: number): CanonicalDyadicTimeV1 {
  if (numerator === 0n) return { numerator: 0n, exponent: 0 };
  let canonicalNumerator = numerator;
  let canonicalExponent = exponent;
  while (canonicalExponent > 0 && canonicalNumerator % 2n === 0n) {
    canonicalNumerator /= 2n;
    canonicalExponent -= 1;
  }
  return { numerator: canonicalNumerator, exponent: canonicalExponent };
}

function dyadicRational(value: CanonicalDyadicTimeV1): ExactRational {
  return exactRational(value.numerator, 1n << BigInt(value.exponent));
}

function selectDyadicStrictlyInside(
  lower: ExactRational,
  upper: ExactRational,
  remainingTrialBudget: number,
): Readonly<{
  sample: CanonicalDyadicTimeV1 | undefined;
  trialCount: number;
  budgetExhausted: boolean;
}> {
  if (compareExactRational(lower, upper) >= 0) {
    return { sample: undefined, trialCount: 0, budgetExhausted: false };
  }
  let trialCount = 0;
  for (
    let exponent = 0;
    exponent <=
    SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxDyadicSampleSearchExponent;
    exponent += 1
  ) {
    if (trialCount >= remainingTrialBudget) {
      return { sample: undefined, trialCount, budgetExhausted: true };
    }
    trialCount += 1;
    const scale = 1n << BigInt(exponent);
    const numerator = floorRatio(lower.numerator * scale, lower.denominator) + 1n;
    if (numerator * upper.denominator >= upper.numerator * scale) continue;
    const candidate = canonicalDyadic(numerator, exponent);
    const magnitude = absolute(candidate.numerator);
    if (magnitude >= MAX_TIME_DECIMAL_MAGNITUDE || magnitude >= MAX_TIME_BINARY_MAGNITUDE) {
      return { sample: undefined, trialCount, budgetExhausted: false };
    }
    return { sample: candidate, trialCount, budgetExhausted: false };
  }
  return { sample: undefined, trialCount, budgetExhausted: false };
}

function occurrence(
  event: SingleHingeRationalScheduleEventRootV1,
  rootIndex: number,
  multiplicity: number,
): SingleHingeRationalScheduleEventOccurrenceV1 {
  return {
    eventIndex: event.eventIndex,
    eventId: event.eventId,
    pairIndex: event.pairIndex,
    firstTriangleId: event.firstTriangleId,
    secondTriangleId: event.secondTriangleId,
    eventKind: event.eventKind,
    rootIndex,
    multiplicity,
  };
}

function persistentEvent(
  event: SingleHingeRationalScheduleEventRootV1,
): SingleHingeRationalSchedulePersistentEventV1 {
  return {
    eventIndex: event.eventIndex,
    eventId: event.eventId,
    pairIndex: event.pairIndex,
    firstTriangleId: event.firstTriangleId,
    secondTriangleId: event.secondTriangleId,
    eventKind: event.eventKind,
  };
}

function finiteOccurrenceKey(eventIndex: number, rootIndex: number): string {
  return `${String(eventIndex)}:${String(rootIndex)}`;
}

function classLower(rootClass: SingleHingeRationalScheduleMergedRootClassV1): ExactRational {
  return rootClass.location === 'interior'
    ? rootClass.isolatingInterval.lower
    : rootClass.exactRoot;
}

function classUpper(rootClass: SingleHingeRationalScheduleMergedRootClassV1): ExactRational {
  return rootClass.location === 'interior'
    ? rootClass.isolatingInterval.upper
    : rootClass.exactRoot;
}

function actualTimeAtNormalized(
  census: SingleHingeRationalScheduleEventRootCensusRecordV1,
  normalized: ExactRational,
): ExactRational {
  const slab = census.polynomialCensus.schedule.slab;
  const start = dyadicRational(slab.t0);
  const end = dyadicRational(slab.t1);
  return addExactRational(
    start,
    multiplyExactRational(normalized, subtractExactRational(end, start)),
  );
}

function normalizedTimeAtActual(
  census: SingleHingeRationalScheduleEventRootCensusRecordV1,
  actual: ExactRational,
): ExactRational {
  const slab = census.polynomialCensus.schedule.slab;
  const start = dyadicRational(slab.t0);
  const end = dyadicRational(slab.t1);
  return divideExactRational(
    subtractExactRational(actual, start),
    subtractExactRational(end, start),
  );
}

function sameIsolation(
  left: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
  right: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
): boolean {
  if (
    left.polynomialId !== right.polynomialId ||
    left.rootSetKind !== right.rootSetKind ||
    left.polynomialDegree !== right.polynomialDegree ||
    left.startRootMultiplicity !== right.startRootMultiplicity ||
    left.endRootMultiplicity !== right.endRootMultiplicity ||
    left.interiorDistinctRootCount !== right.interiorDistinctRootCount ||
    left.distinctRootCount !== right.distinctRootCount ||
    left.rootMultiplicitySum !== right.rootMultiplicitySum ||
    left.sturmSequenceLength !== right.sturmSequenceLength ||
    left.subdivisionNodeCount !== right.subdivisionNodeCount ||
    left.maximumSubdivisionDepthUsed !== right.maximumSubdivisionDepthUsed ||
    left.primitiveIntegerCoefficientsLowToHigh.length !==
      right.primitiveIntegerCoefficientsLowToHigh.length ||
    left.primitiveIntegerCoefficientsLowToHigh.some(
      (coefficient, index) => coefficient !== right.primitiveIntegerCoefficientsLowToHigh[index],
    ) ||
    left.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh.length !==
      right.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh.length ||
    left.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh.some(
      (coefficient, index) =>
        coefficient !== right.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh[index],
    ) ||
    left.roots.length !== right.roots.length
  ) {
    return false;
  }
  return left.roots.every((root, index) => {
    const other = right.roots[index];
    if (
      other === undefined ||
      root.rootIndex !== other.rootIndex ||
      root.location !== other.location ||
      root.multiplicity !== other.multiplicity
    ) {
      return false;
    }
    if (root.location === 'interior') {
      return (
        other.location === 'interior' &&
        compareExactRational(root.isolatingInterval.lower, other.isolatingInterval.lower) === 0 &&
        compareExactRational(root.isolatingInterval.upper, other.isolatingInterval.upper) === 0
      );
    }
    return (
      other.location === root.location &&
      compareExactRational(root.exactRoot, other.exactRoot) === 0
    );
  });
}

/**
 * Joins one trusted exact root-refinement certificate to the schedule event
 * ledger and emits endpoint/root boundaries plus root-free open cells.
 */
function assembleSingleHingeRationalScheduleGlobalEventTimePartitionV1(
  census: SingleHingeRationalScheduleEventRootCensusRecordV1,
  refinement: SingleHingeRationalScheduleRootRefinementViewV1,
): SingleHingeRationalScheduleGlobalEventTimePartitionResultV1 {
  try {
    const eventById = new Map(census.events.map((event) => [event.eventId, event]));
    const expectedFiniteOccurrences = new Map<
      string,
      Readonly<{ eventIndex: number; rootIndex: number }>
    >();
    for (const event of census.events) {
      if (event.persistentOnEntireUnitInterval) continue;
      for (const root of event.isolation.roots) {
        expectedFiniteOccurrences.set(finiteOccurrenceKey(event.eventIndex, root.rootIndex), {
          eventIndex: event.eventIndex,
          rootIndex: root.rootIndex,
        });
      }
    }
    if (
      expectedFiniteOccurrences.size !== census.totalDistinctFiniteRootCountBeforeCrossEventMerge ||
      expectedFiniteOccurrences.size >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxFiniteRootOccurrenceCount
    ) {
      return failure([
        issue(
          'event-join',
          '$.eventRootCensus.events',
          'finite-root-ledger-invariant',
          'finite root occurrence count disagrees with the independent root census or its limit',
        ),
      ]);
    }

    const persistentEvents = refinement.persistentPolynomials.map((reference, index) => {
      const event = eventById.get(reference.polynomialId);
      if (
        event === undefined ||
        event.eventIndex !== reference.polynomialIndex ||
        !event.persistentOnEntireUnitInterval
      ) {
        throw new TypeError(`persistent event join failed at ${String(index)}`);
      }
      return persistentEvent(event);
    });
    if (
      persistentEvents.length !== census.persistentEventCount ||
      new Set(persistentEvents.map((event) => event.eventId)).size !== persistentEvents.length
    ) {
      return failure([
        issue(
          'event-join',
          '$.rootRefinement.persistentPolynomials',
          'persistent-event-join-invariant',
          'persistent polynomial references do not bijectively match persistent schedule events',
        ),
      ]);
    }

    const seenFiniteOccurrences = new Set<string>();
    const joinedClasses = refinement.rootClasses.map((rootClass, classIndex) => {
      if (rootClass.rootClassIndex !== classIndex || rootClass.members.length === 0) {
        throw new TypeError(`root class index/member invariant failed at ${String(classIndex)}`);
      }
      const occurrences = rootClass.members.map((member) => {
        const event = eventById.get(member.polynomialId);
        const root = event?.isolation.roots[member.rootIndex];
        if (
          event === undefined ||
          event.eventIndex !== member.polynomialIndex ||
          event.persistentOnEntireUnitInterval ||
          root === undefined ||
          root.rootIndex !== member.rootIndex ||
          root.location !== rootClass.location ||
          root.multiplicity !== member.multiplicity
        ) {
          throw new TypeError(`finite event join failed at ${String(classIndex)}`);
        }
        const key = finiteOccurrenceKey(event.eventIndex, root.rootIndex);
        if (!expectedFiniteOccurrences.has(key) || seenFiniteOccurrences.has(key)) {
          throw new TypeError(
            `finite event occurrence is missing or duplicated at ${String(classIndex)}`,
          );
        }
        seenFiniteOccurrences.add(key);
        return occurrence(event, root.rootIndex, root.multiplicity);
      });
      return { rootClass, occurrences };
    });
    if (seenFiniteOccurrences.size !== expectedFiniteOccurrences.size) {
      return failure([
        issue(
          'event-join',
          '$.rootRefinement.rootClasses',
          'finite-root-class-bijection-failed',
          'merged root classes do not assign every finite root occurrence exactly once',
        ),
      ]);
    }

    const startClasses = joinedClasses.filter((entry) => entry.rootClass.location === 'start');
    const endClasses = joinedClasses.filter((entry) => entry.rootClass.location === 'end');
    const interiorClasses = joinedClasses.filter(
      (
        entry,
      ): entry is typeof entry &
        Readonly<{
          rootClass: Extract<
            SingleHingeRationalScheduleMergedRootClassV1,
            { location: 'interior' }
          >;
        }> => entry.rootClass.location === 'interior',
    );
    if (
      startClasses.length > 1 ||
      endClasses.length > 1 ||
      (startClasses[0] !== undefined &&
        compareExactRational(classLower(startClasses[0].rootClass), ZERO) !== 0) ||
      (endClasses[0] !== undefined &&
        compareExactRational(classUpper(endClasses[0].rootClass), ONE) !== 0) ||
      joinedClasses.some((entry, index) =>
        index === 0
          ? false
          : compareExactRational(
              classUpper(joinedClasses[index - 1]?.rootClass ?? entry.rootClass),
              classLower(entry.rootClass),
            ) > 0,
      )
    ) {
      return failure([
        issue(
          'root-refinement',
          '$.rootRefinement.rootClasses',
          'ordered-root-class-invariant',
          'root classes are not one strictly ordered start/interior/end sequence',
        ),
      ]);
    }

    const startOccurrences = startClasses.flatMap((entry) => entry.occurrences);
    const endOccurrences = endClasses.flatMap((entry) => entry.occurrences);
    const boundaries: SingleHingeRationalScheduleGlobalEventBoundaryV1[] = [
      {
        boundaryIndex: 0,
        boundaryId: 'event-boundary:start',
        location: 'start',
        normalizedTimeKind: 'exact-rational',
        exactNormalizedTime: ZERO,
        finiteEventOccurrences: startOccurrences,
        finiteEventOccurrenceCount: startOccurrences.length,
        simultaneousFiniteEventCount: startOccurrences.length,
      },
    ];
    for (const [interiorIndex, entry] of interiorClasses.entries()) {
      boundaries.push({
        boundaryIndex: boundaries.length,
        boundaryId: `event-boundary:interior:${String(interiorIndex)}`,
        location: 'interior',
        normalizedTimeKind: 'isolated-algebraic',
        normalizedTimeIsolatingInterval: entry.rootClass.isolatingInterval,
        finiteEventOccurrences: entry.occurrences,
        finiteEventOccurrenceCount: entry.occurrences.length,
        simultaneousFiniteEventCount: entry.occurrences.length,
      });
    }
    boundaries.push({
      boundaryIndex: boundaries.length,
      boundaryId: 'event-boundary:end',
      location: 'end',
      normalizedTimeKind: 'exact-rational',
      exactNormalizedTime: ONE,
      finiteEventOccurrences: endOccurrences,
      finiteEventOccurrenceCount: endOccurrences.length,
      simultaneousFiniteEventCount: endOccurrences.length,
    });
    if (
      boundaries.length >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxBoundaryCount ||
      boundaries.some((boundary, index) => boundary.boundaryIndex !== index)
    ) {
      return failure([
        issue(
          'time-partition',
          '$.boundaries',
          'boundary-limit-or-index-invariant',
          'global boundary ledger exceeds its limit or is not densely indexed',
        ),
      ]);
    }

    const openCells: SingleHingeRationalScheduleGlobalEventOpenCellV1[] = [];
    let dyadicSampleSearchTrialCount = 0;
    for (let cellIndex = 0; cellIndex + 1 < boundaries.length; cellIndex += 1) {
      const lowerBoundary = boundaries[cellIndex];
      const upperBoundary = boundaries[cellIndex + 1];
      if (lowerBoundary === undefined || upperBoundary === undefined) {
        throw new TypeError('adjacent boundary must exist');
      }
      const normalizedLower =
        lowerBoundary.location === 'interior'
          ? lowerBoundary.normalizedTimeIsolatingInterval.upper
          : lowerBoundary.exactNormalizedTime;
      const normalizedUpper =
        upperBoundary.location === 'interior'
          ? upperBoundary.normalizedTimeIsolatingInterval.lower
          : upperBoundary.exactNormalizedTime;
      if (compareExactRational(normalizedLower, normalizedUpper) >= 0) {
        return failure([
          issue(
            'time-partition',
            `$.openCells[${String(cellIndex)}]`,
            'empty-certified-root-gap',
            'adjacent root certificates leave no strict rational sample gap',
          ),
        ]);
      }
      const actualLower = actualTimeAtNormalized(census, normalizedLower);
      const actualUpper = actualTimeAtNormalized(census, normalizedUpper);
      const selection = selectDyadicStrictlyInside(
        actualLower,
        actualUpper,
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxTotalDyadicSampleSearchTrials -
          dyadicSampleSearchTrialCount,
      );
      dyadicSampleSearchTrialCount += selection.trialCount;
      const sampleTime = selection.sample;
      if (sampleTime === undefined) {
        return failure([
          issue(
            'cell-sample',
            `$.openCells[${String(cellIndex)}].sampleTime`,
            selection.budgetExhausted
              ? 'aggregate-dyadic-sample-search-budget-exhausted'
              : 'bounded-dyadic-sample-unavailable',
            selection.budgetExhausted
              ? 'aggregate canonical dyadic sample search exceeded its defensive trial limit'
              : 'no canonical dyadic sample was found inside the certified open gap within time limits',
          ),
        ]);
      }
      const normalizedSampleTime = normalizedTimeAtActual(census, dyadicRational(sampleTime));
      if (
        compareExactRational(normalizedLower, normalizedSampleTime) >= 0 ||
        compareExactRational(normalizedSampleTime, normalizedUpper) >= 0
      ) {
        throw new TypeError('selected dyadic sample is outside its certified normalized gap');
      }
      openCells.push({
        cellIndex,
        cellId: `event-open-cell:${String(cellIndex)}`,
        lowerBoundaryIndex: lowerBoundary.boundaryIndex,
        lowerBoundaryId: lowerBoundary.boundaryId,
        upperBoundaryIndex: upperBoundary.boundaryIndex,
        upperBoundaryId: upperBoundary.boundaryId,
        certifiedNormalizedSampleGap: {
          lower: normalizedLower,
          upper: normalizedUpper,
          lowerExclusive: true,
          upperExclusive: true,
        },
        sampleTime,
        normalizedSampleTime,
        sampleSelection: 'least-exponent-canonical-dyadic-in-certified-open-gap',
        finiteEventPolynomialRootFreeOnEntireOpenCell: true,
        persistentEventsApplyThroughoutCell: true,
      });
    }
    if (
      openCells.length !== boundaries.length - 1 ||
      openCells.length >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxOpenCellCount
    ) {
      return failure([
        issue(
          'time-partition',
          '$.openCells',
          'open-cell-ledger-invariant',
          'open cell count does not match the adjacent boundary partition or its limit',
        ),
      ]);
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-global-event-time-partition' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'global-root-boundaries-and-open-cells-for-one-rational-single-hinge-schedule' as const,
        arithmetic: 'exact-algebraic-root-classes-rational-bigint-and-dyadic-samples' as const,
        transitionRevisionId: census.transitionRevisionId,
        stepId: census.stepId,
        meshRevisionId: census.meshRevisionId,
        triangulationRevisionId: census.triangulationRevisionId,
        finiteRootOccurrenceCount: seenFiniteOccurrences.size,
        persistentEventCount: persistentEvents.length,
        boundaryCount: boundaries.length,
        interiorBoundaryCount: interiorClasses.length,
        openCellCount: openCells.length,
        dyadicSampleSearchTrialCount,
        boundariesWithSimultaneousFiniteEventsCount: boundaries.filter(
          (boundary) => boundary.finiteEventOccurrenceCount > 1,
        ).length,
        persistentEvents,
        boundaries,
        openCells,
        eventRootCensus: census,
        rootRefinement: refinement,
        endpointBoundariesAlwaysIncluded: true as const,
        endpointFiniteRootsJoinedExactly: true as const,
        persistentEventsRetainedSeparately: true as const,
        persistentEventsApplyToEveryBoundaryAndOpenCell: true as const,
        simultaneousCrossEventRootsMerged: true as const,
        allFiniteRootsAssignedToExactlyOneBoundary: true as const,
        globalEventCellPartitionIncluded: true as const,
        exactDyadicSamplePerOpenCellIncluded: true as const,
        everyOpenCellFiniteEventPolynomialRootFree: true as const,
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
        'time-partition',
        '$',
        'global-event-time-partition-invariant-failed',
        'global event time partition failed closed unexpectedly',
      ),
    ]);
  }
}

/** Computes exact cross-event root boundaries and root-free open time cells. */
export function computeSingleHingeRationalScheduleGlobalEventTimePartitionV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleGlobalEventTimePartitionResultV1 {
  const census = computeSingleHingeRationalScheduleEventRootCensusV1(suppliedTransition);
  if (!census.ok) {
    return failure(
      census.error.map((entry) =>
        issue('event-root-census', entry.path, entry.code, entry.message),
      ),
    );
  }
  const refinement = refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1({
    refinementId: census.value.transitionRevisionId,
    polynomials: census.value.events.map((event) => ({
      polynomialId: event.eventId,
      coefficients: [...event.polynomial.primitiveIntegerCoefficientsLowToHigh],
    })),
  });
  if (!refinement.ok) {
    return failure(
      refinement.error.map((entry) =>
        issue('root-refinement', entry.path, entry.code, entry.message),
      ),
    );
  }
  if (
    refinement.value.polynomialCount !== census.value.eventCount ||
    refinement.value.isolations.length !== census.value.events.length ||
    refinement.value.isolations.some((isolation, index) => {
      const event = census.value.events[index];
      return event === undefined || !sameIsolation(isolation, event.isolation);
    })
  ) {
    return failure([
      issue(
        'root-refinement',
        '$.rootRefinement.isolations',
        'independent-isolation-replay-mismatch',
        'common refinement did not replay the exact independent event root isolations',
      ),
    ]);
  }
  return assembleSingleHingeRationalScheduleGlobalEventTimePartitionV1(
    census.value,
    refinement.value,
  );
}
