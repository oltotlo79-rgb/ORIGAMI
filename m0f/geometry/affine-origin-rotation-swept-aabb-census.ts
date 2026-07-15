import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  equalExactRational,
  exactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  canonicalProjectivePoint3,
  type ProjectiveAxis3,
} from '../reference-verifier/projective-rational-3d.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  classifyAffineOriginRotationSweptAabbV1,
  parseAffineOriginRotationSweptAabbInputV1,
  type AffineOriginRotationPrimitiveBoundV1,
  type AffineOriginRotationSweptAabbIndeterminateReason,
  type AffineOriginRotationSweptAabbIssueCode,
  type AffineOriginRotationTrianglePrimitiveV1,
  type CanonicalDyadicTimeSlabV1,
  type ExactRationalAabb3V1,
} from './affine-origin-rotation-swept-aabb.js';

/**
 * Defensive ceilings for one bounded census call. They are not a product
 * SupportProfile and do not establish a supported mesh size or runtime.
 */
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS = deepFreezeOwned({
  maxPrimitives: 64,
  maxPairs: 2_016,
  maxIssues: 512,
  maxOwnPropertiesPerContainer: 8,
  maxDiagnosticPathSegmentLength: 128,
});

export type AffineOriginRotationSweptAabbCensusInputV1 = Readonly<{
  motionFamily: string;
  slab: CanonicalDyadicTimeSlabV1;
  primitives: readonly AffineOriginRotationTrianglePrimitiveV1[];
}>;

type CensusPairBaseV1 = Readonly<{
  pairIndex: number;
  firstPrimitiveId: string;
  secondPrimitiveId: string;
}>;

export type AffineOriginRotationSweptAabbCensusSeparatedPairV1 = CensusPairBaseV1 &
  Readonly<{
    status: 'separated-by-certified-swept-aabb';
    pairSlabSeparationCertified: true;
    primitiveBounds: readonly [
      AffineOriginRotationPrimitiveBoundV1,
      AffineOriginRotationPrimitiveBoundV1,
    ];
    certificate: Readonly<{
      axis: ProjectiveAxis3;
      order: 'a-before-b' | 'b-before-a';
      beforePrimitiveId: string;
      afterPrimitiveId: string;
      strictGap: ExactRational;
    }>;
  }>;

export type AffineOriginRotationSweptAabbCensusCandidatePairV1 = CensusPairBaseV1 &
  Readonly<{
    status: 'swept-aabb-overlap-candidate';
    pairSlabSeparationCertified: false;
    primitiveBounds: readonly [
      AffineOriginRotationPrimitiveBoundV1,
      AffineOriginRotationPrimitiveBoundV1,
    ];
  }>;

export type AffineOriginRotationSweptAabbCensusIndeterminatePairV1 = CensusPairBaseV1 &
  Readonly<{
    status: 'indeterminate';
    pairSlabSeparationCertified: false;
    reason: AffineOriginRotationSweptAabbIndeterminateReason;
    motionFamilySupported: boolean;
  }>;

export type AffineOriginRotationSweptAabbCensusPairV1 =
  | AffineOriginRotationSweptAabbCensusSeparatedPairV1
  | AffineOriginRotationSweptAabbCensusCandidatePairV1
  | AffineOriginRotationSweptAabbCensusIndeterminatePairV1;

export type AffineOriginRotationSweptAabbCensusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-affine-origin-rotation-swept-aabb-census';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-bounded-primitive-set-one-dyadic-slab-all-unordered-pairs';
  arithmetic: 'exact-projective-and-component-rational-bigint-with-safe-integer-counts';
  motionFamily: string;
  supportedMotionFamily: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1;
  motionFamilySupported: boolean;
  slab: CanonicalDyadicTimeSlabV1;
  primitiveOrder: 'stable-id-ascii-code-unit';
  pairOrder: 'first-id-then-second-id-ascii-code-unit';
  primitiveIds: readonly string[];
  primitiveCount: number;
  unorderedPairCount: number;
  separatedPairCount: number;
  candidatePairCount: number;
  indeterminatePairCount: number;
  pairs: readonly AffineOriginRotationSweptAabbCensusPairV1[];
  completePairEnumeration: true;
  completePairEnumerationScope: 'accepted-bounded-input-only';
  allUnorderedPairsIncluded: true;
  silentPairExclusionIncluded: false;
  indeterminatePromotionIncluded: false;
  broadPhaseOnly: true;
  pairClassifierIncluded: true;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  verified: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
  isSupportProfile: false;
  supportClaim: false;
}>;

export type AffineOriginRotationSweptAabbCensusIssueCode =
  | 'expected-object'
  | 'expected-array'
  | 'unknown-property'
  | 'missing-property'
  | 'accessor-property'
  | 'invalid-property'
  | 'property-limit-exceeded'
  | 'primitive-count-limit-exceeded'
  | 'pair-count-limit-exceeded'
  | 'invalid-shared-contract'
  | 'invalid-primitive'
  | 'duplicate-id'
  | 'inspection-failed'
  | 'classifier-failure-invariant'
  | 'internal-count-invariant';

