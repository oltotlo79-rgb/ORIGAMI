import { validatePolygonRiverPackingProblemResultV1 } from '../box-pleating/polygon-river-packing-problem-result-validation.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import { stableStringify } from '../stable-json.js';
import {
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
  parseCandidatePolygonRiverPackingProblemWorkerRequestV1,
  parseCandidatePolygonRiverPackingProblemWorkerResponseV1,
  type CandidatePolygonRiverPackingProblemWorkerRequestV1,
  type CandidatePolygonRiverPackingProblemWorkerResponseV1,
} from './polygon-river-packing-problem-protocol.js';

export type PolygonRiverPackingProblemWorkerEventTypeV1 = 'message' | 'error' | 'messageerror';
export type PolygonRiverPackingProblemWorkerEventV1 = Readonly<{ data?: unknown }>;
export type PolygonRiverPackingProblemWorkerEventListenerV1 = (
  event: PolygonRiverPackingProblemWorkerEventV1,
) => void;

/** Minimal one-message Worker surface; requests have no transfer list. */
export interface PolygonRiverPackingProblemWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: PolygonRiverPackingProblemWorkerEventTypeV1,
    listener: PolygonRiverPackingProblemWorkerEventListenerV1,
  ): void;
  removeEventListener(
    type: PolygonRiverPackingProblemWorkerEventTypeV1,
    listener: PolygonRiverPackingProblemWorkerEventListenerV1,
  ): void;
}

export type PolygonRiverPackingProblemWorkerFactoryV1 =
  () => PolygonRiverPackingProblemWorkerLikeV1;

type LocalResultBaseV1 = Readonly<{
  contractStatus: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM;
  result: null;
}>;

export type CancelledPolygonRiverPackingProblemWorkerRunV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'cancelled'; reason: 'aborted-by-caller' }>;
export type PolygonRiverPackingProblemWorkerRequestFailureV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'protocol-failure'; reason: 'invalid-request' }>;
export type PolygonRiverPackingProblemWorkerProtocolFailureV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'protocol-failure'; reason: 'invalid-worker-response' }>;
export type PolygonRiverPackingProblemWorkerExecutionFailureV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'execution-failure'; reason: 'worker-execution-error' }>;

export type LocalPolygonRiverPackingProblemWorkerRunResultV1 =
  | CancelledPolygonRiverPackingProblemWorkerRunV1
  | PolygonRiverPackingProblemWorkerRequestFailureV1
  | PolygonRiverPackingProblemWorkerProtocolFailureV1
  | PolygonRiverPackingProblemWorkerExecutionFailureV1;

export type PolygonRiverPackingProblemWorkerRunResultV1 =
  | CandidatePolygonRiverPackingProblemWorkerResponseV1
  | LocalPolygonRiverPackingProblemWorkerRunResultV1;

export type RunPolygonRiverPackingProblemWorkerOptionsV1 = Readonly<{
  jobId: string;
  input: unknown;
  workerFactory: PolygonRiverPackingProblemWorkerFactoryV1;
  signal?: AbortSignal;
}>;

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT: CancelledPolygonRiverPackingProblemWorkerRunV1 =
  deepFreezeOwned({
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    result: null,
  });

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_INVALID_REQUEST_RESULT: PolygonRiverPackingProblemWorkerRequestFailureV1 =
  deepFreezeOwned({
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'protocol-failure',
    reason: 'invalid-request',
    result: null,
  });

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT: PolygonRiverPackingProblemWorkerProtocolFailureV1 =
  deepFreezeOwned({
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'protocol-failure',
    reason: 'invalid-worker-response',
    result: null,
  });

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT: PolygonRiverPackingProblemWorkerExecutionFailureV1 =
  deepFreezeOwned({
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'execution-failure',
    reason: 'worker-execution-error',
    result: null,
  });

