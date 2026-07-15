import {
  SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS,
  parseSquareGridCandidateInputV1,
  type SquareGridCandidateInputIssue,
  type SquareGridCandidateInputV1,
  type SquareGridCandidateResultV1,
} from '../box-pleating/square-grid-candidates.js';
import { findSquareGridSourceBindingViolationV1 } from '../box-pleating/square-grid-source-binding.js';
import { deepFreezeOwned, type ValidationSnapshot } from '../clone-and-freeze.js';
import {
  SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS,
  validateSquareGridQuantizationCompletedResultV1,
} from '../experiments/square-grid-result-validation.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION = 1 as const;
export const SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE =
  'm0f-square-grid-quantization-request' as const;
export const SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE =
  'm0f-square-grid-quantization-response' as const;
export const SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS = 'candidate' as const;
export const SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM = false as const;
export const SQUARE_GRID_QUANTIZATION_WORKER_MAX_JOB_ID_LENGTH = 128 as const;

export const SQUARE_GRID_QUANTIZATION_WORKER_FAILURE_REASONS = Object.freeze([
  'quantization-failed',
  'internal-error',
] as const);

export type SquareGridQuantizationWorkerFailureReasonV1 =
  (typeof SQUARE_GRID_QUANTIZATION_WORKER_FAILURE_REASONS)[number];

export type CandidateSquareGridQuantizationWorkerRequestV1 = Readonly<{
  schemaVersion: typeof SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE;
  contractStatus: typeof SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  input: SquareGridCandidateInputV1;
}>;

export type CompletedCandidateSquareGridQuantizationWorkerResponseV1 = Readonly<{
  schemaVersion: typeof SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE;
  contractStatus: typeof SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  sourceInput: SquareGridCandidateInputV1;
  outcome: 'completed';
  reason: null;
  result: SquareGridCandidateResultV1;
}>;

export type FailedCandidateSquareGridQuantizationWorkerResponseV1 = Readonly<{
  schemaVersion: typeof SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE;
  contractStatus: typeof SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  sourceInput: SquareGridCandidateInputV1;
  outcome: 'failed';
  reason: SquareGridQuantizationWorkerFailureReasonV1;
  result: null;
}>;

export type CandidateSquareGridQuantizationWorkerResponseV1 =
  | CompletedCandidateSquareGridQuantizationWorkerResponseV1
  | FailedCandidateSquareGridQuantizationWorkerResponseV1;

export type SquareGridQuantizationWorkerProtocolIssueV1 = Readonly<{
  stage: 'snapshot' | 'structure' | 'input' | 'result' | 'invariant';
  path: string;
  code: string;
  message: string;
}>;

export type ParseCandidateSquareGridQuantizationWorkerRequestV1Result =
  | Readonly<{ ok: true; value: CandidateSquareGridQuantizationWorkerRequestV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridQuantizationWorkerProtocolIssueV1[] }>;

export type ParseCandidateSquareGridQuantizationWorkerResponseV1Result =
  | Readonly<{ ok: true; value: CandidateSquareGridQuantizationWorkerResponseV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridQuantizationWorkerProtocolIssueV1[] }>;

type MutableIssue = SquareGridQuantizationWorkerProtocolIssueV1;

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
  'sourceInput',
  'outcome',
  'reason',
  'result',
] as const;

const JOB_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requestFailure(
  issues: readonly MutableIssue[],
): ParseCandidateSquareGridQuantizationWorkerRequestV1Result {
  return deepFreezeOwned({ ok: false as const, error: [...issues] });
}

function responseFailure(
  issues: readonly MutableIssue[],
): ParseCandidateSquareGridQuantizationWorkerResponseV1Result {
  return deepFreezeOwned({ ok: false as const, error: [...issues] });
}

function closedKeys(
  raw: Record<string, unknown>,
  allowedKeys: readonly string[],
  issues: MutableIssue[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by v1',
      });
    }
  }
  for (const key of allowedKeys) {
    if (!Object.hasOwn(raw, key)) {
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code: 'missing-field',
        message: 'field is required by v1',
      });
    }
  }
}

export function isSquareGridQuantizationWorkerJobIdV1(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= SQUARE_GRID_QUANTIZATION_WORKER_MAX_JOB_ID_LENGTH &&
    JOB_ID_PATTERN.test(value)
  );
}

