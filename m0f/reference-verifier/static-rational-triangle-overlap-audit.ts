/**
 * Independent candidate audit for one static pair of closed rational triangles.
 *
 * This module deliberately has no imports. It replays the geometric decision as
 * an exact barycentric linear-feasibility problem and owns its input parser,
 * arithmetic, coplanarity test, and result contract. Consistency is still only
 * candidate evidence: this module does not decide legal contact or penetration,
 * follow motion, implement CCD, verify collision freedom, or imply GO.
 */

export const STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE =
  'm0f-static-rational-triangle-overlap-audit-input' as const;
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_RESULT_RECORD_TYPE =
  'm0f-static-rational-triangle-overlap-audit-result' as const;

/** Public defensive ceilings for the unknown-data boundary. */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS = Object.freeze({
  maxCoordinateBits: 16_384,
  maxCoordinateDecimalDigits: 4_933,
  maxIssues: 64,
  maxOwnPropertiesPerContainer: 24,
  maxMetadataStringLength: 128,
} as const);

export type StaticRationalTriangleOverlapAuditCoordinateEncoding = 'bigint' | 'canonical-decimal';

export type StaticRationalTriangleOverlapAuditClassification =
  'disjoint' | 'intersecting-coplanar' | 'intersecting-noncoplanar';

export type StaticRationalTriangleOverlapAuditCoordinateSnapshot = bigint | string;

export type StaticRationalTriangleOverlapAuditPointSnapshotV1 = Readonly<{
  x: StaticRationalTriangleOverlapAuditCoordinateSnapshot;
  y: StaticRationalTriangleOverlapAuditCoordinateSnapshot;
  z: StaticRationalTriangleOverlapAuditCoordinateSnapshot;
  w: StaticRationalTriangleOverlapAuditCoordinateSnapshot;
}>;

export type StaticRationalTriangleOverlapAuditTriangleSnapshotV1 = readonly [
  first: StaticRationalTriangleOverlapAuditPointSnapshotV1,
  second: StaticRationalTriangleOverlapAuditPointSnapshotV1,
  third: StaticRationalTriangleOverlapAuditPointSnapshotV1,
];

export type StaticRationalTriangleOverlapProducerSnapshotV1 = Readonly<{
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  predicateScope: string;
  arithmetic: string;
  classification: StaticRationalTriangleOverlapAuditClassification;
  closedTrianglesIntersect: boolean;
  boundaryContactCountsAsIntersection: boolean;
  staticPredicateIncluded: boolean;
  legalContactClassificationIncluded: boolean;
  penetrationClassificationIncluded: boolean;
  collisionFreeClaim: boolean;
  continuousTimeIncluded: boolean;
  continuousCollisionDetectionIncluded: boolean;
  rigidMotionIntervalIncluded: boolean;
  verifiedClaim: boolean;
  globalM0fGo: boolean;
}>;

/** Portable caller snapshot. Coordinate primitive types are fixed by `coordinateEncoding`. */
export type StaticRationalTriangleOverlapAuditInputSnapshotV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE;
  coordinateEncoding: StaticRationalTriangleOverlapAuditCoordinateEncoding;
  triangleA: StaticRationalTriangleOverlapAuditTriangleSnapshotV1;
  triangleB: StaticRationalTriangleOverlapAuditTriangleSnapshotV1;
  producer: StaticRationalTriangleOverlapProducerSnapshotV1;
}>;

export type StaticRationalTriangleOverlapAuditPoint3 = Readonly<{
  x: bigint;
  y: bigint;
  z: bigint;
  w: bigint;
}>;

export type StaticRationalTriangleOverlapAuditTriangle3 = readonly [
  first: StaticRationalTriangleOverlapAuditPoint3,
  second: StaticRationalTriangleOverlapAuditPoint3,
  third: StaticRationalTriangleOverlapAuditPoint3,
];

/**
 * Trusted in-memory form returned by the unknown-data parser. Callers must not
 * construct or cast this value themselves when using the trusted audit API.
 */
export type TrustedStaticRationalTriangleOverlapAuditInputV1 = Readonly<{
  triangleA: StaticRationalTriangleOverlapAuditTriangle3;
  triangleB: StaticRationalTriangleOverlapAuditTriangle3;
  producer: StaticRationalTriangleOverlapProducerSnapshotV1;
}>;

export type StaticRationalTriangleOverlapAuditIssueStage =
  'input-contract' | 'producer-consistency' | 'audit-internal';

export type StaticRationalTriangleOverlapAuditIssueCode =
  | 'expected-object'
  | 'expected-triangle'
  | 'unknown-property'
  | 'missing-property'
  | 'accessor-property'
  | 'invalid-property'
  | 'property-limit-exceeded'
  | 'expected-literal'
  | 'expected-string'
  | 'string-limit-exceeded'
  | 'expected-boolean'
  | 'expected-safe-integer'
  | 'expected-bigint'
  | 'expected-canonical-decimal'
  | 'decimal-digit-limit-exceeded'
  | 'coordinate-limit-exceeded'
  | 'nonpositive-weight'
  | 'noncanonical-point'
  | 'degenerate-triangle'
  | 'inspection-failed'
  | 'producer-field-mismatch'
  | 'classification-mismatch'
  | 'closed-intersection-mismatch'
  | 'unexpected-audit-failure';

