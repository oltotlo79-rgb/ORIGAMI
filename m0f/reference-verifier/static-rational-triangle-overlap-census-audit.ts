/**
 * Independent candidate replay for one complete static triangle-overlap census.
 *
 * The only runtime dependency is the import-free exact barycentric pair auditor.
 * This module does not import the producer census, its pair classifier, or the
 * shared projective-rational kernel. It owns the portable closed input parser,
 * canonical ID ordering, raw incidence calculation, complete-pair enumeration,
 * counter replay, and whole-record consistency contract.
 */

import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_RESULT_RECORD_TYPE,
  auditStaticRationalTriangleOverlapCandidateV1,
  type StaticRationalTriangleOverlapAuditClassification,
  type StaticRationalTriangleOverlapAuditTriangleSnapshotV1,
  type StaticRationalTriangleOverlapProducerSnapshotV1,
} from './static-rational-triangle-overlap-audit.js';

export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE =
  'm0f-static-rational-triangle-overlap-census-audit-input' as const;
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_RESULT_RECORD_TYPE =
  'm0f-static-rational-triangle-overlap-census-audit-result' as const;

/** Defensive limits for one portable whole-census audit call. */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS = Object.freeze({
  maxTriangles: 64,
  maxPairs: 2_016,
  maxPairAudits: 2_016,
  maxIssues: 512,
  maxIdCodeUnits: 128,
  maxDiagnosticPathSegmentCodeUnits: 128,
  maxMetadataStringCodeUnits: 128,
  maxCoordinateBits: 16_384,
  maxCoordinateDecimalDigits: 4_933,
  maxOwnPropertiesPerContainer: 48,
} as const);

export type StaticRationalTriangleOverlapCensusAuditCoordinateEncoding =
  'bigint' | 'canonical-decimal';
export type StaticRationalTriangleOverlapCensusAuditCoordinateSnapshot = bigint | string;
export type StaticRationalTriangleOverlapCensusAuditPointSnapshotV1 = Readonly<{
  x: StaticRationalTriangleOverlapCensusAuditCoordinateSnapshot;
  y: StaticRationalTriangleOverlapCensusAuditCoordinateSnapshot;
  z: StaticRationalTriangleOverlapCensusAuditCoordinateSnapshot;
  w: StaticRationalTriangleOverlapCensusAuditCoordinateSnapshot;
}>;
export type StaticRationalTriangleOverlapCensusAuditTriangleSnapshotV1 = readonly [
  first: StaticRationalTriangleOverlapCensusAuditPointSnapshotV1,
  second: StaticRationalTriangleOverlapCensusAuditPointSnapshotV1,
  third: StaticRationalTriangleOverlapCensusAuditPointSnapshotV1,
];
export type StaticRationalTriangleOverlapCensusAuditTriangleEntrySnapshotV1 = Readonly<{
  triangleId: string;
  triangle: StaticRationalTriangleOverlapCensusAuditTriangleSnapshotV1;
}>;

export type StaticRationalTriangleOverlapCensusAuditIncidenceClass =
  'nonincident' | 'shared-vertex' | 'shared-edge' | 'coincident-triangle';

export type StaticRationalTriangleOverlapCensusProducerPairSnapshotV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  sharedCanonicalVertexCount: number;
  incidenceBasis: string;
  incidenceClass: StaticRationalTriangleOverlapCensusAuditIncidenceClass;
  staticClassification: StaticRationalTriangleOverlapAuditClassification;
  closedTrianglesIntersect: boolean;
}>;

/** Portable copy of the complete producer census record. */
export type StaticRationalTriangleOverlapCensusProducerSnapshotV1 = Readonly<{
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  predicateScope: string;
  arithmetic: string;
  triangleOrder: string;
  pairOrder: string;
  incidenceBasis: string;
  triangleIds: readonly string[];
  triangleCount: number;
  unorderedPairCount: number;
  disjointPairCount: number;
  overlapPairCount: number;
  coplanarOverlapPairCount: number;
  noncoplanarOverlapPairCount: number;
  nonincidentPairCount: number;
  sharedVertexPairCount: number;
  sharedEdgePairCount: number;
  coincidentTrianglePairCount: number;
  nonincidentOverlapPairCount: number;
  incidentOverlapPairCount: number;
  pairs: readonly StaticRationalTriangleOverlapCensusProducerPairSnapshotV1[];
  allUnorderedPairsIncluded: boolean;
  silentPairExclusionIncluded: boolean;
  boundaryContactCountsAsIntersection: boolean;
  rawCensusOnly: boolean;
  staticPredicateIncluded: boolean;
  meshAdjacencyDecisionIncluded: boolean;
  legalContactClassificationIncluded: boolean;
  penetrationClassificationIncluded: boolean;
  selfIntersectionDecisionIncluded: boolean;
  collisionFreeClaim: boolean;
  continuousTimeIncluded: boolean;
  continuousCollisionDetectionIncluded: boolean;
  rigidMotionIntervalIncluded: boolean;
  isSupportProfile: boolean;
  supportClaim: boolean;
  verifiedClaim: boolean;
  globalM0fGo: boolean;
}>;

export type StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE;
  coordinateEncoding: StaticRationalTriangleOverlapCensusAuditCoordinateEncoding;
  triangles: readonly StaticRationalTriangleOverlapCensusAuditTriangleEntrySnapshotV1[];
  producer: StaticRationalTriangleOverlapCensusProducerSnapshotV1;
}>;

export type StaticRationalTriangleOverlapCensusAuditPoint3 = Readonly<{
  x: bigint;
  y: bigint;
  z: bigint;
  w: bigint;
}>;
export type StaticRationalTriangleOverlapCensusAuditTriangle3 = readonly [
  first: StaticRationalTriangleOverlapCensusAuditPoint3,
  second: StaticRationalTriangleOverlapCensusAuditPoint3,
  third: StaticRationalTriangleOverlapCensusAuditPoint3,
];
export type TrustedStaticRationalTriangleOverlapCensusAuditTriangleV1 = Readonly<{
  triangleId: string;
  triangle: StaticRationalTriangleOverlapCensusAuditTriangle3;
}>;
/** Trusted form returned by the parser; callers must not construct or cast it. */
export type TrustedStaticRationalTriangleOverlapCensusAuditInputV1 = Readonly<{
  triangles: readonly TrustedStaticRationalTriangleOverlapCensusAuditTriangleV1[];
  producer: StaticRationalTriangleOverlapCensusProducerSnapshotV1;
}>;

export type StaticRationalTriangleOverlapCensusAuditIssueStage =
  'input-contract' | 'producer-consistency' | 'pair-replay' | 'audit-internal';
export type StaticRationalTriangleOverlapCensusAuditIssueCode =
  | 'expected-object'
  | 'expected-array'
  | 'expected-triangle'
  | 'unknown-property'
  | 'missing-property'
  | 'accessor-property'
  | 'invalid-property'
  | 'property-limit-exceeded'
  | 'array-limit-exceeded'
  | 'expected-literal'
  | 'expected-string'
  | 'string-limit-exceeded'
  | 'expected-boolean'
  | 'expected-safe-integer'
  | 'integer-limit-exceeded'
  | 'expected-bigint'
  | 'expected-canonical-decimal'
  | 'decimal-digit-limit-exceeded'
  | 'coordinate-limit-exceeded'
  | 'nonpositive-weight'
  | 'noncanonical-point'
  | 'degenerate-triangle'
  | 'invalid-id'
  | 'duplicate-id'
  | 'invalid-classification'
  | 'invalid-incidence-class'
  | 'inspection-failed'
  | 'producer-field-mismatch'
  | 'producer-array-length-mismatch'
  | 'pair-field-mismatch'
  | 'pair-audit-inconsistent'
  | 'incidence-invariant'
  | 'unexpected-pair-audit-failure'
  | 'internal-count-invariant';
export type StaticRationalTriangleOverlapCensusAuditIssue = Readonly<{
  stage: StaticRationalTriangleOverlapCensusAuditIssueStage;
  path: string;
  code: StaticRationalTriangleOverlapCensusAuditIssueCode;
  message: string;
}>;

export type ParseStaticRationalTriangleOverlapCensusAuditInputResultV1 =
  | Readonly<{ ok: true; value: TrustedStaticRationalTriangleOverlapCensusAuditInputV1 }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleOverlapCensusAuditIssue[];
    }>;

type AuditedCensusSummary = Readonly<{
  triangleIds: readonly string[];
  triangleCount: number;
  unorderedPairCount: number;
  disjointPairCount: number;
  overlapPairCount: number;
  coplanarOverlapPairCount: number;
  noncoplanarOverlapPairCount: number;
  nonincidentPairCount: number;
  sharedVertexPairCount: number;
  sharedEdgePairCount: number;
  coincidentTrianglePairCount: number;
  nonincidentOverlapPairCount: number;
  incidentOverlapPairCount: number;
}>;

