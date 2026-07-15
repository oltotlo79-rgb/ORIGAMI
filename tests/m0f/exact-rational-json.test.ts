import { describe, expect, it } from 'vitest';

import {
  exactRationalPointToJsonV1,
  exactRationalToJsonV1,
  parseExactRationalJsonV1,
} from '../../m0f/model/exact-rational-json.js';
import { exactRational } from '../../m0f/model/exact-rational.js';

describe('exact rational JSON encoding v1', () => {
  it('round-trips normalized fractions without JSON BigInt values', () => {
    const encoded = exactRationalToJsonV1(exactRational(-2n, 6n));
    expect(encoded).toEqual({ numerator: '-1', denominator: '3' });
    expect(JSON.stringify(encoded)).toBe('{"numerator":"-1","denominator":"3"}');
    expect(parseExactRationalJsonV1(encoded)).toEqual({
      ok: true,
      value: exactRational(-1n, 3n),
    });
    expect(Object.isFrozen(encoded)).toBe(true);
  });

  it('encodes both coordinates independently', () => {
    expect(
      exactRationalPointToJsonV1({ x: exactRational(1n, 3n), y: exactRational(5n, 7n) }),
    ).toEqual({
      x: { numerator: '1', denominator: '3' },
      y: { numerator: '5', denominator: '7' },
    });
  });

  it.each([
    { numerator: 2n, denominator: 4n },
    { numerator: 1n, denominator: 0n },
    { numerator: 1n, denominator: -3n },
  ])('refuses to emit a structural non-canonical ExactRational %#', (value) => {
    expect(() => exactRationalToJsonV1(value)).toThrow(TypeError);
  });

  it.each([
    [{ numerator: '2', denominator: '4' }, 'not-normalized'],
    [{ numerator: '-0', denominator: '1' }, 'invalid-integer'],
    [{ numerator: '0', denominator: '2' }, 'not-normalized'],
    [{ numerator: '1', denominator: '0' }, 'invalid-integer'],
    [{ numerator: '01', denominator: '1' }, 'invalid-integer'],
    [{ numerator: '1', denominator: '1', extra: true }, 'unknown-field'],
    [new Map(), 'invalid-snapshot'],
  ])('rejects non-canonical input %#', (input, code) => {
    const parsed = parseExactRationalJsonV1(input);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.map((issue) => issue.code)).toContain(code);
  });
});
