import {
  validateEuclideanNecessaryWitnessSearchResultV1,
  type EuclideanNecessaryWitnessSearchResultValidationV1,
} from '../box-pleating/euclidean-necessary-witness-search-result-validation.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE,
  parseEuclideanNecessaryWitnessValidationWorkerRequestV1,
  parseEuclideanNecessaryWitnessValidationWorkerResponseV1,
  type EuclideanNecessaryWitnessValidationWorkerRequestV1,
  type EuclideanNecessaryWitnessValidationWorkerResponseV1,
} from './euclidean-necessary-witness-validation-worker-protocol.js';

export type EuclideanNecessaryWitnessIndependentValidatorV1 = (
  input: unknown,
  candidate: unknown,
) => EuclideanNecessaryWitnessSearchResultValidationV1;

function base(request: EuclideanNecessaryWitnessValidationWorkerRequestV1) {
  return {
    schemaVersion: 1 as const,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    independentReplayPerformed: true as const,
    generalPolygonRiverPackingSolverIncluded: false as const,
    packingIncluded: false as const,
    feasibilityDecisionIncluded: false as const,
    globalM0fGo: false as const,
    jobId: request.jobId,
    validationId: request.validationId,
    sourceInput: request.input,
  };
}

function rejected(
  request: EuclideanNecessaryWitnessValidationWorkerRequestV1,
): EuclideanNecessaryWitnessValidationWorkerResponseV1 {
  return deepFreezeOwned({
    ...base(request),
    outcome: 'rejected' as const,
    reason: 'independent-replay-rejected' as const,
    result: null,
  });
}

/** Exactly one independent replay is attempted for each trusted request. */
export function executeEuclideanNecessaryWitnessValidationWorkerMessageV1(
  supplied: unknown,
  validator: EuclideanNecessaryWitnessIndependentValidatorV1 = validateEuclideanNecessaryWitnessSearchResultV1,
): EuclideanNecessaryWitnessValidationWorkerResponseV1 | undefined {
  let request: EuclideanNecessaryWitnessValidationWorkerRequestV1 | undefined;
  try {
    const parsed = parseEuclideanNecessaryWitnessValidationWorkerRequestV1(supplied);
    if (!parsed.ok) return undefined;
    request = parsed.value;
    const validation = validator(request.input, request.candidate);
    if (!validation.ok) return rejected(request);
    const response = parseEuclideanNecessaryWitnessValidationWorkerResponseV1({
      ...base(request),
      outcome: 'validated',
      reason: null,
      result: validation.value,
    });
    return response.ok ? response.value : rejected(request);
  } catch {
    return request === undefined ? undefined : rejected(request);
  }
}
