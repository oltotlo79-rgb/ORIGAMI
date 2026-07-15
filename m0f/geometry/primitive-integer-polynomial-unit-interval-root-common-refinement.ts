import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  divideExactRational,
  equalExactRational,
  exactRational,
  multiplyExactRational,
  signExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import {
  isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1,
  PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS,
  type PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1,
} from './primitive-integer-polynomial-unit-interval-root-isolation.js';

type RationalPolynomial = readonly ExactRational[];

export const PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS =
  deepFreezeOwned({
    maxPolynomials: 30_240,
    maxFiniteRootOccurrences: 181_440,
    maxRootComparisons: 4_194_304,
    maxAdditionalRefinementSteps: 1_048_576,
    maxAdditionalRefinementDepthPerRoot:
      PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxSubdivisionDepth,
    maxStableIdCodeUnits:
      PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxStableIdCodeUnits,
  });

export type PrimitiveIntegerPolynomialCommonRootMemberV1 = Readonly<{
  polynomialIndex: number;
  polynomialId: string;
  rootIndex: number;
  multiplicity: number;
}>;

type CommonRootClassBaseV1 = Readonly<{
  rootClassIndex: number;
  memberCount: number;
  simultaneousAcrossPolynomials: boolean;
  members: readonly PrimitiveIntegerPolynomialCommonRootMemberV1[];
}>;

export type PrimitiveIntegerPolynomialCommonRootClassV1 =
  | (CommonRootClassBaseV1 &
      Readonly<{
        location: 'start';
        exactRoot: ExactRational;
      }>)
  | (CommonRootClassBaseV1 &
      Readonly<{
        location: 'interior';
        isolatingInterval: Readonly<{
          lower: ExactRational;
          upper: ExactRational;
          lowerExclusive: true;
          upperExclusive: true;
          distinctRootCount: 1;
        }>;
        representativePolynomialIndex: number;
        representativePolynomialId: string;
        representativeSquareFreePrimitiveIntegerCoefficientsLowToHigh: readonly bigint[];
      }>)
  | (CommonRootClassBaseV1 &
      Readonly<{
        location: 'end';
        exactRoot: ExactRational;
      }>);

export type PrimitiveIntegerPolynomialPersistentRootSetV1 = Readonly<{
  polynomialIndex: number;
  polynomialId: string;
  rootSetKind: 'entire-unit-interval';
}>;

export type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-primitive-integer-polynomial-unit-interval-root-common-refinement';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'common-refinement-of-finite-root-sets-on-closed-unit-interval';
  arithmetic: 'exact-rational-gcd-sturm-bigint';
  refinementId: string;
  polynomialCount: number;
  persistentPolynomialCount: number;
  finiteRootSetPolynomialCount: number;
  finiteRootOccurrenceCountBeforeMerge: number;
  distinctFiniteRootClassCountAfterMerge: number;
  startRootClassCount: number;
  interiorRootClassCount: number;
  endRootClassCount: number;
  simultaneousRootClassCount: number;
  rootComparisonCount: number;
  additionalRefinementStepCount: number;
  maximumAdditionalRefinementDepthUsed: number;
  persistentPolynomials: readonly PrimitiveIntegerPolynomialPersistentRootSetV1[];
  rootClasses: readonly PrimitiveIntegerPolynomialCommonRootClassV1[];
  isolations: readonly PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1[];
  everyInputPolynomialIsolatedOnClosedUnitInterval: true;
  persistentZeroPolynomialsExcludedFromDiscreteRootClasses: true;
  everyFiniteRootOccurrenceAssignedExactlyOnce: true;
  simultaneousCrossPolynomialRootsMergedExactly: true;
  crossPolynomialRootIdentityProvedByGcdAndSturm: true;
  distinctRootClassesStrictlyOrdered: true;
  pairwiseDisjointInteriorClassIntervals: true;
  floatingPointUsed: false;
  globalOpenCellPartitionIncluded: false;
  geometryClassificationIncluded: false;
  collisionClassificationIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1 = Readonly<{
  stage: 'input' | 'root-isolation' | 'common-refinement';
  path: string;
  code: string;
  message: string;
}>;

export type PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementResultV1 =
  | Readonly<{
      ok: true;
      value: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1[];
    }>;

