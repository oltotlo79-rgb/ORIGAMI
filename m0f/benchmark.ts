import { HARNESS_SMOKE_FIXTURE_ID } from './canonical-fixtures.js';
import { deepFreezeOwned, tryCreateValidationSnapshot } from './clone-and-freeze.js';
import { serializeJsonLine } from './stable-json.js';

export type BenchmarkScope = 'harness-smoke' | 'm0f-experiment';
export type BenchmarkPhase =
  'harness' | 'generation' | 'face-build' | 'path-planning' | 'verification' | 'end-to-end';
export type BenchmarkOutcome =
  | 'harness-only'
  | 'verified'
  | 'no-solution-certified'
  | 'invalid'
  | 'unsupported'
  | 'rejected'
  | 'inconclusive'
  | 'numerical-failure'
  | 'internal-error';

export type BenchmarkRecord = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-benchmark';
  scope: BenchmarkScope;
  fixtureId: string;
  runId: string;
  phase: BenchmarkPhase;
  outcome: BenchmarkOutcome;
  scientificClaim: boolean;
  startedAt: string;
  durationMs: number;
  seed: number | null;
  versions: Readonly<{
    harnessVersion: string;
    buildHash: string;
    supportProfileId: string | null;
    toleranceProfileId: string | null;
    verifierVersion: string | null;
  }>;
  environment: Readonly<{
    os: string;
    arch: string;
    cpu: string;
    logicalCores: number;
    memoryBytes: number;
    runtime: string;
    runtimeVersion: string;
    browser: string | null;
  }>;
  measurements: Readonly<{
    phaseDurationsMs: Readonly<Record<string, number>>;
    counts: Readonly<Record<string, number>>;
    peakMemoryBytes: number;
    maxResiduals: Readonly<Record<string, number>>;
  }>;
  hashes: Readonly<{
    input: string;
    output: string | null;
    certificate: string | null;
  }>;
}>;

export type BenchmarkValidationIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type BenchmarkValidationResult = Readonly<{
  record?: BenchmarkRecord;
  issues: readonly BenchmarkValidationIssue[];
}>;

export class BenchmarkRecordError extends TypeError {
  readonly issues: readonly BenchmarkValidationIssue[];

  constructor(issues: readonly BenchmarkValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '));
    this.name = 'BenchmarkRecordError';
    this.issues = issues;
  }
}

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'scope',
  'fixtureId',
  'runId',
  'phase',
  'outcome',
  'scientificClaim',
  'startedAt',
  'durationMs',
  'seed',
  'versions',
  'environment',
  'measurements',
  'hashes',
] as const;
const VERSION_KEYS = [
  'harnessVersion',
  'buildHash',
  'supportProfileId',
  'toleranceProfileId',
  'verifierVersion',
] as const;
const ENVIRONMENT_KEYS = [
  'os',
  'arch',
  'cpu',
  'logicalCores',
  'memoryBytes',
  'runtime',
  'runtimeVersion',
  'browser',
] as const;
const MEASUREMENT_KEYS = ['phaseDurationsMs', 'counts', 'peakMemoryBytes', 'maxResiduals'] as const;
const HASH_KEYS = ['input', 'output', 'certificate'] as const;

const SCOPES: readonly BenchmarkScope[] = ['harness-smoke', 'm0f-experiment'];
const PHASES: readonly BenchmarkPhase[] = [
  'harness',
  'generation',
  'face-build',
  'path-planning',
  'verification',
  'end-to-end',
];
const OUTCOMES: readonly BenchmarkOutcome[] = [
  'harness-only',
  'verified',
  'no-solution-certified',
  'invalid',
  'unsupported',
  'rejected',
  'inconclusive',
  'numerical-failure',
  'internal-error',
];
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const METRIC_NAME_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pushIssue(
  issues: BenchmarkValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function validateExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: BenchmarkValidationIssue[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      pushIssue(
        issues,
        `${path}.${key}`,
        'unknown-field',
        'field is not declared by schema version 1',
      );
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      pushIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function validateNonEmptyString(
  value: unknown,
  path: string,
  issues: BenchmarkValidationIssue[],
): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    pushIssue(issues, path, 'invalid-string', 'must be a non-empty string');
    return false;
  }
  return true;
}

function validateNullableString(
  value: unknown,
  path: string,
  issues: BenchmarkValidationIssue[],
): void {
  if (value !== null) {
    validateNonEmptyString(value, path, issues);
  }
}

function validateFiniteNonNegative(
  value: unknown,
  path: string,
  issues: BenchmarkValidationIssue[],
  integer: boolean,
): value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (integer && !Number.isInteger(value))
  ) {
    pushIssue(
      issues,
      path,
      'invalid-number',
      integer ? 'must be a non-negative finite integer' : 'must be a non-negative finite number',
    );
    return false;
  }
  return true;
}

