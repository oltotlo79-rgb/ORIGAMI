import {
  addExactRational,
  compareExactRational,
  exactRational,
  signExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  canonicalProjectivePoint3,
  projectiveAxisDropOrient2DSign,
  type ProjectiveAxis3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';

/**
 * The one motion family enclosed by this candidate broad phase.
 *
 * For local point r, x(t) = q(t) + R(t)r, where q is affine between q0
 * and q1 and R(t) may be any member of SO(3). No sampled rotation is used.
 */
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1 =
  'affine-origin-with-arbitrary-so3-rotation-enclosure-v1' as const;

/**
 * Defensive limits for one in-memory experiment call. These are not a browser
 * SupportProfile and make no runtime, CCD, collision-freedom, or GO claim.
 */
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS = Object.freeze({
  maxCoordinateDecimalDigits: 4_096,
  maxCoordinateBits: 16_384,
  maxTimeNumeratorDecimalDigits: 1_024,
  maxTimeNumeratorBits: 4_096,
  maxTimeExponent: 4_096,
  maxStableIdLength: 128,
  maxMotionFamilyLength: 128,
  maxDiagnosticPathSegmentLength: 128,
  maxArithmeticBits: 131_072,
  maxIssues: 32,
  maxOwnPropertiesPerContainer: 16,
} as const);

export type CanonicalDyadicTimeV1 = Readonly<{
  numerator: bigint;
  exponent: number;
}>;

export type CanonicalDyadicTimeSlabV1 = Readonly<{
  t0: CanonicalDyadicTimeV1;
  t1: CanonicalDyadicTimeV1;
}>;

export type AffineOriginRotationTrianglePrimitiveV1 = Readonly<{
  id: string;
  localVertices: readonly [ProjectivePoint3, ProjectivePoint3, ProjectivePoint3];
  q0: ProjectivePoint3;
  q1: ProjectivePoint3;
}>;

export type AffineOriginRotationSweptAabbInputV1 = Readonly<{
  motionFamily: string;
  slab: CanonicalDyadicTimeSlabV1;
  primitives: readonly [
    AffineOriginRotationTrianglePrimitiveV1,
    AffineOriginRotationTrianglePrimitiveV1,
  ];
}>;

export type AffineOriginRotationSweptAabbIssueCode =
  | 'expected-object'
  | 'expected-primitive-pair'
  | 'expected-triangle'
  | 'unknown-property'
  | 'missing-property'
  | 'accessor-property'
  | 'invalid-property'
  | 'property-limit-exceeded'
  | 'expected-string'
  | 'string-limit-exceeded'
  | 'invalid-stable-id'
  | 'invalid-motion-family-token'
  | 'expected-bigint'
  | 'expected-number'
  | 'coordinate-digit-limit-exceeded'
  | 'coordinate-bit-limit-exceeded'
  | 'time-digit-limit-exceeded'
  | 'time-bit-limit-exceeded'
  | 'time-exponent-limit-exceeded'
  | 'nonpositive-weight'
  | 'noncanonical-point'
  | 'noncanonical-dyadic'
  | 'invalid-time-slab'
  | 'duplicate-primitive-id'
  | 'degenerate-triangle'
  | 'inspection-failed';

export type AffineOriginRotationSweptAabbIssue = Readonly<{
  path: string;
  code: AffineOriginRotationSweptAabbIssueCode;
  message: string;
}>;

export type AffineOriginRotationSweptAabbInputParseResultV1 =
  | Readonly<{ ok: true; value: AffineOriginRotationSweptAabbInputV1 }>
  | Readonly<{ ok: false; error: readonly AffineOriginRotationSweptAabbIssue[] }>;

export type ExactRationalIntervalV1 = Readonly<{
  min: ExactRational;
  max: ExactRational;
}>;

export type ExactRationalAabb3V1 = Readonly<{
  x: ExactRationalIntervalV1;
  y: ExactRationalIntervalV1;
  z: ExactRationalIntervalV1;
}>;

export type AffineOriginRotationPrimitiveBoundV1 = Readonly<{
  primitiveId: string;
  aabb: ExactRationalAabb3V1;
}>;

type NoClaimFieldsV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-affine-origin-rotation-swept-aabb';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-pair-one-dyadic-slab-loose-broad-phase';
  arithmetic: 'exact-projective-and-component-rational-bigint';
  broadPhaseOnly: true;
  boundaryEqualityRetainedAsCandidate: true;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  verified: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
  supportedMotionFamily: typeof AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1;
  suppliedMotionFamily: string;
  primitiveIds: readonly [string, string];
  slab: CanonicalDyadicTimeSlabV1;
}>;

