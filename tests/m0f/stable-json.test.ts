import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BenchmarkRecordError,
  serializeBenchmarkRecord,
  validateBenchmarkRecord,
} from '../../m0f/benchmark.js';
import { StableJsonError, serializeJsonLine, stableStringify } from '../../m0f/stable-json.js';

describe('stable JSON', () => {
  it('sorts object keys recursively and preserves array order', () => {
    expect(stableStringify({ z: 1, a: { y: true, b: [2, 1] } })).toBe(
      '{"a":{"b":[2,1],"y":true},"z":1}',
    );
    expect(serializeJsonLine({ b: 2, a: 1 })).toBe('{"a":1,"b":2}\n');
  });

  it('rejects values that ordinary JSON would silently alter', () => {
    expect(() => stableStringify({ lost: undefined })).toThrow(StableJsonError);
    expect(() => stableStringify(Number.NaN)).toThrow(StableJsonError);
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => stableStringify(cyclic)).toThrow(StableJsonError);
  });
});

describe('benchmark record', () => {
  it('matches the checked-in deterministic JSONL golden byte-for-byte', async () => {
    const record = JSON.parse(
      await readFile(resolve('tests/fixtures/_harness-smoke/benchmark-record.json'), 'utf8'),
    ) as unknown;
    const golden = await readFile(
      resolve('tests/fixtures/_harness-smoke/benchmark-record.jsonl'),
      'utf8',
    );
    expect(validateBenchmarkRecord(record).issues).toEqual([]);
    expect(serializeBenchmarkRecord(record)).toBe(golden);
    expect(golden.endsWith('\n')).toBe(true);
    expect(golden.endsWith('\n\n')).toBe(false);
  });

  it('returns an owned deeply frozen benchmark record', async () => {
    const source = JSON.parse(
      await readFile(resolve('tests/fixtures/_harness-smoke/benchmark-record.json'), 'utf8'),
    ) as Record<string, unknown>;
    const result = validateBenchmarkRecord(source);
    if (result.record === undefined) throw new Error('benchmark fixture must parse');

    source.scientificClaim = true;
    const sourceVersions = source.versions as Record<string, unknown>;
    sourceVersions.verifierVersion = 'forged-after-validation';

    expect(result.record.scientificClaim).toBe(false);
    expect(result.record.versions.verifierVersion).toBeNull();
    expect(Object.isFrozen(result.record)).toBe(true);
    expect(Object.isFrozen(result.record.versions)).toBe(true);
  });

  it('validates one getter-consistent benchmark snapshot', async () => {
    const source = JSON.parse(
      await readFile(resolve('tests/fixtures/_harness-smoke/benchmark-record.json'), 'utf8'),
    ) as Record<string, unknown>;
    let reads = 0;
    Object.defineProperty(source, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? false : true;
      },
    });
    const result = validateBenchmarkRecord(source);
    expect(result.record?.scientificClaim).toBe(false);
    expect(reads).toBe(1);
  });

  it('prevents the reserved smoke fixture from claiming verified evidence', async () => {
    const source = JSON.parse(
      await readFile(resolve('tests/fixtures/_harness-smoke/benchmark-record.json'), 'utf8'),
    ) as Record<string, unknown>;
    const forged = { ...source, outcome: 'verified', scientificClaim: true };
    const result = validateBenchmarkRecord(forged);
    expect(result.record).toBeUndefined();
    expect(result.issues.some((issue) => issue.code === 'smoke-claim-violation')).toBe(true);
    expect(() => serializeBenchmarkRecord(forged)).toThrow(BenchmarkRecordError);
  });
});
