import { afterEach, describe, expect, it, vi } from 'vitest';

import { packingWorkerRequest } from './polygon-river-packing-problem-worker-fixtures.js';

describe('polygon/river packing-problem dedicated Worker entry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('consumes exactly one message and never executes or posts a second job', async () => {
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

    await import('../../src/workers/polygon-river-packing-problem.worker.js');
    if (listener === undefined) throw new Error('worker listener was not installed');
    listener({ data: packingWorkerRequest('packing-job:first') });
    listener({ data: packingWorkerRequest('packing-job:second') });

    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ jobId: 'packing-job:first', outcome: 'completed' });
  });

  it('consumes an invalid first message without trusting or echoing its job ID', async () => {
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

    await import('../../src/workers/polygon-river-packing-problem.worker.js');
    if (listener === undefined) throw new Error('worker listener was not installed');
    listener({ data: { jobId: 'untrusted' } });
    listener({ data: packingWorkerRequest('packing-job:late') });
    expect(posted).toEqual([]);
  });
});
