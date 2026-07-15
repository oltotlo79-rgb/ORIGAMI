import {
  parsePolygonRiverPackingProblemInputV1,
  POLYGON_RIVER_PACKING_PROBLEM_LIMITS,
  type PolygonRiverPackingProblemInputIssue,
  type PolygonRiverPackingProblemInputV1,
  type PolygonRiverPackingProblemResultV1,
} from '../box-pleating/polygon-river-packing-problem.js';
import {
  POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS,
  validatePolygonRiverPackingProblemResultV1,
} from '../box-pleating/polygon-river-packing-problem-result-validation.js';
import { deepFreezeOwned, type ValidationSnapshot } from '../clone-and-freeze.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION = 1 as const;
export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE =
  'm0f-polygon-river-packing-problem-request' as const;
export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE =
  'm0f-polygon-river-packing-problem-response' as const;
export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION =
  'build-polygon-river-packing-problem' as const;
export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS = 'candidate' as const;
export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM = false as const;
export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_MAX_JOB_ID_LENGTH = 128 as const;

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_FAILURE_REASONS = Object.freeze([
  'packing-problem-build-failed',
  'internal-error',
] as const);

export const POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_LIMITS = deepFreezeOwned({
  maxArrayLength: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxArrayLength,
  maxContainerCount: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxContainerCount,
  maxDepth: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxDepth,
  maxObjectPropertyCount:
    POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxObjectPropertyCount,
  maxPropertyNameCodeUnits:
    POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxPropertyNameCodeUnits,
  maxStringCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxStringCodeUnits,
  maxTotalStringCodeUnits:
    POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxTotalStringCodeUnits,
  maxTotalPropertyCount:
    POLYGON_RIVER_PACKING_PROBLEM_RESULT_VALIDATION_LIMITS.maxTotalPropertyCount,
});

export type PolygonRiverPackingProblemWorkerFailureReasonV1 =
  (typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_FAILURE_REASONS)[number];

export type CandidatePolygonRiverPackingProblemWorkerRequestV1 = Readonly<{
  schemaVersion: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE;
  operation: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION;
  contractStatus: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  input: PolygonRiverPackingProblemInputV1;
}>;

export type CompletedCandidatePolygonRiverPackingProblemWorkerResponseV1 = Readonly<{
  schemaVersion: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE;
  operation: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION;
  contractStatus: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  sourceInput: PolygonRiverPackingProblemInputV1;
  outcome: 'completed';
  reason: null;
  result: PolygonRiverPackingProblemResultV1;
}>;

export type FailedCandidatePolygonRiverPackingProblemWorkerResponseV1 = Readonly<{
  schemaVersion: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION;
  messageType: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE;
  operation: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION;
  contractStatus: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS;
  scientificClaim: typeof POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM;
  jobId: string;
  sourceInput: PolygonRiverPackingProblemInputV1;
  outcome: 'failed';
  reason: PolygonRiverPackingProblemWorkerFailureReasonV1;
  result: null;
}>;

export type CandidatePolygonRiverPackingProblemWorkerResponseV1 =
  | CompletedCandidatePolygonRiverPackingProblemWorkerResponseV1
  | FailedCandidatePolygonRiverPackingProblemWorkerResponseV1;

export type PolygonRiverPackingProblemWorkerProtocolIssueV1 = Readonly<{
  stage: 'snapshot' | 'structure' | 'input' | 'result' | 'invariant';
  path: string;
  code: string;
  message: string;
}>;

export type ParseCandidatePolygonRiverPackingProblemWorkerRequestV1Result =
  | Readonly<{ ok: true; value: CandidatePolygonRiverPackingProblemWorkerRequestV1 }>
  | Readonly<{ ok: false; error: readonly PolygonRiverPackingProblemWorkerProtocolIssueV1[] }>;

export type ParseCandidatePolygonRiverPackingProblemWorkerResponseV1Result =
  | Readonly<{ ok: true; value: CandidatePolygonRiverPackingProblemWorkerResponseV1 }>
  | Readonly<{ ok: false; error: readonly PolygonRiverPackingProblemWorkerProtocolIssueV1[] }>;

type MutableIssue = PolygonRiverPackingProblemWorkerProtocolIssueV1;

const REQUEST_KEYS = [
  'schemaVersion',
  'messageType',
  'operation',
  'contractStatus',
  'scientificClaim',
  'jobId',
  'input',
] as const;

