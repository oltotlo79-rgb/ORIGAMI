import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  addProjectiveRationalComponents,
  canonicalProjectivePoint,
  canonicalProjectiveRationalComponent,
  classifyProjectiveSegmentIntersection,
  compareProjectiveDirections,
  compareProjectivePoints,
  compareProjectiveRationalComponents,
  equalProjectivePoints,
  equalProjectiveRationalComponents,
  finiteBinary64ToProjectiveComponent,
  intersectProjectiveLines,
  projectiveOrientationSign,
  projectivePointFromCanonicalDecimalRationalJson,
  projectivePointFromFiniteBinary64,
  projectivePointKey,
  projectivePolygonTwiceSignedArea,
  projectiveTriangleTwiceSignedArea,
  signProjectiveRationalComponent,
  type ProjectivePoint2,
  type ProjectiveSegment2,
} from '../../m0f/reference-verifier/projective-rational.js';

function point(x: number, y: number): ProjectivePoint2 {
  return projectivePointFromFiniteBinary64(x, y);
}

function segment(startX: number, startY: number, endX: number, endY: number): ProjectiveSegment2 {
  return { start: point(startX, startY), end: point(endX, endY) };
}

describe('independent projective BigInt rational kernel', () => {
  it('has no import dependency on the producer geometry or rational kernel', async () => {
    const source = await readFile(resolve('m0f/reference-verifier/projective-rational.ts'), 'utf8');
    expect(source).not.toMatch(/^\s*import\b/mu);
    expect(source).not.toContain('/geometry/');
    expect(source).not.toContain('model/exact-rational');
  });

  it('canonicalizes homogeneous points and reduced rational components', () => {
    expect(canonicalProjectivePoint(10n, -20n, 30n)).toEqual([1n, -2n, 3n]);
    expect(canonicalProjectivePoint(-10n, 20n, -30n)).toEqual([1n, -2n, 3n]);
    expect(canonicalProjectivePoint(0n, 0n, -8n)).toEqual([0n, 0n, 1n]);
    expect(canonicalProjectiveRationalComponent(20n, -30n)).toEqual([-2n, 3n]);
    expect(canonicalProjectiveRationalComponent(0n, -30n)).toEqual([0n, 1n]);
    expect(() => canonicalProjectivePoint(1n, 2n, 0n)).toThrow(RangeError);
    expect(() => canonicalProjectiveRationalComponent(1n, 0n)).toThrow(RangeError);
    expect(Object.isFrozen(canonicalProjectivePoint(1n, 2n, 3n))).toBe(true);
  });

  it('normalizes enormous negative homogeneous scales without losing signs', () => {
    const scale = 1n << 4096n;
    expect(canonicalProjectivePoint(-7n * scale, 11n * scale, -13n * scale)).toEqual([
      7n,
      -11n,
      13n,
    ]);
    expect(canonicalProjectiveRationalComponent(-17n * scale, -19n * scale)).toEqual([17n, 19n]);
  });

  it('decodes finite binary64 values exactly, including signed zero and underflow', () => {
    expect(finiteBinary64ToProjectiveComponent(0)).toEqual([0n, 1n]);
    expect(finiteBinary64ToProjectiveComponent(-0)).toEqual([0n, 1n]);
    expect(finiteBinary64ToProjectiveComponent(0.5)).toEqual([1n, 2n]);
    expect(finiteBinary64ToProjectiveComponent(0.1)).toEqual([
      3_602_879_701_896_397n,
      36_028_797_018_963_968n,
    ]);
    expect(finiteBinary64ToProjectiveComponent(Number.MIN_VALUE)).toEqual([1n, 1n << 1074n]);
    const maximum = finiteBinary64ToProjectiveComponent(Number.MAX_VALUE);
    expect(maximum[0]).toBe(((1n << 53n) - 1n) << 971n);
    expect(maximum[1]).toBe(1n);
    expect(() => finiteBinary64ToProjectiveComponent(Number.NaN)).toThrow(TypeError);
    expect(() => finiteBinary64ToProjectiveComponent(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it('decodes negative and normal/subnormal binary64 boundaries exactly', () => {
    const largestSubnormal = Number.MIN_VALUE * (2 ** 52 - 1);
    expect(finiteBinary64ToProjectiveComponent(-Number.MIN_VALUE)).toEqual([-1n, 1n << 1074n]);
    expect(finiteBinary64ToProjectiveComponent(largestSubnormal)).toEqual([
      (1n << 52n) - 1n,
      1n << 1074n,
    ]);
    expect(finiteBinary64ToProjectiveComponent(2 ** -1022)).toEqual([1n, 1n << 1022n]);
    expect(finiteBinary64ToProjectiveComponent(-Number.MAX_VALUE)).toEqual([
      -(((1n << 53n) - 1n) << 971n),
      1n,
    ]);
  });

  it('forms one canonical homogeneous point from binary64 components', () => {
    expect(projectivePointFromFiniteBinary64(0.5, -0.25)).toEqual([2n, -1n, 4n]);
    expect(projectivePointFromFiniteBinary64(Number.MIN_VALUE, 0)).toEqual([1n, 0n, 1n << 1074n]);
  });

  it('accepts only canonical decimal rational JSON coordinates', () => {
    expect(
      projectivePointFromCanonicalDecimalRationalJson({
        x: { numerator: '1', denominator: '3' },
        y: { numerator: '-2', denominator: '5' },
      }),
    ).toEqual([5n, -6n, 15n]);
    expect(() =>
      projectivePointFromCanonicalDecimalRationalJson({
        x: { numerator: '2', denominator: '4' },
        y: { numerator: '0', denominator: '1' },
      }),
    ).toThrow(TypeError);
    expect(() =>
      projectivePointFromCanonicalDecimalRationalJson({
        x: { numerator: '01', denominator: '1' },
        y: { numerator: '0', denominator: '1' },
      }),
    ).toThrow(TypeError);
    expect(() =>
      projectivePointFromCanonicalDecimalRationalJson({
        x: { numerator: '0', denominator: '2' },
        y: { numerator: '0', denominator: '1' },
      }),
    ).toThrow(TypeError);
  });

  it('compares, identifies, and keys affine points without rounding', () => {
    const third = canonicalProjectivePoint(1n, 2n, 3n);
    const equivalent = Object.freeze([2n, 4n, 6n] as const);
    const laterX = canonicalProjectivePoint(2n, -100n, 3n);
    const laterY = canonicalProjectivePoint(1n, 3n, 3n);
    expect(equalProjectivePoints(third, equivalent)).toBe(true);
    expect(projectivePointKey(equivalent)).toBe('1:2:3');
    expect(compareProjectivePoints(third, laterX)).toBe(-1);
    expect(compareProjectivePoints(third, laterY)).toBe(-1);
    expect(compareProjectivePoints(equivalent, third)).toBe(0);
  });

  it('evaluates exact orientation determinants at non-dyadic and tiny scales', () => {
    const origin = point(0, 0);
    const third = canonicalProjectivePoint(3n, 1n, 3n);
    expect(projectiveOrientationSign(origin, point(3, 0), third)).toBe(1);
    expect(projectiveOrientationSign(origin, third, point(3, 0))).toBe(-1);
    expect(projectiveOrientationSign(origin, third, canonicalProjectivePoint(6n, 2n, 3n))).toBe(0);
    expect(
      projectiveOrientationSign(
        origin,
        projectivePointFromFiniteBinary64(Number.MIN_VALUE, 0),
        projectivePointFromFiniteBinary64(0, Number.MIN_VALUE),
      ),
    ).toBe(1);
  });

  it('intersects infinite lines exactly and distinguishes parallel from coincident', () => {
    const crossing = intersectProjectiveLines(point(0, 0), point(3, 1), point(1, 0), point(1, 2));
    expect(crossing).toEqual({ kind: 'point', point: [3n, 1n, 3n] });
    expect(intersectProjectiveLines(point(0, 0), point(2, 0), point(0, 1), point(2, 1))).toEqual({
      kind: 'parallel',
    });
    expect(intersectProjectiveLines(point(0, 0), point(2, 0), point(-3, 0), point(4, 0))).toEqual({
      kind: 'coincident',
    });
    expect(() =>
      intersectProjectiveLines(point(0, 0), point(0, 0), point(0, 1), point(1, 1)),
    ).toThrow(RangeError);
  });

  it('classifies proper crossings and preserves a non-dyadic intersection', () => {
    const result = classifyProjectiveSegmentIntersection(segment(0, 0, 3, 1), segment(1, 0, 1, 2));
    expect(result).toEqual({ kind: 'proper-crossing', point: [3n, 1n, 3n] });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('classifies endpoint touches, T-junctions, disjoint segments, and overlaps', () => {
    expect(classifyProjectiveSegmentIntersection(segment(0, 0, 1, 0), segment(1, 0, 1, 2))).toEqual(
      {
        kind: 'endpoint-touch',
        point: [1n, 0n, 1n],
        onA: 'end',
        onB: 'start',
      },
    );
    expect(classifyProjectiveSegmentIntersection(segment(0, 0, 2, 0), segment(1, 0, 1, 2))).toEqual(
      {
        kind: 't-junction',
        point: [1n, 0n, 1n],
        endpointOn: 'b',
        onA: 'interior',
        onB: 'start',
      },
    );
    expect(classifyProjectiveSegmentIntersection(segment(0, 0, 1, 0), segment(2, 0, 3, 0))).toEqual(
      { kind: 'disjoint' },
    );
    expect(classifyProjectiveSegmentIntersection(segment(0, 0, 3, 0), segment(1, 0, 4, 0))).toEqual(
      { kind: 'collinear-overlap' },
    );
    expect(classifyProjectiveSegmentIntersection(segment(0, 0, 1, 0), segment(1, 0, 3, 0))).toEqual(
      {
        kind: 'endpoint-touch',
        point: [1n, 0n, 1n],
        onA: 'end',
        onB: 'start',
      },
    );
    expect(() =>
      classifyProjectiveSegmentIntersection(segment(0, 0, 0, 0), segment(0, 1, 1, 1)),
    ).toThrow(RangeError);
  });

  it('selects the exact shared endpoint for reversed negative-slope and vertical collinear rays', () => {
    expect(
      classifyProjectiveSegmentIntersection(segment(3, -3, -1, 1), segment(-1, 1, -4, 4)),
    ).toEqual({
      kind: 'endpoint-touch',
      point: [-1n, 1n, 1n],
      onA: 'end',
      onB: 'start',
    });
    expect(
      classifyProjectiveSegmentIntersection(segment(2, -1, 2, 3), segment(2, -4, 2, -1)),
    ).toEqual({
      kind: 'endpoint-touch',
      point: [2n, -1n, 1n],
      onA: 'start',
      onB: 'end',
    });
  });

  it('does not lose a crossing whose coordinates are at the subnormal boundary', () => {
    const tiny = Number.MIN_VALUE;
    const result = classifyProjectiveSegmentIntersection(
      segment(0, 0, 2 * tiny, 2 * tiny),
      segment(0, 2 * tiny, 2 * tiny, 0),
    );
    expect(result.kind).toBe('proper-crossing');
    if (result.kind !== 'proper-crossing') throw new Error('expected a proper crossing');
    expect(result.point).toEqual([1n, 1n, 1n << 1074n]);
  });

  it('classifies a symmetric crossing at the maximum finite binary64 magnitude', () => {
    const limit = Number.MAX_VALUE;
    const result = classifyProjectiveSegmentIntersection(
      segment(-limit, -limit, limit, limit),
      segment(-limit, limit, limit, -limit),
    );
    expect(result).toEqual({ kind: 'proper-crossing', point: [0n, 0n, 1n] });
  });

  it('orders outgoing directions without atan2 or division', () => {
    const center = point(0, 0);
    const east = point(2, 0);
    const southeast = point(1, 1);
    const south = point(0, 2);
    const west = point(-2, 0);
    const north = point(0, -2);
    expect(compareProjectiveDirections(center, east, southeast)).toBe(-1);
    expect(compareProjectiveDirections(center, southeast, south)).toBe(-1);
    expect(compareProjectiveDirections(center, south, west)).toBe(-1);
    expect(compareProjectiveDirections(center, west, north)).toBe(-1);
    expect(compareProjectiveDirections(center, north, east)).toBe(1);
    expect(compareProjectiveDirections(center, east, point(10, 0))).toBe(0);
    expect(() => compareProjectiveDirections(center, center, east)).toThrow(RangeError);
  });

  it('treats rational endpoints on the same ray as an angular tie at negative coordinates', () => {
    const center = canonicalProjectivePoint(-5n, 6n, 15n);
    const near = canonicalProjectivePoint(-20n, 12n, 105n);
    const far = canonicalProjectivePoint(10n, -48n, 105n);
    const opposite = canonicalProjectivePoint(-50n, 72n, 105n);

    expect(compareProjectiveDirections(center, near, far)).toBe(0);
    expect(compareProjectiveDirections(center, far, near)).toBe(0);
    expect(compareProjectiveDirections(center, near, opposite)).not.toBe(0);
    expect(compareProjectiveDirections(center, near, opposite)).toBe(
      -compareProjectiveDirections(center, opposite, near),
    );
  });

  it('computes and compares exact signed polygon and triangle areas', () => {
    const square = [point(0, 0), point(2, 0), point(2, 1), point(0, 1)] as const;
    const polygonArea = projectivePolygonTwiceSignedArea(square);
    const firstTriangle = projectiveTriangleTwiceSignedArea(square[0], square[1], square[2]);
    const secondTriangle = projectiveTriangleTwiceSignedArea(square[0], square[2], square[3]);
    const triangleArea = addProjectiveRationalComponents(firstTriangle, secondTriangle);
    expect(polygonArea).toEqual([4n, 1n]);
    expect(firstTriangle).toEqual([2n, 1n]);
    expect(equalProjectiveRationalComponents(polygonArea, triangleArea)).toBe(true);
    expect(compareProjectiveRationalComponents(polygonArea, triangleArea)).toBe(0);
    expect(signProjectiveRationalComponent(polygonArea)).toBe(1);
    expect(projectivePolygonTwiceSignedArea([...square].reverse())).toEqual([-4n, 1n]);
    expect(() => projectivePolygonTwiceSignedArea(square.slice(0, 2))).toThrow(RangeError);
  });

  it('keeps rational and underflow-scale areas nonzero and exactly comparable', () => {
    const rationalTriangle = [
      canonicalProjectivePoint(0n, 0n, 1n),
      canonicalProjectivePoint(1n, 0n, 3n),
      canonicalProjectivePoint(0n, 1n, 5n),
    ] as const;
    expect(projectiveTriangleTwiceSignedArea(...rationalTriangle)).toEqual([1n, 15n]);

    const origin = point(0, 0);
    const tinyX = projectivePointFromFiniteBinary64(Number.MIN_VALUE, 0);
    const tinyY = projectivePointFromFiniteBinary64(0, Number.MIN_VALUE);
    const tinyArea = projectiveTriangleTwiceSignedArea(origin, tinyX, tinyY);
    expect(tinyArea[0]).toBe(1n);
    expect(tinyArea[1]).toBe(1n << 2148n);
    expect(signProjectiveRationalComponent(tinyArea)).toBe(1);
  });

  it('cancels an enormous negative translation while retaining a small rational area', () => {
    const translation = 1n << 4096n;
    const rectangle = [
      canonicalProjectivePoint(translation, -translation, 1n),
      canonicalProjectivePoint(3n * translation + 1n, -3n * translation, 3n),
      canonicalProjectivePoint(15n * translation + 5n, -15n * translation + 3n, 15n),
      canonicalProjectivePoint(5n * translation, -5n * translation + 1n, 5n),
    ] as const;

    const polygonArea = projectivePolygonTwiceSignedArea(rectangle);
    const triangleArea = addProjectiveRationalComponents(
      projectiveTriangleTwiceSignedArea(rectangle[0], rectangle[1], rectangle[2]),
      projectiveTriangleTwiceSignedArea(rectangle[0], rectangle[2], rectangle[3]),
    );
    expect(polygonArea).toEqual([2n, 15n]);
    expect(triangleArea).toEqual([2n, 15n]);
  });
});
