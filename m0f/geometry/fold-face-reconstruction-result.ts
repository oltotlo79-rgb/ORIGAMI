import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { EXACT_RATIONAL_JSON_ENCODING_ID } from '../model/exact-rational-json.js';
import {
  equalExactRationalPoints,
  exactRational,
  type ExactRational,
  type ExactRationalPoint2,
} from '../model/exact-rational.js';
import { M0F_CONVENTIONS_ID } from '../model/reference-model.js';
import {
  parseAndRoundtripCandidateFoldProjectionV1,
  type CandidateFoldProjectionRoundtripV1,
} from './fold-projection-roundtrip.js';
import {
  FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS,
  type FoldFaceReconstructionAssignment,
} from './fold-face-input.js';
import {
  FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID,
  type CandidateFoldFaceReconstructionV1,
} from './reconstruct-fold-faces.js';

export type CandidateFoldFaceReconstructionParseIssue = Readonly<{
  stage: 'snapshot' | 'structure' | 'exact-metadata' | 'projection-roundtrip' | 'cross-field';
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
}>;

export type CandidateFoldFaceReconstructionParseResult =
  | Readonly<{ ok: true; value: CandidateFoldFaceReconstructionV1 }>
  | Readonly<{ ok: false; error: readonly CandidateFoldFaceReconstructionParseIssue[] }>;

interface MutableIssue {
  stage: CandidateFoldFaceReconstructionParseIssue['stage'];
  path: string;
  code: string;
  message: string;
  relatedIds?: string[];
}

type ParsedVertex = Readonly<{
  id: string;
  point: ExactRationalPoint2;
  displayCoordinate: readonly [number, number];
  sourceVertexIndex: number | null;
}>;

type ParsedSourceEdge = Readonly<{
  id: string;
  sourceEdgeIndex: number;
  assignment: FoldFaceReconstructionAssignment;
}>;

type ParsedEdge = Readonly<{
  id: string;
  vertexIds: readonly [string, string];
  assignment: FoldFaceReconstructionAssignment;
  sourceEdges: readonly ParsedSourceEdge[];
}>;

type ParsedTriangle = Readonly<{
  id: string;
  faceId: string;
  vertexIds: readonly [string, string, string];
  semanticVertexIds: readonly [string, string, string];
}>;

type ParsedBoundary = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  areaSign: 1 | -1;
}>;

type ParsedFace = ParsedBoundary & Readonly<{ triangles: readonly ParsedTriangle[] }>;

type ParsedTopology = Readonly<{
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

type ParsedRoot = Readonly<{
  inputSpecVersion: '1.1' | '1.2';
  vertices: readonly ParsedVertex[];
  edges: readonly ParsedEdge[];
  exteriorBoundary: ParsedBoundary;
  faces: readonly ParsedFace[];
  topology: ParsedTopology;
  foldProjection: unknown;
}>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const TRIANGLE_ID_PATTERN = /^[\x20-\x7e]{1,2048}$/;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

const ROOT_KEYS = [
  'contractStatus',
  'conventionsId',
  'edges',
  'exactCoordinateEncoding',
  'exteriorBoundary',
  'faces',
  'foldProjection',
  'implementationRole',
  'inputSpecVersion',
  'limitations',
  'recordType',
  'schemaId',
  'schemaVersion',
  'scientificClaim',
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
const LIMITATIONS = [
  'candidate-reference-o-n-squared',
  'single-connected-disk-no-holes-or-bridges',
  'no-vertex-merge-tolerance-applied',
  'display-coordinates-are-not-topology-evidence',
  'candidate-stable-ids-not-frozen-for-product',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: MutableIssue[],
  stage: MutableIssue['stage'],
  path: string,
  code: string,
  message: string,
  relatedIds?: string[],
): void {
  issues.push({ stage, path, code, message, ...(relatedIds === undefined ? {} : { relatedIds }) });
}

function failure(issues: MutableIssue[]): CandidateFoldFaceReconstructionParseResult {
  return deepFreezeOwned({ ok: false as const, error: issues });
}

function closedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: MutableIssue[],
): void {
  const keys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) {
      addIssue(issues, 'structure', `${path}.${key}`, 'unknown-field', 'field is not declared');
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      addIssue(issues, 'structure', `${path}.${key}`, 'missing-field', 'required field is missing');
    }
  }
}

