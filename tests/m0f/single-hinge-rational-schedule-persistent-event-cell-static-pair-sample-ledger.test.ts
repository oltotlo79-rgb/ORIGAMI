import { describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS,
  type SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerRecordV1,
  type SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1,
} from '../../m0f/geometry/single-hinge-rational-schedule-persistent-event-cell-static-pair-sample-ledger.js';
import { makeFourFaceCollinearOverlapTransitionFixture } from './fixtures/four-face-collinear-overlap-fixture.js';
import { makeTwoFaceQuarterTransitionFixture } from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

const ZERO_COUNTERS = {
  disjointObservationCount: 0,
  sameFaceTriangulationContactCandidateObservationCount: 0,
  sameFaceUnexpectedIntersectionEvidenceObservationCount: 0,
  declaredHingeContactContainedCandidateObservationCount: 0,
  declaredHingeOffAxisIntersectionEvidenceObservationCount: 0,
  nonadjacentStaticInteriorCrossingEvidenceObservationCount: 0,
  nonadjacentContactRequiresMotionHistoryObservationCount: 0,
  nonadjacentCoplanarAreaRequiresLayerOrderObservationCount: 0,
} as const satisfies SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;

const TWO_FACE_COUNTERS = {
  ...ZERO_COUNTERS,
  disjointObservationCount: 3,
  declaredHingeContactContainedCandidateObservationCount: 27,
} as const satisfies SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;

const SYMMETRIC_AGGREGATE_COUNTERS = {
  ...ZERO_COUNTERS,
  disjointObservationCount: 19,
  declaredHingeContactContainedCandidateObservationCount: 108,
  nonadjacentStaticInteriorCrossingEvidenceObservationCount: 5,
} as const satisfies SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;

const SYMMETRIC_LEFT_CELL_COUNTERS = {
  ...ZERO_COUNTERS,
  disjointObservationCount: 7,
  declaredHingeContactContainedCandidateObservationCount: 54,
  nonadjacentStaticInteriorCrossingEvidenceObservationCount: 5,
} as const satisfies SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;

const SYMMETRIC_RIGHT_CELL_COUNTERS = {
  ...ZERO_COUNTERS,
  disjointObservationCount: 12,
  declaredHingeContactContainedCandidateObservationCount: 54,
} as const satisfies SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;

function analyze(
  supplied: unknown = makeTwoFaceQuarterTransitionFixture(),
): SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerRecordV1 {
  const result =
    analyzeSingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('persistent event-cell static-pair fixture must succeed');
  return result.value;
}

