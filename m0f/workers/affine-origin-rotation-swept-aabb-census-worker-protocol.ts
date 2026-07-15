import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  parseAffineOriginRotationSweptAabbCensusInputV1,
  type AffineOriginRotationSweptAabbCensusInputV1,
  type AffineOriginRotationSweptAabbCensusRecordV1,
} from '../geometry/affine-origin-rotation-swept-aabb-census.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  type AffineOriginRotationTrianglePrimitiveV1,
  type CanonicalDyadicTimeSlabV1,
} from '../geometry/affine-origin-rotation-swept-aabb.js';
import type { ExactRational } from '../model/exact-rational.js';

export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION = 1 as const;
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE =
  'm0f-affine-origin-rotation-swept-aabb-census-worker-request' as const;
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE =
  'm0f-affine-origin-rotation-swept-aabb-census-worker-response' as const;
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION =
  'compute-affine-origin-rotation-swept-aabb-census' as const;
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS =
  'candidate-no-claim' as const;
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_MAX_SOURCE_ID_LENGTH = 128 as const;
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_MAX_JOB_ID_LENGTH = 128 as const;

export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_FAILURE_REASONS = Object.freeze([
  'census-computation-rejected',
  'internal-error',
] as const);

export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_LIMITS = deepFreezeOwned({
  maxArrayLength: 64,
  maxContainerCount: 2_048,
  maxDepth: 16,
  maxObjectPropertyCount: 48,
  maxPropertyNameCodeUnits: 128,
  maxStringCodeUnits: 128,
  maxTotalStringCodeUnits: 65_536,
  maxTotalPropertyCount: 32_768,
  maxBigIntBits: 16_384,
  maxTotalBigIntBits: 33_554_432,
});

export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_LIMITS = deepFreezeOwned({
  maxArrayLength: 2_016,
  maxContainerCount: 150_000,
  maxDepth: 24,
  maxObjectPropertyCount: 48,
  maxPropertyNameCodeUnits: 128,
  maxStringCodeUnits: 128,
  maxTotalStringCodeUnits: 2_097_152,
  maxTotalPropertyCount: 1_000_000,
  maxBigIntBits: 131_072,
  maxTotalBigIntBits: 134_217_728,
});