function stableId(value: unknown, path: string, issues: MutableIssue[]): string | undefined {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    addIssue(issues, 'structure', path, 'invalid-id', 'must be a stable ID');
    return undefined;
  }
  return value;
}

function assignment(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): FoldFaceReconstructionAssignment | undefined {
  if (
    typeof value !== 'string' ||
    !(FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS as readonly string[]).includes(value)
  ) {
    addIssue(issues, 'structure', path, 'invalid-assignment', 'must be M, V, B, F, or U');
    return undefined;
  }
  return value as FoldFaceReconstructionAssignment;
}

function nonNegativeInteger(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): number | undefined {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    addIssue(issues, 'structure', path, 'invalid-index', 'must be a non-negative safe integer');
    return undefined;
  }
  return value as number;
}

function parseRational(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ExactRational | undefined {
  if (!isRecord(value)) {
    addIssue(issues, 'exact-metadata', path, 'invalid-rational', 'must be an object');
    return undefined;
  }
  closedKeys(value, RATIONAL_KEYS, path, issues);
  const numerator = value.numerator;
  const denominator = value.denominator;
  if (typeof numerator !== 'string' || !INTEGER_PATTERN.test(numerator)) {
    addIssue(
      issues,
      'exact-metadata',
      `${path}.numerator`,
      'invalid-rational',
      'must be a canonical integer string',
    );
  }
  if (typeof denominator !== 'string' || !POSITIVE_INTEGER_PATTERN.test(denominator)) {
    addIssue(
      issues,
      'exact-metadata',
      `${path}.denominator`,
      'invalid-rational',
      'must be a canonical positive integer string',
    );
  }
  if (typeof numerator !== 'string' || typeof denominator !== 'string') return undefined;
  if (!INTEGER_PATTERN.test(numerator) || !POSITIVE_INTEGER_PATTERN.test(denominator)) {
    return undefined;
  }
  const result = exactRational(BigInt(numerator), BigInt(denominator));
  if (result.numerator.toString() !== numerator || result.denominator.toString() !== denominator) {
    addIssue(
      issues,
      'exact-metadata',
      path,
      'non-normalized-rational',
      'must be the unique reduced rational representation',
    );
    return undefined;
  }
  return result;
}

function parsePoint(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ExactRationalPoint2 | undefined {
  if (!isRecord(value)) {
    addIssue(issues, 'exact-metadata', path, 'invalid-point', 'must be an exact point object');
    return undefined;
  }
  closedKeys(value, POINT_KEYS, path, issues);
  const x = parseRational(value.x, `${path}.x`, issues);
  const y = parseRational(value.y, `${path}.y`, issues);
  return x === undefined || y === undefined ? undefined : { x, y };
}

function parseDisplayPoint(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): readonly [number, number] | undefined {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== 'number' ||
    !Number.isFinite(value[0]) ||
    typeof value[1] !== 'number' ||
    !Number.isFinite(value[1])
  ) {
    addIssue(issues, 'structure', path, 'invalid-coordinate', 'must be two finite numbers');
    return undefined;
  }
  return [value[0], value[1]];
}

function parseIdArray(
  value: unknown,
  path: string,
  minimum: number,
  issues: MutableIssue[],
): string[] {
  if (!Array.isArray(value) || value.length < minimum) {
    addIssue(issues, 'structure', path, 'invalid-array', `must contain at least ${minimum} IDs`);
    return [];
  }
  const result: string[] = [];
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const id = stableId(entry, `${path}[${index}]`, issues);
    if (id === undefined) return;
    if (seen.has(id)) {
      addIssue(issues, 'structure', `${path}[${index}]`, 'duplicate-id', `${id} is duplicated`);
    } else {
      seen.add(id);
    }
    result.push(id);
  });
  return result;
}

