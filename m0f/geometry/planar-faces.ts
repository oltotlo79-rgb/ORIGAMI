import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import { exactOrientationSign, exactPolygonAreaSign } from '../model/exact-dyadic.js';
import { classifySegmentIntersection } from './predicates.js';

export type PlanarGraphVertex = Readonly<{ id: string; x: number; y: number }>;
export type PlanarGraphEdge = Readonly<{
  id: string;
  vertices: readonly [string, string];
}>;
export type PlanarGraphInput = Readonly<{
  vertices: readonly PlanarGraphVertex[];
  edges: readonly PlanarGraphEdge[];
}>;

export type PlanarFaceIssueCode =
  | 'invalid-input'
  | 'unknown-field'
  | 'invalid-array'
  | 'invalid-tuple'
  | 'invalid-id'
  | 'duplicate-id'
  | 'non-finite-coordinate'
  | 'duplicate-coordinate'
  | 'missing-vertex'
  | 'zero-length-edge'
  | 'duplicate-edge'
  | 'proper-crossing'
  | 't-junction'
  | 'collinear-overlap'
  | 'disconnected-graph'
  | 'bridge-edge'
  | 'non-cellular-embedding'
  | 'degenerate-face'
  | 'invalid-face-orientation'
  | 'euler-mismatch';

export type PlanarFaceIssue = Readonly<{
  path: string;
  code: PlanarFaceIssueCode;
  message: string;
  relatedIds?: readonly string[];
}>;

export type PlanarFaceBoundary = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  /** Exact sign of twice the area in stored, y-down paper coordinates. */
  areaSign: -1 | 1;
}>;

export type PlanarFaceEnumeration = Readonly<{
  claimStatus: 'candidate-only';
  exteriorBoundary: PlanarFaceBoundary;
  boundedFaces: readonly PlanarFaceBoundary[];
  topology: Readonly<{
    vertexCount: number;
    edgeCount: number;
    boundedFaceCount: number;
    eulerValue: 1;
  }>;
}>;

export type PlanarFaceResult =
  | Readonly<{ ok: true; value: PlanarFaceEnumeration }>
  | Readonly<{ ok: false; error: readonly PlanarFaceIssue[] }>;

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const EXPECTED_INPUT_KEYS = ['edges', 'vertices'] as const;
const EXPECTED_VERTEX_KEYS = ['id', 'x', 'y'] as const;
const EXPECTED_EDGE_KEYS = ['id', 'vertices'] as const;

interface MutableIssue {
  path: string;
  code: PlanarFaceIssueCode;
  message: string;
  relatedIds?: string[];
}

type ValidEdge = Readonly<{
  id: string;
  vertices: readonly [string, string];
}>;

type HalfEdge = Readonly<{
  key: string;
  edgeId: string;
  fromId: string;
  toId: string;
}>;

type RawBoundary = Readonly<{
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  areaSign: -1 | 1;
}>;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: MutableIssue[],
): void {
  for (const key of Object.keys(value).sort(compareCodeUnits)) {
    if (!expected.includes(key)) {
      issues.push({
        path: `${path}.${key}`,
        code: 'unknown-field',
        message: 'field is not part of the candidate planar-graph input',
      });
    }
  }
}

function coordinateKey(point: Readonly<{ x: number; y: number }>): string {
  const x = point.x === 0 ? 0 : point.x;
  const y = point.y === 0 ? 0 : point.y;
  return `${x}|${y}`;
}

function undirectedKey(left: string, right: string): string {
  return compareCodeUnits(left, right) <= 0 ? `${left}\u0000${right}` : `${right}\u0000${left}`;
}

function halfEdgeKey(edgeId: string, fromId: string, toId: string): string {
  return `${edgeId}\u0000${fromId}\u0000${toId}`;
}

function invalid(error: MutableIssue[]): PlanarFaceResult {
  return deepFreezeOwned({ ok: false as const, error });
}

