import {
  parseStaticRationalTriangleOverlapInputV1,
  STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS,
  type StaticRationalTriangle3,
  type StaticRationalTriangleOverlapClassification,
  type StaticRationalTriangleOverlapInputV1,
  type StaticRationalTriangleOverlapIssueCode,
} from './static-rational-triangle-overlap.js';
import {
  canonicalProjectivePoint3,
  type ProjectiveAxis3,
  type ProjectivePoint3,
} from '../reference-verifier/projective-rational-3d.js';

/**
 * Defensive limits for one pair-level static construction. These are candidate
 * experiment guards, not a browser SupportProfile or a continuous-time claim.
 */
export const STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS = Object.freeze({
  maxInputCoordinateBits: STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxCoordinateBits,
  maxOutputCoordinateBits: 131_072,
  maxIntermediateArithmeticBits: 524_288,
  maxExactOperations: 4_096,
  maxOutputVertices: 6,
  maxIssues: STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxIssues,
  maxOwnPropertiesPerInputContainer:
    STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxOwnPropertiesPerContainer,
  maxDiagnosticPathSegmentCodeUnits:
    STATIC_RATIONAL_TRIANGLE_OVERLAP_LIMITS.maxDiagnosticPathSegmentCodeUnits,
} as const);

// `maxExactOperations` counts each producer-level BigInt add, subtract,
// multiply, negate, and canonical-point normalization. Engine steps inside one
// bounded BigInt operation or gcd normalization are not presented as separate
// operations; their operands remain covered by the published bit ceilings.

export type StaticRationalTriangleIntersectionLocusKind =
  'empty' | 'point' | 'segment' | 'coplanar-polygon';

export type StaticRationalTriangleSupportingPlaneRelation =
  'coplanar' | 'parallel-distinct' | 'intersecting-planes';

export type StaticRationalTriangleIntersectionLocusIssueCode =
  | StaticRationalTriangleOverlapIssueCode
  | 'intermediate-arithmetic-limit-exceeded'
  | 'output-coordinate-limit-exceeded'
  | 'exact-operation-limit-exceeded'
  | 'construction-invariant-failed';

export type StaticRationalTriangleIntersectionLocusIssue = Readonly<{
  path: string;
  code: StaticRationalTriangleIntersectionLocusIssueCode;
  message: string;
}>;

export type StaticRationalTriangleIntersectionLocusInputV1 = StaticRationalTriangleOverlapInputV1;

export type StaticRationalTriangleIntersectionLocusInputParseResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleIntersectionLocusInputV1 }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleIntersectionLocusIssue[];
    }>;

/** Raw static geometry only; every policy, motion, verification, and GO claim is false. */
export type StaticRationalTriangleIntersectionLocusRecordV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-static-rational-triangle-intersection-locus';
  contractStatus: 'candidate-no-claim';
  predicateScope: 'one-static-configuration-of-two-closed-triangles';
  arithmetic: 'exact-projective-rational-bigint';
  supportingPlaneRelation: StaticRationalTriangleSupportingPlaneRelation;
  canonicalProjectionDropAxis: ProjectiveAxis3 | null;
  locusKind: StaticRationalTriangleIntersectionLocusKind;
  vertices: readonly ProjectivePoint3[];
  derivedStaticClassification: StaticRationalTriangleOverlapClassification;
  closedTrianglesIntersect: boolean;
  boundaryContactCountsAsIntersection: true;
  rawGeometricLocusIncluded: true;
  staticPredicateIncluded: true;
  meshIdentityBindingIncluded: false;
  sourceEvidenceBindingIncluded: false;
  declaredHingePolicyIncluded: false;
  legalContactClassificationIncluded: false;
  penetrationClassificationIncluded: false;
  selfIntersectionClassificationIncluded: false;
  independentAuditIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  rigidMotionIntervalIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleIntersectionLocusResultV1 =
  | Readonly<{ ok: true; value: StaticRationalTriangleIntersectionLocusRecordV1 }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleIntersectionLocusIssue[];
    }>;

type IntegerVector3 = readonly [x: bigint, y: bigint, z: bigint];
type Plane3 = Readonly<{ a: bigint; b: bigint; c: bigint; d: bigint }>;
type ConstructedShape = Readonly<{
  kind: StaticRationalTriangleIntersectionLocusKind;
  vertices: readonly ProjectivePoint3[];
}>;

