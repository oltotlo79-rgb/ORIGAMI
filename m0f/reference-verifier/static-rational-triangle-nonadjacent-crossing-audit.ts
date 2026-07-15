/**
 * Import-free independent audit for portable positive nonadjacent crossing
 * witnesses. This file deliberately shares no producer geometry or parser.
 */

export const STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE =
  'm0f-static-rational-triangle-nonadjacent-crossing-audit' as const;

export const STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS = Object.freeze({
  maxTriangles: 64,
  maxPairs: 2_016,
  maxWitnesses: 2_016,
  maxDeclaredHingeFacePairs: 2_016,
  maxIdCodeUnits: 128,
  maxCoordinateDecimalDigits: 4_934,
  maxDepth: 16,
  maxNodes: 200_000,
  maxOwnPropertiesPerContainer: 32,
  maxTotalStringCodeUnits: 5_000_000,
} as const);

export type StaticRationalTriangleNonadjacentCrossingAuditIssueV1 = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type StaticRationalTriangleNonadjacentCrossingAuditConsistentV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  auditOutcome: 'consistent';
  auditedWitnessCount: number;
  allWitnessesCanonical: true;
  allWitnessPlanesNonparallel: true;
  allWitnessPointsStrictlyInsideBothTriangles: true;
  declaredNonadjacencyReplayed: true;
  positiveStaticCrossingEvidenceConfirmed: boolean;
  independentGeometryArithmeticIncluded: true;
  producerGeometryImported: false;
  producerParserImported: false;
  cryptographicSourceRevisionBindingIncluded: false;
  legalContactPolicyIncluded: false;
  selfIntersectionDecisionIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleNonadjacentCrossingAuditInconsistentV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE;
  contractStatus: 'candidate-no-claim';
  auditOutcome: 'inconsistent';
  firstInvalidWitnessIndex: number;
  reason:
    | 'declared-face-adjacency-conflict'
    | 'degenerate-triangle'
    | 'parallel-supporting-planes'
    | 'point-off-supporting-plane'
    | 'point-not-strictly-inside-both-triangles';
  positiveStaticCrossingEvidenceConfirmed: false;
  independentGeometryArithmeticIncluded: true;
  producerGeometryImported: false;
  producerParserImported: false;
  cryptographicSourceRevisionBindingIncluded: false;
  legalContactPolicyIncluded: false;
  selfIntersectionDecisionIncluded: false;
  continuousTimeIncluded: false;
  continuousCollisionDetectionIncluded: false;
  collisionFreeClaim: false;
  verifiedClaim: false;
  scientificClaim: false;
  globalM0fGo: false;
}>;

export type StaticRationalTriangleNonadjacentCrossingAuditResultV1 =
  | Readonly<{
      ok: true;
      value: StaticRationalTriangleNonadjacentCrossingAuditConsistentV1;
    }>
  | Readonly<{
      ok: false;
      value: StaticRationalTriangleNonadjacentCrossingAuditInconsistentV1;
    }>
  | Readonly<{
      ok: false;
      error: readonly StaticRationalTriangleNonadjacentCrossingAuditIssueV1[];
    }>;

