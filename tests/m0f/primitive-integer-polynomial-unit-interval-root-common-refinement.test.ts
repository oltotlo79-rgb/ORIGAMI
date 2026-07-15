import { describe, expect, it } from 'vitest';

import {
  refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  type PrimitiveIntegerPolynomialCommonRootClassV1,
  type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
} from '../../m0f/geometry/primitive-integer-polynomial-unit-interval-root-common-refinement.js';
import {
  compareExactRational,
  exactRational,
  type ExactRational,
} from '../../m0f/model/exact-rational.js';

type PolynomialInput = Readonly<{
  polynomialId: string;
  coefficients: readonly bigint[];
}>;

const THIRD = exactRational(1n, 3n);
const TWO_THIRDS = exactRational(2n, 3n);

function refine(
  polynomials: readonly PolynomialInput[],
  refinementId = 'test-refinement',
): PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1 {
  const result = refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1({
    refinementId,
    polynomials,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('common-refinement fixture must succeed');
  return result.value;
}

function interiorClasses(
  record: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
): readonly Extract<PrimitiveIntegerPolynomialCommonRootClassV1, { location: 'interior' }>[] {
  return record.rootClasses.filter(
    (
      rootClass,
    ): rootClass is Extract<
      PrimitiveIntegerPolynomialCommonRootClassV1,
      { location: 'interior' }
    > => rootClass.location === 'interior',
  );
}

function intervalContains(
  interval: Readonly<{ lower: ExactRational; upper: ExactRational }>,
  value: ExactRational,
): boolean {
  return (
    compareExactRational(interval.lower, value) < 0 &&
    compareExactRational(value, interval.upper) < 0
  );
}

function classAt(
  classes: readonly Extract<
    PrimitiveIntegerPolynomialCommonRootClassV1,
    { location: 'interior' }
  >[],
  index: number,
): Extract<PrimitiveIntegerPolynomialCommonRootClassV1, { location: 'interior' }> {
  const rootClass = classes[index];
  if (rootClass === undefined) throw new TypeError(`missing interior root class ${String(index)}`);
  return rootClass;
}

function normalizedClasses(
  record: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
): readonly unknown[] {
  return record.rootClasses.map((rootClass) => ({
    location: rootClass.location,
    members: rootClass.members
      .map(
        (member) =>
          `${member.polynomialId}:${String(member.rootIndex)}:${String(member.multiplicity)}`,
      )
      .sort(),
  }));
}

describe('primitive integer polynomial exact unit-interval root common refinement candidate', () => {
  it('strictly orders distinct roots whose independent initial intervals both equal (0,1)', () => {
    const record = refine([
      { polynomialId: 'third', coefficients: [-1n, 3n] },
      { polynomialId: 'two-thirds', coefficients: [-2n, 3n] },
    ]);
    for (const isolation of record.isolations) {
      const root = isolation.roots[0];
      expect(root?.location).toBe('interior');
      if (root?.location !== 'interior') throw new TypeError('expected one interior root');
      expect(root.isolatingInterval.lower).toEqual(exactRational(0n));
      expect(root.isolatingInterval.upper).toEqual(exactRational(1n));
    }

    const classes = interiorClasses(record);
    expect(classes).toHaveLength(2);
    const first = classAt(classes, 0);
    const second = classAt(classes, 1);
    expect(first.members.map((member) => member.polynomialId)).toEqual(['third']);
    expect(second.members.map((member) => member.polynomialId)).toEqual(['two-thirds']);
    expect(intervalContains(first.isolatingInterval, THIRD)).toBe(true);
    expect(intervalContains(second.isolatingInterval, TWO_THIRDS)).toBe(true);
    expect(
      compareExactRational(first.isolatingInterval.upper, second.isolatingInterval.lower),
    ).toBeLessThanOrEqual(0);
    expect(record.additionalRefinementStepCount).toBeGreaterThan(0);
  });

  it('merges a shared rational root across different polynomials and retains multiplicities', () => {
    const record = refine([
      { polynomialId: 'third', coefficients: [-1n, 3n] },
      { polynomialId: 'third-times-s-plus-one', coefficients: [-1n, 2n, 3n] },
      { polynomialId: 'third-double', coefficients: [1n, -6n, 9n] },
    ]);
    const classes = interiorClasses(record);
    expect(classes).toHaveLength(1);
    const rootClass = classAt(classes, 0);
    expect(rootClass).toMatchObject({
      memberCount: 3,
      simultaneousAcrossPolynomials: true,
    });
    expect(intervalContains(rootClass.isolatingInterval, THIRD)).toBe(true);
    expect(rootClass.members.map((member) => [member.polynomialId, member.multiplicity])).toEqual([
      ['third', 1],
      ['third-times-s-plus-one', 1],
      ['third-double', 2],
    ]);
    expect(record.finiteRootOccurrenceCountBeforeMerge).toBe(3);
    expect(record.distinctFiniteRootClassCountAfterMerge).toBe(1);
    expect(record.simultaneousRootClassCount).toBe(1);
  });

  it('proves a shared irrational root by polynomial gcd and Sturm intersection', () => {
    const record = refine([
      { polynomialId: 'sqrt-half', coefficients: [-1n, 0n, 2n] },
      { polynomialId: 'sqrt-half-times-s-plus-one', coefficients: [-1n, -1n, 2n, 2n] },
    ]);
    const classes = interiorClasses(record);
    expect(classes).toHaveLength(1);
    const rootClass = classAt(classes, 0);
    expect(rootClass.members.map((member) => member.polynomialId)).toEqual([
      'sqrt-half',
      'sqrt-half-times-s-plus-one',
    ]);
    const interval = rootClass.isolatingInterval;
    const polynomialNumeratorAt = (value: ExactRational): bigint =>
      2n * value.numerator * value.numerator - value.denominator * value.denominator;
    expect(polynomialNumeratorAt(interval.lower)).toBeLessThan(0n);
    expect(polynomialNumeratorAt(interval.upper)).toBeGreaterThan(0n);
    expect(record.crossPolynomialRootIdentityProvedByGcdAndSturm).toBe(true);
  });

  it('merges exact endpoints separately and preserves their repeated multiplicities', () => {
    const record = refine([
      { polynomialId: 'simple-ends', coefficients: [0n, -1n, 1n] },
      { polynomialId: 'repeated-ends', coefficients: [0n, 0n, -1n, 3n, -3n, 1n] },
    ]);
    expect(record.rootClasses).toHaveLength(2);
    expect(record.rootClasses[0]).toMatchObject({
      location: 'start',
      exactRoot: exactRational(0n),
      memberCount: 2,
      members: [
        expect.objectContaining({ polynomialId: 'simple-ends', multiplicity: 1 }),
        expect.objectContaining({ polynomialId: 'repeated-ends', multiplicity: 2 }),
      ],
    });
    expect(record.rootClasses[1]).toMatchObject({
      location: 'end',
      exactRoot: exactRational(1n),
      memberCount: 2,
      members: [
        expect.objectContaining({ polynomialId: 'simple-ends', multiplicity: 1 }),
        expect.objectContaining({ polynomialId: 'repeated-ends', multiplicity: 3 }),
      ],
    });
    expect(record).toMatchObject({
      startRootClassCount: 1,
      interiorRootClassCount: 0,
      endRootClassCount: 1,
      simultaneousRootClassCount: 2,
    });
  });

  it('keeps an identically-zero polynomial outside the discrete root classes', () => {
    const record = refine([
      { polynomialId: 'persistent-zero', coefficients: [0n] },
      { polynomialId: 'nonzero-constant', coefficients: [1n] },
      { polynomialId: 'third', coefficients: [-1n, 3n] },
    ]);
    expect(record).toMatchObject({
      polynomialCount: 3,
      persistentPolynomialCount: 1,
      finiteRootSetPolynomialCount: 2,
      finiteRootOccurrenceCountBeforeMerge: 1,
      distinctFiniteRootClassCountAfterMerge: 1,
      persistentZeroPolynomialsExcludedFromDiscreteRootClasses: true,
    });
    expect(record.persistentPolynomials).toEqual([
      { polynomialIndex: 0, polynomialId: 'persistent-zero', rootSetKind: 'entire-unit-interval' },
    ]);
    expect(
      record.rootClasses.flatMap((rootClass) =>
        rootClass.members.map((member) => member.polynomialId),
      ),
    ).toEqual(['third']);
  });

  it('emits a complete ordered ledger with replayable counters', () => {
    const record = refine([
      { polynomialId: 'persistent-zero', coefficients: [0n] },
      { polynomialId: 'third', coefficients: [-1n, 3n] },
      { polynomialId: 'third-product', coefficients: [-1n, 2n, 3n] },
      { polynomialId: 'third-double', coefficients: [1n, -6n, 9n] },
      { polynomialId: 'two-thirds', coefficients: [-2n, 3n] },
      { polynomialId: 'sqrt-half', coefficients: [-1n, 0n, 2n] },
      { polynomialId: 'sqrt-half-product', coefficients: [-1n, -1n, 2n, 2n] },
      { polynomialId: 'ends', coefficients: [0n, -1n, 1n] },
    ]);
    expect(record.rootClasses.map((rootClass) => rootClass.location)).toEqual([
      'start',
      'interior',
      'interior',
      'interior',
      'end',
    ]);
    expect(record.rootClasses.map((rootClass) => rootClass.rootClassIndex)).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect(record.finiteRootOccurrenceCountBeforeMerge).toBe(
      record.isolations.reduce(
        (count, isolation) =>
          count + (isolation.rootSetKind === 'finite' ? isolation.roots.length : 0),
        0,
      ),
    );
    expect(record.distinctFiniteRootClassCountAfterMerge).toBe(record.rootClasses.length);
    expect(record.interiorRootClassCount).toBe(interiorClasses(record).length);
    expect(record.simultaneousRootClassCount).toBe(
      record.rootClasses.filter((rootClass) => rootClass.simultaneousAcrossPolynomials).length,
    );
    expect(record.rootClasses.reduce((sum, rootClass) => sum + rootClass.memberCount, 0)).toBe(
      record.finiteRootOccurrenceCountBeforeMerge,
    );
  });

  it('deep-freezes its evidence and leaves all downstream claims false', () => {
    const result = refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1({
      refinementId: 'frozen',
      polynomials: [{ polynomialId: 'third', coefficients: [-1n, 3n] }],
    });
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('common-refinement fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.rootClasses)).toBe(true);
    expect(Object.isFrozen(result.value.rootClasses[0])).toBe(true);
    expect(Object.isFrozen(result.value.rootClasses[0]?.members)).toBe(true);
    expect(Object.isFrozen(result.value.isolations)).toBe(true);
    expect(result.value).toMatchObject({
      contractStatus: 'candidate-no-claim',
      everyInputPolynomialIsolatedOnClosedUnitInterval: true,
      everyFiniteRootOccurrenceAssignedExactlyOnce: true,
      simultaneousCrossPolynomialRootsMergedExactly: true,
      distinctRootClassesStrictlyOrdered: true,
      pairwiseDisjointInteriorClassIntervals: true,
      floatingPointUsed: false,
      globalOpenCellPartitionIncluded: false,
      geometryClassificationIncluded: false,
      collisionClassificationIncluded: false,
      continuousCollisionDetectionIncluded: false,
      collisionFreeClaim: false,
      isSupportProfile: false,
      supportClaim: false,
      verifiedClaim: false,
      scientificClaim: false,
      globalM0fGo: false,
    });
  });

  it('rejects non-closed, accessor-bearing, sparse, duplicate-ID, and invalid polynomial input', () => {
    const withExtraRootKey = {
      refinementId: 'bad',
      polynomials: [],
      extra: true,
    };
    const accessorInput = Object.defineProperty({ polynomials: [] }, 'refinementId', {
      enumerable: true,
      get: () => 'bad',
    });
    const sparsePolynomials: unknown[] = [];
    sparsePolynomials.length = 2;
    sparsePolynomials[0] = { polynomialId: 'only', coefficients: [1n] };
    const cases: readonly Readonly<{ supplied: unknown; code: string }>[] = [
      { supplied: null, code: 'expected-object' },
      { supplied: withExtraRootKey, code: 'expected-closed-object' },
      { supplied: accessorInput, code: 'data-property-required' },
      {
        supplied: { refinementId: 'bad', polynomials: sparsePolynomials },
        code: 'data-entry-required',
      },
      {
        supplied: {
          refinementId: 'bad',
          polynomials: [
            { polynomialId: 'same', coefficients: [1n] },
            { polynomialId: 'same', coefficients: [-1n, 2n] },
          ],
        },
        code: 'duplicate-polynomial-id',
      },
      {
        supplied: {
          refinementId: 'bad',
          polynomials: [{ polynomialId: 'bad-poly', coefficients: [2n, 2n] }],
        },
        code: 'nonprimitive-polynomial',
      },
    ];
    for (const testCase of cases) {
      const result = refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(testCase.supplied);
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError(`input expected to fail with ${testCase.code}`);
      expect(result.error).toContainEqual(expect.objectContaining({ code: testCase.code }));
      expect(Object.isFrozen(result)).toBe(true);
    }
  });

  it('preserves the exact class order and membership when polynomial input order is reversed', () => {
    const polynomials: readonly PolynomialInput[] = [
      { polynomialId: 'third', coefficients: [-1n, 3n] },
      { polynomialId: 'third-product', coefficients: [-1n, 2n, 3n] },
      { polynomialId: 'two-thirds', coefficients: [-2n, 3n] },
      { polynomialId: 'sqrt-half', coefficients: [-1n, 0n, 2n] },
      { polynomialId: 'sqrt-half-product', coefficients: [-1n, -1n, 2n, 2n] },
      { polynomialId: 'ends', coefficients: [0n, -1n, 1n] },
      { polynomialId: 'persistent-zero', coefficients: [0n] },
    ];
    const forward = refine(polynomials, 'forward');
    const reversed = refine([...polynomials].reverse(), 'reversed');
    expect(normalizedClasses(reversed)).toEqual(normalizedClasses(forward));
    expect(reversed.rootClasses.map((rootClass) => rootClass.location)).toEqual(
      forward.rootClasses.map((rootClass) => rootClass.location),
    );
    expect(reversed).toMatchObject({
      persistentPolynomialCount: forward.persistentPolynomialCount,
      finiteRootOccurrenceCountBeforeMerge: forward.finiteRootOccurrenceCountBeforeMerge,
      distinctFiniteRootClassCountAfterMerge: forward.distinctFiniteRootClassCountAfterMerge,
      simultaneousRootClassCount: forward.simultaneousRootClassCount,
    });
  });
});