type StaticRationalTriangleOverlapCensusAuditDecisionBaseV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_RESULT_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  scientificClaim: false;
  auditScope: 'one-static-configuration-all-unordered-closed-triangle-pairs';
  implementationRole: 'independent-whole-census-auditor';
  verificationIndependence: 'canonical-census-replay-using-independent-exact-barycentric-pair-auditor';
  wholeCensusReplayIncluded: true;
  independentPairAuditIncluded: true;
  allExpectedUnorderedPairsReplayed: true;
  rawIncidenceRecomputed: true;
  auditedTriangleIds: readonly string[];
  auditedTriangleCount: number;
  auditedUnorderedPairCount: number;
  auditedDisjointPairCount: number;
  auditedOverlapPairCount: number;
  auditedCoplanarOverlapPairCount: number;
  auditedNoncoplanarOverlapPairCount: number;
  auditedNonincidentPairCount: number;
  auditedSharedVertexPairCount: number;
  auditedSharedEdgePairCount: number;
  auditedCoincidentTrianglePairCount: number;
  auditedNonincidentOverlapPairCount: number;
  auditedIncidentOverlapPairCount: number;
  boundaryContactCountsAsIntersection: true;
  rawCensusOnly: true;
  staticPredicateIncluded: true;
  meshAdjacencyDecisionIncluded: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionDecisionIncluded: false;
  collisionFreeClaim: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  rigidMotionIntervalIncluded: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  globalM0fGo: false;
}>;
export type StaticRationalTriangleOverlapCensusAuditConsistentV1 =
  StaticRationalTriangleOverlapCensusAuditDecisionBaseV1 &
    Readonly<{ auditOutcome: 'consistent'; producerRecordMatched: true }>;
export type StaticRationalTriangleOverlapCensusAuditInconsistentV1 =
  StaticRationalTriangleOverlapCensusAuditDecisionBaseV1 &
    Readonly<{ auditOutcome: 'inconsistent'; producerRecordMatched: false }>;
export type StaticRationalTriangleOverlapCensusAuditResultV1 =
  | Readonly<{
      ok: true;
      value: StaticRationalTriangleOverlapCensusAuditConsistentV1;
    }>
  | Readonly<{
      ok: false;
      value: StaticRationalTriangleOverlapCensusAuditInconsistentV1;
      error: readonly StaticRationalTriangleOverlapCensusAuditIssue[];
    }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapCensusAuditIssue[] }>;

type InspectedObject = Readonly<{ descriptors: ReadonlyMap<PropertyKey, PropertyDescriptor> }>;
type Issue = StaticRationalTriangleOverlapCensusAuditIssue;
type CoordinateEncoding = StaticRationalTriangleOverlapCensusAuditCoordinateEncoding;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'coordinateEncoding',
  'triangles',
  'producer',
] as const;
const ENTRY_KEYS = ['triangleId', 'triangle'] as const;
const POINT_KEYS = ['x', 'y', 'z', 'w'] as const;
const PAIR_KEYS = [
  'pairIndex',
  'firstTriangleId',
  'secondTriangleId',
  'sharedCanonicalVertexCount',
  'incidenceBasis',
  'incidenceClass',
  'staticClassification',
  'closedTrianglesIntersect',
] as const;
const PAIR_AUDIT_DECISION_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'auditScope',
  'implementationRole',
  'verificationIndependence',
  'exactBarycentricFeasibilityIncluded',
  'staticPredicateIncluded',
  'auditedClassification',
  'auditedClosedTrianglesIntersect',
  'producerClassification',
  'producerClosedTrianglesIntersect',
  'producerRecordMatched',
  'boundaryContactCountsAsIntersection',
  'legalContactClassificationIncluded',
  'penetrationClassificationIncluded',
  'collisionFreeClaim',
  'continuousTimeIncluded',
  'continuousCollisionDetectionIncluded',
  'rigidMotionIntervalIncluded',
  'verifiedClaim',
  'globalM0fGo',
  'auditOutcome',
] as const;
const PAIR_AUDIT_ISSUE_KEYS = ['stage', 'path', 'code', 'message'] as const;
const PRODUCER_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'predicateScope',
  'arithmetic',
  'triangleOrder',
  'pairOrder',
  'incidenceBasis',
  'triangleIds',
  'triangleCount',
  'unorderedPairCount',
  'disjointPairCount',
  'overlapPairCount',
  'coplanarOverlapPairCount',
  'noncoplanarOverlapPairCount',
  'nonincidentPairCount',
  'sharedVertexPairCount',
  'sharedEdgePairCount',
  'coincidentTrianglePairCount',
  'nonincidentOverlapPairCount',
  'incidentOverlapPairCount',
  'pairs',
  'allUnorderedPairsIncluded',
  'silentPairExclusionIncluded',
  'boundaryContactCountsAsIntersection',
  'rawCensusOnly',
  'staticPredicateIncluded',
  'meshAdjacencyDecisionIncluded',
  'legalContactClassificationIncluded',
  'penetrationClassificationIncluded',
  'selfIntersectionDecisionIncluded',
  'collisionFreeClaim',
  'continuousTimeIncluded',
  'continuousCollisionDetectionIncluded',
  'rigidMotionIntervalIncluded',
  'isSupportProfile',
  'supportClaim',
  'verifiedClaim',
  'globalM0fGo',
] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const CANONICAL_INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const MAX_COORDINATE_MAGNITUDE_EXCLUSIVE =
  1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateBits);

function deepFreezeOwned<T>(value: T): T {
  const seen = new WeakSet<object>();
  const visit = (candidate: unknown): void => {
    if (typeof candidate !== 'object' || candidate === null || seen.has(candidate)) return;
    seen.add(candidate);
    for (const key of Reflect.ownKeys(candidate)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(candidate, key);
      if (descriptor !== undefined && 'value' in descriptor) visit(descriptor.value);
    }
    Object.freeze(candidate);
  };
  visit(value);
  return value;
}

function issue(
  stage: StaticRationalTriangleOverlapCensusAuditIssueStage,
  path: string,
  code: StaticRationalTriangleOverlapCensusAuditIssueCode,
  message: string,
): Issue {
  return Object.freeze({ stage, path, code, message });
}

function addIssue(
  issues: Issue[],
  stage: StaticRationalTriangleOverlapCensusAuditIssueStage,
  path: string,
  code: StaticRationalTriangleOverlapCensusAuditIssueCode,
  message: string,
): void {
  if (issues.length >= STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxIssues) return;
  issues.push(issue(stage, path, code, message));
}

function freezeIssues(issues: readonly Issue[]): readonly Issue[] {
  return deepFreezeOwned([...issues]);
}

function parseFailure(
  issues: readonly Issue[],
): Extract<ParseStaticRationalTriangleOverlapCensusAuditInputResultV1, { ok: false }> {
  return deepFreezeOwned({ ok: false as const, error: [...issues] });
}

function contractFailure(
  issues: readonly Issue[],
): Extract<StaticRationalTriangleOverlapCensusAuditResultV1, { ok: false }> {
  return deepFreezeOwned({ ok: false as const, error: [...issues] });
}

function diagnosticPropertyKey(key: PropertyKey): string {
  const maximum =
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxDiagnosticPathSegmentCodeUnits;
  if (typeof key === 'symbol') {
    const prefix = 'Symbol(';
    const description = key.description ?? '';
    if (prefix.length + description.length + 1 <= maximum) {
      return `${prefix}${description})`;
    }
    return `${prefix}${description.slice(0, maximum - prefix.length - 1)}…`;
  }
  const raw = String(key);
  return raw.length <= maximum ? raw : `${raw.slice(0, maximum - 1)}…`;
}

function comparePropertyKeys(left: PropertyKey, right: PropertyKey): number {
  const leftIsSymbol = typeof left === 'symbol';
  const rightIsSymbol = typeof right === 'symbol';
  if (leftIsSymbol !== rightIsSymbol) return leftIsSymbol ? 1 : -1;
  const leftText = leftIsSymbol ? (left.description ?? '') : String(left);
  const rightText = rightIsSymbol ? (right.description ?? '') : String(right);
  return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
}