export type AffineOriginRotationSweptAabbCensusIssueV1 = Readonly<{
  path: string;
  code: AffineOriginRotationSweptAabbCensusIssueCode;
  message: string;
  sourceCode?: AffineOriginRotationSweptAabbIssueCode;
}>;

export type AffineOriginRotationSweptAabbCensusInputParseResultV1 =
  | Readonly<{ ok: true; value: AffineOriginRotationSweptAabbCensusInputV1 }>
  | Readonly<{ ok: false; error: readonly AffineOriginRotationSweptAabbCensusIssueV1[] }>;

export type AffineOriginRotationSweptAabbCensusResultV1 =
  | Readonly<{ ok: true; value: AffineOriginRotationSweptAabbCensusRecordV1 }>
  | Readonly<{ ok: false; error: readonly AffineOriginRotationSweptAabbCensusIssueV1[] }>;

type Issue = AffineOriginRotationSweptAabbCensusIssueV1;
type Failure = Readonly<{ ok: false; error: readonly Issue[] }>;
type InspectedObject = ReadonlyMap<PropertyKey, PropertyDescriptor>;
type IndexedValue = Readonly<{ sourceIndex: number; value: unknown }>;

const ROOT_KEYS = ['motionFamily', 'slab', 'primitives'] as const;
const PRIMITIVE_KEYS = ['id', 'localVertices', 'q0', 'q1'] as const;
const AXES = ['x', 'y', 'z'] as const;
const SENTINEL_A_ID = 'census-validation-sentinel-a';
const SENTINEL_B_ID = 'census-validation-sentinel-b';
const SENTINEL_TRIANGLE = Object.freeze([
  canonicalProjectivePoint3(0n, 0n, 0n, 1n),
  canonicalProjectivePoint3(1n, 0n, 0n, 1n),
  canonicalProjectivePoint3(0n, 1n, 0n, 1n),
] as const);
const SENTINEL_ORIGIN = canonicalProjectivePoint3(0n, 0n, 0n, 1n);

function sentinel(id: string): AffineOriginRotationTrianglePrimitiveV1 {
  return Object.freeze({
    id,
    localVertices: SENTINEL_TRIANGLE,
    q0: SENTINEL_ORIGIN,
    q1: SENTINEL_ORIGIN,
  });
}

const SENTINEL_A = sentinel(SENTINEL_A_ID);
const SENTINEL_B = sentinel(SENTINEL_B_ID);

function addIssue(
  issues: Issue[],
  path: string,
  code: AffineOriginRotationSweptAabbCensusIssueCode,
  message: string,
  sourceCode?: AffineOriginRotationSweptAabbIssueCode,
): void {
  if (issues.length >= AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxIssues) return;
  issues.push(
    sourceCode === undefined
      ? Object.freeze({ path, code, message })
      : Object.freeze({ path, code, message, sourceCode }),
  );
}

function failure(issues: readonly Issue[]): Failure {
  return deepFreezeOwned({ ok: false as const, error: [...issues] });
}

function diagnosticPropertyKey(key: PropertyKey): string {
  const limit = AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxDiagnosticPathSegmentLength;
  if (typeof key === 'symbol') {
    const description = key.description ?? '';
    const wrapperLength = 'Symbol()'.length;
    if (description.length + wrapperLength <= limit) return `Symbol(${description})`;
    const retained = limit - wrapperLength - 1;
    return `Symbol(${description.slice(0, retained)}…)`;
  }
  const raw = typeof key === 'string' ? key : String(key);
  return raw.length <= limit ? raw : `${raw.slice(0, limit - 1)}…`;
}

function comparePropertyKeys(left: PropertyKey, right: PropertyKey): number {
  const leftText = `${typeof left === 'symbol' ? '1' : '0'}:${diagnosticPropertyKey(left)}`;
  const rightText = `${typeof right === 'symbol' ? '1' : '0'}:${diagnosticPropertyKey(right)}`;
  return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
}

