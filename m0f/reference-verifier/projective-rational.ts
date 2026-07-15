/**
 * Independent exact 2D kernel for the M0F reference verifier.
 *
 * Affine points are represented by canonical homogeneous integer triples
 * `[x, y, w]`, where `w > 0`, `gcd(|x|, |y|, w) = 1`, and the affine point is
 * `(x / w, y / w)`. This module deliberately has no dependency on the
 * producer geometry or component-wise exact-rational implementation.
 */

export type ProjectivePoint2 = readonly [x: bigint, y: bigint, w: bigint];

/** A reduced rational value `[numerator, positiveDenominator]`. */
export type ProjectiveRationalComponent = readonly [numerator: bigint, denominator: bigint];

export type CanonicalDecimalRationalJson = Readonly<{
  numerator: string;
  denominator: string;
}>;

export type CanonicalDecimalRationalPointJson = Readonly<{
  x: CanonicalDecimalRationalJson;
  y: CanonicalDecimalRationalJson;
}>;

export type ProjectiveSegment2 = Readonly<{
  start: ProjectivePoint2;
  end: ProjectivePoint2;
}>;

export type ProjectiveSegmentLocation = 'start' | 'end' | 'interior';

export type ProjectiveLineIntersection =
  | Readonly<{ kind: 'point'; point: ProjectivePoint2 }>
  | Readonly<{ kind: 'parallel' }>
  | Readonly<{ kind: 'coincident' }>;

export type ProjectiveSegmentIntersection =
  | Readonly<{ kind: 'disjoint' }>
  | Readonly<{ kind: 'proper-crossing'; point: ProjectivePoint2 }>
  | Readonly<{
      kind: 'endpoint-touch';
      point: ProjectivePoint2;
      onA: 'start' | 'end';
      onB: 'start' | 'end';
    }>
  | Readonly<{
      kind: 't-junction';
      point: ProjectivePoint2;
      endpointOn: 'a' | 'b';
      onA: ProjectiveSegmentLocation;
      onB: ProjectiveSegmentLocation;
    }>
  | Readonly<{ kind: 'collinear-overlap' }>;

const FRACTION_MASK = (1n << 52n) - 1n;
const HIDDEN_BIT = 1n << 52n;
const EXPONENT_MASK = 0x7ffn;
const CANONICAL_INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

const DISJOINT = Object.freeze({ kind: 'disjoint' } as const);
const COLLINEAR_OVERLAP = Object.freeze({ kind: 'collinear-overlap' } as const);
const PARALLEL = Object.freeze({ kind: 'parallel' } as const);
const COINCIDENT = Object.freeze({ kind: 'coincident' } as const);

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

function commonDivisor3(first: bigint, second: bigint, third: bigint): bigint {
  return greatestCommonDivisor(greatestCommonDivisor(first, second), third);
}

function sign(value: bigint): -1 | 0 | 1 {
  return value < 0n ? -1 : value > 0n ? 1 : 0;
}

function freezePoint(x: bigint, y: bigint, w: bigint): ProjectivePoint2 {
  return Object.freeze([x, y, w] as const);
}

function freezeComponent(numerator: bigint, denominator: bigint): ProjectiveRationalComponent {
  return Object.freeze([numerator, denominator] as const);
}

/** Returns the unique finite homogeneous representation of an affine point. */
export function canonicalProjectivePoint(x: bigint, y: bigint, w: bigint): ProjectivePoint2 {
  if (w === 0n) throw new RangeError('a finite projective point requires nonzero w');
  const direction = w < 0n ? -1n : 1n;
  const orientedX = x * direction;
  const orientedY = y * direction;
  const orientedW = w * direction;
  const divisor = commonDivisor3(orientedX, orientedY, orientedW);
  return freezePoint(orientedX / divisor, orientedY / divisor, orientedW / divisor);
}

