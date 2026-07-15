import type { EuclideanNecessaryWitnessSearchResultV1 } from '../box-pleating/euclidean-necessary-witness-search.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import { stableStringify } from '../stable-json.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE,
  parseEuclideanNecessaryWitnessSearchWorkerRequestV1,
  parseEuclideanNecessaryWitnessSearchWorkerResponseV1,
  type EuclideanNecessaryWitnessSearchWorkerRequestV1,
} from './euclidean-necessary-witness-search-worker-protocol.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE,
  equalEuclideanNecessaryWitnessWorkerSourceV1,
  parseEuclideanNecessaryWitnessValidationWorkerRequestV1,
  parseEuclideanNecessaryWitnessValidationWorkerResponseV1,
  type EuclideanNecessaryWitnessValidationWorkerRequestV1,
} from './euclidean-necessary-witness-validation-worker-protocol.js';

export type EuclideanNecessaryWitnessWorkerEventTypeV1 = 'message' | 'error' | 'messageerror';
export type EuclideanNecessaryWitnessWorkerListenerV1 = (
  event: Readonly<{ data?: unknown }>,
) => void;
export interface EuclideanNecessaryWitnessWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: EuclideanNecessaryWitnessWorkerEventTypeV1,
    listener: EuclideanNecessaryWitnessWorkerListenerV1,
  ): void;
  removeEventListener(
    type: EuclideanNecessaryWitnessWorkerEventTypeV1,
    listener: EuclideanNecessaryWitnessWorkerListenerV1,
  ): void;
}
export type EuclideanNecessaryWitnessWorkerFactoryV1 = () => EuclideanNecessaryWitnessWorkerLikeV1;

type ResultBase = Readonly<{
  contractStatus: 'candidate';
  scientificClaim: false;
  generalPolygonRiverPackingSolverIncluded: false;
  packingIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
}>;
export type EuclideanNecessaryWitnessTwoStageWorkerRunResultV1 =
  | (ResultBase &
      Readonly<{
        outcome: 'completed';
        reason: null;
        result: EuclideanNecessaryWitnessSearchResultV1;
      }>)
  | (ResultBase &
      Readonly<{
        outcome: 'failed';
        reason: 'search-producer-rejected' | 'internal-error' | 'independent-replay-rejected';
        result: null;
      }>)
  | (ResultBase & Readonly<{ outcome: 'cancelled'; reason: 'aborted-by-caller'; result: null }>)
  | (ResultBase &
      Readonly<{
        outcome: 'protocol-failure';
        reason: 'invalid-request' | 'invalid-worker-response';
        result: null;
      }>)
  | (ResultBase &
      Readonly<{ outcome: 'execution-failure'; reason: 'worker-execution-error'; result: null }>);

export type RunEuclideanNecessaryWitnessSearchWorkerOptionsV1 = Readonly<{
  jobId: string;
  input: unknown;
  searchWorkerFactory: EuclideanNecessaryWitnessWorkerFactoryV1;
  validationWorkerFactory: EuclideanNecessaryWitnessWorkerFactoryV1;
  signal?: AbortSignal;
}>;

const LOCAL_BASE = {
  contractStatus: 'candidate' as const,
  scientificClaim: false as const,
  generalPolygonRiverPackingSolverIncluded: false as const,
  packingIncluded: false as const,
  feasibilityDecisionIncluded: false as const,
  globalM0fGo: false as const,
};
type TerminalPayload = EuclideanNecessaryWitnessTwoStageWorkerRunResultV1 extends infer Entry
  ? Entry extends ResultBase
    ? Omit<Entry, keyof ResultBase>
    : never
  : never;
function terminal(result: TerminalPayload): EuclideanNecessaryWitnessTwoStageWorkerRunResultV1 {
  return deepFreezeOwned({
    ...LOCAL_BASE,
    ...result,
  } as EuclideanNecessaryWitnessTwoStageWorkerRunResultV1);
}

export const EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT = terminal({
  outcome: 'cancelled',
  reason: 'aborted-by-caller',
  result: null,
});
export const EUCLIDEAN_NECESSARY_WITNESS_WORKER_INVALID_REQUEST_RESULT = terminal({
  outcome: 'protocol-failure',
  reason: 'invalid-request',
  result: null,
});
export const EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT = terminal({
  outcome: 'protocol-failure',
  reason: 'invalid-worker-response',
  result: null,
});
export const EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT = terminal({
  outcome: 'execution-failure',
  reason: 'worker-execution-error',
  result: null,
});

