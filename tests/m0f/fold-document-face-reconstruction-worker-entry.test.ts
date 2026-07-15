import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
  FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
} from '../../m0f/workers/fold-document-face-reconstruction-protocol.js';

type WorkerMessageListener = (event: Readonly<{ data: unknown }>) => void;

function request(jobId: string): Record<string, unknown> {
  const foldDocumentBytes = new TextEncoder().encode(
    JSON.stringify({
      file_spec: 1.2,
      vertices_coords: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      edges_vertices: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
      edges_assignment: ['B', 'B', 'B', 'B'],
    }),
  ).buffer;
  return {
    schemaVersion: 1,
    messageType: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId,
    encoding: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
    foldDocumentBytes,
  };
}

function installWorkerScope(): Readonly<{
  listener: () => WorkerMessageListener;
  postMessage: ReturnType<typeof vi.fn>;
}> {
  const listeners: WorkerMessageListener[] = [];
  const addEventListener = vi.fn((type: string, listener: WorkerMessageListener) => {
    expect(type).toBe('message');
    listeners.push(listener);
  });
  const postMessage = vi.fn();
  vi.stubGlobal('addEventListener', addEventListener);
  vi.stubGlobal('postMessage', postMessage);
  return {
    listener: () => {
      const listener = listeners[0];
      if (listener === undefined) throw new Error('worker message listener was not installed');
      return listener;
    },
    postMessage,
  };
}

describe('transferred FOLD-document Worker entry', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('processes exactly the first valid job', async () => {
    const scope = installWorkerScope();
    await import('../../m0f/workers/fold-document-face-reconstruction.worker.js');

    scope.listener()({ data: request('fold-entry:first') });
    scope.listener()({ data: request('fold-entry:second') });

    expect(scope.postMessage).toHaveBeenCalledTimes(1);
    expect(scope.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'fold-entry:first', outcome: 'completed' }),
    );
  });

  it('silently consumes an invalid first envelope without reflecting its job ID', async () => {
    const scope = installWorkerScope();
    await import('../../m0f/workers/fold-document-face-reconstruction.worker.js');

    scope.listener()({ data: { jobId: 'untrusted-job-id', secret: 'must-not-be-reflected' } });
    scope.listener()({ data: request('fold-entry:later-valid') });

    expect(scope.postMessage).not.toHaveBeenCalled();
  });
});
