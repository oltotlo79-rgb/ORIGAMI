import { deepFreezeOwned } from '../clone-and-freeze.js';
import type { ExactRational } from '../model/exact-rational.js';
import { SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS } from './single-hinge-rational-schedule-event-polynomial-census.js';
import {
  analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS,
  type SingleHingeRationalScheduleFiniteRootClassificationV1,
  type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1,
} from './single-hinge-rational-schedule-global-event-boundary-finite-root-classification-ledger.js';
import type { SingleHingeRationalScheduleGlobalEventCellStaticSampleV1 } from './single-hinge-rational-schedule-global-event-cell-static-samples.js';
import { SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS } from './single-hinge-rational-schedule-global-event-time-partition.js';

// This is an adapter-specific fail-closed cap, not an upstream-derived acceptance bound:
// normalized-time denominators may also contain the source slab-duration numerator.
const MAX_HOMOGENEOUS_INTERMEDIATE_BIGINT_BITS =
  SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxCanonicalCoefficientBits +
  SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree *
    (SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_TIME_PARTITION_LIMITS.maxDyadicSampleSearchExponent +
      1) +
  4;

export const SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS =
  deepFreezeOwned({
    maxBoundaryRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxBoundaryRows,
    maxFiniteRootSideHistoryRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxFiniteRootClassificationRows,
    maxSideSignEvaluationRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxFiniteRootClassificationRows *
      2,
    maxHomogeneousHornerCoefficientRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxFiniteRootClassificationRows *
      2 *
      (SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree + 1),
    maxHomogeneousIntermediateBigIntBits: MAX_HOMOGENEOUS_INTERMEDIATE_BIGINT_BITS,
    maxRetainedHomogeneousValueBigIntBits: 16_777_216,
    maxPolynomialDegree: SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree,
  });

export type SingleHingeRationalScheduleFiniteRootSideSignHistoryKindV1 =
  | 'start-right-negative'
  | 'start-right-positive'
  | 'interior-negative-to-positive'
  | 'interior-positive-to-negative'
  | 'interior-negative-on-both-sides'
  | 'interior-positive-on-both-sides'
  | 'end-left-negative'
  | 'end-left-positive';

export type SingleHingeRationalScheduleFiniteRootSideSignHistoryCountersV1 = Readonly<{
  startRightNegativeCount: number;
  startRightPositiveCount: number;
  interiorNegativeToPositiveCount: number;
  interiorPositiveToNegativeCount: number;
  interiorNegativeOnBothSidesCount: number;
  interiorPositiveOnBothSidesCount: number;
  endLeftNegativeCount: number;
  endLeftPositiveCount: number;
}>;

export type SingleHingeRationalScheduleFiniteRootPolynomialSideSignEvaluationV1 = Readonly<{
  side: 'left' | 'right';
  cellIndex: number;
  cellId: string;
  openCellId: string;
  definingPolynomialDegree: number;
  homogeneousIntegerValue: bigint;
  homogeneousIntegerValueBitLength: number;
  maximumIntermediateBigIntBits: number;
  homogeneousHornerCoefficientRowCount: number;
  signAtExactSample: -1 | 1;
  homogeneousIdentity: 'denominator^degree-times-polynomial-at-normalized-sample';
  sourceSampleIsCanonicalDyadicActualTime: true;
  sourceOpenCellFiniteEventPolynomialRootFree: true;
  signConstantOnEntireSourceOpenCell: true;
}>;

type FiniteRootSideSignHistoryBaseV1 = Readonly<{
  globalSideHistoryIndex: number;
  sourceGlobalClassificationIndex: number;
  boundaryOccurrenceIndex: number;
  boundaryIndex: number;
  boundaryId: string;
  boundaryLocation: 'start' | 'interior' | 'end';
  occurrence: SingleHingeRationalScheduleFiniteRootClassificationV1['occurrence'];
  rootMultiplicityParity: 'odd' | 'even';
  leftSideEvaluation: SingleHingeRationalScheduleFiniteRootPolynomialSideSignEvaluationV1 | null;
  rightSideEvaluation: SingleHingeRationalScheduleFiniteRootPolynomialSideSignEvaluationV1 | null;
  sideSignEvaluationCount: 1 | 2;
  retainedHomogeneousValueBigIntBits: number;
  sideSignHistoryKind: SingleHingeRationalScheduleFiniteRootSideSignHistoryKindV1;
  interiorPolynomialZeroBehavior:
    | 'odd-multiplicity-oriented-sign-crossing'
    | 'even-multiplicity-oriented-sign-preserving-zero'
    | null;
  interiorMultiplicityParityConsistentWithSideSigns: true | null;
}>;

