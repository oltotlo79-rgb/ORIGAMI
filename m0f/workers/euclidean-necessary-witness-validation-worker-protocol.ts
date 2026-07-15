import { EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS } from '../box-pleating/euclidean-necessary-witness-search-result-validation.js';
import type {
  EuclideanNecessaryWitnessSearchInputV1,
  EuclideanNecessaryWitnessSearchResultV1,
} from '../box-pleating/euclidean-necessary-witness-search.js';
import { deepFreezeOwned } from '../clone-and-freeze.js';
import { stableStringify } from '../stable-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  parseEuclideanNecessaryWitnessCandidateRelayV1,
  parseEuclideanNecessaryWitnessSearchInputForWorkerV1,
} from './euclidean-necessary-witness-search-worker-protocol.js';

export const EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_SCHEMA_VERSION = 1 as const;
export const EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE =
  'm0f-euclidean-necessary-witness-validation-request' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE =
  'm0f-euclidean-necessary-witness-validation-response' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION =
  'independently-replay-euclidean-necessary-witness-search' as const;
export const EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_MAX_ID_LENGTH = 160 as const;
export const EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_PROTOCOL_LIMITS = deepFreezeOwned({
  maxIssues: 512,
});

export type EuclideanNecessaryWitnessValidationWorkerRequestV1 = Readonly<{
  schemaVersion: 1;
  messageType: typeof EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE;
  operation: typeof EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION;
  contractStatus: 'candidate';
  scientificClaim: false;
  jobId: string;
  validationId: string;
  input: EuclideanNecessaryWitnessSearchInputV1;
  candidate: EuclideanNecessaryWitnessSearchResultV1;
}>;

type ResponseBase = Readonly<{
  schemaVersion: 1;
  messageType: typeof EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE;
  operation: typeof EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION;
  contractStatus: 'candidate';
  scientificClaim: false;
  independentReplayPerformed: true;
  generalPolygonRiverPackingSolverIncluded: false;
  packingIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  jobId: string;
  validationId: string;
  sourceInput: EuclideanNecessaryWitnessSearchInputV1;
}>;

export type EuclideanNecessaryWitnessValidationWorkerResponseV1 =
  | (ResponseBase &
      Readonly<{
        outcome: 'validated';
        reason: null;
        result: EuclideanNecessaryWitnessSearchResultV1;
      }>)
  | (ResponseBase &
      Readonly<{
        outcome: 'rejected';
        reason: 'independent-replay-rejected';
        result: null;
      }>);

export type EuclideanNecessaryWitnessValidationWorkerProtocolIssueV1 = Readonly<{
  stage: 'snapshot' | 'structure' | 'input' | 'candidate' | 'invariant';
  path: string;
  code: string;
  message: string;
}>;
type Issue = EuclideanNecessaryWitnessValidationWorkerProtocolIssueV1;
type Failure = Readonly<{ ok: false; error: readonly Issue[] }>;
export type ParseEuclideanNecessaryWitnessValidationWorkerRequestV1Result =
  Readonly<{ ok: true; value: EuclideanNecessaryWitnessValidationWorkerRequestV1 }> | Failure;
export type ParseEuclideanNecessaryWitnessValidationWorkerResponseV1Result =
  Readonly<{ ok: true; value: EuclideanNecessaryWitnessValidationWorkerResponseV1 }> | Failure;

const REQUEST_KEYS = [
  'schemaVersion',
  'messageType',
  'operation',
  'contractStatus',
  'scientificClaim',
  'jobId',
  'validationId',
  'input',
  'candidate',
] as const;
const RESPONSE_KEYS = [
  'schemaVersion',
  'messageType',
  'operation',
  'contractStatus',
  'scientificClaim',
  'independentReplayPerformed',
  'generalPolygonRiverPackingSolverIncluded',
  'packingIncluded',
  'feasibilityDecisionIncluded',
  'globalM0fGo',
  'jobId',
  'validationId',
  'sourceInput',
  'outcome',
  'reason',
  'result',
] as const;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issueList(): Issue[] {
  const issues: Issue[] = [];
  Object.defineProperty(issues, 'push', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: (...entries: Issue[]): number => {
      const remaining =
        EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_PROTOCOL_LIMITS.maxIssues - issues.length;
      if (remaining > 0) Array.prototype.push.apply(issues, entries.slice(0, remaining));
      return issues.length;
    },
  });
  return issues;
}

