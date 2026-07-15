import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import {
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  enumerateSquareGridCandidatesV1,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import { createBrowserSquareGridQuantizationWorkerV1 } from '../../m0f/workers/browser-square-grid-quantization-worker.js';
import {
  SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
  SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
  SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
  SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
} from '../../m0f/workers/square-grid-quantization-protocol.js';
import {
  SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT,
  SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT,
  SQUARE_GRID_QUANTIZATION_WORKER_INVALID_REQUEST_RESULT,
  SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT,
  runSquareGridQuantizationWorkerV1,
  type SquareGridQuantizationWorkerEventListenerV1,
  type SquareGridQuantizationWorkerEventTypeV1,
  type SquareGridQuantizationWorkerLikeV1,
} from '../../m0f/workers/run-square-grid-quantization-worker.js';

function input(empty = false): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    paper: { width: empty ? 1 : 1.5, height: 1 },
    maxColumns: empty ? 1 : 8,
    maxRows: empty ? 1 : 8,
    relativeErrorLimit: empty ? 0 : 0.01,
    branches: [
      {
        id: 'branch-a',
        branchClass: empty ? 'terminal' : 'internal',
        length: empty ? 0.3 : 0.75,
        width: empty ? 0 : 0.25,
      },
    ],
  };
}

function completedResponse(jobId: string, empty = false): Record<string, unknown> {
  const sourceInput = input(empty);
  const enumerated = enumerateSquareGridCandidatesV1(sourceInput);
  if (!enumerated.ok) throw new Error('fixture should enumerate');
  return {
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput,
    outcome: 'completed',
    reason: null,
    result: enumerated.value,
  };
}

function failedResponse(jobId: string, sourceInput: unknown = input()): Record<string, unknown> {
  return {
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput,
    outcome: 'failed',
    reason: 'quantization-failed',
    result: null,
  };
}

class FakeWorker implements SquareGridQuantizationWorkerLikeV1 {
  readonly posted: unknown[] = [];
  terminateCalls = 0;
  postFailure: Error | undefined;
  afterPost: ((message: unknown) => void) | undefined;
  private readonly listeners = new Map<
    SquareGridQuantizationWorkerEventTypeV1,
    Set<SquareGridQuantizationWorkerEventListenerV1>
  >();

  postMessage(message: unknown): void {
    if (this.postFailure !== undefined) throw this.postFailure;
    this.posted.push(message);
    this.afterPost?.(message);
  }

  terminate(): void {
    this.terminateCalls += 1;
  }

  addEventListener(
    type: SquareGridQuantizationWorkerEventTypeV1,
    listener: SquareGridQuantizationWorkerEventListenerV1,
  ): void {
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
  }

  removeEventListener(
    type: SquareGridQuantizationWorkerEventTypeV1,
    listener: SquareGridQuantizationWorkerEventListenerV1,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  emitMessage(data: unknown): void {
    this.emit('message', { data });
  }

  emitError(data: unknown): void {
    this.emit('error', { data });
  }

  emitMessageError(data: unknown): void {
    this.emit('messageerror', { data });
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((count, entries) => count + entries.size, 0);
  }

  private emit(
    type: SquareGridQuantizationWorkerEventTypeV1,
    event: Readonly<{ data?: unknown }>,
  ): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }
}

function expectAbortListenerRemoved(
  addCalls: readonly (readonly unknown[])[],
  removeCalls: readonly (readonly unknown[])[],
): void {
  const added = addCalls.find(([type]) => type === 'abort');
  const removed = removeCalls.find(([type]) => type === 'abort');
  expect(added).toBeDefined();
  expect(removed?.[1]).toBe(added?.[1]);
}

