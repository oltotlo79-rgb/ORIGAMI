import { describe, expect, it, vi } from 'vitest';

import {
  computeStaticRationalTriangleOverlapCensusV1,
  parseStaticRationalTriangleOverlapCensusInputV1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS,
  type StaticRationalTriangleOverlapCensusRecordV1,
} from '../../m0f/geometry/static-rational-triangle-overlap-census.js';
import {
  STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS,
  type StaticRationalTriangle3,
  type StaticRationalTriangleOverlapResultV1,
} from '../../m0f/geometry/static-rational-triangle-overlap.js';
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
): StaticRationalTriangleOverlapCensusRecordV1 {
  const result = computeStaticRationalTriangleOverlapCensusV1({ triangles: entries });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('fixture census must succeed');
  return result.value;
}

function pair(
  record: StaticRationalTriangleOverlapCensusRecordV1,
  firstTriangleId: string,
  secondTriangleId: string,
) {
  const found = record.pairs.find(
    (candidate) =>
      candidate.firstTriangleId === firstTriangleId &&
      candidate.secondTriangleId === secondTriangleId,
  );
  if (found === undefined) throw new TypeError('fixture pair must exist');
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

function canonicalPointKey(value: ProjectivePoint3): string {
  return `${String(value.x)}/${String(value.w)},${String(value.y)}/${String(value.w)},${String(value.z)}/${String(value.w)}`;
}

const BASE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
const FAR = triangle(point(10, 10, 0), point(12, 10, 0), point(10, 12, 0));
const COPLANAR_OVERLAP = triangle(point(1, 1, 0), point(5, 1, 0), point(1, 5, 0));
const TRANSVERSE = triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0));
const SHARED_VERTEX = triangle(BASE[0], point(-1, 0, 1), point(0, -1, 1));
const SHARED_EDGE = triangle(BASE[0], BASE[1], point(0, 0, 1));
const COINCIDENT_REVERSED = triangle(BASE[2], BASE[1], BASE[0]);

