import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  RUNTIME_LIMIT_KEYS,
  RUNTIME_LIMITS_SCHEMA_ID,
  parseRuntimeLimitsV1,
} from '../../m0f/profiles/runtime-limits.js';

async function candidateDocument(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve('m0f/profiles/runtime-limits-v1.candidates.json'), 'utf8'),
  ) as Record<string, unknown>;
}

function expectIssue(raw: unknown, code: string): void {
  const result = parseRuntimeLimitsV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected runtime-limit issue ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
}

describe('M0F runtime-limit candidate profile', () => {
  it('enumerates every required limit while making no measured or frozen claim', async () => {
    const result = parseRuntimeLimitsV1(await candidateDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('candidate profile must parse');
    expect(result.value.schemaId).toBe(RUNTIME_LIMITS_SCHEMA_ID);
    expect(result.value.status).toBe('candidate');
    expect(result.value.profileHash).toBeNull();
    expect(Object.keys(result.value.limits).sort()).toEqual([...RUNTIME_LIMIT_KEYS].sort());
    for (const limit of Object.values(result.value.limits)) {
      expect(limit.selected).toBeNull();
      expect(limit.measurementStatus).toBe('pending');
      expect(limit.measurementRef).toBeNull();
      expect(limit.candidates.length).toBeGreaterThan(0);
    }
  });

  it('returns an owned deeply frozen runtime-limit catalog', async () => {
    const raw = await candidateDocument();
    const result = parseRuntimeLimitsV1(raw);
    if (!result.ok) throw new Error('candidate profile must parse');
    const rawLimits = raw.limits as Record<string, Record<string, unknown>>;
    const rawMaxVertices = rawLimits.maxVertices;
    if (rawMaxVertices === undefined) throw new Error('bad fixture');

    raw.status = 'frozen';
    rawMaxVertices.selected = 10;

    expect(result.value.status).toBe('candidate');
    expect(result.value.limits.maxVertices.selected).toBeNull();
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.limits.maxVertices)).toBe(true);
  });

  it('validates one getter-consistent runtime-limit snapshot', async () => {
    const raw = await candidateDocument();
    let reads = 0;
    Object.defineProperty(raw, 'status', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? 'candidate' : 'frozen';
      },
    });
    const result = parseRuntimeLimitsV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('snapshot must parse');
    expect(result.value.status).toBe('candidate');
    expect(reads).toBe(1);
  });

  it('rejects missing, unknown, unsorted, duplicate, and unit-mismatched limits', async () => {
    const missing = await candidateDocument();
    const missingLimits = missing.limits as Record<string, unknown>;
    delete missingLimits.maxVertices;
    expectIssue(missing, 'missing-limit');

    const unknown = await candidateDocument();
    const unknownLimits = unknown.limits as Record<string, unknown>;
    unknownLimits.maxMagic = {
      unit: 'count',
      candidates: [1],
      selected: null,
      measurementStatus: 'pending',
      measurementRef: null,
      rejectionReasonCode: 'runtime.magic-too-large',
    };
    expectIssue(unknown, 'unknown-limit');

    const unsorted = await candidateDocument();
    const unsortedLimits = unsorted.limits as Record<string, Record<string, unknown>>;
    if (unsortedLimits.maxVertices === undefined) throw new Error('bad fixture');
    unsortedLimits.maxVertices.candidates = [100, 10];
    expectIssue(unsorted, 'invalid-candidates');

    const duplicate = await candidateDocument();
    const duplicateLimits = duplicate.limits as Record<string, Record<string, unknown>>;
    if (duplicateLimits.maxVertices === undefined) throw new Error('bad fixture');
    duplicateLimits.maxVertices.candidates = [10, 10];
    expectIssue(duplicate, 'invalid-candidates');

    const unit = await candidateDocument();
    const unitLimits = unit.limits as Record<string, Record<string, unknown>>;
    if (unitLimits.maxVertices === undefined) throw new Error('bad fixture');
    unitLimits.maxVertices.unit = 'bytes';
    expectIssue(unit, 'unit-mismatch');
  });

  it('rejects a frozen profile until every value is measured, selected, and hashed', async () => {
    const raw = await candidateDocument();
    raw.status = 'frozen';
    expectIssue(raw, 'incomplete-frozen-profile');
  });

  it('keeps candidate selections within the enumerated set', async () => {
    const raw = await candidateDocument();
    const limits = raw.limits as Record<string, Record<string, unknown>>;
    if (limits.maxVertices === undefined) throw new Error('bad fixture');
    limits.maxVertices.selected = 12_345;
    expectIssue(raw, 'selection-not-candidate');
  });
});
