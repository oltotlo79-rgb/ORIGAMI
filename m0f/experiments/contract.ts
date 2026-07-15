import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { StableJsonError, stableStringify, type JsonValue } from '../stable-json.js';
import { validateCompletedExperimentResult } from './result-validation.js';

export const EXPERIMENT_RESULT_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/experiment-result-v1.schema.json' as const;
export const EXPERIMENT_RUNNER_VERSION = 'oridesign-m0f-experiment-runner/1.0.0-candidate' as const;

export const EXPERIMENT_REASON_CODES = [
  'experiment.request.invalid-id',
  'experiment.request.invalid-engine-version',
  'experiment.request.invalid-seed',
  'experiment.request.invalid-repetition',
  'experiment.request.non-finite-number',
  'experiment.request.invalid-json',
  'experiment.unknown-id',
  'experiment.engine-version-mismatch',
  'experiment.execution.cancelled',
  'experiment.execution.exception',
  'experiment.result.non-finite-number',
  'experiment.result.invalid-json',
  'experiment.result.claim-boundary',
  'experiment.numeric-kernel.invalid-parameters',
  'experiment.numeric-kernel.invalid-input',
  'experiment.numeric-kernel.oracle-mismatch',
  'experiment.face-reconstruction.invalid-parameters',
  'experiment.face-reconstruction.invalid-input',
  'experiment.face-reconstruction.topology-rejected',
  'experiment.face-reconstruction.invariant-failed',
  'experiment.face-complex-audit.invalid-parameters',
  'experiment.face-complex-audit.invalid-contract',
  'experiment.face-complex-audit.inconsistent',
  'experiment.square-grid-quantization.invalid-parameters',
  'experiment.square-grid-quantization.invalid-input',
] as const;

export type ExperimentReasonCode = (typeof EXPERIMENT_REASON_CODES)[number];
export type Sha256Prefixed = `sha256:${string}`;

export type CandidateExperimentRecordV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof EXPERIMENT_RESULT_SCHEMA_ID;
  recordType: 'm0f-experiment-result';
  contractStatus: 'candidate';
  scientificClaim: false;
  runnerVersion: typeof EXPERIMENT_RUNNER_VERSION;
  experimentId: string | null;
  engineVersion: string | null;
  parameterHash: Sha256Prefixed | null;
  inputHash: Sha256Prefixed | null;
  seed: number | null;
  repetition: number | null;
  outcome: 'completed' | 'failed';
  reasonCode: ExperimentReasonCode | null;
  result: JsonValue | null;
  semanticHash: Sha256Prefixed;
}>;

export type CandidateExperimentRequestV1 = Readonly<{
  experimentId: string;
  engineVersion: string;
  parameters: unknown;
  input: unknown;
  seed: number;
  repetition: number;
  signal?: AbortSignal;
}>;

export type CandidateExperimentExecution =
  | Readonly<{ outcome: 'completed'; result: JsonValue }>
  | Readonly<{
      outcome: 'failed';
      reasonCode: ExperimentReasonCode;
      result: JsonValue | null;
    }>;

export type CandidateExperimentContext = Readonly<{
  seed: number;
  repetition: number;
  signal: AbortSignal | undefined;
  checkpoint: () => void;
}>;

export type CandidateExperimentDefinition = Readonly<{
  contractStatus: 'candidate';
  scientificClaim: false;
  experimentId: string;
  engineVersion: string;
  execute: (
    parameters: unknown,
    input: unknown,
    context: CandidateExperimentContext,
  ) => CandidateExperimentExecution | Promise<CandidateExperimentExecution>;
}>;

export type CandidateExperimentRegistry = Readonly<{
  experimentIds: readonly string[];
  resolve: (experimentId: string) => CandidateExperimentDefinition | undefined;
}>;

export type ExperimentRecordIssue = Readonly<{
  path: string;
  code:
    | 'invalid-type'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'invalid-value'
    | 'invalid-hash'
    | 'claim-boundary'
    | 'outcome-invariant'
    | 'semantic-hash-mismatch';
  message: string;
}>;

export type ExperimentRecordParseResult =
  | Readonly<{ ok: true; value: CandidateExperimentRecordV1 }>
  | Readonly<{ ok: false; error: readonly ExperimentRecordIssue[] }>;

