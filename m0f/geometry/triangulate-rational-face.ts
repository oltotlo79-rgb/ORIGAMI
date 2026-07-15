import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  equalExactRational,
  equalExactRationalPoints,
  exactRational,
  exactRationalOrientationSign,
  multiplyExactRational,
  signExactRational,
  subtractExactRational,
  type ExactRational,
  type ExactRationalPoint2,
} from '../model/exact-rational.js';
import { classifyExactSegmentIntersection, type ExactSegment2 } from './planarize-segments.js';

/** Structurally identical to a planarization vertex, but ordered as one face ring. */
export type RationalFaceRingVertex2 = Readonly<{
  id: string;
  point: ExactRationalPoint2;
}>;

export type RationalSimpleFaceRing2 = Readonly<{
  faceId: string;
  vertices: readonly RationalFaceRingVertex2[];
}>;

/** Adapter input for a face boundary plus the vertex table returned by planarization. */
export type PlanarRationalFaceInput = Readonly<{
  boundary: Readonly<{
    id: string;
    vertexIds: readonly string[];
    edgeIds?: readonly string[];
    areaSign?: -1 | 1;
  }>;
  vertices: readonly RationalFaceRingVertex2[];
}>;

export type RationalCandidateFaceTriangle = Readonly<{
  id: string;
  faceId: string;
  /** Canonical negative winding in stored paper coordinates (x right, y down). */
  vertexIds: readonly [string, string, string];
  /** Order-independent tuple used in the candidate triangle ID. */
  semanticVertexIds: readonly [string, string, string];
}>;

export type RationalFaceTriangulationStats = Readonly<{
  segmentPairTests: number;
  orientationTests: number;
  exactAreaChecks: number;
}>;

export type RationalCandidateFaceTriangulation = Readonly<{
  status: 'candidate';
  scientificClaim: false;
  faceId: string;
  sourceVertexIds: readonly string[];
  triangles: readonly RationalCandidateFaceTriangle[];
  predicateStats: RationalFaceTriangulationStats;
}>;

export type RationalFaceTriangulationIssueCode =
  | 'invalid-input'
  | 'unknown-field'
  | 'invalid-object'
  | 'invalid-array'
  | 'invalid-face-id'
  | 'too-few-vertices'
  | 'invalid-vertex-id'
  | 'duplicate-vertex-id'
  | 'invalid-rational-coordinate'
  | 'duplicate-coordinate'
  | 'zero-length-edge'
  | 'missing-vertex'
  | 'degenerate-face'
  | 'wrong-face-winding'
  | 'self-intersection'
  | 'predicate-failure'
  | 'triangulation-stalled'
  | 'triangle-count-mismatch'
  | 'triangle-winding-mismatch'
  | 'triangle-area-mismatch'
  | 'vertex-coverage-mismatch'
  | 'triangle-id-collision'
  | 'internal-failure';

export type RationalFaceTriangulationIssue = Readonly<{
  path: string;
  code: RationalFaceTriangulationIssueCode;
  message: string;
}>;

export type RationalFaceTriangulationResult =
  | Readonly<{ ok: true; value: RationalCandidateFaceTriangulation }>
  | Readonly<{ ok: false; error: readonly RationalFaceTriangulationIssue[] }>;

interface MutablePredicateStats {
  segmentPairTests: number;
  orientationTests: number;
  exactAreaChecks: number;
}