const TRIANGLE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const;
const TRIANGLE_INDICES = [0, 1, 2] as const;

class ConstructionFailure extends Error {
  readonly code: Extract<
    StaticRationalTriangleIntersectionLocusIssueCode,
    | 'intermediate-arithmetic-limit-exceeded'
    | 'output-coordinate-limit-exceeded'
    | 'exact-operation-limit-exceeded'
    | 'construction-invariant-failed'
  >;

  constructor(code: ConstructionFailure['code'], message: string) {
    super(message);
    this.name = 'StaticRationalTriangleIntersectionLocusConstructionFailure';
    this.code = code;
  }
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function bitLength(value: bigint): number {
  const magnitude = absolute(value);
  return magnitude === 0n ? 0 : magnitude.toString(2).length;
}

function sign(value: bigint): -1 | 0 | 1 {
  return value < 0n ? -1 : value > 0n ? 1 : 0;
}

function sameCanonicalPoint(left: ProjectivePoint3, right: ProjectivePoint3): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z && left.w === right.w;
}

function required<T>(value: T | undefined, context: string): T {
  if (value !== undefined) return value;
  throw new ConstructionFailure(
    'construction-invariant-failed',
    `required construction value is missing: ${context}`,
  );
}

class ExactArithmeticBudget {
  private operationCount = 0;

  private consume(): void {
    this.operationCount += 1;
    if (
      this.operationCount > STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxExactOperations
    ) {
      throw new ConstructionFailure(
        'exact-operation-limit-exceeded',
        `construction exceeds ${STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxExactOperations} exact operations`,
      );
    }
  }

  private intermediate(value: bigint): bigint {
    if (
      bitLength(value) >
      STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxIntermediateArithmeticBits
    ) {
      throw new ConstructionFailure(
        'intermediate-arithmetic-limit-exceeded',
        `intermediate value exceeds ${STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxIntermediateArithmeticBits} bits`,
      );
    }
    return value;
  }

  add(left: bigint, right: bigint): bigint {
    this.consume();
    return this.intermediate(left + right);
  }

  subtract(left: bigint, right: bigint): bigint {
    this.consume();
    return this.intermediate(left - right);
  }

  multiply(left: bigint, right: bigint): bigint {
    this.consume();
    if (left === 0n || right === 0n) return 0n;
    const possibleBits = bitLength(left) + bitLength(right) - 1;
    if (
      possibleBits >
      STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxIntermediateArithmeticBits
    ) {
      throw new ConstructionFailure(
        'intermediate-arithmetic-limit-exceeded',
        `intermediate product exceeds ${STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxIntermediateArithmeticBits} bits`,
      );
    }
    return this.intermediate(left * right);
  }

  negate(value: bigint): bigint {
    this.consume();
    return this.intermediate(-value);
  }

  normalizePoint(x: bigint, y: bigint, z: bigint, w: bigint): ProjectivePoint3 {
    this.consume();
    this.intermediate(x);
    this.intermediate(y);
    this.intermediate(z);
    this.intermediate(w);
    if (w === 0n) {
      throw new ConstructionFailure(
        'construction-invariant-failed',
        'constructed finite point has zero homogeneous weight',
      );
    }
    const point = canonicalProjectivePoint3(x, y, z, w);
    this.intermediate(point.x);
    this.intermediate(point.y);
    this.intermediate(point.z);
    this.intermediate(point.w);
    return point;
  }

  requireOutputPoint(point: ProjectivePoint3): void {
    for (const coordinate of [point.x, point.y, point.z, point.w]) {
      if (
        bitLength(coordinate) >
        STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxOutputCoordinateBits
      ) {
        throw new ConstructionFailure(
          'output-coordinate-limit-exceeded',
          `canonical output coordinate exceeds ${STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxOutputCoordinateBits} bits`,
        );
      }
    }
  }
}

function constructionIssue(
  code: ConstructionFailure['code'],
  message: string,
): StaticRationalTriangleIntersectionLocusIssue {
  return Object.freeze({ path: '$', code, message });
}

function constructionFailureResult(
  code: ConstructionFailure['code'],
  message: string,
): Extract<StaticRationalTriangleIntersectionLocusResultV1, { ok: false }> {
  return Object.freeze({
    ok: false as const,
    error: Object.freeze([constructionIssue(code, message)]),
  });
}

