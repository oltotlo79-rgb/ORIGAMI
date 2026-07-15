import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { stableStringify } from '../stable-json.js';
import {
  parseFaceComplexAuditInputV1,
  type FaceComplexAuditInputV1,
} from './face-complex-contract.js';
import {
  auditFaceComplexCandidateV1,
  type FaceComplexAuditComputedTopologyV1,
  type FaceComplexAuditConsistentV1,
} from './face-complex-v1.js';

export const FACE_COMPLEX_AUDIT_EVIDENCE_RECORD_TYPE = 'm0f-face-complex-audit-evidence' as const;
export const FACE_COMPLEX_AUDIT_EVIDENCE_REAUDIT_RECORD_TYPE =
  'm0f-face-complex-audit-evidence-reaudit-result' as const;
export const FACE_COMPLEX_AUDITOR_IMPLEMENTATION_ID =
  'oridesign-independent-face-complex-auditor' as const;
export const FACE_COMPLEX_AUDITOR_IMPLEMENTATION_VERSION = '1.0.0-candidate' as const;
export const FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH_CONVENTION =
  'sha256-domain-separated-utf8-lf-source-set-v1' as const;

/**
 * This list is deliberately limited to the independent audit implementation
 * and its direct data-boundary/freezing dependency. Producer geometry is not
 * part of the source set and is not imported by the independent auditor.
 */
export const FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1 = Object.freeze([
  'm0f/clone-and-freeze.ts',
  'm0f/reference-verifier/face-complex-contract.ts',
  'm0f/reference-verifier/face-complex-v1.ts',
  'm0f/reference-verifier/projective-rational.ts',
] as const);

/**
 * SHA-256 over the ordered source list and each source file's SHA-256 after
 * UTF-8 CRLF/CR normalization to LF. A test recomputes this value from source.
 */
export const FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH =
  'sha256:9dfddfae6396fb909e1c6a0065c47189368ec0df133ca14f6cd1ff353bddbcfa' as const;

const EVIDENCE_HASH_DOMAIN = 'oridesign\0m0f-face-complex-audit-evidence-v1\0';
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const IMPLEMENTATION_ID_PATTERN = /^[a-z][a-z0-9.-]{0,127}$/;
const IMPLEMENTATION_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/+:-]{0,127}$/;

const ROOT_KEYS = [
  'auditInput',
  'auditResult',
  'canonicalPayloadHash',
  'contractStatus',
  'implementation',
  'recordType',
  'schemaVersion',
  'scientificClaim',
] as const;
const PAYLOAD_KEYS = ROOT_KEYS.filter((key) => key !== 'canonicalPayloadHash');
const IMPLEMENTATION_KEYS = [
  'implementationId',
  'implementationRole',
  'implementationVersion',
  'sourceSetHash',
  'sourceSetHashConvention',
] as const;
const AUDIT_RESULT_KEYS = [
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
const TOPOLOGY_KEYS = [
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

export type FaceComplexAuditEvidenceSha256V1 = `sha256:${string}`;

export type FaceComplexAuditorImplementationV1 = Readonly<{
  implementationId: string;
  implementationVersion: string;
  implementationRole: 'independent-auditor';
  sourceSetHashConvention: typeof FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH_CONVENTION;
  sourceSetHash: FaceComplexAuditEvidenceSha256V1;
}>;

export type FaceComplexAuditEvidencePayloadV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_AUDIT_EVIDENCE_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  implementation: FaceComplexAuditorImplementationV1;
  auditInput: FaceComplexAuditInputV1;
  auditResult: FaceComplexAuditConsistentV1;
}>;

export type FaceComplexAuditEvidenceV1 = FaceComplexAuditEvidencePayloadV1 &
  Readonly<{
    canonicalPayloadHash: FaceComplexAuditEvidenceSha256V1;
  }>;

export type FaceComplexAuditEvidenceIssueStageV1 =
  | 'evidence-contract'
  | 'audit-input'
  | 'audit-result'
  | 'canonical-hash'
  | 'implementation'
  | 'reaudit'
  | 'evidence-internal';

export type FaceComplexAuditEvidenceIssueCodeV1 =
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'invalid-string'
  | 'invalid-number'
  | 'invalid-hash'
  | 'invalid-audit-input'
  | 'hash-mismatch'
  | 'audit-inconsistent'
  | 'implementation-mismatch'
  | 'saved-result-mismatch'
  | 'unexpected-evidence-failure';

export type FaceComplexAuditEvidenceIssueV1 = Readonly<{
  stage: FaceComplexAuditEvidenceIssueStageV1;
  path: string;
  code: FaceComplexAuditEvidenceIssueCodeV1;
  message: string;
}>;

export type FaceComplexAuditEvidenceParseResultV1 =
  | Readonly<{ ok: true; value: FaceComplexAuditEvidenceV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexAuditEvidenceIssueV1[] }>;

export type CreateFaceComplexAuditEvidenceResultV1 = FaceComplexAuditEvidenceParseResultV1;

export type FaceComplexAuditEvidenceReauditConsistentV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_AUDIT_EVIDENCE_REAUDIT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  auditOutcome: 'consistent';
  canonicalPayloadHash: FaceComplexAuditEvidenceSha256V1;
  implementationSourceSetHash: typeof FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH;
  auditResult: FaceComplexAuditConsistentV1;
}>;

