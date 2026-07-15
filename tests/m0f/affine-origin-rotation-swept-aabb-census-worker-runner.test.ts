import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { createBrowserAffineOriginRotationSweptAabbCensusWorkerV1 } from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-browser.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CANCELLED_RESULT,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_INVALID_REQUEST_RESULT,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT,
  runAffineOriginRotationSweptAabbCensusWorkerV1,
  type AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
  type AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
  type AffineOriginRotationSweptAabbCensusWorkerLikeV1,
} from '../../m0f/workers/affine-origin-rotation-swept-aabb-census-worker-runner.js';
import {
  censusWorkerCompletedResponse,
  censusWorkerFailedResponse,
  censusWorkerInput,
  censusWorkerPrimitive,
  type MutableRecord,
} from './affine-origin-rotation-swept-aabb-census-worker-fixtures.js';

class FakeWorker implements AffineOriginRotationSweptAabbCensusWorkerLikeV1 {
  readonly posted: unknown[] = [];
  terminateCalls = 0;
  postFailure: Error | undefined;
  terminateFailure: Error | undefined;
  afterPost: ((message: unknown) => void) | undefined;
  afterAdd: ((type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1) => void) | undefined;
  private readonly listeners = new Map<
    AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
    Set<AffineOriginRotationSweptAabbCensusWorkerEventListenerV1>
  >();

  postMessage(message: unknown): void {
    if (this.postFailure !== undefined) throw this.postFailure;
    this.posted.push(message);
    this.afterPost?.(message);
  }

  terminate(): void {
    this.terminateCalls += 1;
    if (this.terminateFailure !== undefined) throw this.terminateFailure;
  }

  addEventListener(
    type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
    listener: AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
  ): void {
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
    this.afterAdd?.(type);
  }

  removeEventListener(
    type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
    listener: AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  emitMessage(data: unknown): void {
    this.emit('message', { data });
  }

  emitError(data?: unknown): void {
    this.emit('error', { data });
  }

  emitMessageError(data?: unknown): void {
    this.emit('messageerror', { data });
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0);
  }