function fail(error: readonly Issue[]): Failure {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function snapshot(value: unknown) {
  const limits = EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_VALIDATION_LIMITS;
  return tryCreateStrictValidationSnapshot(value, {
    maxArrayLength: limits.maxArrayLength,
    maxContainerCount: limits.maxContainerCount + 1_024,
    maxDepth: limits.maxDepth + 2,
    maxObjectPropertyCount: limits.maxObjectPropertyCount,
    maxPropertyNameCodeUnits: limits.maxPropertyNameCodeUnits,
    maxStringCodeUnits: limits.maxStringCodeUnits,
    maxTotalStringCodeUnits: limits.maxTotalStringCodeUnits + 1_048_576,
    maxTotalPropertyCount: limits.maxTotalPropertyCount + 8_192,
  });
}

function close(raw: Record<string, unknown>, keys: readonly string[], issues: Issue[]): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(raw).sort()) {
    if (!allowed.has(key))
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code: 'unknown-field',
        message: 'field is not declared by v1',
      });
  }
  for (const key of keys) {
    if (!Object.hasOwn(raw, key))
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code: 'missing-field',
        message: 'required field is missing',
      });
  }
}

function validId(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maximum &&
    ID_PATTERN.test(value)
  );
}

function common(
  raw: Record<string, unknown>,
  messageType: string,
  issues: Issue[],
): Readonly<{ jobId?: string; validationId?: string }> {
  const literals: readonly [string, unknown, unknown][] = [
    [
      'schemaVersion',
      raw.schemaVersion,
      EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_SCHEMA_VERSION,
    ],
    ['messageType', raw.messageType, messageType],
    ['operation', raw.operation, EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION],
    ['contractStatus', raw.contractStatus, 'candidate'],
    ['scientificClaim', raw.scientificClaim, false],
  ];
  for (const [key, actual, expected] of literals)
    if (actual !== expected)
      issues.push({
        stage: 'structure',
        path: `$.${key}`,
        code:
          key === 'contractStatus' || key === 'scientificClaim'
            ? 'claim-boundary'
            : 'invalid-literal',
        message: `must equal ${String(expected)}`,
      });
  const result: { jobId?: string; validationId?: string } = {};
  if (validId(raw.jobId, 128)) result.jobId = raw.jobId;
  else
    issues.push({
      stage: 'structure',
      path: '$.jobId',
      code: 'invalid-job-id',
      message: 'job ID must be bounded stable ASCII',
    });
  if (validId(raw.validationId, EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_MAX_ID_LENGTH))
    result.validationId = raw.validationId;
  else
    issues.push({
      stage: 'structure',
      path: '$.validationId',
      code: 'invalid-validation-id',
      message: 'validation ID must be bounded stable ASCII',
    });
  return result;
}

function appendSubIssues(
  issues: Issue[],
  prefix: string,
  entries: readonly Readonly<{ stage: string; path: string; code: string; message: string }>[],
): void {
  for (const entry of entries) {
    issues.push({
      stage: entry.stage === 'candidate' ? 'candidate' : 'input',
      path: `${prefix}${entry.path.startsWith('$.candidate') ? entry.path.slice(11) : entry.path.slice(1)}`,
      code: entry.code,
      message: entry.message,
    });
  }
}

export function parseEuclideanNecessaryWitnessValidationWorkerRequestV1(
  supplied: unknown,
): ParseEuclideanNecessaryWitnessValidationWorkerRequestV1Result {
  const captured = snapshot(supplied);
  if (!captured.ok || !isRecord(captured.value))
    return fail([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'request must be one bounded accessor-free plain snapshot',
      },
    ]);
  const raw = captured.value;
  const issues = issueList();
  close(raw, REQUEST_KEYS, issues);
  const ids = common(
    raw,
    EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE,
    issues,
  );
  const input = parseEuclideanNecessaryWitnessSearchInputForWorkerV1(raw.input);
  if (!input.ok) appendSubIssues(issues, '$.input', input.error);
  const candidate = parseEuclideanNecessaryWitnessCandidateRelayV1(raw.candidate);
  if (!candidate.ok) appendSubIssues(issues, '$.candidate', candidate.error);
  if (
    issues.length > 0 ||
    ids.jobId === undefined ||
    ids.validationId === undefined ||
    !input.ok ||
    !candidate.ok
  )
    return fail(issues);
  return deepFreezeOwned({
    ok: true as const,
    value: deepFreezeOwned({
      schemaVersion: 1,
      messageType: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE,
      operation: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
      contractStatus: 'candidate',
      scientificClaim: false,
      jobId: ids.jobId,
      validationId: ids.validationId,
      input: input.value,
      candidate: candidate.value,
    }),
  });
}

