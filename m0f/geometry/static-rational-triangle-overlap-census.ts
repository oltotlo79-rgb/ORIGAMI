import { deepFreezeOwned } from '../clone-and-freeze.js';
import { equalProjectivePoints3 } from '../reference-verifier/projective-rational-3d.js';
import {
  classifyStaticRationalTriangleOverlap,
  parseStaticRationalTriangleOverlapInputV1,
  type StaticRationalTriangle3,
  type StaticRationalTriangleOverlapClassification,
  type StaticRationalTriangleOverlapIssueCode,
  type StaticRationalTriangleOverlapRecordV1,
} from './static-rational-triangle-overlap.js';

/**
 * Defensive in-memory work ceilings for the raw static census. They are not a
 * product SupportProfile or evidence for any supported mesh size.
 */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS = deepFreezeOwned({
  maxTriangles: 64,
  maxPairs: 2_016,
  maxIssues: 512,
  maxIdCodeUnits: 128,
  maxDiagnosticPathSegmentCodeUnits: 128,
  maxOwnPropertiesPerContainer: 4,
});

export type StaticRationalTriangleOverlapCensusTriangleV1 = Readonly<{
  triangleId: string;
  triangle: StaticRationalTriangle3;
}>;

export type StaticRationalTriangleOverlapCensusInputV1 = Readonly<{
  triangles: readonly StaticRationalTriangleOverlapCensusTriangleV1[];
}>;

export type StaticRationalTriangleIncidenceClassV1 =
  'nonincident' | 'shared-vertex' | 'shared-edge' | 'coincident-triangle';

export type StaticRationalTriangleOverlapCensusPairV1 = Readonly<{
  pairIndex: number;
  firstTriangleId: string;
  secondTriangleId: string;
  sharedCanonicalVertexCount: 0 | 1 | 2 | 3;
  incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology';
  incidenceClass: StaticRationalTriangleIncidenceClassV1;
  staticClassification: StaticRationalTriangleOverlapClassification;
  closedTrianglesIntersect: boolean;
}>;

export type StaticRationalTriangleOverlapCensusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-overlap-census';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-static-configuration-all-unordered-closed-triangle-pairs';
  arithmetic: 'exact-projective-rational-bigint-with-bounded-safe-integer-counts';
  triangleOrder: 'triangle-id-code-unit';
  pairOrder: 'first-triangle-id-then-second-triangle-id-code-unit';
  incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology';
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
  pairs: readonly StaticRationalTriangleOverlapCensusPairV1[];
  allUnorderedPairsIncluded: true;
  silentPairExclusionIncluded: false;
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

export type StaticRationalTriangleOverlapCensusIssueCode =
  | 'expected-object'
  | 'expected-array'
  | 'unknown-property'
  | 'missing-property'
  | 'accessor-property'
  | 'invalid-property'
  | 'invalid-id'
  | 'duplicate-id'
  | 'triangle-count-limit-exceeded'
  | 'pair-count-limit-exceeded'
  | 'property-limit-exceeded'
  | 'invalid-triangle'
  | 'inspection-failed'
  | 'classifier-failure-invariant'
  | 'internal-count-invariant';

export type StaticRationalTriangleOverlapCensusIssueV1 = Readonly<{
  path: string;
  code: StaticRationalTriangleOverlapCensusIssueCode;
  message: string;
  sourceCode?: StaticRationalTriangleOverlapIssueCode;
}>;

export type StaticRationalTriangleOverlapCensusInputParseResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleOverlapCensusInputV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapCensusIssueV1[] }>;

export type StaticRationalTriangleOverlapCensusResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleOverlapCensusRecordV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapCensusIssueV1[] }>;

type Issue = StaticRationalTriangleOverlapCensusIssueV1;
type Failure = Readonly<{ ok: false; error: readonly Issue[] }>;
type InspectedObject = Readonly<Record<string, PropertyDescriptor | undefined>>;
type IndexedValue = Readonly<{ index: number; value: unknown }>;
type ParsedTriangle = Readonly<{
  sourceIndex: number;
  triangleId: string;
  triangle: StaticRationalTriangle3;
}>;

