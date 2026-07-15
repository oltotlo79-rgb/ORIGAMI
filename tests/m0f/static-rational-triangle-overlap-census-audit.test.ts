import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import {
  computeStaticRationalTriangleOverlapCensusV1,
  type StaticRationalTriangleOverlapCensusTriangleV1,
} from '../../m0f/geometry/static-rational-triangle-overlap-census.js';
import type {
  StaticRationalTriangle3,
  StaticRationalTriangleOverlapClassification,
} from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS,
  auditStaticRationalTriangleOverlapCensusCandidateV1,
  parseStaticRationalTriangleOverlapCensusAuditInputV1,
  type StaticRationalTriangleOverlapCensusAuditInputSnapshotV1,
  type StaticRationalTriangleOverlapCensusAuditPointSnapshotV1,
  type StaticRationalTriangleOverlapCensusAuditResultV1,
  type StaticRationalTriangleOverlapCensusAuditTriangleSnapshotV1,
  type StaticRationalTriangleOverlapCensusProducerPairSnapshotV1,
  type StaticRationalTriangleOverlapCensusProducerSnapshotV1,
} from '../../m0f/reference-verifier/static-rational-triangle-overlap-census-audit.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

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

const BASE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
const CONTACT_CORPUS: readonly StaticRationalTriangleOverlapCensusTriangleV1[] = [
  { triangleId: 'base', triangle: BASE },
  {
    triangleId: 'coplanar',
    triangle: triangle(point(1, 1, 0), point(5, 1, 0), point(1, 5, 0)),
  },
  {
    triangleId: 'transverse',
    triangle: triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0)),
  },
  {
    triangleId: 'shared-edge',
    triangle: triangle(BASE[0], BASE[1], point(0, 0, 1)),
  },
  {
    triangleId: 'far',
    triangle: triangle(point(20, 20, 2), point(22, 20, 2), point(20, 22, 2)),
  },
] as const;

function producerFor(
  entries: readonly StaticRationalTriangleOverlapCensusTriangleV1[],
): StaticRationalTriangleOverlapCensusProducerSnapshotV1 {
  const computed = computeStaticRationalTriangleOverlapCensusV1({ triangles: entries });
  if (!computed.ok) throw new TypeError('test fixture must satisfy the producer census contract');
  return computed.value;
}

function auditInput(
  entries: readonly StaticRationalTriangleOverlapCensusTriangleV1[],
): StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 {
  return {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: 'bigint',
    triangles: entries,
    producer: producerFor(entries),
  };
}

function decimalPoint(
  value: ProjectivePoint3,
): StaticRationalTriangleOverlapCensusAuditPointSnapshotV1 {
  return {
    x: value.x.toString(),
    y: value.y.toString(),
    z: value.z.toString(),
    w: value.w.toString(),
  };
}

function decimalTriangle(
  value: StaticRationalTriangle3,
): StaticRationalTriangleOverlapCensusAuditTriangleSnapshotV1 {
  return [decimalPoint(value[0]), decimalPoint(value[1]), decimalPoint(value[2])];
}

function decimalAuditInput(
  entries: readonly StaticRationalTriangleOverlapCensusTriangleV1[],
): StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 {
  return {
    schemaVersion: 1,
    recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
    coordinateEncoding: 'canonical-decimal',
    triangles: entries.map((entry) => ({
      triangleId: entry.triangleId,
      triangle: decimalTriangle(entry.triangle),
    })),
    producer: producerFor(entries),
  };
}

function withProducer(
  input: StaticRationalTriangleOverlapCensusAuditInputSnapshotV1,
  patch: Partial<StaticRationalTriangleOverlapCensusProducerSnapshotV1>,
): StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 {
  return { ...input, producer: { ...input.producer, ...patch } };
}

function withPair(
  input: StaticRationalTriangleOverlapCensusAuditInputSnapshotV1,
  index: number,
  patch: Partial<StaticRationalTriangleOverlapCensusProducerPairSnapshotV1>,
): StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 {
  const original = input.producer.pairs[index];
  if (original === undefined) throw new RangeError('test pair index must exist');
  return withProducer(input, {
    pairs: input.producer.pairs.map((pair, pairIndex) =>
      pairIndex === index ? { ...original, ...patch } : pair,
    ),
  });
}