export type AffineOriginRotationSweptAabbSeparatedRecordV1 = NoClaimFieldsV1 &
  Readonly<{
    status: 'separated-by-certified-swept-aabb';
    motionFamilySupported: true;
    arbitrarySo3RotationEnclosed: true;
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

export type AffineOriginRotationSweptAabbOverlapRecordV1 = NoClaimFieldsV1 &
  Readonly<{
    status: 'swept-aabb-overlap-candidate';
    motionFamilySupported: true;
    arbitrarySo3RotationEnclosed: true;
    pairSlabSeparationCertified: false;
    primitiveBounds: readonly [
      AffineOriginRotationPrimitiveBoundV1,
      AffineOriginRotationPrimitiveBoundV1,
    ];
  }>;

export type AffineOriginRotationSweptAabbIndeterminateReason =
  'unsupported-motion-family' | 'arithmetic-budget-exhausted' | 'bound-construction-failed';

export type AffineOriginRotationSweptAabbIndeterminateRecordV1 = NoClaimFieldsV1 &
  Readonly<{
    status: 'indeterminate';
    reason: AffineOriginRotationSweptAabbIndeterminateReason;
    motionFamilySupported: boolean;
    arbitrarySo3RotationEnclosed: false;
    pairSlabSeparationCertified: false;
  }>;

export type AffineOriginRotationSweptAabbRecordV1 =
  | AffineOriginRotationSweptAabbSeparatedRecordV1
  | AffineOriginRotationSweptAabbOverlapRecordV1
  | AffineOriginRotationSweptAabbIndeterminateRecordV1;

export type AffineOriginRotationSweptAabbResultV1 =
  | Readonly<{ ok: true; value: AffineOriginRotationSweptAabbRecordV1 }>
  | Readonly<{ ok: false; error: readonly AffineOriginRotationSweptAabbIssue[] }>;

type InspectedObject = Readonly<{
  descriptors: ReadonlyMap<PropertyKey, PropertyDescriptor>;
}>;

const ROOT_KEYS = ['motionFamily', 'slab', 'primitives'] as const;
const SLAB_KEYS = ['t0', 't1'] as const;
const DYADIC_KEYS = ['numerator', 'exponent'] as const;
const PRIMITIVE_KEYS = ['id', 'localVertices', 'q0', 'q1'] as const;
const POINT_KEYS = ['x', 'y', 'z', 'w'] as const;
const AXES = ['x', 'y', 'z'] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const MOTION_FAMILY_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;
const MAX_COORDINATE_MAGNITUDE_DECIMAL_EXCLUSIVE =
  10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateDecimalDigits);
const MAX_COORDINATE_MAGNITUDE_BINARY_EXCLUSIVE =
  1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateBits);
const MAX_TIME_MAGNITUDE_DECIMAL_EXCLUSIVE =
  10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorDecimalDigits);
const MAX_TIME_MAGNITUDE_BINARY_EXCLUSIVE =
  1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorBits);
const MAX_ARITHMETIC_MAGNITUDE_EXCLUSIVE =
  1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxArithmeticBits);

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function issue(
  path: string,
  code: AffineOriginRotationSweptAabbIssueCode,
  message: string,
): AffineOriginRotationSweptAabbIssue {
  return Object.freeze({ path, code, message });
}

