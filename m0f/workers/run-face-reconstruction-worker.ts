import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateFoldFaceReconstructionWorkerRequestV1,
  parseCandidateFoldFaceReconstructionWorkerResponseV1,
  type CandidateFoldFaceReconstructionWorkerResponseV1,
} from './face-reconstruction-protocol.js';

export type FaceReconstructionWorkerEventTypeV1 = 'message' | 'error' | 'messageerror';

export type FaceReconstructionWorkerEventV1 = Readonly<{ data?: unknown }>;

export type FaceReconstructionWorkerEventListenerV1 = (
  event: FaceReconstructionWorkerEventV1,
) => void;

/** The deliberately small surface needed from a browser Worker or a test double. */
export interface FaceReconstructionWorkerLikeV1 {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  addEventListener(
    type: FaceReconstructionWorkerEventTypeV1,
    listener: FaceReconstructionWorkerEventListenerV1,
  ): void;
  removeEventListener(
    type: FaceReconstructionWorkerEventTypeV1,
    listener: FaceReconstructionWorkerEventListenerV1,
  ): void;
}

export type FaceReconstructionWorkerFactoryV1 = () => FaceReconstructionWorkerLikeV1;

type LocalResultBaseV1 = Readonly<{
  contractStatus: typeof FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM;
  result: null;
}>;

export type CancelledFaceReconstructionWorkerRunV1 = LocalResultBaseV1 &
  Readonly<{
    outcome: 'cancelled';
    reason: 'aborted-by-caller';
  }>;

export type FaceReconstructionWorkerRequestFailureV1 = LocalResultBaseV1 &
  Readonly<{
    outcome: 'protocol-failure';
    reason: 'invalid-request';
  }>;

export type FaceReconstructionWorkerProtocolFailureV1 = LocalResultBaseV1 &
  Readonly<{
    outcome: 'protocol-failure';
    reason: 'invalid-worker-response';
  }>;

export type FaceReconstructionWorkerExecutionFailureV1 = LocalResultBaseV1 &
  Readonly<{
    outcome: 'execution-failure';
    reason: 'worker-execution-error';
  }>;

export type LocalFaceReconstructionWorkerRunResultV1 =
  | CancelledFaceReconstructionWorkerRunV1
  | FaceReconstructionWorkerRequestFailureV1
  | FaceReconstructionWorkerProtocolFailureV1
  | FaceReconstructionWorkerExecutionFailureV1;

export type FaceReconstructionWorkerRunResultV1 =
  CandidateFoldFaceReconstructionWorkerResponseV1 | LocalFaceReconstructionWorkerRunResultV1;

export type RunFaceReconstructionWorkerOptionsV1 = Readonly<{
  jobId: string;
  input: unknown;
  workerFactory: FaceReconstructionWorkerFactoryV1;
  signal?: AbortSignal;
}>;

export const FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT: CancelledFaceReconstructionWorkerRunV1 =
  deepFreezeOwned({
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'cancelled',
    reason: 'aborted-by-caller',
    result: null,
  });

export const FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT: FaceReconstructionWorkerRequestFailureV1 =
  deepFreezeOwned({
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'protocol-failure',
    reason: 'invalid-request',
    result: null,
  });

export const FACE_RECONSTRUCTION_WORKER_PROTOCOL_FAILURE_RESULT: FaceReconstructionWorkerProtocolFailureV1 =
  deepFreezeOwned({
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'protocol-failure',
    reason: 'invalid-worker-response',
    result: null,
  });

export const FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT: FaceReconstructionWorkerExecutionFailureV1 =
  deepFreezeOwned({
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    outcome: 'execution-failure',
    reason: 'worker-execution-error',
    result: null,
  });

/**
 * Shared one-job transport lifecycle. Callers must validate and prepare the
 * request before entering this function. A transfer list is consumed by the
 * browser's postMessage operation; no timeout is introduced here.
 */