export type SingleHingeRationalScheduleVertexFaceFiniteRootSideSignHistoryV1 =
  FiniteRootSideSignHistoryBaseV1 &
    Readonly<{
      classificationKind: 'vertex-face-root-containment';
      eventKind: 'vertex-face-plane';
      rootFeatureClassification: 'outside' | 'vertex' | 'edge' | 'interior';
    }>;

export type SingleHingeRationalScheduleEdgeEdgeFiniteRootSideSignHistoryV1 =
  FiniteRootSideSignHistoryBaseV1 &
    Readonly<{
      classificationKind: 'edge-edge-algebraic-containment';
      eventKind: 'edge-edge-coplanarity';
      rootFeatureClassification:
        'disjoint' | 'endpoint-contact' | 'proper-interior-crossing' | 'collinear-overlap';
    }>;

export type SingleHingeRationalScheduleFiniteRootSideSignHistoryV1 =
  | SingleHingeRationalScheduleVertexFaceFiniteRootSideSignHistoryV1
  | SingleHingeRationalScheduleEdgeEdgeFiniteRootSideSignHistoryV1;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignHistoriesV1 = Readonly<{
  boundaryIndex: number;
  boundaryId: string;
  boundaryLocation: 'start' | 'interior' | 'end';
  finiteRootOccurrenceCount: number;
  sideSignEvaluationCount: number;
  retainedHomogeneousValueBigIntBits: number;
  sideSignHistoryCounters: SingleHingeRationalScheduleFiniteRootSideSignHistoryCountersV1;
  occurrenceSideSignHistories: readonly SingleHingeRationalScheduleFiniteRootSideSignHistoryV1[];
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerRecordV1 =
  Readonly<{
    schemaVersion: 1;
    recordType: 'm0f-single-hinge-rational-schedule-global-event-boundary-finite-root-side-sign-ledger';
    contractStatus: 'candidate-no-claim';
    predicateScope: 'defining-event-polynomial-side-signs-for-all-finite-root-occurrences';
    arithmetic: 'exact-homogeneous-integer-horner-at-owned-rational-open-cell-samples';
    transitionRevisionId: string;
    stepId: string;
    meshRevisionId: string;
    triangulationRevisionId: string;
    boundaryCount: number;
    finiteRootOccurrenceCount: number;
    sideSignHistoryRowCount: number;
    sideSignEvaluationCount: number;
    homogeneousHornerCoefficientRowCount: number;
    aggregateRetainedHomogeneousValueBigIntBits: number;
    maximumObservedIntermediateBigIntBits: number;
    sideSignHistoryCounters: SingleHingeRationalScheduleFiniteRootSideSignHistoryCountersV1;
    boundarySideSignHistories: readonly SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignHistoriesV1[];
    finiteRootClassificationLedger: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1;
    sourceFiniteRootClassificationLedgerSingleOwnedSnapshotCompositionReused: true;
    everyGlobalBoundaryJoinedExactlyOnce: true;
    everyFiniteRootOccurrenceJoinedExactlyOnceInCanonicalOrder: true;
    everyAvailableAdjacentCellSampleEvaluatedExactlyOncePerOccurrence: true;
    allSideEvaluationsBoundToDefiningEventAndAdjacentOpenCell: true;
    exactHomogeneousIntegerEvaluationAtEveryAvailableSideSample: true;
    everyAdjacentOpenCellFiniteEventPolynomialSignConstant: true;
    everyInteriorRootMultiplicityParityMatchesSideSigns: true;
    endpointHistoriesOneSidedOnly: true;
    orientedEventPolynomialSideHistoryIncluded: true;
    rootFeatureClassificationEvidenceRetainedOnlyInCentralSource: true;
    sampleSideStaticDeltasRetainedOnlyInCentralSource: true;
    persistentEventsRetainedOnlyInCentralSource: true;
    persistentEventSubdivisionIncluded: false;
    eventOccurrenceDeduplicationIncluded: false;
    approachSeparationHistoryIncluded: false;
    geometricApproachSeparationEstablished: false;
    polynomialMagnitudeMonotonicityEstablished: false;
    openCellStrataConstancyEstablished: false;
    sampleDifferenceOccursAtBoundaryEstablished: false;
    collisionEventCompletenessEstablished: false;
    continuousCollisionDetectionIncluded: false;
    legalContactPolicyIncluded: false;
    selfIntersectionDecisionIncluded: false;
    collisionFreeClaim: false;
    callerRevisionLabelsOnly: true;
    exactSourceReconstructionGeometryEqualityChecked: false;
    cryptographicSourceRevisionBindingIncluded: false;
    isSupportProfile: false;
    supportClaim: false;
    verifiedClaim: false;
    scientificClaim: false;
    globalM0fGo: false;
  }>;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerIssueV1 =
  Readonly<{
    stage:
      | 'finite-root-classification-ledger'
      | 'side-sign-preflight'
      | 'homogeneous-evaluation'
      | 'side-history-join';
    path: string;
    code: string;
    message: string;
  }>;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerIssueV1[];
    }>;