const ROOT_KEYS = ['triangles'] as const;
const ENTRY_KEYS = ['triangleId', 'triangle'] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function addIssue(
  issues: Issue[],
  path: string,
  code: StaticRationalTriangleOverlapCensusIssueCode,
  message: string,
  sourceCode?: StaticRationalTriangleOverlapIssueCode,
): void {
  if (issues.length >= STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIssues) return;
  issues.push(
    sourceCode === undefined ? { path, code, message } : { path, code, message, sourceCode },
  );
}

function failure(issues: readonly Issue[]): Failure {
  return deepFreezeOwned({ ok: false as const, error: [...issues] });
}

function diagnosticPropertyKey(key: PropertyKey): string {
  const limit = STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxDiagnosticPathSegmentCodeUnits;
  if (typeof key === 'symbol') {
    const description = key.description ?? '';
    const prefix = 'Symbol(';
    if (prefix.length + description.length + 1 <= limit) return `${prefix}${description})`;
    const retainedDescriptionCodeUnits = limit - prefix.length - 1;
    return `${prefix}${description.slice(0, retainedDescriptionCodeUnits)}…`;
  }
  const raw = String(key);
  return raw.length <= limit ? raw : `${raw.slice(0, limit - 1)}…`;
}

function comparePropertyKeys(left: PropertyKey, right: PropertyKey): number {
  if (typeof left === 'symbol') {
    if (typeof right !== 'symbol') return 1;
    const leftDescription = left.description ?? '';
    const rightDescription = right.description ?? '';
    return leftDescription < rightDescription ? -1 : leftDescription > rightDescription ? 1 : 0;
  }
  if (typeof right === 'symbol') return -1;
  const leftText = String(left);
  const rightText = String(right);
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
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      addIssue(issues, path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    if (keys.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        `container exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxOwnPropertiesPerContainer)} own properties`,
      );
      return undefined;
    }
    const expected = new Set(expectedKeys);
    for (const key of [...keys].sort(comparePropertyKeys)) {
      if (typeof key !== 'string' || !expected.has(key)) {
        addIssue(
          issues,
          `${path}.${diagnosticPropertyKey(key)}`,
          'unknown-property',
          'property is not declared by the closed census input contract',
        );
      }
    }
    const result: Record<string, PropertyDescriptor | undefined> = {};
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
      result[key] = descriptor;
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
    return result;
  } catch {
    addIssue(issues, path, 'inspection-failed', 'input properties could not be inspected safely');
    return undefined;
  }
}

function descriptorValue(inspected: InspectedObject | undefined, key: string): unknown {
  const descriptor = inspected?.[key];
  return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable
    ? descriptor.value
    : undefined;
}

function unorderedPairCountBigInt(triangleCount: number): bigint {
  const count = BigInt(triangleCount);
  return (count * (count - 1n)) / 2n;
}

