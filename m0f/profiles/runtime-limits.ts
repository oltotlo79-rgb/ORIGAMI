import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';

export const RUNTIME_LIMITS_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/runtime-limits-v1.schema.json' as const;

export const RUNTIME_LIMIT_KEYS = [
  'maxProjectFileBytes',
  'maxFoldFileBytes',
  'maxEvidenceBlobBytes',
  'maxVertices',
  'maxEdges',
  'maxFaces',
  'maxStringCodeUnits',
  'maxJsonDepth',
  'maxGridColumns',
  'maxGridRows',
  'maxHistoryBytes',
  'maxWorkerMessageBytes',
  'maxWorkerCancelResponseMs',
  'maxInputDecimalDigits',
  'minNormalizedFeature',
  'maxNormalizedLengthRatio',
  'maxPaperAspectRatio',
  'maxTreeDegree',
] as const;

export type RuntimeLimitKey = (typeof RUNTIME_LIMIT_KEYS)[number];
export type RuntimeLimitUnit =
  | 'bytes'
  | 'count'
  | 'code-units'
  | 'levels'
  | 'milliseconds'
  | 'decimal-digits'
  | 'normalized-length'
  | 'ratio';

export type RuntimeLimitCandidate = Readonly<{
  unit: RuntimeLimitUnit;
  candidates: readonly number[];
  selected: number | null;
  measurementStatus: 'pending' | 'measured';
  measurementRef: string | null;
  rejectionReasonCode: string;
}>;

export type RuntimeLimitsV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof RUNTIME_LIMITS_SCHEMA_ID;
  profileId: string;
  status: 'candidate' | 'frozen';
  profileHash: string | null;
  limits: Readonly<Record<RuntimeLimitKey, RuntimeLimitCandidate>>;
}>;

export type RuntimeLimitsIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;
export type RuntimeLimitsParseResult =
  | Readonly<{ ok: true; value: RuntimeLimitsV1 }>
  | Readonly<{ ok: false; error: readonly RuntimeLimitsIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'schemaId',
  'profileId',
  'status',
  'profileHash',
  'limits',
] as const;
const LIMIT_KEYS = [
  'unit',
  'candidates',
  'selected',
  'measurementStatus',
  'measurementRef',
  'rejectionReasonCode',
] as const;
const PROFILE_ID_PATTERN = /^[a-z][a-z0-9.-]{0,127}$/;
const REASON_CODE_PATTERN = /^[a-z][a-z0-9.-]{2,127}$/;
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

const LIMIT_SPECIFICATIONS: Readonly<
  Record<RuntimeLimitKey, Readonly<{ unit: RuntimeLimitUnit; integer: boolean }>>
> = {
  maxProjectFileBytes: { unit: 'bytes', integer: true },
  maxFoldFileBytes: { unit: 'bytes', integer: true },
  maxEvidenceBlobBytes: { unit: 'bytes', integer: true },
  maxVertices: { unit: 'count', integer: true },
  maxEdges: { unit: 'count', integer: true },
  maxFaces: { unit: 'count', integer: true },
  maxStringCodeUnits: { unit: 'code-units', integer: true },
  maxJsonDepth: { unit: 'levels', integer: true },
  maxGridColumns: { unit: 'count', integer: true },
  maxGridRows: { unit: 'count', integer: true },
  maxHistoryBytes: { unit: 'bytes', integer: true },
  maxWorkerMessageBytes: { unit: 'bytes', integer: true },
  maxWorkerCancelResponseMs: { unit: 'milliseconds', integer: true },
  maxInputDecimalDigits: { unit: 'decimal-digits', integer: true },
  minNormalizedFeature: { unit: 'normalized-length', integer: false },
  maxNormalizedLengthRatio: { unit: 'ratio', integer: false },
  maxPaperAspectRatio: { unit: 'ratio', integer: false },
  maxTreeDegree: { unit: 'count', integer: true },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addIssue(issues: RuntimeLimitsIssue[], path: string, code: string, message: string): void {
  issues.push({ path, code, message });
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: RuntimeLimitsIssue[],
  unknownCode = 'unknown-field',
  missingCode = 'missing-field',
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key))
      addIssue(issues, `${path}.${key}`, unknownCode, 'field is not declared');
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key))
      addIssue(issues, `${path}.${key}`, missingCode, 'required field is missing');
  }
}

function validateCandidates(
  value: unknown,
  specification: Readonly<{ integer: boolean }>,
  path: string,
  issues: RuntimeLimitsIssue[],
): value is number[] {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, path, 'invalid-candidates', 'must be a non-empty ascending array');
    return false;
  }
  let previous = Number.NEGATIVE_INFINITY;
  let valid = true;
  value.forEach((candidate, index) => {
    if (
      typeof candidate !== 'number' ||
      !Number.isFinite(candidate) ||
      candidate <= 0 ||
      (specification.integer && !Number.isSafeInteger(candidate)) ||
      candidate <= previous
    ) {
      valid = false;
      addIssue(
        issues,
        `${path}[${index}]`,
        'invalid-candidates',
        'values must be positive, strictly ascending, unique, and use the required numeric kind',
      );
    }
    if (typeof candidate === 'number') previous = candidate;
  });
  return valid;
}