interface MutableTriangle {
  id: string;
  faceId: string;
  vertexIds: [string, string, string];
  semanticVertexIds: [string, string, string];
  points: [ExactRationalPoint2, ExactRationalPoint2, ExactRationalPoint2];
}

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const SIMPLE_INPUT_KEYS = ['faceId', 'vertices'] as const;
const ADAPTER_INPUT_KEYS = ['boundary', 'vertices'] as const;
const BOUNDARY_KEYS = ['areaSign', 'edgeIds', 'id', 'vertexIds'] as const;
const VERTEX_KEYS = ['id', 'point'] as const;
const POINT_KEYS = ['x', 'y'] as const;
const RATIONAL_KEYS = ['denominator', 'numerator'] as const;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function failure(
  issues: readonly RationalFaceTriangulationIssue[],
): RationalFaceTriangulationResult {
  return deepFreezeOwned({
    ok: false,
    error: issues.map((issue) => ({ ...issue })),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function containsNonPlainDataObject(value: unknown, seen: WeakSet<object>): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return false;
  seen.add(value);
  const prototype: unknown = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) return true;
  } else if (prototype !== Object.prototype && prototype !== null) {
    return true;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === 'symbol') return true;
    const descriptor = descriptors[key];
    if (descriptor === undefined) return true;
    if (!descriptor.enumerable && !(Array.isArray(value) && key === 'length')) return true;
    if ('value' in descriptor && containsNonPlainDataObject(descriptor.value, seen)) return true;
  }
  return false;
}

function isPlainBigIntSnapshot(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return true;
  }
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
        return false;
      }
      return value.every((entry) => isPlainBigIntSnapshot(entry, ancestors));
    }
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    return Object.values(value).every((entry) => isPlainBigIntSnapshot(entry, ancestors));
  } finally {
    ancestors.delete(value);
  }
}

function captureBigIntPlainInput(
  value: unknown,
):
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; reason: 'uncloneable' | 'non-plain-data' }> {
  try {
    if (containsNonPlainDataObject(value, new WeakSet<object>())) {
      return { ok: false, reason: 'non-plain-data' };
    }
    const snapshot: unknown = structuredClone(value);
    return isPlainBigIntSnapshot(snapshot, new WeakSet<object>())
      ? { ok: true, value: snapshot }
      : { ok: false, reason: 'non-plain-data' };
  } catch {
    return { ok: false, reason: 'uncloneable' };
  }
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: RationalFaceTriangulationIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push({
        path: `${path}.${key}`,
        code: 'unknown-field',
        message: `unknown field ${key} is not allowed`,
      });
    }
  }
}

function parseRational(
  value: unknown,
  path: string,
  issues: RationalFaceTriangulationIssue[],
): ExactRational | undefined {
  if (!isRecord(value)) {
    issues.push({
      path,
      code: 'invalid-rational-coordinate',
      message: 'coordinate must be an exact rational object',
    });
    return undefined;
  }
  rejectUnknownFields(value, RATIONAL_KEYS, path, issues);
  const numerator = value.numerator;
  const denominator = value.denominator;
  if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint') {
    issues.push({
      path,
      code: 'invalid-rational-coordinate',
      message: 'rational numerator and denominator must be bigint values',
    });
    return undefined;
  }
  return { numerator, denominator };
}

function parsePoint(
  value: unknown,
  path: string,
  issues: RationalFaceTriangulationIssue[],
): ExactRationalPoint2 | undefined {
  if (!isRecord(value)) {
    issues.push({ path, code: 'invalid-object', message: 'point must be a plain object' });
    return undefined;
  }
  rejectUnknownFields(value, POINT_KEYS, path, issues);
  const x = parseRational(value.x, `${path}.x`, issues);
  const y = parseRational(value.y, `${path}.y`, issues);
  return x === undefined || y === undefined ? undefined : { x, y };
}

function parseVertices(
  value: unknown,
  path: string,
  issues: RationalFaceTriangulationIssue[],
): RationalFaceRingVertex2[] | undefined {
  if (!Array.isArray(value)) {
    issues.push({ path, code: 'invalid-array', message: 'vertices must be an array' });
    return undefined;
  }
  const vertices: RationalFaceRingVertex2[] = [];
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      issues.push({ path: entryPath, code: 'invalid-object', message: 'vertex must be an object' });
      return;
    }
    rejectUnknownFields(entry, VERTEX_KEYS, entryPath, issues);
    const id = entry.id;
    if (typeof id !== 'string') {
      issues.push({
        path: `${entryPath}.id`,
        code: 'invalid-vertex-id',
        message: 'vertex ID must be a string',
      });
    }
    const point = parsePoint(entry.point, `${entryPath}.point`, issues);
    if (typeof id === 'string' && point !== undefined) vertices.push({ id, point });
  });
  return vertices;
}