function inspectClosedObject(
  supplied: unknown,
  path: string,
  expectedKeys: readonly string[],
  issues: Issue[],
): InspectedObject | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, path, 'expected-object', 'must be one plain data object');
    return undefined;
  }
  try {
    if (Array.isArray(supplied)) {
      addIssue(issues, path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const prototype: unknown = Reflect.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      addIssue(issues, path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    if (
      keys.length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxOwnPropertiesPerContainer
    ) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        `container exceeds ${String(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxOwnPropertiesPerContainer)} own properties`,
      );
      return undefined;
    }
    const expected = new Set(expectedKeys);
    const descriptors = new Map<PropertyKey, PropertyDescriptor>();
    for (const key of [...keys].sort(comparePropertyKeys)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
      if (descriptor === undefined) throw new TypeError('property disappeared during inspection');
      descriptors.set(key, descriptor);
      if (typeof key !== 'string' || !expected.has(key)) {
        addIssue(
          issues,
          `${path}.${diagnosticPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the closed census input contract',
        );
      }
    }
    for (const key of expectedKeys) {
      const descriptor = descriptors.get(key);
      if (descriptor === undefined) {
        addIssue(issues, `${path}.${key}`, 'missing-property', 'required property is missing');
      } else if (!('value' in descriptor)) {
        addIssue(issues, `${path}.${key}`, 'accessor-property', 'accessors are not input data');
      } else if (!descriptor.enumerable) {
        addIssue(
          issues,
          `${path}.${key}`,
          'invalid-property',
          'input data properties must be enumerable',
        );
      }
    }
    return descriptors;
  } catch {
    addIssue(issues, path, 'inspection-failed', 'input properties could not be inspected safely');
    return undefined;
  }
}

function descriptorValue(inspected: InspectedObject | undefined, key: string): unknown {
  const descriptor = inspected?.get(key);
  return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable
    ? descriptor.value
    : undefined;
}

function unorderedPairCountBigInt(primitiveCount: number): bigint {
  const count = BigInt(primitiveCount);
  return (count * (count - 1n)) / 2n;
}

function inspectPrimitiveArray(
  supplied: unknown,
  path: string,
  issues: Issue[],
): readonly IndexedValue[] | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, path, 'expected-array', 'primitives must be one dense plain array');
    return undefined;
  }
  try {
    if (!Array.isArray(supplied) || Reflect.getPrototypeOf(supplied) !== Array.prototype) {
      addIssue(issues, path, 'expected-array', 'primitives must be one dense plain array');
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(supplied, 'length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      addIssue(issues, path, 'expected-array', 'primitives must have a valid dense-array length');
      return undefined;
    }
    const length = lengthDescriptor.value;
    const pairCount = unorderedPairCountBigInt(length);
    if (length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPrimitives) {
      addIssue(
        issues,
        path,
        'primitive-count-limit-exceeded',
        `primitive count exceeds ${String(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPrimitives)}`,
      );
    }
    if (pairCount > BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPairs)) {
      addIssue(
        issues,
        path,
        'pair-count-limit-exceeded',
        `unordered pair count exceeds ${String(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPairs)}`,
      );
    }
    if (
      length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPrimitives ||
      pairCount > BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPairs)
    ) {
      return undefined;
    }
    if (keys.length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPrimitives + 1) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        'primitives array has too many own properties for the bounded census',
      );
      return undefined;
    }
    const expected = new Set(['length', ...Array.from({ length }, (_, index) => String(index))]);
    for (const key of [...keys].sort(comparePropertyKeys)) {
      if (typeof key !== 'string' || !expected.has(key)) {
        addIssue(
          issues,
          `${path}.${diagnosticPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the dense primitive-set contract',
        );
      }
    }
    const values: IndexedValue[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, String(index));
      const entryPath = `${path}[${String(index)}]`;
      if (descriptor === undefined) {
        addIssue(issues, entryPath, 'missing-property', 'primitive entry is missing');
      } else if (!('value' in descriptor)) {
        addIssue(issues, entryPath, 'accessor-property', 'accessor entries are not input data');
      } else if (!descriptor.enumerable) {
        addIssue(issues, entryPath, 'invalid-property', 'primitive entries must be enumerable');
      } else {
        const value = descriptor.value as unknown;
        values.push(Object.freeze({ sourceIndex: index, value }));
      }
    }
    return Object.freeze(values);
  } catch {
    addIssue(issues, path, 'inspection-failed', 'primitives could not be inspected safely');
    return undefined;
  }
}

function mapSourcePath(path: string, sourceIndex: number): string {
  const prefix = '$.primitives[0]';
  return path.startsWith(prefix)
    ? `$.primitives[${String(sourceIndex)}]${path.slice(prefix.length)}`
    : path;
}

function appendPairParserIssues(
  issues: Issue[],
  sourceIssues: readonly Readonly<{
    path: string;
    code: AffineOriginRotationSweptAabbIssueCode;
    message: string;
  }>[],
  code: 'invalid-shared-contract' | 'invalid-primitive',
  sourceIndex?: number,
): void {
  for (const source of sourceIssues) {
    addIssue(
      issues,
      sourceIndex === undefined ? source.path : mapSourcePath(source.path, sourceIndex),
      code,
      source.message,
      source.code,
    );
  }
}

function parseSharedContract(
  motionFamily: unknown,
  slab: unknown,
  issues: Issue[],
): Readonly<{ motionFamily: string; slab: CanonicalDyadicTimeSlabV1 }> | undefined {
  const parsed = parseAffineOriginRotationSweptAabbInputV1({
    motionFamily,
    slab,
    primitives: [SENTINEL_A, SENTINEL_B],
  });
  if (!parsed.ok) {
    appendPairParserIssues(issues, parsed.error, 'invalid-shared-contract');
    return undefined;
  }
  return Object.freeze({ motionFamily: parsed.value.motionFamily, slab: parsed.value.slab });
}

function snapshotPrimitiveTopLevel(indexed: IndexedValue, issues: Issue[]): unknown {
  const path = `$.primitives[${String(indexed.sourceIndex)}]`;
  const inspected = inspectClosedObject(indexed.value, path, PRIMITIVE_KEYS, issues);
  if (inspected === undefined) return undefined;
  return Object.freeze({
    id: descriptorValue(inspected, 'id'),
    localVertices: descriptorValue(inspected, 'localVertices'),
    q0: descriptorValue(inspected, 'q0'),
    q1: descriptorValue(inspected, 'q1'),
  });
}

