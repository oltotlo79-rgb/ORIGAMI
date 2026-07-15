export type ExactRational = Readonly<{
  numerator: bigint;
  denominator: bigint;
}>;

export type ExactRationalPoint2 = Readonly<{
  x: ExactRational;
  y: ExactRational;
}>;

export type ExactRationalSign = -1 | 0 | 1;

const FRACTION_MASK = (1n << 52n) - 1n;
const HIDDEN_BIT = 1n << 52n;
const EXPONENT_MASK = 0x7ffn;
// Conversion is synchronous, and every Worker has its own module realm.
const BINARY64_SCRATCH_VIEW = new DataView(new ArrayBuffer(8));

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

/** Constructs the unique reduced representation with a positive denominator. */
export function exactRational(numerator: bigint, denominator = 1n): ExactRational {
  if (denominator === 0n) throw new RangeError('exact rational denominator must be nonzero');
  if (numerator === 0n) return Object.freeze({ numerator: 0n, denominator: 1n });

  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return Object.freeze({
    numerator: (sign * numerator) / divisor,
    denominator: absolute(denominator) / divisor,
  });
}

/** Converts the stored finite IEEE-754 binary64 value without decimal round-tripping. */
export function finiteBinary64ToExactRational(value: number): ExactRational {
  if (!Number.isFinite(value)) {
    throw new TypeError('exact rational conversion requires a finite binary64 number');
  }
  if (value === 0) return exactRational(0n);

  BINARY64_SCRATCH_VIEW.setFloat64(0, value, false);
  const bits = BINARY64_SCRATCH_VIEW.getBigUint64(0, false);
  const exponentBits = Number((bits >> 52n) & EXPONENT_MASK);
  const fraction = bits & FRACTION_MASK;
  const unsignedCoefficient = exponentBits === 0 ? fraction : HIDDEN_BIT | fraction;
  const coefficient = bits >> 63n === 0n ? unsignedCoefficient : -unsignedCoefficient;
  const exponent = exponentBits === 0 ? -1074 : exponentBits - 1023 - 52;

  return exponent >= 0
    ? exactRational(coefficient << BigInt(exponent))
    : exactRational(coefficient, 1n << BigInt(-exponent));
}

export function addExactRational(left: ExactRational, right: ExactRational): ExactRational {
  return exactRational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function subtractExactRational(left: ExactRational, right: ExactRational): ExactRational {
  return exactRational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function multiplyExactRational(left: ExactRational, right: ExactRational): ExactRational {
  return exactRational(left.numerator * right.numerator, left.denominator * right.denominator);
}

export function divideExactRational(left: ExactRational, right: ExactRational): ExactRational {
  if (right.numerator === 0n) throw new RangeError('cannot divide an exact rational by zero');
  return exactRational(left.numerator * right.denominator, left.denominator * right.numerator);
}

export function negateExactRational(value: ExactRational): ExactRational {
  return exactRational(-value.numerator, value.denominator);
}

export function signExactRational(value: ExactRational): ExactRationalSign {
  return value.numerator < 0n ? -1 : value.numerator > 0n ? 1 : 0;
}

export function compareExactRational(left: ExactRational, right: ExactRational): ExactRationalSign {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

export function equalExactRational(left: ExactRational, right: ExactRational): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

/** Canonical, lossless text used only for identity and serialization keys. */
export function exactRationalKey(value: ExactRational): string {
  return value.denominator === 1n
    ? value.numerator.toString()
    : `${value.numerator}/${value.denominator}`;
}

export function exactRationalPointKey(point: ExactRationalPoint2): string {
  return `${exactRationalKey(point.x)},${exactRationalKey(point.y)}`;
}

export function exactRationalOrientationSign(
  a: ExactRationalPoint2,
  b: ExactRationalPoint2,
  c: ExactRationalPoint2,
): ExactRationalSign {
  const determinant = subtractExactRational(
    multiplyExactRational(subtractExactRational(b.x, a.x), subtractExactRational(c.y, a.y)),
    multiplyExactRational(subtractExactRational(b.y, a.y), subtractExactRational(c.x, a.x)),
  );
  return signExactRational(determinant);
}

export function compareExactRationalPoints(
  left: ExactRationalPoint2,
  right: ExactRationalPoint2,
): number {
  const xComparison = compareExactRational(left.x, right.x);
  return xComparison === 0 ? compareExactRational(left.y, right.y) : xComparison;
}

export function equalExactRationalPoints(
  left: ExactRationalPoint2,
  right: ExactRationalPoint2,
): boolean {
  return equalExactRational(left.x, right.x) && equalExactRational(left.y, right.y);
}

function leadingBinaryValue(value: bigint): Readonly<{ significand: number; exponent: number }> {
  const magnitude = absolute(value);
  const bitLength = magnitude.toString(2).length;
  const discardedBits = Math.max(0, bitLength - 53);
  const leadingBits = magnitude >> BigInt(discardedBits);
  return {
    significand: Number(leadingBits) / 2 ** (bitLength - discardedBits - 1),
    exponent: bitLength - 1,
  };
}

/**
 * Approximation for display/export adapters only. Geometry and canonical keys
 * must continue to use the exact rational operations above.
 */
export function exactRationalToBinary64ForDisplay(value: ExactRational): number {
  if (value.numerator === 0n) return 0;
  const numerator = leadingBinaryValue(value.numerator);
  const denominator = leadingBinaryValue(value.denominator);
  let significand = numerator.significand / denominator.significand;
  let exponent = numerator.exponent - denominator.exponent;
  if (significand < 1) {
    significand *= 2;
    exponent -= 1;
  }
  const sign = value.numerator < 0n ? -1 : 1;
  if (exponent < -1075) return sign < 0 ? -0 : 0;
  if (exponent < -1022) {
    return sign * (significand * 2 ** (exponent + 1074)) * Number.MIN_VALUE;
  }
  return sign * significand * 2 ** exponent;
}