function parseIdTuple(
  value: unknown,
  path: string,
  length: 2 | 3,
  issues: MutableIssue[],
): readonly string[] | undefined {
  if (!Array.isArray(value) || value.length !== length) {
    addIssue(issues, 'structure', path, 'invalid-array', `must contain exactly ${length} IDs`);
    return undefined;
  }
  const ids = value.map((entry, index) => stableId(entry, `${path}[${index}]`, issues));
  if (ids.some((entry) => entry === undefined)) return undefined;
  if (new Set(ids).size !== ids.length) {
    addIssue(issues, 'structure', path, 'duplicate-id', 'tuple IDs must be distinct');
    return undefined;
  }
  return ids as string[];
}

function parseVertices(value: unknown, issues: MutableIssue[]): ParsedVertex[] {
  if (!Array.isArray(value) || value.length < 3) {
    addIssue(
      issues,
      'structure',
      '$.vertices',
      'invalid-array',
      'must contain at least 3 vertices',
    );
    return [];
  }
  const result: ParsedVertex[] = [];
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.vertices[${index}]`;
    if (!isRecord(entry)) {
      addIssue(issues, 'structure', path, 'invalid-object', 'vertex must be an object');
      return;
    }
    closedKeys(entry, VERTEX_KEYS, path, issues);
    const id = stableId(entry.id, `${path}.id`, issues);
    if (id !== undefined) {
      if (ids.has(id))
        addIssue(issues, 'structure', `${path}.id`, 'duplicate-id', `${id} is duplicated`);
      ids.add(id);
    }
    const point = parsePoint(entry.exactCoordinate, `${path}.exactCoordinate`, issues);
    const displayCoordinate = parseDisplayPoint(
      entry.displayCoordinate,
      `${path}.displayCoordinate`,
      issues,
    );
    const sourceVertexIndex =
      entry.sourceVertexIndex === null
        ? null
        : nonNegativeInteger(entry.sourceVertexIndex, `${path}.sourceVertexIndex`, issues);
    if (
      id !== undefined &&
      point !== undefined &&
      displayCoordinate !== undefined &&
      sourceVertexIndex !== undefined
    ) {
      result.push({ id, point, displayCoordinate, sourceVertexIndex });
    }
  });
  return result;
}

function parseSourceEdges(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ParsedSourceEdge[] {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'structure', path, 'invalid-array', 'must contain source provenance');
    return [];
  }
  const result: ParsedSourceEdge[] = [];
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      addIssue(issues, 'structure', itemPath, 'invalid-object', 'source edge must be an object');
      return;
    }
    closedKeys(entry, SOURCE_EDGE_KEYS, itemPath, issues);
    const id = stableId(entry.id, `${itemPath}.id`, issues);
    const sourceEdgeIndex = nonNegativeInteger(
      entry.sourceEdgeIndex,
      `${itemPath}.sourceEdgeIndex`,
      issues,
    );
    const parsedAssignment = assignment(entry.assignment, `${itemPath}.assignment`, issues);
    if (id !== undefined) {
      if (ids.has(id)) {
        addIssue(issues, 'structure', `${itemPath}.id`, 'duplicate-id', `${id} is duplicated`);
      }
      ids.add(id);
    }
    if (id !== undefined && sourceEdgeIndex !== undefined && parsedAssignment !== undefined) {
      result.push({ id, sourceEdgeIndex, assignment: parsedAssignment });
    }
  });
  return result;
}

function parseEdges(value: unknown, issues: MutableIssue[]): ParsedEdge[] {
  if (!Array.isArray(value) || value.length < 3) {
    addIssue(issues, 'structure', '$.edges', 'invalid-array', 'must contain at least 3 edges');
    return [];
  }
  const result: ParsedEdge[] = [];
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.edges[${index}]`;
    if (!isRecord(entry)) {
      addIssue(issues, 'structure', path, 'invalid-object', 'edge must be an object');
      return;
    }
    closedKeys(entry, EDGE_KEYS, path, issues);
    const id = stableId(entry.id, `${path}.id`, issues);
    if (id !== undefined) {
      if (ids.has(id))
        addIssue(issues, 'structure', `${path}.id`, 'duplicate-id', `${id} is duplicated`);
      ids.add(id);
    }
    const vertexIds = parseIdTuple(entry.vertexIds, `${path}.vertexIds`, 2, issues);
    const parsedAssignment = assignment(entry.assignment, `${path}.assignment`, issues);
    const sourceEdges = parseSourceEdges(entry.sourceEdges, `${path}.sourceEdges`, issues);
    const firstVertexId = vertexIds?.[0];
    const secondVertexId = vertexIds?.[1];
    if (
      id !== undefined &&
      firstVertexId !== undefined &&
      secondVertexId !== undefined &&
      parsedAssignment !== undefined &&
      sourceEdges.length > 0
    ) {
      result.push({
        id,
        vertexIds: [firstVertexId, secondVertexId],
        assignment: parsedAssignment,
        sourceEdges,
      });
    }
  });
  return result;
}