function parsePrimitive(
  indexed: IndexedValue,
  shared: Readonly<{ motionFamily: string; slab: CanonicalDyadicTimeSlabV1 }>,
  issues: Issue[],
): AffineOriginRotationTrianglePrimitiveV1 | undefined {
  const snapshot = snapshotPrimitiveTopLevel(indexed, issues);
  if (snapshot === undefined) return undefined;
  const snapshotId = (snapshot as Readonly<{ id?: unknown }>).id;
  const selectedSentinel = snapshotId === SENTINEL_A_ID ? SENTINEL_B : SENTINEL_A;
  const parsed = parseAffineOriginRotationSweptAabbInputV1({
    motionFamily: shared.motionFamily,
    slab: shared.slab,
    primitives: [snapshot, selectedSentinel],
  });
  if (!parsed.ok) {
    appendPairParserIssues(issues, parsed.error, 'invalid-primitive', indexed.sourceIndex);
    return undefined;
  }
  const candidate = parsed.value.primitives.find((entry) => entry.id !== selectedSentinel.id);
  if (candidate === undefined) {
    addIssue(
      issues,
      `$.primitives[${String(indexed.sourceIndex)}]`,
      'invalid-primitive',
      'primitive did not survive canonical pair parsing',
    );
  }
  return candidate;
}

/** Closed parser that canonicalizes the complete primitive set by stable ID. */
export function parseAffineOriginRotationSweptAabbCensusInputV1(
  supplied: unknown,
): AffineOriginRotationSweptAabbCensusInputParseResultV1 {
  const issues: Issue[] = [];
  const root = inspectClosedObject(supplied, '$', ROOT_KEYS, issues);
  const motionFamily = descriptorValue(root, 'motionFamily');
  const slab = descriptorValue(root, 'slab');
  const indexed = inspectPrimitiveArray(
    descriptorValue(root, 'primitives'),
    '$.primitives',
    issues,
  );
  const shared = parseSharedContract(motionFamily, slab, issues);
  const parsed =
    indexed === undefined || shared === undefined
      ? undefined
      : indexed.flatMap((entry) => {
          const value = parsePrimitive(entry, shared, issues);
          return value === undefined
            ? []
            : [Object.freeze({ sourceIndex: entry.sourceIndex, primitive: value })];
        });
  if (parsed !== undefined) {
    const firstIndexById = new Map<string, number>();
    for (const entry of parsed) {
      const firstIndex = firstIndexById.get(entry.primitive.id);
      if (firstIndex === undefined) {
        firstIndexById.set(entry.primitive.id, entry.sourceIndex);
      } else {
        addIssue(
          issues,
          `$.primitives[${String(entry.sourceIndex)}].id`,
          'duplicate-id',
          `primitive ID duplicates $.primitives[${String(firstIndex)}].id`,
        );
      }
    }
  }
  if (issues.length > 0 || shared === undefined || parsed === undefined) return failure(issues);
  parsed.sort((left, right) =>
    left.primitive.id < right.primitive.id ? -1 : left.primitive.id > right.primitive.id ? 1 : 0,
  );
  return deepFreezeOwned({
    ok: true as const,
    value: {
      motionFamily: shared.motionFamily,
      slab: shared.slab,
      primitives: parsed.map((entry) => entry.primitive),
    },
  });
}

function exactOwnDataRecord(
  supplied: unknown,
  expectedKeys: readonly string[],
): Readonly<Record<string, unknown>> | undefined {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied))
    return undefined;
  try {
    const prototype: unknown = Reflect.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    const keys = Reflect.ownKeys(supplied);
    if (
      keys.length !== expectedKeys.length ||
      keys.some((key) => typeof key !== 'string' || !expectedKeys.includes(key))
    ) {
      return undefined;
    }
    const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of expectedKeys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
      result[key] = descriptor.value;
    }
    return result;
  } catch {
    return undefined;
  }
}

function ownDataProperty(supplied: unknown, key: string): unknown {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied))
    return undefined;
  try {
    const prototype: unknown = Reflect.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
    return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable
      ? (descriptor.value as unknown)
      : undefined;
  } catch {
    return undefined;
  }
}