export function isSquareGridQuantizationWorkerFailureReasonV1(
  value: unknown,
): value is SquareGridQuantizationWorkerFailureReasonV1 {
  return value === 'quantization-failed' || value === 'internal-error';
}

function validateCommonLiterals(
  raw: Record<string, unknown>,
  expectedMessageType: string,
  issues: MutableIssue[],
): string | undefined {
  const literals: readonly [string, unknown, unknown][] = [
    ['schemaVersion', raw.schemaVersion, SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION],
    ['messageType', raw.messageType, expectedMessageType],
    ['contractStatus', raw.contractStatus, SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS],
    ['scientificClaim', raw.scientificClaim, SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM],
  ];
  for (const [key, actual, expected] of literals) {
    if (Object.hasOwn(raw, key) && actual !== expected) {
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code:
          key === 'contractStatus' || key === 'scientificClaim'
            ? 'claim-boundary'
            : 'invalid-literal',
        message: `must equal ${String(expected)}`,
      });
    }
  }

  if (!isSquareGridQuantizationWorkerJobIdV1(raw.jobId)) {
    if (Object.hasOwn(raw, 'jobId')) {
      issues.push({
        stage: 'structure',
        path: '$.jobId',
        code: 'invalid-job-id',
        message: `must be 1-${String(SQUARE_GRID_QUANTIZATION_WORKER_MAX_JOB_ID_LENGTH)} stable ASCII characters`,
      });
    }
    return undefined;
  }
  return raw.jobId;
}

function prefixedInputPath(path: string, field: 'input' | 'sourceInput'): string {
  return path === '$' ? `$.${field}` : `$.${field}${path.slice(1)}`;
}

function addInputIssues(
  issues: MutableIssue[],
  inputIssues: readonly SquareGridCandidateInputIssue[],
  field: 'input' | 'sourceInput' = 'input',
): void {
  for (const issue of inputIssues) {
    issues.push({
      stage: 'input',
      path: prefixedInputPath(issue.path, field),
      code: issue.code,
      message: issue.message,
    });
  }
}

function requestSnapshot(supplied: unknown): ValidationSnapshot<unknown> {
  return tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches,
    maxContainerCount: SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxBranches + 8,
    maxDepth: 5,
    maxObjectPropertyCount: 16,
    maxPropertyNameCodeUnits: 64,
    maxStringCodeUnits: 8192,
    maxTotalStringCodeUnits: 196_608,
    maxTotalPropertyCount: 2_048,
  });
}

function responseSnapshot(supplied: unknown): ValidationSnapshot<unknown> {
  return tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength:
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxColumns +
      SQUARE_GRID_CANDIDATE_ENUMERATION_LIMITS.maxRows,
    maxContainerCount: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotContainerCount + 16,
    maxDepth: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotDepth + 2,
    maxObjectPropertyCount: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotObjectPropertyCount,
    maxPropertyNameCodeUnits:
      SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotPropertyNameCodeUnits,
    maxStringCodeUnits: SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotStringCodeUnits,
    maxTotalStringCodeUnits:
      SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotTotalStringCodeUnits + 196_608,
    maxTotalPropertyCount:
      SQUARE_GRID_COMPLETED_RESULT_TEXT_LIMITS.snapshotTotalPropertyCount + 2_048,
  });
}