function inspectClosedObject(
  supplied: unknown,
  path: string,
  expectedKeys: readonly string[],
  issues: Issue[],
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
    if (
      keys.length >
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxOwnPropertiesPerContainer
    ) {
      addIssue(
        issues,
        'input-contract',
        path,
        'property-limit-exceeded',
        `container exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxOwnPropertiesPerContainer)} own properties`,
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
          `${path}.${diagnosticPropertyKey(key)}`,
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

function inspectDenseArray(
  supplied: unknown,
  path: string,
  maximumLength: number,
  issues: Issue[],
): readonly unknown[] | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, 'input-contract', path, 'expected-array', 'must be one dense plain array');
    return undefined;
  }
  try {
    if (!Array.isArray(supplied) || Reflect.getPrototypeOf(supplied) !== Array.prototype) {
      addIssue(issues, 'input-contract', path, 'expected-array', 'must be one dense plain array');
      return undefined;
    }
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(supplied, 'length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      typeof lengthDescriptor.value !== 'number' ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      addIssue(issues, 'input-contract', path, 'expected-array', 'array length is invalid');
      return undefined;
    }
    const length = lengthDescriptor.value;
    if (length > maximumLength) {
      addIssue(
        issues,
        'input-contract',
        path,
        'array-limit-exceeded',
        `array length exceeds ${String(maximumLength)}`,
      );
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    if (keys.length > maximumLength + 2) {
      addIssue(
        issues,
        'input-contract',
        path,
        'property-limit-exceeded',
        'array has too many own properties for the bounded audit',
      );
      return undefined;
    }
    const expectedIndices = new Set(Array.from({ length }, (_, index) => String(index)));
    for (const key of [...keys].sort(comparePropertyKeys)) {
      if (key === 'length') continue;
      if (typeof key !== 'string' || !expectedIndices.has(key)) {
        addIssue(
          issues,
          'input-contract',
          `${path}.${diagnosticPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the dense-array contract',
        );
      }
    }
    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const entryPath = `${path}[${String(index)}]`;
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, String(index));
      if (descriptor === undefined) {
        addIssue(issues, 'input-contract', entryPath, 'missing-property', 'array entry is missing');
      } else if (!('value' in descriptor)) {
        addIssue(
          issues,
          'input-contract',
          entryPath,
          'accessor-property',
          'array accessors are not input data',
        );
      } else if (!descriptor.enumerable) {
        addIssue(
          issues,
          'input-contract',
          entryPath,
          'invalid-property',
          'array entries must be enumerable',
        );
      } else {
        values.push(descriptor.value);
      }
    }
    return values;
  } catch {
    addIssue(
      issues,
      'input-contract',
      path,
      'inspection-failed',
      'array properties could not be inspected safely',
    );
    return undefined;
  }
}

function parseLiteral<T extends string | number>(
  value: unknown,
  expected: T,
  path: string,
  issues: Issue[],
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
  issues: Issue[],
): CoordinateEncoding | undefined {
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

function parseBoundedString(value: unknown, path: string, issues: Issue[]): string | undefined {
  if (typeof value !== 'string') {
    addIssue(issues, 'input-contract', path, 'expected-string', 'must be a string');
    return undefined;
  }
  if (
    value.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxMetadataStringCodeUnits
  ) {
    addIssue(
      issues,
      'input-contract',
      path,
      'string-limit-exceeded',
      `string exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxMetadataStringCodeUnits)} code units`,
    );
    return undefined;
  }
  return value;
}

function parseStableId(value: unknown, path: string, issues: Issue[]): string | undefined {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxIdCodeUnits ||
    !STABLE_ID_PATTERN.test(value)
  ) {
    addIssue(
      issues,
      'input-contract',
      path,
      'invalid-id',
      `must be a stable ASCII ID of 1..${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxIdCodeUnits)} characters`,
    );
    return undefined;
  }
  return value;
}

function parseBoolean(value: unknown, path: string, issues: Issue[]): boolean | undefined {
  if (typeof value !== 'boolean') {
    addIssue(issues, 'input-contract', path, 'expected-boolean', 'must be a boolean');
    return undefined;
  }
  return value;
}

function parseNonnegativeSafeInteger(
  value: unknown,
  maximum: number,
  path: string,
  issues: Issue[],
): number | undefined {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    addIssue(
      issues,
      'input-contract',
      path,
      'expected-safe-integer',
      'must be a nonnegative safe integer',
    );
    return undefined;
  }
  if (value > maximum) {
    addIssue(
      issues,
      'input-contract',
      path,
      'integer-limit-exceeded',
      `integer exceeds ${String(maximum)}`,
    );
    return undefined;
  }
  return value;
}

function parseClassification(
  value: unknown,
  path: string,
  issues: Issue[],
): StaticRationalTriangleOverlapAuditClassification | undefined {
  if (
    value !== 'disjoint' &&
    value !== 'intersecting-coplanar' &&
    value !== 'intersecting-noncoplanar'
  ) {
    addIssue(
      issues,
      'input-contract',
      path,
      'invalid-classification',
      'must be one declared static classification',
    );
    return undefined;
  }
  return value;
}

function parseIncidenceClass(
  value: unknown,
  path: string,
  issues: Issue[],
): StaticRationalTriangleOverlapCensusAuditIncidenceClass | undefined {
  if (
    value !== 'nonincident' &&
    value !== 'shared-vertex' &&
    value !== 'shared-edge' &&
    value !== 'coincident-triangle'
  ) {
    addIssue(
      issues,
      'input-contract',
      path,
      'invalid-incidence-class',
      'must be one declared raw incidence class',
    );
    return undefined;
  }
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

function parseCoordinate(
  value: unknown,
  encoding: CoordinateEncoding,
  path: string,
  issues: Issue[],
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
        'expected-canonical-decimal',
        'coordinate must be canonical decimal text',
      );
      return undefined;
    }
    const digitCount = value.startsWith('-') ? value.length - 1 : value.length;
    if (
      digitCount > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateDecimalDigits
    ) {
      addIssue(
        issues,
        'input-contract',
        path,
        'decimal-digit-limit-exceeded',
        `coordinate exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateDecimalDigits)} decimal digits`,
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
  if (
    parsed >= MAX_COORDINATE_MAGNITUDE_EXCLUSIVE ||
    parsed <= -MAX_COORDINATE_MAGNITUDE_EXCLUSIVE
  ) {
    addIssue(
      issues,
      'input-contract',
      path,
      'coordinate-limit-exceeded',
      `coordinate exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateBits)} bits`,
    );
    return undefined;
  }
  return parsed;
}

function parsePoint(
  supplied: unknown,
  encoding: CoordinateEncoding,
  path: string,
  issues: Issue[],
): StaticRationalTriangleOverlapCensusAuditPoint3 | undefined {
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

type IntegerVector3 = readonly [x: bigint, y: bigint, z: bigint];

function affineDifferenceNumerator(
  base: StaticRationalTriangleOverlapCensusAuditPoint3,
  other: StaticRationalTriangleOverlapCensusAuditPoint3,
): IntegerVector3 {
  return [
    other.x * base.w - base.x * other.w,
    other.y * base.w - base.y * other.w,
    other.z * base.w - base.z * other.w,
  ];
}

function triangleIsDegenerate(
  triangle: StaticRationalTriangleOverlapCensusAuditTriangle3,
): boolean {
  const first = affineDifferenceNumerator(triangle[0], triangle[1]);
  const second = affineDifferenceNumerator(triangle[0], triangle[2]);
  const cross: IntegerVector3 = [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  ];
  return cross[0] === 0n && cross[1] === 0n && cross[2] === 0n;
}

function parseTriangle(
  supplied: unknown,
  encoding: CoordinateEncoding,
  path: string,
  issues: Issue[],
): StaticRationalTriangleOverlapCensusAuditTriangle3 | undefined {
  const values = inspectDenseArray(supplied, path, 3, issues);
  if (values === undefined) return undefined;
  if (values.length !== 3) {
    addIssue(
      issues,
      'input-contract',
      path,
      'expected-triangle',
      'triangle must contain exactly three vertices',
    );
    return undefined;
  }
  const first = parsePoint(values[0], encoding, `${path}[0]`, issues);
  const second = parsePoint(values[1], encoding, `${path}[1]`, issues);
  const third = parsePoint(values[2], encoding, `${path}[2]`, issues);
  if (first === undefined || second === undefined || third === undefined) return undefined;
  const triangle: StaticRationalTriangleOverlapCensusAuditTriangle3 = Object.freeze([
    first,
    second,
    third,
  ]);
  if (triangleIsDegenerate(triangle)) {
    addIssue(
      issues,
      'input-contract',
      path,
      'degenerate-triangle',
      'three vertices must span a nonzero-area affine triangle',
    );
    return undefined;
  }
  return triangle;
}

function parseTriangleEntry(
  supplied: unknown,
  encoding: CoordinateEncoding,
  index: number,
  issues: Issue[],
): TrustedStaticRationalTriangleOverlapCensusAuditTriangleV1 | undefined {
  const path = `$.triangles[${String(index)}]`;
  const inspected = inspectClosedObject(supplied, path, ENTRY_KEYS, issues);
  if (inspected === undefined) return undefined;
  const triangleId = parseStableId(
    descriptorValue(inspected, 'triangleId'),
    `${path}.triangleId`,
    issues,
  );
  const triangle = parseTriangle(
    descriptorValue(inspected, 'triangle'),
    encoding,
    `${path}.triangle`,
    issues,
  );
  return triangleId === undefined || triangle === undefined
    ? undefined
    : Object.freeze({ triangleId, triangle });
}

function parseTriangleEntries(
  supplied: unknown,
  encoding: CoordinateEncoding,
  issues: Issue[],
): TrustedStaticRationalTriangleOverlapCensusAuditTriangleV1[] | undefined {
  const values = inspectDenseArray(
    supplied,
    '$.triangles',
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxTriangles,
    issues,
  );
  if (values === undefined) return undefined;
  const entries: Readonly<{
    sourceIndex: number;
    value: TrustedStaticRationalTriangleOverlapCensusAuditTriangleV1;
  }>[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const entry = parseTriangleEntry(values[index], encoding, index, issues);
    if (entry !== undefined) entries.push(Object.freeze({ sourceIndex: index, value: entry }));
  }
  const firstIndexById = new Map<string, number>();
  for (const entry of entries) {
    const firstIndex = firstIndexById.get(entry.value.triangleId);
    if (firstIndex === undefined) firstIndexById.set(entry.value.triangleId, entry.sourceIndex);
    else {
      addIssue(
        issues,
        'input-contract',
        `$.triangles[${String(entry.sourceIndex)}].triangleId`,
        'duplicate-id',
        `triangleId duplicates $.triangles[${String(firstIndex)}].triangleId`,
      );
    }
  }
  entries.sort((left, right) =>
    left.value.triangleId < right.value.triangleId
      ? -1
      : left.value.triangleId > right.value.triangleId
        ? 1
        : 0,
  );
  return entries.map((entry) => entry.value);
}

function parseStableIdArray(
  supplied: unknown,
  path: string,
  issues: Issue[],
): readonly string[] | undefined {
  const values = inspectDenseArray(
    supplied,
    path,
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxTriangles,
    issues,
  );
  if (values === undefined) return undefined;
  const ids: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const id = parseStableId(values[index], `${path}[${String(index)}]`, issues);
    if (id !== undefined) ids.push(id);
  }
  return ids;
}

function parseProducerPair(
  supplied: unknown,
  index: number,
  issues: Issue[],
): StaticRationalTriangleOverlapCensusProducerPairSnapshotV1 | undefined {
  const path = `$.producer.pairs[${String(index)}]`;
  const inspected = inspectClosedObject(supplied, path, PAIR_KEYS, issues);
  if (inspected === undefined) return undefined;
  const pairIndex = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'pairIndex'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.pairIndex`,
    issues,
  );
  const firstTriangleId = parseStableId(
    descriptorValue(inspected, 'firstTriangleId'),
    `${path}.firstTriangleId`,
    issues,
  );
  const secondTriangleId = parseStableId(
    descriptorValue(inspected, 'secondTriangleId'),
    `${path}.secondTriangleId`,
    issues,
  );
  const sharedCanonicalVertexCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'sharedCanonicalVertexCount'),
    3,
    `${path}.sharedCanonicalVertexCount`,
    issues,
  );
  const incidenceBasis = parseBoundedString(
    descriptorValue(inspected, 'incidenceBasis'),
    `${path}.incidenceBasis`,
    issues,
  );
  const incidenceClass = parseIncidenceClass(
    descriptorValue(inspected, 'incidenceClass'),
    `${path}.incidenceClass`,
    issues,
  );
  const staticClassification = parseClassification(
    descriptorValue(inspected, 'staticClassification'),
    `${path}.staticClassification`,
    issues,
  );
  const closedTrianglesIntersect = parseBoolean(
    descriptorValue(inspected, 'closedTrianglesIntersect'),
    `${path}.closedTrianglesIntersect`,
    issues,
  );
  if (
    pairIndex === undefined ||
    firstTriangleId === undefined ||
    secondTriangleId === undefined ||
    sharedCanonicalVertexCount === undefined ||
    incidenceBasis === undefined ||
    incidenceClass === undefined ||
    staticClassification === undefined ||
    closedTrianglesIntersect === undefined
  ) {
    return undefined;
  }
  return Object.freeze({
    pairIndex,
    firstTriangleId,
    secondTriangleId,
    sharedCanonicalVertexCount,
    incidenceBasis,
    incidenceClass,
    staticClassification,
    closedTrianglesIntersect,
  });
}

