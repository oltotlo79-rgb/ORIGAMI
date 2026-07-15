import { deepFreezeOwned } from '../clone-and-freeze.js';
import { stableStringify } from '../stable-json.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS,
  auditStaticRationalTriangleOverlapCensusCandidateV1,
  parseStaticRationalTriangleOverlapCensusAuditInputV1,
  type StaticRationalTriangleOverlapCensusAuditConsistentV1,
  type StaticRationalTriangleOverlapCensusProducerSnapshotV1,
  type TrustedStaticRationalTriangleOverlapCensusAuditInputV1,
} from './static-rational-triangle-overlap-census-audit.js';

export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_RECORD_TYPE =
  'm0f-static-rational-triangle-overlap-census-evidence' as const;
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_IMPLEMENTATION_ID =
  'oridesign-independent-static-rational-triangle-overlap-census-auditor' as const;
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_IMPLEMENTATION_VERSION =
  '1.0.0-candidate' as const;
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH_CONVENTION =
  'sha256-domain-separated-utf8-lf-source-set-v1' as const;

/**
 * Complete runtime source closure of the independent whole-census auditor.
 * The producer census, producer pair classifier, and shared projective kernel
 * are intentionally outside this source identity.
 */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_FILES_V1 = Object.freeze([
  'm0f/reference-verifier/static-rational-triangle-overlap-audit.ts',
  'm0f/reference-verifier/static-rational-triangle-overlap-census-audit.ts',
] as const);

/**
 * SHA-256 over the ordered source list and normalized-LF source bytes. A test
 * independently recomputes this constant from the declared source closure.
 */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH =
  'sha256:0630c411346054f6f93c1e32f21455eaa8c792ff1327c9336bc7c649c5094e43' as const;

/** Defensive persistence/parser ceilings, not a product SupportProfile. */
export const STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS = deepFreezeOwned({
  maxTriangles: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxTriangles,
  maxPairs: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
  maxArrayLength: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxPairs,
  maxOwnPropertiesPerContainer: 48,
  maxPropertyNameCodeUnits: 128,
  maxStringCodeUnits:
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateDecimalDigits + 1,
  maxTotalStringCodeUnits: 5_000_000,
  maxDepth: 16,
  maxNodes: 65_536,
  maxCanonicalPayloadCodeUnits: 8_000_000,
});

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const TRIANGLE_SET_HASH_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-triangle-set-v1\0';
const PRODUCER_CENSUS_HASH_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-producer-snapshot-v1\0';
const WHOLE_AUDIT_HASH_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-whole-audit-snapshot-v1\0';
const EVIDENCE_PAYLOAD_HASH_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-evidence-payload-v1\0';

const ROOT_KEYS = [
  'auditInput',
  'canonicalPayloadHash',
  'collisionFreeClaim',
  'contractStatus',
  'evidenceScope',
  'globalM0fGo',
  'implementation',
  'producerCensusHash',
  'recordType',
  'schemaVersion',
  'scientificClaim',
  'selfIntersectionDecisionIncluded',
  'triangleSetHash',
  'verifiedClaim',
  'wholeAudit',
  'wholeAuditHash',
] as const;
const IMPLEMENTATION_KEYS = [
  'implementationId',
  'implementationRole',
  'implementationVersion',
  'sourceSetHash',
  'sourceSetHashConvention',
] as const;

export type StaticRationalTriangleOverlapCensusEvidenceSha256V1 = `sha256:${string}`;

export type StaticRationalTriangleOverlapCensusEvidencePointV1 = Readonly<{
  x: string;
  y: string;
  z: string;
  w: string;
}>;
export type StaticRationalTriangleOverlapCensusEvidenceTriangleV1 = readonly [
  first: StaticRationalTriangleOverlapCensusEvidencePointV1,
  second: StaticRationalTriangleOverlapCensusEvidencePointV1,
  third: StaticRationalTriangleOverlapCensusEvidencePointV1,
];
export type StaticRationalTriangleOverlapCensusEvidenceTriangleEntryV1 = Readonly<{
  triangleId: string;
  triangle: StaticRationalTriangleOverlapCensusEvidenceTriangleV1;
}>;
export type StaticRationalTriangleOverlapCensusEvidenceAuditInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE;
  coordinateEncoding: 'canonical-decimal';
  triangles: readonly StaticRationalTriangleOverlapCensusEvidenceTriangleEntryV1[];
  producer: StaticRationalTriangleOverlapCensusProducerSnapshotV1;
}>;

