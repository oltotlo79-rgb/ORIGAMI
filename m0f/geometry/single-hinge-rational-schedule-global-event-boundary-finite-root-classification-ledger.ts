import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  classifySingleHingeRationalScheduleEdgeEdgeCompactFromOwnedEventRootCensusV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS,
  type SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactRecordV1,
} from './single-hinge-rational-schedule-edge-edge-algebraic-containment.js';
import {
  analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_CELL_STATIC_DELTA_LIMITS,
  type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1,
  type SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaV1,
} from './single-hinge-rational-schedule-global-event-boundary-cell-static-delta-ledger.js';
import type {
  SingleHingeRationalScheduleEventOccurrenceV1,
  SingleHingeRationalScheduleGlobalEventBoundaryV1,
} from './single-hinge-rational-schedule-global-event-time-partition.js';
import {
  classifySingleHingeRationalScheduleVertexFaceRootContainmentCompactFromOwnedPolynomialCensusV1,
  SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS,
  type SingleHingeRationalScheduleVertexFaceRootContainmentCompactRecordV1,
} from './single-hinge-rational-schedule-vertex-face-root-containment.js';

export const SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS =
  deepFreezeOwned({
    maxBoundaryRows:
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_CELL_STATIC_DELTA_LIMITS.maxBoundaryRows,
    maxFiniteRootClassificationRows: 4_096,
    maxAuxiliarySignRows: 57_344,
    maxRetainedBigIntBits: 16_777_216,
    vertexFaceAuxiliarySignRowsPerClassification:
      SINGLE_HINGE_RATIONAL_SCHEDULE_VERTEX_FACE_ROOT_CONTAINMENT_LIMITS.algebraicSignEvaluationCount,
    edgeEdgeMaximumAuxiliarySignRowsPerClassification:
      SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.maxAuxiliaryPolynomialCount,
  });

export type SingleHingeRationalScheduleFiniteRootClassificationCountersV1 = Readonly<{
  vertexFaceOutsideCount: number;
  vertexFaceVertexCount: number;
  vertexFaceEdgeCount: number;
  vertexFaceInteriorCount: number;
  edgeEdgeDisjointCount: number;
  edgeEdgeEndpointContactCount: number;
  edgeEdgeProperInteriorCrossingCount: number;
  edgeEdgeCollinearOverlapCount: number;
}>;

type FiniteRootClassificationBaseV1 = Readonly<{
  globalClassificationIndex: number;
  boundaryOccurrenceIndex: number;
  boundaryIndex: number;
  boundaryId: string;
  boundaryLocation: SingleHingeRationalScheduleGlobalEventBoundaryV1['location'];
  occurrence: SingleHingeRationalScheduleEventOccurrenceV1;
  auxiliarySignRowCount: number;
  retainedBigIntBits: number;
}>;

export type SingleHingeRationalScheduleVertexFaceFiniteRootClassificationV1 =
  FiniteRootClassificationBaseV1 &
    Readonly<{
      classificationKind: 'vertex-face-root-containment';
      eventKind: 'vertex-face-plane';
      classification: SingleHingeRationalScheduleVertexFaceRootContainmentCompactRecordV1;
    }>;

export type SingleHingeRationalScheduleEdgeEdgeFiniteRootClassificationV1 =
  FiniteRootClassificationBaseV1 &
    Readonly<{
      classificationKind: 'edge-edge-algebraic-containment';
      eventKind: 'edge-edge-coplanarity';
      classification: SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactRecordV1;
    }>;

