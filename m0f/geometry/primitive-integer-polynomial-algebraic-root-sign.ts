import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  exactRational,
  multiplyExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  type PrimitiveIntegerPolynomialCommonRootClassV1,
  type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
} from './primitive-integer-polynomial-unit-interval-root-common-refinement.js';
import {
  isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS,
  type PrimitiveIntegerPolynomialIsolatedRootV1,
  type PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
} from './primitive-integer-polynomial-unit-interval-root-isolation.js';

export const PRIMITIVE_INTEGER_POLYNOMIAL_ALGEBRAIC_ROOT_SIGN_LIMITS = deepFreezeOwned({
  maxEvaluationIntermediateBits: 2_097_152,
  maxStableIdCodeUnits:
    PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxStableIdCodeUnits,
});

export type PrimitiveIntegerPolynomialAlgebraicRootSignProofKindV1 =
  | 'query-identically-zero'
  | 'shared-refined-root-class'
  | 'exact-endpoint-substitution'
  | 'root-free-isolating-interval-rational-probe';

export type PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-primitive-integer-polynomial-algebraic-root-sign';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-query-polynomial-at-one-isolated-algebraic-root-on-unit-interval';
  arithmetic: 'exact-rational-common-refinement-gcd-sturm-bigint';
  evaluationId: string;
  definingPolynomialId: string;
  definingRootIndex: number;
  definingRootLocation: PrimitiveIntegerPolynomialIsolatedRootV1['location'];
  definingRootMultiplicity: number;
  queryPolynomialId: string;
  queryPolynomialSignAtDefiningRoot: -1 | 0 | 1;
  proofKind: PrimitiveIntegerPolynomialAlgebraicRootSignProofKindV1;
  definingRootClassIndex: number;
  queryRootClassIndex: number | null;
  rationalSignProbe: ExactRational | null;
  rationalProbeIsExactDefiningRoot: boolean;
  queryHasNoRootInDefiningInteriorCertificate: boolean;
  definingRoot: PrimitiveIntegerPolynomialIsolatedRootV1;
  definingIsolation: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1;
  queryIsolation: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1;
  commonRefinement: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1;
  definingRootSelectedExactly: true;
  queryPolynomialIsolatedExactly: true;
  sourcePolynomialRolesBoundExactly: true;
  commonRefinementUsesInternalRoleIds: true;
  crossPolynomialCommonRefinementUsed: true;
  algebraicSignDeterminedExactly: true;
  floatingPointUsed: false;
  geometryClassificationIncluded: false;
  featureContainmentIncluded: false;
  collisionClassificationIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type PrimitiveIntegerPolynomialAlgebraicRootSignIssueV1 = Readonly<{
  stage: 'input' | 'source-isolation' | 'common-refinement' | 'root-selection' | 'sign-evaluation';
  path: string;
  code: string;
  message: string;
}>;

export type PrimitiveIntegerPolynomialAlgebraicRootSignResultV1 =
  | Readonly<{ ok: true; value: PrimitiveIntegerPolynomialAlgebraicRootSignRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly PrimitiveIntegerPolynomialAlgebraicRootSignIssueV1[];
    }>;

type InspectedInput = Readonly<{
  evaluationId: string;
  definingPolynomial: unknown;
  definingRootIndex: number;
  queryPolynomial: unknown;
}>;

const ROOT_KEYS = [
  'evaluationId',
  'definingPolynomial',
  'definingRootIndex',
  'queryPolynomial',
] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const HALF = exactRational(1n, 2n);