export type StaticRationalTriangleOverlapCensusAuditorIdentityV1 = Readonly<{
  implementationId: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_IMPLEMENTATION_ID;
  implementationVersion: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_IMPLEMENTATION_VERSION;
  implementationRole: 'independent-whole-census-auditor';
  sourceSetHashConvention: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH_CONVENTION;
  sourceSetHash: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH;
}>;

export type StaticRationalTriangleOverlapCensusEvidencePayloadV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  evidenceScope: 'canonical-static-triangle-set-producer-census-and-independent-whole-audit';
  implementation: StaticRationalTriangleOverlapCensusAuditorIdentityV1;
  auditInput: StaticRationalTriangleOverlapCensusEvidenceAuditInputV1;
  wholeAudit: StaticRationalTriangleOverlapCensusAuditConsistentV1;
  triangleSetHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1;
  producerCensusHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1;
  wholeAuditHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1;
  scientificClaim: false;
  selfIntersectionDecisionIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleOverlapCensusEvidenceV1 =
  StaticRationalTriangleOverlapCensusEvidencePayloadV1 &
    Readonly<{
      canonicalPayloadHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1;
    }>;

export type StaticRationalTriangleOverlapCensusEvidenceIssueStageV1 =
  | 'evidence-contract'
  | 'audit-input'
  | 'audit-replay'
  | 'source-set'
  | 'triangle-set-hash'
  | 'producer-census-hash'
  | 'whole-audit-hash'
  | 'canonical-payload-hash'
  | 'evidence-internal';
export type StaticRationalTriangleOverlapCensusEvidenceIssueCodeV1 =
  | 'invalid-snapshot'
  | 'limit-exceeded'
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'invalid-hash'
  | 'invalid-audit-input'
  | 'noncanonical-audit-input'
  | 'source-set-mismatch'
  | 'audit-inconsistent'
  | 'saved-audit-mismatch'
  | 'hash-mismatch'
  | 'unexpected-evidence-failure';
export type StaticRationalTriangleOverlapCensusEvidenceIssueV1 = Readonly<{
  stage: StaticRationalTriangleOverlapCensusEvidenceIssueStageV1;
  path: string;
  code: StaticRationalTriangleOverlapCensusEvidenceIssueCodeV1;
  message: string;
}>;
export type StaticRationalTriangleOverlapCensusEvidenceResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleOverlapCensusEvidenceV1 }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleOverlapCensusEvidenceIssueV1[];
    }>;

type Stage = StaticRationalTriangleOverlapCensusEvidenceIssueStageV1;
type Code = StaticRationalTriangleOverlapCensusEvidenceIssueCodeV1;
type Failure = Extract<StaticRationalTriangleOverlapCensusEvidenceResultV1, { ok: false }>;
type JsonSnapshotResult =
  Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false; limit: boolean }>;
interface CaptureState {
  nodes: number;
  totalStringCodeUnits: number;
  ancestors: WeakSet<object>;
}

function fail(stage: Stage, path: string, code: Code, message: string): Failure {
  return deepFreezeOwned({ ok: false as const, error: [{ stage, path, code, message }] });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): Failure | undefined {
  const expectedSet = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) {
      return fail(
        'evidence-contract',
        '$',
        'unknown-field',
        'the evidence contains a field not declared by evidence v1',
      );
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      return fail(
        'evidence-contract',
        `$${key.length <= 128 ? `.${key}` : ''}`,
        'missing-field',
        'a required evidence v1 field is missing',
      );
    }
  }
  return undefined;
}

