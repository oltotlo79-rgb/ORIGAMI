export type ExactSign = -1 | 0 | 1;

type Dyadic = Readonly<{
  coefficient: bigint;
  exponent: number;
}>;

export type ExactPoint2 = Readonly<{ x: number; y: number }>;

const FRACTION_MASK = (1n << 52n) - 1n;
const HIDDEN_BIT = 1n << 52n;
const EXPONENT_MASK = 0x7ffn;

function finiteNumberToDyadic(value: number): Dyadic {
  if (!Number.isFinite(value)) {
    throw new TypeError('exact dyadic conversion requires a finite binary64 number');
  }
  if (value === 0) return { coefficient: 0n, exponent: 0 };

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const negative = bits >> 63n === 1n;
  const exponentBits = Number((bits >> 52n) & EXPONENT_MASK);
  const fraction = bits & FRACTION_MASK;

  const unsignedCoefficient = exponentBits === 0 ? fraction : HIDDEN_BIT | fraction;
  const coefficient = negative ? -unsignedCoefficient : unsignedCoefficient;
  const exponent = exponentBits === 0 ? -1074 : exponentBits - 1023 - 52;
  return { coefficient, exponent };
}

function add(left: Dyadic, right: Dyadic): Dyadic {
  if (left.coefficient === 0n) return right;
  if (right.coefficient === 0n) return left;
  const exponent = Math.min(left.exponent, right.exponent);
  const leftShift = BigInt(left.exponent - exponent);
  const rightShift = BigInt(right.exponent - exponent);
  return {
    coefficient: (left.coefficient << leftShift) + (right.coefficient << rightShift),
    exponent,
  };
}

function negate(value: Dyadic): Dyadic {
  return { coefficient: -value.coefficient, exponent: value.exponent };
}

function subtract(left: Dyadic, right: Dyadic): Dyadic {
  return add(left, negate(right));
}

function multiply(left: Dyadic, right: Dyadic): Dyadic {
  return {
    coefficient: left.coefficient * right.coefficient,
    exponent: left.exponent + right.exponent,
  };
}

function sign(value: Dyadic): ExactSign {
  if (value.coefficient < 0n) return -1;
  if (value.coefficient > 0n) return 1;
  return 0;
}

/** Exact orientation of the supplied finite IEEE-754 binary64 values. */
export function exactOrientationSign(a: ExactPoint2, b: ExactPoint2, c: ExactPoint2): ExactSign {
  const ax = finiteNumberToDyadic(a.x);
  const ay = finiteNumberToDyadic(a.y);
  const bx = finiteNumberToDyadic(b.x);
  const by = finiteNumberToDyadic(b.y);
  const cx = finiteNumberToDyadic(c.x);
  const cy = finiteNumberToDyadic(c.y);
  const determinant = subtract(
    multiply(subtract(bx, ax), subtract(cy, ay)),
    multiply(subtract(by, ay), subtract(cx, ax)),
  );
  return sign(determinant);
}

/** Exact sign of twice a polygon's signed area in stored paper coordinates. */
export function exactPolygonAreaSign(points: readonly ExactPoint2[]): ExactSign {
  let sum: Dyadic = { coefficient: 0n, exponent: 0 };
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (current === undefined || next === undefined) {
      throw new TypeError('polygon must contain at least one point');
    }
    const cross = subtract(
      multiply(finiteNumberToDyadic(current.x), finiteNumberToDyadic(next.y)),
      multiply(finiteNumberToDyadic(current.y), finiteNumberToDyadic(next.x)),
    );
    sum = add(sum, cross);
  }
  return sign(sum);
}

/** Compare squared L2 distance with the square of an exact binary64 threshold. */
export function exactSquaredDistanceCompare(
  left: ExactPoint2,
  right: ExactPoint2,
  threshold: number,
): ExactSign {
  const dx = subtract(finiteNumberToDyadic(left.x), finiteNumberToDyadic(right.x));
  const dy = subtract(finiteNumberToDyadic(left.y), finiteNumberToDyadic(right.y));
  const limit = finiteNumberToDyadic(threshold);
  const difference = subtract(add(multiply(dx, dx), multiply(dy, dy)), multiply(limit, limit));
  return sign(difference);
}