function captureRationalSimpleInput(
  input: unknown,
):
  | Readonly<{ ok: true; value: RationalSimpleFaceRing2 }>
  | Readonly<{ ok: false; error: readonly RationalFaceTriangulationIssue[] }> {
  const captured = captureBigIntPlainInput(input);
  if (!captured.ok) {
    return {
      ok: false,
      error: [
        { path: '$', code: 'invalid-input', message: `input snapshot is ${captured.reason}` },
      ],
    };
  }
  if (!isRecord(captured.value)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'input must be a plain object' }],
    };
  }
  const issues: RationalFaceTriangulationIssue[] = [];
  rejectUnknownFields(captured.value, SIMPLE_INPUT_KEYS, '$', issues);
  const faceId = captured.value.faceId;
  if (typeof faceId !== 'string') {
    issues.push({ path: '$.faceId', code: 'invalid-face-id', message: 'faceId must be a string' });
  }
  const vertices = parseVertices(captured.value.vertices, '$.vertices', issues);
  if (issues.length > 0 || typeof faceId !== 'string' || vertices === undefined) {
    return { ok: false, error: issues };
  }
  return { ok: true, value: { faceId, vertices } };
}

function parseStringArray(
  value: unknown,
  path: string,
  issues: RationalFaceTriangulationIssue[],
): string[] | undefined {
  if (!Array.isArray(value)) {
    issues.push({ path, code: 'invalid-array', message: 'value must be an array of strings' });
    return undefined;
  }
  const strings: string[] = [];
  value.forEach((entry, index) => {
    if (typeof entry !== 'string') {
      issues.push({
        path: `${path}[${index}]`,
        code: 'invalid-array',
        message: 'array entry must be a string',
      });
    } else {
      strings.push(entry);
    }
  });
  return strings;
}

function capturePlanarRationalFaceInput(
  input: unknown,
):
  | Readonly<{ ok: true; value: PlanarRationalFaceInput }>
  | Readonly<{ ok: false; error: readonly RationalFaceTriangulationIssue[] }> {
  const captured = captureBigIntPlainInput(input);
  if (!captured.ok) {
    return {
      ok: false,
      error: [
        { path: '$', code: 'invalid-input', message: `input snapshot is ${captured.reason}` },
      ],
    };
  }
  if (!isRecord(captured.value)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'input must be a plain object' }],
    };
  }
  const issues: RationalFaceTriangulationIssue[] = [];
  rejectUnknownFields(captured.value, ADAPTER_INPUT_KEYS, '$', issues);
  const boundaryValue = captured.value.boundary;
  if (!isRecord(boundaryValue)) {
    issues.push({
      path: '$.boundary',
      code: 'invalid-object',
      message: 'boundary must be a plain object',
    });
  }
  const vertices = parseVertices(captured.value.vertices, '$.vertices', issues);
  if (!isRecord(boundaryValue)) return { ok: false, error: issues };

  rejectUnknownFields(boundaryValue, BOUNDARY_KEYS, '$.boundary', issues);
  const id = boundaryValue.id;
  if (typeof id !== 'string') {
    issues.push({
      path: '$.boundary.id',
      code: 'invalid-face-id',
      message: 'boundary ID must be a string',
    });
  }
  const vertexIds = parseStringArray(boundaryValue.vertexIds, '$.boundary.vertexIds', issues);
  if (boundaryValue.edgeIds !== undefined) {
    parseStringArray(boundaryValue.edgeIds, '$.boundary.edgeIds', issues);
  }
  if (boundaryValue.areaSign !== undefined && boundaryValue.areaSign !== -1) {
    issues.push({
      path: '$.boundary.areaSign',
      code: 'wrong-face-winding',
      message: 'bounded planar face must declare negative areaSign',
    });
  }
  if (
    issues.length > 0 ||
    typeof id !== 'string' ||
    vertexIds === undefined ||
    vertices === undefined
  ) {
    return { ok: false, error: issues };
  }
  return {
    ok: true,
    value: { boundary: { id, vertexIds }, vertices },
  };
}

