import { beforeAll, describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS,
  type ExactRational,
  type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerRecordV1,
} from '../../m0f/index.js';
import {
  makeFourFaceCollinearOverlapTransitionFixture,
  makeFourFaceInteriorCollinearOverlapEvenRootTransitionFixture,
} from './fixtures/four-face-collinear-overlap-fixture.js';
import { makeTwoFaceQuarterTransitionFixture } from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

function analyze(
  supplied: unknown,
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerRecordV1 {
  const result =
    analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('finite-root side-sign ledger fixture must succeed');
  return result.value;
}

function integerPower(base: bigint, exponent: number): bigint {
  let value = 1n;
  for (let index = 0; index < exponent; index += 1) value *= base;
  return value;
}

/** Independent direct homogenization oracle, not the producer's Horner recurrence. */
function directlyHomogenizedValue(
  coefficientsLowToHigh: readonly bigint[],
  sample: ExactRational,
): bigint {
  const degree = coefficientsLowToHigh.length - 1;
  return coefficientsLowToHigh.reduce(
    (sum, coefficient, coefficientIndex) =>
      sum +
      coefficient *
        integerPower(sample.numerator, coefficientIndex) *
        integerPower(sample.denominator, degree - coefficientIndex),
    0n,
  );
}

function derivativeCoefficients(coefficientsLowToHigh: readonly bigint[]): readonly bigint[] {
  return coefficientsLowToHigh
    .slice(1)
    .map((coefficient, index) => coefficient * BigInt(index + 1));
}

describe('single-hinge global event-boundary finite-root side-sign ledger candidate', () => {
  let twoFace: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerRecordV1;
  let symmetric: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerRecordV1;

  beforeAll(() => {
    twoFace = analyze(makeTwoFaceQuarterTransitionFixture());
    symmetric = analyze(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
  });

  it('publishes bounded exact-evaluation work and retained-value limits', () => {
    expect(
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS,
    ).toEqual({
      maxBoundaryRows: 4_097,
      maxFiniteRootSideHistoryRows: 4_096,
      maxSideSignEvaluationRows: 8_192,
      maxHomogeneousHornerCoefficientRows: 57_344,
      maxHomogeneousIntermediateBigIntBits: 286_730,
      maxRetainedHomogeneousValueBigIntBits: 16_777_216,
      maxPolynomialDegree: 6,
    });
    expect(
      Object.isFrozen(
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_SIDE_SIGN_LIMITS,
      ),
    ).toBe(true);
  });

  it('records the exact one-sided two-face start-root oracle', () => {
    expect(twoFace).toMatchObject({
      recordType:
        'm0f-single-hinge-rational-schedule-global-event-boundary-finite-root-side-sign-ledger',
      contractStatus: 'candidate-no-claim',
      boundaryCount: 2,
      finiteRootOccurrenceCount: 30,
      sideSignHistoryRowCount: 30,
      sideSignEvaluationCount: 30,
      homogeneousHornerCoefficientRowCount: 180,
      aggregateRetainedHomogeneousValueBigIntBits: 150,
      maximumObservedIntermediateBigIntBits: 6,
      sideSignHistoryCounters: {
        startRightNegativeCount: 21,
        startRightPositiveCount: 9,
        interiorNegativeToPositiveCount: 0,
        interiorPositiveToNegativeCount: 0,
        interiorNegativeOnBothSidesCount: 0,
        interiorPositiveOnBothSidesCount: 0,
        endLeftNegativeCount: 0,
        endLeftPositiveCount: 0,
      },
    });
    expect(
      twoFace.boundarySideSignHistories.map((boundary) => ({
        id: boundary.boundaryId,
        occurrences: boundary.finiteRootOccurrenceCount,
        evaluations: boundary.sideSignEvaluationCount,
        retainedBits: boundary.retainedHomogeneousValueBigIntBits,
      })),
    ).toEqual([
      {
        id: 'event-boundary:start',
        occurrences: 30,
        evaluations: 30,
        retainedBits: 150,
      },
      {
        id: 'event-boundary:end',
        occurrences: 0,
        evaluations: 0,
        retainedBits: 0,
      },
    ]);
    const rows = twoFace.boundarySideSignHistories[0]?.occurrenceSideSignHistories ?? [];
    expect(rows.filter((row) => row.sideSignHistoryKind === 'start-right-negative')).toHaveLength(
      21,
    );
    expect(rows.filter((row) => row.sideSignHistoryKind === 'start-right-positive')).toHaveLength(
      9,
    );
    for (const row of rows) {
      expect(row.leftSideEvaluation).toBeNull();
      expect(row.rightSideEvaluation?.signAtExactSample).not.toBe(0);
      expect(row.rootMultiplicityParity).toBe('odd');
      expect(row.interiorPolynomialZeroBehavior).toBeNull();
      expect(row.interiorMultiplicityParityConsistentWithSideSigns).toBeNull();
    }
  });

  it('records both sides of every symmetric interior root and verifies odd parity', () => {
    expect(symmetric).toMatchObject({
      boundaryCount: 3,
      finiteRootOccurrenceCount: 82,
      sideSignHistoryRowCount: 82,
      sideSignEvaluationCount: 94,
      homogeneousHornerCoefficientRowCount: 616,
      aggregateRetainedHomogeneousValueBigIntBits: 1_830,
      maximumObservedIntermediateBigIntBits: 31,
      sideSignHistoryCounters: {
        startRightNegativeCount: 35,
        startRightPositiveCount: 23,
        interiorNegativeToPositiveCount: 3,
        interiorPositiveToNegativeCount: 9,
        interiorNegativeOnBothSidesCount: 0,
        interiorPositiveOnBothSidesCount: 0,
        endLeftNegativeCount: 3,
        endLeftPositiveCount: 9,
      },
    });
    expect(
      symmetric.boundarySideSignHistories.map((boundary) => ({
        id: boundary.boundaryId,
        occurrences: boundary.finiteRootOccurrenceCount,
        evaluations: boundary.sideSignEvaluationCount,
        retainedBits: boundary.retainedHomogeneousValueBigIntBits,
      })),
    ).toEqual([
      {
        id: 'event-boundary:start',
        occurrences: 58,
        evaluations: 58,
        retainedBits: 906,
      },
      {
        id: 'event-boundary:interior:0',
        occurrences: 12,
        evaluations: 24,
        retainedBits: 636,
      },
      {
        id: 'event-boundary:end',
        occurrences: 12,
        evaluations: 12,
        retainedBits: 288,
      },
    ]);

    const interior = symmetric.boundarySideSignHistories[1];
    if (interior === undefined) throw new TypeError('symmetric interior boundary must exist');
    expect(
      interior.occurrenceSideSignHistories.filter(
        (row) => row.sideSignHistoryKind === 'interior-positive-to-negative',
      ),
    ).toHaveLength(9);
    expect(
      interior.occurrenceSideSignHistories.filter(
        (row) => row.sideSignHistoryKind === 'interior-negative-to-positive',
      ),
    ).toHaveLength(3);
    for (const row of interior.occurrenceSideSignHistories) {
      expect(row.leftSideEvaluation).not.toBeNull();
      expect(row.rightSideEvaluation).not.toBeNull();
      expect(row.leftSideEvaluation?.signAtExactSample).toBe(
        -(row.rightSideEvaluation?.signAtExactSample ?? 0),
      );
      expect(row.rootMultiplicityParity).toBe('odd');
      expect(row.interiorPolynomialZeroBehavior).toBe('odd-multiplicity-oriented-sign-crossing');
      expect(row.interiorMultiplicityParityConsistentWithSideSigns).toBe(true);
    }

    const changedPairIndexes = new Set(
      symmetric.finiteRootClassificationLedger.boundaryCellStaticDeltaLedger.boundaryDeltas[1]?.changedPairs.map(
        (pair) => pair.pairIndex,
      ),
    );
    expect(
      interior.occurrenceSideSignHistories.filter((row) =>
        changedPairIndexes.has(row.occurrence.pairIndex),
      ),
    ).toHaveLength(11);
    expect(
      interior.occurrenceSideSignHistories.filter(
        (row) => !changedPairIndexes.has(row.occurrence.pairIndex),
      ),
    ).toHaveLength(1);
  });

  it('keeps even endpoint multiplicity one-sided for the four collinear-overlap roots', () => {
    const collinear = analyze(makeFourFaceCollinearOverlapTransitionFixture());
    const startRows = collinear.boundarySideSignHistories[0]?.occurrenceSideSignHistories;
    if (startRows === undefined) throw new TypeError('collinear start boundary must exist');
    const overlapRows = startRows.filter(
      (row) => row.rootFeatureClassification === 'collinear-overlap',
    );
    expect(overlapRows).toHaveLength(4);
    expect(overlapRows.map((row) => row.occurrence.eventId)).toEqual([
      'ee:5:2:2',
      'ee:6:2:2',
      'ee:11:2:2',
      'ee:12:2:2',
    ]);
    expect(overlapRows.map((row) => row.rightSideEvaluation?.signAtExactSample)).toEqual([
      1, -1, -1, 1,
    ]);
    for (const row of overlapRows) {
      expect(row).toMatchObject({
        classificationKind: 'edge-edge-algebraic-containment',
        eventKind: 'edge-edge-coplanarity',
        boundaryLocation: 'start',
        occurrence: { rootIndex: 0, multiplicity: 2 },
        rootMultiplicityParity: 'even',
        leftSideEvaluation: null,
        sideSignEvaluationCount: 1,
        rootFeatureClassification: 'collinear-overlap',
        interiorPolynomialZeroBehavior: null,
        interiorMultiplicityParityConsistentWithSideSigns: null,
      });
      const sourceRow =
        collinear.finiteRootClassificationLedger.boundaryClassifications[0]
          ?.occurrenceClassifications[row.boundaryOccurrenceIndex];
      expect(sourceRow?.classificationKind).toBe('edge-edge-algebraic-containment');
      if (sourceRow?.classificationKind !== 'edge-edge-algebraic-containment') {
        throw new TypeError('collinear source classification must be edge-edge');
      }
      expect(sourceRow.classification).toMatchObject({
        directionRelation: 'collinear',
        containmentClass: 'collinear-overlap',
      });
    }
  });

  it('exercises same-sign even multiplicity at an interior loopback root', () => {
    const interiorEven = analyze(makeFourFaceInteriorCollinearOverlapEvenRootTransitionFixture());
    expect(interiorEven).toMatchObject({
      boundaryCount: 6,
      finiteRootOccurrenceCount: 166,
      sideSignHistoryRowCount: 166,
      sideSignEvaluationCount: 330,
      sideSignHistoryCounters: {
        startRightNegativeCount: 1,
        startRightPositiveCount: 1,
        interiorNegativeToPositiveCount: 83,
        interiorPositiveToNegativeCount: 41,
        interiorNegativeOnBothSidesCount: 29,
        interiorPositiveOnBothSidesCount: 11,
        endLeftNegativeCount: 0,
        endLeftPositiveCount: 0,
      },
    });
    const boundary = interiorEven.boundarySideSignHistories.find(
      (entry) => entry.boundaryId === 'event-boundary:interior:0',
    );
    if (boundary === undefined) throw new TypeError('interior even-root boundary must exist');
    expect(boundary).toMatchObject({
      boundaryLocation: 'interior',
      finiteRootOccurrenceCount: 102,
      sideSignEvaluationCount: 204,
      sideSignHistoryCounters: {
        interiorNegativeToPositiveCount: 40,
        interiorPositiveToNegativeCount: 22,
        interiorNegativeOnBothSidesCount: 29,
        interiorPositiveOnBothSidesCount: 11,
      },
    });
    const evenRows = boundary.occurrenceSideSignHistories.filter(
      (row) => row.rootMultiplicityParity === 'even',
    );
    expect(evenRows).toHaveLength(40);
    for (const row of evenRows) {
      expect(row.occurrence.multiplicity).toBe(2);
      expect(row.leftSideEvaluation?.signAtExactSample).toBe(
        row.rightSideEvaluation?.signAtExactSample,
      );
      expect(row.interiorPolynomialZeroBehavior).toBe(
        'even-multiplicity-oriented-sign-preserving-zero',
      );
      expect(row.interiorMultiplicityParityConsistentWithSideSigns).toBe(true);
    }

    const overlapRows = evenRows.filter(
      (row) => row.rootFeatureClassification === 'collinear-overlap',
    );
    expect(overlapRows.map((row) => row.occurrence.eventId)).toEqual([
      'ee:5:2:2',
      'ee:6:2:2',
      'ee:11:2:2',
      'ee:12:2:2',
    ]);
    expect(
      overlapRows.map((row) => [
        row.leftSideEvaluation?.signAtExactSample,
        row.rightSideEvaluation?.signAtExactSample,
      ]),
    ).toEqual([
      [1, 1],
      [-1, -1],
      [-1, -1],
      [1, 1],
    ]);

    const rootCensus =
      interiorEven.finiteRootClassificationLedger.boundaryCellStaticDeltaLedger.cellStaticSamples
        .eventTimePartition.eventRootCensus;
    const exactLoopbackNormalizedTime = { numerator: 3n, denominator: 8n } as const;
    for (const row of overlapRows) {
      const event = rootCensus.events[row.occurrence.eventIndex];
      if (event === undefined) throw new TypeError('interior even source event must exist');
      const coefficients = event.polynomial.primitiveIntegerCoefficientsLowToHigh;
      const firstDerivative = derivativeCoefficients(coefficients);
      const secondDerivative = derivativeCoefficients(firstDerivative);
      expect(directlyHomogenizedValue(coefficients, exactLoopbackNormalizedTime)).toBe(0n);
      expect(directlyHomogenizedValue(firstDerivative, exactLoopbackNormalizedTime)).toBe(0n);
      expect(directlyHomogenizedValue(secondDerivative, exactLoopbackNormalizedTime)).not.toBe(0n);
      expect(event.isolation.roots[row.occurrence.rootIndex]).toMatchObject({
        location: 'interior',
        multiplicity: 2,
      });
      const sourceRow =
        interiorEven.finiteRootClassificationLedger.boundaryClassifications[row.boundaryIndex]
          ?.occurrenceClassifications[row.boundaryOccurrenceIndex];
      expect(sourceRow?.classificationKind).toBe('edge-edge-algebraic-containment');
      if (sourceRow?.classificationKind !== 'edge-edge-algebraic-containment') {
        throw new TypeError('interior collinear source classification must be edge-edge');
      }
      expect(sourceRow.classification).toMatchObject({
        directionRelation: 'collinear',
        containmentClass: 'collinear-overlap',
      });
    }
  });

  it('matches an independent direct homogeneous evaluation and every central source join', () => {
    const source = symmetric.finiteRootClassificationLedger;
    const partition = source.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition;
    let globalIndex = 0;
    for (const [boundaryIndex, boundary] of symmetric.boundarySideSignHistories.entries()) {
      const sourceBoundary = source.boundaryClassifications[boundaryIndex];
      const delta = source.boundaryCellStaticDeltaLedger.boundaryDeltas[boundaryIndex];
      if (sourceBoundary === undefined || delta === undefined) {
        throw new TypeError('central source boundary must exist');
      }
      for (const [occurrenceIndex, row] of boundary.occurrenceSideSignHistories.entries()) {
        const sourceRow = sourceBoundary.occurrenceClassifications[occurrenceIndex];
        const event = partition.eventRootCensus.events[row.occurrence.eventIndex];
        if (sourceRow === undefined || event === undefined) {
          throw new TypeError('central occurrence and event must exist');
        }
        expect(row.globalSideHistoryIndex).toBe(globalIndex);
        expect(row.sourceGlobalClassificationIndex).toBe(sourceRow.globalClassificationIndex);
        expect(row.occurrence).toBe(sourceRow.occurrence);
        expect(row.rootFeatureClassification).toBe(
          sourceRow.classificationKind === 'vertex-face-root-containment'
            ? sourceRow.classification.classification
            : sourceRow.classification.containmentClass,
        );
        for (const evaluation of [row.leftSideEvaluation, row.rightSideEvaluation]) {
          if (evaluation === null) continue;
          const cell = evaluation.side === 'left' ? delta.leftCellSample : delta.rightCellSample;
          if (cell === null) throw new TypeError('evaluated source cell must exist');
          const direct = directlyHomogenizedValue(
            event.polynomial.primitiveIntegerCoefficientsLowToHigh,
            cell.openCell.normalizedSampleTime,
          );
          expect(evaluation.cellIndex).toBe(cell.cellIndex);
          expect(evaluation.cellId).toBe(cell.cellId);
          expect(evaluation.openCellId).toBe(cell.openCell.cellId);
          expect(evaluation.homogeneousIntegerValue).toBe(direct);
          expect(evaluation.signAtExactSample).toBe(direct < 0n ? -1 : 1);
          expect(evaluation.homogeneousHornerCoefficientRowCount).toBe(
            event.polynomial.primitiveIntegerCoefficientsLowToHigh.length,
          );
          expect(evaluation).toMatchObject({
            homogeneousIdentity: 'denominator^degree-times-polynomial-at-normalized-sample',
            sourceSampleIsCanonicalDyadicActualTime: true,
            sourceOpenCellFiniteEventPolynomialRootFree: true,
            signConstantOnEntireSourceOpenCell: true,
          });
        }
        globalIndex += 1;
      }
    }
    expect(globalIndex).toBe(symmetric.finiteRootOccurrenceCount);
  });

  it('deep-freezes evidence, preserves the no-claim boundary, and rejects hostile input', () => {
    expect(Object.isFrozen(symmetric)).toBe(true);
    expect(Object.isFrozen(symmetric.boundarySideSignHistories)).toBe(true);
    expect(Object.isFrozen(symmetric.boundarySideSignHistories[1])).toBe(true);
    expect(
      Object.isFrozen(
        symmetric.boundarySideSignHistories[1]?.occurrenceSideSignHistories[0]?.leftSideEvaluation,
      ),
    ).toBe(true);
    expect(Object.isFrozen(symmetric.finiteRootClassificationLedger)).toBe(true);
    expect(symmetric).toMatchObject({
      sourceFiniteRootClassificationLedgerSingleOwnedSnapshotCompositionReused: true,
      everyGlobalBoundaryJoinedExactlyOnce: true,
      everyFiniteRootOccurrenceJoinedExactlyOnceInCanonicalOrder: true,
      everyAvailableAdjacentCellSampleEvaluatedExactlyOncePerOccurrence: true,
      allSideEvaluationsBoundToDefiningEventAndAdjacentOpenCell: true,
      exactHomogeneousIntegerEvaluationAtEveryAvailableSideSample: true,
      everyAdjacentOpenCellFiniteEventPolynomialSignConstant: true,
      everyInteriorRootMultiplicityParityMatchesSideSigns: true,
      endpointHistoriesOneSidedOnly: true,
      orientedEventPolynomialSideHistoryIncluded: true,
      rootFeatureClassificationEvidenceRetainedOnlyInCentralSource: true,
      sampleSideStaticDeltasRetainedOnlyInCentralSource: true,
      persistentEventsRetainedOnlyInCentralSource: true,
      persistentEventSubdivisionIncluded: false,
      eventOccurrenceDeduplicationIncluded: false,
      approachSeparationHistoryIncluded: false,
      geometricApproachSeparationEstablished: false,
      polynomialMagnitudeMonotonicityEstablished: false,
      openCellStrataConstancyEstablished: false,
      sampleDifferenceOccursAtBoundaryEstablished: false,
      collisionEventCompletenessEstablished: false,
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

    const hostile = makeTwoFaceQuarterTransitionFixture();
    Object.defineProperty(hostile, 'stepId', {
      enumerable: true,
      configurable: true,
      get() {
        throw new TypeError('hostile accessor must not be invoked');
      },
    });
    const rejected =
      analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootSideSignLedgerV1(hostile);
    expect(rejected).toEqual({
      ok: false,
      error: [
        {
          stage: 'finite-root-classification-ledger',
          path: '$.finiteRootClassificationLedger.boundaryCellStaticDeltaLedger',
          code: 'invalid-source-snapshot',
          message: 'transition input must be one bounded acyclic accessor-free plain-data snapshot',
        },
      ],
    });
    expect(Object.isFrozen(rejected)).toBe(true);
    if (rejected.ok) throw new TypeError('hostile input must fail closed');
    expect(Object.isFrozen(rejected.error)).toBe(true);
    expect(Object.isFrozen(rejected.error[0])).toBe(true);
  });
});
