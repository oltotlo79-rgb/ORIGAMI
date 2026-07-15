import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  parseFaceComplexAuditInputV1,
  type FaceComplexAuditInputV1,
} from './face-complex-contract.js';
import {
  auditFaceComplexCandidateV1,
  type FaceComplexAuditIssueCodeV1,
} from './face-complex-v1.js';

export const FACE_COMPLEX_MUTATION_SUITE_RECORD_TYPE = 'm0f-face-complex-mutation-suite' as const;
export const FACE_COMPLEX_MUTATION_SUITE_RESULT_RECORD_TYPE =
  'm0f-face-complex-mutation-suite-result' as const;

export const FACE_COMPLEX_MUTATION_CASE_IDS = [
  'artifact-exact-coordinate',
  'edge-provenance',
  'edge-assignment',
  'face-cycle',
  'triangle-incidence',
  'triangle-area',
  'topology-counter',
  'semantic-duplicate',
  'disconnected-component',
  'bridge-edge',
  'display-coordinate-only',
] as const;

export type FaceComplexMutationCaseIdV1 = (typeof FACE_COMPLEX_MUTATION_CASE_IDS)[number];
export type FaceComplexMutationExpectedOutcomeV1 = 'rejected' | 'accepted';

export type FaceComplexMutationCaseV1 = Readonly<{
  id: FaceComplexMutationCaseIdV1;
  expectedOutcome: FaceComplexMutationExpectedOutcomeV1;
}>;

export type FaceComplexMutationSuiteV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_MUTATION_SUITE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'face-complex-only';
  verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier';
  cases: readonly FaceComplexMutationCaseV1[];
}>;

export type FaceComplexMutationSuiteContractIssueCodeV1 =
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'invalid-array'
  | 'invalid-case-id'
  | 'duplicate-case-id'
  | 'expectation-mismatch';

export type FaceComplexMutationSuiteContractIssueV1 = Readonly<{
  path: string;
  code: FaceComplexMutationSuiteContractIssueCodeV1;
  message: string;
}>;

export type FaceComplexMutationSuiteParseResultV1 =
  | Readonly<{ ok: true; value: FaceComplexMutationSuiteV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexMutationSuiteContractIssueV1[] }>;

export type FaceComplexMutationGenerationIssueV1 = Readonly<{
  stage: 'base-contract' | 'base-audit' | 'mutation-generation' | 'mutation-contract';
  caseId: FaceComplexMutationCaseIdV1 | null;
  path: string;
  code: string;
  message: string;
}>;

export type FaceComplexMutationGenerationResultV1 =
  | Readonly<{ ok: true; value: FaceComplexAuditInputV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexMutationGenerationIssueV1[] }>;

export type FaceComplexMutationObservedOutcomeV1 = 'rejected' | 'accepted';

export type FaceComplexMutationCaseResultV1 = Readonly<{
  id: FaceComplexMutationCaseIdV1;
  expectedOutcome: FaceComplexMutationExpectedOutcomeV1;
  observedOutcome: FaceComplexMutationObservedOutcomeV1;
  observedIssueCode: FaceComplexAuditIssueCodeV1 | null;
  expectationMet: true;
}>;

export type FaceComplexMutationSuiteConsistentV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_MUTATION_SUITE_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'face-complex-only';
  verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier';
  suiteOutcome: 'expectations-met';
  cases: readonly FaceComplexMutationCaseResultV1[];
}>;

export type FaceComplexMutationSuiteRunIssueV1 = Readonly<{
  stage:
    | 'suite-contract'
    | 'base-contract'
    | 'base-audit'
    | 'mutation-generation'
    | 'mutation-contract'
    | 'mutation-audit'
    | 'runner-internal';
  caseId: FaceComplexMutationCaseIdV1 | null;
  path: string;
  code: string;
  message: string;
}>;

export type FaceComplexMutationSuiteRunResultV1 =
  | Readonly<{ ok: true; value: FaceComplexMutationSuiteConsistentV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexMutationSuiteRunIssueV1[] }>;

export type FaceComplexMutationSuiteResultContractIssueCodeV1 =
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'invalid-array'
  | 'invalid-case-id'
  | 'duplicate-case-id'
  | 'case-order-mismatch'
  | 'expectation-mismatch'
  | 'observed-outcome-mismatch'
  | 'issue-code-mismatch';

export type FaceComplexMutationSuiteResultContractIssueV1 = Readonly<{
  path: string;
  code: FaceComplexMutationSuiteResultContractIssueCodeV1;
  message: string;
}>;

export type FaceComplexMutationSuiteResultParseResultV1 =
  | Readonly<{ ok: true; value: FaceComplexMutationSuiteConsistentV1 }>
  | Readonly<{
      ok: false;
      error: readonly FaceComplexMutationSuiteResultContractIssueV1[];
    }>;

const ROOT_KEYS = [
  'cases',
  'contractStatus',
  'recordType',
  'schemaVersion',
  'scientificClaim',
  'scope',
  'verificationIndependence',
] as const;
const CASE_KEYS = ['expectedOutcome', 'id'] as const;
const RESULT_ROOT_KEYS = [
  'cases',
  'contractStatus',
  'recordType',
  'schemaVersion',
  'scientificClaim',
  'scope',
  'suiteOutcome',
  'verificationIndependence',
] as const;
const RESULT_CASE_KEYS = [
  'expectationMet',
  'expectedOutcome',
  'id',
  'observedIssueCode',
  'observedOutcome',
] as const;

const EXPECTED_OUTCOME_BY_CASE: Readonly<
  Record<FaceComplexMutationCaseIdV1, FaceComplexMutationExpectedOutcomeV1>
