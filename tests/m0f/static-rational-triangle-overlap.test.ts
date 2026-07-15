import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  classifyStaticRationalTriangleOverlap,
  parseStaticRationalTriangleOverlapInputV1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS,
  type StaticRationalTriangle3,
  type StaticRationalTriangleOverlapClassification,
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

function input(triangleA: StaticRationalTriangle3, triangleB: StaticRationalTriangle3) {
  return { triangleA, triangleB };
}

function classification(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
): StaticRationalTriangleOverlapClassification {
  const result = classifyStaticRationalTriangleOverlap(input(triangleA, triangleB));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('fixture input must be valid');
  return result.value.classification;
}

const BASE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));

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

describe('exact static closed-triangle overlap predicate', () => {
  it('rejects triangles in separated parallel planes', () => {
    const elevated = triangle(point(0, 0, 1), point(4, 0, 1), point(0, 4, 1));
    expect(classification(BASE, elevated)).toBe('disjoint');
  });

  it('rejects separated line intervals even when both triangles straddle the other plane', () => {
    const nearOrigin = triangle(point(-1, -1, 0), point(-1, 1, 0), point(1, 0, 0));
    const farAlongPlaneLine = triangle(point(10, 0, -1), point(10, 0, 1), point(12, 0, 0));
    expect(classification(nearOrigin, farAlongPlaneLine)).toBe('disjoint');
  });

  it('finds a transverse interior crossing', () => {
    const transverse = triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0));
    expect(classification(BASE, transverse)).toBe('intersecting-noncoplanar');
  });

  it('includes a vertex-to-face point touch in noncoplanar intersection', () => {
    const vertexTouch = triangle(point(1, 1, 0), point(2, 1, 1), point(1, 2, 1));
    expect(classification(BASE, vertexTouch)).toBe('intersecting-noncoplanar');
  });

  it('includes noncoplanar edge, edge-point, and shared-vertex boundary contacts', () => {
    const sharedEdge = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 0, 1));
    const edgePoint = triangle(point(2, -1, -1), point(2, 0, 0), point(2, -1, 1));
    const sharedVertex = triangle(point(0, 0, 0), point(-1, 0, 1), point(0, -1, 1));

    expect(classification(BASE, sharedEdge)).toBe('intersecting-noncoplanar');
    expect(classification(BASE, edgePoint)).toBe('intersecting-noncoplanar');
    expect(classification(BASE, sharedVertex)).toBe('intersecting-noncoplanar');
  });

  it.each([
    {
      name: 'disjoint',
      other: triangle(point(5, 5, 0), point(6, 5, 0), point(5, 6, 0)),
      expected: 'disjoint',
    },
    {
      name: 'point touch',
      other: triangle(point(4, 0, 0), point(5, 0, 0), point(4, 1, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'edge overlap',
      other: triangle(point(0, 0, 0), point(4, 0, 0), point(2, -2, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'positive-area overlap',
      other: triangle(point(1, 0, 0), point(5, 0, 0), point(1, 4, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'strict containment',
      other: triangle(point(1, 1, 0), point(2, 1, 0), point(1, 2, 0)),
      expected: 'intersecting-coplanar',
    },
    {
      name: 'identical',
      other: triangle(point(0, 4, 0), point(0, 0, 0), point(4, 0, 0)),
      expected: 'intersecting-coplanar',
    },
  ] as const)(
    'classifies coplanar $name triangles with closed boundaries',
    ({ other, expected }) => {
      expect(classification(BASE, other)).toBe(expected);
    },
  );

  it('projects tilted coplanar triangles through dominant x and y normal axes', () => {
    const dominantX = triangle(point(0, 0, 0), point(4, -8, 0), point(0, 0, 4));
    const dominantXOverlap = triangle(point(1, -2, 0), point(5, -10, 0), point(1, -2, 4));
    const dominantXDisjoint = triangle(point(5, -10, 5), point(6, -12, 5), point(5, -10, 6));
    expect(classification(dominantX, dominantXOverlap)).toBe('intersecting-coplanar');
    expect(classification(dominantX, dominantXDisjoint)).toBe('disjoint');

    const dominantY = triangle(point(0, 0, 0), point(12, -4, 0), point(0, -4, 12));
    const dominantYOverlap = triangle(point(3, -1, 0), point(15, -5, 0), point(3, -5, 12));
    const dominantYDisjoint = triangle(point(15, -10, 15), point(18, -11, 15), point(15, -11, 18));
    expect(classification(dominantY, dominantYOverlap)).toBe('intersecting-coplanar');
    expect(classification(dominantY, dominantYDisjoint)).toBe('disjoint');
  });

  it('constructs non-unit-weight edge-plane intersections exactly on and outside a boundary', () => {
    const boundaryTouch = triangle(
      rationalPoint(6n, 2n, -1n, 2n),
      rationalPoint(9n, 3n, 1n, 3n),
      point(3, 2, 1),
    );
    const outside = triangle(
      rationalPoint(6n, 4n, -1n, 2n),
      rationalPoint(9n, 6n, 1n, 3n),
      point(3, 3, 1),
    );
    expect(classification(BASE, boundaryTouch)).toBe('intersecting-noncoplanar');
    expect(classification(BASE, outside)).toBe('disjoint');
  });

  it('is invariant under every vertex permutation, including winding reversal', () => {
    const transverse = triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0));
    const coplanar = triangle(point(1, 0, 0), point(5, 0, 0), point(1, 4, 0));
    for (const leftOrder of PERMUTATIONS) {
      for (const rightOrder of PERMUTATIONS) {
        expect(classification(permute(BASE, leftOrder), permute(transverse, rightOrder))).toBe(
          'intersecting-noncoplanar',
        );
        expect(classification(permute(BASE, leftOrder), permute(coplanar, rightOrder))).toBe(
          'intersecting-coplanar',
        );
      }
    }
  });

  it('is symmetric when the triangle inputs are swapped', () => {
    const fixtures: readonly StaticRationalTriangle3[] = [
      triangle(point(0, 0, 1), point(4, 0, 1), point(0, 4, 1)),
      triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0)),
      triangle(point(4, 0, 0), point(5, 0, 0), point(4, 1, 0)),
      triangle(point(5, 5, 0), point(6, 5, 0), point(5, 6, 0)),
    ];
    for (const other of fixtures) {
      expect(classification(BASE, other)).toBe(classification(other, BASE));
    }
  });

  it('keeps enormous and near-coplanar rational configurations exact', () => {
    const huge = 1n << 4_000n;
    const hugeBase = triangle(point(0n, 0n, 0n), point(huge, 0n, 0n), point(0n, huge, 0n));
    const hugeCrossing = triangle(
      point(1n, 1n, -huge),
      point(1n, 1n, huge),
      point(huge - 1n, 1n, 0n),
    );
    expect(classification(hugeBase, hugeCrossing)).toBe('intersecting-noncoplanar');

    const denominator = 1n << 4_096n;
    const almostCoplanar = triangle(
      rationalPoint(0n, 0n, 1n, denominator),
      rationalPoint(4n * denominator, 0n, 1n, denominator),
      rationalPoint(0n, 4n * denominator, 1n, denominator),
    );
    expect(classification(BASE, almostCoplanar)).toBe('disjoint');
  });

  it.each([
    { degenerate: triangle(point(0, 0, 0), point(1, 1, 1), point(2, 2, 2)) },
    { degenerate: triangle(point(0, 0, 0), point(0, 0, 0), point(1, 0, 0)) },
  ])('fails closed for a degenerate or duplicate-vertex triangle', ({ degenerate }) => {
    const result = classifyStaticRationalTriangleOverlap(input(degenerate, BASE));
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('degenerate fixture must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA', code: 'degenerate-triangle' }),
    );
  });

  it('rejects accessors without invoking them', () => {
    let calls = 0;
    const hostileRoot: Record<string, unknown> = { triangleB: BASE };
    Object.defineProperty(hostileRoot, 'triangleA', {
      enumerable: true,
      get() {
        calls += 1;
        return BASE;
      },
    });
    const rootResult = classifyStaticRationalTriangleOverlap(hostileRoot);
    expect(rootResult.ok).toBe(false);
    expect(calls).toBe(0);
    if (rootResult.ok) throw new TypeError('accessor root must fail');
    expect(rootResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA', code: 'accessor-property' }),
    );

    const hostileTriangle = [...BASE];
    Object.defineProperty(hostileTriangle, '1', {
      enumerable: true,
      configurable: true,
      get() {
        calls += 1;
        return BASE[1];
      },
    });
    const triangleResult = classifyStaticRationalTriangleOverlap(
      input(hostileTriangle as unknown as StaticRationalTriangle3, BASE),
    );
    expect(triangleResult.ok).toBe(false);
    expect(calls).toBe(0);
  });

  it('turns revoked proxies into ordinary fail-closed results', () => {
    const revokedRoot = Proxy.revocable({}, {});
    revokedRoot.revoke();
    expect(() => classifyStaticRationalTriangleOverlap(revokedRoot.proxy)).not.toThrow();
    const rootResult = classifyStaticRationalTriangleOverlap(revokedRoot.proxy);
    expect(rootResult.ok).toBe(false);
    if (rootResult.ok) throw new TypeError('revoked root must fail');
    expect(rootResult.error).toContainEqual(
      expect.objectContaining({ path: '$', code: 'inspection-failed' }),
    );

    const revokedTriangle = Proxy.revocable([...BASE], {});
    revokedTriangle.revoke();
    expect(() =>
      classifyStaticRationalTriangleOverlap({
        triangleA: revokedTriangle.proxy,
        triangleB: BASE,
      }),
    ).not.toThrow();
    const triangleResult = classifyStaticRationalTriangleOverlap({
      triangleA: revokedTriangle.proxy,
      triangleB: BASE,
    });
    expect(triangleResult.ok).toBe(false);
    if (triangleResult.ok) throw new TypeError('revoked triangle must fail');
    expect(triangleResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA', code: 'inspection-failed' }),
    );
  });

  it('caps descriptor work before inspecting hostile extra-key sets', () => {
    const keys = Array.from(
      { length: STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxOwnPropertiesPerContainer + 1 },
      (_, index) => `hostile-${index}`,
    );
    let rootDescriptorCalls = 0;
    const hostileRoot = new Proxy(
      {},
      {
        ownKeys: () => keys,
        getOwnPropertyDescriptor: () => {
          rootDescriptorCalls += 1;
          return { configurable: true, enumerable: true, value: null };
        },
      },
    );
    const rootResult = classifyStaticRationalTriangleOverlap(hostileRoot);
    expect(rootResult.ok).toBe(false);
    expect(rootDescriptorCalls).toBe(0);
    if (rootResult.ok) throw new TypeError('hostile root must fail');
    expect(rootResult.error).toContainEqual(
      expect.objectContaining({ path: '$', code: 'property-limit-exceeded' }),
    );

    let triangleDescriptorCalls = 0;
    const hostileTriangle = new Proxy([...BASE], {
      ownKeys: () => ['0', '1', '2', 'length', ...keys],
      getOwnPropertyDescriptor: (target, key) => {
        triangleDescriptorCalls += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });
    const triangleResult = classifyStaticRationalTriangleOverlap({
      triangleA: hostileTriangle,
      triangleB: BASE,
    });
    expect(triangleResult.ok).toBe(false);
    expect(triangleDescriptorCalls).toBe(0);
    if (triangleResult.ok) throw new TypeError('hostile triangle must fail');
    expect(triangleResult.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA', code: 'property-limit-exceeded' }),
    );
  });

  it('caps accumulated diagnostics while continuing to fail closed', () => {
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
    const result = classifyStaticRationalTriangleOverlap({
      triangleA: malformedTriangle,
      triangleB: malformedTriangle,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new TypeError('malformed input must fail');
    expect(result.error).toHaveLength(STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxIssues);
    expect(result.error.every((entry) => Object.isFrozen(entry))).toBe(true);
  });

  it('rejects unknown, malformed, noncanonical, and over-budget input', () => {
    const unknownRoot = classifyStaticRationalTriangleOverlap({
      ...input(BASE, BASE),
      surprise: true,
    });
    expect(unknownRoot.ok).toBe(false);
    if (unknownRoot.ok) throw new TypeError('unknown property must fail');
    expect(unknownRoot.error).toContainEqual(
      expect.objectContaining({ path: '$.surprise', code: 'unknown-property' }),
    );

    const extraPoint = classifyStaticRationalTriangleOverlap({
      triangleA: [{ ...BASE[0], surprise: true }, BASE[1], BASE[2]],
      triangleB: BASE,
    });
    expect(extraPoint.ok).toBe(false);
    if (extraPoint.ok) throw new TypeError('unknown point property must fail');
    expect(extraPoint.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA[0].surprise', code: 'unknown-property' }),
    );

    const extraTriangle = [...BASE] as unknown[] & { surprise?: boolean };
    extraTriangle.surprise = true;
    const triangleUnknown = classifyStaticRationalTriangleOverlap({
      triangleA: extraTriangle,
      triangleB: BASE,
    });
    expect(triangleUnknown.ok).toBe(false);
    if (triangleUnknown.ok) throw new TypeError('unknown triangle property must fail');
    expect(triangleUnknown.error).toContainEqual(
      expect.objectContaining({ path: '$.triangleA.surprise', code: 'unknown-property' }),
    );

    const primitive = classifyStaticRationalTriangleOverlap(null);
    expect(primitive.ok).toBe(false);

    const noncanonicalPoint = { x: 2n, y: 0n, z: 0n, w: 2n };
    const noncanonical = classifyStaticRationalTriangleOverlap({
      triangleA: [noncanonicalPoint, BASE[1], BASE[2]],
      triangleB: BASE,
    });
    expect(noncanonical.ok).toBe(false);
    if (noncanonical.ok) throw new TypeError('noncanonical point must fail');
    expect(noncanonical.error).toContainEqual(
      expect.objectContaining({ code: 'noncanonical-point' }),
    );

    const negativeWeight = classifyStaticRationalTriangleOverlap({
      triangleA: [{ x: 0n, y: 0n, z: 0n, w: -1n }, BASE[1], BASE[2]],
      triangleB: BASE,
    });
    expect(negativeWeight.ok).toBe(false);
    if (negativeWeight.ok) throw new TypeError('negative weight must fail');
    expect(negativeWeight.error).toContainEqual(
      expect.objectContaining({ code: 'nonpositive-weight' }),
    );

    const oversized = 1n << BigInt(STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxCoordinateBits);
    const overBudget = classifyStaticRationalTriangleOverlap({
      triangleA: [{ x: oversized, y: 0n, z: 0n, w: 1n }, BASE[1], BASE[2]],
      triangleB: BASE,
    });
    expect(overBudget.ok).toBe(false);
    if (overBudget.ok) throw new TypeError('oversized coordinate must fail');
    expect(overBudget.error).toContainEqual(
      expect.objectContaining({ code: 'coordinate-limit-exceeded' }),
    );
  });

  it('bounds and deterministically orders hostile symbol names in diagnostic paths', () => {
    const alpha = Symbol('a'.repeat(100_000));
    const zeta = Symbol('z'.repeat(100_000));
    const pathsFor = (symbols: readonly symbol[]) => {
      const supplied: Record<PropertyKey, unknown> = { ...input(BASE, BASE) };
      for (const symbol of symbols) supplied[symbol] = true;
      const result = classifyStaticRationalTriangleOverlap(supplied);
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('unknown symbol properties must fail');
      return result.error
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
        STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxDiagnosticPathSegmentCodeUnits + 2,
      );
      expect(path.endsWith('…')).toBe(true);
    }
  });

  it('returns deeply frozen successful parses, records, and errors', () => {
    const parsed = parseStaticRationalTriangleOverlapInputV1(input(BASE, BASE));
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('valid fixture must parse');
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangleA)).toBe(true);
    expect(Object.isFrozen(parsed.value.triangleA[0])).toBe(true);

    const success = classifyStaticRationalTriangleOverlap(input(BASE, BASE));
    expect(success.ok).toBe(true);
    expect(Object.isFrozen(success)).toBe(true);
    if (!success.ok) throw new TypeError('valid fixture must classify');
    expect(Object.isFrozen(success.value)).toBe(true);

    const invalid = classifyStaticRationalTriangleOverlap(undefined);
    expect(invalid.ok).toBe(false);
    expect(Object.isFrozen(invalid)).toBe(true);
    if (invalid.ok) throw new TypeError('invalid fixture must fail');
    expect(Object.isFrozen(invalid.error)).toBe(true);
    expect(Object.isFrozen(invalid.error[0])).toBe(true);
  });

  it('marks every continuous, contact-policy, verification, and GO claim false', () => {
    const result = classifyStaticRationalTriangleOverlap(input(BASE, BASE));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('valid fixture must classify');
    expect(result.value).toMatchObject({
      contractStatus: 'candidate-no-claim',
      staticPredicateIncluded: true,
      legalContactClassificationIncluded: false,
      penetrationClassificationIncluded: false,
      collisionFreeClaim: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      rigidMotionIntervalIncluded: false,
      verifiedClaim: false,
      globalM0fGo: false,
    });
  });

  it('documents why this predicate is not rigid-motion CCD', async () => {
    const source = await readFile(
      resolve('m0f/geometry/static-rational-triangle-overlap.ts'),
      'utf8',
    );
    expect(source).toMatch(/Brochu-style CCD assumes linear vertex trajectories/u);
    expect(source).toMatch(/cannot certify a rigid-rotation interval/u);
  });
});