function parseTriangle(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ParsedTriangle | undefined {
  if (!isRecord(value)) {
    addIssue(issues, 'structure', path, 'invalid-object', 'triangle must be an object');
    return undefined;
  }
  closedKeys(value, TRIANGLE_KEYS, path, issues);
  const id = value.id;
  if (typeof id !== 'string' || !TRIANGLE_ID_PATTERN.test(id)) {
    addIssue(issues, 'structure', `${path}.id`, 'invalid-triangle-id', 'invalid triangle ID');
  }
  const faceId = stableId(value.faceId, `${path}.faceId`, issues);
  const vertexIds = parseIdTuple(value.vertexIds, `${path}.vertexIds`, 3, issues);
  const semanticVertexIds = parseIdTuple(
    value.semanticVertexIds,
    `${path}.semanticVertexIds`,
    3,
    issues,
  );
  if (
    typeof id !== 'string' ||
    !TRIANGLE_ID_PATTERN.test(id) ||
    faceId === undefined ||
    vertexIds === undefined ||
    semanticVertexIds === undefined
  ) {
    return undefined;
  }
  const firstVertexId = vertexIds[0];
  const secondVertexId = vertexIds[1];
  const thirdVertexId = vertexIds[2];
  const firstSemanticId = semanticVertexIds[0];
  const secondSemanticId = semanticVertexIds[1];
  const thirdSemanticId = semanticVertexIds[2];
  if (
    firstVertexId === undefined ||
    secondVertexId === undefined ||
    thirdVertexId === undefined ||
    firstSemanticId === undefined ||
    secondSemanticId === undefined ||
    thirdSemanticId === undefined
  ) {
    throw new TypeError('validated triangle tuples are incomplete');
  }
  return {
    id,
    faceId,
    vertexIds: [firstVertexId, secondVertexId, thirdVertexId],
    semanticVertexIds: [firstSemanticId, secondSemanticId, thirdSemanticId],
  };
}

function parseBoundary(
  value: unknown,
  path: string,
  areaSign: 1 | -1,
  withTriangles: boolean,
  issues: MutableIssue[],
): ParsedBoundary | ParsedFace | undefined {
  if (!isRecord(value)) {
    addIssue(issues, 'structure', path, 'invalid-object', 'boundary must be an object');
    return undefined;
  }
  closedKeys(value, withTriangles ? FACE_KEYS : BOUNDARY_KEYS, path, issues);
  const id = stableId(value.id, `${path}.id`, issues);
  const vertexIds = parseIdArray(value.vertexIds, `${path}.vertexIds`, 3, issues);
  const edgeIds = parseIdArray(value.edgeIds, `${path}.edgeIds`, 3, issues);
  if (value.areaSign !== areaSign) {
    addIssue(issues, 'structure', `${path}.areaSign`, 'invalid-literal', `must equal ${areaSign}`);
  }
  if (vertexIds.length !== edgeIds.length) {
    addIssue(issues, 'cross-field', path, 'length-mismatch', 'vertex and edge rings must align');
  }
  if (
    id === undefined ||
    vertexIds.length < 3 ||
    edgeIds.length < 3 ||
    value.areaSign !== areaSign
  ) {
    return undefined;
  }
  const boundary: ParsedBoundary = { id, vertexIds, edgeIds, areaSign };
  if (!withTriangles) return boundary;
  if (!Array.isArray(value.triangles) || value.triangles.length === 0) {
    addIssue(issues, 'structure', `${path}.triangles`, 'invalid-array', 'face needs triangles');
    return undefined;
  }
  const triangles = value.triangles.flatMap((entry, index) => {
    const parsed = parseTriangle(entry, `${path}.triangles[${index}]`, issues);
    return parsed === undefined ? [] : [parsed];
  });
  return { ...boundary, triangles };
}

function parseFaces(value: unknown, issues: MutableIssue[]): ParsedFace[] {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'structure', '$.faces', 'invalid-array', 'must contain bounded faces');
    return [];
  }
  const result = value.flatMap((entry, index) => {
    const parsed = parseBoundary(entry, `$.faces[${index}]`, -1, true, issues);
    return parsed !== undefined && 'triangles' in parsed ? [parsed] : [];
  });
  const ids = new Set<string>();
  const triangleIds = new Set<string>();
  result.forEach((face, faceIndex) => {
    if (ids.has(face.id)) {
      addIssue(
        issues,
        'structure',
        `$.faces[${faceIndex}].id`,
        'duplicate-id',
        `${face.id} duplicated`,
      );
    }
    ids.add(face.id);
    face.triangles.forEach((triangle, triangleIndex) => {
      if (triangleIds.has(triangle.id)) {
        addIssue(
          issues,
          'structure',
          `$.faces[${faceIndex}].triangles[${triangleIndex}].id`,
          'duplicate-id',
          `${triangle.id} duplicated`,
        );
      }
      triangleIds.add(triangle.id);
    });
  });
  return result;
}

