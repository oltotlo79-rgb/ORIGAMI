import { beforeAll, describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS,
  type SingleHingeRationalScheduleFiniteRootClassificationV1,
  type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1,
} from '../../m0f/index.js';
import { makeFourFaceCollinearOverlapTransitionFixture } from './fixtures/four-face-collinear-overlap-fixture.js';
import { makeTwoFaceQuarterTransitionFixture } from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

function analyze(
  supplied: unknown,
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1 {
  const result =
    analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('finite root classification ledger fixture must succeed');
  return result.value;
}

function findClassification(
  record: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1,
  boundaryId: string,
  eventId: string,
  rootIndex = 0,
): SingleHingeRationalScheduleFiniteRootClassificationV1 {
  const row = record.boundaryClassifications
    .find((boundary) => boundary.boundaryId === boundaryId)
    ?.occurrenceClassifications.find(
      (entry) => entry.occurrence.eventId === eventId && entry.occurrence.rootIndex === rootIndex,
    );
  if (row === undefined) throw new TypeError(`missing classification ${boundaryId}/${eventId}`);
  return row;
}

describe('single-hinge global event-boundary finite-root classification ledger candidate', () => {
  let twoFace: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1;
  let symmetric: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1;

  beforeAll(() => {
    twoFace = analyze(makeTwoFaceQuarterTransitionFixture());
    symmetric = analyze(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
  });

  it('publishes explicit aggregate work and retained-evidence limits', () => {
    expect(
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS,
    ).toEqual({
      maxBoundaryRows: 4_097,
      maxFiniteRootClassificationRows: 4_096,
      maxAuxiliarySignRows: 57_344,
      maxRetainedBigIntBits: 16_777_216,
      vertexFaceAuxiliarySignRowsPerClassification: 6,
      edgeEdgeMaximumAuxiliarySignRowsPerClassification: 14,
    });
    expect(
      Object.isFrozen(
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS,
      ),
    ).toBe(true);
  });

  it('classifies every two-face endpoint occurrence once and retains no duplicated census', () => {
    expect(twoFace).toMatchObject({
      recordType:
        'm0f-single-hinge-rational-schedule-global-event-boundary-finite-root-classification-ledger',
      contractStatus: 'candidate-no-claim',
      boundaryCount: 2,
      boundariesWithFiniteRootOccurrencesCount: 1,
      finiteRootOccurrenceCount: 30,
      classifiedFiniteRootOccurrenceCount: 30,
      vertexFaceRootClassificationCount: 12,
      edgeEdgeRootClassificationCount: 18,
      preflightMaximumAuxiliarySignRowCount: 324,
      auxiliarySignRowCount: 228,
      aggregateRetainedBigIntBits: 11_371,
      classificationCounters: {
        vertexFaceOutsideCount: 12,
        vertexFaceVertexCount: 0,
        vertexFaceEdgeCount: 0,
        vertexFaceInteriorCount: 0,
        edgeEdgeDisjointCount: 18,
        edgeEdgeEndpointContactCount: 0,
        edgeEdgeProperInteriorCrossingCount: 0,
        edgeEdgeCollinearOverlapCount: 0,
      },
    });
    expect(
      twoFace.boundaryClassifications.map((boundary) => ({
        location: boundary.boundaryLocation,
        finite: boundary.finiteRootOccurrenceCount,
        vertexFace: boundary.vertexFaceRootClassificationCount,
        edgeEdge: boundary.edgeEdgeRootClassificationCount,
        auxiliary: boundary.auxiliarySignRowCount,
        retainedBits: boundary.retainedBigIntBits,
      })),
    ).toEqual([
      {
        location: 'start',
        finite: 30,
        vertexFace: 12,
        edgeEdge: 18,
        auxiliary: 228,
        retainedBits: 11_371,
      },
      {
        location: 'end',
        finite: 0,
        vertexFace: 0,
        edgeEdge: 0,
        auxiliary: 0,
        retainedBits: 0,
      },
    ]);

    const rows = twoFace.boundaryClassifications.flatMap(
      (boundary) => boundary.occurrenceClassifications,
    );
    expect(rows.map((row) => row.globalClassificationIndex)).toEqual(
      Array.from({ length: 30 }, (_, index) => index),
    );
    expect(
      rows.filter((row) => row.classificationKind === 'vertex-face-root-containment'),
    ).toHaveLength(12);
    expect(
      rows.filter((row) => row.classificationKind === 'edge-edge-algebraic-containment'),
    ).toHaveLength(18);
    for (const row of rows) {
      if (row.classificationKind === 'vertex-face-root-containment') {
        expect(row.classification.classification).toBe('outside');
        expect('polynomialCensus' in row.classification).toBe(false);
      } else {
        expect(row.classification.containmentClass).toBe('disjoint');
        expect('rootCensus' in row.classification).toBe(false);
      }
    }
    const parallel = findClassification(twoFace, 'event-boundary:start', 'ee:1:2:2');
    expect(parallel.classificationKind).toBe('edge-edge-algebraic-containment');
    if (parallel.classificationKind !== 'edge-edge-algebraic-containment') {
      throw new TypeError('expected edge-edge row');
    }
    expect(parallel.classification).toMatchObject({
      directionRelation: 'parallel-noncollinear',
      containmentClass: 'disjoint',
    });
    expect(parallel.auxiliarySignRowCount).toBe(12);
  });

  it('retains all symmetric boundary occurrences and exact classification outcomes', () => {
    expect(symmetric).toMatchObject({
      boundaryCount: 3,
      boundariesWithFiniteRootOccurrencesCount: 3,
      finiteRootOccurrenceCount: 82,
      classifiedFiniteRootOccurrenceCount: 82,
      vertexFaceRootClassificationCount: 36,
      edgeEdgeRootClassificationCount: 46,
      preflightMaximumAuxiliarySignRowCount: 860,
      auxiliarySignRowCount: 548,
      aggregateRetainedBigIntBits: 136_710,
      classificationCounters: {
        vertexFaceOutsideCount: 15,
        vertexFaceVertexCount: 18,
        vertexFaceEdgeCount: 3,
        vertexFaceInteriorCount: 0,
        edgeEdgeDisjointCount: 8,
        edgeEdgeEndpointContactCount: 32,
        edgeEdgeProperInteriorCrossingCount: 6,
        edgeEdgeCollinearOverlapCount: 0,
      },
    });
    expect(
      symmetric.boundaryClassifications.map((boundary) => ({
        id: boundary.boundaryId,
        finite: boundary.finiteRootOccurrenceCount,
        vertexFace: boundary.vertexFaceRootClassificationCount,
        edgeEdge: boundary.edgeEdgeRootClassificationCount,
        auxiliary: boundary.auxiliarySignRowCount,
        retainedBits: boundary.retainedBigIntBits,
        counters: boundary.classificationCounters,
      })),
    ).toEqual([
      {
        id: 'event-boundary:start',
        finite: 58,
        vertexFace: 24,
        edgeEdge: 34,
        auxiliary: 392,
        retainedBits: 80_942,
        counters: {
          vertexFaceOutsideCount: 6,
          vertexFaceVertexCount: 18,
          vertexFaceEdgeCount: 0,
          vertexFaceInteriorCount: 0,
          edgeEdgeDisjointCount: 2,
          edgeEdgeEndpointContactCount: 28,
          edgeEdgeProperInteriorCrossingCount: 4,
          edgeEdgeCollinearOverlapCount: 0,
        },
      },
      {
        id: 'event-boundary:interior:0',
        finite: 12,
        vertexFace: 6,
        edgeEdge: 6,
        auxiliary: 78,
        retainedBits: 32_466,
        counters: {
          vertexFaceOutsideCount: 3,
          vertexFaceVertexCount: 0,
          vertexFaceEdgeCount: 3,
          vertexFaceInteriorCount: 0,
          edgeEdgeDisjointCount: 0,
          edgeEdgeEndpointContactCount: 4,
          edgeEdgeProperInteriorCrossingCount: 2,
          edgeEdgeCollinearOverlapCount: 0,
        },
      },
      {
        id: 'event-boundary:end',
        finite: 12,
        vertexFace: 6,
        edgeEdge: 6,
        auxiliary: 78,
        retainedBits: 23_302,
        counters: {
          vertexFaceOutsideCount: 6,
          vertexFaceVertexCount: 0,
          vertexFaceEdgeCount: 0,
          vertexFaceInteriorCount: 0,
          edgeEdgeDisjointCount: 6,
          edgeEdgeEndpointContactCount: 0,
          edgeEdgeProperInteriorCrossingCount: 0,
          edgeEdgeCollinearOverlapCount: 0,
        },
      },
    ]);

    const expected = [
      ['event-boundary:start', 'vf:1:first:1', 'vertex'],
      ['event-boundary:start', 'vf:1:first:2', 'outside'],
      ['event-boundary:interior:0', 'vf:3:second:0', 'edge'],
      ['event-boundary:interior:0', 'vf:4:second:1', 'outside'],
    ] as const;
    for (const [boundaryId, eventId, classification] of expected) {
      const row = findClassification(symmetric, boundaryId, eventId);
      expect(row.classificationKind).toBe('vertex-face-root-containment');
      if (row.classificationKind !== 'vertex-face-root-containment') {
        throw new TypeError('expected vertex-face row');
      }
      expect(row.classification.classification).toBe(classification);
    }
    const edgeExpected = [
      ['event-boundary:start', 'ee:1:0:2', 'endpoint-contact'],
      ['event-boundary:start', 'ee:1:2:2', 'proper-interior-crossing'],
      ['event-boundary:interior:0', 'ee:3:0:2', 'endpoint-contact'],
      ['event-boundary:interior:0', 'ee:4:2:1', 'proper-interior-crossing'],
      ['event-boundary:end', 'ee:3:1:0', 'disjoint'],
    ] as const;
    for (const [boundaryId, eventId, containmentClass] of edgeExpected) {
      const row = findClassification(
        symmetric,
        boundaryId,
        eventId,
        boundaryId === 'event-boundary:end' ? 1 : 0,
      );
      expect(row.classificationKind).toBe('edge-edge-algebraic-containment');
      if (row.classificationKind !== 'edge-edge-algebraic-containment') {
        throw new TypeError('expected edge-edge row');
      }
      expect(row.classification.containmentClass).toBe(containmentClass);
    }
    expect(symmetric.boundaryCellStaticDeltaLedger.boundaryDeltas[1]?.changedPairRowCount).toBe(3);
    expect(symmetric.boundaryClassifications[1]?.finiteRootOccurrenceCount).toBe(12);
  });

  it('retains four canonical finite collinear overlaps with complete fourteen-row evidence', () => {
    const collinear = analyze(makeFourFaceCollinearOverlapTransitionFixture());
    expect(collinear).toMatchObject({
      boundaryCount: 6,
      boundariesWithFiniteRootOccurrencesCount: 6,
      finiteRootOccurrenceCount: 190,
      classifiedFiniteRootOccurrenceCount: 190,
      vertexFaceRootClassificationCount: 84,
      edgeEdgeRootClassificationCount: 106,
      preflightMaximumAuxiliarySignRowCount: 1_988,
      auxiliarySignRowCount: 1_304,
      aggregateRetainedBigIntBits: 154_987,
      classificationCounters: {
        vertexFaceOutsideCount: 42,
        vertexFaceVertexCount: 36,
        vertexFaceEdgeCount: 6,
        vertexFaceInteriorCount: 0,
        edgeEdgeDisjointCount: 34,
        edgeEdgeEndpointContactCount: 56,
        edgeEdgeProperInteriorCrossingCount: 12,
        edgeEdgeCollinearOverlapCount: 4,
      },
    });
    expect(
      collinear.boundaryClassifications.map((boundary) => boundary.finiteRootOccurrenceCount),
    ).toEqual([102, 4, 54, 4, 24, 2]);

    const startCollinear = collinear.boundaryClassifications[0]?.occurrenceClassifications.filter(
      (row) =>
        row.classificationKind === 'edge-edge-algebraic-containment' &&
        row.classification.directionRelation === 'collinear',
    );
    expect(startCollinear?.map((row) => row.occurrence.eventId)).toEqual([
      'ee:5:2:2',
      'ee:6:2:2',
      'ee:11:2:2',
      'ee:12:2:2',
    ]);
    for (const row of startCollinear ?? []) {
      if (row.classificationKind !== 'edge-edge-algebraic-containment') {
        throw new TypeError('expected edge-edge collinear row');
      }
      expect(row).toMatchObject({
        boundaryLocation: 'start',
        auxiliarySignRowCount: 14,
        occurrence: { rootIndex: 0, multiplicity: 2 },
        classification: {
          directionRelation: 'collinear',
          projectionAxisDropped: null,
          collinearProjectionAxis: 'x',
          collinearIntervalComparisonSigns: [-1, -1],
          collinearOverlapHasPositiveLength: true,
          containmentClass: 'collinear-overlap',
          collinearIntervalComparisonIncluded: true,
          threeDimensionalContainmentClassifiedExactly: true,
        },
      });
      expect(row.classification.auxiliarySigns).toHaveLength(14);
      expect(row.classification.auxiliarySigns.map((entry) => entry.role)).toEqual([
        'direction-cross-x',
        'direction-cross-y',
        'direction-cross-z',
        'first-direction-x',
        'second-direction-x',
        'first-direction-y',
        'second-direction-y',
        'first-direction-z',
        'second-direction-z',
        'carrier-offset-cross-x',
        'carrier-offset-cross-y',
        'carrier-offset-cross-z',
        'interval-second-lower-minus-first-upper',
        'interval-first-lower-minus-second-upper',
      ]);
      expect('rootCensus' in row.classification).toBe(false);
    }
  });

  it('preserves canonical source identity and root binding for every row', () => {
    const source = symmetric.boundaryCellStaticDeltaLedger;
    const partition = source.cellStaticSamples.eventTimePartition;
    const rootCensus = partition.eventRootCensus;
    const flattenedKeys: string[] = [];
    for (const [boundaryIndex, boundaryRow] of symmetric.boundaryClassifications.entries()) {
      const boundary = partition.boundaries[boundaryIndex];
      expect(boundaryRow.boundary).toBe(boundary);
      expect(boundaryRow.boundaryCellStaticDelta).toBe(source.boundaryDeltas[boundaryIndex]);
      expect(boundaryRow.boundaryIndex).toBe(boundaryIndex);
      if (boundary === undefined) throw new TypeError('source boundary must exist');
      for (const [occurrenceIndex, row] of boundaryRow.occurrenceClassifications.entries()) {
        const occurrence = boundary.finiteEventOccurrences[occurrenceIndex];
        expect(row.boundaryOccurrenceIndex).toBe(occurrenceIndex);
        expect(row.occurrence).toBe(occurrence);
        if (occurrence === undefined) throw new TypeError('source occurrence must exist');
        const event = rootCensus.events[occurrence.eventIndex];
        const root = event?.isolation.roots[occurrence.rootIndex];
        expect(event).toMatchObject({
          eventId: occurrence.eventId,
          pairIndex: occurrence.pairIndex,
          firstTriangleId: occurrence.firstTriangleId,
          secondTriangleId: occurrence.secondTriangleId,
          eventKind: occurrence.eventKind,
        });
        expect(root).toMatchObject({
          rootIndex: occurrence.rootIndex,
          location: boundary.location,
          multiplicity: occurrence.multiplicity,
        });
        if (row.classificationKind === 'vertex-face-root-containment') {
          expect(row.classification.definingEvent).toBe(event?.polynomial);
          expect(row.classification.classificationId).toMatch(/^vf-boundary-root:[0-9]+:[0-9]+$/);
          expect(row.classification.classificationId.length).toBeLessThanOrEqual(64);
          expect('polynomialCensus' in row.classification).toBe(false);
        } else {
          expect(row.classification.event).toBe(event?.polynomial);
          expect('rootCensus' in row.classification).toBe(false);
        }
        flattenedKeys.push(`${String(occurrence.eventIndex)}:${String(occurrence.rootIndex)}`);
      }
    }
    const sourceKeys = partition.boundaries.flatMap((boundary) =>
      boundary.finiteEventOccurrences.map(
        (occurrence) => `${String(occurrence.eventIndex)}:${String(occurrence.rootIndex)}`,
      ),
    );
    expect(flattenedKeys).toEqual(sourceKeys);
    expect(new Set(flattenedKeys).size).toBe(partition.finiteRootOccurrenceCount);
    expect(rootCensus.persistentEventCount).toBe(66);
  });

  it('deep-freezes evidence, keeps claim boundaries false, and fails hostile input closed', () => {
    expect(Object.isFrozen(symmetric)).toBe(true);
    expect(Object.isFrozen(symmetric.boundaryClassifications)).toBe(true);
    expect(Object.isFrozen(symmetric.boundaryClassifications[1])).toBe(true);
    expect(Object.isFrozen(symmetric.boundaryClassifications[1]?.occurrenceClassifications)).toBe(
      true,
    );
    expect(
      Object.isFrozen(
        symmetric.boundaryClassifications[1]?.occurrenceClassifications[0]?.classification,
      ),
    ).toBe(true);
    expect(Object.isFrozen(symmetric.boundaryCellStaticDeltaLedger)).toBe(true);
    expect(symmetric).toMatchObject({
      sourceBoundaryDeltaSingleOwnedSnapshotCompositionReused: true,
      sharedPolynomialAndRootCensusesRetainedOnlyInCentralSource: true,
      compactPerOccurrenceClassifierEvidenceRetained: true,
      everyGlobalBoundaryJoinedExactlyOnce: true,
      everyFiniteRootOccurrenceClassifiedExactlyOnceInCanonicalOrder: true,
      everyFiniteVertexFaceRootOccurrenceClassifiedExactly: true,
      everyFiniteEdgeEdgeRootOccurrenceClassifiedExactly: true,
      allClassificationResultsBoundToSourceOccurrenceAndRoot: true,
      finiteRootFeatureContainmentIncluded: true,
      sampleSideStaticDeltasRetained: true,
      persistentEventsRetainedOnlyInSource: true,
      persistentEventSubdivisionIncluded: false,
      eventOccurrenceDeduplicationIncluded: false,
      approachSeparationHistoryIncluded: false,
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
      analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerV1(
        hostile,
      );
    expect(rejected).toEqual({
      ok: false,
      error: [
        {
          stage: 'boundary-cell-static-delta-ledger',
          path: '$.boundaryCellStaticDeltaLedger',
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
