import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  compareExactRational,
  divideExactRational,
  exactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import type { ProjectivePoint3 } from '../reference-verifier/projective-rational-3d.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS,
  type CanonicalDyadicTimeV1,
} from './affine-origin-rotation-swept-aabb.js';
import {
  constructSingleHingeRationalHalfAngleScheduleV1,
  evaluateSingleHingeRationalHalfAngleVertexPathV1,
  type SingleHingeRationalHalfAngleScheduleRecordV1,
} from './single-hinge-rational-half-angle-schedule.js';
import {
  analyzeStaticRationalTriangleFoldMeshStrataV1,
  type StaticRationalTriangleFoldMeshStrataRecordV1,
} from './static-rational-triangle-fold-mesh-strata.js';
import type { StaticRationalTriangle3 } from './static-rational-triangle-overlap.js';

export type SingleHingeRationalScheduleStaticSampleVertexV1 = Readonly<{
  vertexId: string;
  point: ProjectivePoint3;
}>;

export type SingleHingeRationalScheduleStaticSampleTriangleV1 = Readonly<{
  triangleId: string;
  triangle: StaticRationalTriangle3;
}>;

export type SingleHingeRationalScheduleStaticSampleRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-single-hinge-rational-schedule-static-sample';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-exact-dyadic-time-on-one-rational-single-hinge-schedule';
  arithmetic: 'exact-rational-and-projective-rational-bigint';
  sampleRevisionId: string;
  transitionRevisionId: string;
  stepId: string;
  meshRevisionId: string;
  triangulationRevisionId: string;
  sampleTime: CanonicalDyadicTimeV1;
  normalizedTime: ExactRational;
  timePosition: 'start' | 'interior' | 'end';
  sampledVertices: readonly SingleHingeRationalScheduleStaticSampleVertexV1[];
  sampledTriangles: readonly SingleHingeRationalScheduleStaticSampleTriangleV1[];
  vertexCount: number;
  triangleCount: number;
  unorderedPairCount: number;
  staticNonadjacentInteriorCrossingDetected: boolean;
  nonadjacentStaticInteriorCrossingEvidencePairCount: number;
  schedule: SingleHingeRationalHalfAngleScheduleRecordV1;
  strata: StaticRationalTriangleFoldMeshStrataRecordV1;
  exactScheduleEvaluationIncluded: true;
  completeMeshVertexSampleIncluded: true;
  completeMeshTriangleSampleIncluded: true;
  sourceFaceRigidityRecheckedAtSample: true;
  allStaticTrianglePairsIncluded: true;
  actualStatic3dIntersectionStrataIncluded: true;
  staticSelfIntersectionEvidenceIncluded: true;
  sampleOnly: true;
  continuousIntervalCovered: false;
  eventRootIsolationIncluded: false;
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

export type SingleHingeRationalScheduleStaticSampleIssueV1 = Readonly<{
  stage: 'root' | 'schedule' | 'sample' | 'strata';
  path: string;
  code: string;
  message: string;
}>;

export type SingleHingeRationalScheduleStaticSampleResultV1 =
  | Readonly<{ ok: true; value: SingleHingeRationalScheduleStaticSampleRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly SingleHingeRationalScheduleStaticSampleIssueV1[];
    }>;

type Descriptors = Readonly<Record<string, PropertyDescriptor | undefined>>;

const ROOT_KEYS = ['transitionInput', 'sample'] as const;
const SAMPLE_KEYS = ['sampleRevisionId', 'sampleTime'] as const;
const TIME_KEYS = ['numerator', 'exponent'] as const;
const REVISION_ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const MAX_TIME_DECIMAL_MAGNITUDE =
  10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorDecimalDigits);
const MAX_TIME_BINARY_MAGNITUDE =
  1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorBits);

