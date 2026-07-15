import {
  searchEuclideanNecessaryWitnessesV1,
  type EuclideanNecessaryWitnessSearchEvaluationResult,
} from '../box-pleating/euclidean-necessary-witness-search.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE,
  parseEuclideanNecessaryWitnessSearchWorkerRequestV1,
  parseEuclideanNecessaryWitnessSearchWorkerResponseV1,
  type EuclideanNecessaryWitnessSearchWorkerRequestV1,
  type EuclideanNecessaryWitnessSearchWorkerResponseV1,
  type EuclideanNecessaryWitnessSearchWorkerFailureReasonV1,
} from './euclidean-necessary-witness-search-worker-protocol.js';

export type EuclideanNecessaryWitnessSearchProducerV1 = (
  input: EuclideanNecessaryWitnessSearchWorkerRequestV1['input'],
) => EuclideanNecessaryWitnessSearchEvaluationResult;

function responseBase(request: EuclideanNecessaryWitnessSearchWorkerRequestV1) {
  return {
    schemaVersion: 1 as const,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    generalPolygonRiverPackingSolverIncluded: false as const,
    packingIncluded: false as const,
    feasibilityDecisionIncluded: false as const,
    globalM0fGo: false as const,
    jobId: request.jobId,
    sourceInput: request.input,
  };
}

function failed(
  request: EuclideanNecessaryWitnessSearchWorkerRequestV1,
  reason: EuclideanNecessaryWitnessSearchWorkerFailureReasonV1,
): EuclideanNecessaryWitnessSearchWorkerResponseV1 {
  return deepFreezeOwned({
    ...responseBase(request),
    outcome: 'failed' as const,
    reason,
    candidate: null,
  });
}

/** Invalid first messages are consumed silently because their IDs are untrusted. */
export function executeEuclideanNecessaryWitnessSearchWorkerMessageV1(
  supplied: unknown,
  producer: EuclideanNecessaryWitnessSearchProducerV1 = searchEuclideanNecessaryWitnessesV1,
): EuclideanNecessaryWitnessSearchWorkerResponseV1 | undefined {
  let request: EuclideanNecessaryWitnessSearchWorkerRequestV1 | undefined;
  try {
    const parsed = parseEuclideanNecessaryWitnessSearchWorkerRequestV1(supplied);
    if (!parsed.ok) return undefined;
    request = parsed.value;
    const produced = producer(request.input);
    if (!produced.ok) return failed(request, 'search-producer-rejected');
    const response = parseEuclideanNecessaryWitnessSearchWorkerResponseV1({
      ...responseBase(request),
      outcome: 'candidate-produced',
      reason: null,
      candidate: produced.value,
    });
    return response.ok ? response.value : failed(request, 'internal-error');
  } catch {
    return request === undefined ? undefined : failed(request, 'internal-error');
  }
}