> = {
  'artifact-exact-coordinate': 'rejected',
  'edge-provenance': 'rejected',
  'edge-assignment': 'rejected',
  'face-cycle': 'rejected',
  'triangle-incidence': 'rejected',
  'triangle-area': 'rejected',
  'topology-counter': 'rejected',
  'semantic-duplicate': 'rejected',
  'disconnected-component': 'rejected',
  'bridge-edge': 'rejected',
  'display-coordinate-only': 'accepted',
};

const EXPECTED_ISSUE_CODE_BY_CASE: Readonly<
  Record<FaceComplexMutationCaseIdV1, FaceComplexAuditIssueCodeV1 | null>
> = {
  'artifact-exact-coordinate': 'artifact-coordinate-surplus',
  'edge-provenance': 'artifact-edge-provenance-invalid',
  'edge-assignment': 'artifact-edge-assignment-invalid',
  'face-cycle': 'boundary-edge-alignment-invalid',
  'triangle-incidence': 'triangle-edge-incidence-invalid',
  'triangle-area': 'triangle-area-invalid',
  'topology-counter': 'topology-counter-invalid',
  'semantic-duplicate': 'triangle-semantic-ids-invalid',
  'disconnected-component': 'artifact-graph-disconnected',
  'bridge-edge': 'dart-traversal-invalid',
  'display-coordinate-only': null,
};

export const FACE_COMPLEX_MUTATION_SUITE_V1: FaceComplexMutationSuiteV1 = deepFreezeOwned({
  schemaVersion: 1 as const,
  recordType: FACE_COMPLEX_MUTATION_SUITE_RECORD_TYPE,
  contractStatus: 'candidate' as const,
  scientificClaim: false as const,
  scope: 'face-complex-only' as const,
  verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier' as const,
  cases: FACE_COMPLEX_MUTATION_CASE_IDS.map((id) => ({
    id,
    expectedOutcome: EXPECTED_OUTCOME_BY_CASE[id],
  })),
});

type JsonRecord = Record<string, unknown>;

interface MutableContractIssue {
  path: string;
  code: FaceComplexMutationSuiteContractIssueCodeV1;
  message: string;
}

interface MutableResultContractIssue {
  path: string;
  code: FaceComplexMutationSuiteResultContractIssueCodeV1;
  message: string;
}

type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;

function isRecord(value: unknown): value is JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function record(value: unknown, message: string): JsonRecord {
  if (!isRecord(value)) throw new TypeError(message);
  return value;
}

function array(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(message);
  return value;
}

/** Rejects accessors, sparse arrays, symbols, cycles, and exotic caller data. */
function isSafeCallerData(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return true;
  }
  if (typeof value !== 'object' || ancestors.has(value)) return false;

  ancestors.add(value);
  try {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || Object.getOwnPropertySymbols(value).length !== 0) {
        return false;
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (
        lengthDescriptor === undefined ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        (lengthDescriptor.value as number) < 0
      ) {
        return false;
      }
      const length = lengthDescriptor.value as number;
      const names = Object.getOwnPropertyNames(value);
      if (names.length !== length + 1 || !names.includes('length')) return false;
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
          return false;
        }
        if (!isSafeCallerData(descriptor.value, ancestors)) return false;
      }
      return true;
    }

    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length !== 0
    ) {
      return false;
    }
    for (const name of Object.getOwnPropertyNames(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, name);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return false;
      }
      if (!isSafeCallerData(descriptor.value, ancestors)) return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    ancestors.delete(value);
  }
}

function addContractIssue(
  issues: MutableContractIssue[],
  path: string,
  code: FaceComplexMutationSuiteContractIssueCodeV1,
  message: string,
): void {
  issues.push({ path, code, message });
}

function validateClosedKeys(
  value: JsonRecord,
  allowed: readonly string[],
  path: string,
  issues: MutableContractIssue[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      addContractIssue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by v1');
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      addContractIssue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function parseCaseId(value: unknown): FaceComplexMutationCaseIdV1 | undefined {
  if (
    typeof value !== 'string' ||
    !(FACE_COMPLEX_MUTATION_CASE_IDS as readonly string[]).includes(value)
  ) {
    return undefined;
  }
  return value as FaceComplexMutationCaseIdV1;
}

function parseFaceComplexMutationSuiteUncheckedV1(
  supplied: unknown,
): FaceComplexMutationSuiteParseResultV1 {
  if (!isSafeCallerData(supplied, new WeakSet<object>())) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'suite must be finite plain data without accessors, symbols, or cycles',
        },
      ],
    });
  }

  let snapshot: unknown;
  try {
    snapshot = structuredClone(supplied);
  } catch {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'suite snapshot could not be cloned',
        },
      ],
    });
  }

  const issues: MutableContractIssue[] = [];
  if (!isRecord(snapshot)) {
    addContractIssue(issues, '$', 'invalid-object', 'suite must be an object');
    return deepFreezeOwned({ ok: false as const, error: issues });
  }
  validateClosedKeys(snapshot, ROOT_KEYS, '$', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['$.schemaVersion', snapshot.schemaVersion, 1],
    ['$.recordType', snapshot.recordType, FACE_COMPLEX_MUTATION_SUITE_RECORD_TYPE],
    ['$.contractStatus', snapshot.contractStatus, 'candidate'],
    ['$.scientificClaim', snapshot.scientificClaim, false],
    ['$.scope', snapshot.scope, 'face-complex-only'],
    [
      '$.verificationIndependence',
      snapshot.verificationIndependence,
      'semantic-mutation-regression-not-full-reference-verifier',
    ],
  ];
  for (const [path, actual, expected] of literals) {
    if (actual !== expected) {
      addContractIssue(issues, path, 'invalid-literal', `must equal ${JSON.stringify(expected)}`);
    }
  }

  const parsedCases: FaceComplexMutationCaseV1[] = [];
  const seen = new Set<FaceComplexMutationCaseIdV1>();
  if (!Array.isArray(snapshot.cases) || snapshot.cases.length === 0) {
    addContractIssue(issues, '$.cases', 'invalid-array', 'must contain at least one mutation case');
  } else {
    for (const [index, entry] of snapshot.cases.entries()) {
      const path = `$.cases[${index}]`;
      if (!isRecord(entry)) {
        addContractIssue(issues, path, 'invalid-object', 'mutation case must be an object');
        continue;
      }
      validateClosedKeys(entry, CASE_KEYS, path, issues);
      const id = parseCaseId(entry.id);
      if (id === undefined) {
        addContractIssue(issues, `${path}.id`, 'invalid-case-id', 'case ID is not declared by v1');
        continue;
      }
      if (seen.has(id)) {
        addContractIssue(issues, `${path}.id`, 'duplicate-case-id', 'case ID must be unique');
      }
      seen.add(id);
      const expectedOutcome = EXPECTED_OUTCOME_BY_CASE[id];
      if (entry.expectedOutcome !== expectedOutcome) {
        addContractIssue(
          issues,
          `${path}.expectedOutcome`,
          'expectation-mismatch',
          `case ${id} must expect ${expectedOutcome}`,
        );
        continue;
      }
      parsedCases.push({ id, expectedOutcome });
    }
  }

  if (issues.length !== 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: FACE_COMPLEX_MUTATION_SUITE_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      scope: 'face-complex-only' as const,
      verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier' as const,
      cases: parsedCases,
    },
  });
}

