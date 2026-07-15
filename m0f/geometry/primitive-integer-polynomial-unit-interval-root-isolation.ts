import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  divideExactRational,
  equalExactRational,
  exactRational,
  multiplyExactRational,
  signExactRational,
  subtractExactRational,
  type ExactRational,
} from '../model/exact-rational.js';

type RationalPolynomial = readonly ExactRational[];

export const PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS = deepFreezeOwned({
  maxDegree: 6,
  maxCoefficientBits: 262_144,
  maxSubdivisionDepth: 4_096,
  maxSubdivisionNodes: 16_384,
  maxStableIdCodeUnits: 128,
});

export type PrimitiveIntegerPolynomialIsolatedRootV1 =
  | Readonly<{
      rootIndex: number;
      location: 'start';
      multiplicity: number;
      exactRoot: ExactRational;
      sturmCertified: true;
    }>
  | Readonly<{
      rootIndex: number;
      location: 'interior';
      multiplicity: number;
      isolatingInterval: Readonly<{
        lower: ExactRational;
        upper: ExactRational;
        lowerExclusive: true;
        upperExclusive: true;
        distinctRootCount: 1;
      }>;
      sturmCertified: true;
    }>
  | Readonly<{
      rootIndex: number;
      location: 'end';
      multiplicity: number;
      exactRoot: ExactRational;
      sturmCertified: true;
    }>;

export type PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-primitive-integer-polynomial-unit-interval-root-isolation';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-primitive-integer-polynomial-on-closed-unit-interval';
  arithmetic: 'exact-rational-sturm-bigint';
  polynomialId: string;
  primitiveIntegerCoefficientsLowToHigh: readonly bigint[];
  polynomialDegree: number | null;
  rootSetKind: 'finite' | 'entire-unit-interval';
  everyUnitIntervalPointIsRoot: boolean;
  startRootMultiplicity: number;
  endRootMultiplicity: number;
  interiorDistinctRootCount: number;
  distinctRootCount: number;
  rootMultiplicitySum: number | null;
  roots: readonly PrimitiveIntegerPolynomialIsolatedRootV1[];
  interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh: readonly bigint[];
  sturmSequenceLength: number;
  subdivisionNodeCount: number;
  maximumSubdivisionDepthUsed: number;
  completeClosedUnitIntervalCovered: true;
  endpointRootsHandledExactly: true;
  repeatedRootMultiplicitiesIncluded: true;
  squareFreeInteriorRootIsolationIncluded: true;
  disjointRationalIsolatingIntervalsIncluded: true;
  eachInteriorIntervalContainsExactlyOneDistinctRoot: true;
  floatingPointUsed: false;
  collisionClassificationIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  isSupportProfile: false;
  supportClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type PrimitiveIntegerPolynomialUnitIntervalRootIsolationIssueV1 = Readonly<{
  stage: 'root' | 'polynomial' | 'isolation';
  path: string;
  code: string;
  message: string;
}>;

export type PrimitiveIntegerPolynomialUnitIntervalRootIsolationResultV1 =
  | Readonly<{
      ok: true;
      value: PrimitiveIntegerPolynomialUnitIntervalRootIsolationRecordV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly PrimitiveIntegerPolynomialUnitIntervalRootIsolationIssueV1[];
    }>;

const ROOT_KEYS = ['polynomialId', 'coefficients'] as const;
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
  stage: PrimitiveIntegerPolynomialUnitIntervalRootIsolationIssueV1['stage'],
  path: string,
  code: string,
  message: string,
): PrimitiveIntegerPolynomialUnitIntervalRootIsolationIssueV1 {
  return { stage, path, code, message };
}

function failure(
  errors: readonly PrimitiveIntegerPolynomialUnitIntervalRootIsolationIssueV1[],
): PrimitiveIntegerPolynomialUnitIntervalRootIsolationResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...errors] });
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

function coefficientBitLength(value: bigint): number {
  return absolute(value).toString(2).length;
}

