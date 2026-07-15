import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createBrowserEuclideanNecessaryWitnessSearchWorkerV1,
  createBrowserEuclideanNecessaryWitnessValidationWorkerV1,
} from '../../m0f/workers/browser-euclidean-necessary-witness-workers.js';
import { executeEuclideanNecessaryWitnessSearchWorkerMessageV1 } from '../../m0f/workers/euclidean-necessary-witness-search-worker-handler.js';
import { executeEuclideanNecessaryWitnessValidationWorkerMessageV1 } from '../../m0f/workers/euclidean-necessary-witness-validation-worker-handler.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT,
  EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT,
  EUCLIDEAN_NECESSARY_WITNESS_WORKER_INVALID_REQUEST_RESULT,
  EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT,
  runEuclideanNecessaryWitnessSearchWorkerV1,
  type EuclideanNecessaryWitnessWorkerEventTypeV1,
  type EuclideanNecessaryWitnessWorkerLikeV1,
  type EuclideanNecessaryWitnessWorkerListenerV1,
} from '../../m0f/workers/run-euclidean-necessary-witness-search-worker.js';
import {
  witnessWorkerInput,
  type WitnessWorkerJson,
} from './euclidean-necessary-witness-worker-fixtures.js';

class FakeWorker implements EuclideanNecessaryWitnessWorkerLikeV1 {
  readonly posted: unknown[] = [];
  terminateCalls = 0;
  afterPost: ((message: unknown) => void) | undefined;
  afterRemove: (() => void) | undefined;
  postError: Error | undefined;
  addError: Error | undefined;
  removeError: Error | undefined;
  terminateError: Error | undefined;
  private readonly listeners = new Map<
    EuclideanNecessaryWitnessWorkerEventTypeV1,
    Set<EuclideanNecessaryWitnessWorkerListenerV1>
  >();

  postMessage(message: unknown): void {
    if (this.postError !== undefined) throw this.postError;
    this.posted.push(message);
    this.afterPost?.(message);
  }
  terminate(): void {
    this.terminateCalls += 1;
    if (this.terminateError !== undefined) throw this.terminateError;
  }
  addEventListener(
    type: EuclideanNecessaryWitnessWorkerEventTypeV1,
    listener: EuclideanNecessaryWitnessWorkerListenerV1,
  ): void {
    if (this.addError !== undefined) throw this.addError;
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
  }
  removeEventListener(
    type: EuclideanNecessaryWitnessWorkerEventTypeV1,
    listener: EuclideanNecessaryWitnessWorkerListenerV1,
  ): void {
    this.listeners.get(type)?.delete(listener);
    this.afterRemove?.();
    if (this.removeError !== undefined) throw this.removeError;
  }
  emit(type: EuclideanNecessaryWitnessWorkerEventTypeV1, data?: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener({ data });
  }
  listenerCount(): number {
    return [...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0);
  }
}

function realTwoStageWorkers(): readonly [FakeWorker, FakeWorker] {
  const search = new FakeWorker();
  const validation = new FakeWorker();
  search.afterPost = (message) =>
    search.emit('message', executeEuclideanNecessaryWitnessSearchWorkerMessageV1(message));
  validation.afterPost = (message) =>
    validation.emit('message', executeEuclideanNecessaryWitnessValidationWorkerMessageV1(message));
  return [search, validation];
}