function capturePlainJsonData(supplied: unknown): JsonSnapshotResult {
  const state: CaptureState = {
    nodes: 0,
    totalStringCodeUnits: 0,
    ancestors: new WeakSet<object>(),
  };

  const visit = (value: unknown, depth: number): JsonSnapshotResult => {
    state.nodes += 1;
    if (
      state.nodes > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxNodes ||
      depth > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxDepth
    ) {
      return { ok: false, limit: true };
    }
    if (value === null || typeof value === 'boolean') return { ok: true, value };
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || Object.is(value, -0)) return { ok: false, limit: false };
      return { ok: true, value };
    }
    if (typeof value === 'string') {
      if (
        value.length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxStringCodeUnits
      ) {
        return { ok: false, limit: true };
      }
      state.totalStringCodeUnits += value.length;
      if (
        state.totalStringCodeUnits >
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxTotalStringCodeUnits
      ) {
        return { ok: false, limit: true };
      }
      return { ok: true, value };
    }
    if (typeof value !== 'object' || state.ancestors.has(value)) {
      return { ok: false, limit: false };
    }

    state.ancestors.add(value);
    try {
      const prototype: unknown = Object.getPrototypeOf(value);
      const keys = Reflect.ownKeys(value);
      if (Array.isArray(value)) {
        if (prototype !== Array.prototype) return { ok: false, limit: false };
        const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
        if (
          lengthDescriptor === undefined ||
          !('value' in lengthDescriptor) ||
          !Number.isSafeInteger(lengthDescriptor.value) ||
          (lengthDescriptor.value as number) < 0
        ) {
          return { ok: false, limit: false };
        }
        const length = lengthDescriptor.value as number;
        if (length > STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxArrayLength) {
          return { ok: false, limit: true };
        }
        if (
          keys.length !== length + 1 ||
          keys.some(
            (key) =>
              typeof key !== 'string' || (key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key)),
          )
        ) {
          return { ok: false, limit: false };
        }
        const output: unknown[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
          if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
            return { ok: false, limit: false };
          }
          const captured = visit(descriptor.value, depth + 1);
          if (!captured.ok) return captured;
          output.push(captured.value);
        }
        return { ok: true, value: output };
      }

      if (prototype !== Object.prototype && prototype !== null) {
        return { ok: false, limit: false };
      }
      if (
        keys.length >
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxOwnPropertiesPerContainer
      ) {
        return { ok: false, limit: true };
      }
      const output: Record<string, unknown> = {};
      for (const key of keys) {
        if (typeof key !== 'string') return { ok: false, limit: false };
        if (
          key.length >
          STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxPropertyNameCodeUnits
        ) {
          return { ok: false, limit: true };
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
          return { ok: false, limit: false };
        }
        const captured = visit(descriptor.value, depth + 1);
        if (!captured.ok) return captured;
        Object.defineProperty(output, key, {
          value: captured.value,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
      return { ok: true, value: output };
    } catch {
      return { ok: false, limit: false };
    } finally {
      state.ancestors.delete(value);
    }
  };

  return visit(supplied, 0);
}

function decimalPoint(point: Readonly<{ x: bigint; y: bigint; z: bigint; w: bigint }>) {
  return {
    x: point.x.toString(),
    y: point.y.toString(),
    z: point.z.toString(),
    w: point.w.toString(),
  };
}

function canonicalAuditInput(
  trusted: TrustedStaticRationalTriangleOverlapCensusAuditInputV1,
): StaticRationalTriangleOverlapCensusEvidenceAuditInputV1 {
  const producerSnapshot = capturePlainJsonData(trusted.producer);
  if (!producerSnapshot.ok || !isRecord(producerSnapshot.value)) {
    throw new TypeError('trusted producer snapshot is not canonical JSON data');
  }
  return deepFreezeOwned({
    schemaVersion: 1 as const,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: 'canonical-decimal' as const,
    triangles: trusted.triangles.map((entry) => ({
      triangleId: entry.triangleId,
      triangle: [
        decimalPoint(entry.triangle[0]),
        decimalPoint(entry.triangle[1]),
        decimalPoint(entry.triangle[2]),
      ] as const,
    })),
    producer: producerSnapshot.value as StaticRationalTriangleOverlapCensusProducerSnapshotV1,
  });
}

