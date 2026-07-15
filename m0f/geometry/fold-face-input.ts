import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';

export const FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS = ['M', 'V', 'B', 'F', 'U'] as const;

export type FoldFaceReconstructionAssignment =
  (typeof FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS)[number];

export type FoldFaceReconstructionInputV1 = Readonly<{
  specVersion: '1.1' | '1.2';
  verticesCoords: readonly (readonly [number, number])[];
  edgesVertices: readonly (readonly [number, number])[];
  edgesAssignment: readonly FoldFaceReconstructionAssignment[];
  facesVertices: null;
}>;

export type NormalizedFoldVertexV1 = Readonly<{
  id: string;
  x: number;
  y: number;
  sourceVertexIndex: number;
}>;

export type NormalizedFoldEdgeV1 = Readonly<{
  id: string;
  vertices: readonly [string, string];
  assignment: FoldFaceReconstructionAssignment;
  sourceEdgeIndex: number;
}>;

export type NormalizedFoldGraphV1 = Readonly<{
  contractStatus: 'candidate';
  scientificClaim: false;
  specVersion: '1.1' | '1.2';
  vertices: readonly NormalizedFoldVertexV1[];
  edges: readonly NormalizedFoldEdgeV1[];
}>;

export type FoldFaceInputIssue = Readonly<{
  path: string;
  code:
    | 'invalid-snapshot'
    | 'invalid-object'
    | 'unknown-field'
    | 'missing-field'
    | 'invalid-literal'
    | 'invalid-array'
    | 'invalid-coordinate'
    | 'duplicate-coordinate'
    | 'invalid-index'
    | 'zero-length-edge'
    | 'duplicate-edge'
    | 'unsupported-assignment'
    | 'isolated-vertex';
  message: string;
}>;

export type NormalizeFoldFaceInputResult =
  | Readonly<{ ok: true; value: NormalizedFoldGraphV1 }>
  | Readonly<{ ok: false; error: readonly FoldFaceInputIssue[] }>;

const INPUT_KEYS = [
  'specVersion',
  'verticesCoords',
  'edgesVertices',
  'edgesAssignment',
  'facesVertices',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addIssue(
  issues: FoldFaceInputIssue[],
  path: string,
  code: FoldFaceInputIssue['code'],
  message: string,
): void {
  issues.push({ path, code, message });
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizedNumber(value: number): number {
  return value === 0 ? 0 : value;
}

function coordinateKey(x: number, y: number): string {
  return `${String(normalizedNumber(x))}\0${String(normalizedNumber(y))}`;
}

function undirectedKey(left: string, right: string): string {
  return compareCodeUnits(left, right) < 0 ? `${left}\0${right}` : `${right}\0${left}`;
}

function stableOrdinal(prefix: 'v' | 'e', ordinal: number, count: number): string {
  const width = Math.max(1, String(Math.max(0, count - 1)).length);
  return `${prefix}:${String(ordinal).padStart(width, '0')}`;
}

function validateExactKeys(raw: Record<string, unknown>, issues: FoldFaceInputIssue[]): void {
  const allowed = new Set<string>(INPUT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      addIssue(issues, `$.${key}`, 'unknown-field', 'field is not declared by candidate input v1');
    }
  }
  for (const key of INPUT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      addIssue(issues, `$.${key}`, 'missing-field', 'field is required');
    }
  }
}

type ParsedVertex = Readonly<{ x: number; y: number; sourceVertexIndex: number }>;
type ParsedEdge = Readonly<{
  sourceEdgeIndex: number;
  firstSourceVertexIndex: number;
  secondSourceVertexIndex: number;
  assignment: FoldFaceReconstructionAssignment;
}>;

