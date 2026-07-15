import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { EXACT_RATIONAL_JSON_ENCODING_ID } from '../model/exact-rational-json.js';
import {
  exactRational,
  exactRationalToBinary64ForDisplay,
  type ExactRational,
  type ExactRationalPoint2,
} from '../model/exact-rational.js';
import { M0F_CONVENTIONS_ID } from '../model/reference-model.js';
import {
  FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS,
  type FoldFaceReconstructionAssignment,
} from './fold-face-input.js';
import { enumeratePlanarFaces } from './planar-faces.js';
import { enumerateRationalPlanarFaces } from './planar-rational-faces.js';
import { triangulatePlanarRationalFaceCandidate } from './triangulate-rational-face.js';

export type FoldProjectionRoundtripIssue = Readonly<{
  stage: 'snapshot' | 'structure' | 'exact-metadata' | 'roundtrip';
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
}>;

export type CandidateRoundtripExactVertexV1 = Readonly<{
  id: string;
  point: ExactRationalPoint2;
  displayCoordinate: readonly [number, number];
}>;

export type CandidateRoundtripExactEdgeV1 = Readonly<{
  id: string;
  startVertexId: string;
  endVertexId: string;
  assignment: FoldFaceReconstructionAssignment;
  sourceEdgeIds: readonly string[];
}>;

export type CandidateRoundtripTriangleV1 = Readonly<{
  id: string;
  faceId: string;
  vertexIds: readonly [string, string, string];
  semanticVertexIds: readonly [string, string, string];
  projectionVertexIndices: readonly [number, number, number];
}>;

export type CandidateRoundtripFaceV1 = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  projectionVertexIndices: readonly number[];
  areaSign: -1;
  triangles: readonly CandidateRoundtripTriangleV1[];
}>;

export type CandidateFoldProjectionRoundtripV1 = Readonly<{
  schemaVersion: 1;
  recordType: 'm0f-fold-projection-roundtrip';
  contractStatus: 'candidate';
  implementationRole: 'same-kernel-roundtrip-parser';
  scientificClaim: false;
  verificationIndependence: 'not-independent-same-exact-kernel';
  fileSpec: 1.1 | 1.2;
  conventionsId: typeof M0F_CONVENTIONS_ID;
  exactCoordinateEncoding: typeof EXACT_RATIONAL_JSON_ENCODING_ID;
  exactGraph: Readonly<{
    vertices: readonly CandidateRoundtripExactVertexV1[];
    edges: readonly CandidateRoundtripExactEdgeV1[];
  }>;
  exteriorBoundary: Readonly<{
    id: string;
    vertexIds: readonly string[];
    edgeIds: readonly string[];
    areaSign: 1;
  }>;
  numericProjectionAudit: Readonly<{
    status: 'passed';
    topologyRole: 'projection-integrity-only';
    exteriorBoundary: Readonly<{
      id: string;
      vertexIds: readonly string[];
      edgeIds: readonly string[];
      areaSign: 1;
    }>;
    boundedFaces: readonly Readonly<{
      id: string;
      vertexIds: readonly string[];
      edgeIds: readonly string[];
      areaSign: -1;
    }>[];
  }>;
  faces: readonly CandidateRoundtripFaceV1[];
  topology: Readonly<{
    vertexCount: number;
    edgeCount: number;
    boundedFaceCount: number;
    triangleCount: number;
    eulerValue: 1;
  }>;
  limitations: readonly [
    'same-kernel-roundtrip-not-independent-verification',
    'display-coordinates-not-used-for-topology',
    'numeric-projection-check-is-not-exact-topology-evidence',
  ];
}>;

export type FoldProjectionRoundtripResult =
  | Readonly<{ ok: true; value: CandidateFoldProjectionRoundtripV1 }>
  | Readonly<{ ok: false; error: readonly FoldProjectionRoundtripIssue[] }>;

interface MutableIssue {
  stage: FoldProjectionRoundtripIssue['stage'];
  path: string;
  code: string;
  message: string;
  relatedIds?: string[];
}

type ParsedEdge = Readonly<{
  id: string;
  startVertexId: string;
  endVertexId: string;
  assignment: FoldFaceReconstructionAssignment;
  sourceEdgeIds: readonly string[];
}>;

type ParsedTriangleProjection = Readonly<{
  faceId: string;
  triangleIds: readonly string[];
  triangleIndices: readonly (readonly [number, number, number])[];
}>;

type ParsedProjection = Readonly<{
  fileSpec: 1.1 | 1.2;
  displayCoordinates: readonly (readonly [number, number])[];
  vertices: readonly Readonly<{ id: string; point: ExactRationalPoint2 }>[];
  edges: readonly ParsedEdge[];
  faceIds: readonly string[];
  faceIndices: readonly (readonly number[])[];
  triangleProjections: readonly ParsedTriangleProjection[];
}>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const TRIANGLE_ID_PATTERN = /^[\x20-\x7e]{1,2048}$/;
const INTEGER_PATTERN = /^(?:0|-?[1-9][0-9]*)$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