interface MutableSideSignHistoryCounters {
  startRightNegativeCount: number;
  startRightPositiveCount: number;
  interiorNegativeToPositiveCount: number;
  interiorPositiveToNegativeCount: number;
  interiorNegativeOnBothSidesCount: number;
  interiorPositiveOnBothSidesCount: number;
  endLeftNegativeCount: number;
  endLeftPositiveCount: number;
}

type HomogeneousEvaluationResult =
  | Readonly<{
      ok: true;
      value: bigint;
      valueBitLength: number;
      maximumIntermediateBigIntBits: number;
      coefficientRowCount: number;
    }>
  | Readonly<{ ok: false; reason: 'invalid-source' | 'intermediate-bit-limit-exceeded' }>;

function issue(
  stage: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerIssueV1[],
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function emptyCounters(): MutableSideSignHistoryCounters {
  return {
    startRightNegativeCount: 0,
    startRightPositiveCount: 0,
    interiorNegativeToPositiveCount: 0,
    interiorPositiveToNegativeCount: 0,
    interiorNegativeOnBothSidesCount: 0,
    interiorPositiveOnBothSidesCount: 0,
    endLeftNegativeCount: 0,
    endLeftPositiveCount: 0,
  };
}

function addCounters(
  target: MutableSideSignHistoryCounters,
  source: SingleHingeRationalScheduleFiniteRootSideSignHistoryCountersV1,
): void {
  target.startRightNegativeCount += source.startRightNegativeCount;
  target.startRightPositiveCount += source.startRightPositiveCount;
  target.interiorNegativeToPositiveCount += source.interiorNegativeToPositiveCount;
  target.interiorPositiveToNegativeCount += source.interiorPositiveToNegativeCount;
  target.interiorNegativeOnBothSidesCount += source.interiorNegativeOnBothSidesCount;
  target.interiorPositiveOnBothSidesCount += source.interiorPositiveOnBothSidesCount;
  target.endLeftNegativeCount += source.endLeftNegativeCount;
  target.endLeftPositiveCount += source.endLeftPositiveCount;
}

function incrementCounter(
  counters: MutableSideSignHistoryCounters,
  kind: SingleHingeRationalScheduleFiniteRootSideSignHistoryKindV1,
): void {
  switch (kind) {
    case 'start-right-negative':
      counters.startRightNegativeCount += 1;
      break;
    case 'start-right-positive':
      counters.startRightPositiveCount += 1;
      break;
    case 'interior-negative-to-positive':
      counters.interiorNegativeToPositiveCount += 1;
      break;
    case 'interior-positive-to-negative':
      counters.interiorPositiveToNegativeCount += 1;
      break;
    case 'interior-negative-on-both-sides':
      counters.interiorNegativeOnBothSidesCount += 1;
      break;
    case 'interior-positive-on-both-sides':
      counters.interiorPositiveOnBothSidesCount += 1;
      break;
    case 'end-left-negative':
      counters.endLeftNegativeCount += 1;
      break;
    case 'end-left-positive':
      counters.endLeftPositiveCount += 1;
      break;
  }
}

function bigintBitLength(value: bigint): number {
  const magnitude = value < 0n ? -value : value;
  return magnitude === 0n ? 1 : magnitude.toString(2).length;
}

function evaluateHomogeneousInteger(
  coefficientsLowToHigh: readonly bigint[],
  degree: number,
  sample: ExactRational,
): HomogeneousEvaluationResult {
  if (
    !Number.isSafeInteger(degree) ||
    degree < 0 ||
    degree >
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxPolynomialDegree ||
    coefficientsLowToHigh.length !== degree + 1 ||
    sample.denominator <= 0n
  ) {
    return { ok: false, reason: 'invalid-source' };
  }
  const leading = coefficientsLowToHigh[degree];
  if (leading === undefined || leading === 0n) {
    return { ok: false, reason: 'invalid-source' };
  }
  let value = leading;
  let denominatorPower = 1n;
  let maximumIntermediateBigIntBits = bigintBitLength(value);
  const account = (candidate: bigint): boolean => {
    const bits = bigintBitLength(candidate);
    if (bits > maximumIntermediateBigIntBits) maximumIntermediateBigIntBits = bits;
    return (
      bits <=
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxHomogeneousIntermediateBigIntBits
    );
  };
  if (!account(sample.numerator) || !account(sample.denominator)) {
    return { ok: false, reason: 'intermediate-bit-limit-exceeded' };
  }
  for (let coefficientIndex = degree - 1; coefficientIndex >= 0; coefficientIndex -= 1) {
    const coefficient = coefficientsLowToHigh[coefficientIndex];
    if (coefficient === undefined) return { ok: false, reason: 'invalid-source' };
    denominatorPower *= sample.denominator;
    const previousTerm = value * sample.numerator;
    const coefficientTerm = coefficient * denominatorPower;
    value = previousTerm + coefficientTerm;
    if (
      !account(denominatorPower) ||
      !account(previousTerm) ||
      !account(coefficientTerm) ||
      !account(value)
    ) {
      return { ok: false, reason: 'intermediate-bit-limit-exceeded' };
    }
  }
  return {
    ok: true,
    value,
    valueBitLength: bigintBitLength(value),
    maximumIntermediateBigIntBits,
    coefficientRowCount: coefficientsLowToHigh.length,
  };
}

function sourceCellMatchesSide(
  source: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1,
  boundaryIndex: number,
  side: 'left' | 'right',
  cell: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1,
): boolean {
  const expectedCellIndex = side === 'left' ? boundaryIndex - 1 : boundaryIndex;
  const partition = source.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition;
  return (
    cell.cellIndex === expectedCellIndex &&
    source.boundaryCellStaticDeltaLedger.cellStaticSamples.cellSamples[expectedCellIndex] ===
      cell &&
    partition.openCells[expectedCellIndex] === cell.openCell &&
    cell.openCell.cellIndex === expectedCellIndex &&
    cell.cellId === cell.openCell.cellId
  );
}

function evaluateSide(
  side: 'left' | 'right',
  cell: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1,
  coefficients: readonly bigint[],
  degree: number,
):
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleFiniteRootPolynomialSideSignEvaluationV1;
    }>
  | Readonly<{
      ok: false;
      reason:
        'invalid-source' | 'intermediate-bit-limit-exceeded' | 'zero-at-root-free-open-cell-sample';
    }> {
  const evaluated = evaluateHomogeneousInteger(
    coefficients,
    degree,
    cell.openCell.normalizedSampleTime,
  );
  if (!evaluated.ok) return evaluated;
  const sign = evaluated.value < 0n ? -1 : evaluated.value > 0n ? 1 : 0;
  if (sign === 0) return { ok: false, reason: 'zero-at-root-free-open-cell-sample' };
  return {
    ok: true,
    value: {
      side,
      cellIndex: cell.cellIndex,
      cellId: cell.cellId,
      openCellId: cell.openCell.cellId,
      definingPolynomialDegree: degree,
      homogeneousIntegerValue: evaluated.value,
      homogeneousIntegerValueBitLength: evaluated.valueBitLength,
      maximumIntermediateBigIntBits: evaluated.maximumIntermediateBigIntBits,
      homogeneousHornerCoefficientRowCount: evaluated.coefficientRowCount,
      signAtExactSample: sign,
      homogeneousIdentity: 'denominator^degree-times-polynomial-at-normalized-sample',
      sourceSampleIsCanonicalDyadicActualTime: true,
      sourceOpenCellFiniteEventPolynomialRootFree: true,
      signConstantOnEntireSourceOpenCell: true,
    },
  };
}