function inspectTriangleArray(
  supplied: unknown,
  path: string,
  issues: Issue[],
): readonly IndexedValue[] | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, path, 'expected-array', 'triangles must be one dense plain array');
    return undefined;
  }
  try {
    if (!Array.isArray(supplied) || Object.getPrototypeOf(supplied) !== Array.prototype) {
      addIssue(issues, path, 'expected-array', 'triangles must be one dense plain array');
      return undefined;
    }
    const keys = Reflect.ownKeys(supplied);
    const lengthDescriptor = Object.getOwnPropertyDescriptor(supplied, 'length');
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      (lengthDescriptor.value as number) < 0
    ) {
      addIssue(issues, path, 'expected-array', 'triangles must have a valid dense-array length');
      return undefined;
    }
    const length = lengthDescriptor.value as number;
    const pairCount = unorderedPairCountBigInt(length);
    if (length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles) {
      addIssue(
        issues,
        path,
        'triangle-count-limit-exceeded',
        `triangle count exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles)}`,
      );
    }
    if (pairCount > BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs)) {
      addIssue(
        issues,
        path,
        'pair-count-limit-exceeded',
        `unordered pair count exceeds ${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs)}`,
      );
    }
    if (
      length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles ||
      pairCount > BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs)
    ) {
      return undefined;
    }
    if (keys.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles + 1) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        'triangles array has too many own properties for the bounded census',
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
          'property is not declared by the dense triangles array contract',
        );
      }
    }
    const values: IndexedValue[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, String(index));
      const entryPath = `${path}[${String(index)}]`;
      if (descriptor === undefined) {
        addIssue(issues, entryPath, 'missing-property', 'triangle entry is missing');
      } else if (!('value' in descriptor)) {
        addIssue(issues, entryPath, 'accessor-property', 'accessor entries are not input data');
      } else if (!descriptor.enumerable) {
        addIssue(issues, entryPath, 'invalid-property', 'triangle entries must be enumerable');
      } else {
        values.push({ index, value: descriptor.value });
      }
    }
    return values;
  } catch {
    addIssue(issues, path, 'inspection-failed', 'triangles could not be inspected safely');
    return undefined;
  }
}

function parseTriangle(
  supplied: unknown,
  path: string,
  issues: Issue[],
): StaticRationalTriangle3 | undefined {
  const parsed = parseStaticRationalTriangleOverlapInputV1({
    triangleA: supplied,
    triangleB: supplied,
  });
  if (parsed.ok) return parsed.value.triangleA;
  let appended = false;
  for (const entry of parsed.error) {
    if (!entry.path.startsWith('$.triangleA')) continue;
    appended = true;
    addIssue(
      issues,
      `${path}${entry.path.slice('$.triangleA'.length)}`,
      'invalid-triangle',
      entry.message,
      entry.code,
    );
  }
  if (!appended) {
    addIssue(
      issues,
      path,
      'invalid-triangle',
      'triangle failed the canonical exact static predicate input contract',
    );
  }
  return undefined;
}

function parseEntry(indexed: IndexedValue, issues: Issue[]): ParsedTriangle | undefined {
  const path = `$.triangles[${String(indexed.index)}]`;
  const inspected = inspectClosedObject(indexed.value, path, ENTRY_KEYS, issues);
  if (inspected === undefined) return undefined;
  const id = descriptorValue(inspected, 'triangleId');
  let triangleId: string | undefined;
  if (
    typeof id !== 'string' ||
    id.length < 1 ||
    id.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIdCodeUnits ||
    !STABLE_ID_PATTERN.test(id)
  ) {
    addIssue(
      issues,
      `${path}.triangleId`,
      'invalid-id',
      `triangleId must be a stable ASCII ID of 1..${String(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIdCodeUnits)} characters`,
    );
  } else {
    triangleId = id;
  }
  const triangle = parseTriangle(
    descriptorValue(inspected, 'triangle'),
    `${path}.triangle`,
    issues,
  );
  return triangleId === undefined || triangle === undefined
    ? undefined
    : { sourceIndex: indexed.index, triangleId, triangle };
}

/** Closed, accessor-free parser that canonicalizes entry order by triangle ID. */
export function parseStaticRationalTriangleOverlapCensusInputV1(
  supplied: unknown,
): StaticRationalTriangleOverlapCensusInputParseResultV1 {
  const issues: Issue[] = [];
  const root = inspectClosedObject(supplied, '$', ROOT_KEYS, issues);
  const indexed = inspectTriangleArray(descriptorValue(root, 'triangles'), '$.triangles', issues);
  const parsed = indexed?.flatMap((entry) => {
    const value = parseEntry(entry, issues);
    return value === undefined ? [] : [value];
  });
  if (parsed !== undefined) {
    const firstIndexById = new Map<string, number>();
    for (const entry of parsed) {
      const firstIndex = firstIndexById.get(entry.triangleId);
      if (firstIndex === undefined) firstIndexById.set(entry.triangleId, entry.sourceIndex);
      else {
        addIssue(
          issues,
          `$.triangles[${String(entry.sourceIndex)}].triangleId`,
          'duplicate-id',
          `triangleId duplicates $.triangles[${String(firstIndex)}].triangleId`,
        );
      }
    }
  }
  if (issues.length > 0 || parsed === undefined) return failure(issues);
  parsed.sort((left, right) =>
    left.triangleId < right.triangleId ? -1 : left.triangleId > right.triangleId ? 1 : 0,
  );
  return deepFreezeOwned({
    ok: true as const,
    value: {
      triangles: parsed.map(({ triangleId, triangle }) => ({ triangleId, triangle })),
    },
  });
}