type IntegerPoint3 = Readonly<{ x: bigint; y: bigint; z: bigint; w: bigint }>;
type Plane3 = Readonly<{ a: bigint; b: bigint; c: bigint; d: bigint }>;
type ParsedTriangle = Readonly<{
  triangleId: string;
  faceId: string;
  vertexIds: readonly [string, string, string];
  triangle: readonly [IntegerPoint3, IntegerPoint3, IntegerPoint3];
}>;
type ParsedWitness = Readonly<{
  witnessIndex: number;
  sourcePairIndex: number;
  first: ParsedTriangle;
  second: ParsedTriangle;
  point: IntegerPoint3;
}>;
type ParsedInput = Readonly<{
  declaredHingeFacePairKeys: ReadonlySet<string>;
  witnesses: readonly ParsedWitness[];
}>;
interface SnapshotBudget {
  nodes: number;
  totalStringCodeUnits: number;
}

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'coordinateEncoding',
  'meshRevisionId',
  'triangulationRevisionId',
  'poseRevisionId',
  'triangleCount',
  'unorderedPairCount',
  'declaredHingeFacePairs',
  'witnessCount',
  'witnesses',
  'completeProducerCrossingWitnessSet',
  'declaredHingeFacePairsCompleteForBoundMesh',
  'exactRelativeInteriorPointIncluded',
  'independentAuditIncluded',
  'cryptographicSourceRevisionBindingIncluded',
  'legalContactPolicyIncluded',
  'selfIntersectionDecisionIncluded',
  'continuousTimeIncluded',
  'continuousCollisionDetectionIncluded',
  'collisionFreeClaim',
  'verifiedClaim',
  'scientificClaim',
  'globalM0fGo',
] as const;
const HINGE_PAIR_KEYS = ['firstFaceId', 'secondFaceId'] as const;
const WITNESS_KEYS = [
  'witnessIndex',
  'sourcePairIndex',
  'first',
  'second',
  'exactRelativeInteriorPoint',
  'producerCategory',
  'producerLocusKind',
  'producerRelativeLocations',
] as const;
const TRIANGLE_KEYS = ['triangleId', 'faceId', 'vertexIds', 'triangle'] as const;
const POINT_KEYS = ['x', 'y', 'z', 'w'] as const;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;

function deepFreeze(value: unknown, seen = new WeakSet<object>()): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  Object.freeze(value);
}

function frozen<T>(value: T): T {
  deepFreeze(value);
  return value;
}

function issue(path: string, code: string, message: string) {
  return { path, code, message };
}

function contractFailure(
  path: string,
  code: string,
  message: string,
): StaticRationalTriangleNonadjacentCrossingAuditResultV1 {
  return frozen({ ok: false as const, error: [issue(path, code, message)] });
}