describe('square-grid quantization Worker client', () => {
  it('is structurally compatible with Worker and posts no transfer list', async () => {
    expectTypeOf<Worker>().toExtend<SquareGridQuantizationWorkerLikeV1>();
    const requestInput = input();
    const worker = new FakeWorker();
    const post = vi.spyOn(worker, 'postMessage');
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');

    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:completed',
      input: requestInput,
      workerFactory: () => worker,
      signal: controller.signal,
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]).toHaveLength(1);
    const posted = worker.posted[0] as {
      contractStatus: string;
      scientificClaim: boolean;
      input: { paper: { width: number } };
    };
    expect(posted).toMatchObject({ contractStatus: 'candidate', scientificClaim: false });
    expect(Object.isFrozen(posted)).toBe(true);
    expect(Object.isFrozen(posted.input)).toBe(true);
    (requestInput.paper as { width: number }).width = 999;
    expect(posted.input.paper.width).toBe(1.5);

    const raw = structuredClone(completedResponse('grid-job:completed')) as {
      jobId: string;
      result: { enumerationBounds: { maxColumns: number } };
    };
    worker.emitMessage(raw);
    raw.jobId = 'mutated';
    raw.result.enumerationBounds.maxColumns = 999;
    const completed = await pending;
    expect(completed.outcome).toBe('completed');
    if (completed.outcome !== 'completed') throw new Error('expected completion');
    expect(completed.result.enumerationBounds.maxColumns).toBe(8);
    expect(Object.isFrozen(completed)).toBe(true);
    expect(Object.isFrozen(completed.result)).toBe(true);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('does not create a Worker when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort('SECRET_REASON');
    const factory = vi.fn(() => new FakeWorker());
    expect(
      await runSquareGridQuantizationWorkerV1({
        jobId: '',
        input: new Map(),
        workerFactory: factory,
        signal: controller.signal,
      }),
    ).toBe(SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT);
    expect(factory).not.toHaveBeenCalled();
  });

  it('terminates exactly once on abort, cleans listeners, and ignores late events', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:abort',
      input: input(),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    controller.abort('SECRET_ABORT_REASON');
    expect(await pending).toBe(SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
    worker.emitMessage(completedResponse('grid-job:abort'));
    worker.emitError('SECRET_LATE_ERROR');
    expect(worker.terminateCalls).toBe(1);
  });

  it('ignores a valid stale job without a timeout, then accepts empty completion', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    let settled = false;
    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:current',
      input: input(true),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    void pending.then(() => {
      settled = true;
    });
    worker.emitMessage(failedResponse('grid-job:stale'));
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(worker.terminateCalls).toBe(0);

    worker.emitMessage(completedResponse('grid-job:current', true));
    const response = await pending;
    expect(response).toMatchObject({
      jobId: 'grid-job:current',
      outcome: 'completed',
      reason: null,
      result: { candidates: [] },
    });
  });

  it('rejects a matching job ID whose source input belongs to another job', async () => {
    const worker = new FakeWorker();
    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:bound',
      input: input(),
      workerFactory: () => worker,
    });
    worker.emitMessage(completedResponse('grid-job:bound', true));
    expect(await pending).toBe(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('rejects a same-header empty result produced from different source branches', async () => {
    const requested = input();
    requested.relativeErrorLimit = 0;
    requested.branches = [{ id: 'branch-a', branchClass: 'terminal', length: 0.75, width: 0 }];
    const other = structuredClone(requested);
    const otherBranch = (other.branches as { length: number }[])[0];
    if (otherBranch === undefined) throw new Error('source-binding branch fixture is missing');
    otherBranch.length = 0.7;
    const otherEnumeration = enumerateSquareGridCandidatesV1(other);
    if (!otherEnumeration.ok) throw new Error('alternate source fixture must enumerate');
    expect(otherEnumeration.value.candidates).toEqual([]);

    const worker = new FakeWorker();
    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:empty-source-bound',
      input: requested,
      workerFactory: () => worker,
    });
    worker.emitMessage({
      schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
      scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
      jobId: 'grid-job:empty-source-bound',
      sourceInput: requested,
      outcome: 'completed',
      reason: null,
      result: otherEnumeration.value,
    });
    expect(await pending).toBe(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('maps malformed payloads and messageerror to a fixed protocol failure', async () => {
    for (const trigger of [
      (worker: FakeWorker): void => worker.emitMessage({ hostText: 'SECRET_RESPONSE' }),
      (worker: FakeWorker): void => worker.emitMessageError('SECRET_MESSAGEERROR'),
    ]) {
      const worker = new FakeWorker();
      const pending = runSquareGridQuantizationWorkerV1({
        jobId: 'grid-job:protocol',
        input: input(),
        workerFactory: () => worker,
      });
      trigger(worker);
      const response = await pending;
      expect(response).toBe(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
      expect(JSON.stringify(response)).not.toContain('SECRET');
      expect(worker.terminateCalls).toBe(1);
      expect(worker.listenerCount()).toBe(0);
    }
  });

  it('rejects response accessors without invoking them', async () => {
    const worker = new FakeWorker();
    let getterCalls = 0;
    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:getter',
      input: input(),
      workerFactory: () => worker,
    });
    const raw = completedResponse('grid-job:getter');
    Object.defineProperty(raw, 'result', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return completedResponse('unused').result;
      },
    });
    worker.emitMessage(raw);
    expect(await pending).toBe(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
    expect(getterCalls).toBe(0);
  });

  it('maps factory, postMessage, and Worker errors to one fixed execution failure', async () => {
    expect(
      await runSquareGridQuantizationWorkerV1({
        jobId: 'grid-job:factory',
        input: input(),
        workerFactory: () => {
          throw new Error('SECRET_FACTORY');
        },
      }),
    ).toBe(SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT);

    const postWorker = new FakeWorker();
    postWorker.postFailure = new Error('SECRET_POST');
    expect(
      await runSquareGridQuantizationWorkerV1({
        jobId: 'grid-job:post',
        input: input(),
        workerFactory: () => postWorker,
      }),
    ).toBe(SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT);
    expect(postWorker.terminateCalls).toBe(1);
    expect(postWorker.listenerCount()).toBe(0);

    const eventWorker = new FakeWorker();
    const pending = runSquareGridQuantizationWorkerV1({
      jobId: 'grid-job:event',
      input: input(),
      workerFactory: () => eventWorker,
    });
    eventWorker.emitError({ message: 'SECRET_ERROR', filename: 'SECRET_PATH' });
    const eventResult = await pending;
    expect(eventResult).toBe(SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT);
    expect(JSON.stringify(eventResult)).not.toContain('SECRET');
  });

  it('rejects invalid local input before constructing a Worker', async () => {
    const factory = vi.fn(() => new FakeWorker());
    expect(
      await runSquareGridQuantizationWorkerV1({
        jobId: '',
        input: input(),
        workerFactory: factory,
      }),
    ).toBe(SQUARE_GRID_QUANTIZATION_WORKER_INVALID_REQUEST_RESULT);
    expect(factory).not.toHaveBeenCalled();

    let calls = 0;
    const accessor = input();
    Object.defineProperty(accessor, 'paper', {
      enumerable: true,
      get(): unknown {
        calls += 1;
        return { width: 1, height: 1 };
      },
    });
    expect(
      await runSquareGridQuantizationWorkerV1({
        jobId: 'grid-job:accessor',
        input: accessor,
        workerFactory: factory,
      }),
    ).toBe(SQUARE_GRID_QUANTIZATION_WORKER_INVALID_REQUEST_RESULT);
    expect(calls).toBe(0);
    expect(factory).not.toHaveBeenCalled();
  });

  it('closes synchronous registration reentrancy before posting', async () => {
    let posts = 0;
    let terminations = 0;
    const worker: SquareGridQuantizationWorkerLikeV1 = {
      postMessage: () => {
        posts += 1;
      },
      terminate: () => {
        terminations += 1;
      },
      addEventListener: (type, listener) => {
        if (type === 'message') listener({ data: failedResponse('grid-job:reentrant') });
      },
      removeEventListener: () => undefined,
    };
    expect(
      await runSquareGridQuantizationWorkerV1({
        jobId: 'grid-job:reentrant',
        input: input(),
        workerFactory: () => worker,
      }),
    ).toMatchObject({ outcome: 'failed', reason: 'quantization-failed' });
    expect(posts).toBe(0);
    expect(terminations).toBe(1);
  });
});

describe('browser square-grid quantization Worker factory', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses a Vite module URL and the dedicated stable Worker name', () => {
    const calls: { url: URL; options: WorkerOptions }[] = [];
    function WorkerStub(url: URL, options: WorkerOptions): void {
      calls.push({ url, options });
    }
    vi.stubGlobal('Worker', WorkerStub);
    createBrowserSquareGridQuantizationWorkerV1();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url.pathname).toContain('square-grid-quantization.worker.ts');
    expect(calls[0]?.options).toEqual({
      type: 'module',
      name: 'oridesign-m0f-square-grid-quantization-v1',
    });
  });
});