function isCanonicalExactRational(value: unknown): value is ExactRational {
  if (!isRecord(value)) return false;
  const numerator = value.numerator;
  const denominator = value.denominator;
  if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint' || denominator <= 0n) {
    return false;
  }
  const canonical = exactRational(numerator, denominator);
  return canonical.numerator === numerator && canonical.denominator === denominator;
}

function isCanonicalPoint(point: unknown): point is ExactRationalPoint2 {
  return isRecord(point) && isCanonicalExactRational(point.x) && isCanonicalExactRational(point.y);
}

function validateBasicInput(input: RationalSimpleFaceRing2): RationalFaceTriangulationIssue[] {
  const issues: RationalFaceTriangulationIssue[] = [];
  if (!ID_PATTERN.test(input.faceId)) {
    issues.push({
      path: '$.faceId',
      code: 'invalid-face-id',
      message: 'faceId must be a stable ID of 1..128 ASCII characters',
    });
  }
  if (input.vertices.length < 3) {
    issues.push({
      path: '$.vertices',
      code: 'too-few-vertices',
      message: 'a bounded face ring needs at least three vertices',
    });
  }

  const seenIds = new Set<string>();
  input.vertices.forEach((vertex, index) => {
    const path = `$.vertices[${index}]`;
    if (!ID_PATTERN.test(vertex.id)) {
      issues.push({
        path: `${path}.id`,
        code: 'invalid-vertex-id',
        message: 'vertex ID must be a stable ID of 1..128 ASCII characters',
      });
    } else if (seenIds.has(vertex.id)) {
      issues.push({
        path: `${path}.id`,
        code: 'duplicate-vertex-id',
        message: `vertex ID ${vertex.id} is duplicated`,
      });
    }
    seenIds.add(vertex.id);
    if (!isCanonicalPoint(vertex.point)) {
      issues.push({
        path: `${path}.point`,
        code: 'invalid-rational-coordinate',
        message: 'point coordinates must be reduced exact rationals with positive denominators',
      });
    }
  });

  for (let leftIndex = 0; leftIndex < input.vertices.length; leftIndex += 1) {
    const left = input.vertices[leftIndex];
    if (left === undefined || !isCanonicalPoint(left.point)) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < input.vertices.length; rightIndex += 1) {
      const right = input.vertices[rightIndex];
      if (right === undefined || !isCanonicalPoint(right.point)) continue;
      if (equalExactRationalPoints(left.point, right.point)) {
        issues.push({
          path: `$.vertices[${rightIndex}]`,
          code: 'duplicate-coordinate',
          message: `coordinates duplicate $.vertices[${leftIndex}]`,
        });
      }
    }
  }

  if (input.vertices.length > 0) {
    input.vertices.forEach((vertex, index) => {
      const next = input.vertices[(index + 1) % input.vertices.length];
      if (
        next !== undefined &&
        isCanonicalPoint(vertex.point) &&
        isCanonicalPoint(next.point) &&
        equalExactRationalPoints(vertex.point, next.point)
      ) {
        issues.push({
          path: `$.vertices[${index}]`,
          code: 'zero-length-edge',
          message: 'consecutive face vertices must have different coordinates',
        });
      }
    });
  }
  return issues;
}

function clonePoint(point: ExactRationalPoint2): ExactRationalPoint2 {
  return {
    x: exactRational(point.x.numerator, point.x.denominator),
    y: exactRational(point.y.numerator, point.y.denominator),
  };
}