describe('single-hinge persistent zero-event cell-static pair sample ledger candidate', () => {
  it('publishes frozen defensive row limits including the complete event-by-cell product cap', () => {
    expect(SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS).toEqual({
      maxPersistentEventRows: 4_096,
      maxPersistentPairRows: 2_016,
      maxOpenCellRows: 4_096,
      maxPersistentEventCellObservationRows: 4_096,
    });
    expect(
      Object.isFrozen(
        SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS,
      ),
    ).toBe(true);
  });

  it('records the complete two-face persistent zero identity and sole-cell pair evidence', () => {
    const record = analyze();
    expect(record).toMatchObject({
      recordType:
        'm0f-single-hinge-rational-schedule-persistent-event-cell-static-pair-sample-ledger',
      contractStatus: 'candidate-no-claim',
      persistentEventCount: 30,
      persistentVertexFaceEventCount: 12,
      persistentEdgeEdgeEventCount: 18,
      persistentPairCount: 4,
      openCellSampleCount: 1,
      persistentEventCellObservationCount: 30,
      persistentEventsWithStaticPairCategoryVariationCount: 0,
      staticPairCategoryCounters: TWO_FACE_COUNTERS,
    });
    expect(record.cellCounters).toEqual([
      {
        cellIndex: 0,
        cellId: 'event-open-cell:0',
        persistentEventObservationCount: 30,
        persistentVertexFaceObservationCount: 12,
        persistentEdgeEdgeObservationCount: 18,
        staticPairCategoryCounters: TWO_FACE_COUNTERS,
      },
    ]);
    for (const row of record.persistentEventRows) {
      expect(row).toMatchObject({
        primitiveIntegerCoefficientsLowToHigh: [0n],
        polynomialDegree: null,
        rootSetKind: 'entire-unit-interval',
        everyUnitIntervalPointIsDefiningPolynomialRoot: true,
        persistentPolynomialIdentityJoinedExactly: true,
        observationCount: 1,
        distinctObservedStaticPairCategoryCount: 1,
        staticPairCategoryVariesAcrossSampledCells: false,
      });
    }
  });

  it('retains the symmetric fixture five-category variation oracle without claiming constancy', () => {
    const record = analyze(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
    expect(record).toMatchObject({
      persistentEventCount: 66,
      persistentVertexFaceEventCount: 24,
      persistentEdgeEdgeEventCount: 42,
      persistentPairCount: 12,
      openCellSampleCount: 2,
      persistentEventCellObservationCount: 132,
      persistentEventsWithStaticPairCategoryVariationCount: 5,
      staticPairCategoryCounters: SYMMETRIC_AGGREGATE_COUNTERS,
    });
    expect(record.cellCounters).toEqual([
      {
        cellIndex: 0,
        cellId: 'event-open-cell:0',
        persistentEventObservationCount: 66,
        persistentVertexFaceObservationCount: 24,
        persistentEdgeEdgeObservationCount: 42,
        staticPairCategoryCounters: SYMMETRIC_LEFT_CELL_COUNTERS,
      },
      {
        cellIndex: 1,
        cellId: 'event-open-cell:1',
        persistentEventObservationCount: 66,
        persistentVertexFaceObservationCount: 24,
        persistentEdgeEdgeObservationCount: 42,
        staticPairCategoryCounters: SYMMETRIC_RIGHT_CELL_COUNTERS,
      },
    ]);

    expect(
      record.persistentEventRows
        .filter((row) => row.staticPairCategoryVariesAcrossSampledCells)
        .map((row) => ({
          eventId: row.eventId,
          eventKind: row.eventKind,
          pairIndex: row.pairIndex,
          categories: row.cellObservations.map(
            (observation) => observation.staticPairSignature.category,
          ),
        })),
    ).toEqual([
      {
        eventId: 'ee:3:0:0',
        eventKind: 'edge-edge-coplanarity',
        pairIndex: 3,
        categories: ['nonadjacent-static-interior-crossing-evidence', 'disjoint'],
      },
      {
        eventId: 'ee:3:1:1',
        eventKind: 'edge-edge-coplanarity',
        pairIndex: 3,
        categories: ['nonadjacent-static-interior-crossing-evidence', 'disjoint'],
      },
      {
        eventId: 'ee:4:1:1',
        eventKind: 'edge-edge-coplanarity',
        pairIndex: 4,
        categories: ['nonadjacent-static-interior-crossing-evidence', 'disjoint'],
      },
      {
        eventId: 'ee:8:0:0',
        eventKind: 'edge-edge-coplanarity',
        pairIndex: 8,
        categories: ['nonadjacent-static-interior-crossing-evidence', 'disjoint'],
      },
      {
        eventId: 'ee:8:1:1',
        eventKind: 'edge-edge-coplanarity',
        pairIndex: 8,
        categories: ['nonadjacent-static-interior-crossing-evidence', 'disjoint'],
      },
    ]);
  });

  it('keeps the larger four-face complete product within the bounded ledger', () => {
    const record = analyze(makeFourFaceCollinearOverlapTransitionFixture());
    expect(record).toMatchObject({
      persistentEventCount: 108,
      persistentVertexFaceEventCount: 36,
      persistentEdgeEdgeEventCount: 72,
      persistentPairCount: 24,
      openCellSampleCount: 5,
      persistentEventCellObservationCount: 540,
      persistentEventsWithStaticPairCategoryVariationCount: 6,
      staticPairCategoryCounters: {
        ...ZERO_COUNTERS,
        disjointObservationCount: 125,
        declaredHingeContactContainedCandidateObservationCount: 405,
        nonadjacentStaticInteriorCrossingEvidenceObservationCount: 10,
      },
    });
    expect(record.persistentEventCellObservationCount).toBeLessThanOrEqual(
      SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS.maxPersistentEventCellObservationRows,
    );
  });

  it('joins every row and observation back to the canonical census, partition, refinement, and pair', () => {
    const record = analyze(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
    const source = record.globalEventCellStaticSamples;
    const partition = source.eventTimePartition;
    const persistentCensusEvents = partition.eventRootCensus.events.filter(
      (event) => event.persistentOnEntireUnitInterval,
    );
    expect(source.cellSamples).toHaveLength(partition.openCellCount);
    expect(partition.openCells).toHaveLength(partition.openCellCount);
    expect(record.persistentEventRows).toHaveLength(persistentCensusEvents.length);

    let expectedGlobalObservationIndex = 0;
    for (const [persistentRowIndex, row] of record.persistentEventRows.entries()) {
      const event = persistentCensusEvents[persistentRowIndex];
      const partitionEvent = partition.persistentEvents[persistentRowIndex];
      const refinement = partition.rootRefinement.persistentPolynomials[persistentRowIndex];
      if (event === undefined || partitionEvent === undefined || refinement === undefined) {
        throw new TypeError('all persistent identity sources must exist');
      }
      expect(row).toMatchObject({
        persistentEventIndex: persistentRowIndex,
        eventIndex: event.eventIndex,
        eventId: event.eventId,
        pairIndex: event.pairIndex,
        firstTriangleId: event.firstTriangleId,
        secondTriangleId: event.secondTriangleId,
        eventKind: event.eventKind,
        topologyRelation: event.polynomial.topologyRelation,
        partitionPersistentEventRowIndex: persistentRowIndex,
        rootRefinementPersistentRowIndex: persistentRowIndex,
        rootRefinementPolynomialIndex: event.eventIndex,
      });
      expect(partitionEvent).toMatchObject({
        eventIndex: event.eventIndex,
        eventId: event.eventId,
        pairIndex: event.pairIndex,
        firstTriangleId: event.firstTriangleId,
        secondTriangleId: event.secondTriangleId,
        eventKind: event.eventKind,
      });
      expect(refinement).toMatchObject({
        polynomialIndex: event.eventIndex,
        polynomialId: event.eventId,
        rootSetKind: 'entire-unit-interval',
      });
      expect(event.polynomial.primitiveIntegerCoefficientsLowToHigh).toEqual([0n]);
      expect(event.isolation.primitiveIntegerCoefficientsLowToHigh).toEqual([0n]);

      for (const [cellIndex, observation] of row.cellObservations.entries()) {
        const cell = source.cellSamples[cellIndex];
        const pair = cell?.staticSample.strata.pairs[event.pairIndex];
        if (cell === undefined || pair === undefined) {
          throw new TypeError('every persistent observation must join to a source pair');
        }
        const strata = pair.strata.strata;
        expect(cell.openCell).toBe(partition.openCells[cellIndex]);
        expect(pair.topology).toBe(cell.staticSample.strata.binding.pairs[event.pairIndex]);
        expect(observation).toMatchObject({
          globalObservationIndex: expectedGlobalObservationIndex,
          eventObservationIndex: cellIndex,
          cellIndex,
          cellId: cell.cellId,
          sampleRevisionId: cell.sampleRevisionId,
          sourcePairIndex: pair.pairIndex,
          firstTriangleId: pair.firstTriangleId,
          secondTriangleId: pair.secondTriangleId,
          firstFaceId: pair.firstFaceId,
          secondFaceId: pair.secondFaceId,
          topologyRelation: event.polynomial.topologyRelation,
          staticPairSignature: {
            category: pair.category,
            character: strata.character,
            triangleARelativeLocation: strata.triangleARelativeLocation,
            triangleBRelativeLocation: strata.triangleBRelativeLocation,
            relativeLocationSample: strata.relativeLocationSample,
            supportingPlaneRelation: strata.locus.supportingPlaneRelation,
            locusKind: strata.locus.locusKind,
            declaredHingeLocusContained: pair.declaredHingeLocusContained,
            sharedTriangulationFeatureLocusContained: pair.sharedTriangulationFeatureLocusContained,
            staticNonadjacentInteriorCrossingDetected:
              pair.staticNonadjacentInteriorCrossingDetected,
            staticInteriorInteriorIntersectionDetected:
              strata.staticInteriorInteriorIntersectionDetected,
            staticContactCandidate: strata.staticContactCandidate,
            coplanarAreaOverlapDetected: strata.coplanarAreaOverlapDetected,
            requiresMotionSideHistory: strata.requiresMotionSideHistory,
            requiresLayerOrder: strata.requiresLayerOrder,
          },
          sourceSampleIsCanonicalDyadicActualTime: true,
          sourceStaticPairEvaluatedWithExactProjectiveRationalArithmetic: true,
        });
        expectedGlobalObservationIndex += 1;
      }
    }
    expect(expectedGlobalObservationIndex).toBe(record.persistentEventCellObservationCount);
  });

  it('fails closed on accessors and deeply freezes evidence inside an explicit no-claim boundary', () => {
    const accessorInput = makeTwoFaceQuarterTransitionFixture();
    Object.defineProperty(accessorInput, 'stepId', {
      enumerable: true,
      configurable: true,
      get() {
        throw new TypeError('caller accessor must never be invoked');
      },
    });
    const rejected =
      analyzeSingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerV1(accessorInput);
    expect(rejected).toEqual({
      ok: false,
      error: [
        {
          stage: 'global-event-cell-static-samples',
          path: '$.globalEventCellStaticSamples',
          code: 'invalid-source-snapshot',
          message: 'transition input must be one bounded acyclic accessor-free plain-data snapshot',
        },
      ],
    });
    expect(Object.isFrozen(rejected)).toBe(true);
    if (rejected.ok) throw new TypeError('accessor input must fail closed');
    expect(Object.isFrozen(rejected.error)).toBe(true);
    expect(Object.isFrozen(rejected.error[0])).toBe(true);

    const result = analyzeSingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerV1(
      makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('symmetric ledger must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.persistentEventRows)).toBe(true);
    expect(Object.isFrozen(result.value.persistentEventRows[0]?.cellObservations)).toBe(true);
    expect(
      Object.isFrozen(
        result.value.persistentEventRows[0]?.cellObservations[0]?.staticPairSignature,
      ),
    ).toBe(true);
    expect(Object.isFrozen(result.value.cellCounters)).toBe(true);
    expect(Object.isFrozen(result.value.globalEventCellStaticSamples)).toBe(true);
    expect(result.value).toMatchObject({
      sourceGlobalEventCellStaticSamplesSingleOwnedSnapshotCompositionReused: true,
      everyPersistentEventJoinedToRootCensusPartitionAndRefinementExactlyOnce: true,
      everyPersistentPolynomialProvedIdenticallyZeroOnEntireUnitInterval: true,
      everyPersistentEventObservedAtEveryCanonicalOpenCellSample: true,
      everyObservationJoinedToCanonicalStaticTrianglePairExactly: true,
      everyPersistentDefiningPolynomialRetainedAsSeparateRow: true,
      persistentEventsDeduplicatedByTrianglePair: false,
      compactStaticPairSignaturesRetainedPerObservation: true,
      completeExactStaticPairEvidenceRetainedOnlyInCentralSource: true,
      variationFlagComparesStaticPairCategoryOnly: true,
      withinCategoryStaticSignatureVariationFlagIncluded: false,
      pairLevelStaticSampleEvidenceIncluded: true,
      perEventFeatureContainmentIncluded: false,
      persistentAuxiliaryEventPolynomialsIncluded: false,
      persistentEventSubdivisionIncluded: false,
      boundaryPoseSamplesIncluded: false,
      staticPairCategoryConstancyEstablished: false,
      persistentFeatureContainmentConstancyEstablished: false,
      eventOccurrenceDeduplicationIncluded: false,
      geometricApproachSeparationEstablished: false,
      collisionEventCompletenessEstablished: false,
      continuousCollisionDetectionIncluded: false,
      legalContactPolicyIncluded: false,
      selfIntersectionDecisionIncluded: false,
      collisionFreeClaim: false,
      callerRevisionLabelsOnly: true,
      exactSourceReconstructionGeometryEqualityChecked: false,
      cryptographicSourceRevisionBindingIncluded: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });
});
