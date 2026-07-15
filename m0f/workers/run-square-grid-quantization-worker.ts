import { deepFreezeOwned } from '../clone-and-freeze.js';
import { stableStringify } from '../stable-json.js';
import {
  SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
  SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
  SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
  SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateSquareGridQuantizationWorkerRequestV1,
  parseCandidateSquareGridQuantizationWorkerResponseV1,
  type CandidateSquareGridQuantizationWorkerRequestV1,
  type CandidateSquareGridQuantizationWorkerResponseV1,
} from './square-grid-quantization-protocol.js';

export type SquareGridQuantizationWorkerEventTypeV1 = 'message' | 'error' | 'messageerror';
export type SquareGridQuantizationWorkerEventV1 = Readonly<{ data?: unknown }>;
export type SquareGridQuantizationWorkerEventListenerV1 = (
  event: SquareGridQuantizationWorkerEventV1,
) => void;

/** Minimal one-message Worker surface; square-grid requests have no transfer list. */
export interface SquareGridQuantizationWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: SquareGridQuantizationWorkerEventTypeV1,
    listener: SquareGridQuantizationWorkerEventListenerV1,
  ): void;
  removeEventListener(
    type: SquareGridQuantizationWorkerEventTypeV1,
    listener: SquareGridQuantizationWorkerEventListenerV1,
  ): void;
}

export type SquareGridQuantizationWorkerFactoryV1 = () => SquareGridQuantizationWorkerLikeV1;

type LocalResultBaseV1 = Readonly<{
  contractStatus: typeof SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM;
  result: null;
}>;

export type CancelledSquareGridQuantizationWorkerRunV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'cancelled'; reason: 'aborted-by-caller' }>;
export type SquareGridQuantizationWorkerRequestFailureV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'protocol-failure'; reason: 'invalid-request' }>;
export type SquareGridQuantizationWorkerProtocolFailureV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'protocol-failure'; reason: 'invalid-worker-response' }>;
export type SquareGridQuantizationWorkerExecutionFailureV1 = LocalResultBaseV1 &
  Readonly<{ outcome: 'execution-failure'; reason: 'worker-execution-error' }>;

export type LocalSquareGridQuantizationWorkerRunResultV1 =
  | CancelledSquareGridQuantizationWorkerRunV1
  | SquareGridQuantizationWorkerRequestFailureV1
  | SquareGridQuantizationWorkerProtocolFailureV1
  | SquareGridQuantizationWorkerExecutionFailureV1;

export type SquareGridQuantizationWorkerRunResultV1 =
  CandidateSquareGridQuantizationWorkerResponseV1 | LocalSquareGridQuantizationWorkerRunResultV1;

export type RunSquareGridQuantizationWorkerOptionsV1 = Readonly<{
  jobId: string;
  input: unknown;
  workerFactory: SquareGridQuantizationWorkerFactoryV1;
  signal?: AbortSignal;
}>;

export const SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT: CancelledSquareGridQuantizationWorkerRunV1 =
  deepFreezeOwned({
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    result: null,
  });

export const SQUARE_GRID_QUANTIZATION_WORKER_INVALID_REQUEST_RESULT: SquareGridQuantizationWorkerRequestFailureV1 =
  deepFreezeOwned({
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'protocol-failure',
    reason: 'invalid-request',
    result: null,
  });

export const SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT: SquareGridQuantizationWorkerProtocolFailureV1 =
  deepFreezeOwned({
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'protocol-failure',
    reason: 'invalid-worker-response',
    result: null,
  });

export const SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT: SquareGridQuantizationWorkerExecutionFailureV1 =
  deepFreezeOwned({
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'execution-failure',
    reason: 'worker-execution-error',
    result: null,
  });

function eventData(event: SquareGridQuantizationWorkerEventV1): unknown {
  return event.data;
}

function runPreparedSquareGridQuantizationWorkerV1(
  jobId: string,
  sourceInput: CandidateSquareGridQuantizationWorkerRequestV1['input'],
  message: unknown,
  workerFactory: SquareGridQuantizationWorkerFactoryV1,
  signal?: AbortSignal,
): Promise<SquareGridQuantizationWorkerRunResultV1> {
  if (signal?.aborted === true) {
    return Promise.resolve(SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT);
  }

  let worker: SquareGridQuantizationWorkerLikeV1;
  try {
    worker = workerFactory();
  } catch {
    return Promise.resolve(SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT);
  }

  return new Promise((resolve) => {
    let settled = false;
    let terminated = false;
    let abortListenerInstalled = false;
    const listeners: (readonly [
      SquareGridQuantizationWorkerEventTypeV1,
      SquareGridQuantizationWorkerEventListenerV1,
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

    function settle(result: SquareGridQuantizationWorkerRunResultV1): void {
      if (settled) return;
      settled = true;
      removeListeners();
      terminateOnce();
      resolve(result);
    }

    const onMessage: SquareGridQuantizationWorkerEventListenerV1 = (event): void => {
      if (settled) return;
      try {
        const parsed = parseCandidateSquareGridQuantizationWorkerResponseV1(eventData(event));
        if (!parsed.ok) {
          settle(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
          return;
        }
        if (parsed.value.jobId !== jobId) return;
        if (stableStringify(parsed.value.sourceInput) !== stableStringify(sourceInput)) {
          settle(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
          return;
        }
        settle(parsed.value);
      } catch {
        settle(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
      }
    };

    const onError: SquareGridQuantizationWorkerEventListenerV1 = (): void => {
      settle(SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT);
    };
    const onMessageError: SquareGridQuantizationWorkerEventListenerV1 = (): void => {
      settle(SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_FAILURE_RESULT);
    };
    function onAbort(): void {
      settle(SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT);
    }

    function install(
      type: SquareGridQuantizationWorkerEventTypeV1,
      listener: SquareGridQuantizationWorkerEventListenerV1,
    ): void {
      listeners.push([type, listener]);
      worker.addEventListener(type, listener);
    }

    // Test doubles can dispatch synchronously during registration even though
    // native Workers do not. Keep the lifecycle closed under that reentrancy.
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
      worker.postMessage(message);
    } catch {
      settle(SQUARE_GRID_QUANTIZATION_WORKER_EXECUTION_FAILURE_RESULT);
    }
  });
}

/**
 * Runs one quantization job in one worker. There is no timeout; only the
 * caller's AbortSignal terminates synchronous enumeration early.
 */
export function runSquareGridQuantizationWorkerV1(
  options: RunSquareGridQuantizationWorkerOptionsV1,
): Promise<SquareGridQuantizationWorkerRunResultV1> {
  if (options.signal?.aborted === true) {
    return Promise.resolve(SQUARE_GRID_QUANTIZATION_WORKER_CANCELLED_RESULT);
  }

  const request = parseCandidateSquareGridQuantizationWorkerRequestV1({
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId: options.jobId,
    input: options.input,
  });
  if (!request.ok) {
    return Promise.resolve(SQUARE_GRID_QUANTIZATION_WORKER_INVALID_REQUEST_RESULT);
  }

  return runPreparedSquareGridQuantizationWorkerV1(
    request.value.jobId,
    request.value.input,
    request.value,
    options.workerFactory,
    options.signal,
  );
}
