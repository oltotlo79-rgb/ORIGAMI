import { afterEach, describe, expect, it, vi } from 'vitest';

import { censusWorkerRequest } from './affine-origin-rotation-swept-aabb-census-worker-fixtures.js';

describe('affine-origin rotation swept-AABB census dedicated Worker entry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('installs one listener, consumes one job, and posts one closed terminal message', async () => {
    let listener: ((event: Readonly<{ data: unknown }>) => void) | undefined;
    const posted: unknown[] = [];
    vi.stubGlobal(
      'addEventListener',
      (type: string, registered: (event: Readonly<{ data: unknown }>) => void): void => {
        expect(type).toBe('message');
        listener = registered;
      },
    );
    vi.stubGlobal('postMessage', (message: unknown): void => {
      posted.push(message);
    });

    await import('../../src/workers/affine-origin-rotation-swept-aabb-census.worker.js');
    if (listener === undefined) throw new Error('Worker listener was not installed');
    listener({ data: censusWorkerRequest('job:first', 'source:first') });
    listener({ data: censusWorkerRequest('job:second', 'source:second') });

    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({
      recordType: 'm0f-affine-origin-rotation-swept-aabb-census-worker-response',
      jobId: 'job:first',
      sourceId: 'source:first',
      outcome: 'completed',
      broadPhaseOnly: true,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });

  it('consumes an invalid first message without trusting or echoing its IDs', async () => {
    let listener: ((event: Readonly<{ data: unknown }>) => void) | undefined;
    const posted: unknown[] = [];
    vi.stubGlobal(
      'addEventListener',
      (_type: string, registered: (event: Readonly<{ data: unknown }>) => void): void => {
        listener = registered;
      },
    );
    vi.stubGlobal('postMessage', (message: unknown): void => {
      posted.push(message);
    });

    await import('../../src/workers/affine-origin-rotation-swept-aabb-census.worker.js');
    if (listener === undefined) throw new Error('Worker listener was not installed');
    listener({ data: { sourceId: 'untrusted', jobId: 'untrusted' } });
    listener({ data: censusWorkerRequest('job:late', 'source:late') });
    expect(posted).toEqual([]);
  });
});