export function runPreparedFaceReconstructionWorkerV1(
  jobId: string,
  message: unknown,
  workerFactory: FaceReconstructionWorkerFactoryV1,
  signal?: AbortSignal,
  transfer?: Transferable[],
): Promise<FaceReconstructionWorkerRunResultV1> {
  if (signal?.aborted === true) {
    return Promise.resolve(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
  }

  let worker: FaceReconstructionWorkerLikeV1;
  try {
    worker = workerFactory();
  } catch {
    return Promise.resolve(FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT);
  }

  return new Promise((resolve) => {
    let settled = false;
    let terminated = false;
    let abortListenerInstalled = false;
    const workerListeners: (readonly [
      FaceReconstructionWorkerEventTypeV1,
      FaceReconstructionWorkerEventListenerV1,
    ])[] = [];

    const removeListeners = (): void => {
      for (const [type, listener] of workerListeners) {
        try {
          worker.removeEventListener(type, listener);
        } catch {
          // Cleanup is best-effort and must not replace an already chosen result.
        }
      }
      workerListeners.length = 0;
      if (signal !== undefined && abortListenerInstalled) {
        abortListenerInstalled = false;
        try {
          signal.removeEventListener('abort', onAbort);
        } catch {
          // Cleanup is best-effort and must not expose host exception text.
        }
      }
    };

    const terminateOnce = (): void => {
      if (terminated) return;
      terminated = true;
      try {
        worker.terminate();
      } catch {
        // Termination failure cannot change the fixed public outcome.
      }
    };

    const settle = (result: FaceReconstructionWorkerRunResultV1): void => {
      if (settled) return;
      settled = true;
      removeListeners();
      terminateOnce();
      resolve(result);
    };

    const onMessage: FaceReconstructionWorkerEventListenerV1 = (event): void => {
      if (settled) return;
      try {
        const parsedResponse = parseCandidateFoldFaceReconstructionWorkerResponseV1(
          messageData(event),
        );
        if (!parsedResponse.ok) {
          settle(FACE_RECONSTRUCTION_WORKER_PROTOCOL_FAILURE_RESULT);
          return;
        }
        if (parsedResponse.value.jobId !== jobId) return;
        settle(parsedResponse.value);
      } catch {
        settle(FACE_RECONSTRUCTION_WORKER_PROTOCOL_FAILURE_RESULT);
      }
    };

    const onError: FaceReconstructionWorkerEventListenerV1 = (): void => {
      settle(FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT);
    };

    const onMessageError: FaceReconstructionWorkerEventListenerV1 = (): void => {
      settle(FACE_RECONSTRUCTION_WORKER_PROTOCOL_FAILURE_RESULT);
    };

    function onAbort(): void {
      settle(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
    }

    const installWorkerListener = (
      type: FaceReconstructionWorkerEventTypeV1,
      listener: FaceReconstructionWorkerEventListenerV1,
    ): void => {
      workerListeners.push([type, listener]);
      worker.addEventListener(type, listener);
    };

    // Injected test doubles and monkey-patched host objects may synchronously
    // dispatch while a listener is being registered. Native Workers do not,
    // but the transport still closes this reentrancy window.
    const wasSettledReentrantly = (): boolean => settled;

    try {
      installWorkerListener('message', onMessage);
      if (wasSettledReentrantly()) return;
      installWorkerListener('error', onError);
      if (wasSettledReentrantly()) return;
      installWorkerListener('messageerror', onMessageError);
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
      if (transfer === undefined) worker.postMessage(message);
      else worker.postMessage(message, transfer);
    } catch {
      settle(FACE_RECONSTRUCTION_WORKER_EXECUTION_FAILURE_RESULT);
    }
  });
}

function messageData(event: FaceReconstructionWorkerEventV1): unknown {
  return event.data;
}

/**
 * Runs exactly one face-reconstruction job in exactly one injected worker.
 * There is intentionally no timeout: cancellation is controlled only by the
 * caller's AbortSignal, and every terminal path owns worker cleanup.
 */
export function runFaceReconstructionWorkerV1(
  options: RunFaceReconstructionWorkerOptionsV1,
): Promise<FaceReconstructionWorkerRunResultV1> {
  const signal = options.signal;
  if (signal?.aborted === true) {
    return Promise.resolve(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
  }

  const parsedRequest = parseCandidateFoldFaceReconstructionWorkerRequestV1({
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId: options.jobId,
    input: options.input,
  });
  if (!parsedRequest.ok) {
    return Promise.resolve(FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT);
  }

  return runPreparedFaceReconstructionWorkerV1(
    parsedRequest.value.jobId,
    parsedRequest.value,
    options.workerFactory,
    signal,
  );
}
