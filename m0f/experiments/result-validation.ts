import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { parseCandidateFoldFaceReconstructionV1 } from '../geometry/fold-face-reconstruction-result.js';
import { FACE_COMPLEX_AUDIT_EXPERIMENT_ID } from './face-complex-audit.js';
import { FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID } from './face-reconstruction.js';
import { NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID } from './numeric-kernel.js';
import { SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID } from './square-grid-quantization.js';
import { validateSquareGridQuantizationCompletedResultV1 } from './square-grid-result-validation.js';

export type CompletedExperimentResultViolation = Readonly<{
  path: string;
  message: string;
}>;

export type CompletedExperimentResultValidation =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      violations: readonly CompletedExperimentResultViolation[];
    }>;

const ORIENTATION_RESULT_KEYS = [
  'comparisonCount',
  'exactFallbackCount',
  'fastFilterCount',
  'mismatchCount',
  'oracleAgreement',
  'signCounts',
] as const;
const SIGN_COUNT_KEYS = ['negative', 'positive', 'zero'] as const;
const FACE_COMPLEX_AUDIT_RESULT_KEYS = [
  'auditOutcome',
  'contractStatus',
  'implementationRole',
  'recordType',
  'schemaVersion',
  'scientificClaim',
  'scope',
  'topology',
  'verificationIndependence',
] as const;
const FACE_COMPLEX_AUDIT_TOPOLOGY_KEYS = [
  'boundedFaceCount',
  'createdIntersectionVertexCount',
  'eulerValue',
  'nonDyadicVertexCount',
  'planarEdgeCount',
  'planarVertexCount',
  'sourceEdgeCount',
  'sourceVertexCount',
  'triangleCount',
] as const;
const VALID = Object.freeze({ ok: true as const });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(
  violations: readonly CompletedExperimentResultViolation[],
): CompletedExperimentResultValidation {
  return deepFreezeOwned({
    ok: false as const,
    violations: violations.map((violation) => ({ ...violation })),
  });
}

function closedKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  violations: CompletedExperimentResultViolation[],
): void {
  const expectedSet = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) {
      violations.push({ path: `${path}.${key}`, message: 'field is not declared' });
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      violations.push({ path: `${path}.${key}`, message: 'required field is missing' });
    }
  }
}

function nonnegativeSafeInteger(
  value: unknown,
  path: string,
  violations: CompletedExperimentResultViolation[],
): number | undefined {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    violations.push({ path, message: 'must be a non-negative safe integer' });
    return undefined;
  }
  return value;
}