function runPreparedPolygonRiverPackingProblemWorkerV1(
  request: CandidatePolygonRiverPackingProblemWorkerRequestV1,
  workerFactory: PolygonRiverPackingProblemWorkerFactoryV1,
  signal?: AbortSignal,
): Promise<PolygonRiverPackingProblemWorkerRunResultV1> {
  if (signal?.aborted === true) {
    return Promise.resolve(POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT);
  }

  let worker: PolygonRiverPackingProblemWorkerLikeV1;
  try {
    worker = workerFactory();
  } catch {
    return Promise.resolve(POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT);
  }

  return new Promise((resolve) => {
    let settled = false;
    let terminated = false;
    let abortListenerInstalled = false;
    const listeners: (readonly [
      PolygonRiverPackingProblemWorkerEventTypeV1,
      PolygonRiverPackingProblemWorkerEventListenerV1,
    ])[] = [];

    function removeListeners(): void {
      for (const [type, listener] of listeners) {
        try {
          worker.removeEventListener(type, listener);
        } catch {
          // Best-effort cleanup never changes the fixed public result.
        }
      }
      listeners.length = 0;
      if (signal !== undefined && abortListenerInstalled) {
        abortListenerInstalled = false;
        try {
          signal.removeEventListener('abort', onAbort);
        } catch {
          // Host exception details are deliberately not exposed.
        }
      }
    }

    function terminateOnce(): void {
      if (terminated) return;
      terminated = true;
      try {
        worker.terminate();
      } catch {
        // Termination failure cannot alter the chosen result.
      }
    }

    function settle(result: PolygonRiverPackingProblemWorkerRunResultV1): void {
      if (settled) return;
      settled = true;
      removeListeners();
      terminateOnce();
      resolve(result);
    }

    const onMessage: PolygonRiverPackingProblemWorkerEventListenerV1 = (event): void => {
      if (settled) return;
      try {
        const parsed = parseCandidatePolygonRiverPackingProblemWorkerResponseV1(event.data);
        if (!parsed.ok) {
          settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
          return;
        }
        if (parsed.value.jobId !== request.jobId) {
          settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
          return;
        }
        if (stableStringify(parsed.value.sourceInput) !== stableStringify(request.input)) {
          settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
          return;
        }
        if (parsed.value.outcome === 'completed') {
          const independent = validatePolygonRiverPackingProblemResultV1(
            request.input,
            parsed.value.result,
          );
          if (!independent.ok) {
            settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
            return;
          }
        }
        settle(parsed.value);
      } catch {
        settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
      }
    };

    const onError: PolygonRiverPackingProblemWorkerEventListenerV1 = (): void => {
      settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT);
    };
    const onMessageError: PolygonRiverPackingProblemWorkerEventListenerV1 = (): void => {
      settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_FAILURE_RESULT);
    };
    function onAbort(): void {
      settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT);
    }

    function install(
      type: PolygonRiverPackingProblemWorkerEventTypeV1,
      listener: PolygonRiverPackingProblemWorkerEventListenerV1,
    ): void {
      listeners.push([type, listener]);
      worker.addEventListener(type, listener);
    }

    const wasSettledReentrantly = (): boolean => settled;
    try {
      install('message', onMessage);
      if (wasSettledReentrantly()) return;
      install('error', onError);
      if (wasSettledReentrantly()) return;
      install('messageerror', onMessageError);
      if (wasSettledReentrantly()) return;
      if (signal !== undefined) {
        abortListenerInstalled = true;
        signal.addEventListener('abort', onAbort, { once: true });
        if (wasSettledReentrantly()) return;
        if (signal.aborted) {
          onAbort();
          return;
        }
      }
      worker.postMessage(request);
    } catch {
      settle(POLYGON_RIVER_PACKING_PROBLEM_WORKER_EXECUTION_FAILURE_RESULT);
    }
  });
}

/**
 * Runs one finite-problem build in one Worker. There is intentionally no
 * forced timeout; caller cancellation is the only silent-work escape hatch.
 */
export function runPolygonRiverPackingProblemWorkerV1(
  options: RunPolygonRiverPackingProblemWorkerOptionsV1,
): Promise<PolygonRiverPackingProblemWorkerRunResultV1> {
  if (options.signal?.aborted === true) {
    return Promise.resolve(POLYGON_RIVER_PACKING_PROBLEM_WORKER_CANCELLED_RESULT);
  }

  const request = parseCandidatePolygonRiverPackingProblemWorkerRequestV1({
    schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE,
    operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    jobId: options.jobId,
    input: options.input,
  });
  if (!request.ok) {
    return Promise.resolve(POLYGON_RIVER_PACKING_PROBLEM_WORKER_INVALID_REQUEST_RESULT);
  }

  return runPreparedPolygonRiverPackingProblemWorkerV1(
    request.value,
    options.workerFactory,
    options.signal,
  );
}