export type StaticRationalTriangleOverlapAuditIssue = Readonly<{
  stage: StaticRationalTriangleOverlapAuditIssueStage;
  path: string;
  code: StaticRationalTriangleOverlapAuditIssueCode;
  message: string;
}>;

export type ParseStaticRationalTriangleOverlapAuditInputResultV1 =
  | Readonly<{ ok: true; value: TrustedStaticRationalTriangleOverlapAuditInputV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapAuditIssue[] }>;

type StaticRationalTriangleOverlapAuditDecisionBaseV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_RESULT_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  scientificClaim: false;
  auditScope: 'one-static-configuration-of-two-closed-triangles';
  implementationRole: 'independent-auditor';
  verificationIndependence: 'exact-barycentric-replay-without-producer-or-shared-3d-kernel';
  exactBarycentricFeasibilityIncluded: true;
  staticPredicateIncluded: true;
  auditedClassification: StaticRationalTriangleOverlapAuditClassification;
  auditedClosedTrianglesIntersect: boolean;
  producerClassification: StaticRationalTriangleOverlapAuditClassification;
  producerClosedTrianglesIntersect: boolean;
  producerRecordMatched: boolean;
  boundaryContactCountsAsIntersection: true;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  collisionFreeClaim: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  rigidMotionIntervalIncluded: false;
  verifiedClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleOverlapAuditConsistentV1 =
  StaticRationalTriangleOverlapAuditDecisionBaseV1 &
    Readonly<{
      auditOutcome: 'consistent';
      producerRecordMatched: true;
    }>;

export type StaticRationalTriangleOverlapAuditInconsistentV1 =
  StaticRationalTriangleOverlapAuditDecisionBaseV1 &
    Readonly<{
      auditOutcome: 'inconsistent';
      producerRecordMatched: false;
    }>;

export type StaticRationalTriangleOverlapAuditResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleOverlapAuditConsistentV1 }>
  | Readonly<{
      ok: false;
      value: StaticRationalTriangleOverlapAuditInconsistentV1;
      error: readonly StaticRationalTriangleOverlapAuditIssue[];
    }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapAuditIssue[] }>;

type InspectedObject = Readonly<{
  descriptors: ReadonlyMap<PropertyKey, PropertyDescriptor>;
}>;

type IntegerVector3 = readonly [x: bigint, y: bigint, z: bigint];
type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'coordinateEncoding',
  'triangleA',
  'triangleB',
  'producer',
] as const;
const POINT_KEYS = ['x', 'y', 'z', 'w'] as const;
const PRODUCER_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'predicateScope',
  'arithmetic',
  'classification',
  'closedTrianglesIntersect',
  'boundaryContactCountsAsIntersection',
  'staticPredicateIncluded',
  'legalContactClassificationIncluded',
  'penetrationClassificationIncluded',
  'collisionFreeClaim',
  'continuousTimeIncluded',
  'continuousCollisionDetectionIncluded',
  'rigidMotionIntervalIncluded',
  'verifiedClaim',
  'globalM0fGo',
] as const;
const TRIANGLE_INDICES = [0, 1, 2] as const;
const COORDINATES = ['x', 'y', 'z'] as const;
const CANONICAL_INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const MAX_COORDINATE_MAGNITUDE_EXCLUSIVE =
  1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxCoordinateBits);

function required<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new RangeError(`missing trusted ${context}`);
  return value;
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

function commonDivisor4(first: bigint, second: bigint, third: bigint, fourth: bigint): bigint {
  return greatestCommonDivisor(
    greatestCommonDivisor(first, second),
    greatestCommonDivisor(third, fourth),
  );
}

function issue(
  stage: StaticRationalTriangleOverlapAuditIssueStage,
  path: string,
  code: StaticRationalTriangleOverlapAuditIssueCode,
  message: string,
): StaticRationalTriangleOverlapAuditIssue {
  return Object.freeze({ stage, path, code, message });
}

function addIssue(
  issues: StaticRationalTriangleOverlapAuditIssue[],
  stage: StaticRationalTriangleOverlapAuditIssueStage,
  path: string,
  code: StaticRationalTriangleOverlapAuditIssueCode,
  message: string,
): void {
  if (issues.length >= STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxIssues) return;
  issues.push(issue(stage, path, code, message));
}

function freezeIssues(
  issues: readonly StaticRationalTriangleOverlapAuditIssue[],
): readonly StaticRationalTriangleOverlapAuditIssue[] {
  return Object.freeze([...issues]);
}

function contractFailure(
  issues: readonly StaticRationalTriangleOverlapAuditIssue[],
): Extract<StaticRationalTriangleOverlapAuditResultV1, { ok: false }> {
  return Object.freeze({ ok: false as const, error: freezeIssues(issues) });
}

function parseFailure(
  issues: readonly StaticRationalTriangleOverlapAuditIssue[],
): Extract<ParseStaticRationalTriangleOverlapAuditInputResultV1, { ok: false }> {
  return Object.freeze({ ok: false as const, error: freezeIssues(issues) });
}

function displayedPropertyKey(key: PropertyKey): string {
  const text = String(key);
  const maximum = STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxMetadataStringLength;
  return text.length <= maximum ? text : `${text.slice(0, maximum)}…`;
}

