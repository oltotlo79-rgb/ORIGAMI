import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  addExactRational,
  compareExactRational,
  exactRational,
  exactRationalOrientationSign,
  exactRationalPointKey,
  multiplyExactRational,
  signExactRational,
  subtractExactRational,
  type ExactRational,
  type ExactRationalPoint2,
} from '../model/exact-rational.js';
import { classifyExactSegmentIntersection } from './planarize-segments.js';

export type RationalPlanarGraphVertex = Readonly<{
  id: string;
  point: ExactRationalPoint2;
}>;

export type RationalPlanarGraphEdge = Readonly<{
  id: string;
  startVertexId: string;
  endVertexId: string;
  sourceEdgeIds?: readonly string[];
}>;

/** Structurally accepts `CandidatePlanarization` without an adapter or rounding. */
export type RationalPlanarGraphInput = Readonly<{
  vertices: readonly RationalPlanarGraphVertex[];
  edges: readonly RationalPlanarGraphEdge[];
  contractStatus?: 'candidate';
  implementationRole?: 'reference';
  scientificClaim?: false;
}>;

export type RationalPlanarFaceIssueCode =
  | 'invalid-input'
  | 'unknown-field'
  | 'invalid-array'
  | 'invalid-rational'
  | 'non-normalized-rational'
  | 'invalid-id'
  | 'duplicate-id'
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

export type RationalPlanarFaceIssue = Readonly<{
  path: string;
  code: RationalPlanarFaceIssueCode;
  message: string;
  relatedIds?: readonly string[];
}>;

export type RationalPlanarFaceBoundary = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  /** Exact sign of twice the area in stored, y-down paper coordinates. */
  areaSign: -1 | 1;
}>;

export type RationalPlanarFaceEnumeration = Readonly<{
  claimStatus: 'candidate-only';
  exactCoordinateDomain: 'normalized-bigint-rational';
  exteriorBoundary: RationalPlanarFaceBoundary;
  boundedFaces: readonly RationalPlanarFaceBoundary[];
  topology: Readonly<{
    vertexCount: number;
    edgeCount: number;
    boundedFaceCount: number;
    eulerValue: 1;
  }>;
}>;

export type RationalPlanarFaceResult =
  | Readonly<{ ok: true; value: RationalPlanarFaceEnumeration }>
  | Readonly<{ ok: false; error: readonly RationalPlanarFaceIssue[] }>;

interface MutableIssue {
  path: string;
  code: RationalPlanarFaceIssueCode;
  message: string;
  relatedIds?: string[];
}

type ValidVertex = Readonly<{ id: string; point: ExactRationalPoint2 }>;
type ValidEdge = Readonly<{
  id: string;
  startVertexId: string;
  endVertexId: string;
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

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const TOP_LEVEL_KEYS = [
  'contractStatus',
  'edges',
  'implementationRole',
  'scientificClaim',
  'vertices',
] as const;
const VERTEX_KEYS = ['id', 'point'] as const;
const POINT_KEYS = ['x', 'y'] as const;
const RATIONAL_KEYS = ['denominator', 'numerator'] as const;
const EDGE_KEYS = ['endVertexId', 'id', 'sourceEdgeIds', 'startVertexId'] as const;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainBigIntData(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return true;
  }
  if (typeof value !== 'object') return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
        return false;
      }
      return value.every((entry) => isPlainBigIntData(entry, ancestors));
    }
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    return Object.values(value).every((entry) => isPlainBigIntData(entry, ancestors));
  } finally {
    ancestors.delete(value);
  }
}

function captureInput(
  value: unknown,
):
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; reason: 'uncloneable' | 'non-plain-data' }> {
  let captured: unknown;
  try {
    captured = structuredClone(value);
  } catch {
    return { ok: false, reason: 'uncloneable' };
  }
  return isPlainBigIntData(captured, new WeakSet<object>())
    ? { ok: true, value: captured }
    : { ok: false, reason: 'non-plain-data' };
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: MutableIssue[],
): void {
  for (const key of Object.keys(value).sort(compareCodeUnits)) {
    if (!allowed.includes(key)) {
      issues.push({
        path: `${path}.${key}`,
        code: 'unknown-field',
        message: 'field is not part of the exact planar-graph input',
      });
    }
  }
}