function parseTopology(value: unknown, issues: MutableIssue[]): ParsedTopology | undefined {
  if (!isRecord(value)) {
    addIssue(issues, 'structure', '$.topology', 'invalid-object', 'topology must be an object');
    return undefined;
  }
  closedKeys(value, TOPOLOGY_KEYS, '$.topology', issues);
  const parsed = new Map<string, number>();
  for (const key of TOPOLOGY_KEYS) {
    if (key === 'eulerValue') continue;
    const number = nonNegativeInteger(value[key], `$.topology.${key}`, issues);
    if (number !== undefined) parsed.set(key, number);
  }
  if (value.eulerValue !== 1) {
    addIssue(issues, 'structure', '$.topology.eulerValue', 'invalid-literal', 'must equal 1');
  }
  if (parsed.size !== TOPOLOGY_KEYS.length - 1 || value.eulerValue !== 1) return undefined;
  const get = (key: string): number => {
    const found = parsed.get(key);
    if (found === undefined) throw new TypeError(`validated topology field is missing: ${key}`);
    return found;
  };
  return {
    sourceVertexCount: get('sourceVertexCount'),
    sourceEdgeCount: get('sourceEdgeCount'),
    planarVertexCount: get('planarVertexCount'),
    planarEdgeCount: get('planarEdgeCount'),
    boundedFaceCount: get('boundedFaceCount'),
    triangleCount: get('triangleCount'),
    createdIntersectionVertexCount: get('createdIntersectionVertexCount'),
    nonDyadicVertexCount: get('nonDyadicVertexCount'),
    eulerValue: 1,
  };
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function parseRoot(raw: unknown, issues: MutableIssue[]): ParsedRoot | undefined {
  if (!isRecord(raw)) {
    addIssue(issues, 'structure', '$', 'invalid-object', 'result must be an object');
    return undefined;
  }
  closedKeys(raw, ROOT_KEYS, '$', issues);
  const literals: readonly [string, unknown, unknown][] = [
    ['schemaVersion', raw.schemaVersion, 1],
    ['schemaId', raw.schemaId, FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID],
    ['recordType', raw.recordType, 'm0f-fold-face-reconstruction'],
    ['contractStatus', raw.contractStatus, 'candidate'],
    ['implementationRole', raw.implementationRole, 'reference'],
    ['scientificClaim', raw.scientificClaim, false],
    ['conventionsId', raw.conventionsId, M0F_CONVENTIONS_ID],
    ['exactCoordinateEncoding', raw.exactCoordinateEncoding, EXACT_RATIONAL_JSON_ENCODING_ID],
  ];
  for (const [key, actual, expected] of literals) {
    if (actual !== expected) {
      addIssue(
        issues,
        'structure',
        `$.${key}`,
        'invalid-literal',
        `must equal ${String(expected)}`,
      );
    }
  }
  const inputSpecVersion = raw.inputSpecVersion;
  if (inputSpecVersion !== '1.1' && inputSpecVersion !== '1.2') {
    addIssue(issues, 'structure', '$.inputSpecVersion', 'invalid-literal', 'must be 1.1 or 1.2');
  }
  if (
    !Array.isArray(raw.limitations) ||
    raw.limitations.length !== LIMITATIONS.length ||
    !raw.limitations.every((entry, index) => entry === LIMITATIONS[index])
  ) {
    addIssue(issues, 'structure', '$.limitations', 'invalid-literal', 'limitations must be fixed');
  }

  const vertices = parseVertices(raw.vertices, issues);
  const edges = parseEdges(raw.edges, issues);
  const exterior = parseBoundary(raw.exteriorBoundary, '$.exteriorBoundary', 1, false, issues);
  const faces = parseFaces(raw.faces, issues);
  const topology = parseTopology(raw.topology, issues);
  if (
    (inputSpecVersion !== '1.1' && inputSpecVersion !== '1.2') ||
    exterior === undefined ||
    'triangles' in exterior ||
    topology === undefined
  ) {
    return undefined;
  }
  return {
    inputSpecVersion,
    vertices,
    edges,
    exteriorBoundary: exterior,
    faces,
    topology,
    foldProjection: raw.foldProjection,
  };
}

function compareProjection(
  root: ParsedRoot,
  projection: CandidateFoldProjectionRoundtripV1,
  issues: MutableIssue[],
): void {
  const projectedInputSpec = projection.fileSpec === 1.1 ? '1.1' : '1.2';
  if (root.inputSpecVersion !== projectedInputSpec) {
    addIssue(
      issues,
      'cross-field',
      '$.inputSpecVersion',
      'spec-version-mismatch',
      'must equal foldProjection.file_spec',
    );
  }
  if (root.vertices.length !== projection.exactGraph.vertices.length) {
    addIssue(issues, 'cross-field', '$.vertices', 'length-mismatch', 'must align with projection');
  }
  root.vertices.forEach((vertex, index) => {
    const projected = projection.exactGraph.vertices[index];
    if (
      projected === undefined ||
      vertex.id !== projected.id ||
      !equalExactRationalPoints(vertex.point, projected.point)
    ) {
      addIssue(
        issues,
        'cross-field',
        `$.vertices[${index}]`,
        'vertex-mismatch',
        'ID or exact coordinate differs from projection metadata',
        [vertex.id],
      );
      return;
    }
    if (
      !Object.is(vertex.displayCoordinate[0], projected.displayCoordinate[0]) ||
      !Object.is(vertex.displayCoordinate[1], projected.displayCoordinate[1])
    ) {
      addIssue(
        issues,
        'cross-field',
        `$.vertices[${index}].displayCoordinate`,
        'display-coordinate-mismatch',
        'must equal projection display coordinate',
        [vertex.id],
      );
    }
  });

  if (root.edges.length !== projection.exactGraph.edges.length) {
    addIssue(issues, 'cross-field', '$.edges', 'length-mismatch', 'must align with projection');
  }
  root.edges.forEach((edge, index) => {
    const projected = projection.exactGraph.edges[index];
    const sourceIds = edge.sourceEdges.map((source) => source.id);
    if (
      projected === undefined ||
      edge.id !== projected.id ||
      edge.vertexIds[0] !== projected.startVertexId ||
      edge.vertexIds[1] !== projected.endVertexId ||
      edge.assignment !== projected.assignment ||
      !sameStrings(sourceIds, projected.sourceEdgeIds)
    ) {
      addIssue(
        issues,
        'cross-field',
        `$.edges[${index}]`,
        'edge-mismatch',
        'edge topology, assignment, or provenance differs from projection',
        [edge.id],
      );
    }
    edge.sourceEdges.forEach((source, sourceIndex) => {
      if (source.assignment !== edge.assignment) {
        addIssue(
          issues,
          'cross-field',
          `$.edges[${index}].sourceEdges[${sourceIndex}].assignment`,
          'source-provenance-conflict',
          'source and planar edge assignments must match',
          [source.id, edge.id],
        );
      }
    });
  });

  const compareBoundary = (
    rootBoundary: ParsedBoundary,
    projected: CandidateFoldProjectionRoundtripV1['exteriorBoundary'],
    path: string,
  ): void => {
    if (
      rootBoundary.id !== projected.id ||
      rootBoundary.areaSign !== projected.areaSign ||
      !sameStrings(rootBoundary.vertexIds, projected.vertexIds) ||
      !sameStrings(rootBoundary.edgeIds, projected.edgeIds)
    ) {
      addIssue(issues, 'cross-field', path, 'boundary-mismatch', 'boundary differs from roundtrip');
    }
  };
  compareBoundary(root.exteriorBoundary, projection.exteriorBoundary, '$.exteriorBoundary');

  if (root.faces.length !== projection.faces.length) {
    addIssue(
      issues,
      'cross-field',
      '$.faces',
      'length-mismatch',
      'must align with projection faces',
    );
  }
  root.faces.forEach((face, faceIndex) => {
    const projected = projection.faces[faceIndex];
    if (
      projected === undefined ||
      face.id !== projected.id ||
      face.areaSign !== projected.areaSign ||
      !sameStrings(face.vertexIds, projected.vertexIds) ||
      !sameStrings(face.edgeIds, projected.edgeIds)
    ) {
      addIssue(
        issues,
        'cross-field',
        `$.faces[${faceIndex}]`,
        'face-mismatch',
        'face boundary differs from exact roundtrip',
        [face.id],
      );
      return;
    }
    if (face.triangles.length !== projected.triangles.length) {
      addIssue(
        issues,
        'cross-field',
        `$.faces[${faceIndex}].triangles`,
        'length-mismatch',
        'must align with roundtrip triangles',
      );
    }
    face.triangles.forEach((triangle, triangleIndex) => {
      const expected = projected.triangles[triangleIndex];
      if (
        triangle.faceId !== face.id ||
        expected === undefined ||
        triangle.id !== expected.id ||
        triangle.faceId !== expected.faceId ||
        !sameStrings(triangle.vertexIds, expected.vertexIds) ||
        !sameStrings(triangle.semanticVertexIds, expected.semanticVertexIds)
      ) {
        addIssue(
          issues,
          'cross-field',
          `$.faces[${faceIndex}].triangles[${triangleIndex}]`,
          'triangle-mismatch',
          'triangle differs from exact retriangulation or parent face',
          [triangle.id],
        );
      }
    });
  });
}

function isPowerOfTwo(value: bigint): boolean {
  return value > 0n && (value & (value - 1n)) === 0n;
}

function compareProvenanceAndTopology(root: ParsedRoot, issues: MutableIssue[]): void {
  const sourceVertexIndices = root.vertices.flatMap((vertex) =>
    vertex.sourceVertexIndex === null ? [] : [vertex.sourceVertexIndex],
  );
  const sourceVertexSet = new Set(sourceVertexIndices);
  const completeSourceVertexIndices =
    sourceVertexIndices.length === root.topology.sourceVertexCount &&
    sourceVertexSet.size === root.topology.sourceVertexCount &&
    sourceVertexIndices.every((index) => index < root.topology.sourceVertexCount);
  if (!completeSourceVertexIndices) {
    addIssue(
      issues,
      'cross-field',
      '$.vertices',
      'source-vertex-index-mismatch',
      'nonnull sourceVertexIndex values must uniquely cover 0..sourceVertexCount-1',
    );
  }

  const sourceById = new Map<
    string,
    Readonly<{ index: number; assignment: FoldFaceReconstructionAssignment }>
  >();
  root.edges.forEach((edge, edgeIndex) => {
    edge.sourceEdges.forEach((source, sourceIndex) => {
      const previous = sourceById.get(source.id);
      if (
        previous !== undefined &&
        (previous.index !== source.sourceEdgeIndex || previous.assignment !== source.assignment)
      ) {
        addIssue(
          issues,
          'cross-field',
          `$.edges[${edgeIndex}].sourceEdges[${sourceIndex}]`,
          'source-provenance-conflict',
          'one source ID must retain one index and assignment across every split edge',
          [source.id],
        );
      } else if (previous === undefined) {
        sourceById.set(source.id, {
          index: source.sourceEdgeIndex,
          assignment: source.assignment,
        });
      }
    });
  });
  const sourceIndices = [...sourceById.values()].map((entry) => entry.index);
  const sourceIndexSet = new Set(sourceIndices);
  const completeSourceEdgeIndices =
    sourceById.size === root.topology.sourceEdgeCount &&
    sourceIndexSet.size === root.topology.sourceEdgeCount &&
    sourceIndices.every((index) => index < root.topology.sourceEdgeCount);
  if (!completeSourceEdgeIndices) {
    addIssue(
      issues,
      'cross-field',
      '$.edges',
      'source-edge-index-mismatch',
      'source IDs must map bijectively to indices 0..sourceEdgeCount-1',
    );
  }

  const triangleCount = root.faces.reduce((sum, face) => sum + face.triangles.length, 0);
  const createdIntersectionVertexCount = root.vertices.filter(
    (vertex) => vertex.sourceVertexIndex === null,
  ).length;
  const nonDyadicVertexCount = root.vertices.filter(
    (vertex) =>
      !isPowerOfTwo(vertex.point.x.denominator) || !isPowerOfTwo(vertex.point.y.denominator),
  ).length;
  const expected: Readonly<Record<string, number>> = {
    sourceVertexCount: sourceVertexSet.size,
    sourceEdgeCount: sourceById.size,
    planarVertexCount: root.vertices.length,
    planarEdgeCount: root.edges.length,
    boundedFaceCount: root.faces.length,
    triangleCount,
    createdIntersectionVertexCount,
    nonDyadicVertexCount,
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actual = root.topology[key as keyof ParsedTopology];
    if (actual !== expectedValue) {
      addIssue(
        issues,
        'cross-field',
        `$.topology.${key}`,
        'topology-mismatch',
        `must equal recomputed value ${expectedValue}`,
      );
    }
  }
  if (root.vertices.length - root.edges.length + root.faces.length !== 1) {
    addIssue(
      issues,
      'cross-field',
      '$.topology.eulerValue',
      'topology-mismatch',
      'planarVertexCount - planarEdgeCount + boundedFaceCount must equal 1',
    );
  }

  const incidenceByEdge = new Map(root.edges.map((edge) => [edge.id, 0]));
  root.faces.forEach((face) => {
    face.edgeIds.forEach((edgeId) => {
      const incidence = incidenceByEdge.get(edgeId);
      if (incidence !== undefined) incidenceByEdge.set(edgeId, incidence + 1);
    });
  });
  root.edges.forEach((edge, index) => {
    const expectedIncidence = edge.assignment === 'B' ? 1 : 2;
    if (incidenceByEdge.get(edge.id) !== expectedIncidence) {
      addIssue(
        issues,
        'cross-field',
        `$.edges[${index}].assignment`,
        'assignment-incidence-mismatch',
        `assignment requires ${expectedIncidence} bounded-face incidence(s)`,
        [edge.id],
      );
    }
  });
}

/**
 * Parses the complete candidate result and rechecks its FOLD projection with
 * the same exact kernels. This is runtime integrity checking, not an
 * independent scientific verifier and not evidence for M0F GO.
 */
export function parseCandidateFoldFaceReconstructionV1(
  supplied: unknown,
): CandidateFoldFaceReconstructionParseResult {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return failure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: `result is ${snapshot.reason}; one plain cloneable JSON-data snapshot is required`,
      },
    ]);
  }
  const issues: MutableIssue[] = [];
  const root = parseRoot(snapshot.value, issues);
  if (root === undefined || issues.length > 0) return failure(issues);

  const projectionResult = parseAndRoundtripCandidateFoldProjectionV1(root.foldProjection);
  if (!projectionResult.ok) {
    return failure(
      projectionResult.error.map((entry) => ({
        stage: 'projection-roundtrip' as const,
        path: entry.path === '$' ? '$.foldProjection' : `$.foldProjection${entry.path.slice(1)}`,
        code: entry.code,
        message: entry.message,
        ...(entry.relatedIds === undefined ? {} : { relatedIds: [...entry.relatedIds] }),
      })),
    );
  }

  compareProjection(root, projectionResult.value, issues);
  compareProvenanceAndTopology(root, issues);
  if (issues.length > 0) return failure(issues);
  return {
    ok: true,
    value: deepFreezeOwned(snapshot.value) as CandidateFoldFaceReconstructionV1,
  };
}