function addIssue(
  issues: AffineOriginRotationSweptAabbIssue[],
  path: string,
  code: AffineOriginRotationSweptAabbIssueCode,
  message: string,
): void {
  if (issues.length >= AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxIssues) return;
  issues.push(issue(path, code, message));
}

function failure(
  issues: readonly AffineOriginRotationSweptAabbIssue[],
): Extract<AffineOriginRotationSweptAabbInputParseResultV1, { ok: false }> {
  return Object.freeze({ ok: false as const, error: Object.freeze([...issues]) });
}

function compareText(left: string, right: string): -1 | 0 | 1 {
  return left < right ? -1 : left > right ? 1 : 0;
}

function diagnosticPropertyKey(key: PropertyKey): string {
  const limit = AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxDiagnosticPathSegmentLength;
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
  return compareText(leftText, rightText);
}

function inspectPlainObject(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  issues: AffineOriginRotationSweptAabbIssue[],
): InspectedObject | undefined {
  if (typeof value !== 'object' || value === null) {
    addIssue(issues, path, 'expected-object', 'must be one plain data object');
    return undefined;
  }
  try {
    if (Array.isArray(value)) {
      addIssue(issues, path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const prototype: unknown = Reflect.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      addIssue(issues, path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        `container exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxOwnPropertiesPerContainer} own properties`,
      );
      return undefined;
    }
    const descriptors = new Map<PropertyKey, PropertyDescriptor>();
    const expected = new Set(expectedKeys);
    for (const key of [...keys].sort(comparePropertyKeys)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined) throw new TypeError('property disappeared during inspection');
      descriptors.set(key, descriptor);
      if (typeof key !== 'string' || !expected.has(key)) {
        addIssue(
          issues,
          `${path}.${diagnosticPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the closed input contract',
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
    return Object.freeze({ descriptors });
  } catch {
    addIssue(issues, path, 'inspection-failed', 'input properties could not be inspected safely');
    return undefined;
  }
}

function descriptorValue(inspected: InspectedObject, key: string): unknown {
  const descriptor = inspected.descriptors.get(key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function inspectDenseArray(
  supplied: unknown,
  path: string,
  length: number,
  expectedCode: 'expected-primitive-pair' | 'expected-triangle',
  issues: AffineOriginRotationSweptAabbIssue[],
): readonly unknown[] | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, path, expectedCode, `must be a dense ${length}-element array`);
    return undefined;
  }
  try {
    if (!Array.isArray(supplied) || Reflect.getPrototypeOf(supplied) !== Array.prototype) {
      addIssue(issues, path, expectedCode, 'must be a plain array');
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    if (keys.length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        `container exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxOwnPropertiesPerContainer} own properties`,
      );
      return undefined;
    }
    const expectedKeys = new Set([
      ...Array.from({ length }, (_, index) => String(index)),
      'length',
    ]);
    const descriptors = new Map<PropertyKey, PropertyDescriptor>();
    for (const key of [...keys].sort(comparePropertyKeys)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
      if (descriptor === undefined) throw new TypeError('array property disappeared');
      descriptors.set(key, descriptor);
      if (typeof key !== 'string' || !expectedKeys.has(key)) {
        addIssue(
          issues,
          `${path}.${diagnosticPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the closed array contract',
        );
      }
    }
    const lengthDescriptor = descriptors.get('length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      lengthDescriptor.value !== length
    ) {
      addIssue(issues, path, expectedCode, `must contain exactly ${length} elements`);
    }
    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors.get(String(index));
      if (descriptor === undefined) {
        addIssue(issues, `${path}[${index}]`, 'missing-property', 'array element is missing');
        values.push(undefined);
      } else if (!('value' in descriptor)) {
        addIssue(
          issues,
          `${path}[${index}]`,
          'accessor-property',
          'accessor elements are not input data',
        );
        values.push(undefined);
      } else if (!descriptor.enumerable) {
        addIssue(
          issues,
          `${path}[${index}]`,
          'invalid-property',
          'array elements must be enumerable',
        );
        values.push(undefined);
      } else {
        values.push(descriptor.value);
      }
    }
    return Object.freeze(values);
  } catch {
    addIssue(issues, path, 'inspection-failed', 'array properties could not be inspected safely');
    return undefined;
  }
}