function validateInput(snapshot: unknown):
  | Readonly<{
      ok: true;
      vertices: readonly PlanarGraphVertex[];
      edges: readonly ValidEdge[];
    }>
  | Readonly<{ ok: false; issues: MutableIssue[] }> {
  const issues: MutableIssue[] = [];
  if (!isRecord(snapshot)) {
    return {
      ok: false,
      issues: [{ path: '$', code: 'invalid-input', message: 'must be a plain input object' }],
    };
  }
  rejectUnknownFields(snapshot, EXPECTED_INPUT_KEYS, '$', issues);

  const rawVertices = snapshot.vertices;
  const rawEdges = snapshot.edges;
  if (!Array.isArray(rawVertices)) {
    issues.push({ path: '$.vertices', code: 'invalid-array', message: 'must be an array' });
  }
  if (!Array.isArray(rawEdges)) {
    issues.push({ path: '$.edges', code: 'invalid-array', message: 'must be an array' });
  }
  if (!Array.isArray(rawVertices) || !Array.isArray(rawEdges)) return { ok: false, issues };

  const vertices: PlanarGraphVertex[] = [];
  const vertexIds = new Set<string>();
  const coordinates = new Map<string, string>();
  rawVertices.forEach((entry: unknown, index: number) => {
    const path = `$.vertices[${index}]`;
    if (!isRecord(entry)) {
      issues.push({ path, code: 'invalid-input', message: 'must be a vertex object' });
      return;
    }
    rejectUnknownFields(entry, EXPECTED_VERTEX_KEYS, path, issues);
    const { id, x, y } = entry;
    let idValid = false;
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      issues.push({
        path: `${path}.id`,
        code: 'invalid-id',
        message: 'must be a stable ID of 1..128 ASCII characters',
      });
    } else if (vertexIds.has(id)) {
      issues.push({
        path: `${path}.id`,
        code: 'duplicate-id',
        message: `stable ID ${id} is duplicated`,
        relatedIds: [id],
      });
    } else {
      vertexIds.add(id);
      idValid = true;
    }
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      issues.push({
        path: `${path}.x`,
        code: 'non-finite-coordinate',
        message: 'must be a finite binary64 number',
      });
    }
    if (typeof y !== 'number' || !Number.isFinite(y)) {
      issues.push({
        path: `${path}.y`,
        code: 'non-finite-coordinate',
        message: 'must be a finite binary64 number',
      });
    }
    if (
      !idValid ||
      typeof id !== 'string' ||
      typeof x !== 'number' ||
      !Number.isFinite(x) ||
      typeof y !== 'number' ||
      !Number.isFinite(y)
    ) {
      return;
    }
    const point = { id, x: x === 0 ? 0 : x, y: y === 0 ? 0 : y };
    const key = coordinateKey(point);
    const priorId = coordinates.get(key);
    if (priorId !== undefined) {
      issues.push({
        path,
        code: 'duplicate-coordinate',
        message: `vertices ${priorId} and ${id} have identical coordinates`,
        relatedIds: [priorId, id].sort(compareCodeUnits),
      });
    } else {
      coordinates.set(key, id);
    }
    vertices.push(point);
  });

  const edges: ValidEdge[] = [];
  const edgeIds = new Set<string>();
  const edgePairs = new Map<string, string>();
  rawEdges.forEach((entry: unknown, index: number) => {
    const path = `$.edges[${index}]`;
    if (!isRecord(entry)) {
      issues.push({ path, code: 'invalid-input', message: 'must be an edge object' });
      return;
    }
    rejectUnknownFields(entry, EXPECTED_EDGE_KEYS, path, issues);
    const { id, vertices: endpoints } = entry;
    let idValid = false;
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      issues.push({
        path: `${path}.id`,
        code: 'invalid-id',
        message: 'must be a stable ID of 1..128 ASCII characters',
      });
    } else if (edgeIds.has(id)) {
      issues.push({
        path: `${path}.id`,
        code: 'duplicate-id',
        message: `stable ID ${id} is duplicated`,
        relatedIds: [id],
      });
    } else {
      edgeIds.add(id);
      idValid = true;
    }
    if (!Array.isArray(endpoints) || endpoints.length !== 2) {
      issues.push({
        path: `${path}.vertices`,
        code: 'invalid-tuple',
        message: 'must contain exactly two stable vertex IDs',
      });
      return;
    }
    const left: unknown = (endpoints as readonly unknown[])[0];
    const right: unknown = (endpoints as readonly unknown[])[1];
    if (typeof left !== 'string' || !ID_PATTERN.test(left)) {
      issues.push({
        path: `${path}.vertices[0]`,
        code: 'invalid-id',
        message: 'must be a stable vertex ID',
      });
    }
    if (typeof right !== 'string' || !ID_PATTERN.test(right)) {
      issues.push({
        path: `${path}.vertices[1]`,
        code: 'invalid-id',
        message: 'must be a stable vertex ID',
      });
    }
    if (
      !idValid ||
      typeof id !== 'string' ||
      typeof left !== 'string' ||
      !ID_PATTERN.test(left) ||
      typeof right !== 'string' ||
      !ID_PATTERN.test(right)
    )
      return;
    if (!vertexIds.has(left)) {
      issues.push({
        path: `${path}.vertices[0]`,
        code: 'missing-vertex',
        message: `vertex ${left} is not declared`,
        relatedIds: [left],
      });
    }
    if (!vertexIds.has(right)) {
      issues.push({
        path: `${path}.vertices[1]`,
        code: 'missing-vertex',
        message: `vertex ${right} is not declared`,
        relatedIds: [right],
      });
    }
    if (left === right) {
      issues.push({
        path: `${path}.vertices`,
        code: 'zero-length-edge',
        message: 'edge endpoints must be distinct',
        relatedIds: [id],
      });
    }
    const pairKey = undirectedKey(left, right);
    const priorId = edgePairs.get(pairKey);
    if (priorId !== undefined) {
      issues.push({
        path,
        code: 'duplicate-edge',
        message: `edges ${priorId} and ${id} have the same endpoints`,
        relatedIds: [priorId, id].sort(compareCodeUnits),
      });
    } else {
      edgePairs.set(pairKey, id);
    }
    if (vertexIds.has(left) && vertexIds.has(right) && left !== right) {
      const ordered: readonly [string, string] =
        compareCodeUnits(left, right) <= 0 ? [left, right] : [right, left];
      edges.push({ id, vertices: ordered });
    }
  });

  if (issues.length > 0) return { ok: false, issues };
  vertices.sort((left, right) => compareCodeUnits(left.id, right.id));
  edges.sort((left, right) => compareCodeUnits(left.id, right.id));
  return { ok: true, vertices, edges };
}