function parseVertices(value: unknown, issues: FoldFaceInputIssue[]): ParsedVertex[] {
  if (!Array.isArray(value) || value.length < 3) {
    addIssue(issues, '$.verticesCoords', 'invalid-array', 'must contain at least three points');
    return [];
  }
  const vertices: ParsedVertex[] = [];
  const coordinatePaths = new Map<string, string>();
  value.forEach((entry, sourceVertexIndex) => {
    const path = `$.verticesCoords[${sourceVertexIndex}]`;
    if (!Array.isArray(entry) || entry.length !== 2) {
      addIssue(issues, path, 'invalid-coordinate', 'must contain exactly two finite numbers');
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
      addIssue(issues, path, 'invalid-coordinate', 'must contain exactly two finite numbers');
      return;
    }
    const normalizedX = normalizedNumber(x);
    const normalizedY = normalizedNumber(y);
    const key = coordinateKey(normalizedX, normalizedY);
    const previous = coordinatePaths.get(key);
    if (previous !== undefined) {
      addIssue(
        issues,
        path,
        'duplicate-coordinate',
        `coordinate is already declared at ${previous}`,
      );
      return;
    }
    coordinatePaths.set(key, path);
    vertices.push({ x: normalizedX, y: normalizedY, sourceVertexIndex });
  });
  return vertices;
}

function isAssignment(value: unknown): value is FoldFaceReconstructionAssignment {
  return (
    typeof value === 'string' &&
    (FOLD_FACE_RECONSTRUCTION_ASSIGNMENTS as readonly string[]).includes(value)
  );
}

function parseEdges(
  edgeValue: unknown,
  assignmentValue: unknown,
  vertexCount: number,
  issues: FoldFaceInputIssue[],
): ParsedEdge[] {
  if (!Array.isArray(edgeValue) || edgeValue.length < 3) {
    addIssue(issues, '$.edgesVertices', 'invalid-array', 'must contain at least three edges');
    return [];
  }
  if (!Array.isArray(assignmentValue) || assignmentValue.length !== edgeValue.length) {
    addIssue(
      issues,
      '$.edgesAssignment',
      'invalid-array',
      'must contain exactly one assignment for each edge',
    );
  }
  const edges: ParsedEdge[] = [];
  edgeValue.forEach((entry, sourceEdgeIndex) => {
    const path = `$.edgesVertices[${sourceEdgeIndex}]`;
    if (!Array.isArray(entry) || entry.length !== 2) {
      addIssue(issues, path, 'invalid-index', 'must contain exactly two vertex indices');
      return;
    }
    const first: unknown = (entry as readonly unknown[])[0];
    const second: unknown = (entry as readonly unknown[])[1];
    const validIndex = (candidate: unknown): candidate is number =>
      Number.isSafeInteger(candidate) &&
      (candidate as number) >= 0 &&
      (candidate as number) < vertexCount;
    if (!validIndex(first) || !validIndex(second)) {
      addIssue(issues, path, 'invalid-index', 'indices must reference declared vertices');
      return;
    }
    if (first === second) {
      addIssue(issues, path, 'zero-length-edge', 'edge endpoints must differ');
      return;
    }
    const assignment: unknown = Array.isArray(assignmentValue)
      ? (assignmentValue as readonly unknown[])[sourceEdgeIndex]
      : undefined;
    if (!isAssignment(assignment)) {
      addIssue(
        issues,
        `$.edgesAssignment[${sourceEdgeIndex}]`,
        'unsupported-assignment',
        'must be one of M, V, B, F, U; C and J are unsupported',
      );
      return;
    }
    edges.push({
      sourceEdgeIndex,
      firstSourceVertexIndex: first,
      secondSourceVertexIndex: second,
      assignment,
    });
  });
  return edges;
}

/**
 * Validates the closed, top-level 2D FOLD slice used by the face experiment.
 * IDs are assigned from sorted coordinates and endpoint pairs, never array order.
 */