type NoClaimWorkerFieldsV1 = Readonly<{
  contractStatus: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS;
  broadPhaseOnly: true;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  verified: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type AffineOriginRotationSweptAabbCensusWorkerFailureReasonV1 =
  (typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_FAILURE_REASONS)[number];

export type AffineOriginRotationSweptAabbCensusWorkerSourceV1 = Readonly<{
  sourceId: string;
  input: AffineOriginRotationSweptAabbCensusInputV1;
}>;

export type AffineOriginRotationSweptAabbCensusWorkerRequestV1 = Readonly<{
  schemaVersion: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION;
  recordType: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE;
  operation: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION;
  contractStatus: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS;
  scientificClaim: false;
  sourceId: string;
  jobId: string;
  input: AffineOriginRotationSweptAabbCensusInputV1;
}>;

type WorkerResponseBaseV1 = NoClaimWorkerFieldsV1 &
  Readonly<{
    schemaVersion: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION;
    recordType: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE;
    operation: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION;
    sourceId: string;
    jobId: string;
    sourceInput: AffineOriginRotationSweptAabbCensusInputV1;
  }>;

export type CompletedAffineOriginRotationSweptAabbCensusWorkerResponseV1 = WorkerResponseBaseV1 &
  Readonly<{
    outcome: 'completed';
    reason: null;
    result: AffineOriginRotationSweptAabbCensusRecordV1;
  }>;

export type FailedAffineOriginRotationSweptAabbCensusWorkerResponseV1 = WorkerResponseBaseV1 &
  Readonly<{
    outcome: 'failed';
    reason: AffineOriginRotationSweptAabbCensusWorkerFailureReasonV1;
    result: null;
  }>;

export type AffineOriginRotationSweptAabbCensusWorkerResponseV1 =
  | CompletedAffineOriginRotationSweptAabbCensusWorkerResponseV1
  | FailedAffineOriginRotationSweptAabbCensusWorkerResponseV1;

export type AffineOriginRotationSweptAabbCensusWorkerProtocolIssueV1 = Readonly<{
  stage: 'snapshot' | 'structure' | 'input' | 'result' | 'invariant';
  path: string;
  code: string;
  message: string;
}>;

export type ParseAffineOriginRotationSweptAabbCensusWorkerRequestV1Result =
  | Readonly<{ ok: true; value: AffineOriginRotationSweptAabbCensusWorkerRequestV1 }>
  | Readonly<{
      ok: false;
      error: readonly AffineOriginRotationSweptAabbCensusWorkerProtocolIssueV1[];
    }>;

export type ParseAffineOriginRotationSweptAabbCensusWorkerResponseV1Result =
  | Readonly<{ ok: true; value: AffineOriginRotationSweptAabbCensusWorkerResponseV1 }>
  | Readonly<{
      ok: false;
      error: readonly AffineOriginRotationSweptAabbCensusWorkerProtocolIssueV1[];
    }>;

type SnapshotLimits = Readonly<{
  maxArrayLength: number;
  maxContainerCount: number;
  maxDepth: number;
  maxObjectPropertyCount: number;
  maxPropertyNameCodeUnits: number;
  maxStringCodeUnits: number;
  maxTotalStringCodeUnits: number;
  maxTotalPropertyCount: number;
  maxBigIntBits: number;
  maxTotalBigIntBits: number;
}>;

interface InspectionState {
  containerCount: number;
  totalStringCodeUnits: number;
  totalPropertyCount: number;
  totalBigIntBits: number;
}

type MutableIssue = AffineOriginRotationSweptAabbCensusWorkerProtocolIssueV1;

const STABLE_ASCII_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const REQUEST_KEYS = [
  'schemaVersion',
  'recordType',
  'operation',
  'contractStatus',
  'scientificClaim',
  'sourceId',
  'jobId',
  'input',
] as const;
const RESPONSE_KEYS = [
  'schemaVersion',
  'recordType',
  'operation',
  'contractStatus',
  'broadPhaseOnly',
  'continuousCollisionDetectionIncluded',
  'collisionFreeClaim',
  'legalContactClassificationIncluded',
  'penetrationClassificationIncluded',
  'selfIntersectionClassificationIncluded',
  'verified',
  'verifiedClaim',
  'scientificClaim',
  'globalM0fGo',
  'sourceId',
  'jobId',
  'sourceInput',
  'outcome',
  'reason',
  'result',
] as const;
const CENSUS_RECORD_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'predicateScope',
  'arithmetic',
  'motionFamily',
  'supportedMotionFamily',
  'motionFamilySupported',
  'slab',
  'primitiveOrder',
  'pairOrder',
  'primitiveIds',
  'primitiveCount',
  'unorderedPairCount',
  'separatedPairCount',
  'candidatePairCount',
  'indeterminatePairCount',
  'pairs',
  'completePairEnumeration',
  'completePairEnumerationScope',
  'allUnorderedPairsIncluded',
  'silentPairExclusionIncluded',
  'indeterminatePromotionIncluded',
  'broadPhaseOnly',
  'pairClassifierIncluded',
  'continuousCollisionDetectionIncluded',
  'collisionFreeClaim',
  'legalContactClassificationIncluded',
  'penetrationClassificationIncluded',
  'selfIntersectionClassificationIncluded',
  'verified',
  'verifiedClaim',
  'scientificClaim',
  'globalM0fGo',
  'isSupportProfile',
  'supportClaim',
] as const;
const AXES = ['x', 'y', 'z'] as const;
const MAX_ARITHMETIC_MAGNITUDE_EXCLUSIVE =
  1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxArithmeticBits);

function failureIssue(
  stage: MutableIssue['stage'],
  path: string,
  code: string,
  message: string,
): MutableIssue {
  return Object.freeze({ stage, path, code, message });
}

function requestFailure(
  error: readonly MutableIssue[],
): ParseAffineOriginRotationSweptAabbCensusWorkerRequestV1Result {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function responseFailure(
  error: readonly MutableIssue[],
): ParseAffineOriginRotationSweptAabbCensusWorkerResponseV1Result {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value);
  if (actual.length !== expected.length) return false;
  const allowed = new Set(expected);
  return (
    actual.every((key) => allowed.has(key)) && expected.every((key) => Object.hasOwn(value, key))
  );
}

const INVALID_CLONE_DATA = new TypeError('invalid clone data');

function rejectCloneData(): never {
  throw INVALID_CLONE_DATA;
}