function parseRational(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ExactRational | undefined {
  if (!isRecord(value)) {
    issues.push({
      path,
      code: 'invalid-rational',
      message: 'must be a normalized BigInt rational object',
    });
    return undefined;
  }
  rejectUnknownFields(value, RATIONAL_KEYS, path, issues);
  const { numerator, denominator } = value;
  if (typeof numerator !== 'bigint') {
    issues.push({
      path: `${path}.numerator`,
      code: 'invalid-rational',
      message: 'must be a BigInt',
    });
  }
  if (typeof denominator !== 'bigint' || denominator <= 0n) {
    issues.push({
      path: `${path}.denominator`,
      code: 'invalid-rational',
      message: 'must be a positive nonzero BigInt',
    });
  }
  if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint' || denominator <= 0n) {
    return undefined;
  }
  const normalized = exactRational(numerator, denominator);
  if (normalized.numerator !== numerator || normalized.denominator !== denominator) {
    issues.push({
      path,
      code: 'non-normalized-rational',
      message: 'numerator and denominator must be reduced with a positive denominator',
    });
    return undefined;
  }
  return normalized;
}

function parsePoint(
  value: unknown,
  path: string,
  issues: MutableIssue[],
): ExactRationalPoint2 | undefined {
  if (!isRecord(value)) {
    issues.push({
      path,
      code: 'invalid-rational',
      message: 'must be an exact rational point object',
    });
    return undefined;
  }
  rejectUnknownFields(value, POINT_KEYS, path, issues);
  const x = parseRational(value.x, `${path}.x`, issues);
  const y = parseRational(value.y, `${path}.y`, issues);
  return x === undefined || y === undefined ? undefined : { x, y };
}

function invalid(issues: MutableIssue[]): RationalPlanarFaceResult {
  return deepFreezeOwned({ ok: false as const, error: issues });
}

function validateMetadata(value: Record<string, unknown>, issues: MutableIssue[]): void {
  if ('contractStatus' in value && value.contractStatus !== 'candidate') {
    issues.push({
      path: '$.contractStatus',
      code: 'invalid-input',
      message: 'when supplied, contractStatus must be candidate',
    });
  }
  if ('implementationRole' in value && value.implementationRole !== 'reference') {
    issues.push({
      path: '$.implementationRole',
      code: 'invalid-input',
      message: 'when supplied, implementationRole must be reference',
    });
  }
  if ('scientificClaim' in value && value.scientificClaim !== false) {
    issues.push({
      path: '$.scientificClaim',
      code: 'invalid-input',
      message: 'candidate planarization must declare scientificClaim false',
    });
  }
}

