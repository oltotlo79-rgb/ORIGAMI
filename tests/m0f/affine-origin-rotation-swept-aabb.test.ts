import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS,
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  classifyAffineOriginRotationSweptAabbV1,
  parseAffineOriginRotationSweptAabbInputV1,
  type AffineOriginRotationSweptAabbRecordV1,
  type AffineOriginRotationTrianglePrimitiveV1,
  type CanonicalDyadicTimeSlabV1,
} from '../../m0f/geometry/affine-origin-rotation-swept-aabb.js';
import { type ExactRational } from '../../m0f/model/exact-rational.js';
import {
  canonicalProjectivePoint3,
  projectivePoint3FromRationalComponents,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function point(
  x: bigint | number,
  y: bigint | number,
  z: bigint | number,
  w: bigint | number = 1n,
): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), BigInt(w));
}

function componentPoint(
  x: readonly [bigint, bigint],
  y: readonly [bigint, bigint],
  z: readonly [bigint, bigint],
): ProjectivePoint3 {
  return projectivePoint3FromRationalComponents(x, y, z);
}

const LOCAL_TRIANGLE = [point(0, 0, 0), point(1, 0, 0), point(0, 1, 0)] as const;
const SLAB: CanonicalDyadicTimeSlabV1 = {
  t0: { numerator: 0n, exponent: 0 },
  t1: { numerator: 1n, exponent: 0 },
};

function primitive(
  id: string,
  q0: ProjectivePoint3,
  q1: ProjectivePoint3 = q0,
  localVertices: readonly [ProjectivePoint3, ProjectivePoint3, ProjectivePoint3] = LOCAL_TRIANGLE,
): AffineOriginRotationTrianglePrimitiveV1 {
  return { id, localVertices, q0, q1 };
}

function input(
  first: AffineOriginRotationTrianglePrimitiveV1,
  second: AffineOriginRotationTrianglePrimitiveV1,
  motionFamily: string = AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  slab: CanonicalDyadicTimeSlabV1 = SLAB,
) {
  return { motionFamily, slab, primitives: [first, second] };
}

function successfulRecord(supplied: unknown): AffineOriginRotationSweptAabbRecordV1 {
  const result = classifyAffineOriginRotationSweptAabbV1(supplied);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('fixture must pass the closed input boundary');
  return result.value;
}

function toNumber(value: ExactRational): number {
  return Number(value.numerator) / Number(value.denominator);
}

function affine(pointValue: ProjectivePoint3): readonly [number, number, number] {
  return [
    Number(pointValue.x) / Number(pointValue.w),
    Number(pointValue.y) / Number(pointValue.w),
    Number(pointValue.z) / Number(pointValue.w),
  ];
}

type TestFraction = Readonly<{ numerator: bigint; denominator: bigint }>;
type TestVector3 = readonly [TestFraction, TestFraction, TestFraction];
type TestMatrix3 = readonly [TestVector3, TestVector3, TestVector3];
type ExactRationalModuleForMock = Record<string, unknown> &
  Readonly<{
    exactRational: (numerator: bigint, denominator?: bigint) => ExactRational;
    subtractExactRational: (left: ExactRational, right: ExactRational) => ExactRational;
  }>;

function absoluteBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absoluteBigInt(left);
  let b = absoluteBigInt(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function testFraction(numerator: bigint | number, denominator: bigint | number = 1n): TestFraction {
  const rawNumerator = BigInt(numerator);
  const rawDenominator = BigInt(denominator);
  if (rawDenominator === 0n) throw new RangeError('test fraction denominator must be nonzero');
  const direction = rawDenominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(rawNumerator, rawDenominator);
  return {
    numerator: (rawNumerator * direction) / divisor,
    denominator: absoluteBigInt(rawDenominator) / divisor,
  };
}

function addTestFractions(left: TestFraction, right: TestFraction): TestFraction {
  return testFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractTestFractions(left: TestFraction, right: TestFraction): TestFraction {
  return testFraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyTestFractions(left: TestFraction, right: TestFraction): TestFraction {
  return testFraction(left.numerator * right.numerator, left.denominator * right.denominator);
}

function compareTestFractions(left: TestFraction, right: TestFraction): -1 | 0 | 1 {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function projectiveCoordinate(value: ProjectivePoint3, axis: 0 | 1 | 2): TestFraction {
  return testFraction(axis === 0 ? value.x : axis === 1 ? value.y : value.z, value.w);
}

function affineTestVector(value: ProjectivePoint3): TestVector3 {
  return [
    projectiveCoordinate(value, 0),
    projectiveCoordinate(value, 1),
    projectiveCoordinate(value, 2),
  ];
}

function scaleTestVector(value: TestVector3, scale: TestFraction): TestVector3 {
  return [
    multiplyTestFractions(value[0], scale),
    multiplyTestFractions(value[1], scale),
    multiplyTestFractions(value[2], scale),
  ];
}

function addTestVectors(left: TestVector3, right: TestVector3): TestVector3 {
  return [
    addTestFractions(left[0], right[0]),
    addTestFractions(left[1], right[1]),
    addTestFractions(left[2], right[2]),
  ];
}

function matrixVectorProduct(matrix: TestMatrix3, value: TestVector3): TestVector3 {
  return matrix.map((row) =>
    row.reduce(
      (sum, coefficient, index) =>
        addTestFractions(sum, multiplyTestFractions(coefficient, value[index] ?? testFraction(0))),
      testFraction(0),
    ),
  ) as unknown as TestVector3;
}

function permutationParity(permutation: readonly [number, number, number]): 1 | -1 {
  let inversions = 0;
  for (let left = 0; left < permutation.length; left += 1) {
    for (let right = left + 1; right < permutation.length; right += 1) {
      if ((permutation[left] ?? 0) > (permutation[right] ?? 0)) inversions += 1;
    }
  }
  return inversions % 2 === 0 ? 1 : -1;
}

function signedPermutationRotations(): readonly TestMatrix3[] {
  const permutations = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ] as const;
  const rotations: TestMatrix3[] = [];
  for (const permutation of permutations) {
    for (const firstSign of [-1, 1] as const) {
      for (const secondSign of [-1, 1] as const) {
        for (const thirdSign of [-1, 1] as const) {
          const signs = [firstSign, secondSign, thirdSign] as const;
          if (permutationParity(permutation) * firstSign * secondSign * thirdSign !== 1) continue;
          const rows = permutation.map((column, row) =>
            [0, 1, 2].map((candidate) =>
              testFraction(candidate === column ? (signs[row] ?? 1) : 0),
            ),
          ) as unknown as TestMatrix3;
          rotations.push(rows);
        }
      }
    }
  }
  return rotations;
}

const RATIONAL_QUATERNION_ROTATION: TestMatrix3 = [
  [testFraction(1, 9), testFraction(8, 9), testFraction(4, 9)],
  [testFraction(8, 9), testFraction(1, 9), testFraction(-4, 9)],
  [testFraction(-4, 9), testFraction(4, 9), testFraction(-7, 9)],
];

function convexCombination(
  vertices: readonly [ProjectivePoint3, ProjectivePoint3, ProjectivePoint3],
  weights: readonly [TestFraction, TestFraction, TestFraction],
): TestVector3 {
  return vertices.reduce<TestVector3>(
    (sum, vertex, index) =>
      addTestVectors(
        sum,
        scaleTestVector(affineTestVector(vertex), weights[index] ?? testFraction(0)),
      ),
    [testFraction(0), testFraction(0), testFraction(0)],
  );
}

function interpolateOrigin(
  q0: ProjectivePoint3,
  q1: ProjectivePoint3,
  parameter: TestFraction,
): TestVector3 {
  const complement = subtractTestFractions(testFraction(1), parameter);
  return addTestVectors(
    scaleTestVector(affineTestVector(q0), complement),
    scaleTestVector(affineTestVector(q1), parameter),
  );
}

function exactRationalAsTestFraction(value: ExactRational): TestFraction {
  return testFraction(value.numerator, value.denominator);
}

function dotTestVectors(left: TestVector3, right: TestVector3): TestFraction {
  return left.reduce(
    (sum, value, index) =>
      addTestFractions(sum, multiplyTestFractions(value, right[index] ?? testFraction(0))),
    testFraction(0),
  );
}

function determinantTestMatrix(matrix: TestMatrix3): TestFraction {
  const [first, second, third] = matrix;
  return addTestFractions(
    subtractTestFractions(
      multiplyTestFractions(
        first[0],
        subtractTestFractions(
          multiplyTestFractions(second[1], third[2]),
          multiplyTestFractions(second[2], third[1]),
        ),
      ),
      multiplyTestFractions(
        first[1],
        subtractTestFractions(
          multiplyTestFractions(second[0], third[2]),
          multiplyTestFractions(second[2], third[0]),
        ),
      ),
    ),
    multiplyTestFractions(
      first[2],
      subtractTestFractions(
        multiplyTestFractions(second[0], third[1]),
        multiplyTestFractions(second[1], third[0]),
      ),
    ),
  );
}

function makeDeterministicGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
}

describe('affine-origin arbitrary-SO3 swept AABB candidate', () => {
  it('publishes frozen defensive digit, bit, exponent, property, and issue limits', () => {
    expect(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS).toEqual({
      maxCoordinateDecimalDigits: 4_096,
      maxCoordinateBits: 16_384,
      maxTimeNumeratorDecimalDigits: 1_024,
      maxTimeNumeratorBits: 4_096,
      maxTimeExponent: 4_096,
      maxStableIdLength: 128,
      maxMotionFamilyLength: 128,
      maxDiagnosticPathSegmentLength: 128,
      maxArithmeticBits: 131_072,
      maxIssues: 32,
      maxOwnPropertiesPerContainer: 16,
    });
    expect(Object.isFrozen(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS)).toBe(true);
  });

  it('builds canonical exact bounds and certifies only strict separation', () => {
    const result = successfulRecord(
      input(primitive('face:a', point(0, 0, 0)), primitive('face:b', point(4, 0, 0))),
    );
    expect(result.status).toBe('separated-by-certified-swept-aabb');
    if (result.status !== 'separated-by-certified-swept-aabb') {
      throw new TypeError('strictly separated boxes need a certificate');
    }
    expect(result.primitiveIds).toEqual(['face:a', 'face:b']);
    expect(result.primitiveBounds[0]).toEqual({
      primitiveId: 'face:a',
      aabb: {
        x: {
          min: { numerator: -1n, denominator: 1n },
          max: { numerator: 1n, denominator: 1n },
        },
        y: {
          min: { numerator: -1n, denominator: 1n },
          max: { numerator: 1n, denominator: 1n },
        },
        z: {
          min: { numerator: -1n, denominator: 1n },
          max: { numerator: 1n, denominator: 1n },
        },
      },
    });
    expect(result.certificate).toEqual({
      axis: 'x',
      order: 'a-before-b',
      beforePrimitiveId: 'face:a',
      afterPrimitiveId: 'face:b',
      strictGap: { numerator: 2n, denominator: 1n },
    });
    expect(result.pairSlabSeparationCertified).toBe(true);
    expect(Object.isFrozen(result.certificate.strictGap)).toBe(true);
  });

  it('reduces fractional extrema to canonical exact rationals', () => {
    const fractionalTriangle = [
      point(0, 0, 0),
      componentPoint([1n, 2n], [0n, 1n], [0n, 1n]),
      componentPoint([0n, 1n], [1n, 3n], [0n, 1n]),
    ] as const;
    const result = successfulRecord(
      input(
        primitive('a', componentPoint([1n, 3n], [0n, 1n], [0n, 1n]), undefined, fractionalTriangle),
        primitive('b', point(10, 0, 0)),
      ),
    );
    expect(result.status).toBe('separated-by-certified-swept-aabb');
    if (result.status === 'indeterminate') throw new TypeError('supported fixture must build');
    expect(result.primitiveBounds[0].aabb.x).toEqual({
      min: { numerator: -1n, denominator: 6n },
      max: { numerator: 5n, denominator: 6n },
    });
  });

  it('uses endpoint extrema for an affine origin path', () => {
    const result = successfulRecord(
      input(primitive('a', point(-2, 3, 0), point(2, -5, 4)), primitive('b', point(20, 0, 0))),
    );
    if (result.status === 'indeterminate') throw new TypeError('supported fixture must build');
    expect(result.primitiveBounds[0].aabb).toMatchObject({
      x: {
        min: { numerator: -3n, denominator: 1n },
        max: { numerator: 3n, denominator: 1n },
      },
      y: {
        min: { numerator: -6n, denominator: 1n },
        max: { numerator: 4n, denominator: 1n },
      },
      z: {
        min: { numerator: -1n, denominator: 1n },
        max: { numerator: 5n, denominator: 1n },
      },
    });
  });

  it('retains boundary equality as an overlap candidate', () => {
    const result = successfulRecord(
      input(primitive('a', point(0, 0, 0)), primitive('b', point(2, 0, 0))),
    );
    expect(result.status).toBe('swept-aabb-overlap-candidate');
    expect(result.pairSlabSeparationCertified).toBe(false);
    expect(result.boundaryEqualityRetainedAsCandidate).toBe(true);
  });

  it('retains endpoint-disjoint triangles when their loose swept boxes overlap', () => {
    const result = successfulRecord(
      input(
        primitive('a', point(0, 0, 0)),
        primitive('b', componentPoint([3n, 2n], [0n, 1n], [0n, 1n])),
      ),
    );
    expect(result.status).toBe('swept-aabb-overlap-candidate');
    expect(result.pairSlabSeparationCertified).toBe(false);
  });

  it('canonicalizes pair order, is swap symmetric, and fixes axis ties to x then y then z', () => {
    const a = primitive('a', point(4, 4, 4));
    const b = primitive('b', point(0, 0, 0));
    const forward = classifyAffineOriginRotationSweptAabbV1(input(a, b));
    const swapped = classifyAffineOriginRotationSweptAabbV1(input(b, a));
    expect(forward).toEqual(swapped);
    expect(forward.ok).toBe(true);
    if (!forward.ok || forward.value.status !== 'separated-by-certified-swept-aabb') {
      throw new TypeError('fixture boxes must be separated');
    }
    expect(forward.value.primitiveIds).toEqual(['a', 'b']);
    expect(forward.value.certificate).toMatchObject({
      axis: 'x',
      order: 'b-before-a',
      beforePrimitiveId: 'b',
      afterPrimitiveId: 'a',
    });
  });

  it('matches an independent endpoint/radius separation oracle on 200 deterministic pairs', () => {
    const next = makeDeterministicGenerator(0xaabb51ab);
    let separatedCount = 0;
    let retainedCount = 0;
    for (let caseIndex = 0; caseIndex < 200; caseIndex += 1) {
      const coordinates = Array.from({ length: 12 }, () => (next() % 21) - 10);
      const coordinate = (index: number): number => coordinates[index] ?? 0;
      const a0 = [coordinate(0), coordinate(1), coordinate(2)] as const;
      const a1 = [coordinate(3), coordinate(4), coordinate(5)] as const;
      const b0 = [coordinate(6), coordinate(7), coordinate(8)] as const;
      const b1 = [coordinate(9), coordinate(10), coordinate(11)] as const;
      const first = primitive('a', point(...a0), point(...a1));
      const second = primitive('b', point(...b0), point(...b1));
      const slab =
        caseIndex % 2 === 0
          ? SLAB
          : ({
              t0: { numerator: -7n, exponent: 3 },
              t1: { numerator: 9n, exponent: 2 },
            } satisfies CanonicalDyadicTimeSlabV1);
      const forward = classifyAffineOriginRotationSweptAabbV1(
        input(first, second, undefined, slab),
      );
      const swapped = classifyAffineOriginRotationSweptAabbV1(
        input(second, first, undefined, slab),
      );
      expect(forward).toEqual(swapped);
      expect(forward.ok).toBe(true);
      if (!forward.ok) throw new TypeError('integer property fixture must parse');
      expect(forward.value.status).not.toBe('indeterminate');
      if (forward.value.status === 'indeterminate') {
        throw new TypeError('small integer property fixture must build');
      }

      const aIntervals = [0, 1, 2].map((axis) => ({
        min: Math.min(a0[axis] ?? 0, a1[axis] ?? 0) - 1,
        max: Math.max(a0[axis] ?? 0, a1[axis] ?? 0) + 1,
      }));
      const bIntervals = [0, 1, 2].map((axis) => ({
        min: Math.min(b0[axis] ?? 0, b1[axis] ?? 0) - 1,
        max: Math.max(b0[axis] ?? 0, b1[axis] ?? 0) + 1,
      }));
      const axisNames = ['x', 'y', 'z'] as const;
      let expected:
        | Readonly<{
            axis: 'x' | 'y' | 'z';
            order: 'a-before-b' | 'b-before-a';
            gap: number;
          }>
        | undefined;
      for (let axis = 0; axis < 3 && expected === undefined; axis += 1) {
        const aInterval = aIntervals[axis];
        const bInterval = bIntervals[axis];
        const axisName = axisNames[axis];
        if (aInterval === undefined || bInterval === undefined || axisName === undefined) {
          throw new TypeError('property interval axis is missing');
        }
        if (aInterval.max < bInterval.min) {
          expected = { axis: axisName, order: 'a-before-b', gap: bInterval.min - aInterval.max };
        } else if (bInterval.max < aInterval.min) {
          expected = { axis: axisName, order: 'b-before-a', gap: aInterval.min - bInterval.max };
        }
      }
      if (expected === undefined) {
        retainedCount += 1;
        expect(forward.value.status, `property case ${caseIndex}`).toBe(
          'swept-aabb-overlap-candidate',
        );
      } else {
        separatedCount += 1;
        expect(forward.value.status, `property case ${caseIndex}`).toBe(
          'separated-by-certified-swept-aabb',
        );
        if (forward.value.status !== 'separated-by-certified-swept-aabb') {
          throw new TypeError('strict property separation needs a certificate');
        }
        expect(forward.value.certificate).toMatchObject({
          axis: expected.axis,
          order: expected.order,
          beforePrimitiveId: expected.order === 'a-before-b' ? 'a' : 'b',
          afterPrimitiveId: expected.order === 'a-before-b' ? 'b' : 'a',
          strictGap: { numerator: BigInt(expected.gap), denominator: 1n },
        });
      }
    }
    expect(separatedCount).toBeGreaterThan(0);
    expect(retainedCount).toBeGreaterThan(0);
  });

  it('contains multiple sampled rotations and affine origins as a regression check, not a proof', () => {
    const moving = primitive('a', point(-2, 1, 0), point(3, -4, 5), [
      point(2, -1, 3),
      point(-4, 2, 1),
      point(1, 5, -2),
    ]);
    const result = successfulRecord(input(moving, primitive('b', point(100, 0, 0))));
    if (result.status === 'indeterminate') throw new TypeError('supported fixture must build');
    const bound = result.primitiveBounds[0].aabb;

    const h = 2 ** -0.5;
    const samples = [
      {
        s: 0,
        rotation: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      },
      {
        s: 0.25,
        rotation: [
          [0, -1, 0],
          [1, 0, 0],
          [0, 0, 1],
        ],
      },
      {
        s: 0.5,
        rotation: [
          [0, 1, 0],
          [0, 0, 1],
          [1, 0, 0],
        ],
      },
      {
        s: 0.75,
        rotation: [
          [h, -h, 0],
          [h, h, 0],
          [0, 0, 1],
        ],
      },
      {
        s: 1,
        rotation: [
          [1, 0, 0],
          [0, -1, 0],
          [0, 0, -1],
        ],
      },
    ] as const;
    const q0 = affine(moving.q0);
    const q1 = affine(moving.q1);
    for (const { s, rotation } of samples) {
      const q = q0.map((value, axis) => (1 - s) * value + s * (q1[axis] ?? 0));
      for (const vertex of moving.localVertices) {
        const local = affine(vertex);
        for (let axis = 0; axis < 3; axis += 1) {
          const row = rotation[axis];
          if (row === undefined) throw new TypeError('rotation row must exist');
          const rotated = row[0] * local[0] + row[1] * local[1] + row[2] * local[2];
          const world = (q[axis] ?? 0) + rotated;
          const interval = axis === 0 ? bound.x : axis === 1 ? bound.y : bound.z;
          expect(world).toBeGreaterThanOrEqual(toNumber(interval.min) - 1e-12);
          expect(world).toBeLessThanOrEqual(toNumber(interval.max) + 1e-12);
        }
      }
    }
  });

  it('exactly contains SO(3) signed permutations, a rational rotation, and triangle interior points', () => {
    const localVertices = [
      componentPoint([2n, 3n], [-1n, 2n], [3n, 5n]),
      componentPoint([-4n, 5n], [7n, 6n], [1n, 4n]),
      componentPoint([5n, 7n], [2n, 9n], [-8n, 11n]),
    ] as const;
    const moving = primitive(
      'a',
      componentPoint([-7n, 3n], [5n, 4n], [-2n, 5n]),
      componentPoint([11n, 6n], [-9n, 5n], [13n, 7n]),
      localVertices,
    );
    const customSlab: CanonicalDyadicTimeSlabV1 = {
      t0: { numerator: -3n, exponent: 2 },
      t1: { numerator: 5n, exponent: 3 },
    };
    const result = successfulRecord(
      input(moving, primitive('b', point(100, 0, 0)), undefined, customSlab),
    );
    if (result.status === 'indeterminate')
      throw new TypeError('supported exact fixture must build');
    const bound = result.primitiveBounds[0].aabb;
    const rotations = [...signedPermutationRotations(), RATIONAL_QUATERNION_ROTATION];
    expect(rotations).toHaveLength(25);
    for (const rotation of rotations) {
      expect(determinantTestMatrix(rotation)).toEqual(testFraction(1));
      for (let left = 0; left < 3; left += 1) {
        for (let right = 0; right < 3; right += 1) {
          const leftRow = rotation[left];
          const rightRow = rotation[right];
          if (leftRow === undefined || rightRow === undefined) {
            throw new TypeError('rotation row is missing');
          }
          expect(dotTestVectors(leftRow, rightRow)).toEqual(testFraction(left === right ? 1 : 0));
        }
      }
    }

    const weights: readonly (readonly [TestFraction, TestFraction, TestFraction])[] = [
      [testFraction(1), testFraction(0), testFraction(0)],
      [testFraction(0), testFraction(1), testFraction(0)],
      [testFraction(0), testFraction(0), testFraction(1)],
      [testFraction(1, 3), testFraction(1, 3), testFraction(1, 3)],
      [testFraction(1, 2), testFraction(1, 3), testFraction(1, 6)],
      [testFraction(1, 5), testFraction(2, 5), testFraction(2, 5)],
    ];
    const parameters = [
      testFraction(0),
      testFraction(1, 8),
      testFraction(1, 2),
      testFraction(7, 8),
      testFraction(1),
    ];
    const intervals = [bound.x, bound.y, bound.z] as const;
    for (const rotation of rotations) {
      for (const parameter of parameters) {
        const origin = interpolateOrigin(moving.q0, moving.q1, parameter);
        for (const barycentricWeights of weights) {
          const localPoint = convexCombination(localVertices, barycentricWeights);
          const worldPoint = addTestVectors(origin, matrixVectorProduct(rotation, localPoint));
          for (let axis = 0; axis < 3; axis += 1) {
            const coordinate = worldPoint[axis];
            const currentInterval = intervals[axis];
            if (coordinate === undefined || currentInterval === undefined) {
              throw new TypeError('3D containment fixture axis is missing');
            }
            expect(
              compareTestFractions(coordinate, exactRationalAsTestFraction(currentInterval.min)),
            ).toBeGreaterThanOrEqual(0);
            expect(
              compareTestFractions(coordinate, exactRationalAsTestFraction(currentInterval.max)),
            ).toBeLessThanOrEqual(0);
          }
        }
      }
    }

    const relabeledSlab = successfulRecord(
      input(moving, primitive('b', point(100, 0, 0)), undefined, SLAB),
    );
    if (relabeledSlab.status === 'indeterminate') {
      throw new TypeError('same endpoint origins must remain supported');
    }
    expect(relabeledSlab.primitiveBounds).toEqual(result.primitiveBounds);
    expect(result.slab).toEqual(customSlab);
  });

  it('accepts an in-budget huge rational and rejects coordinate values beyond the digit boundary', () => {
    const huge =
      10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateDecimalDigits - 1);
    const hugeTriangle = [point(huge, 0, 0), point(huge + 1n, 0, 0), point(huge, 1, 0)] as const;
    const accepted = classifyAffineOriginRotationSweptAabbV1(
      input(
        primitive('a', point(0, 0, 0), undefined, hugeTriangle),
        primitive('b', point(0, 0, 0), undefined, hugeTriangle),
      ),
    );
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new TypeError('in-budget huge rational must parse');
    expect(accepted.value.status).toBe('swept-aabb-overlap-candidate');

    const over = 10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateDecimalDigits);
    const rejected = classifyAffineOriginRotationSweptAabbV1(
      input(primitive('a', point(0, 0, 0)), primitive('b', { x: over, y: 0n, z: 0n, w: 1n })),
    );
    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new TypeError('over-budget coordinate must fail atomically');
    expect(rejected.error).toContainEqual(
      expect.objectContaining({ code: 'coordinate-digit-limit-exceeded' }),
    );
    expect('value' in rejected).toBe(false);

    const overBits = 1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxCoordinateBits);
    const bitRejected = classifyAffineOriginRotationSweptAabbV1(
      input(primitive('a', point(0, 0, 0)), primitive('b', { x: overBits, y: 0n, z: 0n, w: 1n })),
    );
    expect(bitRejected.ok).toBe(false);
    if (bitRejected.ok) throw new TypeError('over-bit-budget coordinate must fail atomically');
    expect(bitRejected.error).toContainEqual(
      expect.objectContaining({ code: 'coordinate-bit-limit-exceeded' }),
    );
  });

  it('enforces canonical dyadic time and its digit, bit, exponent, and ordering limits', () => {
    const validLargeNumerator =
      10n ** BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorDecimalDigits - 1) +
      1n;
    expect(
      parseAffineOriginRotationSweptAabbInputV1(
        input(primitive('a', point(0, 0, 0)), primitive('b', point(4, 0, 0)), undefined, {
          t0: { numerator: 0n, exponent: 0 },
          t1: { numerator: validLargeNumerator, exponent: 1 },
        }),
      ).ok,
    ).toBe(true);

    const invalidSlabs: readonly [CanonicalDyadicTimeSlabV1, string][] = [
      [
        {
          t0: { numerator: 0n, exponent: 0 },
          t1: { numerator: 2n, exponent: 1 },
        },
        'noncanonical-dyadic',
      ],
      [
        {
          t0: { numerator: 1n, exponent: 0 },
          t1: { numerator: 0n, exponent: 0 },
        },
        'invalid-time-slab',
      ],
      [
        {
          t0: { numerator: 0n, exponent: 0 },
          t1: {
            numerator:
              10n **
                BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorDecimalDigits) +
              1n,
            exponent: 1,
          },
        },
        'time-digit-limit-exceeded',
      ],
      [
        {
          t0: { numerator: 0n, exponent: 0 },
          t1: {
            numerator: 1n,
            exponent: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeExponent + 1,
          },
        },
        'time-exponent-limit-exceeded',
      ],
      [
        {
          t0: { numerator: 0n, exponent: 0 },
          t1: {
            numerator:
              (1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxTimeNumeratorBits)) + 1n,
            exponent: 1,
          },
        },
        'time-bit-limit-exceeded',
      ],
    ];
    for (const [slab, expectedCode] of invalidSlabs) {
      const parsed = parseAffineOriginRotationSweptAabbInputV1(
        input(primitive('a', point(0, 0, 0)), primitive('b', point(4, 0, 0)), undefined, slab),
      );
      expect(parsed.ok).toBe(false);
      if (parsed.ok) throw new TypeError('invalid dyadic slab must fail');
      expect(parsed.error).toContainEqual(expect.objectContaining({ code: expectedCode }));
    }
  });

  it('returns fixed fail-closed indeterminate for a bounded unsupported family', () => {
    const result = successfulRecord(
      input(
        primitive('a', point(0, 0, 0)),
        primitive('b', point(100, 0, 0)),
        'some-other-rigid-motion-v1',
      ),
    );
    expect(result).toMatchObject({
      status: 'indeterminate',
      reason: 'unsupported-motion-family',
      motionFamilySupported: false,
      arbitrarySo3RotationEnclosed: false,
      pairSlabSeparationCertified: false,
    });
    expect('primitiveBounds' in result).toBe(false);
    expect('certificate' in result).toBe(false);
  });

  it.each(['primitive-bound', 'separation-certificate'] as const)(
    'turns forced %s arithmetic-budget exhaustion into fixed indeterminate',
    async (stage) => {
      vi.resetModules();
      let budgetInjected = false;
      vi.doMock('../../m0f/model/exact-rational.js', async (importOriginal) => {
        const actual = await importOriginal<ExactRationalModuleForMock>();
        const exhausted = Object.freeze({
          numerator: 1n << BigInt(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxArithmeticBits),
          denominator: 1n,
        });
        return {
          ...actual,
          exactRational: (numerator: bigint, denominator = 1n): ExactRational => {
            if (stage === 'primitive-bound' && !budgetInjected) {
              budgetInjected = true;
              return exhausted;
            }
            return actual.exactRational(numerator, denominator);
          },
          subtractExactRational: (left: ExactRational, right: ExactRational): ExactRational => {
            const difference = actual.subtractExactRational(left, right);
            if (
              stage === 'separation-certificate' &&
              !budgetInjected &&
              difference.numerator === 98n &&
              difference.denominator === 1n
            ) {
              budgetInjected = true;
              return exhausted;
            }
            return difference;
          },
        };
      });
      try {
        const isolated = await import('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
        const result = isolated.classifyAffineOriginRotationSweptAabbV1(
          input(primitive('a', point(0, 0, 0)), primitive('b', point(100, 0, 0))),
        );
        expect(result).toMatchObject({
          ok: true,
          value: {
            status: 'indeterminate',
            reason: 'arithmetic-budget-exhausted',
            motionFamilySupported: true,
            arbitrarySo3RotationEnclosed: false,
            pairSlabSeparationCertified: false,
            collisionFreeClaim: false,
            verifiedClaim: false,
            globalM0fGo: false,
          },
        });
        expect('value' in result && 'primitiveBounds' in result.value).toBe(false);
        expect('value' in result && 'certificate' in result.value).toBe(false);
        expect(budgetInjected).toBe(true);
      } finally {
        vi.doUnmock('../../m0f/model/exact-rational.js');
        vi.resetModules();
      }
    },
  );

  it('rejects duplicate IDs, degenerate triangles, noncanonical points, and invalid IDs atomically', () => {
    const collinear = [point(0, 0, 0), point(1, 1, 1), point(2, 2, 2)] as const;
    const cases: readonly [unknown, string][] = [
      [
        input(primitive('same', point(0, 0, 0)), primitive('same', point(4, 0, 0))),
        'duplicate-primitive-id',
      ],
      [
        input(primitive('a', point(0, 0, 0), undefined, collinear), primitive('b', point(4, 0, 0))),
        'degenerate-triangle',
      ],
      [
        input(primitive('a', point(0, 0, 0)), primitive('b', { x: 2n, y: 0n, z: 0n, w: 2n })),
        'noncanonical-point',
      ],
      [
        input(primitive('bad id', point(0, 0, 0)), primitive('b', point(4, 0, 0))),
        'invalid-stable-id',
      ],
    ];
    for (const [supplied, expectedCode] of cases) {
      const parsed = classifyAffineOriginRotationSweptAabbV1(supplied);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) throw new TypeError('invalid input must fail atomically');
      expect(parsed.error).toContainEqual(expect.objectContaining({ code: expectedCode }));
      expect(parsed.error.length).toBeLessThanOrEqual(
        AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxIssues,
      );
      expect('value' in parsed).toBe(false);
    }
  });

  it('rejects unknown properties, sparse arrays, and excessive property counts', () => {
    const validA = primitive('a', point(0, 0, 0));
    const validB = primitive('b', point(4, 0, 0));
    const withUnknown = { ...input(validA, validB), surprise: true };
    const sparsePair = new Array<unknown>(2);
    sparsePair[0] = validA;
    const sparseInput = {
      motionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
      slab: SLAB,
      primitives: sparsePair,
    };
    const tooMany: Record<string, unknown> = { ...input(validA, validB) };
    for (
      let index = 0;
      index <= AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxOwnPropertiesPerContainer;
      index += 1
    ) {
      tooMany[`extra${index}`] = index;
    }

    for (const [supplied, expectedCode] of [
      [withUnknown, 'unknown-property'],
      [sparseInput, 'missing-property'],
      [tooMany, 'property-limit-exceeded'],
    ] as const) {
      const parsed = parseAffineOriginRotationSweptAabbInputV1(supplied);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) throw new TypeError('closed input violation must fail');
      expect(parsed.error).toContainEqual(expect.objectContaining({ code: expectedCode }));
    }
  });

  it('handles __proto__ and bounds hostile symbol names in diagnostic paths', () => {
    const validA = primitive('a', point(0, 0, 0));
    const validB = primitive('b', point(4, 0, 0));
    const protoKeyInput = { ...input(validA, validB) };
    Object.defineProperty(protoKeyInput, '__proto__', {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
    });
    const beforePrototype: unknown = Reflect.getPrototypeOf(protoKeyInput);
    const protoResult = parseAffineOriginRotationSweptAabbInputV1(protoKeyInput);
    expect(protoResult.ok).toBe(false);
    expect(Object.getPrototypeOf(protoKeyInput)).toBe(beforePrototype);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    if (protoResult.ok) throw new TypeError('__proto__ own key must be unknown');
    expect(protoResult.error).toContainEqual(
      expect.objectContaining({ path: '$.__proto__', code: 'unknown-property' }),
    );

    const hugeSymbol = Symbol('s'.repeat(100_000));
    const symbolInput: Record<PropertyKey, unknown> = { ...input(validA, validB) };
    symbolInput[hugeSymbol] = true;
    const symbolResult = parseAffineOriginRotationSweptAabbInputV1(symbolInput);
    expect(symbolResult.ok).toBe(false);
    if (symbolResult.ok) throw new TypeError('symbol own key must be unknown');
    const symbolIssue = symbolResult.error.find((entry) => entry.code === 'unknown-property');
    expect(symbolIssue).toBeDefined();
    expect(symbolIssue?.path.length).toBeLessThanOrEqual(
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxDiagnosticPathSegmentLength + 3,
    );
    expect(symbolIssue?.path.endsWith('…)')).toBe(true);
  });

  it('never invokes accessors and handles hostile and revoked inspection input', () => {
    let calls = 0;
    const accessor = {
      motionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
      get slab() {
        calls += 1;
        return SLAB;
      },
      primitives: [primitive('a', point(0, 0, 0)), primitive('b', point(4, 0, 0))],
    };
    const accessorResult = parseAffineOriginRotationSweptAabbInputV1(accessor);
    expect(accessorResult.ok).toBe(false);
    expect(calls).toBe(0);
    if (accessorResult.ok) throw new TypeError('accessor must fail');
    expect(accessorResult.error).toContainEqual(
      expect.objectContaining({ code: 'accessor-property' }),
    );

    const hostile = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('hostile proxy');
        },
      },
    );
    const hostileResult = parseAffineOriginRotationSweptAabbInputV1(hostile);
    expect(hostileResult).toEqual({
      ok: false,
      error: [
        {
          path: '$',
          code: 'inspection-failed',
          message: 'input properties could not be inspected safely',
        },
      ],
    });

    const revocable = Proxy.revocable({}, {});
    revocable.revoke();
    const revokedResult = parseAffineOriginRotationSweptAabbInputV1(revocable.proxy);
    expect(revokedResult.ok).toBe(false);
    if (revokedResult.ok) throw new TypeError('revoked proxy must fail');
    expect(revokedResult.error).toContainEqual(
      expect.objectContaining({ code: 'inspection-failed' }),
    );
  });

  it('bounds diagnostics and deeply freezes successful and failed outputs', () => {
    const manyIssues = {
      motionFamily: 7,
      slab: { t0: {}, t1: {}, extra: true },
      primitives: [
        { id: '', localVertices: new Array(3), q0: {}, q1: {}, extra: true },
        { id: '', localVertices: new Array(3), q0: {}, q1: {}, extra: true },
      ],
      extra: true,
    };
    const invalid = parseAffineOriginRotationSweptAabbInputV1(manyIssues);
    expect(invalid.ok).toBe(false);
    expect(Object.isFrozen(invalid)).toBe(true);
    if (invalid.ok) throw new TypeError('invalid fixture must fail');
    expect(invalid.error).toHaveLength(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_LIMITS.maxIssues);
    expect(Object.isFrozen(invalid.error)).toBe(true);
    expect(invalid.error.every((entry) => Object.isFrozen(entry))).toBe(true);

    const parsed = parseAffineOriginRotationSweptAabbInputV1(
      input(primitive('a', point(0, 0, 0)), primitive('b', point(4, 0, 0))),
    );
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('valid fixture must parse');
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives)).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives[0])).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives[0].localVertices)).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives[0].localVertices[0])).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives[0].q0)).toBe(true);

    const valid = classifyAffineOriginRotationSweptAabbV1(
      input(primitive('a', point(0, 0, 0)), primitive('b', point(4, 0, 0))),
    );
    expect(valid.ok).toBe(true);
    expect(Object.isFrozen(valid)).toBe(true);
    if (!valid.ok || valid.value.status === 'indeterminate') {
      throw new TypeError('valid fixture must produce bounds');
    }
    expect(Object.isFrozen(valid.value)).toBe(true);
    expect(Object.isFrozen(valid.value.primitiveIds)).toBe(true);
    expect(Object.isFrozen(valid.value.slab)).toBe(true);
    expect(Object.isFrozen(valid.value.slab.t0)).toBe(true);
    expect(Object.isFrozen(valid.value.primitiveBounds)).toBe(true);
    expect(Object.isFrozen(valid.value.primitiveBounds[0].aabb.x)).toBe(true);
  });

  it('keeps every CCD, collision, policy, verification, scientific, and GO claim false', () => {
    const records = [
      successfulRecord(input(primitive('a', point(0, 0, 0)), primitive('b', point(4, 0, 0)))),
      successfulRecord(input(primitive('a', point(0, 0, 0)), primitive('b', point(2, 0, 0)))),
      successfulRecord(
        input(
          primitive('a', point(0, 0, 0)),
          primitive('b', point(100, 0, 0)),
          'unsupported-family-v1',
        ),
      ),
    ];
    for (const record of records) {
      expect(record).toMatchObject({
        contractStatus: 'candidate-no-claim',
        broadPhaseOnly: true,
        continuousCollisionDetectionIncluded: false,
        collisionFreeClaim: false,
        legalContactClassificationIncluded: false,
        penetrationClassificationIncluded: false,
        selfIntersectionClassificationIncluded: false,
        verified: false,
        verifiedClaim: false,
        scientificClaim: false,
        globalM0fGo: false,
      });
    }
  });

  it('contains no trigonometric implementation and explicitly says broad phase is not CCD', async () => {
    const source = await readFile(
      resolve('m0f/geometry/affine-origin-rotation-swept-aabb.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/\bMath\.(?:sin|cos)\b/u);
    expect(source).toContain('No sampled rotation is used');
    expect(source).toContain('broad-phase culling, not nonlinear CCD');
    expect(source).toContain('not a browser');
    expect(source).toContain('SupportProfile');
  });
});