function comparePropertyKeys(left: PropertyKey, right: PropertyKey): number {
  const leftText = displayedPropertyKey(left);
  const rightText = displayedPropertyKey(right);
  return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
}

function inspectClosedObject(
  supplied: unknown,
  path: string,
  expectedKeys: readonly string[],
  issues: StaticRationalTriangleOverlapAuditIssue[],
): InspectedObject | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, 'input-contract', path, 'expected-object', 'must be one plain data object');
    return undefined;
  }
  try {
    if (Array.isArray(supplied)) {
      addIssue(issues, 'input-contract', path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const prototype: unknown = Reflect.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      addIssue(issues, 'input-contract', path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    if (keys.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        'input-contract',
        path,
        'property-limit-exceeded',
        `container exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxOwnPropertiesPerContainer} own properties`,
      );
      return undefined;
    }
    const descriptors = new Map<PropertyKey, PropertyDescriptor>();
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
      if (descriptor === undefined) throw new TypeError('property disappeared during inspection');
      descriptors.set(key, descriptor);
    }
    const expected = new Set(expectedKeys);
    for (const key of [...keys].sort(comparePropertyKeys)) {
      if (typeof key !== 'string' || !expected.has(key)) {
        addIssue(
          issues,
          'input-contract',
          `${path}.${displayedPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the closed input contract',
        );
      }
    }
    for (const key of expectedKeys) {
      const descriptor = descriptors.get(key);
      if (descriptor === undefined) {
        addIssue(
          issues,
          'input-contract',
          `${path}.${key}`,
          'missing-property',
          'required property is missing',
        );
      } else if (!('value' in descriptor)) {
        addIssue(
          issues,
          'input-contract',
          `${path}.${key}`,
          'accessor-property',
          'accessor properties are not input data',
        );
      } else if (!descriptor.enumerable) {
        addIssue(
          issues,
          'input-contract',
          `${path}.${key}`,
          'invalid-property',
          'input data properties must be enumerable',
        );
      }
    }
    return Object.freeze({ descriptors });
  } catch {
    addIssue(
      issues,
      'input-contract',
      path,
      'inspection-failed',
      'input properties could not be inspected safely',
    );
    return undefined;
  }
}

function descriptorValue(inspected: InspectedObject, key: string): unknown {
  const descriptor = inspected.descriptors.get(key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function parseLiteral<T extends string | number>(
  value: unknown,
  expected: T,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): T | undefined {
  if (value !== expected) {
    addIssue(
      issues,
      'input-contract',
      path,
      'expected-literal',
      `must equal ${JSON.stringify(expected)}`,
    );
    return undefined;
  }
  return expected;
}

function parseEncoding(
  value: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): StaticRationalTriangleOverlapAuditCoordinateEncoding | undefined {
  if (value !== 'bigint' && value !== 'canonical-decimal') {
    addIssue(
      issues,
      'input-contract',
      path,
      'expected-literal',
      'must equal "bigint" or "canonical-decimal"',
    );
    return undefined;
  }
  return value;
}

function exceedsCoordinateLimit(value: bigint): boolean {
  return (
    value >= MAX_COORDINATE_MAGNITUDE_EXCLUSIVE || value <= -MAX_COORDINATE_MAGNITUDE_EXCLUSIVE
  );
}

function parseCoordinate(
  value: unknown,
  encoding: StaticRationalTriangleOverlapAuditCoordinateEncoding,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): bigint | undefined {
  let parsed: bigint;
  if (encoding === 'bigint') {
    if (typeof value !== 'bigint') {
      addIssue(
        issues,
        'input-contract',
        path,
        'expected-bigint',
        'coordinate must be a BigInt for bigint encoding',
      );
      return undefined;
    }
    parsed = value;
  } else {
    if (typeof value !== 'string') {
      addIssue(
        issues,
        'input-contract',
        path,
        'expected-string',
        'coordinate must be a string for canonical-decimal encoding',
      );
      return undefined;
    }
    const digits = value.startsWith('-') ? value.length - 1 : value.length;
    if (digits > STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxCoordinateDecimalDigits) {
      addIssue(
        issues,
        'input-contract',
        path,
        'decimal-digit-limit-exceeded',
        `coordinate exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxCoordinateDecimalDigits} decimal digits`,
      );
      return undefined;
    }
    if (!CANONICAL_INTEGER_PATTERN.test(value)) {
      addIssue(
        issues,
        'input-contract',
        path,
        'expected-canonical-decimal',
        'coordinate must be a canonical base-10 integer',
      );
      return undefined;
    }
    parsed = BigInt(value);
  }
  if (exceedsCoordinateLimit(parsed)) {
    addIssue(
      issues,
      'input-contract',
      path,
      'coordinate-limit-exceeded',
      `coordinate exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxCoordinateBits} bits`,
    );
    return undefined;
  }
  return parsed;
}

function parsePoint(
  supplied: unknown,
  encoding: StaticRationalTriangleOverlapAuditCoordinateEncoding,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): StaticRationalTriangleOverlapAuditPoint3 | undefined {
  const inspected = inspectClosedObject(supplied, path, POINT_KEYS, issues);
  if (inspected === undefined) return undefined;
  const x = parseCoordinate(descriptorValue(inspected, 'x'), encoding, `${path}.x`, issues);
  const y = parseCoordinate(descriptorValue(inspected, 'y'), encoding, `${path}.y`, issues);
  const z = parseCoordinate(descriptorValue(inspected, 'z'), encoding, `${path}.z`, issues);
  const w = parseCoordinate(descriptorValue(inspected, 'w'), encoding, `${path}.w`, issues);
  if (x === undefined || y === undefined || z === undefined || w === undefined) return undefined;
  if (w <= 0n) {
    addIssue(
      issues,
      'input-contract',
      `${path}.w`,
      'nonpositive-weight',
      'canonical finite points require w > 0',
    );
    return undefined;
  }
  if (commonDivisor4(x, y, z, w) !== 1n) {
    addIssue(
      issues,
      'input-contract',
      path,
      'noncanonical-point',
      'homogeneous coordinates must have greatest common divisor one',
    );
    return undefined;
  }
  return Object.freeze({ x, y, z, w });
}

function parseTriangle(
  supplied: unknown,
  encoding: StaticRationalTriangleOverlapAuditCoordinateEncoding,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): StaticRationalTriangleOverlapAuditTriangle3 | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(
      issues,
      'input-contract',
      path,
      'expected-triangle',
      'triangle must be a dense three-element array',
    );
    return undefined;
  }
  let descriptors: ReadonlyMap<PropertyKey, PropertyDescriptor>;
  try {
    if (!Array.isArray(supplied) || Reflect.getPrototypeOf(supplied) !== Array.prototype) {
      addIssue(
        issues,
        'input-contract',
        path,
        'expected-triangle',
        'triangle must be one plain array',
      );
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    if (keys.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        'input-contract',
        path,
        'property-limit-exceeded',
        `container exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxOwnPropertiesPerContainer} own properties`,
      );
      return undefined;
    }
    const owned = new Map<PropertyKey, PropertyDescriptor>();
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
      if (descriptor === undefined) throw new TypeError('property disappeared during inspection');
      owned.set(key, descriptor);
    }
    descriptors = owned;
    const expected = new Set(['0', '1', '2', 'length']);
    for (const key of [...keys].sort(comparePropertyKeys)) {
      if (typeof key !== 'string' || !expected.has(key)) {
        addIssue(
          issues,
          'input-contract',
          `${path}.${displayedPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the closed triangle contract',
        );
      }
    }
  } catch {
    addIssue(
      issues,
      'input-contract',
      path,
      'inspection-failed',
      'triangle properties could not be inspected safely',
    );
    return undefined;
  }
  const lengthDescriptor = descriptors.get('length');
  if (
    lengthDescriptor === undefined ||
    !('value' in lengthDescriptor) ||
    lengthDescriptor.value !== 3
  ) {
    addIssue(
      issues,
      'input-contract',
      path,
      'expected-triangle',
      'triangle must have exactly three vertices',
    );
  }
  const points: (StaticRationalTriangleOverlapAuditPoint3 | undefined)[] = [];
  for (const index of TRIANGLE_INDICES) {
    const descriptor = descriptors.get(String(index));
    if (descriptor === undefined) {
      addIssue(
        issues,
        'input-contract',
        `${path}[${index}]`,
        'missing-property',
        'triangle vertex is missing',
      );
      points.push(undefined);
    } else if (!('value' in descriptor)) {
      addIssue(
        issues,
        'input-contract',
        `${path}[${index}]`,
        'accessor-property',
        'accessor vertices are not input data',
      );
      points.push(undefined);
    } else if (!descriptor.enumerable) {
      addIssue(
        issues,
        'input-contract',
        `${path}[${index}]`,
        'invalid-property',
        'triangle vertices must be enumerable',
      );
      points.push(undefined);
    } else {
      points.push(parsePoint(descriptor.value, encoding, `${path}[${index}]`, issues));
    }
  }
  const first = points[0];
  const second = points[1];
  const third = points[2];
  if (first === undefined || second === undefined || third === undefined) return undefined;
  return Object.freeze([first, second, third] as const);
}