/** Reuses the existing hostile-input boundary without weakening its limits. */
export function parseStaticRationalTriangleIntersectionLocusInputV1(
  supplied: unknown,
): StaticRationalTriangleIntersectionLocusInputParseResultV1 {
  const parsed = parseStaticRationalTriangleOverlapInputV1(supplied);
  if (parsed.ok) return parsed;
  return Object.freeze({ ok: false as const, error: parsed.error });
}

function affineDifferenceNumerators(
  origin: ProjectivePoint3,
  endpoint: ProjectivePoint3,
  budget: ExactArithmeticBudget,
): IntegerVector3 {
  return [
    budget.subtract(budget.multiply(endpoint.x, origin.w), budget.multiply(origin.x, endpoint.w)),
    budget.subtract(budget.multiply(endpoint.y, origin.w), budget.multiply(origin.y, endpoint.w)),
    budget.subtract(budget.multiply(endpoint.z, origin.w), budget.multiply(origin.z, endpoint.w)),
  ];
}

function cross(
  left: IntegerVector3,
  right: IntegerVector3,
  budget: ExactArithmeticBudget,
): IntegerVector3 {
  return [
    budget.subtract(budget.multiply(left[1], right[2]), budget.multiply(left[2], right[1])),
    budget.subtract(budget.multiply(left[2], right[0]), budget.multiply(left[0], right[2])),
    budget.subtract(budget.multiply(left[0], right[1]), budget.multiply(left[1], right[0])),
  ];
}

function isZeroVector(vector: IntegerVector3): boolean {
  return vector[0] === 0n && vector[1] === 0n && vector[2] === 0n;
}

function planeThroughTriangle(
  triangle: StaticRationalTriangle3,
  budget: ExactArithmeticBudget,
): Plane3 {
  const firstToSecond = affineDifferenceNumerators(triangle[0], triangle[1], budget);
  const firstToThird = affineDifferenceNumerators(triangle[0], triangle[2], budget);
  const normal = cross(firstToSecond, firstToThird, budget);
  if (isZeroVector(normal)) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'validated triangle unexpectedly has a zero supporting-plane normal',
    );
  }
  const a = budget.multiply(normal[0], triangle[0].w);
  const b = budget.multiply(normal[1], triangle[0].w);
  const c = budget.multiply(normal[2], triangle[0].w);
  const d = budget.negate(
    budget.add(
      budget.add(
        budget.multiply(normal[0], triangle[0].x),
        budget.multiply(normal[1], triangle[0].y),
      ),
      budget.multiply(normal[2], triangle[0].z),
    ),
  );
  return Object.freeze({ a, b, c, d });
}

function planeEvaluation(
  plane: Plane3,
  point: ProjectivePoint3,
  budget: ExactArithmeticBudget,
): bigint {
  return budget.add(
    budget.add(
      budget.add(budget.multiply(plane.a, point.x), budget.multiply(plane.b, point.y)),
      budget.multiply(plane.c, point.z),
    ),
    budget.multiply(plane.d, point.w),
  );
}

function maximumNormalAxis(plane: Plane3): ProjectiveAxis3 {
  let axis: ProjectiveAxis3 = 'x';
  let magnitude = absolute(plane.a);
  if (absolute(plane.b) > magnitude) {
    axis = 'y';
    magnitude = absolute(plane.b);
  }
  if (absolute(plane.c) > magnitude) axis = 'z';
  return axis;
}

function retainedAxes(drop: ProjectiveAxis3): readonly [ProjectiveAxis3, ProjectiveAxis3] {
  return drop === 'x' ? ['y', 'z'] : drop === 'y' ? ['x', 'z'] : ['x', 'y'];
}

function determinant3(
  first: readonly [bigint, bigint, bigint],
  second: readonly [bigint, bigint, bigint],
  third: readonly [bigint, bigint, bigint],
  budget: ExactArithmeticBudget,
): bigint {
  const firstMinor = budget.subtract(
    budget.multiply(second[1], third[2]),
    budget.multiply(second[2], third[1]),
  );
  const secondMinor = budget.subtract(
    budget.multiply(second[0], third[2]),
    budget.multiply(second[2], third[0]),
  );
  const thirdMinor = budget.subtract(
    budget.multiply(second[0], third[1]),
    budget.multiply(second[1], third[0]),
  );
  return budget.add(
    budget.subtract(budget.multiply(first[0], firstMinor), budget.multiply(first[1], secondMinor)),
    budget.multiply(first[2], thirdMinor),
  );
}