function issue(
  stage: PrimitiveIntegerPolynomialAlgebraicRootSignIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): PrimitiveIntegerPolynomialAlgebraicRootSignIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly PrimitiveIntegerPolynomialAlgebraicRootSignIssueV1[],
): PrimitiveIntegerPolynomialAlgebraicRootSignResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function inspectInput(supplied: unknown):
  | Readonly<{ ok: true; value: InspectedInput }>
  | Readonly<{
      ok: false;
      error: readonly PrimitiveIntegerPolynomialAlgebraicRootSignIssueV1[];
    }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return {
        ok: false,
        error: [issue('input', '$', 'expected-object', 'must be one plain object')],
      };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue('input', '$', 'expected-object', 'must be one plain object')],
      };
    }
    const descriptors = Object.getOwnPropertyDescriptors(supplied);
    const ownKeys = Reflect.ownKeys(supplied);
    if (
      ownKeys.some(
        (key) => typeof key !== 'string' || !ROOT_KEYS.some((allowed) => allowed === key),
      ) ||
      ROOT_KEYS.some((key) => !Object.hasOwn(descriptors, key))
    ) {
      return {
        ok: false,
        error: [
          issue('input', '$', 'expected-closed-object', 'must contain exactly the allowed keys'),
        ],
      };
    }
    for (const key of ROOT_KEYS) {
      const descriptor = descriptors[key];
      if (
        descriptor === undefined ||
        !('value' in descriptor) ||
        !descriptor.enumerable ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined
      ) {
        return {
          ok: false,
          error: [
            issue(
              'input',
              `$.${key}`,
              'data-property-required',
              'must be an enumerable data property',
            ),
          ],
        };
      }
    }
    const evaluationId: unknown = descriptors.evaluationId?.value;
    if (
      typeof evaluationId !== 'string' ||
      evaluationId.length >
        PRIMITIVE_INTEGER_POLYNOMIAL_ALGEBRAIC_ROOT_SIGN_LIMITS.maxStableIdCodeUnits ||
      !STABLE_ID_PATTERN.test(evaluationId)
    ) {
      return {
        ok: false,
        error: [issue('input', '$.evaluationId', 'invalid-evaluation-id', 'must be a stable ID')],
      };
    }
    const definingRootIndex: unknown = descriptors.definingRootIndex?.value;
    if (
      typeof definingRootIndex !== 'number' ||
      !Number.isSafeInteger(definingRootIndex) ||
      definingRootIndex < 0 ||
      definingRootIndex > PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxDegree
    ) {
      return {
        ok: false,
        error: [
          issue(
            'input',
            '$.definingRootIndex',
            'invalid-defining-root-index',
            'must be a bounded nonnegative safe integer',
          ),
        ],
      };
    }
    const definingPolynomial: unknown = descriptors.definingPolynomial?.value;
    const queryPolynomial: unknown = descriptors.queryPolynomial?.value;
    return {
      ok: true,
      value: { evaluationId, definingPolynomial, definingRootIndex, queryPolynomial },
    };
  } catch {
    return {
      ok: false,
      error: [issue('input', '$', 'inspection-failed', 'input could not be inspected safely')],
    };
  }
}

function bigintBitLength(value: bigint): number {
  const magnitude = value < 0n ? -value : value;
  return magnitude === 0n ? 0 : magnitude.toString(2).length;
}

function signIntegerPolynomialAtRational(
  coefficients: readonly bigint[],
  value: ExactRational,
): -1 | 0 | 1 {
  let homogeneous = coefficients.at(-1) ?? 0n;
  let denominatorPower = 1n;
  for (let index = coefficients.length - 2; index >= 0; index -= 1) {
    denominatorPower *= value.denominator;
    homogeneous = homogeneous * value.numerator + (coefficients[index] ?? 0n) * denominatorPower;
    if (
      bigintBitLength(denominatorPower) >
        PRIMITIVE_INTEGER_POLYNOMIAL_ALGEBRAIC_ROOT_SIGN_LIMITS.maxEvaluationIntermediateBits ||
      bigintBitLength(homogeneous) >
        PRIMITIVE_INTEGER_POLYNOMIAL_ALGEBRAIC_ROOT_SIGN_LIMITS.maxEvaluationIntermediateBits
    ) {
      throw new RangeError('homogeneous polynomial evaluation bit budget exhausted');
    }
  }
  return homogeneous < 0n ? -1 : homogeneous > 0n ? 1 : 0;
}

