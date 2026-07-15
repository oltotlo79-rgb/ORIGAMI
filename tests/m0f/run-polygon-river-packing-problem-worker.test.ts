import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { createBrowserPolygonRiverPackingProblemWorkerV1 } from '../../m0f/workers/browser-polygon-river-packing-problem-worker.js';
import {
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_INVALID_REQUEST_RESULT,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT,
  runPolygonRiverPackingProblemWorkerV1,
  type PolygonRiverPackingProblemWorkerEventListenerV1,
  type PolygonRiverPackingProblemWorkerEventTypeV1,
  type PolygonRiverPackingProblemWorkerLikeV1,
} from '../../m0f/workers/run-polygon-river-packing-problem-worker.js';
import {
  packingWorkerCompletedResponse,
  packingWorkerDefaultSource,
  packingWorkerFailedResponse,
  packingWorkerInput,
  type JsonRecord,
} from './polygon-river-packing-problem-worker-fixtures.js';

class FakeWorker implements PolygonRiverPackingProblemWorkerLikeV1 {
  readonly posted: unknown[] = [];
  terminateCalls = 0;
  postFailure: Error | undefined;
  afterPost: ((message: unknown) => void) | undefined;
  private readonly listeners = new Map<
    PolygonRiverPackingProblemWorkerEventTypeV1,
    Set<PolygonRiverPackingProblemWorkerEventListenerV1>
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
    type: PolygonRiverPackingProblemWorkerEventTypeV1,
    listener: PolygonRiverPackingProblemWorkerEventListenerV1,
  ): void {
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
  }

  removeEventListener(
    type: PolygonRiverPackingProblemWorkerEventTypeV1,
    listener: PolygonRiverPackingProblemWorkerEventListenerV1,
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
    type: PolygonRiverPackingProblemWorkerEventTypeV1,
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

describe('polygon/river packing-problem Worker client', () => {
  it('posts one frozen canonical request and accepts an independently valid result', async () => {
    expectTypeOf<Worker>().toExtend<PolygonRiverPackingProblemWorkerLikeV1>();
    const input = packingWorkerInput();
    const worker = new FakeWorker();
    const post = vi.spyOn(worker, 'postMessage');
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:completed',
      input,
      workerFactory: () => worker,
      signal: controller.signal,
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]).toHaveLength(1);
    const posted = worker.posted[0] as {
      operation: string;
      input: { source: { maxColumns: number } };
    };
    expect(posted.operation).toBe('build-polygon-river-packing-problem');
    expect(Object.isFrozen(posted)).toBe(true);
    expect(Object.isFrozen(posted.input)).toBe(true);
    ((input.source as JsonRecord).maxColumns as number) = 1;
    expect(posted.input.source.maxColumns).toBe(12);

    const raw = packingWorkerCompletedResponse('packing-job:completed');
    worker.emitMessage(raw);
    raw.jobId = 'mutated';
    ((raw.result as JsonRecord).activeGridDomain as JsonRecord).columns = 1;
    const result = await pending;
    expect(result.outcome).toBe('completed');
    if (result.outcome !== 'completed') throw new Error('expected completion');
    expect(result.result.activeGridDomain.columns).toBe(12);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.result)).toBe(true);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('accepts one canonical build failure without no-solution reinterpretation', async () => {
    const input = packingWorkerInput(packingWorkerDefaultSource(), 'square-grid:not-present');
    const worker = new FakeWorker();
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:failed',
      input,
      workerFactory: () => worker,
    });
    worker.emitMessage(packingWorkerFailedResponse('packing-job:failed', input));
    const result = await pending;
    expect(result).toMatchObject({
      outcome: 'failed',
      reason: 'packing-problem-build-failed',
      result: null,
    });
    expect(JSON.stringify(result)).not.toMatch(/no[- ]solution|infeasible/i);
  });

  it('does not construct a Worker when already aborted, even for invalid input', async () => {
    const controller = new AbortController();
    controller.abort('SECRET_REASON');
    const factory = vi.fn(() => new FakeWorker());
    expect(
      await runPolygonRiverPackingProblemWorkerV1({
        jobId: '',
        input: new Map(),
        workerFactory: factory,
        signal: controller.signal,
      }),
    ).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT);
    expect(factory).not.toHaveBeenCalled();
  });

  it('has no forced timeout and uses AbortSignal as the silent-work exit', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    let settled = false;
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:silent',
      input: packingWorkerInput(),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(worker.terminateCalls).toBe(0);
    controller.abort();
    expect(await pending).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('terminates exactly once on abort and ignores every late event', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:abort',
      input: packingWorkerInput(),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    controller.abort('SECRET_ABORT_REASON');
    expect(await pending).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT);
    worker.emitMessage(packingWorkerCompletedResponse('packing-job:abort'));
    worker.emitError('SECRET_LATE_ERROR');
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('fails closed on a wrong job, source echo, or caller candidate echo', async () => {
    const cases: ((worker: FakeWorker) => void)[] = [
      (worker) => worker.emitMessage(packingWorkerCompletedResponse('packing-job:stale')),
      (worker) => {
        const source = packingWorkerDefaultSource();
        source.maxColumns = 8;
        const otherInput = packingWorkerInput(source);
        worker.emitMessage(packingWorkerCompletedResponse('packing-job:bound', otherInput));
      },
      (worker) => {
        const otherInput = packingWorkerInput(
          packingWorkerDefaultSource(),
          'square-grid:not-present',
        );
        worker.emitMessage(packingWorkerFailedResponse('packing-job:bound', otherInput));
      },
    ];
    for (const emit of cases) {
      const worker = new FakeWorker();
      const pending = runPolygonRiverPackingProblemWorkerV1({
        jobId: 'packing-job:bound',
        input: packingWorkerInput(),
        workerFactory: () => worker,
      });
      emit(worker);
      expect(await pending).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
      expect(worker.terminateCalls).toBe(1);
      expect(worker.listenerCount()).toBe(0);
    }
  });

  it('maps malformed, undefined, null, wrong-operation, and tampered payloads to protocol failure', async () => {
    const triggers: ((worker: FakeWorker) => void)[] = [
      (worker) => worker.emitMessage(undefined),
      (worker) => worker.emitMessage(null),
      (worker) => worker.emitMessage({ hostText: 'SECRET_RESPONSE' }),
      (worker) => {
        const raw = packingWorkerCompletedResponse('packing-job:protocol');
        raw.operation = 'solve-packing';
        worker.emitMessage(raw);
      },
      (worker) => {
        const raw = packingWorkerCompletedResponse('packing-job:protocol');
        (raw.result as JsonRecord).packingIncluded = true;
        worker.emitMessage(raw);
      },
      (worker) => {
        const raw = packingWorkerCompletedResponse('packing-job:protocol');
        raw.extra = true;
        worker.emitMessage(raw);
      },
      (worker) => worker.emitMessageError('SECRET_MESSAGEERROR'),
    ];
    for (const trigger of triggers) {
      const worker = new FakeWorker();
      const pending = runPolygonRiverPackingProblemWorkerV1({
        jobId: 'packing-job:protocol',
        input: packingWorkerInput(),
        workerFactory: () => worker,
      });
      trigger(worker);
      const result = await pending;
      expect(result).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
      expect(JSON.stringify(result)).not.toContain('SECRET');
      expect(worker.terminateCalls).toBe(1);
      expect(worker.listenerCount()).toBe(0);
    }
  });

  it('rejects response accessors without invoking them', async () => {
    const worker = new FakeWorker();
    let getterCalls = 0;
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:getter',
      input: packingWorkerInput(),
      workerFactory: () => worker,
    });
    const raw = packingWorkerCompletedResponse('packing-job:getter');
    Object.defineProperty(raw, 'result', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return {};
      },
    });
    worker.emitMessage(raw);
    expect(await pending).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
    expect(getterCalls).toBe(0);
  });

  it('maps factory, postMessage, and Worker errors to a fixed execution failure', async () => {
    expect(
      await runPolygonRiverPackingProblemWorkerV1({
        jobId: 'packing-job:factory',
        input: packingWorkerInput(),
        workerFactory: () => {
          throw new Error('SECRET_FACTORY');
        },
      }),
    ).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT);

    const postWorker = new FakeWorker();
    postWorker.postFailure = new Error('SECRET_POST');
    expect(
      await runPolygonRiverPackingProblemWorkerV1({
        jobId: 'packing-job:post',
        input: packingWorkerInput(),
        workerFactory: () => postWorker,
      }),
    ).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT);
    expect(postWorker.terminateCalls).toBe(1);
    expect(postWorker.listenerCount()).toBe(0);

    const eventWorker = new FakeWorker();
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:event',
      input: packingWorkerInput(),
      workerFactory: () => eventWorker,
    });
    eventWorker.emitError({ message: 'SECRET_ERROR', filename: 'SECRET_PATH' });
    const result = await pending;
    expect(result).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT);
    expect(JSON.stringify(result)).not.toContain('SECRET');
  });

  it('rejects invalid local input before constructing a Worker', async () => {
    const factory = vi.fn(() => new FakeWorker());
    expect(
      await runPolygonRiverPackingProblemWorkerV1({
        jobId: '',
        input: packingWorkerInput(),
        workerFactory: factory,
      }),
    ).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_INVALID_REQUEST_RESULT);
    expect(factory).not.toHaveBeenCalled();

    let getterCalls = 0;
    const accessor = packingWorkerInput();
    Object.defineProperty(accessor, 'source', {
      enumerable: true,
      get(): unknown {
        getterCalls += 1;
        return packingWorkerDefaultSource();
      },
    });
    expect(
      await runPolygonRiverPackingProblemWorkerV1({
        jobId: 'packing-job:accessor',
        input: accessor,
        workerFactory: factory,
      }),
    ).toBe(POLYGON_RIVER_PACKING_PROBLEM_WORKER_INVALID_REQUEST_RESULT);
    expect(getterCalls).toBe(0);
    expect(factory).not.toHaveBeenCalled();
  });

  it('settles once under synchronous registration reentrancy and posts no job afterward', async () => {
    let posts = 0;
    let terminations = 0;
    const worker: PolygonRiverPackingProblemWorkerLikeV1 = {
      postMessage: () => {
        posts += 1;
      },
      terminate: () => {
        terminations += 1;
      },
      addEventListener: (type, listener) => {
        if (type === 'message') {
          listener({ data: packingWorkerFailedResponse('packing-job:reentrant') });
        }
      },
      removeEventListener: () => undefined,
    };
    expect(
      await runPolygonRiverPackingProblemWorkerV1({
        jobId: 'packing-job:reentrant',
        input: packingWorkerInput(),
        workerFactory: () => worker,
      }),
    ).toMatchObject({ outcome: 'failed', reason: 'packing-problem-build-failed' });
    expect(posts).toBe(0);
    expect(terminations).toBe(1);
  });

  it('ignores a second message after the first completion and one cleanup', async () => {
    const worker = new FakeWorker();
    const pending = runPolygonRiverPackingProblemWorkerV1({
      jobId: 'packing-job:once',
      input: packingWorkerInput(),
      workerFactory: () => worker,
    });
    worker.emitMessage(packingWorkerCompletedResponse('packing-job:once'));
    worker.emitError('SECRET_SECOND');
    expect((await pending).outcome).toBe('completed');
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });
});

describe('browser polygon/river packing-problem Worker factory', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses a Vite module URL and a dedicated stable Worker name', () => {
    const calls: { url: URL; options: WorkerOptions }[] = [];
    function WorkerStub(url: URL, options: WorkerOptions): void {
      calls.push({ url, options });
    }
    vi.stubGlobal('Worker', WorkerStub);
    createBrowserPolygonRiverPackingProblemWorkerV1();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url.pathname).toContain('polygon-river-packing-problem.worker.ts');
    expect(calls[0]?.options).toEqual({
      type: 'module',
      name: 'oridesign-m0f-polygon-river-packing-problem-v1',
    });
  });
});
