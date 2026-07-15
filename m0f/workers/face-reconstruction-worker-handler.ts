import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  reconstructFoldFacesCandidateV1,
  type FoldFaceReconstructionResult,
} from '../geometry/reconstruct-fold-faces.js';
import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateFoldFaceReconstructionWorkerRequestV1,
  parseCandidateFoldFaceReconstructionWorkerResponseV1,
  type CandidateFoldFaceReconstructionWorkerRequestV1,
  type CandidateFoldFaceReconstructionWorkerResponseV1,
  type FailedCandidateFoldFaceReconstructionWorkerResponseV1,
} from './face-reconstruction-protocol.js';

export type FaceReconstructionWorkerExecutorV1 = (
  input: CandidateFoldFaceReconstructionWorkerRequestV1['input'],
) => FoldFaceReconstructionResult;

function failedResponse(
  jobId: string,
  reason: 'reconstruction-failed' | 'internal-error',
): CandidateFoldFaceReconstructionWorkerResponseV1 {
  const response: FailedCandidateFoldFaceReconstructionWorkerResponseV1 = {
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    outcome: 'failed',
    reason,
    result: null,
  };
  return deepFreezeOwned(response);
}

/**
 * Executes one already-serialized worker message without exposing exceptions.
 * Invalid envelopes are ignored because they do not contain a trusted job ID.
 * Cancellation is implemented by terminating this worker from the client.
 */
export function executeFaceReconstructionWorkerMessageV1(
  supplied: unknown,
  executor: FaceReconstructionWorkerExecutorV1 = reconstructFoldFacesCandidateV1,
): CandidateFoldFaceReconstructionWorkerResponseV1 | undefined {
  let trustedRequest: CandidateFoldFaceReconstructionWorkerRequestV1 | undefined;
  try {
    const request = parseCandidateFoldFaceReconstructionWorkerRequestV1(supplied);
    if (!request.ok) return undefined;
    trustedRequest = request.value;

    const reconstructed = executor(trustedRequest.input);
    if (!reconstructed.ok) return failedResponse(trustedRequest.jobId, 'reconstruction-failed');

    const response = parseCandidateFoldFaceReconstructionWorkerResponseV1({
      schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
      scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
      jobId: trustedRequest.jobId,
      outcome: 'completed',
      reason: null,
      result: reconstructed.value,
    });
    return response.ok ? response.value : failedResponse(trustedRequest.jobId, 'internal-error');
  } catch {
    return trustedRequest === undefined
      ? undefined
      : failedResponse(trustedRequest.jobId, 'internal-error');
  }
}
