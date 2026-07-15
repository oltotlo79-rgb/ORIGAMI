import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS,
  computeAffineOriginRotationSweptAabbCensusV1,
  parseAffineOriginRotationSweptAabbCensusInputV1,
  type AffineOriginRotationSweptAabbCensusPairV1,
  type AffineOriginRotationSweptAabbCensusRecordV1,
} from '../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js';
import {
  AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  type AffineOriginRotationSweptAabbResultV1,
  type AffineOriginRotationTrianglePrimitiveV1,
  type CanonicalDyadicTimeSlabV1,
  type ExactRationalAabb3V1,
} from '../../m0f/geometry/affine-origin-rotation-swept-aabb.js';
import {
  canonicalProjectivePoint3,
  type ProjectivePoint3,
} from '../../m0f/reference-verifier/projective-rational-3d.js';

function point(x: bigint | number, y: bigint | number, z: bigint | number): ProjectivePoint3 {
  return canonicalProjectivePoint3(BigInt(x), BigInt(y), BigInt(z), 1n);
}

const LOCAL_TRIANGLE = [point(0, 0, 0), point(1, 0, 0), point(0, 1, 0)] as const;
const SLAB: CanonicalDyadicTimeSlabV1 = {
  t0: { numerator: 0n, exponent: 0 },
  t1: { numerator: 1n, exponent: 0 },
};

function primitive(id: string, x: bigint | number): AffineOriginRotationTrianglePrimitiveV1 {
  const origin = point(x, 0, 0);
  return { id, localVertices: LOCAL_TRIANGLE, q0: origin, q1: origin };
}

function input(
  primitives: readonly AffineOriginRotationTrianglePrimitiveV1[],
  motionFamily: string = AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
  slab: CanonicalDyadicTimeSlabV1 = SLAB,
) {
  return { motionFamily, slab, primitives };
}

function census(
  primitives: readonly AffineOriginRotationTrianglePrimitiveV1[],
  motionFamily: string = AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
): AffineOriginRotationSweptAabbCensusRecordV1 {
  const result = computeAffineOriginRotationSweptAabbCensusV1(input(primitives, motionFamily));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('fixture census must succeed');
  return result.value;
}

function pair(
  record: AffineOriginRotationSweptAabbCensusRecordV1,
  firstId: string,
  secondId: string,
): AffineOriginRotationSweptAabbCensusPairV1 {
  const found = record.pairs.find(
    (entry) => entry.firstPrimitiveId === firstId && entry.secondPrimitiveId === secondId,
  );
  if (found === undefined) throw new TypeError('fixture pair must exist');
  return found;
}

function pairKey(firstId: string, secondId: string): string {
  return `${firstId}\u0000${secondId}`;
}

const ORACLE_AXES = ['x', 'y', 'z'] as const;
type OracleAxis = (typeof ORACLE_AXES)[number];
type IntegerInterval = Readonly<{ min: bigint; max: bigint }>;
type IntegerAabb = Readonly<Record<OracleAxis, IntegerInterval>>;
type OraclePair =
  | Readonly<{
      status: 'separated-by-certified-swept-aabb';
      axis: OracleAxis;
      order: 'a-before-b' | 'b-before-a';
      beforePrimitiveId: string;
      afterPrimitiveId: string;
      strictGap: bigint;
    }>
  | Readonly<{ status: 'swept-aabb-overlap-candidate' }>;

function absoluteBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function integerCoordinate(pointValue: ProjectivePoint3, axis: OracleAxis): bigint {
  if (pointValue.w !== 1n) throw new TypeError('integer oracle fixtures require unit weights');
  return pointValue[axis];
}

function integerOracleAabb(primitiveValue: AffineOriginRotationTrianglePrimitiveV1): IntegerAabb {
  const radius = primitiveValue.localVertices.reduce((largest, vertex) => {
    if (vertex.w !== 1n) throw new TypeError('integer oracle fixtures require unit weights');
    const candidate =
      absoluteBigInt(vertex.x) + absoluteBigInt(vertex.y) + absoluteBigInt(vertex.z);
    return candidate > largest ? candidate : largest;
  }, 0n);
  const intervalFor = (axis: OracleAxis): IntegerInterval => {
    const q0 = integerCoordinate(primitiveValue.q0, axis);
    const q1 = integerCoordinate(primitiveValue.q1, axis);
    return {
      min: (q0 < q1 ? q0 : q1) - radius,
      max: (q0 > q1 ? q0 : q1) + radius,
    };
  };
  return { x: intervalFor('x'), y: intervalFor('y'), z: intervalFor('z') };
}

