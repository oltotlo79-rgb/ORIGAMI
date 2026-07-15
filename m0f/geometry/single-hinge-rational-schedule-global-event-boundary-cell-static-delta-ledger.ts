import { deepFreezeOwned } from '../clone-and-freeze.js';
import type { StaticRationalTriangleFoldMeshStrataPairV1 } from './static-rational-triangle-fold-mesh-strata.js';
import {
  analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS,
  type SingleHingeRationalScheduleGlobalEventCellStaticSampleV1,
  type SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1,
} from './single-hinge-rational-schedule-global-event-cell-static-samples.js';
import type { SingleHingeRationalScheduleGlobalEventBoundaryV1 } from './single-hinge-rational-schedule-global-event-time-partition.js';

export const SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_CELL_STATIC_DELTA_LIMITS =
  deepFreezeOwned({
    maxBoundaryRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxOpenCellSamples + 1,
    maxTwoSidedPairComparisonRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxAggregateStaticTrianglePairRows,
    maxChangedPairRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxAggregateStaticTrianglePairRows,
  });

export type SingleHingeRationalScheduleStaticStrataCounterSnapshotV1 = Readonly<{
  disjointPairCount: number;
  sameFaceTriangulationContactCandidatePairCount: number;
  sameFaceUnexpectedIntersectionEvidencePairCount: number;
  declaredHingeContactContainedCandidatePairCount: number;
  declaredHingeOffAxisIntersectionEvidencePairCount: number;
  nonadjacentStaticInteriorCrossingEvidencePairCount: number;
  nonadjacentContactRequiresMotionHistoryPairCount: number;
  nonadjacentCoplanarAreaRequiresLayerOrderPairCount: number;
  rawStaticInteriorInteriorIntersectionPairCount: number;
  rawStaticContactCandidatePairCount: number;
  rawCoplanarAreaOverlapPairCount: number;
  rawRequiresMotionSideHistoryPairCount: number;
  rawRequiresLayerOrderPairCount: number;
}>;

