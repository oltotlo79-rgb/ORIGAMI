import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  computeStaticRationalTriangleOverlapCensusV1,
  type StaticRationalTriangleOverlapCensusTriangleV1,
} from '../../m0f/geometry/static-rational-triangle-overlap-census.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
  type StaticRationalTriangleOverlapCensusAuditInputSnapshotV1,
} from '../../m0f/reference-verifier/static-rational-triangle-overlap-census-audit.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_FILES_V1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS,
  createStaticRationalTriangleOverlapCensusEvidenceV1,
  parseStaticRationalTriangleOverlapCensusEvidenceV1,
  type StaticRationalTriangleOverlapCensusEvidenceV1,
} from '../../m0f/reference-verifier/static-rational-triangle-overlap-census-evidence.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';
import { stableStringify } from '../../m0f/stable-json.js';

const TRIANGLE_DOMAIN = 'oridesign\0m0f-static-rational-triangle-overlap-census-triangle-set-v1\0';
const PRODUCER_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-producer-snapshot-v1\0';
const AUDIT_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-whole-audit-snapshot-v1\0';
const PAYLOAD_DOMAIN =
  'oridesign\0m0f-static-rational-triangle-overlap-census-evidence-payload-v1\0';

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('test value must be a record');
  }
  return value as JsonRecord;
}

function point(x: number, y: number, z: number): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), 1n);
}

function triangle(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
): StaticRationalTriangle3 {
  return [first, second, third];
}

const TRIANGLES: readonly StaticRationalTriangleOverlapCensusTriangleV1[] = [
  {
    triangleId: 'z-far',
    triangle: triangle(point(20, 20, 2), point(22, 20, 2), point(20, 22, 2)),
  },
  {
    triangleId: 'a-base',
    triangle: triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0)),
  },
  {
    triangleId: 'm-cross',
    triangle: triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0)),
  },
] as const;

function auditInput(
  entries: readonly StaticRationalTriangleOverlapCensusTriangleV1[] = TRIANGLES,
): StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 {
  const producer = computeStaticRationalTriangleOverlapCensusV1({ triangles: entries });
  if (!producer.ok) throw new TypeError('test corpus must satisfy the census contract');
  return {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: 'bigint',
    triangles: entries,
    producer: producer.value,
  };
}

async function evidence(
  entries: readonly StaticRationalTriangleOverlapCensusTriangleV1[] = TRIANGLES,
): Promise<StaticRationalTriangleOverlapCensusEvidenceV1> {
  const created = await createStaticRationalTriangleOverlapCensusEvidenceV1(auditInput(entries));
  expect(created.ok).toBe(true);
  if (!created.ok) throw new TypeError('test corpus must create evidence');
  return created.value;
}

function digest(domain: string, value: unknown): string {
  return `sha256:${createHash('sha256')
    .update(`${domain}${stableStringify(value)}`)
    .digest('hex')}`;
}

function rehash(candidate: JsonRecord): void {
  const input = record(candidate.auditInput);
  candidate.triangleSetHash = digest(TRIANGLE_DOMAIN, input.triangles);
  candidate.producerCensusHash = digest(PRODUCER_DOMAIN, input.producer);
  candidate.wholeAuditHash = digest(AUDIT_DOMAIN, candidate.wholeAudit);
  const payload = structuredClone(candidate);
  delete payload.canonicalPayloadHash;
  candidate.canonicalPayloadHash = digest(PAYLOAD_DOMAIN, payload);
}

function expectDeepFrozen(value: unknown, seen = new WeakSet<object>()): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      expectDeepFrozen(descriptor.value, seen);
    }
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

interface SnapshotMetrics {
  nodes: number;
  stringCodeUnits: number;
  coordinateStringCodeUnits: number;
  maximumDepth: number;
  maximumArrayLength: number;
  maximumOwnProperties: number;
  maximumStringCodeUnits: number;
  canonicalCodeUnits: number;
}

