/**
 * Independent exact projective-rational predicates for static 3D points.
 *
 * A point is stored as the unique finite homogeneous integer quadruple
 * `{ x, y, z, w }`, with `w > 0` and `gcd(|x|, |y|, |z|, w) = 1`. Its affine
 * coordinates are `(x / w, y / w, z / w)`.
 *
 * Exact sign predicates are one ingredient of the CCD construction described
 * by Brochu, Edwards, and Bridson. Their construction assumes constant vertex
 * velocity; these static predicates therefore must not be treated as a rigid-
 * rotation CCD implementation. This module does not classify triangle
 * intersections or contacts, follow continuous trajectories, establish
 * collision freedom, verify a model, or imply GO.
 *
 * This reference module intentionally has no dependency on producer geometry
 * or on the component-wise exact-rational implementation.
 */

export type ProjectivePoint3 = Readonly<{
  x: bigint;
  y: bigint;
  z: bigint;
  w: bigint;
}>;

/** A rational component `[numerator, positiveDenominator]`. */
export type ProjectiveRationalComponent3 = readonly [numerator: bigint, denominator: bigint];

export type CanonicalDecimalRational3Json = Readonly<{
  numerator: string;
  denominator: string;
}>;

export type CanonicalDecimalRationalPoint3Json = Readonly<{
  x: CanonicalDecimalRational3Json;
  y: CanonicalDecimalRational3Json;
  z: CanonicalDecimalRational3Json;
}>;

export type ProjectivePlane3 = Readonly<{
  a: bigint;
  b: bigint;
  c: bigint;
  d: bigint;
}>;

export type ProjectivePoint3InputViolationCode =
  | 'expected-object'
  | 'too-many-properties'
  | 'unexpected-property'
  | 'missing-property'
  | 'accessor-property'
  | 'expected-string'
  | 'too-many-digits'
  | 'noncanonical-integer'
  | 'nonpositive-denominator'
  | 'unreduced-rational'
  | 'inspection-failed';

export type ProjectivePoint3InputViolation = Readonly<{
  path: string;
  code: ProjectivePoint3InputViolationCode;
}>;

export type ProjectivePoint3ParseResult =
  | Readonly<{ ok: true; point: ProjectivePoint3 }>
  | Readonly<{ ok: false; violations: readonly ProjectivePoint3InputViolation[] }>;

export type ProjectiveAxis3 = 'x' | 'y' | 'z';

/** Defensive limits for the caller-provided decimal JSON boundary. */
export const PROJECTIVE_RATIONAL_3D_INPUT_LIMITS = Object.freeze({
  maxDecimalDigits: 4096,
  maxDiagnosticPathSegmentCodeUnits: 128,
});

const CANONICAL_INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

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

function commonDivisor4(first: bigint, second: bigint, third: bigint, fourth: bigint): bigint {
  return greatestCommonDivisor(
    greatestCommonDivisor(first, second),
    greatestCommonDivisor(third, fourth),
  );
}

/** Exact sign of a BigInt. */
export function signProjectiveBigInt(value: bigint): -1 | 0 | 1 {
  return value < 0n ? -1 : value > 0n ? 1 : 0;
}

function freezePoint(x: bigint, y: bigint, z: bigint, w: bigint): ProjectivePoint3 {
  return Object.freeze({ x, y, z, w });
}

/** Returns the unique normalized finite representation of an affine point. */
export function canonicalProjectivePoint3(
  x: bigint,
  y: bigint,
  z: bigint,
  w: bigint,
): ProjectivePoint3 {
  if (w === 0n) throw new RangeError('a finite projective 3D point requires nonzero w');
  const direction = w < 0n ? -1n : 1n;
  const orientedX = x * direction;
  const orientedY = y * direction;
  const orientedZ = z * direction;
  const orientedW = w * direction;
  const divisor = commonDivisor4(orientedX, orientedY, orientedZ, orientedW);
  return freezePoint(
    orientedX / divisor,
    orientedY / divisor,
    orientedZ / divisor,
    orientedW / divisor,
  );
}