function validateInput(
  snapshot: unknown,
):
  | Readonly<{ ok: true; vertices: readonly ValidVertex[]; edges: readonly ValidEdge[] }>
  | Readonly<{ ok: false; issues: MutableIssue[] }> {
  const issues: MutableIssue[] = [];
  if (!isRecord(snapshot)) {
    return {
      ok: false,
      issues: [{ path: '$', code: 'invalid-input', message: 'must be a plain input object' }],
    };
  }
  rejectUnknownFields(snapshot, TOP_LEVEL_KEYS, '$', issues);
  validateMetadata(snapshot, issues);
  const rawVertices = snapshot.vertices;
  const rawEdges = snapshot.edges;
  if (!Array.isArray(rawVertices)) {
    issues.push({ path: '$.vertices', code: 'invalid-array', message: 'must be an array' });
  }
  if (!Array.isArray(rawEdges)) {
    issues.push({ path: '$.edges', code: 'invalid-array', message: 'must be an array' });
  }
  if (!Array.isArray(rawVertices) || !Array.isArray(rawEdges)) return { ok: false, issues };

  const vertices: ValidVertex[] = [];
  const vertexIds = new Set<string>();
  const coordinateOwners = new Map<string, string>();
  rawVertices.forEach((rawEntry: unknown, index: number) => {
    const path = `$.vertices[${index}]`;
    if (!isRecord(rawEntry)) {
      issues.push({ path, code: 'invalid-input', message: 'must be a vertex object' });
      return;
    }
    rejectUnknownFields(rawEntry, VERTEX_KEYS, path, issues);
    const id = rawEntry.id;
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
    const point = parsePoint(rawEntry.point, `${path}.point`, issues);
    if (!idValid || typeof id !== 'string' || point === undefined) return;
    const key = exactRationalPointKey(point);
    const priorId = coordinateOwners.get(key);
    if (priorId !== undefined) {
      issues.push({
        path: `${path}.point`,
        code: 'duplicate-coordinate',
        message: `vertices ${priorId} and ${id} have identical exact coordinates`,
        relatedIds: [priorId, id].sort(compareCodeUnits),
      });
    } else {
      coordinateOwners.set(key, id);
    }
    vertices.push({ id, point });
  });

  const edges: ValidEdge[] = [];
  const edgeIds = new Set<string>();
  const geometricOwners = new Map<string, string>();
  rawEdges.forEach((rawEntry: unknown, index: number) => {
    const path = `$.edges[${index}]`;
    if (!isRecord(rawEntry)) {
      issues.push({ path, code: 'invalid-input', message: 'must be an edge object' });
      return;
    }
    rejectUnknownFields(rawEntry, EDGE_KEYS, path, issues);
    const { id, startVertexId, endVertexId, sourceEdgeIds } = rawEntry;
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
    const startValid = typeof startVertexId === 'string' && ID_PATTERN.test(startVertexId);
    const endValid = typeof endVertexId === 'string' && ID_PATTERN.test(endVertexId);
    if (!startValid) {
      issues.push({
        path: `${path}.startVertexId`,
        code: 'invalid-id',
        message: 'must be a stable vertex ID',
      });
    }
    if (!endValid) {
      issues.push({
        path: `${path}.endVertexId`,
        code: 'invalid-id',
        message: 'must be a stable vertex ID',
      });
    }
    if (sourceEdgeIds !== undefined) {
      if (!Array.isArray(sourceEdgeIds)) {
        issues.push({
          path: `${path}.sourceEdgeIds`,
          code: 'invalid-array',
          message: 'must be an array of stable source IDs',
        });
      } else {
        const seenSources = new Set<string>();
        (sourceEdgeIds as readonly unknown[]).forEach((sourceId, sourceIndex) => {
          if (typeof sourceId !== 'string' || !ID_PATTERN.test(sourceId)) {
            issues.push({
              path: `${path}.sourceEdgeIds[${sourceIndex}]`,
              code: 'invalid-id',
              message: 'must be a stable source edge ID',
            });
          } else if (seenSources.has(sourceId)) {
            issues.push({
              path: `${path}.sourceEdgeIds[${sourceIndex}]`,
              code: 'duplicate-id',
              message: `source edge ID ${sourceId} is duplicated`,
              relatedIds: [sourceId],
            });
          } else {
            seenSources.add(sourceId);
          }
        });
      }
    }
    if (
      !idValid ||
      typeof id !== 'string' ||
      !startValid ||
      !endValid ||
      typeof startVertexId !== 'string' ||
      typeof endVertexId !== 'string'
    ) {
      return;
    }
    if (!vertexIds.has(startVertexId)) {
      issues.push({
        path: `${path}.startVertexId`,
        code: 'missing-vertex',
        message: `vertex ${startVertexId} is not declared`,
        relatedIds: [startVertexId],
      });
    }
    if (!vertexIds.has(endVertexId)) {
      issues.push({
        path: `${path}.endVertexId`,
        code: 'missing-vertex',
        message: `vertex ${endVertexId} is not declared`,
        relatedIds: [endVertexId],
      });
    }
    if (startVertexId === endVertexId) {
      issues.push({
        path,
        code: 'zero-length-edge',
        message: 'edge endpoints must be distinct',
        relatedIds: [id],
      });
    }
    const ordered =
      compareCodeUnits(startVertexId, endVertexId) <= 0
        ? ([startVertexId, endVertexId] as const)
        : ([endVertexId, startVertexId] as const);
    const pairKey = `${ordered[0]}\u0000${ordered[1]}`;
    const priorId = geometricOwners.get(pairKey);
    if (priorId !== undefined) {
      issues.push({
        path,
        code: 'duplicate-edge',
        message: `edges ${priorId} and ${id} have the same endpoints`,
        relatedIds: [priorId, id].sort(compareCodeUnits),
      });
    } else {
      geometricOwners.set(pairKey, id);
    }
    if (
      vertexIds.has(startVertexId) &&
      vertexIds.has(endVertexId) &&
      startVertexId !== endVertexId
    ) {
      edges.push({ id, startVertexId: ordered[0], endVertexId: ordered[1] });
    }
  });

  if (issues.length > 0) return { ok: false, issues };
  vertices.sort((left, right) => compareCodeUnits(left.id, right.id));
  edges.sort((left, right) => compareCodeUnits(left.id, right.id));
  return { ok: true, vertices, edges };
}