function validateMetricMap(
  value: unknown,
  path: string,
  issues: BenchmarkValidationIssue[],
  integer: boolean,
): void {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'invalid-object', 'must be an object');
    return;
  }
  for (const [key, metric] of Object.entries(value)) {
    if (!METRIC_NAME_PATTERN.test(key)) {
      pushIssue(
        issues,
        `${path}.${key}`,
        'invalid-metric-name',
        'must match /^[a-z][A-Za-z0-9]*$/',
      );
    }
    validateFiniteNonNegative(metric, `${path}.${key}`, issues, integer);
  }
}

function validateHash(value: unknown, path: string, issues: BenchmarkValidationIssue[]): void {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    pushIssue(issues, path, 'invalid-sha256', 'must use sha256:<64 lowercase hex digits>');
  }
}

/**
 * Runtime validation for one schema-version-1 benchmark record.
 * This validates evidence metadata only; it does not execute or endorse a
 * generator, solver, collision checker, or reference verifier.
 */
export function validateBenchmarkRecord(supplied: unknown): BenchmarkValidationResult {
  const issues: BenchmarkValidationIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    pushIssue(
      issues,
      '$',
      'invalid-object',
      'benchmark record must be one cloneable plain JSON-data snapshot',
    );
    return { issues };
  }
  const value = snapshot.value;
  if (!isRecord(value)) {
    pushIssue(issues, '$', 'invalid-object', 'benchmark record must be an object');
    return { issues };
  }

  validateExactKeys(value, ROOT_KEYS, '$', issues);
  if (value.schemaVersion !== 1) {
    pushIssue(issues, '$.schemaVersion', 'unsupported-schema', 'must equal 1');
  }
  if (value.recordType !== 'm0f-benchmark') {
    pushIssue(issues, '$.recordType', 'invalid-literal', 'must equal "m0f-benchmark"');
  }
  if (typeof value.scope !== 'string' || !SCOPES.includes(value.scope as BenchmarkScope)) {
    pushIssue(issues, '$.scope', 'invalid-enum', `must be one of: ${SCOPES.join(', ')}`);
  }
  validateNonEmptyString(value.fixtureId, '$.fixtureId', issues);
  validateNonEmptyString(value.runId, '$.runId', issues);
  if (typeof value.phase !== 'string' || !PHASES.includes(value.phase as BenchmarkPhase)) {
    pushIssue(issues, '$.phase', 'invalid-enum', `must be one of: ${PHASES.join(', ')}`);
  }
  if (typeof value.outcome !== 'string' || !OUTCOMES.includes(value.outcome as BenchmarkOutcome)) {
    pushIssue(issues, '$.outcome', 'invalid-enum', `must be one of: ${OUTCOMES.join(', ')}`);
  }
  if (typeof value.scientificClaim !== 'boolean') {
    pushIssue(issues, '$.scientificClaim', 'invalid-boolean', 'must be a boolean');
  }
  if (
    typeof value.startedAt !== 'string' ||
    !UTC_TIMESTAMP_PATTERN.test(value.startedAt) ||
    Number.isNaN(Date.parse(value.startedAt)) ||
    new Date(value.startedAt).toISOString() !== value.startedAt
  ) {
    pushIssue(
      issues,
      '$.startedAt',
      'invalid-timestamp',
      'must be a real UTC timestamp formatted YYYY-MM-DDTHH:mm:ss.sssZ',
    );
  }
  validateFiniteNonNegative(value.durationMs, '$.durationMs', issues, false);
  if (value.seed !== null) {
    validateFiniteNonNegative(value.seed, '$.seed', issues, true);
  }

  if (!isRecord(value.versions)) {
    pushIssue(issues, '$.versions', 'invalid-object', 'must be an object');
  } else {
    validateExactKeys(value.versions, VERSION_KEYS, '$.versions', issues);
    validateNonEmptyString(value.versions.harnessVersion, '$.versions.harnessVersion', issues);
    validateNonEmptyString(value.versions.buildHash, '$.versions.buildHash', issues);
    validateNullableString(value.versions.supportProfileId, '$.versions.supportProfileId', issues);
    validateNullableString(
      value.versions.toleranceProfileId,
      '$.versions.toleranceProfileId',
      issues,
    );
    validateNullableString(value.versions.verifierVersion, '$.versions.verifierVersion', issues);
  }

  if (!isRecord(value.environment)) {
    pushIssue(issues, '$.environment', 'invalid-object', 'must be an object');
  } else {
    validateExactKeys(value.environment, ENVIRONMENT_KEYS, '$.environment', issues);
    validateNonEmptyString(value.environment.os, '$.environment.os', issues);
    validateNonEmptyString(value.environment.arch, '$.environment.arch', issues);
    validateNonEmptyString(value.environment.cpu, '$.environment.cpu', issues);
    validateFiniteNonNegative(
      value.environment.logicalCores,
      '$.environment.logicalCores',
      issues,
      true,
    );
    validateFiniteNonNegative(
      value.environment.memoryBytes,
      '$.environment.memoryBytes',
      issues,
      true,
    );
    validateNonEmptyString(value.environment.runtime, '$.environment.runtime', issues);
    validateNonEmptyString(
      value.environment.runtimeVersion,
      '$.environment.runtimeVersion',
      issues,
    );
    validateNullableString(value.environment.browser, '$.environment.browser', issues);
  }

  if (!isRecord(value.measurements)) {
    pushIssue(issues, '$.measurements', 'invalid-object', 'must be an object');
  } else {
    validateExactKeys(value.measurements, MEASUREMENT_KEYS, '$.measurements', issues);
    validateMetricMap(
      value.measurements.phaseDurationsMs,
      '$.measurements.phaseDurationsMs',
      issues,
      false,
    );
    validateMetricMap(value.measurements.counts, '$.measurements.counts', issues, true);
    validateFiniteNonNegative(
      value.measurements.peakMemoryBytes,
      '$.measurements.peakMemoryBytes',
      issues,
      true,
    );
    validateMetricMap(
      value.measurements.maxResiduals,
      '$.measurements.maxResiduals',
      issues,
      false,
    );
  }

  if (!isRecord(value.hashes)) {
    pushIssue(issues, '$.hashes', 'invalid-object', 'must be an object');
  } else {
    validateExactKeys(value.hashes, HASH_KEYS, '$.hashes', issues);
    validateHash(value.hashes.input, '$.hashes.input', issues);
    if (value.hashes.output !== null) {
      validateHash(value.hashes.output, '$.hashes.output', issues);
    }
    if (value.hashes.certificate !== null) {
      validateHash(value.hashes.certificate, '$.hashes.certificate', issues);
    }
  }

  if (value.fixtureId === HARNESS_SMOKE_FIXTURE_ID) {
    if (value.scope !== 'harness-smoke') {
      pushIssue(
        issues,
        '$.scope',
        'smoke-claim-violation',
        'the reserved smoke fixture must use harness-smoke',
      );
    }
    if (value.phase !== 'harness') {
      pushIssue(
        issues,
        '$.phase',
        'smoke-claim-violation',
        'the reserved smoke fixture must use harness',
      );
    }
    if (value.outcome !== 'harness-only') {
      pushIssue(
        issues,
        '$.outcome',
        'smoke-claim-violation',
        'the reserved smoke fixture cannot claim a scientific outcome',
      );
    }
    if (value.scientificClaim !== false) {
      pushIssue(
        issues,
        '$.scientificClaim',
        'smoke-claim-violation',
        'the reserved smoke fixture must set false',
      );
    }
    if (isRecord(value.versions)) {
      if (value.versions.supportProfileId !== null) {
        pushIssue(
          issues,
          '$.versions.supportProfileId',
          'smoke-claim-violation',
          'must be null for harness smoke',
        );
      }
      if (value.versions.toleranceProfileId !== null) {
        pushIssue(
          issues,
          '$.versions.toleranceProfileId',
          'smoke-claim-violation',
          'must be null for harness smoke',
        );
      }
      if (value.versions.verifierVersion !== null) {
        pushIssue(
          issues,
          '$.versions.verifierVersion',
          'smoke-claim-violation',
          'must be null for harness smoke',
        );
      }
    }
    if (isRecord(value.hashes)) {
      if (value.hashes.output !== null || value.hashes.certificate !== null) {
        pushIssue(
          issues,
          '$.hashes',
          'smoke-claim-violation',
          'smoke records cannot carry output or certificate hashes',
        );
      }
    }
  } else if (value.scope === 'harness-smoke' || value.outcome === 'harness-only') {
    pushIssue(
      issues,
      '$.fixtureId',
      'reserved-smoke-semantics',
      `harness-smoke and harness-only are reserved for ${HARNESS_SMOKE_FIXTURE_ID}`,
    );
  }

  if (issues.length > 0) {
    return { issues };
  }
  return {
    record: deepFreezeOwned(value) as unknown as BenchmarkRecord,
    issues,
  };
}

/** Serialize an already populated record without adding a clock, seed, or environment data. */
export function serializeBenchmarkRecord(value: unknown): string {
  const result = validateBenchmarkRecord(value);
  if (result.record === undefined) {
    throw new BenchmarkRecordError(result.issues);
  }
  return serializeJsonLine(result.record);
}