function expectConsistent(result: StaticRationalTriangleOverlapCensusAuditResultV1): void {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('expected a consistent whole-census audit');
  expect(result.value).toMatchObject({
    auditOutcome: 'consistent',
    producerRecordMatched: true,
    wholeCensusReplayIncluded: true,
    independentPairAuditIncluded: true,
    allExpectedUnorderedPairsReplayed: true,
    scientificClaim: false,
    legalContactClassificationIncluded: false,
    penetrationClassificationIncluded: false,
    selfIntersectionDecisionIncluded: false,
    collisionFreeClaim: false,
    continuousTimeIncluded: false,
    continuousCollisionDetectionIncluded: false,
    verifiedClaim: false,
    globalM0fGo: false,
  });
}

function requireInconsistent(
  result: StaticRationalTriangleOverlapCensusAuditResultV1,
): Extract<StaticRationalTriangleOverlapCensusAuditResultV1, { ok: false; value: unknown }> {
  expect(result.ok).toBe(false);
  if (result.ok || !('value' in result)) {
    throw new TypeError('semantic tamper must retain a fixed inconsistent decision');
  }
  expect(result.value).toMatchObject({
    auditOutcome: 'inconsistent',
    producerRecordMatched: false,
    allExpectedUnorderedPairsReplayed: true,
    scientificClaim: false,
    selfIntersectionDecisionIncluded: false,
    collisionFreeClaim: false,
    verifiedClaim: false,
    globalM0fGo: false,
  });
  return result;
}

function requireContractFailure(
  result: StaticRationalTriangleOverlapCensusAuditResultV1,
): Extract<StaticRationalTriangleOverlapCensusAuditResultV1, { ok: false }> {
  expect(result.ok).toBe(false);
  if (result.ok || 'value' in result) {
    throw new TypeError('malformed input must fail without an audit decision');
  }
  return result;
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

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length === 0) return [[]];
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((tail) => [
      value,
      ...tail,
    ]),
  );
}

type PairAuditModuleForMock = Record<string, unknown> &
  Readonly<{
    auditStaticRationalTriangleOverlapCandidateV1: (supplied: unknown) => unknown;
  }>;

