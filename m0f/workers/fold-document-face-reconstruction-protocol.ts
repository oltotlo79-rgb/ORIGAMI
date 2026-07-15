import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
  FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
  FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
  isFaceReconstructionWorkerJobIdV1,
} from './face-reconstruction-protocol.js';

export const FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE =
  'm0f-fold-document-face-reconstruction-request' as const;
export const FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING = 'utf-8-json' as const;

export type CandidateFoldDocumentFaceReconstructionWorkerRequestV1 = Readonly<{
  schemaVersion: typeof FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE;
  contractStatus: typeof FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  encoding: typeof FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING;
  foldDocumentBytes: ArrayBuffer;
}>;

export type FoldDocumentFaceReconstructionWorkerRequestIssueV1 = Readonly<{
  path: string;
  code:
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-descriptor'
    | 'invalid-literal'
    | 'claim-boundary'
    | 'invalid-job-id'
    | 'invalid-bytes';
  message: string;
}>;

export type ParseCandidateFoldDocumentFaceReconstructionWorkerRequestV1Result =
  | Readonly<{ ok: true; value: CandidateFoldDocumentFaceReconstructionWorkerRequestV1 }>
  | Readonly<{
      ok: false;
      error: readonly FoldDocumentFaceReconstructionWorkerRequestIssueV1[];
    }>;

const REQUEST_KEYS = [
  'schemaVersion',
  'messageType',
  'contractStatus',
  'scientificClaim',
  'jobId',
  'encoding',
  'foldDocumentBytes',
] as const;

/** Brand-checks without inspecting or copying the byte contents. */
export function nonEmptyArrayBufferByteLengthV1(value: unknown): number | undefined {
  try {
    const byteLength: unknown = Reflect.get(ArrayBuffer.prototype, 'byteLength', value as object);
    return typeof byteLength === 'number' && Number.isSafeInteger(byteLength) && byteLength > 0
      ? byteLength
      : undefined;
  } catch {
    return undefined;
  }
}

function failure(
  error: FoldDocumentFaceReconstructionWorkerRequestIssueV1[],
): ParseCandidateFoldDocumentFaceReconstructionWorkerRequestV1Result {
  return deepFreezeOwned({ ok: false as const, error });
}

function addIssue(
  issues: FoldDocumentFaceReconstructionWorkerRequestIssueV1[],
  path: string,
  code: FoldDocumentFaceReconstructionWorkerRequestIssueV1['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

/**
 * Validates only the transferred outer envelope. It never decodes, snapshots,
 * or normalizes the FOLD document bytes; those operations belong to the Worker
 * handler after this boundary has established a trusted job ID.
 */
export function parseCandidateFoldDocumentFaceReconstructionWorkerRequestV1(
  supplied: unknown,
): ParseCandidateFoldDocumentFaceReconstructionWorkerRequestV1Result {
  let isArray: boolean;
  try {
    isArray = Array.isArray(supplied);
  } catch {
    return failure([
      { path: '$', code: 'invalid-object', message: 'request must be a plain object' },
    ]);
  }
  if (typeof supplied !== 'object' || supplied === null || isArray) {
    return failure([
      { path: '$', code: 'invalid-object', message: 'request must be a plain object' },
    ]);
  }

  let prototype: unknown;
  let keys: readonly PropertyKey[];
  try {
    prototype = Object.getPrototypeOf(supplied);
    keys = Reflect.ownKeys(supplied);
  } catch {
    return failure([
      { path: '$', code: 'invalid-object', message: 'request must be a plain object' },
    ]);
  }
  if (prototype !== Object.prototype && prototype !== null) {
    return failure([
      { path: '$', code: 'invalid-object', message: 'request must be a plain object' },
    ]);
  }

  const issues: FoldDocumentFaceReconstructionWorkerRequestIssueV1[] = [];
  const allowed = new Set<string>(REQUEST_KEYS);
  const values = new Map<string, unknown>();
  for (const key of keys) {
    if (typeof key !== 'string') {
      addIssue(issues, '$', 'unknown-field', 'symbol fields are not declared by v1');
      continue;
    }
    if (!allowed.has(key)) {
      addIssue(issues, `$.${key}`, 'unknown-field', 'field is not declared by v1');
      continue;
    }
    let descriptor: PropertyDescriptor | undefined;
    try {
      descriptor = Object.getOwnPropertyDescriptor(supplied, key);
    } catch {
      descriptor = undefined;
    }
    if (descriptor === undefined || !descriptor.enumerable || !('value' in descriptor)) {
      addIssue(
        issues,
        `$.${key}`,
        'invalid-descriptor',
        'field must be one enumerable data property',
      );
      continue;
    }
    values.set(key, descriptor.value);
  }
  for (const key of REQUEST_KEYS) {
    if (!values.has(key)) addIssue(issues, `$.${key}`, 'missing-field', 'field is required by v1');
  }
  if (issues.length > 0) return failure(issues);

  const literals: readonly [string, unknown, unknown][] = [
    [
      'schemaVersion',
      values.get('schemaVersion'),
      FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    ],
    [
      'messageType',
      values.get('messageType'),
      FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    ],
    ['contractStatus', values.get('contractStatus'), FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS],
    ['scientificClaim', values.get('scientificClaim'), FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM],
    ['encoding', values.get('encoding'), FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING],
  ];
  for (const [key, actual, expected] of literals) {
    if (actual !== expected) {
      addIssue(
        issues,
        `$.${key}`,
        key === 'contractStatus' || key === 'scientificClaim'
          ? 'claim-boundary'
          : 'invalid-literal',
        `must equal ${String(expected)}`,
      );
    }
  }

  const jobId = values.get('jobId');
  if (!isFaceReconstructionWorkerJobIdV1(jobId)) {
    addIssue(issues, '$.jobId', 'invalid-job-id', 'must be one bounded stable ASCII job ID');
  }
  const foldDocumentBytes = values.get('foldDocumentBytes');
  if (nonEmptyArrayBufferByteLengthV1(foldDocumentBytes) === undefined) {
    addIssue(
      issues,
      '$.foldDocumentBytes',
      'invalid-bytes',
      'must be one owned, nonempty, attached ArrayBuffer',
    );
  }
  if (issues.length > 0 || !isFaceReconstructionWorkerJobIdV1(jobId)) return failure(issues);

  const value = Object.freeze({
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    encoding: FOLD_DOCUMENT_FACE_RECONSTRUCTION_WORKER_ENCODING,
    foldDocumentBytes: foldDocumentBytes as ArrayBuffer,
  });
  return Object.freeze({ ok: true as const, value });
}
