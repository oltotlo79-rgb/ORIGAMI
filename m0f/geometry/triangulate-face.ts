import { tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { exactPolygonAreaSign } from '../model/exact-dyadic.js';
import {
  classifySegmentIntersection,
  orientation2D,
  type OrientationPolicy,
  type Point2,
  type Segment2,
} from './predicates.js';

export type FaceRingVertex2 = Readonly<{
  id: string;
  x: number;
  y: number;
}>;

export type SimpleFaceRing2 = Readonly<{
  faceId: string;
  vertices: readonly FaceRingVertex2[];
}>;

export type CandidateFaceTriangle = Readonly<{
  /** Collision-free, length-prefixed encoding of faceId and the sorted vertex-ID tuple. */
  id: string;
  faceId: string;
  /** Canonical negative winding in stored paper coordinates (x right, y down). */
  vertexIds: readonly [string, string, string];
  /** Order-independent semantic identity used to derive `id`. */
  semanticVertexIds: readonly [string, string, string];
}>;

export type FaceTriangulationPredicateStats = Readonly<{
  segmentPairTests: number;
  orientationTests: number;
  exactFallbacks: number;
  exactAreaChecks: number;
}>;

export type CandidateFaceTriangulation = Readonly<{
  status: 'candidate';
  scientificClaim: false;
  faceId: string;
  /** Negative-winding source ring, rotated to the smallest stable vertex ID. */
  sourceVertexIds: readonly string[];
  triangles: readonly CandidateFaceTriangle[];
  predicateStats: FaceTriangulationPredicateStats;
}>;

export type FaceTriangulationIssueCode =
  | 'invalid-input'
  | 'unknown-field'
  | 'invalid-object'
  | 'invalid-array'
  | 'invalid-face-id'
  | 'too-few-vertices'
  | 'invalid-vertex-id'
  | 'duplicate-vertex-id'
  | 'non-finite-coordinate'
  | 'duplicate-coordinate'
  | 'zero-length-edge'
  | 'invalid-orientation-policy'
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

export type FaceTriangulationIssue = Readonly<{
  path: string;
  code: FaceTriangulationIssueCode;
  message: string;
}>;

export type FaceTriangulationResult =
  | Readonly<{ ok: true; value: CandidateFaceTriangulation }>
  | Readonly<{ ok: false; error: readonly FaceTriangulationIssue[] }>;

interface MutablePredicateStats {
  segmentPairTests: number;
  orientationTests: number;
  exactFallbacks: number;
  exactAreaChecks: number;
}

type Dyadic = Readonly<{
  coefficient: bigint;
  exponent: number;
}>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const FRACTION_MASK = (1n << 52n) - 1n;
const HIDDEN_BIT = 1n << 52n;
const EXPONENT_MASK = 0x7ffn;
// Triangulation is synchronous, and every Worker has its own module realm.
const BINARY64_SCRATCH_VIEW = new DataView(new ArrayBuffer(8));
const INPUT_KEYS = ['faceId', 'vertices'] as const;
const VERTEX_KEYS = ['id', 'x', 'y'] as const;
const POLICY_KEYS = ['fastFilterArea'] as const;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function freezeIssue(issue: FaceTriangulationIssue): FaceTriangulationIssue {
  return Object.freeze({ ...issue });
}

function failure(issues: readonly FaceTriangulationIssue[]): FaceTriangulationResult {
  return Object.freeze({
    ok: false,
    error: Object.freeze(issues.map(freezeIssue)),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks original data descriptors without invoking accessors before the one snapshot read. */
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

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: FaceTriangulationIssue[],
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

type CapturedBinaryInvocation = Readonly<{
  input: SimpleFaceRing2;
  policy: OrientationPolicy;
}>;

function captureBinaryInvocation(
  input: unknown,
  policy: unknown,
):
  | Readonly<{ ok: true; value: CapturedBinaryInvocation }>
  | Readonly<{ ok: false; error: readonly FaceTriangulationIssue[] }> {
  const invocation = { input, policy };
  try {
    if (containsNonPlainDataObject(invocation, new WeakSet<object>())) {
      return {
        ok: false,
        error: [
          {
            path: '$',
            code: 'invalid-input',
            message: 'input must contain only plain objects and arrays',
          },
        ],
      };
    }
  } catch {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-input', message: 'input shape could not be inspected' }],
    };
  }

  const captured = tryCreateValidationSnapshot<unknown>(invocation);
  if (!captured.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-input',
          message: `input snapshot is ${captured.reason}`,
        },
      ],
    };
  }
  if (!isRecord(captured.value)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-input', message: 'invocation must be an object' }],
    };
  }

  const issues: FaceTriangulationIssue[] = [];
  const inputValue = captured.value.input;
  const policyValue = captured.value.policy;
  if (!isRecord(inputValue)) {
    issues.push({ path: '$', code: 'invalid-object', message: 'input must be a plain object' });
  }
  if (!isRecord(policyValue)) {
    issues.push({
      path: '$.policy',
      code: 'invalid-object',
      message: 'policy must be a plain object',
    });
  }
  if (!isRecord(inputValue) || !isRecord(policyValue)) return { ok: false, error: issues };

  rejectUnknownFields(inputValue, INPUT_KEYS, '$', issues);
  rejectUnknownFields(policyValue, POLICY_KEYS, '$.policy', issues);
  const faceId = inputValue.faceId;
  if (typeof faceId !== 'string') {
    issues.push({
      path: '$.faceId',
      code: 'invalid-face-id',
      message: 'faceId must be a string',
    });
  }
  const verticesValue = inputValue.vertices;
  if (!Array.isArray(verticesValue)) {
    issues.push({
      path: '$.vertices',
      code: 'invalid-array',
      message: 'vertices must be an array',
    });
  }
  const fastFilterArea = policyValue.fastFilterArea;
  if (typeof fastFilterArea !== 'number') {
    issues.push({
      path: '$.policy.fastFilterArea',
      code: 'invalid-orientation-policy',
      message: 'fastFilterArea must be a number',
    });
  }

  const vertices: FaceRingVertex2[] = [];
  if (Array.isArray(verticesValue)) {
    verticesValue.forEach((vertexValue, index) => {
      const path = `$.vertices[${index}]`;
      if (!isRecord(vertexValue)) {
        issues.push({ path, code: 'invalid-object', message: 'vertex must be a plain object' });
        return;
      }
      rejectUnknownFields(vertexValue, VERTEX_KEYS, path, issues);
      const id = vertexValue.id;
      const x = vertexValue.x;
      const y = vertexValue.y;
      if (typeof id !== 'string') {
        issues.push({
          path: `${path}.id`,
          code: 'invalid-vertex-id',
          message: 'vertex ID must be a string',
        });
      }
      if (typeof x !== 'number') {
        issues.push({
          path: `${path}.x`,
          code: 'non-finite-coordinate',
          message: 'coordinate must be a finite binary64 number',
        });
      }
      if (typeof y !== 'number') {
        issues.push({
          path: `${path}.y`,
          code: 'non-finite-coordinate',
          message: 'coordinate must be a finite binary64 number',
        });
      }
      if (typeof id === 'string' && typeof x === 'number' && typeof y === 'number') {
        vertices.push({ id, x, y });
      }
    });
  }
  if (issues.length > 0 || typeof faceId !== 'string' || typeof fastFilterArea !== 'number') {
    return { ok: false, error: issues };
  }
  return {
    ok: true,
    value: { input: { faceId, vertices }, policy: { fastFilterArea } },
  };
}