function snapshotCloneData(
  value: unknown,
  limits: SnapshotLimits,
  state: InspectionState,
  ancestors: WeakSet<object>,
  depth: number,
): unknown {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) rejectCloneData();
    return value;
  }
  if (typeof value === 'string') {
    state.totalStringCodeUnits += value.length;
    if (
      value.length > limits.maxStringCodeUnits ||
      state.totalStringCodeUnits > limits.maxTotalStringCodeUnits
    ) {
      rejectCloneData();
    }
    return value;
  }
  if (typeof value === 'bigint') {
    const magnitude = value < 0n ? -value : value;
    if (magnitude >= 1n << BigInt(limits.maxBigIntBits)) rejectCloneData();
    const bits = magnitude === 0n ? 1 : magnitude.toString(2).length;
    state.totalBigIntBits += bits;
    if (state.totalBigIntBits > limits.maxTotalBigIntBits) rejectCloneData();
    return value;
  }
  if (typeof value !== 'object' || depth > limits.maxDepth) rejectCloneData();
  if (ancestors.has(value)) rejectCloneData();
  ancestors.add(value);
  state.containerCount += 1;
  if (state.containerCount > limits.maxContainerCount) {
    ancestors.delete(value);
    rejectCloneData();
  }

  try {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) rejectCloneData();
      const keys = Reflect.ownKeys(value);
      const arrayLength = keys.length - 1;
      if (
        arrayLength < 0 ||
        arrayLength > limits.maxArrayLength ||
        keys[arrayLength] !== 'length' ||
        keys.slice(0, arrayLength).some((key, index) => key !== String(index))
      ) {
        rejectCloneData();
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (
        lengthDescriptor === undefined ||
        !Object.hasOwn(lengthDescriptor, 'value') ||
        lengthDescriptor.value !== arrayLength
      ) {
        rejectCloneData();
      }
      state.totalPropertyCount += arrayLength;
      if (state.totalPropertyCount > limits.maxTotalPropertyCount) {
        rejectCloneData();
      }
      const snapshot = new Array<unknown>(arrayLength);
      for (let index = 0; index < arrayLength; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (
          descriptor === undefined ||
          !Object.hasOwn(descriptor, 'value') ||
          descriptor.enumerable !== true
        ) {
          rejectCloneData();
        }
        const child = snapshotCloneData(descriptor.value, limits, state, ancestors, depth + 1);
        Object.defineProperty(snapshot, String(index), {
          value: child,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      return snapshot;
    }

    if (prototype !== Object.prototype && prototype !== null) rejectCloneData();
    const keys = Reflect.ownKeys(value);
    if (
      keys.length > limits.maxObjectPropertyCount ||
      keys.some((key) => typeof key !== 'string' || key.length > limits.maxPropertyNameCodeUnits)
    ) {
      rejectCloneData();
    }
    state.totalPropertyCount += keys.length;
    if (state.totalPropertyCount > limits.maxTotalPropertyCount) rejectCloneData();
    const snapshot = Object.create(prototype) as Record<string, unknown>;
    for (const key of keys) {
      if (typeof key !== 'string') rejectCloneData();
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor === undefined ||
        !Object.hasOwn(descriptor, 'value') ||
        descriptor.enumerable !== true
      ) {
        rejectCloneData();
      }
      const child = snapshotCloneData(descriptor.value, limits, state, ancestors, depth + 1);
      Object.defineProperty(snapshot, key, {
        value: child,
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

function tryCreateBigIntValidationSnapshot(
  supplied: unknown,
  limits: SnapshotLimits,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  const state: InspectionState = {
    containerCount: 0,
    totalStringCodeUnits: 0,
    totalPropertyCount: 0,
    totalBigIntBits: 0,
  };
  try {
    const descriptorSnapshot = snapshotCloneData(supplied, limits, state, new WeakSet<object>(), 0);
    return Object.freeze({ ok: true as const, value: structuredClone(descriptorSnapshot) });
  } catch {
    return Object.freeze({ ok: false as const });
  }
}

function isStableAsciiId(value: unknown, maxLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxLength &&
    STABLE_ASCII_ID_PATTERN.test(value)
  );
}

export function isAffineOriginRotationSweptAabbCensusWorkerSourceIdV1(
  value: unknown,
): value is string {
  return isStableAsciiId(
    value,
    AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_MAX_SOURCE_ID_LENGTH,
  );
}

export function isAffineOriginRotationSweptAabbCensusWorkerJobIdV1(
  value: unknown,
): value is string {
  return isStableAsciiId(value, AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_MAX_JOB_ID_LENGTH);
}

function sameSlab(left: CanonicalDyadicTimeSlabV1, right: CanonicalDyadicTimeSlabV1): boolean {
  return (
    left.t0.numerator === right.t0.numerator &&
    left.t0.exponent === right.t0.exponent &&
    left.t1.numerator === right.t1.numerator &&
    left.t1.exponent === right.t1.exponent
  );
}

function unknownSlabMatches(value: unknown, expected: CanonicalDyadicTimeSlabV1): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ['t0', 't1'])) return false;
  if (!isRecord(value.t0) || !hasExactKeys(value.t0, ['numerator', 'exponent'])) return false;
  if (!isRecord(value.t1) || !hasExactKeys(value.t1, ['numerator', 'exponent'])) return false;
  return (
    value.t0.numerator === expected.t0.numerator &&
    value.t0.exponent === expected.t0.exponent &&
    value.t1.numerator === expected.t1.numerator &&
    value.t1.exponent === expected.t1.exponent
  );
}

function samePoint(
  left: Readonly<{ x: bigint; y: bigint; z: bigint; w: bigint }>,
  right: Readonly<{ x: bigint; y: bigint; z: bigint; w: bigint }>,
): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z && left.w === right.w;
}