function coordinateWithinLimits(
  value: bigint,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): boolean {
  const magnitude = absolute(value);
  let valid = true;
  if (magnitude >= MAX_COORDINATE_MAGNITUDE_DECIMAL_EXCLUSIVE) {
    addIssue(
      issues,
      path,
      'coordinate-digit-limit-exceeded',
      `coordinate exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateDecimalDigits} decimal digits`,
    );
    valid = false;
  }
  if (magnitude >= MAX_COORDINATE_MAGNITUDE_BINARY_EXCLUSIVE) {
    addIssue(
      issues,
      path,
      'coordinate-bit-limit-exceeded',
      `coordinate exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateBits} bits`,
    );
    valid = false;
  }
  return valid;
}

function parsePoint(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): ProjectivePoint3 | undefined {
  const inspected = inspectPlainObject(supplied, path, POINT_KEYS, issues);
  if (inspected === undefined) return undefined;
  const coordinates: Partial<Record<(typeof POINT_KEYS)[number], bigint>> = {};
  for (const coordinate of POINT_KEYS) {
    const value = descriptorValue(inspected, coordinate);
    if (typeof value !== 'bigint') {
      addIssue(issues, `${path}.${coordinate}`, 'expected-bigint', 'coordinate must be a BigInt');
    } else if (coordinateWithinLimits(value, `${path}.${coordinate}`, issues)) {
      coordinates[coordinate] = value;
    }
  }
  const { x, y, z, w } = coordinates;
  if (x === undefined || y === undefined || z === undefined || w === undefined) return undefined;
  if (w <= 0n) {
    addIssue(issues, `${path}.w`, 'nonpositive-weight', 'canonical finite points require w > 0');
    return undefined;
  }
  const canonical = canonicalProjectivePoint3(x, y, z, w);
  if (canonical.x !== x || canonical.y !== y || canonical.z !== z || canonical.w !== w) {
    addIssue(
      issues,
      path,
      'noncanonical-point',
      'point must use its unique positive-weight homogeneous representation',
    );
    return undefined;
  }
  return canonical;
}

function parseStableId(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): string | undefined {
  if (typeof supplied !== 'string') {
    addIssue(issues, path, 'expected-string', 'stable ID must be a string');
    return undefined;
  }
  if (supplied.length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxStableIdLength) {
    addIssue(
      issues,
      path,
      'string-limit-exceeded',
      `stable ID exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxStableIdLength} code units`,
    );
    return undefined;
  }
  if (!STABLE_ID_PATTERN.test(supplied)) {
    addIssue(
      issues,
      path,
      'invalid-stable-id',
      'stable ID must use nonempty ASCII letters, digits, dot, underscore, colon, or hyphen',
    );
    return undefined;
  }
  return supplied;
}

function parseMotionFamily(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): string | undefined {
  if (typeof supplied !== 'string') {
    addIssue(issues, path, 'expected-string', 'motion family must be a string');
    return undefined;
  }
  if (supplied.length > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxMotionFamilyLength) {
    addIssue(
      issues,
      path,
      'string-limit-exceeded',
      `motion family exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxMotionFamilyLength} code units`,
    );
    return undefined;
  }
  if (!MOTION_FAMILY_PATTERN.test(supplied)) {
    addIssue(
      issues,
      path,
      'invalid-motion-family-token',
      'motion family must be one nonempty lowercase ASCII token',
    );
    return undefined;
  }
  return supplied;
}

function timeNumeratorWithinLimits(
  value: bigint,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): boolean {
  const magnitude = absolute(value);
  let valid = true;
  if (magnitude >= MAX_TIME_MAGNITUDE_DECIMAL_EXCLUSIVE) {
    addIssue(
      issues,
      path,
      'time-digit-limit-exceeded',
      `time numerator exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorDecimalDigits} decimal digits`,
    );
    valid = false;
  }
  if (magnitude >= MAX_TIME_MAGNITUDE_BINARY_EXCLUSIVE) {
    addIssue(
      issues,
      path,
      'time-bit-limit-exceeded',
      `time numerator exceeds ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorBits} bits`,
    );
    valid = false;
  }
  return valid;
}