describe('exact static rational triangle overlap raw census', () => {
  it('classifies every canonical unordered pair once and records all four incidence classes', () => {
    const record = census([
      entry('G', COINCIDENT_REVERSED),
      entry('E', SHARED_VERTEX),
      entry('C', COPLANAR_OVERLAP),
      entry('A', BASE),
      entry('F', SHARED_EDGE),
      entry('D', TRANSVERSE),
      entry('B', FAR),
    ]);

    expect(record.triangleIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(record.triangleCount).toBe(7);
    expect(record.unorderedPairCount).toBe(21);
    expect(record.pairs).toHaveLength(21);
    expect(record.pairs.map((value) => value.pairIndex)).toEqual(
      Array.from({ length: 21 }, (_, index) => index),
    );
    expect(
      new Set(
        record.pairs.map((value) => `${value.firstTriangleId}\u0000${value.secondTriangleId}`),
      ).size,
    ).toBe(21);
    expect(record.pairs.every((value) => value.firstTriangleId < value.secondTriangleId)).toBe(
      true,
    );

    expect(pair(record, 'A', 'B')).toMatchObject({
      sharedCanonicalVertexCount: 0,
      incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology',
      incidenceClass: 'nonincident',
      staticClassification: 'disjoint',
      closedTrianglesIntersect: false,
    });
    expect(pair(record, 'A', 'C')).toMatchObject({
      sharedCanonicalVertexCount: 0,
      incidenceClass: 'nonincident',
      staticClassification: 'intersecting-coplanar',
    });
    expect(pair(record, 'A', 'D')).toMatchObject({
      sharedCanonicalVertexCount: 0,
      incidenceClass: 'nonincident',
      staticClassification: 'intersecting-noncoplanar',
    });
    expect(pair(record, 'A', 'E')).toMatchObject({
      sharedCanonicalVertexCount: 1,
      incidenceClass: 'shared-vertex',
      staticClassification: 'intersecting-noncoplanar',
    });
    expect(pair(record, 'A', 'F')).toMatchObject({
      sharedCanonicalVertexCount: 2,
      incidenceClass: 'shared-edge',
      staticClassification: 'intersecting-noncoplanar',
    });
    expect(pair(record, 'A', 'G')).toMatchObject({
      sharedCanonicalVertexCount: 3,
      incidenceClass: 'coincident-triangle',
      staticClassification: 'intersecting-coplanar',
    });

    expect(record.disjointPairCount + record.overlapPairCount).toBe(record.unorderedPairCount);
    expect(record.coplanarOverlapPairCount + record.noncoplanarOverlapPairCount).toBe(
      record.overlapPairCount,
    );
    expect(
      record.nonincidentPairCount +
        record.sharedVertexPairCount +
        record.sharedEdgePairCount +
        record.coincidentTrianglePairCount,
    ).toBe(record.unorderedPairCount);
    expect(record.nonincidentOverlapPairCount).toBe(
      record.pairs.filter(
        (value) => value.incidenceClass === 'nonincident' && value.closedTrianglesIntersect,
      ).length,
    );
    expect(record.incidentOverlapPairCount + record.nonincidentOverlapPairCount).toBe(
      record.overlapPairCount,
    );
  });

  it('is invariant under caller entry permutations, vertex permutations, and winding reversal', () => {
    const canonical = census([
      entry('A', BASE),
      entry('C', COPLANAR_OVERLAP),
      entry('D', TRANSVERSE),
    ]);
    const permuted = census([
      entry('D', triangle(TRANSVERSE[1], TRANSVERSE[0], TRANSVERSE[2])),
      entry('A', triangle(BASE[2], BASE[1], BASE[0])),
      entry('C', triangle(COPLANAR_OVERLAP[1], COPLANAR_OVERLAP[2], COPLANAR_OVERLAP[0])),
    ]);
    expect(permuted).toEqual(canonical);
  });

  it('matches an independent nC2 and canonical-incidence property corpus for every prefix', () => {
    const vertices = Array.from({ length: 7 }, (_, value) =>
      point(value, value * value, value * value * value),
    );
    const vertex = (index: number): ProjectivePoint3 => {
      const found = vertices[index];
      if (found === undefined) throw new TypeError('property-corpus vertex is missing');
      return found;
    };
    const triples = [
      [0, 1, 2],
      [0, 1, 3],
      [0, 4, 5],
      [1, 4, 6],
      [2, 3, 5],
      [3, 4, 6],
      [0, 2, 6],
      [1, 3, 5],
      [2, 4, 6],
      [0, 3, 6],
      [1, 2, 4],
      [3, 5, 6],
    ] as const;
    const entries = triples.map((indices, index) =>
      entry(
        `T${String(index).padStart(2, '0')}`,
        triangle(vertex(indices[0]), vertex(indices[1]), vertex(indices[2])),
      ),
    );
    const firstTriangle = entries[0]?.triangle;
    if (firstTriangle === undefined)
      throw new TypeError('property corpus must have a first triangle');
    entries.push(entry('T12', triangle(firstTriangle[2], firstTriangle[0], firstTriangle[1])));

    for (let size = 0; size <= entries.length; size += 1) {
      const supplied = entries.slice(0, size).reverse();
      const record = census(supplied);
      const expectedPairKeys = independentlyEnumeratePairKeys(
        supplied.map((value) => value.triangleId),
      );
      expect(record.unorderedPairCount).toBe(size < 2 ? 0 : (size * (size - 1)) / 2);
      expect(
        record.pairs.map((value) => pairKey(value.firstTriangleId, value.secondTriangleId)),
      ).toEqual(expectedPairKeys);
      expect(record.pairs.map((value) => value.pairIndex)).toEqual(
        expectedPairKeys.map((_, index) => index),
      );
    }

    const full = census([...entries].reverse());
    const triangleById = new Map(entries.map((value) => [value.triangleId, value.triangle]));
    for (const current of full.pairs) {
      const left = triangleById.get(current.firstTriangleId);
      const right = triangleById.get(current.secondTriangleId);
      if (left === undefined || right === undefined) throw new TypeError('pair ID must resolve');
      const rightKeys = new Set(right.map(canonicalPointKey));
      const expectedShared = left.filter((value) => rightKeys.has(canonicalPointKey(value))).length;
      expect(current.sharedCanonicalVertexCount).toBe(expectedShared);
      expect(current.incidenceClass).toBe(
        expectedShared === 0
          ? 'nonincident'
          : expectedShared === 1
            ? 'shared-vertex'
            : expectedShared === 2
              ? 'shared-edge'
              : 'coincident-triangle',
      );
    }
    expect(new Set(full.pairs.map((value) => value.incidenceClass))).toEqual(
      new Set(['nonincident', 'shared-vertex', 'shared-edge', 'coincident-triangle']),
    );
    expect(full.disjointPairCount).toBe(
      full.pairs.filter((value) => value.staticClassification === 'disjoint').length,
    );
    expect(full.overlapPairCount).toBe(
      full.pairs.filter((value) => value.closedTrianglesIntersect).length,
    );
    expect(full.coplanarOverlapPairCount).toBe(
      full.pairs.filter((value) => value.staticClassification === 'intersecting-coplanar').length,
    );
    expect(full.noncoplanarOverlapPairCount).toBe(
      full.pairs.filter((value) => value.staticClassification === 'intersecting-noncoplanar')
        .length,
    );
    expect(full.nonincidentPairCount).toBe(
      full.pairs.filter((value) => value.incidenceClass === 'nonincident').length,
    );
    expect(full.sharedVertexPairCount).toBe(
      full.pairs.filter((value) => value.incidenceClass === 'shared-vertex').length,
    );
    expect(full.sharedEdgePairCount).toBe(
      full.pairs.filter((value) => value.incidenceClass === 'shared-edge').length,
    );
    expect(full.coincidentTrianglePairCount).toBe(
      full.pairs.filter((value) => value.incidenceClass === 'coincident-triangle').length,
    );
    expect(full.nonincidentOverlapPairCount).toBe(
      full.pairs.filter(
        (value) => value.incidenceClass === 'nonincident' && value.closedTrianglesIntersect,
      ).length,
    );
    expect(full.incidentOverlapPairCount).toBe(
      full.pairs.filter(
        (value) => value.incidenceClass !== 'nonincident' && value.closedTrianglesIntersect,
      ).length,
    );

    const permutedEntries = entries
      .map((value, index) =>
        entry(
          value.triangleId,
          index % 2 === 0
            ? triangle(value.triangle[2], value.triangle[1], value.triangle[0])
            : triangle(value.triangle[1], value.triangle[2], value.triangle[0]),
        ),
      )
      .reverse();
    expect(census(permutedEntries)).toEqual(full);
  });

  it('uses exact projective equality for distinct canonical non-unit-weight vertex objects', () => {
    const sharedA = rationalPoint(1n, 1n, 0n, 2n);
    const sharedB = rationalPoint(1n, 1n, 0n, 2n);
    expect(sharedA).not.toBe(sharedB);
    expect(sharedA.w).toBe(2n);
    const left = triangle(sharedA, point(3, 0, 0), point(0, 3, 0));
    const right = triangle(sharedB, point(1, 1, 1), point(2, 1, 1));
    expect(
      pair(census([entry('Left', left), entry('Right', right)]), 'Left', 'Right'),
    ).toMatchObject({
      sharedCanonicalVertexCount: 1,
      incidenceClass: 'shared-vertex',
      closedTrianglesIntersect: true,
    });
  });

  it('accepts empty and singleton sets without inventing or excluding pairs', () => {
    const empty = census([]);
    expect(empty).toMatchObject({
      triangleCount: 0,
      unorderedPairCount: 0,
      overlapPairCount: 0,
      allUnorderedPairsIncluded: true,
      silentPairExclusionIncluded: false,
    });
    expect(empty.pairs).toEqual([]);

    const singleton = census([entry('Only', BASE)]);
    expect(singleton.triangleIds).toEqual(['Only']);
    expect(singleton.unorderedPairCount).toBe(0);
    expect(singleton.pairs).toEqual([]);
  });

  it('accepts canonical length-prefixed triangle IDs emitted by face reconstruction', () => {
    const record = census([
      entry('30:candidate-rational-triangle-v1:face:000001', BASE),
      entry('9:triangle:2', FAR),
    ]);
    expect(record.triangleIds).toEqual([
      '30:candidate-rational-triangle-v1:face:000001',
      '9:triangle:2',
    ]);
    expect(record.unorderedPairCount).toBe(1);
  });

  it('returns deeply frozen canonical parses, records, pair ledgers, and failures', () => {
    const supplied = { triangles: [entry('B', FAR), entry('A', BASE)] };
    const parsed = parseStaticRationalTriangleOverlapCensusInputV1(supplied);
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('fixture input must parse');
    expect(parsed.value.triangles.map((value) => value.triangleId)).toEqual(['A', 'B']);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangles)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangles[0]?.triangle)).toBe(true);
    supplied.triangles[0] = entry('Changed', BASE);
    expect(parsed.value.triangles.map((value) => value.triangleId)).toEqual(['A', 'B']);

    const success = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [entry('A', BASE), entry('B', FAR)],
    });
    expect(success.ok).toBe(true);
    expect(Object.isFrozen(success)).toBe(true);
    if (!success.ok) throw new TypeError('fixture census must succeed');
    expect(Object.isFrozen(success.value)).toBe(true);
    expect(Object.isFrozen(success.value.pairs)).toBe(true);
    expect(Object.isFrozen(success.value.pairs[0])).toBe(true);

    const invalid = computeStaticRationalTriangleOverlapCensusV1(undefined);
    expect(invalid.ok).toBe(false);
    expect(Object.isFrozen(invalid)).toBe(true);
    if (invalid.ok) throw new TypeError('invalid input must fail');
    expect(Object.isFrozen(invalid.error)).toBe(true);
    expect(Object.isFrozen(invalid.error[0])).toBe(true);
  });

  it('fails atomically for duplicate/invalid IDs, unknown fields, and invalid triangles', () => {
    const duplicate = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [entry('Same', BASE), entry('Same', FAR)],
    });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new TypeError('duplicate IDs must fail');
    expect(duplicate.error).toContainEqual(expect.objectContaining({ code: 'duplicate-id' }));

    const malformed = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [
        { ...entry('bad id', BASE), extra: true },
        entry('Degenerate', triangle(point(0, 0, 0), point(1, 1, 1), point(2, 2, 2))),
      ],
      extra: true,
    });
    expect(malformed.ok).toBe(false);
    if (malformed.ok) throw new TypeError('malformed census must fail');
    expect(malformed.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.extra', code: 'unknown-property' }),
        expect.objectContaining({ path: '$.triangles[0].extra', code: 'unknown-property' }),
        expect.objectContaining({ path: '$.triangles[0].triangleId', code: 'invalid-id' }),
        expect.objectContaining({
          path: '$.triangles[1].triangle',
          code: 'invalid-triangle',
          sourceCode: 'degenerate-triangle',
        }),
      ]),
    );

    const longId = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [
        entry(
          `T${'x'.repeat(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIdCodeUnits)}`,
          BASE,
        ),
      ],
    });
    expect(longId.ok).toBe(false);
    if (longId.ok) throw new TypeError('over-limit ID must fail');
    expect(longId.error).toContainEqual(expect.objectContaining({ code: 'invalid-id' }));

    const oversized = 1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxCoordinateBits);
    const invalidPoint = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [entry('Oversized', [{ x: oversized, y: 0n, z: 0n, w: 1n }, BASE[1], BASE[2]])],
    });
    expect(invalidPoint.ok).toBe(false);
    if (invalidPoint.ok) throw new TypeError('oversized point must fail');
    expect(invalidPoint.error).toContainEqual(
      expect.objectContaining({
        code: 'invalid-triangle',
        sourceCode: 'coordinate-limit-exceeded',
      }),
    );
  });

  it('rejects accessors without invoking them and turns revoked proxies into failures', () => {
    let calls = 0;
    const accessorRoot: Record<string, unknown> = {};
    Object.defineProperty(accessorRoot, 'triangles', {
      enumerable: true,
      get() {
        calls += 1;
        return [];
      },
    });
    expect(computeStaticRationalTriangleOverlapCensusV1(accessorRoot).ok).toBe(false);
    expect(calls).toBe(0);

    const accessorArray = [entry('A', BASE)];
    Object.defineProperty(accessorArray, '0', {
      enumerable: true,
      configurable: true,
      get() {
        calls += 1;
        return entry('A', BASE);
      },
    });
    expect(
      computeStaticRationalTriangleOverlapCensusV1({ triangles: accessorArray }),
    ).toMatchObject({ ok: false });
    expect(calls).toBe(0);

    const revokedRoot = Proxy.revocable({}, {});
    revokedRoot.revoke();
    expect(() => computeStaticRationalTriangleOverlapCensusV1(revokedRoot.proxy)).not.toThrow();
    const rootResult = computeStaticRationalTriangleOverlapCensusV1(revokedRoot.proxy);
    expect(rootResult.ok).toBe(false);
    if (rootResult.ok) throw new TypeError('revoked root must fail');
    expect(rootResult.error).toContainEqual(
      expect.objectContaining({ path: '$', code: 'inspection-failed' }),
    );

    const revokedArray = Proxy.revocable([entry('A', BASE)], {});
    revokedArray.revoke();
    const arrayResult = computeStaticRationalTriangleOverlapCensusV1({
      triangles: revokedArray.proxy,
    });
    expect(arrayResult.ok).toBe(false);
    if (arrayResult.ok) throw new TypeError('revoked array must fail');
    expect(arrayResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangles', code: 'inspection-failed' }),
    );

    const revokedEntry = Proxy.revocable(entry('A', BASE), {});
    revokedEntry.revoke();
    const entryResult = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [revokedEntry.proxy],
    });
    expect(entryResult.ok).toBe(false);
    if (entryResult.ok) throw new TypeError('revoked entry must fail');
    expect(entryResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangles[0]', code: 'inspection-failed' }),
    );
  });

  it('caps hostile property inspection and accumulated diagnostics', () => {
    const keys = Array.from(
      {
        length: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxOwnPropertiesPerContainer + 1,
      },
      (_, index) => `hostile-${String(index)}`,
    );
    let descriptorCalls = 0;
    const hostileRoot = new Proxy(
      {},
      {
        ownKeys: () => keys,
        getOwnPropertyDescriptor: () => {
          descriptorCalls += 1;
          return { configurable: true, enumerable: true, value: null };
        },
      },
    );
    const hostile = computeStaticRationalTriangleOverlapCensusV1(hostileRoot);
    expect(hostile.ok).toBe(false);
    expect(descriptorCalls).toBe(0);
    if (hostile.ok) throw new TypeError('hostile root must fail');
    expect(hostile.error).toContainEqual(
      expect.objectContaining({ code: 'property-limit-exceeded' }),
    );

    const malformedPoint = {
      x: null,
      y: null,
      z: null,
      w: null,
      extraA: null,
      extraB: null,
      extraC: null,
      extraD: null,
    };
    const malformedTriangle = [malformedPoint, malformedPoint, malformedPoint];
    const manyIssues = computeStaticRationalTriangleOverlapCensusV1({
      triangles: Array.from(
        { length: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles },
        (_, index) => entry(`T${String(index).padStart(3, '0')}`, malformedTriangle as never),
      ),
    });
    expect(manyIssues.ok).toBe(false);
    if (manyIssues.ok) throw new TypeError('malformed triangles must fail');
    expect(manyIssues.error).toHaveLength(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxIssues);
    expect(manyIssues.error.every((value) => Object.isFrozen(value))).toBe(true);
  });

  it('bounds and deterministically orders hostile symbol names in diagnostic paths', () => {
    const alpha = Symbol('a'.repeat(100_000));
    const zeta = Symbol('z'.repeat(100_000));
    const pathsFor = (symbols: readonly symbol[]) => {
      const supplied: Record<PropertyKey, unknown> = { triangles: [] };
      for (const symbol of symbols) supplied[symbol] = true;
      const parsed = parseStaticRationalTriangleOverlapCensusInputV1(supplied);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) throw new TypeError('unknown symbol properties must fail');
      return parsed.error
        .filter((entryValue) => entryValue.code === 'unknown-property')
        .map((entryValue) => entryValue.path);
    };

    const paths = pathsFor([zeta, alpha]);
    expect(paths).toEqual(pathsFor([alpha, zeta]));
    expect(paths).toHaveLength(2);
    expect(paths[0]?.startsWith('$.Symbol(a')).toBe(true);
    expect(paths[1]?.startsWith('$.Symbol(z')).toBe(true);
    for (const path of paths) {
      expect(path.length).toBe(
        STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxDiagnosticPathSegmentCodeUnits + 2,
      );
      expect(path.endsWith('…')).toBe(true);
    }
  });

  it('accepts the published maximum and rejects triangle and pair counts above it', () => {
    expect(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs).toBe(
      (STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles *
        (STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles - 1)) /
        2,
    );
    const maximum = Array.from(
      { length: STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxTriangles },
      (_, index) =>
        entry(
          `T${String(index).padStart(3, '0')}`,
          triangle(point(0, 0, index), point(2, 0, index), point(0, 2, index)),
        ),
    );
    const accepted = census(maximum);
    expect(accepted.unorderedPairCount).toBe(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs,
    );
    expect(accepted.pairs).toHaveLength(STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs);
    expect(
      accepted.pairs.map((value) => pairKey(value.firstTriangleId, value.secondTriangleId)),
    ).toEqual(independentlyEnumeratePairKeys(maximum.map((value) => value.triangleId)));
    expect(accepted.disjointPairCount).toBe(
      STATIC_RATIONAL_TRIANGLE_OVERLAP_CENSUS_LIMITS.maxPairs,
    );

    const rejected = computeStaticRationalTriangleOverlapCensusV1({
      triangles: [...maximum, entry('TooMany', BASE)],
    });
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('over-limit census must fail');
    expect(rejected.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'triangle-count-limit-exceeded' }),
        expect.objectContaining({ code: 'pair-count-limit-exceeded' }),
      ]),
    );
  });

  it('keeps every adjacency, contact-policy, self-intersection, CCD, verification, and GO claim false', () => {
    expect(census([entry('A', BASE), entry('B', TRANSVERSE)])).toMatchObject({
      contractStatus: 'candidate-no-claim',
      allUnorderedPairsIncluded: true,
      silentPairExclusionIncluded: false,
      rawCensusOnly: true,
      staticPredicateIncluded: true,
      incidenceBasis: 'shared-canonical-vertex-count-only-not-mesh-topology',
      meshAdjacencyDecisionIncluded: false,
      legalContactClassificationIncluded: false,
      penetrationClassificationIncluded: false,
      selfIntersectionDecisionIncluded: false,
      collisionFreeClaim: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      rigidMotionIntervalIncluded: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      globalM0fGo: false,
    });
  });

  it.each([
    {
      name: 'shared vertex reported disjoint',
      other: SHARED_VERTEX,
      forgedClassification: 'disjoint' as const,
      forgedIntersection: false,
    },
    {
      name: 'coincident triangle reported noncoplanar',
      other: COINCIDENT_REVERSED,
      forgedClassification: 'intersecting-noncoplanar' as const,
      forgedIntersection: true,
    },
  ])('atomically rejects an incidence-impossible classifier success: $name', async (fixture) => {
    vi.resetModules();
    vi.doMock('../../m0f/geometry/static-rational-triangle-overlap.js', async (importOriginal) => {
      const actual = await importOriginal<
        Record<string, unknown> &
          Readonly<{
            classifyStaticRationalTriangleOverlap: (
              supplied: unknown,
            ) => StaticRationalTriangleOverlapResultV1;
          }>
      >();
      return {
        ...actual,
        classifyStaticRationalTriangleOverlap: (
          supplied: unknown,
        ): StaticRationalTriangleOverlapResultV1 => {
          const produced = actual.classifyStaticRationalTriangleOverlap(supplied);
          if (!produced.ok) return produced;
          return {
            ok: true as const,
            value: Object.freeze({
              ...produced.value,
              classification: fixture.forgedClassification,
              closedTrianglesIntersect: fixture.forgedIntersection,
            }),
          };
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/static-rational-triangle-overlap-census.js');
      const result = isolated.computeStaticRationalTriangleOverlapCensusV1({
        triangles: [entry('A', BASE), entry('B', fixture.other)],
      });
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('incidence-impossible success must reject the census');
      expect(result.error).toEqual([
        expect.objectContaining({
          path: '$.pairs[A,B]',
          code: 'classifier-failure-invariant',
        }),
      ]);
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/static-rational-triangle-overlap.js');
      vi.resetModules();
    }
  });

  it('atomically fails if the trusted pair classifier violates its success invariant', async () => {
    vi.resetModules();
    let classifierCalls = 0;
    vi.doMock('../../m0f/geometry/static-rational-triangle-overlap.js', async (importOriginal) => {
      const actual = await importOriginal<
        Record<string, unknown> &
          Readonly<{
            classifyStaticRationalTriangleOverlap: (
              supplied: unknown,
            ) => StaticRationalTriangleOverlapResultV1;
          }>
      >();
      return {
        ...actual,
        classifyStaticRationalTriangleOverlap: (supplied: unknown) => {
          classifierCalls += 1;
          return classifierCalls === 2
            ? { ok: false as const, error: Object.freeze([]) }
            : actual.classifyStaticRationalTriangleOverlap(supplied);
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/static-rational-triangle-overlap-census.js');
      const result = isolated.computeStaticRationalTriangleOverlapCensusV1({
        triangles: [entry('A', BASE), entry('B', FAR), entry('C', TRANSVERSE)],
      });
      expect(result.ok).toBe(false);
      expect(classifierCalls).toBe(2);
      if (result.ok) throw new TypeError('classifier failure must reject the census');
      expect(result.error).toEqual([
        expect.objectContaining({
          path: '$.pairs[A,C]',
          code: 'classifier-failure-invariant',
        }),
      ]);
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/static-rational-triangle-overlap.js');
      vi.resetModules();
    }
  });
});