function issue(
  stage: SingleHingeRationalScheduleStaticSampleIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): SingleHingeRationalScheduleStaticSampleIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly SingleHingeRationalScheduleStaticSampleIssueV1[],
): SingleHingeRationalScheduleStaticSampleResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function inspectClosedObject(
  supplied: unknown,
  path: string,
  keys: readonly string[],
  stage: SingleHingeRationalScheduleStaticSampleIssueV1['stage'],
):
  | Readonly<{ ok: true; value: Descriptors }>
  | Readonly<{ ok: false; error: readonly SingleHingeRationalScheduleStaticSampleIssueV1[] }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return { ok: false, error: [issue(stage, path, 'expected-object', 'must be one object')] };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue(stage, path, 'expected-plain-object', 'must be one plain data object')],
      };
    }
    const ownKeys = Reflect.ownKeys(supplied);
    if (ownKeys.length > keys.length) {
      return {
        ok: false,
        error: [issue(stage, path, 'unknown-property', 'contains an undeclared property')],
      };
    }
    const allowed = new Set(keys);
    const errors: SingleHingeRationalScheduleStaticSampleIssueV1[] = [];
    for (const key of ownKeys) {
      if (typeof key !== 'string' || !allowed.has(key)) {
        errors.push(issue(stage, path, 'unknown-property', 'contains an undeclared property'));
      }
    }
    const descriptors: Record<string, PropertyDescriptor | undefined> = {};
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
      descriptors[key] = descriptor;
      if (descriptor === undefined) {
        errors.push(issue(stage, `${path}.${key}`, 'missing-property', 'is required'));
      } else if (!('value' in descriptor)) {
        errors.push(issue(stage, `${path}.${key}`, 'accessor-property', 'accessors are not data'));
      } else if (!descriptor.enumerable) {
        errors.push(issue(stage, `${path}.${key}`, 'invalid-property', 'must be enumerable'));
      }
    }
    return errors.length === 0 ? { ok: true, value: descriptors } : { ok: false, error: errors };
  } catch {
    return {
      ok: false,
      error: [issue(stage, path, 'inspection-failed', 'properties could not be inspected safely')],
    };
  }
}

function descriptorValue(descriptors: Descriptors, key: string): unknown {
  const descriptor = descriptors[key];
  return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable
    ? descriptor.value
    : undefined;
}