export type SingleHingeRationalScheduleFiniteRootClassificationV1 =
  | SingleHingeRationalScheduleVertexFaceFiniteRootClassificationV1
  | SingleHingeRationalScheduleEdgeEdgeFiniteRootClassificationV1;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationsV1 = Readonly<{
  boundaryIndex: number;
  boundaryId: string;
  boundaryLocation: SingleHingeRationalScheduleGlobalEventBoundaryV1['location'];
  boundary: SingleHingeRationalScheduleGlobalEventBoundaryV1;
  boundaryCellStaticDelta: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaV1;
  finiteRootOccurrenceCount: number;
  vertexFaceRootClassificationCount: number;
  edgeEdgeRootClassificationCount: number;
  auxiliarySignRowCount: number;
  retainedBigIntBits: number;
  classificationCounters: SingleHingeRationalScheduleFiniteRootClassificationCountersV1;
  occurrenceClassifications: readonly SingleHingeRationalScheduleFiniteRootClassificationV1[];
}>;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1 =
  Readonly<{
    schemaVersion: 1;
    recordType: 'm0f-single-hinge-rational-schedule-global-event-boundary-finite-root-classification-ledger';
    contractStatus: 'candidate-no-claim';
    predicateScope: 'all-finite-event-root-feature-classifications-at-every-global-event-boundary';
    arithmetic: 'exact-algebraic-root-signs-with-central-owned-source-composition';
    transitionRevisionId: string;
    stepId: string;
    meshRevisionId: string;
    triangulationRevisionId: string;
    boundaryCount: number;
    boundariesWithFiniteRootOccurrencesCount: number;
    finiteRootOccurrenceCount: number;
    classifiedFiniteRootOccurrenceCount: number;
    vertexFaceRootClassificationCount: number;
    edgeEdgeRootClassificationCount: number;
    preflightMaximumAuxiliarySignRowCount: number;
    auxiliarySignRowCount: number;
    aggregateRetainedBigIntBits: number;
    classificationCounters: SingleHingeRationalScheduleFiniteRootClassificationCountersV1;
    boundaryClassifications: readonly SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationsV1[];
    boundaryCellStaticDeltaLedger: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1;
    sourceBoundaryDeltaSingleOwnedSnapshotCompositionReused: true;
    sharedPolynomialAndRootCensusesRetainedOnlyInCentralSource: true;
    compactPerOccurrenceClassifierEvidenceRetained: true;
    everyGlobalBoundaryJoinedExactlyOnce: true;
    everyFiniteRootOccurrenceClassifiedExactlyOnceInCanonicalOrder: true;
    everyFiniteVertexFaceRootOccurrenceClassifiedExactly: true;
    everyFiniteEdgeEdgeRootOccurrenceClassifiedExactly: true;
    allClassificationResultsBoundToSourceOccurrenceAndRoot: true;
    finiteRootFeatureContainmentIncluded: true;
    sampleSideStaticDeltasRetained: true;
    persistentEventsRetainedOnlyInSource: true;
    persistentEventSubdivisionIncluded: false;
    eventOccurrenceDeduplicationIncluded: false;
    approachSeparationHistoryIncluded: false;
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

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerIssueV1 =
  Readonly<{
    stage:
      | 'boundary-cell-static-delta-ledger'
      | 'root-occurrence-preflight'
      | 'vertex-face-classification'
      | 'edge-edge-classification'
      | 'classification-join';
    path: string;
    code: string;
    message: string;
  }>;

export type SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerIssueV1[];
    }>;

interface MutableClassificationCounters {
  vertexFaceOutsideCount: number;
  vertexFaceVertexCount: number;
  vertexFaceEdgeCount: number;
  vertexFaceInteriorCount: number;
  edgeEdgeDisjointCount: number;
  edgeEdgeEndpointContactCount: number;
  edgeEdgeProperInteriorCrossingCount: number;
  edgeEdgeCollinearOverlapCount: number;
}