export function parseFaceComplexMutationSuiteV1(
  supplied: unknown,
): FaceComplexMutationSuiteParseResultV1 {
  try {
    return parseFaceComplexMutationSuiteUncheckedV1(supplied);
  } catch {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'suite validation failed closed on an unexpected host condition',
        },
      ],
    });
  }
}

function addResultContractIssue(
  issues: MutableResultContractIssue[],
  path: string,
  code: FaceComplexMutationSuiteResultContractIssueCodeV1,
  message: string,
): void {
  issues.push({ path, code, message });
}

function validateResultClosedKeys(
  value: JsonRecord,
  allowed: readonly string[],
  path: string,
  issues: MutableResultContractIssue[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      addResultContractIssue(
        issues,
        `${path}.${key}`,
        'unknown-field',
        'field is not declared by mutation suite result v1',
      );
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      addResultContractIssue(
        issues,
        `${path}.${key}`,
        'missing-field',
        'required field is missing',
      );
    }
  }
}

function parseFaceComplexMutationSuiteResultUncheckedV1(
  supplied: unknown,
): FaceComplexMutationSuiteResultParseResultV1 {
  if (!isSafeCallerData(supplied, new WeakSet<object>())) {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'result must be finite plain data without accessors, symbols, or cycles',
        },
      ],
    });
  }

  let snapshot: unknown;
  try {
    snapshot = structuredClone(supplied);
  } catch {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'result snapshot could not be cloned',
        },
      ],
    });
  }

  const issues: MutableResultContractIssue[] = [];
  if (!isRecord(snapshot)) {
    addResultContractIssue(issues, '$', 'invalid-object', 'result must be an object');
    return deepFreezeOwned({ ok: false as const, error: issues });
  }
  validateResultClosedKeys(snapshot, RESULT_ROOT_KEYS, '$', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['$.schemaVersion', snapshot.schemaVersion, 1],
    ['$.recordType', snapshot.recordType, FACE_COMPLEX_MUTATION_SUITE_RESULT_RECORD_TYPE],
    ['$.contractStatus', snapshot.contractStatus, 'candidate'],
    ['$.scientificClaim', snapshot.scientificClaim, false],
    ['$.scope', snapshot.scope, 'face-complex-only'],
    [
      '$.verificationIndependence',
      snapshot.verificationIndependence,
      'semantic-mutation-regression-not-full-reference-verifier',
    ],
    ['$.suiteOutcome', snapshot.suiteOutcome, 'expectations-met'],
  ];
  for (const [path, actual, expected] of literals) {
    if (actual !== expected) {
      addResultContractIssue(
        issues,
        path,
        'invalid-literal',
        `must equal ${JSON.stringify(expected)}`,
      );
    }
  }

  const parsedCases: FaceComplexMutationCaseResultV1[] = [];
  const seen = new Set<FaceComplexMutationCaseIdV1>();
  if (
    !Array.isArray(snapshot.cases) ||
    snapshot.cases.length !== FACE_COMPLEX_MUTATION_CASE_IDS.length
  ) {
    addResultContractIssue(
      issues,
      '$.cases',
      'invalid-array',
      `must contain all ${FACE_COMPLEX_MUTATION_CASE_IDS.length} canonical cases`,
    );
  }
  if (Array.isArray(snapshot.cases)) {
    for (const [index, entry] of snapshot.cases.entries()) {
      const path = `$.cases[${index}]`;
      if (!isRecord(entry)) {
        addResultContractIssue(issues, path, 'invalid-object', 'case result must be an object');
        continue;
      }
      validateResultClosedKeys(entry, RESULT_CASE_KEYS, path, issues);
      const id = parseCaseId(entry.id);
      if (id === undefined) {
        addResultContractIssue(
          issues,
          `${path}.id`,
          'invalid-case-id',
          'case ID is not declared by v1',
        );
        continue;
      }
      if (seen.has(id)) {
        addResultContractIssue(issues, `${path}.id`, 'duplicate-case-id', 'case ID must be unique');
      }
      seen.add(id);
      const expectedId = FACE_COMPLEX_MUTATION_CASE_IDS[index];
      if (id !== expectedId) {
        addResultContractIssue(
          issues,
          `${path}.id`,
          'case-order-mismatch',
          `case at index ${index} must be ${expectedId ?? 'absent'}`,
        );
      }
      const expectedOutcome = EXPECTED_OUTCOME_BY_CASE[id];
      if (entry.expectedOutcome !== expectedOutcome) {
        addResultContractIssue(
          issues,
          `${path}.expectedOutcome`,
          'expectation-mismatch',
          `case ${id} must expect ${expectedOutcome}`,
        );
      }
      if (entry.observedOutcome !== expectedOutcome) {
        addResultContractIssue(
          issues,
          `${path}.observedOutcome`,
          'observed-outcome-mismatch',
          `case ${id} must observe ${expectedOutcome}`,
        );
      }
      const expectedIssueCode = EXPECTED_ISSUE_CODE_BY_CASE[id];
      if (entry.observedIssueCode !== expectedIssueCode) {
        addResultContractIssue(
          issues,
          `${path}.observedIssueCode`,
          'issue-code-mismatch',
          `case ${id} must observe ${expectedIssueCode ?? 'no issue code'}`,
        );
      }
      if (entry.expectationMet !== true) {
        addResultContractIssue(
          issues,
          `${path}.expectationMet`,
          'expectation-mismatch',
          'must equal true',
        );
      }
      parsedCases.push({
        id,
        expectedOutcome,
        observedOutcome: expectedOutcome,
        observedIssueCode: expectedIssueCode,
        expectationMet: true,
      });
    }
  }

  if (issues.length !== 0) return deepFreezeOwned({ ok: false as const, error: issues });
  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: FACE_COMPLEX_MUTATION_SUITE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      scope: 'face-complex-only' as const,
      verificationIndependence: 'semantic-mutation-regression-not-full-reference-verifier' as const,
      suiteOutcome: 'expectations-met' as const,
      cases: parsedCases,
    },
  });
}