function captureSnapshot(
  supplied: unknown,
  path: string,
  depth: number,
  budget: SnapshotBudget,
): unknown {
  if (depth > STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxDepth) {
    throw new RangeError(`${path}:depth`);
  }
  budget.nodes += 1;
  if (budget.nodes > STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxNodes) {
    throw new RangeError(`${path}:nodes`);
  }
  if (supplied === null || typeof supplied === 'boolean' || typeof supplied === 'number') {
    return supplied;
  }
  if (typeof supplied === 'string') {
    budget.totalStringCodeUnits += supplied.length;
    if (
      budget.totalStringCodeUnits >
      STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxTotalStringCodeUnits
    ) {
      throw new RangeError(`${path}:strings`);
    }
    return supplied;
  }
  if (typeof supplied !== 'object') throw new TypeError(`${path}:type`);
  const prototype: unknown = Object.getPrototypeOf(supplied);
  if (Array.isArray(supplied)) {
    if (prototype !== Array.prototype) throw new TypeError(`${path}:prototype`);
    const keys = Reflect.ownKeys(supplied);
    if (
      keys.some(
        (key) =>
          typeof key !== 'string' ||
          (key !== 'length' &&
            (!/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= supplied.length)),
      ) ||
      keys.length !== supplied.length + 1
    ) {
      throw new TypeError(`${path}:array-shape`);
    }
    const result: unknown[] = [];
    for (let index = 0; index < supplied.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(supplied, String(index));
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        throw new TypeError(`${path}:array-descriptor`);
      }
      result.push(
        captureSnapshot(descriptor.value, `${path}[${String(index)}]`, depth + 1, budget),
      );
    }
    return result;
  }
  if (prototype !== Object.prototype && prototype !== null)
    throw new TypeError(`${path}:prototype`);
  const keys = Reflect.ownKeys(supplied);
  if (
    keys.length >
    STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxOwnPropertiesPerContainer
  ) {
    throw new RangeError(`${path}:properties`);
  }
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (typeof key !== 'string') throw new TypeError(`${path}:symbol`);
    const descriptor = Object.getOwnPropertyDescriptor(supplied, key);
    if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${path}:descriptor`);
    }
    result[key] = captureSnapshot(descriptor.value, `${path}.${key}`, depth + 1, budget);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  const canonical = [...expected].sort();
  return keys.length === canonical.length && keys.every((key, index) => key === canonical[index]);
}

function stableId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxIdCodeUnits &&
    STABLE_ID_PATTERN.test(value)
  );
}

function safeCount(value: unknown, maximum: number): value is number {
  return Number.isSafeInteger(value) && typeof value === 'number' && value >= 0 && value <= maximum;
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function gcd(first: bigint, second: bigint): bigint {
  let left = absolute(first);
  let right = absolute(second);
  while (right !== 0n) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
}

function parseInteger(value: unknown): bigint | undefined {
  if (typeof value !== 'string' || !INTEGER_PATTERN.test(value)) return undefined;
  const digits = value.startsWith('-') ? value.length - 1 : value.length;
  if (
    digits > STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxCoordinateDecimalDigits
  ) {
    return undefined;
  }
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function parsePoint(value: unknown): IntegerPoint3 | undefined {
  if (!isRecord(value) || !hasExactKeys(value, POINT_KEYS)) return undefined;
  const x = parseInteger(value.x);
  const y = parseInteger(value.y);
  const z = parseInteger(value.z);
  const w = parseInteger(value.w);
  if (x === undefined || y === undefined || z === undefined || w === undefined || w <= 0n) {
    return undefined;
  }
  if (gcd(gcd(absolute(x), absolute(y)), gcd(absolute(z), w)) !== 1n) return undefined;
  return { x, y, z, w };
}

function parseIdTriple(value: unknown): readonly [string, string, string] | undefined {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(stableId)) return undefined;
  const [first, second, third] = value;
  if (first === undefined || second === undefined || third === undefined) return undefined;
  return new Set(value).size === 3 ? [first, second, third] : undefined;
}

function parseTriangle(value: unknown): ParsedTriangle | undefined {
  if (!isRecord(value) || !hasExactKeys(value, TRIANGLE_KEYS)) return undefined;
  const vertexIds = parseIdTriple(value.vertexIds);
  if (
    !stableId(value.triangleId) ||
    !stableId(value.faceId) ||
    vertexIds === undefined ||
    !Array.isArray(value.triangle) ||
    value.triangle.length !== 3
  ) {
    return undefined;
  }
  const first = parsePoint(value.triangle[0]);
  const second = parsePoint(value.triangle[1]);
  const third = parsePoint(value.triangle[2]);
  return first === undefined || second === undefined || third === undefined
    ? undefined
    : {
        triangleId: value.triangleId,
        faceId: value.faceId,
        vertexIds,
        triangle: [first, second, third],
      };
}

function hingePairKey(firstFaceId: string, secondFaceId: string): string {
  return `${firstFaceId}\u0000${secondFaceId}`;
}

function triangleIdentityKey(triangle: ParsedTriangle): string {
  return [
    triangle.faceId,
    ...triangle.vertexIds,
    ...triangle.triangle.flatMap((point) => [point.x, point.y, point.z, point.w].map(String)),
  ].join('\u0000');
}

function parseInput(snapshot: unknown): ParsedInput | undefined {
  if (!isRecord(snapshot) || !hasExactKeys(snapshot, ROOT_KEYS)) return undefined;
  const literals =
    snapshot.schemaVersion === 1 &&
    snapshot.recordType === 'm0f-static-rational-triangle-nonadjacent-crossing-witness-set' &&
    snapshot.contractStatus === 'candidate-no-claim' &&
    snapshot.coordinateEncoding === 'canonical-projective-bigint-decimal-v1' &&
    snapshot.completeProducerCrossingWitnessSet === true &&
    snapshot.declaredHingeFacePairsCompleteForBoundMesh === true &&
    snapshot.exactRelativeInteriorPointIncluded === true &&
    snapshot.independentAuditIncluded === false &&
    snapshot.cryptographicSourceRevisionBindingIncluded === false &&
    snapshot.legalContactPolicyIncluded === false &&
    snapshot.selfIntersectionDecisionIncluded === false &&
    snapshot.continuousTimeIncluded === false &&
    snapshot.continuousCollisionDetectionIncluded === false &&
    snapshot.collisionFreeClaim === false &&
    snapshot.verifiedClaim === false &&
    snapshot.scientificClaim === false &&
    snapshot.globalM0fGo === false;
  if (
    !literals ||
    !stableId(snapshot.meshRevisionId) ||
    !stableId(snapshot.triangulationRevisionId) ||
    !stableId(snapshot.poseRevisionId) ||
    !safeCount(
      snapshot.triangleCount,
      STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxTriangles,
    ) ||
    !safeCount(
      snapshot.unorderedPairCount,
      STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxPairs,
    ) ||
    snapshot.unorderedPairCount !== (snapshot.triangleCount * (snapshot.triangleCount - 1)) / 2 ||
    !safeCount(
      snapshot.witnessCount,
      STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxWitnesses,
    ) ||
    snapshot.witnessCount > snapshot.unorderedPairCount ||
    !Array.isArray(snapshot.declaredHingeFacePairs) ||
    snapshot.declaredHingeFacePairs.length >
      STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxDeclaredHingeFacePairs ||
    !Array.isArray(snapshot.witnesses) ||
    snapshot.witnesses.length !== snapshot.witnessCount
  ) {
    return undefined;
  }
  const declaredHingeFacePairKeys = new Set<string>();
  let previousHingeKey: string | undefined;
  for (const candidate of snapshot.declaredHingeFacePairs) {
    if (!isRecord(candidate) || !hasExactKeys(candidate, HINGE_PAIR_KEYS)) return undefined;
    if (
      !stableId(candidate.firstFaceId) ||
      !stableId(candidate.secondFaceId) ||
      candidate.firstFaceId >= candidate.secondFaceId
    ) {
      return undefined;
    }
    const key = hingePairKey(candidate.firstFaceId, candidate.secondFaceId);
    if (previousHingeKey !== undefined && key <= previousHingeKey) return undefined;
    previousHingeKey = key;
    declaredHingeFacePairKeys.add(key);
  }
  const witnesses: ParsedWitness[] = [];
  const sourcePairIndices = new Set<number>();
  const witnessPairKeys = new Set<string>();
  const triangleIdentityById = new Map<string, string>();
  let previousSourcePairIndex = -1;
  for (let index = 0; index < snapshot.witnesses.length; index += 1) {
    const candidate: unknown = snapshot.witnesses[index];
    if (!isRecord(candidate) || !hasExactKeys(candidate, WITNESS_KEYS)) return undefined;
    const first = parseTriangle(candidate.first);
    const second = parseTriangle(candidate.second);
    const point = parsePoint(candidate.exactRelativeInteriorPoint);
    if (
      candidate.witnessIndex !== index ||
      !safeCount(
        candidate.sourcePairIndex,
        STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_LIMITS.maxPairs - 1,
      ) ||
      candidate.sourcePairIndex >= snapshot.unorderedPairCount ||
      candidate.sourcePairIndex <= previousSourcePairIndex ||
      sourcePairIndices.has(candidate.sourcePairIndex) ||
      first === undefined ||
      second === undefined ||
      point === undefined ||
      first.triangleId >= second.triangleId ||
      first.faceId === second.faceId ||
      candidate.producerCategory !== 'nonadjacent-static-interior-crossing-evidence' ||
      candidate.producerLocusKind !== 'segment' ||
      !Array.isArray(candidate.producerRelativeLocations) ||
      candidate.producerRelativeLocations.length !== 2 ||
      candidate.producerRelativeLocations[0] !== 'interior' ||
      candidate.producerRelativeLocations[1] !== 'interior'
    ) {
      return undefined;
    }
    const witnessPairKey = `${first.triangleId}\u0000${second.triangleId}`;
    if (witnessPairKeys.has(witnessPairKey)) return undefined;
    witnessPairKeys.add(witnessPairKey);
    for (const triangle of [first, second]) {
      const identity = triangleIdentityKey(triangle);
      const previousIdentity = triangleIdentityById.get(triangle.triangleId);
      if (previousIdentity !== undefined && previousIdentity !== identity) return undefined;
      triangleIdentityById.set(triangle.triangleId, identity);
    }
    if (triangleIdentityById.size > snapshot.triangleCount) return undefined;
    previousSourcePairIndex = candidate.sourcePairIndex;
    sourcePairIndices.add(candidate.sourcePairIndex);
    witnesses.push({
      witnessIndex: index,
      sourcePairIndex: candidate.sourcePairIndex,
      first,
      second,
      point,
    });
  }
  return { declaredHingeFacePairKeys, witnesses };
}

function difference(
  first: IntegerPoint3,
  second: IntegerPoint3,
): readonly [bigint, bigint, bigint] {
  return [
    second.x * first.w - first.x * second.w,
    second.y * first.w - first.y * second.w,
    second.z * first.w - first.z * second.w,
  ];
}

function planeThrough(
  first: IntegerPoint3,
  second: IntegerPoint3,
  third: IntegerPoint3,
): Plane3 | undefined {
  const u = difference(first, second);
  const v = difference(first, third);
  const a = u[1] * v[2] - u[2] * v[1];
  const b = u[2] * v[0] - u[0] * v[2];
  const c = u[0] * v[1] - u[1] * v[0];
  if (a === 0n && b === 0n && c === 0n) return undefined;
  return {
    a: a * first.w,
    b: b * first.w,
    c: c * first.w,
    d: -(a * first.x + b * first.y + c * first.z),
  };
}

function planeEvaluation(plane: Plane3, point: IntegerPoint3): bigint {
  return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d * point.w;
}

function supportingPlanesNonparallel(first: Plane3, second: Plane3): boolean {
  return (
    first.b * second.c - first.c * second.b !== 0n ||
    first.c * second.a - first.a * second.c !== 0n ||
    first.a * second.b - first.b * second.a !== 0n
  );
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

function projectedOrientation(
  first: IntegerPoint3,
  second: IntegerPoint3,
  point: IntegerPoint3,
  dropAxis: 'x' | 'y' | 'z',
): bigint {
  const axes =
    dropAxis === 'x'
      ? (['y', 'z'] as const)
      : dropAxis === 'y'
        ? (['x', 'z'] as const)
        : (['x', 'y'] as const);
  const [u, v] = axes;
  return determinant3(
    first[u],
    first[v],
    first.w,
    second[u],
    second[v],
    second.w,
    point[u],
    point[v],
    point.w,
  );
}

function strictlyInsideTriangle(
  point: IntegerPoint3,
  triangle: ParsedTriangle['triangle'],
  plane: Plane3,
): boolean {
  const absoluteA = absolute(plane.a);
  const absoluteB = absolute(plane.b);
  const absoluteC = absolute(plane.c);
  const dropAxis =
    absoluteB > absoluteA && absoluteB >= absoluteC
      ? 'y'
      : absoluteC > absoluteA && absoluteC > absoluteB
        ? 'z'
        : 'x';
  const first = projectedOrientation(triangle[0], triangle[1], point, dropAxis);
  const second = projectedOrientation(triangle[1], triangle[2], point, dropAxis);
  const third = projectedOrientation(triangle[2], triangle[0], point, dropAxis);
  return (first > 0n && second > 0n && third > 0n) || (first < 0n && second < 0n && third < 0n);
}

function inconsistent(
  witnessIndex: number,
  reason: StaticRationalTriangleNonadjacentCrossingAuditInconsistentV1['reason'],
): StaticRationalTriangleNonadjacentCrossingAuditResultV1 {
  return frozen({
    ok: false as const,
    value: {
      schemaVersion: 1 as const,
      recordType: STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE,
      contractStatus: 'candidate-no-claim' as const,
      auditOutcome: 'inconsistent' as const,
      firstInvalidWitnessIndex: witnessIndex,
      reason,
      positiveStaticCrossingEvidenceConfirmed: false as const,
      independentGeometryArithmeticIncluded: true as const,
      producerGeometryImported: false as const,
      producerParserImported: false as const,
      cryptographicSourceRevisionBindingIncluded: false as const,
      legalContactPolicyIncluded: false as const,
      selfIntersectionDecisionIncluded: false as const,
      continuousTimeIncluded: false as const,
      continuousCollisionDetectionIncluded: false as const,
      collisionFreeClaim: false as const,
      verifiedClaim: false as const,
      scientificClaim: false as const,
      globalM0fGo: false as const,
    },
  });
}

/** Independently validates every portable positive static crossing witness. */
export function auditStaticRationalTriangleNonadjacentCrossingWitnessesV1(
  supplied: unknown,
): StaticRationalTriangleNonadjacentCrossingAuditResultV1 {
  let snapshot: unknown;
  try {
    snapshot = captureSnapshot(supplied, '$', 0, { nodes: 0, totalStringCodeUnits: 0 });
  } catch {
    return contractFailure(
      '$',
      'snapshot-rejected',
      'input is not one bounded accessor-free plain JSON-data snapshot',
    );
  }
  const parsed = parseInput(snapshot);
  if (parsed === undefined) {
    return contractFailure(
      '$',
      'invalid-witness-contract',
      'input does not satisfy the closed portable crossing-witness contract',
    );
  }
  try {
    for (const witness of parsed.witnesses) {
      if (
        parsed.declaredHingeFacePairKeys.has(
          hingePairKey(
            witness.first.faceId < witness.second.faceId
              ? witness.first.faceId
              : witness.second.faceId,
            witness.first.faceId < witness.second.faceId
              ? witness.second.faceId
              : witness.first.faceId,
          ),
        )
      ) {
        return inconsistent(witness.witnessIndex, 'declared-face-adjacency-conflict');
      }
      const firstPlane = planeThrough(...witness.first.triangle);
      const secondPlane = planeThrough(...witness.second.triangle);
      if (firstPlane === undefined || secondPlane === undefined) {
        return inconsistent(witness.witnessIndex, 'degenerate-triangle');
      }
      if (!supportingPlanesNonparallel(firstPlane, secondPlane)) {
        return inconsistent(witness.witnessIndex, 'parallel-supporting-planes');
      }
      if (
        planeEvaluation(firstPlane, witness.point) !== 0n ||
        planeEvaluation(secondPlane, witness.point) !== 0n
      ) {
        return inconsistent(witness.witnessIndex, 'point-off-supporting-plane');
      }
      if (
        !strictlyInsideTriangle(witness.point, witness.first.triangle, firstPlane) ||
        !strictlyInsideTriangle(witness.point, witness.second.triangle, secondPlane)
      ) {
        return inconsistent(witness.witnessIndex, 'point-not-strictly-inside-both-triangles');
      }
    }
    return frozen({
      ok: true as const,
      value: {
        schemaVersion: 1 as const,
        recordType: STATIC_RATIONAL_TRIANGLE_NONADJACENT_CROSSING_AUDIT_RECORD_TYPE,
        contractStatus: 'candidate-no-claim' as const,
        auditOutcome: 'consistent' as const,
        auditedWitnessCount: parsed.witnesses.length,
        allWitnessesCanonical: true as const,
        allWitnessPlanesNonparallel: true as const,
        allWitnessPointsStrictlyInsideBothTriangles: true as const,
        declaredNonadjacencyReplayed: true as const,
        positiveStaticCrossingEvidenceConfirmed: parsed.witnesses.length > 0,
        independentGeometryArithmeticIncluded: true as const,
        producerGeometryImported: false as const,
        producerParserImported: false as const,
        cryptographicSourceRevisionBindingIncluded: false as const,
        legalContactPolicyIncluded: false as const,
        selfIntersectionDecisionIncluded: false as const,
        continuousTimeIncluded: false as const,
        continuousCollisionDetectionIncluded: false as const,
        collisionFreeClaim: false as const,
        verifiedClaim: false as const,
        scientificClaim: false as const,
        globalM0fGo: false as const,
      },
    });
  } catch {
    return contractFailure(
      '$',
      'audit-arithmetic-failed',
      'independent exact crossing audit failed closed unexpectedly',
    );
  }
}