type InspectedInput = Readonly<{
  refinementId: string;
  polynomials: readonly unknown[];
}>;

interface InteriorRootWork {
  polynomialIndex: number;
  polynomialId: string;
  rootIndex: number;
  multiplicity: number;
  squareFreeIntegerCoefficients: readonly bigint[];
  polynomial: RationalPolynomial;
  sturm: readonly RationalPolynomial[];
  lower: ExactRational;
  upper: ExactRational;
  additionalRefinementDepth: number;
}

const ROOT_KEYS = ['refinementId', 'polynomials'] as const;
const POLYNOMIAL_KEYS = ['polynomialId', 'coefficients'] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ZERO = exactRational(0n);
const ONE = exactRational(1n);
const SPLIT_FRACTIONS = [
  exactRational(1n, 2n),
  exactRational(1n, 4n),
  exactRational(3n, 4n),
  exactRational(1n, 8n),
  exactRational(3n, 8n),
  exactRational(5n, 8n),
  exactRational(7n, 8n),
] as const;

function issue(
  stage: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1[],
): PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function inspectedDataObject(
  supplied: unknown,
  path: string,
  keys: readonly string[],
):
  | Readonly<{ ok: true; descriptors: Record<string, PropertyDescriptor> }>
  | Readonly<{
      ok: false;
      error: PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1;
    }> {
  if (!isPlainObject(supplied)) {
    return {
      ok: false,
      error: issue('input', path, 'expected-object', 'must be one plain object'),
    };
  }
  const descriptors = Object.getOwnPropertyDescriptors(supplied);
  const ownKeys = Reflect.ownKeys(supplied);
  if (
    ownKeys.some((key) => typeof key !== 'string' || !keys.includes(key)) ||
    keys.some((key) => !Object.hasOwn(descriptors, key))
  ) {
    return {
      ok: false,
      error: issue(
        'input',
        path,
        'expected-closed-object',
        'must contain exactly the allowed keys',
      ),
    };
  }
  for (const key of keys) {
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
        error: issue(
          'input',
          `${path}.${key}`,
          'data-property-required',
          'must be an enumerable data property',
        ),
      };
    }
  }
  return { ok: true, descriptors };
}

function inspectInput(supplied: unknown):
  | Readonly<{ ok: true; value: InspectedInput }>
  | Readonly<{
      ok: false;
      error: readonly PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementIssueV1[];
    }> {
  try {
    const root = inspectedDataObject(supplied, '$', ROOT_KEYS);
    if (!root.ok) return { ok: false, error: [root.error] };
    const refinementId: unknown = root.descriptors.refinementId?.value;
    if (
      typeof refinementId !== 'string' ||
      refinementId.length >
        PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS.maxStableIdCodeUnits ||
      !STABLE_ID_PATTERN.test(refinementId)
    ) {
      return {
        ok: false,
        error: [issue('input', '$.refinementId', 'invalid-refinement-id', 'must be a stable ID')],
      };
    }
    const suppliedPolynomials: unknown = root.descriptors.polynomials?.value;
    if (
      !Array.isArray(suppliedPolynomials) ||
      Object.getPrototypeOf(suppliedPolynomials) !== Array.prototype
    ) {
      return {
        ok: false,
        error: [issue('input', '$.polynomials', 'expected-array', 'must be one plain dense array')],
      };
    }
    if (
      suppliedPolynomials.length >
      PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS.maxPolynomials
    ) {
      return {
        ok: false,
        error: [
          issue('input', '$.polynomials', 'polynomial-limit-exceeded', 'too many polynomials'),
        ],
      };
    }
    const arrayDescriptors = Object.getOwnPropertyDescriptors(suppliedPolynomials);
    if (
      Reflect.ownKeys(suppliedPolynomials).some(
        (key) =>
          typeof key !== 'string' ||
          (key !== 'length' &&
            (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= suppliedPolynomials.length)),
      )
    ) {
      return {
        ok: false,
        error: [
          issue(
            'input',
            '$.polynomials',
            'expected-dense-closed-array',
            'must be dense and contain no extra properties',
          ),
        ],
      };
    }
    const polynomials: unknown[] = [];
    for (let index = 0; index < suppliedPolynomials.length; index += 1) {
      const descriptor = arrayDescriptors[String(index)];
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return {
          ok: false,
          error: [
            issue(
              'input',
              `$.polynomials[${String(index)}]`,
              'data-entry-required',
              'every entry must be an enumerable data property',
            ),
          ],
        };
      }
      const entry = inspectedDataObject(
        descriptor.value,
        `$.polynomials[${String(index)}]`,
        POLYNOMIAL_KEYS,
      );
      if (!entry.ok) return { ok: false, error: [entry.error] };
      const polynomialId: unknown = entry.descriptors.polynomialId?.value;
      const coefficients: unknown = entry.descriptors.coefficients?.value;
      polynomials.push({ polynomialId, coefficients });
    }
    return { ok: true, value: { refinementId, polynomials } };
  } catch {
    return {
      ok: false,
      error: [issue('input', '$', 'inspection-failed', 'input could not be inspected safely')],
    };
  }
}