function historyKind(
  boundaryLocation: 'start' | 'interior' | 'end',
  leftSign: -1 | 1 | null,
  rightSign: -1 | 1 | null,
): SingleHingeRationalScheduleFiniteRootSideSignHistoryKindV1 | undefined {
  if (boundaryLocation === 'start') {
    if (leftSign !== null || rightSign === null) return undefined;
    return rightSign < 0 ? 'start-right-negative' : 'start-right-positive';
  }
  if (boundaryLocation === 'end') {
    if (leftSign === null || rightSign !== null) return undefined;
    return leftSign < 0 ? 'end-left-negative' : 'end-left-positive';
  }
  if (leftSign === null || rightSign === null) return undefined;
  if (leftSign < 0 && rightSign > 0) return 'interior-negative-to-positive';
  if (leftSign > 0 && rightSign < 0) return 'interior-positive-to-negative';
  return leftSign < 0 ? 'interior-negative-on-both-sides' : 'interior-positive-on-both-sides';
}

function classificationMatchesCanonicalSource(
  row: SingleHingeRationalScheduleFiniteRootClassificationV1,
  expectedGlobalIndex: number,
  expectedBoundaryIndex: number,
  expectedBoundaryOccurrenceIndex: number,
  source: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1,
): boolean {
  const boundary = source.boundaryClassifications[expectedBoundaryIndex];
  const sourceOccurrence =
    boundary?.boundary.finiteEventOccurrences[expectedBoundaryOccurrenceIndex];
  const event =
    source.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition.eventRootCensus
      .events[row.occurrence.eventIndex];
  const root = event?.isolation.roots[row.occurrence.rootIndex];
  return (
    row.globalClassificationIndex === expectedGlobalIndex &&
    row.boundaryIndex === expectedBoundaryIndex &&
    row.boundaryOccurrenceIndex === expectedBoundaryOccurrenceIndex &&
    row.occurrence === sourceOccurrence &&
    event?.eventId === row.occurrence.eventId &&
    event.pairIndex === row.occurrence.pairIndex &&
    event.eventKind === row.eventKind &&
    root?.multiplicity === row.occurrence.multiplicity &&
    root.location === row.boundaryLocation &&
    (row.classificationKind === 'vertex-face-root-containment'
      ? row.classification.definingEvent === event.polynomial
      : row.classification.event === event.polynomial)
  );
}

