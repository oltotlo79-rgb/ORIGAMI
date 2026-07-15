import {
  canonicalProjectivePoint3,
  compareProjectivePoint3Coordinate,
  projectiveAxisDropOrient2DSign,
  projectivePlaneThrough3,
  projectivePointPlaneSign,
  type ProjectiveAxis3,
  type ProjectivePlane3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';

/**
 * Defensive limits for one in-memory exact static predicate call. They are not
 * a product SupportProfile and say nothing about continuous-time performance.
 */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS = Object.freeze({
  maxCoordinateBits: 16_384,
  maxIssues: 32,
  maxDiagnosticPathSegmentCodeUnits: 128,
  maxOwnPropertiesPerContainer: 8,
} as const);

export type StaticRationalTriangle3 = readonly [
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
];

export type StaticRationalTriangleOverlapInputV1 = Readonly<{
  triangleA: StaticRationalTriangle3;
  triangleB: StaticRationalTriangle3;
}>;

export type StaticRationalTriangleOverlapClassification =
  'disjoint' | 'intersecting-coplanar' | 'intersecting-noncoplanar';

export type StaticRationalTriangleOverlapIssueCode =
  | 'expected-object'
  | 'expected-triangle'
  | 'unknown-property'
  | 'missing-property'
  | 'accessor-property'
  | 'invalid-property'
  | 'expected-bigint'
  | 'coordinate-limit-exceeded'
  | 'property-limit-exceeded'
  | 'nonpositive-weight'
  | 'noncanonical-point'
  | 'degenerate-triangle'
  | 'inspection-failed';

export type StaticRationalTriangleOverlapIssue = Readonly<{
  path: string;
  code: StaticRationalTriangleOverlapIssueCode;
  message: string;
}>;

export type StaticRationalTriangleOverlapInputParseResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleOverlapInputV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapIssue[] }>;

/**
 * A candidate/no-claim topology record for one static pair. In particular,
 * legal contact and penetration are intentionally not distinguished.
 */
export type StaticRationalTriangleOverlapRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-overlap';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-static-configuration-of-two-closed-triangles';
  arithmetic: 'exact-projective-rational-bigint';
  classification: StaticRationalTriangleOverlapClassification;
  closedTrianglesIntersect: boolean;
  boundaryContactCountsAsIntersection: true;
  staticPredicateIncluded: true;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  collisionFreeClaim: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  rigidMotionIntervalIncluded: false;
  verifiedClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleOverlapResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleOverlapRecordV1 }>
  | Readonly<{ ok: false; error: readonly StaticRationalTriangleOverlapIssue[] }>;

type IntegerVector3 = readonly [x: bigint, y: bigint, z: bigint];

type InspectedObject = Readonly<{
  descriptors: Readonly<Record<PropertyKey, PropertyDescriptor>>;
}>;

const ROOT_KEYS = ['triangleA', 'triangleB'] as const;
const POINT_KEYS = ['x', 'y', 'z', 'w'] as const;
const TRIANGLE_INDICES = [0, 1, 2] as const;
const TRIANGLE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const;
const MAX_COORDINATE_MAGNITUDE_EXCLUSIVE =
  1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxCoordinateBits);

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
  path: string,
  code: StaticRationalTriangleOverlapIssueCode,
  message: string,
): StaticRationalTriangleOverlapIssue {
  return Object.freeze({ path, code, message });
}

function addIssue(
  issues: StaticRationalTriangleOverlapIssue[],
  path: string,
  code: StaticRationalTriangleOverlapIssueCode,
  message: string,
): void {
  if (issues.length >= STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxIssues) return;
  issues.push(issue(path, code, message));
}

function failure(
  issues: readonly StaticRationalTriangleOverlapIssue[],
): Extract<StaticRationalTriangleOverlapInputParseResultV1, { ok: false }> {
  return Object.freeze({ ok: false as const, error: Object.freeze([...issues]) });
}