function trim(polynomial: RationalPolynomial): RationalPolynomial {
  let length = polynomial.length;
  while (length > 1 && equalExactRational(polynomial[length - 1] ?? ZERO, ZERO)) length -= 1;
  return polynomial.slice(0, length);
}

function isZeroPolynomial(polynomial: RationalPolynomial): boolean {
  const canonical = trim(polynomial);
  return canonical.length === 1 && equalExactRational(canonical[0] ?? ZERO, ZERO);
}

function polynomialDegree(polynomial: RationalPolynomial): number {
  return trim(polynomial).length - 1;
}

function derivative(polynomial: RationalPolynomial): RationalPolynomial {
  const canonical = trim(polynomial);
  if (canonical.length <= 1) return [ZERO];
  return canonical
    .slice(1)
    .map((coefficient, index) =>
      multiplyExactRational(coefficient, exactRational(BigInt(index + 1))),
    );
}

function scalePolynomial(polynomial: RationalPolynomial, scale: ExactRational): RationalPolynomial {
  return trim(polynomial.map((coefficient) => multiplyExactRational(coefficient, scale)));
}

function polynomialDivide(
  dividend: RationalPolynomial,
  divisor: RationalPolynomial,
): Readonly<{ quotient: RationalPolynomial; remainder: RationalPolynomial }> {
  const normalizedDivisor = trim(divisor);
  if (isZeroPolynomial(normalizedDivisor)) throw new RangeError('cannot divide by zero polynomial');
  let remainder = [...trim(dividend)];
  const divisorDegree = polynomialDegree(normalizedDivisor);
  const quotient = Array.from(
    { length: Math.max(1, polynomialDegree(remainder) - divisorDegree + 1) },
    () => ZERO,
  );
  const divisorLeading = normalizedDivisor[divisorDegree];
  if (divisorLeading === undefined) throw new TypeError('missing divisor leading coefficient');
  while (!isZeroPolynomial(remainder) && polynomialDegree(remainder) >= divisorDegree) {
    const remainderDegree = polynomialDegree(remainder);
    const remainderLeading = remainder[remainderDegree];
    if (remainderLeading === undefined)
      throw new TypeError('missing remainder leading coefficient');
    const shift = remainderDegree - divisorDegree;
    const factor = divideExactRational(remainderLeading, divisorLeading);
    quotient[shift] = addExactRational(quotient[shift] ?? ZERO, factor);
    for (let index = 0; index <= divisorDegree; index += 1) {
      const target = index + shift;
      remainder[target] = subtractExactRational(
        remainder[target] ?? ZERO,
        multiplyExactRational(normalizedDivisor[index] ?? ZERO, factor),
      );
    }
    remainder = [...trim(remainder)];
  }
  return { quotient: trim(quotient), remainder: trim(remainder) };
}

function monic(polynomial: RationalPolynomial): RationalPolynomial {
  const canonical = trim(polynomial);
  if (isZeroPolynomial(canonical)) return [ZERO];
  const leading = canonical.at(-1);
  if (leading === undefined) throw new TypeError('missing leading coefficient');
  return scalePolynomial(canonical, divideExactRational(ONE, leading));
}

function polynomialGcd(left: RationalPolynomial, right: RationalPolynomial): RationalPolynomial {
  let a = trim(left);
  let b = trim(right);
  while (!isZeroPolynomial(b)) {
    const division = polynomialDivide(a, b);
    a = b;
    b = division.remainder;
  }
  return monic(a);
}

