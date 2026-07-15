import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CandidateFoldFaceReconstructionV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';
import { executeFaceReconstructionWorkerMessageV1 } from '../../m0f/workers/face-reconstruction-worker-handler.js';
import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateFoldFaceReconstructionWorkerResponseV1,
} from '../../m0f/workers/face-reconstruction-protocol.js';

const originalAddEventListener = Object.getOwnPropertyDescriptor(globalThis, 'addEventListener');
const originalPostMessage = Object.getOwnPropertyDescriptor(globalThis, 'postMessage');

function restoreGlobalProperty(
  key: 'addEventListener' | 'postMessage',
  descriptor?: PropertyDescriptor,
) {
  if (descriptor === undefined) Reflect.deleteProperty(globalThis, key);
  else Object.defineProperty(globalThis, key, descriptor);
}

afterEach(() => {
  restoreGlobalProperty('addEventListener', originalAddEventListener);
  restoreGlobalProperty('postMessage', originalPostMessage);
  vi.resetModules();
});

function request(input: unknown, jobId = 'face-job:1'): Record<string, unknown> {
  return {
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    input,
  };
}

function twoFaceInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 1],
      [0.5, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function disconnectedInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [0, 1],
      [3, 0],
      [4, 0],
      [3, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 4],
      [4, 5],
      [5, 3],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

describe('candidate face-reconstruction worker handler', () => {
  it('returns a fully parsed and frozen completed response', () => {
    const response = executeFaceReconstructionWorkerMessageV1(request(twoFaceInput()));
    expect(response).toMatchObject({
      jobId: 'face-job:1',
      outcome: 'completed',
      reason: null,
      result: { topology: { boundedFaceCount: 2, triangleCount: 4 } },
    });
    expect(parseCandidateFoldFaceReconstructionWorkerResponseV1(response).ok).toBe(true);
    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(response?.result)).toBe(true);
  });

  it('normalizes a domain rejection to a fixed failure without issue text', () => {
    const response = executeFaceReconstructionWorkerMessageV1(request(disconnectedInput()));
    expect(response).toEqual({
      schemaVersion: 1,
      messageType: 'm0f-face-reconstruction-response',
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: 'face-job:1',
      outcome: 'failed',
      reason: 'reconstruction-failed',
      result: null,
    });
  });

  it('ignores invalid requests without reflecting an untrusted job ID', () => {
    expect(executeFaceReconstructionWorkerMessageV1({ jobId: 'forged' })).toBeUndefined();
    const getter = request(twoFaceInput());
    Object.defineProperty(getter, 'input', {
      enumerable: true,
      get(): never {
        throw new Error('must not escape');
      },
    });
    expect(executeFaceReconstructionWorkerMessageV1(getter)).toBeUndefined();
  });

  it('does not call the executor for an invalid request', () => {
    const executor = vi.fn();
    expect(executeFaceReconstructionWorkerMessageV1({ jobId: 'forged' }, executor)).toBeUndefined();
    expect(executor).not.toHaveBeenCalled();
  });

  it('converts executor exceptions to internal-error without host text', () => {
    const response = executeFaceReconstructionWorkerMessageV1(
      request(twoFaceInput(), 'face-job:secret'),
      () => {
        throw new Error('host-specific secret');
      },
    );
    expect(response).toMatchObject({
      jobId: 'face-job:secret',
      outcome: 'failed',
      reason: 'internal-error',
      result: null,
    });
    expect(JSON.stringify(response)).not.toContain('host-specific');
  });

  it('normalizes a forged successful executor result to internal-error', () => {
    const forged = reconstructedResult();
    forged.scientificClaim = true;
    const response = executeFaceReconstructionWorkerMessageV1(
      request(twoFaceInput()),
      () =>
        ({
          ok: true,
          value: forged as unknown as CandidateFoldFaceReconstructionV1,
        }) as const,
    );
    expect(response).toEqual({
      schemaVersion: 1,
      messageType: 'm0f-face-reconstruction-response',
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: 'face-job:1',
      outcome: 'failed',
      reason: 'internal-error',
      result: null,
    });
  });

  it('passes an owned frozen input to the executor and cuts executor-result aliases', () => {
    const mutableResult = reconstructedResult();
    const response = executeFaceReconstructionWorkerMessageV1(request(twoFaceInput()), (input) => {
      expect(Object.isFrozen(input)).toBe(true);
      expect(Object.isFrozen(input.verticesCoords[0])).toBe(true);
      return {
        ok: true,
        value: mutableResult as unknown as CandidateFoldFaceReconstructionV1,
      };
    });
    expect(response?.outcome).toBe('completed');
    const topology = mutableResult.topology as Record<string, unknown>;
    topology.planarVertexCount = 999;
    expect(response?.result?.topology.planarVertexCount).toBe(6);
  });
});

function reconstructedResult(): Record<string, unknown> {
  const response = executeFaceReconstructionWorkerMessageV1(request(twoFaceInput()));
  if (response?.outcome !== 'completed') throw new Error('fixture reconstruction failed');
  return structuredClone(response.result) as unknown as Record<string, unknown>;
}

describe('face-reconstruction dedicated worker entry', () => {
  it('consumes exactly one message and never executes a second job', async () => {
    let listener: ((event: Readonly<{ data: unknown }>) => void) | undefined;
    const posted: unknown[] = [];
    Object.defineProperty(globalThis, 'addEventListener', {
      configurable: true,
      value: (
        type: string,
        registeredListener: (event: Readonly<{ data: unknown }>) => void,
      ): void => {
        expect(type).toBe('message');
        listener = registeredListener;
      },
    });
    Object.defineProperty(globalThis, 'postMessage', {
      configurable: true,
      value: (message: unknown): void => {
        posted.push(message);
      },
    });

    await import('../../m0f/workers/face-reconstruction.worker.js');
    if (listener === undefined) throw new Error('worker listener was not registered');
    listener({ data: request(twoFaceInput(), 'face-job:first') });
    listener({ data: request(twoFaceInput(), 'face-job:second') });

    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ jobId: 'face-job:first', outcome: 'completed' });
  });
});