const RESPONSE_KEYS = [
  'schemaVersion',
  'messageType',
  'operation',
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
  error: readonly MutableIssue[],
): ParseCandidatePolygonRiverPackingProblemWorkerRequestV1Result {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function responseFailure(
  error: readonly MutableIssue[],
): ParseCandidatePolygonRiverPackingProblemWorkerResponseV1Result {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
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

export function isPolygonRiverPackingProblemWorkerJobIdV1(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= POLYGON_RIVER_PACKING_PROBLEM_WORKER_MAX_JOB_ID_LENGTH &&
    JOB_ID_PATTERN.test(value)
  );
}

export function isPolygonRiverPackingProblemWorkerFailureReasonV1(
  value: unknown,
): value is PolygonRiverPackingProblemWorkerFailureReasonV1 {
  return value === 'packing-problem-build-failed' || value === 'internal-error';
}

function validateCommonLiterals(
  raw: Record<string, unknown>,
  expectedMessageType: string,
  issues: MutableIssue[],
): string | undefined {
  const literals: readonly [string, unknown, unknown][] = [
    [
      'schemaVersion',
      raw.schemaVersion,
      POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    ],
    ['messageType', raw.messageType, expectedMessageType],
    ['operation', raw.operation, POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION],
    ['contractStatus', raw.contractStatus, POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS],
    ['scientificClaim', raw.scientificClaim, POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM],
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

  if (!isPolygonRiverPackingProblemWorkerJobIdV1(raw.jobId)) {
    if (Object.hasOwn(raw, 'jobId')) {
      issues.push({
        stage: 'structure',
        path: '$.jobId',
        code: 'invalid-job-id',
        message: `must be 1-${String(POLYGON_RIVER_PACKING_PROBLEM_WORKER_MAX_JOB_ID_LENGTH)} stable ASCII characters`,
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
  inputIssues: readonly PolygonRiverPackingProblemInputIssue[],
  field: 'input' | 'sourceInput',
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
    maxArrayLength: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxArrayLength,
    maxContainerCount: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxContainerCount + 8,
    maxDepth: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxDepth + 2,
    maxObjectPropertyCount: 16,
    maxPropertyNameCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxPropertyNameCodeUnits,
    maxStringCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxStringCodeUnits,
    maxTotalStringCodeUnits: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxTotalStringCodeUnits + 8_192,
    maxTotalPropertyCount: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxTotalPropertyCount + 64,
  });
}

function responseSnapshot(supplied: unknown): ValidationSnapshot<unknown> {
  const limits = POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_LIMITS;
  return tryCreateStrictValidationSnapshot(supplied, limits);
}

/** Parses one bounded, accessor-free, closed one-job request snapshot. */
export function parseCandidatePolygonRiverPackingProblemWorkerRequestV1(
  supplied: unknown,
): ParseCandidatePolygonRiverPackingProblemWorkerRequestV1Result {
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
    POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE,
    issues,
  );
  const parsedInput = parsePolygonRiverPackingProblemInputV1(raw.input);
  if (!parsedInput.ok) addInputIssues(issues, parsedInput.error, 'input');
  if (issues.length > 0 || jobId === undefined || !parsedInput.ok) return requestFailure(issues);

  const value: CandidatePolygonRiverPackingProblemWorkerRequestV1 = deepFreezeOwned({
    schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
    messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_REQUEST_MESSAGE_TYPE,
    operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
    contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
    scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
    jobId,
    input: parsedInput.value,
  });
  return deepFreezeOwned({ ok: true as const, value });
}

/** Parses and independently validates one closed response snapshot. */
export function parseCandidatePolygonRiverPackingProblemWorkerResponseV1(
  supplied: unknown,
): ParseCandidatePolygonRiverPackingProblemWorkerResponseV1Result {
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
    POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
    issues,
  );
  const parsedSourceInput = parsePolygonRiverPackingProblemInputV1(raw.sourceInput);
  if (!parsedSourceInput.ok) addInputIssues(issues, parsedSourceInput.error, 'sourceInput');

  let completedResult: PolygonRiverPackingProblemResultV1 | undefined;
  if (raw.outcome === 'completed') {
    if (raw.reason !== null) {
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'completed responses require reason to be null',
      });
    }
    if (raw.result === null || raw.result === undefined) {
      issues.push({
        stage: 'invariant',
        path: '$.result',
        code: 'outcome-invariant',
        message: 'completed responses require a packing-problem result',
      });
    } else if (parsedSourceInput.ok) {
      const validation = validatePolygonRiverPackingProblemResultV1(
        parsedSourceInput.value,
        raw.result,
      );
      if (validation.ok) {
        completedResult = validation.value;
      } else {
        for (const violation of validation.violations) {
          issues.push({
            stage: 'result',
            path: violation.path,
            code: violation.code,
            message: violation.message,
          });
        }
      }
    }
  } else if (raw.outcome === 'failed') {
    if (!isPolygonRiverPackingProblemWorkerFailureReasonV1(raw.reason)) {
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
    const value: CompletedCandidatePolygonRiverPackingProblemWorkerResponseV1 = deepFreezeOwned({
      schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
      operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
      contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
      scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
      jobId,
      sourceInput: parsedSourceInput.value,
      outcome: 'completed',
      reason: null,
      result: completedResult,
    });
    return deepFreezeOwned({ ok: true as const, value });
  }

  if (raw.outcome === 'failed' && isPolygonRiverPackingProblemWorkerFailureReasonV1(raw.reason)) {
    const value: FailedCandidatePolygonRiverPackingProblemWorkerResponseV1 = deepFreezeOwned({
      schemaVersion: POLYGON_RIVER_PACKING_PROBLEM_WORKER_PROTOCOL_SCHEMA_VERSION,
      messageType: POLYGON_RIVER_PACKING_PROBLEM_WORKER_RESPONSE_MESSAGE_TYPE,
      operation: POLYGON_RIVER_PACKING_PROBLEM_WORKER_OPERATION,
      contractStatus: POLYGON_RIVER_PACKING_PROBLEM_WORKER_CONTRACT_STATUS,
      scientificClaim: POLYGON_RIVER_PACKING_PROBLEM_WORKER_SCIENTIFIC_CLAIM,
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
