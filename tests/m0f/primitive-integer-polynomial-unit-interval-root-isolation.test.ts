import { describe, expect, it } from 'vitest';

import {
  isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS,
  type PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
} from '../../m0f/geometry/primitive-integer-polynomial-unit-interval-root-isolation.js';
import {
  compareExactRational,
  exactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';

function input(coefficients: readonly bigint[], polynomialId = 'Polynomial:fixture:1') {
  return { polynomialId, coefficients: [...coefficients] };
}

function isolate(
  coefficients: readonly bigint[],
  polynomialId = 'Polynomial:fixture:1',
): PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1 {
  const result = isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(
    input(coefficients, polynomialId),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('root-isolation fixture must succeed');
  return result.value;
}

function multiplyIntegerPolynomials(left: readonly bigint[], right: readonly bigint[]): bigint[] {
  const result = Array.from({ length: left.length + right.length - 1 }, () => 0n);
  for (const [leftIndex, leftValue] of left.entries()) {
    for (const [rightIndex, rightValue] of right.entries()) {
      const index = leftIndex + rightIndex;
      result[index] = (result[index] ?? 0n) + leftValue * rightValue;
    }
  }
  return result;
}

function expectInside(value: ExactRational, lower: ExactRational, upper: ExactRational): void {
  expect(compareExactRational(lower, value)).toBeLessThan(0);
  expect(compareExactRational(value, upper)).toBeLessThan(0);
}

describe('primitive integer polynomial exact root isolation on the closed unit interval', () => {
  it('distinguishes an identically-zero root set from a nonzero constant', () => {
    const zero = isolate([0n], 'Polynomial:zero:1');
    expect(zero).toMatchObject({
      polynomialDegree: null,
      rootSetKind: 'entire-unit-interval',
      everyUnitIntervalPointIsRoot: true,
      distinctRootCount: 0,
      rootMultiplicitySum: null,
      roots: [],
      sturmSequenceLength: 0,
    });

    const constant = isolate([1n], 'Polynomial:constant:1');
    expect(constant).toMatchObject({
      polynomialDegree: 0,
      rootSetKind: 'finite',
      everyUnitIntervalPointIsRoot: false,
      distinctRootCount: 0,
      rootMultiplicitySum: 0,
      roots: [],
    });
  });

  it('isolates one simple interior rational root in an open rational interval', () => {
    const record = isolate([-1n, 2n], 'Polynomial:linear:1');
    expect(record.distinctRootCount).toBe(1);
    expect(record.interiorDistinctRootCount).toBe(1);
    expect(record.rootMultiplicitySum).toBe(1);
    const root = record.roots[0];
    expect(root).toMatchObject({ location: 'interior', multiplicity: 1, sturmCertified: true });
    if (root?.location !== 'interior') throw new TypeError('linear root must be interior');
    expectInside(exactRational(1n, 2n), root.isolatingInterval.lower, root.isolatingInterval.upper);
    expect(root.isolatingInterval).toMatchObject({
      lowerExclusive: true,
      upperExclusive: true,
      distinctRootCount: 1,
    });
  });

  it('extracts exact endpoint roots with their full multiplicities', () => {
    const record = isolate([0n, 0n, -1n, 3n, -3n, 1n], 'Polynomial:endpoints:1');
    expect(record).toMatchObject({
      polynomialDegree: 5,
      startRootMultiplicity: 2,
      endRootMultiplicity: 3,
      interiorDistinctRootCount: 0,
      distinctRootCount: 2,
      rootMultiplicitySum: 5,
    });
    expect(record.roots).toEqual([
      expect.objectContaining({
        rootIndex: 0,
        location: 'start',
        multiplicity: 2,
        exactRoot: { numerator: 0n, denominator: 1n },
      }),
      expect.objectContaining({
        rootIndex: 1,
        location: 'end',
        multiplicity: 3,
        exactRoot: { numerator: 1n, denominator: 1n },
      }),
    ]);
  });

  it('isolates two rational interior roots and recovers unequal multiplicities', () => {
    const record = isolate([-3n, 28n, -80n, 64n], 'Polynomial:repeated-rational:1');
    expect(record.interiorDistinctRootCount).toBe(2);
    expect(record.distinctRootCount).toBe(2);
    expect(record.rootMultiplicitySum).toBe(3);
    const first = record.roots[0];
    const second = record.roots[1];
    if (first?.location !== 'interior' || second?.location !== 'interior') {
      throw new TypeError('both roots must be interior');
    }
    expect(first.multiplicity).toBe(2);
    expect(second.multiplicity).toBe(1);
    expectInside(
      exactRational(1n, 4n),
      first.isolatingInterval.lower,
      first.isolatingInterval.upper,
    );
    expectInside(
      exactRational(3n, 4n),
      second.isolatingInterval.lower,
      second.isolatingInterval.upper,
    );
    expect(
      compareExactRational(first.isolatingInterval.upper, second.isolatingInterval.lower),
    ).toBeLessThanOrEqual(0);
  });

  it('recovers multiplicity for an irrational root without approximating it', () => {
    const record = isolate([-1n, 3n, 4n, -12n, -4n, 12n], 'Polynomial:irrational:1');
    expect(record.interiorDistinctRootCount).toBe(2);
    expect(record.rootMultiplicitySum).toBe(3);
    const multiplicities = record.roots.map((root) => root.multiplicity);
    expect(multiplicities).toEqual([1, 2]);
    const irrational = record.roots[1];
    if (irrational?.location !== 'interior')
      throw new TypeError('irrational root must be interior');
    expect(
      compareExactRational(irrational.isolatingInterval.lower, exactRational(1n, 2n)),
    ).toBeGreaterThanOrEqual(0);
    const lowerSquared =
      irrational.isolatingInterval.lower.numerator ** 2n *
      irrational.isolatingInterval.upper.denominator ** 2n;
    const upperSquared =
      irrational.isolatingInterval.upper.numerator ** 2n *
      irrational.isolatingInterval.lower.denominator ** 2n;
    const commonProduct =
      irrational.isolatingInterval.lower.denominator ** 2n *
      irrational.isolatingInterval.upper.denominator ** 2n;
    expect(2n * lowerSquared).toBeLessThan(commonProduct);
    expect(2n * upperSquared).toBeGreaterThan(commonProduct);
  });

  it('separates six distinct roots even when initial split candidates are roots', () => {
    const rationalRoots = [
      exactRational(1n, 8n),
      exactRational(1n, 4n),
      exactRational(3n, 8n),
      exactRational(1n, 2n),
      exactRational(5n, 8n),
      exactRational(3n, 4n),
    ];
    const coefficients = [1n, 0n, 0n, 0n, 0n, 0n, 0n].slice(0, 1);
    const polynomial = rationalRoots.reduce(
      (current, root) => multiplyIntegerPolynomials(current, [-root.numerator, root.denominator]),
      coefficients,
    );
    const record = isolate(polynomial, 'Polynomial:six-roots:1');
    expect(record.polynomialDegree).toBe(6);
    expect(record.interiorDistinctRootCount).toBe(6);
    expect(record.distinctRootCount).toBe(6);
    expect(record.rootMultiplicitySum).toBe(6);
    expect(record.subdivisionNodeCount).toBeGreaterThan(1);
    for (const [index, rootValue] of rationalRoots.entries()) {
      const isolated = record.roots[index];
      if (isolated?.location !== 'interior') throw new TypeError('root must be interior');
      expect(isolated.multiplicity).toBe(1);
      expectInside(rootValue, isolated.isolatingInterval.lower, isolated.isolatingInterval.upper);
      if (index > 0) {
        const previous = record.roots[index - 1];
        if (previous?.location !== 'interior')
          throw new TypeError('previous root must be interior');
        expect(
          compareExactRational(previous.isolatingInterval.upper, isolated.isolatingInterval.lower),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  it('matches 32 deterministic rational-factor oracles including repeats and outside roots', () => {
    const candidates = [
      exactRational(-1n),
      exactRational(0n),
      exactRational(1n, 5n),
      exactRational(1n, 2n),
      exactRational(4n, 5n),
      exactRational(1n),
      exactRational(3n, 2n),
    ];
    let state = 0x9e3779b9;
    const next = () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state;
    };
    for (let caseIndex = 0; caseIndex < 32; caseIndex += 1) {
      const degree = 1 + (next() % 6);
      const selected: ExactRational[] = [];
      let polynomial = [1n];
      for (let factorIndex = 0; factorIndex < degree; factorIndex += 1) {
        const root = candidates[next() % candidates.length];
        if (root === undefined) throw new TypeError('oracle root must exist');
        selected.push(root);
        polynomial = multiplyIntegerPolynomials(polynomial, [-root.numerator, root.denominator]);
      }
      const expected = [
        ...new Set(
          selected
            .filter(
              (root) =>
                compareExactRational(root, exactRational(0n)) >= 0 &&
                compareExactRational(root, exactRational(1n)) <= 0,
            )
            .map((root) => `${root.numerator.toString()}/${root.denominator.toString()}`),
        ),
      ]
        .map((key) => {
          const [numerator, denominator] = key.split('/');
          if (numerator === undefined || denominator === undefined) {
            throw new TypeError('oracle rational key must parse');
          }
          const value = exactRational(BigInt(numerator), BigInt(denominator));
          return {
            value,
            multiplicity: selected.filter(
              (candidate) => compareExactRational(candidate, value) === 0,
            ).length,
          };
        })
        .sort((left, right) => compareExactRational(left.value, right.value));
      const record = isolate(polynomial, `Polynomial:oracle:${String(caseIndex)}`);
      expect(record.distinctRootCount).toBe(expected.length);
      expect(record.rootMultiplicitySum).toBe(
        expected.reduce((sum, root) => sum + root.multiplicity, 0),
      );
      for (const [rootIndex, expectedRoot] of expected.entries()) {
        const actual = record.roots[rootIndex];
        expect(actual?.multiplicity).toBe(expectedRoot.multiplicity);
        if (compareExactRational(expectedRoot.value, exactRational(0n)) === 0) {
          expect(actual?.location).toBe('start');
        } else if (compareExactRational(expectedRoot.value, exactRational(1n)) === 0) {
          expect(actual?.location).toBe('end');
        } else {
          if (actual?.location !== 'interior') throw new TypeError('oracle root must be interior');
          expectInside(
            expectedRoot.value,
            actual.isolatingInterval.lower,
            actual.isolatingInterval.upper,
          );
        }
      }
    }
  });

  it('rejects noncanonical, nonprimitive, oversized, and hostile inputs', () => {
    for (const supplied of [
      input([1n, 0n]),
      input([2n, 2n]),
      input([1n, 1n, 1n, 1n, 1n, 1n, 1n, 1n]),
      { ...input([1n]), scientificClaim: true },
    ]) {
      expect(isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(supplied).ok).toBe(false);
    }

    const sparse = input([1n, 2n]);
    Reflect.deleteProperty(sparse.coefficients, '0');
    expect(isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(sparse).ok).toBe(false);

    let getterCalls = 0;
    const accessor = input([1n]);
    Object.defineProperty(accessor, 'coefficients', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return [1n];
      },
    });
    expect(isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(accessor).ok).toBe(false);
    expect(getterCalls).toBe(0);

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    expect(() =>
      isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(revoked.proxy),
    ).not.toThrow();
  });

  it('deep-freezes exact certificates while retaining all non-collision claims', () => {
    const result = isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(
      input([-3n, 28n, -80n, 64n]),
    );
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('root isolation fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.roots)).toBe(true);
    expect(Object.isFrozen(result.value.roots[0])).toBe(true);
    expect(result.value).toMatchObject({
      completeClosedUnitIntervalCovered: true,
      endpointRootsHandledExactly: true,
      repeatedRootMultiplicitiesIncluded: true,
      squareFreeInteriorRootIsolationIncluded: true,
      disjointRationalIsolatingIntervalsIncluded: true,
      eachInteriorIntervalContainsExactlyOneDistinctRoot: true,
      floatingPointUsed: false,
      collisionClassificationIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
    expect(result.value.maximumSubdivisionDepthUsed).toBeLessThanOrEqual(
      PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxSubdivisionDepth,
    );
  });
});