export type ReauditFaceComplexAuditEvidenceResultV1 =
  | Readonly<{ ok: true; value: FaceComplexAuditEvidenceReauditConsistentV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexAuditEvidenceIssueV1[] }>;

interface MutableIssue {
  stage: FaceComplexAuditEvidenceIssueStageV1;
  path: string;
  code: FaceComplexAuditEvidenceIssueCodeV1;
  message: string;
}

function failure(
  error: readonly FaceComplexAuditEvidenceIssueV1[],
): Readonly<{ ok: false; error: readonly FaceComplexAuditEvidenceIssueV1[] }> {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function singleFailure(
  stage: FaceComplexAuditEvidenceIssueStageV1,
  path: string,
  code: FaceComplexAuditEvidenceIssueCodeV1,
  message: string,
): Readonly<{ ok: false; error: readonly FaceComplexAuditEvidenceIssueV1[] }> {
  return failure([{ stage, path, code, message }]);
}

function issue(
  issues: MutableIssue[],
  stage: FaceComplexAuditEvidenceIssueStageV1,
  path: string,
  code: FaceComplexAuditEvidenceIssueCodeV1,
  message: string,
): void {
  issues.push({ stage, path, code, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Reject accessors, exotic prototypes, symbols, sparse arrays, and cycles. */
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

function closedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  stage: FaceComplexAuditEvidenceIssueStageV1,
  issues: MutableIssue[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issue(
        issues,
        stage,
        `${path}.${key}`,
        'unknown-field',
        'field is not declared by evidence v1',
      );
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      issue(issues, stage, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function literal(
  value: unknown,
  expected: string | number | boolean,
  path: string,
  stage: FaceComplexAuditEvidenceIssueStageV1,
  issues: MutableIssue[],
): void {
  if (value !== expected) {
    issue(issues, stage, path, 'invalid-literal', `must equal ${JSON.stringify(expected)}`);
  }
}

function safeCount(value: unknown, path: string, issues: MutableIssue[]): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    issue(issues, 'audit-result', path, 'invalid-number', 'must be a non-negative safe integer');
  }
}

function parseImplementation(
  value: unknown,
  issues: MutableIssue[],
): FaceComplexAuditorImplementationV1 | undefined {
  const path = '$.implementation';
  if (!isRecord(value)) {
    issue(issues, 'implementation', path, 'invalid-object', 'implementation must be an object');
    return undefined;
  }
  closedKeys(value, IMPLEMENTATION_KEYS, path, 'implementation', issues);
  if (
    typeof value.implementationId !== 'string' ||
    !IMPLEMENTATION_ID_PATTERN.test(value.implementationId)
  ) {
    issue(
      issues,
      'implementation',
      `${path}.implementationId`,
      'invalid-string',
      'must be a stable lowercase implementation ID',
    );
  }
  if (
    typeof value.implementationVersion !== 'string' ||
    !IMPLEMENTATION_VERSION_PATTERN.test(value.implementationVersion)
  ) {
    issue(
      issues,
      'implementation',
      `${path}.implementationVersion`,
      'invalid-string',
      'must be a stable implementation version',
    );
  }
  literal(
    value.implementationRole,
    'independent-auditor',
    `${path}.implementationRole`,
    'implementation',
    issues,
  );
  literal(
    value.sourceSetHashConvention,
    FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH_CONVENTION,
    `${path}.sourceSetHashConvention`,
    'implementation',
    issues,
  );
  if (typeof value.sourceSetHash !== 'string' || !SHA256_PATTERN.test(value.sourceSetHash)) {
    issue(
      issues,
      'implementation',
      `${path}.sourceSetHash`,
      'invalid-hash',
      'must use sha256:<64 lowercase hex digits>',
    );
  }
  if (issues.some((entry) => entry.stage === 'implementation')) return undefined;
  return {
    implementationId: value.implementationId as string,
    implementationVersion: value.implementationVersion as string,
    implementationRole: 'independent-auditor',
    sourceSetHashConvention: FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH_CONVENTION,
    sourceSetHash: value.sourceSetHash as FaceComplexAuditEvidenceSha256V1,
  };
}

function parseTopology(
  value: unknown,
  issues: MutableIssue[],
): FaceComplexAuditComputedTopologyV1 | undefined {
  const path = '$.auditResult.topology';
  if (!isRecord(value)) {
    issue(issues, 'audit-result', path, 'invalid-object', 'topology must be an object');
    return undefined;
  }
  closedKeys(value, TOPOLOGY_KEYS, path, 'audit-result', issues);
  for (const key of TOPOLOGY_KEYS) {
    if (key === 'eulerValue') {
      literal(value[key], 1, `${path}.${key}`, 'audit-result', issues);
    } else {
      safeCount(value[key], `${path}.${key}`, issues);
    }
  }
  if (issues.some((entry) => entry.stage === 'audit-result')) return undefined;
  return {
    sourceVertexCount: value.sourceVertexCount as number,
    sourceEdgeCount: value.sourceEdgeCount as number,
    planarVertexCount: value.planarVertexCount as number,
    planarEdgeCount: value.planarEdgeCount as number,
    boundedFaceCount: value.boundedFaceCount as number,
    triangleCount: value.triangleCount as number,
    createdIntersectionVertexCount: value.createdIntersectionVertexCount as number,
    nonDyadicVertexCount: value.nonDyadicVertexCount as number,
    eulerValue: 1,
  };
}

function parseAuditResult(
  value: unknown,
  issues: MutableIssue[],
): FaceComplexAuditConsistentV1 | undefined {
  const path = '$.auditResult';
  if (!isRecord(value)) {
    issue(issues, 'audit-result', path, 'invalid-object', 'auditResult must be an object');
    return undefined;
  }
  closedKeys(value, AUDIT_RESULT_KEYS, path, 'audit-result', issues);
  literal(value.schemaVersion, 1, `${path}.schemaVersion`, 'audit-result', issues);
  literal(
    value.recordType,
    'm0f-face-complex-audit-result',
    `${path}.recordType`,
    'audit-result',
    issues,
  );
  literal(value.contractStatus, 'candidate', `${path}.contractStatus`, 'audit-result', issues);
  literal(value.scientificClaim, false, `${path}.scientificClaim`, 'audit-result', issues);
  literal(value.scope, 'face-complex-only', `${path}.scope`, 'audit-result', issues);
  literal(
    value.implementationRole,
    'independent-auditor',
    `${path}.implementationRole`,
    'audit-result',
    issues,
  );
  literal(
    value.verificationIndependence,
    'separate-projective-kernel-not-full-reference-verifier',
    `${path}.verificationIndependence`,
    'audit-result',
    issues,
  );
  literal(value.auditOutcome, 'consistent', `${path}.auditOutcome`, 'audit-result', issues);
  const topology = parseTopology(value.topology, issues);
  if (topology === undefined || issues.some((entry) => entry.stage === 'audit-result')) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    recordType: 'm0f-face-complex-audit-result',
    contractStatus: 'candidate',
    scientificClaim: false,
    scope: 'face-complex-only',
    implementationRole: 'independent-auditor',
    verificationIndependence: 'separate-projective-kernel-not-full-reference-verifier',
    auditOutcome: 'consistent',
    topology,
  };
}

function evidencePayload(
  implementation: FaceComplexAuditorImplementationV1,
  auditInput: FaceComplexAuditInputV1,
  auditResult: FaceComplexAuditConsistentV1,
): FaceComplexAuditEvidencePayloadV1 {
  return {
    schemaVersion: 1,
    recordType: FACE_COMPLEX_AUDIT_EVIDENCE_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    implementation,
    auditInput,
    auditResult,
  };
}

async function sha256Text(value: string): Promise<FaceComplexAuditEvidenceSha256V1> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

async function hashOwnedEvidencePayload(
  payload: FaceComplexAuditEvidencePayloadV1,
): Promise<FaceComplexAuditEvidenceSha256V1> {
  return sha256Text(`${EVIDENCE_HASH_DOMAIN}${stableStringify(payload)}`);
}

/**
 * Domain-separated SHA-256 over exactly one owned stable-JSON evidence
 * payload, excluding its hash field. Runtime snapshotting prevents caller
 * mutation during the asynchronous digest and rejects accessors before they
 * can be invoked. The helper accepts only the closed payload contract, so no
 * caller field can be silently omitted from the digest.
 */
export async function canonicalFaceComplexAuditEvidencePayloadHashV1(
  payload: FaceComplexAuditEvidencePayloadV1,
): Promise<FaceComplexAuditEvidenceSha256V1> {
  let safe = false;
  try {
    safe = isSafeCallerData(payload, new WeakSet<object>());
  } catch {
    safe = false;
  }
  if (!safe) {
    throw new TypeError('evidence payload must be acyclic plain JSON data without accessors');
  }
  const snapshot = tryCreateValidationSnapshot(payload);
  if (!snapshot.ok) {
    throw new TypeError('evidence payload must be one cloneable plain JSON-data snapshot');
  }
  const raw: unknown = snapshot.value;
  if (!isRecord(raw)) throw new TypeError('evidence payload root must be an object');

  const issues: MutableIssue[] = [];
  closedKeys(raw, PAYLOAD_KEYS, '$', 'evidence-contract', issues);
  literal(raw.schemaVersion, 1, '$.schemaVersion', 'evidence-contract', issues);
  literal(
    raw.recordType,
    FACE_COMPLEX_AUDIT_EVIDENCE_RECORD_TYPE,
    '$.recordType',
    'evidence-contract',
    issues,
  );
  literal(raw.contractStatus, 'candidate', '$.contractStatus', 'evidence-contract', issues);
  literal(raw.scientificClaim, false, '$.scientificClaim', 'evidence-contract', issues);
  const implementation = parseImplementation(raw.implementation, issues);
  const parsedInput = parseFaceComplexAuditInputV1(raw.auditInput);
  if (!parsedInput.ok) {
    issue(
      issues,
      'audit-input',
      '$.auditInput',
      'invalid-audit-input',
      'embedded audit input does not satisfy the closed face-complex input contract',
    );
  }
  const auditResult = parseAuditResult(raw.auditResult, issues);
  if (
    issues.length > 0 ||
    implementation === undefined ||
    !parsedInput.ok ||
    auditResult === undefined
  ) {
    throw new TypeError('evidence payload does not satisfy the closed payload contract');
  }
  return hashOwnedEvidencePayload(evidencePayload(implementation, parsedInput.value, auditResult));
}

async function parseEvidence(supplied: unknown): Promise<FaceComplexAuditEvidenceParseResultV1> {
  let safe = false;
  try {
    safe = isSafeCallerData(supplied, new WeakSet<object>());
  } catch {
    safe = false;
  }
  if (!safe) {
    return singleFailure(
      'evidence-contract',
      '$',
      'invalid-snapshot',
      'evidence must be acyclic plain JSON data without accessors',
    );
  }

  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return singleFailure(
      'evidence-contract',
      '$',
      'invalid-snapshot',
      'evidence must be one cloneable plain JSON-data snapshot',
    );
  }
  const raw: unknown = snapshot.value;
  if (!isRecord(raw)) {
    return singleFailure(
      'evidence-contract',
      '$',
      'invalid-object',
      'evidence root must be an object',
    );
  }

  const issues: MutableIssue[] = [];
  closedKeys(raw, ROOT_KEYS, '$', 'evidence-contract', issues);
  literal(raw.schemaVersion, 1, '$.schemaVersion', 'evidence-contract', issues);
  literal(
    raw.recordType,
    FACE_COMPLEX_AUDIT_EVIDENCE_RECORD_TYPE,
    '$.recordType',
    'evidence-contract',
    issues,
  );
  literal(raw.contractStatus, 'candidate', '$.contractStatus', 'evidence-contract', issues);
  literal(raw.scientificClaim, false, '$.scientificClaim', 'evidence-contract', issues);

  const implementation = parseImplementation(raw.implementation, issues);
  const parsedInput = parseFaceComplexAuditInputV1(raw.auditInput);
  if (!parsedInput.ok) {
    for (const inputIssue of parsedInput.error) {
      issue(
        issues,
        'audit-input',
        `$.auditInput${inputIssue.path.slice(1)}`,
        'invalid-audit-input',
        'embedded audit input does not satisfy the closed face-complex input contract',
      );
    }
  }
  const auditResult = parseAuditResult(raw.auditResult, issues);
  if (
    typeof raw.canonicalPayloadHash !== 'string' ||
    !SHA256_PATTERN.test(raw.canonicalPayloadHash)
  ) {
    issue(
      issues,
      'canonical-hash',
      '$.canonicalPayloadHash',
      'invalid-hash',
      'must use sha256:<64 lowercase hex digits>',
    );
  }

  if (
    issues.length > 0 ||
    implementation === undefined ||
    !parsedInput.ok ||
    auditResult === undefined
  ) {
    return failure(issues);
  }

  const payload = evidencePayload(implementation, parsedInput.value, auditResult);
  const expectedHash = await canonicalFaceComplexAuditEvidencePayloadHashV1(payload);
  if (raw.canonicalPayloadHash !== expectedHash) {
    return singleFailure(
      'canonical-hash',
      '$.canonicalPayloadHash',
      'hash-mismatch',
      'canonical payload hash does not match the embedded evidence payload',
    );
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      ...payload,
      canonicalPayloadHash: expectedHash,
    },
  });
}

