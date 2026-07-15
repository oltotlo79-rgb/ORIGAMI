import { describe, expect, it } from 'vitest';

import {
  constructStaticRationalTriangleIntersectionLocusV1,
  parseStaticRationalTriangleIntersectionLocusInputV1,
  STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS,
  type StaticRationalTriangleIntersectionLocusRecordV1,
} from '../../m0f/geometry/static-rational-triangle-intersection-locus.js';
import {
  classifyStaticRationalTriangleOverlap,
  type StaticRationalTriangle3,
} from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  canonicalProjectivePoint3,
  compareProjectivePoints3,
  projectiveAxisDropOrient2DSign,
  projectivePlaneThrough3,
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

function input(triangleA: StaticRationalTriangle3, triangleB: StaticRationalTriangle3) {
  return { triangleA, triangleB };
}

function record(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
): StaticRationalTriangleIntersectionLocusRecordV1 {
  const result = constructStaticRationalTriangleIntersectionLocusV1(input(triangleA, triangleB));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('fixture must construct a locus');
  return result.value;
}

function coordinates(pointValue: ProjectivePoint3): readonly [bigint, bigint, bigint, bigint] {
  return [pointValue.x, pointValue.y, pointValue.z, pointValue.w];
}

function canonicalCoordinates(
  points: readonly ProjectivePoint3[],
): readonly (readonly [bigint, bigint, bigint, bigint])[] {
  return points.map(coordinates);
}

const BASE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
const ELEVATED = triangle(point(0, 0, 1), point(4, 0, 1), point(0, 4, 1));
const TRANSVERSE = triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0));
const VERTEX_FACE_TOUCH = triangle(point(1, 1, 0), point(2, 1, 1), point(1, 2, 1));
const DISTINCT_PLANE_SHARED_EDGE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 0, 1));
const DISTINCT_PLANE_SHARED_VERTEX = triangle(point(0, 0, 0), point(-1, 0, 1), point(0, -1, 1));
const COPLANAR_POINT_TOUCH = triangle(point(4, 0, 0), point(5, 0, 0), point(4, 1, 0));
const COPLANAR_PARTIAL_EDGE = triangle(point(1, 0, 0), point(3, 0, 0), point(2, -1, 0));
const CONTAINED = triangle(point(1, 1, 0), point(2, 1, 0), point(1, 2, 0));
const NON_UNIT_TOUCH = triangle(
  rationalPoint(6n, 2n, -1n, 2n),
  rationalPoint(9n, 3n, 1n, 3n),
  point(3, 2, 1),
);

const FOUR_VERTEX_OTHER = triangle(point(-3, 1, 0), point(3, 1, 0), point(0, -3, 0));
const FIVE_VERTEX_A = triangle(point(-6, -5, 0), point(6, 6, 0), point(3, -1, 0));
const FIVE_VERTEX_B = triangle(point(-6, -1, 0), point(4, 4, 0), point(0, -5, 0));
const SIX_VERTEX_A = triangle(point(-3, -1, 0), point(3, -1, 0), point(0, 3, 0));
const SIX_VERTEX_B = triangle(point(-3, 1, 0), point(3, 1, 0), point(0, -3, 0));

const PERMUTATIONS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

