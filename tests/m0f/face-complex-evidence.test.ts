import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { prepareFaceComplexAuditInputV1 } from '../../m0f/geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';
import type { FaceComplexAuditInputV1 } from '../../m0f/reference-verifier/face-complex-contract.js';
import {
  FACE_COMPLEX_AUDITOR_IMPLEMENTATION_ID,
  FACE_COMPLEX_AUDITOR_IMPLEMENTATION_VERSION,
  FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1,
  FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
  canonicalFaceComplexAuditEvidencePayloadHashV1,
  createFaceComplexAuditEvidenceV1,
  parseFaceComplexAuditEvidenceV1,
  reauditFaceComplexAuditEvidenceV1,
  type FaceComplexAuditEvidencePayloadV1,
  type FaceComplexAuditEvidenceV1,
} from '../../m0f/reference-verifier/face-complex-evidence.js';
import { stableStringify } from '../../m0f/stable-json.js';

type JsonRecord = Record<string, unknown>;

function sourceInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [3, 0],
      [3, 1],
      [3, 2],
      [1, 2],
      [0, 2],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 5],
      [0, 3],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function auditInput(): FaceComplexAuditInputV1 {
  const source = sourceInput();
  const reconstructed = reconstructFoldFacesCandidateV1(source);
  if (!reconstructed.ok) {
    throw new Error(reconstructed.error.map((entry) => entry.code).join(','));
  }
  const prepared = prepareFaceComplexAuditInputV1(source, reconstructed.value);
  if (!prepared.ok) throw new Error(prepared.error.map((entry) => entry.code).join(','));
  return prepared.value;
}

function record(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('expected object fixture');
  }
  return value as JsonRecord;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new TypeError('expected array fixture');
  return value;
}

async function requireEvidence(): Promise<FaceComplexAuditEvidenceV1> {
  const created = await createFaceComplexAuditEvidenceV1(auditInput());
  if (!created.ok) throw new Error(created.error.map((entry) => entry.code).join(','));
  return created.value;
}

async function rehash(candidate: JsonRecord): Promise<void> {
  const payload = { ...candidate };
  delete payload.canonicalPayloadHash;
  candidate.canonicalPayloadHash = await canonicalFaceComplexAuditEvidencePayloadHashV1(
    payload as FaceComplexAuditEvidencePayloadV1,
  );
}