function canonicalRing(vertices: readonly RationalFaceRingVertex2[]): RationalFaceRingVertex2[] {
  let firstIndex = 0;
  for (let index = 1; index < vertices.length; index += 1) {
    const candidate = vertices[index];
    const current = vertices[firstIndex];
    if (
      candidate !== undefined &&
      current !== undefined &&
      compareCodeUnits(candidate.id, current.id) < 0
    ) {
      firstIndex = index;
    }
  }
  return Array.from({ length: vertices.length }, (_, offset) => {
    const source = vertices[(firstIndex + offset) % vertices.length];
    if (source === undefined) throw new TypeError('canonical ring source vertex is missing');
    return { id: source.id, point: clonePoint(source.point) };
  });
}

function exactTwiceSignedArea(points: readonly ExactRationalPoint2[]): ExactRational {
  return points.reduce<ExactRational>((sum, current, index) => {
    const next = points[(index + 1) % points.length];
    if (next === undefined) throw new TypeError('area calculation requires a non-empty ring');
    const cross = subtractExactRational(
      multiplyExactRational(current.x, next.y),
      multiplyExactRational(current.y, next.x),
    );
    return addExactRational(sum, cross);
  }, exactRational(0n));
}

function polygonEdges(vertices: readonly RationalFaceRingVertex2[]): readonly ExactSegment2[] {
  return vertices.map((vertex, index) => {
    const next = vertices[(index + 1) % vertices.length];
    if (next === undefined) throw new TypeError('polygon edge endpoint is missing');
    return { start: vertex.point, end: next.point };
  });
}

function edgesAreAdjacent(firstIndex: number, secondIndex: number, edgeCount: number): boolean {
  return secondIndex === firstIndex + 1 || (firstIndex === 0 && secondIndex === edgeCount - 1);
}

function validateSimpleRing(
  vertices: readonly RationalFaceRingVertex2[],
  stats: MutablePredicateStats,
): RationalFaceTriangulationIssue[] {
  const issues: RationalFaceTriangulationIssue[] = [];
  const edges = polygonEdges(vertices);
  for (let firstIndex = 0; firstIndex < edges.length; firstIndex += 1) {
    const first = edges[firstIndex];
    if (first === undefined) throw new TypeError('polygon edge is missing');
    for (let secondIndex = firstIndex + 1; secondIndex < edges.length; secondIndex += 1) {
      const second = edges[secondIndex];
      if (second === undefined) throw new TypeError('polygon edge is missing');
      stats.segmentPairTests += 1;
      stats.orientationTests += 4;
      let classification;
      try {
        classification = classifyExactSegmentIntersection(first, second);
      } catch {
        issues.push({
          path: `$.vertices[${firstIndex}]`,
          code: 'predicate-failure',
          message: `could not classify face edges ${firstIndex} and ${secondIndex}`,
        });
        continue;
      }
      const adjacent = edgesAreAdjacent(firstIndex, secondIndex, edges.length);
      const validAdjacentTouch = adjacent && classification.kind === 'endpoint-touch';
      const validDisjoint = !adjacent && classification.kind === 'disjoint';
      if (!validAdjacentTouch && !validDisjoint) {
        issues.push({
          path: `$.vertices[${firstIndex}]`,
          code: 'self-intersection',
          message: `face edges ${firstIndex} and ${secondIndex} have invalid ${classification.kind} topology`,
        });
      }
    }
  }
  return issues;
}

function exactOrientation(
  a: ExactRationalPoint2,
  b: ExactRationalPoint2,
  c: ExactRationalPoint2,
  stats: MutablePredicateStats,
): -1 | 0 | 1 {
  stats.orientationTests += 1;
  return exactRationalOrientationSign(a, b, c);
}

function pointInClosedNegativeTriangle(
  point: ExactRationalPoint2,
  triangle: readonly [ExactRationalPoint2, ExactRationalPoint2, ExactRationalPoint2],
  stats: MutablePredicateStats,
): boolean {
  const [first, second, third] = triangle;
  return (
    exactOrientation(first, second, point, stats) <= 0 &&
    exactOrientation(second, third, point, stats) <= 0 &&
    exactOrientation(third, first, point, stats) <= 0
  );
}

