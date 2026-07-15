import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  compareExactRationalPoints,
  divideExactRational,
  equalExactRationalPoints,
  exactRationalOrientationSign,
  exactRationalPointKey,
  finiteBinary64ToExactRational,
  multiplyExactRational,
  subtractExactRational,
  type ExactRational,
  type ExactRationalPoint2,
} from '../model/exact-rational.js';

export type DyadicPoint2 = Readonly<{ x: number; y: number }>;
export type SourceEdgeSegment2 = Readonly<{
  sourceEdgeId: string;
  start: DyadicPoint2;
  end: DyadicPoint2;
}>;
export type ExactSegment2 = Readonly<{
  start: ExactRationalPoint2;
  end: ExactRationalPoint2;
}>;
export type ExactSegmentLocation = 'start' | 'end' | 'interior';

export type ExactSegmentIntersection =
  | Readonly<{ kind: 'disjoint' }>
  | Readonly<{ kind: 'proper-crossing'; point: ExactRationalPoint2 }>
  | Readonly<{
      kind: 'endpoint-touch';
      point: ExactRationalPoint2;
      onA: 'start' | 'end';
      onB: 'start' | 'end';
    }>
  | Readonly<{
      kind: 't-junction';
      point: ExactRationalPoint2;
      endpointOn: 'a' | 'b';
      onA: ExactSegmentLocation;
      onB: ExactSegmentLocation;
    }>
  | Readonly<{ kind: 'collinear-overlap' }>;

export type PlanarizationIssue = Readonly<{
  path: string;
  code:
    | 'invalid-input'
    | 'unknown-field'
    | 'invalid-source-edge-id'
    | 'duplicate-source-edge-id'
    | 'non-finite-coordinate'
    | 'zero-length-segment'
    | 'duplicate-segment'
    | 'collinear-overlap';
  message: string;
  sourceEdgeIds?: readonly string[];
}>;

export type PlanarizedVertex = Readonly<{
  id: string;
  point: ExactRationalPoint2;
}>;

export type PlanarizedEdge = Readonly<{
  id: string;
  startVertexId: string;
  endVertexId: string;
  sourceEdgeIds: readonly string[];
}>;

export type CandidatePlanarization = Readonly<{
  contractStatus: 'candidate';
  implementationRole: 'reference';
  scientificClaim: false;
  vertices: readonly PlanarizedVertex[];
  edges: readonly PlanarizedEdge[];
}>;

export type PlanarizationResult =
  | Readonly<{ ok: true; value: CandidatePlanarization }>
  | Readonly<{ ok: false; error: readonly PlanarizationIssue[] }>;

type ConvertedSourceSegment = Readonly<{
  sourceEdgeId: string;
  segment: ExactSegment2;
}>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function minimum(left: ExactRational, right: ExactRational): ExactRational {
  return compareExactRational(left, right) <= 0 ? left : right;
}

function maximum(left: ExactRational, right: ExactRational): ExactRational {
  return compareExactRational(left, right) >= 0 ? left : right;
}

function pointOnSegment(point: ExactRationalPoint2, segment: ExactSegment2): boolean {
  return (
    exactRationalOrientationSign(segment.start, segment.end, point) === 0 &&
    compareExactRational(point.x, minimum(segment.start.x, segment.end.x)) >= 0 &&
    compareExactRational(point.x, maximum(segment.start.x, segment.end.x)) <= 0 &&
    compareExactRational(point.y, minimum(segment.start.y, segment.end.y)) >= 0 &&
    compareExactRational(point.y, maximum(segment.start.y, segment.end.y)) <= 0
  );
}

function pointLocation(
  point: ExactRationalPoint2,
  segment: ExactSegment2,
): ExactSegmentLocation | undefined {
  if (equalExactRationalPoints(point, segment.start)) return 'start';
  if (equalExactRationalPoints(point, segment.end)) return 'end';
  return pointOnSegment(point, segment) ? 'interior' : undefined;
}

function opposite(left: -1 | 0 | 1, right: -1 | 0 | 1): boolean {
  return (left === -1 && right === 1) || (left === 1 && right === -1);
}

function cross(
  leftX: ExactRational,
  leftY: ExactRational,
  rightX: ExactRational,
  rightY: ExactRational,
): ExactRational {
  return subtractExactRational(
    multiplyExactRational(leftX, rightY),
    multiplyExactRational(leftY, rightX),
  );
}