function finiteNumberToDyadic(value: number): Dyadic {
  BINARY64_SCRATCH_VIEW.setFloat64(0, value, false);
  const bits = BINARY64_SCRATCH_VIEW.getBigUint64(0, false);
  const negative = bits >> 63n === 1n;
  const exponentBits = Number((bits >> 52n) & EXPONENT_MASK);
  const fraction = bits & FRACTION_MASK;
  const unsignedCoefficient = exponentBits === 0 ? fraction : HIDDEN_BIT | fraction;
  return {
    coefficient: negative ? -unsignedCoefficient : unsignedCoefficient,
    exponent: exponentBits === 0 ? -1074 : exponentBits - 1023 - 52,
  };
}

function addDyadic(left: Dyadic, right: Dyadic): Dyadic {
  if (left.coefficient === 0n) return right;
  if (right.coefficient === 0n) return left;
  const exponent = Math.min(left.exponent, right.exponent);
  return {
    coefficient:
      (left.coefficient << BigInt(left.exponent - exponent)) +
      (right.coefficient << BigInt(right.exponent - exponent)),
    exponent,
  };
}

function multiplyDyadic(left: Dyadic, right: Dyadic): Dyadic {
  return {
    coefficient: left.coefficient * right.coefficient,
    exponent: left.exponent + right.exponent,
  };
}