/** Parses the complete canonical 11-case result used as persisted evidence. */
export function parseFaceComplexMutationSuiteResultV1(
  supplied: unknown,
): FaceComplexMutationSuiteResultParseResultV1 {
  try {
    return parseFaceComplexMutationSuiteResultUncheckedV1(supplied);
  } catch {
    return deepFreezeOwned({
      ok: false as const,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot' as const,
          message: 'result validation failed closed on an unexpected host condition',
        },
      ],
    });
  }
}

function generationFailure(
  stage: FaceComplexMutationGenerationIssueV1['stage'],
  caseId: FaceComplexMutationCaseIdV1 | null,
  path: string,
  code: string,
  message: string,
): FaceComplexMutationGenerationResultV1 {
  return deepFreezeOwned({
    ok: false as const,
    error: [{ stage, caseId, path, code, message }],
  });
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function canonicalRational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) throw new RangeError('rational denominator must not be zero');
  const sign = denominator < 0n ? -1n : 1n;
  const signedNumerator = numerator * sign;
  const positiveDenominator = denominator * sign;
  const divisor = greatestCommonDivisor(signedNumerator, positiveDenominator);
  return {
    numerator: signedNumerator / divisor,
    denominator: positiveDenominator / divisor,
  };
}

function rationalFromJson(value: unknown): Rational {
  const rational = record(value, 'exact rational is missing');
  if (typeof rational.numerator !== 'string' || typeof rational.denominator !== 'string') {
    throw new TypeError('exact rational strings are missing');
  }
  return canonicalRational(BigInt(rational.numerator), BigInt(rational.denominator));
}

function rationalToJson(value: Rational): JsonRecord {
  return { numerator: value.numerator.toString(), denominator: value.denominator.toString() };
}

