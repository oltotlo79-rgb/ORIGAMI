import { deepFreezeOwned } from '../clone-and-freeze.js';
import { compareExactRational } from '../model/exact-rational.js';
import {
  computeSingleHingeRationalScheduleGlobalEventTimePartitionV1,
  type SingleHingeRationalScheduleGlobalEventOpenCellV1,
  type SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1,
} from './single-hinge-rational-schedule-global-event-time-partition.js';
import {
  analyzeSingleHingeRationalScheduleStaticSampleV1,
  type SingleHingeRationalScheduleStaticSampleRecordV1,
} from './single-hinge-rational-schedule-static-sample.js';

export const SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS =
  deepFreezeOwned({
    maxOpenCellSamples: 4_096,
    maxAggregateStaticTrianglePairRows: 4_194_304,
    maxSnapshotDepth: 64,
    maxSnapshotArrayLength: 262_144,
    maxSnapshotObjectPropertyCount: 256,
    maxSnapshotContainerCount: 1_048_576,
    maxSnapshotTotalPropertyCount: 4_194_304,
    maxSnapshotStringCodeUnits: 1_048_576,
    maxSnapshotTotalStringCodeUnits: 16_777_216,
    maxSnapshotBigIntBits: 1_048_576,
    maxSnapshotTotalBigIntBits: 16_777_216,
  });

export type SingleHingeRationalScheduleGlobalEventCellStaticSampleV1 = Readonly<{
  cellIndex: number;
  cellId: string;
  sampleRevisionId: string;
  openCell: SingleHingeRationalScheduleGlobalEventOpenCellV1;
  staticSample: SingleHingeRationalScheduleStaticSampleRecordV1;
  staticNonadjacentInteriorCrossingDetected: boolean;
  nonadjacentStaticInteriorCrossingEvidencePairCount: number;
}>;

export type SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-global-event-cell-static-samples';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-exact-static-3d-sample-per-global-necessary-event-open-cell';
  arithmetic: 'exact-rational-projective-rational-and-algebraic-partition-bigint';
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  openCellCount: number;
  sampledCellCount: number;
  aggregateStaticTrianglePairRowCount: number;
  cellsWithStaticNonadjacentInteriorCrossingCount: number;
  totalNonadjacentStaticInteriorCrossingEvidencePairCount: number;
  crossingCellIndices: readonly number[];
  cellSamples: readonly SingleHingeRationalScheduleGlobalEventCellStaticSampleV1[];
  eventTimePartition: SingleHingeRationalScheduleGlobalEventTimePartitionRecordV1;
  callerTransitionSnapshottedBeforeComposition: true;
  sameOwnedTransitionSnapshotUsedForPartitionAndAllSamples: true;
  callerRevisionLabelsOnly: true;
  exactSourceReconstructionGeometryEqualityChecked: false;
  cryptographicSourceRevisionBindingIncluded: false;
  everyOpenCellSampledExactlyOnce: true;
  everySampleIsCanonicalDyadicActualTime: true;
  everySampleInsideItsCertifiedOpenGap: true;
  completeStaticMeshTrianglePairStrataAtEverySampleIncluded: true;
  actualStatic3dSelfIntersectionEvidenceAtSamplesIncluded: true;
  sampleOnlyPerOpenCell: true;
  openCellStrataConstancyEstablished: false;
  rootBoundaryGeometryIncluded: false;
  featureContainmentAtRootsIncluded: false;
  persistentEventSubdivisionIncluded: false;
  collisionEventCompletenessEstablished: false;
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