function parseProducerPairs(
  supplied: unknown,
  issues: Issue[],
): readonly StaticRationalTriangleOverlapCensusProducerPairSnapshotV1[] | undefined {
  const values = inspectDenseArray(
    supplied,
    '$.producer.pairs',
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    issues,
  );
  if (values === undefined) return undefined;
  const pairs: StaticRationalTriangleOverlapCensusProducerPairSnapshotV1[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const pair = parseProducerPair(values[index], index, issues);
    if (pair !== undefined) pairs.push(pair);
  }
  return pairs;
}

function parseProducer(
  supplied: unknown,
  issues: Issue[],
): StaticRationalTriangleOverlapCensusProducerSnapshotV1 | undefined {
  const path = '$.producer';
  const inspected = inspectClosedObject(supplied, path, PRODUCER_KEYS, issues);
  if (inspected === undefined) return undefined;
  const schemaVersion = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'schemaVersion'),
    Number.MAX_SAFE_INTEGER,
    `${path}.schemaVersion`,
    issues,
  );
  const recordType = parseBoundedString(
    descriptorValue(inspected, 'recordType'),
    `${path}.recordType`,
    issues,
  );
  const contractStatus = parseBoundedString(
    descriptorValue(inspected, 'contractStatus'),
    `${path}.contractStatus`,
    issues,
  );
  const predicateScope = parseBoundedString(
    descriptorValue(inspected, 'predicateScope'),
    `${path}.predicateScope`,
    issues,
  );
  const arithmetic = parseBoundedString(
    descriptorValue(inspected, 'arithmetic'),
    `${path}.arithmetic`,
    issues,
  );
  const triangleOrder = parseBoundedString(
    descriptorValue(inspected, 'triangleOrder'),
    `${path}.triangleOrder`,
    issues,
  );
  const pairOrder = parseBoundedString(
    descriptorValue(inspected, 'pairOrder'),
    `${path}.pairOrder`,
    issues,
  );
  const incidenceBasis = parseBoundedString(
    descriptorValue(inspected, 'incidenceBasis'),
    `${path}.incidenceBasis`,
    issues,
  );
  const triangleIds = parseStableIdArray(
    descriptorValue(inspected, 'triangleIds'),
    `${path}.triangleIds`,
    issues,
  );
  const triangleCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'triangleCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxTriangles,
    `${path}.triangleCount`,
    issues,
  );
  const unorderedPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'unorderedPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.unorderedPairCount`,
    issues,
  );
  const disjointPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'disjointPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.disjointPairCount`,
    issues,
  );
  const overlapPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'overlapPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.overlapPairCount`,
    issues,
  );
  const coplanarOverlapPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'coplanarOverlapPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.coplanarOverlapPairCount`,
    issues,
  );
  const noncoplanarOverlapPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'noncoplanarOverlapPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.noncoplanarOverlapPairCount`,
    issues,
  );
  const nonincidentPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'nonincidentPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.nonincidentPairCount`,
    issues,
  );
  const sharedVertexPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'sharedVertexPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.sharedVertexPairCount`,
    issues,
  );
  const sharedEdgePairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'sharedEdgePairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.sharedEdgePairCount`,
    issues,
  );
  const coincidentTrianglePairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'coincidentTrianglePairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.coincidentTrianglePairCount`,
    issues,
  );
  const nonincidentOverlapPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'nonincidentOverlapPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.nonincidentOverlapPairCount`,
    issues,
  );
  const incidentOverlapPairCount = parseNonnegativeSafeInteger(
    descriptorValue(inspected, 'incidentOverlapPairCount'),
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
    `${path}.incidentOverlapPairCount`,
    issues,
  );
  const pairs = parseProducerPairs(descriptorValue(inspected, 'pairs'), issues);
  const allUnorderedPairsIncluded = parseBoolean(
    descriptorValue(inspected, 'allUnorderedPairsIncluded'),
    `${path}.allUnorderedPairsIncluded`,
    issues,
  );
  const silentPairExclusionIncluded = parseBoolean(
    descriptorValue(inspected, 'silentPairExclusionIncluded'),
    `${path}.silentPairExclusionIncluded`,
    issues,
  );
  const boundaryContactCountsAsIntersection = parseBoolean(
    descriptorValue(inspected, 'boundaryContactCountsAsIntersection'),
    `${path}.boundaryContactCountsAsIntersection`,
    issues,
  );
  const rawCensusOnly = parseBoolean(
    descriptorValue(inspected, 'rawCensusOnly'),
    `${path}.rawCensusOnly`,
    issues,
  );
  const staticPredicateIncluded = parseBoolean(
    descriptorValue(inspected, 'staticPredicateIncluded'),
    `${path}.staticPredicateIncluded`,
    issues,
  );
  const meshAdjacencyDecisionIncluded = parseBoolean(
    descriptorValue(inspected, 'meshAdjacencyDecisionIncluded'),
    `${path}.meshAdjacencyDecisionIncluded`,
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
  const selfIntersectionDecisionIncluded = parseBoolean(
    descriptorValue(inspected, 'selfIntersectionDecisionIncluded'),
    `${path}.selfIntersectionDecisionIncluded`,
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
  const isSupportProfile = parseBoolean(
    descriptorValue(inspected, 'isSupportProfile'),
    `${path}.isSupportProfile`,
    issues,
  );
  const supportClaim = parseBoolean(
    descriptorValue(inspected, 'supportClaim'),
    `${path}.supportClaim`,
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
    triangleOrder === undefined ||
    pairOrder === undefined ||
    incidenceBasis === undefined ||
    triangleIds === undefined ||
    triangleCount === undefined ||
    unorderedPairCount === undefined ||
    disjointPairCount === undefined ||
    overlapPairCount === undefined ||
    coplanarOverlapPairCount === undefined ||
    noncoplanarOverlapPairCount === undefined ||
    nonincidentPairCount === undefined ||
    sharedVertexPairCount === undefined ||
    sharedEdgePairCount === undefined ||
    coincidentTrianglePairCount === undefined ||
    nonincidentOverlapPairCount === undefined ||
    incidentOverlapPairCount === undefined ||
    pairs === undefined ||
    allUnorderedPairsIncluded === undefined ||
    silentPairExclusionIncluded === undefined ||
    boundaryContactCountsAsIntersection === undefined ||
    rawCensusOnly === undefined ||
    staticPredicateIncluded === undefined ||
    meshAdjacencyDecisionIncluded === undefined ||
    legalContactClassificationIncluded === undefined ||
    penetrationClassificationIncluded === undefined ||
    selfIntersectionDecisionIncluded === undefined ||
    collisionFreeClaim === undefined ||
    continuousTimeIncluded === undefined ||
    continuousCollisionDetectionIncluded === undefined ||
    rigidMotionIntervalIncluded === undefined ||
    isSupportProfile === undefined ||
    supportClaim === undefined ||
    verifiedClaim === undefined ||
    globalM0fGo === undefined
  ) {
    return undefined;
  }
  return deepFreezeOwned({
    schemaVersion,
    recordType,
    contractStatus,
    predicateScope,
    arithmetic,
    triangleOrder,
    pairOrder,
    incidenceBasis,
    triangleIds: [...triangleIds],
    triangleCount,
    unorderedPairCount,
    disjointPairCount,
    overlapPairCount,
    coplanarOverlapPairCount,
    noncoplanarOverlapPairCount,
    nonincidentPairCount,
    sharedVertexPairCount,
    sharedEdgePairCount,
    coincidentTrianglePairCount,
    nonincidentOverlapPairCount,
    incidentOverlapPairCount,
    pairs: [...pairs],
    allUnorderedPairsIncluded,
    silentPairExclusionIncluded,
    boundaryContactCountsAsIntersection,
    rawCensusOnly,
    staticPredicateIncluded,
    meshAdjacencyDecisionIncluded,
    legalContactClassificationIncluded,
    penetrationClassificationIncluded,
    selfIntersectionDecisionIncluded,
    collisionFreeClaim,
    continuousTimeIncluded,
    continuousCollisionDetectionIncluded,
    rigidMotionIntervalIncluded,
    isSupportProfile,
    supportClaim,
    verifiedClaim,
    globalM0fGo,
  });
}

/** Parses, canonicalizes, and deeply freezes one hostile portable snapshot. */
export function parseStaticRationalTriangleOverlapCensusAuditInputV1(
  supplied: unknown,
): ParseStaticRationalTriangleOverlapCensusAuditInputResultV1 {
  const issues: Issue[] = [];
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
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
      '$.recordType',
      issues,
    );
    const encoding = parseEncoding(
      descriptorValue(root, 'coordinateEncoding'),
      '$.coordinateEncoding',
      issues,
    );
    const triangles =
      encoding === undefined
        ? undefined
        : parseTriangleEntries(descriptorValue(root, 'triangles'), encoding, issues);
    const producer = parseProducer(descriptorValue(root, 'producer'), issues);
    if (
      issues.length > 0 ||
      schemaVersion === undefined ||
      recordType === undefined ||
      encoding === undefined ||
      triangles === undefined ||
      producer === undefined
    ) {
      return parseFailure(issues);
    }
    return deepFreezeOwned({
      ok: true as const,
      value: {
        triangles: triangles.map((entry) => ({
          triangleId: entry.triangleId,
          triangle: entry.triangle,
        })),
        producer,
      },
    });
  } catch {
    if (issues.length === 0) {
      addIssue(
        issues,
        'input-contract',
        '$',
        'inspection-failed',
        'whole-census audit input could not be inspected safely',
      );
    }
    return parseFailure(issues);
  }
}

