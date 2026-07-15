import { exactOrientationSign, type ExactSign } from '../model/exact-dyadic.js';

export type Point2 = Readonly<{ x: number; y: number }>;
export type Segment2 = Readonly<{ start: Point2; end: Point2 }>;
export type OrientationPolicy = Readonly<{ fastFilterArea: number }>;

export type GeometryIssue = Readonly<{
  path: string;
  code: 'non-finite-coordinate' | 'invalid-orientation-policy' | 'degenerate-segment';
  message: string;
}>;
export type GeometryResult<T> =
  Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: readonly GeometryIssue[] }>;

export type Orientation2DResult = Readonly<{
  sign: ExactSign;
  path: 'fast-filter' | 'exact-dyadic';
  approximateDeterminant: number | null;
  fastErrorBound: number | null;
}>;

export type SegmentLocation = 'start' | 'end' | 'interior';
export type SegmentIntersection =
  | Readonly<{ kind: 'disjoint'; exactFallbackCount: number }>
  | Readonly<{ kind: 'proper-crossing'; exactFallbackCount: number }>
  | Readonly<{
      kind: 'touch';
      onA: SegmentLocation;
      onB: SegmentLocation;
      exactFallbackCount: number;
    }>
  | Readonly<{ kind: 'collinear-overlap'; exactFallbackCount: number }>;

const UNIT_ROUNDOFF = 2 ** -53;
const CCW_ERROR_COEFFICIENT = (3 + 16 * UNIT_ROUNDOFF) * UNIT_ROUNDOFF;

function validatePoint(point: Point2, path: string, issues: GeometryIssue[]): void {
  if (!Number.isFinite(point.x)) {
    issues.push({
      path: `${path}.x`,
      code: 'non-finite-coordinate',
      message: 'coordinate must be a finite binary64 number',
    });
  }
  if (!Number.isFinite(point.y)) {
    issues.push({
      path: `${path}.y`,
      code: 'non-finite-coordinate',
      message: 'coordinate must be a finite binary64 number',
    });
  }
}

function validatePolicy(policy: OrientationPolicy, issues: GeometryIssue[]): void {
  if (!Number.isFinite(policy.fastFilterArea) || policy.fastFilterArea < 0) {
    issues.push({
      path: '$.policy.fastFilterArea',
      code: 'invalid-orientation-policy',
      message: 'must be a finite non-negative fallback threshold',
    });
  }
}

function pointEquals(left: Point2, right: Point2): boolean {
  return left.x === right.x && left.y === right.y;
}

/**
 * Filtered orientation whose fallback returns the exact sign of the supplied
 * binary64 values. `fastFilterArea` only requests a more conservative fallback;
 * it never turns a nonzero exact sign into zero.
 */
export function orientation2D(
  a: Point2,
  b: Point2,
  c: Point2,
  policy: OrientationPolicy,
): GeometryResult<Orientation2DResult> {
  const issues: GeometryIssue[] = [];
  validatePoint(a, '$.a', issues);
  validatePoint(b, '$.b', issues);
  validatePoint(c, '$.c', issues);
  validatePolicy(policy, issues);
  if (issues.length > 0) return { ok: false, error: issues };

  const detLeft = (b.x - a.x) * (c.y - a.y);
  const detRight = (b.y - a.y) * (c.x - a.x);
  const determinant = detLeft - detRight;
  const errorBound = CCW_ERROR_COEFFICIENT * (Math.abs(detLeft) + Math.abs(detRight));
  const finiteApproximation = Number.isFinite(determinant) && Number.isFinite(errorBound);
  const fallbackThreshold = finiteApproximation
    ? Math.max(errorBound, policy.fastFilterArea)
    : Number.POSITIVE_INFINITY;

  if (finiteApproximation && Math.abs(determinant) > fallbackThreshold) {
    return {
      ok: true,
      value: {
        sign: determinant < 0 ? -1 : 1,
        path: 'fast-filter',
        approximateDeterminant: determinant,
        fastErrorBound: errorBound,
      },
    };
  }

  return {
    ok: true,
    value: {
      sign: exactOrientationSign(a, b, c),
      path: 'exact-dyadic',
      approximateDeterminant: Number.isFinite(determinant) ? determinant : null,
      fastErrorBound: Number.isFinite(errorBound) ? errorBound : null,
    },
  };
}

function isWithinClosedBounds(point: Point2, segment: Segment2): boolean {
  return (
    point.x >= Math.min(segment.start.x, segment.end.x) &&
    point.x <= Math.max(segment.start.x, segment.end.x) &&
    point.y >= Math.min(segment.start.y, segment.end.y) &&
    point.y <= Math.max(segment.start.y, segment.end.y)
  );
}

function locationOnSegment(point: Point2, segment: Segment2): SegmentLocation | undefined {
  if (!isWithinClosedBounds(point, segment)) return undefined;
  if (pointEquals(point, segment.start)) return 'start';
  if (pointEquals(point, segment.end)) return 'end';
  return 'interior';
}

function opposite(left: ExactSign, right: ExactSign): boolean {
  return (left === -1 && right === 1) || (left === 1 && right === -1);
}

type OrientationBatch = Readonly<{
  signs: readonly [ExactSign, ExactSign, ExactSign, ExactSign];
  exactFallbackCount: number;
}>;