function sameInput(
  left: AffineOriginRotationSweptAabbCensusInputV1,
  right: AffineOriginRotationSweptAabbCensusInputV1,
): boolean {
  if (
    left.motionFamily !== right.motionFamily ||
    !sameSlab(left.slab, right.slab) ||
    left.primitives.length !== right.primitives.length
  ) {
    return false;
  }
  return left.primitives.every((primitive, index) => {
    const other = right.primitives[index];
    return (
      other !== undefined &&
      primitive.id === other.id &&
      samePoint(primitive.q0, other.q0) &&
      samePoint(primitive.q1, other.q1) &&
      primitive.localVertices.every((vertex, vertexIndex) => {
        const otherVertex = other.localVertices[vertexIndex];
        return otherVertex !== undefined && samePoint(vertex, otherVertex);
      })
    );
  });
}

export function equalAffineOriginRotationSweptAabbCensusWorkerSourceV1(
  left: AffineOriginRotationSweptAabbCensusWorkerSourceV1,
  right: AffineOriginRotationSweptAabbCensusWorkerSourceV1,
): boolean {
  return left.sourceId === right.sourceId && sameInput(left.input, right.input);
}

function commonLiteralsValid(
  raw: Record<string, unknown>,
  expectedRecordType: string,
  response: boolean,
): boolean {
  return (
    raw.schemaVersion === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION &&
    raw.recordType === expectedRecordType &&
    raw.operation === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION &&
    raw.contractStatus === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS &&
    raw.scientificClaim === false &&
    (!response ||
      (raw.broadPhaseOnly === true &&
        raw.continuousCollisionDetectionIncluded === false &&
        raw.collisionFreeClaim === false &&
        raw.legalContactClassificationIncluded === false &&
        raw.penetrationClassificationIncluded === false &&
        raw.selfIntersectionClassificationIncluded === false &&
        raw.verified === false &&
        raw.verifiedClaim === false &&
        raw.globalM0fGo === false))
  );
}

function absoluteBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absoluteBigInt(left);
  let b = absoluteBigInt(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function isCanonicalRational(value: unknown): value is ExactRational {
  if (!isRecord(value) || !hasExactKeys(value, ['numerator', 'denominator'])) return false;
  if (typeof value.numerator !== 'bigint' || typeof value.denominator !== 'bigint') return false;
  return value.denominator > 0n && greatestCommonDivisor(value.numerator, value.denominator) === 1n;
}

function compareRational(left: ExactRational, right: ExactRational): number {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function subtractRational(left: ExactRational, right: ExactRational): ExactRational {
  const numerator = left.numerator * right.denominator - right.numerator * left.denominator;
  const denominator = left.denominator * right.denominator;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return Object.freeze({ numerator: numerator / divisor, denominator: denominator / divisor });
}

function addRational(left: ExactRational, right: ExactRational): ExactRational {
  const numerator = left.numerator * right.denominator + right.numerator * left.denominator;
  const denominator = left.denominator * right.denominator;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return Object.freeze({ numerator: numerator / divisor, denominator: denominator / divisor });
}

function canonicalRational(numerator: bigint, denominator: bigint): ExactRational {
  if (numerator === 0n) return Object.freeze({ numerator: 0n, denominator: 1n });
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return Object.freeze({
    numerator: (sign * numerator) / divisor,
    denominator: absoluteBigInt(denominator) / divisor,
  });
}

function rationalWithinProducerBudget(value: ExactRational): boolean {
  return (
    absoluteBigInt(value.numerator) < MAX_ARITHMETIC_MAGNITUDE_EXCLUSIVE &&
    value.denominator < MAX_ARITHMETIC_MAGNITUDE_EXCLUSIVE
  );
}

function sameRational(left: ExactRational, right: ExactRational): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

type ValidatedInterval = Readonly<{ min: ExactRational; max: ExactRational }>;
type ValidatedAabb = Readonly<Record<(typeof AXES)[number], ValidatedInterval>>;
type ValidatedBound = Readonly<{ primitiveId: string; aabb: ValidatedAabb }>;
type ExpectedBoundBuild =
  | Readonly<{ ok: true; value: ValidatedBound }>
  | Readonly<{
      ok: false;
      reason: 'arithmetic-budget-exhausted' | 'bound-construction-failed';
    }>;

function readInterval(value: unknown): ValidatedInterval | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ['min', 'max'])) return undefined;
  if (!isCanonicalRational(value.min) || !isCanonicalRational(value.max)) return undefined;
  if (compareRational(value.min, value.max) > 0) return undefined;
  return Object.freeze({ min: value.min, max: value.max });
}