function snapshotMetrics(value: unknown): SnapshotMetrics {
  const metrics: SnapshotMetrics = {
    nodes: 0,
    stringCodeUnits: 0,
    coordinateStringCodeUnits: 0,
    maximumDepth: 0,
    maximumArrayLength: 0,
    maximumOwnProperties: 0,
    maximumStringCodeUnits: 0,
    canonicalCodeUnits: stableStringify(value).length,
  };
  const visit = (current: unknown, depth: number, key?: string): void => {
    metrics.nodes += 1;
    metrics.maximumDepth = Math.max(metrics.maximumDepth, depth);
    if (typeof current === 'string') {
      metrics.stringCodeUnits += current.length;
      metrics.maximumStringCodeUnits = Math.max(metrics.maximumStringCodeUnits, current.length);
      if (key === 'x' || key === 'y' || key === 'z' || key === 'w') {
        metrics.coordinateStringCodeUnits += current.length;
      }
      return;
    }
    if (typeof current !== 'object' || current === null) return;
    if (Array.isArray(current)) {
      metrics.maximumArrayLength = Math.max(metrics.maximumArrayLength, current.length);
      current.forEach((entry) => visit(entry, depth + 1));
      return;
    }
    const entries = Object.entries(current);
    metrics.maximumOwnProperties = Math.max(metrics.maximumOwnProperties, entries.length);
    entries.forEach(([entryKey, entry]) => visit(entry, depth + 1, entryKey));
  };
  visit(value, 0);
  return metrics;
}