/** Parses one closed, accessor-free, candidate/no-claim request snapshot. */
export function parseCandidateSquareGridQuantizationWorkerRequestV1(
  supplied: unknown,
): ParseCandidateSquareGridQuantizationWorkerRequestV1Result {
  const snapshot = requestSnapshot(supplied);
  if (!snapshot.ok) {
    return requestFailure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'request must be one bounded accessor-free cloneable plain JSON-data snapshot',
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

  const issues: MutableIssue[] = [];
  const raw = snapshot.value;
  closedKeys(raw, REQUEST_KEYS, issues);
  const jobId = validateCommonLiterals(
    raw,
    SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
    issues,
  );
  const parsedInput = parseSquareGridCandidateInputV1(raw.input);
  if (!parsedInput.ok) addInputIssues(issues, parsedInput.error);
  if (issues.length > 0 || jobId === undefined || !parsedInput.ok) return requestFailure(issues);

  const value: CandidateSquareGridQuantizationWorkerRequestV1 = deepFreezeOwned({
    schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: SQUARE_GRID_QUANTIZATION_WORKER_REQUEST_MESSAGE_TYPE,
    contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
    scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    input: parsedInput.value,
  });
  return deepFreezeOwned({ ok: true as const, value });
}

function sourceResultBindingIssue(
  source: SquareGridCandidateInputV1,
  result: SquareGridCandidateResultV1,
): MutableIssue | undefined {
  const violation = findSquareGridSourceBindingViolationV1(source, result);
  if (violation === undefined) return undefined;
  return {
    stage: 'invariant',
    path: violation.path === '$' ? '$.result' : `$.result${violation.path.slice(1)}`,
    code: 'source-result-mismatch',
    message: violation.message,
  };
}

/** Parses a completed result only after the independent integrity validator accepts it. */
export function parseCandidateSquareGridQuantizationWorkerResponseV1(
  supplied: unknown,
): ParseCandidateSquareGridQuantizationWorkerResponseV1Result {
  const snapshot = responseSnapshot(supplied);
  if (!snapshot.ok) {
    return responseFailure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'response must be one bounded accessor-free cloneable plain JSON-data snapshot',
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

  const issues: MutableIssue[] = [];
  const raw = snapshot.value;
  closedKeys(raw, RESPONSE_KEYS, issues);
  const jobId = validateCommonLiterals(
    raw,
    SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
    issues,
  );
  const parsedSourceInput = parseSquareGridCandidateInputV1(raw.sourceInput);
  if (!parsedSourceInput.ok) addInputIssues(issues, parsedSourceInput.error, 'sourceInput');

  let completedResult: SquareGridCandidateResultV1 | undefined;
  if (raw.outcome === 'completed') {
    if (raw.reason !== null) {
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'completed responses require reason to be null',
      });
    }
    if (raw.result === null) {
      issues.push({
        stage: 'invariant',
        path: '$.result',
        code: 'outcome-invariant',
        message: 'completed responses require a candidate quantization result',
      });
    } else {
      const validation = validateSquareGridQuantizationCompletedResultV1(raw.result);
      if (validation.ok) {
        completedResult = raw.result as SquareGridCandidateResultV1;
        if (parsedSourceInput.ok) {
          const bindingIssue = sourceResultBindingIssue(parsedSourceInput.value, completedResult);
          if (bindingIssue !== undefined) issues.push(bindingIssue);
        }
      } else {
        for (const violation of validation.violations) {
          issues.push({
            stage: 'result',
            path: violation.path,
            code: 'invalid-result',
            message: violation.message,
          });
        }
      }
    }
  } else if (raw.outcome === 'failed') {
    if (!isSquareGridQuantizationWorkerFailureReasonV1(raw.reason)) {
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'failed responses require one declared v1 reason',
      });
    }
    if (raw.result !== null) {
      issues.push({
        stage: 'invariant',
        path: '$.result',
        code: 'outcome-invariant',
        message: 'failed responses require result to be null',
      });
    }
  } else if (Object.hasOwn(raw, 'outcome')) {
    issues.push({
      stage: 'structure',
      path: '$.outcome',
      code: 'invalid-outcome',
      message: 'must equal completed or failed',
    });
  }

  if (issues.length > 0 || jobId === undefined || !parsedSourceInput.ok) {
    return responseFailure(issues);
  }

  if (raw.outcome === 'completed' && completedResult !== undefined) {
    const value: CompletedCandidateSquareGridQuantizationWorkerResponseV1 = deepFreezeOwned({
      schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
      scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
      jobId,
      sourceInput: parsedSourceInput.value,
      outcome: 'completed',
      reason: null,
      result: completedResult,
    });
    return deepFreezeOwned({ ok: true as const, value });
  }

  if (raw.outcome === 'failed' && isSquareGridQuantizationWorkerFailureReasonV1(raw.reason)) {
    const value: FailedCandidateSquareGridQuantizationWorkerResponseV1 = deepFreezeOwned({
      schemaVersion: SQUARE_GRID_QUANTIZATION_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: SQUARE_GRID_QUANTIZATION_WORKER_RESPONSE_MESSAGE_TYPE,
      contractStatus: SQUARE_GRID_QUANTIZATION_WORKER_CONTRACT_STATUS,
      scientificClaim: SQUARE_GRID_QUANTIZATION_WORKER_SCIENTIFIC_CLAIM,
      jobId,
      sourceInput: parsedSourceInput.value,
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