function sharedCanonicalVertexCount(
  left: StaticRationalTriangle3,
  right: StaticRationalTriangle3,
): 0 | 1 | 2 | 3 {
  let count = 0;
  for (const leftPoint of left) {
    if (right.some((rightPoint) => equalProjectivePoints3(leftPoint, rightPoint))) count += 1;
  }
  if (count === 0 || count === 1 || count === 2 || count === 3) return count;
  throw new RangeError('nondegenerate triangles cannot share more than three canonical vertices');
}

function incidenceClass(count: 0 | 1 | 2 | 3): StaticRationalTriangleIncidenceClassV1 {
  return count === 0
    ? 'nonincident'
    : count === 1
      ? 'shared-vertex'
      : count === 2
        ? 'shared-edge'
        : 'coincident-triangle';
}

function isExpectedClassifierRecord(
  supplied: unknown,
): supplied is StaticRationalTriangleOverlapRecordV1 {
  if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) return false;
  const record = supplied as Record<string, unknown>;
  return (
    record.schemaVersion === 1 &&
    record.recordType === 'm0f-static-rational-triangle-overlap' &&
    record.contractStatus === 'candidate-no-claim' &&
    record.predicateScope === 'one-static-configuration-of-two-closed-triangles' &&
    record.arithmetic === 'exact-projective-rational-bigint' &&
    (record.classification === 'disjoint' ||
      record.classification === 'intersecting-coplanar' ||
      record.classification === 'intersecting-noncoplanar') &&
    record.closedTrianglesIntersect === (record.classification !== 'disjoint') &&
    record.boundaryContactCountsAsIntersection === true &&
    record.staticPredicateIncluded === true &&
    record.legalContactClassificationIncluded === false &&
    record.penetrationClassificationIncluded === false &&
    record.collisionFreeClaim === false &&
    record.continuousTimeIncluded === false &&
    record.continuousCollisionDetectionIncluded === false &&
    record.rigidMotionIntervalIncluded === false &&
    record.verifiedClaim === false &&
    record.globalM0fGo === false
  );
}

function classifierInvariantFailure(firstTriangleId: string, secondTriangleId: string): Failure {
  return failure([
    {
      path: `$.pairs[${firstTriangleId},${secondTriangleId}]`,
      code: 'classifier-failure-invariant',
      message: 'a canonical triangle pair did not produce the fixed static no-claim record',
    },
  ]);
}

/**
 * Classifies every unordered pair exactly once. Any pair-level predicate
 * failure rejects the whole census; no partial or silently filtered ledger is
 * returned.
 */