const CURRENT_IMPLEMENTATION: StaticRationalTriangleOverlapCensusAuditorIdentityV1 =
  deepFreezeOwned({
    implementationId: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_IMPLEMENTATION_ID,
    implementationVersion: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_IMPLEMENTATION_VERSION,
    implementationRole: 'independent-whole-census-auditor' as const,
    sourceSetHashConvention:
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH_CONVENTION,
    sourceSetHash: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH,
  });

async function sha256Text(
  value: string,
): Promise<StaticRationalTriangleOverlapCensusEvidenceSha256V1> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

async function hashValue(
  domain: string,
  value: unknown,
): Promise<StaticRationalTriangleOverlapCensusEvidenceSha256V1> {
  const serialized = stableStringify(value);
  if (
    serialized.length >
    STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxCanonicalPayloadCodeUnits
  ) {
    throw new RangeError('canonical evidence payload exceeds its defensive ceiling');
  }
  return sha256Text(`${domain}${serialized}`);
}

function payload(
  auditInput: StaticRationalTriangleOverlapCensusEvidenceAuditInputV1,
  wholeAudit: StaticRationalTriangleOverlapCensusAuditConsistentV1,
  triangleSetHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1,
  producerCensusHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1,
  wholeAuditHash: StaticRationalTriangleOverlapCensusEvidenceSha256V1,
): StaticRationalTriangleOverlapCensusEvidencePayloadV1 {
  return {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_RECORD_TYPE,
    contractStatus: 'candidate-no-claim',
    evidenceScope: 'canonical-static-triangle-set-producer-census-and-independent-whole-audit',
    implementation: CURRENT_IMPLEMENTATION,
    auditInput,
    wholeAudit,
    triangleSetHash,
    producerCensusHash,
    wholeAuditHash,
    scientificClaim: false,
    selfIntersectionDecisionIncluded: false,
    collisionFreeClaim: false,
    verifiedClaim: false,
    globalM0fGo: false,
  };
}

function invalidLiteral(raw: Record<string, unknown>): Failure | undefined {
  const literals: readonly (readonly [string, unknown])[] = [
    ['schemaVersion', 1],
    ['recordType', STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_RECORD_TYPE],
    ['contractStatus', 'candidate-no-claim'],
    ['evidenceScope', 'canonical-static-triangle-set-producer-census-and-independent-whole-audit'],
    ['scientificClaim', false],
    ['selfIntersectionDecisionIncluded', false],
    ['collisionFreeClaim', false],
    ['verifiedClaim', false],
    ['globalM0fGo', false],
  ];
  for (const [key, expected] of literals) {
    if (raw[key] !== expected) {
      return fail(
        'evidence-contract',
        `$.${key}`,
        'invalid-literal',
        'the evidence field does not equal its fixed candidate-no-claim literal',
      );
    }
  }
  return undefined;
}

function parseImplementation(value: unknown): Failure | undefined {
  if (!isRecord(value)) {
    return fail(
      'source-set',
      '$.implementation',
      'invalid-object',
      'implementation identity must be an object',
    );
  }
  const keysFailure = exactKeys(value, IMPLEMENTATION_KEYS);
  if (keysFailure !== undefined) return keysFailure;
  if (
    value.implementationId !== CURRENT_IMPLEMENTATION.implementationId ||
    value.implementationVersion !== CURRENT_IMPLEMENTATION.implementationVersion ||
    value.implementationRole !== CURRENT_IMPLEMENTATION.implementationRole ||
    value.sourceSetHashConvention !== CURRENT_IMPLEMENTATION.sourceSetHashConvention ||
    value.sourceSetHash !== CURRENT_IMPLEMENTATION.sourceSetHash
  ) {
    return fail(
      'source-set',
      '$.implementation',
      'source-set-mismatch',
      'evidence is not bound to the current declared independent auditor source set',
    );
  }
  return undefined;
}

function invalidHash(value: unknown): boolean {
  return typeof value !== 'string' || !SHA256_PATTERN.test(value);
}

