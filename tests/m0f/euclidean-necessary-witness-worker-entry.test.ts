import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  witnessWorkerSearchRequest,
  witnessWorkerValidationRequest,
} from './euclidean-necessary-witness-worker-fixtures.js';

async function exerciseEntry(
  modulePath: string,
  first: unknown,
  second: unknown,
): Promise<unknown[]> {
  let listener: ((event: Readonly<{ data: unknown }>) => void) | undefined;
  const posted: unknown[] = [];
  vi.stubGlobal(
    'addEventListener',
    (_type: string, value: (event: Readonly<{ data: unknown }>) => void) => {
      listener = value;
    },
  );
  vi.stubGlobal('postMessage', (message: unknown) => posted.push(message));
  if (modulePath === 'search')
    await import('../../src/workers/euclidean-necessary-witness-search.worker.js');
  else await import('../../src/workers/euclidean-necessary-witness-validation.worker.js');
  if (listener === undefined) throw new Error('entry listener was not installed');
  listener({ data: first });
  listener({ data: second });
  return posted;
}

describe('two-stage Euclidean necessary-witness dedicated Worker entries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('search entry consumes only its first message', async () => {
    const posted = await exerciseEntry(
      'search',
      witnessWorkerSearchRequest('job:first'),
      witnessWorkerSearchRequest('job:second'),
    );
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ jobId: 'job:first', outcome: 'candidate-produced' });
  });

  it('validation entry consumes only its first message', async () => {
    const posted = await exerciseEntry(
      'validation',
      witnessWorkerValidationRequest('job:first', 'validation:first'),
      witnessWorkerValidationRequest('job:second', 'validation:second'),
    );
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({
      jobId: 'job:first',
      validationId: 'validation:first',
      outcome: 'validated',
    });
  });

  it('invalid first messages suppress every later job', async () => {
    expect(
      await exerciseEntry('search', { jobId: 'untrusted' }, witnessWorkerSearchRequest()),
    ).toEqual([]);
    vi.unstubAllGlobals();
    vi.resetModules();
    expect(
      await exerciseEntry(
        'validation',
        { validationId: 'untrusted' },
        witnessWorkerValidationRequest(),
      ),
    ).toEqual([]);
  });
});