function diagnosticPropertyKey(key: PropertyKey): string {
  const limit = STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxDiagnosticPathSegmentCodeUnits;
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

function inspectPlainObject(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  issues: StaticRationalTriangleOverlapIssue[],
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
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      addIssue(issues, path, 'expected-object', 'must be one plain data object');
      return undefined;
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        `container exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxOwnPropertiesPerContainer} own properties`,
      );
      return undefined;
    }
    const descriptors: Record<PropertyKey, PropertyDescriptor> = {};
    const expected = new Set(expectedKeys);
    for (const key of [...keys].sort(comparePropertyKeys)) {
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
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined) {
        addIssue(issues, `${path}.${key}`, 'missing-property', 'required property is missing');
      } else if (!('value' in descriptor)) {
        addIssue(
          issues,
          `${path}.${key}`,
          'accessor-property',
          'accessor properties are not input data',
        );
      } else if (!descriptor.enumerable) {
        addIssue(
          issues,
          `${path}.${key}`,
          'invalid-property',
          'input data properties must be enumerable',
        );
      }
      if (descriptor !== undefined) descriptors[key] = descriptor;
    }
    return Object.freeze({ descriptors });
  } catch {
    addIssue(issues, path, 'inspection-failed', 'input properties could not be inspected safely');
    return undefined;
  }
}