/** Strict closed parser for persisted candidate evidence; it also verifies the payload hash. */
export async function parseFaceComplexAuditEvidenceV1(
  supplied: unknown,
): Promise<FaceComplexAuditEvidenceParseResultV1> {
  try {
    return await parseEvidence(supplied);
  } catch {
    return singleFailure(
      'evidence-internal',
      '$',
      'unexpected-evidence-failure',
      'face-complex evidence parsing failed closed because of an unexpected internal condition',
    );
  }
}

const CURRENT_IMPLEMENTATION = Object.freeze({
  implementationId: FACE_COMPLEX_AUDITOR_IMPLEMENTATION_ID,
  implementationVersion: FACE_COMPLEX_AUDITOR_IMPLEMENTATION_VERSION,
  implementationRole: 'independent-auditor' as const,
  sourceSetHashConvention: FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH_CONVENTION,
  sourceSetHash: FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
});

/** Runs the candidate audit and creates hash-bound, saveable evidence only on consistency. */
export async function createFaceComplexAuditEvidenceV1(
  suppliedAuditInput: unknown,
): Promise<CreateFaceComplexAuditEvidenceResultV1> {
  try {
    const parsedInput = parseFaceComplexAuditInputV1(suppliedAuditInput);
    if (!parsedInput.ok) {
      return singleFailure(
        'audit-input',
        parsedInput.error[0]?.path ?? '$',
        'invalid-audit-input',
        'audit input does not satisfy the closed face-complex input contract',
      );
    }
    const audited = auditFaceComplexCandidateV1(parsedInput.value);
    if (!audited.ok) {
      return singleFailure(
        'reaudit',
        audited.error[0]?.path ?? '$',
        'audit-inconsistent',
        'candidate evidence is not created when the independent audit is inconsistent',
      );
    }

    const payload = evidencePayload(CURRENT_IMPLEMENTATION, parsedInput.value, audited.value);
    const candidate = {
      ...payload,
      canonicalPayloadHash: await canonicalFaceComplexAuditEvidencePayloadHashV1(payload),
    };
    const parsedEvidence = await parseEvidence(candidate);
    if (!parsedEvidence.ok) {
      return singleFailure(
        'evidence-internal',
        '$',
        'unexpected-evidence-failure',
        'newly created face-complex evidence failed its own closed contract',
      );
    }
    return parsedEvidence;
  } catch {
    return singleFailure(
      'evidence-internal',
      '$',
      'unexpected-evidence-failure',
      'face-complex evidence creation failed closed because of an unexpected internal condition',
    );
  }
}