function parseDyadicTime(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): CanonicalDyadicTimeV1 | undefined {
  const inspected = inspectPlainObject(supplied, path, DYADIC_KEYS, issues);
  if (inspected === undefined) return undefined;
  const suppliedNumerator = descriptorValue(inspected, 'numerator');
  const suppliedExponent = descriptorValue(inspected, 'exponent');
  let numerator: bigint | undefined;
  let exponent: number | undefined;
  if (typeof suppliedNumerator !== 'bigint') {
    addIssue(issues, `${path}.numerator`, 'expected-bigint', 'dyadic numerator must be a BigInt');
  } else if (timeNumeratorWithinLimits(suppliedNumerator, `${path}.numerator`, issues)) {
    numerator = suppliedNumerator;
  }
  if (typeof suppliedExponent !== 'number') {
    addIssue(issues, `${path}.exponent`, 'expected-number', 'dyadic exponent must be a number');
  } else if (
    !Number.isSafeInteger(suppliedExponent) ||
    suppliedExponent < 0 ||
    suppliedExponent > AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeExponent
  ) {
    addIssue(
      issues,
      `${path}.exponent`,
      'time-exponent-limit-exceeded',
      `dyadic exponent must be an integer from 0 through ${AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeExponent}`,
    );
  } else {
    exponent = suppliedExponent;
  }
  if (numerator === undefined || exponent === undefined) return undefined;
  if ((numerator === 0n && exponent !== 0) || (exponent > 0 && numerator % 2n === 0n)) {
    addIssue(
      issues,
      path,
      'noncanonical-dyadic',
      'zero uses exponent 0 and a positive exponent requires an odd numerator',
    );
    return undefined;
  }
  return Object.freeze({ numerator, exponent });
}

function compareDyadicTime(left: CanonicalDyadicTimeV1, right: CanonicalDyadicTimeV1): -1 | 0 | 1 {
  const commonExponent = left.exponent > right.exponent ? left.exponent : right.exponent;
  const leftInteger = left.numerator << BigInt(commonExponent - left.exponent);
  const rightInteger = right.numerator << BigInt(commonExponent - right.exponent);
  return leftInteger < rightInteger ? -1 : leftInteger > rightInteger ? 1 : 0;
}

function parseSlab(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): CanonicalDyadicTimeSlabV1 | undefined {
  const inspected = inspectPlainObject(supplied, path, SLAB_KEYS, issues);
  if (inspected === undefined) return undefined;
  const t0 = parseDyadicTime(descriptorValue(inspected, 't0'), `${path}.t0`, issues);
  const t1 = parseDyadicTime(descriptorValue(inspected, 't1'), `${path}.t1`, issues);
  if (t0 === undefined || t1 === undefined) return undefined;
  if (compareDyadicTime(t0, t1) >= 0) {
    addIssue(issues, path, 'invalid-time-slab', 'dyadic slab requires exact t0 < t1');
    return undefined;
  }
  return Object.freeze({ t0, t1 });
}

function parseTriangle(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): readonly [ProjectivePoint3, ProjectivePoint3, ProjectivePoint3] | undefined {
  const values = inspectDenseArray(supplied, path, 3, 'expected-triangle', issues);
  if (values === undefined) return undefined;
  const first = parsePoint(values[0], `${path}[0]`, issues);
  const second = parsePoint(values[1], `${path}[1]`, issues);
  const third = parsePoint(values[2], `${path}[2]`, issues);
  if (first === undefined || second === undefined || third === undefined) return undefined;
  const triangle = Object.freeze([first, second, third] as const);
  if (AXES.every((axis) => projectiveAxisDropOrient2DSign(first, second, third, axis) === 0)) {
    addIssue(
      issues,
      path,
      'degenerate-triangle',
      'local vertices must span a nonzero-area affine triangle',
    );
    return undefined;
  }
  return triangle;
}

