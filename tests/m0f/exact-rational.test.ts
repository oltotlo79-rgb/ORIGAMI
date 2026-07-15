import { describe, expect, it } from 'vitest';

import {
  addExactRational,
  compareExactRational,
  divideExactRational,
  exactRational,
  exactRationalKey,
  exactRationalOrientationSign,
  exactRationalToBinary64ForDisplay,
  finiteBinary64ToExactRational,
  multiplyExactRational,
  subtractExactRational,
} from '../../m0f/model/exact-rational.js';

describe('M0F normalized exact rational', () => {
  it('normalizes sign, common factors, and zero uniquely', () => {
    expect(exactRational(6n, -8n)).toEqual({ numerator: -3n, denominator: 4n });
    expect(exactRational(0n, -99n)).toEqual({ numerator: 0n, denominator: 1n });
    expect(() => exactRational(1n, 0n)).toThrow(/denominator/u);
  });

  it('converts binary64 storage exactly, including subnormal and signed zero', () => {
    expect(finiteBinary64ToExactRational(-0)).toEqual({ numerator: 0n, denominator: 1n });
    expect(finiteBinary64ToExactRational(0.1)).toEqual({
      numerator: 3_602_879_701_896_397n,
      denominator: 36_028_797_018_963_968n,
    });
    const minimum = finiteBinary64ToExactRational(Number.MIN_VALUE);
    expect(minimum.numerator).toBe(1n);
    expect(minimum.denominator).toBe(1n << 1074n);
    const maximum = finiteBinary64ToExactRational(Number.MAX_VALUE);
    expect(maximum.denominator).toBe(1n);
    expect(exactRationalToBinary64ForDisplay(minimum)).toBe(Number.MIN_VALUE);
    expect(exactRationalToBinary64ForDisplay(maximum)).toBe(Number.MAX_VALUE);
  });

  it('rejects all non-finite binary64 values', () => {
    expect(() => finiteBinary64ToExactRational(Number.NaN)).toThrow(/finite/u);
    expect(() => finiteBinary64ToExactRational(Number.POSITIVE_INFINITY)).toThrow(/finite/u);
    expect(() => finiteBinary64ToExactRational(Number.NEGATIVE_INFINITY)).toThrow(/finite/u);
  });

  it('keeps arithmetic reduced and compares without number conversion', () => {
    const oneThird = exactRational(1n, 3n);
    const oneSixth = exactRational(1n, 6n);
    expect(addExactRational(oneThird, oneSixth)).toEqual(exactRational(1n, 2n));
    expect(subtractExactRational(oneThird, oneSixth)).toEqual(oneSixth);
    expect(multiplyExactRational(oneThird, exactRational(9n, 2n))).toEqual(exactRational(3n, 2n));
    expect(divideExactRational(oneThird, exactRational(-2n, 5n))).toEqual(exactRational(-5n, 6n));
    expect(compareExactRational(exactRational(2n, 6n), oneThird)).toBe(0);
    expect(exactRationalKey(exactRational(-4n, 2n))).toBe('-2');
    expect(exactRationalKey(oneThird)).toBe('1/3');
    expect(exactRationalToBinary64ForDisplay(oneThird)).toBeCloseTo(1 / 3, 15);
    expect(
      exactRationalOrientationSign(
        { x: exactRational(0n), y: exactRational(0n) },
        { x: exactRational(1n, 3n), y: exactRational(1n, 7n) },
        { x: exactRational(2n, 3n), y: exactRational(2n, 7n) },
      ),
    ).toBe(0);
    expect(() => divideExactRational(oneThird, exactRational(0n))).toThrow(/zero/u);
  });
});