  private emit(
    type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('affine-origin rotation swept-AABB census Worker runner', () => {
  it('posts one frozen canonical BigInt request and accepts one source-bound result', async () => {
    expectTypeOf<Worker>().toExtend<AffineOriginRotationSweptAabbCensusWorkerLikeV1>();
    const input = censusWorkerInput();
    const worker = new FakeWorker();
    const controller = new AbortController();
    const addAbort = vi.spyOn(controller.signal, 'addEventListener');
    const removeAbort = vi.spyOn(controller.signal, 'removeEventListener');
    const pending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:completed',
      jobId: 'job:completed',
      input,
      workerFactory: () => worker,
      signal: controller.signal,
    });
    expect(worker.posted).toHaveLength(1);
    const posted = worker.posted[0] as MutableRecord;
    expect(posted).toMatchObject({
      recordType: 'm0f-affine-origin-rotation-swept-aabb-census-worker-request',
      operation: 'compute-affine-origin-rotation-swept-aabb-census',
      sourceId: 'source:completed',
      jobId: 'job:completed',
      scientificClaim: false,
    });
    expect(Object.isFrozen(posted)).toBe(true);
    expect(Object.isFrozen(posted.input)).toBe(true);
    ((input.slab as MutableRecord).t1 as MutableRecord).numerator = 3n;
    expect(((posted.input as MutableRecord).slab as MutableRecord).t1).toMatchObject({
      numerator: 1n,
    });

    const raw = censusWorkerCompletedResponse(
      'job:completed',
      'source:completed',
      censusWorkerInput(),
    );
    worker.emitMessage(raw);
    raw.jobId = 'mutated';
    const result = await pending;
    expect(result).toMatchObject({
      outcome: 'completed',
      reason: null,
      collisionFreeClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
      result: { separatedPairCount: 1 },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
    expectAbortListenerRemoved(addAbort.mock.calls, removeAbort.mock.calls);
  });

  it('accepts one closed computation failure without collision reinterpretation', async () => {
    const worker = new FakeWorker();
    const pending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:failed',
      jobId: 'job:failed',
      input: censusWorkerInput(),
      workerFactory: () => worker,
    });
    worker.emitMessage(censusWorkerFailedResponse('job:failed', 'source:failed'));
    expect(await pending).toMatchObject({
      outcome: 'failed',
      reason: 'census-computation-rejected',
      result: null,
      collisionFreeClaim: false,
      scientificClaim: false,
    });
  });

  it('does not construct a Worker when pre-aborted, even for an invalid request', async () => {
    const controller = new AbortController();
    controller.abort('SECRET_ABORT_REASON');
    const factory = vi.fn(() => new FakeWorker());
    expect(
      await runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: '',
        jobId: '',
        input: new Map(),
        workerFactory: factory,
        signal: controller.signal,
      }),
    ).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CANCELLED_RESULT);
    expect(factory).not.toHaveBeenCalled();
  });

  it('has no timeout or main-thread fallback and terminates a silent Worker on abort', async () => {
    const source = await readFile(
      resolve('m0f/workers/affine-origin-rotation-swept-aabb-census-worker-runner.ts'),
      'utf8',
    );
    expect(source).not.toContain('computeAffineOriginRotationSweptAabbCensusV1');
    expect(source).not.toContain('setTimeout(');
    expect(source).not.toContain("recordType: 'progress'");

    const worker = new FakeWorker();
    const controller = new AbortController();
    let settled = false;
    const pending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:silent',
      jobId: 'job:silent',
      input: censusWorkerInput(),
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
    expect(await pending).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CANCELLED_RESULT);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('preserves an already accepted result when abort races its closing microtask', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    worker.afterPost = () => {
      worker.emitMessage(censusWorkerCompletedResponse('job:race', 'source:race'));
      controller.abort();
    };
    const result = await runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:race',
      jobId: 'job:race',
      input: censusWorkerInput(),
      workerFactory: () => worker,
      signal: controller.signal,
    });
    expect(result.outcome).toBe('completed');
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('fails closed on synchronous duplicate and unexpected progress-like responses', async () => {
    const duplicate = new FakeWorker();
    duplicate.afterPost = () => {
      duplicate.emitMessage(censusWorkerCompletedResponse('job:duplicate', 'source:duplicate'));
      duplicate.emitMessage(censusWorkerCompletedResponse('job:duplicate', 'source:duplicate'));
    };
    expect(
      await runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: 'source:duplicate',
        jobId: 'job:duplicate',
        input: censusWorkerInput(),
        workerFactory: () => duplicate,
      }),
    ).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT);
    expect(duplicate.terminateCalls).toBe(1);

    const progress = new FakeWorker();
    const pending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:progress',
      jobId: 'job:progress',
      input: censusWorkerInput(),
      workerFactory: () => progress,
    });
    progress.emitMessage({ recordType: 'progress', completedPairs: 1 });
    expect(await pending).toBe(
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT,
    );
  });

  it('stops setup when a hostile Worker-like object reenters during listener installation', async () => {
    const worker = new FakeWorker();
    worker.afterAdd = (type) => {
      if (type === 'message') {
        worker.emitMessage(censusWorkerCompletedResponse('job:reentrant', 'source:reentrant'));
      }
    };
    expect(
      await runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: 'source:reentrant',
        jobId: 'job:reentrant',
        input: censusWorkerInput(),
        workerFactory: () => worker,
      }),
    ).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT);
    expect(worker.posted).toEqual([]);
    expect(worker.terminateCalls).toBe(1);
    expect(worker.listenerCount()).toBe(0);
  });

  it('fails closed on mismatched job, source ID, or exact source input', async () => {
    const cases: ((worker: FakeWorker) => void)[] = [
      (worker) => worker.emitMessage(censusWorkerCompletedResponse('job:stale', 'source:bound')),
      (worker) => worker.emitMessage(censusWorkerCompletedResponse('job:bound', 'source:stale')),
      (worker) => {
        const changed = censusWorkerInput([
          censusWorkerPrimitive('a', 0),
          censusWorkerPrimitive('b', 11),
        ]);
        worker.emitMessage(censusWorkerCompletedResponse('job:bound', 'source:bound', changed));
      },
    ];
    for (const trigger of cases) {
      const worker = new FakeWorker();
      const pending = runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: 'source:bound',
        jobId: 'job:bound',
        input: censusWorkerInput(),
        workerFactory: () => worker,
      });
      trigger(worker);
      expect(await pending).toBe(
        AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT,
      );
      expect(worker.terminateCalls).toBe(1);
      expect(worker.listenerCount()).toBe(0);
    }
  });

  it('maps invalid requests, malformed messages, worker errors, and host failures to fixed results', async () => {
    expect(
      await runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: 'source:invalid',
        jobId: '',
        input: censusWorkerInput(),
        workerFactory: () => new FakeWorker(),
      }),
    ).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_INVALID_REQUEST_RESULT);

    const malformed = new FakeWorker();
    const malformedPending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:malformed',
      jobId: 'job:malformed',
      input: censusWorkerInput(),
      workerFactory: () => malformed,
    });
    malformed.emitMessage({ secret: 'SECRET_RESPONSE' });
    expect(await malformedPending).toBe(
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT,
    );

    const errored = new FakeWorker();
    const errorPending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:error',
      jobId: 'job:error',
      input: censusWorkerInput(),
      workerFactory: () => errored,
    });
    errored.emitError('SECRET_ERROR');
    expect(await errorPending).toBe(
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT,
    );

    const messageErrored = new FakeWorker();
    const messageErrorPending = runAffineOriginRotationSweptAabbCensusWorkerV1({
      sourceId: 'source:messageerror',
      jobId: 'job:messageerror',
      input: censusWorkerInput(),
      workerFactory: () => messageErrored,
    });
    messageErrored.emitMessageError('SECRET_CLONE_ERROR');
    expect(await messageErrorPending).toBe(
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT,
    );

    expect(
      await runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: 'source:factory',
        jobId: 'job:factory',
        input: censusWorkerInput(),
        workerFactory: () => {
          throw new Error('SECRET_FACTORY');
        },
      }),
    ).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT);

    const postFailed = new FakeWorker();
    postFailed.postFailure = new Error('SECRET_POST');
    postFailed.terminateFailure = new Error('SECRET_TERMINATE');
    expect(
      await runAffineOriginRotationSweptAabbCensusWorkerV1({
        sourceId: 'source:post',
        jobId: 'job:post',
        input: censusWorkerInput(),
        workerFactory: () => postFailed,
      }),
    ).toBe(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT);
    expect(postFailed.terminateCalls).toBe(1);
    expect(postFailed.listenerCount()).toBe(0);
  });

  it('constructs the browser module Worker with the dedicated entry and stable name', () => {
    const constructions: Readonly<{ url: URL; options: WorkerOptions }>[] = [];
    class BrowserWorkerStub {
      readonly marker = 'browser-worker-stub';

      constructor(url: URL, options: WorkerOptions) {
        constructions.push({ url, options });
      }
    }
    vi.stubGlobal('Worker', BrowserWorkerStub);
    const created = createBrowserAffineOriginRotationSweptAabbCensusWorkerV1();
    expect(created).toBeInstanceOf(BrowserWorkerStub);
    expect(constructions).toHaveLength(1);
    expect(constructions[0]?.url.pathname).toMatch(
      /src\/workers\/affine-origin-rotation-swept-aabb-census\.worker\.ts$/,
    );
    expect(constructions[0]?.options).toEqual({
      type: 'module',
      name: 'oridesign-m0f-affine-origin-rotation-swept-aabb-census-v1',
    });
  });
});