/** Runtime validation for candidate and frozen runtime-limit profiles. */
export function parseRuntimeLimitsV1(supplied: unknown): RuntimeLimitsParseResult {
  const issues: RuntimeLimitsIssue[] = [];
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-object',
          message: 'must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const value = snapshot.value;
  if (!isRecord(value)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'must be an object' }],
    };
  }
  exactKeys(value, ROOT_KEYS, '$', issues);
  if (value.schemaVersion !== 1)
    addIssue(issues, '$.schemaVersion', 'invalid-literal', 'must equal 1');
  if (value.schemaId !== RUNTIME_LIMITS_SCHEMA_ID) {
    addIssue(issues, '$.schemaId', 'invalid-literal', `must equal ${RUNTIME_LIMITS_SCHEMA_ID}`);
  }
  if (typeof value.profileId !== 'string' || !PROFILE_ID_PATTERN.test(value.profileId)) {
    addIssue(
      issues,
      '$.profileId',
      'invalid-profile-id',
      'must be a versioned lowercase profile ID',
    );
  }
  const validStatus = value.status === 'candidate' || value.status === 'frozen';
  if (!validStatus) addIssue(issues, '$.status', 'invalid-enum', 'must be candidate or frozen');
  if (
    value.profileHash !== null &&
    (typeof value.profileHash !== 'string' || !SHA256_PATTERN.test(value.profileHash))
  ) {
    addIssue(issues, '$.profileHash', 'invalid-hash', 'must be null or sha256:<64 lowercase hex>');
  }
  if (value.status === 'candidate' && value.profileHash !== null) {
    addIssue(
      issues,
      '$.profileHash',
      'candidate-hash-claim',
      'candidate profileHash must remain null',
    );
  }

  if (!isRecord(value.limits)) {
    addIssue(issues, '$.limits', 'invalid-object', 'must be an object');
  } else {
    exactKeys(
      value.limits,
      RUNTIME_LIMIT_KEYS,
      '$.limits',
      issues,
      'unknown-limit',
      'missing-limit',
    );
    for (const key of RUNTIME_LIMIT_KEYS) {
      const candidate = value.limits[key];
      const path = `$.limits.${key}`;
      if (!isRecord(candidate)) {
        addIssue(issues, path, 'invalid-limit', 'limit entry must be an object');
        continue;
      }
      exactKeys(candidate, LIMIT_KEYS, path, issues);
      const specification = LIMIT_SPECIFICATIONS[key];
      if (candidate.unit !== specification.unit) {
        addIssue(issues, `${path}.unit`, 'unit-mismatch', `must equal ${specification.unit}`);
      }
      const candidatesValid = validateCandidates(
        candidate.candidates,
        specification,
        `${path}.candidates`,
        issues,
      );
      const selected = candidate.selected;
      if (selected !== null) {
        const selectedValid =
          typeof selected === 'number' &&
          Number.isFinite(selected) &&
          selected > 0 &&
          (!specification.integer || Number.isSafeInteger(selected));
        if (!selectedValid) {
          addIssue(
            issues,
            `${path}.selected`,
            'invalid-selection',
            'must be null or a valid positive value',
          );
        } else if (candidatesValid && !(candidate.candidates as number[]).includes(selected)) {
          addIssue(
            issues,
            `${path}.selected`,
            'selection-not-candidate',
            'must be one of the enumerated candidates',
          );
        }
      }
      if (candidate.measurementStatus !== 'pending' && candidate.measurementStatus !== 'measured') {
        addIssue(
          issues,
          `${path}.measurementStatus`,
          'invalid-enum',
          'must be pending or measured',
        );
      }
      const validMeasurementRef =
        candidate.measurementRef === null ||
        (typeof candidate.measurementRef === 'string' && candidate.measurementRef.trim() !== '');
      if (!validMeasurementRef) {
        addIssue(
          issues,
          `${path}.measurementRef`,
          'invalid-reference',
          'must be null or a non-empty evidence reference',
        );
      }
      if (candidate.measurementStatus === 'pending' && candidate.measurementRef !== null) {
        addIssue(
          issues,
          `${path}.measurementRef`,
          'premature-evidence-claim',
          'pending entries must use null',
        );
      }
      if (candidate.measurementStatus === 'measured' && candidate.measurementRef === null) {
        addIssue(
          issues,
          `${path}.measurementRef`,
          'missing-measurement',
          'measured entries require evidence',
        );
      }
      if (
        typeof candidate.rejectionReasonCode !== 'string' ||
        !REASON_CODE_PATTERN.test(candidate.rejectionReasonCode)
      ) {
        addIssue(
          issues,
          `${path}.rejectionReasonCode`,
          'invalid-reason-code',
          'must be a stable dotted reason code',
        );
      }
      if (
        value.status === 'frozen' &&
        (selected === null ||
          candidate.measurementStatus !== 'measured' ||
          candidate.measurementRef === null)
      ) {
        addIssue(
          issues,
          path,
          'incomplete-frozen-profile',
          'frozen limits require selected measured values and evidence references',
        );
      }
    }
  }
  if (
    value.status === 'frozen' &&
    (typeof value.profileHash !== 'string' || !SHA256_PATTERN.test(value.profileHash))
  ) {
    addIssue(
      issues,
      '$.profileHash',
      'incomplete-frozen-profile',
      'frozen profile requires a SHA-256 profile hash',
    );
  }

  if (issues.length > 0) return { ok: false, error: issues };
  return { ok: true, value: deepFreezeOwned(value) as unknown as RuntimeLimitsV1 };
}