function edgeDirection(
  start: StaticRationalTriangleOverlapAuditPoint3,
  end: StaticRationalTriangleOverlapAuditPoint3,
): IntegerVector3 {
  return [
    end.x * start.w - start.x * end.w,
    end.y * start.w - start.y * end.w,
    end.z * start.w - start.z * end.w,
  ];
}

function cross(left: IntegerVector3, right: IntegerVector3): IntegerVector3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function triangleIsDegenerate(triangle: StaticRationalTriangleOverlapAuditTriangle3): boolean {
  const normal = cross(
    edgeDirection(triangle[0], triangle[1]),
    edgeDirection(triangle[0], triangle[2]),
  );
  return normal[0] === 0n && normal[1] === 0n && normal[2] === 0n;
}

function parseMetadataString(
  value: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): string | undefined {
  if (typeof value !== 'string') {
    addIssue(issues, 'input-contract', path, 'expected-string', 'must be a string');
    return undefined;
  }
  if (value.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxMetadataStringLength) {
    addIssue(
      issues,
      'input-contract',
      path,
      'string-limit-exceeded',
      `string exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxMetadataStringLength} characters`,
    );
    return undefined;
  }
  return value;
}

function parseBoolean(
  value: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): boolean | undefined {
  if (typeof value !== 'boolean') {
    addIssue(issues, 'input-contract', path, 'expected-boolean', 'must be a boolean');
    return undefined;
  }
  return value;
}