function projectedOrientationValue(
  first: ProjectivePoint3,
  second: ProjectivePoint3,
  third: ProjectivePoint3,
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): bigint {
  const [u, v] = retainedAxes(drop);
  return determinant3(
    [first[u], first[v], first.w],
    [second[u], second[v], second.w],
    [third[u], third[v], third.w],
    budget,
  );
}

function compareCoordinate(
  left: ProjectivePoint3,
  right: ProjectivePoint3,
  coordinate: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): -1 | 0 | 1 {
  return sign(
    budget.subtract(
      budget.multiply(left[coordinate], right.w),
      budget.multiply(right[coordinate], left.w),
    ),
  );
}

function compareAffineLexicographically(
  left: ProjectivePoint3,
  right: ProjectivePoint3,
  budget: ExactArithmeticBudget,
): -1 | 0 | 1 {
  const x = compareCoordinate(left, right, 'x', budget);
  if (x !== 0) return x;
  const y = compareCoordinate(left, right, 'y', budget);
  return y === 0 ? compareCoordinate(left, right, 'z', budget) : y;
}

function compareProjectedLexicographically(
  left: ProjectivePoint3,
  right: ProjectivePoint3,
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): -1 | 0 | 1 {
  const [u, v] = retainedAxes(drop);
  const first = compareCoordinate(left, right, u, budget);
  return first === 0 ? compareCoordinate(left, right, v, budget) : first;
}

function deterministicSort(
  points: readonly ProjectivePoint3[],
  compare: (left: ProjectivePoint3, right: ProjectivePoint3) => -1 | 0 | 1,
): ProjectivePoint3[] {
  const sorted: ProjectivePoint3[] = [];
  for (const point of points) {
    let insertion = sorted.length;
    while (
      insertion > 0 &&
      compare(point, required(sorted[insertion - 1], 'sort predecessor')) < 0
    ) {
      insertion -= 1;
    }
    sorted.splice(insertion, 0, point);
  }
  return sorted;
}

function appendUnique(points: ProjectivePoint3[], point: ProjectivePoint3): void {
  if (!points.some((candidate) => sameCanonicalPoint(candidate, point))) points.push(point);
}

function canonicalLinearIntersection(
  start: ProjectivePoint3,
  end: ProjectivePoint3,
  startEvaluation: bigint,
  endEvaluation: bigint,
  budget: ExactArithmeticBudget,
): ProjectivePoint3 {
  if (
    (startEvaluation === 0n && endEvaluation === 0n) ||
    (sign(startEvaluation) === sign(endEvaluation) && startEvaluation !== 0n)
  ) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'intersection construction requires one closed boundary transition',
    );
  }
  return budget.normalizePoint(
    budget.subtract(
      budget.multiply(startEvaluation, end.x),
      budget.multiply(endEvaluation, start.x),
    ),
    budget.subtract(
      budget.multiply(startEvaluation, end.y),
      budget.multiply(endEvaluation, start.y),
    ),
    budget.subtract(
      budget.multiply(startEvaluation, end.z),
      budget.multiply(endEvaluation, start.z),
    ),
    budget.subtract(
      budget.multiply(startEvaluation, end.w),
      budget.multiply(endEvaluation, start.w),
    ),
  );
}

function oppositeSigns(left: bigint, right: bigint): boolean {
  return (left < 0n && right > 0n) || (left > 0n && right < 0n);
}

function trianglePlaneSlice(
  triangle: StaticRationalTriangle3,
  plane: Plane3,
  budget: ExactArithmeticBudget,
): readonly ProjectivePoint3[] {
  const evaluations = triangle.map((point) => planeEvaluation(plane, point, budget));
  const points: ProjectivePoint3[] = [];
  for (const index of TRIANGLE_INDICES) {
    if (required(evaluations[index], 'triangle-plane vertex evaluation') === 0n) {
      appendUnique(points, triangle[index]);
    }
  }
  for (const [startIndex, endIndex] of TRIANGLE_EDGES) {
    const startEvaluation = required(evaluations[startIndex], 'slice edge start evaluation');
    const endEvaluation = required(evaluations[endIndex], 'slice edge end evaluation');
    if (!oppositeSigns(startEvaluation, endEvaluation)) continue;
    appendUnique(
      points,
      canonicalLinearIntersection(
        triangle[startIndex],
        triangle[endIndex],
        startEvaluation,
        endEvaluation,
        budget,
      ),
    );
  }
  if (points.length > 2) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'a noncoplanar triangle-plane slice produced more than two canonical points',
    );
  }
  return Object.freeze(
    deterministicSort(points, (left, right) => compareAffineLexicographically(left, right, budget)),
  );
}

