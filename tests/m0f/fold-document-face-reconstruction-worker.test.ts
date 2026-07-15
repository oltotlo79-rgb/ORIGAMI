import { describe, expect, it, vi } from 'vitest';

import { executeFoldDocumentFaceReconstructionWorkerMessageV1 } from '../../m0f/workers/fold-document-face-reconstruction-worker-handler.js';
import {
  FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
  FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
  parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1,
} from '../../m0f/workers/fold-document-face-reconstruction-protocol.js';

function foldDocument(disconnected = false): Record<string, unknown> {
  return disconnected
    ? {
        file_spec: 1.2,
        vertices_coords: [
          [0, 0],
          [1, 0],
          [0, 1],
          [3, 0],
          [4, 0],
          [3, 1],
        ],
        edges_vertices: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 4],
          [4, 5],
          [5, 3],
        ],
        edges_assignment: ['B', 'B', 'B', 'B', 'B', 'B'],
      }
    : {
        file_spec: 1.2,
        frame_classes: ['creasePattern'],
        frame_attributes: ['2D'],
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
      };
}

function bytes(value: unknown): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(value)).buffer;
}

function request(payload: ArrayBuffer = bytes(foldDocument())): Record<string, unknown> {
  return {
    schemaVersion: 1,
    messageType: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId: 'fold-job:1',
    encoding: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
    foldDocumentBytes: payload,
  };
}

describe('transferred FOLD-document Worker protocol', () => {
  it('closes the candidate envelope without reading or copying its bytes', () => {
    const payload = bytes(foldDocument());
    const parsed = parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(request(payload));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.foldDocumentBytes).toBe(payload);
    expect(Object.isFrozen(parsed.value)).toBe(true);
  });

  it('rejects claim spoofing, unknown fields, accessors, empty and detached payloads', () => {
    expect(
      parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1({
        ...request(),
        scientificClaim: true,
      }).ok,
    ).toBe(false);
    expect(
      parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1({
        ...request(),
        verified: true,
      }).ok,
    ).toBe(false);
    expect(
      parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(request(new ArrayBuffer(0))).ok,
    ).toBe(false);

    const detached = bytes(foldDocument());
    structuredClone(detached, { transfer: [detached] });
    expect(parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(request(detached)).ok).toBe(
      false,
    );

    let reads = 0;
    const accessor = request();
    Object.defineProperty(accessor, 'jobId', {
      enumerable: true,
      get: () => {
        reads += 1;
        return 'fold-job:1';
      },
    });
    expect(parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(accessor).ok).toBe(false);
    expect(reads).toBe(0);

    const revoked = Proxy.revocable(request(), {});
    revoked.revoke();
    expect(parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(revoked.proxy).ok).toBe(
      false,
    );
  });
});

describe('transferred FOLD-document Worker handler', () => {
  it('decodes, adapts, and reconstructs a standard snake-case document', () => {
    const result = executeFoldDocumentFaceReconstructionWorkerMessageV1(request());
    expect(result).toMatchObject({
      jobId: 'fold-job:1',
      outcome: 'completed',
      reason: null,
      result: { foldProjection: { file_spec: 1.2 }, topology: { boundedFaceCount: 1 } },
    });
  });

  it.each([
    new Uint8Array([0xc3, 0x28]).buffer,
    new TextEncoder().encode('{not-json').buffer,
    bytes({ ...foldDocument(), file_spec: '1.2' }),
  ])('maps invalid UTF-8, JSON, or FOLD input to fixed invalid-request', (payload) => {
    const executor = vi.fn();
    expect(
      executeFoldDocumentFaceReconstructionWorkerMessageV1(request(payload), executor),
    ).toMatchObject({
      outcome: 'failed',
      reason: 'invalid-request',
      result: null,
    });
    expect(executor).not.toHaveBeenCalled();
  });

  it('separates domain rejection and unexpected executor failure', () => {
    expect(
      executeFoldDocumentFaceReconstructionWorkerMessageV1(request(bytes(foldDocument(true)))),
    ).toMatchObject({
      outcome: 'failed',
      reason: 'reconstruction-failed',
      result: null,
    });
    const thrown = executeFoldDocumentFaceReconstructionWorkerMessageV1(request(), () => {
      throw new Error('SECRET');
    });
    expect(thrown).toMatchObject({ outcome: 'failed', reason: 'internal-error', result: null });
    expect(JSON.stringify(thrown)).not.toContain('SECRET');
  });

  it('ignores an invalid outer envelope without invoking the executor', () => {
    const executor = vi.fn();
    expect(
      executeFoldDocumentFaceReconstructionWorkerMessageV1({ jobId: 'forged' }, executor),
    ).toBeUndefined();
    expect(executor).not.toHaveBeenCalled();

    const untrusted = { ...request(), reflected: 'must-not-be-reflected' };
    expect(
      executeFoldDocumentFaceReconstructionWorkerMessageV1(untrusted, executor),
    ).toBeUndefined();

    const revoked = Proxy.revocable(request(), {});
    revoked.revoke();
    expect(
      executeFoldDocumentFaceReconstructionWorkerMessageV1(revoked.proxy, executor),
    ).toBeUndefined();
    expect(executor).not.toHaveBeenCalled();
  });
});
