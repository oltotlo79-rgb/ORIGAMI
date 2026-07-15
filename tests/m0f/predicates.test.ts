import { describe, expect, it } from 'vitest';

import {
  classifySegmentIntersection,
  orientation2D,
  type Point2,
  type Segment2,
} from '../../m0f/geometry/predicates.js';

const DEFAULT_POLICY = Object.freeze({ fastFilterArea: 0 });

type OracleDyadic = Readonly<{ coefficient: bigint; exponent: number }>;

function decodeBinary64ForOracle(value: number): OracleDyadic {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  const unsigned = exponentBits === 0 ? fraction : (1n << 52n) | fraction;
  return {
    coefficient: bits >> 63n === 0n ? unsigned : -unsigned,
    exponent: exponentBits === 0 ? -1074 : exponentBits - 1075,
  };
}

function arbitraryBinary64OrientationOracle(a: Point2, b: Point2, c: Point2): -1 | 0 | 1 {
  const decoded = [a.x, a.y, b.x, b.y, c.x, c.y].map(decodeBinary64ForOracle);
  const commonExponent = Math.min(...decoded.map((entry) => entry.exponent));
  const integers = decoded.map(
    (entry) => entry.coefficient << BigInt(entry.exponent - commonExponent),
  );
  const [ax, ay, bx, by, cx, cy] = integers;
  if (
    ax === undefined ||
    ay === undefined ||
    bx === undefined ||
    by === undefined ||
    cx === undefined ||
    cy === undefined
  ) {
    throw new Error('oracle requires six coordinates');
  }
  const determinant = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  return determinant < 0n ? -1 : determinant > 0n ? 1 : 0;
}

function binary64FromBits(bits: bigint): number {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, bits, false);
  return view.getFloat64(0, false);
}