function readAabb(value: unknown): ValidatedAabb | undefined {
  if (!isRecord(value) || !hasExactKeys(value, AXES)) return undefined;
  const x = readInterval(value.x);
  const y = readInterval(value.y);
  const z = readInterval(value.z);
  return x === undefined || y === undefined || z === undefined
    ? undefined
    : Object.freeze({ x, y, z });
}

function readBound(value: unknown, expectedId: string): ValidatedBound | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ['primitiveId', 'aabb'])) return undefined;
  const aabb = readAabb(value.aabb);
  return value.primitiveId === expectedId && aabb !== undefined
    ? Object.freeze({ primitiveId: expectedId, aabb })
    : undefined;
}

function readBounds(
  value: unknown,
  firstId: string,
  secondId: string,
): readonly [ValidatedBound, ValidatedBound] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const first = readBound(value[0], firstId);
  const second = readBound(value[1], secondId);
  return first === undefined || second === undefined ? undefined : Object.freeze([first, second]);
}

function sameAabb(left: ValidatedAabb, right: ValidatedAabb): boolean {
  return AXES.every(
    (axis) =>
      sameRational(left[axis].min, right[axis].min) &&
      sameRational(left[axis].max, right[axis].max),
  );
}

function buildExpectedBound(
  primitive: AffineOriginRotationTrianglePrimitiveV1,
): ExpectedBoundBuild {
  try {
    const radii = primitive.localVertices.map((vertex) =>
      canonicalRational(
        absoluteBigInt(vertex.x) + absoluteBigInt(vertex.y) + absoluteBigInt(vertex.z),
        vertex.w,
      ),
    );
    if (radii.some((radius) => !rationalWithinProducerBudget(radius))) {
      return Object.freeze({
        ok: false as const,
        reason: 'arithmetic-budget-exhausted' as const,
      });
    }
    const intervals: {
      x?: ValidatedInterval;
      y?: ValidatedInterval;
      z?: ValidatedInterval;
    } = {};
    for (const axis of AXES) {
      const q0 = canonicalRational(primitive.q0[axis], primitive.q0.w);
      const q1 = canonicalRational(primitive.q1[axis], primitive.q1.w);
      const originMin = compareRational(q0, q1) <= 0 ? q0 : q1;
      const originMax = compareRational(q0, q1) >= 0 ? q0 : q1;
      let minimum: ExactRational | undefined;
      let maximum: ExactRational | undefined;
      for (const radius of radii) {
        const candidateMin = subtractRational(originMin, radius);
        const candidateMax = addRational(originMax, radius);
        if (
          !rationalWithinProducerBudget(candidateMin) ||
          !rationalWithinProducerBudget(candidateMax)
        ) {
          return Object.freeze({
            ok: false as const,
            reason: 'arithmetic-budget-exhausted' as const,
          });
        }
        if (minimum === undefined || compareRational(candidateMin, minimum) < 0) {
          minimum = candidateMin;
        }
        if (maximum === undefined || compareRational(candidateMax, maximum) > 0) {
          maximum = candidateMax;
        }
      }
      if (minimum === undefined || maximum === undefined) {
        return Object.freeze({ ok: false as const, reason: 'bound-construction-failed' as const });
      }
      intervals[axis] = Object.freeze({ min: minimum, max: maximum });
    }
    const { x, y, z } = intervals;
    if (x === undefined || y === undefined || z === undefined) {
      return Object.freeze({ ok: false as const, reason: 'bound-construction-failed' as const });
    }
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        primitiveId: primitive.id,
        aabb: Object.freeze({ x, y, z }),
      }),
    });
  } catch {
    return Object.freeze({ ok: false as const, reason: 'bound-construction-failed' as const });
  }
}

type Separation = Readonly<{
  axis: (typeof AXES)[number];
  order: 'a-before-b' | 'b-before-a';
  beforePrimitiveId: string;
  afterPrimitiveId: string;
  strictGap: ExactRational;
}>;

type ExpectedSeparation =
  | Readonly<{ kind: 'none' }>
  | Readonly<{ kind: 'separated'; certificate: Separation }>
  | Readonly<{
      kind: 'indeterminate';
      reason: 'arithmetic-budget-exhausted' | 'bound-construction-failed';
    }>;