function validateOrientationResult(result: unknown): CompletedExperimentResultValidation {
  const snapshot = tryCreateValidationSnapshot(result);
  if (!snapshot.ok) {
    return invalid([
      {
        path: '$.result',
        message: `must be one plain cloneable JSON-data snapshot; received ${snapshot.reason}`,
      },
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return invalid([{ path: '$.result', message: 'must be an object' }]);
  }

  const root = snapshot.value;
  const violations: CompletedExperimentResultViolation[] = [];
  closedKeys(root, ORIENTATION_RESULT_KEYS, '$.result', violations);

  const comparisonCount = Object.hasOwn(root, 'comparisonCount')
    ? nonnegativeSafeInteger(root.comparisonCount, '$.result.comparisonCount', violations)
    : undefined;
  const fastFilterCount = Object.hasOwn(root, 'fastFilterCount')
    ? nonnegativeSafeInteger(root.fastFilterCount, '$.result.fastFilterCount', violations)
    : undefined;
  const exactFallbackCount = Object.hasOwn(root, 'exactFallbackCount')
    ? nonnegativeSafeInteger(root.exactFallbackCount, '$.result.exactFallbackCount', violations)
    : undefined;
  const mismatchCount = Object.hasOwn(root, 'mismatchCount')
    ? nonnegativeSafeInteger(root.mismatchCount, '$.result.mismatchCount', violations)
    : undefined;

  const oracleAgreement = root.oracleAgreement;
  const oracleAgreementValid =
    Object.hasOwn(root, 'oracleAgreement') && typeof oracleAgreement === 'boolean';
  if (Object.hasOwn(root, 'oracleAgreement') && !oracleAgreementValid) {
    violations.push({ path: '$.result.oracleAgreement', message: 'must be a boolean' });
  }

  let negative: number | undefined;
  let zero: number | undefined;
  let positive: number | undefined;
  if (Object.hasOwn(root, 'signCounts')) {
    if (!isRecord(root.signCounts)) {
      violations.push({ path: '$.result.signCounts', message: 'must be an object' });
    } else {
      closedKeys(root.signCounts, SIGN_COUNT_KEYS, '$.result.signCounts', violations);
      if (Object.hasOwn(root.signCounts, 'negative')) {
        negative = nonnegativeSafeInteger(
          root.signCounts.negative,
          '$.result.signCounts.negative',
          violations,
        );
      }
      if (Object.hasOwn(root.signCounts, 'zero')) {
        zero = nonnegativeSafeInteger(root.signCounts.zero, '$.result.signCounts.zero', violations);
      }
      if (Object.hasOwn(root.signCounts, 'positive')) {
        positive = nonnegativeSafeInteger(
          root.signCounts.positive,
          '$.result.signCounts.positive',
          violations,
        );
      }
    }
  }

  if (
    comparisonCount !== undefined &&
    fastFilterCount !== undefined &&
    exactFallbackCount !== undefined &&
    BigInt(fastFilterCount) + BigInt(exactFallbackCount) !== BigInt(comparisonCount)
  ) {
    violations.push({
      path: '$.result.comparisonCount',
      message: 'must equal fastFilterCount + exactFallbackCount',
    });
  }
  if (
    comparisonCount !== undefined &&
    negative !== undefined &&
    zero !== undefined &&
    positive !== undefined &&
    BigInt(negative) + BigInt(zero) + BigInt(positive) !== BigInt(comparisonCount)
  ) {
    violations.push({
      path: '$.result.signCounts',
      message: 'negative + zero + positive must equal comparisonCount',
    });
  }
  if (
    comparisonCount !== undefined &&
    mismatchCount !== undefined &&
    mismatchCount > comparisonCount
  ) {
    violations.push({
      path: '$.result.mismatchCount',
      message: 'must not exceed comparisonCount',
    });
  }
  if (
    mismatchCount !== undefined &&
    oracleAgreementValid &&
    oracleAgreement !== (mismatchCount === 0)
  ) {
    violations.push({
      path: '$.result.oracleAgreement',
      message: 'must equal (mismatchCount === 0)',
    });
  }

  return violations.length === 0 ? VALID : invalid(violations);
}

function resultPath(parserPath: string): string {
  return parserPath === '$' ? '$.result' : `$.result${parserPath.slice(1)}`;
}

function validateFoldFaceReconstructionResult(
  result: unknown,
): CompletedExperimentResultValidation {
  const parsed = parseCandidateFoldFaceReconstructionV1(result);
  if (parsed.ok) return VALID;
  return invalid(
    parsed.error.map((issue) => ({
      path: resultPath(issue.path),
      message: `[${issue.stage}/${issue.code}] ${issue.message}`,
    })),
  );
}

function exactLiteral(
  value: unknown,
  expected: string | number | boolean,
  path: string,
  violations: CompletedExperimentResultViolation[],
): void {
  if (value !== expected) {
    violations.push({ path, message: `must equal ${JSON.stringify(expected)}` });
  }
}

function validateFaceComplexAuditResult(result: unknown): CompletedExperimentResultValidation {
  const snapshot = tryCreateValidationSnapshot(result);
  if (!snapshot.ok) {
    return invalid([
      {
        path: '$.result',
        message: `must be one plain cloneable JSON-data snapshot; received ${snapshot.reason}`,
      },
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return invalid([{ path: '$.result', message: 'must be an object' }]);
  }

  const root = snapshot.value;
  const violations: CompletedExperimentResultViolation[] = [];
  closedKeys(root, FACE_COMPLEX_AUDIT_RESULT_KEYS, '$.result', violations);
  exactLiteral(root.schemaVersion, 1, '$.result.schemaVersion', violations);
  exactLiteral(root.recordType, 'm0f-face-complex-audit-result', '$.result.recordType', violations);
  exactLiteral(root.contractStatus, 'candidate', '$.result.contractStatus', violations);
  exactLiteral(root.scientificClaim, false, '$.result.scientificClaim', violations);
  exactLiteral(root.scope, 'face-complex-only', '$.result.scope', violations);
  exactLiteral(
    root.implementationRole,
    'independent-auditor',
    '$.result.implementationRole',
    violations,
  );
  exactLiteral(
    root.verificationIndependence,
    'separate-projective-kernel-not-full-reference-verifier',
    '$.result.verificationIndependence',
    violations,
  );
  exactLiteral(root.auditOutcome, 'consistent', '$.result.auditOutcome', violations);

  if (!isRecord(root.topology)) {
    if (Object.hasOwn(root, 'topology')) {
      violations.push({ path: '$.result.topology', message: 'must be an object' });
    }
    return violations.length === 0 ? VALID : invalid(violations);
  }

  const topology = root.topology;
  closedKeys(topology, FACE_COMPLEX_AUDIT_TOPOLOGY_KEYS, '$.result.topology', violations);
  const counts = new Map<string, number>();
  for (const key of FACE_COMPLEX_AUDIT_TOPOLOGY_KEYS) {
    if (key === 'eulerValue') {
      if (Object.hasOwn(topology, key)) {
        exactLiteral(topology[key], 1, `$.result.topology.${key}`, violations);
      }
      continue;
    }
    if (!Object.hasOwn(topology, key)) continue;
    const count = nonnegativeSafeInteger(topology[key], `$.result.topology.${key}`, violations);
    if (count !== undefined) counts.set(key, count);
  }

  const sourceVertexCount = counts.get('sourceVertexCount');
  const sourceEdgeCount = counts.get('sourceEdgeCount');
  const planarVertexCount = counts.get('planarVertexCount');
  const planarEdgeCount = counts.get('planarEdgeCount');
  const boundedFaceCount = counts.get('boundedFaceCount');
  const triangleCount = counts.get('triangleCount');
  const createdIntersectionVertexCount = counts.get('createdIntersectionVertexCount');
  const nonDyadicVertexCount = counts.get('nonDyadicVertexCount');

  for (const [key, minimum] of [
    ['sourceVertexCount', 3],
    ['sourceEdgeCount', 3],
    ['planarVertexCount', 3],
    ['planarEdgeCount', 3],
    ['boundedFaceCount', 1],
  ] as const) {
    const value = counts.get(key);
    if (value !== undefined && value < minimum) {
      violations.push({
        path: `$.result.topology.${key}`,
        message: `must be at least ${minimum}`,
      });
    }
  }
  if (
    sourceVertexCount !== undefined &&
    planarVertexCount !== undefined &&
    createdIntersectionVertexCount !== undefined &&
    BigInt(sourceVertexCount) + BigInt(createdIntersectionVertexCount) !== BigInt(planarVertexCount)
  ) {
    violations.push({
      path: '$.result.topology.createdIntersectionVertexCount',
      message: 'sourceVertexCount + createdIntersectionVertexCount must equal planarVertexCount',
    });
  }
  if (
    nonDyadicVertexCount !== undefined &&
    createdIntersectionVertexCount !== undefined &&
    nonDyadicVertexCount > createdIntersectionVertexCount
  ) {
    violations.push({
      path: '$.result.topology.nonDyadicVertexCount',
      message: 'must not exceed createdIntersectionVertexCount',
    });
  }
  if (
    planarEdgeCount !== undefined &&
    sourceEdgeCount !== undefined &&
    planarEdgeCount < sourceEdgeCount
  ) {
    violations.push({
      path: '$.result.topology.planarEdgeCount',
      message: 'must be at least sourceEdgeCount',
    });
  }
  if (
    triangleCount !== undefined &&
    boundedFaceCount !== undefined &&
    triangleCount < boundedFaceCount
  ) {
    violations.push({
      path: '$.result.topology.triangleCount',
      message: 'must be at least boundedFaceCount',
    });
  }
  if (
    planarVertexCount !== undefined &&
    planarEdgeCount !== undefined &&
    boundedFaceCount !== undefined &&
    BigInt(planarVertexCount) - BigInt(planarEdgeCount) + BigInt(boundedFaceCount) !== 1n
  ) {
    violations.push({
      path: '$.result.topology.eulerValue',
      message: 'planarVertexCount - planarEdgeCount + boundedFaceCount must equal 1',
    });
  }

  return violations.length === 0 ? VALID : invalid(violations);
}

/**
 * Strictly validates completed results for built-in experiment IDs. Unknown
 * IDs deliberately pass so a caller-supplied registry can define its own
 * result contract without modifying this module.
 */
export function validateCompletedExperimentResult(
  experimentId: string,
  result: unknown,
): CompletedExperimentResultValidation {
  if (experimentId === NUMERIC_KERNEL_ORIENTATION_EXPERIMENT_ID) {
    return validateOrientationResult(result);
  }
  if (experimentId === FOLD_FACE_RECONSTRUCTION_EXPERIMENT_ID) {
    return validateFoldFaceReconstructionResult(result);
  }
  if (experimentId === FACE_COMPLEX_AUDIT_EXPERIMENT_ID) {
    return validateFaceComplexAuditResult(result);
  }
  if (experimentId === SQUARE_GRID_QUANTIZATION_EXPERIMENT_ID) {
    return validateSquareGridQuantizationCompletedResultV1(result);
  }
  return VALID;
}