function descriptorValue(inspected: InspectedObject, key: string): unknown {
  const descriptor = inspected.descriptors[key];
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function exceedsCoordinateLimit(value: bigint): boolean {
  return (
    value >= MAX_COORDINATE_MAGNITUDE_EXCLUSIVE || value <= -MAX_COORDINATE_MAGNITUDE_EXCLUSIVE
  );
}

function parsePoint(
  supplied: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapIssue[],
): ProjectivePoint3 | undefined {
  const inspected = inspectPlainObject(supplied, path, POINT_KEYS, issues);
  if (inspected === undefined) return undefined;
  const coordinates: Partial<Record<(typeof POINT_KEYS)[number], bigint>> = {};
  for (const coordinate of POINT_KEYS) {
    const value = descriptorValue(inspected, coordinate);
    if (typeof value !== 'bigint') {
      addIssue(issues, `${path}.${coordinate}`, 'expected-bigint', 'coordinate must be a BigInt');
      continue;
    }
    if (exceedsCoordinateLimit(value)) {
      addIssue(
        issues,
        `${path}.${coordinate}`,
        'coordinate-limit-exceeded',
        `coordinate exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxCoordinateBits} bits`,
      );
      continue;
    }
    coordinates[coordinate] = value;
  }
  const { x, y, z, w } = coordinates;
  if (x === undefined || y === undefined || z === undefined || w === undefined) return undefined;
  if (w <= 0n) {
    addIssue(issues, `${path}.w`, 'nonpositive-weight', 'canonical finite points require w > 0');
    return undefined;
  }
  if (commonDivisor4(x, y, z, w) !== 1n) {
    addIssue(
      issues,
      path,
      'noncanonical-point',
      'homogeneous coordinates must have greatest common divisor one',
    );
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

function parseTriangle(
  supplied: unknown,
  path: string,
  issues: StaticRationalTriangleOverlapIssue[],
): StaticRationalTriangle3 | undefined {
  if (typeof supplied !== 'object' || supplied === null) {
    addIssue(issues, path, 'expected-triangle', 'triangle must be a dense three-element array');
    return undefined;
  }
  let keys: readonly PropertyKey[];
  let descriptors: Readonly<Record<PropertyKey, PropertyDescriptor>>;
  try {
    if (!Array.isArray(supplied) || Object.getPrototypeOf(supplied) !== Array.prototype) {
      addIssue(issues, path, 'expected-triangle', 'triangle must be a plain array');
      return undefined;
    }
    keys = Reflect.ownKeys(supplied);
    if (keys.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxOwnPropertiesPerContainer) {
      addIssue(
        issues,
        path,
        'property-limit-exceeded',
        `container exceeds ${STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxOwnPropertiesPerContainer} own properties`,
      );
      return undefined;
    }
    const ownedDescriptors: Record<PropertyKey, PropertyDescriptor> = {};
    for (const key of ['0', '1', '2', 'length']) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
      if (descriptor !== undefined) ownedDescriptors[key] = descriptor;
    }
    descriptors = ownedDescriptors;
  } catch {
    addIssue(
      issues,
      path,
      'inspection-failed',
      'triangle properties could not be inspected safely',
    );
    return undefined;
  }
  const expectedKeys = new Set(['0', '1', '2', 'length']);
  for (const key of [...keys].sort(comparePropertyKeys)) {
    if (typeof key !== 'string' || !expectedKeys.has(key)) {
      addIssue(
        issues,
        `${path}.${diagnosticPropertyKey(key)}`,
        'unknown-property',
        'property is not declared by the closed triangle contract',
      );
    }
  }
  const lengthDescriptor = descriptors.length;
  if (
    lengthDescriptor === undefined ||
    !('value' in lengthDescriptor) ||
    lengthDescriptor.value !== 3
  ) {
    addIssue(issues, path, 'expected-triangle', 'triangle must have exactly three vertices');
  }
  const points: (ProjectivePoint3 | undefined)[] = [];
  for (const index of TRIANGLE_INDICES) {
    const descriptor = descriptors[String(index)];
    if (descriptor === undefined) {
      addIssue(issues, `${path}[${index}]`, 'missing-property', 'triangle vertex is missing');
      points.push(undefined);
      continue;
    }
    if (!('value' in descriptor)) {
      addIssue(
        issues,
        `${path}[${index}]`,
        'accessor-property',
        'accessor vertices are not input data',
      );
      points.push(undefined);
      continue;
    }
    if (!descriptor.enumerable) {
      addIssue(
        issues,
        `${path}[${index}]`,
        'invalid-property',
        'triangle vertices must be enumerable',
      );
      points.push(undefined);
      continue;
    }
    points.push(parsePoint(descriptor.value, `${path}[${index}]`, issues));
  }
  const first = points[0];
  const second = points[1];
  const third = points[2];
  if (first === undefined || second === undefined || third === undefined) return undefined;
  return Object.freeze([first, second, third] as const);
}

function edgeDirection(start: ProjectivePoint3, end: ProjectivePoint3): IntegerVector3 {
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

function triangleNormal(triangle: StaticRationalTriangle3): IntegerVector3 {
  return cross(edgeDirection(triangle[0], triangle[1]), edgeDirection(triangle[0], triangle[2]));
}

function isZeroVector(vector: IntegerVector3): boolean {
  return vector[0] === 0n && vector[1] === 0n && vector[2] === 0n;
}

/** Closed, bounded, accessor-free parser for canonical in-memory BigInt input. */
export function parseStaticRationalTriangleOverlapInputV1(
  supplied: unknown,
): StaticRationalTriangleOverlapInputParseResultV1 {
  const issues: StaticRationalTriangleOverlapIssue[] = [];
  const root = inspectPlainObject(supplied, '$', ROOT_KEYS, issues);
  if (root === undefined) return failure(issues);
  const triangleA = parseTriangle(descriptorValue(root, 'triangleA'), '$.triangleA', issues);
  const triangleB = parseTriangle(descriptorValue(root, 'triangleB'), '$.triangleB', issues);
  if (triangleA !== undefined && isZeroVector(triangleNormal(triangleA))) {
    addIssue(
      issues,
      '$.triangleA',
      'degenerate-triangle',
      'three vertices must span a nonzero-area affine triangle',
    );
  }
  if (triangleB !== undefined && isZeroVector(triangleNormal(triangleB))) {
    addIssue(
      issues,
      '$.triangleB',
      'degenerate-triangle',
      'three vertices must span a nonzero-area affine triangle',
    );
  }
  if (issues.length > 0 || triangleA === undefined || triangleB === undefined) {
    return failure(issues);
  }
  return Object.freeze({
    ok: true as const,
    value: Object.freeze({ triangleA, triangleB }),
  });
}

function maximumNormalAxis(plane: ProjectivePlane3): ProjectiveAxis3 {
  let axis: ProjectiveAxis3 = 'x';
  let magnitude = absolute(plane.a);
  if (absolute(plane.b) > magnitude) {
    axis = 'y';
    magnitude = absolute(plane.b);
  }
  if (absolute(plane.c) > magnitude) axis = 'z';
  return axis;
}

function opposite(left: -1 | 0 | 1, right: -1 | 0 | 1): boolean {
  return (left === -1 && right === 1) || (left === 1 && right === -1);
}

function retainedAxes(drop: ProjectiveAxis3): readonly [ProjectiveAxis3, ProjectiveAxis3] {
  return drop === 'x' ? ['y', 'z'] : drop === 'y' ? ['x', 'z'] : ['x', 'y'];
}

function coordinateBetweenClosed(
  point: ProjectivePoint3,
  start: ProjectivePoint3,
  end: ProjectivePoint3,
  coordinate: ProjectiveAxis3,
): boolean {
  const startToEnd = compareProjectivePoint3Coordinate(start, end, coordinate);
  if (startToEnd <= 0) {
    return (
      compareProjectivePoint3Coordinate(start, point, coordinate) <= 0 &&
      compareProjectivePoint3Coordinate(point, end, coordinate) <= 0
    );
  }
  return (
    compareProjectivePoint3Coordinate(end, point, coordinate) <= 0 &&
    compareProjectivePoint3Coordinate(point, start, coordinate) <= 0
  );
}

function pointOnProjectedSegment(
  point: ProjectivePoint3,
  start: ProjectivePoint3,
  end: ProjectivePoint3,
  drop: ProjectiveAxis3,
): boolean {
  const [first, second] = retainedAxes(drop);
  return (
    coordinateBetweenClosed(point, start, end, first) &&
    coordinateBetweenClosed(point, start, end, second)
  );
}

function projectedSegmentsIntersect(
  aStart: ProjectivePoint3,
  aEnd: ProjectivePoint3,
  bStart: ProjectivePoint3,
  bEnd: ProjectivePoint3,
  drop: ProjectiveAxis3,
): boolean {
  const aToBStart = projectiveAxisDropOrient2DSign(aStart, aEnd, bStart, drop);
  const aToBEnd = projectiveAxisDropOrient2DSign(aStart, aEnd, bEnd, drop);
  const bToAStart = projectiveAxisDropOrient2DSign(bStart, bEnd, aStart, drop);
  const bToAEnd = projectiveAxisDropOrient2DSign(bStart, bEnd, aEnd, drop);
  if (opposite(aToBStart, aToBEnd) && opposite(bToAStart, bToAEnd)) return true;
  if (aToBStart === 0 && pointOnProjectedSegment(bStart, aStart, aEnd, drop)) return true;
  if (aToBEnd === 0 && pointOnProjectedSegment(bEnd, aStart, aEnd, drop)) return true;
  if (bToAStart === 0 && pointOnProjectedSegment(aStart, bStart, bEnd, drop)) return true;
  return bToAEnd === 0 && pointOnProjectedSegment(aEnd, bStart, bEnd, drop);
}

function projectedPointInTriangle(
  point: ProjectivePoint3,
  triangle: StaticRationalTriangle3,
  drop: ProjectiveAxis3,
): boolean {
  const signs = TRIANGLE_EDGES.map(([start, end]) =>
    projectiveAxisDropOrient2DSign(triangle[start], triangle[end], point, drop),
  );
  const hasPositive = signs.some((value) => value === 1);
  const hasNegative = signs.some((value) => value === -1);
  return !(hasPositive && hasNegative);
}

function projectedSegmentIntersectsTriangle(
  start: ProjectivePoint3,
  end: ProjectivePoint3,
  triangle: StaticRationalTriangle3,
  drop: ProjectiveAxis3,
): boolean {
  if (
    projectedPointInTriangle(start, triangle, drop) ||
    projectedPointInTriangle(end, triangle, drop)
  ) {
    return true;
  }
  return TRIANGLE_EDGES.some(([edgeStart, edgeEnd]) =>
    projectedSegmentsIntersect(start, end, triangle[edgeStart], triangle[edgeEnd], drop),
  );
}

function coplanarTrianglesIntersect(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
  drop: ProjectiveAxis3,
): boolean {
  for (const [aStart, aEnd] of TRIANGLE_EDGES) {
    for (const [bStart, bEnd] of TRIANGLE_EDGES) {
      if (
        projectedSegmentsIntersect(
          triangleA[aStart],
          triangleA[aEnd],
          triangleB[bStart],
          triangleB[bEnd],
          drop,
        )
      ) {
        return true;
      }
    }
  }
  return (
    projectedPointInTriangle(triangleA[0], triangleB, drop) ||
    projectedPointInTriangle(triangleB[0], triangleA, drop)
  );
}

function planeEvaluation(plane: ProjectivePlane3, point: ProjectivePoint3): bigint {
  return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d * point.w;
}

function exactSegmentPlaneIntersection(
  start: ProjectivePoint3,
  end: ProjectivePoint3,
  plane: ProjectivePlane3,
): ProjectivePoint3 {
  const startEvaluation = planeEvaluation(plane, start);
  const endEvaluation = planeEvaluation(plane, end);
  return canonicalProjectivePoint3(
    startEvaluation * end.x - endEvaluation * start.x,
    startEvaluation * end.y - endEvaluation * start.y,
    startEvaluation * end.z - endEvaluation * start.z,
    startEvaluation * end.w - endEvaluation * start.w,
  );
}

function segmentIntersectsTrianglePlane(
  start: ProjectivePoint3,
  end: ProjectivePoint3,
  triangle: StaticRationalTriangle3,
  plane: ProjectivePlane3,
  drop: ProjectiveAxis3,
): boolean {
  const startSign = projectivePointPlaneSign(plane, start);
  const endSign = projectivePointPlaneSign(plane, end);
  if (startSign === 0 && endSign === 0) {
    return projectedSegmentIntersectsTriangle(start, end, triangle, drop);
  }
  if (startSign === 0) return projectedPointInTriangle(start, triangle, drop);
  if (endSign === 0) return projectedPointInTriangle(end, triangle, drop);
  if (!opposite(startSign, endSign)) return false;
  const intersection = exactSegmentPlaneIntersection(start, end, plane);
  return projectedPointInTriangle(intersection, triangle, drop);
}

function noncoplanarTrianglesIntersect(
  triangleA: StaticRationalTriangle3,
  planeA: ProjectivePlane3,
  triangleB: StaticRationalTriangle3,
  planeB: ProjectivePlane3,
): boolean {
  const signsOfB = triangleB.map((point) => projectivePointPlaneSign(planeA, point));
  if (signsOfB.every((sign) => sign === 1) || signsOfB.every((sign) => sign === -1)) {
    return false;
  }
  const signsOfA = triangleA.map((point) => projectivePointPlaneSign(planeB, point));
  if (signsOfA.every((sign) => sign === 1) || signsOfA.every((sign) => sign === -1)) {
    return false;
  }
  const dropA = maximumNormalAxis(planeA);
  const dropB = maximumNormalAxis(planeB);
  for (const [start, end] of TRIANGLE_EDGES) {
    if (
      segmentIntersectsTrianglePlane(triangleA[start], triangleA[end], triangleB, planeB, dropB)
    ) {
      return true;
    }
  }
  for (const [start, end] of TRIANGLE_EDGES) {
    if (
      segmentIntersectsTrianglePlane(triangleB[start], triangleB[end], triangleA, planeA, dropA)
    ) {
      return true;
    }
  }
  return false;
}

function record(
  classification: StaticRationalTriangleOverlapClassification,
): StaticRationalTriangleOverlapRecordV1 {
  return Object.freeze({
    schemaVersion: 1 as const,
    recordType: 'm0f-static-rational-triangle-overlap' as const,
    contractStatus: 'candidate-no-claim' as const,
    predicateScope: 'one-static-configuration-of-two-closed-triangles' as const,
    arithmetic: 'exact-projective-rational-bigint' as const,
    classification,
    closedTrianglesIntersect: classification !== 'disjoint',
    boundaryContactCountsAsIntersection: true as const,
    staticPredicateIncluded: true as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    collisionFreeClaim: false as const,
    continuousTimeIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    rigidMotionIntervalIncluded: false as const,
    verifiedClaim: false as const,
    globalM0fGo: false as const,
  });
}

/**
 * Exactly classifies overlap of two closed triangles at one static instant.
 *
 * Brochu-style CCD assumes linear vertex trajectories. This static predicate
 * follows no trajectory and therefore cannot certify a rigid-rotation interval
 * (or any other continuous motion) as collision-free.
 */
export function classifyStaticRationalTriangleOverlap(
  supplied: unknown,
): StaticRationalTriangleOverlapResultV1 {
  const parsed = parseStaticRationalTriangleOverlapInputV1(supplied);
  if (!parsed.ok) return parsed;
  const { triangleA, triangleB } = parsed.value;
  const planeA = projectivePlaneThrough3(...triangleA);
  const planeB = projectivePlaneThrough3(...triangleB);
  const coplanar = triangleB.every((point) => projectivePointPlaneSign(planeA, point) === 0);
  if (coplanar) {
    return Object.freeze({
      ok: true as const,
      value: record(
        coplanarTrianglesIntersect(triangleA, triangleB, maximumNormalAxis(planeA))
          ? 'intersecting-coplanar'
          : 'disjoint',
      ),
    });
  }
  return Object.freeze({
    ok: true as const,
    value: record(
      noncoplanarTrianglesIntersect(triangleA, planeA, triangleB, planeB)
        ? 'intersecting-noncoplanar'
        : 'disjoint',
    ),
  });
}