/** Returns the unique reduced rational representation with positive denominator. */
export function canonicalProjectiveRationalComponent(
  numerator: bigint,
  denominator = 1n,
): ProjectiveRationalComponent {
  if (denominator === 0n) throw new RangeError('a rational denominator must be nonzero');
  if (numerator === 0n) return freezeComponent(0n, 1n);
  const direction = denominator < 0n ? -1n : 1n;
  const orientedNumerator = numerator * direction;
  const orientedDenominator = denominator * direction;
  const divisor = greatestCommonDivisor(orientedNumerator, orientedDenominator);
  return freezeComponent(orientedNumerator / divisor, orientedDenominator / divisor);
}

/** Decodes the stored IEEE-754 binary64 bits, including subnormal values. */
export function finiteBinary64ToProjectiveComponent(value: number): ProjectiveRationalComponent {
  if (!Number.isFinite(value)) {
    throw new TypeError('binary64 conversion requires a finite number');
  }
  if (value === 0) return freezeComponent(0n, 1n);

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const exponentBits = Number((bits >> 52n) & EXPONENT_MASK);
  const fractionBits = bits & FRACTION_MASK;
  const unsignedCoefficient = exponentBits === 0 ? fractionBits : HIDDEN_BIT | fractionBits;
  const coefficient = bits >> 63n === 0n ? unsignedCoefficient : -unsignedCoefficient;
  const exponent = exponentBits === 0 ? -1074 : exponentBits - 1023 - 52;

  return exponent >= 0
    ? canonicalProjectiveRationalComponent(coefficient << BigInt(exponent))
    : canonicalProjectiveRationalComponent(coefficient, 1n << BigInt(-exponent));
}

export function projectivePointFromFiniteBinary64(x: number, y: number): ProjectivePoint2 {
  const [xNumerator, xDenominator] = finiteBinary64ToProjectiveComponent(x);
  const [yNumerator, yDenominator] = finiteBinary64ToProjectiveComponent(y);
  return canonicalProjectivePoint(
    xNumerator * yDenominator,
    yNumerator * xDenominator,
    xDenominator * yDenominator,
  );
}

function componentFromCanonicalDecimalJson(
  value: CanonicalDecimalRationalJson,
): ProjectiveRationalComponent {
  if (
    !CANONICAL_INTEGER_PATTERN.test(value.numerator) ||
    !CANONICAL_POSITIVE_INTEGER_PATTERN.test(value.denominator)
  ) {
    throw new TypeError('decimal rational JSON must use canonical base-10 integer strings');
  }
  const numerator = BigInt(value.numerator);
  const denominator = BigInt(value.denominator);
  const canonical = canonicalProjectiveRationalComponent(numerator, denominator);
  if (
    canonical[0].toString() !== value.numerator ||
    canonical[1].toString() !== value.denominator
  ) {
    throw new TypeError('decimal rational JSON must be reduced and encode zero as 0/1');
  }
  return canonical;
}

/** Converts an already-typed canonical exact-coordinate JSON point. */
export function projectivePointFromCanonicalDecimalRationalJson(
  value: CanonicalDecimalRationalPointJson,
): ProjectivePoint2 {
  const [xNumerator, xDenominator] = componentFromCanonicalDecimalJson(value.x);
  const [yNumerator, yDenominator] = componentFromCanonicalDecimalJson(value.y);
  return canonicalProjectivePoint(
    xNumerator * yDenominator,
    yNumerator * xDenominator,
    xDenominator * yDenominator,
  );
}

export function compareProjectivePointCoordinate(
  left: ProjectivePoint2,
  right: ProjectivePoint2,
  coordinate: 'x' | 'y',
): -1 | 0 | 1 {
  const index = coordinate === 'x' ? 0 : 1;
  return sign(left[index] * right[2] - right[index] * left[2]);
}

/** Lexicographic affine comparison by x, then y. */
export function compareProjectivePoints(
  left: ProjectivePoint2,
  right: ProjectivePoint2,
): -1 | 0 | 1 {
  const xComparison = compareProjectivePointCoordinate(left, right, 'x');
  return xComparison === 0 ? compareProjectivePointCoordinate(left, right, 'y') : xComparison;
}