function semanticVertexIds(
  vertices: readonly [RationalFaceRingVertex2, RationalFaceRingVertex2, RationalFaceRingVertex2],
): readonly [string, string, string] {
  const sorted = vertices.map((vertex) => vertex.id).sort(compareCodeUnits);
  const [first, second, third] = sorted;
  if (first === undefined || second === undefined || third === undefined) {
    throw new TypeError('triangle requires three semantic vertex IDs');
  }
  return [first, second, third];
}

function encodeTriangleId(faceId: string, vertexIds: readonly [string, string, string]): string {
  const components = ['candidate-rational-triangle-v1', faceId, ...vertexIds];
  return components.map((component) => `${component.length}:${component}`).join(':');
}

function makeTriangle(
  faceId: string,
  vertices: [RationalFaceRingVertex2, RationalFaceRingVertex2, RationalFaceRingVertex2],
): MutableTriangle {
  const semantic = semanticVertexIds(vertices);
  return {
    id: encodeTriangleId(faceId, semantic),
    faceId,
    vertexIds: [vertices[0].id, vertices[1].id, vertices[2].id],
    semanticVertexIds: [semantic[0], semantic[1], semantic[2]],
    points: [vertices[0].point, vertices[1].point, vertices[2].point],
  };
}

function triangulateCanonicalRing(
  faceId: string,
  source: readonly RationalFaceRingVertex2[],
  stats: MutablePredicateStats,
): MutableTriangle[] | undefined {
  const remaining = [...source];
  const triangles: MutableTriangle[] = [];
  while (remaining.length > 3) {
    const ears = remaining
      .map((current, index) => {
        const previousIndex = (index - 1 + remaining.length) % remaining.length;
        const nextIndex = (index + 1) % remaining.length;
        const previous = remaining[previousIndex];
        const next = remaining[nextIndex];
        if (previous === undefined || next === undefined) {
          throw new TypeError('ear neighborhood is incomplete');
        }
        if (exactOrientation(previous.point, current.point, next.point, stats) !== -1) {
          return undefined;
        }
        const points: [ExactRationalPoint2, ExactRationalPoint2, ExactRationalPoint2] = [
          previous.point,
          current.point,
          next.point,
        ];
        const blocked = remaining.some(
          (vertex, vertexIndex) =>
            vertexIndex !== previousIndex &&
            vertexIndex !== index &&
            vertexIndex !== nextIndex &&
            pointInClosedNegativeTriangle(vertex.point, points, stats),
        );
        return blocked
          ? undefined
          : { index, triangle: makeTriangle(faceId, [previous, current, next]) };
      })
      .filter(
        (candidate): candidate is Readonly<{ index: number; triangle: MutableTriangle }> =>
          candidate !== undefined,
      );
    if (ears.length === 0) return undefined;
    const selected = [...ears].sort((left, right) =>
      compareCodeUnits(left.triangle.id, right.triangle.id),
    )[0];
    if (selected === undefined) return undefined;
    triangles.push(selected.triangle);
    remaining.splice(selected.index, 1);
  }

  const [first, second, third] = remaining;
  if (first === undefined || second === undefined || third === undefined) return undefined;
  if (exactOrientation(first.point, second.point, third.point, stats) !== -1) return undefined;
  triangles.push(makeTriangle(faceId, [first, second, third]));
  return triangles;
}