const ROOT_KEYS = [
  '_oridesign_m0f_candidate',
  'edges_assignment',
  'edges_vertices',
  'faces_vertices',
  'file_creator',
  'file_spec',
  'frame_classes',
  'vertices_coords',
] as const;
const METADATA_KEYS = [
  'contractStatus',
  'conventionsId',
  'edgeIds',
  'exactCoordinateEncoding',
  'exactVerticesCoords',
  'faceIds',
  'schemaVersion',
  'scientificClaim',
  'sourceEdgeIdsByEdge',
  'trianglesVerticesByFace',
  'vertexIds',
] as const;
const EXACT_POINT_KEYS = ['x', 'y'] as const;
const RATIONAL_KEYS = ['denominator', 'numerator'] as const;
const TRIANGLE_FACE_KEYS = ['faceId', 'triangleIds', 'trianglesVertices'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(
  issues: MutableIssue[],
  stage: MutableIssue['stage'],
  path: string,
  code: string,
  message: string,
  relatedIds?: string[],
): void {
  issues.push({ stage, path, code, message, ...(relatedIds === undefined ? {} : { relatedIds }) });
}

function failure(issues: MutableIssue[]): FoldProjectionRoundtripResult {
  return deepFreezeOwned({ ok: false as const, error: issues });
}

function validateClosedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: MutableIssue[],
): void {
  for (const key of Object.keys(value).sort()) {
    if (!allowed.includes(key)) {
      issue(issues, 'structure', `${path}.${key}`, 'unknown-field', 'field is not declared');
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      issue(issues, 'structure', `${path}.${key}`, 'missing-field', 'field is required');
    }
  }
}

function isAssignment(value: unknown): value is FoldFaceReconstructionAssignment {
  return (
    typeof value === 'string' &&
    (FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS as readonly string[]).includes(value)
  );
}

function parseStableIdArray(
  value: unknown,
  path: string,
  issues: MutableIssue[],
  expectedLength?: number,
): string[] {
  if (!Array.isArray(value)) {
    issue(issues, 'structure', path, 'invalid-array', 'must be an array of stable IDs');
    return [];
  }
  if (expectedLength !== undefined && value.length !== expectedLength) {
    issue(
      issues,
      'structure',
      path,
      'length-mismatch',
      `must contain exactly ${expectedLength} entries`,
    );
  }
  const result: string[] = [];
  const seen = new Set<string>();
  (value as readonly unknown[]).forEach((entry, index) => {
    if (typeof entry !== 'string' || !ID_PATTERN.test(entry)) {
      issue(
        issues,
        'structure',
        `${path}[${index}]`,
        'invalid-id',
        'must be a stable ID of 1..128 ASCII characters',
      );
      return;
    }
    if (seen.has(entry)) {
      issue(issues, 'structure', `${path}[${index}]`, 'duplicate-id', `ID ${entry} is duplicated`);
    } else {
      seen.add(entry);
    }
    result.push(entry);
  });
  return result;
}