function firstSeparation(bounds: readonly [ValidatedBound, ValidatedBound]): ExpectedSeparation {
  for (const axis of AXES) {
    const first = bounds[0].aabb[axis];
    const second = bounds[1].aabb[axis];
    if (compareRational(first.max, second.min) < 0) {
      const strictGap = subtractRational(second.min, first.max);
      if (!rationalWithinProducerBudget(strictGap)) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'arithmetic-budget-exhausted' as const,
        });
      }
      if (strictGap.numerator <= 0n) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'bound-construction-failed',
        });
      }
      return Object.freeze({
        kind: 'separated' as const,
        certificate: Object.freeze({
          axis,
          order: 'a-before-b' as const,
          beforePrimitiveId: bounds[0].primitiveId,
          afterPrimitiveId: bounds[1].primitiveId,
          strictGap,
        }),
      });
    }
    if (compareRational(second.max, first.min) < 0) {
      const strictGap = subtractRational(first.min, second.max);
      if (!rationalWithinProducerBudget(strictGap)) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'arithmetic-budget-exhausted' as const,
        });
      }
      if (strictGap.numerator <= 0n) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'bound-construction-failed',
        });
      }
      return Object.freeze({
        kind: 'separated' as const,
        certificate: Object.freeze({
          axis,
          order: 'b-before-a' as const,
          beforePrimitiveId: bounds[1].primitiveId,
          afterPrimitiveId: bounds[0].primitiveId,
          strictGap,
        }),
      });
    }
  }
  return Object.freeze({ kind: 'none' as const });
}

function certificateMatches(value: unknown, expected: Separation): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['axis', 'order', 'beforePrimitiveId', 'afterPrimitiveId', 'strictGap']) ||
    !isCanonicalRational(value.strictGap)
  ) {
    return false;
  }
  return (
    value.axis === expected.axis &&
    value.order === expected.order &&
    value.beforePrimitiveId === expected.beforePrimitiveId &&
    value.afterPrimitiveId === expected.afterPrimitiveId &&
    sameRational(value.strictGap, expected.strictGap)
  );
}

function indeterminatePairValid(
  value: Record<string, unknown>,
  reason: 'unsupported-motion-family' | 'arithmetic-budget-exhausted' | 'bound-construction-failed',
  motionFamilySupported: boolean,
): boolean {
  return (
    value.status === 'indeterminate' &&
    hasExactKeys(value, [
      'pairIndex',
      'firstPrimitiveId',
      'secondPrimitiveId',
      'status',
      'pairSlabSeparationCertified',
      'reason',
      'motionFamilySupported',
    ]) &&
    value.pairSlabSeparationCertified === false &&
    value.reason === reason &&
    value.motionFamilySupported === motionFamilySupported
  );
}

function pairValid(
  value: unknown,
  pairIndex: number,
  firstId: string,
  secondId: string,
  motionFamilySupported: boolean,
  firstExpected: ExpectedBoundBuild,
  secondExpected: ExpectedBoundBuild,
): 'separated' | 'candidate' | 'indeterminate' | undefined {
  if (!isRecord(value)) return undefined;
  const baseValid =
    value.pairIndex === pairIndex &&
    value.firstPrimitiveId === firstId &&
    value.secondPrimitiveId === secondId;
  if (!baseValid) return undefined;

  if (!motionFamilySupported) {
    return indeterminatePairValid(value, 'unsupported-motion-family', false)
      ? 'indeterminate'
      : undefined;
  }
  if (!firstExpected.ok || !secondExpected.ok) {
    const reason =
      (!firstExpected.ok && firstExpected.reason === 'arithmetic-budget-exhausted') ||
      (!secondExpected.ok && secondExpected.reason === 'arithmetic-budget-exhausted')
        ? 'arithmetic-budget-exhausted'
        : 'bound-construction-failed';
    return indeterminatePairValid(value, reason, true) ? 'indeterminate' : undefined;
  }
  const expectedBounds = Object.freeze([firstExpected.value, secondExpected.value] as const);
  const expectedSeparation = firstSeparation(expectedBounds);
  if (expectedSeparation.kind === 'indeterminate') {
    return indeterminatePairValid(value, expectedSeparation.reason, true)
      ? 'indeterminate'
      : undefined;
  }

  if (value.status === 'separated-by-certified-swept-aabb') {
    if (
      expectedSeparation.kind !== 'separated' ||
      !hasExactKeys(value, [
        'pairIndex',
        'firstPrimitiveId',
        'secondPrimitiveId',
        'status',
        'pairSlabSeparationCertified',
        'primitiveBounds',
        'certificate',
      ]) ||
      value.pairSlabSeparationCertified !== true
    ) {
      return undefined;
    }
    const bounds = readBounds(value.primitiveBounds, firstId, secondId);
    return bounds !== undefined &&
      sameAabb(bounds[0].aabb, expectedBounds[0].aabb) &&
      sameAabb(bounds[1].aabb, expectedBounds[1].aabb) &&
      certificateMatches(value.certificate, expectedSeparation.certificate)
      ? 'separated'
      : undefined;
  }

  if (value.status === 'swept-aabb-overlap-candidate') {
    if (
      expectedSeparation.kind !== 'none' ||
      !hasExactKeys(value, [
        'pairIndex',
        'firstPrimitiveId',
        'secondPrimitiveId',
        'status',
        'pairSlabSeparationCertified',
        'primitiveBounds',
      ]) ||
      value.pairSlabSeparationCertified !== false
    ) {
      return undefined;
    }
    const bounds = readBounds(value.primitiveBounds, firstId, secondId);
    return bounds !== undefined &&
      sameAabb(bounds[0].aabb, expectedBounds[0].aabb) &&
      sameAabb(bounds[1].aabb, expectedBounds[1].aabb)
      ? 'candidate'
      : undefined;
  }
  return undefined;
}