function exactDenseArray(supplied: unknown, length: number): readonly unknown[] | undefined {
  if (typeof supplied !== 'object' || supplied === null) return undefined;
  try {
    if (!Array.isArray(supplied) || Reflect.getPrototypeOf(supplied) !== Array.prototype) {
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    const expected = new Set(['length', ...Array.from({ length }, (_, index) => String(index))]);
    if (
      keys.length !== length + 1 ||
      keys.some((key) => typeof key !== 'string' || !expected.has(key))
    ) {
      return undefined;
    }
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(supplied, 'length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      lengthDescriptor.value !== length
    ) {
      return undefined;
    }
    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, String(index));
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return undefined;
  }
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function readCanonicalRational(supplied: unknown): ExactRational | undefined {
  const record = exactOwnDataRecord(supplied, ['numerator', 'denominator']);
  if (record === undefined) return undefined;
  const { numerator, denominator } = record;
  if (
    typeof numerator !== 'bigint' ||
    typeof denominator !== 'bigint' ||
    denominator <= 0n ||
    greatestCommonDivisor(numerator, denominator) !== 1n
  ) {
    return undefined;
  }
  return exactRational(numerator, denominator);
}

function readInterval(
  supplied: unknown,
): Readonly<{ min: ExactRational; max: ExactRational }> | undefined {
  const record = exactOwnDataRecord(supplied, ['min', 'max']);
  if (record === undefined) return undefined;
  const min = readCanonicalRational(record.min);
  const max = readCanonicalRational(record.max);
  return min === undefined || max === undefined || compareExactRational(min, max) > 0
    ? undefined
    : Object.freeze({ min, max });
}

function readAabb(supplied: unknown): ExactRationalAabb3V1 | undefined {
  const record = exactOwnDataRecord(supplied, AXES);
  if (record === undefined) return undefined;
  const x = readInterval(record.x);
  const y = readInterval(record.y);
  const z = readInterval(record.z);
  return x === undefined || y === undefined || z === undefined
    ? undefined
    : Object.freeze({ x, y, z });
}

function readPrimitiveBounds(
  supplied: unknown,
  primitiveIds: readonly [string, string],
):
  | readonly [AffineOriginRotationPrimitiveBoundV1, AffineOriginRotationPrimitiveBoundV1]
  | undefined {
  const entries = exactDenseArray(supplied, 2);
  if (entries === undefined) return undefined;
  const result: AffineOriginRotationPrimitiveBoundV1[] = [];
  for (let index = 0; index < 2; index += 1) {
    const record = exactOwnDataRecord(entries[index], ['primitiveId', 'aabb']);
    const aabb = readAabb(record?.aabb);
    if (record === undefined || record.primitiveId !== primitiveIds[index] || aabb === undefined) {
      return undefined;
    }
    result.push(Object.freeze({ primitiveId: primitiveIds[index] ?? '', aabb }));
  }
  const first = result[0];
  const second = result[1];
  return first === undefined || second === undefined
    ? undefined
    : Object.freeze([first, second] as const);
}

function sameSlab(left: unknown, right: CanonicalDyadicTimeSlabV1): boolean {
  const slab = exactOwnDataRecord(left, ['t0', 't1']);
  const t0 = exactOwnDataRecord(slab?.t0, ['numerator', 'exponent']);
  const t1 = exactOwnDataRecord(slab?.t1, ['numerator', 'exponent']);
  return (
    t0?.numerator === right.t0.numerator &&
    t0.exponent === right.t0.exponent &&
    t1?.numerator === right.t1.numerator &&
    t1.exponent === right.t1.exponent
  );
}

type ExpectedSeparation = Readonly<{
  axis: ProjectiveAxis3;
  order: 'a-before-b' | 'b-before-a';
  beforePrimitiveId: string;
  afterPrimitiveId: string;
  strictGap: ExactRational;
}>;

function expectedSeparation(
  bounds: readonly [AffineOriginRotationPrimitiveBoundV1, AffineOriginRotationPrimitiveBoundV1],
): ExpectedSeparation | undefined {
  const first = bounds[0].aabb;
  const second = bounds[1].aabb;
  for (const axis of AXES) {
    if (compareExactRational(first[axis].max, second[axis].min) < 0) {
      return Object.freeze({
        axis,
        order: 'a-before-b' as const,
        beforePrimitiveId: bounds[0].primitiveId,
        afterPrimitiveId: bounds[1].primitiveId,
        strictGap: subtractExactRational(second[axis].min, first[axis].max),
      });
    }
    if (compareExactRational(second[axis].max, first[axis].min) < 0) {
      return Object.freeze({
        axis,
        order: 'b-before-a' as const,
        beforePrimitiveId: bounds[1].primitiveId,
        afterPrimitiveId: bounds[0].primitiveId,
        strictGap: subtractExactRational(first[axis].min, second[axis].max),
      });
    }
  }
  return undefined;
}

function localRadius(
  vertex: AffineOriginRotationTrianglePrimitiveV1['localVertices'][number],
): ExactRational {
  return exactRational(absolute(vertex.x) + absolute(vertex.y) + absolute(vertex.z), vertex.w);
}

function pointCoordinate(
  point: AffineOriginRotationTrianglePrimitiveV1['q0'],
  axis: ProjectiveAxis3,
): ExactRational {
  return exactRational(point[axis], point.w);
}

function independentlyBuildAabb(
  primitive: AffineOriginRotationTrianglePrimitiveV1,
): ExactRationalAabb3V1 {
  const radii = primitive.localVertices.map(localRadius);
  const result: Partial<
    Record<ProjectiveAxis3, Readonly<{ min: ExactRational; max: ExactRational }>>
  > = {};
  for (const axis of AXES) {
    const q0 = pointCoordinate(primitive.q0, axis);
    const q1 = pointCoordinate(primitive.q1, axis);
    const originMin = compareExactRational(q0, q1) <= 0 ? q0 : q1;
    const originMax = compareExactRational(q0, q1) >= 0 ? q0 : q1;
    let minimum: ExactRational | undefined;
    let maximum: ExactRational | undefined;
    for (const radius of radii) {
      const candidateMin = subtractExactRational(originMin, radius);
      const candidateMax = addExactRational(originMax, radius);
      if (minimum === undefined || compareExactRational(candidateMin, minimum) < 0) {
        minimum = candidateMin;
      }
      if (maximum === undefined || compareExactRational(candidateMax, maximum) > 0) {
        maximum = candidateMax;
      }
    }
    if (minimum === undefined || maximum === undefined) {
      throw new RangeError('a canonical triangle must have three local radii');
    }
    result[axis] = Object.freeze({ min: minimum, max: maximum });
  }
  const { x, y, z } = result;
  if (x === undefined || y === undefined || z === undefined) {
    throw new RangeError('an independently reconstructed AABB requires all axes');
  }
  return Object.freeze({ x, y, z });
}

function sameAabb(left: ExactRationalAabb3V1, right: ExactRationalAabb3V1): boolean {
  return AXES.every(
    (axis) =>
      equalExactRational(left[axis].min, right[axis].min) &&
      equalExactRational(left[axis].max, right[axis].max),
  );
}

function boundsMatchPrimitiveInput(
  bounds: readonly [AffineOriginRotationPrimitiveBoundV1, AffineOriginRotationPrimitiveBoundV1],
  primitives: readonly [
    AffineOriginRotationTrianglePrimitiveV1,
    AffineOriginRotationTrianglePrimitiveV1,
  ],
): boolean {
  return (
    bounds[0].primitiveId === primitives[0].id &&
    bounds[1].primitiveId === primitives[1].id &&
    sameAabb(bounds[0].aabb, independentlyBuildAabb(primitives[0])) &&
    sameAabb(bounds[1].aabb, independentlyBuildAabb(primitives[1]))
  );
}

function readCertificate(
  supplied: unknown,
  expected: ExpectedSeparation,
): ExpectedSeparation | undefined {
  const record = exactOwnDataRecord(supplied, [
    'axis',
    'order',
    'beforePrimitiveId',
    'afterPrimitiveId',
    'strictGap',
  ]);
  const strictGap = readCanonicalRational(record?.strictGap);
  if (
    record === undefined ||
    strictGap === undefined ||
    record.axis !== expected.axis ||
    record.order !== expected.order ||
    record.beforePrimitiveId !== expected.beforePrimitiveId ||
    record.afterPrimitiveId !== expected.afterPrimitiveId ||
    !equalExactRational(strictGap, expected.strictGap)
  ) {
    return undefined;
  }
  return Object.freeze({ ...expected, strictGap });
}

const COMMON_RECORD_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'predicateScope',
  'arithmetic',
  'broadPhaseOnly',
  'boundaryEqualityRetainedAsCandidate',
  'continuousCollisionDetectionIncluded',
  'collisionFreeClaim',
  'legalContactClassificationIncluded',
  'penetrationClassificationIncluded',
  'selfIntersectionClassificationIncluded',
  'verified',
  'verifiedClaim',
  'scientificClaim',
  'globalM0fGo',
  'supportedMotionFamily',
  'suppliedMotionFamily',
  'primitiveIds',
  'slab',
] as const;