describe('two-stage Euclidean necessary-witness Worker runner', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('provides two distinct same-origin module-Worker browser factories', () => {
    const created: { url: URL; options: WorkerOptions }[] = [];
    function StubWorker(url: URL, options: WorkerOptions): void {
      created.push({ url, options });
    }
    vi.stubGlobal('Worker', StubWorker);
    createBrowserEuclideanNecessaryWitnessSearchWorkerV1();
    createBrowserEuclideanNecessaryWitnessValidationWorkerV1();
    expect(created).toHaveLength(2);
    expect(created[0]?.options).toMatchObject({
      type: 'module',
      name: 'oridesign-m0f-euclidean-necessary-witness-search-v1',
    });
    expect(created[1]?.options).toMatchObject({
      type: 'module',
      name: 'oridesign-m0f-euclidean-necessary-witness-validation-v1',
    });
    expect(created[0]?.url.href).not.toBe(created[1]?.url.href);
  });

  it('runs search then independent replay off-main and returns only the replayed canonical result', async () => {
    const [search, validation] = realTwoStageWorkers();
    const result = await runEuclideanNecessaryWitnessSearchWorkerV1({
      jobId: 'job:complete',
      input: witnessWorkerInput(),
      searchWorkerFactory: () => search,
      validationWorkerFactory: () => validation,
    });
    expect(result).toMatchObject({
      outcome: 'completed',
      reason: null,
      scientificClaim: false,
      packingIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
    expect(search.posted).toHaveLength(1);
    expect(validation.posted).toHaveLength(1);
    const validationRequest = validation.posted[0] as WitnessWorkerJson;
    expect(validationRequest.validationId).toMatch(/^validation:/);
    expect(search.terminateCalls).toBe(1);
    expect(validation.terminateCalls).toBe(1);
    expect(search.listenerCount()).toBe(0);
    expect(validation.listenerCount()).toBe(0);
  });

  it('does not construct either Worker for pre-abort or invalid input', async () => {
    const controller = new AbortController();
    controller.abort('SECRET');
    const searchFactory = vi.fn(() => new FakeWorker());
    const validationFactory = vi.fn(() => new FakeWorker());
    expect(
      await runEuclideanNecessaryWitnessSearchWorkerV1({
        jobId: '',
        input: new Map(),
        searchWorkerFactory: searchFactory,
        validationWorkerFactory: validationFactory,
        signal: controller.signal,
      }),
    ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT);
    expect(searchFactory).not.toHaveBeenCalled();
    expect(validationFactory).not.toHaveBeenCalled();

    expect(
      await runEuclideanNecessaryWitnessSearchWorkerV1({
        jobId: '',
        input: new Map(),
        searchWorkerFactory: searchFactory,
        validationWorkerFactory: validationFactory,
      }),
    ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_INVALID_REQUEST_RESULT);
    expect(searchFactory).not.toHaveBeenCalled();
  });

  it('keeps silent work pending until caller abort, then cleans search with no validation factory', async () => {
    const search = new FakeWorker();
    const validationFactory = vi.fn(() => new FakeWorker());
    const controller = new AbortController();
    let settled = false;
    const pending = runEuclideanNecessaryWitnessSearchWorkerV1({
      jobId: 'job:silent',
      input: witnessWorkerInput(),
      searchWorkerFactory: () => search,
      validationWorkerFactory: validationFactory,
      signal: controller.signal,
    });
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    controller.abort();
    expect(await pending).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT);
    expect(validationFactory).not.toHaveBeenCalled();
    expect(search.terminateCalls).toBe(1);
    expect(search.listenerCount()).toBe(0);
  });

  it('wins an abort race during search cleanup without constructing validation', async () => {
    const controller = new AbortController();
    const search = new FakeWorker();
    const validationFactory = vi.fn(() => new FakeWorker());
    search.afterRemove = () => controller.abort();
    search.afterPost = (message) =>
      search.emit('message', executeEuclideanNecessaryWitnessSearchWorkerMessageV1(message));
    const result = await runEuclideanNecessaryWitnessSearchWorkerV1({
      jobId: 'job:between',
      input: witnessWorkerInput(),
      searchWorkerFactory: () => search,
      validationWorkerFactory: validationFactory,
      signal: controller.signal,
    });
    expect(result).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT);
    expect(validationFactory).not.toHaveBeenCalled();
    expect(search.terminateCalls).toBe(1);
  });

  it('aborts validation, terminates both stages once, and ignores late/duplicate events', async () => {
    const search = new FakeWorker();
    const validation = new FakeWorker();
    const controller = new AbortController();
    search.afterPost = (message) =>
      search.emit('message', executeEuclideanNecessaryWitnessSearchWorkerMessageV1(message));
    const pending = runEuclideanNecessaryWitnessSearchWorkerV1({
      jobId: 'job:validation-abort',
      input: witnessWorkerInput(),
      searchWorkerFactory: () => search,
      validationWorkerFactory: () => validation,
      signal: controller.signal,
    });
    expect(validation.posted).toHaveLength(1);
    controller.abort();
    expect(await pending).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT);
    validation.emit(
      'message',
      executeEuclideanNecessaryWitnessValidationWorkerMessageV1(validation.posted[0]),
    );
    validation.emit('error', 'SECRET');
    expect(search.terminateCalls).toBe(1);
    expect(validation.terminateCalls).toBe(1);
    expect(validation.listenerCount()).toBe(0);
  });

  it('fails closed for fake search job/source/claims/outcomes before validation', async () => {
    const mutations: ((response: WitnessWorkerJson) => void)[] = [
      (response) => {
        response.jobId = 'job:stale';
      },
      (response) => {
        (response.sourceInput as WitnessWorkerJson).maxVisitedStates = 1;
      },
      (response) => {
        response.globalM0fGo = true;
      },
      (response) => {
        response.outcome = 'verified';
      },
    ];
    for (const mutate of mutations) {
      const search = new FakeWorker();
      const validationFactory = vi.fn(() => new FakeWorker());
      search.afterPost = (message) => {
        const response = structuredClone(
          executeEuclideanNecessaryWitnessSearchWorkerMessageV1(message),
        ) as unknown as WitnessWorkerJson;
        mutate(response);
        search.emit('message', response);
      };
      expect(
        await runEuclideanNecessaryWitnessSearchWorkerV1({
          jobId: 'job:bound',
          input: witnessWorkerInput(),
          searchWorkerFactory: () => search,
          validationWorkerFactory: validationFactory,
        }),
      ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
      expect(validationFactory).not.toHaveBeenCalled();
      expect(search.terminateCalls).toBe(1);
    }
  });

  it('fails closed for fake validation job/source/validationId/claims/outcomes/results', async () => {
    const mutations: ((response: WitnessWorkerJson) => void)[] = [
      (response) => {
        response.jobId = 'job:stale';
      },
      (response) => {
        response.validationId = 'validation:stale';
      },
      (response) => {
        (response.sourceInput as WitnessWorkerJson).maxWitnesses = 2;
      },
      (response) => {
        response.packingIncluded = true;
      },
      (response) => {
        response.outcome = 'verified';
      },
      (response) => {
        (response.result as WitnessWorkerJson).visitedStates = 0;
      },
    ];
    for (const mutate of mutations) {
      const search = new FakeWorker();
      const validation = new FakeWorker();
      search.afterPost = (message) =>
        search.emit('message', executeEuclideanNecessaryWitnessSearchWorkerMessageV1(message));
      validation.afterPost = (message) => {
        const response = structuredClone(
          executeEuclideanNecessaryWitnessValidationWorkerMessageV1(message),
        ) as unknown as WitnessWorkerJson;
        mutate(response);
        validation.emit('message', response);
      };
      expect(
        await runEuclideanNecessaryWitnessSearchWorkerV1({
          jobId: 'job:validation-bound',
          input: witnessWorkerInput(),
          searchWorkerFactory: () => search,
          validationWorkerFactory: () => validation,
        }),
      ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
      expect(search.terminateCalls).toBe(1);
      expect(validation.terminateCalls).toBe(1);
    }
  });

  it('maps factories/listeners/post/error/messageerror to fixed failures and cleanup', async () => {
    expect(
      await runEuclideanNecessaryWitnessSearchWorkerV1({
        jobId: 'job:factory',
        input: witnessWorkerInput(),
        searchWorkerFactory: () => {
          throw new Error('SECRET');
        },
        validationWorkerFactory: () => new FakeWorker(),
      }),
    ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);

    const add = new FakeWorker();
    add.addError = new Error('SECRET');
    expect(
      await runEuclideanNecessaryWitnessSearchWorkerV1({
        jobId: 'job:add',
        input: witnessWorkerInput(),
        searchWorkerFactory: () => add,
        validationWorkerFactory: () => new FakeWorker(),
      }),
    ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
    expect(add.terminateCalls).toBe(1);

    const post = new FakeWorker();
    post.postError = new Error('SECRET');
    expect(
      await runEuclideanNecessaryWitnessSearchWorkerV1({
        jobId: 'job:post',
        input: witnessWorkerInput(),
        searchWorkerFactory: () => post,
        validationWorkerFactory: () => new FakeWorker(),
      }),
    ).toBe(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
    expect(post.terminateCalls).toBe(1);

    for (const event of ['error', 'messageerror'] as const) {
      const worker = new FakeWorker();
      worker.afterPost = () => worker.emit(event, 'SECRET');
      const result = await runEuclideanNecessaryWitnessSearchWorkerV1({
        jobId: `job:${event}`,
        input: witnessWorkerInput(),
        searchWorkerFactory: () => worker,
        validationWorkerFactory: () => new FakeWorker(),
      });
      expect(result).toBe(
        event === 'error'
          ? EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT
          : EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT,
      );
      expect(JSON.stringify(result)).not.toContain('SECRET');
      expect(worker.terminateCalls).toBe(1);
    }
  });

  it('keeps the chosen result when listener removal or termination throws', async () => {
    const [search, validation] = realTwoStageWorkers();
    search.removeError = new Error('SECRET_REMOVE');
    search.terminateError = new Error('SECRET_TERMINATE');
    validation.removeError = new Error('SECRET_REMOVE');
    validation.terminateError = new Error('SECRET_TERMINATE');
    const result = await runEuclideanNecessaryWitnessSearchWorkerV1({
      jobId: 'job:cleanup-exceptions',
      input: witnessWorkerInput(),
      searchWorkerFactory: () => search,
      validationWorkerFactory: () => validation,
    });
    expect(result.outcome).toBe('completed');
    expect(JSON.stringify(result)).not.toContain('SECRET');
    expect(search.terminateCalls).toBe(1);
    expect(validation.terminateCalls).toBe(1);
  });
});