function addRational(left: Rational, right: Rational): Rational {
  return canonicalRational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractRational(left: Rational, right: Rational): Rational {
  return canonicalRational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyRational(left: Rational, right: Rational): Rational {
  return canonicalRational(left.numerator * right.numerator, left.denominator * right.denominator);
}

function compareRational(left: Rational, right: Rational): number {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function rationalFromFiniteBinary64(value: number): Rational {
  if (!Number.isFinite(value)) throw new RangeError('coordinate must remain finite');
  if (Object.is(value, -0) || value === 0) return canonicalRational(0n, 1n);
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const sign = bits >> 63n === 0n ? 1n : -1n;
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  const significand = exponentBits === 0 ? fraction : (1n << 52n) | fraction;
  const exponent = exponentBits === 0 ? -1074 : exponentBits - 1023 - 52;
  if (exponent >= 0) return canonicalRational(sign * (significand << BigInt(exponent)), 1n);
  return canonicalRational(sign * significand, 1n << BigInt(-exponent));
}

function exactPointByVertexId(
  artifact: JsonRecord,
): ReadonlyMap<string, readonly [Rational, Rational]> {
  const result = new Map<string, readonly [Rational, Rational]>();
  for (const vertexValue of array(artifact.vertices, 'artifact vertices are missing')) {
    const vertex = record(vertexValue, 'artifact vertex is invalid');
    if (typeof vertex.id !== 'string') throw new TypeError('artifact vertex ID is missing');
    const point = record(vertex.exactCoordinate, 'artifact exact coordinate is missing');
    result.set(vertex.id, [rationalFromJson(point.x), rationalFromJson(point.y)]);
  }
  return result;
}

function triangleTwiceSignedArea(
  ids: readonly string[],
  points: ReadonlyMap<string, readonly [Rational, Rational]>,
): Rational {
  if (ids.length !== 3) throw new TypeError('triangle must contain three vertex IDs');
  const first = points.get(ids[0] ?? '');
  const second = points.get(ids[1] ?? '');
  const third = points.get(ids[2] ?? '');
  if (first === undefined || second === undefined || third === undefined) {
    throw new TypeError('triangle references a missing exact point');
  }
  const firstCross = subtractRational(
    multiplyRational(first[0], second[1]),
    multiplyRational(first[1], second[0]),
  );
  const secondCross = subtractRational(
    multiplyRational(second[0], third[1]),
    multiplyRational(second[1], third[0]),
  );
  const thirdCross = subtractRational(
    multiplyRational(third[0], first[1]),
    multiplyRational(third[1], first[0]),
  );
  return addRational(addRational(firstCross, secondCross), thirdCross);
}

function stringArray(value: unknown, message: string): string[] {
  const entries = array(value, message);
  if (entries.some((entry) => typeof entry !== 'string')) throw new TypeError(message);
  return entries as string[];
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry) => right.includes(entry));
}

function mutateExactCoordinate(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  const vertices = array(artifact.vertices, 'artifact vertices are missing').map((entry) =>
    record(entry, 'artifact vertex is invalid'),
  );
  const first = vertices[0];
  if (first === undefined) throw new TypeError('artifact vertex is missing');
  const coordinate = record(first.exactCoordinate, 'exact coordinate is missing');
  const x = rationalFromJson(coordinate.x);
  const y = rationalFromJson(coordinate.y);
  const occupied = new Set(
    vertices.map((vertex) => {
      const point = record(vertex.exactCoordinate, 'exact coordinate is missing');
      const pointX = rationalFromJson(point.x);
      const pointY = rationalFromJson(point.y);
      return `${pointX.numerator}/${pointX.denominator}|${pointY.numerator}/${pointY.denominator}`;
    }),
  );
  let offset = 1n;
  let mutated = addRational(x, canonicalRational(offset, 1n));
  while (
    occupied.has(`${mutated.numerator}/${mutated.denominator}|${y.numerator}/${y.denominator}`)
  ) {
    offset += 1n;
    mutated = addRational(x, canonicalRational(offset, 1n));
  }
  coordinate.x = rationalToJson(mutated);
}

function mutateEdgeProvenance(bundle: JsonRecord): void {
  const source = record(bundle.source, 'source is missing');
  const assignments = stringArray(source.edgesAssignment, 'source assignments are missing');
  if (assignments.length < 2)
    throw new RangeError('edge-provenance mutation needs two source edges');
  const artifact = record(bundle.artifact, 'artifact is missing');
  const edge = record(
    array(artifact.edges, 'artifact edges are missing')[0],
    'artifact edge is missing',
  );
  const provenance = record(
    array(edge.sourceEdges, 'edge provenance is missing')[0],
    'edge provenance is missing',
  );
  if (!Number.isSafeInteger(provenance.sourceEdgeIndex)) {
    throw new TypeError('source edge index is invalid');
  }
  const target = ((provenance.sourceEdgeIndex as number) + 1) % assignments.length;
  provenance.sourceEdgeIndex = target;
  provenance.assignment = assignments[target];
}

function mutateEdgeAssignment(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  const edge = record(
    array(artifact.edges, 'artifact edges are missing')[0],
    'artifact edge is missing',
  );
  edge.assignment = edge.assignment === 'M' ? 'V' : 'M';
}

function mutateFaceCycle(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  const face = record(
    array(artifact.faces, 'artifact faces are missing')[0],
    'artifact face is missing',
  );
  face.vertexIds = [...stringArray(face.vertexIds, 'face vertex IDs are missing')].reverse();
  face.edgeIds = [...stringArray(face.edgeIds, 'face edge IDs are missing')].reverse();
}

function mutateTriangleIncidence(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  const points = exactPointByVertexId(artifact);
  for (const faceValue of array(artifact.faces, 'artifact faces are missing')) {
    const face = record(faceValue, 'artifact face is invalid');
    const triangles = array(face.triangles, 'face triangles are missing').map((entry) =>
      record(entry, 'face triangle is invalid'),
    );
    for (let sourceIndex = 0; sourceIndex < triangles.length; sourceIndex += 1) {
      const sourceTriangle = triangles[sourceIndex];
      if (sourceTriangle === undefined) continue;
      const sourceIds = stringArray(sourceTriangle.vertexIds, 'triangle vertex IDs are missing');
      const sourceArea = triangleTwiceSignedArea(sourceIds, points);
      for (let targetIndex = 0; targetIndex < triangles.length; targetIndex += 1) {
        const targetTriangle = triangles[targetIndex];
        if (targetTriangle === undefined || targetIndex === sourceIndex) continue;
        const targetIds = stringArray(targetTriangle.vertexIds, 'triangle vertex IDs are missing');
        if (
          !sameStringSet(sourceIds, targetIds) &&
          compareRational(sourceArea, triangleTwiceSignedArea(targetIds, points)) === 0
        ) {
          targetTriangle.vertexIds = [...sourceIds];
          targetTriangle.semanticVertexIds = [...sourceIds];
          return;
        }
      }
    }
  }
  throw new RangeError('triangle-incidence mutation needs two equal-area triangles');
}

function candidateClockwiseTriangles(
  faceVertexIds: readonly string[],
  points: ReadonlyMap<string, readonly [Rational, Rational]>,
): readonly Readonly<{ ids: readonly [string, string, string]; area: Rational }>[] {
  const candidates: Readonly<{ ids: readonly [string, string, string]; area: Rational }>[] = [];
  for (let first = 0; first < faceVertexIds.length; first += 1) {
    for (let second = first + 1; second < faceVertexIds.length; second += 1) {
      for (let third = second + 1; third < faceVertexIds.length; third += 1) {
        const firstId = faceVertexIds[first];
        const secondId = faceVertexIds[second];
        const thirdId = faceVertexIds[third];
        if (firstId === undefined || secondId === undefined || thirdId === undefined) continue;
        let ids: readonly [string, string, string] = [firstId, secondId, thirdId];
        let area = triangleTwiceSignedArea(ids, points);
        if (compareRational(area, canonicalRational(0n, 1n)) > 0) {
          ids = [firstId, thirdId, secondId];
          area = triangleTwiceSignedArea(ids, points);
        }
        if (compareRational(area, canonicalRational(0n, 1n)) < 0) {
          candidates.push({ ids, area });
        }
      }
    }
  }
  return candidates;
}

function mutateTriangleArea(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  const points = exactPointByVertexId(artifact);
  for (const faceValue of array(artifact.faces, 'artifact faces are missing')) {
    const face = record(faceValue, 'artifact face is invalid');
    const faceIds = stringArray(face.vertexIds, 'face vertex IDs are missing');
    const candidates = candidateClockwiseTriangles(faceIds, points);
    for (const triangleValue of array(face.triangles, 'face triangles are missing')) {
      const triangle = record(triangleValue, 'face triangle is invalid');
      const originalIds = stringArray(triangle.vertexIds, 'triangle vertex IDs are missing');
      const originalArea = triangleTwiceSignedArea(originalIds, points);
      const replacement = candidates.find(
        (entry) =>
          !sameStringSet(entry.ids, originalIds) && compareRational(entry.area, originalArea) !== 0,
      );
      if (replacement !== undefined) {
        triangle.vertexIds = [...replacement.ids];
        triangle.semanticVertexIds = [...replacement.ids];
        return;
      }
    }
  }
  throw new RangeError('triangle-area mutation needs a face with an unequal-area triangle');
}

function mutateTopologyCounter(bundle: JsonRecord): void {
  const topology = record(
    record(bundle.artifact, 'artifact is missing').topology,
    'artifact topology is missing',
  );
  if (!Number.isSafeInteger(topology.triangleCount)) {
    throw new TypeError('triangle count is invalid');
  }
  topology.triangleCount = (topology.triangleCount as number) + 1;
}

function mutateSemanticDuplicate(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  const face = record(
    array(artifact.faces, 'artifact faces are missing')[0],
    'artifact face is missing',
  );
  const triangle = record(
    array(face.triangles, 'face triangles are missing')[0],
    'face triangle is missing',
  );
  const ids = stringArray(triangle.vertexIds, 'triangle vertex IDs are missing');
  const first = ids[0];
  const second = ids[1];
  if (first === undefined || second === undefined) throw new TypeError('triangle IDs are missing');
  triangle.semanticVertexIds = [first, first, second];
}

function collectArtifactIds(artifact: JsonRecord): Set<string> {
  const ids = new Set<string>();
  for (const collectionName of ['vertices', 'edges', 'faces'] as const) {
    for (const entryValue of array(
      artifact[collectionName],
      `artifact ${collectionName} missing`,
    )) {
      const entry = record(entryValue, `artifact ${collectionName} entry is invalid`);
      if (typeof entry.id === 'string') ids.add(entry.id);
    }
  }
  return ids;
}

function uniqueId(ids: Set<string>, stem: string): string {
  let id = stem;
  let suffix = 1;
  while (ids.has(id)) {
    id = `${stem}-${suffix}`;
    suffix += 1;
  }
  ids.add(id);
  return id;
}

function incrementTopology(topology: JsonRecord, key: string, amount: number): void {
  const current = topology[key];
  if (!Number.isSafeInteger(current)) throw new TypeError(`topology ${key} is invalid`);
  topology[key] = (current as number) + amount;
}

function appendSourceMappedVertex(
  bundle: JsonRecord,
  ids: Set<string>,
  stem: string,
  x: number,
  y: number,
): Readonly<{ sourceIndex: number; artifactId: string }> {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new RangeError('graph mutation coordinate must be finite');
  }
  const source = record(bundle.source, 'source is missing');
  const sourceVertices = array(source.verticesCoords, 'source vertices are missing');
  const sourceIndex = sourceVertices.length;
  sourceVertices.push([x, y]);

  const artifact = record(bundle.artifact, 'artifact is missing');
  const artifactId = uniqueId(ids, stem);
  array(artifact.vertices, 'artifact vertices are missing').push({
    id: artifactId,
    exactCoordinate: {
      x: rationalToJson(rationalFromFiniteBinary64(x)),
      y: rationalToJson(rationalFromFiniteBinary64(y)),
    },
    displayCoordinate: [x, y],
    sourceVertexIndex: sourceIndex,
  });
  const topology = record(artifact.topology, 'artifact topology is missing');
  incrementTopology(topology, 'sourceVertexCount', 1);
  incrementTopology(topology, 'planarVertexCount', 1);
  return { sourceIndex, artifactId };
}