function integerOraclePair(
  first: AffineOriginRotationTrianglePrimitiveV1,
  second: AffineOriginRotationTrianglePrimitiveV1,
): OraclePair {
  const firstAabb = integerOracleAabb(first);
  const secondAabb = integerOracleAabb(second);
  for (const axis of ORACLE_AXES) {
    if (firstAabb[axis].max < secondAabb[axis].min) {
      return {
        status: 'separated-by-certified-swept-aabb',
        axis,
        order: 'a-before-b',
        beforePrimitiveId: first.id,
        afterPrimitiveId: second.id,
        strictGap: secondAabb[axis].min - firstAabb[axis].max,
      };
    }
    if (secondAabb[axis].max < firstAabb[axis].min) {
      return {
        status: 'separated-by-certified-swept-aabb',
        axis,
        order: 'b-before-a',
        beforePrimitiveId: second.id,
        afterPrimitiveId: first.id,
        strictGap: firstAabb[axis].min - secondAabb[axis].max,
      };
    }
  }
  return { status: 'swept-aabb-overlap-candidate' };
}

function expectAabbToMatchIntegerOracle(actual: ExactRationalAabb3V1, expected: IntegerAabb): void {
  for (const axis of ORACLE_AXES) {
    expect(actual[axis].min).toEqual({ numerator: expected[axis].min, denominator: 1n });
    expect(actual[axis].max).toEqual({ numerator: expected[axis].max, denominator: 1n });
  }
}

function makeGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
}

function randomIntegerPrimitive(
  id: string,
  next: () => number,
): AffineOriginRotationTrianglePrimitiveV1 {
  const firstSpan = 1 + (next() % 4);
  const secondSpan = 1 + (next() % 4);
  const firstLift = (next() % 3) - 1;
  const secondLift = (next() % 3) - 1;
  const q0x = (next() % 41) - 20;
  const q0y = (next() % 41) - 20;
  const q0z = (next() % 41) - 20;
  const q1x = q0x + ((next() % 7) - 3);
  const q1y = q0y + ((next() % 7) - 3);
  const q1z = q0z + ((next() % 7) - 3);
  return {
    id,
    localVertices: [
      point(0, 0, 0),
      point(firstSpan, 0, firstLift),
      point(0, secondSpan, secondLift),
    ],
    q0: point(q0x, q0y, q0z),
    q1: point(q1x, q1y, q1z),
  };
}

type PairClassifierModuleForMock = Record<string, unknown> &
  Readonly<{
    classifyAffineOriginRotationSweptAabbV1: (
      supplied: unknown,
    ) => AffineOriginRotationSweptAabbResultV1;
  }>;