function shapeFromLineIntervals(
  first: readonly ProjectivePoint3[],
  second: readonly ProjectivePoint3[],
  budget: ExactArithmeticBudget,
): ConstructedShape {
  if (first.length === 0 || second.length === 0) {
    return Object.freeze({ kind: 'empty' as const, vertices: Object.freeze([]) });
  }
  const firstLower = required(first[0], 'first interval lower endpoint');
  const firstUpper = required(first[first.length - 1], 'first interval upper endpoint');
  const secondLower = required(second[0], 'second interval lower endpoint');
  const secondUpper = required(second[second.length - 1], 'second interval upper endpoint');
  const lower =
    compareAffineLexicographically(firstLower, secondLower, budget) >= 0 ? firstLower : secondLower;
  const upper =
    compareAffineLexicographically(firstUpper, secondUpper, budget) <= 0 ? firstUpper : secondUpper;
  const order = compareAffineLexicographically(lower, upper, budget);
  if (order > 0) {
    return Object.freeze({ kind: 'empty' as const, vertices: Object.freeze([]) });
  }
  if (order === 0) {
    return Object.freeze({ kind: 'point' as const, vertices: Object.freeze([lower]) });
  }
  return Object.freeze({ kind: 'segment' as const, vertices: Object.freeze([lower, upper]) });
}

function counterclockwiseTriangle(
  triangle: StaticRationalTriangle3,
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): readonly [ProjectivePoint3, ProjectivePoint3, ProjectivePoint3] {
  const orientation = sign(
    projectedOrientationValue(triangle[0], triangle[1], triangle[2], drop, budget),
  );
  if (orientation === 0) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'validated coplanar triangle collapsed in an injective projection',
    );
  }
  return orientation > 0
    ? Object.freeze([triangle[0], triangle[1], triangle[2]] as const)
    : Object.freeze([triangle[0], triangle[2], triangle[1]] as const);
}

function removeConsecutiveDuplicates(points: readonly ProjectivePoint3[]): ProjectivePoint3[] {
  const deduplicated: ProjectivePoint3[] = [];
  for (const point of points) {
    const previous = deduplicated[deduplicated.length - 1];
    if (previous === undefined || !sameCanonicalPoint(previous, point)) deduplicated.push(point);
  }
  if (
    deduplicated.length > 1 &&
    sameCanonicalPoint(
      required(deduplicated[0], 'deduplicated first point'),
      required(deduplicated[deduplicated.length - 1], 'deduplicated last point'),
    )
  ) {
    deduplicated.pop();
  }
  return deduplicated;
}

function clipClosedConvexPolygon(
  subjectTriangle: StaticRationalTriangle3,
  clipTriangle: StaticRationalTriangle3,
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): readonly ProjectivePoint3[] {
  let subject: readonly ProjectivePoint3[] = counterclockwiseTriangle(
    subjectTriangle,
    drop,
    budget,
  );
  const clip = counterclockwiseTriangle(clipTriangle, drop, budget);
  for (let stage = 0; stage < TRIANGLE_EDGES.length; stage += 1) {
    if (subject.length === 0) break;
    const [clipStartIndex, clipEndIndex] = required(TRIANGLE_EDGES[stage], 'clip stage edge');
    const clipStart = clip[clipStartIndex];
    const clipEnd = clip[clipEndIndex];
    const output: ProjectivePoint3[] = [];
    let previous = required(subject[subject.length - 1], 'clip subject previous point');
    let previousEvaluation = projectedOrientationValue(clipStart, clipEnd, previous, drop, budget);
    for (const current of subject) {
      const currentEvaluation = projectedOrientationValue(
        clipStart,
        clipEnd,
        current,
        drop,
        budget,
      );
      const previousInside = previousEvaluation >= 0n;
      const currentInside = currentEvaluation >= 0n;
      if (currentInside) {
        if (!previousInside) {
          output.push(
            canonicalLinearIntersection(
              previous,
              current,
              previousEvaluation,
              currentEvaluation,
              budget,
            ),
          );
        }
        output.push(current);
      } else if (previousInside) {
        output.push(
          canonicalLinearIntersection(
            previous,
            current,
            previousEvaluation,
            currentEvaluation,
            budget,
          ),
        );
      }
      previous = current;
      previousEvaluation = currentEvaluation;
    }
    subject = removeConsecutiveDuplicates(output);
    const stageBound = 3 + stage + 1;
    if (subject.length > stageBound) {
      throw new ConstructionFailure(
        'construction-invariant-failed',
        `closed convex clip stage exceeded its ${stageBound}-vertex bound`,
      );
    }
  }
  return Object.freeze([...subject]);
}