function artifactVertexIdForSourceIndex(artifact: JsonRecord, sourceIndex: number): string {
  for (const vertexValue of array(artifact.vertices, 'artifact vertices are missing')) {
    const vertex = record(vertexValue, 'artifact vertex is invalid');
    if (vertex.sourceVertexIndex === sourceIndex && typeof vertex.id === 'string') return vertex.id;
  }
  throw new TypeError('source-mapped artifact vertex is missing');
}

function appendSourceMappedEdge(
  bundle: JsonRecord,
  ids: Set<string>,
  stem: string,
  first: Readonly<{ sourceIndex: number; artifactId: string }>,
  second: Readonly<{ sourceIndex: number; artifactId: string }>,
): void {
  const source = record(bundle.source, 'source is missing');
  const sourceEdges = array(source.edgesVertices, 'source edges are missing');
  const sourceEdgeIndex = sourceEdges.length;
  sourceEdges.push([first.sourceIndex, second.sourceIndex]);
  array(source.edgesAssignment, 'source assignments are missing').push('U');

  const artifact = record(bundle.artifact, 'artifact is missing');
  const edgeId = uniqueId(ids, stem);
  array(artifact.edges, 'artifact edges are missing').push({
    id: edgeId,
    vertexIds: [first.artifactId, second.artifactId],
    assignment: 'U',
    sourceEdges: [
      {
        id: uniqueId(ids, `${stem}-source`),
        sourceEdgeIndex,
        assignment: 'U',
      },
    ],
  });
  const topology = record(artifact.topology, 'artifact topology is missing');
  incrementTopology(topology, 'sourceEdgeCount', 1);
  incrementTopology(topology, 'planarEdgeCount', 1);
}