export type SingleHingeRationalScheduleStaticPairStrataSignatureV1 = Readonly<{
  category: StaticRationalTriangleFoldMeshStrataPairV1['category'];
  character: StaticRationalTriangleFoldMeshStrataPairV1['strata']['character'];
  triangleARelativeLocation: StaticRationalTriangleFoldMeshStrataPairV1['strata']['triangleARelativeLocation'];
  triangleBRelativeLocation: StaticRationalTriangleFoldMeshStrataPairV1['strata']['triangleBRelativeLocation'];
  relativeLocationSample: StaticRationalTriangleFoldMeshStrataPairV1['strata']['strata']['relativeLocationSample'];
  supportingPlaneRelation: StaticRationalTriangleFoldMeshStrataPairV1['strata']['strata']['locus']['supportingPlaneRelation'];
  locusKind: StaticRationalTriangleFoldMeshStrataPairV1['strata']['strata']['locus']['locusKind'];
  declaredHingeLocusContained: boolean;
  sharedTriangulationFeatureLocusContained: boolean;
  staticNonadjacentInteriorCrossingDetected: boolean;
  staticInteriorInteriorIntersectionDetected: boolean;
  staticContactCandidate: boolean;
  coplanarAreaOverlapDetected: boolean;
  requiresMotionSideHistory: boolean;
  requiresLayerOrder: boolean;
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryChangedStaticPairV1 = Readonly<{
  pairIndex: number;
  trianglePairId: string;
  firstTriangleId: string;
  secondTriangleId: string;
  firstFaceId: string;
  secondFaceId: string;
  topologyRelation: StaticRationalTriangleFoldMeshStrataPairV1['topology']['pairRelation'];
  leftSignature: SingleHingeRationalScheduleStaticPairStrataSignatureV1;
  rightSignature: SingleHingeRationalScheduleStaticPairStrataSignatureV1;
  categoryChanged: boolean;
  staticStrataSignatureChanged: boolean;
  staticNonadjacentInteriorCrossingChanged: boolean;
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaV1 = Readonly<{
  boundaryIndex: number;
  boundaryId: string;
  boundaryLocation: SingleHingeRationalScheduleGlobalEventBoundaryV1['location'];
  adjacencyKind: 'right-cell-only' | 'left-and-right-cells' | 'left-cell-only';
  boundary: SingleHingeRationalScheduleGlobalEventBoundaryV1;
  leftCellSample: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1 | null;
  rightCellSample: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1 | null;
  leftCounters: SingleHingeRationalScheduleStaticStrataCounterSnapshotV1 | null;
  rightCounters: SingleHingeRationalScheduleStaticStrataCounterSnapshotV1 | null;
  rightMinusLeftCounterDelta: SingleHingeRationalScheduleStaticStrataCounterSnapshotV1 | null;
  comparedPairRowCount: number;
  changedPairRowCount: number;
  unchangedPairRowCount: number;
  changedPairs: readonly SingleHingeRationalScheduleGlobalEventBoundaryChangedStaticPairV1[];
  staticNonadjacentInteriorCrossingDetectedChanged: boolean | null;
  nonadjacentStaticInteriorCrossingEvidencePairCountChanged: boolean | null;
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'sample-side-static-strata-deltas-across-every-global-event-boundary';
  arithmetic: 'exact-source-samples-with-safe-integer-categorical-deltas';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  boundaryCount: number;
  startBoundaryCount: number;
  interiorBoundaryCount: number;
  endBoundaryCount: number;
  oneSidedBoundaryCount: number;
  twoSidedBoundaryCount: number;
  trianglePairCountPerSample: number;
  aggregateTwoSidedPairComparisonRowCount: number;
  aggregateChangedPairRowCount: number;
  aggregateUnchangedPairRowCount: number;
  boundariesWithAnyStaticStrataChangeCount: number;
  boundariesWithCrossingEvidencePairCountChangeCount: number;
  boundariesWithCrossingEvidencePairCountIncreaseCount: number;
  boundariesWithCrossingEvidencePairCountDecreaseCount: number;
  boundaryDeltas: readonly SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaV1[];
  cellStaticSamples: SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1;
  sourceCellSamplerSingleOwnedSnapshotCompositionReused: true;
  everyGlobalBoundaryJoinedExactlyOnce: true;
  startBoundaryJoinedToRightCellOnly: true;
  endBoundaryJoinedToLeftCellOnly: true;
  everyInteriorBoundaryJoinedToImmediateLeftAndRightCells: true;
  allTwoSidedTrianglePairsJoinedByCanonicalIds: true;
  completeTwoSidedCategoricalStrataComparisonIncluded: true;
  onlyChangedPairRowsRetainedInDeltaLists: true;
  exactStaticCounterDeltasIncluded: true;
  sampleSideComparisonOnly: true;
  rootBoundaryGeometryIncluded: false;
  openCellStrataConstancyEstablished: false;
  sampleDifferenceOccursAtBoundaryEstablished: false;
  featureContainmentAtRootsIncluded: false;
  persistentEventSubdivisionIncluded: false;
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

export type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerIssueV1 = Readonly<{
  stage: 'cell-static-samples' | 'boundary-cell-join' | 'pair-delta';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerIssueV1[];
    }>;

function issue(
  stage: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerIssueV1[],
): SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function counterSnapshot(
  cell: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1,
): SingleHingeRationalScheduleStaticStrataCounterSnapshotV1 {
  const mesh = cell.staticSample.strata;
  const raw = mesh.strataCensus;
  return {
    disjointPairCount: mesh.disjointPairCount,
    sameFaceTriangulationContactCandidatePairCount:
      mesh.sameFaceTriangulationContactCandidatePairCount,
    sameFaceUnexpectedIntersectionEvidencePairCount:
      mesh.sameFaceUnexpectedIntersectionEvidencePairCount,
    declaredHingeContactContainedCandidatePairCount:
      mesh.declaredHingeContactContainedCandidatePairCount,
    declaredHingeOffAxisIntersectionEvidencePairCount:
      mesh.declaredHingeOffAxisIntersectionEvidencePairCount,
    nonadjacentStaticInteriorCrossingEvidencePairCount:
      mesh.nonadjacentStaticInteriorCrossingEvidencePairCount,
    nonadjacentContactRequiresMotionHistoryPairCount:
      mesh.nonadjacentContactRequiresMotionHistoryPairCount,
    nonadjacentCoplanarAreaRequiresLayerOrderPairCount:
      mesh.nonadjacentCoplanarAreaRequiresLayerOrderPairCount,
    rawStaticInteriorInteriorIntersectionPairCount: raw.staticInteriorInteriorIntersectionPairCount,
    rawStaticContactCandidatePairCount: raw.staticContactCandidatePairCount,
    rawCoplanarAreaOverlapPairCount: raw.coplanarAreaOverlapPairCount,
    rawRequiresMotionSideHistoryPairCount: raw.requiresMotionSideHistoryPairCount,
    rawRequiresLayerOrderPairCount: raw.requiresLayerOrderPairCount,
  };
}

function counterDelta(
  left: SingleHingeRationalScheduleStaticStrataCounterSnapshotV1,
  right: SingleHingeRationalScheduleStaticStrataCounterSnapshotV1,
): SingleHingeRationalScheduleStaticStrataCounterSnapshotV1 {
  return {
    disjointPairCount: right.disjointPairCount - left.disjointPairCount,
    sameFaceTriangulationContactCandidatePairCount:
      right.sameFaceTriangulationContactCandidatePairCount -
      left.sameFaceTriangulationContactCandidatePairCount,
    sameFaceUnexpectedIntersectionEvidencePairCount:
      right.sameFaceUnexpectedIntersectionEvidencePairCount -
      left.sameFaceUnexpectedIntersectionEvidencePairCount,
    declaredHingeContactContainedCandidatePairCount:
      right.declaredHingeContactContainedCandidatePairCount -
      left.declaredHingeContactContainedCandidatePairCount,
    declaredHingeOffAxisIntersectionEvidencePairCount:
      right.declaredHingeOffAxisIntersectionEvidencePairCount -
      left.declaredHingeOffAxisIntersectionEvidencePairCount,
    nonadjacentStaticInteriorCrossingEvidencePairCount:
      right.nonadjacentStaticInteriorCrossingEvidencePairCount -
      left.nonadjacentStaticInteriorCrossingEvidencePairCount,
    nonadjacentContactRequiresMotionHistoryPairCount:
      right.nonadjacentContactRequiresMotionHistoryPairCount -
      left.nonadjacentContactRequiresMotionHistoryPairCount,
    nonadjacentCoplanarAreaRequiresLayerOrderPairCount:
      right.nonadjacentCoplanarAreaRequiresLayerOrderPairCount -
      left.nonadjacentCoplanarAreaRequiresLayerOrderPairCount,
    rawStaticInteriorInteriorIntersectionPairCount:
      right.rawStaticInteriorInteriorIntersectionPairCount -
      left.rawStaticInteriorInteriorIntersectionPairCount,
    rawStaticContactCandidatePairCount:
      right.rawStaticContactCandidatePairCount - left.rawStaticContactCandidatePairCount,
    rawCoplanarAreaOverlapPairCount:
      right.rawCoplanarAreaOverlapPairCount - left.rawCoplanarAreaOverlapPairCount,
    rawRequiresMotionSideHistoryPairCount:
      right.rawRequiresMotionSideHistoryPairCount - left.rawRequiresMotionSideHistoryPairCount,
    rawRequiresLayerOrderPairCount:
      right.rawRequiresLayerOrderPairCount - left.rawRequiresLayerOrderPairCount,
  };
}

function strataSignature(
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

function staticStrataSignatureChanged(
  left: SingleHingeRationalScheduleStaticPairStrataSignatureV1,
  right: SingleHingeRationalScheduleStaticPairStrataSignatureV1,
): boolean {
  return (
    left.character !== right.character ||
    left.triangleARelativeLocation !== right.triangleARelativeLocation ||
    left.triangleBRelativeLocation !== right.triangleBRelativeLocation ||
    left.relativeLocationSample !== right.relativeLocationSample ||
    left.supportingPlaneRelation !== right.supportingPlaneRelation ||
    left.locusKind !== right.locusKind ||
    left.declaredHingeLocusContained !== right.declaredHingeLocusContained ||
    left.sharedTriangulationFeatureLocusContained !==
      right.sharedTriangulationFeatureLocusContained ||
    left.staticNonadjacentInteriorCrossingDetected !==
      right.staticNonadjacentInteriorCrossingDetected ||
    left.staticInteriorInteriorIntersectionDetected !==
      right.staticInteriorInteriorIntersectionDetected ||
    left.staticContactCandidate !== right.staticContactCandidate ||
    left.coplanarAreaOverlapDetected !== right.coplanarAreaOverlapDetected ||
    left.requiresMotionSideHistory !== right.requiresMotionSideHistory ||
    left.requiresLayerOrder !== right.requiresLayerOrder
  );
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function samePairIdentity(
  left: StaticRationalTriangleFoldMeshStrataPairV1,
  right: StaticRationalTriangleFoldMeshStrataPairV1,
  expectedPairIndex: number,
): boolean {
  return (
    left.pairIndex === expectedPairIndex &&
    right.pairIndex === expectedPairIndex &&
    left.firstTriangleId === right.firstTriangleId &&
    left.secondTriangleId === right.secondTriangleId &&
    left.firstFaceId === right.firstFaceId &&
    left.secondFaceId === right.secondFaceId &&
    left.topology.pairIndex === right.topology.pairIndex &&
    left.topology.pairRelation === right.topology.pairRelation &&
    left.topology.directIncidence === right.topology.directIncidence &&
    sameStrings(left.topology.sharedMeshVertexIds, right.topology.sharedMeshVertexIds) &&
    sameStrings(
      left.topology.declaredHingeEdgeIdsForFacePair,
      right.topology.declaredHingeEdgeIdsForFacePair,
    ) &&
    sameStrings(
      left.topology.directlySharedDeclaredHingeEdgeIds,
      right.topology.directlySharedDeclaredHingeEdgeIds,
    )
  );
}

function trianglePairId(firstTriangleId: string, secondTriangleId: string): string {
  return `pair:${String(firstTriangleId.length)}:${firstTriangleId}|${String(secondTriangleId.length)}:${secondTriangleId}`;
}

function changedPairs(
  leftCell: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1,
  rightCell: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1,
):
  | Readonly<{
      ok: true;
      comparedPairRowCount: number;
      changedPairs: readonly SingleHingeRationalScheduleGlobalEventBoundaryChangedStaticPairV1[];
    }>
  | Readonly<{ ok: false }> {
  const leftPairs = leftCell.staticSample.strata.pairs;
  const rightPairs = rightCell.staticSample.strata.pairs;
  if (leftPairs.length !== rightPairs.length) return { ok: false };
  const changed: SingleHingeRationalScheduleGlobalEventBoundaryChangedStaticPairV1[] = [];
  for (let pairIndex = 0; pairIndex < leftPairs.length; pairIndex += 1) {
    const left = leftPairs[pairIndex];
    const right = rightPairs[pairIndex];
    if (left === undefined || right === undefined || !samePairIdentity(left, right, pairIndex)) {
      return { ok: false };
    }
    const leftSignature = strataSignature(left);
    const rightSignature = strataSignature(right);
    const categoryChanged = leftSignature.category !== rightSignature.category;
    const signatureChanged = staticStrataSignatureChanged(leftSignature, rightSignature);
    if (!categoryChanged && !signatureChanged) continue;
    changed.push({
      pairIndex,
      trianglePairId: trianglePairId(left.firstTriangleId, left.secondTriangleId),
      firstTriangleId: left.firstTriangleId,
      secondTriangleId: left.secondTriangleId,
      firstFaceId: left.firstFaceId,
      secondFaceId: left.secondFaceId,
      topologyRelation: left.topology.pairRelation,
      leftSignature,
      rightSignature,
      categoryChanged,
      staticStrataSignatureChanged: signatureChanged,
      staticNonadjacentInteriorCrossingChanged:
        left.staticNonadjacentInteriorCrossingDetected !==
        right.staticNonadjacentInteriorCrossingDetected,
    });
  }
  return { ok: true, comparedPairRowCount: leftPairs.length, changedPairs: changed };
}

/** Joins every global boundary to its adjacent exact static open-cell samples. */
export function analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerResultV1 {
  const sampled =
    analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(suppliedTransition);
  if (!sampled.ok) {
    return failure(
      sampled.error.map((entry) =>
        issue('cell-static-samples', entry.path, entry.code, entry.message),
      ),
    );
  }
  const source = sampled.value;
  const partition = source.eventTimePartition;
  const pairCount = partition.eventRootCensus.unorderedTrianglePairCount;
  const expectedComparisonCount = partition.interiorBoundaryCount * pairCount;
  if (
    partition.boundaryCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_CELL_STATIC_DELTA_LIMITS.maxBoundaryRows ||
    !Number.isSafeInteger(expectedComparisonCount) ||
    expectedComparisonCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_CELL_STATIC_DELTA_LIMITS.maxTwoSidedPairComparisonRows
  ) {
    return failure([
      issue(
        'boundary-cell-join',
        '$.cellStaticSamples.eventTimePartition',
        'boundary-static-delta-limit-exceeded',
        'boundary rows or complete two-sided pair comparisons exceed the defensive ledger limit',
      ),
    ]);
  }

  try {
    if (
      partition.boundaryCount !== source.openCellCount + 1 ||
      partition.boundaries.length !== partition.boundaryCount ||
      source.cellSamples.length !== source.openCellCount
    ) {
      throw new TypeError('global boundary and open-cell cardinalities disagree');
    }
    const boundaryDeltas: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaV1[] = [];
    let aggregateTwoSidedPairComparisonRowCount = 0;
    let aggregateChangedPairRowCount = 0;
    for (const [boundaryIndex, boundary] of partition.boundaries.entries()) {
      if (boundary.boundaryIndex !== boundaryIndex) {
        throw new TypeError('global boundary index is not canonical');
      }
      const leftCell = boundaryIndex === 0 ? null : source.cellSamples[boundaryIndex - 1];
      const rightCell =
        boundaryIndex === partition.boundaryCount - 1 ? null : source.cellSamples[boundaryIndex];
      if (
        (leftCell !== null && leftCell === undefined) ||
        (rightCell !== null && rightCell === undefined)
      ) {
        throw new TypeError('one adjacent open-cell sample is missing');
      }
      const adjacencyKind =
        boundary.location === 'start'
          ? ('right-cell-only' as const)
          : boundary.location === 'end'
            ? ('left-cell-only' as const)
            : ('left-and-right-cells' as const);
      if (
        (boundary.location === 'start' &&
          (boundaryIndex !== 0 || leftCell !== null || rightCell === null)) ||
        (boundary.location === 'end' &&
          (boundaryIndex !== partition.boundaryCount - 1 ||
            leftCell === null ||
            rightCell !== null)) ||
        (boundary.location === 'interior' && (leftCell === null || rightCell === null))
      ) {
        throw new TypeError('boundary location and adjacent-cell sidedness disagree');
      }
      const leftCounters = leftCell === null ? null : counterSnapshot(leftCell);
      const rightCounters = rightCell === null ? null : counterSnapshot(rightCell);
      let comparedPairRowCount = 0;
      let changes: readonly SingleHingeRationalScheduleGlobalEventBoundaryChangedStaticPairV1[] =
        [];
      if (leftCell !== null && rightCell !== null) {
        const compared = changedPairs(leftCell, rightCell);
        if (!compared.ok) {
          return failure([
            issue(
              'pair-delta',
              `$.boundaryDeltas[${String(boundaryIndex)}].changedPairs`,
              'triangle-pair-source-mismatch',
              'left and right static samples do not expose the same canonical triangle-pair ledger',
            ),
          ]);
        }
        comparedPairRowCount = compared.comparedPairRowCount;
        changes = compared.changedPairs;
      }
      aggregateTwoSidedPairComparisonRowCount += comparedPairRowCount;
      aggregateChangedPairRowCount += changes.length;
      if (
        aggregateChangedPairRowCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_CELL_STATIC_DELTA_LIMITS.maxChangedPairRows
      ) {
        return failure([
          issue(
            'pair-delta',
            '$.boundaryDeltas',
            'changed-pair-row-limit-exceeded',
            'changed static pair rows exceed the defensive ledger limit',
          ),
        ]);
      }
      boundaryDeltas.push({
        boundaryIndex,
        boundaryId: boundary.boundaryId,
        boundaryLocation: boundary.location,
        adjacencyKind,
        boundary,
        leftCellSample: leftCell,
        rightCellSample: rightCell,
        leftCounters,
        rightCounters,
        rightMinusLeftCounterDelta:
          leftCounters === null || rightCounters === null
            ? null
            : counterDelta(leftCounters, rightCounters),
        comparedPairRowCount,
        changedPairRowCount: changes.length,
        unchangedPairRowCount: comparedPairRowCount - changes.length,
        changedPairs: changes,
        staticNonadjacentInteriorCrossingDetectedChanged:
          leftCell === null || rightCell === null
            ? null
            : leftCell.staticNonadjacentInteriorCrossingDetected !==
              rightCell.staticNonadjacentInteriorCrossingDetected,
        nonadjacentStaticInteriorCrossingEvidencePairCountChanged:
          leftCell === null || rightCell === null
            ? null
            : leftCell.nonadjacentStaticInteriorCrossingEvidencePairCount !==
              rightCell.nonadjacentStaticInteriorCrossingEvidencePairCount,
      });
    }
    const startBoundaryCount = boundaryDeltas.filter(
      (entry) => entry.boundaryLocation === 'start',
    ).length;
    const interiorBoundaryCount = boundaryDeltas.filter(
      (entry) => entry.boundaryLocation === 'interior',
    ).length;
    const endBoundaryCount = boundaryDeltas.filter(
      (entry) => entry.boundaryLocation === 'end',
    ).length;
    if (
      startBoundaryCount !== 1 ||
      endBoundaryCount !== 1 ||
      interiorBoundaryCount !== partition.interiorBoundaryCount ||
      aggregateTwoSidedPairComparisonRowCount !== expectedComparisonCount
    ) {
      throw new TypeError('complete boundary adjacency and pair comparison counts disagree');
    }
    const boundariesWithAnyStaticStrataChangeCount = boundaryDeltas.filter(
      (entry) => entry.changedPairRowCount > 0,
    ).length;
    const crossingChanged = boundaryDeltas.filter(
      (entry) => entry.nonadjacentStaticInteriorCrossingEvidencePairCountChanged === true,
    );
    const crossingDelta = (
      entry: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaV1,
    ) => entry.rightMinusLeftCounterDelta?.nonadjacentStaticInteriorCrossingEvidencePairCount ?? 0;
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType:
          'm0f-single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'sample-side-static-strata-deltas-across-every-global-event-boundary' as const,
        arithmetic: 'exact-source-samples-with-safe-integer-categorical-deltas' as const,
        transitionRevisionId: source.transitionRevisionId,
        stepId: source.stepId,
        meshRevisionId: source.meshRevisionId,
        triangulationRevisionId: source.triangulationRevisionId,
        boundaryCount: boundaryDeltas.length,
        startBoundaryCount,
        interiorBoundaryCount,
        endBoundaryCount,
        oneSidedBoundaryCount: startBoundaryCount + endBoundaryCount,
        twoSidedBoundaryCount: interiorBoundaryCount,
        trianglePairCountPerSample: pairCount,
        aggregateTwoSidedPairComparisonRowCount,
        aggregateChangedPairRowCount,
        aggregateUnchangedPairRowCount:
          aggregateTwoSidedPairComparisonRowCount - aggregateChangedPairRowCount,
        boundariesWithAnyStaticStrataChangeCount,
        boundariesWithCrossingEvidencePairCountChangeCount: crossingChanged.length,
        boundariesWithCrossingEvidencePairCountIncreaseCount: crossingChanged.filter(
          (entry) => crossingDelta(entry) > 0,
        ).length,
        boundariesWithCrossingEvidencePairCountDecreaseCount: crossingChanged.filter(
          (entry) => crossingDelta(entry) < 0,
        ).length,
        boundaryDeltas,
        cellStaticSamples: source,
        sourceCellSamplerSingleOwnedSnapshotCompositionReused: true as const,
        everyGlobalBoundaryJoinedExactlyOnce: true as const,
        startBoundaryJoinedToRightCellOnly: true as const,
        endBoundaryJoinedToLeftCellOnly: true as const,
        everyInteriorBoundaryJoinedToImmediateLeftAndRightCells: true as const,
        allTwoSidedTrianglePairsJoinedByCanonicalIds: true as const,
        completeTwoSidedCategoricalStrataComparisonIncluded: true as const,
        onlyChangedPairRowsRetainedInDeltaLists: true as const,
        exactStaticCounterDeltasIncluded: true as const,
        sampleSideComparisonOnly: true as const,
        rootBoundaryGeometryIncluded: false as const,
        openCellStrataConstancyEstablished: false as const,
        sampleDifferenceOccursAtBoundaryEstablished: false as const,
        featureContainmentAtRootsIncluded: false as const,
        persistentEventSubdivisionIncluded: false as const,
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
        'boundary-cell-join',
        '$',
        'boundary-cell-static-delta-invariant-failed',
        'global boundary adjacency and static delta assembly failed closed unexpectedly',
      ),
    ]);
  }
}