export function equalProjectivePoints(left: ProjectivePoint2, right: ProjectivePoint2): boolean {
  return left[0] * right[2] === right[0] * left[2] && left[1] * right[2] === right[1] * left[2];
}

/** Canonical, lossless identity key. */
export function projectivePointKey(point: ProjectivePoint2): string {
  const canonical = canonicalProjectivePoint(point[0], point[1], point[2]);
  return `${canonical[0]}:${canonical[1]}:${canonical[2]}`;
}

/** Exact sign of the affine orientation determinant. */
export function projectiveOrientationSign(
  first: ProjectivePoint2,
  second: ProjectivePoint2,
  third: ProjectivePoint2,
): -1 | 0 | 1 {
  const determinant =
    first[0] * (second[1] * third[2] - second[2] * third[1]) -
    first[1] * (second[0] * third[2] - second[2] * third[0]) +
    first[2] * (second[0] * third[1] - second[1] * third[0]);
  return sign(determinant);
}

type ProjectiveLine2 = readonly [a: bigint, b: bigint, c: bigint];

function canonicalLine(a: bigint, b: bigint, c: bigint): ProjectiveLine2 {
  if (a === 0n && b === 0n && c === 0n) {
    throw new RangeError('a projective line requires two distinct points');
  }
  const divisor = commonDivisor3(a, b, c);
  let canonicalA = a / divisor;
  let canonicalB = b / divisor;
  let canonicalC = c / divisor;
  const firstNonzero = canonicalA !== 0n ? canonicalA : canonicalB !== 0n ? canonicalB : canonicalC;
  if (firstNonzero < 0n) {
    canonicalA = -canonicalA;
    canonicalB = -canonicalB;
    canonicalC = -canonicalC;
  }
  return Object.freeze([canonicalA, canonicalB, canonicalC] as const);
}

function lineThrough(first: ProjectivePoint2, second: ProjectivePoint2): ProjectiveLine2 {
  if (equalProjectivePoints(first, second)) {
    throw new RangeError('a projective line requires two distinct points');
  }
  return canonicalLine(
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  );
}

/** Intersects the two infinite affine lines determined by four finite points. */
export function intersectProjectiveLines(
  aStart: ProjectivePoint2,
  aEnd: ProjectivePoint2,
  bStart: ProjectivePoint2,
  bEnd: ProjectivePoint2,
): ProjectiveLineIntersection {
  const first = lineThrough(aStart, aEnd);
  const second = lineThrough(bStart, bEnd);
  if (first[0] === second[0] && first[1] === second[1] && first[2] === second[2]) {
    return COINCIDENT;
  }
  const x = first[1] * second[2] - first[2] * second[1];
  const y = first[2] * second[0] - first[0] * second[2];
  const w = first[0] * second[1] - first[1] * second[0];
  if (w === 0n) return PARALLEL;
  return Object.freeze({ kind: 'point' as const, point: canonicalProjectivePoint(x, y, w) });
}

function minimumPointCoordinate(
  left: ProjectivePoint2,
  right: ProjectivePoint2,
  coordinate: 'x' | 'y',
): ProjectivePoint2 {
  return compareProjectivePointCoordinate(left, right, coordinate) <= 0 ? left : right;
}

function maximumPointCoordinate(
  left: ProjectivePoint2,
  right: ProjectivePoint2,
  coordinate: 'x' | 'y',
): ProjectivePoint2 {
  return compareProjectivePointCoordinate(left, right, coordinate) >= 0 ? left : right;
}

function pointOnClosedSegment(point: ProjectivePoint2, segment: ProjectiveSegment2): boolean {
  if (projectiveOrientationSign(segment.start, segment.end, point) !== 0) return false;
  return (
    compareProjectivePointCoordinate(
      point,
      minimumPointCoordinate(segment.start, segment.end, 'x'),
      'x',
    ) >= 0 &&
    compareProjectivePointCoordinate(
      point,
      maximumPointCoordinate(segment.start, segment.end, 'x'),
      'x',
    ) <= 0 &&
    compareProjectivePointCoordinate(
      point,
      minimumPointCoordinate(segment.start, segment.end, 'y'),
      'y',
    ) >= 0 &&
    compareProjectivePointCoordinate(
      point,
      maximumPointCoordinate(segment.start, segment.end, 'y'),
      'y',
    ) <= 0
  );
}