function parseProducer(
  supplied: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): StaticRationalTriangleOverlapProducerSnapshotV1 | undefined {
  const inspected = inspectClosedObject(supplied, path, PRODUCER_KEYS, issues);
  if (inspected === undefined) return undefined;
  const rawSchemaVersion = descriptorValue(inspected, 'schemaVersion');
  let schemaVersion: number | undefined;
  if (!Number.isSafeInteger(rawSchemaVersion)) {
    addIssue(
      issues,
      'input-contract',
      `${path}.schemaVersion`,
      'expected-safe-integer',
      'must be one safe integer',
    );
  } else {
    schemaVersion = rawSchemaVersion as number;
  }
  const recordType = parseMetadataString(
    descriptorValue(inspected, 'recordType'),
    `${path}.recordType`,
    issues,
  );
  const contractStatus = parseMetadataString(
    descriptorValue(inspected, 'contractStatus'),
    `${path}.contractStatus`,
    issues,
  );
  const predicateScope = parseMetadataString(
    descriptorValue(inspected, 'predicateScope'),
    `${path}.predicateScope`,
    issues,
  );
  const arithmetic = parseMetadataString(
    descriptorValue(inspected, 'arithmetic'),
    `${path}.arithmetic`,
    issues,
  );
  const rawClassification = descriptorValue(inspected, 'classification');
  let classification: StaticRationalTriangleOverlapAuditClassification | undefined;
  if (
    rawClassification !== 'disjoint' &&
    rawClassification !== 'intersecting-coplanar' &&
    rawClassification !== 'intersecting-noncoplanar'
  ) {
    addIssue(
      issues,
      'input-contract',
      `${path}.classification`,
      'expected-literal',
      'must be one declared static classification',
    );
  } else {
    classification = rawClassification;
  }
  const closedTrianglesIntersect = parseBoolean(
    descriptorValue(inspected, 'closedTrianglesIntersect'),
    `${path}.closedTrianglesIntersect`,
    issues,
  );
  const boundaryContactCountsAsIntersection = parseBoolean(
    descriptorValue(inspected, 'boundaryContactCountsAsIntersection'),
    `${path}.boundaryContactCountsAsIntersection`,
    issues,
  );
  const staticPredicateIncluded = parseBoolean(
    descriptorValue(inspected, 'staticPredicateIncluded'),
    `${path}.staticPredicateIncluded`,
    issues,
  );
  const legalContactClassificationIncluded = parseBoolean(
    descriptorValue(inspected, 'legalContactClassificationIncluded'),
    `${path}.legalContactClassificationIncluded`,
    issues,
  );
  const penetrationClassificationIncluded = parseBoolean(
    descriptorValue(inspected, 'penetrationClassificationIncluded'),
    `${path}.penetrationClassificationIncluded`,
    issues,
  );
  const collisionFreeClaim = parseBoolean(
    descriptorValue(inspected, 'collisionFreeClaim'),
    `${path}.collisionFreeClaim`,
    issues,
  );
  const continuousTimeIncluded = parseBoolean(
    descriptorValue(inspected, 'continuousTimeIncluded'),
    `${path}.continuousTimeIncluded`,
    issues,
  );
  const continuousCollisionDetectionIncluded = parseBoolean(
    descriptorValue(inspected, 'continuousCollisionDetectionIncluded'),
    `${path}.continuousCollisionDetectionIncluded`,
    issues,
  );
  const rigidMotionIntervalIncluded = parseBoolean(
    descriptorValue(inspected, 'rigidMotionIntervalIncluded'),
    `${path}.rigidMotionIntervalIncluded`,
    issues,
  );
  const verifiedClaim = parseBoolean(
    descriptorValue(inspected, 'verifiedClaim'),
    `${path}.verifiedClaim`,
    issues,
  );
  const globalM0fGo = parseBoolean(
    descriptorValue(inspected, 'globalM0fGo'),
    `${path}.globalM0fGo`,
    issues,
  );
  if (
    schemaVersion === undefined ||
    recordType === undefined ||
    contractStatus === undefined ||
    predicateScope === undefined ||
    arithmetic === undefined ||
    classification === undefined ||
    closedTrianglesIntersect === undefined ||
    boundaryContactCountsAsIntersection === undefined ||
    staticPredicateIncluded === undefined ||
    legalContactClassificationIncluded === undefined ||
    penetrationClassificationIncluded === undefined ||
    collisionFreeClaim === undefined ||
    continuousTimeIncluded === undefined ||
    continuousCollisionDetectionIncluded === undefined ||
    rigidMotionIntervalIncluded === undefined ||
    verifiedClaim === undefined ||
    globalM0fGo === undefined
  ) {
    return undefined;
  }
  return Object.freeze({
    schemaVersion,
    recordType,
    contractStatus,
    predicateScope,
    arithmetic,
    classification,
    closedTrianglesIntersect,
    boundaryContactCountsAsIntersection,
    staticPredicateIncluded,
    legalContactClassificationIncluded,
    penetrationClassificationIncluded,
    collisionFreeClaim,
    continuousTimeIncluded,
    continuousCollisionDetectionIncluded,
    rigidMotionIntervalIncluded,
    verifiedClaim,
    globalM0fGo,
  });
}

