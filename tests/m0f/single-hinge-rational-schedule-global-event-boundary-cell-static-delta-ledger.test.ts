import { describe, expect, it } from 'vitest';

import {
  analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1,
  type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1,
  type SingleHingeRationalScheduleStaticStrataCounterSnapshotV1,
} from '../../m0f/index.js';
import { makeTwoFaceQuarterTransitionFixture } from './fixtures/single-hinge-rational-test-fixture.js';
import { makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture } from './fixtures/symmetric-three-face-algebraic-crossing-fixture.js';

const TWO_FACE_COUNTERS = {
  disjointPairCount: 1,
  sameFaceTriangulationContactCandidatePairCount: 2,
  sameFaceUnexpectedIntersectionEvidencePairCount: 0,
  declaredHingeContactContainedCandidatePairCount: 3,
  declaredHingeOffAxisIntersectionEvidencePairCount: 0,
  nonadjacentStaticInteriorCrossingEvidencePairCount: 0,
  nonadjacentContactRequiresMotionHistoryPairCount: 0,
  nonadjacentCoplanarAreaRequiresLayerOrderPairCount: 0,
  rawStaticInteriorInteriorIntersectionPairCount: 0,
  rawStaticContactCandidatePairCount: 5,
  rawCoplanarAreaOverlapPairCount: 0,
  rawRequiresMotionSideHistoryPairCount: 5,
  rawRequiresLayerOrderPairCount: 0,
} as const satisfies SingleHingeRationalScheduleStaticStrataCounterSnapshotV1;

const SYMMETRIC_LEFT_COUNTERS = {
  disjointPairCount: 3,
  sameFaceTriangulationContactCandidatePairCount: 3,
  sameFaceUnexpectedIntersectionEvidencePairCount: 0,
  declaredHingeContactContainedCandidatePairCount: 6,
  declaredHingeOffAxisIntersectionEvidencePairCount: 0,
  nonadjacentStaticInteriorCrossingEvidencePairCount: 3,
  nonadjacentContactRequiresMotionHistoryPairCount: 0,
  nonadjacentCoplanarAreaRequiresLayerOrderPairCount: 0,
  rawStaticInteriorInteriorIntersectionPairCount: 3,
  rawStaticContactCandidatePairCount: 9,
  rawCoplanarAreaOverlapPairCount: 0,
  rawRequiresMotionSideHistoryPairCount: 9,
  rawRequiresLayerOrderPairCount: 0,
} as const satisfies SingleHingeRationalScheduleStaticStrataCounterSnapshotV1;

const SYMMETRIC_RIGHT_COUNTERS = {
  ...SYMMETRIC_LEFT_COUNTERS,
  disjointPairCount: 6,
  nonadjacentStaticInteriorCrossingEvidencePairCount: 0,
  rawStaticInteriorInteriorIntersectionPairCount: 0,
} as const satisfies SingleHingeRationalScheduleStaticStrataCounterSnapshotV1;

const SYMMETRIC_RIGHT_MINUS_LEFT = {
  disjointPairCount: 3,
  sameFaceTriangulationContactCandidatePairCount: 0,
  sameFaceUnexpectedIntersectionEvidencePairCount: 0,
  declaredHingeContactContainedCandidatePairCount: 0,
  declaredHingeOffAxisIntersectionEvidencePairCount: 0,
  nonadjacentStaticInteriorCrossingEvidencePairCount: -3,
  nonadjacentContactRequiresMotionHistoryPairCount: 0,
  nonadjacentCoplanarAreaRequiresLayerOrderPairCount: 0,
  rawStaticInteriorInteriorIntersectionPairCount: -3,
  rawStaticContactCandidatePairCount: 0,
  rawCoplanarAreaOverlapPairCount: 0,
  rawRequiresMotionSideHistoryPairCount: 0,
  rawRequiresLayerOrderPairCount: 0,
} as const satisfies SingleHingeRationalScheduleStaticStrataCounterSnapshotV1;

function analyze(
  supplied: unknown = makeTwoFaceQuarterTransitionFixture(),
): SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1 {
  const result =
    analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('boundary cell-static delta ledger fixture must succeed');
  return result.value;
}