function requireRationalComponent(
  value: ProjectiveRationalComponent3,
  coordinate: ProjectiveAxis3,
): ProjectiveRationalComponent3 {
  if (typeof value[0] !== 'bigint' || typeof value[1] !== 'bigint') {
    throw new TypeError(`${coordinate} rational component requires BigInt values`);
  }
  if (value[1] <= 0n) {
    throw new RangeError(`${coordinate} rational denominator must be positive`);
  }
  return value;
}

/** Constructs a normalized point from three rational components. */
export function projectivePoint3FromRationalComponents(
  x: ProjectiveRationalComponent3,
  y: ProjectiveRationalComponent3,
  z: ProjectiveRationalComponent3,
): ProjectivePoint3 {
  const [xNumerator, xDenominator] = requireRationalComponent(x, 'x');
  const [yNumerator, yDenominator] = requireRationalComponent(y, 'y');
  const [zNumerator, zDenominator] = requireRationalComponent(z, 'z');
  return canonicalProjectivePoint3(
    xNumerator * yDenominator * zDenominator,
    yNumerator * xDenominator * zDenominator,
    zNumerator * xDenominator * yDenominator,
    xDenominator * yDenominator * zDenominator,
  );
}

function violation(path: string, code: ProjectivePoint3InputViolationCode) {
  return Object.freeze({ path, code });
}

type InspectedObject = Readonly<{
  descriptors: ReadonlyMap<PropertyKey, PropertyDescriptor>;
}>;

function diagnosticPropertyKey(key: PropertyKey): string {
  const limit = PROJECTIVE_RATIONAL_3D_INPUT_LIMITS.maxDiagnosticPathSegmentCodeUnits;
  if (typeof key === 'symbol') {
    const description = key.description ?? '';
    const prefix = 'Symbol(';
    if (prefix.length + description.length + 1 <= limit) return `${prefix}${description})`;
    const retainedDescriptionCodeUnits = limit - prefix.length - 1;
    return `${prefix}${description.slice(0, retainedDescriptionCodeUnits)}…`;
  }
  const raw = String(key);
  return raw.length <= limit ? raw : `${raw.slice(0, limit - 1)}…`;
}

function comparePropertyKeys(left: PropertyKey, right: PropertyKey): number {
  if (typeof left === 'symbol') {
    if (typeof right !== 'symbol') return 1;
    const leftDescription = left.description ?? '';
    const rightDescription = right.description ?? '';
    return leftDescription < rightDescription ? -1 : leftDescription > rightDescription ? 1 : 0;
  }
  if (typeof right === 'symbol') return -1;
  const leftText = String(left);
  const rightText = String(right);
  return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
}

function inspectClosedObject(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  violations: ProjectivePoint3InputViolation[],
): InspectedObject | undefined {
  if (typeof value !== 'object' || value === null) {
    violations.push(violation(path, 'expected-object'));
    return undefined;
  }
  try {
    if (Array.isArray(value)) {
      violations.push(violation(path, 'expected-object'));
      return undefined;
    }
    const prototype = Reflect.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      violations.push(violation(path, 'expected-object'));
      return undefined;
    }
    const unsortedKeys = Reflect.ownKeys(value);
    if (unsortedKeys.length > expectedKeys.length + 4) {
      violations.push(violation(path, 'too-many-properties'));
      return undefined;
    }
    const keys = [...unsortedKeys].sort(comparePropertyKeys);
    const descriptors = new Map<PropertyKey, PropertyDescriptor>();
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined) throw new TypeError('property disappeared during inspection');
      descriptors.set(key, descriptor);
    }
    const expected = new Set(expectedKeys);
    for (const key of keys) {
      if (typeof key !== 'string' || !expected.has(key)) {
        violations.push(violation(`${path}.${diagnosticPropertyKey(key)}`, 'unexpected-property'));
      }
    }
    for (const key of expectedKeys) {
      const descriptor = descriptors.get(key);
      if (descriptor === undefined) {
        violations.push(violation(`${path}.${key}`, 'missing-property'));
      } else if (!('value' in descriptor)) {
        violations.push(violation(`${path}.${key}`, 'accessor-property'));
      }
    }
    return Object.freeze({ descriptors });
  } catch {
    violations.push(violation(path, 'inspection-failed'));
    return undefined;
  }
}