function properIntersectionPoint(a: ExactSegment2, b: ExactSegment2): ExactRationalPoint2 {
  const rayAX = subtractExactRational(a.end.x, a.start.x);
  const rayAY = subtractExactRational(a.end.y, a.start.y);
  const rayBX = subtractExactRational(b.end.x, b.start.x);
  const rayBY = subtractExactRational(b.end.y, b.start.y);
  const offsetX = subtractExactRational(b.start.x, a.start.x);
  const offsetY = subtractExactRational(b.start.y, a.start.y);
  const parameter = divideExactRational(
    cross(offsetX, offsetY, rayBX, rayBY),
    cross(rayAX, rayAY, rayBX, rayBY),
  );
  return {
    x: addExactRational(a.start.x, multiplyExactRational(parameter, rayAX)),
    y: addExactRational(a.start.y, multiplyExactRational(parameter, rayAY)),
  };
}

function classifyTouch(
  point: ExactRationalPoint2,
  a: ExactSegment2,
  b: ExactSegment2,
): ExactSegmentIntersection {
  const onA = pointLocation(point, a);
  const onB = pointLocation(point, b);
  if (onA === undefined || onB === undefined) {
    throw new TypeError('intersection point must lie on both exact segments');
  }
  if (onA !== 'interior' && onB !== 'interior') {
    return { kind: 'endpoint-touch', point, onA, onB };
  }
  if (onA === 'interior' && onB === 'interior') {
    throw new TypeError('isolated endpoint candidate cannot be interior to both segments');
  }
  return {
    kind: 't-junction',
    point,
    endpointOn: onA === 'interior' ? 'b' : 'a',
    onA,
    onB,
  };
}

function collinearIntersection(a: ExactSegment2, b: ExactSegment2): ExactSegmentIntersection {
  const useX = compareExactRational(a.start.x, a.end.x) !== 0;
  const coordinate = (point: ExactRationalPoint2): ExactRational => (useX ? point.x : point.y);
  const overlapMinimum = maximum(
    minimum(coordinate(a.start), coordinate(a.end)),
    minimum(coordinate(b.start), coordinate(b.end)),
  );
  const overlapMaximum = minimum(
    maximum(coordinate(a.start), coordinate(a.end)),
    maximum(coordinate(b.start), coordinate(b.end)),
  );
  const comparison = compareExactRational(overlapMinimum, overlapMaximum);
  if (comparison > 0) return { kind: 'disjoint' };
  if (comparison < 0) return { kind: 'collinear-overlap' };

  const point = [a.start, a.end, b.start, b.end].find(
    (candidate) => compareExactRational(coordinate(candidate), overlapMinimum) === 0,
  );
  if (point === undefined) throw new TypeError('collinear contact endpoint is missing');
  return classifyTouch(point, a, b);
}

/** Exact topology and point construction for already-normalized rational segments. */
export function classifyExactSegmentIntersection(
  a: ExactSegment2,
  b: ExactSegment2,
): ExactSegmentIntersection {
  if (equalExactRationalPoints(a.start, a.end) || equalExactRationalPoints(b.start, b.end)) {
    throw new RangeError('exact segment classification requires nonzero segments');
  }

  const aStart = exactRationalOrientationSign(a.start, a.end, b.start);
  const aEnd = exactRationalOrientationSign(a.start, a.end, b.end);
  const bStart = exactRationalOrientationSign(b.start, b.end, a.start);
  const bEnd = exactRationalOrientationSign(b.start, b.end, a.end);

  if (aStart === 0 && aEnd === 0 && bStart === 0 && bEnd === 0) {
    return collinearIntersection(a, b);
  }
  if (opposite(aStart, aEnd) && opposite(bStart, bEnd)) {
    return { kind: 'proper-crossing', point: properIntersectionPoint(a, b) };
  }

  const candidates = [
    { sign: aStart, point: b.start, other: a },
    { sign: aEnd, point: b.end, other: a },
    { sign: bStart, point: a.start, other: b },
    { sign: bEnd, point: a.end, other: b },
  ] as const;
  for (const candidate of candidates) {
    if (candidate.sign === 0 && pointOnSegment(candidate.point, candidate.other)) {
      return classifyTouch(candidate.point, a, b);
    }
  }
  return { kind: 'disjoint' };
}