function checkPlanarity(
  edges: readonly ValidEdge[],
  verticesById: ReadonlyMap<string, PlanarGraphVertex>,
): MutableIssue[] {
  const issues: MutableIssue[] = [];
  for (let leftIndex = 0; leftIndex < edges.length; leftIndex += 1) {
    const left = edges[leftIndex];
    if (left === undefined) throw new TypeError('validated edge is missing');
    const leftStart = verticesById.get(left.vertices[0]);
    const leftEnd = verticesById.get(left.vertices[1]);
    if (leftStart === undefined || leftEnd === undefined)
      throw new TypeError('validated endpoint is missing');
    for (let rightIndex = leftIndex + 1; rightIndex < edges.length; rightIndex += 1) {
      const right = edges[rightIndex];
      if (right === undefined) throw new TypeError('validated edge is missing');
      const rightStart = verticesById.get(right.vertices[0]);
      const rightEnd = verticesById.get(right.vertices[1]);
      if (rightStart === undefined || rightEnd === undefined)
        throw new TypeError('validated endpoint is missing');
      const classification = classifySegmentIntersection(
        { start: leftStart, end: leftEnd },
        { start: rightStart, end: rightEnd },
        { fastFilterArea: 0 },
      );
      if (!classification.ok) throw new TypeError('validated finite segments must be classifiable');
      const relatedIds = [left.id, right.id].sort(compareCodeUnits);
      if (classification.value.kind === 'proper-crossing') {
        issues.push({
          path: '$.edges',
          code: 'proper-crossing',
          message: 'edges must be split at every proper crossing before face enumeration',
          relatedIds,
        });
      } else if (classification.value.kind === 'collinear-overlap') {
        issues.push({
          path: '$.edges',
          code: 'collinear-overlap',
          message: 'collinear edge interiors must not overlap',
          relatedIds,
        });
      } else if (classification.value.kind === 'touch') {
        const sharedIds = left.vertices.filter((id) => right.vertices.includes(id));
        const declaredEndpointTouch =
          sharedIds.length === 1 &&
          classification.value.onA !== 'interior' &&
          classification.value.onB !== 'interior';
        if (!declaredEndpointTouch) {
          issues.push({
            path: '$.edges',
            code: 't-junction',
            message: 'edge contacts must be represented by a shared endpoint vertex',
            relatedIds,
          });
        }
      }
    }
  }
  return issues;
}