function parseRational(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ExactRational | undefined {
  if (!isRecord(value)) {
    issue(
      issues,
      'exact-metadata',
      path,
      'invalid-rational',
      'must be an exact-rational JSON object',
    );
    return undefined;
  }
  validateClosedKeys(value, RATIONAL_KEYS, path, issues);
  const { numerator, denominator } = value;
  if (
    typeof numerator !== 'string' ||
    !INTEGER_PATTERN.test(numerator) ||
    typeof denominator !== 'string' ||
    !POSITIVE_INTEGER_PATTERN.test(denominator)
  ) {
    issue(
      issues,
      'exact-metadata',
      path,
      'invalid-rational',
      'must contain canonical decimal numerator and positive denominator strings',
    );
    return undefined;
  }
  const parsed = exactRational(BigInt(numerator), BigInt(denominator));
  if (parsed.numerator.toString() !== numerator || parsed.denominator.toString() !== denominator) {
    issue(
      issues,
      'exact-metadata',
      path,
      'non-normalized-rational',
      'fraction must be reduced and encode zero as 0/1',
    );
    return undefined;
  }
  return parsed;
}

function parseExactPoint(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ExactRationalPoint2 | undefined {
  if (!isRecord(value)) {
    issue(
      issues,
      'exact-metadata',
      path,
      'invalid-exact-point',
      'must be an exact rational point object',
    );
    return undefined;
  }
  validateClosedKeys(value, EXACT_POINT_KEYS, path, issues);
  const x = parseRational(value.x, `${path}.x`, issues);
  const y = parseRational(value.y, `${path}.y`, issues);
  return x === undefined || y === undefined ? undefined : { x, y };
}

function parseDisplayCoordinates(value: unknown, issues: MutableIssue[]): [number, number][] {
  if (!Array.isArray(value) || value.length < 3) {
    issue(
      issues,
      'structure',
      '$.vertices_coords',
      'invalid-array',
      'must contain at least three display coordinates',
    );
    return [];
  }
  const result: [number, number][] = [];
  (value as readonly unknown[]).forEach((entry, index) => {
    const path = `$.vertices_coords[${index}]`;
    if (!Array.isArray(entry) || entry.length !== 2) {
      issue(issues, 'structure', path, 'invalid-coordinate', 'must be a length-two tuple');
      return;
    }
    const x: unknown = (entry as readonly unknown[])[0];
    const y: unknown = (entry as readonly unknown[])[1];
    if (
      typeof x !== 'number' ||
      !Number.isFinite(x) ||
      typeof y !== 'number' ||
      !Number.isFinite(y)
    ) {
      issue(
        issues,
        'structure',
        path,
        'invalid-coordinate',
        'display coordinates must be finite numbers',
      );
      return;
    }
    result.push([x, y]);
  });
  return result;
}

function validIndex(value: unknown, count: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) < count;
}

function parseIndexTuples(
  value: unknown,
  path: string,
  tupleLength: 2 | 3,
  vertexCount: number,
  issues: MutableIssue[],
): number[][] {
  if (!Array.isArray(value)) {
    issue(issues, 'structure', path, 'invalid-array', 'must be an array of index tuples');
    return [];
  }
  const result: number[][] = [];
  (value as readonly unknown[]).forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!Array.isArray(entry) || entry.length !== tupleLength) {
      issue(
        issues,
        'structure',
        entryPath,
        'invalid-index-tuple',
        `must contain exactly ${tupleLength} indices`,
      );
      return;
    }
    const indices = [...(entry as readonly unknown[])];
    if (indices.some((candidate) => !validIndex(candidate, vertexCount))) {
      issue(
        issues,
        'structure',
        entryPath,
        'invalid-index',
        'every index must reference vertices_coords',
      );
      return;
    }
    const numeric = indices as number[];
    if (new Set(numeric).size !== numeric.length) {
      issue(
        issues,
        'structure',
        entryPath,
        'duplicate-index',
        'indices within one edge or triangle must differ',
      );
      return;
    }
    result.push(numeric);
  });
  return result;
}

function parseFaceIndices(value: unknown, vertexCount: number, issues: MutableIssue[]): number[][] {
  if (!Array.isArray(value) || value.length < 1) {
    issue(
      issues,
      'structure',
      '$.faces_vertices',
      'invalid-array',
      'must contain at least one bounded face',
    );
    return [];
  }
  const result: number[][] = [];
  (value as readonly unknown[]).forEach((entry, index) => {
    const path = `$.faces_vertices[${index}]`;
    if (!Array.isArray(entry) || entry.length < 3) {
      issue(issues, 'structure', path, 'invalid-face', 'face must contain at least three indices');
      return;
    }
    const indices = [...(entry as readonly unknown[])];
    if (indices.some((candidate) => !validIndex(candidate, vertexCount))) {
      issue(
        issues,
        'structure',
        path,
        'invalid-index',
        'face index must reference vertices_coords',
      );
      return;
    }
    const numeric = indices as number[];
    if (new Set(numeric).size !== numeric.length) {
      issue(issues, 'structure', path, 'duplicate-index', 'face indices must be unique');
      return;
    }
    result.push(numeric);
  });
  return result;
}

function parseAssignments(
  value: unknown,
  edgeCount: number,
  issues: MutableIssue[],
): FoldFaceReconstructionAssignment[] {
  if (!Array.isArray(value) || value.length !== edgeCount) {
    issue(
      issues,
      'structure',
      '$.edges_assignment',
      'length-mismatch',
      'must contain exactly one assignment for every edge',
    );
    return [];
  }
  const assignments: FoldFaceReconstructionAssignment[] = [];
  (value as readonly unknown[]).forEach((entry, index) => {
    if (!isAssignment(entry)) {
      issue(
        issues,
        'structure',
        `$.edges_assignment[${index}]`,
        'unsupported-assignment',
        'assignment must be M, V, B, F, or U',
      );
    } else {
      assignments.push(entry);
    }
  });
  return assignments;
}

