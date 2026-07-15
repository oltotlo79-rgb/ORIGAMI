import { describe, expect, it, vi } from 'vitest';

import {
  computeStaticRationalTriangleIntersectionStrataCensusV1,
  STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS,
  type StaticRationalTriangleIntersectionStrataCensusRecordV1,
} from '../../m0f/geometry/static-rational-triangle-intersection-strata-census.js';
import {
  classifyStaticRationalTriangleIntersectionStrataV1,
  type StaticRationalTriangleIntersectionStrataResultV1,
} from '../../m0f/geometry/static-rational-triangle-intersection-strata.js';
import type { StaticRationalTriangle3 } from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function point(x: bigint | number, y: bigint | number, z: bigint | number): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), 1n);
}

function rationalPoint(x: bigint, y: bigint, z: bigint, w: bigint): ProjectivePoint3 {
  return canonicalProjectivePoint3(x, y, z, w);
}

function triangle(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
): StaticRationalTriangle3 {
  return [first, second, third];
}

function entry(triangleId: string, value: StaticRationalTriangle3) {
  return { triangleId, triangle: value };
}

function census(
  entries: readonly ReturnType<typeof entry>[],
): StaticRationalTriangleIntersectionStrataCensusRecordV1 {
  const result = computeStaticRationalTriangleIntersectionStrataCensusV1({ triangles: entries });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('strata census fixture must succeed');
  return result.value;
}

function pair(
  record: StaticRationalTriangleIntersectionStrataCensusRecordV1,
  firstTriangleId: string,
  secondTriangleId: string,
) {
  const found = record.pairs.find(
    (candidate) =>
      candidate.firstTriangleId === firstTriangleId &&
      candidate.secondTriangleId === secondTriangleId,
  );
  if (found === undefined) throw new TypeError('strata census fixture pair must exist');
  return found;
}

function pairKey(firstTriangleId: string, secondTriangleId: string): string {
  return `${firstTriangleId}\u0000${secondTriangleId}`;
}

function independentlyEnumeratePairKeys(ids: readonly string[]): readonly string[] {
  const ordered = [...ids].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const result: string[] = [];
  for (let first = 0; first < ordered.length; first += 1) {
    for (let second = first + 1; second < ordered.length; second += 1) {
      const firstId = ordered[first];
      const secondId = ordered[second];
      if (firstId === undefined || secondId === undefined) throw new TypeError('pair fixture gap');
      result.push(pairKey(firstId, secondId));
    }
  }
  return result;
}

const BASE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
const FAR = triangle(point(10, 10, 0), point(12, 10, 0), point(10, 12, 0));
const COPLANAR_AREA = triangle(point(1, 1, 0), point(2, 1, 0), point(1, 2, 0));
const TRANSVERSE = triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0));
const SHARED_VERTEX = triangle(BASE[0], point(-1, 0, 1), point(0, -1, 1));
const SHARED_EDGE = triangle(BASE[0], BASE[1], point(0, 0, 1));
const COINCIDENT_REVERSED = triangle(BASE[2], BASE[1], BASE[0]);