function commonRecordValid(
  record: Readonly<Record<string, unknown>>,
  motionFamily: string,
  slab: CanonicalDyadicTimeSlabV1,
  primitiveIds: readonly [string, string],
): boolean {
  const ids = exactDenseArray(record.primitiveIds, 2);
  return (
    record.schemaVersion === 1 &&
    record.recordType === 'm0f-affine-origin-rotation-swept-aabb' &&
    record.contractStatus === 'candidate-no-claim' &&
    record.predicateScope === 'one-pair-one-dyadic-slab-loose-broad-phase' &&
    record.arithmetic === 'exact-projective-and-component-rational-bigint' &&
    record.broadPhaseOnly === true &&
    record.boundaryEqualityRetainedAsCandidate === true &&
    record.continuousCollisionDetectionIncluded === false &&
    record.collisionFreeClaim === false &&
    record.legalContactClassificationIncluded === false &&
    record.penetrationClassificationIncluded === false &&
    record.selfIntersectionClassificationIncluded === false &&
    record.verified === false &&
    record.verifiedClaim === false &&
    record.scientificClaim === false &&
    record.globalM0fGo === false &&
    record.supportedMotionFamily === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1 &&
    record.suppliedMotionFamily === motionFamily &&
    ids?.[0] === primitiveIds[0] &&
    ids[1] === primitiveIds[1] &&
    sameSlab(record.slab, slab)
  );
}