function graphMutationCoordinates(source: JsonRecord): Readonly<{
  anchorSourceIndex: number;
  bridge: readonly [number, number];
  disconnectedFirst: readonly [number, number];
  disconnectedSecond: readonly [number, number];
}> {
  const vertices = array(source.verticesCoords, 'source vertices are missing');
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let anchorSourceIndex = -1;
  for (const [index, entry] of vertices.entries()) {
    const coordinate = array(entry, 'source coordinate is invalid');
    const x = coordinate[0];
    const y = coordinate[1];
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new TypeError('source coordinate is invalid');
    }
    if (x < minX || (x === minX && y < minY)) {
      minX = x;
      minY = y;
      anchorSourceIndex = index;
    }
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const span = Math.max(1, maxX - minX, maxY - minY);
  const bridge: readonly [number, number] = [minX - span, minY - span];
  const disconnectedFirst: readonly [number, number] = [minX - span * 2, minY - span * 2];
  const disconnectedSecond: readonly [number, number] = [minX - span * 3, minY - span * 2];
  if (
    anchorSourceIndex < 0 ||
    [...bridge, ...disconnectedFirst, ...disconnectedSecond].some(
      (entry) => !Number.isFinite(entry),
    )
  ) {
    throw new RangeError('graph mutation cannot choose finite exterior coordinates');
  }
  return { anchorSourceIndex, bridge, disconnectedFirst, disconnectedSecond };
}

function mutateBridge(bundle: JsonRecord): void {
  const source = record(bundle.source, 'source is missing');
  const artifact = record(bundle.artifact, 'artifact is missing');
  const ids = collectArtifactIds(artifact);
  const coordinates = graphMutationCoordinates(source);
  const endpoint = appendSourceMappedVertex(
    bundle,
    ids,
    'mutation-v-bridge',
    coordinates.bridge[0],
    coordinates.bridge[1],
  );
  appendSourceMappedEdge(
    bundle,
    ids,
    'mutation-e-bridge',
    {
      sourceIndex: coordinates.anchorSourceIndex,
      artifactId: artifactVertexIdForSourceIndex(artifact, coordinates.anchorSourceIndex),
    },
    endpoint,
  );
}

function mutateDisconnectedComponent(bundle: JsonRecord): void {
  const source = record(bundle.source, 'source is missing');
  const artifact = record(bundle.artifact, 'artifact is missing');
  const ids = collectArtifactIds(artifact);
  const coordinates = graphMutationCoordinates(source);
  const first = appendSourceMappedVertex(
    bundle,
    ids,
    'mutation-v-component-1',
    coordinates.disconnectedFirst[0],
    coordinates.disconnectedFirst[1],
  );
  const second = appendSourceMappedVertex(
    bundle,
    ids,
    'mutation-v-component-2',
    coordinates.disconnectedSecond[0],
    coordinates.disconnectedSecond[1],
  );
  appendSourceMappedEdge(bundle, ids, 'mutation-e-component', first, second);
}

function mutateDisplayCoordinates(bundle: JsonRecord): void {
  const artifact = record(bundle.artifact, 'artifact is missing');
  for (const [index, vertexValue] of array(
    artifact.vertices,
    'artifact vertices are missing',
  ).entries()) {
    const vertex = record(vertexValue, 'artifact vertex is invalid');
    vertex.displayCoordinate = [1_000_000 + index, -1_000_000 - index];
  }
}

function applyMutation(bundle: JsonRecord, caseId: FaceComplexMutationCaseIdV1): void {
  switch (caseId) {
    case 'artifact-exact-coordinate':
      mutateExactCoordinate(bundle);
      return;
    case 'edge-provenance':
      mutateEdgeProvenance(bundle);
      return;
    case 'edge-assignment':
      mutateEdgeAssignment(bundle);
      return;
    case 'face-cycle':
      mutateFaceCycle(bundle);
      return;
    case 'triangle-incidence':
      mutateTriangleIncidence(bundle);
      return;
    case 'triangle-area':
      mutateTriangleArea(bundle);
      return;
    case 'topology-counter':
      mutateTopologyCounter(bundle);
      return;
    case 'semantic-duplicate':
      mutateSemanticDuplicate(bundle);
      return;
    case 'disconnected-component':
      mutateDisconnectedComponent(bundle);
      return;
    case 'bridge-edge':
      mutateBridge(bundle);
      return;
    case 'display-coordinate-only':
      mutateDisplayCoordinates(bundle);
  }
}

function generateFromParsedBundle(
  base: FaceComplexAuditInputV1,
  caseId: FaceComplexMutationCaseIdV1,
): FaceComplexMutationGenerationResultV1 {
  let candidate: unknown;
  try {
    candidate = structuredClone(base);
    applyMutation(record(candidate, 'cloned audit bundle is invalid'), caseId);
  } catch {
    return generationFailure(
      'mutation-generation',
      caseId,
      '$',
      'mutation-precondition-failed',
      'base bundle does not satisfy this deterministic mutation case precondition',
    );
  }
  const parsed = parseFaceComplexAuditInputV1(candidate);
  if (!parsed.ok) {
    return generationFailure(
      'mutation-contract',
      caseId,
      parsed.error[0]?.path ?? '$',
      'generated-bundle-contract-rejected',
      'generated mutation did not preserve the face-complex input contract',
    );
  }
  return deepFreezeOwned({ ok: true as const, value: parsed.value });
}

