import { describe, expect, it } from 'vitest';

import {
  classifyStaticRationalTriangleIntersectionStrataV1,
  STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_LIMITS,
  type StaticRationalTriangleIntersectionStrataRecordV1,
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

function classify(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
): StaticRationalTriangleIntersectionStrataRecordV1 {
  const result = classifyStaticRationalTriangleIntersectionStrataV1({ triangleA, triangleB });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('strata fixture must classify');
  return result.value;
}

const BASE = triangle(point(0, 0, 0), point(4, 0, 0), point(0, 4, 0));
const ELEVATED = triangle(point(0, 0, 1), point(4, 0, 1), point(0, 4, 1));
const TRANSVERSE = triangle(point(1, 1, -1), point(1, 1, 1), point(3, 1, 0));
const VERTEX_FACE_TOUCH = triangle(point(1, 1, 0), point(2, 1, 1), point(1, 2, 1));
const SHARED_EDGE = triangle(BASE[0], BASE[1], point(0, 0, 1));
const BOUNDARY_SUPPORTED = triangle(point(1, 1, 0), point(3, 1, 0), point(2, 1, 1));
const COPLANAR_POINT = triangle(point(4, 0, 0), point(5, 0, 0), point(4, 1, 0));
const COPLANAR_SEGMENT = triangle(point(1, 0, 0), point(3, 0, 0), point(2, -1, 0));
const COPLANAR_AREA = triangle(point(1, 1, 0), point(2, 1, 0), point(1, 2, 0));

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

describe('static exact-rational triangle intersection strata candidate', () => {
  it('retains disjoint geometry without inventing contact or history requirements', () => {
    expect(classify(BASE, ELEVATED)).toMatchObject({
      character: 'disjoint',
      triangleARelativeLocation: 'none',
      triangleBRelativeLocation: 'none',
      relativeLocationSample: 'none',
      staticInteriorInteriorIntersectionDetected: false,
      staticContactCandidate: false,
      coplanarAreaOverlapDetected: false,
      requiresMotionSideHistory: false,
      requiresLayerOrder: false,
    });
  });

  it('detects a noncoplanar segment through both relative interiors', () => {
    expect(classify(BASE, TRANSVERSE)).toMatchObject({
      character: 'noncoplanar-interior-interior-segment-intersection',
      triangleARelativeLocation: 'interior',
      triangleBRelativeLocation: 'interior',
      relativeLocationSample: 'open-segment-midpoint',
      staticInteriorInteriorIntersectionDetected: true,
      staticContactCandidate: false,
      requiresMotionSideHistory: false,
    });

    const rationalTransverse = triangle(
      rationalPoint(1n, 2n, -2n, 2n),
      rationalPoint(1n, 2n, 2n, 2n),
      rationalPoint(7n, 2n, 0n, 2n),
    );
    expect(classify(BASE, rationalTransverse)).toMatchObject({
      character: 'noncoplanar-interior-interior-segment-intersection',
      triangleARelativeLocation: 'interior',
      triangleBRelativeLocation: 'interior',
      staticInteriorInteriorIntersectionDetected: true,
    });
  });

  it('keeps vertex-face point contact as a motion-history candidate', () => {
    const value = classify(BASE, VERTEX_FACE_TOUCH);
    expect(value).toMatchObject({
      character: 'noncoplanar-point-contact-candidate',
      triangleARelativeLocation: 'interior',
      triangleBRelativeLocation: 'vertex',
      relativeLocationSample: 'locus-point',
      staticInteriorInteriorIntersectionDetected: false,
      staticContactCandidate: true,
      requiresMotionSideHistory: true,
    });
    const swapped = classify(VERTEX_FACE_TOUCH, BASE);
    expect(swapped.triangleARelativeLocation).toBe('vertex');
    expect(swapped.triangleBRelativeLocation).toBe('interior');
    expect(swapped.character).toBe(value.character);
    expect(swapped.locus).toEqual(value.locus);
  });

  it('distinguishes shared-edge and edge-on-face segment support from interior crossing', () => {
    expect(classify(BASE, SHARED_EDGE)).toMatchObject({
      character: 'noncoplanar-boundary-supported-segment-contact-candidate',
      triangleARelativeLocation: 'edge',
      triangleBRelativeLocation: 'edge',
      staticInteriorInteriorIntersectionDetected: false,
      staticContactCandidate: true,
      requiresMotionSideHistory: true,
    });
    expect(classify(BASE, BOUNDARY_SUPPORTED)).toMatchObject({
      character: 'noncoplanar-boundary-supported-segment-contact-candidate',
      triangleARelativeLocation: 'interior',
      triangleBRelativeLocation: 'edge',
      staticInteriorInteriorIntersectionDetected: false,
    });
  });

  it('separates zero-area coplanar contact from area overlap requiring layer order', () => {
    expect(classify(BASE, COPLANAR_POINT)).toMatchObject({
      character: 'coplanar-point-contact-candidate',
      staticContactCandidate: true,
      coplanarAreaOverlapDetected: false,
      requiresMotionSideHistory: true,
      requiresLayerOrder: false,
    });
    expect(classify(BASE, COPLANAR_SEGMENT)).toMatchObject({
      character: 'coplanar-segment-contact-candidate',
      staticContactCandidate: true,
      coplanarAreaOverlapDetected: false,
      requiresMotionSideHistory: true,
      requiresLayerOrder: false,
    });
    expect(classify(BASE, COPLANAR_AREA)).toMatchObject({
      character: 'coplanar-area-overlap-requires-layer-order',
      triangleARelativeLocation: 'interior',
      triangleBRelativeLocation: 'interior',
      relativeLocationSample: 'area-interior',
      staticContactCandidate: false,
      coplanarAreaOverlapDetected: true,
      requiresMotionSideHistory: true,
      requiresLayerOrder: true,
    });
  });

  it('is invariant under triangle permutations and swaps relative locations exactly', () => {
    const cases = [
      [BASE, TRANSVERSE],
      [BASE, VERTEX_FACE_TOUCH],
      [BASE, BOUNDARY_SUPPORTED],
      [BASE, COPLANAR_AREA],
    ] as const;
    for (const [triangleA, triangleB] of cases) {
      const expected = classify(triangleA, triangleB);
      for (const orderA of PERMUTATIONS) {
        for (const orderB of PERMUTATIONS) {
          const permuted = classify(permute(triangleA, orderA), permute(triangleB, orderB));
          expect(permuted).toEqual(expected);
          const swapped = classify(permute(triangleB, orderB), permute(triangleA, orderA));
          expect(swapped.character).toBe(expected.character);
          expect(swapped.locus).toEqual(expected.locus);
          expect(swapped.triangleARelativeLocation).toBe(expected.triangleBRelativeLocation);
          expect(swapped.triangleBRelativeLocation).toBe(expected.triangleARelativeLocation);
        }
      }
    }
  });

  it('reuses the closed hostile parser and returns deeply frozen no-claim records', () => {
    let getterCalls = 0;
    const hostile: Record<string, unknown> = { triangleB: BASE };
    Object.defineProperty(hostile, 'triangleA', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return BASE;
      },
    });
    const rejected = classifyStaticRationalTriangleIntersectionStrataV1(hostile);
    expect(rejected.ok).toBe(false);
    expect(getterCalls).toBe(0);
    expect('value' in rejected).toBe(false);

    const accepted = classify(BASE, TRANSVERSE);
    expect(Object.isFrozen(accepted)).toBe(true);
    expect(Object.isFrozen(accepted.locus)).toBe(true);
    expect(Object.isFrozen(STATIC_RATIONAL_TRIANGLE_INTERSECTION_STRATA_LIMITS)).toBe(true);
    expect(accepted).toMatchObject({
      meshIdentityBindingIncluded: false,
      declaredIncidencePolicyIncluded: false,
      legalContactClassificationIncluded: false,
      penetrationClassificationIncluded: false,
      selfIntersectionClassificationIncluded: false,
      continuousTimeIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });
});
