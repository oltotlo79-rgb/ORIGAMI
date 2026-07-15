import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
} from '../../m0f/workers/face-reconstruction-protocol.js';
import {
  FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT,
  FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT,
  FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_FAILURE_RESULT,
  runFaceReconstructionWorkerV1,
  type FaceReconstructionWorkerEventListenerV1,
  type FaceReconstructionWorkerEventTypeV1,
  type FaceReconstructionWorkerLikeV1,
} from '../../m0f/workers/run-face-reconstruction-worker.js';

interface MutableFaceInput {
  specVersion: string;
  verticesCoords: number[][];
  edgesVertices: number[][];
  edgesAssignment: string[];
  facesVertices: null;
}

function validInput(): MutableFaceInput {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0.5, 0],
      [0.5, 1],
    ],
    edgesVertices: [
      [0, 4],
      [4, 1],
      [1, 2],
      [2, 5],
      [5, 3],
      [3, 0],
      [4, 5],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function completedResponse(jobId: string): Record<string, unknown> {
  const reconstructed = reconstructFoldFacesCandidateV1(validInput());
  if (!reconstructed.ok) {
    throw new Error(reconstructed.error.map((issue) => issue.code).join(', '));
  }
  return {
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    outcome: 'completed',
    reason: null,
    result: reconstructed.value,
  };
}

function failedResponse(jobId: string, reason = 'reconstruction-failed'): Record<string, unknown> {
  return {
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    outcome: 'failed',
    reason,
    result: null,
  };
}

class FakeWorker implements FaceReconstructionWorkerLikeV1 {
  readonly posted: unknown[] = [];
  terminateCalls = 0;
  postMessageFailure: Error | undefined;
  afterPost: ((message: unknown) => void) | undefined;

  private readonly listeners = new Map<
    FaceReconstructionWorkerEventTypeV1,
    Set<FaceReconstructionWorkerEventListenerV1>
  >();

  postMessage(message: unknown): void {
    if (this.postMessageFailure !== undefined) throw this.postMessageFailure;
    this.posted.push(message);
    this.afterPost?.(message);
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

  emitMessage(data: unknown): void {
    this.emit('message', { data });
  }

  emitError(secretHostValue: unknown): void {
    this.emit('error', { data: secretHostValue });
  }

  emitMessageError(secretHostValue: unknown): void {
    this.emit('messageerror', { data: secretHostValue });
  }

  listenerCount(type?: FaceReconstructionWorkerEventTypeV1): number {
    if (type !== undefined) return this.listeners.get(type)?.size ?? 0;
    return [...this.listeners.values()].reduce((count, entries) => count + entries.size, 0);
  }

  private emit(
    type: FaceReconstructionWorkerEventTypeV1,
    event: Readonly<{ data?: unknown }>,
  ): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }
}

function expectAbortListenerRemoved(
  addCalls: readonly (readonly unknown[])[],
  removeCalls: readonly (readonly unknown[])[],
): void {
  const addCall = addCalls.find(([type]) => type === 'abort');
  const removeCall = removeCalls.find(([type]) => type === 'abort');
  expect(addCall).toBeDefined();
  expect(removeCall).toBeDefined();
  expect(removeCall?.[1]).toBe(addCall?.[1]);
}

describe('face-reconstruction Worker client', () => {
  it('keeps the injected surface structurally compatible with a browser Worker', () => {
    expectTypeOf<Worker>().toExtend<FaceReconstructionWorkerLikeV1>();
  });

  it('posts one owned request and returns an owned, deeply frozen matching completion', async () => {
    const input = validInput();
    const worker = new FakeWorker();
    const factory = vi.fn(() => worker);
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');

    const pending = runFaceReconstructionWorkerV1({
      jobId: 'job-completed',
      input,
      workerFactory: factory,
      signal: controller.signal,
    });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(worker.posted).toHaveLength(1);
    const posted = worker.posted[0] as {
      messageType: string;
      jobId: string;
      input: { verticesCoords: number[][] };
    };
    expect(posted).toMatchObject({
      messageType: 'm0f-face-reconstruction-request',
      jobId: 'job-completed',
      contractStatus: 'candidate',
      scientificClaim: false,
    });
    input.verticesCoords[0]?.splice(0, 2, 99, 99);
    expect(posted.input.verticesCoords[0]).toEqual([0, 0]);
    expect(Object.isFrozen(posted)).toBe(true);
    expect(Object.isFrozen(posted.input.verticesCoords)).toBe(true);

    const rawResponse = JSON.parse(JSON.stringify(completedResponse('job-completed'))) as {
      jobId: string;
      result: { topology: { planarVertexCount: number } };
    };
    worker.emitMessage(rawResponse);
    rawResponse.jobId = 'mutated-after-dispatch';
    rawResponse.result.topology.planarVertexCount = 999;

    const result = await pending;
    expect(result.outcome).toBe('completed');
    if (result.outcome !== 'completed') throw new Error('expected completed response');
    expect(result.jobId).toBe('job-completed');
    expect(result.result.topology.planarVertexCount).toBe(6);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.result)).toBe(true);
    expect(Object.isFrozen(result.result.topology)).toBe(true);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('returns the fixed cancellation without creating a worker when already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const factory = vi.fn(() => new FakeWorker());

    const result = await runFaceReconstructionWorkerV1({
      jobId: '',
      input: new Map(),
      workerFactory: factory,
      signal: controller.signal,
    });

    expect(result).toBe(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
    expect(result).toEqual({
      contractStatus: 'candidate',
      scientificClaim: false,
      outcome: 'cancelled',
      reason: 'aborted-by-caller',
      result: null,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(factory).not.toHaveBeenCalled();
  });

  it('terminates exactly once on in-flight abort, ignores late events, and permits a later run', async () => {
    const firstWorker = new FakeWorker();
    const secondWorker = new FakeWorker();
    const workers = [firstWorker, secondWorker];
    const factory = vi.fn(() => {
      const worker = workers.shift();
      if (worker === undefined) throw new Error('no fake worker');
      return worker;
    });
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');

    const cancelled = runFaceReconstructionWorkerV1({
      jobId: 'job-cancelled',
      input: validInput(),
      workerFactory: factory,
      signal: controller.signal,
    });
    controller.abort('SECRET_ABORT_REASON');

    expect(await cancelled).toBe(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
    expect(firstWorker.terminateCalls).toBe(1);
    expect(firstWorker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
    firstWorker.emitMessage(completedResponse('job-cancelled'));
    firstWorker.emitError('SECRET_LATE_HOST_ERROR');
    controller.abort();
    expect(firstWorker.terminateCalls).toBe(1);

    const completed = runFaceReconstructionWorkerV1({
      jobId: 'job-after-cancel',
      input: validInput(),
      workerFactory: factory,
    });
    secondWorker.emitMessage(completedResponse('job-after-cancel'));
    expect((await completed).outcome).toBe('completed');
    expect(secondWorker.terminateCalls).toBe(1);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('ignores a valid stale response without a timeout, then accepts the matching failure', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
    let settled = false;
    const pending = runFaceReconstructionWorkerV1({
      jobId: 'job-current',
      input: validInput(),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    void pending.then(() => {
      settled = true;
    });

    worker.emitMessage(failedResponse('job-stale'));
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(worker.terminateCalls).toBe(0);
    expect(worker.listenerCount()).toBe(3);

    worker.emitMessage(failedResponse('job-current'));
    const result = await pending;
    expect(result).toMatchObject({
      jobId: 'job-current',
      outcome: 'failed',
      reason: 'reconstruction-failed',
      result: null,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('does not continue setup or post after a reentrant terminal event', async () => {
    let postCalls = 0;
    let terminateCalls = 0;
    const worker: FaceReconstructionWorkerLikeV1 = {
      postMessage: () => {
        postCalls += 1;
      },
      terminate: () => {
        terminateCalls += 1;
      },
      addEventListener: (type, listener) => {
        if (type === 'message') listener({ data: failedResponse('job-reentrant') });
      },
      removeEventListener: () => undefined,
    };

    const result = await runFaceReconstructionWorkerV1({
      jobId: 'job-reentrant',
      input: validInput(),
      workerFactory: () => worker,
    });

    expect(result).toMatchObject({
      jobId: 'job-reentrant',
      outcome: 'failed',
      reason: 'reconstruction-failed',
    });
    expect(postCalls).toBe(0);
    expect(terminateCalls).toBe(1);
  });

  it('maps invalid messages and messageerror to one fixed protocol failure without host text', async () => {
    for (const trigger of [
      (worker: FakeWorker): void => worker.emitMessage({ hostText: 'SECRET_INVALID_RESPONSE' }),
      (worker: FakeWorker): void => worker.emitMessageError('SECRET_MESSAGEERROR'),
    ]) {
      const worker = new FakeWorker();
      const pending = runFaceReconstructionWorkerV1({
        jobId: 'job-protocol-failure',
        input: validInput(),
        workerFactory: () => worker,
      });
      trigger(worker);
      const result = await pending;
      expect(result).toBe(FACE_RECONSTRUCTION_WORKER_PROTOCOL_FAILURE_RESULT);
      expect(JSON.stringify(result)).not.toContain('SECRET');
      expect(Object.isFrozen(result)).toBe(true);
      expect(worker.terminateCalls).toBe(1);
      expect(worker.listenerCount()).toBe(0);
    }
  });

  it('maps factory, postMessage, and worker errors to one fixed execution failure', async () => {
    const factoryFailure = await runFaceReconstructionWorkerV1({
      jobId: 'job-factory-error',
      input: validInput(),
      workerFactory: () => {
        throw new Error('SECRET_FACTORY_ERROR');
      },
    });
    expect(factoryFailure).toBe(FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT);

    const postWorker = new FakeWorker();
    postWorker.postMessageFailure = new Error('SECRET_POST_MESSAGE_ERROR');
    const postFailure = await runFaceReconstructionWorkerV1({
      jobId: 'job-post-error',
      input: validInput(),
      workerFactory: () => postWorker,
    });
    expect(postFailure).toBe(FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT);
    expect(postWorker.terminateCalls).toBe(1);
    expect(postWorker.listenerCount()).toBe(0);

    const eventWorker = new FakeWorker();
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
    const eventFailure = runFaceReconstructionWorkerV1({
      jobId: 'job-worker-error',
      input: validInput(),
      workerFactory: () => eventWorker,
      signal: controller.signal,
    });
    eventWorker.emitError({ message: 'SECRET_WORKER_ERROR', filename: 'SECRET_HOST_PATH' });
    const result = await eventFailure;
    expect(result).toBe(FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT);
    expect(JSON.stringify(result)).not.toContain('SECRET');
    expect(Object.isFrozen(result)).toBe(true);
    expect(eventWorker.terminateCalls).toBe(1);
    expect(eventWorker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('rejects an invalid local request before constructing a worker', async () => {
    const factory = vi.fn(() => new FakeWorker());
    const result = await runFaceReconstructionWorkerV1({
      jobId: '',
      input: validInput(),
      workerFactory: factory,
    });
    expect(result).toBe(FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT);
    expect(result).toMatchObject({ outcome: 'protocol-failure', reason: 'invalid-request' });
    expect(factory).not.toHaveBeenCalled();

    const revoked = Proxy.revocable(validInput(), {});
    revoked.revoke();
    expect(
      await runFaceReconstructionWorkerV1({
        jobId: 'job-revoked-input',
        input: revoked.proxy,
        workerFactory: factory,
      }),
    ).toBe(FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT);
    expect(factory).not.toHaveBeenCalled();
  });
});