function segmentLocation(
  point: ProjectivePoint2,
  segment: ProjectiveSegment2,
): ProjectiveSegmentLocation | undefined {
  if (equalProjectivePoints(point, segment.start)) return 'start';
  if (equalProjectivePoints(point, segment.end)) return 'end';
  return pointOnClosedSegment(point, segment) ? 'interior' : undefined;
}

function opposite(left: -1 | 0 | 1, right: -1 | 0 | 1): boolean {
  return (left === -1 && right === 1) || (left === 1 && right === -1);
}

function classifyTouch(
  point: ProjectivePoint2,
  a: ProjectiveSegment2,
  b: ProjectiveSegment2,
): ProjectiveSegmentIntersection {
  const onA = segmentLocation(point, a);
  const onB = segmentLocation(point, b);
  if (onA === undefined || onB === undefined) {
    throw new TypeError('an intersection point must lie on both segments');
  }
  if (onA !== 'interior' && onB !== 'interior') {
    return Object.freeze({ kind: 'endpoint-touch' as const, point, onA, onB });
  }
  if (onA === 'interior' && onB === 'interior') {
    throw new TypeError('an isolated endpoint candidate cannot be interior to both segments');
  }
  return Object.freeze({
    kind: 't-junction' as const,
    point,
    endpointOn: onA === 'interior' ? ('b' as const) : ('a' as const),
    onA,
    onB,
  });
}

function collinearSegmentIntersection(
  a: ProjectiveSegment2,
  b: ProjectiveSegment2,
): ProjectiveSegmentIntersection {
  const coordinate =
    compareProjectivePointCoordinate(a.start, a.end, 'x') === 0 ? ('y' as const) : ('x' as const);
  const overlapMinimum = maximumPointCoordinate(
    minimumPointCoordinate(a.start, a.end, coordinate),
    minimumPointCoordinate(b.start, b.end, coordinate),
    coordinate,
  );
  const overlapMaximum = minimumPointCoordinate(
    maximumPointCoordinate(a.start, a.end, coordinate),
    maximumPointCoordinate(b.start, b.end, coordinate),
    coordinate,
  );
  const comparison = compareProjectivePointCoordinate(overlapMinimum, overlapMaximum, coordinate);
  if (comparison > 0) return DISJOINT;
  if (comparison < 0) return COLLINEAR_OVERLAP;
  return classifyTouch(overlapMinimum, a, b);
}

/** Exact closed-segment classification, including T-junctions and overlaps. */
export function classifyProjectiveSegmentIntersection(
  a: ProjectiveSegment2,
  b: ProjectiveSegment2,
): ProjectiveSegmentIntersection {
  if (equalProjectivePoints(a.start, a.end) || equalProjectivePoints(b.start, b.end)) {
    throw new RangeError('segment classification requires nonzero segments');
  }

  const aStart = projectiveOrientationSign(a.start, a.end, b.start);
  const aEnd = projectiveOrientationSign(a.start, a.end, b.end);
  const bStart = projectiveOrientationSign(b.start, b.end, a.start);
  const bEnd = projectiveOrientationSign(b.start, b.end, a.end);
  if (aStart === 0 && aEnd === 0 && bStart === 0 && bEnd === 0) {
    return collinearSegmentIntersection(a, b);
  }
  if (opposite(aStart, aEnd) && opposite(bStart, bEnd)) {
    const intersection = intersectProjectiveLines(a.start, a.end, b.start, b.end);
    if (intersection.kind !== 'point') {
      throw new TypeError('opposite orientations require one finite line intersection');
    }
    return Object.freeze({ kind: 'proper-crossing' as const, point: intersection.point });
  }

  const candidates = [
    { orientation: aStart, point: b.start, other: a },
    { orientation: aEnd, point: b.end, other: a },
    { orientation: bStart, point: a.start, other: b },
    { orientation: bEnd, point: a.end, other: b },
  ] as const;
  for (const candidate of candidates) {
    if (candidate.orientation === 0 && pointOnClosedSegment(candidate.point, candidate.other)) {
      return classifyTouch(candidate.point, a, b);
    }
  }
  return DISJOINT;
}