function segmentOrientations(
  a: Segment2,
  b: Segment2,
  policy: OrientationPolicy,
): GeometryResult<OrientationBatch> {
  const results = [
    orientation2D(a.start, a.end, b.start, policy),
    orientation2D(a.start, a.end, b.end, policy),
    orientation2D(b.start, b.end, a.start, policy),
    orientation2D(b.start, b.end, a.end, policy),
  ] as const;
  const errors = results.flatMap((result) => (result.ok ? [] : result.error));
  if (errors.length > 0) return { ok: false, error: errors };
  const values = results.map((result) => {
    if (!result.ok) throw new TypeError('orientation errors were already handled');
    return result.value;
  });
  const first = values[0];
  const second = values[1];
  const third = values[2];
  const fourth = values[3];
  if (first === undefined || second === undefined || third === undefined || fourth === undefined) {
    throw new TypeError('four segment orientations are required');
  }
  return {
    ok: true,
    value: {
      signs: [first.sign, second.sign, third.sign, fourth.sign],
      exactFallbackCount: values.filter((value) => value.path === 'exact-dyadic').length,
    },
  };
}

function collinearClassification(
  a: Segment2,
  b: Segment2,
  exactFallbackCount: number,
): SegmentIntersection {
  const useX = a.start.x !== a.end.x;
  const coordinate = (point: Point2): number => (useX ? point.x : point.y);
  const aMinimum = Math.min(coordinate(a.start), coordinate(a.end));
  const aMaximum = Math.max(coordinate(a.start), coordinate(a.end));
  const bMinimum = Math.min(coordinate(b.start), coordinate(b.end));
  const bMaximum = Math.max(coordinate(b.start), coordinate(b.end));
  const overlapMinimum = Math.max(aMinimum, bMinimum);
  const overlapMaximum = Math.min(aMaximum, bMaximum);
  if (overlapMinimum > overlapMaximum) return { kind: 'disjoint', exactFallbackCount };
  if (overlapMinimum < overlapMaximum) return { kind: 'collinear-overlap', exactFallbackCount };

  const candidates: readonly Point2[] = [a.start, a.end, b.start, b.end];
  const point = candidates.find((candidate) => coordinate(candidate) === overlapMinimum);
  if (point === undefined) throw new TypeError('collinear contact endpoint is missing');
  const onA = locationOnSegment(point, a);
  const onB = locationOnSegment(point, b);
  if (onA === undefined || onB === undefined) {
    throw new TypeError('collinear contact endpoint must lie on both segments');
  }
  return { kind: 'touch', onA, onB, exactFallbackCount };
}

/** Classifies topology only; it deliberately does not construct an intersection point. */
export function classifySegmentIntersection(
  a: Segment2,
  b: Segment2,
  policy: OrientationPolicy,
): GeometryResult<SegmentIntersection> {
  const issues: GeometryIssue[] = [];
  validatePoint(a.start, '$.a.start', issues);
  validatePoint(a.end, '$.a.end', issues);
  validatePoint(b.start, '$.b.start', issues);
  validatePoint(b.end, '$.b.end', issues);
  validatePolicy(policy, issues);
  if (pointEquals(a.start, a.end)) {
    issues.push({
      path: '$.a',
      code: 'degenerate-segment',
      message: 'segment endpoints must differ',
    });
  }
  if (pointEquals(b.start, b.end)) {
    issues.push({
      path: '$.b',
      code: 'degenerate-segment',
      message: 'segment endpoints must differ',
    });
  }
  if (issues.length > 0) return { ok: false, error: issues };

  const orientations = segmentOrientations(a, b, policy);
  if (!orientations.ok) return orientations;
  const [aStart, aEnd, bStart, bEnd] = orientations.value.signs;
  const { exactFallbackCount } = orientations.value;

  if (aStart === 0 && aEnd === 0 && bStart === 0 && bEnd === 0) {
    return { ok: true, value: collinearClassification(a, b, exactFallbackCount) };
  }
  if (opposite(aStart, aEnd) && opposite(bStart, bEnd)) {
    return { ok: true, value: { kind: 'proper-crossing', exactFallbackCount } };
  }

  const candidates: readonly Readonly<{
    sign: ExactSign;
    point: Point2;
    segment: Segment2;
    pointOwner: 'a-start' | 'a-end' | 'b-start' | 'b-end';
  }>[] = [
    { sign: aStart, point: b.start, segment: a, pointOwner: 'b-start' },
    { sign: aEnd, point: b.end, segment: a, pointOwner: 'b-end' },
    { sign: bStart, point: a.start, segment: b, pointOwner: 'a-start' },
    { sign: bEnd, point: a.end, segment: b, pointOwner: 'a-end' },
  ];
  for (const candidate of candidates) {
    if (candidate.sign !== 0) continue;
    const onOther = locationOnSegment(candidate.point, candidate.segment);
    if (onOther === undefined) continue;
    const pointLocation: SegmentLocation = candidate.pointOwner.endsWith('start') ? 'start' : 'end';
    const pointBelongsToA = candidate.pointOwner.startsWith('a-');
    return {
      ok: true,
      value: {
        kind: 'touch',
        onA: pointBelongsToA ? pointLocation : onOther,
        onB: pointBelongsToA ? onOther : pointLocation,
        exactFallbackCount,
      },
    };
  }

  return { ok: true, value: { kind: 'disjoint', exactFallbackCount } };
}