export function normalizeFoldFaceReconstructionInputV1(
  supplied: unknown,
): NormalizeFoldFaceInputResult {
  const snapshot = tryCreateValidationSnapshot(supplied);
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        {
          path: '$',
          code: 'invalid-snapshot',
          message: 'input must be one cloneable plain JSON-data snapshot',
        },
      ],
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: [{ path: '$', code: 'invalid-object', message: 'input must be an object' }],
    };
  }

  const issues: FoldFaceInputIssue[] = [];
  validateExactKeys(raw, issues);
  if (raw.specVersion !== '1.1' && raw.specVersion !== '1.2') {
    addIssue(issues, '$.specVersion', 'invalid-literal', 'must be FOLD 1.1 or 1.2');
  }
  if (raw.facesVertices !== null) {
    addIssue(
      issues,
      '$.facesVertices',
      'invalid-literal',
      'this experiment reconstructs only an explicitly missing face array',
    );
  }

  const sourceVertexCount = Array.isArray(raw.verticesCoords) ? raw.verticesCoords.length : 0;
  const parsedVertices = parseVertices(raw.verticesCoords, issues);
  const parsedEdges = parseEdges(raw.edgesVertices, raw.edgesAssignment, sourceVertexCount, issues);
  if (issues.length > 0) return { ok: false, error: issues };

  const sortedVertices = [...parsedVertices].sort(
    (left, right) =>
      left.x - right.x || left.y - right.y || left.sourceVertexIndex - right.sourceVertexIndex,
  );
  const vertexBySourceIndex = new Map<number, NormalizedFoldVertexV1>();
  const vertices = sortedVertices.map((vertex, ordinal) => {
    const normalized: NormalizedFoldVertexV1 = {
      id: stableOrdinal('v', ordinal, sortedVertices.length),
      x: vertex.x,
      y: vertex.y,
      sourceVertexIndex: vertex.sourceVertexIndex,
    };
    vertexBySourceIndex.set(vertex.sourceVertexIndex, normalized);
    return normalized;
  });

  const incidentVertexIds = new Set<string>();
  const edgeKeys = new Map<string, string>();
  const normalizedEdges = parsedEdges.flatMap((edge): NormalizedFoldEdgeV1[] => {
    const first = vertexBySourceIndex.get(edge.firstSourceVertexIndex);
    const second = vertexBySourceIndex.get(edge.secondSourceVertexIndex);
    if (first === undefined || second === undefined) {
      addIssue(
        issues,
        `$.edgesVertices[${edge.sourceEdgeIndex}]`,
        'invalid-index',
        'edge references a vertex whose coordinate was rejected',
      );
      return [];
    }
    const verticesPair =
      compareCodeUnits(first.id, second.id) < 0
        ? ([first.id, second.id] as const)
        : ([second.id, first.id] as const);
    const key = undirectedKey(verticesPair[0], verticesPair[1]);
    const previous = edgeKeys.get(key);
    if (previous !== undefined) {
      addIssue(
        issues,
        `$.edgesVertices[${edge.sourceEdgeIndex}]`,
        'duplicate-edge',
        `undirected edge is already declared at ${previous}`,
      );
      return [];
    }
    edgeKeys.set(key, `$.edgesVertices[${edge.sourceEdgeIndex}]`);
    incidentVertexIds.add(first.id);
    incidentVertexIds.add(second.id);
    return [
      {
        id: '',
        vertices: verticesPair,
        assignment: edge.assignment,
        sourceEdgeIndex: edge.sourceEdgeIndex,
      },
    ];
  });

  for (const vertex of vertices) {
    if (!incidentVertexIds.has(vertex.id)) {
      addIssue(
        issues,
        `$.verticesCoords[${vertex.sourceVertexIndex}]`,
        'isolated-vertex',
        'every vertex must be incident to at least one edge in this candidate slice',
      );
    }
  }
  if (issues.length > 0) return { ok: false, error: issues };

  normalizedEdges.sort(
    (left, right) =>
      compareCodeUnits(left.vertices[0], right.vertices[0]) ||
      compareCodeUnits(left.vertices[1], right.vertices[1]),
  );
  const edges = normalizedEdges.map((edge, ordinal) => ({
    ...edge,
    id: stableOrdinal('e', ordinal, normalizedEdges.length),
  }));

  return {
    ok: true,
    value: deepFreezeOwned({
      contractStatus: 'candidate',
      scientificClaim: false,
      specVersion: raw.specVersion as '1.1' | '1.2',
      vertices,
      edges,
    }),
  };
}