function negateDyadic(value: Dyadic): Dyadic {
  return { coefficient: -value.coefficient, exponent: value.exponent };
}

function subtractDyadic(left: Dyadic, right: Dyadic): Dyadic {
  return addDyadic(left, negateDyadic(right));
}

function exactTwiceSignedArea(points: readonly Point2[]): Dyadic {
  let sum: Dyadic = { coefficient: 0n, exponent: 0 };
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (current === undefined || next === undefined) {
      throw new TypeError('area calculation requires a non-empty point ring');
    }
    sum = addDyadic(
      sum,
      subtractDyadic(
        multiplyDyadic(finiteNumberToDyadic(current.x), finiteNumberToDyadic(next.y)),
        multiplyDyadic(finiteNumberToDyadic(current.y), finiteNumberToDyadic(next.x)),
      ),
    );
  }
  return sum;
}

function dyadicEquals(left: Dyadic, right: Dyadic): boolean {
  if (left.coefficient === 0n || right.coefficient === 0n) {
    return left.coefficient === 0n && right.coefficient === 0n;
  }
  const exponent = Math.min(left.exponent, right.exponent);
  return (
    left.coefficient << BigInt(left.exponent - exponent) ===
    right.coefficient << BigInt(right.exponent - exponent)
  );
}

function coordinatesEqual(left: Point2, right: Point2): boolean {
  return left.x === right.x && left.y === right.y;
}

