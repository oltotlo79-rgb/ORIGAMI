import { describe, expect, it, vi } from 'vitest';

import { executeFoldDocumentFaceReconstructionWorkerMessageV1 } from '../../m0f/workers/fold-document-face-reconstruction-worker-handler.js';
import { FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE } from '../../m0f/workers/face-reconstruction-protocol.js';
import {
  FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT,
  FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT,
  type FaceReconstructionWorkerEventListenerV1,
  type FaceReconstructionWorkerEventTypeV1,
  type FaceReconstructionWorkerLikeV1,
} from '../../m0f/workers/run-face-reconstruction-worker.js';
import { runFoldDocumentFaceReconstructionWorkerV1 } from '../../m0f/workers/run-fold-document-face-reconstruction-worker.js';

function documentBytes(): ArrayBuffer {
  return new TextEncoder().encode(
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
}

function failedResponse(jobId: string): Record<string, unknown> {
  return {
    schemaVersion: 1,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId,
    outcome: 'failed',
    reason: 'invalid-request',
    result: null,
  };
}

class TransferWorker implements FaceReconstructionWorkerLikeV1 {
  posted: unknown;
  terminateCalls = 0;
  private readonly listeners = new Map<
    FaceReconstructionWorkerEventTypeV1,
    Set<FaceReconstructionWorkerEventListenerV1>
  >();

  postMessage(message: unknown, transfer?: Transferable[]): void {
    this.posted = structuredClone(message, { transfer: transfer ?? [] });
  }
  terminate(): void {
    this.terminateCalls += 1;
  }
  addEventListener(
    type: FaceReconstructionWorkerEventTypeV1,
    listener: FaceReconstructionWorkerEventListenerV1,
  ): void {
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
  }
  removeEventListener(
    type: FaceReconstructionWorkerEventTypeV1,
    listener: FaceReconstructionWorkerEventListenerV1,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type: FaceReconstructionWorkerEventTypeV1, data?: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener({ data });
  }
  listenerCount(): number {
    return [...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0);
  }
}

describe('transferred FOLD-document Worker client', () => {
  it('transfers ownership and accepts the matching fully parsed result', async () => {
    const payload = documentBytes();
    const originalLength = payload.byteLength;
    const worker = new TransferWorker();
    const pending = runFoldDocumentFaceReconstructionWorkerV1({
      jobId: 'fold-job:completed',
      foldDocumentBytes: payload,
      workerFactory: () => worker,
    });

    expect(originalLength).toBeGreaterThan(0);
    expect(payload.byteLength).toBe(0);
    const posted = worker.posted as { foldDocumentBytes: ArrayBuffer; encoding: string };
    expect(posted.encoding).toBe('utf-8-json');
    expect(posted.foldDocumentBytes.byteLength).toBe(originalLength);

    const response = executeFoldDocumentFaceReconstructionWorkerMessageV1(worker.posted);
    worker.emit('message', response);
    expect((await pending).outcome).toBe('completed');
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('does not consume bytes or create a Worker for pre-abort and invalid local scalars', async () => {
    const abortedBytes = documentBytes();
    const controller = new AbortController();
    controller.abort();
    const factory = vi.fn(() => new TransferWorker());
    expect(
      await runFoldDocumentFaceReconstructionWorkerV1({
        jobId: '',
        foldDocumentBytes: abortedBytes,
        workerFactory: factory,
        signal: controller.signal,
      }),
    ).toBe(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
    expect(abortedBytes.byteLength).toBeGreaterThan(0);

    const empty = new ArrayBuffer(0);
    expect(
      await runFoldDocumentFaceReconstructionWorkerV1({
        jobId: 'fold-job:empty',
        foldDocumentBytes: empty,
        workerFactory: factory,
      }),
    ).toBe(FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT);
    expect(factory).not.toHaveBeenCalled();
  });

  it('rejects reuse of a transferred detached buffer before creating another Worker', async () => {
    const payload = documentBytes();
    const firstWorker = new TransferWorker();
    const first = runFoldDocumentFaceReconstructionWorkerV1({
      jobId: 'fold-job:first',
      foldDocumentBytes: payload,
      workerFactory: () => firstWorker,
    });
    firstWorker.emit(
      'message',
      executeFoldDocumentFaceReconstructionWorkerMessageV1(firstWorker.posted),
    );
    await first;

    const factory = vi.fn(() => new TransferWorker());
    expect(
      await runFoldDocumentFaceReconstructionWorkerV1({
        jobId: 'fold-job:retry',
        foldDocumentBytes: payload,
        workerFactory: factory,
      }),
    ).toBe(FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT);
    expect(factory).not.toHaveBeenCalled();
  });

  it('ignores a stale response without a timeout and aborts by terminating exactly once', async () => {
    const worker = new TransferWorker();
    const controller = new AbortController();
    let settled = false;
    const pending = runFoldDocumentFaceReconstructionWorkerV1({
      jobId: 'fold-job:current',
      foldDocumentBytes: documentBytes(),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    void pending.then(() => {
      settled = true;
    });
    worker.emit('message', failedResponse('fold-job:stale'));
    await Promise.resolve();
    expect(settled).toBe(false);
    controller.abort('SECRET');
    expect(await pending).toBe(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
    expect(worker.terminateCalls).toBe(1);
    worker.emit('message', failedResponse('fold-job:current'));
    expect(worker.terminateCalls).toBe(1);
  });
});
