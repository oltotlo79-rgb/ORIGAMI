import {
  enumerateSquareGridCandidatesV1,
  type SquareGridCandidateEnumerationResult,
} from '../box-pleating/square-grid-candidates.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
  SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
  SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
  SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateSquareGridQuantizationWorkerRequestV1,
  parseCandidateSquareGridQuantizationWorkerResponseV1,
  type CandidateSquareGridQuantizationWorkerRequestV1,
  type CandidateSquareGridQuantizationWorkerResponseV1,
  type FailedCandidateSquareGridQuantizationWorkerResponseV1,
} from './square-grid-quantization-protocol.js';

export type SquareGridQuantizationWorkerExecutorV1 = (
  input: CandidateSquareGridQuantizationWorkerRequestV1['input'],
) => SquareGridCandidateEnumerationResult;

function failedResponse(
  jobId: string,
  sourceInput: CandidateSquareGridQuantizationWorkerRequestV1['input'],
  reason: 'quantization-failed' | 'internal-error',
): CandidateSquareGridQuantizationWorkerResponseV1 {
  const response: FailedCandidateSquareGridQuantizationWorkerResponseV1 = {
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    sourceInput,
    outcome: 'failed',
    reason,
    result: null,
  };
  return deepFreezeOwned(response);
}

/**
 * Executes one message. Invalid envelopes are ignored because their job ID is
 * untrusted. Cancellation of synchronous enumeration is worker termination.
 */
export function executeSquareGridQuantizationWorkerMessageV1(
  supplied: unknown,
  executor: SquareGridQuantizationWorkerExecutorV1 = enumerateSquareGridCandidatesV1,
): CandidateSquareGridQuantizationWorkerResponseV1 | undefined {
  let trustedRequest: CandidateSquareGridQuantizationWorkerRequestV1 | undefined;
  try {
    const request = parseCandidateSquareGridQuantizationWorkerRequestV1(supplied);
    if (!request.ok) return undefined;
    trustedRequest = request.value;

    const enumerated = executor(trustedRequest.input);
    if (!enumerated.ok) {
      return failedResponse(trustedRequest.jobId, trustedRequest.input, 'quantization-failed');
    }

    const response = parseCandidateSquareGridQuantizationWorkerResponseV1({
      schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
      scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
      jobId: trustedRequest.jobId,
      sourceInput: trustedRequest.input,
      outcome: 'completed',
      reason: null,
      result: enumerated.value,
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