type ValidatedClassifierRecord =
  | Readonly<{
      status: 'separated-by-certified-swept-aabb';
      primitiveBounds: readonly [
        AffineOriginRotationPrimitiveBoundV1,
        AffineOriginRotationPrimitiveBoundV1,
      ];
      certificate: ExpectedSeparation;
    }>
  | Readonly<{
      status: 'swept-aabb-overlap-candidate';
      primitiveBounds: readonly [
        AffineOriginRotationPrimitiveBoundV1,
        AffineOriginRotationPrimitiveBoundV1,
      ];
    }>
  | Readonly<{
      status: 'indeterminate';
      reason: AffineOriginRotationSweptAabbIndeterminateReason;
      motionFamilySupported: boolean;
    }>;

function validateClassifierRecord(
  supplied: unknown,
  motionFamily: string,
  slab: CanonicalDyadicTimeSlabV1,
  primitives: readonly [
    AffineOriginRotationTrianglePrimitiveV1,
    AffineOriginRotationTrianglePrimitiveV1,
  ],
): ValidatedClassifierRecord | undefined {
  const primitiveIds = Object.freeze([primitives[0].id, primitives[1].id] as const);
  const status = ownDataProperty(supplied, 'status');
  const specificKeys =
    status === 'separated-by-certified-swept-aabb'
      ? [
          'motionFamilySupported',
          'arbitrarySo3RotationEnclosed',
          'pairSlabSeparationCertified',
          'primitiveBounds',
          'certificate',
        ]
      : status === 'swept-aabb-overlap-candidate'
        ? [
            'motionFamilySupported',
            'arbitrarySo3RotationEnclosed',
            'pairSlabSeparationCertified',
            'primitiveBounds',
          ]
        : status === 'indeterminate'
          ? [
              'reason',
              'motionFamilySupported',
              'arbitrarySo3RotationEnclosed',
              'pairSlabSeparationCertified',
            ]
          : undefined;
  if (specificKeys === undefined) return undefined;
  const record = exactOwnDataRecord(supplied, [...COMMON_RECORD_KEYS, 'status', ...specificKeys]);
  if (
    record === undefined ||
    record.status !== status ||
    !commonRecordValid(record, motionFamily, slab, primitiveIds)
  ) {
    return undefined;
  }
  if (status === 'separated-by-certified-swept-aabb') {
    const bounds = readPrimitiveBounds(record.primitiveBounds, primitiveIds);
    const expected = bounds === undefined ? undefined : expectedSeparation(bounds);
    const certificate =
      expected === undefined ? undefined : readCertificate(record.certificate, expected);
    if (
      motionFamily !== AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1 ||
      record.motionFamilySupported !== true ||
      record.arbitrarySo3RotationEnclosed !== true ||
      record.pairSlabSeparationCertified !== true ||
      bounds === undefined ||
      !boundsMatchPrimitiveInput(bounds, primitives) ||
      certificate === undefined
    ) {
      return undefined;
    }
    return Object.freeze({ status, primitiveBounds: bounds, certificate });
  }
  if (status === 'swept-aabb-overlap-candidate') {
    const bounds = readPrimitiveBounds(record.primitiveBounds, primitiveIds);
    if (
      motionFamily !== AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1 ||
      record.motionFamilySupported !== true ||
      record.arbitrarySo3RotationEnclosed !== true ||
      record.pairSlabSeparationCertified !== false ||
      bounds === undefined ||
      !boundsMatchPrimitiveInput(bounds, primitives) ||
      expectedSeparation(bounds) !== undefined
    ) {
      return undefined;
    }
    return Object.freeze({ status, primitiveBounds: bounds });
  }
  const suppliedReason = record.reason;
  const reason: AffineOriginRotationSweptAabbIndeterminateReason | undefined =
    suppliedReason === 'unsupported-motion-family' ||
    suppliedReason === 'arithmetic-budget-exhausted' ||
    suppliedReason === 'bound-construction-failed'
      ? suppliedReason
      : undefined;
  const expectedMotionSupport = reason !== 'unsupported-motion-family';
  if (
    reason === undefined ||
    record.motionFamilySupported !== expectedMotionSupport ||
    record.arbitrarySo3RotationEnclosed !== false ||
    record.pairSlabSeparationCertified !== false ||
    (reason === 'unsupported-motion-family') !==
      (motionFamily !== AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1)
  ) {
    return undefined;
  }
  return Object.freeze({
    status: 'indeterminate' as const,
    reason,
    motionFamilySupported: expectedMotionSupport,
  });
}

function classifierInvariantFailure(firstId: string, secondId: string): Failure {
  return failure([
    Object.freeze({
      path: `$.pairs[${firstId},${secondId}]`,
      code: 'classifier-failure-invariant' as const,
      message: 'a canonical primitive pair did not produce the fixed swept-AABB no-claim record',
    }),
  ]);
}

/**
 * Applies the pair classifier to every unordered pair exactly once. A parser,
 * dependency, evidence, or counter failure rejects the whole census; no
 * partial ledger is returned and indeterminate pairs are never promoted.
 */