function permute(
  value: StaticRationalTriangle3,
  order: (typeof PERMUTATIONS)[number],
): StaticRationalTriangle3 {
  return [value[order[0]], value[order[1]], value[order[2]]];
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function pointIsCanonical(pointValue: ProjectivePoint3): boolean {
  const divisor = greatestCommonDivisor(
    greatestCommonDivisor(pointValue.x, pointValue.y),
    greatestCommonDivisor(pointValue.z, pointValue.w),
  );
  return pointValue.w > 0n && divisor === 1n;
}

describe('static exact-rational triangle intersection-locus candidate', () => {
  it('distinguishes both empty supporting-plane cases without returning vertices', () => {
    const parallel = record(BASE, ELEVATED);
    expect(parallel).toMatchObject({
      supportingPlaneRelation: 'parallel-distinct',
      canonicalProjectionDropAxis: null,
      locusKind: 'empty',
      vertices: [],
      derivedStaticClassification: 'disjoint',
      closedTrianglesIntersect: false,
    });

    const nearOrigin = triangle(point(-1, -1, 0), point(-1, 1, 0), point(1, 0, 0));
    const farAlongPlaneLine = triangle(point(10, 0, -1), point(10, 0, 1), point(12, 0, 0));
    const separatedIntervals = record(nearOrigin, farAlongPlaneLine);
    expect(separatedIntervals).toMatchObject({
      supportingPlaneRelation: 'intersecting-planes',
      canonicalProjectionDropAxis: null,
      locusKind: 'empty',
      vertices: [],
      derivedStaticClassification: 'disjoint',
    });
  });

  it('constructs exact noncoplanar point and segment loci', () => {
    const segment = record(BASE, TRANSVERSE);
    expect(segment).toMatchObject({
      supportingPlaneRelation: 'intersecting-planes',
      locusKind: 'segment',
      derivedStaticClassification: 'intersecting-noncoplanar',
    });
    expect(canonicalCoordinates(segment.vertices)).toEqual([
      [1n, 1n, 0n, 1n],
      [3n, 1n, 0n, 1n],
    ]);

    const pointTouch = record(BASE, VERTEX_FACE_TOUCH);
    expect(pointTouch.locusKind).toBe('point');
    expect(canonicalCoordinates(pointTouch.vertices)).toEqual([[1n, 1n, 0n, 1n]]);
  });

  it('retains raw shared vertices and edges in distinct planes', () => {
    const sharedVertex = record(BASE, DISTINCT_PLANE_SHARED_VERTEX);
    expect(sharedVertex).toMatchObject({
      supportingPlaneRelation: 'intersecting-planes',
      locusKind: 'point',
    });
    expect(canonicalCoordinates(sharedVertex.vertices)).toEqual([[0n, 0n, 0n, 1n]]);

    const sharedEdge = record(BASE, DISTINCT_PLANE_SHARED_EDGE);
    expect(sharedEdge.locusKind).toBe('segment');
    expect(canonicalCoordinates(sharedEdge.vertices)).toEqual([
      [0n, 0n, 0n, 1n],
      [4n, 0n, 0n, 1n],
    ]);
    expect(sharedEdge.declaredHingePolicyIncluded).toBe(false);
    expect(sharedEdge.legalContactClassificationIncluded).toBe(false);
  });

  it('normalizes coplanar point and partial-edge loci', () => {
    const pointTouch = record(BASE, COPLANAR_POINT_TOUCH);
    expect(pointTouch).toMatchObject({
      supportingPlaneRelation: 'coplanar',
      canonicalProjectionDropAxis: 'z',
      locusKind: 'point',
      derivedStaticClassification: 'intersecting-coplanar',
    });
    expect(canonicalCoordinates(pointTouch.vertices)).toEqual([[4n, 0n, 0n, 1n]]);

    const partialEdge = record(BASE, COPLANAR_PARTIAL_EDGE);
    expect(partialEdge.locusKind).toBe('segment');
    expect(canonicalCoordinates(partialEdge.vertices)).toEqual([
      [1n, 0n, 0n, 1n],
      [3n, 0n, 0n, 1n],
    ]);
  });

  it('returns the contained and coincident canonical triangles', () => {
    const contained = record(BASE, CONTAINED);
    expect(contained.locusKind).toBe('coplanar-polygon');
    expect(canonicalCoordinates(contained.vertices)).toEqual(canonicalCoordinates(CONTAINED));

    const coincident = record(BASE, triangle(BASE[2], BASE[0], BASE[1]));
    expect(coincident.locusKind).toBe('coplanar-polygon');
    expect(canonicalCoordinates(coincident.vertices)).toEqual(canonicalCoordinates(BASE));
  });

  it.each([
    { name: 'three', triangleA: BASE, triangleB: CONTAINED, count: 3 },
    { name: 'four', triangleA: BASE, triangleB: FOUR_VERTEX_OTHER, count: 4 },
    { name: 'five', triangleA: FIVE_VERTEX_A, triangleB: FIVE_VERTEX_B, count: 5 },
    { name: 'six', triangleA: SIX_VERTEX_A, triangleB: SIX_VERTEX_B, count: 6 },
  ] as const)(
    'constructs a canonical $name-vertex coplanar polygon',
    ({ triangleA, triangleB, count }) => {
      const result = record(triangleA, triangleB);
      expect(result).toMatchObject({
        supportingPlaneRelation: 'coplanar',
        canonicalProjectionDropAxis: 'z',
        locusKind: 'coplanar-polygon',
        derivedStaticClassification: 'intersecting-coplanar',
        closedTrianglesIntersect: true,
      });
      expect(result.vertices).toHaveLength(count);
      expect(result.vertices.every(pointIsCanonical)).toBe(true);
      expect(new Set(result.vertices.map((value) => coordinates(value).join('/'))).size).toBe(
        count,
      );
      for (let index = 0; index < result.vertices.length; index += 1) {
        const first = result.vertices[index];
        const second = result.vertices[(index + 1) % result.vertices.length];
        const third = result.vertices[(index + 2) % result.vertices.length];
        if (first === undefined || second === undefined || third === undefined) {
          throw new TypeError('polygon fixture is unexpectedly sparse');
        }
        expect(projectiveAxisDropOrient2DSign(first, second, third, 'z')).toBe(1);
      }
      for (const later of result.vertices.slice(1)) {
        const first = result.vertices[0];
        if (first === undefined) throw new TypeError('polygon fixture is unexpectedly empty');
        expect(compareProjectivePoints3(first, later)).toBe(-1);
      }
    },
  );

  it('uses the dominant x and y projection axes for tilted coplanar planes', () => {
    const dominantX = triangle(point(0, 0, 0), point(4, -8, 0), point(0, 0, 4));
    const insideX = triangle(point(1, -2, 0), point(2, -4, 0), point(1, -2, 1));
    expect(record(dominantX, insideX)).toMatchObject({
      supportingPlaneRelation: 'coplanar',
      canonicalProjectionDropAxis: 'x',
      locusKind: 'coplanar-polygon',
    });

    const dominantY = triangle(point(0, 0, 0), point(12, -4, 0), point(0, -4, 12));
    const insideY = triangle(point(3, -1, 0), point(6, -2, 0), point(3, -2, 3));
    expect(record(dominantY, insideY)).toMatchObject({
      supportingPlaneRelation: 'coplanar',
      canonicalProjectionDropAxis: 'y',
      locusKind: 'coplanar-polygon',
    });
  });

  it('constructs a non-unit-weight exact boundary point', () => {
    const result = record(BASE, NON_UNIT_TOUCH);
    expect(result).toMatchObject({
      supportingPlaneRelation: 'intersecting-planes',
      locusKind: 'point',
    });
    expect(canonicalCoordinates(result.vertices)).toEqual([[3n, 1n, 0n, 1n]]);
  });

  it('is byte-structurally invariant under every permutation and A/B swap', () => {
    const fixturePairs = [
      [BASE, ELEVATED],
      [BASE, VERTEX_FACE_TOUCH],
      [BASE, TRANSVERSE],
      [BASE, NON_UNIT_TOUCH],
      [BASE, CONTAINED],
      [FIVE_VERTEX_A, FIVE_VERTEX_B],
      [SIX_VERTEX_A, SIX_VERTEX_B],
    ] as const;

    for (const [triangleA, triangleB] of fixturePairs) {
      const expected = record(triangleA, triangleB);
      for (const orderA of PERMUTATIONS) {
        for (const orderB of PERMUTATIONS) {
          const permutedA = permute(triangleA, orderA);
          const permutedB = permute(triangleB, orderB);
          expect(record(permutedA, permutedB)).toEqual(expected);
          expect(record(permutedB, permutedA)).toEqual(expected);
        }
      }
    }
  });

  it('reuses the closed hostile-input parser without invoking accessors', () => {
    let calls = 0;
    const hostile: Record<string, unknown> = { triangleB: BASE };
    Object.defineProperty(hostile, 'triangleA', {
      enumerable: true,
      get() {
        calls += 1;
        return BASE;
      },
    });
    const accessor = constructStaticRationalTriangleIntersectionLocusV1(hostile);
    expect(accessor.ok).toBe(false);
    expect(calls).toBe(0);
    if (accessor.ok) throw new TypeError('accessor input must fail');
    expect(accessor.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA', code: 'accessor-property' }),
    );
    expect('value' in accessor).toBe(false);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() => constructStaticRationalTriangleIntersectionLocusV1(revoked.proxy)).not.toThrow();
    const revokedResult = constructStaticRationalTriangleIntersectionLocusV1(revoked.proxy);
    expect(revokedResult.ok).toBe(false);
    if (revokedResult.ok) throw new TypeError('revoked input must fail');
    expect(revokedResult.error).toContainEqual(
      expect.objectContaining({ path: '$', code: 'inspection-failed' }),
    );
  });

  it('publishes resource ceilings and fails input-budget exhaustion without a shape', () => {
    expect(STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS).toMatchObject({
      maxInputCoordinateBits: 16_384,
      maxOutputCoordinateBits: 131_072,
      maxIntermediateArithmeticBits: 524_288,
      maxExactOperations: 4_096,
      maxOutputVertices: 6,
      maxIssues: 32,
    });
    expect(Object.isFrozen(STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS)).toBe(true);

    const oversized =
      1n << BigInt(STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxInputCoordinateBits);
    const result = constructStaticRationalTriangleIntersectionLocusV1({
      triangleA: [{ x: oversized, y: 0n, z: 0n, w: 1n }, BASE[1], BASE[2]],
      triangleB: BASE,
    });
    expect(result.ok).toBe(false);
    expect('value' in result).toBe(false);
    if (result.ok) throw new TypeError('over-budget input must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'coordinate-limit-exceeded' }),
    );
  });

  it('returns deeply frozen successes, parser output, and atomic failures', () => {
    const parsed = parseStaticRationalTriangleIntersectionLocusInputV1(input(BASE, TRANSVERSE));
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('valid fixture must parse');
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangleA)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangleA[0])).toBe(true);

    const success = constructStaticRationalTriangleIntersectionLocusV1(input(BASE, TRANSVERSE));
    expect(success.ok).toBe(true);
    expect(Object.isFrozen(success)).toBe(true);
    if (!success.ok) throw new TypeError('valid fixture must construct');
    expect(Object.isFrozen(success.value)).toBe(true);
    expect(Object.isFrozen(success.value.vertices)).toBe(true);
    expect(success.value.vertices.every(Object.isFrozen)).toBe(true);

    const failure = constructStaticRationalTriangleIntersectionLocusV1(undefined);
    expect(failure.ok).toBe(false);
    expect(Object.isFrozen(failure)).toBe(true);
    if (failure.ok) throw new TypeError('invalid fixture must fail');
    expect(Object.isFrozen(failure.error)).toBe(true);
    expect(failure.error.every(Object.isFrozen)).toBe(true);
    expect('value' in failure).toBe(false);
  });

  it('keeps every policy, audit, motion, verification, scientific, and GO claim false', () => {
    expect(record(BASE, TRANSVERSE)).toMatchObject({
      contractStatus: 'candidate-no-claim',
      rawGeometricLocusIncluded: true,
      staticPredicateIncluded: true,
      meshIdentityBindingIncluded: false,
      sourceEvidenceBindingIncluded: false,
      declaredHingePolicyIncluded: false,
      legalContactClassificationIncluded: false,
      penetrationClassificationIncluded: false,
      selfIntersectionClassificationIncluded: false,
      independentAuditIncluded: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      rigidMotionIntervalIncluded: false,
      collisionFreeClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });

  it('agrees with the existing static classifier on a deterministic regression corpus', () => {
    const next = makeGenerator(0x10c05eed);
    const classifications = new Set<string>();
    for (let caseIndex = 0; caseIndex < 300; caseIndex += 1) {
      const coplanar = caseIndex % 3 === 0;
      const triangleA = generatedTriangle(next, coplanar);
      const triangleB = generatedTriangle(next, coplanar);
      const locus = constructStaticRationalTriangleIntersectionLocusV1({ triangleA, triangleB });
      const overlap = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
      expect(locus.ok, `locus regression case ${caseIndex}`).toBe(true);
      expect(overlap.ok, `overlap regression case ${caseIndex}`).toBe(true);
      if (!locus.ok || !overlap.ok) throw new TypeError('generated fixture must be accepted');
      classifications.add(locus.value.derivedStaticClassification);
      expect(
        locus.value.derivedStaticClassification,
        `non-independent classifier regression case ${caseIndex}`,
      ).toBe(overlap.value.classification);
      expect(locus.value.closedTrianglesIntersect).toBe(overlap.value.closedTrianglesIntersect);
    }
    expect(classifications).toContain('disjoint');
    expect(classifications).toContain('intersecting-coplanar');
    expect(classifications).toContain('intersecting-noncoplanar');
  });

  it('agrees on a deterministic non-unit-weight rational corpus with permutation samples', () => {
    const next = makeGenerator(0xa11ce5);
    let sawNonUnitWeight = false;
    for (let caseIndex = 0; caseIndex < 120; caseIndex += 1) {
      const coplanar = caseIndex % 2 === 0;
      const triangleA = generatedRationalTriangle(next, coplanar);
      const triangleB = generatedRationalTriangle(next, coplanar);
      sawNonUnitWeight ||= [...triangleA, ...triangleB].some((value) => value.w !== 1n);
      const locus = constructStaticRationalTriangleIntersectionLocusV1({ triangleA, triangleB });
      const overlap = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
      expect(locus.ok, `rational locus case ${caseIndex}`).toBe(true);
      expect(overlap.ok, `rational overlap case ${caseIndex}`).toBe(true);
      if (!locus.ok || !overlap.ok) throw new TypeError('rational fixture must be accepted');
      expect(locus.value.derivedStaticClassification).toBe(overlap.value.classification);
      expect(locus.value.closedTrianglesIntersect).toBe(overlap.value.closedTrianglesIntersect);

      if (caseIndex < 8) {
        for (const orderA of PERMUTATIONS) {
          for (const orderB of PERMUTATIONS) {
            const permutedA = permute(triangleA, orderA);
            const permutedB = permute(triangleB, orderB);
            expect(record(permutedA, permutedB)).toEqual(locus.value);
            expect(record(permutedB, permutedA)).toEqual(locus.value);
          }
        }
      }
    }
    expect(sawNonUnitWeight).toBe(true);
  });
});