function classContaining(
  refinement: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1,
  polynomialIndex: number,
  rootIndex: number,
): PrimitiveIntegerPolynomialCommonRootClassV1 | undefined {
  return refinement.rootClasses.find((rootClass) =>
    rootClass.members.some(
      (member) => member.polynomialIndex === polynomialIndex && member.rootIndex === rootIndex,
    ),
  );
}

function sameBigintArray(left: readonly bigint[], right: readonly bigint[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameIsolationSemantics(
  source: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
  replay: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
): boolean {
  if (
    source.rootSetKind !== replay.rootSetKind ||
    source.polynomialDegree !== replay.polynomialDegree ||
    source.startRootMultiplicity !== replay.startRootMultiplicity ||
    source.endRootMultiplicity !== replay.endRootMultiplicity ||
    source.interiorDistinctRootCount !== replay.interiorDistinctRootCount ||
    source.distinctRootCount !== replay.distinctRootCount ||
    source.rootMultiplicitySum !== replay.rootMultiplicitySum ||
    source.sturmSequenceLength !== replay.sturmSequenceLength ||
    source.subdivisionNodeCount !== replay.subdivisionNodeCount ||
    source.maximumSubdivisionDepthUsed !== replay.maximumSubdivisionDepthUsed ||
    !sameBigintArray(
      source.primitiveIntegerCoefficientsLowToHigh,
      replay.primitiveIntegerCoefficientsLowToHigh,
    ) ||
    !sameBigintArray(
      source.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh,
      replay.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh,
    ) ||
    source.roots.length !== replay.roots.length
  ) {
    return false;
  }
  return source.roots.every((root, index) => {
    const other = replay.roots[index];
    if (
      other === undefined ||
      root.rootIndex !== other.rootIndex ||
      root.location !== other.location ||
      root.multiplicity !== other.multiplicity
    ) {
      return false;
    }
    if (root.location === 'interior') {
      return (
        other.location === 'interior' &&
        compareExactRational(root.isolatingInterval.lower, other.isolatingInterval.lower) === 0 &&
        compareExactRational(root.isolatingInterval.upper, other.isolatingInterval.upper) === 0
      );
    }
    return (
      other.location === root.location &&
      compareExactRational(root.exactRoot, other.exactRoot) === 0
    );
  });
}

function classLower(rootClass: PrimitiveIntegerPolynomialCommonRootClassV1): ExactRational {
  return rootClass.location === 'interior'
    ? rootClass.isolatingInterval.lower
    : rootClass.exactRoot;
}

function classUpper(rootClass: PrimitiveIntegerPolynomialCommonRootClassV1): ExactRational {
  return rootClass.location === 'interior'
    ? rootClass.isolatingInterval.upper
    : rootClass.exactRoot;
}

/** Determines the exact sign of `Q(alpha)` for one selected isolated root `alpha` of `P`. */
export function determinePrimitiveIntegerPolynomialSignAtAlgebraicRootV1(
  supplied: unknown,
): PrimitiveIntegerPolynomialAlgebraicRootSignResultV1 {
  const input = inspectInput(supplied);
  if (!input.ok) return failure(input.error);
  const definingSourceIsolation = isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(
    input.value.definingPolynomial,
  );
  if (!definingSourceIsolation.ok) {
    return failure(
      definingSourceIsolation.error.map((entry) =>
        issue(
          'source-isolation',
          `$.definingPolynomial${entry.path.slice(1)}`,
          entry.code,
          entry.message,
        ),
      ),
    );
  }
  const querySourceIsolation = isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(
    input.value.queryPolynomial,
  );
  if (!querySourceIsolation.ok) {
    return failure(
      querySourceIsolation.error.map((entry) =>
        issue(
          'source-isolation',
          `$.queryPolynomial${entry.path.slice(1)}`,
          entry.code,
          entry.message,
        ),
      ),
    );
  }
  const refinement = refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1({
    refinementId: input.value.evaluationId,
    polynomials: [
      {
        polynomialId: 'definition',
        coefficients: [...definingSourceIsolation.value.primitiveIntegerCoefficientsLowToHigh],
      },
      {
        polynomialId: 'query',
        coefficients: [...querySourceIsolation.value.primitiveIntegerCoefficientsLowToHigh],
      },
    ],
  });
  if (!refinement.ok) {
    return failure(
      refinement.error.map((entry) =>
        issue('common-refinement', entry.path, entry.code, entry.message),
      ),
    );
  }
  try {
    const definingReplay = refinement.value.isolations[0];
    const queryReplay = refinement.value.isolations[1];
    const definingIsolation = definingSourceIsolation.value;
    const queryIsolation = querySourceIsolation.value;
    if (
      definingReplay === undefined ||
      queryReplay === undefined ||
      definingReplay.polynomialId !== 'definition' ||
      queryReplay.polynomialId !== 'query' ||
      !sameIsolationSemantics(definingIsolation, definingReplay) ||
      !sameIsolationSemantics(queryIsolation, queryReplay)
    ) {
      throw new TypeError('two source isolation records are required');
    }
    if (definingIsolation.rootSetKind === 'entire-unit-interval') {
      return failure([
        issue(
          'root-selection',
          '$.definingPolynomial',
          'persistent-defining-root-set',
          'an identically zero defining polynomial has no selectable discrete root',
        ),
      ]);
    }
    const definingRoot = definingIsolation.roots[input.value.definingRootIndex];
    if (definingRoot === undefined || definingRoot.rootIndex !== input.value.definingRootIndex) {
      return failure([
        issue(
          'root-selection',
          '$.definingRootIndex',
          'defining-root-index-out-of-range',
          'the selected root index does not exist in the defining isolation',
        ),
      ]);
    }
    const definingClass = classContaining(refinement.value, 0, input.value.definingRootIndex);
    if (definingClass === undefined || definingClass.location !== definingRoot.location) {
      throw new TypeError('selected defining root has no matching common-refinement class');
    }
    const queryMember = definingClass.members.find((member) => member.polynomialIndex === 1);
    const queryPersistent = queryIsolation.rootSetKind === 'entire-unit-interval';
    let sign: -1 | 0 | 1;
    let proofKind: PrimitiveIntegerPolynomialAlgebraicRootSignProofKindV1;
    let rationalSignProbe: ExactRational | null = null;
    let rationalProbeIsExactDefiningRoot = false;
    let queryHasNoRootInDefiningInteriorCertificate = false;

    if (queryPersistent) {
      if (!sameBigintArray(queryIsolation.primitiveIntegerCoefficientsLowToHigh, [0n])) {
        throw new TypeError('persistent query is not the canonical zero polynomial');
      }
      sign = 0;
      proofKind = 'query-identically-zero';
    } else if (queryMember !== undefined) {
      sign = 0;
      proofKind = 'shared-refined-root-class';
    } else if (definingRoot.location === 'start' || definingRoot.location === 'end') {
      rationalSignProbe = definingRoot.exactRoot;
      rationalProbeIsExactDefiningRoot = true;
      sign = signIntegerPolynomialAtRational(
        queryIsolation.primitiveIntegerCoefficientsLowToHigh,
        rationalSignProbe,
      );
      if (sign === 0) throw new TypeError('unmerged endpoint query root');
      proofKind = 'exact-endpoint-substitution';
    } else {
      if (definingClass.location !== 'interior')
        throw new TypeError('interior defining root class is missing');
      const distinctQueryClasses = refinement.value.rootClasses.filter(
        (rootClass) =>
          rootClass.rootClassIndex !== definingClass.rootClassIndex &&
          rootClass.members.some((member) => member.polynomialIndex === 1),
      );
      if (
        distinctQueryClasses.some(
          (rootClass) =>
            compareExactRational(classUpper(rootClass), definingClass.isolatingInterval.lower) >
              0 &&
            compareExactRational(classLower(rootClass), definingClass.isolatingInterval.upper) < 0,
        )
      ) {
        throw new TypeError('a distinct query root class overlaps the defining certificate');
      }
      rationalSignProbe = multiplyExactRational(
        addExactRational(
          definingClass.isolatingInterval.lower,
          definingClass.isolatingInterval.upper,
        ),
        HALF,
      );
      sign = signIntegerPolynomialAtRational(
        queryIsolation.primitiveIntegerCoefficientsLowToHigh,
        rationalSignProbe,
      );
      if (sign === 0) throw new TypeError('query root remained in a distinct refined root class');
      queryHasNoRootInDefiningInteriorCertificate = true;
      proofKind = 'root-free-isolating-interval-rational-probe';
    }

    const queryRootClass =
      queryMember === undefined
        ? undefined
        : classContaining(refinement.value, 1, queryMember.rootIndex);
    if (
      (queryMember !== undefined &&
        queryRootClass?.rootClassIndex !== definingClass.rootClassIndex) ||
      (sign === 0 && !queryPersistent && queryMember === undefined)
    ) {
      throw new TypeError('query root/sign common-refinement invariant failed');
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-primitive-integer-polynomial-algebraic-root-sign' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope:
          'one-query-polynomial-at-one-isolated-algebraic-root-on-unit-interval' as const,
        arithmetic: 'exact-rational-common-refinement-gcd-sturm-bigint' as const,
        evaluationId: input.value.evaluationId,
        definingPolynomialId: definingIsolation.polynomialId,
        definingRootIndex: definingRoot.rootIndex,
        definingRootLocation: definingRoot.location,
        definingRootMultiplicity: definingRoot.multiplicity,
        queryPolynomialId: queryIsolation.polynomialId,
        queryPolynomialSignAtDefiningRoot: sign,
        proofKind,
        definingRootClassIndex: definingClass.rootClassIndex,
        queryRootClassIndex: queryRootClass?.rootClassIndex ?? null,
        rationalSignProbe,
        rationalProbeIsExactDefiningRoot,
        queryHasNoRootInDefiningInteriorCertificate,
        definingRoot,
        definingIsolation,
        queryIsolation,
        commonRefinement: refinement.value,
        definingRootSelectedExactly: true as const,
        queryPolynomialIsolatedExactly: true as const,
        sourcePolynomialRolesBoundExactly: true as const,
        commonRefinementUsesInternalRoleIds: true as const,
        crossPolynomialCommonRefinementUsed: true as const,
        algebraicSignDeterminedExactly: true as const,
        floatingPointUsed: false as const,
        geometryClassificationIncluded: false as const,
        featureContainmentIncluded: false as const,
        collisionClassificationIncluded: false as const,
        continuousCollisionDetectionIncluded: false as const,
        collisionFreeClaim: false as const,
        isSupportProfile: false as const,
        supportClaim: false as const,
        verifiedClaim: false as const,
        scientificClaim: false as const,
        globalM0fGo: false as const,
      },
    });
  } catch (error) {
    const budgetExhausted = error instanceof RangeError;
    return failure([
      issue(
        'sign-evaluation',
        '$',
        budgetExhausted
          ? 'algebraic-root-sign-evaluation-budget-exhausted'
          : 'algebraic-root-sign-invariant-failed',
        budgetExhausted
          ? 'exact algebraic-root sign evaluation exceeded its intermediate bit limit'
          : 'exact algebraic-root sign evaluation failed closed unexpectedly',
      ),
    ]);
  }
}