const RECORD_KEYS = [
  'schemaVersion',
  'schemaId',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'runnerVersion',
  'experimentId',
  'engineVersion',
  'parameterHash',
  'inputHash',
  'seed',
  'repetition',
  'outcome',
  'reasonCode',
  'result',
  'semanticHash',
] as const;

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const EXPERIMENT_ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const ENGINE_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/+-]*$/;
const MAX_SEED = 0xffff_ffff;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(
  issues: ExperimentRecordIssue[],
  path: string,
  code: ExperimentRecordIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function exactKeys(value: Record<string, unknown>, issues: ExperimentRecordIssue[]): void {
  const allowed = new Set<string>(RECORD_KEYS);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key))
      issue(issues, `$.${key}`, 'unknown-field', 'field is not declared by v1');
  }
  for (const key of RECORD_KEYS) {
    if (!Object.hasOwn(value, key)) issue(issues, `$.${key}`, 'missing-field', 'field is required');
  }
}

export function isValidExperimentId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 128 && EXPERIMENT_ID_PATTERN.test(value);
}

export function isValidEngineVersion(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 128 && ENGINE_VERSION_PATTERN.test(value);
}

export function isValidExperimentSeed(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SEED;
}

export function isValidExperimentRepetition(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

export function isCandidateExperimentDefinition(
  value: unknown,
): value is CandidateExperimentDefinition {
  return captureCandidateExperimentDefinition(value) !== undefined;
}

/** Captures every possibly accessor-backed definition field exactly once. */
export function captureCandidateExperimentDefinition(
  value: unknown,
): CandidateExperimentDefinition | undefined {
  if (!isRecord(value)) return undefined;
  const contractStatus = value.contractStatus;
  const scientificClaim = value.scientificClaim;
  const experimentId = value.experimentId;
  const engineVersion = value.engineVersion;
  const execute = value.execute;
  if (
    contractStatus !== 'candidate' ||
    scientificClaim !== false ||
    !isValidExperimentId(experimentId) ||
    !isValidEngineVersion(engineVersion) ||
    typeof execute !== 'function'
  ) {
    return undefined;
  }
  return Object.freeze({
    contractStatus: 'candidate',
    scientificClaim: false,
    experimentId,
    engineVersion,
    execute: execute as CandidateExperimentDefinition['execute'],
  });
}

function isSha256(value: unknown): value is Sha256Prefixed {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
}

export function isExperimentReasonCode(value: unknown): value is ExperimentReasonCode {
  return (
    typeof value === 'string' && (EXPERIMENT_REASON_CODES as readonly string[]).includes(value)
  );
}

function invalidStableJsonKind(error: unknown): 'non-finite-number' | 'invalid-json' {
  return error instanceof StableJsonError && error.message.includes('number must be finite')
    ? 'non-finite-number'
    : 'invalid-json';
}

export type StableJsonInspection =
  | Readonly<{ ok: true; serialized: string }>
  | Readonly<{ ok: false; kind: 'non-finite-number' | 'invalid-json' }>;

export function inspectStableJson(value: unknown): StableJsonInspection {
  try {
    return { ok: true, serialized: stableStringify(value) };
  } catch (error) {
    return { ok: false, kind: invalidStableJsonKind(error) };
  }
}

export type CandidateResultClaimInspection =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; violations: readonly Readonly<{ path: string; message: string }>[] }>;

const FORBIDDEN_CANDIDATE_RESULT_LITERALS = new Set(['verified', 'no-solution-certified']);

