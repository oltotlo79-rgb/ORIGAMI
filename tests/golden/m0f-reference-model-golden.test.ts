import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, it } from 'vitest';

import { evaluateConventionsV1 } from '../../m0f/model/conventions.js';
import {
  canonicalReferenceModelHash,
  parseReferenceModelV1,
} from '../../m0f/model/reference-model.js';

it('matches the M0F-0 convention-only golden evidence and hash', async () => {
  const fixture: unknown = JSON.parse(
    await readFile(resolve('tests/vectors/m0f-0/convention-two-face-v1.json'), 'utf8'),
  );
  const golden = JSON.parse(
    await readFile(resolve('tests/vectors/m0f-0/convention-two-face-v1.golden.json'), 'utf8'),
  ) as { canonicalHash: string; evidence: unknown };
  const parsed = parseReferenceModelV1(fixture);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error('golden fixture must parse');
  const evaluated = evaluateConventionsV1(parsed.value);
  expect(evaluated.ok).toBe(true);
  if (!evaluated.ok) throw new Error('golden fixture conventions must evaluate');
  expect(evaluated.value).toEqual(golden.evidence);
  await expect(canonicalReferenceModelHash(parsed.value)).resolves.toBe(golden.canonicalHash);
});
