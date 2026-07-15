import { describe, expect, it } from 'vitest';

import {
  classifyStaticRationalTriangleOverlap,
  type StaticRationalTriangle3,
} from '../../m0f/geometry/static-rational-triangle-overlap.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>;

const PERMUTATIONS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

function required<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new RangeError(`missing ${context}`);
  return value;
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

function fraction(numerator: bigint, denominator = 1n): Fraction {
  if (denominator === 0n) throw new RangeError('zero fraction denominator');
  const direction = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: (numerator * direction) / divisor,
    denominator: (denominator * direction) / divisor,
  };
}

function subtract(left: Fraction, right: Fraction): Fraction {
  return fraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiply(left: Fraction, right: Fraction): Fraction {
  return fraction(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divide(left: Fraction, right: Fraction): Fraction {
  return fraction(left.numerator * right.denominator, left.denominator * right.numerator);
}

function solveUniqueOverdetermined(
  coefficients: readonly (readonly bigint[])[],
  rightHandSide: readonly bigint[],
): readonly Fraction[] | undefined {
  const columnCount = coefficients[0]?.length ?? 0;
  const augmented = coefficients.map((row, rowIndex) => [
    ...row.map((value) => fraction(value)),
    fraction(rightHandSide[rowIndex] ?? 0n),
  ]);
  const pivotRows: number[] = [];
  let rank = 0;
  for (let column = 0; column < columnCount; column += 1) {
    const pivot = augmented.findIndex(
      (row, rowIndex) => rowIndex >= rank && row[column]?.numerator !== 0n,
    );
    if (pivot < 0) return undefined;
    const pivotRow = required(augmented[pivot], 'pivot row');
    const rankRow = required(augmented[rank], 'rank row');
    augmented[rank] = pivotRow;
    augmented[pivot] = rankRow;
    const normalizedRow = required(augmented[rank], 'normalized row');
    const pivotValue = required(normalizedRow[column], 'pivot value');
    for (let entry = column; entry <= columnCount; entry += 1) {
      normalizedRow[entry] = divide(required(normalizedRow[entry], 'pivot row entry'), pivotValue);
    }
    for (let row = 0; row < augmented.length; row += 1) {
      if (row === rank) continue;
      const eliminatedRow = required(augmented[row], 'eliminated row');
      const factor = required(eliminatedRow[column], 'elimination factor');
      if (factor.numerator === 0n) continue;
      for (let entry = column; entry <= columnCount; entry += 1) {
        eliminatedRow[entry] = subtract(
          required(eliminatedRow[entry], 'eliminated row entry'),
          multiply(factor, required(normalizedRow[entry], 'normalized row entry')),
        );
      }
    }
    pivotRows[column] = rank;
    rank += 1;
  }
  for (let row = rank; row < augmented.length; row += 1) {
    const residualRow = required(augmented[row], 'residual row');
    const allZero = residualRow.slice(0, columnCount).every((value) => value.numerator === 0n);
    if (allZero && required(residualRow[columnCount], 'residual value').numerator !== 0n) {
      return undefined;
    }
  }
  return pivotRows.map((row) =>
    required(required(augmented[row], 'solution row')[columnCount], 'solution value'),
  );
}

function activeIndexSets(size: number, start = 0, prefix: readonly number[] = []): number[][] {
  if (prefix.length === size) return [[...prefix]];
  const result: number[][] = [];
  for (let index = start; index < 6; index += 1) {
    result.push(...activeIndexSets(size, index + 1, [...prefix, index]));
  }
  return result;
}

/**
 * Independent reference: intersection of two convex hulls is the feasibility
 * of equal nonnegative barycentric combinations. Every nonempty bounded
 * feasible polytope has a basic feasible point, so it is enough to enumerate
 * linearly independent active sets of at most five variables and solve the
 * five exact equality constraints.
 */
function referenceClosedTrianglesIntersect(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
): boolean {
  const coordinates = ['x', 'y', 'z'] as const;
  const points = [...triangleA, ...triangleB];
  const commonWeight = points.reduce((product, point) => product * point.w, 1n);
  const fullMatrix: bigint[][] = [
    [1n, 1n, 1n, 0n, 0n, 0n],
    [0n, 0n, 0n, 1n, 1n, 1n],
    ...coordinates.map((coordinate) => [
      ...triangleA.map((point) => point[coordinate] * (commonWeight / point.w)),
      ...triangleB.map((point) => -point[coordinate] * (commonWeight / point.w)),
    ]),
  ];
  const rightHandSide = [1n, 1n, 0n, 0n, 0n];
  for (let size = 1; size <= 5; size += 1) {
    for (const active of activeIndexSets(size)) {
      const solution = solveUniqueOverdetermined(
        fullMatrix.map((row) =>
          active.map((index) => required(row[index], 'reference matrix entry')),
        ),
        rightHandSide,
      );
      if (solution?.every((value) => value.numerator >= 0n)) return true;
    }
  }
  return false;
}

function twiceAreaVector(triangle: StaticRationalTriangle3): readonly bigint[] {
  const [first, second, third] = triangle;
  const ab = [
    second.x * first.w - first.x * second.w,
    second.y * first.w - first.y * second.w,
    second.z * first.w - first.z * second.w,
  ] as const;
  const ac = [
    third.x * first.w - first.x * third.w,
    third.y * first.w - first.y * third.w,
    third.z * first.w - first.z * third.w,
  ] as const;
  return [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];
}

function nondegenerate(triangle: StaticRationalTriangle3): boolean {
  return twiceAreaVector(triangle).some((coordinate) => coordinate !== 0n);
}

function point(x: number, y: number, z: number): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), 1n);
}