function canonicalConvexHull(
  supplied: readonly ProjectivePoint3[],
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): readonly ProjectivePoint3[] {
  const unique: ProjectivePoint3[] = [];
  for (const point of supplied) appendUnique(unique, point);
  const sorted = deterministicSort(unique, (left, right) =>
    compareProjectedLexicographically(left, right, drop, budget),
  );
  if (sorted.length <= 1) return Object.freeze(sorted);

  const buildHalf = (points: readonly ProjectivePoint3[]): ProjectivePoint3[] => {
    const half: ProjectivePoint3[] = [];
    for (const point of points) {
      while (
        half.length >= 2 &&
        projectedOrientationValue(
          required(half[half.length - 2], 'convex hull penultimate point'),
          required(half[half.length - 1], 'convex hull last point'),
          point,
          drop,
          budget,
        ) <= 0n
      ) {
        half.pop();
      }
      half.push(point);
    }
    return half;
  };

  const lower = buildHalf(sorted);
  const upper = buildHalf([...sorted].reverse());
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return Object.freeze(hull);
}

function canonicalShapeFromCoplanarPoints(
  points: readonly ProjectivePoint3[],
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): ConstructedShape {
  const hull = canonicalConvexHull(points, drop, budget);
  if (hull.length === 0) {
    return Object.freeze({ kind: 'empty' as const, vertices: Object.freeze([]) });
  }
  if (hull.length === 1) {
    return Object.freeze({
      kind: 'point' as const,
      vertices: Object.freeze([required(hull[0], 'point hull vertex')]),
    });
  }
  if (hull.length === 2) {
    const first = required(hull[0], 'segment hull first vertex');
    const second = required(hull[1], 'segment hull second vertex');
    const ordered =
      compareAffineLexicographically(first, second, budget) < 0 ? [first, second] : [second, first];
    return Object.freeze({ kind: 'segment' as const, vertices: Object.freeze(ordered) });
  }
  if (hull.length > STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxOutputVertices) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'coplanar triangle intersection hull exceeds six vertices',
    );
  }
  let firstIndex = 0;
  for (let index = 1; index < hull.length; index += 1) {
    if (
      compareAffineLexicographically(
        required(hull[index], 'polygon candidate first vertex'),
        required(hull[firstIndex], 'polygon current first vertex'),
        budget,
      ) < 0
    ) {
      firstIndex = index;
    }
  }
  const rotated = [...hull.slice(firstIndex), ...hull.slice(0, firstIndex)];
  return Object.freeze({
    kind: 'coplanar-polygon' as const,
    vertices: Object.freeze(rotated),
  });
}

function pointInProjectedClosedTriangle(
  point: ProjectivePoint3,
  triangle: StaticRationalTriangle3,
  drop: ProjectiveAxis3,
  budget: ExactArithmeticBudget,
): boolean {
  let hasPositive = false;
  let hasNegative = false;
  for (const [start, end] of TRIANGLE_EDGES) {
    const orientation = sign(
      projectedOrientationValue(triangle[start], triangle[end], point, drop, budget),
    );
    if (orientation > 0) hasPositive = true;
    if (orientation < 0) hasNegative = true;
  }
  return !(hasPositive && hasNegative);
}