export type SingleHingeRationalScheduleGlobalEventCellStaticSamplesIssueV1 = Readonly<{
  stage: 'source-snapshot' | 'event-time-partition' | 'static-sample' | 'cell-join';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleGlobalEventCellStaticSamplesResultV1 =
  | Readonly<{
      ok: true;
      value: SingleHingeRationalScheduleGlobalEventCellStaticSamplesRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleGlobalEventCellStaticSamplesIssueV1[];
    }>;

function issue(
  stage: SingleHingeRationalScheduleGlobalEventCellStaticSamplesIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleGlobalEventCellStaticSamplesIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleGlobalEventCellStaticSamplesIssueV1[],
): SingleHingeRationalScheduleGlobalEventCellStaticSamplesResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

const INVALID_SOURCE_SNAPSHOT = new TypeError('invalid source snapshot');

interface SnapshotState {
  containerCount: number;
  totalPropertyCount: number;
  totalStringCodeUnits: number;
  totalBigIntBits: number;
  ownedByCallerObject: WeakMap<object, object>;
}

function rejectSourceSnapshot(): never {
  throw INVALID_SOURCE_SNAPSHOT;
}

function accountSnapshotString(value: string, state: SnapshotState): string {
  const limits = SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS;
  state.totalStringCodeUnits += value.length;
  if (
    value.length > limits.maxSnapshotStringCodeUnits ||
    state.totalStringCodeUnits > limits.maxSnapshotTotalStringCodeUnits
  ) {
    rejectSourceSnapshot();
  }
  return value;
}

function snapshotCallerTransitionValue(
  value: unknown,
  state: SnapshotState,
  ancestors: WeakSet<object>,
  depth: number,
): unknown {
  const limits = SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return accountSnapshotString(value, state);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) rejectSourceSnapshot();
    return value;
  }
  if (typeof value === 'bigint') {
    const magnitude = value < 0n ? -value : value;
    const bitLength = magnitude === 0n ? 1 : magnitude.toString(2).length;
    state.totalBigIntBits += bitLength;
    if (
      bitLength > limits.maxSnapshotBigIntBits ||
      state.totalBigIntBits > limits.maxSnapshotTotalBigIntBits
    ) {
      rejectSourceSnapshot();
    }
    return value;
  }
  if (typeof value !== 'object' || depth > limits.maxSnapshotDepth) {
    rejectSourceSnapshot();
  }
  if (ancestors.has(value)) rejectSourceSnapshot();
  const existing = state.ownedByCallerObject.get(value);
  if (existing !== undefined) return existing;

  ancestors.add(value);
  state.containerCount += 1;
  if (state.containerCount > limits.maxSnapshotContainerCount) rejectSourceSnapshot();
  try {
    const prototype: unknown = Object.getPrototypeOf(value);
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) rejectSourceSnapshot();
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (
        lengthDescriptor === undefined ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        (lengthDescriptor.value as number) < 0
      ) {
        rejectSourceSnapshot();
      }
      const length = lengthDescriptor.value as number;
      if (
        length > limits.maxSnapshotArrayLength ||
        keys.length !== length + 1 ||
        keys[length] !== 'length' ||
        keys.slice(0, length).some((key, index) => key !== String(index))
      ) {
        rejectSourceSnapshot();
      }
      state.totalPropertyCount += length + 1;
      if (state.totalPropertyCount > limits.maxSnapshotTotalPropertyCount) {
        rejectSourceSnapshot();
      }
      const snapshot = new Array<unknown>(length);
      state.ownedByCallerObject.set(value, snapshot);
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
          rejectSourceSnapshot();
        }
        snapshot[index] = snapshotCallerTransitionValue(
          descriptor.value,
          state,
          ancestors,
          depth + 1,
        );
      }
      return snapshot;
    }

    if (
      (prototype !== Object.prototype && prototype !== null) ||
      keys.length > limits.maxSnapshotObjectPropertyCount ||
      keys.some((key) => typeof key !== 'string')
    ) {
      rejectSourceSnapshot();
    }
    state.totalPropertyCount += keys.length;
    if (state.totalPropertyCount > limits.maxSnapshotTotalPropertyCount) {
      rejectSourceSnapshot();
    }
    const snapshot = Object.create(prototype) as Record<string, unknown>;
    state.ownedByCallerObject.set(value, snapshot);
    for (const key of keys) {
      if (typeof key !== 'string') rejectSourceSnapshot();
      accountSnapshotString(key, state);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        rejectSourceSnapshot();
      }
      Object.defineProperty(snapshot, key, {
        value: snapshotCallerTransitionValue(descriptor.value, state, ancestors, depth + 1),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return snapshot;
  } finally {
    ancestors.delete(value);
  }
}