function adjacencyByVertex(
  vertices: readonly PlanarGraphVertex[],
  edges: readonly ValidEdge[],
): Map<string, ValidEdge[]> {
  const adjacency = new Map(vertices.map((vertex) => [vertex.id, [] as ValidEdge[]]));
  for (const edge of edges) {
    for (const vertexId of edge.vertices) {
      const incident = adjacency.get(vertexId);
      if (incident === undefined) throw new TypeError('validated adjacency vertex is missing');
      incident.push(edge);
    }
  }
  for (const incident of adjacency.values()) {
    incident.sort((left, right) => compareCodeUnits(left.id, right.id));
  }
  return adjacency;
}

function reachableVertexIds(
  startId: string,
  adjacency: ReadonlyMap<string, readonly ValidEdge[]>,
  excludedEdgeId?: string,
): Set<string> {
  const reached = new Set<string>([startId]);
  const queue = [startId];
  for (const vertexId of queue) {
    for (const edge of adjacency.get(vertexId) ?? []) {
      if (edge.id === excludedEdgeId) continue;
      const nextId = edge.vertices[0] === vertexId ? edge.vertices[1] : edge.vertices[0];
      if (!reached.has(nextId)) {
        reached.add(nextId);
        queue.push(nextId);
      }
    }
  }
  return reached;
}

function checkConnectivityAndBridges(
  vertices: readonly PlanarGraphVertex[],
  edges: readonly ValidEdge[],
  adjacency: ReadonlyMap<string, readonly ValidEdge[]>,
): MutableIssue[] {
  if (vertices.length < 3 || edges.length < 3) {
    return [
      {
        path: '$',
        code: 'non-cellular-embedding',
        message: 'the first candidate slice requires at least one closed polygonal cell',
      },
    ];
  }
  const first = vertices[0];
  if (first === undefined) throw new TypeError('validated graph cannot be empty here');
  const reached = reachableVertexIds(first.id, adjacency);
  if (reached.size !== vertices.length) {
    return [
      {
        path: '$.edges',
        code: 'disconnected-graph',
        message: 'the first candidate slice accepts exactly one connected component',
      },
    ];
  }
  const bridgeIssues: MutableIssue[] = [];
  for (const edge of edges) {
    const withoutEdge = reachableVertexIds(edge.vertices[0], adjacency, edge.id);
    if (!withoutEdge.has(edge.vertices[1])) {
      bridgeIssues.push({
        path: '$.edges',
        code: 'bridge-edge',
        message: 'bridges and dangling trees are outside the first candidate slice',
        relatedIds: [edge.id],
      });
    }
  }
  return bridgeIssues;
}

/**
 * Classifies a vector into the two halves of an exact [0, 2π) polar order
 * in stored coordinates. Stored +y is down; that is intentional here.
 */
function angularHalf(center: PlanarGraphVertex, endpoint: PlanarGraphVertex): 0 | 1 {
  if (endpoint.y > center.y) return 0;
  if (endpoint.y < center.y) return 1;
  return endpoint.x > center.x ? 0 : 1;
}

function compareOutgoing(
  center: PlanarGraphVertex,
  left: HalfEdge,
  right: HalfEdge,
  verticesById: ReadonlyMap<string, PlanarGraphVertex>,
): number {
  const leftEndpoint = verticesById.get(left.toId);
  const rightEndpoint = verticesById.get(right.toId);
  if (leftEndpoint === undefined || rightEndpoint === undefined)
    throw new TypeError('half-edge endpoint is missing');
  const leftHalf = angularHalf(center, leftEndpoint);
  const rightHalf = angularHalf(center, rightEndpoint);
  if (leftHalf !== rightHalf) return leftHalf - rightHalf;
  const orientation = exactOrientationSign(center, leftEndpoint, rightEndpoint);
  if (orientation !== 0) return orientation > 0 ? -1 : 1;
  return compareCodeUnits(left.edgeId, right.edgeId);
}