function parsePrimitive(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
): AffineOriginRotationTrianglePrimitiveV1 | undefined {
  const inspected = inspectPlainObject(supplied, path, PRIMITIVE_KEYS, issues);
  if (inspected === undefined) return undefined;
  const id = parseStableId(descriptorValue(inspected, 'id'), `${path}.id`, issues);
  const localVertices = parseTriangle(
    descriptorValue(inspected, 'localVertices'),
    `${path}.localVertices`,
    issues,
  );
  const q0 = parsePoint(descriptorValue(inspected, 'q0'), `${path}.q0`, issues);
  const q1 = parsePoint(descriptorValue(inspected, 'q1'), `${path}.q1`, issues);
  if (id === undefined || localVertices === undefined || q0 === undefined || q1 === undefined) {
    return undefined;
  }
  return Object.freeze({ id, localVertices, q0, q1 });
}

function parsePrimitivePair(
  supplied: unknown,
  path: string,
  issues: AffineOriginRotationSweptAabbIssue[],
):
  | readonly [AffineOriginRotationTrianglePrimitiveV1, AffineOriginRotationTrianglePrimitiveV1]
  | undefined {
  const values = inspectDenseArray(supplied, path, 2, 'expected-primitive-pair', issues);
  if (values === undefined) return undefined;
  const first = parsePrimitive(values[0], `${path}[0]`, issues);
  const second = parsePrimitive(values[1], `${path}[1]`, issues);
  if (first === undefined || second === undefined) return undefined;
  if (first.id === second.id) {
    addIssue(
      issues,
      `${path}[1].id`,
      'duplicate-primitive-id',
      'the two primitive IDs must be distinct',
    );
    return undefined;
  }
  return compareText(first.id, second.id) < 0
    ? Object.freeze([first, second] as const)
    : Object.freeze([second, first] as const);
}

/**
 * Closed, bounded, accessor-free parser. Success canonicalizes pair order by
 * stable ASCII ID. Invalid input returns bounded issues and no partial value.
 */
export function parseAffineOriginRotationSweptAabbInputV1(
  supplied: unknown,
): AffineOriginRotationSweptAabbInputParseResultV1 {
  const issues: AffineOriginRotationSweptAabbIssue[] = [];
  const root = inspectPlainObject(supplied, '$', ROOT_KEYS, issues);
  if (root === undefined) return failure(issues);
  const motionFamily = parseMotionFamily(
    descriptorValue(root, 'motionFamily'),
    '$.motionFamily',
    issues,
  );
  const slab = parseSlab(descriptorValue(root, 'slab'), '$.slab', issues);
  const primitives = parsePrimitivePair(
    descriptorValue(root, 'primitives'),
    '$.primitives',
    issues,
  );
  if (
    issues.length > 0 ||
    motionFamily === undefined ||
    slab === undefined ||
    primitives === undefined
  ) {
    return failure(issues);
  }
  return Object.freeze({
    ok: true as const,
    value: Object.freeze({ motionFamily, slab, primitives }),
  });
}

function rationalWithinArithmeticBudget(value: ExactRational): boolean {
  return (
    absolute(value.numerator) < MAX_ARITHMETIC_MAGNITUDE_EXCLUSIVE &&
    value.denominator < MAX_ARITHMETIC_MAGNITUDE_EXCLUSIVE
  );
}

function localRadius(vertex: ProjectivePoint3): ExactRational {
  return exactRational(absolute(vertex.x) + absolute(vertex.y) + absolute(vertex.z), vertex.w);
}

function pointCoordinate(point: ProjectivePoint3, axis: ProjectiveAxis3): ExactRational {
  return exactRational(point[axis], point.w);
}

function interval(min: ExactRational, max: ExactRational): ExactRationalIntervalV1 {
  return Object.freeze({ min, max });
}

