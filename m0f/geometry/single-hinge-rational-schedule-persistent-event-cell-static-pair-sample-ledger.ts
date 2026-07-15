import { deepFreezeOwned } from '../clone-and-freeze.js';
import type { PrimitiveIntegerPolynomialPersistentRootSetV1 } from './primitive-integer-polynomial-unit-interval-root-common-refinement.js';
import type { SingleHingeRationalScheduleEventRootV1 } from './single-hinge-rational-schedule-event-root-census.js';
import { SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS } from './single-hinge-rational-schedule-event-polynomial-census.js';
import type { SingleHingeRationalScheduleStaticPairStrataSignatureV1 } from './single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger.js';
import {
  analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS,
  type SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1,
} from './single-hinge-rational-schedule-global-event-cell-static-samples.js';
import type { SingleHingeRationalSchedulePersistentEventV1 } from './single-hinge-rational-schedule-global-event-time-partition.js';
import type {
  StaticRationalTriangleFoldMeshStrataCategoryV1,
  StaticRationalTriangleFoldMeshStrataPairV1,
} from './static-rational-triangle-fold-mesh-strata.js';

export const SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS =
  deepFreezeOwned({
    maxPersistentEventRows: 4_096,
    maxPersistentPairRows: SINGLE_HINGE_RATIONAL_SCHEDULE_EVENT_POLYNOMIAL_LIMITS.maxTrianglePairs,
    maxOpenCellRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxOpenCellSamples,
    maxPersistentEventCellObservationRows: 4_096,
  });

export type SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1 = Readonly<{
  disjointObservationCount: number;
  sameFaceTriangulationContactCandidateObservationCount: number;
  sameFaceUnexpectedIntersectionEvidenceObservationCount: number;
  declaredHingeContactContainedCandidateObservationCount: number;
  declaredHingeOffAxisIntersectionEvidenceObservationCount: number;
  nonadjacentStaticInteriorCrossingEvidenceObservationCount: number;
  nonadjacentContactRequiresMotionHistoryObservationCount: number;
  nonadjacentCoplanarAreaRequiresLayerOrderObservationCount: number;
}>;

export type SingleHingeRationalSchedulePersistentEventCellStaticPairObservationV1 = Readonly<{
  globalObservationIndex: number;
  eventObservationIndex: number;
  cellIndex: number;
  cellId: string;
  sampleRevisionId: string;
  sourcePairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  firstFaceId: string;
  secondFaceId: string;
  topologyRelation: SingleHingeRationalScheduleEventRootV1['polynomial']['topologyRelation'];
  staticPairSignature: SingleHingeRationalScheduleStaticPairStrataSignatureV1;
  sourceSampleIsCanonicalDyadicActualTime: true;
  sourceStaticPairEvaluatedWithExactProjectiveRationalArithmetic: true;
}>;

export type SingleHingeRationalSchedulePersistentEventCellStaticPairSampleRowV1 = Readonly<{
  persistentEventIndex: number;
  eventIndex: number;
  eventId: string;
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  eventKind: SingleHingeRationalScheduleEventRootV1['eventKind'];
  topologyRelation: SingleHingeRationalScheduleEventRootV1['polynomial']['topologyRelation'];
  partitionPersistentEventRowIndex: number;
  rootRefinementPersistentRowIndex: number;
  rootRefinementPolynomialIndex: number;
  primitiveIntegerCoefficientsLowToHigh: readonly [0n];
  polynomialDegree: null;
  rootSetKind: 'entire-unit-interval';
  everyUnitIntervalPointIsDefiningPolynomialRoot: true;
  persistentPolynomialIdentityJoinedExactly: true;
  observationCount: number;
  distinctObservedStaticPairCategoryCount: number;
  staticPairCategoryVariesAcrossSampledCells: boolean;
  staticPairCategoryCounters: SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;
  cellObservations: readonly SingleHingeRationalSchedulePersistentEventCellStaticPairObservationV1[];
}>;

export type SingleHingeRationalSchedulePersistentEventCellCountersV1 = Readonly<{
  cellIndex: number;
  cellId: string;
  persistentEventObservationCount: number;
  persistentVertexFaceObservationCount: number;
  persistentEdgeEdgeObservationCount: number;
  staticPairCategoryCounters: SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;
}>;