function issue(
  stage: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerIssueV1[],
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function emptyCounters(): MutableClassificationCounters {
  return {
    vertexFaceOutsideCount: 0,
    vertexFaceVertexCount: 0,
    vertexFaceEdgeCount: 0,
    vertexFaceInteriorCount: 0,
    edgeEdgeDisjointCount: 0,
    edgeEdgeEndpointContactCount: 0,
    edgeEdgeProperInteriorCrossingCount: 0,
    edgeEdgeCollinearOverlapCount: 0,
  };
}

function addCounters(
  target: MutableClassificationCounters,
  source: SingleHingeRationalScheduleFiniteRootClassificationCountersV1,
): void {
  target.vertexFaceOutsideCount += source.vertexFaceOutsideCount;
  target.vertexFaceVertexCount += source.vertexFaceVertexCount;
  target.vertexFaceEdgeCount += source.vertexFaceEdgeCount;
  target.vertexFaceInteriorCount += source.vertexFaceInteriorCount;
  target.edgeEdgeDisjointCount += source.edgeEdgeDisjointCount;
  target.edgeEdgeEndpointContactCount += source.edgeEdgeEndpointContactCount;
  target.edgeEdgeProperInteriorCrossingCount += source.edgeEdgeProperInteriorCrossingCount;
  target.edgeEdgeCollinearOverlapCount += source.edgeEdgeCollinearOverlapCount;
}

function incrementVertexFaceCounter(
  counters: MutableClassificationCounters,
  classification: SingleHingeRationalScheduleVertexFaceRootContainmentCompactRecordV1['classification'],
): void {
  switch (classification) {
    case 'outside':
      counters.vertexFaceOutsideCount += 1;
      break;
    case 'vertex':
      counters.vertexFaceVertexCount += 1;
      break;
    case 'edge':
      counters.vertexFaceEdgeCount += 1;
      break;
    case 'interior':
      counters.vertexFaceInteriorCount += 1;
      break;
  }
}

function incrementEdgeEdgeCounter(
  counters: MutableClassificationCounters,
  classification: SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactRecordV1['containmentClass'],
): void {
  switch (classification) {
    case 'disjoint':
      counters.edgeEdgeDisjointCount += 1;
      break;
    case 'endpoint-contact':
      counters.edgeEdgeEndpointContactCount += 1;
      break;
    case 'proper-interior-crossing':
      counters.edgeEdgeProperInteriorCrossingCount += 1;
      break;
    case 'collinear-overlap':
      counters.edgeEdgeCollinearOverlapCount += 1;
      break;
  }
}

function bigintBitLength(value: bigint): number {
  const magnitude = value < 0n ? -value : value;
  return magnitude.toString(2).length;
}

/** Counts every retained property path, matching JSON-style alias expansion. */
function retainedBigIntBitCount(value: unknown): number | undefined {
  if (typeof value === 'bigint') return bigintBitLength(value);
  if (typeof value !== 'object' || value === null) return 0;
  let total = 0;
  for (const child of Object.values(value)) {
    const childBits = retainedBigIntBitCount(child);
    if (childBits === undefined) return undefined;
    total += childBits;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

function occurrenceMatchesOwnedRoot(
  occurrence: SingleHingeRationalScheduleEventOccurrenceV1,
  boundary: SingleHingeRationalScheduleGlobalEventBoundaryV1,
  source: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1,
): boolean {
  const rootCensus = source.cellStaticSamples.eventTimePartition.eventRootCensus;
  const event = rootCensus.events[occurrence.eventIndex];
  const root = event?.isolation.roots[occurrence.rootIndex];
  return (
    event !== undefined &&
    event.eventIndex === occurrence.eventIndex &&
    event.eventId === occurrence.eventId &&
    event.pairIndex === occurrence.pairIndex &&
    event.firstTriangleId === occurrence.firstTriangleId &&
    event.secondTriangleId === occurrence.secondTriangleId &&
    event.eventKind === occurrence.eventKind &&
    root !== undefined &&
    root.rootIndex === occurrence.rootIndex &&
    root.multiplicity === occurrence.multiplicity &&
    root.location === boundary.location
  );
}

function revisionsMatch(
  record: Readonly<{
    transitionRevisionId: string;
    stepId: string;
    meshRevisionId: string;
    triangulationRevisionId: string;
  }>,
  source: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1,
): boolean {
  return (
    record.transitionRevisionId === source.transitionRevisionId &&
    record.stepId === source.stepId &&
    record.meshRevisionId === source.meshRevisionId &&
    record.triangulationRevisionId === source.triangulationRevisionId
  );
}

function vertexFaceClassificationMatchesOccurrence(
  classification: SingleHingeRationalScheduleVertexFaceRootContainmentCompactRecordV1,
  classificationId: string,
  occurrence: SingleHingeRationalScheduleEventOccurrenceV1,
  boundary: SingleHingeRationalScheduleGlobalEventBoundaryV1,
  source: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1,
): boolean {
  const rootEvent =
    source.cellStaticSamples.eventTimePartition.eventRootCensus.events[occurrence.eventIndex];
  const evidence = [
    ...classification.projectionAreaCandidates.map((entry) => entry.signEvidence),
    ...classification.edgeOrientations.map((entry) => entry.signEvidence),
  ];
  return (
    revisionsMatch(classification, source) &&
    classification.classificationId === classificationId &&
    classification.definingEventIndex === occurrence.eventIndex &&
    classification.definingEventId === occurrence.eventId &&
    classification.definingRootIndex === occurrence.rootIndex &&
    classification.definingEvent === rootEvent?.polynomial &&
    evidence.length ===
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.vertexFaceAuxiliarySignRowsPerClassification &&
    evidence.every(
      (entry) =>
        entry.definingPolynomialId === occurrence.eventId &&
        entry.definingRootIndex === occurrence.rootIndex &&
        entry.definingRootLocation === boundary.location &&
        entry.definingRootMultiplicity === occurrence.multiplicity,
    )
  );
}

function edgeEdgeClassificationMatchesOccurrence(
  classification: SingleHingeRationalScheduleEdgeEdgeAlgebraicContainmentCompactRecordV1,
  occurrence: SingleHingeRationalScheduleEventOccurrenceV1,
  boundary: SingleHingeRationalScheduleGlobalEventBoundaryV1,
  source: SingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerRecordV1,
): boolean {
  const rootEvent =
    source.cellStaticSamples.eventTimePartition.eventRootCensus.events[occurrence.eventIndex];
  const expectedAuxiliarySignCount =
    classification.directionRelation === 'nonparallel'
      ? SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.nonparallelAuxiliaryPolynomialCount
      : classification.directionRelation === 'parallel-noncollinear'
        ? SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.parallelNoncollinearAuxiliaryPolynomialCount
        : SINGLE_HINGE_RATIONAL_SCHEDULE_EDGE_EDGE_ALGEBRAIC_CONTAINMENT_LIMITS.collinearAuxiliaryPolynomialCount;
  return (
    revisionsMatch(classification, source) &&
    classification.eventIndex === occurrence.eventIndex &&
    classification.eventId === occurrence.eventId &&
    classification.pairIndex === occurrence.pairIndex &&
    classification.firstTriangleId === occurrence.firstTriangleId &&
    classification.secondTriangleId === occurrence.secondTriangleId &&
    classification.definingRootIndex === occurrence.rootIndex &&
    classification.definingRootLocation === boundary.location &&
    classification.definingRootMultiplicity === occurrence.multiplicity &&
    classification.event === rootEvent?.polynomial &&
    classification.auxiliarySigns.length === expectedAuxiliarySignCount &&
    classification.auxiliarySigns.every(
      (entry) =>
        entry.signEvidence.definingPolynomialId === occurrence.eventId &&
        entry.signEvidence.definingRootIndex === occurrence.rootIndex &&
        entry.signEvidence.definingRootLocation === boundary.location &&
        entry.signEvidence.definingRootMultiplicity === occurrence.multiplicity,
    )
  );
}

/** Classifies every finite root occurrence on every boundary of one owned global partition. */
export function analyzeSingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationLedgerResultV1 {
  const delta =
    analyzeSingleHingeRationalScheduleGlobalEventBoundaryCellStaticDeltaLedgerV1(
      suppliedTransition,
    );
  if (!delta.ok) {
    return failure(
      delta.error.map((entry) =>
        issue(
          'boundary-cell-static-delta-ledger',
          `$.boundaryCellStaticDeltaLedger${entry.path.slice(1)}`,
          entry.code,
          entry.message,
        ),
      ),
    );
  }

  const source = delta.value;
  const partition = source.cellStaticSamples.eventTimePartition;
  const rootCensus = partition.eventRootCensus;
  const polynomialCensus = rootCensus.polynomialCensus;
  let preflightFiniteRootOccurrenceCount = 0;
  let preflightVertexFaceCount = 0;
  let preflightEdgeEdgeCount = 0;
  try {
    if (
      partition.boundaryCount !== source.boundaryCount ||
      partition.boundaries.length !== source.boundaryDeltas.length ||
      partition.boundaryCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxBoundaryRows
    ) {
      return failure([
        issue(
          'root-occurrence-preflight',
          '$.boundaryCellStaticDeltaLedger',
          'boundary-classification-source-mismatch',
          'global boundary rows do not match the central static-delta source or its limit',
        ),
      ]);
    }
    for (const [boundaryIndex, boundary] of partition.boundaries.entries()) {
      const sourceDelta = source.boundaryDeltas[boundaryIndex];
      if (
        boundary.boundaryIndex !== boundaryIndex ||
        sourceDelta?.boundaryIndex !== boundaryIndex ||
        sourceDelta.boundary !== boundary ||
        sourceDelta.boundaryId !== boundary.boundaryId ||
        sourceDelta.boundaryLocation !== boundary.location ||
        boundary.finiteEventOccurrenceCount !== boundary.finiteEventOccurrences.length
      ) {
        return failure([
          issue(
            'root-occurrence-preflight',
            `$.boundaryCellStaticDeltaLedger.boundaryDeltas[${String(boundaryIndex)}]`,
            'boundary-classification-source-mismatch',
            'one boundary is not canonically joined to its central static-delta row',
          ),
        ]);
      }
      for (const occurrence of boundary.finiteEventOccurrences) {
        preflightFiniteRootOccurrenceCount += 1;
        if (occurrence.eventKind === 'vertex-face-plane') preflightVertexFaceCount += 1;
        else preflightEdgeEdgeCount += 1;
      }
    }
    const preflightMaximumAuxiliarySignRowCount =
      preflightVertexFaceCount *
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.vertexFaceAuxiliarySignRowsPerClassification +
      preflightEdgeEdgeCount *
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.edgeEdgeMaximumAuxiliarySignRowsPerClassification;
    if (
      preflightFiniteRootOccurrenceCount !== partition.finiteRootOccurrenceCount ||
      preflightVertexFaceCount + preflightEdgeEdgeCount !== preflightFiniteRootOccurrenceCount ||
      !Number.isSafeInteger(preflightMaximumAuxiliarySignRowCount)
    ) {
      return failure([
        issue(
          'root-occurrence-preflight',
          '$.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition',
          'finite-root-occurrence-ledger-invariant',
          'finite root occurrence counts are not one complete canonical partition ledger',
        ),
      ]);
    }
    if (
      preflightFiniteRootOccurrenceCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxFiniteRootClassificationRows
    ) {
      return failure([
        issue(
          'root-occurrence-preflight',
          '$.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition.boundaries',
          'finite-root-classification-row-limit-exceeded',
          'finite root classification rows exceed the defensive ledger limit',
        ),
      ]);
    }
    if (
      preflightMaximumAuxiliarySignRowCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxAuxiliarySignRows
    ) {
      return failure([
        issue(
          'root-occurrence-preflight',
          '$.boundaryCellStaticDeltaLedger.cellStaticSamples.eventTimePartition.boundaries',
          'auxiliary-sign-row-limit-exceeded',
          'worst-case exact auxiliary sign rows exceed the defensive ledger limit',
        ),
      ]);
    }

    const boundaryClassifications: SingleHingeRationalScheduleGlobalEventBoundaryFiniteRootClassificationsV1[] =
      [];
    const aggregateCounters = emptyCounters();
    let globalClassificationIndex = 0;
    let aggregateAuxiliarySignRowCount = 0;
    let aggregateRetainedBigIntBits = 0;
    for (const [boundaryIndex, boundary] of partition.boundaries.entries()) {
      const sourceDelta = source.boundaryDeltas[boundaryIndex];
      if (sourceDelta === undefined) throw new TypeError('preflight source delta disappeared');
      const occurrenceClassifications: SingleHingeRationalScheduleFiniteRootClassificationV1[] = [];
      const boundaryCounters = emptyCounters();
      let boundaryVertexFaceCount = 0;
      let boundaryEdgeEdgeCount = 0;
      let boundaryAuxiliarySignRowCount = 0;
      let boundaryRetainedBigIntBits = 0;
      for (const [
        boundaryOccurrenceIndex,
        occurrence,
      ] of boundary.finiteEventOccurrences.entries()) {
        const rowPath = `$.boundaryClassifications[${String(boundaryIndex)}].occurrenceClassifications[${String(boundaryOccurrenceIndex)}]`;
        if (!occurrenceMatchesOwnedRoot(occurrence, boundary, source)) {
          return failure([
            issue(
              'classification-join',
              rowPath,
              'root-occurrence-source-mismatch',
              'one finite occurrence does not match its owned event, root, and boundary location',
            ),
          ]);
        }

        let classificationRow: SingleHingeRationalScheduleFiniteRootClassificationV1;
        let rowAuxiliarySignCount: number;
        let rowRetainedBigIntBits: number | undefined;
        if (occurrence.eventKind === 'vertex-face-plane') {
          const classificationId = `vf-boundary-root:${String(occurrence.eventIndex)}:${String(occurrence.rootIndex)}`;
          const classified =
            classifySingleHingeRationalScheduleVertexFaceRootContainmentCompactFromOwnedPolynomialCensusV1(
              classificationId,
              polynomialCensus,
              occurrence.eventIndex,
              occurrence.rootIndex,
            );
          if (!classified.ok) {
            return failure(
              classified.error.map((entry) =>
                issue(
                  'vertex-face-classification',
                  `${rowPath}.classification${entry.path.slice(1)}`,
                  entry.code,
                  entry.message,
                ),
              ),
            );
          }
          if (
            !vertexFaceClassificationMatchesOccurrence(
              classified.value,
              classificationId,
              occurrence,
              boundary,
              source,
            )
          ) {
            return failure([
              issue(
                'classification-join',
                rowPath,
                'vertex-face-classification-source-mismatch',
                'one compact vertex-face result is not bound to its owned occurrence and root',
              ),
            ]);
          }
          rowAuxiliarySignCount =
            classified.value.projectionAreaCandidates.length +
            classified.value.edgeOrientations.length;
          rowRetainedBigIntBits = retainedBigIntBitCount(classified.value);
          boundaryVertexFaceCount += 1;
          incrementVertexFaceCounter(boundaryCounters, classified.value.classification);
          classificationRow = {
            globalClassificationIndex,
            boundaryOccurrenceIndex,
            boundaryIndex,
            boundaryId: boundary.boundaryId,
            boundaryLocation: boundary.location,
            occurrence,
            auxiliarySignRowCount: rowAuxiliarySignCount,
            retainedBigIntBits: rowRetainedBigIntBits ?? 0,
            classificationKind: 'vertex-face-root-containment',
            eventKind: 'vertex-face-plane',
            classification: classified.value,
          };
        } else {
          const classified =
            classifySingleHingeRationalScheduleEdgeEdgeCompactFromOwnedEventRootCensusV1(
              rootCensus,
              occurrence.eventIndex,
              occurrence.rootIndex,
            );
          if (!classified.ok) {
            return failure(
              classified.error.map((entry) =>
                issue(
                  'edge-edge-classification',
                  `${rowPath}.classification${entry.path.slice(1)}`,
                  entry.code,
                  entry.message,
                ),
              ),
            );
          }
          if (
            !edgeEdgeClassificationMatchesOccurrence(classified.value, occurrence, boundary, source)
          ) {
            return failure([
              issue(
                'classification-join',
                rowPath,
                'edge-edge-classification-source-mismatch',
                'one compact edge-edge result is not bound to its owned occurrence and root',
              ),
            ]);
          }
          rowAuxiliarySignCount = classified.value.auxiliarySigns.length;
          rowRetainedBigIntBits = retainedBigIntBitCount(classified.value);
          boundaryEdgeEdgeCount += 1;
          incrementEdgeEdgeCounter(boundaryCounters, classified.value.containmentClass);
          classificationRow = {
            globalClassificationIndex,
            boundaryOccurrenceIndex,
            boundaryIndex,
            boundaryId: boundary.boundaryId,
            boundaryLocation: boundary.location,
            occurrence,
            auxiliarySignRowCount: rowAuxiliarySignCount,
            retainedBigIntBits: rowRetainedBigIntBits ?? 0,
            classificationKind: 'edge-edge-algebraic-containment',
            eventKind: 'edge-edge-coplanarity',
            classification: classified.value,
          };
        }
        if (rowRetainedBigIntBits === undefined) {
          return failure([
            issue(
              'classification-join',
              `${rowPath}.classification`,
              'retained-bigint-bit-count-overflow',
              'retained compact evidence BigInt accounting exceeded safe-integer range',
            ),
          ]);
        }
        boundaryAuxiliarySignRowCount += rowAuxiliarySignCount;
        boundaryRetainedBigIntBits += rowRetainedBigIntBits;
        aggregateAuxiliarySignRowCount += rowAuxiliarySignCount;
        aggregateRetainedBigIntBits += rowRetainedBigIntBits;
        if (
          !Number.isSafeInteger(aggregateAuxiliarySignRowCount) ||
          aggregateAuxiliarySignRowCount >
            SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxAuxiliarySignRows
        ) {
          return failure([
            issue(
              'classification-join',
              `${rowPath}.classification`,
              'auxiliary-sign-row-limit-exceeded',
              'retained exact auxiliary sign rows exceed the defensive ledger limit',
            ),
          ]);
        }
        if (
          !Number.isSafeInteger(aggregateRetainedBigIntBits) ||
          aggregateRetainedBigIntBits >
            SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_BOUNDARY_FINITE_ROOT_CLASSIFICATION_LIMITS.maxRetainedBigIntBits
        ) {
          return failure([
            issue(
              'classification-join',
              `${rowPath}.classification`,
              'retained-bigint-bit-limit-exceeded',
              'retained compact evidence BigInt bits exceed the defensive ledger limit',
            ),
          ]);
        }
        occurrenceClassifications.push(classificationRow);
        globalClassificationIndex += 1;
      }
      if (
        occurrenceClassifications.length !== boundary.finiteEventOccurrenceCount ||
        boundaryVertexFaceCount + boundaryEdgeEdgeCount !== occurrenceClassifications.length
      ) {
        throw new TypeError('one boundary classification ledger is incomplete');
      }
      addCounters(aggregateCounters, boundaryCounters);
      boundaryClassifications.push({
        boundaryIndex,
        boundaryId: boundary.boundaryId,
        boundaryLocation: boundary.location,
        boundary,
        boundaryCellStaticDelta: sourceDelta,
        finiteRootOccurrenceCount: occurrenceClassifications.length,
        vertexFaceRootClassificationCount: boundaryVertexFaceCount,
        edgeEdgeRootClassificationCount: boundaryEdgeEdgeCount,
        auxiliarySignRowCount: boundaryAuxiliarySignRowCount,
        retainedBigIntBits: boundaryRetainedBigIntBits,
        classificationCounters: boundaryCounters,
        occurrenceClassifications,
      });
    }
    if (
      boundaryClassifications.length !== partition.boundaryCount ||
      globalClassificationIndex !== preflightFiniteRootOccurrenceCount ||
      aggregateAuxiliarySignRowCount > preflightMaximumAuxiliarySignRowCount
    ) {
      throw new TypeError('complete finite root classification counts disagree');
    }
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType:
          'm0f-single-hinge-rational-schedule-global-event-boundary-finite-root-classification-ledger' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'all-finite-event-root-feature-classifications-at-every-global-event-boundary' as const,
        arithmetic: 'exact-algebraic-root-signs-with-central-owned-source-composition' as const,
        transitionRevisionId: source.transitionRevisionId,
        stepId: source.stepId,
        meshRevisionId: source.meshRevisionId,
        triangulationRevisionId: source.triangulationRevisionId,
        boundaryCount: boundaryClassifications.length,
        boundariesWithFiniteRootOccurrencesCount: boundaryClassifications.filter(
          (entry) => entry.finiteRootOccurrenceCount > 0,
        ).length,
        finiteRootOccurrenceCount: preflightFiniteRootOccurrenceCount,
        classifiedFiniteRootOccurrenceCount: globalClassificationIndex,
        vertexFaceRootClassificationCount: preflightVertexFaceCount,
        edgeEdgeRootClassificationCount: preflightEdgeEdgeCount,
        preflightMaximumAuxiliarySignRowCount,
        auxiliarySignRowCount: aggregateAuxiliarySignRowCount,
        aggregateRetainedBigIntBits,
        classificationCounters: aggregateCounters,
        boundaryClassifications,
        boundaryCellStaticDeltaLedger: source,
        sourceBoundaryDeltaSingleOwnedSnapshotCompositionReused: true as const,
        sharedPolynomialAndRootCensusesRetainedOnlyInCentralSource: true as const,
        compactPerOccurrenceClassifierEvidenceRetained: true as const,
        everyGlobalBoundaryJoinedExactlyOnce: true as const,
        everyFiniteRootOccurrenceClassifiedExactlyOnceInCanonicalOrder: true as const,
        everyFiniteVertexFaceRootOccurrenceClassifiedExactly: true as const,
        everyFiniteEdgeEdgeRootOccurrenceClassifiedExactly: true as const,
        allClassificationResultsBoundToSourceOccurrenceAndRoot: true as const,
        finiteRootFeatureContainmentIncluded: true as const,
        sampleSideStaticDeltasRetained: true as const,
        persistentEventsRetainedOnlyInSource: true as const,
        persistentEventSubdivisionIncluded: false as const,
        eventOccurrenceDeduplicationIncluded: false as const,
        approachSeparationHistoryIncluded: false as const,
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
        'classification-join',
        '$',
        'finite-root-classification-ledger-invariant-failed',
        'global boundary finite-root classification assembly failed closed unexpectedly',
      ),
    ]);
  }
}