describe('static exact-rational triangle intersection-strata census candidate', () => {
  it('retains every canonical unordered pair exactly once with the direct exact strata record', () => {
    const entries = [
      entry('G', COINCIDENT_REVERSED),
      entry('E', SHARED_VERTEX),
      entry('C', COPLANAR_AREA),
      entry('A', BASE),
      entry('F', SHARED_EDGE),
      entry('D', TRANSVERSE),
      entry('B', FAR),
    ];
    const record = census(entries);
    const expectedKeys = independentlyEnumeratePairKeys(entries.map((value) => value.triangleId));
    expect(record.triangleIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(record.unorderedPairCount).toBe(21);
    expect(record.pairs).toHaveLength(21);
    expect(record.pairs.map((value) => value.pairIndex)).toEqual(
      expectedKeys.map((_, index) => index),
    );
    expect(
      record.pairs.map((value) => pairKey(value.firstTriangleId, value.secondTriangleId)),
    ).toEqual(expectedKeys);

    const byId = new Map(entries.map((value) => [value.triangleId, value.triangle]));
    for (const current of record.pairs) {
      const first = byId.get(current.firstTriangleId);
      const second = byId.get(current.secondTriangleId);
      if (first === undefined || second === undefined) throw new TypeError('pair ID must resolve');
      const direct = classifyStaticRationalTriangleIntersectionStrataV1({
        triangleA: first,
        triangleB: second,
      });
      expect(direct.ok).toBe(true);
      if (!direct.ok) throw new TypeError('direct strata fixture must classify');
      expect(current.strata).toEqual(direct.value);
      expect(current.character).toBe(direct.value.character);
      expect(current.triangleARelativeLocation).toBe(direct.value.triangleARelativeLocation);
      expect(current.triangleBRelativeLocation).toBe(direct.value.triangleBRelativeLocation);
    }
  });

  it('distinguishes disjoint, interior crossing, contact, and coplanar-area obligations', () => {
    const record = census([
      entry('A', BASE),
      entry('B', FAR),
      entry('C', TRANSVERSE),
      entry('D', SHARED_EDGE),
      entry('E', COPLANAR_AREA),
    ]);
    expect(pair(record, 'A', 'B')).toMatchObject({
      character: 'disjoint',
      staticInteriorInteriorIntersectionDetected: false,
      staticContactCandidate: false,
      requiresMotionSideHistory: false,
    });
    expect(pair(record, 'A', 'C')).toMatchObject({
      character: 'noncoplanar-interior-interior-segment-intersection',
      triangleARelativeLocation: 'interior',
      triangleBRelativeLocation: 'interior',
      staticInteriorInteriorIntersectionDetected: true,
      staticContactCandidate: false,
      requiresMotionSideHistory: false,
    });
    expect(pair(record, 'A', 'D')).toMatchObject({
      sharedCanonicalVertexCount: 2,
      incidenceClass: 'shared-edge',
      character: 'noncoplanar-boundary-supported-segment-contact-candidate',
      staticContactCandidate: true,
      requiresMotionSideHistory: true,
      requiresLayerOrder: false,
    });
    expect(pair(record, 'A', 'E')).toMatchObject({
      character: 'coplanar-area-overlap-requires-layer-order',
      coplanarAreaOverlapDetected: true,
      requiresMotionSideHistory: true,
      requiresLayerOrder: true,
    });
  });

  it('independently recomputes every published count from the retained pair ledger', () => {
    const record = census([
      entry('A', BASE),
      entry('B', FAR),
      entry('C', COPLANAR_AREA),
      entry('D', TRANSVERSE),
      entry('E', SHARED_VERTEX),
      entry('F', SHARED_EDGE),
      entry('G', COINCIDENT_REVERSED),
    ]);
    const count = (predicate: (value: (typeof record.pairs)[number]) => boolean) =>
      record.pairs.filter(predicate).length;
    expect(record.disjointPairCount).toBe(count((value) => value.character === 'disjoint'));
    expect(record.staticInteriorInteriorIntersectionPairCount).toBe(
      count((value) => value.staticInteriorInteriorIntersectionDetected),
    );
    expect(record.staticContactCandidatePairCount).toBe(
      count((value) => value.staticContactCandidate),
    );
    expect(record.coplanarAreaOverlapPairCount).toBe(
      count((value) => value.coplanarAreaOverlapDetected),
    );
    expect(record.requiresMotionSideHistoryPairCount).toBe(
      count((value) => value.requiresMotionSideHistory),
    );
    expect(record.requiresLayerOrderPairCount).toBe(count((value) => value.requiresLayerOrder));
    expect(record.nonincidentPairCount).toBe(
      count((value) => value.incidenceClass === 'nonincident'),
    );
    expect(record.sharedVertexPairCount).toBe(
      count((value) => value.incidenceClass === 'shared-vertex'),
    );
    expect(record.sharedEdgePairCount).toBe(
      count((value) => value.incidenceClass === 'shared-edge'),
    );
    expect(record.coincidentTrianglePairCount).toBe(
      count((value) => value.incidenceClass === 'coincident-triangle'),
    );
    expect(
      record.disjointPairCount +
        record.staticInteriorInteriorIntersectionPairCount +
        record.staticContactCandidatePairCount +
        record.coplanarAreaOverlapPairCount,
    ).toBe(record.unorderedPairCount);
  });

  it('is invariant under caller entry, vertex, winding, and rational representation permutations', () => {
    const rationalTransverse = triangle(
      rationalPoint(2n, 2n, -2n, 2n),
      rationalPoint(2n, 2n, 2n, 2n),
      rationalPoint(6n, 2n, 0n, 2n),
    );
    const canonical = census([
      entry('A', BASE),
      entry('B', rationalTransverse),
      entry('C', COPLANAR_AREA),
    ]);
    const permuted = census([
      entry('C', triangle(COPLANAR_AREA[1], COPLANAR_AREA[2], COPLANAR_AREA[0])),
      entry('B', triangle(rationalTransverse[2], rationalTransverse[1], rationalTransverse[0])),
      entry('A', triangle(BASE[2], BASE[1], BASE[0])),
    ]);
    expect(permuted).toEqual(canonical);
    for (const current of canonical.pairs.flatMap((value) => value.strata.locus.vertices)) {
      expect(current.w > 0n).toBe(true);
      expect([current.x, current.y, current.z, current.w].map(String)).not.toContain('-0');
    }
  });

  it('accepts empty and singleton sets without inventing pairs', () => {
    expect(census([])).toMatchObject({
      triangleCount: 0,
      unorderedPairCount: 0,
      disjointPairCount: 0,
      pairs: [],
      allUnorderedPairsIncluded: true,
      silentPairExclusionIncluded: false,
    });
    expect(census([entry('Only', BASE)])).toMatchObject({
      triangleIds: ['Only'],
      triangleCount: 1,
      unorderedPairCount: 0,
      pairs: [],
    });
  });

  it('returns deeply frozen success and failure graphs', () => {
    const success = computeStaticRationalTriangleIntersectionStrataCensusV1({
      triangles: [entry('A', BASE), entry('B', TRANSVERSE)],
    });
    expect(success.ok).toBe(true);
    expect(Object.isFrozen(success)).toBe(true);
    if (!success.ok) throw new TypeError('fixture census must succeed');
    expect(Object.isFrozen(success.value)).toBe(true);
    expect(Object.isFrozen(success.value.triangleIds)).toBe(true);
    expect(Object.isFrozen(success.value.pairs)).toBe(true);
    expect(Object.isFrozen(success.value.pairs[0])).toBe(true);
    expect(Object.isFrozen(success.value.pairs[0]?.strata)).toBe(true);
    expect(Object.isFrozen(success.value.pairs[0]?.strata.locus.vertices)).toBe(true);

    const failure = computeStaticRationalTriangleIntersectionStrataCensusV1(undefined);
    expect(failure.ok).toBe(false);
    expect(Object.isFrozen(failure)).toBe(true);
    if (failure.ok) throw new TypeError('invalid input must fail');
    expect(Object.isFrozen(failure.error)).toBe(true);
    expect(Object.isFrozen(failure.error[0])).toBe(true);
  });

  it('fails atomically for duplicate, malformed, accessor, revoked-proxy, and over-limit inputs', () => {
    const duplicate = computeStaticRationalTriangleIntersectionStrataCensusV1({
      triangles: [entry('Same', BASE), entry('Same', FAR)],
    });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new TypeError('duplicate IDs must fail');
    expect(duplicate.error).toContainEqual(expect.objectContaining({ code: 'duplicate-id' }));

    const malformed = computeStaticRationalTriangleIntersectionStrataCensusV1({
      triangles: [entry('Degenerate', triangle(point(0, 0, 0), point(1, 1, 1), point(2, 2, 2)))],
      extra: true,
    });
    expect(malformed.ok).toBe(false);
    if (malformed.ok) throw new TypeError('malformed input must fail');
    expect(malformed.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.extra', code: 'unknown-property' }),
        expect.objectContaining({
          path: '$.triangles[0].triangle',
          code: 'invalid-triangle',
          sourceCode: 'degenerate-triangle',
        }),
      ]),
    );

    let getterCalls = 0;
    const accessorRoot: Record<string, unknown> = {};
    Object.defineProperty(accessorRoot, 'triangles', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return [];
      },
    });
    expect(computeStaticRationalTriangleIntersectionStrataCensusV1(accessorRoot).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() =>
      computeStaticRationalTriangleIntersectionStrataCensusV1(revoked.proxy),
    ).not.toThrow();
    expect(computeStaticRationalTriangleIntersectionStrataCensusV1(revoked.proxy)).toMatchObject({
      ok: false,
    });

    const maximum = Array.from(
      { length: STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS.maxTriangles },
      (_, index) =>
        entry(
          `T${String(index).padStart(3, '0')}`,
          triangle(point(0, 0, index), point(2, 0, index), point(0, 2, index)),
        ),
    );
    const overLimit = computeStaticRationalTriangleIntersectionStrataCensusV1({
      triangles: [...maximum, entry('TooMany', FAR)],
    });
    expect(overLimit.ok).toBe(false);
    if (overLimit.ok) throw new TypeError('over-limit input must fail');
    expect(overLimit.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'triangle-count-limit-exceeded' }),
        expect.objectContaining({ code: 'pair-count-limit-exceeded' }),
      ]),
    );
  });

  it('retains all 2,016 pairs at the published defensive maximum', () => {
    const maximum = Array.from(
      { length: STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS.maxTriangles },
      (_, index) =>
        entry(
          `T${String(index).padStart(3, '0')}`,
          triangle(point(0, 0, index), point(2, 0, index), point(0, 2, index)),
        ),
    );
    const record = census([...maximum].reverse());
    expect(record.unorderedPairCount).toBe(
      STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS.maxPairs,
    );
    expect(record.pairs).toHaveLength(
      STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS.maxPairs,
    );
    expect(record.disjointPairCount).toBe(
      STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_CENSUS_LIMITS.maxPairs,
    );
    expect(
      record.pairs.map((value) => pairKey(value.firstTriangleId, value.secondTriangleId)),
    ).toEqual(independentlyEnumeratePairKeys(maximum.map((value) => value.triangleId)));
    expect(record.pairs.every((value) => Object.isFrozen(value.strata.locus))).toBe(true);
  }, 60_000);

  it('keeps topology, policy, collision, verification, scientific, support, and GO claims false', () => {
    expect(census([entry('A', BASE), entry('B', TRANSVERSE)])).toMatchObject({
      contractStatus: 'candidate-no-claim',
      allUnorderedPairsIncluded: true,
      silentPairExclusionIncluded: false,
      relativeInteriorStrataIncluded: true,
      exactIntersectionLocusIncluded: true,
      staticInteriorIntersectionEvidenceIncluded: true,
      meshIdentityBindingIncluded: false,
      declaredIncidencePolicyIncluded: false,
      legalContactClassificationIncluded: false,
      penetrationClassificationIncluded: false,
      selfIntersectionClassificationIncluded: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });

  it('atomically fails if the pair classifier returns no issue detail', async () => {
    vi.resetModules();
    let classifierCalls = 0;
    vi.doMock(
      '../../m0f/geometry/static-rational-triangle-intersection-strata.js',
      async (importOriginal) => {
        const actual = await importOriginal<
          Record<string, unknown> &
            Readonly<{
              classifyStaticRationalTriangleIntersectionStrataV1: (
                supplied: unknown,
              ) => StaticRationalTriangleIntersectionStrataResultV1;
            }>
        >();
        return {
          ...actual,
          classifyStaticRationalTriangleIntersectionStrataV1: (supplied: unknown) => {
            classifierCalls += 1;
            return classifierCalls === 2
              ? { ok: false as const, error: Object.freeze([]) }
              : actual.classifyStaticRationalTriangleIntersectionStrataV1(supplied);
          },
        };
      },
    );
    try {
      const isolated =
        await import('../../m0f/geometry/static-rational-triangle-intersection-strata-census.js');
      const result = isolated.computeStaticRationalTriangleIntersectionStrataCensusV1({
        triangles: [entry('A', BASE), entry('B', FAR), entry('C', TRANSVERSE)],
      });
      expect(result.ok).toBe(false);
      expect(classifierCalls).toBe(2);
      if (result.ok) throw new TypeError('classifier failure must reject the census');
      expect(result.error).toEqual([
        expect.objectContaining({
          path: '$.pairs[A,C]',
          code: 'strata-classifier-failure-invariant',
        }),
      ]);
      expect(result.error[0]).not.toHaveProperty('sourceCode');
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/static-rational-triangle-intersection-strata.js');
      vi.resetModules();
    }
  });

  it('atomically rejects a forged determinate strata success', async () => {
    vi.resetModules();
    vi.doMock(
      '../../m0f/geometry/static-rational-triangle-intersection-strata.js',
      async (importOriginal) => {
        const actual = await importOriginal<
          Record<string, unknown> &
            Readonly<{
              classifyStaticRationalTriangleIntersectionStrataV1: (
                supplied: unknown,
              ) => StaticRationalTriangleIntersectionStrataResultV1;
            }>
        >();
        return {
          ...actual,
          classifyStaticRationalTriangleIntersectionStrataV1: (
            supplied: unknown,
          ): StaticRationalTriangleIntersectionStrataResultV1 => {
            const produced = actual.classifyStaticRationalTriangleIntersectionStrataV1(supplied);
            if (!produced.ok) return produced;
            return {
              ok: true as const,
              value: Object.freeze({
                ...produced.value,
                staticContactCandidate: !produced.value.staticContactCandidate,
              }),
            };
          },
        };
      },
    );
    try {
      const isolated =
        await import('../../m0f/geometry/static-rational-triangle-intersection-strata-census.js');
      const result = isolated.computeStaticRationalTriangleIntersectionStrataCensusV1({
        triangles: [entry('A', BASE), entry('B', TRANSVERSE)],
      });
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('forged success must reject the census');
      expect(result.error).toEqual([
        expect.objectContaining({
          path: '$.pairs[A,B]',
          code: 'strata-classifier-failure-invariant',
          sourceCode: 'strata-record-contract',
        }),
      ]);
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/static-rational-triangle-intersection-strata.js');
      vi.resetModules();
    }
  });
});