function equalCanonicalPoints(
  left: StaticRationalTriangleOverlapCensusAuditPoint3,
  right: StaticRationalTriangleOverlapCensusAuditPoint3,
): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z && left.w === right.w;
}

function sharedCanonicalVertexCount(
  left: StaticRationalTriangleOverlapCensusAuditTriangle3,
  right: StaticRationalTriangleOverlapCensusAuditTriangle3,
): 0 | 1 | 2 | 3 {
  let count = 0;
  for (const leftPoint of left) {
    if (right.some((rightPoint) => equalCanonicalPoints(leftPoint, rightPoint))) count += 1;
  }
  if (count === 0 || count === 1 || count === 2 || count === 3) return count;
  throw new RangeError('nondegenerate triangles cannot share more than three canonical vertices');
}

function incidenceClass(
  shared: 0 | 1 | 2 | 3,
): StaticRationalTriangleOverlapCensusAuditIncidenceClass {
  return shared === 0
    ? 'nonincident'
    : shared === 1
      ? 'shared-vertex'
      : shared === 2
        ? 'shared-edge'
        : 'coincident-triangle';
}

function pairProducerSnapshot(
  classification: StaticRationalTriangleOverlapAuditClassification,
  closedTrianglesIntersect: boolean,
): StaticRationalTriangleOverlapProducerSnapshotV1 {
  return {
    schemaVersion: 1,
    recordType: 'm0f-static-rational-triangle-overlap',
    contractStatus: 'candidate-no-claim',
    predicateScope: 'one-static-configuration-of-two-closed-triangles',
    arithmetic: 'exact-projective-rational-bigint',
    classification,
    closedTrianglesIntersect,
    boundaryContactCountsAsIntersection: true,
    staticPredicateIncluded: true,
    legalContactClassificationIncluded: false,
    penetrationClassificationIncluded: false,
    collisionFreeClaim: false,
    continuousTimeIncluded: false,
    continuousCollisionDetectionIncluded: false,
    rigidMotionIntervalIncluded: false,
    verifiedClaim: false,
    globalM0fGo: false,
  };
}

type DependencyDataRecord = Readonly<{
  keys: readonly string[];
  values: Readonly<Record<string, unknown>>;
}>;

function snapshotDependencyDataRecord(
  supplied: unknown,
  maximumKeys: number,
): DependencyDataRecord | undefined {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
    return undefined;
  }
  try {
    const prototype: unknown = Reflect.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    const ownKeys = Reflect.ownKeys(supplied);
    if (ownKeys.length > maximumKeys || ownKeys.some((key) => typeof key !== 'string')) {
      return undefined;
    }
    const keys = ownKeys as string[];
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(supplied, key);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
      values[key] = descriptor.value;
    }
    return Object.freeze({ keys: Object.freeze([...keys]), values: Object.freeze(values) });
  } catch {
    return undefined;
  }
}