function evaluatePolynomial(polynomial: RationalPolynomial, value: ExactRational): ExactRational {
  let result = ZERO;
  const canonical = trim(polynomial);
  for (let index = canonical.length - 1; index >= 0; index -= 1) {
    result = addExactRational(canonical[index] ?? ZERO, multiplyExactRational(value, result));
  }
  return result;
}

function sturmSequence(squareFreePolynomial: RationalPolynomial): readonly RationalPolynomial[] {
  const first = monic(squareFreePolynomial);
  if (polynomialDegree(first) === 0) return [first];
  const sequence: RationalPolynomial[] = [first, derivative(first)];
  while (sequence.length <= polynomialDegree(first) + 1) {
    const previous = sequence.at(-2);
    const current = sequence.at(-1);
    if (previous === undefined || current === undefined || isZeroPolynomial(current)) break;
    const remainder = polynomialDivide(previous, current).remainder;
    if (isZeroPolynomial(remainder)) break;
    sequence.push(scalePolynomial(remainder, exactRational(-1n)));
  }
  return sequence;
}

function signVariations(sequence: readonly RationalPolynomial[], value: ExactRational): number {
  let previousSign: -1 | 0 | 1 = 0;
  let variations = 0;
  for (const polynomial of sequence) {
    const currentSign = signExactRational(evaluatePolynomial(polynomial, value));
    if (currentSign === 0) continue;
    if (previousSign !== 0 && currentSign !== previousSign) variations += 1;
    previousSign = currentSign;
  }
  return variations;
}

function sturmRootCount(
  sequence: readonly RationalPolynomial[],
  lower: ExactRational,
  upper: ExactRational,
): number {
  const count = signVariations(sequence, lower) - signVariations(sequence, upper);
  if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('invalid Sturm root count');
  return count;
}

function interpolate(
  lower: ExactRational,
  upper: ExactRational,
  fraction: ExactRational,
): ExactRational {
  return addExactRational(
    lower,
    multiplyExactRational(subtractExactRational(upper, lower), fraction),
  );
}

function compareMember(
  left: PrimitiveIntegerPolynomialCommonRootMemberV1,
  right: PrimitiveIntegerPolynomialCommonRootMemberV1,
): number {
  return left.polynomialIndex - right.polynomialIndex || left.rootIndex - right.rootIndex;
}

/**
 * Isolates all supplied polynomials and computes an exact common refinement of
 * their finite roots on `[0,1]`.
 */