export function computeAffineOriginRotationSweptAabbCensusV1(
  supplied: unknown,
): AffineOriginRotationSweptAabbCensusResultV1 {
  const parsed = parseAffineOriginRotationSweptAabbCensusInputV1(supplied);
  if (!parsed.ok) return parsed;
  const { motionFamily, slab, primitives } = parsed.value;
  const pairs: AffineOriginRotationSweptAabbCensusPairV1[] = [];
  let separatedPairCount = 0;
  let candidatePairCount = 0;
  let indeterminatePairCount = 0;

  for (let firstIndex = 0; firstIndex < primitives.length; firstIndex += 1) {
    const first = primitives[firstIndex];
    if (first === undefined) {
      return failure([
        Object.freeze({
          path: '$.primitives',
          code: 'internal-count-invariant' as const,
          message: 'canonical primitive order contains a missing entry',
        }),
      ]);
    }
    for (let secondIndex = firstIndex + 1; secondIndex < primitives.length; secondIndex += 1) {
      const second = primitives[secondIndex];
      if (second === undefined) {
        return failure([
          Object.freeze({
            path: '$.primitives',
            code: 'internal-count-invariant' as const,
            message: 'canonical primitive order contains a missing entry',
          }),
        ]);
      }
      let validated: ValidatedClassifierRecord | undefined;
      try {
        const classified = classifyAffineOriginRotationSweptAabbV1({
          motionFamily,
          slab,
          primitives: [first, second],
        });
        if (classified.ok) {
          validated = validateClassifierRecord(classified.value, motionFamily, slab, [
            first,
            second,
          ]);
        }
      } catch {
        return classifierInvariantFailure(first.id, second.id);
      }
      if (validated === undefined) return classifierInvariantFailure(first.id, second.id);

      const base = {
        pairIndex: pairs.length,
        firstPrimitiveId: first.id,
        secondPrimitiveId: second.id,
      } as const;
      if (validated.status === 'separated-by-certified-swept-aabb') {
        separatedPairCount += 1;
        pairs.push({
          ...base,
          status: validated.status,
          pairSlabSeparationCertified: true,
          primitiveBounds: validated.primitiveBounds,
          certificate: validated.certificate,
        });
      } else if (validated.status === 'swept-aabb-overlap-candidate') {
        candidatePairCount += 1;
        pairs.push({
          ...base,
          status: validated.status,
          pairSlabSeparationCertified: false,
          primitiveBounds: validated.primitiveBounds,
        });
      } else {
        indeterminatePairCount += 1;
        pairs.push({
          ...base,
          status: validated.status,
          pairSlabSeparationCertified: false,
          reason: validated.reason,
          motionFamilySupported: validated.motionFamilySupported,
        });
      }
    }
  }

  const expectedPairs = Number(unorderedPairCountBigInt(primitives.length));
  const classifiedPairs = separatedPairCount + candidatePairCount + indeterminatePairCount;
  if (
    pairs.length !== expectedPairs ||
    classifiedPairs !== expectedPairs ||
    pairs.some((entry, index) => entry.pairIndex !== index) ||
    pairs.filter((entry) => entry.status === 'separated-by-certified-swept-aabb').length !==
      separatedPairCount ||
    pairs.filter((entry) => entry.status === 'swept-aabb-overlap-candidate').length !==
      candidatePairCount ||
    pairs.filter((entry) => entry.status === 'indeterminate').length !== indeterminatePairCount
  ) {
    return failure([
      Object.freeze({
        path: '$.pairs',
        code: 'internal-count-invariant' as const,
        message: 'pair ledger and bounded safe-integer counters disagree',
      }),
    ]);
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: 'm0f-affine-origin-rotation-swept-aabb-census' as const,
      contractStatus: 'candidate-no-claim' as const,
      predicateScope: 'one-bounded-primitive-set-one-dyadic-slab-all-unordered-pairs' as const,
      arithmetic:
        'exact-projective-and-component-rational-bigint-with-safe-integer-counts' as const,
      motionFamily,
      supportedMotionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
      motionFamilySupported: motionFamily === AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
      slab,
      primitiveOrder: 'stable-id-ascii-code-unit' as const,
      pairOrder: 'first-id-then-second-id-ascii-code-unit' as const,
      primitiveIds: primitives.map((entry) => entry.id),
      primitiveCount: primitives.length,
      unorderedPairCount: expectedPairs,
      separatedPairCount,
      candidatePairCount,
      indeterminatePairCount,
      pairs,
      completePairEnumeration: true as const,
      completePairEnumerationScope: 'accepted-bounded-input-only' as const,
      allUnorderedPairsIncluded: true as const,
      silentPairExclusionIncluded: false as const,
      indeterminatePromotionIncluded: false as const,
      broadPhaseOnly: true as const,
      pairClassifierIncluded: true as const,
      continuousCollisionDetectionIncluded: false as const,
      collisionFreeClaim: false as const,
      legalContactClassificationIncluded: false as const,
      penetrationClassificationIncluded: false as const,
      selfIntersectionClassificationIncluded: false as const,
      verified: false as const,
      verifiedClaim: false as const,
      scientificClaim: false as const,
      globalM0fGo: false as const,
      isSupportProfile: false as const,
      supportClaim: false as const,
    },
  });
}