function parseCanonicalInteger(
  value: unknown,
  path: string,
  positive: boolean,
  violations: ProjectivePoint3InputViolation[],
): bigint | undefined {
  if (typeof value !== 'string') {
    violations.push(violation(path, 'expected-string'));
    return undefined;
  }
  const digits = value.startsWith('-') ? value.length - 1 : value.length;
  if (digits > PROJECTIVE_RATIONAL_3D_INPUT_LIMITS.maxDecimalDigits) {
    violations.push(violation(path, 'too-many-digits'));
    return undefined;
  }
  const pattern = positive ? CANONICAL_POSITIVE_INTEGER_PATTERN : CANONICAL_INTEGER_PATTERN;
  if (!pattern.test(value)) {
    violations.push(violation(path, positive ? 'nonpositive-denominator' : 'noncanonical-integer'));
    return undefined;
  }
  return BigInt(value);
}

function descriptorValue(inspected: InspectedObject, key: string): unknown {
  const descriptor = inspected.descriptors.get(key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function parseDecimalComponent(
  value: unknown,
  path: string,
  violations: ProjectivePoint3InputViolation[],
): ProjectiveRationalComponent3 | undefined {
  const inspected = inspectClosedObject(value, path, ['numerator', 'denominator'], violations);
  if (inspected === undefined) return undefined;
  const numerator = parseCanonicalInteger(
    descriptorValue(inspected, 'numerator'),
    `${path}.numerator`,
    false,
    violations,
  );
  const denominator = parseCanonicalInteger(
    descriptorValue(inspected, 'denominator'),
    `${path}.denominator`,
    true,
    violations,
  );
  if (numerator === undefined || denominator === undefined) return undefined;
  if (
    greatestCommonDivisor(numerator, denominator) !== 1n ||
    (numerator === 0n && denominator !== 1n)
  ) {
    violations.push(violation(path, 'unreduced-rational'));
    return undefined;
  }
  return Object.freeze([numerator, denominator] as const);
}

/**
 * Closed, bounded, accessor-free parser for caller-provided decimal JSON.
 * Invalid caller input is represented as a result, not as an exception.
 */
export function parseCanonicalDecimalRationalPoint3(value: unknown): ProjectivePoint3ParseResult {
  const violations: ProjectivePoint3InputViolation[] = [];
  const inspected = inspectClosedObject(value, '$', ['x', 'y', 'z'], violations);
  if (inspected === undefined) {
    return Object.freeze({ ok: false as const, violations: Object.freeze(violations) });
  }
  const x = parseDecimalComponent(descriptorValue(inspected, 'x'), '$.x', violations);
  const y = parseDecimalComponent(descriptorValue(inspected, 'y'), '$.y', violations);
  const z = parseDecimalComponent(descriptorValue(inspected, 'z'), '$.z', violations);
  if (violations.length > 0 || x === undefined || y === undefined || z === undefined) {
    return Object.freeze({ ok: false as const, violations: Object.freeze(violations) });
  }
  return Object.freeze({
    ok: true as const,
    point: projectivePoint3FromRationalComponents(x, y, z),
  });
}

export function equalProjectivePoints3(left: ProjectivePoint3, right: ProjectivePoint3): boolean {
  return (
    left.x * right.w === right.x * left.w &&
    left.y * right.w === right.y * left.w &&
    left.z * right.w === right.z * left.w
  );
}

export function compareProjectivePoint3Coordinate(
  left: ProjectivePoint3,
  right: ProjectivePoint3,
  coordinate: ProjectiveAxis3,
): -1 | 0 | 1 {
  return signProjectiveBigInt(left[coordinate] * right.w - right[coordinate] * left.w);
}

/** Lexicographic affine comparison by x, then y, then z. */
export function compareProjectivePoints3(
  left: ProjectivePoint3,
  right: ProjectivePoint3,
): -1 | 0 | 1 {
  const x = compareProjectivePoint3Coordinate(left, right, 'x');
  if (x !== 0) return x;
  const y = compareProjectivePoint3Coordinate(left, right, 'y');
  return y === 0 ? compareProjectivePoint3Coordinate(left, right, 'z') : y;
}

function determinant3(
  a00: bigint,
  a01: bigint,
  a02: bigint,
  a10: bigint,
  a11: bigint,
  a12: bigint,
  a20: bigint,
  a21: bigint,
  a22: bigint,
): bigint {
  return (
    a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20)
  );
}

function affineDifferenceNumerators(
  origin: ProjectivePoint3,
  endpoint: ProjectivePoint3,
): readonly [x: bigint, y: bigint, z: bigint] {
  return [
    endpoint.x * origin.w - origin.x * endpoint.w,
    endpoint.y * origin.w - origin.y * endpoint.w,
    endpoint.z * origin.w - origin.z * endpoint.w,
  ];
}

/**
 * Exact sign of the standard affine determinant with rows `b-a`, `c-a`, and
 * `d-a`.
 * Equivalently, this is the sign of the 4x4 homogeneous determinant whose
 * rows are `[w, x, y, z]` for `a`, `b`, `c`, and `d`.
 */
export function projectiveOrient3DSign(
  a: ProjectivePoint3,
  b: ProjectivePoint3,
  c: ProjectivePoint3,
  d: ProjectivePoint3,
): -1 | 0 | 1 {
  const ab = affineDifferenceNumerators(a, b);
  const ac = affineDifferenceNumerators(a, c);
  const ad = affineDifferenceNumerators(a, d);
  return signProjectiveBigInt(determinant3(...ab, ...ac, ...ad));
}

/** Oriented plane through three non-collinear affine points. */
export function projectivePlaneThrough3(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
): ProjectivePlane3 {
  const firstToSecond = affineDifferenceNumerators(first, second);
  const firstToThird = affineDifferenceNumerators(first, third);
  const a = firstToSecond[1] * firstToThird[2] - firstToSecond[2] * firstToThird[1];
  const b = firstToSecond[2] * firstToThird[0] - firstToSecond[0] * firstToThird[2];
  const c = firstToSecond[0] * firstToThird[1] - firstToSecond[1] * firstToThird[0];
  if (a === 0n && b === 0n && c === 0n) {
    throw new RangeError('an oriented plane requires three non-collinear points');
  }
  const planeA = a * first.w;
  const planeB = b * first.w;
  const planeC = c * first.w;
  const planeD = -(a * first.x + b * first.y + c * first.z);
  const divisor = commonDivisor4(planeA, planeB, planeC, planeD);
  return Object.freeze({
    a: planeA / divisor,
    b: planeB / divisor,
    c: planeC / divisor,
    d: planeD / divisor,
  });
}

/** Exact sign of an oriented plane equation evaluated at a finite point. */
export function projectivePointPlaneSign(
  plane: ProjectivePlane3,
  point: ProjectivePoint3,
): -1 | 0 | 1 {
  return signProjectiveBigInt(
    plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d * point.w,
  );
}

/**
 * Exact orientation after dropping one affine axis. Remaining coordinates keep
 * declaration order: drop x -> (y,z), drop y -> (x,z), drop z -> (x,y).
 */
export function projectiveAxisDropOrient2DSign(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
  drop: ProjectiveAxis3,
): -1 | 0 | 1 {
  const coordinates =
    drop === 'x'
      ? (['y', 'z'] as const)
      : drop === 'y'
        ? (['x', 'z'] as const)
        : (['x', 'y'] as const);
  const [u, v] = coordinates;
  return signProjectiveBigInt(
    determinant3(
      first[u],
      first[v],
      first.w,
      second[u],
      second[v],
      second.w,
      third[u],
      third[v],
      third.w,
    ),
  );
}