function validateTriangulation(
  source: readonly RationalFaceRingVertex2[],
  triangles: readonly MutableTriangle[],
  stats: MutablePredicateStats,
): RationalFaceTriangulationIssue[] {
  const issues: RationalFaceTriangulationIssue[] = [];
  if (triangles.length !== source.length - 2) {
    issues.push({
      path: '$.triangles',
      code: 'triangle-count-mismatch',
      message: `expected ${source.length - 2} triangles, received ${triangles.length}`,
    });
  }

  for (const triangle of triangles) {
    stats.exactAreaChecks += 1;
    if (signExactRational(exactTwiceSignedArea(triangle.points)) !== -1) {
      issues.push({
        path: '$.triangles',
        code: 'triangle-winding-mismatch',
        message: `triangle ${triangle.id} is not a non-degenerate negative-winding triangle`,
      });
    }
  }

  stats.exactAreaChecks += 2;
  const sourceArea = exactTwiceSignedArea(source.map((vertex) => vertex.point));
  const triangleArea = triangles.reduce<ExactRational>(
    (sum, triangle) => addExactRational(sum, exactTwiceSignedArea(triangle.points)),
    exactRational(0n),
  );
  if (!equalExactRational(sourceArea, triangleArea)) {
    issues.push({
      path: '$.triangles',
      code: 'triangle-area-mismatch',
      message: 'the exact rational face area is not preserved by the triangles',
    });
  }

  const covered = new Set(triangles.flatMap((triangle) => triangle.vertexIds));
  if (source.some((vertex) => !covered.has(vertex.id))) {
    issues.push({
      path: '$.triangles',
      code: 'vertex-coverage-mismatch',
      message: 'every source face vertex must occur in at least one triangle',
    });
  }
  if (new Set(triangles.map((triangle) => triangle.id)).size !== triangles.length) {
    issues.push({
      path: '$.triangles',
      code: 'triangle-id-collision',
      message: 'candidate triangle IDs must be unique within the source face',
    });
  }
  return issues;
}

function freezeStringTriple(
  values: readonly [string, string, string],
): readonly [string, string, string] {
  return Object.freeze([values[0], values[1], values[2]]);
}

function success(
  faceId: string,
  source: readonly RationalFaceRingVertex2[],
  triangles: readonly MutableTriangle[],
  stats: MutablePredicateStats,
): RationalFaceTriangulationResult {
  const value: RationalCandidateFaceTriangulation = {
    status: 'candidate',
    scientificClaim: false,
    faceId,
    sourceVertexIds: source.map((vertex) => vertex.id),
    triangles: [...triangles]
      .sort((left, right) => compareCodeUnits(left.id, right.id))
      .map((triangle) => ({
        id: triangle.id,
        faceId: triangle.faceId,
        vertexIds: freezeStringTriple(triangle.vertexIds),
        semanticVertexIds: freezeStringTriple(triangle.semanticVertexIds),
      })),
    predicateStats: { ...stats },
  };
  return deepFreezeOwned({ ok: true, value });
}

/**
 * Candidate-only exact triangulation for one ordered rational bounded-face
 * ring. No binary64/display conversion occurs anywhere in this operation.
 */
function triangulateCapturedRationalSimpleFaceCandidate(
  input: RationalSimpleFaceRing2,
): RationalFaceTriangulationResult {
  const basicIssues = validateBasicInput(input);
  if (basicIssues.length > 0) return failure(basicIssues);

  const source = canonicalRing(input.vertices);
  const stats: MutablePredicateStats = {
    segmentPairTests: 0,
    orientationTests: 0,
    exactAreaChecks: 0,
  };
  const geometryIssues = validateSimpleRing(source, stats);
  stats.exactAreaChecks += 1;
  const areaSign = signExactRational(exactTwiceSignedArea(source.map((vertex) => vertex.point)));
  if (areaSign === 0) {
    geometryIssues.push({
      path: '$.vertices',
      code: 'degenerate-face',
      message: 'face ring must have nonzero exact rational signed area',
    });
  } else if (areaSign !== -1) {
    geometryIssues.push({
      path: '$.vertices',
      code: 'wrong-face-winding',
      message: 'bounded face ring must use negative winding in stored paper coordinates',
    });
  }
  if (geometryIssues.length > 0) return failure(geometryIssues);

  const triangles = triangulateCanonicalRing(input.faceId, source, stats);
  if (triangles === undefined) {
    return failure([
      {
        path: '$.vertices',
        code: 'triangulation-stalled',
        message: 'no exact non-degenerate ear without another boundary vertex was available',
      },
    ]);
  }
  const triangulationIssues = validateTriangulation(source, triangles, stats);
  if (triangulationIssues.length > 0) return failure(triangulationIssues);
  return success(input.faceId, source, triangles, stats);
}