/** Retains exact defining-polynomial signs on every available side of every finite root. */
export function analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerResultV1 {
  const classified =
    analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerV1(
      suppliedTransition,
    );
  if (!classified.ok) {
    return failure(
      classified.error.map((entry) =>
        issue(
          'finite-root-classification-ledger',
          `$.finiteRootClassificationLedger${entry.path.slice(1)}`,
          entry.code,
          entry.message,
        ),
      ),
    );
  }

  const source = classified.value;
  const partition = source.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition;
  const rootCensus = partition.eventRootCensus;
  let preflightSideSignEvaluationCount = 0;
  try {
    if (
      source.boundaryCount !== partition.boundaryCount ||
      source.boundaryClassifications.length !== source.boundaryCount ||
      source.boundaryCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxBoundaryRows ||
      source.finiteRootOccurrenceCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxFiniteRootSideHistoryRows
    ) {
      return failure([
        issue(
          'side-sign-preflight',
          '$.finiteRootClassificationLedger',
          'side-sign-source-limit-or-cardinality-mismatch',
          'finite-root source rows do not match the bounded global partition',
        ),
      ]);
    }
    for (const boundary of source.boundaryClassifications) {
      preflightSideSignEvaluationCount +=
        boundary.finiteRootOccurrenceCount * (boundary.boundaryLocation === 'interior' ? 2 : 1);
    }
    const preflightMaximumHornerCoefficientRowCount =
      preflightSideSignEvaluationCount *
      (SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxPolynomialDegree + 1);
    if (
      !Number.isSafeInteger(preflightSideSignEvaluationCount) ||
      preflightSideSignEvaluationCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxSideSignEvaluationRows ||
      !Number.isSafeInteger(preflightMaximumHornerCoefficientRowCount) ||
      preflightMaximumHornerCoefficientRowCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxHomogeneousHornerCoefficientRows
    ) {
      return failure([
        issue(
          'side-sign-preflight',
          '$.finiteRootClassificationLedger.boundaryClassifications',
          'side-sign-evaluation-limit-exceeded',
          'adjacent-side sign evaluations exceed the bounded homogeneous Horner work limit',
        ),
      ]);
    }

    const boundarySideSignHistories: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignHistoriesV1[] =
      [];
    const aggregateCounters = emptyCounters();
    let globalSideHistoryIndex = 0;
    let sideSignEvaluationCount = 0;
    let homogeneousHornerCoefficientRowCount = 0;
    let aggregateRetainedHomogeneousValueBigIntBits = 0;
    let maximumObservedIntermediateBigIntBits = 0;

    for (const [boundaryIndex, boundarySource] of source.boundaryClassifications.entries()) {
      const boundary = partition.boundaries[boundaryIndex];
      const delta = source.boundaryCellStaticDeltaLedger.boundaryDeltas[boundaryIndex];
      if (
        boundary === undefined ||
        delta === undefined ||
        boundarySource.boundary !== boundary ||
        boundarySource.boundaryCellStaticDelta !== delta ||
        boundary.boundaryIndex !== boundaryIndex ||
        delta.boundaryIndex !== boundaryIndex
      ) {
        return failure([
          issue(
            'side-history-join',
            `$.boundarySideSignHistories[${String(boundaryIndex)}]`,
            'boundary-side-source-mismatch',
            'one finite-root boundary row is not joined to its canonical partition and delta row',
          ),
        ]);
      }
      const histories: SingleHingeRationalScheduleFiniteRootSideSignHistoryV1[] = [];
      const boundaryCounters = emptyCounters();
      let boundarySideSignEvaluationCount = 0;
      let boundaryRetainedBits = 0;

      for (const [
        boundaryOccurrenceIndex,
        classification,
      ] of boundarySource.occurrenceClassifications.entries()) {
        const rowPath = `$.boundarySideSignHistories[${String(boundaryIndex)}].occurrenceSideSignHistories[${String(boundaryOccurrenceIndex)}]`;
        if (
          !classificationMatchesCanonicalSource(
            classification,
            globalSideHistoryIndex,
            boundaryIndex,
            boundaryOccurrenceIndex,
            source,
          )
        ) {
          return failure([
            issue(
              'side-history-join',
              rowPath,
              'finite-root-classification-source-mismatch',
              'one classification row is not the canonical owned occurrence and root',
            ),
          ]);
        }
        const event = rootCensus.events[classification.occurrence.eventIndex];
        const degree = event?.polynomial.polynomialDegree;
        if (
          event === undefined ||
          typeof degree !== 'number' ||
          event.polynomial.identicallyZero ||
          event.polynomial.primitiveIntegerCoefficientsLowToHigh.length !== degree + 1 ||
          (boundary.location === 'start' && event.polynomial.startSign !== 0) ||
          (boundary.location === 'end' && event.polynomial.endSign !== 0)
        ) {
          return failure([
            issue(
              'side-history-join',
              rowPath,
              'defining-event-polynomial-source-mismatch',
              'one finite occurrence is not bound to a nonpersistent defining polynomial root',
            ),
          ]);
        }

        let leftEvaluation: SingleHingeRationalScheduleFiniteRootPolynomialSideSignEvaluationV1 | null =
          null;
        let rightEvaluation: SingleHingeRationalScheduleFiniteRootPolynomialSideSignEvaluationV1 | null =
          null;
        for (const side of ['left', 'right'] as const) {
          const cell = side === 'left' ? delta.leftCellSample : delta.rightCellSample;
          if (cell === null) continue;
          if (!sourceCellMatchesSide(source, boundaryIndex, side, cell)) {
            return failure([
              issue(
                'side-history-join',
                `${rowPath}.${side}SideEvaluation`,
                'adjacent-open-cell-source-mismatch',
                'one side sample is not the immediate certified open cell for this boundary',
              ),
            ]);
          }
          const evaluated = evaluateSide(
            side,
            cell,
            event.polynomial.primitiveIntegerCoefficientsLowToHigh,
            degree,
          );
          if (!evaluated.ok) {
            return failure([
              issue(
                'homogeneous-evaluation',
                `${rowPath}.${side}SideEvaluation`,
                evaluated.reason === 'intermediate-bit-limit-exceeded'
                  ? 'homogeneous-intermediate-bigint-limit-exceeded'
                  : 'homogeneous-side-sign-evaluation-failed',
                evaluated.reason === 'intermediate-bit-limit-exceeded'
                  ? 'one exact homogeneous evaluation exceeded its defensive intermediate BigInt limit'
                  : 'one exact homogeneous evaluation was invalid or zero inside a certified root-free cell',
              ),
            ]);
          }
          if (side === 'left') leftEvaluation = evaluated.value;
          else rightEvaluation = evaluated.value;
        }
        const sideSignHistoryKind = historyKind(
          boundary.location,
          leftEvaluation?.signAtExactSample ?? null,
          rightEvaluation?.signAtExactSample ?? null,
        );
        const multiplicityParity =
          classification.occurrence.multiplicity % 2 === 0 ? ('even' as const) : ('odd' as const);
        if (sideSignHistoryKind === undefined) {
          return failure([
            issue(
              'side-history-join',
              rowPath,
              'root-multiplicity-side-sign-invariant-failed',
              'available side signs do not match boundary sidedness and interior root multiplicity parity',
            ),
          ]);
        }
        let interiorParityConsistent: true | null = null;
        if (boundary.location === 'interior') {
          if (leftEvaluation === null || rightEvaluation === null) {
            return failure([
              issue(
                'side-history-join',
                rowPath,
                'root-multiplicity-side-sign-invariant-failed',
                'an interior finite root must expose exact evaluations on both adjacent sides',
              ),
            ]);
          }
          const parityMatches =
            multiplicityParity === 'odd'
              ? leftEvaluation.signAtExactSample === -rightEvaluation.signAtExactSample
              : leftEvaluation.signAtExactSample === rightEvaluation.signAtExactSample;
          if (!parityMatches) {
            return failure([
              issue(
                'side-history-join',
                rowPath,
                'root-multiplicity-side-sign-invariant-failed',
                'interior side signs do not match the exact root multiplicity parity',
              ),
            ]);
          }
          interiorParityConsistent = true;
        }
        const rowEvaluationCount: 1 | 2 =
          leftEvaluation === null || rightEvaluation === null ? 1 : 2;
        const rowRetainedBits =
          (leftEvaluation?.homogeneousIntegerValueBitLength ?? 0) +
          (rightEvaluation?.homogeneousIntegerValueBitLength ?? 0);
        const rowHornerCount =
          (leftEvaluation?.homogeneousHornerCoefficientRowCount ?? 0) +
          (rightEvaluation?.homogeneousHornerCoefficientRowCount ?? 0);
        boundarySideSignEvaluationCount += rowEvaluationCount;
        boundaryRetainedBits += rowRetainedBits;
        sideSignEvaluationCount += rowEvaluationCount;
        homogeneousHornerCoefficientRowCount += rowHornerCount;
        aggregateRetainedHomogeneousValueBigIntBits += rowRetainedBits;
        maximumObservedIntermediateBigIntBits = Math.max(
          maximumObservedIntermediateBigIntBits,
          leftEvaluation?.maximumIntermediateBigIntBits ?? 0,
          rightEvaluation?.maximumIntermediateBigIntBits ?? 0,
        );
        if (
          !Number.isSafeInteger(aggregateRetainedHomogeneousValueBigIntBits) ||
          aggregateRetainedHomogeneousValueBigIntBits >
            SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxRetainedHomogeneousValueBigIntBits
        ) {
          return failure([
            issue(
              'homogeneous-evaluation',
              rowPath,
              'retained-homogeneous-bigint-bit-limit-exceeded',
              'retained exact homogeneous values exceed the defensive aggregate BigInt limit',
            ),
          ]);
        }

        incrementCounter(boundaryCounters, sideSignHistoryKind);
        const base: FiniteRootSideSignHistoryBaseV1 = {
          globalSideHistoryIndex,
          sourceGlobalClassificationIndex: classification.globalClassificationIndex,
          boundaryOccurrenceIndex,
          boundaryIndex,
          boundaryId: boundary.boundaryId,
          boundaryLocation: boundary.location,
          occurrence: classification.occurrence,
          rootMultiplicityParity: multiplicityParity,
          leftSideEvaluation: leftEvaluation,
          rightSideEvaluation: rightEvaluation,
          sideSignEvaluationCount: rowEvaluationCount,
          retainedHomogeneousValueBigIntBits: rowRetainedBits,
          sideSignHistoryKind,
          interiorPolynomialZeroBehavior:
            boundary.location !== 'interior'
              ? null
              : multiplicityParity === 'odd'
                ? ('odd-multiplicity-oriented-sign-crossing' as const)
                : ('even-multiplicity-oriented-sign-preserving-zero' as const),
          interiorMultiplicityParityConsistentWithSideSigns: interiorParityConsistent,
        };
        histories.push(
          classification.classificationKind === 'vertex-face-root-containment'
            ? {
                ...base,
                classificationKind: 'vertex-face-root-containment',
                eventKind: 'vertex-face-plane',
                rootFeatureClassification: classification.classification.classification,
              }
            : {
                ...base,
                classificationKind: 'edge-edge-algebraic-containment',
                eventKind: 'edge-edge-coplanarity',
                rootFeatureClassification: classification.classification.containmentClass,
              },
        );
        globalSideHistoryIndex += 1;
      }
      if (
        histories.length !== boundarySource.finiteRootOccurrenceCount ||
        boundarySideSignEvaluationCount !==
          histories.length * (boundary.location === 'interior' ? 2 : 1)
      ) {
        throw new TypeError('one boundary side-sign ledger is incomplete');
      }
      addCounters(aggregateCounters, boundaryCounters);
      boundarySideSignHistories.push({
        boundaryIndex,
        boundaryId: boundary.boundaryId,
        boundaryLocation: boundary.location,
        finiteRootOccurrenceCount: histories.length,
        sideSignEvaluationCount: boundarySideSignEvaluationCount,
        retainedHomogeneousValueBigIntBits: boundaryRetainedBits,
        sideSignHistoryCounters: boundaryCounters,
        occurrenceSideSignHistories: histories,
      });
    }
    if (
      globalSideHistoryIndex !== source.finiteRootOccurrenceCount ||
      sideSignEvaluationCount !== preflightSideSignEvaluationCount ||
      homogeneousHornerCoefficientRowCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS.maxHomogeneousHornerCoefficientRows
    ) {
      throw new TypeError('complete side-sign counts disagree');
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType:
          'm0f-single-hinge-rational-schedule-global-event-boundary-finite-root-side-sign-ledger' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'defining-event-polynomial-side-signs-for-all-finite-root-occurrences' as const,
        arithmetic: 'exact-homogeneous-integer-horner-at-owned-rational-open-cell-samples' as const,
        transitionRevisionId: source.transitionRevisionId,
        stepId: source.stepId,
        meshRevisionId: source.meshRevisionId,
        triangulationRevisionId: source.triangulationRevisionId,
        boundaryCount: boundarySideSignHistories.length,
        finiteRootOccurrenceCount: source.finiteRootOccurrenceCount,
        sideSignHistoryRowCount: globalSideHistoryIndex,
        sideSignEvaluationCount,
        homogeneousHornerCoefficientRowCount,
        aggregateRetainedHomogeneousValueBigIntBits,
        maximumObservedIntermediateBigIntBits,
        sideSignHistoryCounters: aggregateCounters,
        boundarySideSignHistories,
        finiteRootClassificationLedger: source,
        sourceFiniteRootClassificationLedgerSingleOwnedSnapshotCompositionReused: true as const,
        everyGlobalBoundaryJoinedExactlyOnce: true as const,
        everyFiniteRootOccurrenceJoinedExactlyOnceInCanonicalOrder: true as const,
        everyAvailableAdjacentCellSampleEvaluatedExactlyOncePerOccurrence: true as const,
        allSideEvaluationsBoundToDefiningEventAndAdjacentOpenCell: true as const,
        exactHomogeneousIntegerEvaluationAtEveryAvailableSideSample: true as const,
        everyAdjacentOpenCellFiniteEventPolynomialSignConstant: true as const,
        everyInteriorRootMultiplicityParityMatchesSideSigns: true as const,
        endpointHistoriesOneSidedOnly: true as const,
        orientedEventPolynomialSideHistoryIncluded: true as const,
        rootFeatureClassificationEvidenceRetainedOnlyInCentralSource: true as const,
        sampleSideStaticDeltasRetainedOnlyInCentralSource: true as const,
        persistentEventsRetainedOnlyInCentralSource: true as const,
        persistentEventSubdivisionIncluded: false as const,
        eventOccurrenceDeduplicationIncluded: false as const,
        approachSeparationHistoryIncluded: false as const,
        geometricApproachSeparationEstablished: false as const,
        polynomialMagnitudeMonotonicityEstablished: false as const,
        openCellStrataConstancyEstablished: false as const,
        sampleDifferenceOccursAtBoundaryEstablished: false as const,
        collisionEventCompletenessEstablished: false as const,
        continuousCollisionDetectionIncluded: false as const,
        legalContactPolicyIncluded: false as const,
        selfIntersectionDecisionIncluded: false as const,
        collisionFreeClaim: false as const,
        callerRevisionLabelsOnly: true as const,
        exactSourceReconstructionGeometryEqualityChecked: false as const,
        cryptographicSourceRevisionBindingIncluded: false as const,
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
        'side-history-join',
        '$',
        'finite-root-side-sign-ledger-invariant-failed',
        'global boundary finite-root side-sign assembly failed closed unexpectedly',
      ),
    ]);
  }
}