function validateConstructedShape(
  shape: ConstructedShape,
  relation: StaticRationalTriangleSupportingPlaneRelation,
  projectionDropAxis: ProjectiveAxis3 | null,
  triangleA: StaticRationalTriangle3,
  triangleB: StaticRationalTriangle3,
  planeA: Plane3,
  planeB: Plane3,
  budget: ExactArithmeticBudget,
): void {
  const expectedCounts =
    shape.kind === 'empty'
      ? shape.vertices.length === 0
      : shape.kind === 'point'
        ? shape.vertices.length === 1
        : shape.kind === 'segment'
          ? shape.vertices.length === 2
          : shape.vertices.length >= 3 &&
            shape.vertices.length <=
              STATIC_RATIONAL_TRIANGLE_INTERSECTION_LOCUS_LIMITS.maxOutputVertices;
  if (!expectedCounts) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'locus kind and canonical vertex count disagree',
    );
  }
  if ((relation === 'coplanar') !== (projectionDropAxis !== null)) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'projection axis must exist exactly for coplanar supporting planes',
    );
  }
  if (relation === 'parallel-distinct' && shape.kind !== 'empty') {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'distinct parallel supporting planes cannot have a nonempty locus',
    );
  }
  if (shape.kind === 'coplanar-polygon' && relation !== 'coplanar') {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'an area polygon requires coplanar supporting planes',
    );
  }
  for (let first = 0; first < shape.vertices.length; first += 1) {
    const point = required(shape.vertices[first], 'validated locus vertex');
    budget.requireOutputPoint(point);
    for (let second = first + 1; second < shape.vertices.length; second += 1) {
      if (
        sameCanonicalPoint(point, required(shape.vertices[second], 'validated duplicate candidate'))
      ) {
        throw new ConstructionFailure(
          'construction-invariant-failed',
          'canonical locus contains a duplicate vertex',
        );
      }
    }
    if (
      planeEvaluation(planeA, point, budget) !== 0n ||
      planeEvaluation(planeB, point, budget) !== 0n
    ) {
      throw new ConstructionFailure(
        'construction-invariant-failed',
        'canonical locus vertex is outside one supporting plane',
      );
    }
    if (
      !pointInProjectedClosedTriangle(point, triangleA, maximumNormalAxis(planeA), budget) ||
      !pointInProjectedClosedTriangle(point, triangleB, maximumNormalAxis(planeB), budget)
    ) {
      throw new ConstructionFailure(
        'construction-invariant-failed',
        'canonical locus vertex is outside one closed triangle',
      );
    }
  }
  if (
    shape.kind === 'segment' &&
    compareAffineLexicographically(
      required(shape.vertices[0], 'segment first endpoint'),
      required(shape.vertices[1], 'segment second endpoint'),
      budget,
    ) >= 0
  ) {
    throw new ConstructionFailure(
      'construction-invariant-failed',
      'segment endpoints are not strictly canonical ordered',
    );
  }
  if (shape.kind === 'coplanar-polygon') {
    if (projectionDropAxis === null) {
      throw new ConstructionFailure(
        'construction-invariant-failed',
        'coplanar polygon is missing its canonical projection axis',
      );
    }
    for (let index = 0; index < shape.vertices.length; index += 1) {
      const first = required(shape.vertices[index], 'polygon turn first vertex');
      const second = required(
        shape.vertices[(index + 1) % shape.vertices.length],
        'polygon turn second vertex',
      );
      const third = required(
        shape.vertices[(index + 2) % shape.vertices.length],
        'polygon turn third vertex',
      );
      if (projectedOrientationValue(first, second, third, projectionDropAxis, budget) <= 0n) {
        throw new ConstructionFailure(
          'construction-invariant-failed',
          'coplanar polygon is not strictly convex and counterclockwise',
        );
      }
    }
    for (let index = 1; index < shape.vertices.length; index += 1) {
      if (
        compareAffineLexicographically(
          required(shape.vertices[0], 'polygon canonical first vertex'),
          required(shape.vertices[index], 'polygon later vertex'),
          budget,
        ) >= 0
      ) {
        throw new ConstructionFailure(
          'construction-invariant-failed',
          'coplanar polygon is not rotated to its canonical first vertex',
        );
      }
    }
  }
}