/**
 * Unknown-data API. It performs bounded descriptor inspection, rejects
 * accessors and surplus structure, validates canonical coordinates, and
 * returns a deeply frozen trusted BigInt snapshot.
 */
export function parseStaticRationalTriangleOverlapAuditInputV1(
  supplied: unknown,
): ParseStaticRationalTriangleOverlapAuditInputResultV1 {
  const issues: StaticRationalTriangleOverlapAuditIssue[] = [];
  try {
    const root = inspectClosedObject(supplied, '$', ROOT_KEYS, issues);
    if (root === undefined) return parseFailure(issues);
    const schemaVersion = parseLiteral(
      descriptorValue(root, 'schemaVersion'),
      1,
      '$.schemaVersion',
      issues,
    );
    const recordType = parseLiteral(
      descriptorValue(root, 'recordType'),
      STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
      '$.recordType',
      issues,
    );
    const encoding = parseEncoding(
      descriptorValue(root, 'coordinateEncoding'),
      '$.coordinateEncoding',
      issues,
    );
    const triangleA =
      encoding === undefined
        ? undefined
        : parseTriangle(descriptorValue(root, 'triangleA'), encoding, '$.triangleA', issues);
    const triangleB =
      encoding === undefined
        ? undefined
        : parseTriangle(descriptorValue(root, 'triangleB'), encoding, '$.triangleB', issues);
    const producer = parseProducer(descriptorValue(root, 'producer'), '$.producer', issues);
    if (triangleA !== undefined && triangleIsDegenerate(triangleA)) {
      addIssue(
        issues,
        'input-contract',
        '$.triangleA',
        'degenerate-triangle',
        'three vertices must span a nonzero-area affine triangle',
      );
    }
    if (triangleB !== undefined && triangleIsDegenerate(triangleB)) {
      addIssue(
        issues,
        'input-contract',
        '$.triangleB',
        'degenerate-triangle',
        'three vertices must span a nonzero-area affine triangle',
      );
    }
    if (
      issues.length > 0 ||
      schemaVersion === undefined ||
      recordType === undefined ||
      triangleA === undefined ||
      triangleB === undefined ||
      producer === undefined
    ) {
      return parseFailure(issues);
    }
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({ triangleA, triangleB, producer }),
    });
  } catch {
    addIssue(
      issues,
      'input-contract',
      '$',
      'inspection-failed',
      'input could not be parsed safely',
    );
    return parseFailure(issues);
  }
}

function fraction(numerator: bigint, denominator = 1n): Fraction {
  if (denominator === 0n) throw new RangeError('zero exact denominator');
  const direction = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return Object.freeze({
    numerator: (numerator * direction) / divisor,
    denominator: (denominator * direction) / divisor,
  });
}

