import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import {
  parseCandidateFoldFaceReconstructionV1,
  type CandidateFoldFaceReconstructionParseIssue,
} from '../geometry/fold-face-reconstruction-result.js';
import {
  normalizeFoldFaceReconstructionInputV1,
  type FoldFaceInputIssue,
  type FoldFaceReconstructionInputV1,
} from '../geometry/fold-face-input.js';
import type { CandidateFoldFaceReconstructionV1 } from '../geometry/reconstruct-fold-faces.js';

export const FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION = 1 as const;
export const FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE =
  'm0f-face-reconstruction-request' as const;
export const FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE =
  'm0f-face-reconstruction-response' as const;
export const FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS = 'candidate' as const;
export const FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM = false as const;
export const FACE_RECONSTRUCTION_WORKER_MAX_JOB_ID_LENGTH = 128 as const;

export const FACE_RECONSTRUCTION_WORKER_FAILURE_REASONS = Object.freeze([
  'invalid-request',
  'reconstruction-failed',
  'internal-error',
] as const);

export type FaceReconstructionWorkerFailureReasonV1 =
  (typeof FACE_RECONSTRUCTION_WORKER_FAILURE_REASONS)[number];

export type CandidateFoldFaceReconstructionWorkerRequestV1 = Readonly<{
  schemaVersion: typeof FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE;
  contractStatus: typeof FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  input: FoldFaceReconstructionInputV1;
}>;

export type CompletedCandidateFoldFaceReconstructionWorkerResponseV1 = Readonly<{
  schemaVersion: typeof FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE;
  contractStatus: typeof FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  outcome: 'completed';
  reason: null;
  result: CandidateFoldFaceReconstructionV1;
}>;

export type FailedCandidateFoldFaceReconstructionWorkerResponseV1 = Readonly<{
  schemaVersion: typeof FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE;
  contractStatus: typeof FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  outcome: 'failed';
  reason: FaceReconstructionWorkerFailureReasonV1;
  result: null;
}>;

export type CandidateFoldFaceReconstructionWorkerResponseV1 =
  | CompletedCandidateFoldFaceReconstructionWorkerResponseV1
  | FailedCandidateFoldFaceReconstructionWorkerResponseV1;

export type FaceReconstructionWorkerProtocolIssueV1 = Readonly<{
  stage: 'snapshot' | 'structure' | 'input' | 'result' | 'invariant';
  path: string;
  code: string;
  message: string;
}>;

export type ParseCandidateFoldFaceReconstructionWorkerRequestV1Result =
  | Readonly<{ ok: true; value: CandidateFoldFaceReconstructionWorkerRequestV1 }>
  | Readonly<{ ok: false; error: readonly FaceReconstructionWorkerProtocolIssueV1[] }>;

export type ParseCandidateFoldFaceReconstructionWorkerResponseV1Result =
  | Readonly<{ ok: true; value: CandidateFoldFaceReconstructionWorkerResponseV1 }>
  | Readonly<{ ok: false; error: readonly FaceReconstructionWorkerProtocolIssueV1[] }>;

interface MutableIssue {
  stage: FaceReconstructionWorkerProtocolIssueV1['stage'];
  path: string;
  code: string;
  message: string;
}

const REQUEST_KEYS = [
  'schemaVersion',
  'messageType',
  'contractStatus',
  'scientificClaim',
  'jobId',
  'input',
] as const;

const RESPONSE_KEYS = [
  'schemaVersion',
  'messageType',
  'contractStatus',
  'scientificClaim',
  'jobId',
  'outcome',
  'reason',
  'result',
] as const;

const JOB_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/** Cheap scalar check shared by Worker clients that deliberately defer input parsing. */
export function isFaceReconstructionWorkerJobIdV1(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= FACE_RECONSTRUCTION_WORKER_MAX_JOB_ID_LENGTH &&
    JOB_ID_PATTERN.test(value)
  );
}

function addIssue(
  issues: MutableIssue[],
  stage: MutableIssue['stage'],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ stage, path, code, message });
}

function requestFailure(
  issues: MutableIssue[],
): ParseCandidateFoldFaceReconstructionWorkerRequestV1Result {
  return deepFreezeOwned({ ok: false as const, error: issues });
}