function rotate<T>(values: readonly T[], offset: number): T[] {
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function canonicalizeBoundary(boundary: RawBoundary): RawBoundary {
  let minimumIndex = 0;
  for (let index = 1; index < boundary.vertexIds.length; index += 1) {
    const candidate = boundary.vertexIds[index];
    const minimum = boundary.vertexIds[minimumIndex];
    if (candidate === undefined || minimum === undefined)
      throw new TypeError('boundary vertex is missing');
    if (compareCodeUnits(candidate, minimum) < 0) minimumIndex = index;
  }
  return {
    vertexIds: rotate(boundary.vertexIds, minimumIndex),
    edgeIds: rotate(boundary.edgeIds, minimumIndex),
    areaSign: boundary.areaSign,
  };
}

function compareSequences(left: readonly string[], right: readonly string[]): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftEntry = left[index];
    const rightEntry = right[index];
    if (leftEntry === undefined || rightEntry === undefined)
      throw new TypeError('sequence entry is missing');
    const comparison = compareCodeUnits(leftEntry, rightEntry);
    if (comparison !== 0) return comparison;
  }
  return left.length - right.length;
}

function enumerateBoundaries(
  vertices: readonly PlanarGraphVertex[],
  edges: readonly ValidEdge[],
  verticesById: ReadonlyMap<string, PlanarGraphVertex>,
):
  | Readonly<{ ok: true; boundaries: readonly RawBoundary[] }>
  | Readonly<{ ok: false; issues: MutableIssue[] }> {
  const outgoing = new Map(vertices.map((vertex) => [vertex.id, [] as HalfEdge[]]));
  const halfEdges: HalfEdge[] = [];
  for (const edge of edges) {
    const [left, right] = edge.vertices;
    const forward: HalfEdge = {
      key: halfEdgeKey(edge.id, left, right),
      edgeId: edge.id,
      fromId: left,
      toId: right,
    };
    const reverse: HalfEdge = {
      key: halfEdgeKey(edge.id, right, left),
      edgeId: edge.id,
      fromId: right,
      toId: left,
    };
    outgoing.get(left)?.push(forward);
    outgoing.get(right)?.push(reverse);
    halfEdges.push(forward, reverse);
  }
  for (const [vertexId, incident] of outgoing) {
    const center = verticesById.get(vertexId);
    if (center === undefined) throw new TypeError('outgoing center is missing');
    incident.sort((left, right) => compareOutgoing(center, left, right, verticesById));
  }
  halfEdges.sort((left, right) => compareCodeUnits(left.key, right.key));

  const nextByKey = new Map<string, HalfEdge>();
  for (const current of halfEdges) {
    const atDestination = outgoing.get(current.toId);
    if (atDestination === undefined || atDestination.length === 0)
      throw new TypeError('destination incidence is missing');
    const twinKey = halfEdgeKey(current.edgeId, current.toId, current.fromId);
    const twinIndex = atDestination.findIndex((candidate) => candidate.key === twinKey);
    if (twinIndex < 0) throw new TypeError('half-edge twin is missing');
    const next = atDestination[(twinIndex + 1) % atDestination.length];
    if (next === undefined) throw new TypeError('next half-edge is missing');
    nextByKey.set(current.key, next);
  }

  const visited = new Set<string>();
  const boundaries: RawBoundary[] = [];
  for (const start of halfEdges) {
    if (visited.has(start.key)) continue;
    const localKeys = new Set<string>();
    const vertexIds: string[] = [];
    const edgeIds: string[] = [];
    let current = start;
    while (!localKeys.has(current.key)) {
      if (visited.has(current.key)) {
        return {
          ok: false,
          issues: [
            {
              path: '$.edges',
              code: 'non-cellular-embedding',
              message: 'half-edge walk merged into an already visited boundary',
            },
          ],
        };
      }
      localKeys.add(current.key);
      visited.add(current.key);
      vertexIds.push(current.fromId);
      edgeIds.push(current.edgeId);
      const next = nextByKey.get(current.key);
      if (next === undefined) throw new TypeError('half-edge successor is missing');
      current = next;
    }
    if (
      current.key !== start.key ||
      vertexIds.length < 3 ||
      new Set(vertexIds).size !== vertexIds.length
    ) {
      return {
        ok: false,
        issues: [
          {
            path: '$.edges',
            code: 'non-cellular-embedding',
            message: 'every boundary must be one simple cycle in the first candidate slice',
            relatedIds: [...new Set(edgeIds)].sort(compareCodeUnits),
          },
        ],
      };
    }
    const points = vertexIds.map((id) => {
      const point = verticesById.get(id);
      if (point === undefined) throw new TypeError('boundary point is missing');
      return point;
    });
    const areaSign = exactPolygonAreaSign(points);
    if (areaSign === 0) {
      return {
        ok: false,
        issues: [
          {
            path: '$.edges',
            code: 'degenerate-face',
            message: 'half-edge boundary has exactly zero signed area',
            relatedIds: [...edgeIds].sort(compareCodeUnits),
          },
        ],
      };
    }
    boundaries.push(canonicalizeBoundary({ vertexIds, edgeIds, areaSign }));
  }
  if (visited.size !== edges.length * 2) throw new TypeError('not every half-edge was visited');
  boundaries.sort((left, right) => compareSequences(left.vertexIds, right.vertexIds));
  return { ok: true, boundaries };
}