async function parseCapturedEvidence(
  raw: Record<string, unknown>,
): Promise<StaticRationalTriangleOverlapCensusEvidenceResultV1> {
  const rootKeysFailure = exactKeys(raw, ROOT_KEYS);
  if (rootKeysFailure !== undefined) return rootKeysFailure;
  const literalFailure = invalidLiteral(raw);
  if (literalFailure !== undefined) return literalFailure;
  const implementationFailure = parseImplementation(raw.implementation);
  if (implementationFailure !== undefined) return implementationFailure;

  if (!isRecord(raw.auditInput) || raw.auditInput.coordinateEncoding !== 'canonical-decimal') {
    return fail(
      'audit-input',
      '$.auditInput',
      'invalid-audit-input',
      'stored evidence must use the closed canonical-decimal audit input contract',
    );
  }
  const parsedInput = parseStaticRationalTriangleOverlapCensusAuditInputV1(raw.auditInput);
  if (!parsedInput.ok) {
    return fail(
      'audit-input',
      '$.auditInput',
      'invalid-audit-input',
      'stored evidence contains an invalid whole-census audit input',
    );
  }
  const canonicalInput = canonicalAuditInput(parsedInput.value);
  if (stableStringify(raw.auditInput) !== stableStringify(canonicalInput)) {
    return fail(
      'audit-input',
      '$.auditInput',
      'noncanonical-audit-input',
      'stored triangle IDs, geometry, and producer snapshot are not in canonical evidence form',
    );
  }
  if (
    canonicalInput.triangles.length >
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxTriangles ||
    canonicalInput.producer.pairs.length >
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxPairs
  ) {
    return fail(
      'audit-input',
      '$.auditInput',
      'limit-exceeded',
      'stored audit input exceeds the evidence work surface',
    );
  }

  const replayed = auditStaticRationalTriangleOverlapCensusCandidateV1(canonicalInput);
  if (!replayed.ok) {
    return fail(
      'audit-replay',
      '$.auditInput',
      'audit-inconsistent',
      'current independent whole-census replay does not accept the stored candidate input',
    );
  }
  if (stableStringify(raw.wholeAudit) !== stableStringify(replayed.value)) {
    return fail(
      'audit-replay',
      '$.wholeAudit',
      'saved-audit-mismatch',
      'stored whole-audit snapshot differs from a fresh current replay',
    );
  }

  const hashFields: readonly (readonly [string, Stage])[] = [
    ['triangleSetHash', 'triangle-set-hash'],
    ['producerCensusHash', 'producer-census-hash'],
    ['wholeAuditHash', 'whole-audit-hash'],
    ['canonicalPayloadHash', 'canonical-payload-hash'],
  ];
  for (const [key, stage] of hashFields) {
    if (invalidHash(raw[key])) {
      return fail(stage, `$.${key}`, 'invalid-hash', 'hash must use sha256:<64 lowercase hex>');
    }
  }

  const [triangleSetHash, producerCensusHash, wholeAuditHash] = await Promise.all([
    hashValue(TRIANGLE_SET_HASH_DOMAIN, canonicalInput.triangles),
    hashValue(PRODUCER_CENSUS_HASH_DOMAIN, canonicalInput.producer),
    hashValue(WHOLE_AUDIT_HASH_DOMAIN, replayed.value),
  ]);
  if (raw.triangleSetHash !== triangleSetHash) {
    return fail(
      'triangle-set-hash',
      '$.triangleSetHash',
      'hash-mismatch',
      'triangle-set hash does not match canonical triangle IDs and geometry',
    );
  }
  if (raw.producerCensusHash !== producerCensusHash) {
    return fail(
      'producer-census-hash',
      '$.producerCensusHash',
      'hash-mismatch',
      'producer-census hash does not match the stored producer snapshot',
    );
  }
  if (raw.wholeAuditHash !== wholeAuditHash) {
    return fail(
      'whole-audit-hash',
      '$.wholeAuditHash',
      'hash-mismatch',
      'whole-audit hash does not match the freshly replayed audit snapshot',
    );
  }

  const ownedPayload = payload(
    canonicalInput,
    replayed.value,
    triangleSetHash,
    producerCensusHash,
    wholeAuditHash,
  );
  const canonicalPayloadHash = await hashValue(EVIDENCE_PAYLOAD_HASH_DOMAIN, ownedPayload);
  if (raw.canonicalPayloadHash !== canonicalPayloadHash) {
    return fail(
      'canonical-payload-hash',
      '$.canonicalPayloadHash',
      'hash-mismatch',
      'canonical payload hash does not bind the complete stored evidence payload',
    );
  }

  return deepFreezeOwned({
    ok: true as const,
    value: { ...ownedPayload, canonicalPayloadHash },
  });
}