function responseFailure(
  issues: MutableIssue[],
): ParseCandidateFoldFaceReconstructionWorkerResponseV1Result {
  return deepFreezeOwned({ ok: false as const, error: issues });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Checks the caller-owned graph without reading property values through normal
 * access. This rejects accessors and prototypes which structuredClone would
 * otherwise erase before the closed protocol boundary can inspect them.
 */
function isPlainJsonSource(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;

  const object = value;
  if (ancestors.has(object)) return false;
  ancestors.add(object);
  try {
    const prototype: unknown = Object.getPrototypeOf(object);
    const keys = Reflect.ownKeys(object);
    if (keys.some((key) => typeof key === 'symbol')) return false;

    if (Array.isArray(object)) {
      if (prototype !== Array.prototype || keys.length !== object.length + 1) return false;
      let elementCount = 0;
      for (const key of keys) {
        if (key === 'length') continue;
        if (typeof key !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(key)) return false;
        const index = Number(key);
        if (!Number.isSafeInteger(index) || index < 0 || index >= object.length) return false;
        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        if (descriptor === undefined || !descriptor.enumerable || !('value' in descriptor)) {
          return false;
        }
        if (!isPlainJsonSource(descriptor.value, ancestors)) return false;
        elementCount += 1;
      }
      return elementCount === object.length;
    }

    if (prototype !== Object.prototype && prototype !== null) return false;
    for (const key of keys) {
      if (typeof key !== 'string') return false;
      const descriptor = Object.getOwnPropertyDescriptor(object, key);
      if (descriptor === undefined || !descriptor.enumerable || !('value' in descriptor)) {
        return false;
      }
      if (!isPlainJsonSource(descriptor.value, ancestors)) return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    ancestors.delete(object);
  }
}

function capturePlainJsonSnapshot(
  value: unknown,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    if (!isPlainJsonSource(value, new WeakSet<object>())) return { ok: false };
    const snapshot = tryCreateValidationSnapshot(value);
    return snapshot.ok ? snapshot : { ok: false };
  } catch {
    return { ok: false };
  }
}

function closedKeys(
  raw: Record<string, unknown>,
  allowedKeys: readonly string[],
  issues: MutableIssue[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      addIssue(issues, 'structure', `$.${key}`, 'unknown-field', 'field is not declared by v1');
    }
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(raw, key)) {
      addIssue(issues, 'structure', `$.${key}`, 'missing-field', 'field is required by v1');
    }
  }
}

function validateCommonLiterals(
  raw: Record<string, unknown>,
  messageType: string,
  issues: MutableIssue[],
): string | undefined {
  const literals: readonly [string, unknown, unknown][] = [
    ['schemaVersion', raw.schemaVersion, FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION],
    ['messageType', raw.messageType, messageType],
    ['contractStatus', raw.contractStatus, FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS],
    ['scientificClaim', raw.scientificClaim, FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM],
  ];
  for (const [key, actual, expected] of literals) {
    if (Object.hasOwn(raw, key) && actual !== expected) {
      addIssue(
        issues,
        'structure',
        `$.${key}`,
        key === 'contractStatus' || key === 'scientificClaim'
          ? 'claim-boundary'
          : 'invalid-literal',
        `must equal ${String(expected)}`,
      );
    }
  }

  if (!isFaceReconstructionWorkerJobIdV1(raw.jobId)) {
    if (Object.hasOwn(raw, 'jobId')) {
      addIssue(
        issues,
        'structure',
        '$.jobId',
        'invalid-job-id',
        `must be 1-${FACE_RECONSTRUCTION_WORKER_MAX_JOB_ID_LENGTH} stable ASCII characters`,
      );
    }
    return undefined;
  }
  return raw.jobId;
}

function prefixedPath(root: '$.input' | '$.result', path: string): string {
  return path === '$' ? root : `${root}${path.slice(1)}`;
}

function addInputIssues(issues: MutableIssue[], entries: readonly FoldFaceInputIssue[]): void {
  for (const entry of entries) {
    addIssue(issues, 'input', prefixedPath('$.input', entry.path), entry.code, entry.message);
  }
}

function addResultIssues(
  issues: MutableIssue[],
  entries: readonly CandidateFoldFaceReconstructionParseIssue[],
): void {
  for (const entry of entries) {
    addIssue(issues, 'result', prefixedPath('$.result', entry.path), entry.code, entry.message);
  }
}

export function isFaceReconstructionWorkerFailureReasonV1(
  value: unknown,
): value is FaceReconstructionWorkerFailureReasonV1 {
  return (
    value === 'invalid-request' || value === 'reconstruction-failed' || value === 'internal-error'
  );
}

/**
 * Captures and validates exactly one caller-owned request envelope. The input
 * remains the internal FOLD slice; normalization is used only as its complete
 * runtime validity check.
 */
