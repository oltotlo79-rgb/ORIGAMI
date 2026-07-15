import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';

export const FACE_COMPLEX_AUDIT_RECORD_TYPE = 'm0f-face-complex-audit-input' as const;
export const FACE_COMPLEX_AUDIT_EXACT_COORDINATE_ENCODING =
  'oridesign-exact-rational-json-v1' as const;

export const FACE_COMPLEX_AUDIT_ASSIGNMENTS = ['M', 'V', 'B', 'F', 'U'] as const;
export type FaceComplexAuditAssignment = (typeof FACE_COMPLEX_AUDIT_ASSIGNMENTS)[number];

export type FaceComplexAuditRationalV1 = Readonly<{
  numerator: string;
  denominator: string;
}>;

export type FaceComplexAuditExactPointV1 = Readonly<{
  x: FaceComplexAuditRationalV1;
  y: FaceComplexAuditRationalV1;
}>;

export type FaceComplexAuditSourceV1 = Readonly<{
  specVersion: '1.1' | '1.2';
  verticesCoords: readonly (readonly [number, number])[];
  edgesVertices: readonly (readonly [number, number])[];
  edgesAssignment: readonly FaceComplexAuditAssignment[];
  facesVertices: null;
}>;

export type FaceComplexAuditVertexV1 = Readonly<{
  id: string;
  exactCoordinate: FaceComplexAuditExactPointV1;
  displayCoordinate: readonly [number, number];
  sourceVertexIndex: number | null;
}>;

export type FaceComplexAuditEdgeV1 = Readonly<{
  id: string;
  vertexIds: readonly [string, string];
  assignment: FaceComplexAuditAssignment;
  sourceEdges: readonly Readonly<{
    id: string;
    sourceEdgeIndex: number;
    assignment: FaceComplexAuditAssignment;
  }>[];
}>;

export type FaceComplexAuditTriangleV1 = Readonly<{
  id: string;
  faceId: string;
  vertexIds: readonly [string, string, string];
  semanticVertexIds: readonly [string, string, string];
}>;

export type FaceComplexAuditBoundaryV1 = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  areaSign: 1;
}>;

export type FaceComplexAuditFaceV1 = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  areaSign: -1;
  triangles: readonly FaceComplexAuditTriangleV1[];
}>;

export type FaceComplexAuditTopologyV1 = Readonly<{
  sourceVertexCount: number;
  sourceEdgeCount: number;
  planarVertexCount: number;
  planarEdgeCount: number;
  boundedFaceCount: number;
  triangleCount: number;
  createdIntersectionVertexCount: number;
  nonDyadicVertexCount: number;
  eulerValue: 1;
}>;

export type FaceComplexAuditArtifactV1 = Readonly<{
  inputSpecVersion: '1.1' | '1.2';
  exactCoordinateEncoding: typeof FACE_COMPLEX_AUDIT_EXACT_COORDINATE_ENCODING;
  vertices: readonly FaceComplexAuditVertexV1[];
  edges: readonly FaceComplexAuditEdgeV1[];
  exteriorBoundary: FaceComplexAuditBoundaryV1;
  faces: readonly FaceComplexAuditFaceV1[];
  topology: FaceComplexAuditTopologyV1;
}>;

export type FaceComplexAuditInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_AUDIT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  source: FaceComplexAuditSourceV1;
  artifact: FaceComplexAuditArtifactV1;
}>;

export type FaceComplexAuditContractIssueCode =
  | 'invalid-snapshot'
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-literal'
  | 'invalid-array'
  | 'invalid-tuple'
  | 'invalid-number'
  | 'invalid-index'
  | 'invalid-assignment'
  | 'invalid-id'
  | 'invalid-rational'
  | 'non-canonical-rational'
  | 'length-mismatch'
  | 'cross-field-mismatch';

export type FaceComplexAuditContractIssue = Readonly<{
  path: string;
  code: FaceComplexAuditContractIssueCode;
  message: string;
}>;

export type FaceComplexAuditContractParseResult =
  | Readonly<{ ok: true; value: FaceComplexAuditInputV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexAuditContractIssue[] }>;