type BoundBuildResult =
  | Readonly<{ ok: true; value: ExactRationalAabb3V1 }>
  | Readonly<{ ok: false; reason: 'arithmetic-budget-exhausted' | 'bound-construction-failed' }>;

function buildPrimitiveBound(primitive: AffineOriginRotationTrianglePrimitiveV1): BoundBuildResult {
  try {
    const radii = primitive.localVertices.map(localRadius);
    if (radii.some((radius) => !rationalWithinArithmeticBudget(radius))) {
      return Object.freeze({ ok: false as const, reason: 'arithmetic-budget-exhausted' as const });
    }
    const result: Partial<Record<ProjectiveAxis3, ExactRationalIntervalV1>> = {};
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
        if (
          !rationalWithinArithmeticBudget(candidateMin) ||
          !rationalWithinArithmeticBudget(candidateMax)
        ) {
          return Object.freeze({
            ok: false as const,
            reason: 'arithmetic-budget-exhausted' as const,
          });
        }
        if (minimum === undefined || compareExactRational(candidateMin, minimum) < 0) {
          minimum = candidateMin;
        }
        if (maximum === undefined || compareExactRational(candidateMax, maximum) > 0) {
          maximum = candidateMax;
        }
      }
      if (minimum === undefined || maximum === undefined) {
        return Object.freeze({ ok: false as const, reason: 'bound-construction-failed' as const });
      }
      result[axis] = interval(minimum, maximum);
    }
    const { x, y, z } = result;
    if (x === undefined || y === undefined || z === undefined) {
      return Object.freeze({ ok: false as const, reason: 'bound-construction-failed' as const });
    }
    return Object.freeze({ ok: true as const, value: Object.freeze({ x, y, z }) });
  } catch {
    return Object.freeze({ ok: false as const, reason: 'bound-construction-failed' as const });
  }
}

function commonFields(input: AffineOriginRotationSweptAabbInputV1): NoClaimFieldsV1 {
  return Object.freeze({
    schemaVersion: 1 as const,
    recordType: 'm0f-affine-origin-rotation-swept-aabb' as const,
    contractStatus: 'candidate-no-claim' as const,
    predicateScope: 'one-pair-one-dyadic-slab-loose-broad-phase' as const,
    arithmetic: 'exact-projective-and-component-rational-bigint' as const,
    broadPhaseOnly: true as const,
    boundaryEqualityRetainedAsCandidate: true as const,
    continuousCollisionDetectionIncluded: false as const,
    collisionFreeClaim: false as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    selfIntersectionClassificationIncluded: false as const,
    verified: false as const,
    verifiedClaim: false as const,
    scientificClaim: false as const,
    globalM0fGo: false as const,
    supportedMotionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
    suppliedMotionFamily: input.motionFamily,
    primitiveIds: Object.freeze([input.primitives[0].id, input.primitives[1].id] as const),
    slab: input.slab,
  });
}

function indeterminateRecord(
  input: AffineOriginRotationSweptAabbInputV1,
  reason: AffineOriginRotationSweptAabbIndeterminateReason,
  motionFamilySupported: boolean,
): AffineOriginRotationSweptAabbIndeterminateRecordV1 {
  return Object.freeze({
    ...commonFields(input),
    status: 'indeterminate' as const,
    reason,
    motionFamilySupported,
    arbitrarySo3RotationEnclosed: false as const,
    pairSlabSeparationCertified: false as const,
  });
}

type SeparationCertificate = AffineOriginRotationSweptAabbSeparatedRecordV1['certificate'];

type SeparationSearchResult =
  | Readonly<{ kind: 'none' }>
  | Readonly<{ kind: 'separated'; certificate: SeparationCertificate }>
  | Readonly<{
      kind: 'indeterminate';
      reason: 'arithmetic-budget-exhausted' | 'bound-construction-failed';
    }>;