function parseSourceProvenance(
  value: unknown,
  edgeCount: number,
  assignments: readonly FoldFaceReconstructionAssignment[],
  issues: MutableIssue[],
): string[][] {
  if (!Array.isArray(value) || value.length !== edgeCount) {
    issue(
      issues,
      'structure',
      '$._oridesign_m0f_candidate.sourceEdgeIdsByEdge',
      'length-mismatch',
      'must contain one provenance array for every planar edge',
    );
    return [];
  }
  const assignmentBySource = new Map<string, FoldFaceReconstructionAssignment>();
  const result: string[][] = [];
  (value as readonly unknown[]).forEach((entry, edgeIndex) => {
    const path = `$._oridesign_m0f_candidate.sourceEdgeIdsByEdge[${edgeIndex}]`;
    if (!Array.isArray(entry) || entry.length < 1) {
      issue(
        issues,
        'structure',
        path,
        'invalid-provenance',
        'each planar edge requires at least one source edge ID',
      );
      return;
    }
    const ids: string[] = [];
    const local = new Set<string>();
    (entry as readonly unknown[]).forEach((sourceId, sourceIndex) => {
      if (typeof sourceId !== 'string' || !ID_PATTERN.test(sourceId)) {
        issue(
          issues,
          'structure',
          `${path}[${sourceIndex}]`,
          'invalid-id',
          'source provenance must use stable IDs',
        );
        return;
      }
      if (local.has(sourceId)) {
        issue(
          issues,
          'structure',
          `${path}[${sourceIndex}]`,
          'duplicate-id',
          `source ID ${sourceId} is duplicated within one edge`,
        );
      } else {
        local.add(sourceId);
      }
      const assignment = assignments[edgeIndex];
      const previousAssignment = assignmentBySource.get(sourceId);
      if (
        assignment !== undefined &&
        previousAssignment !== undefined &&
        previousAssignment !== assignment
      ) {
        issue(
          issues,
          'structure',
          path,
          'provenance-assignment-conflict',
          `source edge ${sourceId} is associated with conflicting assignments`,
          [sourceId],
        );
      } else if (assignment !== undefined) {
        assignmentBySource.set(sourceId, assignment);
      }
      ids.push(sourceId);
    });
    result.push(ids);
  });
  return result;
}

function parseTriangleIds(value: unknown, path: string, issues: MutableIssue[]): string[] {
  if (!Array.isArray(value)) {
    issue(issues, 'structure', path, 'invalid-array', 'must be an array of triangle IDs');
    return [];
  }
  const result: string[] = [];
  (value as readonly unknown[]).forEach((entry, index) => {
    if (typeof entry !== 'string' || !TRIANGLE_ID_PATTERN.test(entry)) {
      issue(
        issues,
        'structure',
        `${path}[${index}]`,
        'invalid-triangle-id',
        'must be a nonempty printable ASCII candidate triangle ID',
      );
    } else {
      result.push(entry);
    }
  });
  return result;
}

function parseTriangleProjections(
  value: unknown,
  faceIds: readonly string[],
  vertexCount: number,
  issues: MutableIssue[],
): ParsedTriangleProjection[] {
  const path = '$._oridesign_m0f_candidate.trianglesVerticesByFace';
  if (!Array.isArray(value) || value.length !== faceIds.length) {
    issue(
      issues,
      'structure',
      path,
      'length-mismatch',
      'must contain one triangle record for every face',
    );
    return [];
  }
  const result: ParsedTriangleProjection[] = [];
  const globalTriangleIds = new Set<string>();
  (value as readonly unknown[]).forEach((entry, faceIndex) => {
    const entryPath = `${path}[${faceIndex}]`;
    if (!isRecord(entry)) {
      issue(issues, 'structure', entryPath, 'invalid-object', 'must be a triangle record');
      return;
    }
    validateClosedKeys(entry, TRIANGLE_FACE_KEYS, entryPath, issues);
    const expectedFaceId = faceIds[faceIndex];
    const faceId = entry.faceId;
    if (typeof faceId !== 'string' || faceId !== expectedFaceId) {
      issue(
        issues,
        'structure',
        `${entryPath}.faceId`,
        'face-id-mismatch',
        'triangle record faceId must match faceIds at the same index',
      );
    }
    const triangleIds = parseTriangleIds(entry.triangleIds, `${entryPath}.triangleIds`, issues);
    for (const triangleId of triangleIds) {
      if (globalTriangleIds.has(triangleId)) {
        issue(
          issues,
          'structure',
          `${entryPath}.triangleIds`,
          'duplicate-id',
          `triangle ID ${triangleId} is duplicated`,
        );
      } else {
        globalTriangleIds.add(triangleId);
      }
    }
    const rawTriangleIndices = parseIndexTuples(
      entry.trianglesVertices,
      `${entryPath}.trianglesVertices`,
      3,
      vertexCount,
      issues,
    );
    if (triangleIds.length !== rawTriangleIndices.length) {
      issue(
        issues,
        'structure',
        entryPath,
        'length-mismatch',
        'triangleIds and trianglesVertices must have equal lengths',
      );
    }
    const triangleIndices = rawTriangleIndices.flatMap((indices) => {
      const [first, second, third] = indices;
      return first === undefined || second === undefined || third === undefined
        ? []
        : [[first, second, third] as const];
    });
    if (typeof faceId === 'string') {
      result.push({ faceId, triangleIds, triangleIndices });
    }
  });
  return result;
}