function makeRecord(
  relation: StaticRationalTriangleSupportingPlaneRelation,
  projectionDropAxis: ProjectiveAxis3 | null,
  shape: ConstructedShape,
): StaticRationalTriangleIntersectionLocusRecordV1 {
  const classification: StaticRationalTriangleOverlapClassification =
    shape.kind === 'empty'
      ? 'disjoint'
      : relation === 'coplanar'
        ? 'intersecting-coplanar'
        : 'intersecting-noncoplanar';
  return Object.freeze({
    schemaVersion: 1 as const,
    recordType: 'm0f-static-rational-triangle-intersection-locus' as const,
    contractStatus: 'candidate-no-claim' as const,
    predicateScope: 'one-static-configuration-of-two-closed-triangles' as const,
    arithmetic: 'exact-projective-rational-bigint' as const,
    supportingPlaneRelation: relation,
    canonicalProjectionDropAxis: projectionDropAxis,
    locusKind: shape.kind,
    vertices: Object.freeze([...shape.vertices]),
    derivedStaticClassification: classification,
    closedTrianglesIntersect: shape.kind !== 'empty',
    boundaryContactCountsAsIntersection: true as const,
    rawGeometricLocusIncluded: true as const,
    staticPredicateIncluded: true as const,
    meshIdentityBindingIncluded: false as const,
    sourceEvidenceBindingIncluded: false as const,
    declaredHingePolicyIncluded: false as const,
    legalContactClassificationIncluded: false as const,
    penetrationClassificationIncluded: false as const,
    selfIntersectionClassificationIncluded: false as const,
    independentAuditIncluded: false as const,
    continuousTimeIncluded: false as const,
    continuousCollisionDetectionIncluded: false as const,
    rigidMotionIntervalIncluded: false as const,
    collisionFreeClaim: false as const,
    verifiedClaim: false as const,
    scientificClaim: false as const,
    globalM0fGo: false as const,
  });
}

function constructTrusted(
  input: StaticRationalTriangleIntersectionLocusInputV1,
  budget: ExactArithmeticBudget,
): StaticRationalTriangleIntersectionLocusRecordV1 {
  const { triangleA, triangleB } = input;
  const planeA = planeThroughTriangle(triangleA, budget);
  const planeB = planeThroughTriangle(triangleB, budget);
  const evaluationsOfB = triangleB.map((point) => planeEvaluation(planeA, point, budget));

  let relation: StaticRationalTriangleSupportingPlaneRelation;
  let projectionDropAxis: ProjectiveAxis3 | null;
  let shape: ConstructedShape;

  if (evaluationsOfB.every((value) => value === 0n)) {
    relation = 'coplanar';
    projectionDropAxis = maximumNormalAxis(planeA);
    const clipped = clipClosedConvexPolygon(triangleA, triangleB, projectionDropAxis, budget);
    shape = canonicalShapeFromCoplanarPoints(clipped, projectionDropAxis, budget);
  } else {
    const normalCross = cross(
      [planeA.a, planeA.b, planeA.c],
      [planeB.a, planeB.b, planeB.c],
      budget,
    );
    projectionDropAxis = null;
    if (isZeroVector(normalCross)) {
      relation = 'parallel-distinct';
      shape = Object.freeze({ kind: 'empty' as const, vertices: Object.freeze([]) });
    } else {
      relation = 'intersecting-planes';
      const sliceA = trianglePlaneSlice(triangleA, planeB, budget);
      const sliceB = trianglePlaneSlice(triangleB, planeA, budget);
      shape = shapeFromLineIntervals(sliceA, sliceB, budget);
    }
  }

  validateConstructedShape(
    shape,
    relation,
    projectionDropAxis,
    triangleA,
    triangleB,
    planeA,
    planeB,
    budget,
  );
  return makeRecord(relation, projectionDropAxis, shape);
}

/**
 * Constructs one canonical raw intersection locus for two closed static
 * triangles. It follows no motion, applies no legal-contact policy, does not
 * independently audit itself, and cannot establish collision freedom or GO.
 */
export function constructStaticRationalTriangleIntersectionLocusV1(
  supplied: unknown,
): StaticRationalTriangleIntersectionLocusResultV1 {
  const parsed = parseStaticRationalTriangleIntersectionLocusInputV1(supplied);
  if (!parsed.ok) return parsed;
  try {
    const value = constructTrusted(parsed.value, new ExactArithmeticBudget());
    return Object.freeze({ ok: true as const, value });
  } catch (caught) {
    if (caught instanceof ConstructionFailure) {
      return constructionFailureResult(caught.code, caught.message);
    }
    return constructionFailureResult(
      'construction-invariant-failed',
      'static exact triangle intersection-locus construction failed closed unexpectedly',
    );
  }
}
