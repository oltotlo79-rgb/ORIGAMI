import { describe, expect, it } from 'vitest';

import {
  determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1,
  type PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1,
} from '../../m0f/geometry/primitive-integer-polynomial-algebraic-root-sign.js';
import { compareExactRational, exactRational } from '../../m0f/model/exact-rational.js';

type PolynomialInput = Readonly<{
  polynomialId: string;
  coefficients: readonly bigint[];
}>;

const SQRT_HALF: PolynomialInput = {
  polynomialId: 'sqrt-half',
  coefficients: [-1n, 0n, 2n],
};

function determine(
  definingPolynomial: PolynomialInput,
  definingRootIndex: number,
  queryPolynomial: PolynomialInput,
  evaluationId = 'test-evaluation',
): PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1 {
  const result = determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1({
    evaluationId,
    definingPolynomial,
    definingRootIndex,
    queryPolynomial,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new TypeError('algebraic-root sign fixture must succeed');
  return result.value;
}

describe('primitive integer polynomial exact sign at an algebraic root candidate', () => {
  it('determines positive and negative query signs at alpha = sqrt(1/2)', () => {
    const positive = determine(
      SQRT_HALF,
      0,
      { polynomialId: 'positive-s', coefficients: [0n, 1n] },
      'sqrt-half-positive',
    );
    const negative = determine(
      SQRT_HALF,
      0,
      { polynomialId: 'negative-s', coefficients: [0n, -1n] },
      'sqrt-half-negative',
    );

    for (const [record, expectedSign] of [
      [positive, 1],
      [negative, -1],
    ] as const) {
      expect(record.queryPolynomialSignAtDefiningRoot).toBe(expectedSign);
      expect(record.proofKind).toBe('root-free-isolating-interval-rational-probe');
      expect(record.rationalSignProbe).not.toBeNull();
      expect(record.rationalProbeIsExactDefiningRoot).toBe(false);
      expect(record.queryHasNoRootInDefiningInteriorCertificate).toBe(true);
      expect(record.queryRootClassIndex).toBeNull();
      const definingClass = record.commonRefinement.rootClasses.find(
        (rootClass) => rootClass.rootClassIndex === record.definingRootClassIndex,
      );
      expect(definingClass?.location).toBe('interior');
      if (definingClass?.location !== 'interior' || record.rationalSignProbe === null) {
        throw new TypeError('expected an interior sign certificate and rational probe');
      }
      expect(
        compareExactRational(definingClass.isolatingInterval.lower, record.rationalSignProbe),
      ).toBeLessThan(0);
      expect(
        compareExactRational(record.rationalSignProbe, definingClass.isolatingInterval.upper),
      ).toBeLessThan(0);
    }
    expect(negative.queryIsolation.primitiveIntegerCoefficientsLowToHigh).toEqual([0n, -1n]);
  });

  it('returns zero when a different polynomial shares irrational alpha', () => {
    const record = determine(
      SQRT_HALF,
      0,
      {
        polynomialId: 'sqrt-half-times-s-plus-one',
        coefficients: [-1n, -1n, 2n, 2n],
      },
      'sqrt-half-shared',
    );
    expect(record).toMatchObject({
      queryPolynomialSignAtDefiningRoot: 0,
      proofKind: 'shared-refined-root-class',
      rationalSignProbe: null,
      rationalProbeIsExactDefiningRoot: false,
      queryHasNoRootInDefiningInteriorCertificate: false,
    });
    expect(record.queryRootClassIndex).toBe(record.definingRootClassIndex);
    const rootClass = record.commonRefinement.rootClasses[record.definingRootClassIndex];
    expect(rootClass?.memberCount).toBe(2);
    expect(rootClass?.members.map((member) => member.polynomialId)).toEqual([
      'definition',
      'query',
    ]);
    expect(record.definingPolynomialId).toBe('sqrt-half');
    expect(record.queryPolynomialId).toBe('sqrt-half-times-s-plus-one');
  });

  it('binds identical source IDs to distinct internal roles and still detects the shared root', () => {
    const record = determine(
      SQRT_HALF,
      0,
      { polynomialId: 'sqrt-half', coefficients: [-1n, 0n, 2n] },
      'same-source-id',
    );
    expect(record).toMatchObject({
      definingPolynomialId: 'sqrt-half',
      queryPolynomialId: 'sqrt-half',
      queryPolynomialSignAtDefiningRoot: 0,
      proofKind: 'shared-refined-root-class',
      sourcePolynomialRolesBoundExactly: true,
      commonRefinementUsesInternalRoleIds: true,
    });
    const rootClass = record.commonRefinement.rootClasses[record.definingRootClassIndex];
    expect(rootClass?.members.map((member) => member.polynomialId)).toEqual([
      'definition',
      'query',
    ]);
  });

  it('determines the sign at a rational interior defining root', () => {
    const record = determine(
      { polynomialId: 'one-third', coefficients: [-1n, 3n] },
      0,
      { polynomialId: 'two-thirds-root', coefficients: [-2n, 3n] },
      'rational-interior',
    );
    expect(record).toMatchObject({
      definingRootLocation: 'interior',
      queryPolynomialSignAtDefiningRoot: -1,
      proofKind: 'root-free-isolating-interval-rational-probe',
      rationalProbeIsExactDefiningRoot: false,
      queryHasNoRootInDefiningInteriorCertificate: true,
    });
    expect(record.rationalSignProbe).not.toBeNull();
  });

  it('uses exact substitution for start and end roots', () => {
    const defining = { polynomialId: 'unit-interval-ends', coefficients: [0n, -1n, 1n] };
    const query = { polynomialId: 'midpoint-sign', coefficients: [-1n, 2n] };
    const start = determine(defining, 0, query, 'start-sign');
    const end = determine(defining, 1, query, 'end-sign');

    expect(start).toMatchObject({
      definingRootLocation: 'start',
      queryPolynomialSignAtDefiningRoot: -1,
      proofKind: 'exact-endpoint-substitution',
      rationalSignProbe: exactRational(0n),
      rationalProbeIsExactDefiningRoot: true,
      queryHasNoRootInDefiningInteriorCertificate: false,
    });
    expect(end).toMatchObject({
      definingRootLocation: 'end',
      queryPolynomialSignAtDefiningRoot: 1,
      proofKind: 'exact-endpoint-substitution',
      rationalSignProbe: exactRational(1n),
      rationalProbeIsExactDefiningRoot: true,
      queryHasNoRootInDefiningInteriorCertificate: false,
    });
  });

  it('handles an identically-zero query without creating a discrete query root', () => {
    const record = determine(
      SQRT_HALF,
      0,
      { polynomialId: 'zero-query', coefficients: [0n] },
      'zero-query',
    );
    expect(record).toMatchObject({
      queryPolynomialSignAtDefiningRoot: 0,
      proofKind: 'query-identically-zero',
      queryRootClassIndex: null,
      rationalSignProbe: null,
      rationalProbeIsExactDefiningRoot: false,
      queryHasNoRootInDefiningInteriorCertificate: false,
    });
    expect(record.queryIsolation.rootSetKind).toBe('entire-unit-interval');
    expect(record.commonRefinement.persistentPolynomials).toEqual([
      { polynomialIndex: 1, polynomialId: 'query', rootSetKind: 'entire-unit-interval' },
    ]);
    expect(record.queryPolynomialId).toBe('zero-query');
  });

  it('selects a repeated defining root exactly and retains its multiplicity', () => {
    const record = determine(
      { polynomialId: 'double-one-third', coefficients: [1n, -6n, 9n] },
      0,
      { polynomialId: 'positive-s', coefficients: [0n, 1n] },
      'repeated-defining-root',
    );
    expect(record).toMatchObject({
      definingRootIndex: 0,
      definingRootLocation: 'interior',
      definingRootMultiplicity: 2,
      queryPolynomialSignAtDefiningRoot: 1,
      definingRootSelectedExactly: true,
    });
    expect(record.definingRoot.multiplicity).toBe(2);
  });

  it('rejects invalid root indices, a persistent defining polynomial, and non-closed input', () => {
    const validBase = {
      evaluationId: 'bad-evaluation',
      definingPolynomial: SQRT_HALF,
      definingRootIndex: 0,
      queryPolynomial: { polynomialId: 'query', coefficients: [1n] },
    };
    const accessor = Object.defineProperty(
      {
        definingPolynomial: SQRT_HALF,
        definingRootIndex: 0,
        queryPolynomial: { polynomialId: 'query', coefficients: [1n] },
      },
      'evaluationId',
      { enumerable: true, get: () => 'accessor' },
    );
    const cases: readonly Readonly<{ supplied: unknown; code: string; stage: string }>[] = [
      {
        supplied: { ...validBase, definingRootIndex: -1 },
        code: 'invalid-defining-root-index',
        stage: 'input',
      },
      {
        supplied: { ...validBase, definingRootIndex: 1 },
        code: 'defining-root-index-out-of-range',
        stage: 'root-selection',
      },
      {
        supplied: {
          ...validBase,
          definingPolynomial: { polynomialId: 'zero-definition', coefficients: [0n] },
        },
        code: 'persistent-defining-root-set',
        stage: 'root-selection',
      },
      {
        supplied: { ...validBase, extra: true },
        code: 'expected-closed-object',
        stage: 'input',
      },
      { supplied: accessor, code: 'data-property-required', stage: 'input' },
    ];

    for (const testCase of cases) {
      const result = determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1(testCase.supplied);
      expect(result.ok).toBe(false);
      if (result.ok) throw new TypeError(`expected rejection ${testCase.code}`);
      expect(result.error).toContainEqual(
        expect.objectContaining({ code: testCase.code, stage: testCase.stage }),
      );
      expect(Object.isFrozen(result)).toBe(true);
    }
  });

  it('deep-freezes its exact evidence and keeps every downstream claim false', () => {
    const result = determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1({
      evaluationId: 'frozen-sign',
      definingPolynomial: SQRT_HALF,
      definingRootIndex: 0,
      queryPolynomial: { polynomialId: 'positive-s', coefficients: [0n, 1n] },
    });
    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new TypeError('algebraic-root sign fixture must succeed');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.definingRoot)).toBe(true);
    expect(Object.isFrozen(result.value.commonRefinement)).toBe(true);
    expect(Object.isFrozen(result.value.commonRefinement.rootClasses)).toBe(true);
    expect(result.value).toMatchObject({
      recordType: 'm0f-primitive-integer-polynomial-algebraic-root-sign',
      contractStatus: 'candidate-no-claim',
      definingRootSelectedExactly: true,
      queryPolynomialIsolatedExactly: true,
      crossPolynomialCommonRefinementUsed: true,
      algebraicSignDeterminedExactly: true,
      sourcePolynomialRolesBoundExactly: true,
      commonRefinementUsesInternalRoleIds: true,
      floatingPointUsed: false,
      geometryClassificationIncluded: false,
      featureContainmentIncluded: false,
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
});