describe('affine-origin arbitrary-SO3 swept AABB bounded census', () => {
  it('publishes frozen 64 primitive, 2016 pair, and bounded issue ceilings', () => {
    expect(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS).toEqual({
      maxPrimitives: 64,
      maxPairs: 2_016,
      maxIssues: 512,
      maxOwnPropertiesPerContainer: 8,
      maxDiagnosticPathSegmentLength: 128,
    });
    expect(Object.isFrozen(AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS)).toBe(true);
  });

  it('completely enumerates empty and singleton bounded sets without inventing pairs', () => {
    const empty = census([]);
    expect(empty).toMatchObject({
      primitiveCount: 0,
      unorderedPairCount: 0,
      separatedPairCount: 0,
      candidatePairCount: 0,
      indeterminatePairCount: 0,
      completePairEnumeration: true,
      completePairEnumerationScope: 'accepted-bounded-input-only',
    });
    expect(empty.pairs).toEqual([]);

    const singleton = census([primitive('census-validation-sentinel-a', 0)]);
    expect(singleton.primitiveIds).toEqual(['census-validation-sentinel-a']);
    expect(singleton.primitiveCount).toBe(1);
    expect(singleton.unorderedPairCount).toBe(0);
    expect(singleton.pairs).toEqual([]);
  });

  it('records every separated and overlap-candidate pair exactly once with evidence', () => {
    const record = census([primitive('c', 2), primitive('a', 0), primitive('b', 4)]);
    expect(record.primitiveIds).toEqual(['a', 'b', 'c']);
    expect(record.unorderedPairCount).toBe(3);
    expect(record.separatedPairCount).toBe(1);
    expect(record.candidatePairCount).toBe(2);
    expect(record.indeterminatePairCount).toBe(0);
    expect(record.pairs.map((entry) => entry.pairIndex)).toEqual([0, 1, 2]);
    expect(
      record.pairs.map((entry) => pairKey(entry.firstPrimitiveId, entry.secondPrimitiveId)),
    ).toEqual([pairKey('a', 'b'), pairKey('a', 'c'), pairKey('b', 'c')]);

    const separated = pair(record, 'a', 'b');
    expect(separated.status).toBe('separated-by-certified-swept-aabb');
    if (separated.status !== 'separated-by-certified-swept-aabb') {
      throw new TypeError('fixture pair must be strictly separated');
    }
    expect(separated.pairSlabSeparationCertified).toBe(true);
    expect(separated.primitiveBounds.map((entry) => entry.primitiveId)).toEqual(['a', 'b']);
    expect(separated.certificate).toEqual({
      axis: 'x',
      order: 'a-before-b',
      beforePrimitiveId: 'a',
      afterPrimitiveId: 'b',
      strictGap: { numerator: 2n, denominator: 1n },
    });

    const candidate = pair(record, 'a', 'c');
    expect(candidate.status).toBe('swept-aabb-overlap-candidate');
    if (candidate.status !== 'swept-aabb-overlap-candidate') {
      throw new TypeError('boundary-equal boxes must remain candidates');
    }
    expect(candidate.pairSlabSeparationCertified).toBe(false);
    expect(candidate.primitiveBounds.map((entry) => entry.primitiveId)).toEqual(['a', 'c']);
    expect('certificate' in candidate).toBe(false);
  });

  it('retains every unsupported-family indeterminate pair without promotion', () => {
    const record = census(
      [primitive('c', 100), primitive('a', 0), primitive('b', 50)],
      'unsupported-rigid-motion-v1',
    );
    expect(record.motionFamilySupported).toBe(false);
    expect(record.unorderedPairCount).toBe(3);
    expect(record.separatedPairCount).toBe(0);
    expect(record.candidatePairCount).toBe(0);
    expect(record.indeterminatePairCount).toBe(3);
    for (const entry of record.pairs) {
      expect(entry).toMatchObject({
        status: 'indeterminate',
        reason: 'unsupported-motion-family',
        motionFamilySupported: false,
        pairSlabSeparationCertified: false,
      });
    }
    expect(record.indeterminatePromotionIncluded).toBe(false);
  });

  it('is invariant under caller primitive order and uses canonical ID pair order', () => {
    const first = census([primitive('c', 2), primitive('a', 0), primitive('b', 4)]);
    const second = census([primitive('b', 4), primitive('c', 2), primitive('a', 0)]);
    expect(first).toEqual(second);
    expect(first.pairs.every((entry) => entry.firstPrimitiveId < entry.secondPrimitiveId)).toBe(
      true,
    );
  });

  it('enumerates the exact 64C2 = 2016 ceiling once with contiguous pair indexes', () => {
    const primitives = Array.from(
      { length: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPrimitives },
      (_, index) => primitive(`p${String(index).padStart(2, '0')}`, index * 4),
    ).reverse();
    const record = census(primitives);
    expect(record.primitiveCount).toBe(64);
    expect(record.unorderedPairCount).toBe(2_016);
    expect(record.pairs).toHaveLength(2_016);
    expect(record.separatedPairCount).toBe(2_016);
    expect(record.candidatePairCount).toBe(0);
    expect(record.indeterminatePairCount).toBe(0);
    expect(record.pairs[0]).toMatchObject({
      pairIndex: 0,
      firstPrimitiveId: 'p00',
      secondPrimitiveId: 'p01',
    });
    expect(record.pairs[2_015]).toMatchObject({
      pairIndex: 2_015,
      firstPrimitiveId: 'p62',
      secondPrimitiveId: 'p63',
    });
    const keys = new Set(
      record.pairs.map((entry) => pairKey(entry.firstPrimitiveId, entry.secondPrimitiveId)),
    );
    expect(keys.size).toBe(2_016);
    expect(record.pairs.every((entry, index) => entry.pairIndex === index)).toBe(true);
  });

  it('keeps every counter equal to an independent ledger count', () => {
    const supported = census([
      primitive('a', 0),
      primitive('b', 2),
      primitive('c', 5),
      primitive('d', 9),
    ]);
    expect(supported.separatedPairCount).toBe(
      supported.pairs.filter((entry) => entry.status === 'separated-by-certified-swept-aabb')
        .length,
    );
    expect(supported.candidatePairCount).toBe(
      supported.pairs.filter((entry) => entry.status === 'swept-aabb-overlap-candidate').length,
    );
    expect(supported.indeterminatePairCount).toBe(
      supported.pairs.filter((entry) => entry.status === 'indeterminate').length,
    );
    expect(
      supported.separatedPairCount +
        supported.candidatePairCount +
        supported.indeterminatePairCount,
    ).toBe(supported.unorderedPairCount);
  });

  it('matches an independent integer oracle for every pair in random bounded sets', () => {
    let oracleSeparatedPairs = 0;
    let oracleCandidatePairs = 0;
    for (let seed = 1; seed <= 24; seed += 1) {
      const next = makeGenerator(seed);
      const primitiveCount = 2 + (next() % 7);
      const primitives = Array.from({ length: primitiveCount }, (_, index) =>
        randomIntegerPrimitive(`p${String(index).padStart(2, '0')}`, next),
      );
      const canonical = [...primitives].sort((left, right) =>
        left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
      );
      const expectedPairs: Readonly<{
        first: AffineOriginRotationTrianglePrimitiveV1;
        second: AffineOriginRotationTrianglePrimitiveV1;
        oracle: OraclePair;
      }>[] = canonical.flatMap((first, firstIndex) =>
        canonical.slice(firstIndex + 1).map((second) => ({
          first,
          second,
          oracle: integerOraclePair(first, second),
        })),
      );
      const record = census([...primitives].reverse());

      expect(record.primitiveIds).toEqual(canonical.map((entry) => entry.id));
      expect(record.primitiveCount).toBe(primitiveCount);
      expect(record.unorderedPairCount).toBe((primitiveCount * (primitiveCount - 1)) / 2);
      expect(record.pairs).toHaveLength(expectedPairs.length);
      for (const [pairIndex, expected] of expectedPairs.entries()) {
        const actual = record.pairs[pairIndex];
        if (actual === undefined) throw new TypeError('every oracle pair must be present');
        expect(actual).toMatchObject({
          pairIndex,
          firstPrimitiveId: expected.first.id,
          secondPrimitiveId: expected.second.id,
          status: expected.oracle.status,
        });
        if (actual.status === 'indeterminate') {
          throw new TypeError('small supported integer fixtures must be determinate');
        }
        expectAabbToMatchIntegerOracle(
          actual.primitiveBounds[0].aabb,
          integerOracleAabb(expected.first),
        );
        expectAabbToMatchIntegerOracle(
          actual.primitiveBounds[1].aabb,
          integerOracleAabb(expected.second),
        );
        if (expected.oracle.status === 'separated-by-certified-swept-aabb') {
          oracleSeparatedPairs += 1;
          if (actual.status !== 'separated-by-certified-swept-aabb') {
            throw new TypeError('oracle separation must retain its certificate');
          }
          expect(actual.certificate).toEqual({
            axis: expected.oracle.axis,
            order: expected.oracle.order,
            beforePrimitiveId: expected.oracle.beforePrimitiveId,
            afterPrimitiveId: expected.oracle.afterPrimitiveId,
            strictGap: { numerator: expected.oracle.strictGap, denominator: 1n },
          });
        } else {
          oracleCandidatePairs += 1;
          expect(actual.status).toBe('swept-aabb-overlap-candidate');
        }
      }
      const separated = expectedPairs.filter(
        (entry) => entry.oracle.status === 'separated-by-certified-swept-aabb',
      ).length;
      const candidate = expectedPairs.length - separated;
      expect(record.separatedPairCount).toBe(separated);
      expect(record.candidatePairCount).toBe(candidate);
      expect(record.indeterminatePairCount).toBe(0);
      expect(separated + candidate).toBe(record.unorderedPairCount);
    }
    expect(oracleSeparatedPairs).toBeGreaterThan(0);
    expect(oracleCandidatePairs).toBeGreaterThan(0);
  });

  it('atomically rejects duplicate IDs and primitive/pair counts beyond the ceiling', () => {
    const duplicate = computeAffineOriginRotationSweptAabbCensusV1(
      input([primitive('same', 0), primitive('same', 4)]),
    );
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new TypeError('duplicate IDs must fail');
    expect(duplicate.error).toContainEqual(expect.objectContaining({ code: 'duplicate-id' }));

    const invalidBeforeDuplicate = parseAffineOriginRotationSweptAabbCensusInputV1(
      input([
        { ...primitive('invalid', 0), id: 'not a stable id' },
        primitive('same', 4),
        primitive('same', 8),
      ]),
    );
    expect(invalidBeforeDuplicate.ok).toBe(false);
    if (invalidBeforeDuplicate.ok) throw new TypeError('invalid and duplicate IDs must fail');
    expect(invalidBeforeDuplicate.error).toContainEqual(
      expect.objectContaining({
        path: '$.primitives[2].id',
        code: 'duplicate-id',
        message: 'primitive ID duplicates $.primitives[1].id',
      }),
    );

    const overLimit = computeAffineOriginRotationSweptAabbCensusV1(
      input(
        Array.from(
          { length: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxPrimitives + 1 },
          (_, index) => primitive(`p${String(index).padStart(2, '0')}`, index * 4),
        ),
      ),
    );
    expect(overLimit.ok).toBe(false);
    if (overLimit.ok) throw new TypeError('over-limit set must fail');
    expect(overLimit.error).toContainEqual(
      expect.objectContaining({ code: 'primitive-count-limit-exceeded' }),
    );
    expect(overLimit.error).toContainEqual(
      expect.objectContaining({ code: 'pair-count-limit-exceeded' }),
    );
    expect(JSON.stringify(overLimit)).not.toContain('pairIndex');
  });

  it('rejects sparse, unknown, malformed, and noncanonical primitive data atomically', () => {
    const sparse = new Array<unknown>(2);
    sparse[0] = primitive('a', 0);
    const withUnknown = { ...input([primitive('a', 0)]), surprise: true };
    const noncanonical = {
      id: 'bad',
      localVertices: LOCAL_TRIANGLE,
      q0: { x: 2n, y: 0n, z: 0n, w: 2n },
      q1: point(0, 0, 0),
    };

    for (const [supplied, expectedCode, sourceCode] of [
      [
        input(sparse as readonly AffineOriginRotationTrianglePrimitiveV1[]),
        'missing-property',
        undefined,
      ],
      [withUnknown, 'unknown-property', undefined],
      [input([noncanonical]), 'invalid-primitive', 'noncanonical-point'],
    ] as const) {
      const result = computeAffineOriginRotationSweptAabbCensusV1(supplied);
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('invalid census input must fail');
      expect(result.error).toContainEqual(
        expect.objectContaining(
          sourceCode === undefined ? { code: expectedCode } : { code: expectedCode, sourceCode },
        ),
      );
      expect(result.error.length).toBeLessThanOrEqual(
        AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxIssues,
      );
      expect('value' in result).toBe(false);
    }
  });

  it('never invokes accessors and handles revoked, __proto__, and huge-symbol input safely', () => {
    let calls = 0;
    const accessor = {
      motionFamily: AFFINE_ORIGIN_ROTATION_SWEPT_AABB_MOTION_FAMILY_V1,
      slab: SLAB,
      get primitives() {
        calls += 1;
        return [];
      },
    };
    const accessorResult = parseAffineOriginRotationSweptAabbCensusInputV1(accessor);
    expect(accessorResult.ok).toBe(false);
    expect(calls).toBe(0);

    const revocable = Proxy.revocable({}, {});
    revocable.revoke();
    const revoked = parseAffineOriginRotationSweptAabbCensusInputV1(revocable.proxy);
    expect(revoked.ok).toBe(false);
    if (revoked.ok) throw new TypeError('revoked root must fail');
    expect(revoked.error).toContainEqual(expect.objectContaining({ code: 'inspection-failed' }));

    const protoInput = { ...input([]) };
    Object.defineProperty(protoInput, '__proto__', {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
    });
    const protoResult = parseAffineOriginRotationSweptAabbCensusInputV1(protoInput);
    expect(protoResult.ok).toBe(false);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    if (protoResult.ok) throw new TypeError('__proto__ must remain an unknown key');
    expect(protoResult.error).toContainEqual(
      expect.objectContaining({ path: '$.__proto__', code: 'unknown-property' }),
    );

    const symbol = Symbol('z'.repeat(100_000));
    const symbolInput: Record<PropertyKey, unknown> = { ...input([]) };
    symbolInput[symbol] = true;
    const symbolResult = parseAffineOriginRotationSweptAabbCensusInputV1(symbolInput);
    expect(symbolResult.ok).toBe(false);
    if (symbolResult.ok) throw new TypeError('symbol key must fail');
    const symbolIssue = symbolResult.error.find((entry) => entry.code === 'unknown-property');
    expect(symbolIssue?.path.length).toBe(
      AFFINE_ORIGIN_ROTATION_SWEPT_AABB_CENSUS_LIMITS.maxDiagnosticPathSegmentLength + 2,
    );
    expect(symbolIssue?.path.endsWith('…)')).toBe(true);
  });

  it('deeply freezes parser success, census evidence, and bounded errors', () => {
    const parsed = parseAffineOriginRotationSweptAabbCensusInputV1(
      input([primitive('b', 4), primitive('a', 0)]),
    );
    expect(parsed.ok).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (!parsed.ok) throw new TypeError('valid fixture must parse');
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives)).toBe(true);
    expect(Object.isFrozen(parsed.value.primitives[0])).toBe(true);

    const record = census([primitive('a', 0), primitive('b', 4)]);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.primitiveIds)).toBe(true);
    expect(Object.isFrozen(record.pairs)).toBe(true);
    expect(Object.isFrozen(record.pairs[0])).toBe(true);
    const firstPair = record.pairs[0];
    if (firstPair?.status !== 'separated-by-certified-swept-aabb') {
      throw new TypeError('fixture evidence must be separated');
    }
    expect(Object.isFrozen(firstPair.primitiveBounds)).toBe(true);
    expect(Object.isFrozen(firstPair.primitiveBounds[0].aabb.x.min)).toBe(true);
    expect(Object.isFrozen(firstPair.certificate)).toBe(true);

    const invalid = parseAffineOriginRotationSweptAabbCensusInputV1(undefined);
    expect(invalid.ok).toBe(false);
    expect(Object.isFrozen(invalid)).toBe(true);
    if (invalid.ok) throw new TypeError('undefined must fail');
    expect(Object.isFrozen(invalid.error)).toBe(true);
    expect(invalid.error.every((entry) => Object.isFrozen(entry))).toBe(true);
  });

  it('limits completePairEnumeration to the accepted input and keeps every product claim false', () => {
    const record = census([primitive('a', 0), primitive('b', 4)]);
    expect(record).toMatchObject({
      contractStatus: 'candidate-no-claim',
      completePairEnumeration: true,
      completePairEnumerationScope: 'accepted-bounded-input-only',
      allUnorderedPairsIncluded: true,
      silentPairExclusionIncluded: false,
      indeterminatePromotionIncluded: false,
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
      isSupportProfile: false,
      supportClaim: false,
    });
  });

  it('atomically fails when the pair classifier throws after a prior pair', async () => {
    vi.resetModules();
    let classifierCalls = 0;
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (supplied: unknown) => {
          classifierCalls += 1;
          if (classifierCalls === 2) throw new Error('injected classifier failure');
          return actual.classifyAffineOriginRotationSweptAabbV1(supplied);
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(
        input([primitive('a', 0), primitive('b', 4), primitive('c', 8)]),
      );
      expect(result.ok).toBe(false);
      expect(classifierCalls).toBe(2);
      if (result.ok) throw new TypeError('classifier exception must reject the full census');
      expect(result.error).toEqual([
        expect.objectContaining({ path: '$.pairs[a,c]', code: 'classifier-failure-invariant' }),
      ]);
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('atomically rejects a no-claim contract deviation from the pair classifier', async () => {
    vi.resetModules();
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (
          supplied: unknown,
        ): AffineOriginRotationSweptAabbResultV1 => {
          const produced = actual.classifyAffineOriginRotationSweptAabbV1(supplied);
          if (!produced.ok) return produced;
          return {
            ok: true,
            value: Object.freeze({ ...produced.value, collisionFreeClaim: true }),
          } as unknown as AffineOriginRotationSweptAabbResultV1;
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(
        input([primitive('a', 0), primitive('b', 4)]),
      );
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('claim drift must reject the full census');
      expect(result.error).toEqual([
        expect.objectContaining({ path: '$.pairs[a,b]', code: 'classifier-failure-invariant' }),
      ]);
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('rejects a classifier that relabels a true overlap candidate as separated', async () => {
    vi.resetModules();
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (
          supplied: unknown,
        ): AffineOriginRotationSweptAabbResultV1 => {
          const produced = actual.classifyAffineOriginRotationSweptAabbV1(supplied);
          if (!produced.ok || produced.value.status !== 'swept-aabb-overlap-candidate') {
            return produced;
          }
          return {
            ok: true,
            value: Object.freeze({
              ...produced.value,
              status: 'separated-by-certified-swept-aabb',
              pairSlabSeparationCertified: true,
              certificate: Object.freeze({
                axis: 'x',
                order: 'a-before-b',
                beforePrimitiveId: 'a',
                afterPrimitiveId: 'b',
                strictGap: Object.freeze({ numerator: 1n, denominator: 1n }),
              }),
            }),
          } as unknown as AffineOriginRotationSweptAabbResultV1;
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(
        input([primitive('a', 0), primitive('b', 2)]),
      );
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('false strict separation must reject the full census');
      expect(result.error).toEqual([
        expect.objectContaining({ path: '$.pairs[a,b]', code: 'classifier-failure-invariant' }),
      ]);
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('rejects a classifier record whose status changes during closed inspection', async () => {
    vi.resetModules();
    let statusDescriptorReads = 0;
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (
          supplied: unknown,
        ): AffineOriginRotationSweptAabbResultV1 => {
          const produced = actual.classifyAffineOriginRotationSweptAabbV1(supplied);
          if (!produced.ok || produced.value.status !== 'swept-aabb-overlap-candidate') {
            return produced;
          }
          const target = { ...produced.value };
          const value = new Proxy(target, {
            getOwnPropertyDescriptor: (proxyTarget, key) => {
              const descriptor = Reflect.getOwnPropertyDescriptor(proxyTarget, key);
              if (key !== 'status' || descriptor === undefined) return descriptor;
              statusDescriptorReads += 1;
              return {
                ...descriptor,
                value:
                  statusDescriptorReads === 1
                    ? 'swept-aabb-overlap-candidate'
                    : 'separated-by-certified-swept-aabb',
              };
            },
          });
          return { ok: true, value } as unknown as AffineOriginRotationSweptAabbResultV1;
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(
        input([primitive('a', 0), primitive('b', 2)]),
      );
      expect(statusDescriptorReads).toBe(2);
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('status drift must reject the full census');
      expect(result.error).toEqual([
        expect.objectContaining({ path: '$.pairs[a,b]', code: 'classifier-failure-invariant' }),
      ]);
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('rejects malformed status-specific dependency keys for every outcome', async () => {
    vi.resetModules();
    type Malformation =
      | 'candidate-extra-certificate'
      | 'separated-missing-certificate'
      | 'indeterminate-extra-bounds';
    let malformation: Malformation = 'candidate-extra-certificate';
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (
          supplied: unknown,
        ): AffineOriginRotationSweptAabbResultV1 => {
          const produced = actual.classifyAffineOriginRotationSweptAabbV1(supplied);
          if (!produced.ok) return produced;
          const malformed: Record<string, unknown> = { ...produced.value };
          if (malformation === 'candidate-extra-certificate') {
            malformed.certificate = {
              axis: 'x',
              order: 'a-before-b',
              beforePrimitiveId: 'a',
              afterPrimitiveId: 'b',
              strictGap: { numerator: 1n, denominator: 1n },
            };
          } else if (malformation === 'separated-missing-certificate') {
            delete malformed.certificate;
          } else {
            malformed.primitiveBounds = [];
          }
          return {
            ok: true,
            value: Object.freeze(malformed),
          } as unknown as AffineOriginRotationSweptAabbResultV1;
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      const cases: readonly Readonly<{
        malformation: Malformation;
        supplied: ReturnType<typeof input>;
      }>[] = [
        {
          malformation: 'candidate-extra-certificate',
          supplied: input([primitive('a', 0), primitive('b', 2)]),
        },
        {
          malformation: 'separated-missing-certificate',
          supplied: input([primitive('a', 0), primitive('b', 4)]),
        },
        {
          malformation: 'indeterminate-extra-bounds',
          supplied: input([primitive('a', 0), primitive('b', 4)], 'unsupported-rigid-motion-v1'),
        },
      ];
      for (const testCase of cases) {
        malformation = testCase.malformation;
        const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(testCase.supplied);
        expect(result.ok).toBe(false);
        if (result.ok) throw new TypeError('malformed status-specific keys must fail');
        expect(result.error).toEqual([
          expect.objectContaining({ path: '$.pairs[a,b]', code: 'classifier-failure-invariant' }),
        ]);
      }
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('atomically rejects canonical but semantically unbound distant bounds and certificate', async () => {
    vi.resetModules();
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (): AffineOriginRotationSweptAabbResultV1 =>
          actual.classifyAffineOriginRotationSweptAabbV1(
            input([primitive('a', 0), primitive('b', 100)]),
          ),
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(
        input([primitive('a', 0), primitive('b', 2)]),
      );
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError('unbound bounds must reject the full census');
      expect(result.error).toEqual([
        expect.objectContaining({ path: '$.pairs[a,b]', code: 'classifier-failure-invariant' }),
      ]);
      expect(JSON.stringify(result)).not.toContain('pairIndex');
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('rejects separated and candidate classifier promotion of an unsupported family', async () => {
    vi.resetModules();
    const unsupportedMotionFamily = 'unsupported-rigid-motion-v1';
    let forgedDistance = 2;
    vi.doMock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js', async (importOriginal) => {
      const actual = await importOriginal<PairClassifierModuleForMock>();
      return {
        ...actual,
        classifyAffineOriginRotationSweptAabbV1: (): AffineOriginRotationSweptAabbResultV1 => {
          const forged = actual.classifyAffineOriginRotationSweptAabbV1(
            input([primitive('a', 0), primitive('b', forgedDistance)]),
          );
          if (!forged.ok) return forged;
          return {
            ok: true,
            value: Object.freeze({
              ...forged.value,
              suppliedMotionFamily: unsupportedMotionFamily,
            }),
          } as AffineOriginRotationSweptAabbResultV1;
        },
      };
    });
    try {
      const isolated =
        await import('../../m0f/geometry/affine-origin-rotation-swept-aabb-census.js');
      for (const distance of [2, 4]) {
        forgedDistance = distance;
        const result = isolated.computeAffineOriginRotationSweptAabbCensusV1(
          input([primitive('a', 0), primitive('b', distance)], unsupportedMotionFamily),
        );
        expect(result.ok).toBe(false);
        if (result.ok) throw new TypeError('unsupported motion must remain indeterminate');
        expect(result.error).toEqual([
          expect.objectContaining({ path: '$.pairs[a,b]', code: 'classifier-failure-invariant' }),
        ]);
      }
    } finally {
      vi.doUnmock('../../m0f/geometry/affine-origin-rotation-swept-aabb.js');
      vi.resetModules();
    }
  });

  it('states that bounded pair completeness is broad-phase evidence, not CCD', async () => {
    const source = await readFile(
      resolve('m0f/geometry/affine-origin-rotation-swept-aabb-census.ts'),
      'utf8',
    );
    expect(source).toContain('accepted-bounded-input-only');
    expect(source).toContain('indeterminate pairs are never promoted');
    expect(source).toContain('SupportProfile');
    expect(source).not.toMatch(/\bMath\.(?:sin|cos)\b/u);
  });
});