function currentImplementationMatches(value: FaceComplexAuditorImplementationV1): boolean {
  return (
    value.implementationId === CURRENT_IMPLEMENTATION.implementationId &&
    value.implementationVersion === CURRENT_IMPLEMENTATION.implementationVersion &&
    value.sourceSetHash === CURRENT_IMPLEMENTATION.sourceSetHash
  );
}

/**
 * Re-parses hash-bound evidence, then independently re-runs the current audit.
 * The stored auditResult is used only after re-execution, for exact comparison.
 */
export async function reauditFaceComplexAuditEvidenceV1(
  supplied: unknown,
): Promise<ReauditFaceComplexAuditEvidenceResultV1> {
  try {
    const parsed = await parseEvidence(supplied);
    if (!parsed.ok) return parsed;

    // Re-execution intentionally precedes all trust in the saved audit result.
    const reaudited = auditFaceComplexCandidateV1(parsed.value.auditInput);
    if (!reaudited.ok) {
      return singleFailure(
        'reaudit',
        reaudited.error[0]?.path ?? '$.auditInput',
        'audit-inconsistent',
        'the current independent auditor rejects the embedded candidate input',
      );
    }
    if (!currentImplementationMatches(parsed.value.implementation)) {
      return singleFailure(
        'implementation',
        '$.implementation',
        'implementation-mismatch',
        'saved evidence was not produced by the current declared auditor source set',
      );
    }
    if (stableStringify(reaudited.value) !== stableStringify(parsed.value.auditResult)) {
      return singleFailure(
        'reaudit',
        '$.auditResult',
        'saved-result-mismatch',
        'saved audit result does not equal the freshly recomputed audit result',
      );
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: FACE_COMPLEX_AUDIT_EVIDENCE_REAUDIT_RECORD_TYPE,
        contractStatus: 'candidate' as const,
        scientificClaim: false as const,
        auditOutcome: 'consistent' as const,
        canonicalPayloadHash: parsed.value.canonicalPayloadHash,
        implementationSourceSetHash: FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
        auditResult: reaudited.value,
      },
    });
  } catch {
    return singleFailure(
      'evidence-internal',
      '$',
      'unexpected-evidence-failure',
      'face-complex evidence re-audit failed closed because of an unexpected internal condition',
    );
  }
}
