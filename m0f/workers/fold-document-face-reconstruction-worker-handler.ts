import { deepFreezeOwned } from '../clone-and-freeze.js';
import { adaptFoldDocumentToFaceReconstructionInputV1 } from '../geometry/fold-document-face-adapter.js';
import {
  reconstructFoldFacesCandidateV1,
  type FoldFaceReconstructionResult,
} from '../geometry/reconstruct-fold-faces.js';
import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
  parseCandidateFoldFaceReconstructionWorkerResponseV1,
  type CandidateFoldFaceReconstructionWorkerResponseV1,
  type FaceReconstructionWorkerFailureReasonV1,
  type FailedCandidateFoldFaceReconstructionWorkerResponseV1,
} from './face-reconstruction-protocol.js';
import { parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1 } from './fold-document-face-reconstruction-protocol.js';

export type FoldDocumentFaceReconstructionWorkerExecutorV1 = (
  input: Parameters<typeof reconstructFoldFacesCandidateV1>[0],
) => FoldFaceReconstructionResult;

function failedResponse(
  jobId: string,
  reason: FaceReconstructionWorkerFailureReasonV1,
): FailedCandidateFoldFaceReconstructionWorkerResponseV1 {
  return deepFreezeOwned({
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    outcome: 'failed' as const,
    reason,
    result: null,
  });
}

function decodeJson(
  bytes: ArrayBuffer,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

/** Executes one transferred standard-FOLD JSON request entirely in the Worker. */
export function executeFoldDocumentFaceReconstructionWorkerMessageV1(
  supplied: unknown,
  executor: FoldDocumentFaceReconstructionWorkerExecutorV1 = reconstructFoldFacesCandidateV1,
): CandidateFoldFaceReconstructionWorkerResponseV1 | undefined {
  const request = parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(supplied);
  if (!request.ok) return undefined;
  const { jobId, foldDocumentBytes } = request.value;

  try {
    const decoded = decodeJson(foldDocumentBytes);
    if (!decoded.ok) return failedResponse(jobId, 'invalid-request');

    const adapted = adaptFoldDocumentToFaceReconstructionInputV1(decoded.value);
    if (!adapted.ok) return failedResponse(jobId, 'invalid-request');

    const reconstructed = executor(adapted.value);
    if (!reconstructed.ok) return failedResponse(jobId, 'reconstruction-failed');

    const parsedResponse = parseCandidateFoldFaceReconstructionWorkerResponseV1({
      schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
      scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
      jobId,
      outcome: 'completed',
      reason: null,
      result: reconstructed.value,
    });
    return parsedResponse.ok ? parsedResponse.value : failedResponse(jobId, 'internal-error');
  } catch {
    return failedResponse(jobId, 'internal-error');
  }
}