function snapshotCallerTransition(
  suppliedTransition: unknown,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const value = snapshotCallerTransitionValue(
      suppliedTransition,
      {
        containerCount: 0,
        totalPropertyCount: 0,
        totalStringCodeUnits: 0,
        totalBigIntBits: 0,
        ownedByCallerObject: new WeakMap<object, object>(),
      },
      new WeakSet<object>(),
      0,
    );
    return { ok: true as const, value: deepFreezeOwned(value) };
  } catch {
    return { ok: false as const };
  }
}

/** Evaluates the exact static 3D mesh strata at one certified sample in every open cell. */
export function analyzeSingleHingeRationalScheduleGlobalEventCellStaticSamplesV1(
  suppliedTransition: unknown,
): SingleHingeRationalScheduleGlobalEventCellStaticSamplesResultV1 {
  const sourceSnapshot = snapshotCallerTransition(suppliedTransition);
  if (!sourceSnapshot.ok) {
    return failure([
      issue(
        'source-snapshot',
        '$',
        'invalid-source-snapshot',
        'transition input must be one bounded acyclic accessor-free plain-data snapshot',
      ),
    ]);
  }
  const partition = computeSingleHingeRationalScheduleGlobalEventTimePartitionV1(
    sourceSnapshot.value,
  );
  if (!partition.ok) {
    return failure(
      partition.error.map((entry) =>
        issue('event-time-partition', entry.path, entry.code, entry.message),
      ),
    );
  }
  if (
    partition.value.openCellCount >
    SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxOpenCellSamples
  ) {
    return failure([
      issue(
        'static-sample',
        '$.eventTimePartition.openCells',
        'open-cell-sample-limit-exceeded',
        'the global partition has more open cells than this static-sample adapter can retain',
      ),
    ]);
  }
  const expectedAggregateStaticTrianglePairRowCount =
    partition.value.openCellCount * partition.value.eventRootCensus.unorderedTrianglePairCount;
  if (
    !Number.isSafeInteger(expectedAggregateStaticTrianglePairRowCount) ||
    expectedAggregateStaticTrianglePairRowCount >
      SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxAggregateStaticTrianglePairRows
  ) {
    return failure([
      issue(
        'static-sample',
        '$.eventTimePartition',
        'aggregate-static-pair-limit-exceeded',
        'the complete open-cell by triangle-pair product exceeds the defensive adapter limit',
      ),
    ]);
  }
  try {
    const cellSamples: SingleHingeRationalScheduleGlobalEventCellStaticSampleV1[] = [];
    let aggregateStaticTrianglePairRowCount = 0;
    for (const openCell of partition.value.openCells) {
      const sampleRevisionId = `CellSample:${String(openCell.cellIndex)}`;
      const sampled = analyzeSingleHingeRationalScheduleStaticSampleV1({
        transitionInput: sourceSnapshot.value,
        sample: {
          sampleRevisionId,
          sampleTime: {
            numerator: openCell.sampleTime.numerator,
            exponent: openCell.sampleTime.exponent,
          },
        },
      });
      if (!sampled.ok) {
        return failure(
          sampled.error.map((entry) =>
            issue(
              'static-sample',
              `$.cellSamples[${String(openCell.cellIndex)}]${entry.path.slice(1)}`,
              entry.code,
              entry.message,
            ),
          ),
        );
      }
      if (
        sampled.value.sampleRevisionId !== sampleRevisionId ||
        sampled.value.transitionRevisionId !== partition.value.transitionRevisionId ||
        sampled.value.stepId !== partition.value.stepId ||
        sampled.value.meshRevisionId !== partition.value.meshRevisionId ||
        sampled.value.triangulationRevisionId !== partition.value.triangulationRevisionId ||
        sampled.value.sampleTime.numerator !== openCell.sampleTime.numerator ||
        sampled.value.sampleTime.exponent !== openCell.sampleTime.exponent ||
        compareExactRational(sampled.value.normalizedTime, openCell.normalizedSampleTime) !== 0 ||
        sampled.value.timePosition !== 'interior'
      ) {
        return failure([
          issue(
            'cell-join',
            `$.cellSamples[${String(openCell.cellIndex)}]`,
            'cell-static-sample-source-mismatch',
            'one exact static sample does not replay its source cell and revision binding',
          ),
        ]);
      }
      if (
        compareExactRational(
          openCell.certifiedNormalizedSampleGap.lower,
          sampled.value.normalizedTime,
        ) >= 0 ||
        compareExactRational(
          sampled.value.normalizedTime,
          openCell.certifiedNormalizedSampleGap.upper,
        ) >= 0
      ) {
        throw new TypeError('static sample lies outside its certified open-cell gap');
      }
      aggregateStaticTrianglePairRowCount += sampled.value.unorderedPairCount;
      if (
        aggregateStaticTrianglePairRowCount >
        SINGLE_HINGE_RATIONAL_SCHEDULE_GLOBAL_EVENT_CELL_STATIC_SAMPLE_LIMITS.maxAggregateStaticTrianglePairRows
      ) {
        return failure([
          issue(
            'static-sample',
            '$.cellSamples',
            'aggregate-static-pair-limit-exceeded',
            'aggregate static triangle-pair rows exceed the defensive adapter limit',
          ),
        ]);
      }
      cellSamples.push({
        cellIndex: openCell.cellIndex,
        cellId: openCell.cellId,
        sampleRevisionId,
        openCell,
        staticSample: sampled.value,
        staticNonadjacentInteriorCrossingDetected:
          sampled.value.staticNonadjacentInteriorCrossingDetected,
        nonadjacentStaticInteriorCrossingEvidencePairCount:
          sampled.value.nonadjacentStaticInteriorCrossingEvidencePairCount,
      });
    }
    if (
      cellSamples.length !== partition.value.openCellCount ||
      aggregateStaticTrianglePairRowCount !== expectedAggregateStaticTrianglePairRowCount ||
      cellSamples.some(
        (sample, index) =>
          sample.cellIndex !== index || sample.cellId !== partition.value.openCells[index]?.cellId,
      )
    ) {
      throw new TypeError('open-cell and static-sample ledgers are not a complete bijection');
    }
    const crossingCellIndices = cellSamples
      .filter((sample) => sample.staticNonadjacentInteriorCrossingDetected)
      .map((sample) => sample.cellIndex);
    const totalNonadjacentStaticInteriorCrossingEvidencePairCount = cellSamples.reduce(
      (sum, sample) => sum + sample.nonadjacentStaticInteriorCrossingEvidencePairCount,
      0,
    );
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-global-event-cell-static-samples' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-exact-static-3d-sample-per-global-necessary-event-open-cell' as const,
        arithmetic: 'exact-rational-projective-rational-and-algebraic-partition-bigint' as const,
        transitionRevisionId: partition.value.transitionRevisionId,
        stepId: partition.value.stepId,
        meshRevisionId: partition.value.meshRevisionId,
        triangulationRevisionId: partition.value.triangulationRevisionId,
        openCellCount: partition.value.openCellCount,
        sampledCellCount: cellSamples.length,
        aggregateStaticTrianglePairRowCount,
        cellsWithStaticNonadjacentInteriorCrossingCount: crossingCellIndices.length,
        totalNonadjacentStaticInteriorCrossingEvidencePairCount,
        crossingCellIndices,
        cellSamples,
        eventTimePartition: partition.value,
        callerTransitionSnapshottedBeforeComposition: true as const,
        sameOwnedTransitionSnapshotUsedForPartitionAndAllSamples: true as const,
        callerRevisionLabelsOnly: true as const,
        exactSourceReconstructionGeometryEqualityChecked: false as const,
        cryptographicSourceRevisionBindingIncluded: false as const,
        everyOpenCellSampledExactlyOnce: true as const,
        everySampleIsCanonicalDyadicActualTime: true as const,
        everySampleInsideItsCertifiedOpenGap: true as const,
        completeStaticMeshTrianglePairStrataAtEverySampleIncluded: true as const,
        actualStatic3dSelfIntersectionEvidenceAtSamplesIncluded: true as const,
        sampleOnlyPerOpenCell: true as const,
        openCellStrataConstancyEstablished: false as const,
        rootBoundaryGeometryIncluded: false as const,
        featureContainmentAtRootsIncluded: false as const,
        persistentEventSubdivisionIncluded: false as const,
        collisionEventCompletenessEstablished: false as const,
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
        'cell-join',
        '$',
        'global-event-cell-static-sample-invariant-failed',
        'global event-cell static sample assembly failed closed unexpectedly',
      ),
    ]);
  }
}