function validateBasicInput(
  input: SimpleFaceRing2,
  policy: OrientationPolicy,
): FaceTriangulationIssue[] {
  const issues: FaceTriangulationIssue[] = [];
  if (!ID_PATTERN.test(input.faceId)) {
    issues.push({
      path: '$.faceId',
      code: 'invalid-face-id',
      message: 'faceId must be a stable ID of 1..128 ASCII characters',
    });
  }
  if (!Number.isFinite(policy.fastFilterArea) || policy.fastFilterArea < 0) {
    issues.push({
      path: '$.policy.fastFilterArea',
      code: 'invalid-orientation-policy',
      message: 'fastFilterArea must be finite and non-negative',
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
    if (!Number.isFinite(vertex.x)) {
      issues.push({
        path: `${path}.x`,
        code: 'non-finite-coordinate',
        message: 'coordinate must be a finite binary64 number',
      });
    }
    if (!Number.isFinite(vertex.y)) {
      issues.push({
        path: `${path}.y`,
        code: 'non-finite-coordinate',
        message: 'coordinate must be a finite binary64 number',
      });
    }
  });

  for (let leftIndex = 0; leftIndex < input.vertices.length; leftIndex += 1) {
    const left = input.vertices[leftIndex];
    if (left === undefined || !Number.isFinite(left.x) || !Number.isFinite(left.y)) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < input.vertices.length; rightIndex += 1) {
      const right = input.vertices[rightIndex];
      if (right === undefined || !Number.isFinite(right.x) || !Number.isFinite(right.y)) continue;
      if (coordinatesEqual(left, right)) {
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
      if (next !== undefined && coordinatesEqual(vertex, next)) {
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

function canonicalRing(vertices: readonly FaceRingVertex2[]): FaceRingVertex2[] {
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
    return { id: source.id, x: source.x === 0 ? 0 : source.x, y: source.y === 0 ? 0 : source.y };
  });
}

function polygonEdges(vertices: readonly FaceRingVertex2[]): readonly Segment2[] {
  return vertices.map((vertex, index) => {
    const next = vertices[(index + 1) % vertices.length];
    if (next === undefined) throw new TypeError('polygon edge endpoint is missing');
    return { start: vertex, end: next };
  });
}

function edgesAreAdjacent(firstIndex: number, secondIndex: number, edgeCount: number): boolean {
  return secondIndex === firstIndex + 1 || (firstIndex === 0 && secondIndex === edgeCount - 1);
}

function validateSimpleRing(
  vertices: readonly FaceRingVertex2[],
  policy: OrientationPolicy,
  stats: MutablePredicateStats,
): FaceTriangulationIssue[] {
  const issues: FaceTriangulationIssue[] = [];
  const edges = polygonEdges(vertices);
  for (let firstIndex = 0; firstIndex < edges.length; firstIndex += 1) {
    const first = edges[firstIndex];
    if (first === undefined) throw new TypeError('polygon edge is missing');
    for (let secondIndex = firstIndex + 1; secondIndex < edges.length; secondIndex += 1) {
      const second = edges[secondIndex];
      if (second === undefined) throw new TypeError('polygon edge is missing');
      stats.segmentPairTests += 1;
      stats.orientationTests += 4;
      const classification = classifySegmentIntersection(first, second, policy);
      if (!classification.ok) {
        issues.push({
          path: `$.vertices[${firstIndex}]`,
          code: 'predicate-failure',
          message: `could not classify face edges ${firstIndex} and ${secondIndex}`,
        });
        continue;
      }
      stats.exactFallbacks += classification.value.exactFallbackCount;
      const adjacent = edgesAreAdjacent(firstIndex, secondIndex, edges.length);
      const validAdjacentTouch =
        adjacent &&
        classification.value.kind === 'touch' &&
        classification.value.onA !== 'interior' &&
        classification.value.onB !== 'interior';
      const validDisjoint = !adjacent && classification.value.kind === 'disjoint';
      if (!validAdjacentTouch && !validDisjoint) {
        issues.push({
          path: `$.vertices[${firstIndex}]`,
          code: 'self-intersection',
          message: `face edges ${firstIndex} and ${secondIndex} have invalid ${classification.value.kind} topology`,
        });
      }
    }
  }
  return issues;
}

function exactOrientation(
  a: Point2,
  b: Point2,
  c: Point2,
  policy: OrientationPolicy,
  stats: MutablePredicateStats,
): -1 | 0 | 1 {
  stats.orientationTests += 1;
  const result = orientation2D(a, b, c, policy);
  if (!result.ok) throw new TypeError('validated triangulation point failed orientation');
  if (result.value.path === 'exact-dyadic') stats.exactFallbacks += 1;
  return result.value.sign;
}

function pointInClosedNegativeTriangle(
  point: Point2,
  triangle: readonly [FaceRingVertex2, FaceRingVertex2, FaceRingVertex2],
  policy: OrientationPolicy,
  stats: MutablePredicateStats,
): boolean {
  const [first, second, third] = triangle;
  return (
    exactOrientation(first, second, point, policy, stats) <= 0 &&
    exactOrientation(second, third, point, policy, stats) <= 0 &&
    exactOrientation(third, first, point, policy, stats) <= 0
  );
}

function semanticVertexIds(
  vertices: readonly [FaceRingVertex2, FaceRingVertex2, FaceRingVertex2],
): readonly [string, string, string] {
  const sorted = vertices.map((vertex) => vertex.id).sort(compareCodeUnits);
  const [first, second, third] = sorted;
  if (first === undefined || second === undefined || third === undefined) {
    throw new TypeError('triangle requires three semantic vertex IDs');
  }
  return [first, second, third];
}

function encodeTriangleId(faceId: string, vertexIds: readonly [string, string, string]): string {
  const components = ['candidate-triangle-v1', faceId, ...vertexIds];
  return components.map((component) => `${component.length}:${component}`).join(':');
}

interface MutableTriangle {
  id: string;
  faceId: string;
  vertexIds: [string, string, string];
  semanticVertexIds: [string, string, string];
  points: [FaceRingVertex2, FaceRingVertex2, FaceRingVertex2];
}

function makeTriangle(
  faceId: string,
  points: [FaceRingVertex2, FaceRingVertex2, FaceRingVertex2],
): MutableTriangle {
  const semantic = semanticVertexIds(points);
  return {
    id: encodeTriangleId(faceId, semantic),
    faceId,
    vertexIds: [points[0].id, points[1].id, points[2].id],
    semanticVertexIds: [semantic[0], semantic[1], semantic[2]],
    points,
  };
}

function triangulateCanonicalRing(
  faceId: string,
  source: readonly FaceRingVertex2[],
  policy: OrientationPolicy,
  stats: MutablePredicateStats,
): MutableTriangle[] | undefined {
  const remaining = [...source];
  const triangles: MutableTriangle[] = [];
  while (remaining.length > 3) {
    const ears: readonly Readonly<{ index: number; triangle: MutableTriangle }>[] = remaining
      .map((current, index) => {
        const previous = remaining[(index - 1 + remaining.length) % remaining.length];
        const next = remaining[(index + 1) % remaining.length];
        if (previous === undefined || next === undefined) {
          throw new TypeError('ear neighborhood is incomplete');
        }
        const points: [FaceRingVertex2, FaceRingVertex2, FaceRingVertex2] = [
          previous,
          current,
          next,
        ];
        if (exactOrientation(previous, current, next, policy, stats) !== -1) return undefined;
        const blocked = remaining.some(
          (point, pointIndex) =>
            pointIndex !== index &&
            pointIndex !== (index - 1 + remaining.length) % remaining.length &&
            pointIndex !== (index + 1) % remaining.length &&
            pointInClosedNegativeTriangle(point, points, policy, stats),
        );
        return blocked ? undefined : { index, triangle: makeTriangle(faceId, points) };
      })
      .filter((candidate): candidate is { index: number; triangle: MutableTriangle } =>
        Boolean(candidate),
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
  if (exactOrientation(first, second, third, policy, stats) !== -1) return undefined;
  triangles.push(makeTriangle(faceId, [first, second, third]));
  return triangles;
}

function validateTriangulation(
  source: readonly FaceRingVertex2[],
  triangles: readonly MutableTriangle[],
  stats: MutablePredicateStats,
): FaceTriangulationIssue[] {
  const issues: FaceTriangulationIssue[] = [];
  if (triangles.length !== source.length - 2) {
    issues.push({
      path: '$.triangles',
      code: 'triangle-count-mismatch',
      message: `expected ${source.length - 2} triangles, received ${triangles.length}`,
    });
  }

  for (const triangle of triangles) {
    stats.exactAreaChecks += 1;
    if (exactPolygonAreaSign(triangle.points) !== -1) {
      issues.push({
        path: '$.triangles',
        code: 'triangle-winding-mismatch',
        message: `triangle ${triangle.id} is not a non-degenerate negative-winding triangle`,
      });
    }
  }

  stats.exactAreaChecks += 2;
  const sourceArea = exactTwiceSignedArea(source);
  const triangleArea = triangles.reduce<Dyadic>(
    (sum, triangle) => addDyadic(sum, exactTwiceSignedArea(triangle.points)),
    { coefficient: 0n, exponent: 0 },
  );
  if (!dyadicEquals(sourceArea, triangleArea)) {
    issues.push({
      path: '$.triangles',
      code: 'triangle-area-mismatch',
      message: 'the exact binary64 polygon area is not preserved by the triangles',
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

function freezeSuccess(
  faceId: string,
  source: readonly FaceRingVertex2[],
  triangles: readonly MutableTriangle[],
  stats: MutablePredicateStats,
): FaceTriangulationResult {
  const frozenTriangles = Object.freeze(
    [...triangles]
      .sort((left, right) => compareCodeUnits(left.id, right.id))
      .map((triangle) =>
        Object.freeze({
          id: triangle.id,
          faceId: triangle.faceId,
          vertexIds: freezeStringTriple(triangle.vertexIds),
          semanticVertexIds: freezeStringTriple(triangle.semanticVertexIds),
        }),
      ),
  );
  const value: CandidateFaceTriangulation = Object.freeze({
    status: 'candidate',
    scientificClaim: false,
    faceId,
    sourceVertexIds: Object.freeze(source.map((vertex) => vertex.id)),
    triangles: frozenTriangles,
    predicateStats: Object.freeze({ ...stats }),
  });
  return Object.freeze({ ok: true, value });
}

/**
 * Candidate-only M0F reference triangulation for one already bounded simple
 * face. It accepts the canonical negative winding used by CreaseMesh, proves
 * all topological decisions for the supplied binary64 values, and deliberately
 * makes no CCD or scientific verification claim.
 */
function triangulateCapturedSimpleFaceCandidate(
  input: SimpleFaceRing2,
  policy: OrientationPolicy,
): FaceTriangulationResult {
  const basicIssues = validateBasicInput(input, policy);
  if (basicIssues.length > 0) return failure(basicIssues);

  const source = canonicalRing(input.vertices);
  const stats: MutablePredicateStats = {
    segmentPairTests: 0,
    orientationTests: 0,
    exactFallbacks: 0,
    exactAreaChecks: 0,
  };
  const topologyIssues = validateSimpleRing(source, policy, stats);
  stats.exactAreaChecks += 1;
  const faceAreaSign = exactPolygonAreaSign(source);
  const geometryIssues = [...topologyIssues];
  if (faceAreaSign === 0) {
    geometryIssues.push({
      path: '$.vertices',
      code: 'degenerate-face',
      message: 'face ring must have nonzero exact binary64 signed area',
    });
  } else if (faceAreaSign !== -1) {
    geometryIssues.push({
      path: '$.vertices',
      code: 'wrong-face-winding',
      message: 'bounded face ring must use negative winding in stored paper coordinates',
    });
  }
  if (geometryIssues.length > 0) return failure(geometryIssues);

  const triangles = triangulateCanonicalRing(input.faceId, source, policy, stats);
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
  return freezeSuccess(input.faceId, source, triangles, stats);
}

export function triangulateSimpleFaceCandidate(
  input: SimpleFaceRing2,
  policy: OrientationPolicy,
): FaceTriangulationResult;
/** Runtime implementation deliberately accepts hostile untyped JavaScript callers. */
export function triangulateSimpleFaceCandidate(
  input: unknown,
  policy: unknown,
): FaceTriangulationResult {
  const captured = captureBinaryInvocation(input, policy);
  if (!captured.ok) return failure(captured.error);
  try {
    return triangulateCapturedSimpleFaceCandidate(captured.value.input, captured.value.policy);
  } catch {
    return failure([
      {
        path: '$',
        code: 'internal-failure',
        message: 'triangulation failed closed after input validation',
      },
    ]);
  }
}