type Direction = Readonly<{ x: bigint; y: bigint }>;

function direction(center: ProjectivePoint2, endpoint: ProjectivePoint2): Direction {
  if (equalProjectivePoints(center, endpoint)) {
    throw new RangeError('an angular direction requires a distinct endpoint');
  }
  return {
    x: endpoint[0] * center[2] - center[0] * endpoint[2],
    y: endpoint[1] * center[2] - center[1] * endpoint[2],
  };
}

function angularHalf(ray: Direction): 0 | 1 {
  return ray.y > 0n || (ray.y === 0n && ray.x > 0n) ? 0 : 1;
}

/**
 * Orders rays from positive x through positive y, negative x, then negative y.
 * This is increasing algebraic angle in stored paper coordinates (clockwise in
 * the right-handed world convention because stored y points down).
 */
export function compareProjectiveDirections(
  center: ProjectivePoint2,
  leftEndpoint: ProjectivePoint2,
  rightEndpoint: ProjectivePoint2,
): -1 | 0 | 1 {
  const left = direction(center, leftEndpoint);
  const right = direction(center, rightEndpoint);
  const halfDifference = angularHalf(left) - angularHalf(right);
  if (halfDifference < 0) return -1;
  if (halfDifference > 0) return 1;
  return sign(left.x * right.y - left.y * right.x) === 1
    ? -1
    : sign(left.x * right.y - left.y * right.x) === -1
      ? 1
      : 0;
}

export function addProjectiveRationalComponents(
  left: ProjectiveRationalComponent,
  right: ProjectiveRationalComponent,
): ProjectiveRationalComponent {
  return canonicalProjectiveRationalComponent(
    left[0] * right[1] + right[0] * left[1],
    left[1] * right[1],
  );
}

export function compareProjectiveRationalComponents(
  left: ProjectiveRationalComponent,
  right: ProjectiveRationalComponent,
): -1 | 0 | 1 {
  return sign(left[0] * right[1] - right[0] * left[1]);
}

export function equalProjectiveRationalComponents(
  left: ProjectiveRationalComponent,
  right: ProjectiveRationalComponent,
): boolean {
  return compareProjectiveRationalComponents(left, right) === 0;
}

export function signProjectiveRationalComponent(value: ProjectiveRationalComponent): -1 | 0 | 1 {
  return sign(value[0]);
}

/** Exact twice-signed affine area of one triangle. */
export function projectiveTriangleTwiceSignedArea(
  first: ProjectivePoint2,
  second: ProjectivePoint2,
  third: ProjectivePoint2,
): ProjectiveRationalComponent {
  const determinant =
    first[0] * (second[1] * third[2] - second[2] * third[1]) -
    first[1] * (second[0] * third[2] - second[2] * third[0]) +
    first[2] * (second[0] * third[1] - second[1] * third[0]);
  return canonicalProjectiveRationalComponent(determinant, first[2] * second[2] * third[2]);
}

/** Exact twice-signed affine area of a polygon ring. */
export function projectivePolygonTwiceSignedArea(
  points: readonly ProjectivePoint2[],
): ProjectiveRationalComponent {
  if (points.length < 3) throw new RangeError('a polygon area requires at least three points');
  let area = canonicalProjectiveRationalComponent(0n);
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (current === undefined || next === undefined) {
      throw new TypeError('polygon ring contains a missing point');
    }
    const cross = canonicalProjectiveRationalComponent(
      current[0] * next[1] - current[1] * next[0],
      current[2] * next[2],
    );
    area = addProjectiveRationalComponents(area, cross);
  }
  return area;
}