function inspectInput(supplied: unknown):
  | Readonly<{ ok: true; polynomialId: string; coefficients: readonly bigint[] }>
  | Readonly<{
      ok: false;
      error: readonly PrimitiveIntegerPolynomialUnitIntervalRootIsolationIssueV1[];
    }> {
  try {
    if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied)) {
      return {
        ok: false,
        error: [issue('root', '$', 'expected-object', 'must be one plain data object')],
      };
    }
    const prototype: unknown = Object.getPrototypeOf(supplied);
    if (prototype !== Object.prototype && prototype !== null) {
      return {
        ok: false,
        error: [issue('root', '$', 'expected-plain-object', 'must be one plain data object')],
      };
    }
    const ownKeys = Reflect.ownKeys(supplied);
    if (
      ownKeys.length !== ROOT_KEYS.length ||
      ownKeys.some(
        (key) => typeof key !== 'string' || !(ROOT_KEYS as readonly string[]).includes(key),
      )
    ) {
      return {
        ok: false,
        error: [issue('root', '$', 'closed-object-mismatch', 'must contain only declared fields')],
      };
    }
    const descriptors = Object.getOwnPropertyDescriptors(supplied);
    const idDescriptor = descriptors.polynomialId;
    const coefficientsDescriptor = descriptors.coefficients;
    if (
      idDescriptor === undefined ||
      coefficientsDescriptor === undefined ||
      !('value' in idDescriptor) ||
      !('value' in coefficientsDescriptor) ||
      !idDescriptor.enumerable ||
      !coefficientsDescriptor.enumerable
    ) {
      return {
        ok: false,
        error: [issue('root', '$', 'data-property-required', 'fields must be enumerable data')],
      };
    }
    const polynomialId: unknown = idDescriptor.value;
    if (
      typeof polynomialId !== 'string' ||
      polynomialId.length >
        PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxStableIdCodeUnits ||
      !STABLE_ID_PATTERN.test(polynomialId)
    ) {
      return {
        ok: false,
        error: [
          issue(
            'polynomial',
            '$.polynomialId',
            'invalid-polynomial-id',
            'must be one bounded stable ASCII ID',
          ),
        ],
      };
    }
    const coefficientsValue: unknown = coefficientsDescriptor.value;
    if (!Array.isArray(coefficientsValue)) {
      return {
        ok: false,
        error: [issue('polynomial', '$.coefficients', 'expected-array', 'must be one dense array')],
      };
    }
    if (
      Object.getPrototypeOf(coefficientsValue) !== Array.prototype ||
      coefficientsValue.length < 1 ||
      coefficientsValue.length >
        PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxDegree + 1
    ) {
      return {
        ok: false,
        error: [
          issue(
            'polynomial',
            '$.coefficients',
            'invalid-array-length',
            'coefficient array length is outside the bounded degree contract',
          ),
        ],
      };
    }
    const coefficientKeys = Reflect.ownKeys(coefficientsValue);
    if (
      coefficientKeys.length !== coefficientsValue.length + 1 ||
      coefficientKeys.some(
        (key) =>
          typeof key !== 'string' ||
          (key !== 'length' &&
            (!/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= coefficientsValue.length)),
      )
    ) {
      return {
        ok: false,
        error: [
          issue(
            'polynomial',
            '$.coefficients',
            'expected-dense-closed-array',
            'must be dense and contain no extra properties',
          ),
        ],
      };
    }
    const coefficients: bigint[] = [];
    for (let index = 0; index < coefficientsValue.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(coefficientsValue, String(index));
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return {
          ok: false,
          error: [
            issue(
              'polynomial',
              `$.coefficients[${String(index)}]`,
              'data-coefficient-required',
              'every coefficient must be an enumerable data property',
            ),
          ],
        };
      }
      const value: unknown = descriptor.value;
      if (typeof value !== 'bigint') {
        return {
          ok: false,
          error: [
            issue(
              'polynomial',
              `$.coefficients[${String(index)}]`,
              'expected-bigint',
              'every coefficient must be a BigInt',
            ),
          ],
        };
      }
      if (
        coefficientBitLength(value) >
        PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxCoefficientBits
      ) {
        return {
          ok: false,
          error: [
            issue(
              'polynomial',
              `$.coefficients[${String(index)}]`,
              'coefficient-bit-limit-exceeded',
              'coefficient exceeds the defensive bit limit',
            ),
          ],
        };
      }
      coefficients.push(value);
    }
    if (coefficients.length > 1 && coefficients.at(-1) === 0n) {
      return {
        ok: false,
        error: [
          issue(
            'polynomial',
            '$.coefficients',
            'noncanonical-trailing-zero',
            'nonzero polynomials must omit trailing zero coefficients',
          ),
        ],
      };
    }
    if (!coefficients.every((coefficient) => coefficient === 0n)) {
      const content = coefficients.reduce(
        (current, coefficient) => greatestCommonDivisor(current, coefficient),
        0n,
      );
      if (content !== 1n) {
        return {
          ok: false,
          error: [
            issue(
              'polynomial',
              '$.coefficients',
              'nonprimitive-polynomial',
              'integer coefficient content must equal one',
            ),
          ],
        };
      }
    }
    return { ok: true, polynomialId, coefficients };
  } catch {
    return {
      ok: false,
      error: [issue('root', '$', 'inspection-failed', 'input could not be inspected safely')],
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
  const quotient = Array.from(
    { length: Math.max(1, polynomialDegree(remainder) - polynomialDegree(normalizedDivisor) + 1) },
    () => ZERO,
  );
  const divisorDegree = polynomialDegree(normalizedDivisor);
  const divisorLeading = normalizedDivisor[divisorDegree];
  if (divisorLeading === undefined) throw new TypeError('divisor leading coefficient is missing');
  while (!isZeroPolynomial(remainder) && polynomialDegree(remainder) >= divisorDegree) {
    const remainderDegree = polynomialDegree(remainder);
    const remainderLeading = remainder[remainderDegree];
    if (remainderLeading === undefined)
      throw new TypeError('remainder leading coefficient missing');
    const shift = remainderDegree - divisorDegree;
    const factor = divideExactRational(remainderLeading, divisorLeading);
    quotient[shift] = addExactRational(quotient[shift] ?? ZERO, factor);
    for (let index = 0; index <= divisorDegree; index += 1) {
      const targetIndex = index + shift;
      remainder[targetIndex] = subtractExactRational(
        remainder[targetIndex] ?? ZERO,
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
  if (leading === undefined) throw new TypeError('leading coefficient is missing');
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

function exactQuotient(
  dividend: RationalPolynomial,
  divisor: RationalPolynomial,
): RationalPolynomial {
  const division = polynomialDivide(dividend, divisor);
  if (!isZeroPolynomial(division.remainder))
    throw new TypeError('expected exact polynomial division');
  return trim(division.quotient);
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

function squareFreePart(polynomial: RationalPolynomial): RationalPolynomial {
  const canonical = trim(polynomial);
  if (polynomialDegree(canonical) <= 0) return monic(canonical);
  return monic(exactQuotient(canonical, polynomialGcd(canonical, derivative(canonical))));
}

function rationalToPrimitiveIntegers(polynomial: RationalPolynomial): readonly bigint[] {
  const canonical = trim(polynomial);
  if (isZeroPolynomial(canonical)) return [0n];
  const denominatorLcm = canonical.reduce((current, coefficient) => {
    const gcd = greatestCommonDivisor(current, coefficient.denominator);
    return (current / gcd) * coefficient.denominator;
  }, 1n);
  const integers = canonical.map(
    (coefficient) => coefficient.numerator * (denominatorLcm / coefficient.denominator),
  );
  const content = integers.reduce(
    (current, coefficient) => greatestCommonDivisor(current, coefficient),
    0n,
  );
  const primitive = integers.map((coefficient) => coefficient / content);
  return (primitive.at(-1) ?? 1n) < 0n ? primitive.map((coefficient) => -coefficient) : primitive;
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

type RawInteriorInterval = Readonly<{
  lower: ExactRational;
  upper: ExactRational;
}>;

function isolateInteriorRoots(squareFreePolynomial: RationalPolynomial): Readonly<{
  intervals: readonly RawInteriorInterval[];
  sequence: readonly RationalPolynomial[];
  subdivisionNodeCount: number;
  maximumDepthUsed: number;
}> {
  const sequence = sturmSequence(squareFreePolynomial);
  const total = sturmRootCount(sequence, ZERO, ONE);
  const intervals: RawInteriorInterval[] = [];
  let subdivisionNodeCount = 0;
  let maximumDepthUsed = 0;
  const visit = (
    lower: ExactRational,
    upper: ExactRational,
    count: number,
    depth: number,
  ): void => {
    if (count === 0) return;
    subdivisionNodeCount += 1;
    if (
      subdivisionNodeCount >
      PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxSubdivisionNodes
    ) {
      throw new RangeError('root isolation subdivision node budget exhausted');
    }
    if (
      depth > PRIMITIVE_INTEGER_POLYNOMIAL_UNIT_INTERVAL_ROOT_ISOLATION_LIMITS.maxSubdivisionDepth
    ) {
      throw new RangeError('root isolation subdivision depth budget exhausted');
    }
    if (depth > maximumDepthUsed) maximumDepthUsed = depth;
    if (count === 1) {
      intervals.push({ lower, upper });
      return;
    }
    const split = SPLIT_FRACTIONS.map((fraction) => interpolate(lower, upper, fraction)).find(
      (candidate) => signExactRational(evaluatePolynomial(squareFreePolynomial, candidate)) !== 0,
    );
    if (split === undefined) throw new TypeError('degree-bounded split candidates are all roots');
    const leftCount = sturmRootCount(sequence, lower, split);
    const rightCount = sturmRootCount(sequence, split, upper);
    if (leftCount + rightCount !== count) throw new TypeError('Sturm subdivision count mismatch');
    visit(lower, split, leftCount, depth + 1);
    visit(split, upper, rightCount, depth + 1);
  };
  visit(ZERO, ONE, total, 0);
  return { intervals, sequence, subdivisionNodeCount, maximumDepthUsed };
}

function rootMultiplicityInInterval(
  original: RationalPolynomial,
  interval: RawInteriorInterval,
): number {
  let multiplicity = 1;
  let repeated = polynomialGcd(original, derivative(original));
  while (polynomialDegree(repeated) > 0) {
    const repeatedSquareFree = squareFreePart(repeated);
    const sequence = sturmSequence(repeatedSquareFree);
    if (sturmRootCount(sequence, interval.lower, interval.upper) === 0) break;
    multiplicity += 1;
    repeated = polynomialGcd(repeated, derivative(repeated));
  }
  return multiplicity;
}

function removeEndpointFactors(polynomial: RationalPolynomial): Readonly<{
  interior: RationalPolynomial;
  startMultiplicity: number;
  endMultiplicity: number;
}> {
  let interior = [...trim(polynomial)];
  let startMultiplicity = 0;
  while (interior.length > 1 && equalExactRational(interior[0] ?? ZERO, ZERO)) {
    interior = interior.slice(1);
    startMultiplicity += 1;
  }
  let endMultiplicity = 0;
  const endFactor: RationalPolynomial = [exactRational(-1n), ONE];
  while (interior.length > 1 && equalExactRational(evaluatePolynomial(interior, ONE), ZERO)) {
    interior = [...exactQuotient(interior, endFactor)];
    endMultiplicity += 1;
  }
  return { interior: trim(interior), startMultiplicity, endMultiplicity };
}

/** Isolates every distinct real root on `[0,1]` using exact Sturm arithmetic. */
export function isolatePrimitiveIntegerPolynomialRootsOnUnitIntervalV1(
  supplied: unknown,
): PrimitiveIntegerPolynomialUnitIntervalRootIsolationResultV1 {
  const input = inspectInput(supplied);
  if (!input.ok) return failure(input.error);
  try {
    const rationalPolynomial = input.coefficients.map((coefficient) => exactRational(coefficient));
    const identicallyZero = input.coefficients.every((coefficient) => coefficient === 0n);
    if (identicallyZero) {
      return deepFreezeOwned({
        ok: true as const,
        value: {
          schemaVersion: 1 as const,
          recordType: 'm0f-primitive-integer-polynomial-unit-interval-root-isolation' as const,
          contractStatus: 'candidate-no-claim' as const,
          predicateScope: 'one-primitive-integer-polynomial-on-closed-unit-interval' as const,
          arithmetic: 'exact-rational-sturm-bigint' as const,
          polynomialId: input.polynomialId,
          primitiveIntegerCoefficientsLowToHigh: input.coefficients,
          polynomialDegree: null,
          rootSetKind: 'entire-unit-interval' as const,
          everyUnitIntervalPointIsRoot: true,
          startRootMultiplicity: 0,
          endRootMultiplicity: 0,
          interiorDistinctRootCount: 0,
          distinctRootCount: 0,
          rootMultiplicitySum: null,
          roots: [],
          interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh: [0n],
          sturmSequenceLength: 0,
          subdivisionNodeCount: 0,
          maximumSubdivisionDepthUsed: 0,
          completeClosedUnitIntervalCovered: true as const,
          endpointRootsHandledExactly: true as const,
          repeatedRootMultiplicitiesIncluded: true as const,
          squareFreeInteriorRootIsolationIncluded: true as const,
          disjointRationalIsolatingIntervalsIncluded: true as const,
          eachInteriorIntervalContainsExactlyOneDistinctRoot: true as const,
          floatingPointUsed: false as const,
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
    }
    const endpointRemoval = removeEndpointFactors(rationalPolynomial);
    const interiorSquareFree = squareFreePart(endpointRemoval.interior);
    const isolation =
      polynomialDegree(interiorSquareFree) > 0
        ? isolateInteriorRoots(interiorSquareFree)
        : {
            intervals: [] as readonly RawInteriorInterval[],
            sequence: [] as readonly RationalPolynomial[],
            subdivisionNodeCount: 0,
            maximumDepthUsed: 0,
          };
    const roots: PrimitiveIntegerPolynomialIsolatedRootV1[] = [];
    if (endpointRemoval.startMultiplicity > 0) {
      roots.push({
        rootIndex: roots.length,
        location: 'start',
        multiplicity: endpointRemoval.startMultiplicity,
        exactRoot: ZERO,
        sturmCertified: true,
      });
    }
    for (const interval of isolation.intervals) {
      roots.push({
        rootIndex: roots.length,
        location: 'interior',
        multiplicity: rootMultiplicityInInterval(rationalPolynomial, interval),
        isolatingInterval: {
          lower: interval.lower,
          upper: interval.upper,
          lowerExclusive: true,
          upperExclusive: true,
          distinctRootCount: 1,
        },
        sturmCertified: true,
      });
    }
    if (endpointRemoval.endMultiplicity > 0) {
      roots.push({
        rootIndex: roots.length,
        location: 'end',
        multiplicity: endpointRemoval.endMultiplicity,
        exactRoot: ONE,
        sturmCertified: true,
      });
    }
    const rootMultiplicitySum = roots.reduce((sum, root) => sum + root.multiplicity, 0);
    return deepFreezeOwned({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: 'm0f-primitive-integer-polynomial-unit-interval-root-isolation' as const,
        contractStatus: 'candidate-no-claim' as const,
        predicateScope: 'one-primitive-integer-polynomial-on-closed-unit-interval' as const,
        arithmetic: 'exact-rational-sturm-bigint' as const,
        polynomialId: input.polynomialId,
        primitiveIntegerCoefficientsLowToHigh: input.coefficients,
        polynomialDegree: input.coefficients.length - 1,
        rootSetKind: 'finite' as const,
        everyUnitIntervalPointIsRoot: false,
        startRootMultiplicity: endpointRemoval.startMultiplicity,
        endRootMultiplicity: endpointRemoval.endMultiplicity,
        interiorDistinctRootCount: isolation.intervals.length,
        distinctRootCount: roots.length,
        rootMultiplicitySum,
        roots,
        interiorSquareFreePrimitiveIntegerCoefficientsLowToHigh:
          rationalToPrimitiveIntegers(interiorSquareFree),
        sturmSequenceLength: isolation.sequence.length,
        subdivisionNodeCount: isolation.subdivisionNodeCount,
        maximumSubdivisionDepthUsed: isolation.maximumDepthUsed,
        completeClosedUnitIntervalCovered: true as const,
        endpointRootsHandledExactly: true as const,
        repeatedRootMultiplicitiesIncluded: true as const,
        squareFreeInteriorRootIsolationIncluded: true as const,
        disjointRationalIsolatingIntervalsIncluded: true as const,
        eachInteriorIntervalContainsExactlyOneDistinctRoot: true as const,
        floatingPointUsed: false as const,
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
        'isolation',
        '$.coefficients',
        budgetExhausted ? 'isolation-budget-exhausted' : 'isolation-invariant-failed',
        budgetExhausted
          ? 'exact root isolation exceeded its defensive subdivision budget'
          : 'exact root isolation failed closed unexpectedly',
      ),
    ]);
  }
}
