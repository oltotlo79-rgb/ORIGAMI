import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PROJECTIVE_RATIONAL_3D_INPUT_LIMITS,
  canonicalProjectivePoint3,
  compareProjectivePoint3Coordinate,
  compareProjectivePoints3,
  equalProjectivePoints3,
  parseCanonicalDecimalRationalPoint3,
  projectiveAxisDropOrient2DSign,
  projectiveOrient3DSign,
  projectivePlaneThrough3,
  projectivePoint3FromRationalComponents,
  projectivePointPlaneSign,
  signProjectiveBigInt,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function point(x: bigint, y: bigint, z: bigint): ProjectivePoint3 {
  return canonicalProjectivePoint3(x, y, z, 1n);
}

function independentDeterminant(rows: readonly (readonly bigint[])[]): bigint {
  if (rows.length === 0 || rows.some((row) => row.length !== rows.length)) {
    throw new RangeError('independent determinant requires a nonempty square matrix');
  }
  const firstRow = rows[0];
  if (firstRow === undefined) throw new RangeError('determinant matrix has no first row');
  if (rows.length === 1) {
    const firstValue = firstRow[0];
    if (firstValue === undefined) throw new RangeError('determinant matrix has no first value');
    return firstValue;
  }
  let result = 0n;
  for (let column = 0; column < rows.length; column += 1) {
    const minor = rows.slice(1).map((row) => row.filter((_, index) => index !== column));
    const direction = column % 2 === 0 ? 1n : -1n;
    const coefficient = firstRow[column];
    if (coefficient === undefined) throw new RangeError('determinant matrix is ragged');
    result += direction * coefficient * independentDeterminant(minor);
  }
  return result;
}

const ORIGIN = point(0n, 0n, 0n);
const UNIT_X = point(1n, 0n, 0n);
const UNIT_Y = point(0n, 1n, 0n);
const UNIT_Z = point(0n, 0n, 1n);