export function refinePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(
  supplied: unknown,
): PrimitiveIntegerPolynomialUnitIntervalRootCommonRefinementResultV1 {
  const input = inspectInput(supplied);
  if (!input.ok) return failure(input.error);
  const isolations: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1[] = [];
  const seenPolynomialIds = new Set<string>();
  for (const [polynomialIndex, polynomial] of input.value.polynomials.entries()) {
    const isolation = isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(polynomial);
    if (!isolation.ok) {
      return failure(
        isolation.error.map((entry) =>
          issue(
            'root-isolation',
            `$.polynomials[${String(polynomialIndex)}]${entry.path.slice(1)}`,
            entry.code,
            entry.message,
          ),
        ),
      );
    }
    if (seenPolynomialIds.has(isolation.value.polynomialId)) {
      return failure([
        issue(
          'input',
          `$.polynomials[${String(polynomialIndex)}].polynomialId`,
          'duplicate-polynomial-id',
          'polynomial IDs must be unique within one refinement',
        ),
      ]);
    }
    seenPolynomialIds.add(isolation.value.polynomialId);
    isolations.push(isolation.value);
  }

  try {
    const persistentPolynomials: PrimitiveIntegerPolynomialPersistentRootSetV1[] = [];
    const startMembers: PrimitiveIntegerPolynomialCommonRootMemberV1[] = [];
    const endMembers: PrimitiveIntegerPolynomialCommonRootMemberV1[] = [];
    const interiorRoots: InteriorRootWork[] = [];
    let finiteRootOccurrenceCount = 0;
    for (const [polynomialIndex, isolation] of isolations.entries()) {
      if (isolation.rootSetKind === 'entire-unit-interval') {
        persistentPolynomials.push({
          polynomialIndex,
          polynomialId: isolation.polynomialId,
          rootSetKind: 'entire-unit-interval',
        });
        continue;
      }
      const squareFreeIntegerCoefficients =
        isolation.interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh;
      const polynomial = squareFreeIntegerCoefficients.map((coefficient) =>
        exactRational(coefficient),
      );
      const sturm = sturmSequence(polynomial);
      for (const root of isolation.roots) {
        finiteRootOccurrenceCount += 1;
        if (
          finiteRootOccurrenceCount >
          PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS.maxFiniteRootOccurrences
        ) {
          throw new RangeError('finite root occurrence limit exceeded');
        }
        const member = {
          polynomialIndex,
          polynomialId: isolation.polynomialId,
          rootIndex: root.rootIndex,
          multiplicity: root.multiplicity,
        };
        if (root.location === 'start') {
          if (!equalExactRational(root.exactRoot, ZERO))
            throw new TypeError('start root is not zero');
          startMembers.push(member);
        } else if (root.location === 'end') {
          if (!equalExactRational(root.exactRoot, ONE)) throw new TypeError('end root is not one');
          endMembers.push(member);
        } else {
          if (
            polynomialDegree(polynomial) <= 0 ||
            compareExactRational(root.isolatingInterval.lower, ZERO) < 0 ||
            compareExactRational(root.isolatingInterval.upper, ONE) > 0 ||
            compareExactRational(root.isolatingInterval.lower, root.isolatingInterval.upper) >= 0 ||
            sturmRootCount(sturm, root.isolatingInterval.lower, root.isolatingInterval.upper) !== 1
          ) {
            throw new TypeError('interior isolation record is inconsistent');
          }
          interiorRoots.push({
            ...member,
            squareFreeIntegerCoefficients,
            polynomial,
            sturm,
            lower: root.isolatingInterval.lower,
            upper: root.isolatingInterval.upper,
            additionalRefinementDepth: 0,
          });
        }
      }
    }

    let rootComparisonCount = 0;
    let additionalRefinementStepCount = 0;
    let maximumAdditionalRefinementDepthUsed = 0;
    const gcdSturmByPolynomialPair = new Map<string, readonly RationalPolynomial[]>();

    const refineRoot = (root: InteriorRootWork): void => {
      additionalRefinementStepCount += 1;
      root.additionalRefinementDepth += 1;
      if (
        additionalRefinementStepCount >
          PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS.maxAdditionalRefinementSteps ||
        root.additionalRefinementDepth >
          PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS.maxAdditionalRefinementDepthPerRoot
      ) {
        throw new RangeError('common refinement budget exhausted');
      }
      if (root.additionalRefinementDepth > maximumAdditionalRefinementDepthUsed) {
        maximumAdditionalRefinementDepthUsed = root.additionalRefinementDepth;
      }
      const split = SPLIT_FRACTIONS.map((fraction) =>
        interpolate(root.lower, root.upper, fraction),
      ).find(
        (candidate) => signExactRational(evaluatePolynomial(root.polynomial, candidate)) !== 0,
      );
      if (split === undefined) throw new TypeError('all bounded refinement splits are roots');
      const leftCount = sturmRootCount(root.sturm, root.lower, split);
      const rightCount = sturmRootCount(root.sturm, split, root.upper);
      if (leftCount + rightCount !== 1 || (leftCount !== 0 && leftCount !== 1)) {
        throw new TypeError('refined root interval lost its single-root invariant');
      }
      if (leftCount === 1) root.upper = split;
      else root.lower = split;
    };

    const compareRoots = (left: InteriorRootWork, right: InteriorRootWork): -1 | 0 | 1 => {
      rootComparisonCount += 1;
      if (
        rootComparisonCount >
        PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_COMMON_REFINEMENT_LIMITS.maxRootComparisons
      ) {
        throw new RangeError('root comparison budget exhausted');
      }
      if (compareExactRational(left.upper, right.lower) <= 0) return -1;
      if (compareExactRational(right.upper, left.lower) <= 0) return 1;

      const firstIndex = Math.min(left.polynomialIndex, right.polynomialIndex);
      const secondIndex = Math.max(left.polynomialIndex, right.polynomialIndex);
      const pairKey = `${String(firstIndex)}:${String(secondIndex)}`;
      let commonSturm = gcdSturmByPolynomialPair.get(pairKey);
      if (commonSturm === undefined) {
        const gcd = polynomialGcd(left.polynomial, right.polynomial);
        commonSturm = polynomialDegree(gcd) > 0 ? sturmSequence(gcd) : [];
        gcdSturmByPolynomialPair.set(pairKey, commonSturm);
      }
      if (commonSturm.length > 0) {
        const intersectionLower =
          compareExactRational(left.lower, right.lower) >= 0 ? left.lower : right.lower;
        const intersectionUpper =
          compareExactRational(left.upper, right.upper) <= 0 ? left.upper : right.upper;
        if (
          compareExactRational(intersectionLower, intersectionUpper) < 0 &&
          sturmRootCount(commonSturm, intersectionLower, intersectionUpper) > 0
        ) {
          return 0;
        }
      }

      while (
        compareExactRational(left.upper, right.lower) > 0 &&
        compareExactRational(right.upper, left.lower) > 0
      ) {
        const leftWidth = subtractExactRational(left.upper, left.lower);
        const rightWidth = subtractExactRational(right.upper, right.lower);
        if (compareExactRational(leftWidth, rightWidth) >= 0) refineRoot(left);
        else refineRoot(right);
      }
      return compareExactRational(left.upper, right.lower) <= 0 ? -1 : 1;
    };

    interiorRoots.sort(compareRoots);
    const interiorGroups: InteriorRootWork[][] = [];
    for (const root of interiorRoots) {
      const previous = interiorGroups.at(-1);
      if (previous === undefined) {
        interiorGroups.push([root]);
        continue;
      }
      const representative = previous[0];
      if (representative === undefined) throw new TypeError('missing root group representative');
      if (compareRoots(representative, root) === 0) previous.push(root);
      else interiorGroups.push([root]);
    }

    for (const group of interiorGroups) {
      const representative = group[0];
      if (representative === undefined) throw new TypeError('empty interior root group');
      while (compareExactRational(representative.lower, ZERO) <= 0) refineRoot(representative);
      while (compareExactRational(representative.upper, ONE) >= 0) refineRoot(representative);
    }
    for (let index = 1; index < interiorGroups.length; index += 1) {
      const previous = interiorGroups[index - 1]?.[0];
      const current = interiorGroups[index]?.[0];
      if (previous === undefined || current === undefined)
        throw new TypeError('missing adjacent interior root representative');
      while (compareExactRational(previous.upper, current.lower) >= 0) {
        const previousWidth = subtractExactRational(previous.upper, previous.lower);
        const currentWidth = subtractExactRational(current.upper, current.lower);
        if (compareExactRational(previousWidth, currentWidth) >= 0) refineRoot(previous);
        else refineRoot(current);
      }
    }

    const rootClasses: PrimitiveIntegerPolynomialCommonRootClassV1[] = [];
    const pushEndpointClass = (
      location: 'start' | 'end',
      members: PrimitiveIntegerPolynomialCommonRootMemberV1[],
      exactRoot: ExactRational,
    ): void => {
      if (members.length === 0) return;
      members.sort(compareMember);
      rootClasses.push({
        rootClassIndex: rootClasses.length,
        location,
        exactRoot,
        memberCount: members.length,
        simultaneousAcrossPolynomials: members.length > 1,
        members,
      });
    };
    pushEndpointClass('start', startMembers, ZERO);
    for (const group of interiorGroups) {
      const representative = group[0];
      if (representative === undefined) throw new TypeError('empty interior root group');
      const lower = group.reduce(
        (current, root) => (compareExactRational(root.lower, current) > 0 ? root.lower : current),
        representative.lower,
      );
      const upper = group.reduce(
        (current, root) => (compareExactRational(root.upper, current) < 0 ? root.upper : current),
        representative.upper,
      );
      if (
        compareExactRational(lower, ZERO) <= 0 ||
        compareExactRational(upper, ONE) >= 0 ||
        compareExactRational(lower, upper) >= 0 ||
        sturmRootCount(representative.sturm, lower, upper) !== 1
      ) {
        throw new TypeError('common root class has no certified common isolating interval');
      }
      const members = group
        .map((root): PrimitiveIntegerPolynomialCommonRootMemberV1 => ({
          polynomialIndex: root.polynomialIndex,
          polynomialId: root.polynomialId,
          rootIndex: root.rootIndex,
          multiplicity: root.multiplicity,
        }))
        .sort(compareMember);
      rootClasses.push({
        rootClassIndex: rootClasses.length,
        location: 'interior',
        isolatingInterval: {
          lower,
          upper,
          lowerExclusive: true,
          upperExclusive: true,
          distinctRootCount: 1,
        },
        representativePolynomialIndex: representative.polynomialIndex,
        representativePolynomialId: representative.polynomialId,
        representativeSquareFreePrimitiveIntegerCoefficientsLowToHigh:
          representative.squareFreeIntegerCoefficients,
        memberCount: members.length,
        simultaneousAcrossPolynomials: members.length > 1,
        members,
      });
    }
    pushEndpointClass('end', endMembers, ONE);

    const memberKeys = new Set<string>();
    for (const rootClass of rootClasses) {
      for (const member of rootClass.members) {
        const key = `${String(member.polynomialIndex)}:${String(member.rootIndex)}`;
        if (memberKeys.has(key)) throw new TypeError('finite root occurrence assigned twice');
        memberKeys.add(key);
      }
    }
    if (memberKeys.size !== finiteRootOccurrenceCount) {
      throw new TypeError('finite root occurrence assignment is incomplete');
    }
    const interiorClasses = rootClasses.filter(
      (
        rootClass,
      ): rootClass is Extract<
        PrimitiveIntegerPolynomialCommonRootClassV1,
        { location: 'interior' }
      > => rootClass.location === 'interior',
    );
    for (let index = 1; index < interiorClasses.length; index += 1) {
      const previous = interiorClasses[index - 1];
      const current = interiorClasses[index];
      if (
        previous === undefined ||
        current === undefined ||
        compareExactRational(previous.isolatingInterval.upper, current.isolatingInterval.lower) >= 0
      ) {
        throw new TypeError('distinct interior root class intervals overlap');
      }
    }
    if (
      rootClasses.some((rootClass, index) => rootClass.rootClassIndex !== index) ||
      rootClasses.length !==
        interiorGroups.length + (startMembers.length > 0 ? 1 : 0) + (endMembers.length > 0 ? 1 : 0)
    ) {
      throw new TypeError('root class ledger invariant failed');
    }

    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType:
          'm0f-primitive-integer-polynomial-unit-interval-root-common-refinement' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'common-refinement-of-finite-root-sets-on-closed-unit-interval' as const,
        arithmetic: 'exact-rational-gcd-sturm-bigint' as const,
        refinementId: input.value.refinementId,
        polynomialCount: isolations.length,
        persistentPolynomialCount: persistentPolynomials.length,
        finiteRootSetPolynomialCount: isolations.length - persistentPolynomials.length,
        finiteRootOccurrenceCountBeforeMerge: finiteRootOccurrenceCount,
        distinctFiniteRootClassCountAfterMerge: rootClasses.length,
        startRootClassCount: startMembers.length > 0 ? 1 : 0,
        interiorRootClassCount: interiorGroups.length,
        endRootClassCount: endMembers.length > 0 ? 1 : 0,
        simultaneousRootClassCount: rootClasses.filter(
          (rootClass) => rootClass.simultaneousAcrossPolynomials,
        ).length,
        rootComparisonCount,
        additionalRefinementStepCount,
        maximumAdditionalRefinementDepthUsed,
        persistentPolynomials,
        rootClasses,
        isolations,
        everyInputPolynomialIsolatedOnClosedUnitInterval: true as const,
        persistentZeroPolynomialsExcludedFromDiscreteRootClasses: true as const,
        everyFiniteRootOccurrenceAssignedExactlyOnce: true as const,
        simultaneousCrossPolynomialRootsMergedExactly: true as const,
        crossPolynomialRootIdentityProvedByGcdAndSturm: true as const,
        distinctRootClassesStrictlyOrdered: true as const,
        pairwiseDisjointInteriorClassIntervals: true as const,
        floatingPointUsed: false as const,
        globalOpenCellPartitionIncluded: false as const,
        geometryClassificationIncluded: false as const,
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
        'common-refinement',
        '$.polynomials',
        budgetExhausted
          ? 'common-refinement-budget-exhausted'
          : 'common-refinement-invariant-failed',
        budgetExhausted
          ? 'exact common refinement exceeded a defensive computation limit'
          : 'exact common refinement failed closed unexpectedly',
      ),
    ]);
  }
}
