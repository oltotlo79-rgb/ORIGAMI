import {
  buildPolygonRiverPackingProblemV1,
  type PolygonRiverPackingProblemBuildResult,
} from '../box-pleating/polygon-river-packing-problem.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
  parseCandidatePolygonRiverPackingProblemWorkerRequestV1,
  parseCandidatePolygonRiverPackingProblemWorkerResponseV1,
  type CandidatePolygonRiverPackingProblemWorkerRequestV1,
  type CandidatePolygonRiverPackingProblemWorkerResponseV1,
  type FailedCandidatePolygonRiverPackingProblemWorkerResponseV1,
} from './polygon-river-packing-problem-protocol.js';

export type PolygonRiverPackingProblemWorkerBuilderV1 = (
  input: CandidatePolygonRiverPackingProblemWorkerRequestV1['input'],
) => PolygonRiverPackingProblemBuildResult;

function failedResponse(
  jobId: string,
  sourceInput: CandidatePolygonRiverPackingProblemWorkerRequestV1['input'],
  reason: 'packing-problem-build-failed' | 'internal-error',
): CandidatePolygonRiverPackingProblemWorkerResponseV1 {
  const response: FailedCandidatePolygonRiverPackingProblemWorkerResponseV1 = {
    schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput,
    outcome: 'failed',
    reason,
    result: null,
  };
  return deepFreezeOwned(response);
}

/**
 * Executes one trusted request. Invalid envelopes are ignored because their
 * job ID is not trusted. Only this handler invokes the finite-problem builder.
 */
export function executePolygonRiverPackingProblemWorkerMessageV1(
  supplied: unknown,
  builder: PolygonRiverPackingProblemWorkerBuilderV1 = buildPolygonRiverPackingProblemV1,
): CandidatePolygonRiverPackingProblemWorkerResponseV1 | undefined {
  let trustedRequest: CandidatePolygonRiverPackingProblemWorkerRequestV1 | undefined;
  try {
    const request = parseCandidatePolygonRiverPackingProblemWorkerRequestV1(supplied);
    if (!request.ok) return undefined;
    trustedRequest = request.value;

    const built = builder(trustedRequest.input);
    if (!built.ok) {
      return failedResponse(
        trustedRequest.jobId,
        trustedRequest.input,
        'packing-problem-build-failed',
      );
    }

    const response = parseCandidatePolygonRiverPackingProblemWorkerResponseV1({
      schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
      operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
      contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
      scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
      jobId: trustedRequest.jobId,
      sourceInput: trustedRequest.input,
      outcome: 'completed',
      reason: null,
      result: built.value,
    });
    return response.ok
      ? response.value
      : failedResponse(trustedRequest.jobId, trustedRequest.input, 'internal-error');
  } catch {
    return trustedRequest === undefined
      ? undefined
      : failedResponse(trustedRequest.jobId, trustedRequest.input, 'internal-error');
  }
}