export function computeStaticRationalTriangleOverlapCensusV1(
  supplied: unknown,
): StaticRationalTriangleOverlapCensusResultV1 {
  const parsed = parseStaticRationalTriangleOverlapCensusInputV1(supplied);
  if (!parsed.ok) return parsed;
  const { triangles } = parsed.value;
  const pairs: StaticRationalTriangleOverlapCensusPairV1[] = [];
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
      return failure([
        {
          path: '$.triangles',
          code: 'internal-count-invariant',
          message: 'canonical triangle order contains a missing entry',
        },
      ]);
    }
    for (let secondIndex = firstIndex + 1; secondIndex < triangles.length; secondIndex += 1) {
      const second = triangles[secondIndex];
      if (second === undefined) {
        return failure([
          {
            path: '$.triangles',
            code: 'internal-count-invariant',
            message: 'canonical triangle order contains a missing entry',
          },
        ]);
      }
      let classifiedRecord: StaticRationalTriangleOverlapRecordV1;
      try {
        const classified = classifyStaticRationalTriangleOverlap({
          triangleA: first.triangle,
          triangleB: second.triangle,
        });
        if (!classified.ok || !isExpectedClassifierRecord(classified.value)) {
          return classifierInvariantFailure(first.triangleId, second.triangleId);
        }
        classifiedRecord = classified.value;
      } catch {
        return classifierInvariantFailure(first.triangleId, second.triangleId);
      }
      const shared = sharedCanonicalVertexCount(first.triangle, second.triangle);
      if (
        (shared > 0 && !classifiedRecord.closedTrianglesIntersect) ||
        (shared === 3 && classifiedRecord.classification !== 'intersecting-coplanar')
      ) {
        return classifierInvariantFailure(first.triangleId, second.triangleId);
      }
      const incidence = incidenceClass(shared);
      if (incidence === 'nonincident') nonincidentPairCount += 1;
      else if (incidence === 'shared-vertex') sharedVertexPairCount += 1;
      else if (incidence === 'shared-edge') sharedEdgePairCount += 1;
      else coincidentTrianglePairCount += 1;
      if (classifiedRecord.classification === 'disjoint') disjointPairCount += 1;
      else {
        overlapPairCount += 1;
        if (classifiedRecord.classification === 'intersecting-coplanar') {
          coplanarOverlapPairCount += 1;
        } else {
          noncoplanarOverlapPairCount += 1;
        }
        if (incidence === 'nonincident') nonincidentOverlapPairCount += 1;
      }
      pairs.push({
        pairIndex: pairs.length,
        firstTriangleId: first.triangleId,
        secondTriangleId: second.triangleId,
        sharedCanonicalVertexCount: shared,
        incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology',
        incidenceClass: incidence,
        staticClassification: classifiedRecord.classification,
        closedTrianglesIntersect: classifiedRecord.closedTrianglesIntersect,
      });
    }
  }

  const expectedPairs = Number(unorderedPairCountBigInt(triangles.length));
  const incidencePairCount =
    nonincidentPairCount +
    sharedVertexPairCount +
    sharedEdgePairCount +
    coincidentTrianglePairCount;
  const incidentPairCount =
    sharedVertexPairCount + sharedEdgePairCount + coincidentTrianglePairCount;
  const incidentOverlapPairCount = overlapPairCount - nonincidentOverlapPairCount;
  if (
    pairs.length !== expectedPairs ||
    disjointPairCount + overlapPairCount !== expectedPairs ||
    coplanarOverlapPairCount + noncoplanarOverlapPairCount !== overlapPairCount ||
    incidencePairCount !== expectedPairs ||
    nonincidentOverlapPairCount > nonincidentPairCount ||
    incidentOverlapPairCount !== incidentPairCount
  ) {
    return failure([
      {
        path: '$.pairs',
        code: 'internal-count-invariant',
        message: 'pair ledger and exact integer counters disagree',
      },
    ]);
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: 'm0f-static-rational-triangle-overlap-census' as const,
      contractStatus: 'candidate-no-claim' as const,
      predicateScope: 'one-static-configuration-all-unordered-closed-triangle-pairs' as const,
      arithmetic: 'exact-projective-rational-bigint-with-bounded-safe-integer-counts' as const,
      triangleOrder: 'triangle-id-code-unit' as const,
      pairOrder: 'first-triangle-id-then-second-triangle-id-code-unit' as const,
      incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology' as const,
      triangleIds: triangles.map((entry) => entry.triangleId),
      triangleCount: triangles.length,
      unorderedPairCount: expectedPairs,
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
      pairs,
      allUnorderedPairsIncluded: true as const,
      silentPairExclusionIncluded: false as const,
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
    },
  });
}