describe('candidate face-complex persisted evidence v1', () => {
  it('creates deterministic saveable evidence and re-audits it after JSON reload', async () => {
    const caller = structuredClone(auditInput());
    const first = await createFaceComplexAuditEvidenceV1(caller);
    const second = await createFaceComplexAuditEvidenceV1(auditInput());
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.value).toMatchObject({
      schemaVersion: 1,
      recordType: 'm0f-face-complex-audit-evidence',
      contractStatus: 'candidate',
      scientificClaim: false,
      implementation: {
        implementationId: FACE_COMPLEX_AUDITOR_IMPLEMENTATION_ID,
        implementationVersion: FACE_COMPLEX_AUDITOR_IMPLEMENTATION_VERSION,
        implementationRole: 'independent-auditor',
        sourceSetHash: FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
      },
      auditInput: { recordType: 'm0f-face-complex-audit-input' },
      auditResult: {
        recordType: 'm0f-face-complex-audit-result',
        contractStatus: 'candidate',
        scientificClaim: false,
        auditOutcome: 'consistent',
      },
    });
    expect(first.value.canonicalPayloadHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.value.auditInput.artifact.faces[0]?.triangles)).toBe(true);

    const serialized = JSON.stringify(first.value);
    const parsed = await parseFaceComplexAuditEvidenceV1(JSON.parse(serialized));
    expect(parsed).toEqual(first);
    const reaudited = await reauditFaceComplexAuditEvidenceV1(JSON.parse(serialized));
    expect(reaudited).toMatchObject({
      ok: true,
      value: {
        recordType: 'm0f-face-complex-audit-evidence-reaudit-result',
        contractStatus: 'candidate',
        scientificClaim: false,
        auditOutcome: 'consistent',
        canonicalPayloadHash: first.value.canonicalPayloadHash,
        implementationSourceSetHash: FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
      },
    });
    expect(Object.isFrozen(reaudited)).toBe(true);

    record(array(record(caller.artifact).vertices)[0]).id = 'caller-mutated';
    expect(JSON.stringify(first.value)).toBe(serialized);
  });

  it('strictly rejects unknown fields, claim escalation, hash damage, and accessors', async () => {
    const unknown = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    unknown.verified = true;
    await expect(parseFaceComplexAuditEvidenceV1(unknown)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'evidence-contract', path: '$.verified', code: 'unknown-field' }],
    });

    const escalated = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    escalated.scientificClaim = true;
    await expect(parseFaceComplexAuditEvidenceV1(escalated)).resolves.toMatchObject({
      ok: false,
      error: [{ path: '$.scientificClaim', code: 'invalid-literal' }],
    });

    const damaged = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    damaged.canonicalPayloadHash = `sha256:${'0'.repeat(64)}`;
    await expect(parseFaceComplexAuditEvidenceV1(damaged)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'canonical-hash', code: 'hash-mismatch' }],
    });

    let getterCalls = 0;
    const accessor = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    Object.defineProperty(accessor, 'verified', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return true;
      },
    });
    await expect(parseFaceComplexAuditEvidenceV1(accessor)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });
    expect(getterCalls).toBe(0);
  });

  it('re-runs the audit instead of trusting a self-consistently rehashed input mutation', async () => {
    const forged = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    const candidate = record(forged.auditInput);
    const artifact = record(candidate.artifact);
    const firstVertex = record(array(artifact.vertices)[0]);
    const exactCoordinate = record(firstVertex.exactCoordinate);
    record(exactCoordinate.x).numerator = '-1';
    await rehash(forged);

    await expect(parseFaceComplexAuditEvidenceV1(forged)).resolves.toMatchObject({ ok: true });
    await expect(reauditFaceComplexAuditEvidenceV1(forged)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'reaudit', code: 'audit-inconsistent' }],
    });
  });

  it('detects a self-consistently rehashed saved-result forgery after fresh execution', async () => {
    const forged = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    const savedTopology = record(record(forged.auditResult).topology);
    savedTopology.triangleCount = Number(savedTopology.triangleCount) + 1;
    await rehash(forged);

    await expect(parseFaceComplexAuditEvidenceV1(forged)).resolves.toMatchObject({ ok: true });
    await expect(reauditFaceComplexAuditEvidenceV1(forged)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'reaudit', path: '$.auditResult', code: 'saved-result-mismatch' }],
    });
  });

  it('keeps old or foreign source hashes parseable but refuses current-implementation equality', async () => {
    const foreign = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    record(foreign.implementation).sourceSetHash = `sha256:${'0'.repeat(64)}`;
    await rehash(foreign);

    await expect(parseFaceComplexAuditEvidenceV1(foreign)).resolves.toMatchObject({ ok: true });
    await expect(reauditFaceComplexAuditEvidenceV1(foreign)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'implementation', code: 'implementation-mismatch' }],
    });
  });

  it('does not create consistency evidence for a candidate rejected by the audit', async () => {
    const mutated = structuredClone(auditInput()) as unknown as JsonRecord;
    const artifact = record(mutated.artifact);
    const firstVertex = record(array(artifact.vertices)[0]);
    const exactCoordinate = record(firstVertex.exactCoordinate);
    record(exactCoordinate.y).numerator = '-1';

    await expect(createFaceComplexAuditEvidenceV1(mutated)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'audit-inconsistent' }],
    });
  });

  it('binds the declared implementation hash to the normalized independent source set', async () => {
    const nul = '\0';
    const fileEntries: string[] = [];
    const sourceFiles = new Set<string>(FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1);
    expect(sourceFiles.size).toBe(FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1.length);
    for (const relativePath of FACE_COMPLEX_AUDITOR_SOURCE_FILES_V1) {
      const source = await readFile(resolve(process.cwd(), relativePath), 'utf8');
      const normalizedSource = source.replace(/\r\n?/g, '\n');
      const sourceHash = createHash('sha256').update(normalizedSource).digest('hex');
      fileEntries.push(`${relativePath}${nul}${sourceHash}`);

      const imports = [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(
        (match) => match[1],
      );
      for (const specifier of imports) {
        if (!specifier?.startsWith('.')) continue;
        const dependency = relative(
          process.cwd(),
          resolve(dirname(resolve(process.cwd(), relativePath)), specifier.replace(/\.js$/, '.ts')),
        ).replaceAll('\\', '/');
        expect(sourceFiles.has(dependency), `${relativePath} imports unhashed ${dependency}`).toBe(
          true,
        );
      }
    }
    const material = `oridesign${nul}m0f-face-complex-auditor-source-set-utf8-lf-v1${nul}${fileEntries.join(nul)}`;
    expect(`sha256:${createHash('sha256').update(material).digest('hex')}`).toBe(
      FACE_COMPLEX_AUDITOR_SOURCE_SET_HASH,
    );
  });

  it('domain-separates and binds the exact owned payload without invoking accessors', async () => {
    const evidence = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    delete evidence.canonicalPayloadHash;
    const payload = evidence as FaceComplexAuditEvidencePayloadV1;
    const expected = `sha256:${createHash('sha256')
      .update(`oridesign\0m0f-face-complex-audit-evidence-v1\0${stableStringify(payload)}`)
      .digest('hex')}`;
    await expect(canonicalFaceComplexAuditEvidencePayloadHashV1(payload)).resolves.toBe(expected);

    const withExtra = structuredClone(payload) as unknown as JsonRecord;
    withExtra.unboundMetadata = 'must-affect-the-digest';
    await expect(
      canonicalFaceComplexAuditEvidencePayloadHashV1(
        withExtra as unknown as FaceComplexAuditEvidencePayloadV1,
      ),
    ).rejects.toThrow(TypeError);

    let getterCalls = 0;
    const accessor = structuredClone(payload) as unknown as JsonRecord;
    Object.defineProperty(accessor, 'auditResult', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return payload.auditResult;
      },
    });
    await expect(
      canonicalFaceComplexAuditEvidencePayloadHashV1(
        accessor as unknown as FaceComplexAuditEvidencePayloadV1,
      ),
    ).rejects.toThrow(TypeError);
    expect(getterCalls).toBe(0);
  });

  it('takes the hash payload snapshot before caller mutation can race the digest', async () => {
    const evidence = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    delete evidence.canonicalPayloadHash;
    const beforeMutation = structuredClone(evidence) as FaceComplexAuditEvidencePayloadV1;
    const pendingHash = canonicalFaceComplexAuditEvidencePayloadHashV1(
      evidence as FaceComplexAuditEvidencePayloadV1,
    );
    record(record(evidence.auditInput).artifact).inputSpecVersion = '1.1';

    await expect(pendingHash).resolves.toBe(
      await canonicalFaceComplexAuditEvidencePayloadHashV1(beforeMutation),
    );
  });

  it('fails closed on hostile container shapes and owns the parse snapshot', async () => {
    const cyclic = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    cyclic.self = cyclic;
    await expect(parseFaceComplexAuditEvidenceV1(cyclic)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });

    const sparse = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    record(record(sparse.auditInput).source).verticesCoords = new Array(1);
    await expect(parseFaceComplexAuditEvidenceV1(sparse)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });

    const symbolic = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    Object.defineProperty(symbolic, Symbol('hidden'), { enumerable: true, value: false });
    await expect(parseFaceComplexAuditEvidenceV1(symbolic)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });

    const revoked = Proxy.revocable(structuredClone(await requireEvidence()), {});
    revoked.revoke();
    await expect(parseFaceComplexAuditEvidenceV1(revoked.proxy)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });

    let proxyGetCalls = 0;
    const proxied = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    proxied.auditResult = new Proxy(record(proxied.auditResult), {
      get(target, property, receiver): unknown {
        proxyGetCalls += 1;
        return Reflect.get(target, property, receiver) as unknown;
      },
    });
    await expect(parseFaceComplexAuditEvidenceV1(proxied)).resolves.toMatchObject({
      ok: false,
      error: [{ code: 'invalid-snapshot' }],
    });
    expect(proxyGetCalls).toBe(0);

    const supplied = structuredClone(await requireEvidence()) as unknown as JsonRecord;
    const expectedHash = supplied.canonicalPayloadHash;
    const pendingParse = parseFaceComplexAuditEvidenceV1(supplied);
    record(record(supplied.auditResult).topology).triangleCount = 999;
    await expect(pendingParse).resolves.toMatchObject({
      ok: true,
      value: { canonicalPayloadHash: expectedHash },
    });
  });
});