function separationCertificate(
  first: ExactRationalAabb3V1,
  second: ExactRationalAabb3V1,
  primitiveIds: readonly [string, string],
): SeparationSearchResult {
  for (const axis of AXES) {
    if (compareExactRational(first[axis].max, second[axis].min) < 0) {
      const strictGap = subtractExactRational(second[axis].min, first[axis].max);
      if (!rationalWithinArithmeticBudget(strictGap)) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'arithmetic-budget-exhausted' as const,
        });
      }
      if (signExactRational(strictGap) !== 1) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'bound-construction-failed' as const,
        });
      }
      return Object.freeze({
        kind: 'separated' as const,
        certificate: Object.freeze({
          axis,
          order: 'a-before-b' as const,
          beforePrimitiveId: primitiveIds[0],
          afterPrimitiveId: primitiveIds[1],
          strictGap,
        }),
      });
    }
    if (compareExactRational(second[axis].max, first[axis].min) < 0) {
      const strictGap = subtractExactRational(first[axis].min, second[axis].max);
      if (!rationalWithinArithmeticBudget(strictGap)) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'arithmetic-budget-exhausted' as const,
        });
      }
      if (signExactRational(strictGap) !== 1) {
        return Object.freeze({
          kind: 'indeterminate' as const,
          reason: 'bound-construction-failed' as const,
        });
      }
      return Object.freeze({
        kind: 'separated' as const,
        certificate: Object.freeze({
          axis,
          order: 'b-before-a' as const,
          beforePrimitiveId: primitiveIds[1],
          afterPrimitiveId: primitiveIds[0],
          strictGap,
        }),
      });
    }
  }
  return Object.freeze({ kind: 'none' as const });
}

/**
 * Builds a loose exact swept AABB for arbitrary SO(3) rotation and classifies
 * only strict AABB separation. This is broad-phase culling, not nonlinear CCD.
 * Boundary equality and all overlapping boxes remain candidates.
 */
export function classifyAffineOriginRotationSweptAabbV1(
  supplied: unknown,
): AffineOriginRotationSweptAabbResultV1 {
  const parsed = parseAffineOriginRotationSweptAabbInputV1(supplied);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  if (input.motionFamily !== AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1) {
    return Object.freeze({
      ok: true as const,
      value: indeterminateRecord(input, 'unsupported-motion-family', false),
    });
  }
  const firstBuilt = buildPrimitiveBound(input.primitives[0]);
  const secondBuilt = buildPrimitiveBound(input.primitives[1]);
  if (!firstBuilt.ok || !secondBuilt.ok) {
    const reason =
      (!firstBuilt.ok && firstBuilt.reason === 'arithmetic-budget-exhausted') ||
      (!secondBuilt.ok && secondBuilt.reason === 'arithmetic-budget-exhausted')
        ? 'arithmetic-budget-exhausted'
        : 'bound-construction-failed';
    return Object.freeze({
      ok: true as const,
      value: indeterminateRecord(input, reason, true),
    });
  }
  const primitiveBounds = Object.freeze([
    Object.freeze({ primitiveId: input.primitives[0].id, aabb: firstBuilt.value }),
    Object.freeze({ primitiveId: input.primitives[1].id, aabb: secondBuilt.value }),
  ] as const);
  const common = commonFields(input);
  const separation = separationCertificate(
    firstBuilt.value,
    secondBuilt.value,
    common.primitiveIds,
  );
  if (separation.kind === 'indeterminate') {
    return Object.freeze({
      ok: true as const,
      value: indeterminateRecord(input, separation.reason, true),
    });
  }
  if (separation.kind === 'separated') {
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        ...common,
        status: 'separated-by-certified-swept-aabb' as const,
        motionFamilySupported: true as const,
        arbitrarySo3RotationEnclosed: true as const,
        pairSlabSeparationCertified: true as const,
        primitiveBounds,
        certificate: separation.certificate,
      }),
    });
  }
  return Object.freeze({
    ok: true as const,
    value: Object.freeze({
      ...common,
      status: 'swept-aabb-overlap-candidate' as const,
      motionFamilySupported: true as const,
      arbitrarySo3RotationEnclosed: true as const,
      pairSlabSeparationCertified: false as const,
      primitiveBounds,
    }),
  });
}