function censusRecordValid(
  value: unknown,
  source: AffineOriginRotationSweptAabbCensusInputV1,
): value is AffineOriginRotationSweptAabbCensusRecordV1 {
  if (!isRecord(value) || !hasExactKeys(value, CENSUS_RECORD_KEYS)) return false;
  const ids = source.primitives.map((primitive) => primitive.id);
  const pairCount = ids.length < 2 ? 0 : (ids.length * (ids.length - 1)) / 2;
  const motionFamilySupported =
    source.motionFamily === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1;
  const literalsValid =
    value.schemaVersion === 1 &&
    value.recordType === 'm0f-affine-origin-rotation-swept-aabb-census' &&
    value.contractStatus === 'candidate-no-claim' &&
    value.predicateScope === 'one-bounded-primitive-set-one-dyadic-slab-all-unordered-pairs' &&
    value.arithmetic ===
      'exact-projective-and-component-rational-bigint-with-safe-integer-counts' &&
    value.motionFamily === source.motionFamily &&
    value.supportedMotionFamily === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1 &&
    value.motionFamilySupported === motionFamilySupported &&
    unknownSlabMatches(value.slab, source.slab) &&
    value.primitiveOrder === 'stable-id-ascii-code-unit' &&
    value.pairOrder === 'first-id-then-second-id-ascii-code-unit' &&
    Array.isArray(value.primitiveIds) &&
    value.primitiveIds.length === ids.length &&
    value.primitiveIds.every((id, index) => id === ids[index]) &&
    value.primitiveCount === ids.length &&
    value.unorderedPairCount === pairCount &&
    value.completePairEnumeration === true &&
    value.completePairEnumerationScope === 'accepted-bounded-input-only' &&
    value.allUnorderedPairsIncluded === true &&
    value.silentPairExclusionIncluded === false &&
    value.indeterminatePromotionIncluded === false &&
    value.broadPhaseOnly === true &&
    value.pairClassifierIncluded === true &&
    value.continuousCollisionDetectionIncluded === false &&
    value.collisionFreeClaim === false &&
    value.legalContactClassificationIncluded === false &&
    value.penetrationClassificationIncluded === false &&
    value.selfIntersectionClassificationIncluded === false &&
    value.verified === false &&
    value.verifiedClaim === false &&
    value.scientificClaim === false &&
    value.globalM0fGo === false &&
    value.isSupportProfile === false &&
    value.supportClaim === false;
  if (!literalsValid || !Array.isArray(value.pairs) || value.pairs.length !== pairCount)
    return false;

  let pairIndex = 0;
  let separated = 0;
  let candidate = 0;
  let indeterminate = 0;
  const expectedBounds = new Map<string, ExpectedBoundBuild>();
  for (const primitive of source.primitives) {
    expectedBounds.set(primitive.id, buildExpectedBound(primitive));
  }
  for (let firstIndex = 0; firstIndex < ids.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < ids.length; secondIndex += 1) {
      const firstId = ids[firstIndex];
      const secondId = ids[secondIndex];
      if (firstId === undefined || secondId === undefined) return false;
      const firstExpected = expectedBounds.get(firstId);
      const secondExpected = expectedBounds.get(secondId);
      if (firstExpected === undefined || secondExpected === undefined) return false;
      const status = pairValid(
        value.pairs[pairIndex],
        pairIndex,
        firstId,
        secondId,
        motionFamilySupported,
        firstExpected,
        secondExpected,
      );
      if (status === undefined) return false;
      if (status === 'separated') separated += 1;
      else if (status === 'candidate') candidate += 1;
      else indeterminate += 1;
      pairIndex += 1;
    }
  }
  return (
    value.separatedPairCount === separated &&
    value.candidatePairCount === candidate &&
    value.indeterminatePairCount === indeterminate &&
    separated + candidate + indeterminate === pairCount
  );
}