function subtractFractions(left: Fraction, right: Fraction): Fraction {
  return fraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyFractions(left: Fraction, right: Fraction): Fraction {
  return fraction(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divideFractions(left: Fraction, right: Fraction): Fraction {
  return fraction(left.numerator * right.denominator, left.denominator * right.numerator);
}

function activeIndexSets(size: number, start = 0, prefix: readonly number[] = []): number[][] {
  if (prefix.length === size) return [[...prefix]];
  const result: number[][] = [];
  for (let index = start; index < 6; index += 1) {
    result.push(...activeIndexSets(size, index + 1, [...prefix, index]));
  }
  return result;
}

const ACTIVE_INDEX_SETS = Object.freeze(
  [5, 4, 3, 2, 1].flatMap((size) => activeIndexSets(size).map((indices) => Object.freeze(indices))),
);

function solveUniqueOverdetermined(
  coefficients: readonly (readonly Fraction[])[],
  rightHandSide: readonly Fraction[],
): readonly Fraction[] | undefined {
  const columnCount = coefficients[0]?.length ?? 0;
  const augmented = coefficients.map((row, rowIndex) => [
    ...row,
    required(rightHandSide[rowIndex], 'right-hand-side entry'),
  ]);
  const pivotRows: number[] = [];
  let rank = 0;
  for (let column = 0; column < columnCount; column += 1) {
    const pivot = augmented.findIndex(
      (row, rowIndex) => rowIndex >= rank && row[column]?.numerator !== 0n,
    );
    if (pivot < 0) return undefined;
    const pivotRow = required(augmented[pivot], 'pivot row');
    const displacedRow = required(augmented[rank], 'displaced row');
    augmented[rank] = pivotRow;
    augmented[pivot] = displacedRow;
    const normalizedRow = required(augmented[rank], 'normalized row');
    const pivotValue = required(normalizedRow[column], 'pivot value');
    for (let entry = column; entry <= columnCount; entry += 1) {
      normalizedRow[entry] = divideFractions(
        required(normalizedRow[entry], 'normalized entry'),
        pivotValue,
      );
    }
    for (let row = 0; row < augmented.length; row += 1) {
      if (row === rank) continue;
      const eliminatedRow = required(augmented[row], 'eliminated row');
      const factor = required(eliminatedRow[column], 'elimination factor');
      if (factor.numerator === 0n) continue;
      for (let entry = column; entry <= columnCount; entry += 1) {
        eliminatedRow[entry] = subtractFractions(
          required(eliminatedRow[entry], 'eliminated entry'),
          multiplyFractions(factor, required(normalizedRow[entry], 'normalized entry')),
        );
      }
    }
    pivotRows[column] = rank;
    rank += 1;
  }
  for (let row = rank; row < augmented.length; row += 1) {
    const residual = required(augmented[row], 'residual row');
    const zeroCoefficients = residual
      .slice(0, columnCount)
      .every((value) => value.numerator === 0n);
    if (
      zeroCoefficients &&
      required(residual[columnCount], 'residual right-hand side').numerator !== 0n
    ) {
      return undefined;
    }
  }
  return pivotRows.map((row) =>
    required(required(augmented[row], 'solution row')[columnCount], 'solution value'),
  );
}

function exactBarycentricIntersection(
  triangleA: StaticRationalTriangleOverlapAuditTriangle3,
  triangleB: StaticRationalTriangleOverlapAuditTriangle3,
): boolean {
  const one = fraction(1n);
  const zero = fraction(0n);
  const fullMatrix: Fraction[][] = [
    [one, one, one, zero, zero, zero],
    [zero, zero, zero, one, one, one],
    ...COORDINATES.map((coordinate) => [
      ...triangleA.map((point) => fraction(point[coordinate], point.w)),
      ...triangleB.map((point) => fraction(-point[coordinate], point.w)),
    ]),
  ];
  const rightHandSide = [one, one, zero, zero, zero];
  for (const active of ACTIVE_INDEX_SETS) {
    const solution = solveUniqueOverdetermined(
      fullMatrix.map((row) =>
        active.map((index) => required(row[index], 'barycentric coefficient')),
      ),
      rightHandSide,
    );
    if (solution?.every((value) => value.numerator >= 0n)) return true;
  }
  return false;
}

function determinant3(
  a00: bigint,
  a01: bigint,
  a02: bigint,
  a10: bigint,
  a11: bigint,
  a12: bigint,
  a20: bigint,
  a21: bigint,
  a22: bigint,
): bigint {
  return (
    a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20)
  );
}

function orient3D(
  first: StaticRationalTriangleOverlapAuditPoint3,
  second: StaticRationalTriangleOverlapAuditPoint3,
  third: StaticRationalTriangleOverlapAuditPoint3,
  fourth: StaticRationalTriangleOverlapAuditPoint3,
): bigint {
  const firstToSecond = edgeDirection(first, second);
  const firstToThird = edgeDirection(first, third);
  const firstToFourth = edgeDirection(first, fourth);
  return determinant3(...firstToSecond, ...firstToThird, ...firstToFourth);
}

function trianglesAreCoplanar(
  triangleA: StaticRationalTriangleOverlapAuditTriangle3,
  triangleB: StaticRationalTriangleOverlapAuditTriangle3,
): boolean {
  return triangleB.every(
    (point) => orient3D(triangleA[0], triangleA[1], triangleA[2], point) === 0n,
  );
}

function independentlyClassify(
  triangleA: StaticRationalTriangleOverlapAuditTriangle3,
  triangleB: StaticRationalTriangleOverlapAuditTriangle3,
): StaticRationalTriangleOverlapAuditClassification {
  if (!exactBarycentricIntersection(triangleA, triangleB)) return 'disjoint';
  return trianglesAreCoplanar(triangleA, triangleB)
    ? 'intersecting-coplanar'
    : 'intersecting-noncoplanar';
}

function decisionRecord(
  outcome: 'consistent',
  auditedClassification: StaticRationalTriangleOverlapAuditClassification,
  producer: StaticRationalTriangleOverlapProducerSnapshotV1,
): StaticRationalTriangleOverlapAuditConsistentV1;
function decisionRecord(
  outcome: 'inconsistent',
  auditedClassification: StaticRationalTriangleOverlapAuditClassification,
  producer: StaticRationalTriangleOverlapProducerSnapshotV1,
): StaticRationalTriangleOverlapAuditInconsistentV1;
function decisionRecord(
  outcome: 'consistent' | 'inconsistent',
  auditedClassification: StaticRationalTriangleOverlapAuditClassification,
  producer: StaticRationalTriangleOverlapProducerSnapshotV1,
):
  | StaticRationalTriangleOverlapAuditConsistentV1
  | StaticRationalTriangleOverlapAuditInconsistentV1 {
  const base = {
    schemaVersion: 1 as const,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_RESULT_RECORD_TYPE,
    contractStatus: 'candidate-no-claim' as const,
    scientificClaim: false as const,
    auditScope: 'one-static-configuration-of-two-closed-triangles' as const,
    implementationRole: 'independent-auditor' as const,
    verificationIndependence:
      'exact-barycentric-replay-without-producer-or-shared-3d-kernel' as const,
    exactBarycentricFeasibilityIncluded: true as const,
    staticPredicateIncluded: true as const,
    auditedClassification,
    auditedClosedTrianglesIntersect: auditedClassification !== 'disjoint',
    producerClassification: producer.classification,
    producerClosedTrianglesIntersect: producer.closedTrianglesIntersect,
    boundaryContactCountsAsIntersection: true as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    collisionFreeClaim: false as const,
    continuousTimeIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    rigidMotionIntervalIncluded: false as const,
    verifiedClaim: false as const,
    globalM0fGo: false as const,
  };
  if (outcome === 'consistent') {
    return Object.freeze({
      ...base,
      auditOutcome: 'consistent' as const,
      producerRecordMatched: true as const,
    });
  }
  return Object.freeze({
    ...base,
    auditOutcome: 'inconsistent' as const,
    producerRecordMatched: false as const,
  });
}

function checkProducerField(
  actual: unknown,
  expected: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapAuditIssue[],
): void {
  if (actual === expected) return;
  addIssue(
    issues,
    'producer-consistency',
    path,
    'producer-field-mismatch',
    'producer field does not match the fixed candidate record contract',
  );
}

/**
 * Trusted-data API. It skips hostile-object inspection and coordinate limits;
 * only pass the deeply frozen value returned by the parser above.
 */
export function auditTrustedStaticRationalTriangleOverlapCandidateV1(
  input: TrustedStaticRationalTriangleOverlapAuditInputV1,
): StaticRationalTriangleOverlapAuditResultV1 {
  const auditedClassification = independentlyClassify(input.triangleA, input.triangleB);
  const auditedClosedTrianglesIntersect = auditedClassification !== 'disjoint';
  const producer = input.producer;
  const issues: StaticRationalTriangleOverlapAuditIssue[] = [];
  checkProducerField(producer.schemaVersion, 1, '$.producer.schemaVersion', issues);
  checkProducerField(
    producer.recordType,
    'm0f-static-rational-triangle-overlap',
    '$.producer.recordType',
    issues,
  );
  checkProducerField(
    producer.contractStatus,
    'candidate-no-claim',
    '$.producer.contractStatus',
    issues,
  );
  checkProducerField(
    producer.predicateScope,
    'one-static-configuration-of-two-closed-triangles',
    '$.producer.predicateScope',
    issues,
  );
  checkProducerField(
    producer.arithmetic,
    'exact-projective-rational-bigint',
    '$.producer.arithmetic',
    issues,
  );
  if (producer.classification !== auditedClassification) {
    addIssue(
      issues,
      'producer-consistency',
      '$.producer.classification',
      'classification-mismatch',
      'producer classification does not match the independent exact replay',
    );
  }
  if (producer.closedTrianglesIntersect !== auditedClosedTrianglesIntersect) {
    addIssue(
      issues,
      'producer-consistency',
      '$.producer.closedTrianglesIntersect',
      'closed-intersection-mismatch',
      'producer closed-intersection boolean does not match the independent exact replay',
    );
  }
  checkProducerField(
    producer.boundaryContactCountsAsIntersection,
    true,
    '$.producer.boundaryContactCountsAsIntersection',
    issues,
  );
  checkProducerField(
    producer.staticPredicateIncluded,
    true,
    '$.producer.staticPredicateIncluded',
    issues,
  );
  checkProducerField(
    producer.legalContactClassificationIncluded,
    false,
    '$.producer.legalContactClassificationIncluded',
    issues,
  );
  checkProducerField(
    producer.penetrationClassificationIncluded,
    false,
    '$.producer.penetrationClassificationIncluded',
    issues,
  );
  checkProducerField(producer.collisionFreeClaim, false, '$.producer.collisionFreeClaim', issues);
  checkProducerField(
    producer.continuousTimeIncluded,
    false,
    '$.producer.continuousTimeIncluded',
    issues,
  );
  checkProducerField(
    producer.continuousCollisionDetectionIncluded,
    false,
    '$.producer.continuousCollisionDetectionIncluded',
    issues,
  );
  checkProducerField(
    producer.rigidMotionIntervalIncluded,
    false,
    '$.producer.rigidMotionIntervalIncluded',
    issues,
  );
  checkProducerField(producer.verifiedClaim, false, '$.producer.verifiedClaim', issues);
  checkProducerField(producer.globalM0fGo, false, '$.producer.globalM0fGo', issues);
  if (issues.length === 0) {
    return Object.freeze({
      ok: true as const,
      value: decisionRecord('consistent', auditedClassification, producer),
    });
  }
  return Object.freeze({
    ok: false as const,
    value: decisionRecord('inconsistent', auditedClassification, producer),
    error: freezeIssues(issues),
  });
}

/**
 * Recommended unknown-data API. Contract rejection and unexpected internal
 * failure fail closed; a valid but tampered producer record returns the fixed
 * candidate-only `inconsistent` decision.
 */
export function auditStaticRationalTriangleOverlapCandidateV1(
  supplied: unknown,
): StaticRationalTriangleOverlapAuditResultV1 {
  const parsed = parseStaticRationalTriangleOverlapAuditInputV1(supplied);
  if (!parsed.ok) return contractFailure(parsed.error);
  try {
    return auditTrustedStaticRationalTriangleOverlapCandidateV1(parsed.value);
  } catch {
    return contractFailure([
      issue(
        'audit-internal',
        '$',
        'unexpected-audit-failure',
        'independent static triangle audit failed closed unexpectedly',
      ),
    ]);
  }
}
