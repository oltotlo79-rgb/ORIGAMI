import { describe, expect, it } from 'vitest';

import {
  classifyExactSegmentIntersection,
  planarizeDyadicSegments,
  type ExactSegment2,
  type SourceEdgeSegment2,
} from '../../m0f/geometry/planarize-segments.js';
import {
  exactRational,
  finiteBinary64ToExactRational,
  type ExactRationalPoint2,
} from '../../m0f/model/exact-rational.js';

function rationalPoint(x: bigint, y: bigint, denominator = 1n): ExactRationalPoint2 {
  return { x: exactRational(x, denominator), y: exactRational(y, denominator) };
}

function exactSegment(start: ExactRationalPoint2, end: ExactRationalPoint2): ExactSegment2 {
  return { start, end };
}

function source(
  sourceEdgeId: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): SourceEdgeSegment2 {
  return {
    sourceEdgeId,
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
  };
}

function requirePlanarization(segments: readonly SourceEdgeSegment2[]) {
  const result = planarizeDyadicSegments(segments);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

describe('M0F exact segment intersection construction', () => {
  it('constructs a non-dyadic proper crossing exactly', () => {
    const crossing = classifyExactSegmentIntersection(
      exactSegment(rationalPoint(0n, 0n), rationalPoint(3n, 1n)),
      exactSegment(rationalPoint(1n, -1n), rationalPoint(1n, 2n)),
    );
    expect(crossing).toEqual({
      kind: 'proper-crossing',
      point: { x: exactRational(1n), y: exactRational(1n, 3n) },
    });
  });

  it('explicitly distinguishes endpoint, T-junction, overlap, and disjoint cases', () => {
    expect(
      classifyExactSegmentIntersection(
        exactSegment(rationalPoint(0n, 0n), rationalPoint(1n, 0n)),
        exactSegment(rationalPoint(1n, 0n), rationalPoint(1n, 1n)),
      ),
    ).toMatchObject({ kind: 'endpoint-touch', onA: 'end', onB: 'start' });
    expect(
      classifyExactSegmentIntersection(
        exactSegment(rationalPoint(0n, 0n), rationalPoint(2n, 0n)),
        exactSegment(rationalPoint(1n, 0n), rationalPoint(1n, 1n)),
      ),
    ).toMatchObject({ kind: 't-junction', endpointOn: 'b', onA: 'interior', onB: 'start' });
    expect(
      classifyExactSegmentIntersection(
        exactSegment(rationalPoint(0n, 0n), rationalPoint(2n, 0n)),
        exactSegment(rationalPoint(1n, 0n), rationalPoint(3n, 0n)),
      ),
    ).toEqual({ kind: 'collinear-overlap' });
    expect(
      classifyExactSegmentIntersection(
        exactSegment(rationalPoint(0n, 0n), rationalPoint(1n, 0n)),
        exactSegment(rationalPoint(2n, 0n), rationalPoint(3n, 0n)),
      ),
    ).toEqual({ kind: 'disjoint' });
  });
});

describe('M0F candidate reference segment planarizer', () => {
  it('splits every source at exact crossings and preserves provenance', () => {
    const result = requirePlanarization([
      source('diagonal', 0, 0, 3, 1),
      source('vertical', 1, -1, 1, 2),
    ]);
    expect(result).toMatchObject({
      contractStatus: 'candidate',
      implementationRole: 'reference',
      scientificClaim: false,
    });
    expect(result.vertices).toHaveLength(5);
    expect(result.edges).toHaveLength(4);
    expect(result.vertices.some((vertex) => vertex.point.y.denominator === 3n)).toBe(true);
    expect(result.edges.filter((edge) => edge.sourceEdgeIds[0] === 'diagonal')).toHaveLength(2);
    expect(result.edges.filter((edge) => edge.sourceEdgeIds[0] === 'vertical')).toHaveLength(2);
  });

  it('splits a trunk at a T-junction while sharing one canonical vertex', () => {
    const result = requirePlanarization([
      source('trunk', 0, 0, 2, 0),
      source('branch', 1, 0, 1, 1),
    ]);
    expect(result.vertices).toHaveLength(4);
    expect(result.edges).toHaveLength(3);
    expect(result.edges.filter((edge) => edge.sourceEdgeIds[0] === 'trunk')).toHaveLength(2);
    expect(result.edges.filter((edge) => edge.sourceEdgeIds[0] === 'branch')).toHaveLength(1);
  });

  it('deduplicates one exact point reached by several pairwise crossings', () => {
    const result = requirePlanarization([
      source('horizontal', -1, 0, 1, 0),
      source('vertical', 0, -1, 0, 1),
      source('diagonal', -1, -1, 1, 1),
    ]);
    expect(result.vertices).toHaveLength(7);
    expect(result.edges).toHaveLength(6);
    expect(
      result.vertices.filter(
        (vertex) => vertex.point.x.numerator === 0n && vertex.point.y.numerator === 0n,
      ),
    ).toHaveLength(1);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.vertices[0]?.point)).toBe(true);
  });

  it('is canonical under input permutation and independent segment reversal', () => {
    const original = [
      source('z-edge', 0, 0, 3, 1),
      source('a-edge', 1, -1, 1, 2),
      source('m-edge', 0, 1, 3, 0),
    ];
    const transformed = [...original]
      .reverse()
      .map((segment) => ({ ...segment, start: segment.end, end: segment.start }));
    expect(requirePlanarization(transformed)).toEqual(requirePlanarization(original));
  });

  it('never rounds a one-ULP separation into a topological event', () => {
    const result = requirePlanarization([
      source('base', 0, 0, 1, 0),
      source('offset', 0, Number.MIN_VALUE, 1, Number.MIN_VALUE),
    ]);
    expect(result.vertices).toHaveLength(4);
    expect(result.edges).toHaveLength(2);
    const yCoordinates = new Set(
      result.vertices.map((vertex) => `${vertex.point.y.numerator}/${vertex.point.y.denominator}`),
    );
    expect(yCoordinates.size).toBe(2);
    expect(finiteBinary64ToExactRational(Number.MIN_VALUE).numerator).toBe(1n);
  });

  it.each([
    {
      name: 'duplicate source IDs',
      segments: [source('same', 0, 0, 1, 0), source('same', 0, 1, 1, 1)],
      code: 'duplicate-source-edge-id',
    },
    {
      name: 'reversed duplicate geometry',
      segments: [source('one', 0, 0, 1, 0), source('two', 1, 0, 0, 0)],
      code: 'duplicate-segment',
    },
    {
      name: 'collinear overlap',
      segments: [source('one', 0, 0, 2, 0), source('two', 1, 0, 3, 0)],
      code: 'collinear-overlap',
    },
    {
      name: 'zero length',
      segments: [source('zero', 1, 1, 1, 1)],
      code: 'zero-length-segment',
    },
    {
      name: 'non-finite coordinates',
      segments: [source('infinite', 0, 0, Number.POSITIVE_INFINITY, 1)],
      code: 'non-finite-coordinate',
    },
  ])('fails closed on $name', ({ segments, code }) => {
    const result = planarizeDyadicSegments(segments);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected fail-closed result');
    expect(result.error.some((entry) => entry.code === code)).toBe(true);
  });

  it('rejects non-plain or accessor-unstable inputs without throwing', () => {
    expect(planarizeDyadicSegments(new Map() as never)).toMatchObject({
      ok: false,
      error: [{ code: 'invalid-input' }],
    });
    const unknownField = planarizeDyadicSegments([
      {
        ...source('edge', 0, 0, 1, 0),
        extra: true,
      } as never,
    ]);
    expect(unknownField.ok).toBe(false);
    if (!unknownField.ok) {
      expect(unknownField.error.map((issue) => issue.code)).toContain('unknown-field');
    }

    let reads = 0;
    const endpoint = {
      get x() {
        reads += 1;
        return reads === 1 ? 0 : Number.NaN;
      },
      y: 0,
    };
    const result = planarizeDyadicSegments([
      { sourceEdgeId: 'edge', start: endpoint, end: { x: 1, y: 0 } },
    ]);
    expect(result.ok).toBe(true);
    expect(reads).toBe(1);
  });
});
