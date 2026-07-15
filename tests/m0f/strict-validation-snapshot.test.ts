import { describe, expect, it } from 'vitest';

import { tryCreateStrictValidationSnapshot } from '../../m0f/strict-validation-snapshot.js';

describe('strict validation snapshot defensive property budgets', () => {
  it('accepts values exactly at object, key, and global property limits', () => {
    const result = tryCreateStrictValidationSnapshot(
      { alpha: 1, beta: { x: true } },
      {
        maxObjectPropertyCount: 2,
        maxPropertyNameCodeUnits: 5,
        maxTotalPropertyCount: 3,
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('boundary snapshot must parse');
    expect(result.value).toEqual({ alpha: 1, beta: { x: true } });
  });

  it('rejects an object whose own property count exceeds its bound', () => {
    expect(
      tryCreateStrictValidationSnapshot(
        { alpha: 1, beta: 2, gamma: 3 },
        { maxObjectPropertyCount: 2 },
      ).ok,
    ).toBe(false);
  });

  it('rejects an overlong property name independently of value-string limits', () => {
    expect(
      tryCreateStrictValidationSnapshot(
        { abcdef: '' },
        { maxPropertyNameCodeUnits: 5, maxStringCodeUnits: 0 },
      ).ok,
    ).toBe(false);
  });

  it('counts array indices and length in the global property budget', () => {
    const value = { values: [1, 2] };
    expect(tryCreateStrictValidationSnapshot(value, { maxTotalPropertyCount: 4 }).ok).toBe(true);
    expect(tryCreateStrictValidationSnapshot(value, { maxTotalPropertyCount: 3 }).ok).toBe(false);
  });

  it('counts both property names and values in the global string budget', () => {
    const value = { abc: '123' };
    expect(tryCreateStrictValidationSnapshot(value, { maxTotalStringCodeUnits: 6 }).ok).toBe(true);
    expect(tryCreateStrictValidationSnapshot(value, { maxTotalStringCodeUnits: 5 }).ok).toBe(false);
  });

  it('still rejects accessors before invoking a getter', () => {
    let calls = 0;
    const value: Record<string, unknown> = {};
    Object.defineProperty(value, 'secret', {
      enumerable: true,
      get() {
        calls += 1;
        return 'not-read';
      },
    });
    expect(
      tryCreateStrictValidationSnapshot(value, {
        maxObjectPropertyCount: 1,
        maxPropertyNameCodeUnits: 6,
        maxTotalPropertyCount: 1,
      }).ok,
    ).toBe(false);
    expect(calls).toBe(0);
  });
});