export type SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerRecordV1 =
  Readonly<{
    schemaVersion: 1;
    recordType: 'm0f-single-hinge-rational-schedule-persistent-event-cell-static-pair-sample-ledger';
    contractStatus: 'candidate-no-claim';
    predicateScope: 'persistent-zero-event-identity-and-associated-pair-static-evidence-at-canonical-open-cell-samples';
    arithmetic: 'exact-zero-polynomial-identity-and-owned-projective-rational-static-pair-joins';
    transitionRevisionId: string;
    stepId: string;
    meshRevisionId: string;
    triangulationRevisionId: string;
    persistentEventCount: number;
    persistentVertexFaceEventCount: number;
    persistentEdgeEdgeEventCount: number;
    persistentPairCount: number;
    openCellSampleCount: number;
    persistentEventCellObservationCount: number;
    persistentEventsWithStaticPairCategoryVariationCount: number;
    staticPairCategoryCounters: SingleHingeRationalSchedulePersistentEventStaticPairCategoryCountersV1;
    persistentEventRows: readonly SingleHingeRationalSchedulePersistentEventCellStaticPairSampleRowV1[];
    cellCounters: readonly SingleHingeRationalSchedulePersistentEventCellCountersV1[];
    globalEventCellStaticSamples: SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1;
    sourceGlobalEventCellStaticSamplesSingleOwnedSnapshotCompositionReused: true;
    everyPersistentEventJoinedToRootCensusPartitionAndRefinementExactlyOnce: true;
    everyPersistentPolynomialProvedIdenticallyZeroOnEntireUnitInterval: true;
    everyPersistentEventObservedAtEveryCanonicalOpenCellSample: true;
    everyObservationJoinedToCanonicalStaticTrianglePairExactly: true;
    everyPersistentDefiningPolynomialRetainedAsSeparateRow: true;
    persistentEventsDeduplicatedByTrianglePair: false;
    compactStaticPairSignaturesRetainedPerObservation: true;
    completeExactStaticPairEvidenceRetainedOnlyInCentralSource: true;
    variationFlagComparesStaticPairCategoryOnly: true;
    withinCategoryStaticSignatureVariationFlagIncluded: false;
    pairLevelStaticSampleEvidenceIncluded: true;
    perEventFeatureContainmentIncluded: false;
    persistentAuxiliaryEventPolynomialsIncluded: false;
    persistentEventSubdivisionIncluded: false;
    boundaryPoseSamplesIncluded: false;
    staticPairCategoryConstancyEstablished: false;
    persistentFeatureContainmentConstancyEstablished: false;
    eventOccurrenceDeduplicationIncluded: false;
    geometricApproachSeparationEstablished: false;
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

export type SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerIssueV1 = Readonly<{
  stage:
    | 'global-event-cell-static-samples'
    | 'persistent-preflight'
    | 'persistent-join'
    | 'static-pair-join';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerIssueV1[];
    }>;

interface MutableCategoryCounters {
  disjointObservationCount: number;
  sameFaceTriangulationContactCandidateObservationCount: number;
  sameFaceUnexpectedIntersectionEvidenceObservationCount: number;
  declaredHingeContactContainedCandidateObservationCount: number;
  declaredHingeOffAxisIntersectionEvidenceObservationCount: number;
  nonadjacentStaticInteriorCrossingEvidenceObservationCount: number;
  nonadjacentContactRequiresMotionHistoryObservationCount: number;
  nonadjacentCoplanarAreaRequiresLayerOrderObservationCount: number;
}

interface MutableCellCounters {
  cellIndex: number;
  cellId: string;
  persistentEventObservationCount: number;
  persistentVertexFaceObservationCount: number;
  persistentEdgeEdgeObservationCount: number;
  staticPairCategoryCounters: MutableCategoryCounters;
}

function issue(
  stage: SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerIssueV1[],
): SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function emptyCategoryCounters(): MutableCategoryCounters {
  return {
    disjointObservationCount: 0,
    sameFaceTriangulationContactCandidateObservationCount: 0,
    sameFaceUnexpectedIntersectionEvidenceObservationCount: 0,
    declaredHingeContactContainedCandidateObservationCount: 0,
    declaredHingeOffAxisIntersectionEvidenceObservationCount: 0,
    nonadjacentStaticInteriorCrossingEvidenceObservationCount: 0,
    nonadjacentContactRequiresMotionHistoryObservationCount: 0,
    nonadjacentCoplanarAreaRequiresLayerOrderObservationCount: 0,
  };
}

function incrementCategory(
  counters: MutableCategoryCounters,
  category: StaticRationalTriangleFoldMeshStrataCategoryV1,
): void {
  switch (category) {
    case 'disjoint':
      counters.disjointObservationCount += 1;
      break;
    case 'same-face-triangulation-contact-candidate':
      counters.sameFaceTriangulationContactCandidateObservationCount += 1;
      break;
    case 'same-face-unexpected-intersection-evidence':
      counters.sameFaceUnexpectedIntersectionEvidenceObservationCount += 1;
      break;
    case 'declared-hinge-contact-contained-candidate':
      counters.declaredHingeContactContainedCandidateObservationCount += 1;
      break;
    case 'declared-hinge-off-axis-intersection-evidence':
      counters.declaredHingeOffAxisIntersectionEvidenceObservationCount += 1;
      break;
    case 'nonadjacent-static-interior-crossing-evidence':
      counters.nonadjacentStaticInteriorCrossingEvidenceObservationCount += 1;
      break;
    case 'nonadjacent-contact-requires-motion-history':
      counters.nonadjacentContactRequiresMotionHistoryObservationCount += 1;
      break;
    case 'nonadjacent-coplanar-area-requires-layer-order':
      counters.nonadjacentCoplanarAreaRequiresLayerOrderObservationCount += 1;
      break;
  }
}

function staticPairSignature(
  pair: StaticRationalTriangleFoldMeshStrataPairV1,
): SingleHingeRationalScheduleStaticPairStrataSignatureV1 {
  const strata = pair.strata.strata;
  return {
    category: pair.category,
    character: strata.character,
    triangleARelativeLocation: strata.triangleARelativeLocation,
    triangleBRelativeLocation: strata.triangleBRelativeLocation,
    relativeLocationSample: strata.relativeLocationSample,
    supportingPlaneRelation: strata.locus.supportingPlaneRelation,
    locusKind: strata.locus.locusKind,
    declaredHingeLocusContained: pair.declaredHingeLocusContained,
    sharedTriangulationFeatureLocusContained: pair.sharedTriangulationFeatureLocusContained,
    staticNonadjacentInteriorCrossingDetected: pair.staticNonadjacentInteriorCrossingDetected,
    staticInteriorInteriorIntersectionDetected: strata.staticInteriorInteriorIntersectionDetected,
    staticContactCandidate: strata.staticContactCandidate,
    coplanarAreaOverlapDetected: strata.coplanarAreaOverlapDetected,
    requiresMotionSideHistory: strata.requiresMotionSideHistory,
    requiresLayerOrder: strata.requiresLayerOrder,
  };
}

function persistentIdentityMatches(
  event: SingleHingeRationalScheduleEventRootV1,
  partitionEvent: SingleHingeRationalSchedulePersistentEventV1 | undefined,
  refinementReference: PrimitiveIntegerPolynomialPersistentRootSetV1 | undefined,
): boolean {
  const coefficients = event.polynomial.primitiveIntegerCoefficientsLowToHigh;
  const isolatedCoefficients = event.isolation.primitiveIntegerCoefficientsLowToHigh;
  return (
    partitionEvent !== undefined &&
    refinementReference !== undefined &&
    partitionEvent.eventIndex === event.eventIndex &&
    partitionEvent.eventId === event.eventId &&
    partitionEvent.pairIndex === event.pairIndex &&
    partitionEvent.firstTriangleId === event.firstTriangleId &&
    partitionEvent.secondTriangleId === event.secondTriangleId &&
    partitionEvent.eventKind === event.eventKind &&
    event.polynomial.eventIndex === event.eventIndex &&
    event.polynomial.eventId === event.eventId &&
    event.polynomial.pairIndex === event.pairIndex &&
    event.polynomial.firstTriangleId === event.firstTriangleId &&
    event.polynomial.secondTriangleId === event.secondTriangleId &&
    event.polynomial.eventKind === event.eventKind &&
    refinementReference.polynomialIndex === event.eventIndex &&
    refinementReference.polynomialId === event.eventId &&
    event.persistentOnEntireUnitInterval &&
    event.hasAnyUnitIntervalRoot &&
    !event.hasStartRoot &&
    !event.hasInteriorRoot &&
    !event.hasEndRoot &&
    event.polynomial.identicallyZero &&
    event.polynomial.polynomialDegree === null &&
    event.polynomial.boundaryClass === 'identically-zero' &&
    event.polynomial.startSign === 0 &&
    event.polynomial.endSign === 0 &&
    coefficients.length === 1 &&
    coefficients[0] === 0n &&
    event.isolation.rootSetKind === 'entire-unit-interval' &&
    event.isolation.polynomialId === event.eventId &&
    event.isolation.everyUnitIntervalPointIsRoot &&
    event.isolation.polynomialDegree === null &&
    event.isolation.startRootMultiplicity === 0 &&
    event.isolation.endRootMultiplicity === 0 &&
    event.isolation.interiorDistinctRootCount === 0 &&
    event.isolation.distinctRootCount === 0 &&
    event.isolation.rootMultiplicitySum === null &&
    event.isolation.roots.length === 0 &&
    isolatedCoefficients.length === 1 &&
    isolatedCoefficients[0] === 0n
  );
}

function pairMatchesEvent(
  pair: StaticRationalTriangleFoldMeshStrataPairV1 | undefined,
  event: SingleHingeRationalScheduleEventRootV1,
  expectedPairIndex: number,
): pair is StaticRationalTriangleFoldMeshStrataPairV1 {
  return (
    pair?.pairIndex === expectedPairIndex &&
    pair.firstTriangleId === event.firstTriangleId &&
    pair.secondTriangleId === event.secondTriangleId &&
    pair.topology.pairIndex === expectedPairIndex &&
    pair.topology.firstTriangleId === event.firstTriangleId &&
    pair.topology.secondTriangleId === event.secondTriangleId &&
    pair.topology.firstFaceId === pair.firstFaceId &&
    pair.topology.secondFaceId === pair.secondFaceId &&
    pair.topology.pairRelation === event.polynomial.topologyRelation
  );
}

/** Joins persistent zero identities to associated exact pair strata at each canonical cell sample. */
export function analyzeSingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerV1(
  suppliedTransition: unknown,
): SingleHingeRationalSchedulePersistentEventCellStaticPairSampleLedgerResultV1 {
  const sampled =
    analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(suppliedTransition);
  if (!sampled.ok) {
    return failure(
      sampled.error.map((entry) =>
        issue(
          'global-event-cell-static-samples',
          `$.globalEventCellStaticSamples${entry.path.slice(1)}`,
          entry.code,
          entry.message,
        ),
      ),
    );
  }

  const source = sampled.value;
  const partition = source.eventTimePartition;
  const rootCensus = partition.eventRootCensus;
  const persistentEvents = rootCensus.events.filter(
    (event) => event.persistentOnEntireUnitInterval,
  );
  const observationCount = persistentEvents.length * source.cellSamples.length;
  const persistentPairCount = new Set(persistentEvents.map((event) => event.pairIndex)).size;
  if (
    persistentEvents.length !== rootCensus.persistentEventCount ||
    persistentEvents.length !== partition.persistentEventCount ||
    persistentEvents.length !== partition.persistentEvents.length ||
    persistentEvents.length !== partition.rootRefinement.persistentPolynomialCount ||
    persistentEvents.length !== partition.rootRefinement.persistentPolynomials.length ||
    source.cellSamples.length !== source.openCellCount ||
    source.sampledCellCount !== source.openCellCount ||
    partition.openCells.length !== partition.openCellCount ||
    source.openCellCount !== partition.openCellCount ||
    persistentEvents.length >
      SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS.maxPersistentEventRows ||
    persistentPairCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS.maxPersistentPairRows ||
    source.cellSamples.length >
      SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS.maxOpenCellRows ||
    !Number.isSafeInteger(observationCount) ||
    observationCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_PERSISTENT_EVENT_CELL_STATIC_PAIR_SAMPLE_LIMITS.maxPersistentEventCellObservationRows
  ) {
    return failure([
      issue(
        'persistent-preflight',
        '$.globalEventCellStaticSamples.eventTimePartition',
        'persistent-event-sample-row-limit-or-cardinality-mismatch',
        'persistent event identities or their event-by-cell observation product exceed the bounded ledger contract',
      ),
    ]);
  }

  try {
    const aggregateCounters = emptyCategoryCounters();
    const mutableCellCounters: MutableCellCounters[] = source.cellSamples.map((cell, cellIndex) => {
      if (
        cell.cellIndex !== cellIndex ||
        cell.openCell !== partition.openCells[cellIndex] ||
        cell.cellId !== cell.openCell.cellId
      ) {
        throw new TypeError('canonical open-cell sample join failed');
      }
      return {
        cellIndex,
        cellId: cell.cellId,
        persistentEventObservationCount: 0,
        persistentVertexFaceObservationCount: 0,
        persistentEdgeEdgeObservationCount: 0,
        staticPairCategoryCounters: emptyCategoryCounters(),
      };
    });
    const rows: SingleHingeRationalSchedulePersistentEventCellStaticPairSampleRowV1[] = [];
    let globalObservationIndex = 0;
    let persistentVertexFaceEventCount = 0;
    let persistentEdgeEdgeEventCount = 0;

    for (const [persistentEventIndex, event] of persistentEvents.entries()) {
      const partitionEvent = partition.persistentEvents[persistentEventIndex];
      const refinementReference =
        partition.rootRefinement.persistentPolynomials[persistentEventIndex];
      const rowPath = `$.persistentEventRows[${String(persistentEventIndex)}]`;
      if (!persistentIdentityMatches(event, partitionEvent, refinementReference)) {
        return failure([
          issue(
            'persistent-join',
            rowPath,
            'persistent-zero-identity-source-mismatch',
            'one persistent event is not the same canonical zero polynomial in the census, partition, and refinement',
          ),
        ]);
      }
      if (event.eventKind === 'vertex-face-plane') persistentVertexFaceEventCount += 1;
      else persistentEdgeEdgeEventCount += 1;

      const eventCounters = emptyCategoryCounters();
      const observedCategories = new Set<StaticRationalTriangleFoldMeshStrataCategoryV1>();
      const cellObservations: SingleHingeRationalSchedulePersistentEventCellStaticPairObservationV1[] =
        [];
      for (const [cellIndex, cell] of source.cellSamples.entries()) {
        const pair = cell.staticSample.strata.pairs[event.pairIndex];
        const cellCounter = mutableCellCounters[cellIndex];
        if (
          cellCounter === undefined ||
          !pairMatchesEvent(pair, event, event.pairIndex) ||
          pair.topology !== cell.staticSample.strata.binding.pairs[event.pairIndex]
        ) {
          return failure([
            issue(
              'static-pair-join',
              `${rowPath}.cellObservations[${String(cellIndex)}]`,
              'persistent-event-static-pair-source-mismatch',
              'one persistent event does not join to its canonical exact static triangle-pair sample',
            ),
          ]);
        }
        const signature = staticPairSignature(pair);
        incrementCategory(eventCounters, pair.category);
        incrementCategory(aggregateCounters, pair.category);
        incrementCategory(cellCounter.staticPairCategoryCounters, pair.category);
        observedCategories.add(pair.category);
        cellCounter.persistentEventObservationCount += 1;
        if (event.eventKind === 'vertex-face-plane') {
          cellCounter.persistentVertexFaceObservationCount += 1;
        } else {
          cellCounter.persistentEdgeEdgeObservationCount += 1;
        }
        cellObservations.push({
          globalObservationIndex,
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
          staticPairSignature: signature,
          sourceSampleIsCanonicalDyadicActualTime: true,
          sourceStaticPairEvaluatedWithExactProjectiveRationalArithmetic: true,
        });
        globalObservationIndex += 1;
      }
      rows.push({
        persistentEventIndex,
        eventIndex: event.eventIndex,
        eventId: event.eventId,
        pairIndex: event.pairIndex,
        firstTriangleId: event.firstTriangleId,
        secondTriangleId: event.secondTriangleId,
        eventKind: event.eventKind,
        topologyRelation: event.polynomial.topologyRelation,
        partitionPersistentEventRowIndex: persistentEventIndex,
        rootRefinementPersistentRowIndex: persistentEventIndex,
        rootRefinementPolynomialIndex: event.eventIndex,
        primitiveIntegerCoefficientsLowToHigh: [0n],
        polynomialDegree: null,
        rootSetKind: 'entire-unit-interval',
        everyUnitIntervalPointIsDefiningPolynomialRoot: true,
        persistentPolynomialIdentityJoinedExactly: true,
        observationCount: cellObservations.length,
        distinctObservedStaticPairCategoryCount: observedCategories.size,
        staticPairCategoryVariesAcrossSampledCells: observedCategories.size > 1,
        staticPairCategoryCounters: eventCounters,
        cellObservations,
      });
    }

    if (
      rows.length !== persistentEvents.length ||
      globalObservationIndex !== observationCount ||
      mutableCellCounters.some(
        (cell) =>
          cell.persistentEventObservationCount !== persistentEvents.length ||
          cell.persistentVertexFaceObservationCount + cell.persistentEdgeEdgeObservationCount !==
            cell.persistentEventObservationCount,
      )
    ) {
      throw new TypeError('complete persistent event sample counts disagree');
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType:
          'm0f-single-hinge-rational-schedule-persistent-event-cell-static-pair-sample-ledger' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'persistent-zero-event-identity-and-associated-pair-static-evidence-at-canonical-open-cell-samples' as const,
        arithmetic:
          'exact-zero-polynomial-identity-and-owned-projective-rational-static-pair-joins' as const,
        transitionRevisionId: source.transitionRevisionId,
        stepId: source.stepId,
        meshRevisionId: source.meshRevisionId,
        triangulationRevisionId: source.triangulationRevisionId,
        persistentEventCount: rows.length,
        persistentVertexFaceEventCount,
        persistentEdgeEdgeEventCount,
        persistentPairCount,
        openCellSampleCount: source.cellSamples.length,
        persistentEventCellObservationCount: globalObservationIndex,
        persistentEventsWithStaticPairCategoryVariationCount: rows.filter(
          (row) => row.staticPairCategoryVariesAcrossSampledCells,
        ).length,
        staticPairCategoryCounters: aggregateCounters,
        persistentEventRows: rows,
        cellCounters: mutableCellCounters,
        globalEventCellStaticSamples: source,
        sourceGlobalEventCellStaticSamplesSingleOwnedSnapshotCompositionReused: true as const,
        everyPersistentEventJoinedToRootCensusPartitionAndRefinementExactlyOnce: true as const,
        everyPersistentPolynomialProvedIdenticallyZeroOnEntireUnitInterval: true as const,
        everyPersistentEventObservedAtEveryCanonicalOpenCellSample: true as const,
        everyObservationJoinedToCanonicalStaticTrianglePairExactly: true as const,
        everyPersistentDefiningPolynomialRetainedAsSeparateRow: true as const,
        persistentEventsDeduplicatedByTrianglePair: false as const,
        compactStaticPairSignaturesRetainedPerObservation: true as const,
        completeExactStaticPairEvidenceRetainedOnlyInCentralSource: true as const,
        variationFlagComparesStaticPairCategoryOnly: true as const,
        withinCategoryStaticSignatureVariationFlagIncluded: false as const,
        pairLevelStaticSampleEvidenceIncluded: true as const,
        perEventFeatureContainmentIncluded: false as const,
        persistentAuxiliaryEventPolynomialsIncluded: false as const,
        persistentEventSubdivisionIncluded: false as const,
        boundaryPoseSamplesIncluded: false as const,
        staticPairCategoryConstancyEstablished: false as const,
        persistentFeatureContainmentConstancyEstablished: false as const,
        eventOccurrenceDeduplicationIncluded: false as const,
        geometricApproachSeparationEstablished: false as const,
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
        'persistent-join',
        '$',
        'persistent-event-cell-static-pair-ledger-invariant-failed',
        'persistent event static-pair sample assembly failed closed unexpectedly',
      ),
    ]);
  }
}