export function parseAffineOriginRotationSweptAabbCensusWorkerRequestV1(
  supplied: unknown,
): ParseAffineOriginRotationSweptAabbCensusWorkerRequestV1Result {
  const snapshot = tryCreateBigIntValidationSnapshot(
    supplied,
    AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_LIMITS,
  );
  if (!snapshot.ok) {
    return requestFailure([
      failureIssue('snapshot', '$', 'invalid-snapshot', 'request must be bounded plain clone data'),
    ]);
  }
  const raw = snapshot.value;
  if (!isRecord(raw) || !hasExactKeys(raw, REQUEST_KEYS)) {
    return requestFailure([
      failureIssue('structure', '$', 'invalid-envelope', 'request must have the closed v1 shape'),
    ]);
  }
  if (
    !commonLiteralsValid(
      raw,
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE,
      false,
    ) ||
    !isAffineOriginRotationSweptAabbCensusWorkerSourceIdV1(raw.sourceId) ||
    !isAffineOriginRotationSweptAabbCensusWorkerJobIdV1(raw.jobId)
  ) {
    return requestFailure([
      failureIssue(
        'structure',
        '$',
        'invalid-envelope',
        'request literals or stable IDs are invalid',
      ),
    ]);
  }
  const parsedInput = parseAffineOriginRotationSweptAabbCensusInputV1(raw.input);
  if (!parsedInput.ok) {
    return requestFailure([
      failureIssue('input', '$.input', 'invalid-census-input', 'census input was rejected'),
    ]);
  }
  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
      recordType: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE,
      operation: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
      contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
      scientificClaim: false as const,
      sourceId: raw.sourceId,
      jobId: raw.jobId,
      input: parsedInput.value,
    },
  });
}

export function parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(
  supplied: unknown,
): ParseAffineOriginRotationSweptAabbCensusWorkerResponseV1Result {
  const snapshot = tryCreateBigIntValidationSnapshot(
    supplied,
    AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_LIMITS,
  );
  if (!snapshot.ok) {
    return responseFailure([
      failureIssue(
        'snapshot',
        '$',
        'invalid-snapshot',
        'response must be bounded plain clone data',
      ),
    ]);
  }
  const raw = snapshot.value;
  if (!isRecord(raw) || !hasExactKeys(raw, RESPONSE_KEYS)) {
    return responseFailure([
      failureIssue('structure', '$', 'invalid-envelope', 'response must have the closed v1 shape'),
    ]);
  }
  if (
    !commonLiteralsValid(
      raw,
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE,
      true,
    ) ||
    !isAffineOriginRotationSweptAabbCensusWorkerSourceIdV1(raw.sourceId) ||
    !isAffineOriginRotationSweptAabbCensusWorkerJobIdV1(raw.jobId)
  ) {
    return responseFailure([
      failureIssue(
        'structure',
        '$',
        'invalid-envelope',
        'response literals or stable IDs are invalid',
      ),
    ]);
  }
  const parsedInput = parseAffineOriginRotationSweptAabbCensusInputV1(raw.sourceInput);
  if (!parsedInput.ok) {
    return responseFailure([
      failureIssue('input', '$.sourceInput', 'invalid-source-input', 'source input was rejected'),
    ]);
  }

  const common = {
    schemaVersion: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
    recordType: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_RESPONSE_RECORD_TYPE,
    operation: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
    contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
    broadPhaseOnly: true as const,
    continuousCollisionDetectionIncluded: false as const,
    collisionFreeClaim: false as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    selfIntersectionClassificationIncluded: false as const,
    verified: false as const,
    verifiedClaim: false as const,
    scientificClaim: false as const,
    globalM0fGo: false as const,
    sourceId: raw.sourceId,
    jobId: raw.jobId,
    sourceInput: parsedInput.value,
  };

  if (raw.outcome === 'completed') {
    if (raw.reason !== null || !censusRecordValid(raw.result, parsedInput.value)) {
      return responseFailure([
        failureIssue(
          'result',
          '$.result',
          'invalid-census-result',
          'completed result violated the census no-claim contract',
        ),
      ]);
    }
    return deepFreezeOwned({
      ok: true as const,
      value: { ...common, outcome: 'completed' as const, reason: null, result: raw.result },
    });
  }

  if (
    raw.outcome !== 'failed' ||
    (raw.reason !== 'census-computation-rejected' && raw.reason !== 'internal-error') ||
    raw.result !== null
  ) {
    return responseFailure([
      failureIssue('invariant', '$', 'invalid-terminal-state', 'response terminal fields disagree'),
    ]);
  }
  return deepFreezeOwned({
    ok: true as const,
    value: {
      ...common,
      outcome: 'failed' as const,
      reason: raw.reason,
      result: null,
    },
  });
}