function generateFaceComplexMutationCandidateUncheckedV1(
  suppliedBase: unknown,
  suppliedCaseId: unknown,
): FaceComplexMutationGenerationResultV1 {
  const caseId = parseCaseId(suppliedCaseId);
  if (caseId === undefined) {
    return generationFailure(
      'mutation-generation',
      null,
      '$.caseId',
      'invalid-case-id',
      'mutation case ID is not declared by v1',
    );
  }
  const parsedBase = parseFaceComplexAuditInputV1(suppliedBase);
  if (!parsedBase.ok) {
    return generationFailure(
      'base-contract',
      caseId,
      parsedBase.error[0]?.path ?? '$',
      'base-bundle-contract-rejected',
      'base bundle must satisfy the face-complex input contract',
    );
  }
  const baseAudit = auditFaceComplexCandidateV1(parsedBase.value);
  if (!baseAudit.ok) {
    return generationFailure(
      'base-audit',
      caseId,
      baseAudit.error[0]?.path ?? '$',
      baseAudit.error[0]?.code ?? 'base-audit-rejected',
      'base bundle must be consistent before semantic mutation',
    );
  }
  return generateFromParsedBundle(parsedBase.value, caseId);
}

export function generateFaceComplexMutationCandidateV1(
  suppliedBase: unknown,
  suppliedCaseId: unknown,
): FaceComplexMutationGenerationResultV1 {
  try {
    return generateFaceComplexMutationCandidateUncheckedV1(suppliedBase, suppliedCaseId);
  } catch {
    return generationFailure(
      'mutation-generation',
      parseCaseId(suppliedCaseId) ?? null,
      '$',
      'unexpected-mutation-generation-failure',
      'mutation generation failed closed because of an unexpected internal condition',
    );
  }
}

function runFailure(
  stage: FaceComplexMutationSuiteRunIssueV1['stage'],
  caseId: FaceComplexMutationCaseIdV1 | null,
  path: string,
  code: string,
  message: string,
): FaceComplexMutationSuiteRunResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [{ stage, caseId, path, code, message }] });
}

/**
 * Runs contract-preserving semantic mutations against the independent face
 * audit. This is regression evidence only: it remains candidate/no-claim and
 * is not a complete reference verifier or scientific GO record.
 */
export function runFaceComplexMutationSuiteV1(
  suppliedBase: unknown,
  suppliedSuite: unknown = FACE_COMPLEX_MUTATION_SUITE_V1,
): FaceComplexMutationSuiteRunResultV1 {
  try {
    const parsedSuite = parseFaceComplexMutationSuiteV1(suppliedSuite);
    if (!parsedSuite.ok) {
      return runFailure(
        'suite-contract',
        null,
        parsedSuite.error[0]?.path ?? '$',
        parsedSuite.error[0]?.code ?? 'invalid-suite-contract',
        'mutation suite contract was rejected',
      );
    }
    const parsedBase = parseFaceComplexAuditInputV1(suppliedBase);
    if (!parsedBase.ok) {
      return runFailure(
        'base-contract',
        null,
        parsedBase.error[0]?.path ?? '$',
        parsedBase.error[0]?.code ?? 'invalid-base-contract',
        'base face-complex bundle contract was rejected',
      );
    }
    const baseAudit = auditFaceComplexCandidateV1(parsedBase.value);
    if (!baseAudit.ok) {
      return runFailure(
        'base-audit',
        null,
        baseAudit.error[0]?.path ?? '$',
        baseAudit.error[0]?.code ?? 'base-audit-rejected',
        'base face-complex bundle must be consistent before mutation',
      );
    }

    const results: FaceComplexMutationCaseResultV1[] = [];
    for (const definition of parsedSuite.value.cases) {
      const generated = generateFromParsedBundle(parsedBase.value, definition.id);
      if (!generated.ok) {
        const first = generated.error[0];
        return runFailure(
          first?.stage ?? 'mutation-generation',
          definition.id,
          first?.path ?? '$',
          first?.code ?? 'mutation-generation-failed',
          first?.message ?? 'mutation generation failed',
        );
      }
      const audit = auditFaceComplexCandidateV1(generated.value);
      const observedOutcome: FaceComplexMutationObservedOutcomeV1 = audit.ok
        ? 'accepted'
        : 'rejected';
      const observedIssueCode = audit.ok ? null : (audit.error[0]?.code ?? null);
      if (
        !audit.ok &&
        (observedIssueCode === 'input-contract-rejected' ||
          observedIssueCode === 'unexpected-audit-failure')
      ) {
        return runFailure(
          'mutation-audit',
          definition.id,
          audit.error[0]?.path ?? '$',
          observedIssueCode,
          'contract or internal audit failures do not count as semantic mutation rejection',
        );
      }
      if (observedOutcome !== definition.expectedOutcome) {
        return runFailure(
          'mutation-audit',
          definition.id,
          audit.ok ? '$' : (audit.error[0]?.path ?? '$'),
          'unexpected-mutation-outcome',
          `mutation expected ${definition.expectedOutcome} but was ${observedOutcome}`,
        );
      }
      const expectedIssueCode = EXPECTED_ISSUE_CODE_BY_CASE[definition.id];
      if (observedIssueCode !== expectedIssueCode) {
        return runFailure(
          'mutation-audit',
          definition.id,
          audit.ok ? '$' : (audit.error[0]?.path ?? '$'),
          'unexpected-mutation-issue',
          `mutation expected issue ${expectedIssueCode ?? 'none'} but observed ${observedIssueCode ?? 'none'}`,
        );
      }
      results.push({
        id: definition.id,
        expectedOutcome: definition.expectedOutcome,
        observedOutcome,
        observedIssueCode,
        expectationMet: true,
      });
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: FACE_COMPLEX_MUTATION_SUITE_RESULT_RECORD_TYPE,
        contractStatus: 'candidate' as const,
        scientificClaim: false as const,
        scope: 'face-complex-only' as const,
        verificationIndependence:
          'semantic-mutation-regression-not-full-reference-verifier' as const,
        suiteOutcome: 'expectations-met' as const,
        cases: results,
      },
    });
  } catch {
    return runFailure(
      'runner-internal',
      null,
      '$',
      'unexpected-runner-failure',
      'mutation suite failed closed because of an unexpected internal condition',
    );
  }
}