describe('independent exact projective-rational 3D kernel', () => {
  it('is dependency-free and explicitly limits its static predicate scope', async () => {
    const source = await readFile(
      resolve('m0f/reference-verifier/projective-rational-3d.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/^\s*import\b/mu);
    expect(source).not.toContain('/geometry/');
    expect(source).not.toContain('model/exact-rational');
    expect(source).toContain('constant vertex');
    expect(source).toContain('rigid-');
    expect(source).toContain('does not classify triangle');
    expect(source).toContain('imply GO');
  });

  it('canonicalizes homogeneous aliases, signs, gcd, and the zero point', () => {
    const canonical = canonicalProjectivePoint3(2n, -4n, 6n, 8n);
    expect(canonical).toEqual({ x: 1n, y: -2n, z: 3n, w: 4n });
    expect(canonicalProjectivePoint3(-2n, 4n, -6n, -8n)).toEqual(canonical);
    expect(canonicalProjectivePoint3(0n, 0n, 0n, -999n)).toEqual({
      x: 0n,
      y: 0n,
      z: 0n,
      w: 1n,
    });
    expect(Object.isFrozen(canonical)).toBe(true);
    expect(() => canonicalProjectivePoint3(1n, 2n, 3n, 0n)).toThrow(RangeError);
  });

  it('constructs exact points from rational components and rejects nonpositive denominators', () => {
    expect(projectivePoint3FromRationalComponents([1n, 3n], [-2n, 5n], [7n, 11n])).toEqual({
      x: 55n,
      y: -66n,
      z: 105n,
      w: 165n,
    });
    expect(projectivePoint3FromRationalComponents([0n, 7n], [0n, 9n], [0n, 11n])).toEqual({
      x: 0n,
      y: 0n,
      z: 0n,
      w: 1n,
    });
    expect(() => projectivePoint3FromRationalComponents([1n, -2n], [0n, 1n], [0n, 1n])).toThrow(
      RangeError,
    );
    expect(() => projectivePoint3FromRationalComponents([1n, 0n], [0n, 1n], [0n, 1n])).toThrow(
      RangeError,
    );
  });

  it('compares affine points and recognizes non-normalized positive aliases', () => {
    const first = canonicalProjectivePoint3(1n, 2n, 3n, 5n);
    const alias = Object.freeze({ x: 2n, y: 4n, z: 6n, w: 10n });
    expect(equalProjectivePoints3(first, alias)).toBe(true);
    expect(compareProjectivePoints3(first, alias)).toBe(0);
    expect(compareProjectivePoint3Coordinate(first, point(1n, -99n, -99n), 'x')).toBe(-1);
    expect(compareProjectivePoints3(first, canonicalProjectivePoint3(1n, 3n, -99n, 5n))).toBe(-1);
    expect(compareProjectivePoints3(first, canonicalProjectivePoint3(1n, 2n, 4n, 5n))).toBe(-1);
    expect(compareProjectivePoints3(point(2n, 0n, 0n), point(1n, 99n, 99n))).toBe(1);
    expect(
      projectiveOrient3DSign(
        Object.freeze({ x: 0n, y: 0n, z: 0n, w: 7n }),
        Object.freeze({ x: 11n, y: 0n, z: 0n, w: 11n }),
        Object.freeze({ x: 0n, y: 13n, z: 0n, w: 13n }),
        Object.freeze({ x: 0n, y: 0n, z: 17n, w: 17n }),
      ),
    ).toBe(1);
  });

  it('returns positive, negative, and zero orient3D signs with alternating permutations', () => {
    expect(projectiveOrient3DSign(ORIGIN, UNIT_X, UNIT_Y, UNIT_Z)).toBe(1);
    expect(projectiveOrient3DSign(ORIGIN, UNIT_Y, UNIT_X, UNIT_Z)).toBe(-1);
    expect(projectiveOrient3DSign(UNIT_X, ORIGIN, UNIT_Y, UNIT_Z)).toBe(-1);
    expect(projectiveOrient3DSign(ORIGIN, UNIT_Y, UNIT_Z, UNIT_X)).toBe(1);
    expect(projectiveOrient3DSign(ORIGIN, UNIT_X, UNIT_Y, point(3n, 4n, 0n))).toBe(0);
    expect(projectiveOrient3DSign(ORIGIN, ORIGIN, UNIT_Y, UNIT_Z)).toBe(0);
  });

  it('matches an independent determinant over deterministic projective samples', () => {
    let state = 123_456_789n;
    const next = () => {
      state = (1_103_515_245n * state + 12_345n) % 2_147_483_648n;
      return state;
    };
    const sample = () =>
      canonicalProjectivePoint3(
        (next() % 101n) - 50n,
        (next() % 101n) - 50n,
        (next() % 101n) - 50n,
        (next() % 19n) + 1n,
      );

    for (let sampleIndex = 0; sampleIndex < 256; sampleIndex += 1) {
      const points = [sample(), sample(), sample(), sample()] as const;
      const independentOrient = signProjectiveBigInt(
        independentDeterminant(points.map(({ w, x, y, z }) => [w, x, y, z])),
      );
      expect(projectiveOrient3DSign(...points)).toBe(independentOrient);

      const projectionCases = [
        { drop: 'x', u: 'y', v: 'z' },
        { drop: 'y', u: 'x', v: 'z' },
        { drop: 'z', u: 'x', v: 'y' },
      ] as const;
      const projections = projectionCases.map(({ drop, u, v }) => {
        const actual = projectiveAxisDropOrient2DSign(points[0], points[1], points[2], drop);
        const expected = signProjectiveBigInt(
          independentDeterminant(points.slice(0, 3).map((value) => [value[u], value[v], value.w])),
        );
        expect(actual).toBe(expected);
        return actual;
      });
      if (projections.some((sign) => sign !== 0)) {
        const plane = projectivePlaneThrough3(points[0], points[1], points[2]);
        expect(projectivePointPlaneSign(plane, points[0])).toBe(0);
        expect(projectivePointPlaneSign(plane, points[1])).toBe(0);
        expect(projectivePointPlaneSign(plane, points[2])).toBe(0);
        expect(projectivePointPlaneSign(plane, points[3])).toBe(independentOrient);
      }
    }
  });

  it('is invariant under exact translation and positive affine scale', () => {
    const translate = (value: ProjectivePoint3) =>
      point(value.x - 71n, value.y + 103n, value.z + 9n);
    const scale = (value: ProjectivePoint3) => point(value.x * 37n, value.y * 37n, value.z * 37n);
    expect(
      projectiveOrient3DSign(
        translate(ORIGIN),
        translate(UNIT_X),
        translate(UNIT_Y),
        translate(UNIT_Z),
      ),
    ).toBe(1);
    expect(projectiveOrient3DSign(scale(ORIGIN), scale(UNIT_X), scale(UNIT_Y), scale(UNIT_Z))).toBe(
      1,
    );
  });

  it('evaluates oriented planes consistently with orient3D', () => {
    const plane = projectivePlaneThrough3(ORIGIN, UNIT_X, UNIT_Y);
    expect(plane).toEqual({ a: 0n, b: 0n, c: 1n, d: 0n });
    expect(Object.isFrozen(plane)).toBe(true);
    expect(projectivePointPlaneSign(plane, UNIT_Z)).toBe(1);
    expect(projectivePointPlaneSign(plane, point(4n, -2n, 0n))).toBe(0);
    const reversed = projectivePlaneThrough3(ORIGIN, UNIT_Y, UNIT_X);
    expect(projectivePointPlaneSign(reversed, UNIT_Z)).toBe(-1);
    expect(() => projectivePlaneThrough3(ORIGIN, UNIT_X, point(2n, 0n, 0n))).toThrow(RangeError);

    const rationalFirst = projectivePoint3FromRationalComponents([1n, 2n], [-1n, 3n], [2n, 5n]);
    const rationalSecond = projectivePoint3FromRationalComponents([9n, 14n], [-1n, 3n], [2n, 5n]);
    const rationalThird = projectivePoint3FromRationalComponents([1n, 2n], [-2n, 9n], [2n, 5n]);
    const rationalFourth = projectivePoint3FromRationalComponents([1n, 2n], [-1n, 3n], [3n, 5n]);
    const rationalPlane = projectivePlaneThrough3(rationalFirst, rationalSecond, rationalThird);
    expect(projectivePointPlaneSign(rationalPlane, rationalFourth)).toBe(
      projectiveOrient3DSign(rationalFirst, rationalSecond, rationalThird, rationalFourth),
    );
    expect(projectivePointPlaneSign(rationalPlane, rationalFourth)).toBe(1);
  });

  it('computes exact axis-drop 2D orientation with a documented coordinate order', () => {
    expect(projectiveAxisDropOrient2DSign(ORIGIN, UNIT_Y, UNIT_Z, 'x')).toBe(1);
    expect(projectiveAxisDropOrient2DSign(ORIGIN, UNIT_X, UNIT_Z, 'y')).toBe(1);
    expect(projectiveAxisDropOrient2DSign(ORIGIN, UNIT_X, UNIT_Y, 'z')).toBe(1);
    expect(projectiveAxisDropOrient2DSign(ORIGIN, UNIT_Y, UNIT_X, 'z')).toBe(-1);
    expect(projectiveAxisDropOrient2DSign(ORIGIN, UNIT_X, point(2n, 0n, 0n), 'z')).toBe(0);
  });

  it('retains signs at 1e-300/1e300 scales and with 632-digit components', () => {
    const tenTo300 = 10n ** 300n;
    const tinyX = projectivePoint3FromRationalComponents([1n, tenTo300], [0n, 1n], [0n, 1n]);
    const hugeY = point(0n, tenTo300, 0n);
    const digit632 = 10n ** 631n;
    const hugeZ = point(0n, 0n, digit632);
    expect(projectiveOrient3DSign(ORIGIN, tinyX, hugeY, hugeZ)).toBe(1);
    expect(projectiveOrient3DSign(ORIGIN, hugeY, tinyX, hugeZ)).toBe(-1);
  });

  it('does not lose a near-coplanar determinant erased by binary64 rounding', () => {
    const translation = 10n ** 300n;
    const denominator = 10n ** 632n;
    const a = point(translation, translation, translation);
    const b = point(translation + 1n, translation, translation);
    const c = point(translation, translation + 1n, translation);
    const d = projectivePoint3FromRationalComponents(
      [translation, 1n],
      [translation, 1n],
      [translation * denominator + 1n, denominator],
    );
    expect(Number(translation)).toBe(Number(translation + 1n));
    expect(Number(translation * denominator)).toBe(Number.POSITIVE_INFINITY);
    expect(projectiveOrient3DSign(a, b, c, d)).toBe(1);
  });

  it('parses only closed canonical decimal rational JSON and deeply freezes success', () => {
    const parsed = parseCanonicalDecimalRationalPoint3({
      x: { numerator: '1', denominator: '3' },
      y: { numerator: '-2', denominator: '5' },
      z: { numerator: '7', denominator: '11' },
    });
    expect(parsed).toEqual({ ok: true, point: { x: 55n, y: -66n, z: 105n, w: 165n } });
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new Error('expected valid point');
    expect(Object.isFrozen(parsed.point)).toBe(true);

    const huge = `1${'0'.repeat(631)}`;
    expect(
      parseCanonicalDecimalRationalPoint3({
        x: { numerator: huge, denominator: '1' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      }).ok,
    ).toBe(true);
  });

  it('publishes and enforces the exact decimal-digit boundary', () => {
    expect(PROJECTIVE_RATIONAL_3D_INPUT_LIMITS).toEqual({
      maxDecimalDigits: 4096,
      maxDiagnosticPathSegmentCodeUnits: 128,
    });
    expect(Object.isFrozen(PROJECTIVE_RATIONAL_3D_INPUT_LIMITS)).toBe(true);
    const atLimit = `1${'0'.repeat(4095)}`;
    const accepted = parseCanonicalDecimalRationalPoint3({
      x: { numerator: atLimit, denominator: '1' },
      y: { numerator: `-${'1'.repeat(4096)}`, denominator: '1' },
      z: { numerator: '1', denominator: atLimit },
    });
    expect(accepted.ok).toBe(true);

    const overLimit = parseCanonicalDecimalRationalPoint3({
      x: { numerator: `1${'0'.repeat(4096)}`, denominator: '1' },
      y: { numerator: '0', denominator: '1' },
      z: { numerator: '0', denominator: '1' },
    });
    expect(overLimit).toEqual({
      ok: false,
      violations: [{ path: '$.x.numerator', code: 'too-many-digits' }],
    });

    const denominatorOverLimit = parseCanonicalDecimalRationalPoint3({
      x: { numerator: '0', denominator: '1' },
      y: { numerator: '0', denominator: '1' },
      z: { numerator: '1', denominator: `1${'0'.repeat(4096)}` },
    });
    expect(denominatorOverLimit).toEqual({
      ok: false,
      violations: [{ path: '$.z.denominator', code: 'too-many-digits' }],
    });
  });

  it('rejects noncanonical, nonpositive, unreduced, unknown, and overlong input', () => {
    const cases: unknown[] = [
      {
        x: { numerator: '01', denominator: '1' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      },
      {
        x: { numerator: '1', denominator: '-2' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      },
      {
        x: { numerator: '1', denominator: '0' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      },
      {
        x: { numerator: '2', denominator: '4' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      },
      {
        x: { numerator: '0', denominator: '2' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      },
      {
        x: { numerator: '0', denominator: '1', extra: true },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
        extra: true,
      },
      {
        x: { numerator: '1'.repeat(4097), denominator: '1' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      },
      { x: {}, y: {}, z: {}, a: 1, b: 2, c: 3, d: 4, e: 5 },
    ];
    for (const value of cases) {
      const parsed = parseCanonicalDecimalRationalPoint3(value);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) throw new Error('expected invalid point');
      expect(Object.isFrozen(parsed)).toBe(true);
      expect(Object.isFrozen(parsed.violations)).toBe(true);
      expect(parsed.violations.every((entry) => Object.isFrozen(entry))).toBe(true);
    }
  });

  it('does not invoke accessors and terminates on cyclic or hostile inspection input', () => {
    let calls = 0;
    const accessor = {
      get x() {
        calls += 1;
        return { numerator: '0', denominator: '1' };
      },
      y: { numerator: '0', denominator: '1' },
      z: { numerator: '0', denominator: '1' },
    };
    const accessorResult = parseCanonicalDecimalRationalPoint3(accessor);
    expect(accessorResult.ok).toBe(false);
    expect(calls).toBe(0);

    const cyclic: Record<string, unknown> = {};
    cyclic.x = cyclic;
    cyclic.y = { numerator: '0', denominator: '1' };
    cyclic.z = { numerator: '0', denominator: '1' };
    expect(parseCanonicalDecimalRationalPoint3(cyclic).ok).toBe(false);

    const hostile = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('hostile proxy');
        },
      },
    );
    expect(parseCanonicalDecimalRationalPoint3(hostile)).toEqual({
      ok: false,
      violations: [{ path: '$', code: 'inspection-failed' }],
    });

    const revocable = Proxy.revocable({}, {});
    revocable.revoke();
    expect(parseCanonicalDecimalRationalPoint3(revocable.proxy)).toEqual({
      ok: false,
      violations: [{ path: '$', code: 'inspection-failed' }],
    });
  });

  it('bounds and deterministically orders hostile symbol names in diagnostic paths', () => {
    const alpha = Symbol('a'.repeat(100_000));
    const zeta = Symbol('z'.repeat(100_000));
    const pathsFor = (symbols: readonly symbol[]) => {
      const supplied: Record<PropertyKey, unknown> = {
        x: { numerator: '0', denominator: '1' },
        y: { numerator: '0', denominator: '1' },
        z: { numerator: '0', denominator: '1' },
      };
      for (const symbol of symbols) supplied[symbol] = true;
      const result = parseCanonicalDecimalRationalPoint3(supplied);
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('unknown symbol properties must fail');
      return result.violations
        .filter((entry) => entry.code === 'unexpected-property')
        .map((entry) => entry.path);
    };

    const paths = pathsFor([zeta, alpha]);
    expect(paths).toEqual(pathsFor([alpha, zeta]));
    expect(paths).toHaveLength(2);
    expect(paths[0]?.startsWith('$.Symbol(a')).toBe(true);
    expect(paths[1]?.startsWith('$.Symbol(z')).toBe(true);
    for (const path of paths) {
      expect(path.length).toBe(
        PROJECTIVE_RATIONAL_3D_INPUT_LIMITS.maxDiagnosticPathSegmentCodeUnits + 2,
      );
      expect(path.endsWith('…')).toBe(true);
    }
  });

  it('returns deterministic validation results and exact BigInt signs', () => {
    const invalid = {
      x: { numerator: '2', denominator: '4', later: true },
      y: { numerator: '-0', denominator: '1' },
      z: { numerator: '0', denominator: '-1' },
      later: true,
    };
    expect(parseCanonicalDecimalRationalPoint3(invalid)).toEqual(
      parseCanonicalDecimalRationalPoint3(invalid),
    );
    expect(signProjectiveBigInt(-(10n ** 1000n))).toBe(-1);
    expect(signProjectiveBigInt(0n)).toBe(0);
    expect(signProjectiveBigInt(10n ** 1000n)).toBe(1);
  });
});