type Generator = () => number;

function makeGenerator(seed: number): Generator {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
}

function generatedCoordinate(next: Generator): number {
  return (next() % 13) - 6;
}

function generatedTriangle(next: Generator, coplanar: boolean): StaticRationalTriangle3 {
  for (;;) {
    const coordinates = Array.from(
      { length: 3 },
      () =>
        [
          generatedCoordinate(next),
          generatedCoordinate(next),
          coplanar ? 0 : generatedCoordinate(next),
        ] as const,
    );
    const [first, second, third] = coordinates;
    if (first === undefined || second === undefined || third === undefined) {
      throw new TypeError('generator produced a sparse triangle');
    }
    const firstToSecond = [
      second[0] - first[0],
      second[1] - first[1],
      second[2] - first[2],
    ] as const;
    const firstToThird = [third[0] - first[0], third[1] - first[1], third[2] - first[2]] as const;
    const normal = [
      firstToSecond[1] * firstToThird[2] - firstToSecond[2] * firstToThird[1],
      firstToSecond[2] * firstToThird[0] - firstToSecond[0] * firstToThird[2],
      firstToSecond[0] * firstToThird[1] - firstToSecond[1] * firstToThird[0],
    ] as const;
    if (normal[0] === 0 && normal[1] === 0 && normal[2] === 0) continue;
    return triangle(
      point(first[0], first[1], first[2]),
      point(second[0], second[1], second[2]),
      point(third[0], third[1], third[2]),
    );
  }
}

function generatedRationalTriangle(next: Generator, coplanar: boolean): StaticRationalTriangle3 {
  for (;;) {
    const generated = Array.from({ length: 3 }, () =>
      canonicalProjectivePoint3(
        BigInt(generatedCoordinate(next)),
        BigInt(generatedCoordinate(next)),
        coplanar ? 0n : BigInt(generatedCoordinate(next)),
        BigInt((next() % 7) + 1),
      ),
    );
    const first = generated[0];
    const second = generated[1];
    const third = generated[2];
    if (first === undefined || second === undefined || third === undefined) {
      throw new TypeError('rational generator produced a sparse triangle');
    }
    try {
      projectivePlaneThrough3(first, second, third);
      return triangle(first, second, third);
    } catch (caught) {
      if (!(caught instanceof RangeError)) throw caught;
    }
  }
}