/** Prevents a generic experiment payload from smuggling a product verification claim. */
export function inspectCandidateResultClaimBoundary(
  value: unknown,
): CandidateResultClaimInspection {
  const violations: { path: string; message: string }[] = [];
  const visit = (current: unknown, path: string): void => {
    if (typeof current === 'string' && FORBIDDEN_CANDIDATE_RESULT_LITERALS.has(current)) {
      violations.push({
        path,
        message: `${current} is outside the candidate experiment result state space`,
      });
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (!isRecord(current)) return;
    for (const [key, entry] of Object.entries(current)) {
      const entryPath = `${path}.${key}`;
      if (key === 'scientificClaim' && entry !== false) {
        violations.push({ path: entryPath, message: 'nested scientificClaim must remain false' });
      }
      if (key === 'contractStatus' && entry !== 'candidate') {
        violations.push({
          path: entryPath,
          message: 'nested contractStatus must remain candidate',
        });
      }
      visit(entry, entryPath);
    }
  };
  visit(value, '$.result');
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

async function sha256Text(value: string): Promise<Sha256Prefixed> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

export async function hashExperimentValue(
  domain: 'parameter' | 'input',
  value: unknown,
): Promise<
  | Readonly<{ ok: true; hash: Sha256Prefixed }>
  | Readonly<{ ok: false; kind: 'non-finite-number' | 'invalid-json' }>
> {
  const inspected = inspectStableJson(value);
  if (!inspected.ok) return inspected;
  return {
    ok: true,
    hash: await sha256Text(`oridesign\0m0f-experiment-${domain}-v1\0${inspected.serialized}`),
  };
}

type SemanticRecordV1 = Omit<CandidateExperimentRecordV1, 'semanticHash'>;

function semanticProjection(record: CandidateExperimentRecordV1 | SemanticRecordV1): JsonValue {
  return {
    schemaVersion: record.schemaVersion,
    schemaId: record.schemaId,
    recordType: record.recordType,
    contractStatus: record.contractStatus,
    scientificClaim: record.scientificClaim,
    runnerVersion: record.runnerVersion,
    experimentId: record.experimentId,
    engineVersion: record.engineVersion,
    parameterHash: record.parameterHash,
    inputHash: record.inputHash,
    seed: record.seed,
    repetition: record.repetition,
    outcome: record.outcome,
    reasonCode: record.reasonCode,
    result: record.result,
  };
}

/** Hashes only semantic fields. Wall-clock time and elapsed time are absent by contract. */
export async function canonicalExperimentSemanticHashV1(
  record: CandidateExperimentRecordV1 | SemanticRecordV1,
): Promise<Sha256Prefixed> {
  const serialized = stableStringify(semanticProjection(record));
  return sha256Text(`oridesign\0m0f-experiment-result-v1\0${serialized}`);
}

export async function createCandidateExperimentRecordV1(
  semantic: Omit<
    SemanticRecordV1,
    | 'schemaVersion'
    | 'schemaId'
    | 'recordType'
    | 'contractStatus'
    | 'scientificClaim'
    | 'runnerVersion'
  >,
): Promise<CandidateExperimentRecordV1> {
  const snapshot = tryCreateValidationSnapshot(semantic);
  if (!snapshot.ok) throw new TypeError('experiment semantics must be cloneable plain JSON data');
  const base: SemanticRecordV1 = {
    ...snapshot.value,
    schemaVersion: 1,
    schemaId: EXPERIMENT_RESULT_SCHEMA_ID,
    recordType: 'm0f-experiment-result',
    contractStatus: 'candidate',
    scientificClaim: false,
    runnerVersion: EXPERIMENT_RUNNER_VERSION,
  };
  const record: CandidateExperimentRecordV1 = {
    ...base,
    semanticHash: await canonicalExperimentSemanticHashV1(base),
  };
  const parsed = await parseCandidateExperimentRecordV1(record);
  if (!parsed.ok) {
    throw new TypeError(`invalid candidate experiment semantics: ${parsed.error[0]?.code}`);
  }
  return parsed.value;
}

/** Runtime parser for persisted experiment records; it also verifies semanticHash. */
export async function parseCandidateExperimentRecordV1(
  supplied: unknown,
): Promise<ExperimentRecordParseResult> {
  const issues: ExperimentRecordIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-type',
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-type', message: 'must be an object' }],
    };
  }
  exactKeys(raw, issues);

  if (raw.schemaVersion !== 1) issue(issues, '$.schemaVersion', 'invalid-literal', 'must be 1');
  if (raw.schemaId !== EXPERIMENT_RESULT_SCHEMA_ID)
    issue(issues, '$.schemaId', 'invalid-literal', 'must use the v1 schema ID');
  if (raw.recordType !== 'm0f-experiment-result')
    issue(issues, '$.recordType', 'invalid-literal', 'must identify an M0F experiment result');
  if (raw.contractStatus !== 'candidate')
    issue(issues, '$.contractStatus', 'claim-boundary', 'must remain candidate');
  if (raw.scientificClaim !== false)
    issue(issues, '$.scientificClaim', 'claim-boundary', 'must remain false');
  if (raw.runnerVersion !== EXPERIMENT_RUNNER_VERSION)
    issue(issues, '$.runnerVersion', 'invalid-literal', 'runner version is not supported');

  if (raw.experimentId !== null && !isValidExperimentId(raw.experimentId))
    issue(issues, '$.experimentId', 'invalid-value', 'must be null or a stable experiment ID');
  if (raw.engineVersion !== null && !isValidEngineVersion(raw.engineVersion))
    issue(issues, '$.engineVersion', 'invalid-value', 'must be null or a stable engine version');
  for (const key of ['parameterHash', 'inputHash'] as const) {
    if (raw[key] !== null && !isSha256(raw[key]))
      issue(issues, `$.${key}`, 'invalid-hash', 'must be null or sha256:<64 lowercase hex>');
  }
  if (raw.seed !== null && !isValidExperimentSeed(raw.seed))
    issue(issues, '$.seed', 'invalid-value', 'must be null or an unsigned 32-bit integer');
  if (raw.repetition !== null && !isValidExperimentRepetition(raw.repetition))
    issue(issues, '$.repetition', 'invalid-value', 'must be null or a non-negative safe integer');
  if (raw.outcome !== 'completed' && raw.outcome !== 'failed')
    issue(issues, '$.outcome', 'invalid-value', 'must be completed or failed');
  if (raw.reasonCode !== null && !isExperimentReasonCode(raw.reasonCode))
    issue(issues, '$.reasonCode', 'invalid-value', 'must be null or a declared v1 reason code');
  if (!isSha256(raw.semanticHash))
    issue(issues, '$.semanticHash', 'invalid-hash', 'must be sha256:<64 lowercase hex>');

  const resultInspection = inspectStableJson(raw.result);
  if (!resultInspection.ok)
    issue(issues, '$.result', 'invalid-value', 'must be finite canonical JSON data or null');
  const claimInspection = inspectCandidateResultClaimBoundary(raw.result);
  if (!claimInspection.ok) {
    for (const violation of claimInspection.violations) {
      issue(issues, violation.path, 'claim-boundary', violation.message);
    }
  }

  if (raw.outcome === 'completed') {
    if (
      raw.experimentId === null ||
      raw.engineVersion === null ||
      raw.parameterHash === null ||
      raw.inputHash === null ||
      raw.seed === null ||
      raw.repetition === null ||
      raw.reasonCode !== null ||
      raw.result === null
    ) {
      issue(
        issues,
        '$',
        'outcome-invariant',
        'completed records require complete provenance, a result, and null reasonCode',
      );
    }
  }
  if (raw.outcome === 'failed' && !isExperimentReasonCode(raw.reasonCode)) {
    issue(issues, '$.reasonCode', 'outcome-invariant', 'failed records require a reason code');
  }
  if (raw.outcome === 'completed' && typeof raw.experimentId === 'string') {
    const knownResult = validateCompletedExperimentResult(raw.experimentId, raw.result);
    if (!knownResult.ok) {
      for (const violation of knownResult.violations) {
        issue(issues, violation.path, 'invalid-value', violation.message);
      }
    }
  }

  if (issues.length > 0) return { ok: false, error: issues };
  const candidate = raw as CandidateExperimentRecordV1;
  const expectedHash = await canonicalExperimentSemanticHashV1(candidate);
  if (candidate.semanticHash !== expectedHash) {
    return {
      ok: false,
      error: [
        {
          path: '$.semanticHash',
          code: 'semantic-hash-mismatch',
          message: 'does not match the canonical semantic fields',
        },
      ],
    };
  }
  return { ok: true, value: deepFreezeOwned(candidate) };
}

/** Creates a closed, duplicate-free candidate registry. */
export function createCandidateExperimentRegistry(
  definitions: readonly CandidateExperimentDefinition[],
): CandidateExperimentRegistry {
  const entries = new Map<string, CandidateExperimentDefinition>();
  for (const suppliedDefinition of definitions) {
    const definition = captureCandidateExperimentDefinition(suppliedDefinition);
    if (definition === undefined) {
      throw new TypeError('experiment definitions must remain candidate-only');
    }
    if (entries.has(definition.experimentId)) {
      throw new TypeError(`duplicate experiment ID: ${definition.experimentId}`);
    }
    entries.set(definition.experimentId, definition);
  }
  const experimentIds = Object.freeze([...entries.keys()].sort());
  return Object.freeze({
    experimentIds,
    resolve: (experimentId: string) => entries.get(experimentId),
  });
}