describe('static rational triangle-overlap census evidence v1', () => {
  it('creates deterministic JSON-portable evidence with canonical IDs and fixed no-claims', async () => {
    const first = await evidence();
    const second = await evidence([...TRIANGLES].reverse());

    expect(first).toEqual(second);
    expect(first.auditInput.coordinateEncoding).toBe('canonical-decimal');
    expect(first.auditInput.triangles.map((entry) => entry.triangleId)).toEqual([
      'a-base',
      'm-cross',
      'z-far',
    ]);
    expect(typeof first.auditInput.triangles[0]?.triangle[0].x).toBe('string');
    expect(first).toMatchObject({
      contractStatus: 'candidate-no-claim',
      scientificClaim: false,
      selfIntersectionDecisionIncluded: false,
      collisionFreeClaim: false,
      verifiedClaim: false,
      globalM0fGo: false,
      wholeAudit: {
        auditOutcome: 'consistent',
        producerRecordMatched: true,
        selfIntersectionDecisionIncluded: false,
        collisionFreeClaim: false,
        verifiedClaim: false,
        globalM0fGo: false,
      },
    });
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    expectDeepFrozen(first);

    const reparsed = await parseStaticRationalTriangleOverlapCensusEvidenceV1(
      JSON.parse(JSON.stringify(first)),
    );
    expect(reparsed).toEqual({ ok: true, value: first });
    if (reparsed.ok) expectDeepFrozen(reparsed);
  });

  it('uses independently reproducible domain-separated component and payload hashes', async () => {
    const value = await evidence();
    expect(value.triangleSetHash).toBe(digest(TRIANGLE_DOMAIN, value.auditInput.triangles));
    expect(value.producerCensusHash).toBe(digest(PRODUCER_DOMAIN, value.auditInput.producer));
    expect(value.wholeAuditHash).toBe(digest(AUDIT_DOMAIN, value.wholeAudit));
    const payload = structuredClone(value) as unknown as JsonRecord;
    delete payload.canonicalPayloadHash;
    expect(value.canonicalPayloadHash).toBe(digest(PAYLOAD_DOMAIN, payload));
    expect(
      new Set([
        value.triangleSetHash,
        value.producerCensusHash,
        value.wholeAuditHash,
        value.canonicalPayloadHash,
      ]).size,
    ).toBe(4);
  });

  it(
    'creates and reparses all 2,016 pairs at the public 64-triangle ceiling',
    { timeout: 120_000 },
    async () => {
      const base = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
      const entries = Array.from({ length: 64 }, (_, index) => ({
        triangleId: `T${String(index).padStart(2, '0')}${'x'.repeat(125)}`,
        triangle: base,
      }));
      const heapBefore = process.memoryUsage().heapUsed;
      const started = performance.now();
      const created = await createStaticRationalTriangleOverlapCensusEvidenceV1(
        auditInput(entries),
      );
      expect(created.ok).toBe(true);
      if (!created.ok) throw new TypeError('public-maximum record must create evidence');
      const portable = JSON.parse(JSON.stringify(created.value)) as unknown;
      const reparsed = await parseStaticRationalTriangleOverlapCensusEvidenceV1(portable);
      expect(reparsed).toEqual(created);
      const elapsedMilliseconds = performance.now() - started;
      const heapGrowthBytes = Math.max(0, process.memoryUsage().heapUsed - heapBefore);
      const metrics = snapshotMetrics(created.value);
      const coordinateCount = 64 * 3 * 4;
      const maximumCoordinateStringCodeUnits =
        coordinateCount *
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxStringCodeUnits;
      const maximumValidStringCodeUnits =
        metrics.stringCodeUnits -
        metrics.coordinateStringCodeUnits +
        maximumCoordinateStringCodeUnits;
      const maximumValidCanonicalCodeUnits =
        metrics.canonicalCodeUnits -
        metrics.coordinateStringCodeUnits +
        maximumCoordinateStringCodeUnits;
      expect(created.value.auditInput.triangles).toHaveLength(64);
      expect(created.value.auditInput.producer.pairs).toHaveLength(2_016);
      expect(metrics.nodes).toBeLessThanOrEqual(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxNodes,
      );
      expect(metrics.maximumDepth).toBeLessThanOrEqual(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxDepth,
      );
      expect(metrics.maximumArrayLength).toBeLessThanOrEqual(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxArrayLength,
      );
      expect(metrics.maximumOwnProperties).toBeLessThanOrEqual(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxOwnPropertiesPerContainer,
      );
      expect(maximumValidStringCodeUnits).toBeLessThanOrEqual(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxTotalStringCodeUnits,
      );
      expect(maximumValidCanonicalCodeUnits).toBeLessThanOrEqual(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxCanonicalPayloadCodeUnits,
      );
      expect(elapsedMilliseconds).toBeGreaterThanOrEqual(0);
      expect(heapGrowthBytes).toBeGreaterThanOrEqual(0);
    },
  );

  it('round-trips the longest valid negative canonical-decimal coordinate', async () => {
    const minimumCoordinate = -((1n << 16_384n) - 1n);
    expect(minimumCoordinate.toString()).toHaveLength(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxStringCodeUnits,
    );
    const largeTriangle = triangle(
      canonicalProjectivePoint3(minimumCoordinate, 0n, 0n, 1n),
      canonicalProjectivePoint3(minimumCoordinate + 1n, 0n, 0n, 1n),
      canonicalProjectivePoint3(minimumCoordinate, 1n, 0n, 1n),
    );
    const created = await createStaticRationalTriangleOverlapCensusEvidenceV1(
      auditInput([{ triangleId: 'large-negative', triangle: largeTriangle }]),
    );
    expect(created.ok).toBe(true);
    if (!created.ok) throw new TypeError('maximum coordinate must create evidence');
    expect(created.value.auditInput.triangles[0]?.triangle[0].x).toBe(minimumCoordinate.toString());
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(JSON.parse(JSON.stringify(created.value))),
    ).resolves.toEqual(created);
  });

  it('binds the implementation identity to the normalized complete auditor source closure', async () => {
    const nul = '\0';
    const sourceFiles = new Set<string>(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_FILES_V1,
    );
    expect(sourceFiles.size).toBe(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_FILES_V1.length,
    );
    const entries: string[] = [];
    for (const sourcePath of STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_FILES_V1) {
      const absolutePath = resolve(process.cwd(), sourcePath);
      const source = await readFile(absolutePath, 'utf8');
      const normalized = source.replace(/\r\n?/g, '\n');
      entries.push(`${sourcePath}${nul}${createHash('sha256').update(normalized).digest('hex')}`);
      const imports = [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(
        (match) => match[1],
      );
      for (const specifier of imports) {
        if (!specifier?.startsWith('.')) continue;
        const dependency = relative(
          process.cwd(),
          resolve(dirname(absolutePath), specifier.replace(/\.js$/, '.ts')),
        ).replaceAll('\\', '/');
        expect(sourceFiles.has(dependency), `${sourcePath} imports unhashed ${dependency}`).toBe(
          true,
        );
      }
    }
    const material = `oridesign${nul}m0f-static-rational-triangle-overlap-census-auditor-source-set-utf8-lf-v1${nul}${entries.join(nul)}`;
    expect(`sha256:${createHash('sha256').update(material).digest('hex')}`).toBe(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDITOR_SOURCE_SET_HASH,
    );
  });

  it('rejects a self-consistently rehashed forged whole-audit snapshot after fresh replay', async () => {
    const forged = structuredClone(await evidence()) as unknown as JsonRecord;
    record(forged.wholeAudit).auditedOverlapPairCount = 0;
    rehash(forged);
    await expect(parseStaticRationalTriangleOverlapCensusEvidenceV1(forged)).resolves.toMatchObject(
      {
        ok: false,
        error: [{ stage: 'audit-replay', code: 'saved-audit-mismatch' }],
      },
    );

    const claimEscalation = structuredClone(await evidence()) as unknown as JsonRecord;
    record(claimEscalation.wholeAudit).selfIntersectionDecisionIncluded = true;
    rehash(claimEscalation);
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(claimEscalation),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'audit-replay', code: 'saved-audit-mismatch' }],
    });

    const unknownAuditField = structuredClone(await evidence()) as unknown as JsonRecord;
    record(unknownAuditField.wholeAudit).unboundField = false;
    rehash(unknownAuditField);
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(unknownAuditField),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'audit-replay', code: 'saved-audit-mismatch' }],
    });
  });

  it('rejects self-consistently rehashed geometry or producer tampering through replay', async () => {
    const geometry = structuredClone(await evidence()) as unknown as JsonRecord;
    const triangles = record(geometry.auditInput).triangles as unknown[];
    const firstTriangle = record(triangles[0]);
    const points = firstTriangle.triangle as unknown[];
    for (const candidatePoint of points) {
      const candidate = record(candidatePoint);
      candidate.x = (BigInt(candidate.x as string) + 100n).toString();
      candidate.y = (BigInt(candidate.y as string) + 100n).toString();
    }
    rehash(geometry);
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(geometry),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'audit-replay', code: 'audit-inconsistent' }],
    });

    const producer = structuredClone(await evidence()) as unknown as JsonRecord;
    record(record(producer.auditInput).producer).overlapPairCount = 0;
    rehash(producer);
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(producer),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'audit-replay', code: 'audit-inconsistent' }],
    });
  });

  it('rejects malformed hashes, foreign source identity, claim escalation, and unknown fields', async () => {
    const malformed = structuredClone(await evidence()) as unknown as JsonRecord;
    malformed.triangleSetHash = `sha256:${'A'.repeat(64)}`;
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(malformed),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'triangle-set-hash', code: 'invalid-hash' }],
    });

    const foreign = structuredClone(await evidence()) as unknown as JsonRecord;
    record(foreign.implementation).sourceSetHash = `sha256:${'0'.repeat(64)}`;
    rehash(foreign);
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(foreign),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'source-set', code: 'source-set-mismatch' }],
    });

    const claim = structuredClone(await evidence()) as unknown as JsonRecord;
    claim.selfIntersectionDecisionIncluded = true;
    rehash(claim);
    await expect(parseStaticRationalTriangleOverlapCensusEvidenceV1(claim)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'evidence-contract', code: 'invalid-literal' }],
    });

    const extra = structuredClone(await evidence()) as unknown as JsonRecord;
    extra.unboundMetadata = 'not permitted';
    rehash(extra);
    await expect(parseStaticRationalTriangleOverlapCensusEvidenceV1(extra)).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'evidence-contract', code: 'unknown-field' }],
    });
  });

  it('rejects noncanonical order even when all hashes are recomputed', async () => {
    const reordered = structuredClone(await evidence()) as unknown as JsonRecord;
    const input = record(reordered.auditInput);
    input.triangles = [...(input.triangles as unknown[])].reverse();
    rehash(reordered);
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(reordered),
    ).resolves.toMatchObject({
      ok: false,
      error: [{ stage: 'audit-input', code: 'noncanonical-audit-input' }],
    });
  });

  it('inspects hostile values without invoking accessors and owns its accepted snapshot', async () => {
    const original = await evidence();
    const accessor = structuredClone(original) as unknown as JsonRecord;
    let getterCalls = 0;
    Object.defineProperty(accessor, 'wholeAudit', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return original.wholeAudit;
      },
    });
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(accessor),
    ).resolves.toMatchObject({ ok: false, error: [{ code: 'invalid-snapshot' }] });
    expect(getterCalls).toBe(0);

    const accepted = structuredClone(original) as unknown as JsonRecord;
    const pending = parseStaticRationalTriangleOverlapCensusEvidenceV1(accepted);
    accepted.collisionFreeClaim = true;
    await expect(pending).resolves.toEqual({ ok: true, value: original });

    const revoked = Proxy.revocable(structuredClone(original), {});
    revoked.revoke();
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(revoked.proxy),
    ).resolves.toMatchObject({ ok: false, error: [{ code: 'invalid-snapshot' }] });
  });

  it('fails closed on cycles, sparse arrays, BigInt records, symbols, and defensive limits', async () => {
    const cyclic = structuredClone(await evidence()) as unknown as JsonRecord;
    cyclic.cycle = cyclic;
    await expect(parseStaticRationalTriangleOverlapCensusEvidenceV1(cyclic)).resolves.toMatchObject(
      {
        ok: false,
        error: [{ code: 'invalid-snapshot' }],
      },
    );

    const sparse = structuredClone(await evidence()) as unknown as JsonRecord;
    const triangles = record(sparse.auditInput).triangles as unknown[];
    Reflect.deleteProperty(triangles, '0');
    await expect(parseStaticRationalTriangleOverlapCensusEvidenceV1(sparse)).resolves.toMatchObject(
      {
        ok: false,
        error: [{ code: 'invalid-snapshot' }],
      },
    );

    const bigint = structuredClone(await evidence()) as unknown as JsonRecord;
    record((record(bigint.auditInput).triangles as unknown[])[0]).triangle = [
      { x: 0n, y: 0n, z: 0n, w: 1n },
      { x: 1n, y: 0n, z: 0n, w: 1n },
      { x: 0n, y: 1n, z: 0n, w: 1n },
    ];
    await expect(parseStaticRationalTriangleOverlapCensusEvidenceV1(bigint)).resolves.toMatchObject(
      {
        ok: false,
        error: [{ code: 'invalid-snapshot' }],
      },
    );

    const symbolic = structuredClone(await evidence()) as unknown as JsonRecord;
    symbolic.recordType = Symbol('x'.repeat(100_000));
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(symbolic),
    ).resolves.toMatchObject({ ok: false, error: [{ code: 'invalid-snapshot' }] });

    const oversized = structuredClone(await evidence()) as unknown as JsonRecord;
    oversized.recordType = 'x'.repeat(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_EVIDENCE_LIMITS.maxStringCodeUnits + 1,
    );
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(oversized),
    ).resolves.toMatchObject({ ok: false, error: [{ code: 'limit-exceeded' }] });
  });

  it('does not create evidence for a semantically inconsistent producer snapshot', async () => {
    const input = structuredClone(auditInput()) as unknown as JsonRecord;
    record(input.producer).unorderedPairCount = 0;
    await expect(createStaticRationalTriangleOverlapCensusEvidenceV1(input)).resolves.toMatchObject(
      {
        ok: false,
        error: [{ stage: 'audit-replay', code: 'audit-inconsistent' }],
      },
    );
  });

  it('maps cryptographic host failure to a fixed decisionless internal error', async () => {
    const saved = await evidence();
    const digest = vi
      .spyOn(globalThis.crypto.subtle, 'digest')
      .mockRejectedValue(new Error('SECRET_CRYPTO_HOST_FAILURE'));
    await expect(
      parseStaticRationalTriangleOverlapCensusEvidenceV1(structuredClone(saved)),
    ).resolves.toEqual({
      ok: false,
      error: [
        {
          stage: 'evidence-internal',
          path: '$',
          code: 'unexpected-evidence-failure',
          message:
            'static census evidence parsing failed closed after an unexpected internal condition',
        },
      ],
    });
    await expect(
      createStaticRationalTriangleOverlapCensusEvidenceV1(auditInput()),
    ).resolves.toEqual({
      ok: false,
      error: [
        {
          stage: 'evidence-internal',
          path: '$',
          code: 'unexpected-evidence-failure',
          message:
            'static census evidence creation failed closed after an unexpected internal condition',
        },
      ],
    });
    digest.mockRestore();
  });
});