let validationSequence = 0n;
function nextValidationId(): string {
  validationSequence += 1n;
  return `validation:${validationSequence.toString(36)}`;
}

interface WorkerResource {
  readonly worker: EuclideanNecessaryWitnessWorkerLikeV1;
  readonly listeners: (readonly [
    EuclideanNecessaryWitnessWorkerEventTypeV1,
    EuclideanNecessaryWitnessWorkerListenerV1,
  ])[];
  terminated: boolean;
}

/**
 * Runs producer DFS and independent replay in two distinct Workers. No timeout
 * or main-thread traversal fallback exists; an AbortSignal is the silent-work exit.
 */
export function runEuclideanNecessaryWitnessSearchWorkerV1(
  options: RunEuclideanNecessaryWitnessSearchWorkerOptionsV1,
): Promise<EuclideanNecessaryWitnessTwoStageWorkerRunResultV1> {
  if (options.signal?.aborted === true) {
    return Promise.resolve(EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT);
  }
  const parsedRequest = parseEuclideanNecessaryWitnessSearchWorkerRequestV1({
    schemaVersion: 1,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId: options.jobId,
    input: options.input,
  });
  if (!parsedRequest.ok) {
    return Promise.resolve(EUCLIDEAN_NECESSARY_WITNESS_WORKER_INVALID_REQUEST_RESULT);
  }
  const searchRequest = parsedRequest.value;

  return new Promise((resolve) => {
    let stage: 'search' | 'validation' | 'settled' = 'search';
    let searchResource: WorkerResource | undefined;
    let validationResource: WorkerResource | undefined;
    let abortListenerInstalled = false;
    let validationRequest: EuclideanNecessaryWitnessValidationWorkerRequestV1 | undefined;
    let candidate: EuclideanNecessaryWitnessSearchResultV1 | undefined;
    const isSettled = (): boolean => stage === 'settled';
    const isSearchStage = (): boolean => stage === 'search';
    const isValidationStage = (): boolean => stage === 'validation';
    const isAborted = (): boolean => options.signal?.aborted === true;

    function cleanupResource(resource: WorkerResource | undefined): void {
      if (resource === undefined) return;
      for (const [type, listener] of resource.listeners.splice(0)) {
        try {
          resource.worker.removeEventListener(type, listener);
        } catch {
          // Cleanup host details never cross the protocol boundary.
        }
      }
      if (!resource.terminated) {
        resource.terminated = true;
        try {
          resource.worker.terminate();
        } catch {
          // Termination is best effort after its exactly-once invocation.
        }
      }
    }

    function removeAbortListener(): void {
      if (!abortListenerInstalled || options.signal === undefined) return;
      abortListenerInstalled = false;
      try {
        options.signal.removeEventListener('abort', onAbort);
      } catch {
        // Fixed terminal results deliberately hide host exception details.
      }
    }

    function settle(result: EuclideanNecessaryWitnessTwoStageWorkerRunResultV1): void {
      if (stage === 'settled') return;
      stage = 'settled';
      removeAbortListener();
      cleanupResource(searchResource);
      cleanupResource(validationResource);
      resolve(result);
    }

    function onAbort(): void {
      settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_CANCELLED_RESULT);
    }

    function install(
      resource: WorkerResource,
      type: EuclideanNecessaryWitnessWorkerEventTypeV1,
      listener: EuclideanNecessaryWitnessWorkerListenerV1,
    ): void {
      resource.listeners.push([type, listener]);
      resource.worker.addEventListener(type, listener);
    }

    function failed(
      reason: 'search-producer-rejected' | 'internal-error' | 'independent-replay-rejected',
    ) {
      return terminal({ outcome: 'failed', reason, result: null });
    }

    function startValidation(): void {
      if (stage !== 'validation') return;
      if (options.signal?.aborted === true) {
        onAbort();
        return;
      }
      if (candidate === undefined) {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
        return;
      }
      const parsed = parseEuclideanNecessaryWitnessValidationWorkerRequestV1({
        schemaVersion: 1,
        messageType: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE,
        operation: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
        contractStatus: 'candidate',
        scientificClaim: false,
        jobId: searchRequest.jobId,
        validationId: nextValidationId(),
        input: searchRequest.input,
        candidate,
      });
      if (!parsed.ok) {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
        return;
      }
      validationRequest = parsed.value;

      let worker: EuclideanNecessaryWitnessWorkerLikeV1;
      try {
        worker = options.validationWorkerFactory();
      } catch {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
        return;
      }
      const resource: WorkerResource = { worker, listeners: [], terminated: false };
      validationResource = resource;
      if (isSettled()) {
        cleanupResource(resource);
        return;
      }

      const onMessage: EuclideanNecessaryWitnessWorkerListenerV1 = (event): void => {
        if (stage !== 'validation' || validationRequest === undefined || candidate === undefined)
          return;
        try {
          const response = parseEuclideanNecessaryWitnessValidationWorkerResponseV1(event.data);
          if (
            !response.ok ||
            response.value.jobId !== validationRequest.jobId ||
            response.value.validationId !== validationRequest.validationId ||
            !equalEuclideanNecessaryWitnessWorkerSourceV1(
              response.value.sourceInput,
              validationRequest.input,
            )
          ) {
            settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
            return;
          }
          if (response.value.outcome === 'rejected') {
            settle(failed('independent-replay-rejected'));
            return;
          }
          if (stableStringify(response.value.result) !== stableStringify(candidate)) {
            settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
            return;
          }
          settle(terminal({ outcome: 'completed', reason: null, result: response.value.result }));
        } catch {
          settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
        }
      };
      const onError: EuclideanNecessaryWitnessWorkerListenerV1 = (): void => {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
      };
      const onMessageError: EuclideanNecessaryWitnessWorkerListenerV1 = (): void => {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
      };
      try {
        install(resource, 'message', onMessage);
        if (!isValidationStage()) return;
        install(resource, 'error', onError);
        if (!isValidationStage()) return;
        install(resource, 'messageerror', onMessageError);
        if (!isValidationStage()) return;
        if (isAborted()) {
          onAbort();
          return;
        }
        resource.worker.postMessage(validationRequest);
      } catch {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
      }
    }

    function startSearch(request: EuclideanNecessaryWitnessSearchWorkerRequestV1): void {
      if (options.signal?.aborted === true) {
        onAbort();
        return;
      }
      let worker: EuclideanNecessaryWitnessWorkerLikeV1;
      try {
        worker = options.searchWorkerFactory();
      } catch {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
        return;
      }
      const resource: WorkerResource = { worker, listeners: [], terminated: false };
      searchResource = resource;
      if (isSettled()) {
        cleanupResource(resource);
        return;
      }

      const onMessage: EuclideanNecessaryWitnessWorkerListenerV1 = (event): void => {
        if (stage !== 'search') return;
        try {
          const response = parseEuclideanNecessaryWitnessSearchWorkerResponseV1(event.data);
          if (
            !response.ok ||
            response.value.jobId !== request.jobId ||
            !equalEuclideanNecessaryWitnessWorkerSourceV1(response.value.sourceInput, request.input)
          ) {
            settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
            return;
          }
          if (response.value.outcome === 'failed') {
            settle(failed(response.value.reason));
            return;
          }
          if (
            response.value.candidate.maxVisitedStates !== request.input.maxVisitedStates ||
            response.value.candidate.maxWitnesses !== request.input.maxWitnesses ||
            stableStringify(response.value.candidate.semanticsReference) !==
              stableStringify(request.input.semantics)
          ) {
            settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
            return;
          }
          candidate = response.value.candidate;
          stage = 'validation';
          cleanupResource(searchResource);
          if (isSettled()) return;
          startValidation();
        } catch {
          settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
        }
      };
      const onError: EuclideanNecessaryWitnessWorkerListenerV1 = (): void => {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
      };
      const onMessageError: EuclideanNecessaryWitnessWorkerListenerV1 = (): void => {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_PROTOCOL_FAILURE_RESULT);
      };
      try {
        install(resource, 'message', onMessage);
        if (!isSearchStage()) return;
        install(resource, 'error', onError);
        if (!isSearchStage()) return;
        install(resource, 'messageerror', onMessageError);
        if (!isSearchStage()) return;
        resource.worker.postMessage(request);
      } catch {
        settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
      }
    }

    try {
      if (options.signal !== undefined) {
        abortListenerInstalled = true;
        options.signal.addEventListener('abort', onAbort, { once: true });
        if (options.signal.aborted) {
          onAbort();
          return;
        }
      }
      startSearch(searchRequest);
    } catch {
      settle(EUCLIDEAN_NECESSARY_WITNESS_WORKER_EXECUTION_FAILURE_RESULT);
    }
  });
}