function checkExactPlanarity(
  edges: readonly ValidEdge[],
  verticesById: ReadonlyMap<string, ValidVertex>,
): MutableIssue[] {
  const issues: MutableIssue[] = [];
  for (let leftIndex = 0; leftIndex < edges.length; leftIndex += 1) {
    const left = edges[leftIndex];
    if (left === undefined) throw new TypeError('validated edge is missing');
    const leftStart = verticesById.get(left.startVertexId);
    const leftEnd = verticesById.get(left.endVertexId);
    if (leftStart === undefined || leftEnd === undefined)
      throw new TypeError('validated endpoint is missing');
    for (let rightIndex = leftIndex + 1; rightIndex < edges.length; rightIndex += 1) {
      const right = edges[rightIndex];
      if (right === undefined) throw new TypeError('validated edge is missing');
      const rightStart = verticesById.get(right.startVertexId);
      const rightEnd = verticesById.get(right.endVertexId);
      if (rightStart === undefined || rightEnd === undefined)
        throw new TypeError('validated endpoint is missing');
      const intersection = classifyExactSegmentIntersection(
        { start: leftStart.point, end: leftEnd.point },
        { start: rightStart.point, end: rightEnd.point },
      );
      const relatedIds = [left.id, right.id].sort(compareCodeUnits);
      if (intersection.kind === 'proper-crossing') {
        issues.push({
          path: '$.edges',
          code: 'proper-crossing',
          message: 'edges must be split at every exact proper crossing',
          relatedIds,
        });
      } else if (intersection.kind === 't-junction') {
        issues.push({
          path: '$.edges',
          code: 't-junction',
          message: 'exact T-junctions must be represented by split edges and one shared vertex',
          relatedIds,
        });
      } else if (intersection.kind === 'collinear-overlap') {
        issues.push({
          path: '$.edges',
          code: 'collinear-overlap',
          message: 'collinear edge interiors must not overlap',
          relatedIds,
        });
      } else if (intersection.kind === 'endpoint-touch') {
        const shared = [left.startVertexId, left.endVertexId].filter(
          (id) => id === right.startVertexId || id === right.endVertexId,
        );
        if (shared.length !== 1) {
          issues.push({
            path: '$.edges',
            code: 't-junction',
            message: 'geometric endpoint contacts must use one shared stable vertex ID',
            relatedIds,
          });
        }
      }
    }
  }
  return issues;
}