function rationalPoint(x: number, y: number, z: number, w: number): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), BigInt(w));
}

function makeGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
}

function generatedTriangle(next: () => number): StaticRationalTriangle3 {
  for (;;) {
    const vertices = Array.from({ length: 3 }, () =>
      point((next() % 7) - 3, (next() % 7) - 3, (next() % 7) - 3),
    ) as unknown as StaticRationalTriangle3;
    if (nondegenerate(vertices)) return vertices;
  }
}

function generatedRationalTriangle(next: () => number): StaticRationalTriangle3 {
  for (;;) {
    const vertices = Array.from({ length: 3 }, () =>
      rationalPoint((next() % 13) - 6, (next() % 13) - 6, (next() % 13) - 6, (next() % 5) + 1),
    ) as unknown as StaticRationalTriangle3;
    if (nondegenerate(vertices)) return vertices;
  }
}

function generatedCoplanarRationalTriangle(next: () => number): StaticRationalTriangle3 {
  for (;;) {
    const vertices = Array.from({ length: 3 }, () =>
      rationalPoint((next() % 13) - 6, (next() % 13) - 6, 0, (next() % 5) + 1),
    ) as unknown as StaticRationalTriangle3;
    if (nondegenerate(vertices)) return vertices;
  }
}

function permute(
  triangle: StaticRationalTriangle3,
  order: (typeof PERMUTATIONS)[number],
): StaticRationalTriangle3 {
  return [triangle[order[0]], triangle[order[1]], triangle[order[2]]];
}

function implementationClassification(
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
): string {
  const result = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
  if (!result.ok) throw new TypeError('generated canonical input must parse');
  return result.value.classification;
}

describe('static triangle overlap independent exact differential corpus', () => {
  it('agrees with exact barycentric feasibility on 1,000 deterministic integer pairs', () => {
    const next = makeGenerator(0x51a71c);
    let intersectionCount = 0;
    for (let caseIndex = 0; caseIndex < 1_000; caseIndex += 1) {
      const triangleA = generatedTriangle(next);
      const triangleB = generatedTriangle(next);
      const result = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new TypeError('generated canonical input must parse');
      if (result.value.closedTrianglesIntersect) intersectionCount += 1;
      expect(result.value.closedTrianglesIntersect, `differential case ${caseIndex}`).toBe(
        referenceClosedTrianglesIntersect(triangleA, triangleB),
      );
    }
    expect(intersectionCount).toBeGreaterThan(0);
    expect(intersectionCount).toBeLessThan(1_000);
  });

  it('agrees on 500 deterministic non-unit-weight rational pairs', () => {
    const next = makeGenerator(0xa11ce5);
    let intersectionCount = 0;
    for (let caseIndex = 0; caseIndex < 500; caseIndex += 1) {
      const triangleA = generatedRationalTriangle(next);
      const triangleB = generatedRationalTriangle(next);
      const result = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new TypeError('generated canonical input must parse');
      if (result.value.closedTrianglesIntersect) intersectionCount += 1;
      expect(result.value.closedTrianglesIntersect, `rational differential case ${caseIndex}`).toBe(
        referenceClosedTrianglesIntersect(triangleA, triangleB),
      );
    }
    expect(intersectionCount).toBeGreaterThan(0);
    expect(intersectionCount).toBeLessThan(500);
  });

  it('agrees on 500 coplanar rational pairs with both overlap outcomes', () => {
    const next = makeGenerator(0xc091a4a2);
    let intersectionCount = 0;
    for (let caseIndex = 0; caseIndex < 500; caseIndex += 1) {
      const triangleA = generatedCoplanarRationalTriangle(next);
      const triangleB = generatedCoplanarRationalTriangle(next);
      const result = classifyStaticRationalTriangleOverlap({ triangleA, triangleB });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new TypeError('generated canonical input must parse');
      if (result.value.closedTrianglesIntersect) {
        intersectionCount += 1;
        expect(result.value.classification).toBe('intersecting-coplanar');
      }
      expect(result.value.closedTrianglesIntersect, `coplanar case ${caseIndex}`).toBe(
        referenceClosedTrianglesIntersect(triangleA, triangleB),
      );
    }
    expect(intersectionCount).toBeGreaterThan(0);
    expect(intersectionCount).toBeLessThan(500);
  });

  it('preserves classification under swap and all windings on a rational corpus', () => {
    const next = makeGenerator(0x5a7e5);
    for (let caseIndex = 0; caseIndex < 50; caseIndex += 1) {
      const triangleA = generatedRationalTriangle(next);
      const triangleB = generatedRationalTriangle(next);
      const expected = implementationClassification(triangleA, triangleB);
      expect(implementationClassification(triangleB, triangleA)).toBe(expected);
      for (const orderA of PERMUTATIONS) {
        for (const orderB of PERMUTATIONS) {
          expect(
            implementationClassification(permute(triangleA, orderA), permute(triangleB, orderB)),
            `permutation case ${caseIndex}`,
          ).toBe(expected);
        }
      }
    }
  });
});