function dependencyRecordHasExactKeys(
  record: DependencyDataRecord,
  expectedKeys: readonly string[],
): boolean {
  if (record.keys.length !== expectedKeys.length) return false;
  const actual = new Set(record.keys);
  return expectedKeys.every((key) => actual.has(key));
}

function snapshotDependencyDenseArray(
  supplied: unknown,
  maximumLength: number,
): readonly unknown[] | undefined {
  if (typeof supplied !== 'object' || supplied === null) return undefined;
  try {
    if (!Array.isArray(supplied) || Reflect.getPrototypeOf(supplied) !== Array.prototype) {
      return undefined;
    }
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(supplied, 'length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      typeof lengthDescriptor.value !== 'number' ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 1 ||
      lengthDescriptor.value > maximumLength
    ) {
      return undefined;
    }
    const length = lengthDescriptor.value;
    const keys = Reflect.ownKeys(supplied);
    const expected = new Set(['length', ...Array.from({ length }, (_, index) => String(index))]);
    if (
      keys.length !== length + 1 ||
      keys.some((key) => typeof key !== 'string' || !expected.has(key))
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
    return Object.freeze(values);
  } catch {
    return undefined;
  }
}

function pairAuditIssuesValid(supplied: unknown): boolean {
  const entries = snapshotDependencyDenseArray(
    supplied,
    STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_LIMITS.maxIssues,
  );
  if (entries === undefined) return false;
  return entries.every((entry) => {
    const record = snapshotDependencyDataRecord(entry, PAIR_AUDIT_ISSUE_KEYS.length);
    if (record === undefined || !dependencyRecordHasExactKeys(record, PAIR_AUDIT_ISSUE_KEYS)) {
      return false;
    }
    const stage = record.values.stage;
    return (
      (stage === 'input-contract' ||
        stage === 'producer-consistency' ||
        stage === 'audit-internal') &&
      typeof record.values.path === 'string' &&
      typeof record.values.code === 'string' &&
      typeof record.values.message === 'string'
    );
  });
}

type ValidatedPairAuditDependencyResult =
  | Readonly<{ kind: 'decisionless-failure' }>
  | Readonly<{ kind: 'invalid-contract' }>
  | Readonly<{
      kind: 'decision';
      consistent: boolean;
      auditedClassification: StaticRationalTriangleOverlapAuditClassification;
      auditedClosedTrianglesIntersect: boolean;
    }>;

function validatePairAuditDependencyResult(
  supplied: unknown,
  producerClassification: StaticRationalTriangleOverlapAuditClassification,
  producerClosedTrianglesIntersect: boolean,
): ValidatedPairAuditDependencyResult {
  const outer = snapshotDependencyDataRecord(supplied, 3);
  if (outer === undefined || typeof outer.values.ok !== 'boolean') {
    return Object.freeze({ kind: 'invalid-contract' as const });
  }
  const ok = outer.values.ok;
  const hasValue = outer.keys.includes('value');
  if (!ok && !hasValue) {
    return dependencyRecordHasExactKeys(outer, ['ok', 'error']) &&
      pairAuditIssuesValid(outer.values.error)
      ? Object.freeze({ kind: 'decisionless-failure' as const })
      : Object.freeze({ kind: 'invalid-contract' as const });
  }
  const expectedOuterKeys = ok ? (['ok', 'value'] as const) : (['ok', 'value', 'error'] as const);
  if (
    !dependencyRecordHasExactKeys(outer, expectedOuterKeys) ||
    (!ok && !pairAuditIssuesValid(outer.values.error))
  ) {
    return Object.freeze({ kind: 'invalid-contract' as const });
  }
  const decision = snapshotDependencyDataRecord(
    outer.values.value,
    PAIR_AUDIT_DECISION_KEYS.length,
  );
  if (decision === undefined || !dependencyRecordHasExactKeys(decision, PAIR_AUDIT_DECISION_KEYS)) {
    return Object.freeze({ kind: 'invalid-contract' as const });
  }
  const auditedClassification = decision.values.auditedClassification;
  const auditedClosedTrianglesIntersect = decision.values.auditedClosedTrianglesIntersect;
  const classificationValid =
    auditedClassification === 'disjoint' ||
    auditedClassification === 'intersecting-coplanar' ||
    auditedClassification === 'intersecting-noncoplanar';
  const consistent = ok;
  const producerMatches =
    auditedClassification === producerClassification &&
    auditedClosedTrianglesIntersect === producerClosedTrianglesIntersect;
  if (
    !classificationValid ||
    typeof auditedClosedTrianglesIntersect !== 'boolean' ||
    decision.values.schemaVersion !== 1 ||
    decision.values.recordType !== STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_RESULT_RECORD_TYPE ||
    decision.values.contractStatus !== 'candidate-no-claim' ||
    decision.values.scientificClaim !== false ||
    decision.values.auditScope !== 'one-static-configuration-of-two-closed-triangles' ||
    decision.values.implementationRole !== 'independent-auditor' ||
    decision.values.verificationIndependence !==
      'exact-barycentric-replay-without-producer-or-shared-3d-kernel' ||
    decision.values.exactBarycentricFeasibilityIncluded !== true ||
    decision.values.staticPredicateIncluded !== true ||
    auditedClosedTrianglesIntersect !== (auditedClassification !== 'disjoint') ||
    decision.values.producerClassification !== producerClassification ||
    decision.values.producerClosedTrianglesIntersect !== producerClosedTrianglesIntersect ||
    decision.values.producerRecordMatched !== consistent ||
    decision.values.boundaryContactCountsAsIntersection !== true ||
    decision.values.legalContactClassificationIncluded !== false ||
    decision.values.penetrationClassificationIncluded !== false ||
    decision.values.collisionFreeClaim !== false ||
    decision.values.continuousTimeIncluded !== false ||
    decision.values.continuousCollisionDetectionIncluded !== false ||
    decision.values.rigidMotionIntervalIncluded !== false ||
    decision.values.verifiedClaim !== false ||
    decision.values.globalM0fGo !== false ||
    decision.values.auditOutcome !== (consistent ? 'consistent' : 'inconsistent') ||
    producerMatches !== consistent
  ) {
    return Object.freeze({ kind: 'invalid-contract' as const });
  }
  return Object.freeze({
    kind: 'decision' as const,
    consistent,
    auditedClassification,
    auditedClosedTrianglesIntersect,
  });
}

function checkField(
  actual: unknown,
  expected: unknown,
  path: string,
  issues: Issue[],
  code: 'producer-field-mismatch' | 'pair-field-mismatch' = 'producer-field-mismatch',
): void {
  if (Object.is(actual, expected)) return;
  addIssue(
    issues,
    'producer-consistency',
    path,
    code,
    'producer field does not match the independent whole-census replay',
  );
}

function checkProducerFixedContract(
  producer: StaticRationalTriangleOverlapCensusProducerSnapshotV1,
  issues: Issue[],
): void {
  checkField(producer.schemaVersion, 1, '$.producer.schemaVersion', issues);
  checkField(
    producer.recordType,
    'm0f-static-rational-triangle-overlap-census',
    '$.producer.recordType',
    issues,
  );
  checkField(producer.contractStatus, 'candidate-no-claim', '$.producer.contractStatus', issues);
  checkField(
    producer.predicateScope,
    'one-static-configuration-all-unordered-closed-triangle-pairs',
    '$.producer.predicateScope',
    issues,
  );
  checkField(
    producer.arithmetic,
    'exact-projective-rational-bigint-with-bounded-safe-integer-counts',
    '$.producer.arithmetic',
    issues,
  );
  checkField(producer.triangleOrder, 'triangle-id-code-unit', '$.producer.triangleOrder', issues);
  checkField(
    producer.pairOrder,
    'first-triangle-id-then-second-triangle-id-code-unit',
    '$.producer.pairOrder',
    issues,
  );
  checkField(
    producer.incidenceBasis,
    'shared-canonical-vertex-count-only-not-mesh-topology',
    '$.producer.incidenceBasis',
    issues,
  );
  checkField(
    producer.allUnorderedPairsIncluded,
    true,
    '$.producer.allUnorderedPairsIncluded',
    issues,
  );
  checkField(
    producer.silentPairExclusionIncluded,
    false,
    '$.producer.silentPairExclusionIncluded',
    issues,
  );
  checkField(
    producer.boundaryContactCountsAsIntersection,
    true,
    '$.producer.boundaryContactCountsAsIntersection',
    issues,
  );
  checkField(producer.rawCensusOnly, true, '$.producer.rawCensusOnly', issues);
  checkField(producer.staticPredicateIncluded, true, '$.producer.staticPredicateIncluded', issues);
  checkField(
    producer.meshAdjacencyDecisionIncluded,
    false,
    '$.producer.meshAdjacencyDecisionIncluded',
    issues,
  );
  checkField(
    producer.legalContactClassificationIncluded,
    false,
    '$.producer.legalContactClassificationIncluded',
    issues,
  );
  checkField(
    producer.penetrationClassificationIncluded,
    false,
    '$.producer.penetrationClassificationIncluded',
    issues,
  );
  checkField(
    producer.selfIntersectionDecisionIncluded,
    false,
    '$.producer.selfIntersectionDecisionIncluded',
    issues,
  );
  checkField(producer.collisionFreeClaim, false, '$.producer.collisionFreeClaim', issues);
  checkField(producer.continuousTimeIncluded, false, '$.producer.continuousTimeIncluded', issues);
  checkField(
    producer.continuousCollisionDetectionIncluded,
    false,
    '$.producer.continuousCollisionDetectionIncluded',
    issues,
  );
  checkField(
    producer.rigidMotionIntervalIncluded,
    false,
    '$.producer.rigidMotionIntervalIncluded',
    issues,
  );
  checkField(producer.isSupportProfile, false, '$.producer.isSupportProfile', issues);
  checkField(producer.supportClaim, false, '$.producer.supportClaim', issues);
  checkField(producer.verifiedClaim, false, '$.producer.verifiedClaim', issues);
  checkField(producer.globalM0fGo, false, '$.producer.globalM0fGo', issues);
}

function checkTriangleIds(
  producerIds: readonly string[],
  expectedIds: readonly string[],
  issues: Issue[],
): void {
  if (producerIds.length !== expectedIds.length) {
    addIssue(
      issues,
      'producer-consistency',
      '$.producer.triangleIds',
      'producer-array-length-mismatch',
      'producer triangle ID count does not match the canonical input set',
    );
  }
  for (let index = 0; index < expectedIds.length; index += 1) {
    checkField(
      producerIds[index],
      expectedIds[index],
      `$.producer.triangleIds[${String(index)}]`,
      issues,
    );
  }
}

function checkPairIncidenceContract(
  pair: StaticRationalTriangleOverlapCensusProducerPairSnapshotV1,
  pairPosition: number,
  issues: Issue[],
): void {
  const path = `$.producer.pairs[${String(pairPosition)}]`;
  if (pair.sharedCanonicalVertexCount > 0 && pair.staticClassification === 'disjoint') {
    addIssue(
      issues,
      'producer-consistency',
      `${path}.staticClassification`,
      'incidence-invariant',
      'a pair sharing a canonical vertex cannot be disjoint as a closed-set predicate',
    );
  }
  if (
    pair.sharedCanonicalVertexCount === 3 &&
    pair.staticClassification !== 'intersecting-coplanar'
  ) {
    addIssue(
      issues,
      'producer-consistency',
      `${path}.staticClassification`,
      'incidence-invariant',
      'a pair sharing all three canonical vertices must be coplanar-intersecting',
    );
  }
}

function decisionRecord(
  outcome: 'consistent',
  summary: AuditedCensusSummary,
): StaticRationalTriangleOverlapCensusAuditConsistentV1;
function decisionRecord(
  outcome: 'inconsistent',
  summary: AuditedCensusSummary,
): StaticRationalTriangleOverlapCensusAuditInconsistentV1;
function decisionRecord(
  outcome: 'consistent' | 'inconsistent',
  summary: AuditedCensusSummary,
):
  | StaticRationalTriangleOverlapCensusAuditConsistentV1
  | StaticRationalTriangleOverlapCensusAuditInconsistentV1 {
  const base = {
    schemaVersion: 1 as const,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_RESULT_RECORD_TYPE,
    contractStatus: 'candidate-no-claim' as const,
    scientificClaim: false as const,
    auditScope: 'one-static-configuration-all-unordered-closed-triangle-pairs' as const,
    implementationRole: 'independent-whole-census-auditor' as const,
    verificationIndependence:
      'canonical-census-replay-using-independent-exact-barycentric-pair-auditor' as const,
    wholeCensusReplayIncluded: true as const,
    independentPairAuditIncluded: true as const,
    allExpectedUnorderedPairsReplayed: true as const,
    rawIncidenceRecomputed: true as const,
    auditedTriangleIds: [...summary.triangleIds],
    auditedTriangleCount: summary.triangleCount,
    auditedUnorderedPairCount: summary.unorderedPairCount,
    auditedDisjointPairCount: summary.disjointPairCount,
    auditedOverlapPairCount: summary.overlapPairCount,
    auditedCoplanarOverlapPairCount: summary.coplanarOverlapPairCount,
    auditedNoncoplanarOverlapPairCount: summary.noncoplanarOverlapPairCount,
    auditedNonincidentPairCount: summary.nonincidentPairCount,
    auditedSharedVertexPairCount: summary.sharedVertexPairCount,
    auditedSharedEdgePairCount: summary.sharedEdgePairCount,
    auditedCoincidentTrianglePairCount: summary.coincidentTrianglePairCount,
    auditedNonincidentOverlapPairCount: summary.nonincidentOverlapPairCount,
    auditedIncidentOverlapPairCount: summary.incidentOverlapPairCount,
    boundaryContactCountsAsIntersection: true as const,
    rawCensusOnly: true as const,
    staticPredicateIncluded: true as const,
    meshAdjacencyDecisionIncluded: false as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    selfIntersectionDecisionIncluded: false as const,
    collisionFreeClaim: false as const,
    continuousTimeIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    rigidMotionIntervalIncluded: false as const,
    isSupportProfile: false as const,
    supportClaim: false as const,
    verifiedClaim: false as const,
    globalM0fGo: false as const,
  };
  return outcome === 'consistent'
    ? deepFreezeOwned({
        ...base,
        auditOutcome: 'consistent' as const,
        producerRecordMatched: true as const,
      })
    : deepFreezeOwned({
        ...base,
        auditOutcome: 'inconsistent' as const,
        producerRecordMatched: false as const,
      });
}

function checkSummaryCounters(
  producer: StaticRationalTriangleOverlapCensusProducerSnapshotV1,
  summary: AuditedCensusSummary,
  issues: Issue[],
): void {
  checkField(producer.triangleCount, summary.triangleCount, '$.producer.triangleCount', issues);
  checkField(
    producer.unorderedPairCount,
    summary.unorderedPairCount,
    '$.producer.unorderedPairCount',
    issues,
  );
  checkField(
    producer.disjointPairCount,
    summary.disjointPairCount,
    '$.producer.disjointPairCount',
    issues,
  );
  checkField(
    producer.overlapPairCount,
    summary.overlapPairCount,
    '$.producer.overlapPairCount',
    issues,
  );
  checkField(
    producer.coplanarOverlapPairCount,
    summary.coplanarOverlapPairCount,
    '$.producer.coplanarOverlapPairCount',
    issues,
  );
  checkField(
    producer.noncoplanarOverlapPairCount,
    summary.noncoplanarOverlapPairCount,
    '$.producer.noncoplanarOverlapPairCount',
    issues,
  );
  checkField(
    producer.nonincidentPairCount,
    summary.nonincidentPairCount,
    '$.producer.nonincidentPairCount',
    issues,
  );
  checkField(
    producer.sharedVertexPairCount,
    summary.sharedVertexPairCount,
    '$.producer.sharedVertexPairCount',
    issues,
  );
  checkField(
    producer.sharedEdgePairCount,
    summary.sharedEdgePairCount,
    '$.producer.sharedEdgePairCount',
    issues,
  );
  checkField(
    producer.coincidentTrianglePairCount,
    summary.coincidentTrianglePairCount,
    '$.producer.coincidentTrianglePairCount',
    issues,
  );
  checkField(
    producer.nonincidentOverlapPairCount,
    summary.nonincidentOverlapPairCount,
    '$.producer.nonincidentOverlapPairCount',
    issues,
  );
  checkField(
    producer.incidentOverlapPairCount,
    summary.incidentOverlapPairCount,
    '$.producer.incidentOverlapPairCount',
    issues,
  );
}

/**
 * Trusted replay. Every expected unordered pair is sent exactly once to the
 * independent pair auditor, including when the producer pair is absent.
 */
export function auditTrustedStaticRationalTriangleOverlapCensusCandidateV1(
  input: TrustedStaticRationalTriangleOverlapCensusAuditInputV1,
): StaticRationalTriangleOverlapCensusAuditResultV1 {
  const issues: Issue[] = [];
  const { triangles, producer } = input;
  const triangleIds = triangles.map((entry) => entry.triangleId);
  const expectedPairCount =
    triangles.length < 2 ? 0 : (triangles.length * (triangles.length - 1)) / 2;
  if (
    expectedPairCount > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairAudits ||
    expectedPairCount > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs
  ) {
    return contractFailure([
      issue(
        'audit-internal',
        '$.triangles',
        'internal-count-invariant',
        'trusted triangle set exceeds the bounded pair replay surface',
      ),
    ]);
  }

  checkProducerFixedContract(producer, issues);
  checkTriangleIds(producer.triangleIds, triangleIds, issues);
  if (producer.pairs.length !== expectedPairCount) {
    addIssue(
      issues,
      'producer-consistency',
      '$.producer.pairs',
      'producer-array-length-mismatch',
      'producer pair ledger length does not match nC2 for the canonical input set',
    );
  }

  let replayedPairCount = 0;
  let disjointPairCount = 0;
  let overlapPairCount = 0;
  let coplanarOverlapPairCount = 0;
  let noncoplanarOverlapPairCount = 0;
  let nonincidentPairCount = 0;
  let sharedVertexPairCount = 0;
  let sharedEdgePairCount = 0;
  let coincidentTrianglePairCount = 0;
  let nonincidentOverlapPairCount = 0;

  for (let firstIndex = 0; firstIndex < triangles.length; firstIndex += 1) {
    const first = triangles[firstIndex];
    if (first === undefined) {
      return contractFailure([
        issue(
          'audit-internal',
          '$.triangles',
          'internal-count-invariant',
          'trusted canonical triangle order contains a missing entry',
        ),
      ]);
    }
    for (let secondIndex = firstIndex + 1; secondIndex < triangles.length; secondIndex += 1) {
      const second = triangles[secondIndex];
      if (second === undefined) {
        return contractFailure([
          issue(
            'audit-internal',
            '$.triangles',
            'internal-count-invariant',
            'trusted canonical triangle order contains a missing entry',
          ),
        ]);
      }
      const pairPosition = replayedPairCount;
      const producerPair = producer.pairs[pairPosition];
      if (producerPair === undefined) {
        addIssue(
          issues,
          'producer-consistency',
          `$.producer.pairs[${String(pairPosition)}]`,
          'pair-field-mismatch',
          'producer pair is missing from the canonical pair position',
        );
      } else {
        checkPairIncidenceContract(producerPair, pairPosition, issues);
      }

      const suppliedClassification = producerPair?.staticClassification ?? 'disjoint';
      const suppliedClosedIntersection = producerPair?.closedTrianglesIntersect ?? false;
      const triangleA: StaticRationalTriangleOverlapAuditTriangleSnapshotV1 = first.triangle;
      const triangleB: StaticRationalTriangleOverlapAuditTriangleSnapshotV1 = second.triangle;
      let pairReplay: ValidatedPairAuditDependencyResult;
      try {
        const suppliedResult = auditStaticRationalTriangleOverlapCandidateV1({
          schemaVersion: 1,
          recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_AUDIT_INPUT_RECORD_TYPE,
          coordinateEncoding: 'bigint',
          triangleA,
          triangleB,
          producer: pairProducerSnapshot(suppliedClassification, suppliedClosedIntersection),
        });
        pairReplay = validatePairAuditDependencyResult(
          suppliedResult,
          suppliedClassification,
          suppliedClosedIntersection,
        );
      } catch {
        pairReplay = Object.freeze({ kind: 'invalid-contract' as const });
      }
      if (pairReplay.kind !== 'decision') {
        return contractFailure([
          issue(
            'audit-internal',
            `$.producer.pairs[${String(pairPosition)}]`,
            'unexpected-pair-audit-failure',
            'independent pair auditor failed without one valid closed geometry decision',
          ),
        ]);
      }
      const auditedClassification = pairReplay.auditedClassification;
      const auditedClosedIntersection = pairReplay.auditedClosedTrianglesIntersect;
      if (!pairReplay.consistent) {
        addIssue(
          issues,
          'pair-replay',
          `$.producer.pairs[${String(pairPosition)}].staticClassification`,
          'pair-audit-inconsistent',
          'producer pair geometry does not match the independent exact pair replay',
        );
      }

      const shared = sharedCanonicalVertexCount(first.triangle, second.triangle);
      const expectedIncidence = incidenceClass(shared);
      if (
        (shared > 0 && auditedClassification === 'disjoint') ||
        (shared === 3 && auditedClassification !== 'intersecting-coplanar')
      ) {
        return contractFailure([
          issue(
            'audit-internal',
            `$.producer.pairs[${String(pairPosition)}]`,
            'incidence-invariant',
            'independent pair decision contradicts exact shared-canonical-vertex incidence',
          ),
        ]);
      }

      if (producerPair !== undefined) {
        const pairPath = `$.producer.pairs[${String(pairPosition)}]`;
        checkField(
          producerPair.pairIndex,
          pairPosition,
          `${pairPath}.pairIndex`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.firstTriangleId,
          first.triangleId,
          `${pairPath}.firstTriangleId`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.secondTriangleId,
          second.triangleId,
          `${pairPath}.secondTriangleId`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.sharedCanonicalVertexCount,
          shared,
          `${pairPath}.sharedCanonicalVertexCount`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.incidenceBasis,
          'shared-canonical-vertex-count-only-not-mesh-topology',
          `${pairPath}.incidenceBasis`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.incidenceClass,
          expectedIncidence,
          `${pairPath}.incidenceClass`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.staticClassification,
          auditedClassification,
          `${pairPath}.staticClassification`,
          issues,
          'pair-field-mismatch',
        );
        checkField(
          producerPair.closedTrianglesIntersect,
          auditedClosedIntersection,
          `${pairPath}.closedTrianglesIntersect`,
          issues,
          'pair-field-mismatch',
        );
      }

      if (expectedIncidence === 'nonincident') nonincidentPairCount += 1;
      else if (expectedIncidence === 'shared-vertex') sharedVertexPairCount += 1;
      else if (expectedIncidence === 'shared-edge') sharedEdgePairCount += 1;
      else coincidentTrianglePairCount += 1;

      if (auditedClassification === 'disjoint') disjointPairCount += 1;
      else {
        overlapPairCount += 1;
        if (auditedClassification === 'intersecting-coplanar') coplanarOverlapPairCount += 1;
        else noncoplanarOverlapPairCount += 1;
        if (expectedIncidence === 'nonincident') nonincidentOverlapPairCount += 1;
      }
      replayedPairCount += 1;
    }
  }

  const incidentPairCount =
    sharedVertexPairCount + sharedEdgePairCount + coincidentTrianglePairCount;
  const incidentOverlapPairCount = overlapPairCount - nonincidentOverlapPairCount;
  if (
    replayedPairCount !== expectedPairCount ||
    disjointPairCount + overlapPairCount !== expectedPairCount ||
    coplanarOverlapPairCount + noncoplanarOverlapPairCount !== overlapPairCount ||
    nonincidentPairCount + incidentPairCount !== expectedPairCount ||
    incidentOverlapPairCount !== incidentPairCount
  ) {
    return contractFailure([
      issue(
        'audit-internal',
        '$.producer.pairs',
        'internal-count-invariant',
        'independently replayed pair ledger and counters disagree',
      ),
    ]);
  }

  const summary: AuditedCensusSummary = {
    triangleIds,
    triangleCount: triangles.length,
    unorderedPairCount: expectedPairCount,
    disjointPairCount,
    overlapPairCount,
    coplanarOverlapPairCount,
    noncoplanarOverlapPairCount,
    nonincidentPairCount,
    sharedVertexPairCount,
    sharedEdgePairCount,
    coincidentTrianglePairCount,
    nonincidentOverlapPairCount,
    incidentOverlapPairCount,
  };
  checkSummaryCounters(producer, summary, issues);
  if (issues.length === 0) {
    return deepFreezeOwned({
      ok: true as const,
      value: decisionRecord('consistent', summary),
    });
  }
  return deepFreezeOwned({
    ok: false as const,
    value: decisionRecord('inconsistent', summary),
    error: freezeIssues(issues),
  });
}

/** Recommended hostile-data API with fail-closed internal error handling. */
export function auditStaticRationalTriangleOverlapCensusCandidateV1(
  supplied: unknown,
): StaticRationalTriangleOverlapCensusAuditResultV1 {
  const parsed = parseStaticRationalTriangleOverlapCensusAuditInputV1(supplied);
  if (!parsed.ok) return contractFailure(parsed.error);
  try {
    return auditTrustedStaticRationalTriangleOverlapCensusCandidateV1(parsed.value);
  } catch {
    return contractFailure([
      issue(
        'audit-internal',
        '$',
        'unexpected-pair-audit-failure',
        'independent whole-census audit failed closed unexpectedly',
      ),
    ]);
  }
}
