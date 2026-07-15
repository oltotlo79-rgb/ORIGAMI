import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
  equalAffineOriginRotationSweptAabbCensusWorkerSourceV1,
  parseAffineOriginRotationSweptAabbCensusWorkerRequestV1,
  parseAffineOriginRotationSweptAabbCensusWorkerResponseV1,
  type AffineOriginRotationSweptAabbCensusWorkerResponseV1,
} from './affine-origin-rotation-swept-aabb-census-worker-protocol.js';

export type AffineOriginRotationSweptAabbCensusWorkerEventTypeV1 =
  'message' | 'error' | 'messageerror';
export type AffineOriginRotationSweptAabbCensusWorkerEventListenerV1 = (
  event: Readonly<{ data?: unknown }>,
) => void;

export interface AffineOriginRotationSweptAabbCensusWorkerLikeV1 {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(
    type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
    listener: AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
  ): void;
  removeEventListener(
    type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
    listener: AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
  ): void;
}

export type AffineOriginRotationSweptAabbCensusWorkerFactoryV1 =
  () => AffineOriginRotationSweptAabbCensusWorkerLikeV1;

type LocalResultBase = Readonly<{
  contractStatus: 'candidate-no-claim';
  broadPhaseOnly: true;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  verified: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

type LocalRunResultV1 = LocalResultBase &
  (
    | Readonly<{ outcome: 'cancelled'; reason: 'aborted-by-caller'; result: null }>
    | Readonly<{
        outcome: 'protocol-failure';
        reason: 'invalid-request' | 'invalid-worker-response';
        result: null;
      }>
    | Readonly<{
        outcome: 'execution-failure';
        reason: 'worker-execution-error';
        result: null;
      }>
  );

export type AffineOriginRotationSweptAabbCensusWorkerRunResultV1 =
  AffineOriginRotationSweptAabbCensusWorkerResponseV1 | LocalRunResultV1;

export type RunAffineOriginRotationSweptAabbCensusWorkerOptionsV1 = Readonly<{
  sourceId: string;
  jobId: string;
  input: unknown;
  workerFactory: AffineOriginRotationSweptAabbCensusWorkerFactoryV1;
  signal?: AbortSignal;
}>;

const LOCAL_BASE = Object.freeze({
  contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
  broadPhaseOnly: true as const,
  continuousCollisionDetectionIncluded: false as const,
  collisionFreeClaim: false as const,
  legalContactClassificationIncluded: false as const,
  penetrationClassificationIncluded: false as const,
  selfIntersectionClassificationIncluded: false as const,
  verified: false as const,
  verifiedClaim: false as const,
  scientificClaim: false as const,
  globalM0fGo: false as const,
});

function localResult(
  terminal:
    | Readonly<{ outcome: 'cancelled'; reason: 'aborted-by-caller'; result: null }>
    | Readonly<{
        outcome: 'protocol-failure';
        reason: 'invalid-request' | 'invalid-worker-response';
        result: null;
      }>
    | Readonly<{
        outcome: 'execution-failure';
        reason: 'worker-execution-error';
        result: null;
      }>,
): LocalRunResultV1 {
  return deepFreezeOwned({ ...LOCAL_BASE, ...terminal });
}

export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CANCELLED_RESULT = localResult({
  outcome: 'cancelled',
  reason: 'aborted-by-caller',
  result: null,
});
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_INVALID_REQUEST_RESULT = localResult({
  outcome: 'protocol-failure',
  reason: 'invalid-request',
  result: null,
});
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT = localResult({
  outcome: 'protocol-failure',
  reason: 'invalid-worker-response',
  result: null,
});
export const AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT = localResult(
  {
    outcome: 'execution-failure',
    reason: 'worker-execution-error',
    result: null,
  },
);

type RunnerState = 'starting' | 'waiting' | 'closing' | 'settled';

/**
 * Runs exactly one census in exactly one Worker. There is no timeout, progress
 * fabrication, or main-thread census fallback; AbortSignal terminates silence.
 */
export function runAffineOriginRotationSweptAabbCensusWorkerV1(
  options: RunAffineOriginRotationSweptAabbCensusWorkerOptionsV1,
): Promise<AffineOriginRotationSweptAabbCensusWorkerRunResultV1> {
  if (options.signal?.aborted === true) {
    return Promise.resolve(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CANCELLED_RESULT);
  }
  const parsedRequest = parseAffineOriginRotationSweptAabbCensusWorkerRequestV1({
    schemaVersion: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_SCHEMA_VERSION,
    recordType: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_REQUEST_RECORD_TYPE,
    operation: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_OPERATION,
    contractStatus: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CONTRACT_STATUS,
    scientificClaim: false,
    sourceId: options.sourceId,
    jobId: options.jobId,
    input: options.input,
  });
  if (!parsedRequest.ok) {
    return Promise.resolve(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_INVALID_REQUEST_RESULT);
  }
  const request = parsedRequest.value;

  return new Promise((resolve) => {
    let state: RunnerState = 'starting';
    let worker: AffineOriginRotationSweptAabbCensusWorkerLikeV1 | undefined;
    let workerTerminated = false;
    let abortListenerInstalled = false;
    let provisional: AffineOriginRotationSweptAabbCensusWorkerResponseV1 | undefined;
    const listeners: (readonly [
      AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
      AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
    ])[] = [];
    const isSettled = (): boolean => state === 'settled';
    const isAborted = (): boolean => options.signal?.aborted === true;

    function removeAbortListener(): void {
      if (!abortListenerInstalled || options.signal === undefined) return;
      abortListenerInstalled = false;
      try {
        options.signal.removeEventListener('abort', onAbort);
      } catch {
        // Host cleanup details do not cross the fixed result boundary.
      }
    }

    function cleanupWorker(): void {
      if (worker === undefined) return;
      for (const [type, listener] of listeners.splice(0)) {
        try {
          worker.removeEventListener(type, listener);
        } catch {
          // Host cleanup details do not cross the fixed result boundary.
        }
      }
      if (workerTerminated) return;
      workerTerminated = true;
      try {
        worker.terminate();
      } catch {
        // Termination remains exactly-once even if the host reports failure.
      }
    }

    function settle(result: AffineOriginRotationSweptAabbCensusWorkerRunResultV1): void {
      if (state === 'settled') return;
      state = 'settled';
      removeAbortListener();
      cleanupWorker();
      resolve(result);
    }

    function onAbort(): void {
      if (state === 'settled') return;
      if (state === 'closing' && provisional !== undefined) {
        settle(provisional);
        return;
      }
      settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_CANCELLED_RESULT);
    }

    function onMessage(event: Readonly<{ data?: unknown }>): void {
      if (state === 'settled') return;
      if (state === 'closing') {
        settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT);
        return;
      }
      if (state !== 'waiting') {
        settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT);
        return;
      }
      const parsedResponse = parseAffineOriginRotationSweptAabbCensusWorkerResponseV1(event.data);
      if (
        !parsedResponse.ok ||
        parsedResponse.value.jobId !== request.jobId ||
        !equalAffineOriginRotationSweptAabbCensusWorkerSourceV1(
          {
            sourceId: parsedResponse.value.sourceId,
            input: parsedResponse.value.sourceInput,
          },
          { sourceId: request.sourceId, input: request.input },
        )
      ) {
        settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT);
        return;
      }

      provisional = parsedResponse.value;
      state = 'closing';
      queueMicrotask(() => {
        if (state === 'closing' && provisional !== undefined) settle(provisional);
      });
    }

    function onError(): void {
      if (state === 'settled') return;
      settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT);
    }

    function onMessageError(): void {
      if (state === 'settled') return;
      settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_PROTOCOL_FAILURE_RESULT);
    }

    function install(
      type: AffineOriginRotationSweptAabbCensusWorkerEventTypeV1,
      listener: AffineOriginRotationSweptAabbCensusWorkerEventListenerV1,
    ): void {
      if (worker === undefined) throw new TypeError('worker unavailable');
      listeners.push([type, listener]);
      worker.addEventListener(type, listener);
    }

    try {
      worker = options.workerFactory();
      install('message', onMessage);
      if (isSettled()) return;
      install('error', onError);
      if (isSettled()) return;
      install('messageerror', onMessageError);
      if (isSettled()) return;
      if (options.signal !== undefined) {
        abortListenerInstalled = true;
        options.signal.addEventListener('abort', onAbort, { once: true });
        if (isSettled()) return;
      }
      if (options.signal?.aborted === true) {
        onAbort();
        return;
      }
      state = 'waiting';
      worker.postMessage(request);
      if (!isSettled() && isAborted()) onAbort();
    } catch {
      settle(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_WORKER_EXECUTION_FAILURE_RESULT);
    }
  });
}