type ConversionResult =
  | Readonly<{ ok: true; value: readonly ConvertedSourceSegment[] }>
  | Readonly<{ ok: false; error: readonly PlanarizationIssue[] }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: PlanarizationIssue[],
): void {
  const accepted = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!accepted.has(key)) {
      issues.push({
        path: `${path}.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by the candidate planarization input',
      });
    }
  }
}

function validateAndConvert(segments: unknown): ConversionResult {
  const issues: PlanarizationIssue[] = [];
  const ids = new Set<string>();
  const converted: ConvertedSourceSegment[] = [];

  if (!Array.isArray(segments)) {
    return {
      ok: false,
      error: [{ path: '$.segments', code: 'invalid-input', message: 'must be an array' }],
    };
  }

  segments.forEach((candidate, index) => {
    const path = `$.segments[${index}]`;
    if (!isRecord(candidate)) {
      issues.push({ path, code: 'invalid-input', message: 'must be a source segment object' });
      return;
    }
    unknownFields(candidate, ['sourceEdgeId', 'start', 'end'], path, issues);
    const sourceEdgeId = candidate.sourceEdgeId;
    if (typeof sourceEdgeId !== 'string' || !ID_PATTERN.test(sourceEdgeId)) {
      issues.push({
        path: `${path}.sourceEdgeId`,
        code: 'invalid-source-edge-id',
        message: 'must be a stable ID of 1..128 ASCII characters',
      });
    } else if (ids.has(sourceEdgeId)) {
      issues.push({
        path: `${path}.sourceEdgeId`,
        code: 'duplicate-source-edge-id',
        message: `source edge ID ${sourceEdgeId} is duplicated`,
      });
    } else {
      ids.add(sourceEdgeId);
    }

    const start = candidate.start;
    const end = candidate.end;
    if (!isRecord(start) || !isRecord(end)) {
      if (!isRecord(start)) {
        issues.push({ path: `${path}.start`, code: 'invalid-input', message: 'must be a point' });
      }
      if (!isRecord(end)) {
        issues.push({ path: `${path}.end`, code: 'invalid-input', message: 'must be a point' });
      }
      return;
    }
    unknownFields(start, ['x', 'y'], `${path}.start`, issues);
    unknownFields(end, ['x', 'y'], `${path}.end`, issues);

    const coordinateEntries = [
      ['start.x', start.x],
      ['start.y', start.y],
      ['end.x', end.x],
      ['end.y', end.y],
    ] as const;
    let finite = true;
    for (const [coordinatePath, value] of coordinateEntries) {
      if (!Number.isFinite(value)) {
        finite = false;
        issues.push({
          path: `${path}.${coordinatePath}`,
          code: 'non-finite-coordinate',
          message: 'coordinate must be a finite binary64 number',
        });
      }
    }
    if (!finite) return;
    if (typeof sourceEdgeId !== 'string' || !ID_PATTERN.test(sourceEdgeId)) return;
    const startX = start.x as number;
    const startY = start.y as number;
    const endX = end.x as number;
    const endY = end.y as number;
    if (startX === endX && startY === endY) {
      issues.push({
        path,
        code: 'zero-length-segment',
        message: 'source segment endpoints must differ exactly',
        sourceEdgeIds: [sourceEdgeId],
      });
      return;
    }
    converted.push({
      sourceEdgeId,
      segment: {
        start: {
          x: finiteBinary64ToExactRational(startX),
          y: finiteBinary64ToExactRational(startY),
        },
        end: {
          x: finiteBinary64ToExactRational(endX),
          y: finiteBinary64ToExactRational(endY),
        },
      },
    });
  });

  if (issues.length > 0) return { ok: false, error: issues };
  return { ok: true, value: converted };
}

function canonicalSegmentKey(segment: ExactSegment2): string {
  const ordered =
    compareExactRationalPoints(segment.start, segment.end) <= 0
      ? [segment.start, segment.end]
      : [segment.end, segment.start];
  const first = ordered[0];
  const second = ordered[1];
  if (first === undefined || second === undefined)
    throw new TypeError('segment needs two endpoints');
  return `${exactRationalPointKey(first)}|${exactRationalPointKey(second)}`;
}

/**
 * O(n squared) M0F reference planarizer. All topology and split ordering use
 * reduced BigInt rationals; no conversion back to number participates.
 */
export function planarizeDyadicSegments(
  supplied: readonly SourceEdgeSegment2[],
): PlanarizationResult {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$.segments',
          code: 'invalid-input',
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const validation = validateAndConvert(snapshot.value);
  if (!validation.ok) return validation;
  const segments = [...validation.value].sort((left, right) =>
    compareCodeUnits(left.sourceEdgeId, right.sourceEdgeId),
  );

  const geometricOwners = new Map<string, string>();
  for (const source of segments) {
    const key = canonicalSegmentKey(source.segment);
    const previous = geometricOwners.get(key);
    if (previous !== undefined) {
      const sourceEdgeIds = [previous, source.sourceEdgeId].sort(compareCodeUnits);
      return {
        ok: false,
        error: [
          {
            path: '$.segments',
            code: 'duplicate-segment',
            message: `source edges ${sourceEdgeIds.join(', ')} describe the same segment`,
            sourceEdgeIds,
          },
        ],
      };
    }
    geometricOwners.set(key, source.sourceEdgeId);
  }

  const splitPoints = new Map<string, Map<string, ExactRationalPoint2>>();
  for (const source of segments) {
    splitPoints.set(
      source.sourceEdgeId,
      new Map([
        [exactRationalPointKey(source.segment.start), source.segment.start],
        [exactRationalPointKey(source.segment.end), source.segment.end],
      ]),
    );
  }

  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    const left = segments[leftIndex];
    if (left === undefined) throw new TypeError('source segment is missing');
    for (let rightIndex = leftIndex + 1; rightIndex < segments.length; rightIndex += 1) {
      const right = segments[rightIndex];
      if (right === undefined) throw new TypeError('source segment is missing');
      const intersection = classifyExactSegmentIntersection(left.segment, right.segment);
      if (intersection.kind === 'collinear-overlap') {
        const sourceEdgeIds = [left.sourceEdgeId, right.sourceEdgeId];
        return {
          ok: false,
          error: [
            {
              path: '$.segments',
              code: 'collinear-overlap',
              message: `source edges ${sourceEdgeIds.join(', ')} overlap on a nonzero interval`,
              sourceEdgeIds,
            },
          ],
        };
      }
      if (intersection.kind === 'disjoint') continue;
      const key = exactRationalPointKey(intersection.point);
      splitPoints.get(left.sourceEdgeId)?.set(key, intersection.point);
      splitPoints.get(right.sourceEdgeId)?.set(key, intersection.point);
    }
  }

  const allPoints = new Map<string, ExactRationalPoint2>();
  for (const points of splitPoints.values()) {
    for (const [key, point] of points) allPoints.set(key, point);
  }
  const sortedPoints = [...allPoints.values()].sort(compareExactRationalPoints);
  const vertexIdByKey = new Map<string, string>();
  const vertices = sortedPoints.map((point, index): PlanarizedVertex => {
    const id = `v${index}`;
    vertexIdByKey.set(exactRationalPointKey(point), id);
    return { id, point };
  });

  const edgeDrafts: Omit<PlanarizedEdge, 'id'>[] = [];
  for (const source of segments) {
    const points = splitPoints.get(source.sourceEdgeId);
    if (points === undefined) throw new TypeError('split-point set is missing');
    const ordered = [...points.values()].sort(compareExactRationalPoints);
    for (let index = 0; index + 1 < ordered.length; index += 1) {
      const start = ordered[index];
      const end = ordered[index + 1];
      if (start === undefined || end === undefined) throw new TypeError('split edge is incomplete');
      const startVertexId = vertexIdByKey.get(exactRationalPointKey(start));
      const endVertexId = vertexIdByKey.get(exactRationalPointKey(end));
      if (startVertexId === undefined || endVertexId === undefined) {
        throw new TypeError('split edge references a missing canonical vertex');
      }
      edgeDrafts.push({
        startVertexId,
        endVertexId,
        sourceEdgeIds: [source.sourceEdgeId],
      });
    }
  }
  edgeDrafts.sort((left, right) => {
    const startComparison =
      Number(left.startVertexId.slice(1)) - Number(right.startVertexId.slice(1));
    if (startComparison !== 0) return startComparison;
    const endComparison = Number(left.endVertexId.slice(1)) - Number(right.endVertexId.slice(1));
    return endComparison !== 0
      ? endComparison
      : compareCodeUnits(left.sourceEdgeIds[0] ?? '', right.sourceEdgeIds[0] ?? '');
  });
  const edges = edgeDrafts.map((edge, index): PlanarizedEdge => ({ id: `e${index}`, ...edge }));

  return {
    ok: true,
    value: deepFreezeOwned({
      contractStatus: 'candidate',
      implementationRole: 'reference',
      scientificClaim: false,
      vertices,
      edges,
    }),
  };
}