function parseProjection(
  snapshot: unknown,
):
  | Readonly<{ ok: true; value: ParsedProjection }>
  | Readonly<{ ok: false; issues: MutableIssue[] }> {
  const issues: MutableIssue[] = [];
  if (!isRecord(snapshot)) {
    issue(issues, 'structure', '$', 'invalid-object', 'projection must be an object');
    return { ok: false, issues };
  }
  validateClosedKeys(snapshot, ROOT_KEYS, '$', issues);
  const fileSpec = snapshot.file_spec;
  if (fileSpec !== 1.1 && fileSpec !== 1.2) {
    issue(issues, 'structure', '$.file_spec', 'invalid-literal', 'must be FOLD 1.1 or 1.2');
  }
  if (snapshot.file_creator !== 'OriDesign M0F candidate reference') {
    issue(
      issues,
      'structure',
      '$.file_creator',
      'invalid-literal',
      'must identify the candidate reference emitter',
    );
  }
  if (
    !Array.isArray(snapshot.frame_classes) ||
    snapshot.frame_classes.length !== 1 ||
    snapshot.frame_classes[0] !== 'creasePattern'
  ) {
    issue(
      issues,
      'structure',
      '$.frame_classes',
      'invalid-literal',
      'must equal ["creasePattern"]',
    );
  }
  const displayCoordinates = parseDisplayCoordinates(snapshot.vertices_coords, issues);
  const rawEdgeIndices = parseIndexTuples(
    snapshot.edges_vertices,
    '$.edges_vertices',
    2,
    displayCoordinates.length,
    issues,
  );
  if (rawEdgeIndices.length < 3) {
    issue(
      issues,
      'structure',
      '$.edges_vertices',
      'invalid-array',
      'must contain at least three edges',
    );
  }
  const assignments = parseAssignments(snapshot.edges_assignment, rawEdgeIndices.length, issues);
  const faceIndices = parseFaceIndices(snapshot.faces_vertices, displayCoordinates.length, issues);

  const metadata = snapshot._oridesign_m0f_candidate;
  if (!isRecord(metadata)) {
    issue(
      issues,
      'structure',
      '$._oridesign_m0f_candidate',
      'invalid-object',
      'candidate metadata must be an object',
    );
    return { ok: false, issues };
  }
  validateClosedKeys(metadata, METADATA_KEYS, '$._oridesign_m0f_candidate', issues);
  const literalChecks: readonly [unknown, unknown, string][] = [
    [metadata.schemaVersion, 1, 'schemaVersion'],
    [metadata.contractStatus, 'candidate', 'contractStatus'],
    [metadata.scientificClaim, false, 'scientificClaim'],
    [metadata.conventionsId, M0F_CONVENTIONS_ID, 'conventionsId'],
    [metadata.exactCoordinateEncoding, EXACT_RATIONAL_JSON_ENCODING_ID, 'exactCoordinateEncoding'],
  ];
  for (const [actual, expected, key] of literalChecks) {
    if (actual !== expected) {
      issue(
        issues,
        'structure',
        `$._oridesign_m0f_candidate.${key}`,
        'invalid-literal',
        `must equal ${String(expected)}`,
      );
    }
  }

  const vertexIds = parseStableIdArray(
    metadata.vertexIds,
    '$._oridesign_m0f_candidate.vertexIds',
    issues,
    displayCoordinates.length,
  );
  const edgeIds = parseStableIdArray(
    metadata.edgeIds,
    '$._oridesign_m0f_candidate.edgeIds',
    issues,
    rawEdgeIndices.length,
  );
  const faceIds = parseStableIdArray(
    metadata.faceIds,
    '$._oridesign_m0f_candidate.faceIds',
    issues,
    faceIndices.length,
  );

  const exactPoints: ExactRationalPoint2[] = [];
  if (!Array.isArray(metadata.exactVerticesCoords)) {
    issue(
      issues,
      'exact-metadata',
      '$._oridesign_m0f_candidate.exactVerticesCoords',
      'invalid-array',
      'must be an array of exact rational points',
    );
  } else {
    if (metadata.exactVerticesCoords.length !== displayCoordinates.length) {
      issue(
        issues,
        'exact-metadata',
        '$._oridesign_m0f_candidate.exactVerticesCoords',
        'length-mismatch',
        'must align exactly with vertices_coords',
      );
    }
    (metadata.exactVerticesCoords as readonly unknown[]).forEach((entry, index) => {
      const parsed = parseExactPoint(
        entry,
        `$._oridesign_m0f_candidate.exactVerticesCoords[${index}]`,
        issues,
      );
      if (parsed !== undefined) exactPoints.push(parsed);
    });
  }
  const sourceEdgeIdsByEdge = parseSourceProvenance(
    metadata.sourceEdgeIdsByEdge,
    rawEdgeIndices.length,
    assignments,
    issues,
  );
  const triangleProjections = parseTriangleProjections(
    metadata.trianglesVerticesByFace,
    faceIds,
    displayCoordinates.length,
    issues,
  );
  if (issues.length > 0) return { ok: false, issues };
  if (
    (fileSpec !== 1.1 && fileSpec !== 1.2) ||
    vertexIds.length !== exactPoints.length ||
    edgeIds.length !== rawEdgeIndices.length ||
    assignments.length !== rawEdgeIndices.length ||
    sourceEdgeIdsByEdge.length !== rawEdgeIndices.length ||
    faceIds.length !== faceIndices.length ||
    triangleProjections.length !== faceIds.length
  ) {
    throw new TypeError('projection alignment was validated but could not be materialized');
  }

  const vertices = vertexIds.map((id, index) => {
    const point = exactPoints[index];
    if (point === undefined) throw new TypeError('exact point is missing');
    return { id, point };
  });
  const edges = edgeIds.map((id, index): ParsedEdge => {
    const indices = rawEdgeIndices[index];
    const assignment = assignments[index];
    const sourceEdgeIds = sourceEdgeIdsByEdge[index];
    const first = indices?.[0];
    const second = indices?.[1];
    if (
      first === undefined ||
      second === undefined ||
      assignment === undefined ||
      sourceEdgeIds === undefined
    ) {
      throw new TypeError('parsed edge is incomplete');
    }
    const startVertexId = vertexIds[first];
    const endVertexId = vertexIds[second];
    if (startVertexId === undefined || endVertexId === undefined) {
      throw new TypeError('parsed edge references a missing ID');
    }
    return { id, startVertexId, endVertexId, assignment, sourceEdgeIds };
  });
  return {
    ok: true,
    value: {
      fileSpec,
      displayCoordinates,
      vertices,
      edges,
      faceIds,
      faceIndices,
      triangleProjections,
    },
  };
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function sameCanonicalBoundary(
  left: Readonly<{ id: string; vertexIds: readonly string[]; edgeIds: readonly string[] }>,
  right: Readonly<{ id: string; vertexIds: readonly string[]; edgeIds: readonly string[] }>,
): boolean {
  return (
    left.id === right.id &&
    sameStrings(left.vertexIds, right.vertexIds) &&
    sameStrings(left.edgeIds, right.edgeIds)
  );
}

function roundtripFailure(
  path: string,
  code: string,
  message: string,
  relatedIds?: string[],
): FoldProjectionRoundtripResult {
  return failure([
    {
      stage: 'roundtrip',
      path,
      code,
      message,
      ...(relatedIds === undefined ? {} : { relatedIds }),
    },
  ]);
}

/**
 * Candidate roundtrip parser for the emitted FOLD projection. This deliberately
 * reuses the same exact face and triangulation kernels as reconstruction; it is
 * integrity checking and serialization hardening, not an independent verifier.
 * Display coordinates are compared only after topology is recovered from exact
 * rational metadata, and never participate in a topological decision.
 */
export function parseAndRoundtripCandidateFoldProjectionV1(
  supplied: unknown,
): FoldProjectionRoundtripResult {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return failure([
      {
        stage: 'snapshot',
        path: '$',
        code: 'invalid-snapshot',
        message: `projection is ${snapshot.reason}; one plain cloneable JSON-data snapshot is required`,
      },
    ]);
  }
  const parsed = parseProjection(snapshot.value);
  if (!parsed.ok) return failure(parsed.issues);
  const projection = parsed.value;

  const exactGraphInput = {
    vertices: projection.vertices,
    edges: projection.edges.map((edge) => ({
      id: edge.id,
      startVertexId: edge.startVertexId,
      endVertexId: edge.endVertexId,
      sourceEdgeIds: edge.sourceEdgeIds,
    })),
  };
  const enumerated = enumerateRationalPlanarFaces(exactGraphInput);
  if (!enumerated.ok) {
    return failure(
      enumerated.error.map((entry) => ({
        stage: 'roundtrip' as const,
        path: entry.path,
        code: `exact-graph-${entry.code}`,
        message: entry.message,
        ...(entry.relatedIds === undefined ? {} : { relatedIds: [...entry.relatedIds] }),
      })),
    );
  }

  const boundedFaceIncidenceByEdgeId = new Map(projection.edges.map((edge) => [edge.id, 0]));
  for (const face of enumerated.value.boundedFaces) {
    for (const edgeId of face.edgeIds) {
      const previous = boundedFaceIncidenceByEdgeId.get(edgeId);
      if (previous === undefined) {
        throw new TypeError(`exact face references undeclared projection edge ${edgeId}`);
      }
      boundedFaceIncidenceByEdgeId.set(edgeId, previous + 1);
    }
  }
  for (let edgeIndex = 0; edgeIndex < projection.edges.length; edgeIndex += 1) {
    const edge = projection.edges[edgeIndex];
    if (edge === undefined) throw new TypeError('parsed projection edge is missing');
    const incidence = boundedFaceIncidenceByEdgeId.get(edge.id);
    const expectedIncidence = edge.assignment === 'B' ? 1 : 2;
    if (incidence !== expectedIncidence) {
      return roundtripFailure(
        `$.edges_assignment[${edgeIndex}]`,
        'assignment-incidence-mismatch',
        `assignment ${edge.assignment} requires ${expectedIncidence} bounded-face incidence, received ${String(incidence)}`,
        [edge.id],
      );
    }
  }

  for (let index = 0; index < projection.vertices.length; index += 1) {
    const vertex = projection.vertices[index];
    const display = projection.displayCoordinates[index];
    if (vertex === undefined || display === undefined)
      throw new TypeError('parsed vertex is incomplete');
    const rawExpectedX = exactRationalToBinary64ForDisplay(vertex.point.x);
    const rawExpectedY = exactRationalToBinary64ForDisplay(vertex.point.y);
    if (!Number.isFinite(rawExpectedX) || !Number.isFinite(rawExpectedY)) {
      return roundtripFailure(
        `$._oridesign_m0f_candidate.exactVerticesCoords[${index}]`,
        'display-coordinate-unrepresentable',
        'exact coordinate cannot be represented by a finite display number',
        [vertex.id],
      );
    }
    const expectedX = rawExpectedX === 0 ? 0 : rawExpectedX;
    const expectedY = rawExpectedY === 0 ? 0 : rawExpectedY;
    if (!Object.is(display[0], expectedX) || !Object.is(display[1], expectedY)) {
      return roundtripFailure(
        `$.vertices_coords[${index}]`,
        'display-coordinate-mismatch',
        'display coordinate does not exactly match the exact-metadata display conversion',
        [vertex.id],
      );
    }
  }

  const numericProjection = enumeratePlanarFaces({
    vertices: projection.vertices.map((vertex, index) => {
      const display = projection.displayCoordinates[index];
      if (display === undefined) throw new TypeError('numeric projection vertex is incomplete');
      return { id: vertex.id, x: display[0], y: display[1] };
    }),
    edges: projection.edges.map((edge) => ({
      id: edge.id,
      vertices: [edge.startVertexId, edge.endVertexId],
    })),
  });
  if (!numericProjection.ok) {
    return failure(
      numericProjection.error.map((entry) => ({
        stage: 'roundtrip' as const,
        path: entry.path,
        code: `numeric-projection-${entry.code}`,
        message: `binary64 projection rejected: ${entry.message}`,
        ...(entry.relatedIds === undefined ? {} : { relatedIds: [...entry.relatedIds] }),
      })),
    );
  }
  if (
    !sameCanonicalBoundary(
      numericProjection.value.exteriorBoundary,
      enumerated.value.exteriorBoundary,
    ) ||
    numericProjection.value.boundedFaces.length !== enumerated.value.boundedFaces.length ||
    numericProjection.value.boundedFaces.some((face, index) => {
      const exactFace = enumerated.value.boundedFaces[index];
      return exactFace === undefined || !sameCanonicalBoundary(face, exactFace);
    })
  ) {
    return roundtripFailure(
      '$.vertices_coords',
      'numeric-projection-topology-mismatch',
      'binary64 projection canonical face cycles differ from exact-rational topology',
    );
  }
  if (enumerated.value.boundedFaces.length !== projection.faceIds.length) {
    return roundtripFailure(
      '$.faces_vertices',
      'face-count-mismatch',
      'exact face enumeration count differs from projected faces',
    );
  }

  const faces: CandidateRoundtripFaceV1[] = [];
  let triangleCount = 0;
  for (let faceIndex = 0; faceIndex < enumerated.value.boundedFaces.length; faceIndex += 1) {
    const face = enumerated.value.boundedFaces[faceIndex];
    const projectedFaceId = projection.faceIds[faceIndex];
    const projectedIndices = projection.faceIndices[faceIndex];
    const triangleProjection = projection.triangleProjections[faceIndex];
    if (
      face === undefined ||
      projectedFaceId === undefined ||
      projectedIndices === undefined ||
      triangleProjection === undefined
    ) {
      throw new TypeError('parsed face alignment is incomplete');
    }
    const projectedVertexIds = projectedIndices.map(
      (index) => projection.vertices[index]?.id ?? '',
    );
    if (projectedFaceId !== face.id || !sameStrings(projectedVertexIds, face.vertexIds)) {
      return roundtripFailure(
        `$.faces_vertices[${faceIndex}]`,
        'face-roundtrip-mismatch',
        'projected face ID or canonical vertex cycle differs from exact re-enumeration',
        [projectedFaceId, face.id],
      );
    }
    const triangulated = triangulatePlanarRationalFaceCandidate({
      boundary: face,
      vertices: projection.vertices,
    });
    if (!triangulated.ok) {
      return failure(
        triangulated.error.map((entry) => ({
          stage: 'roundtrip' as const,
          path: entry.path,
          code: `exact-triangulation-${entry.code}`,
          message: entry.message,
        })),
      );
    }
    if (
      triangleProjection.faceId !== face.id ||
      !sameStrings(
        triangleProjection.triangleIds,
        triangulated.value.triangles.map((triangle) => triangle.id),
      ) ||
      triangleProjection.triangleIndices.length !== triangulated.value.triangles.length
    ) {
      return roundtripFailure(
        `$._oridesign_m0f_candidate.trianglesVerticesByFace[${faceIndex}]`,
        'triangle-roundtrip-mismatch',
        'projected triangle IDs or count differ from exact retriangulation',
        [face.id],
      );
    }
    const triangles: CandidateRoundtripTriangleV1[] = [];
    for (
      let triangleIndex = 0;
      triangleIndex < triangulated.value.triangles.length;
      triangleIndex += 1
    ) {
      const triangle = triangulated.value.triangles[triangleIndex];
      const projectionIndices = triangleProjection.triangleIndices[triangleIndex];
      if (triangle === undefined || projectionIndices === undefined) {
        throw new TypeError('parsed triangle alignment is incomplete');
      }
      const projectionVertexIds = projectionIndices.map(
        (index) => projection.vertices[index]?.id ?? '',
      );
      if (!sameStrings(projectionVertexIds, triangle.vertexIds)) {
        return roundtripFailure(
          `$._oridesign_m0f_candidate.trianglesVerticesByFace[${faceIndex}].trianglesVertices[${triangleIndex}]`,
          'triangle-roundtrip-mismatch',
          'projected triangle indices differ from exact retriangulation',
          [triangle.id],
        );
      }
      const [first, second, third] = projectionIndices;
      triangles.push({
        id: triangle.id,
        faceId: triangle.faceId,
        vertexIds: triangle.vertexIds,
        semanticVertexIds: triangle.semanticVertexIds,
        projectionVertexIndices: [first, second, third],
      });
    }
    triangleCount += triangles.length;
    faces.push({
      id: face.id,
      vertexIds: face.vertexIds,
      edgeIds: face.edgeIds,
      projectionVertexIndices: projectedIndices,
      areaSign: -1,
      triangles,
    });
  }

  const exactVertices = projection.vertices.map((vertex, index) => {
    const displayCoordinate = projection.displayCoordinates[index];
    if (displayCoordinate === undefined)
      throw new TypeError('parsed display coordinate is missing');
    return { id: vertex.id, point: vertex.point, displayCoordinate };
  });

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: 'm0f-fold-projection-roundtrip' as const,
      contractStatus: 'candidate' as const,
      implementationRole: 'same-kernel-roundtrip-parser' as const,
      scientificClaim: false as const,
      verificationIndependence: 'not-independent-same-exact-kernel' as const,
      fileSpec: projection.fileSpec,
      conventionsId: M0F_CONVENTIONS_ID,
      exactCoordinateEncoding: EXACT_RATIONAL_JSON_ENCODING_ID,
      exactGraph: {
        vertices: exactVertices,
        edges: projection.edges,
      },
      exteriorBoundary: {
        id: enumerated.value.exteriorBoundary.id,
        vertexIds: enumerated.value.exteriorBoundary.vertexIds,
        edgeIds: enumerated.value.exteriorBoundary.edgeIds,
        areaSign: 1 as const,
      },
      numericProjectionAudit: {
        status: 'passed' as const,
        topologyRole: 'projection-integrity-only' as const,
        exteriorBoundary: {
          id: numericProjection.value.exteriorBoundary.id,
          vertexIds: numericProjection.value.exteriorBoundary.vertexIds,
          edgeIds: numericProjection.value.exteriorBoundary.edgeIds,
          areaSign: 1 as const,
        },
        boundedFaces: numericProjection.value.boundedFaces.map((face) => ({
          id: face.id,
          vertexIds: face.vertexIds,
          edgeIds: face.edgeIds,
          areaSign: -1 as const,
        })),
      },
      faces,
      topology: {
        vertexCount: projection.vertices.length,
        edgeCount: projection.edges.length,
        boundedFaceCount: faces.length,
        triangleCount,
        eulerValue: 1 as const,
      },
      limitations: [
        'same-kernel-roundtrip-not-independent-verification',
        'display-coordinates-not-used-for-topology',
        'numeric-projection-check-is-not-exact-topology-evidence',
      ] as const,
    },
  });
}