export function triangulateRationalSimpleFaceCandidate(
  input: RationalSimpleFaceRing2,
): RationalFaceTriangulationResult;
/** Runtime implementation deliberately accepts hostile untyped JavaScript callers. */
export function triangulateRationalSimpleFaceCandidate(
  input: unknown,
): RationalFaceTriangulationResult {
  const captured = captureRationalSimpleInput(input);
  if (!captured.ok) return failure(captured.error);
  try {
    return triangulateCapturedRationalSimpleFaceCandidate(captured.value);
  } catch {
    return failure([
      {
        path: '$',
        code: 'internal-failure',
        message: 'rational triangulation failed closed after input validation',
      },
    ]);
  }
}

/** Resolves a planar face boundary directly against a planarization vertex table. */
function triangulateCapturedPlanarRationalFaceCandidate(
  input: PlanarRationalFaceInput,
): RationalFaceTriangulationResult {
  const byId = new Map<string, RationalFaceRingVertex2>();
  const issues: RationalFaceTriangulationIssue[] = [];
  input.vertices.forEach((vertex, index) => {
    const path = `$.vertices[${index}]`;
    if (!ID_PATTERN.test(vertex.id)) {
      issues.push({
        path: `${path}.id`,
        code: 'invalid-vertex-id',
        message: 'planarization vertex ID must be a stable ID',
      });
    } else if (byId.has(vertex.id)) {
      issues.push({
        path: `${path}.id`,
        code: 'duplicate-vertex-id',
        message: `planarization vertex ID ${vertex.id} is duplicated`,
      });
    }
    if (!isCanonicalPoint(vertex.point)) {
      issues.push({
        path: `${path}.point`,
        code: 'invalid-rational-coordinate',
        message: 'planarization coordinate must be a normalized exact rational point',
      });
    }
    if (!byId.has(vertex.id)) {
      byId.set(vertex.id, vertex);
    }
  });
  for (let leftIndex = 0; leftIndex < input.vertices.length; leftIndex += 1) {
    const left = input.vertices[leftIndex];
    if (left === undefined || !isCanonicalPoint(left.point)) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < input.vertices.length; rightIndex += 1) {
      const right = input.vertices[rightIndex];
      if (
        right !== undefined &&
        isCanonicalPoint(right.point) &&
        equalExactRationalPoints(left.point, right.point)
      ) {
        issues.push({
          path: `$.vertices[${rightIndex}]`,
          code: 'duplicate-coordinate',
          message: `coordinates duplicate $.vertices[${leftIndex}]`,
        });
      }
    }
  }
  const ordered = input.boundary.vertexIds.flatMap((vertexId, index) => {
    const vertex = byId.get(vertexId);
    if (vertex !== undefined) return [vertex];
    issues.push({
      path: `$.boundary.vertexIds[${index}]`,
      code: 'missing-vertex',
      message: `face boundary references missing planarization vertex ${vertexId}`,
    });
    return [];
  });
  if (issues.length > 0) return failure(issues);
  return triangulateCapturedRationalSimpleFaceCandidate({
    faceId: input.boundary.id,
    vertices: ordered,
  });
}

export function triangulatePlanarRationalFaceCandidate(
  input: PlanarRationalFaceInput,
): RationalFaceTriangulationResult;
/** Runtime implementation deliberately accepts hostile untyped JavaScript callers. */
export function triangulatePlanarRationalFaceCandidate(
  input: unknown,
): RationalFaceTriangulationResult {
  const captured = capturePlanarRationalFaceInput(input);
  if (!captured.ok) return failure(captured.error);
  try {
    return triangulateCapturedPlanarRationalFaceCandidate(captured.value);
  } catch {
    return failure([
      {
        path: '$',
        code: 'internal-failure',
        message: 'planar rational face adapter failed closed after input validation',
      },
    ]);
  }
}