/**
 * Closed, accessor-free parser. Successful parsing also replays the current
 * independent audit before trusting the stored audit snapshot or any hash.
 */
export async function parseStaticRationalTriangleOverlapCensusEvidenceV1(
  supplied: unknown,
): Promise<StaticRationalTriangleOverlapCensusEvidenceResultV1> {
  try {
    const captured = capturePlainJsonData(supplied);
    if (!captured.ok) {
      return fail(
        'evidence-contract',
        '$',
        captured.limit ? 'limit-exceeded' : 'invalid-snapshot',
        captured.limit
          ? 'evidence exceeds a defensive persistence or parser ceiling'
          : 'evidence must be acyclic plain JSON data without accessors or exotic values',
      );
    }
    if (!isRecord(captured.value)) {
      return fail('evidence-contract', '$', 'invalid-object', 'evidence root must be an object');
    }
    return await parseCapturedEvidence(deepFreezeOwned(captured.value));
  } catch {
    return fail(
      'evidence-internal',
      '$',
      'unexpected-evidence-failure',
      'static census evidence parsing failed closed after an unexpected internal condition',
    );
  }
}

/**
 * Creates saveable evidence only after canonicalization and a successful fresh
 * independent whole-census replay. This remains candidate consistency evidence.
 */
export async function createStaticRationalTriangleOverlapCensusEvidenceV1(
  suppliedAuditInput: unknown,
): Promise<StaticRationalTriangleOverlapCensusEvidenceResultV1> {
  try {
    const parsedInput = parseStaticRationalTriangleOverlapCensusAuditInputV1(suppliedAuditInput);
    if (!parsedInput.ok) {
      return fail(
        'audit-input',
        '$',
        'invalid-audit-input',
        'supplied whole-census audit input does not satisfy its closed contract',
      );
    }
    const auditInput = canonicalAuditInput(parsedInput.value);
    const audited = auditStaticRationalTriangleOverlapCensusCandidateV1(auditInput);
    if (!audited.ok) {
      return fail(
        'audit-replay',
        '$.auditInput',
        'audit-inconsistent',
        'evidence is not created for an inconsistent producer census',
      );
    }
    const [triangleSetHash, producerCensusHash, wholeAuditHash] = await Promise.all([
      hashValue(TRIANGLE_SET_HASH_DOMAIN, auditInput.triangles),
      hashValue(PRODUCER_CENSUS_HASH_DOMAIN, auditInput.producer),
      hashValue(WHOLE_AUDIT_HASH_DOMAIN, audited.value),
    ]);
    const ownedPayload = payload(
      auditInput,
      audited.value,
      triangleSetHash,
      producerCensusHash,
      wholeAuditHash,
    );
    const candidate = {
      ...ownedPayload,
      canonicalPayloadHash: await hashValue(EVIDENCE_PAYLOAD_HASH_DOMAIN, ownedPayload),
    };
    const parsedEvidence = await parseStaticRationalTriangleOverlapCensusEvidenceV1(candidate);
    if (!parsedEvidence.ok) {
      return fail(
        'evidence-internal',
        '$',
        'unexpected-evidence-failure',
        'newly created static census evidence failed its own closed parser',
      );
    }
    return parsedEvidence;
  } catch {
    return fail(
      'evidence-internal',
      '$',
      'unexpected-evidence-failure',
      'static census evidence creation failed closed after an unexpected internal condition',
    );
  }
}