function requireOrientation(a: Point2, b: Point2, c: Point2, fastFilterArea = 0) {
  const result = orientation2D(a, b, c, { fastFilterArea });
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function requireIntersection(a: Segment2, b: Segment2) {
  const result = classifySegmentIntersection(a, b, DEFAULT_POLICY);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

describe('M0F binary64 orientation predicate', () => {
  it('returns stored-coordinate determinant signs and reports the execution path', () => {
    expect(requireOrientation({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 })).toMatchObject({
      sign: 1,
      path: 'fast-filter',
    });
    expect(requireOrientation({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 0 })).toMatchObject({
      sign: -1,
      path: 'fast-filter',
    });
    const collinear = requireOrientation({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 });
    expect(collinear.sign).toBe(0);
    expect(collinear.path).toBe('exact-dyadic');
    expect(collinear.approximateDeterminant).toBe(0);
    expect(typeof collinear.fastErrorBound).toBe('number');
  });

  it('uses exact dyadic fallback near cancellation and when policy forces it', () => {
    const near = requireOrientation(
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2.0000000000000004 },
    );
    expect(near.sign).toBe(1);
    expect(near.path).toBe('exact-dyadic');

    const forced = requireOrientation({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, 10);
    expect(forced).toMatchObject({ sign: 1, path: 'exact-dyadic' });
  });

  it('rejects non-finite coordinates and invalid policy without guessing a sign', () => {
    const nonFinite = orientation2D(
      { x: Number.POSITIVE_INFINITY, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      DEFAULT_POLICY,
    );
    expect(nonFinite.ok).toBe(false);
    if (nonFinite.ok) throw new Error('expected finite-coordinate rejection');
    expect(nonFinite.error.some((entry) => entry.code === 'non-finite-coordinate')).toBe(true);

    const badPolicy = orientation2D(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { fastFilterArea: -1 },
    );
    expect(badPolicy.ok).toBe(false);
    if (badPolicy.ok) throw new Error('expected policy rejection');
    expect(badPolicy.error.some((entry) => entry.code === 'invalid-orientation-policy')).toBe(true);
  });

  it('matches an independent BigInt oracle on fixed-seed integer triples', () => {
    let state = 0x4f524947;
    const nextInteger = (): number => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return (state % 2_000_001) - 1_000_000;
    };
    const oracle = (a: Point2, b: Point2, c: Point2): -1 | 0 | 1 => {
      const determinant =
        (BigInt(b.x) - BigInt(a.x)) * (BigInt(c.y) - BigInt(a.y)) -
        (BigInt(b.y) - BigInt(a.y)) * (BigInt(c.x) - BigInt(a.x));
      return determinant < 0n ? -1 : determinant > 0n ? 1 : 0;
    };

    for (let index = 0; index < 5_000; index += 1) {
      const a = { x: nextInteger(), y: nextInteger() };
      const b = { x: nextInteger(), y: nextInteger() };
      const c = { x: nextInteger(), y: nextInteger() };
      expect(requireOrientation(a, b, c).sign).toBe(oracle(a, b, c));
    }
  });

  it('matches an independent common-exponent oracle across binary64 exponent bands', () => {
    let state = 0x6a09e667f3bcc909n;
    const mask = (1n << 64n) - 1n;
    const nextBits = (index: number): bigint => {
      state ^= (state << 13n) & mask;
      state ^= state >> 7n;
      state ^= (state << 17n) & mask;
      const signAndFraction = state & ((1n << 63n) | ((1n << 52n) - 1n));
      const exponent = BigInt(index % 2047) << 52n;
      return signAndFraction | exponent;
    };

    for (let index = 0; index < 1_200; index += 1) {
      const values = Array.from({ length: 6 }, (_, offset) =>
        binary64FromBits(nextBits(index * 6 + offset)),
      );
      const [ax, ay, bx, by, cx, cy] = values;
      if (
        ax === undefined ||
        ay === undefined ||
        bx === undefined ||
        by === undefined ||
        cx === undefined ||
        cy === undefined
      ) {
        throw new Error('generator requires six values');
      }
      const a = { x: ax, y: ay };
      const b = { x: bx, y: by };
      const c = { x: cx, y: cy };
      expect(requireOrientation(a, b, c).sign).toBe(arbitraryBinary64OrientationOracle(a, b, c));
    }
  });
});

describe('M0F exact-topology segment intersection classifier', () => {
  const segment = (x0: number, y0: number, x1: number, y1: number): Segment2 => ({
    start: { x: x0, y: y0 },
    end: { x: x1, y: y1 },
  });

  it('distinguishes proper crossing, endpoint touch, and T-junction', () => {
    expect(requireIntersection(segment(0, 0, 2, 2), segment(0, 2, 2, 0))).toMatchObject({
      kind: 'proper-crossing',
    });
    expect(requireIntersection(segment(0, 0, 1, 0), segment(1, 0, 1, 1))).toMatchObject({
      kind: 'touch',
      onA: 'end',
      onB: 'start',
    });
    expect(requireIntersection(segment(0, 0, 2, 0), segment(1, -1, 1, 0))).toMatchObject({
      kind: 'touch',
      onA: 'interior',
      onB: 'end',
    });
  });

  it('distinguishes collinear endpoint touch, overlap, and disjoint intervals', () => {
    expect(requireIntersection(segment(0, 0, 1, 0), segment(1, 0, 2, 0))).toMatchObject({
      kind: 'touch',
    });
    expect(requireIntersection(segment(0, 0, 2, 0), segment(1, 0, 3, 0))).toMatchObject({
      kind: 'collinear-overlap',
    });
    expect(requireIntersection(segment(0, 0, 1, 0), segment(2, 0, 3, 0))).toEqual({
      kind: 'disjoint',
      exactFallbackCount: 4,
    });
  });

  it('does not turn a one-ULP separated parallel segment into contact', () => {
    const offset = Number.MIN_VALUE;
    expect(requireIntersection(segment(0, 0, 1, 0), segment(0, offset, 1, offset))).toMatchObject({
      kind: 'disjoint',
    });
  });

  it('preserves the topological classification when directions and segment order change', () => {
    const a = segment(0, 0, 2, 2);
    const b = segment(0, 2, 2, 0);
    const reversedA = { start: a.end, end: a.start };
    const reversedB = { start: b.end, end: b.start };
    expect(requireIntersection(a, b).kind).toBe('proper-crossing');
    expect(requireIntersection(reversedA, b).kind).toBe('proper-crossing');
    expect(requireIntersection(a, reversedB).kind).toBe('proper-crossing');
    expect(requireIntersection(b, a).kind).toBe('proper-crossing');
  });

  it('fails closed on zero-length segments', () => {
    const result = classifySegmentIntersection(
      segment(0, 0, 0, 0),
      segment(0, 0, 1, 1),
      DEFAULT_POLICY,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected degenerate segment rejection');
    expect(result.error.some((entry) => entry.code === 'degenerate-segment')).toBe(true);
  });
});