export function parseCandidateFoldFaceReconstructionWorkerRequestV1(
  supplied: unknown,
): ParseCandidateFoldFaceReconstructionWorkerRequestV1Result {
  const snapshot = capturePlainJsonSnapshot(supplied);
  if (!snapshot.ok) {
    return requestFailure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'request must be one accessor-free, cloneable plain JSON-data snapshot',
      },
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return requestFailure([
      {
        stage: 'structure',
        path: '$',
        code: 'invalid-object',
        message: 'request must be an object',
      },
    ]);
  }

  const raw = snapshot.value;
  const issues: MutableIssue[] = [];
  closedKeys(raw, REQUEST_KEYS, issues);
  const jobId = validateCommonLiterals(
    raw,
    FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    issues,
  );
  const input = normalizeFoldFaceReconstructionInputV1(raw.input);
  if (!input.ok) addInputIssues(issues, input.error);
  if (issues.length > 0 || jobId === undefined || !input.ok) return requestFailure(issues);

  const value = deepFreezeOwned({
    schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: FACE_RECONSTRUCTION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
    scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    input: raw.input as FoldFaceReconstructionInputV1,
  });
  return deepFreezeOwned({ ok: true as const, value });
}

/**
 * Validates a worker response as candidate transport data. Completed results
 * pass the full semantic result parser; failures can carry only a fixed reason.
 */
export function parseCandidateFoldFaceReconstructionWorkerResponseV1(
  supplied: unknown,
): ParseCandidateFoldFaceReconstructionWorkerResponseV1Result {
  const snapshot = capturePlainJsonSnapshot(supplied);
  if (!snapshot.ok) {
    return responseFailure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'response must be one accessor-free, cloneable plain JSON-data snapshot',
      },
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return responseFailure([
      {
        stage: 'structure',
        path: '$',
        code: 'invalid-object',
        message: 'response must be an object',
      },
    ]);
  }

  const raw = snapshot.value;
  const issues: MutableIssue[] = [];
  closedKeys(raw, RESPONSE_KEYS, issues);
  const jobId = validateCommonLiterals(
    raw,
    FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
    issues,
  );

  let completedResult: CandidateFoldFaceReconstructionV1 | undefined;
  if (raw.outcome === 'completed') {
    if (raw.reason !== null) {
      addIssue(
        issues,
        'invariant',
        '$.reason',
        'outcome-invariant',
        'completed responses require reason to be null',
      );
    }
    if (raw.result === null) {
      addIssue(
        issues,
        'invariant',
        '$.result',
        'outcome-invariant',
        'completed responses require a candidate reconstruction result',
      );
    } else {
      const parsedResult = parseCandidateFoldFaceReconstructionV1(raw.result);
      if (parsedResult.ok) completedResult = parsedResult.value;
      else addResultIssues(issues, parsedResult.error);
    }
  } else if (raw.outcome === 'failed') {
    if (!isFaceReconstructionWorkerFailureReasonV1(raw.reason)) {
      addIssue(
        issues,
        'invariant',
        '$.reason',
        'outcome-invariant',
        'failed responses require one declared v1 reason',
      );
    }
    if (raw.result !== null) {
      addIssue(
        issues,
        'invariant',
        '$.result',
        'outcome-invariant',
        'failed responses require result to be null',
      );
    }
  } else if (Object.hasOwn(raw, 'outcome')) {
    addIssue(issues, 'structure', '$.outcome', 'invalid-outcome', 'must equal completed or failed');
  }

  if (issues.length > 0 || jobId === undefined) return responseFailure(issues);

  if (raw.outcome === 'completed' && completedResult !== undefined) {
    const value: CompletedCandidateFoldFaceReconstructionWorkerResponseV1 = deepFreezeOwned({
      schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
      scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
      jobId,
      outcome: 'completed',
      reason: null,
      result: completedResult,
    });
    return deepFreezeOwned({ ok: true as const, value });
  }

  if (raw.outcome === 'failed' && isFaceReconstructionWorkerFailureReasonV1(raw.reason)) {
    const value: FailedCandidateFoldFaceReconstructionWorkerResponseV1 = deepFreezeOwned({
      schemaVersion: FACE_RECONSTRUCTION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: FACE_RECONSTRUCTION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: FACE_RECONSTRUCTION_WORKER_CONTRACT_STATUS,
      scientificClaim: FACE_RECONSTRUCTION_WORKER_SCIENTIFIC_CLAIM,
      jobId,
      outcome: 'failed',
      reason: raw.reason,
      result: null,
    });
    return deepFreezeOwned({ ok: true as const, value });
  }

  return responseFailure([
    {
      stage: 'invariant',
      path: '$',
      code: 'outcome-invariant',
      message: 'response outcome is incomplete',
    },
  ]);
}
