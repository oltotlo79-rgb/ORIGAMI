import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
  isFaceReconstructionWorkerJobIdV1,
} from './face-reconstruction-protocol.js';
import {
  FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
  FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
  nonEmptyArrayBufferByteLengthV1,
  type CandidateFoldDocumentFaceReconstructionWorkerRequestV1,
} from './fold-document-face-reconstruction-protocol.js';
import {
  FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT,
  FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT,
  runPreparedFaceReconstructionWorkerV1,
  type FaceReconstructionWorkerFactoryV1,
  type FaceReconstructionWorkerRunResultV1,
} from './run-face-reconstruction-worker.js';

export type RunFoldDocumentFaceReconstructionWorkerOptionsV1 = Readonly<{
  jobId: string;
  foldDocumentBytes: ArrayBuffer;
  workerFactory: FaceReconstructionWorkerFactoryV1;
  signal?: AbortSignal;
}>;

/**
 * Transfers one UTF-8 JSON FOLD document without parsing it on the main thread.
 * A successful postMessage detaches and consumes the caller's ArrayBuffer.
 */
export function runFoldDocumentFaceReconstructionWorkerV1(
  options: RunFoldDocumentFaceReconstructionWorkerOptionsV1,
): Promise<FaceReconstructionWorkerRunResultV1> {
  const signal = options.signal;
  if (signal?.aborted === true) {
    return Promise.resolve(FACE_RECONSTRUCTION_WORKER_CANCELLED_RESULT);
  }

  const jobId = options.jobId;
  const foldDocumentBytes = options.foldDocumentBytes;
  if (
    !isFaceReconstructionWorkerJobIdV1(jobId) ||
    nonEmptyArrayBufferByteLengthV1(foldDocumentBytes) === undefined
  ) {
    return Promise.resolve(FACE_RECONSTRUCTION_WORKER_INVALID_REQUEST_RESULT);
  }

  const request: CandidateFoldDocumentFaceReconstructionWorkerRequestV1 = Object.freeze({
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    encoding: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
    foldDocumentBytes,
  });
  return runPreparedFaceReconstructionWorkerV1(jobId, request, options.workerFactory, signal, [
    foldDocumentBytes,
  ]);
}