/**
 * Enumerates faces of one already-noded, connected planar straight-line graph.
 * This M0F candidate deliberately rejects components, holes, bridges, overlaps,
 * crossings, T-junctions, and non-simple boundary walks instead of guessing.
 */
export function enumeratePlanarFaces(input: PlanarGraphInput): PlanarFaceResult {
  const captured = tryCreateValidationSnapshot<unknown>(input);
  if (!captured.ok) {
    return invalid([
      {
        path: '$',
        code: 'invalid-input',
        message: `input is ${captured.reason}; a plain cloneable data object is required`,
      },
    ]);
  }
  const validated = validateInput(captured.value);
  if (!validated.ok) return invalid(validated.issues);
  const { vertices, edges } = validated;
  const verticesById = new Map(vertices.map((vertex) => [vertex.id, vertex]));

  const planarityIssues = checkPlanarity(edges, verticesById);
  if (planarityIssues.length > 0) return invalid(planarityIssues);
  const adjacency = adjacencyByVertex(vertices, edges);
  const topologyIssues = checkConnectivityAndBridges(vertices, edges, adjacency);
  if (topologyIssues.length > 0) return invalid(topologyIssues);

  const enumerated = enumerateBoundaries(vertices, edges, verticesById);
  if (!enumerated.ok) return invalid(enumerated.issues);
  const exterior = enumerated.boundaries.filter((boundary) => boundary.areaSign === 1);
  const bounded = enumerated.boundaries.filter((boundary) => boundary.areaSign === -1);
  if (exterior.length !== 1 || bounded.length === 0) {
    return invalid([
      {
        path: '$.edges',
        code: 'invalid-face-orientation',
        message:
          'expected exactly one positive-area exterior boundary and one or more negative-area bounded faces',
      },
    ]);
  }
  const eulerValue = vertices.length - edges.length + bounded.length;
  if (eulerValue !== 1) {
    return invalid([
      {
        path: '$.edges',
        code: 'euler-mismatch',
        message: `connected planar disk requires V - E + boundedFaces = 1; received ${eulerValue}`,
      },
    ]);
  }

  const exteriorBoundary: PlanarFaceBoundary = {
    id: 'candidate-exterior',
    vertexIds: exterior[0]?.vertexIds ?? [],
    edgeIds: exterior[0]?.edgeIds ?? [],
    areaSign: 1,
  };
  const boundedFaces: PlanarFaceBoundary[] = bounded.map((boundary, index) => ({
    id: `candidate-face:${String(index + 1).padStart(6, '0')}`,
    vertexIds: boundary.vertexIds,
    edgeIds: boundary.edgeIds,
    areaSign: -1,
  }));
  return deepFreezeOwned({
    ok: true as const,
    value: {
      claimStatus: 'candidate-only' as const,
      exteriorBoundary,
      boundedFaces,
      topology: {
        vertexCount: vertices.length,
        edgeCount: edges.length,
        boundedFaceCount: boundedFaces.length,
        eulerValue: 1 as const,
      },
    },
  });
}