const ROOT_KEYS = [
  'artifact',
  'contractStatus',
  'recordType',
  'schemaVersion',
  'scientificClaim',
  'source',
] as const;
const SOURCE_KEYS = [
  'edgesAssignment',
  'edgesVertices',
  'facesVertices',
  'specVersion',
  'verticesCoords',
] as const;
const ARTIFACT_KEYS = [
  'edges',
  'exactCoordinateEncoding',
  'exteriorBoundary',
  'faces',
  'inputSpecVersion',
  'topology',
  'vertices',
] as const;
const VERTEX_KEYS = ['displayCoordinate', 'exactCoordinate', 'id', 'sourceVertexIndex'] as const;
const POINT_KEYS = ['x', 'y'] as const;
const RATIONAL_KEYS = ['denominator', 'numerator'] as const;
const EDGE_KEYS = ['assignment', 'id', 'sourceEdges', 'vertexIds'] as const;
const SOURCE_EDGE_KEYS = ['assignment', 'id', 'sourceEdgeIndex'] as const;
const BOUNDARY_KEYS = ['areaSign', 'edgeIds', 'id', 'vertexIds'] as const;
const FACE_KEYS = ['areaSign', 'edgeIds', 'id', 'triangles', 'vertexIds'] as const;
const TRIANGLE_KEYS = ['faceId', 'id', 'semanticVertexIds', 'vertexIds'] as const;
const TOPOLOGY_KEYS = [
  'boundedFaceCount',
  'createdIntersectionVertexCount',
  'eulerValue',
  'nonDyadicVertexCount',
  'planarEdgeCount',
  'planarVertexCount',
  'sourceEdgeCount',
  'sourceVertexCount',
  'triangleCount',
] as const;

const STABLE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const PRINTABLE_ASCII_ID_PATTERN = /^[\x20-\x7e]{1,2048}$/;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

interface MutableIssue {
  path: string;
  code: FaceComplexAuditContractIssueCode;
  message: string;
}

function issue(
  issues: MutableIssue[],
  path: string,
  code: FaceComplexAuditContractIssueCode,
  message: string,
): void {
  issues.push({ path, code, message });
}

function failure(issues: MutableIssue[]): FaceComplexAuditContractParseResult {
  return deepFreezeOwned({ ok: false as const, error: issues });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Reject accessors and exotic objects before structuredClone can invoke or
 * normalize them. Shared object aliases are allowed, but cycles are not.
 */
function isSafeCallerData(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return true;
  }
  if (typeof value !== 'object') return false;
  if (ancestors.has(value)) return false;

  ancestors.add(value);
  try {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) return false;
      if (Object.getOwnPropertySymbols(value).length !== 0) return false;
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (
        lengthDescriptor === undefined ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        (lengthDescriptor.value as number) < 0
      ) {
        return false;
      }
      const length = lengthDescriptor.value as number;
      const names = Object.getOwnPropertyNames(value);
      if (names.length !== length + 1 || !names.includes('length')) return false;
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
          return false;
        }
        if (!isSafeCallerData(descriptor.value, ancestors)) return false;
      }
      return true;
    }

    if (prototype !== Object.prototype && prototype !== null) return false;
    if (Object.getOwnPropertySymbols(value).length !== 0) return false;
    for (const name of Object.getOwnPropertyNames(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, name);
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        return false;
      }
      if (!isSafeCallerData(descriptor.value, ancestors)) return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    ancestors.delete(value);
  }
}

function closedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: MutableIssue[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issue(issues, `${path}.${key}`, 'unknown-field', 'field is not declared by bundle v1');
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      issue(issues, `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function literal(
  value: unknown,
  expected: string | number | boolean | null,
  path: string,
  issues: MutableIssue[],
): void {
  if (value !== expected) {
    issue(issues, path, 'invalid-literal', `must equal ${JSON.stringify(expected)}`);
  }
}

function specVersion(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): '1.1' | '1.2' | undefined {
  if (value !== '1.1' && value !== '1.2') {
    issue(issues, path, 'invalid-literal', 'must equal "1.1" or "1.2"');
    return undefined;
  }
  return value;
}

function finiteNumber(value: unknown, path: string, issues: MutableIssue[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issue(issues, path, 'invalid-number', 'must be a finite number');
  }
}

function safeIndex(value: unknown, path: string, issues: MutableIssue[]): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    issue(issues, path, 'invalid-index', 'must be a non-negative safe integer');
  }
}

function stableId(value: unknown, path: string, issues: MutableIssue[]): void {
  if (typeof value !== 'string' || !STABLE_ID_PATTERN.test(value)) {
    issue(issues, path, 'invalid-id', 'must be an ASCII stable ID');
  }
}

function printableAsciiId(value: unknown, path: string, issues: MutableIssue[]): void {
  if (typeof value !== 'string' || !PRINTABLE_ASCII_ID_PATTERN.test(value)) {
    issue(issues, path, 'invalid-id', 'must be a non-empty printable ASCII ID');
  }
}

function assignment(value: unknown, path: string, issues: MutableIssue[]): void {
  if (
    typeof value !== 'string' ||
    !(FACE_COMPLEX_AUDIT_ASSIGNMENTS as readonly string[]).includes(value)
  ) {
    issue(issues, path, 'invalid-assignment', 'must be M, V, B, F, or U');
  }
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function rational(value: unknown, path: string, issues: MutableIssue[]): void {
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-rational', 'must be a canonical decimal rational object');
    return;
  }
  closedKeys(value, RATIONAL_KEYS, path, issues);
  if (
    typeof value.numerator !== 'string' ||
    !INTEGER_PATTERN.test(value.numerator) ||
    typeof value.denominator !== 'string' ||
    !POSITIVE_INTEGER_PATTERN.test(value.denominator)
  ) {
    issue(
      issues,
      path,
      'invalid-rational',
      'must use a canonical decimal numerator and positive decimal denominator',
    );
    return;
  }

  let numerator: bigint;
  let denominator: bigint;
  try {
    numerator = BigInt(value.numerator);
    denominator = BigInt(value.denominator);
  } catch {
    issue(issues, path, 'invalid-rational', 'decimal rational cannot be parsed');
    return;
  }
  if (greatestCommonDivisor(numerator, denominator) !== 1n) {
    issue(issues, path, 'non-canonical-rational', 'numerator and denominator must be reduced');
  }
}

function exactPoint(value: unknown, path: string, issues: MutableIssue[]): void {
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'exact coordinate must be an object');
    return;
  }
  closedKeys(value, POINT_KEYS, path, issues);
  rational(value.x, `${path}.x`, issues);
  rational(value.y, `${path}.y`, issues);
}

function numberTuple(value: unknown, length: 2, path: string, issues: MutableIssue[]): void {
  if (!Array.isArray(value) || value.length !== length) {
    issue(issues, path, 'invalid-tuple', `must contain exactly ${length} numbers`);
    return;
  }
  value.forEach((entry, index) => finiteNumber(entry, `${path}[${index}]`, issues));
}

function indexTuple(value: unknown, length: 2, path: string, issues: MutableIssue[]): void {
  if (!Array.isArray(value) || value.length !== length) {
    issue(issues, path, 'invalid-tuple', `must contain exactly ${length} indices`);
    return;
  }
  value.forEach((entry, index) => safeIndex(entry, `${path}[${index}]`, issues));
}

function idTuple(value: unknown, length: 2 | 3, path: string, issues: MutableIssue[]): void {
  if (!Array.isArray(value) || value.length !== length) {
    issue(issues, path, 'invalid-tuple', `must contain exactly ${length} IDs`);
    return;
  }
  value.forEach((entry, index) => stableId(entry, `${path}[${index}]`, issues));
}

function idArray(value: unknown, minimum: number, path: string, issues: MutableIssue[]): void {
  if (!Array.isArray(value) || value.length < minimum) {
    issue(issues, path, 'invalid-array', `must contain at least ${minimum} IDs`);
    return;
  }
  value.forEach((entry, index) => stableId(entry, `${path}[${index}]`, issues));
}

function validateSource(value: unknown, issues: MutableIssue[]): '1.1' | '1.2' | undefined {
  const path = '$.source';
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'source must be an object');
    return undefined;
  }
  closedKeys(value, SOURCE_KEYS, path, issues);
  const version = specVersion(value.specVersion, `${path}.specVersion`, issues);

  if (!Array.isArray(value.verticesCoords) || value.verticesCoords.length < 3) {
    issue(issues, `${path}.verticesCoords`, 'invalid-array', 'must contain at least 3 points');
  } else {
    value.verticesCoords.forEach((entry, index) =>
      numberTuple(entry, 2, `${path}.verticesCoords[${index}]`, issues),
    );
  }

  if (!Array.isArray(value.edgesVertices) || value.edgesVertices.length < 3) {
    issue(issues, `${path}.edgesVertices`, 'invalid-array', 'must contain at least 3 edges');
  } else {
    value.edgesVertices.forEach((entry, index) =>
      indexTuple(entry, 2, `${path}.edgesVertices[${index}]`, issues),
    );
  }

  if (!Array.isArray(value.edgesAssignment) || value.edgesAssignment.length < 3) {
    issue(
      issues,
      `${path}.edgesAssignment`,
      'invalid-array',
      'must contain at least 3 assignments',
    );
  } else {
    value.edgesAssignment.forEach((entry, index) =>
      assignment(entry, `${path}.edgesAssignment[${index}]`, issues),
    );
  }

  if (
    Array.isArray(value.edgesVertices) &&
    Array.isArray(value.edgesAssignment) &&
    value.edgesVertices.length !== value.edgesAssignment.length
  ) {
    issue(
      issues,
      `${path}.edgesAssignment`,
      'length-mismatch',
      'must have one assignment for every source edge',
    );
  }
  literal(value.facesVertices, null, `${path}.facesVertices`, issues);
  return version;
}

function validateVertex(value: unknown, index: number, issues: MutableIssue[]): void {
  const path = `$.artifact.vertices[${index}]`;
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'vertex must be an object');
    return;
  }
  closedKeys(value, VERTEX_KEYS, path, issues);
  stableId(value.id, `${path}.id`, issues);
  exactPoint(value.exactCoordinate, `${path}.exactCoordinate`, issues);
  numberTuple(value.displayCoordinate, 2, `${path}.displayCoordinate`, issues);
  if (value.sourceVertexIndex !== null) {
    safeIndex(value.sourceVertexIndex, `${path}.sourceVertexIndex`, issues);
  }
}

function validateSourceEdge(value: unknown, path: string, issues: MutableIssue[]): void {
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'source edge provenance must be an object');
    return;
  }
  closedKeys(value, SOURCE_EDGE_KEYS, path, issues);
  stableId(value.id, `${path}.id`, issues);
  safeIndex(value.sourceEdgeIndex, `${path}.sourceEdgeIndex`, issues);
  assignment(value.assignment, `${path}.assignment`, issues);
}

function validateEdge(value: unknown, index: number, issues: MutableIssue[]): void {
  const path = `$.artifact.edges[${index}]`;
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'edge must be an object');
    return;
  }
  closedKeys(value, EDGE_KEYS, path, issues);
  stableId(value.id, `${path}.id`, issues);
  idTuple(value.vertexIds, 2, `${path}.vertexIds`, issues);
  assignment(value.assignment, `${path}.assignment`, issues);
  if (!Array.isArray(value.sourceEdges) || value.sourceEdges.length === 0) {
    issue(issues, `${path}.sourceEdges`, 'invalid-array', 'must contain source provenance');
  } else {
    value.sourceEdges.forEach((entry, sourceIndex) =>
      validateSourceEdge(entry, `${path}.sourceEdges[${sourceIndex}]`, issues),
    );
  }
}

function validateTriangle(value: unknown, path: string, issues: MutableIssue[]): void {
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'triangle must be an object');
    return;
  }
  closedKeys(value, TRIANGLE_KEYS, path, issues);
  printableAsciiId(value.id, `${path}.id`, issues);
  stableId(value.faceId, `${path}.faceId`, issues);
  idTuple(value.vertexIds, 3, `${path}.vertexIds`, issues);
  idTuple(value.semanticVertexIds, 3, `${path}.semanticVertexIds`, issues);
}

function validateBoundary(
  value: unknown,
  path: string,
  areaSign: 1 | -1,
  withTriangles: boolean,
  issues: MutableIssue[],
): void {
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'boundary must be an object');
    return;
  }
  closedKeys(value, withTriangles ? FACE_KEYS : BOUNDARY_KEYS, path, issues);
  stableId(value.id, `${path}.id`, issues);
  idArray(value.vertexIds, 3, `${path}.vertexIds`, issues);
  idArray(value.edgeIds, 3, `${path}.edgeIds`, issues);
  literal(value.areaSign, areaSign, `${path}.areaSign`, issues);
  if (withTriangles) {
    if (!Array.isArray(value.triangles) || value.triangles.length === 0) {
      issue(issues, `${path}.triangles`, 'invalid-array', 'face must contain triangles');
    } else {
      value.triangles.forEach((entry, index) =>
        validateTriangle(entry, `${path}.triangles[${index}]`, issues),
      );
    }
  }
}

function validateTopology(value: unknown, issues: MutableIssue[]): void {
  const path = '$.artifact.topology';
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'topology must be an object');
    return;
  }
  closedKeys(value, TOPOLOGY_KEYS, path, issues);
  for (const key of TOPOLOGY_KEYS) {
    if (key === 'eulerValue') {
      literal(value[key], 1, `${path}.${key}`, issues);
    } else {
      safeIndex(value[key], `${path}.${key}`, issues);
    }
  }
}

function validateArtifact(value: unknown, issues: MutableIssue[]): '1.1' | '1.2' | undefined {
  const path = '$.artifact';
  if (!isRecord(value)) {
    issue(issues, path, 'invalid-object', 'artifact must be an object');
    return undefined;
  }
  closedKeys(value, ARTIFACT_KEYS, path, issues);
  const version = specVersion(value.inputSpecVersion, `${path}.inputSpecVersion`, issues);
  literal(
    value.exactCoordinateEncoding,
    FACE_COMPLEX_AUDIT_EXACT_COORDINATE_ENCODING,
    `${path}.exactCoordinateEncoding`,
    issues,
  );

  if (!Array.isArray(value.vertices) || value.vertices.length < 3) {
    issue(issues, `${path}.vertices`, 'invalid-array', 'must contain at least 3 vertices');
  } else {
    value.vertices.forEach((entry, index) => validateVertex(entry, index, issues));
  }

  if (!Array.isArray(value.edges) || value.edges.length < 3) {
    issue(issues, `${path}.edges`, 'invalid-array', 'must contain at least 3 edges');
  } else {
    value.edges.forEach((entry, index) => validateEdge(entry, index, issues));
  }

  validateBoundary(value.exteriorBoundary, `${path}.exteriorBoundary`, 1, false, issues);
  if (!Array.isArray(value.faces) || value.faces.length === 0) {
    issue(issues, `${path}.faces`, 'invalid-array', 'must contain bounded faces');
  } else {
    value.faces.forEach((entry, index) =>
      validateBoundary(entry, `${path}.faces[${index}]`, -1, true, issues),
    );
  }
  validateTopology(value.topology, issues);
  return version;
}

/**
 * Parses the closed data bundle handed to the independent face-complex audit.
 * This boundary validates representation only. It deliberately does not
 * decide uniqueness, reference existence, incidence, or geometric validity.
 */
export function parseFaceComplexAuditInputV1(
  supplied: unknown,
): FaceComplexAuditContractParseResult {
  let safe = false;
  try {
    safe = isSafeCallerData(supplied, new WeakSet<object>());
  } catch {
    safe = false;
  }
  if (!safe) {
    return failure([
      {
        path: '$',
        code: 'invalid-snapshot',
        message: 'bundle must be acyclic plain JSON data without accessors',
      },
    ]);
  }

  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return failure([
      {
        path: '$',
        code: 'invalid-snapshot',
        message: 'bundle must be one cloneable plain JSON-data snapshot',
      },
    ]);
  }
  const raw: unknown = snapshot.value;
  if (!isRecord(raw)) {
    return failure([
      { path: '$', code: 'invalid-object', message: 'bundle root must be an object' },
    ]);
  }

  const issues: MutableIssue[] = [];
  closedKeys(raw, ROOT_KEYS, '$', issues);
  literal(raw.schemaVersion, 1, '$.schemaVersion', issues);
  literal(raw.recordType, FACE_COMPLEX_AUDIT_RECORD_TYPE, '$.recordType', issues);
  literal(raw.contractStatus, 'candidate', '$.contractStatus', issues);
  literal(raw.scientificClaim, false, '$.scientificClaim', issues);
  const sourceVersion = validateSource(raw.source, issues);
  const artifactVersion = validateArtifact(raw.artifact, issues);
  if (
    sourceVersion !== undefined &&
    artifactVersion !== undefined &&
    sourceVersion !== artifactVersion
  ) {
    issue(
      issues,
      '$.artifact.inputSpecVersion',
      'cross-field-mismatch',
      'must equal source.specVersion',
    );
  }

  if (issues.length > 0) return failure(issues);
  return deepFreezeOwned({ ok: true as const, value: raw as FaceComplexAuditInputV1 });
}