describe('independent static triangle-overlap whole-census audit', () => {
  it('has the pair auditor as its only runtime dependency', () => {
    const source = readFileSync(
      new URL(
        '../../m0f/reference-verifier/static-rational-triangle-overlap-census-audit.ts',
        import.meta.url,
      ),
      'utf8',
    );
    const dependencies = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    expect(dependencies).toEqual(['./static-rational-triangle-overlap-audit.js']);
  });

  it('replays a complete mixed-classification and raw-incidence census', () => {
    const input = auditInput(CONTACT_CORPUS);
    const result = auditStaticRationalTriangleOverlapCensusCandidateV1(input);
    expectConsistent(result);
    if (!result.ok) throw new TypeError('fixture must be consistent');
    expect(result.value).toMatchObject({
      auditedTriangleIds: ['base', 'coplanar', 'far', 'shared-edge', 'transverse'],
      auditedTriangleCount: 5,
      auditedUnorderedPairCount: 10,
    });
    expect(result.value.auditedDisjointPairCount + result.value.auditedOverlapPairCount).toBe(10);
  });

  it('accepts zero and one triangle with exactly zero pair replays', () => {
    for (const entries of [[], [{ triangleId: 'only', triangle: BASE }]] as const) {
      const result = auditStaticRationalTriangleOverlapCensusCandidateV1(auditInput(entries));
      expectConsistent(result);
      if (!result.ok) throw new TypeError('0/1 triangle fixture must be consistent');
      expect(result.value.auditedTriangleCount).toBe(entries.length);
      expect(result.value.auditedUnorderedPairCount).toBe(0);
    }
  });

  it('independently accepts canonical length-prefixed reconstruction triangle IDs', () => {
    const entries = [
      { triangleId: '30:candidate-rational-triangle-v1:face:000001', triangle: BASE },
      {
        triangleId: '9:triangle:2',
        triangle: triangle(point(20, 20, 2), point(22, 20, 2), point(20, 22, 2)),
      },
    ] as const;
    const result = auditStaticRationalTriangleOverlapCensusCandidateV1(auditInput(entries));
    expectConsistent(result);
    if (!result.ok) throw new TypeError('length-prefixed IDs must audit');
    expect(result.value.auditedTriangleIds).toEqual([
      '30:candidate-rational-triangle-v1:face:000001',
      '9:triangle:2',
    ]);
  });

  it('canonicalizes input order without changing the decision', () => {
    const canonical = auditInput(CONTACT_CORPUS);
    const reversed: StaticRationalTriangleOverlapCensusAuditInputSnapshotV1 = {
      ...canonical,
      triangles: [...canonical.triangles].reverse(),
    };
    const first = auditStaticRationalTriangleOverlapCensusCandidateV1(canonical);
    const second = auditStaticRationalTriangleOverlapCensusCandidateV1(reversed);
    expectConsistent(first);
    expectConsistent(second);
    expect(second).toEqual(first);
  });

  it('matches a hand-derived six-pair oracle under all 24 input permutations', () => {
    const entries = [
      { triangleId: 'base', triangle: BASE },
      { triangleId: 'same', triangle: BASE },
      {
        triangleId: 'far',
        triangle: triangle(point(20, 20, 2), point(22, 20, 2), point(20, 22, 2)),
      },
      {
        triangleId: 'shared-edge',
        triangle: triangle(BASE[0], BASE[1], point(0, 0, 1)),
      },
    ] as const;
    const canonicalInput = auditInput(entries);
    const expectedPairKeys = [
      'base\u0000far',
      'base\u0000same',
      'base\u0000shared-edge',
      'far\u0000same',
      'far\u0000shared-edge',
      'same\u0000shared-edge',
    ];
    expect(
      canonicalInput.producer.pairs.map(
        (entry) => `${entry.firstTriangleId}\u0000${entry.secondTriangleId}`,
      ),
    ).toEqual(expectedPairKeys);

    let canonicalResult: StaticRationalTriangleOverlapCensusAuditResultV1 | undefined;
    for (const permutation of permutations(entries)) {
      const result = auditStaticRationalTriangleOverlapCensusCandidateV1({
        ...canonicalInput,
        triangles: permutation,
      });
      expectConsistent(result);
      if (!result.ok) throw new TypeError('hand-derived oracle fixture must be consistent');
      expect(result.value).toMatchObject({
        auditedTriangleIds: ['base', 'far', 'same', 'shared-edge'],
        auditedTriangleCount: 4,
        auditedUnorderedPairCount: 6,
        auditedDisjointPairCount: 3,
        auditedOverlapPairCount: 3,
        auditedCoplanarOverlapPairCount: 1,
        auditedNoncoplanarOverlapPairCount: 2,
        auditedNonincidentPairCount: 3,
        auditedSharedVertexPairCount: 0,
        auditedSharedEdgePairCount: 2,
        auditedCoincidentTrianglePairCount: 1,
        auditedNonincidentOverlapPairCount: 0,
        auditedIncidentOverlapPairCount: 3,
      });
      canonicalResult ??= result;
      expect(result).toEqual(canonicalResult);
    }
  });

  it('accepts the equivalent canonical-decimal portable snapshot', () => {
    const bigintResult = auditStaticRationalTriangleOverlapCensusCandidateV1(
      auditInput(CONTACT_CORPUS),
    );
    const decimalResult = auditStaticRationalTriangleOverlapCensusCandidateV1(
      decimalAuditInput(CONTACT_CORPUS),
    );
    expectConsistent(bigintResult);
    expect(decimalResult).toEqual(bigintResult);
  });

  it('replays all 2,016 pairs at the 64-triangle work ceiling', { timeout: 60_000 }, () => {
    const entries = Array.from({ length: 64 }, (_, index) => ({
      triangleId: `T${String(index).padStart(2, '0')}`,
      triangle: BASE,
    }));
    const result = auditStaticRationalTriangleOverlapCensusCandidateV1(auditInput(entries));
    expectConsistent(result);
    if (!result.ok) throw new TypeError('64-triangle fixture must be consistent');
    expect(result.value).toMatchObject({
      auditedTriangleCount: 64,
      auditedUnorderedPairCount: 2_016,
      auditedCoincidentTrianglePairCount: 2_016,
      auditedCoplanarOverlapPairCount: 2_016,
    });
  });

  it('detects a single pair geometry classification tamper', () => {
    const input = auditInput(CONTACT_CORPUS);
    const original = input.producer.pairs[0];
    if (original === undefined) throw new TypeError('fixture pair must exist');
    const forgedClassification: StaticRationalTriangleOverlapClassification =
      original.staticClassification === 'disjoint' ? 'intersecting-coplanar' : 'disjoint';
    const tampered = withPair(input, 0, {
      staticClassification: forgedClassification,
      closedTrianglesIntersect: forgedClassification !== 'disjoint',
    });
    const result = requireInconsistent(
      auditStaticRationalTriangleOverlapCensusCandidateV1(tampered),
    );
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'pair-audit-inconsistent' }),
    );
    expect(result.value.auditedUnorderedPairCount).toBe(10);
  });

  it('detects one counter, canonical ID, and affirmative claim tamper', () => {
    const input = auditInput(CONTACT_CORPUS);
    const cases = [
      withProducer(input, { overlapPairCount: input.producer.overlapPairCount + 1 }),
      withProducer(input, {
        triangleIds: ['forged', ...input.producer.triangleIds.slice(1)],
      }),
      withProducer(input, { verifiedClaim: true }),
    ];
    for (const tampered of cases) {
      const result = requireInconsistent(
        auditStaticRationalTriangleOverlapCensusCandidateV1(tampered),
      );
      expect(result.error).toContainEqual(
        expect.objectContaining({ code: 'producer-field-mismatch' }),
      );
    }
  });

  it('detects pair index, ID, raw incidence, and fixed metadata tampering', () => {
    const input = auditInput(CONTACT_CORPUS);
    const original = input.producer.pairs[0];
    if (original === undefined) throw new TypeError('fixture pair must exist');
    const changedSharedCount = original.sharedCanonicalVertexCount === 0 ? 1 : 0;
    const changedIncidence =
      original.incidenceClass === 'nonincident' ? 'shared-vertex' : 'nonincident';
    const cases = [
      withPair(input, 0, { pairIndex: original.pairIndex + 1 }),
      withPair(input, 0, { firstTriangleId: 'forged-pair-id' }),
      withPair(input, 0, {
        sharedCanonicalVertexCount: changedSharedCount,
        incidenceClass: changedIncidence,
      }),
      withProducer(input, { arithmetic: 'forged-arithmetic' }),
    ];
    for (const tampered of cases) {
      const result = requireInconsistent(
        auditStaticRationalTriangleOverlapCensusCandidateV1(tampered),
      );
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('checks every one of the 39 closed producer fields', () => {
    const input = auditInput(CONTACT_CORPUS);
    const producer = input.producer as unknown as Readonly<Record<string, unknown>>;
    const keys = Object.keys(producer);
    expect(keys).toHaveLength(39);
    for (const key of keys) {
      const current = producer[key];
      let replacement: unknown;
      if (typeof current === 'string') replacement = `${current}-tampered`;
      else if (typeof current === 'number') replacement = current + 1;
      else if (typeof current === 'boolean') replacement = !current;
      else if (Array.isArray(current)) {
        replacement = [...(current as readonly unknown[])].reverse();
      } else throw new TypeError(`unhandled producer field ${key}`);
      const result = requireInconsistent(
        auditStaticRationalTriangleOverlapCensusCandidateV1({
          ...input,
          producer: { ...producer, [key]: replacement },
        }),
      );
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('checks every one of the eight closed producer-pair fields', () => {
    const input = auditInput(CONTACT_CORPUS);
    const original = input.producer.pairs[0];
    if (original === undefined) throw new TypeError('fixture pair must exist');
    const pairRecord = original as unknown as Readonly<Record<string, unknown>>;
    const keys = Object.keys(pairRecord);
    expect(keys).toHaveLength(8);
    for (const key of keys) {
      let replacement: unknown;
      if (key === 'pairIndex') replacement = original.pairIndex + 1;
      else if (key === 'firstTriangleId') replacement = 'forged-first';
      else if (key === 'secondTriangleId') replacement = 'forged-second';
      else if (key === 'sharedCanonicalVertexCount') {
        replacement = (original.sharedCanonicalVertexCount + 1) % 4;
      } else if (key === 'incidenceBasis') replacement = `${original.incidenceBasis}-tampered`;
      else if (key === 'incidenceClass') {
        replacement = original.incidenceClass === 'nonincident' ? 'shared-vertex' : 'nonincident';
      } else if (key === 'staticClassification') {
        replacement =
          original.staticClassification === 'disjoint' ? 'intersecting-coplanar' : 'disjoint';
      } else if (key === 'closedTrianglesIntersect') {
        replacement = !original.closedTrianglesIntersect;
      } else throw new TypeError(`unhandled producer-pair field ${key}`);
      const tamperedPairs = input.producer.pairs.map((entry, index) =>
        index === 0 ? { ...pairRecord, [key]: replacement } : entry,
      );
      const result = requireInconsistent(
        auditStaticRationalTriangleOverlapCensusCandidateV1(
          withProducer(input, {
            pairs:
              tamperedPairs as unknown as readonly StaticRationalTriangleOverlapCensusProducerPairSnapshotV1[],
          }),
        ),
      );
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('replays every expected geometry when producer pairs are shuffled, missing, or duplicated', () => {
    const input = auditInput(CONTACT_CORPUS);
    const firstPair = input.producer.pairs[0];
    if (firstPair === undefined) throw new TypeError('fixture pair must exist');
    const shuffled = withProducer(input, { pairs: [...input.producer.pairs].reverse() });
    const missing = withProducer(input, { pairs: input.producer.pairs.slice(1) });
    const duplicated = withProducer(input, {
      pairs: [firstPair, ...input.producer.pairs.slice(0, -1)],
    });
    for (const tampered of [shuffled, missing, duplicated]) {
      const result = requireInconsistent(
        auditStaticRationalTriangleOverlapCensusCandidateV1(tampered),
      );
      expect(result.value.auditedUnorderedPairCount).toBe(10);
      expect(result.value.allExpectedUnorderedPairsReplayed).toBe(true);
      expect(result.value.auditedDisjointPairCount + result.value.auditedOverlapPairCount).toBe(10);
    }
  });

  it('fails without a whole-census decision on decisionless or malformed pair-audit results', async () => {
    vi.resetModules();
    let mode: 'decisionless' | 'malformed-success' = 'decisionless';
    let pairAuditCalls = 0;
    vi.doMock(
      '../../m0f/reference-verifier/static-rational-triangle-overlap-audit.js',
      async (importOriginal) => {
        const actual = await importOriginal<PairAuditModuleForMock>();
        return {
          ...actual,
          auditStaticRationalTriangleOverlapCandidateV1: (supplied: unknown) => {
            pairAuditCalls += 1;
            if (pairAuditCalls !== 2) {
              return actual.auditStaticRationalTriangleOverlapCandidateV1(supplied);
            }
            return mode === 'decisionless'
              ? {
                  ok: false,
                  error: [
                    {
                      stage: 'audit-internal',
                      path: '$',
                      code: 'unexpected-audit-failure',
                      message: 'injected decisionless dependency failure',
                    },
                  ],
                }
              : {
                  ok: true,
                  value: {
                    auditedClassification: 'disjoint',
                    auditedClosedTrianglesIntersect: false,
                  },
                };
          },
        };
      },
    );
    try {
      const isolated =
        await import('../../m0f/reference-verifier/static-rational-triangle-overlap-census-audit.js');
      for (const selectedMode of ['decisionless', 'malformed-success'] as const) {
        mode = selectedMode;
        pairAuditCalls = 0;
        const result = requireContractFailure(
          isolated.auditStaticRationalTriangleOverlapCensusCandidateV1(auditInput(CONTACT_CORPUS)),
        );
        expect(pairAuditCalls).toBe(2);
        expect(result.error).toEqual([
          expect.objectContaining({
            stage: 'audit-internal',
            path: '$.producer.pairs[1]',
            code: 'unexpected-pair-audit-failure',
          }),
        ]);
      }
    } finally {
      vi.doUnmock('../../m0f/reference-verifier/static-rational-triangle-overlap-audit.js');
      vi.resetModules();
    }
  });

  it('returns deeply frozen parsed snapshots and decisions', () => {
    const input = auditInput(CONTACT_CORPUS);
    const parsed = parseStaticRationalTriangleOverlapCensusAuditInputV1(input);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new TypeError('fixture must parse');
    expectDeepFrozen(parsed);
    const result = auditStaticRationalTriangleOverlapCensusCandidateV1(input);
    expectConsistent(result);
    expectDeepFrozen(result);
  });

  it('rejects accessors without invoking them and rejects surplus structure', () => {
    const valid = auditInput(CONTACT_CORPUS);
    let invoked = false;
    const accessor = { ...valid };
    Object.defineProperty(accessor, 'producer', {
      enumerable: true,
      get() {
        invoked = true;
        return valid.producer;
      },
    });
    const accessorFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1(accessor),
    );
    expect(invoked).toBe(false);
    expect(accessorFailure.error).toContainEqual(
      expect.objectContaining({ code: 'accessor-property' }),
    );

    const surplusFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1({ ...valid, extra: true }),
    );
    expect(surplusFailure.error).toContainEqual(
      expect.objectContaining({ code: 'unknown-property' }),
    );
  });

  it('fails closed on a revoked proxy without returning a decision', () => {
    const revocable = Proxy.revocable(auditInput(CONTACT_CORPUS), {});
    revocable.revoke();
    const result = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1(revocable.proxy),
    );
    expect(result.error).toContainEqual(expect.objectContaining({ code: 'inspection-failed' }));
  });

  it('captures one descriptor-consistent snapshot from a stateful proxy', () => {
    const valid = auditInput(CONTACT_CORPUS);
    let producerDescriptorReads = 0;
    const stateful = new Proxy(
      { ...valid },
      {
        getOwnPropertyDescriptor: (target, key) => {
          const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
          if (key !== 'producer' || descriptor === undefined) return descriptor;
          producerDescriptorReads += 1;
          return {
            ...descriptor,
            value:
              producerDescriptorReads === 1
                ? valid.producer
                : { ...valid.producer, verifiedClaim: true },
          };
        },
      },
    );
    const result = auditStaticRationalTriangleOverlapCensusCandidateV1(stateful);
    expect(producerDescriptorReads).toBe(1);
    expectConsistent(result);
  });

  it('bounds and deterministically orders two reversed 100,000-unit Symbol diagnostics', () => {
    const hostile = { ...auditInput(CONTACT_CORPUS) };
    Object.defineProperty(hostile, Symbol(`z${'x'.repeat(99_999)}`), {
      value: true,
      enumerable: true,
    });
    Object.defineProperty(hostile, Symbol(`a${'x'.repeat(99_999)}`), {
      value: true,
      enumerable: true,
    });
    const result = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1(hostile),
    );
    const paths = result.error
      .filter((entry) => entry.code === 'unknown-property')
      .map((entry) => entry.path);
    expect(paths).toHaveLength(2);
    expect(paths[0]?.startsWith('$.Symbol(a')).toBe(true);
    expect(paths[1]?.startsWith('$.Symbol(z')).toBe(true);
    for (const path of paths) {
      expect(path).toHaveLength(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxDiagnosticPathSegmentCodeUnits + 2,
      );
      expect(path.endsWith('…')).toBe(true);
    }
  });

  it('caps diagnostics even when every coordinate is malformed', () => {
    const emptyProducer = producerFor([]);
    const malformedTriangles = Array.from({ length: 64 }, (_, index) => ({
      triangleId: `T${String(index).padStart(2, '0')}`,
      triangle: Array.from({ length: 3 }, () => ({ x: null, y: null, z: null, w: null })),
    }));
    const result = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1({
        schemaVersion: 1,
        recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
        coordinateEncoding: 'bigint',
        triangles: malformedTriangles,
        producer: emptyProducer,
      }),
    );
    expect(result.error).toHaveLength(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxIssues,
    );
    expectDeepFrozen(result);
  });

  it('rejects duplicate input IDs and the 65th triangle before replay', () => {
    const emptyProducer = producerFor([]);
    const duplicate = [
      { triangleId: 'same', triangle: BASE },
      { triangleId: 'same', triangle: BASE },
    ];
    const duplicateFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1({
        schemaVersion: 1,
        recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
        coordinateEncoding: 'bigint',
        triangles: duplicate,
        producer: emptyProducer,
      }),
    );
    expect(duplicateFailure.error).toContainEqual(
      expect.objectContaining({ code: 'duplicate-id' }),
    );

    const duplicateAfterInvalid = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1({
        schemaVersion: 1,
        recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
        coordinateEncoding: 'bigint',
        triangles: [
          {
            triangleId: 'invalid',
            triangle: triangle(point(0, 0, 0), point(1, 0, 0), point(2, 0, 0)),
          },
          { triangleId: 'same', triangle: BASE },
          { triangleId: 'same', triangle: BASE },
        ],
        producer: emptyProducer,
      }),
    );
    expect(duplicateAfterInvalid.error).toContainEqual(
      expect.objectContaining({
        path: '$.triangles[2].triangleId',
        code: 'duplicate-id',
        message: 'triangleId duplicates $.triangles[1].triangleId',
      }),
    );

    const oversized = Array.from({ length: 65 }, (_, index) => ({
      triangleId: `T${String(index).padStart(2, '0')}`,
      triangle: BASE,
    }));
    const limitFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1({
        schemaVersion: 1,
        recordType: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_INPUT_RECORD_TYPE,
        coordinateEncoding: 'bigint',
        triangles: oversized,
        producer: emptyProducer,
      }),
    );
    expect(limitFailure.error).toContainEqual(
      expect.objectContaining({ code: 'array-limit-exceeded' }),
    );
  });

  it('rejects noncanonical decimal text and decimal/BigInt coordinate limits', () => {
    const decimal = decimalAuditInput([{ triangleId: 'only', triangle: BASE }]);
    const firstTriangle = decimal.triangles[0];
    if (firstTriangle === undefined) throw new TypeError('decimal fixture must exist');
    const firstPoint = firstTriangle.triangle[0];
    const noncanonical = {
      ...decimal,
      triangles: [
        {
          ...firstTriangle,
          triangle: [
            { ...firstPoint, x: '01' },
            firstTriangle.triangle[1],
            firstTriangle.triangle[2],
          ],
        },
      ],
    };
    const decimalFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1(noncanonical),
    );
    expect(decimalFailure.error).toContainEqual(
      expect.objectContaining({ code: 'expected-canonical-decimal' }),
    );

    const decimalOverLimit = {
      ...decimal,
      triangles: [
        {
          ...firstTriangle,
          triangle: [
            {
              ...firstPoint,
              x: '1'.repeat(
                STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateDecimalDigits + 1,
              ),
            },
            firstTriangle.triangle[1],
            firstTriangle.triangle[2],
          ],
        },
      ],
    };
    const decimalLimitFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1(decimalOverLimit),
    );
    expect(decimalLimitFailure.error).toContainEqual(
      expect.objectContaining({ code: 'decimal-digit-limit-exceeded' }),
    );

    const bigint = auditInput([{ triangleId: 'only', triangle: BASE }]);
    const bigintTriangle = bigint.triangles[0];
    if (bigintTriangle === undefined) throw new TypeError('BigInt fixture must exist');
    const huge =
      1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_AUDIT_LIMITS.maxCoordinateBits);
    const overLimit = {
      ...bigint,
      triangles: [
        {
          ...bigintTriangle,
          triangle: [
            { ...bigintTriangle.triangle[0], x: huge },
            bigintTriangle.triangle[1],
            bigintTriangle.triangle[2],
          ],
        },
      ],
    };
    const bigintFailure = requireContractFailure(
      auditStaticRationalTriangleOverlapCensusCandidateV1(overLimit),
    );
    expect(bigintFailure.error).toContainEqual(
      expect.objectContaining({ code: 'coordinate-limit-exceeded' }),
    );
  });
});