function adjacencyByVertex(
  vertices: readonly ValidVertex[],
  edges: readonly ValidEdge[],
): Map<string, ValidEdge[]> {
  const adjacency = new Map(vertices.map((vertex) => [vertex.id, [] as ValidEdge[]]));
  for (const edge of edges) {
    adjacency.get(edge.startVertexId)?.push(edge);
    adjacency.get(edge.endVertexId)?.push(edge);
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
  const reached = new Set([startId]);
  const queue = [startId];
  for (const vertexId of queue) {
    for (const edge of adjacency.get(vertexId) ?? []) {
      if (edge.id === excludedEdgeId) continue;
      const nextId = edge.startVertexId === vertexId ? edge.endVertexId : edge.startVertexId;
      if (!reached.has(nextId)) {
        reached.add(nextId);
        queue.push(nextId);
      }
    }
  }
  return reached;
}

function checkTopology(
  vertices: readonly ValidVertex[],
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
  if (reachableVertexIds(first.id, adjacency).size !== vertices.length) {
    return [
      {
        path: '$.edges',
        code: 'disconnected-graph',
        message: 'the first candidate slice accepts exactly one connected component',
      },
    ];
  }
  const issues: MutableIssue[] = [];
  for (const edge of edges) {
    const reached = reachableVertexIds(edge.startVertexId, adjacency, edge.id);
    if (!reached.has(edge.endVertexId)) {
      issues.push({
        path: '$.edges',
        code: 'bridge-edge',
        message: 'bridges and dangling trees are outside the first candidate slice',
        relatedIds: [edge.id],
      });
    }
  }
  return issues;
}

function halfEdgeKey(edgeId: string, fromId: string, toId: string): string {
  return `${edgeId}\u0000${fromId}\u0000${toId}`;
}

function angularHalf(center: ValidVertex, endpoint: ValidVertex): 0 | 1 {
  const ySign = compareExactRational(endpoint.point.y, center.point.y);
  if (ySign > 0) return 0;
  if (ySign < 0) return 1;
  return compareExactRational(endpoint.point.x, center.point.x) > 0 ? 0 : 1;
}

function compareOutgoing(
  center: ValidVertex,
  left: HalfEdge,
  right: HalfEdge,
  verticesById: ReadonlyMap<string, ValidVertex>,
): number {
  const leftEndpoint = verticesById.get(left.toId);
  const rightEndpoint = verticesById.get(right.toId);
  if (leftEndpoint === undefined || rightEndpoint === undefined)
    throw new TypeError('half-edge endpoint is missing');
  const halfDifference = angularHalf(center, leftEndpoint) - angularHalf(center, rightEndpoint);
  if (halfDifference !== 0) return halfDifference;
  const orientation = exactRationalOrientationSign(
    center.point,
    leftEndpoint.point,
    rightEndpoint.point,
  );
  return orientation === 0 ? compareCodeUnits(left.edgeId, right.edgeId) : orientation > 0 ? -1 : 1;
}

function exactPolygonAreaSign(points: readonly ExactRationalPoint2[]): -1 | 0 | 1 {
  let sum = exactRational(0n);
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (current === undefined || next === undefined)
      throw new TypeError('polygon point is missing');
    const cross = subtractExactRational(
      multiplyExactRational(current.x, next.y),
      multiplyExactRational(current.y, next.x),
    );
    sum = addExactRational(sum, cross);
  }
  return signExactRational(sum);
}

