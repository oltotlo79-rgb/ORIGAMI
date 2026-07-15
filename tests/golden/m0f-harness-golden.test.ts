import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { serializeBenchmarkRecord } from '../../m0f/benchmark.js';

describe('M0F harness golden output', () => {
  it('serializes the smoke benchmark byte-for-byte', async () => {
    const fixtureDirectory = resolve('tests/fixtures/_harness-smoke');
    const record: unknown = JSON.parse(
      await readFile(resolve(fixtureDirectory, 'benchmark-record.json'), 'utf8'),
    );
    const goldenJsonl = await readFile(resolve(fixtureDirectory, 'benchmark-record.jsonl'), 'utf8');

    expect(serializeBenchmarkRecord(record)).toBe(goldenJsonl);
  });
});