/** Bounded response parsing only; the independent DFS remains inside its Worker. */
export function parseEuclideanNecessaryWitnessValidationWorkerResponseV1(
  supplied: unknown,
): ParseEuclideanNecessaryWitnessValidationWorkerResponseV1Result {
  const captured = snapshot(supplied);
  if (!captured.ok || !isRecord(captured.value))
    return fail([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: 'response must be one bounded accessor-free plain snapshot',
      },
    ]);
  const raw = captured.value;
  const issues = issueList();
  close(raw, RESPONSE_KEYS, issues);
  const ids = common(
    raw,
    EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE,
    issues,
  );
  if (raw.independentReplayPerformed !== true)
    issues.push({
      stage: 'invariant',
      path: '$.independentReplayPerformed',
      code: 'outcome-invariant',
      message: 'must equal true',
    });
  for (const key of [
    'scientificClaim',
    'generalPolygonRiverPackingSolverIncluded',
    'packingIncluded',
    'feasibilityDecisionIncluded',
    'globalM0fGo',
  ] as const)
    if (raw[key] !== false)
      issues.push({
        stage: 'invariant',
        path: `$.${key}`,
        code: 'claim-boundary',
        message: 'must equal false',
      });
  const input = parseEuclideanNecessaryWitnessSearchInputForWorkerV1(raw.sourceInput);
  if (!input.ok) appendSubIssues(issues, '$.sourceInput', input.error);
  let result: EuclideanNecessaryWitnessSearchResultV1 | undefined;
  if (raw.outcome === 'validated') {
    if (raw.reason !== null)
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'validated response requires null reason',
      });
    const parsed = parseEuclideanNecessaryWitnessCandidateRelayV1(raw.result);
    if (!parsed.ok) appendSubIssues(issues, '$.result', parsed.error);
    else result = parsed.value;
  } else if (raw.outcome === 'rejected') {
    if (raw.reason !== 'independent-replay-rejected')
      issues.push({
        stage: 'invariant',
        path: '$.reason',
        code: 'outcome-invariant',
        message: 'rejected response requires the fixed reason',
      });
    if (raw.result !== null)
      issues.push({
        stage: 'invariant',
        path: '$.result',
        code: 'outcome-invariant',
        message: 'rejected response requires null result',
      });
  } else {
    issues.push({
      stage: 'invariant',
      path: '$.outcome',
      code: 'invalid-outcome',
      message: 'invalid validation Worker outcome',
    });
  }
  if (issues.length > 0 || ids.jobId === undefined || ids.validationId === undefined || !input.ok)
    return fail(issues);
  const base = {
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
    jobId: ids.jobId,
    validationId: ids.validationId,
    sourceInput: input.value,
  };
  if (raw.outcome === 'validated' && result !== undefined)
    return deepFreezeOwned({
      ok: true as const,
      value: deepFreezeOwned({ ...base, outcome: 'validated' as const, reason: null, result }),
    });
  if (raw.outcome === 'rejected' && raw.reason === 'independent-replay-rejected')
    return deepFreezeOwned({
      ok: true as const,
      value: deepFreezeOwned({
        ...base,
        outcome: 'rejected' as const,
        reason: 'independent-replay-rejected' as const,
        result: null,
      }),
    });
  return fail([
    { stage: 'invariant', path: '$', code: 'outcome-invariant', message: 'incomplete response' },
  ]);
}

/** Main-thread binding helper with no arithmetic or traversal. */
export function equalEuclideanNecessaryWitnessWorkerSourceV1(
  left: EuclideanNecessaryWitnessSearchInputV1,
  right: EuclideanNecessaryWitnessSearchInputV1,
): boolean {
  return stableStringify(left) === stableStringify(right);
}