function rotate<T>(values: readonly T[], offset: number): T[] {
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function canonicalizeBoundary(boundary: RawBoundary): RawBoundary {
  let minimumIndex = 0;
  for (let index = 1; index < boundary.vertexIds.length; index += 1) {
    const current = boundary.vertexIds[index];
    const minimum = boundary.vertexIds[minimumIndex];
    if (current === undefined || minimum === undefined)
      throw new TypeError('boundary vertex is missing');
    if (compareCodeUnits(current, minimum) < 0) minimumIndex = index;
  }
  return {
    vertexIds: rotate(boundary.vertexIds, minimumIndex),
    edgeIds: rotate(boundary.edgeIds, minimumIndex),
    areaSign: boundary.areaSign,
  };
}

function compareSequences(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
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
  vertices: readonly ValidVertex[],
  edges: readonly ValidEdge[],
  verticesById: ReadonlyMap<string, ValidVertex>,
):
  | Readonly<{ ok: true; boundaries: readonly RawBoundary[] }>
  | Readonly<{ ok: false; issues: MutableIssue[] }> {
  const outgoing = new Map(vertices.map((vertex) => [vertex.id, [] as HalfEdge[]]));
  const halfEdges: HalfEdge[] = [];
  for (const edge of edges) {
    const forward: HalfEdge = {
      key: halfEdgeKey(edge.id, edge.startVertexId, edge.endVertexId),
      edgeId: edge.id,
      fromId: edge.startVertexId,
      toId: edge.endVertexId,
    };
    const reverse: HalfEdge = {
      key: halfEdgeKey(edge.id, edge.endVertexId, edge.startVertexId),
      edgeId: edge.id,
      fromId: edge.endVertexId,
      toId: edge.startVertexId,
    };
    outgoing.get(forward.fromId)?.push(forward);
    outgoing.get(reverse.fromId)?.push(reverse);
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
    const incident = outgoing.get(current.toId);
    if (incident === undefined || incident.length === 0)
      throw new TypeError('destination incidence is missing');
    const twinKey = halfEdgeKey(current.edgeId, current.toId, current.fromId);
    const twinIndex = incident.findIndex((candidate) => candidate.key === twinKey);
    if (twinIndex < 0) throw new TypeError('half-edge twin is missing');
    const next = incident[(twinIndex + 1) % incident.length];
    if (next === undefined) throw new TypeError('half-edge successor is missing');
    nextByKey.set(current.key, next);
  }

  const visited = new Set<string>();
  const boundaries: RawBoundary[] = [];
  for (const start of halfEdges) {
    if (visited.has(start.key)) continue;
    const local = new Set<string>();
    const vertexIds: string[] = [];
    const edgeIds: string[] = [];
    let current = start;
    while (!local.has(current.key)) {
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
      local.add(current.key);
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
    const points = vertexIds.map((vertexId) => {
      const vertex = verticesById.get(vertexId);
      if (vertex === undefined) throw new TypeError('boundary vertex is missing');
      return vertex.point;
    });
    const areaSign = exactPolygonAreaSign(points);
    if (areaSign === 0) {
      return {
        ok: false,
        issues: [
          {
            path: '$.edges',
            code: 'degenerate-face',
            message: 'half-edge boundary has exactly zero rational signed area',
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
 * Exact face enumeration for the output of `planarizeDyadicSegments`. Every
 * topological decision stays in the normalized BigInt-rational domain.
 */
export function enumerateRationalPlanarFaces(
  input: RationalPlanarGraphInput,
): RationalPlanarFaceResult {
  const captured = captureInput(input);
  if (!captured.ok) {
    return invalid([
      {
        path: '$',
        code: 'invalid-input',
        message: `input is ${captured.reason}; plain cloneable BigInt data is required`,
      },
    ]);
  }
  const validated = validateInput(captured.value);
  if (!validated.ok) return invalid(validated.issues);
  const { vertices, edges } = validated;
  const verticesById = new Map(vertices.map((vertex) => [vertex.id, vertex]));
  const planarityIssues = checkExactPlanarity(edges, verticesById);
  if (planarityIssues.length > 0) return invalid(planarityIssues);
  const adjacency = adjacencyByVertex(vertices, edges);
  const topologyIssues = checkTopology(vertices, edges, adjacency);
  if (topologyIssues.length > 0) return invalid(topologyIssues);
  const enumerated = enumerateBoundaries(vertices, edges, verticesById);
  if (!enumerated.ok) return invalid(enumerated.issues);

  const exteriors = enumerated.boundaries.filter((boundary) => boundary.areaSign === 1);
  const bounded = enumerated.boundaries.filter((boundary) => boundary.areaSign === -1);
  if (exteriors.length !== 1 || bounded.length === 0) {
    return invalid([
      {
        path: '$.edges',
        code: 'invalid-face-orientation',
        message: 'expected exactly one positive exterior and one or more negative bounded faces',
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
  const exterior = exteriors[0];
  if (exterior === undefined) throw new TypeError('validated exterior boundary is missing');
  const boundedFaces: RationalPlanarFaceBoundary[] = bounded.map((boundary, index) => ({
    id: `candidate-face:${String(index + 1).padStart(6, '0')}`,
    vertexIds: boundary.vertexIds,
    edgeIds: boundary.edgeIds,
    areaSign: -1,
  }));
  return deepFreezeOwned({
    ok: true as const,
    value: {
      claimStatus: 'candidate-only' as const,
      exactCoordinateDomain: 'normalized-bigint-rational' as const,
      exteriorBoundary: {
        id: 'candidate-exterior',
        vertexIds: exterior.vertexIds,
        edgeIds: exterior.edgeIds,
        areaSign: 1 as const,
      },
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