describe('single-hinge global event-boundary cell-static delta ledger candidate', () => {
  it('joins the two-face start and end boundaries to their sole adjacent sample', () => {
    const record = analyze();
    expect(record).toMatchObject({
      recordType:
        'm0f-single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger',
      contractStatus: 'candidate-no-claim',
      boundaryCount: 2,
      startBoundaryCount: 1,
      interiorBoundaryCount: 0,
      endBoundaryCount: 1,
      oneSidedBoundaryCount: 2,
      twoSidedBoundaryCount: 0,
      trianglePairCountPerSample: 6,
      aggregateTwoSidedPairComparisonRowCount: 0,
      aggregateChangedPairRowCount: 0,
      aggregateUnchangedPairRowCount: 0,
      boundariesWithAnyStaticStrataChangeCount: 0,
    });

    const [start, end] = record.boundaryDeltas;
    if (start === undefined || end === undefined) {
      throw new TypeError('two-face fixture must expose both endpoint boundaries');
    }
    expect(
      record.boundaryDeltas.map((entry) => ({
        boundaryIndex: entry.boundaryIndex,
        location: entry.boundaryLocation,
        adjacency: entry.adjacencyKind,
        leftCell: entry.leftCellSample?.cellIndex ?? null,
        rightCell: entry.rightCellSample?.cellIndex ?? null,
      })),
    ).toEqual([
      {
        boundaryIndex: 0,
        location: 'start',
        adjacency: 'right-cell-only',
        leftCell: null,
        rightCell: 0,
      },
      {
        boundaryIndex: 1,
        location: 'end',
        adjacency: 'left-cell-only',
        leftCell: 0,
        rightCell: null,
      },
    ]);
    expect(start.boundary).toBe(record.cellStaticSamples.eventTimePartition.boundaries[0]);
    expect(end.boundary).toBe(record.cellStaticSamples.eventTimePartition.boundaries[1]);
    expect(start.rightCellSample).toBe(record.cellStaticSamples.cellSamples[0]);
    expect(end.leftCellSample).toBe(record.cellStaticSamples.cellSamples[0]);
    expect(start.leftCounters).toBeNull();
    expect(start.rightCounters).toEqual(TWO_FACE_COUNTERS);
    expect(end.leftCounters).toEqual(TWO_FACE_COUNTERS);
    expect(end.rightCounters).toBeNull();
    for (const boundary of record.boundaryDeltas) {
      expect(boundary.rightMinusLeftCounterDelta).toBeNull();
      expect(boundary.comparedPairRowCount).toBe(0);
      expect(boundary.changedPairRowCount).toBe(0);
      expect(boundary.unchangedPairRowCount).toBe(0);
      expect(boundary.changedPairs).toEqual([]);
      expect(boundary.staticNonadjacentInteriorCrossingDetectedChanged).toBeNull();
      expect(boundary.nonadjacentStaticInteriorCrossingEvidencePairCountChanged).toBeNull();
    }
  });

  it('records complete symmetric three-face counters and the three changed canonical pairs', () => {
    const record = analyze(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
    expect(record).toMatchObject({
      boundaryCount: 3,
      startBoundaryCount: 1,
      interiorBoundaryCount: 1,
      endBoundaryCount: 1,
      oneSidedBoundaryCount: 2,
      twoSidedBoundaryCount: 1,
      trianglePairCountPerSample: 15,
      aggregateTwoSidedPairComparisonRowCount: 15,
      aggregateChangedPairRowCount: 3,
      aggregateUnchangedPairRowCount: 12,
      boundariesWithAnyStaticStrataChangeCount: 1,
      boundariesWithCrossingEvidencePairCountChangeCount: 1,
      boundariesWithCrossingEvidencePairCountIncreaseCount: 0,
      boundariesWithCrossingEvidencePairCountDecreaseCount: 1,
    });
    expect(
      record.boundaryDeltas.map((entry) => ({
        location: entry.boundaryLocation,
        adjacency: entry.adjacencyKind,
        leftCell: entry.leftCellSample?.cellIndex ?? null,
        rightCell: entry.rightCellSample?.cellIndex ?? null,
      })),
    ).toEqual([
      { location: 'start', adjacency: 'right-cell-only', leftCell: null, rightCell: 0 },
      {
        location: 'interior',
        adjacency: 'left-and-right-cells',
        leftCell: 0,
        rightCell: 1,
      },
      { location: 'end', adjacency: 'left-cell-only', leftCell: 1, rightCell: null },
    ]);

    const interior = record.boundaryDeltas[1];
    if (interior === undefined) throw new TypeError('interior delta row must exist');
    expect(interior.boundary).toBe(record.cellStaticSamples.eventTimePartition.boundaries[1]);
    expect(interior.leftCellSample).toBe(record.cellStaticSamples.cellSamples[0]);
    expect(interior.rightCellSample).toBe(record.cellStaticSamples.cellSamples[1]);
    expect(record.boundaryDeltas[0]?.rightCounters).toEqual(SYMMETRIC_LEFT_COUNTERS);
    expect(interior.leftCounters).toEqual(SYMMETRIC_LEFT_COUNTERS);
    expect(interior.rightCounters).toEqual(SYMMETRIC_RIGHT_COUNTERS);
    expect(record.boundaryDeltas[2]?.leftCounters).toEqual(SYMMETRIC_RIGHT_COUNTERS);
    expect(interior.rightMinusLeftCounterDelta).toEqual(SYMMETRIC_RIGHT_MINUS_LEFT);
    expect(interior).toMatchObject({
      comparedPairRowCount: 15,
      changedPairRowCount: 3,
      unchangedPairRowCount: 12,
      staticNonadjacentInteriorCrossingDetectedChanged: true,
      nonadjacentStaticInteriorCrossingEvidencePairCountChanged: true,
    });
    expect(interior.changedPairs.map((pair) => pair.pairIndex)).toEqual([3, 4, 8]);

    for (const changed of interior.changedPairs) {
      const leftPair = interior.leftCellSample?.staticSample.strata.pairs[changed.pairIndex];
      const rightPair = interior.rightCellSample?.staticSample.strata.pairs[changed.pairIndex];
      if (leftPair === undefined || rightPair === undefined) {
        throw new TypeError('changed pair must join to both source sample ledgers');
      }
      expect(changed).toMatchObject({
        trianglePairId: `pair:${String(leftPair.firstTriangleId.length)}:${leftPair.firstTriangleId}|${String(leftPair.secondTriangleId.length)}:${leftPair.secondTriangleId}`,
        firstTriangleId: leftPair.firstTriangleId,
        secondTriangleId: leftPair.secondTriangleId,
        firstFaceId: 'candidate-face:000001',
        secondFaceId: 'candidate-face:000003',
        topologyRelation: 'distinct-nonadjacent-faces',
        categoryChanged: true,
        staticStrataSignatureChanged: true,
        staticNonadjacentInteriorCrossingChanged: true,
        leftSignature: {
          category: 'nonadjacent-static-interior-crossing-evidence',
          character: 'noncoplanar-interior-interior-segment-intersection',
          triangleARelativeLocation: 'interior',
          triangleBRelativeLocation: 'interior',
          relativeLocationSample: 'open-segment-midpoint',
          supportingPlaneRelation: 'intersecting-planes',
          locusKind: 'segment',
          staticNonadjacentInteriorCrossingDetected: true,
          staticInteriorInteriorIntersectionDetected: true,
        },
        rightSignature: {
          category: 'disjoint',
          character: 'disjoint',
          triangleARelativeLocation: 'none',
          triangleBRelativeLocation: 'none',
          relativeLocationSample: 'none',
          supportingPlaneRelation: 'intersecting-planes',
          locusKind: 'empty',
          staticNonadjacentInteriorCrossingDetected: false,
          staticInteriorInteriorIntersectionDetected: false,
        },
      });
      expect(changed.firstTriangleId).toBe(rightPair.firstTriangleId);
      expect(changed.secondTriangleId).toBe(rightPair.secondTriangleId);
    }
  });

  it('fails closed and deeply freezes success and failure evidence', () => {
    const accessorInput = makeTwoFaceQuarterTransitionFixture();
    Object.defineProperty(accessorInput, 'stepId', {
      enumerable: true,
      configurable: true,
      get() {
        throw new TypeError('caller accessor must never be invoked');
      },
    });
    const rejected =
      analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1(accessorInput);
    expect(rejected).toEqual({
      ok: false,
      error: [
        {
          stage: 'cell-static-samples',
          path: '$',
          code: 'invalid-source-snapshot',
          message: 'transition input must be one bounded acyclic accessor-free plain-data snapshot',
        },
      ],
    });
    expect(Object.isFrozen(rejected)).toBe(true);
    if (rejected.ok) throw new TypeError('accessor input must fail closed');
    expect(Object.isFrozen(rejected.error)).toBe(true);
    expect(Object.isFrozen(rejected.error[0])).toBe(true);

    const result = analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1(
      makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture(),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('symmetric ledger must succeed');
    const interior = result.value.boundaryDeltas[1];
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.boundaryDeltas)).toBe(true);
    expect(Object.isFrozen(interior)).toBe(true);
    expect(Object.isFrozen(interior?.leftCounters)).toBe(true);
    expect(Object.isFrozen(interior?.changedPairs)).toBe(true);
    expect(Object.isFrozen(interior?.changedPairs[0]?.leftSignature)).toBe(true);
    expect(Object.isFrozen(result.value.cellStaticSamples)).toBe(true);
  });

  it('keeps sample-side deltas inside an explicit no-claim boundary', () => {
    const record = analyze(makeSymmetricThreeFaceAlgebraicCrossingTransitionFixture());
    expect(record).toMatchObject({
      sourceCellSamplerSingleOwnedSnapshotCompositionReused: true,
      everyGlobalBoundaryJoinedExactlyOnce: true,
      startBoundaryJoinedToRightCellOnly: true,
      endBoundaryJoinedToLeftCellOnly: true,
      everyInteriorBoundaryJoinedToImmediateLeftAndRightCells: true,
      allTwoSidedTrianglePairsJoinedByCanonicalIds: true,
      completeTwoSidedCategoricalStrataComparisonIncluded: true,
      onlyChangedPairRowsRetainedInDeltaLists: true,
      exactStaticCounterDeltasIncluded: true,
      sampleSideComparisonOnly: true,
      rootBoundaryGeometryIncluded: false,
      openCellStrataConstancyEstablished: false,
      sampleDifferenceOccursAtBoundaryEstablished: false,
      featureContainmentAtRootsIncluded: false,
      persistentEventSubdivisionIncluded: false,
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
