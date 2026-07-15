import { describe, expect, it } from 'vitest';

import {
  refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  type PrimitiveIntegerPolynomialCommonRootClassV1,
  type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
} from '../../m0f/geometry/primitive-integer-polynomial-unit-interval-root-common-refinement.js';
import {
  compareExactRational,
  exactRational,
  exactRationalKey,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';

type GeneratedPolynomial = Readonly<{
  polynomialId: string;
  coefficients: readonly bigint[];
  factorRoots: readonly ExactRational[];
  persistent: boolean;
}>;

type OracleMember = Readonly<{
  polynomialId: string;
  rootIndex: number;
  multiplicity: number;
}>;

type OracleRoot = Readonly<{
  value: ExactRational;
  members: readonly OracleMember[];
}>;

const INTERIOR_ROOT_POOL = [
  exactRational(1n, 8n),
  exactRational(1n, 5n),
  exactRational(1n, 3n),
  exactRational(1n, 2n),
  exactRational(2n, 3n),
  exactRational(4n, 5n),
  exactRational(7n, 8n),
] as const;
const START = exactRational(0n);
const END = exactRational(1n);

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function multiplyIntegerPolynomials(left: readonly bigint[], right: readonly bigint[]): bigint[] {
  const result = Array.from({ length: left.length + right.length - 1 }, () => 0n);
  for (const [leftIndex, leftCoefficient] of left.entries()) {
    for (const [rightIndex, rightCoefficient] of right.entries()) {
      const target = leftIndex + rightIndex;
      result[target] = (result[target] ?? 0n) + leftCoefficient * rightCoefficient;
    }
  }
  return result;
}

function factorizedPolynomial(
  polynomialId: string,
  factorRoots: readonly ExactRational[],
): GeneratedPolynomial {
  return {
    polynomialId,
    factorRoots,
    persistent: false,
    coefficients: factorRoots.reduce<bigint[]>(
      (coefficients, root) =>
        multiplyIntegerPolynomials(coefficients, [-root.numerator, root.denominator]),
      [1n],
    ),
  };
}

function rootFromPool(caseIndex: number, offset: number): ExactRational {
  const root = INTERIOR_ROOT_POOL[(caseIndex + offset) % INTERIOR_ROOT_POOL.length];
  if (root === undefined) throw new TypeError('deterministic root pool lookup failed');
  return root;
}

function generatedCase(caseIndex: number): readonly GeneratedPolynomial[] {
  const sharedFirst = rootFromPool(caseIndex, 0);
  const firstSatellite = rootFromPool(caseIndex, 1);
  const sharedSecond = rootFromPool(caseIndex, 2);
  const secondSatellite = rootFromPool(caseIndex, 3);
  const thirdSatellite = rootFromPool(caseIndex, 4);
  const nonshared = rootFromPool(caseIndex, 5);
  const prefix = `metamorphic:${String(caseIndex)}`;
  return [
    factorizedPolynomial(`${prefix}:a`, [START, sharedFirst, sharedFirst, firstSatellite]),
    factorizedPolynomial(`${prefix}:b`, [sharedFirst, sharedSecond, END]),
    factorizedPolynomial(`${prefix}:c`, [sharedSecond, sharedSecond, secondSatellite]),
    factorizedPolynomial(`${prefix}:d`, [START, thirdSatellite, END]),
    factorizedPolynomial(`${prefix}:e`, [firstSatellite, secondSatellite, thirdSatellite]),
    factorizedPolynomial(`${prefix}:solo`, [nonshared]),
    factorizedPolynomial(`${prefix}:constant`, []),
    {
      polynomialId: `${prefix}:persistent`,
      coefficients: [0n],
      factorRoots: [],
      persistent: true,
    },
  ];
}

function refine(
  caseIndex: number,
  polynomials: readonly GeneratedPolynomial[],
  permutationId: string,
): PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1 {
  const result = refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1({
    refinementId: `Metamorphic:${String(caseIndex)}:${permutationId}`,
    polynomials: polynomials.map((polynomial) => ({
      polynomialId: polynomial.polynomialId,
      coefficients: [...polynomial.coefficients],
    })),
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('metamorphic common refinement must succeed');
  return result.value;
}

function distinctSortedRoots(roots: readonly ExactRational[]): readonly ExactRational[] {
  const byKey = new Map(roots.map((root) => [exactRationalKey(root), root]));
  return [...byKey.values()].sort(compareExactRational);
}

function oracle(polynomials: readonly GeneratedPolynomial[]): readonly OracleRoot[] {
  const byRoot = new Map<string, { value: ExactRational; members: OracleMember[] }>();
  for (const polynomial of polynomials) {
    if (polynomial.persistent) continue;
    const roots = distinctSortedRoots(polynomial.factorRoots);
    for (const [rootIndex, root] of roots.entries()) {
      const key = exactRationalKey(root);
      const entry = byRoot.get(key) ?? { value: root, members: [] };
      entry.members.push({
        polynomialId: polynomial.polynomialId,
        rootIndex,
        multiplicity: polynomial.factorRoots.filter(
          (candidate) => compareExactRational(candidate, root) === 0,
        ).length,
      });
      byRoot.set(key, entry);
    }
  }
  return [...byRoot.values()]
    .sort((left, right) => compareExactRational(left.value, right.value))
    .map((entry) => ({
      value: entry.value,
      members: entry.members.sort((left, right) =>
        compareText(left.polynomialId, right.polynomialId),
      ),
    }));
}

function normalizedMembers(rootClass: PrimitiveIntegerPolynomialCommonRootClassV1) {
  return rootClass.members
    .map((member) => ({
      polynomialId: member.polynomialId,
      rootIndex: member.rootIndex,
      multiplicity: member.multiplicity,
    }))
    .sort((left, right) => compareText(left.polynomialId, right.polynomialId));
}

function assertMatchesOracle(
  record: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
  polynomials: readonly GeneratedPolynomial[],
): void {
  const expectedRoots = oracle(polynomials);
  expect(record.rootClasses).toHaveLength(expectedRoots.length);
  expect(record.rootClasses.map((rootClass) => rootClass.rootClassIndex)).toEqual(
    Array.from({ length: expectedRoots.length }, (_, index) => index),
  );
  for (const [classIndex, expected] of expectedRoots.entries()) {
    const rootClass = record.rootClasses[classIndex];
    if (rootClass === undefined) throw new TypeError('expected root class is missing');
    if (compareExactRational(expected.value, START) === 0) {
      expect(rootClass.location).toBe('start');
      if (rootClass.location !== 'start') throw new TypeError('oracle start class mismatch');
      expect(compareExactRational(rootClass.exactRoot, expected.value)).toBe(0);
    } else if (compareExactRational(expected.value, END) === 0) {
      expect(rootClass.location).toBe('end');
      if (rootClass.location !== 'end') throw new TypeError('oracle end class mismatch');
      expect(compareExactRational(rootClass.exactRoot, expected.value)).toBe(0);
    } else {
      expect(rootClass.location).toBe('interior');
      if (rootClass.location !== 'interior') throw new TypeError('oracle interior class mismatch');
      expect(compareExactRational(rootClass.isolatingInterval.lower, expected.value)).toBeLessThan(
        0,
      );
      expect(compareExactRational(expected.value, rootClass.isolatingInterval.upper)).toBeLessThan(
        0,
      );
    }
    expect(normalizedMembers(rootClass)).toEqual(expected.members);
    expect(rootClass.memberCount).toBe(expected.members.length);
    expect(rootClass.simultaneousAcrossPolynomials).toBe(expected.members.length > 1);
    for (const member of rootClass.members) {
      expect(polynomials[member.polynomialIndex]?.polynomialId).toBe(member.polynomialId);
    }
  }
  const interior = record.rootClasses.filter(
    (
      rootClass,
    ): rootClass is Extract<
      PrimitiveIntegerPolynomialCommonRootClassV1,
      { location: 'interior' }
    > => rootClass.location === 'interior',
  );
  expect(compareExactRational(START, interior[0]?.isolatingInterval.lower ?? START)).toBeLessThan(
    0,
  );
  for (let index = 1; index < interior.length; index += 1) {
    const previous = interior[index - 1];
    const current = interior[index];
    if (previous === undefined || current === undefined) throw new TypeError('class gap missing');
    expect(
      compareExactRational(previous.isolatingInterval.upper, current.isolatingInterval.lower),
    ).toBeLessThan(0);
  }
  expect(compareExactRational(interior.at(-1)?.isolatingInterval.upper ?? END, END)).toBeLessThan(
    0,
  );
  expect(record.persistentPolynomials.map((entry) => entry.polynomialId)).toEqual(
    polynomials.filter((polynomial) => polynomial.persistent).map((entry) => entry.polynomialId),
  );
  expect(record.finiteRootOccurrenceCountBeforeMerge).toBe(
    expectedRoots.reduce((sum, root) => sum + root.members.length, 0),
  );
}

function semanticLedger(
  record: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
): Readonly<{
  classes: readonly unknown[];
  persistentPolynomialIds: readonly string[];
  counters: readonly number[];
}> {
  return {
    classes: record.rootClasses.map((rootClass) => ({
      location: rootClass.location,
      members: normalizedMembers(rootClass),
    })),
    persistentPolynomialIds: record.persistentPolynomials.map((entry) => entry.polynomialId).sort(),
    counters: [
      record.persistentPolynomialCount,
      record.finiteRootOccurrenceCountBeforeMerge,
      record.distinctFiniteRootClassCountAfterMerge,
      record.startRootClassCount,
      record.interiorRootClassCount,
      record.endRootClassCount,
      record.simultaneousRootClassCount,
    ],
  };
}

describe('primitive integer polynomial common refinement deterministic factor metamorphisms', () => {
  it('matches exact root-value, class-order, membership, and multiplicity oracles', () => {
    for (let caseIndex = 0; caseIndex < INTERIOR_ROOT_POOL.length; caseIndex += 1) {
      const polynomials = generatedCase(caseIndex);
      const record = refine(caseIndex, polynomials, 'canonical');
      assertMatchesOracle(record, polynomials);
      expect(record).toMatchObject({
        polynomialCount: 8,
        persistentPolynomialCount: 1,
        startRootClassCount: 1,
        interiorRootClassCount: 6,
        endRootClassCount: 1,
      });
      expect(
        record.rootClasses.some(
          (rootClass) =>
            rootClass.location === 'interior' && !rootClass.simultaneousAcrossPolynomials,
        ),
      ).toBe(true);
    }
  });

  it('preserves semantic root classes under reverse and rotated input permutations', () => {
    for (let caseIndex = 0; caseIndex < INTERIOR_ROOT_POOL.length; caseIndex += 1) {
      const canonical = generatedCase(caseIndex);
      const permutations = [
        [...canonical].reverse(),
        [...canonical.slice(3), ...canonical.slice(0, 3)],
      ];
      const baseline = refine(caseIndex, canonical, 'baseline');
      const expectedLedger = semanticLedger(baseline);
      for (const [permutationIndex, permutation] of permutations.entries()) {
        const permuted = refine(caseIndex, permutation, `permutation:${String(permutationIndex)}`);
        assertMatchesOracle(permuted, permutation);
        expect(semanticLedger(permuted)).toEqual(expectedLedger);
      }
    }
  });
});