function nestedPath(prefix: string, path: string): string {
  return path === '$' ? prefix : path.startsWith('$.') ? `${prefix}${path.slice(1)}` : prefix;
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function parseSampleTime(
  supplied: unknown,
):
  | Readonly<{ ok: true; value: CanonicalDyadicTimeV1 }>
  | Readonly<{ ok: false; error: readonly SingleHingeRationalScheduleStaticSampleIssueV1[] }> {
  const inspected = inspectClosedObject(supplied, '$.sample.sampleTime', TIME_KEYS, 'sample');
  if (!inspected.ok) return inspected;
  const numeratorValue = descriptorValue(inspected.value, 'numerator');
  const exponentValue = descriptorValue(inspected.value, 'exponent');
  if (typeof numeratorValue !== 'bigint') {
    return {
      ok: false,
      error: [
        issue(
          'sample',
          '$.sample.sampleTime.numerator',
          'expected-bigint',
          'dyadic numerator must be a BigInt',
        ),
      ],
    };
  }
  if (
    typeof exponentValue !== 'number' ||
    !Number.isSafeInteger(exponentValue) ||
    exponentValue < 0 ||
    exponentValue > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeExponent
  ) {
    return {
      ok: false,
      error: [
        issue(
          'sample',
          '$.sample.sampleTime.exponent',
          'invalid-time-exponent',
          'dyadic exponent is outside the bounded nonnegative integer range',
        ),
      ],
    };
  }
  const magnitude = absolute(numeratorValue);
  if (magnitude >= MAX_TIME_DECIMAL_MAGNITUDE || magnitude >= MAX_TIME_BINARY_MAGNITUDE) {
    return {
      ok: false,
      error: [
        issue(
          'sample',
          '$.sample.sampleTime.numerator',
          'time-numerator-limit-exceeded',
          'dyadic numerator exceeds the bounded time-coordinate limit',
        ),
      ],
    };
  }
  if (
    (numeratorValue === 0n && exponentValue !== 0) ||
    (exponentValue > 0 && numeratorValue % 2n === 0n)
  ) {
    return {
      ok: false,
      error: [
        issue(
          'sample',
          '$.sample.sampleTime',
          'noncanonical-dyadic',
          'zero uses exponent 0 and a positive exponent requires an odd numerator',
        ),
      ],
    };
  }
  return { ok: true, value: { numerator: numeratorValue, exponent: exponentValue } };
}

function dyadicRational(time: CanonicalDyadicTimeV1): ExactRational {
  return exactRational(time.numerator, 1n << BigInt(time.exponent));
}

function rawReconstruction(transitionInput: unknown): unknown {
  if (typeof transitionInput !== 'object' || transitionInput === null) return undefined;
  const startDescriptor = Object.getOwnPropertyDescriptor(transitionInput, 'startBindingInput');
  if (startDescriptor === undefined || !('value' in startDescriptor)) return undefined;
  const startBindingInput: unknown = startDescriptor.value;
  if (typeof startBindingInput !== 'object' || startBindingInput === null) return undefined;
  const reconstructionDescriptor = Object.getOwnPropertyDescriptor(
    startBindingInput,
    'reconstruction',
  );
  return reconstructionDescriptor !== undefined && 'value' in reconstructionDescriptor
    ? reconstructionDescriptor.value
    : undefined;
}

/** Evaluates one exact schedule time and runs the complete static mesh strata join. */
export function analyzeSingleHingeRationalScheduleStaticSampleV1(
  supplied: unknown,
): SingleHingeRationalScheduleStaticSampleResultV1 {
  const root = inspectClosedObject(supplied, '$', ROOT_KEYS, 'root');
  if (!root.ok) return failure(root.error);
  const sample = inspectClosedObject(
    descriptorValue(root.value, 'sample'),
    '$.sample',
    SAMPLE_KEYS,
    'sample',
  );
  if (!sample.ok) return failure(sample.error);
  const sampleRevisionIdValue = descriptorValue(sample.value, 'sampleRevisionId');
  if (
    typeof sampleRevisionIdValue !== 'string' ||
    sampleRevisionIdValue.length > 128 ||
    !REVISION_ID_PATTERN.test(sampleRevisionIdValue)
  ) {
    return failure([
      issue(
        'sample',
        '$.sample.sampleRevisionId',
        'invalid-sample-revision-id',
        'sample revision must be a bounded stable ASCII revision ID',
      ),
    ]);
  }
  const parsedTime = parseSampleTime(descriptorValue(sample.value, 'sampleTime'));
  if (!parsedTime.ok) return failure(parsedTime.error);
  const transitionInput = descriptorValue(root.value, 'transitionInput');
  const schedule = constructSingleHingeRationalHalfAngleScheduleV1(transitionInput);
  if (!schedule.ok) {
    return failure(
      schedule.error.map((entry) =>
        issue('schedule', nestedPath('$.transitionInput', entry.path), entry.code, entry.message),
      ),
    );
  }
  try {
    const time = dyadicRational(parsedTime.value);
    const t0 = dyadicRational(schedule.value.slab.t0);
    const t1 = dyadicRational(schedule.value.slab.t1);
    if (compareExactRational(time, t0) < 0 || compareExactRational(time, t1) > 0) {
      return failure([
        issue(
          'sample',
          '$.sample.sampleTime',
          'sample-time-outside-slab',
          'sample time must lie in the closed schedule slab',
        ),
      ]);
    }
    const normalizedTime = divideExactRational(
      subtractExactRational(time, t0),
      subtractExactRational(t1, t0),
    );
    const sampledVertices = schedule.value.vertexPaths.map((path) => ({
      vertexId: path.vertexId,
      point: evaluateSingleHingeRationalHalfAngleVertexPathV1(
        path,
        schedule.value.commonDenominator,
        normalizedTime,
      ),
    }));
    const pointById = new Map(sampledVertices.map((vertex) => [vertex.vertexId, vertex.point]));
    const sampledTriangles: SingleHingeRationalScheduleStaticSampleTriangleV1[] =
      schedule.value.transition.startBinding.triangles.map((triangle) => {
        const first = pointById.get(triangle.vertexIds[0]);
        const second = pointById.get(triangle.vertexIds[1]);
        const third = pointById.get(triangle.vertexIds[2]);
        if (first === undefined || second === undefined || third === undefined) {
          throw new TypeError('every sampled triangle vertex must resolve');
        }
        return {
          triangleId: triangle.triangleId,
          triangle: [first, second, third] as StaticRationalTriangle3,
        };
      });
    const reconstruction = rawReconstruction(transitionInput);
    if (reconstruction === undefined) {
      return failure([
        issue(
          'sample',
          '$.transitionInput.startBindingInput.reconstruction',
          'reconstruction-unavailable',
          'validated start reconstruction could not be retained for sample rebinding',
        ),
      ]);
    }
    const strata = analyzeStaticRationalTriangleFoldMeshStrataV1({
      meshRevisionId: schedule.value.meshRevisionId,
      triangulationRevisionId: schedule.value.triangulationRevisionId,
      poseRevisionId: sampleRevisionIdValue,
      reconstruction,
      staticTriangleSet: { triangles: sampledTriangles },
    });
    if (!strata.ok) {
      return failure(
        strata.error.map((entry) =>
          issue('strata', nestedPath('$.sampledPose', entry.path), entry.code, entry.message),
        ),
      );
    }
    const timePosition =
      compareExactRational(time, t0) === 0
        ? ('start' as const)
        : compareExactRational(time, t1) === 0
          ? ('end' as const)
          : ('interior' as const);
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-single-hinge-rational-schedule-static-sample' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-exact-dyadic-time-on-one-rational-single-hinge-schedule' as const,
        arithmetic: 'exact-rational-and-projective-rational-bigint' as const,
        sampleRevisionId: sampleRevisionIdValue,
        transitionRevisionId: schedule.value.transitionRevisionId,
        stepId: schedule.value.stepId,
        meshRevisionId: schedule.value.meshRevisionId,
        triangulationRevisionId: schedule.value.triangulationRevisionId,
        sampleTime: parsedTime.value,
        normalizedTime,
        timePosition,
        sampledVertices,
        sampledTriangles,
        vertexCount: sampledVertices.length,
        triangleCount: sampledTriangles.length,
        unorderedPairCount: strata.value.unorderedPairCount,
        staticNonadjacentInteriorCrossingDetected:
          strata.value.staticNonadjacentInteriorCrossingDetected,
        nonadjacentStaticInteriorCrossingEvidencePairCount:
          strata.value.nonadjacentStaticInteriorCrossingEvidencePairCount,
        schedule: schedule.value,
        strata: strata.value,
        exactScheduleEvaluationIncluded: true as const,
        completeMeshVertexSampleIncluded: true as const,
        completeMeshTriangleSampleIncluded: true as const,
        sourceFaceRigidityRecheckedAtSample: true as const,
        allStaticTrianglePairsIncluded: true as const,
        actualStatic3dIntersectionStrataIncluded: true as const,
        staticSelfIntersectionEvidenceIncluded: true as const,
        sampleOnly: true as const,
        continuousIntervalCovered: false as const,
        eventRootIsolationIncluded: false as const,
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
        'sample',
        '$',
        'sample-invariant-failed',
        'exact schedule sample analysis failed closed unexpectedly',
      ),
    ]);
  }
}
