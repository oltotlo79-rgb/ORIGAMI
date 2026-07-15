import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  parseFaceComplexAuditInputV1,
  type FaceComplexAuditAssignment,
  type FaceComplexAuditEdgeV1,
  type FaceComplexAuditFaceV1,
  type FaceComplexAuditInputV1,
  type FaceComplexAuditVertexV1,
} from './face-complex-contract.js';
import {
  addProjectiveRationalComponents,
  canonicalProjectivePoint,
  canonicalProjectiveRationalComponent,
  classifyProjectiveSegmentIntersection,
  compareProjectiveDirections,
  compareProjectivePointCoordinate,
  compareProjectivePoints,
  equalProjectivePoints,
  equalProjectiveRationalComponents,
  projectiveOrientationSign,
  projectivePointFromCanonicalDecimalRationalJson,
  projectivePointFromFiniteBinary64,
  projectivePointKey,
  projectivePolygonTwiceSignedArea,
  projectiveTriangleTwiceSignedArea,
  signProjectiveRationalComponent,
  type ProjectivePoint2,
  type ProjectiveRationalComponent,
  type ProjectiveSegment2,
} from './projective-rational.js';

export const FACE_COMPLEX_AUDIT_RESULT_RECORD_TYPE = 'm0f-face-complex-audit-result' as const;

export type FaceComplexAuditStageV1 =
  | 'audit-contract'
  | 'source'
  | 'artifact'
  | 'planarization'
  | 'face-enumeration'
  | 'triangulation'
  | 'topology'
  | 'audit-internal';

export type FaceComplexAuditIssueCodeV1 =
  | 'input-contract-rejected'
  | 'duplicate-source-coordinate'
  | 'source-edge-reference-invalid'
  | 'source-edge-degenerate'
  | 'source-edge-overlap'
  | 'duplicate-artifact-vertex-id'
  | 'duplicate-artifact-coordinate'
  | 'artifact-coordinate-missing'
  | 'artifact-coordinate-surplus'
  | 'source-vertex-mapping-invalid'
  | 'source-vertex-mapping-missing'
  | 'duplicate-artifact-edge-id'
  | 'artifact-edge-reference-invalid'
  | 'artifact-edge-degenerate'
  | 'duplicate-artifact-edge'
  | 'artifact-edge-missing'
  | 'artifact-edge-surplus'
  | 'artifact-edge-provenance-invalid'
  | 'artifact-edge-assignment-invalid'
  | 'artifact-edge-intersection'
  | 'artifact-graph-disconnected'
  | 'angular-order-ambiguous'
  | 'dart-traversal-invalid'
  | 'face-cycle-invalid'
  | 'exterior-cycle-invalid'
  | 'boundary-reference-invalid'
  | 'boundary-edge-alignment-invalid'
  | 'assignment-incidence-invalid'
  | 'face-id-duplicate'
  | 'triangle-id-duplicate'
  | 'triangle-reference-invalid'
  | 'triangle-semantic-ids-invalid'
  | 'triangle-count-invalid'
  | 'triangle-winding-invalid'
  | 'triangle-edge-incidence-invalid'
  | 'triangle-diagonal-invalid'
  | 'triangle-area-invalid'
  | 'topology-counter-invalid'
  | 'euler-invariant-invalid'
  | 'unexpected-audit-failure';

export type FaceComplexAuditIssueV1 = Readonly<{
  stage: FaceComplexAuditStageV1;
  path: string;
  code: FaceComplexAuditIssueCodeV1;
  message: string;
}>;

export type FaceComplexAuditConsistentV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof FACE_COMPLEX_AUDIT_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'face-complex-only';
  implementationRole: 'independent-auditor';
  verificationIndependence: 'separate-projective-kernel-not-full-reference-verifier';
  auditOutcome: 'consistent';
  topology: FaceComplexAuditComputedTopologyV1;
}>;

export type FaceComplexAuditComputedTopologyV1 = Readonly<{
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

export type FaceComplexAuditResultV1 =
  | Readonly<{ ok: true; value: FaceComplexAuditConsistentV1 }>
  | Readonly<{ ok: false; error: readonly FaceComplexAuditIssueV1[] }>;

type AuditFailure = Readonly<{ ok: false; error: readonly FaceComplexAuditIssueV1[] }>;

type SourceEdge = Readonly<{
  index: number;
  assignment: FaceComplexAuditAssignment;
  segment: ProjectiveSegment2;
}>;

type ArtifactVertex = Readonly<{
  index: number;
  value: FaceComplexAuditVertexV1;
  point: ProjectivePoint2;
  key: string;
}>;

type ArtifactEdge = Readonly<{
  index: number;
  value: FaceComplexAuditEdgeV1;
  first: number;
  second: number;
  geometryKey: string;
}>;

type ExpectedSubedge = Readonly<{
  firstKey: string;
  secondKey: string;
  sourceIndices: readonly number[];
}>;

type EnumeratedCycle = Readonly<{
  vertexIndices: readonly number[];
  edgeIndices: readonly number[];
  area: ProjectiveRationalComponent;
  canonicalPointCycle: string;
}>;

const MESSAGE = Object.freeze({
  contract: 'face-complex audit input contract rejected the bundle',
  duplicateSourceCoordinate: 'source vertex coordinates must be semantically unique',
  sourceEdgeReference: 'source edge endpoints must reference source vertices',
  sourceEdgeDegenerate: 'source edges must have two distinct exact endpoints',
  sourceOverlap: 'collinear overlapping source edges are outside this audit scope',
  duplicateVertexId: 'artifact vertex IDs must be unique',
  duplicateVertexCoordinate: 'artifact vertex coordinates must be semantically unique',
  missingCoordinate: 'an expected exact planar coordinate is missing from the artifact',
  surplusCoordinate: 'the artifact contains an exact coordinate not implied by the source',
  sourceMapping: 'artifact source-vertex mapping does not match exact source coordinates',
  sourceMappingMissing: 'every source vertex must have one mapped artifact vertex',
  duplicateEdgeId: 'artifact edge IDs must be unique',
  edgeReference: 'artifact edge endpoints must reference artifact vertices',
  edgeDegenerate: 'artifact edges must have distinct exact endpoints',
  duplicateEdge: 'artifact edge geometry must be unique',
  missingEdge: 'an expected consecutive source sub-edge is missing',
  surplusEdge: 'the artifact contains an edge not implied by the source partition',
  provenance: 'artifact edge provenance must exactly identify its supporting source edge',
  assignment: 'artifact edge assignment must match source provenance',
  edgeIntersection: 'artifact edges must be split at every exact intersection',
  disconnected: 'artifact planar graph must be connected',
  angularOrder: 'outgoing artifact darts must have distinct angular directions',
  dartTraversal: 'artifact darts must form simple closed face walks',
  faceCycle: 'candidate bounded-face cycles must equal independently enumerated cycles',
  exteriorCycle: 'candidate exterior cycle must equal the independently enumerated cycle',
  boundaryReference: 'candidate boundary IDs must reference unique artifact entities',
  boundaryAlignment: 'each boundary edge must align with its consecutive boundary vertices',
  incidence: 'edge assignment does not have the required bounded-face incidence',
  duplicateFaceId: 'candidate face IDs must be unique',
  duplicateTriangleId: 'candidate triangle IDs must be unique',
  triangleReference: 'triangle IDs must reference their parent face and artifact vertices',
  triangleSemantic: 'triangle semantic vertex IDs must equal its vertex-ID set',
  triangleCount: 'a simple n-vertex face must contain exactly n minus two triangles',
  triangleWinding: 'every triangle must be nondegenerate with negative exact signed area',
  triangleIncidence: 'triangle edges must cover boundary edges once and diagonals twice',
  triangleDiagonal: 'triangle diagonals must be internal and non-crossing',
  triangleArea: 'triangle exact areas must sum to the exact face area',
  topologyCounter: 'artifact topology counters must equal independently computed counts',
  euler: 'connected disk topology must satisfy V minus E plus bounded faces equals one',
  internal: 'face-complex audit failed closed because of an unexpected internal condition',
} as const);

function failure(
  stage: FaceComplexAuditStageV1,
  path: string,
  code: FaceComplexAuditIssueCodeV1,
  message: string,
): AuditFailure {
  return deepFreezeOwned({ ok: false as const, error: [{ stage, path, code, message }] });
}

function pointPairKey(first: string, second: string): string {
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function indexPairKey(first: number, second: number): string {
  return first < second ? `${first}:${second}` : `${second}:${first}`;
}

function isPowerOfTwo(value: bigint): boolean {
  return value > 0n && (value & (value - 1n)) === 0n;
}

function pointOnClosedSegment(point: ProjectivePoint2, segment: ProjectiveSegment2): boolean {
  if (projectiveOrientationSign(segment.start, segment.end, point) !== 0) return false;
  const xStart = compareProjectivePointCoordinate(point, segment.start, 'x');
  const xEnd = compareProjectivePointCoordinate(point, segment.end, 'x');
  const yStart = compareProjectivePointCoordinate(point, segment.start, 'y');
  const yEnd = compareProjectivePointCoordinate(point, segment.end, 'y');
  return xStart * xEnd <= 0 && yStart * yEnd <= 0;
}

function canonicalPointCycle(points: readonly ProjectivePoint2[]): string {
  let minimum = 0;
  for (let index = 1; index < points.length; index += 1) {
    const candidate = points[index];
    const current = points[minimum];
    if (
      candidate !== undefined &&
      current !== undefined &&
      compareProjectivePoints(candidate, current) < 0
    ) {
      minimum = index;
    }
  }
  const keys: string[] = [];
  for (let offset = 0; offset < points.length; offset += 1) {
    const point = points[(minimum + offset) % points.length];
    if (point === undefined) throw new TypeError('cycle point is missing');
    keys.push(projectivePointKey(point));
  }
  return keys.join('|');
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const expected = new Set(left);
  const actual = new Set(right);
  return (
    expected.size === left.length &&
    actual.size === right.length &&
    right.every((entry) => expected.has(entry))
  );
}

function exactMidpoint(first: ProjectivePoint2, second: ProjectivePoint2): ProjectivePoint2 {
  return canonicalProjectivePoint(
    first[0] * second[2] + second[0] * first[2],
    first[1] * second[2] + second[1] * first[2],
    2n * first[2] * second[2],
  );
}

function pointStrictlyInsidePolygon(
  point: ProjectivePoint2,
  polygon: readonly ProjectivePoint2[],
): boolean {
  let winding = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (start === undefined || end === undefined) return false;
    const segment = { start, end };
    if (pointOnClosedSegment(point, segment)) return false;
    const startY = compareProjectivePointCoordinate(start, point, 'y');
    const endY = compareProjectivePointCoordinate(end, point, 'y');
    const orientation = projectiveOrientationSign(start, end, point);
    if (startY <= 0 && endY > 0 && orientation > 0) winding += 1;
    if (startY > 0 && endY <= 0 && orientation < 0) winding -= 1;
  }
  return winding !== 0;
}

function validateSource(bundle: FaceComplexAuditInputV1):
  | Readonly<{
      sourcePoints: readonly ProjectivePoint2[];
      sourceEdges: readonly SourceEdge[];
      expectedPoints: ReadonlyMap<string, ProjectivePoint2>;
    }>
  | AuditFailure {
  const sourcePoints = bundle.source.verticesCoords.map(([x, y]) =>
    projectivePointFromFiniteBinary64(x, y),
  );
  const sourcePointIndexByKey = new Map<string, number>();
  for (let index = 0; index < sourcePoints.length; index += 1) {
    const point = sourcePoints[index];
    if (point === undefined) throw new TypeError('source point is missing');
    const key = projectivePointKey(point);
    if (sourcePointIndexByKey.has(key)) {
      return failure(
        'source',
        `$.source.verticesCoords[${index}]`,
        'duplicate-source-coordinate',
        MESSAGE.duplicateSourceCoordinate,
      );
    }
    sourcePointIndexByKey.set(key, index);
  }

  const sourceEdges: SourceEdge[] = [];
  for (let index = 0; index < bundle.source.edgesVertices.length; index += 1) {
    const pair = bundle.source.edgesVertices[index];
    const assignment = bundle.source.edgesAssignment[index];
    if (pair === undefined || assignment === undefined)
      throw new TypeError('source edge is missing');
    const start = sourcePoints[pair[0]];
    const end = sourcePoints[pair[1]];
    if (start === undefined || end === undefined) {
      return failure(
        'source',
        `$.source.edgesVertices[${index}]`,
        'source-edge-reference-invalid',
        MESSAGE.sourceEdgeReference,
      );
    }
    if (equalProjectivePoints(start, end)) {
      return failure(
        'source',
        `$.source.edgesVertices[${index}]`,
        'source-edge-degenerate',
        MESSAGE.sourceEdgeDegenerate,
      );
    }
    sourceEdges.push({ index, assignment, segment: { start, end } });
  }

  const expectedPoints = new Map<string, ProjectivePoint2>();
  for (const point of sourcePoints) expectedPoints.set(projectivePointKey(point), point);
  for (let firstIndex = 0; firstIndex < sourceEdges.length; firstIndex += 1) {
    const first = sourceEdges[firstIndex];
    if (first === undefined) throw new TypeError('source edge is missing');
    for (let secondIndex = firstIndex + 1; secondIndex < sourceEdges.length; secondIndex += 1) {
      const second = sourceEdges[secondIndex];
      if (second === undefined) throw new TypeError('source edge is missing');
      const intersection = classifyProjectiveSegmentIntersection(first.segment, second.segment);
      if (intersection.kind === 'collinear-overlap') {
        return failure(
          'source',
          `$.source.edgesVertices[${secondIndex}]`,
          'source-edge-overlap',
          MESSAGE.sourceOverlap,
        );
      }
      if (
        intersection.kind === 'proper-crossing' ||
        intersection.kind === 'endpoint-touch' ||
        intersection.kind === 't-junction'
      ) {
        expectedPoints.set(projectivePointKey(intersection.point), intersection.point);
      }
    }
  }
  return { sourcePoints, sourceEdges, expectedPoints };
}

function validateArtifactVertices(
  bundle: FaceComplexAuditInputV1,
  sourcePoints: readonly ProjectivePoint2[],
  expectedPoints: ReadonlyMap<string, ProjectivePoint2>,
):
  | Readonly<{
      vertices: readonly ArtifactVertex[];
      vertexIndexById: ReadonlyMap<string, number>;
      vertexIndexByPointKey: ReadonlyMap<string, number>;
    }>
  | AuditFailure {
  const vertices: ArtifactVertex[] = [];
  const vertexIndexById = new Map<string, number>();
  const vertexIndexByPointKey = new Map<string, number>();
  const mappedSourceIndices = new Set<number>();
  for (let index = 0; index < bundle.artifact.vertices.length; index += 1) {
    const value = bundle.artifact.vertices[index];
    if (value === undefined) throw new TypeError('artifact vertex is missing');
    if (vertexIndexById.has(value.id)) {
      return failure(
        'artifact',
        `$.artifact.vertices[${index}].id`,
        'duplicate-artifact-vertex-id',
        MESSAGE.duplicateVertexId,
      );
    }
    const point = projectivePointFromCanonicalDecimalRationalJson(value.exactCoordinate);
    const key = projectivePointKey(point);
    if (vertexIndexByPointKey.has(key)) {
      return failure(
        'artifact',
        `$.artifact.vertices[${index}].exactCoordinate`,
        'duplicate-artifact-coordinate',
        MESSAGE.duplicateVertexCoordinate,
      );
    }
    if (!expectedPoints.has(key)) {
      return failure(
        'planarization',
        `$.artifact.vertices[${index}].exactCoordinate`,
        'artifact-coordinate-surplus',
        MESSAGE.surplusCoordinate,
      );
    }
    if (value.sourceVertexIndex !== null) {
      const expected = sourcePoints[value.sourceVertexIndex];
      if (
        expected === undefined ||
        !equalProjectivePoints(expected, point) ||
        mappedSourceIndices.has(value.sourceVertexIndex)
      ) {
        return failure(
          'artifact',
          `$.artifact.vertices[${index}].sourceVertexIndex`,
          'source-vertex-mapping-invalid',
          MESSAGE.sourceMapping,
        );
      }
      mappedSourceIndices.add(value.sourceVertexIndex);
    } else if (sourcePoints.some((sourcePoint) => equalProjectivePoints(sourcePoint, point))) {
      return failure(
        'artifact',
        `$.artifact.vertices[${index}].sourceVertexIndex`,
        'source-vertex-mapping-invalid',
        MESSAGE.sourceMapping,
      );
    }
    vertexIndexById.set(value.id, index);
    vertexIndexByPointKey.set(key, index);
    vertices.push({ index, value, point, key });
  }
  for (const key of expectedPoints.keys()) {
    if (!vertexIndexByPointKey.has(key)) {
      return failure(
        'planarization',
        '$.artifact.vertices',
        'artifact-coordinate-missing',
        MESSAGE.missingCoordinate,
      );
    }
  }
  if (mappedSourceIndices.size !== sourcePoints.length) {
    return failure(
      'artifact',
      '$.artifact.vertices',
      'source-vertex-mapping-missing',
      MESSAGE.sourceMappingMissing,
    );
  }
  return { vertices, vertexIndexById, vertexIndexByPointKey };
}

function buildExpectedSubedges(
  sourceEdges: readonly SourceEdge[],
  expectedPoints: ReadonlyMap<string, ProjectivePoint2>,
): ReadonlyMap<string, ExpectedSubedge> {
  const expected = new Map<string, ExpectedSubedge>();
  for (const source of sourceEdges) {
    const vertical =
      compareProjectivePointCoordinate(source.segment.start, source.segment.end, 'x') === 0;
    const onSegment = [...expectedPoints.entries()]
      .filter(([, point]) => pointOnClosedSegment(point, source.segment))
      .sort((left, right) => {
        const primary = compareProjectivePointCoordinate(left[1], right[1], vertical ? 'y' : 'x');
        return primary === 0 ? compareProjectivePoints(left[1], right[1]) : primary;
      });
    for (let index = 0; index + 1 < onSegment.length; index += 1) {
      const first = onSegment[index];
      const second = onSegment[index + 1];
      if (first === undefined || second === undefined)
        throw new TypeError('source partition is missing');
      const key = pointPairKey(first[0], second[0]);
      const previous = expected.get(key);
      expected.set(key, {
        firstKey: first[0],
        secondKey: second[0],
        sourceIndices: [...(previous?.sourceIndices ?? []), source.index],
      });
    }
  }
  return expected;
}

function validateArtifactEdges(
  bundle: FaceComplexAuditInputV1,
  vertices: readonly ArtifactVertex[],
  vertexIndexById: ReadonlyMap<string, number>,
  expectedSubedges: ReadonlyMap<string, ExpectedSubedge>,
  sourceEdges: readonly SourceEdge[],
):
  | Readonly<{ edges: readonly ArtifactEdge[]; edgeIndexById: ReadonlyMap<string, number> }>
  | AuditFailure {
  const edges: ArtifactEdge[] = [];
  const edgeIndexById = new Map<string, number>();
  const edgeIndexByGeometry = new Map<string, number>();
  const provenanceIndexById = new Map<string, number>();
  const provenanceIdByIndex = new Map<number, string>();
  for (let index = 0; index < bundle.artifact.edges.length; index += 1) {
    const value = bundle.artifact.edges[index];
    if (value === undefined) throw new TypeError('artifact edge is missing');
    if (edgeIndexById.has(value.id)) {
      return failure(
        'artifact',
        `$.artifact.edges[${index}].id`,
        'duplicate-artifact-edge-id',
        MESSAGE.duplicateEdgeId,
      );
    }
    const first = vertexIndexById.get(value.vertexIds[0]);
    const second = vertexIndexById.get(value.vertexIds[1]);
    if (first === undefined || second === undefined) {
      return failure(
        'artifact',
        `$.artifact.edges[${index}].vertexIds`,
        'artifact-edge-reference-invalid',
        MESSAGE.edgeReference,
      );
    }
    const firstVertex = vertices[first];
    const secondVertex = vertices[second];
    if (firstVertex === undefined || secondVertex === undefined)
      throw new TypeError('edge endpoint is missing');
    if (equalProjectivePoints(firstVertex.point, secondVertex.point)) {
      return failure(
        'artifact',
        `$.artifact.edges[${index}].vertexIds`,
        'artifact-edge-degenerate',
        MESSAGE.edgeDegenerate,
      );
    }
    const geometryKey = pointPairKey(firstVertex.key, secondVertex.key);
    if (edgeIndexByGeometry.has(geometryKey)) {
      return failure(
        'artifact',
        `$.artifact.edges[${index}].vertexIds`,
        'duplicate-artifact-edge',
        MESSAGE.duplicateEdge,
      );
    }
    const expected = expectedSubedges.get(geometryKey);
    if (expected === undefined) {
      return failure(
        'planarization',
        `$.artifact.edges[${index}]`,
        'artifact-edge-surplus',
        MESSAGE.surplusEdge,
      );
    }
    const actualSourceIndices = value.sourceEdges.map((entry) => entry.sourceEdgeIndex);
    if (
      new Set(actualSourceIndices).size !== actualSourceIndices.length ||
      !sameStringSet(expected.sourceIndices.map(String), actualSourceIndices.map(String))
    ) {
      return failure(
        'planarization',
        `$.artifact.edges[${index}].sourceEdges`,
        'artifact-edge-provenance-invalid',
        MESSAGE.provenance,
      );
    }
    for (let sourceIndex = 0; sourceIndex < value.sourceEdges.length; sourceIndex += 1) {
      const provenance = value.sourceEdges[sourceIndex];
      if (provenance === undefined) throw new TypeError('edge provenance is missing');
      const source = sourceEdges[provenance.sourceEdgeIndex];
      const existingIndex = provenanceIndexById.get(provenance.id);
      const existingId = provenanceIdByIndex.get(provenance.sourceEdgeIndex);
      if (
        source === undefined ||
        source.assignment !== provenance.assignment ||
        (existingIndex !== undefined && existingIndex !== provenance.sourceEdgeIndex) ||
        (existingId !== undefined && existingId !== provenance.id)
      ) {
        return failure(
          'planarization',
          `$.artifact.edges[${index}].sourceEdges[${sourceIndex}]`,
          'artifact-edge-provenance-invalid',
          MESSAGE.provenance,
        );
      }
      provenanceIndexById.set(provenance.id, provenance.sourceEdgeIndex);
      provenanceIdByIndex.set(provenance.sourceEdgeIndex, provenance.id);
    }
    const assignments = value.sourceEdges.map((entry) => entry.assignment);
    if (assignments.some((entry) => entry !== value.assignment)) {
      return failure(
        'planarization',
        `$.artifact.edges[${index}].assignment`,
        'artifact-edge-assignment-invalid',
        MESSAGE.assignment,
      );
    }
    edgeIndexById.set(value.id, index);
    edgeIndexByGeometry.set(geometryKey, index);
    edges.push({ index, value, first, second, geometryKey });
  }
  for (const geometryKey of expectedSubedges.keys()) {
    if (!edgeIndexByGeometry.has(geometryKey)) {
      return failure(
        'planarization',
        '$.artifact.edges',
        'artifact-edge-missing',
        MESSAGE.missingEdge,
      );
    }
  }
  return { edges, edgeIndexById };
}

function validatePlanarityAndConnectivity(
  vertices: readonly ArtifactVertex[],
  edges: readonly ArtifactEdge[],
): AuditFailure | undefined {
  for (let firstIndex = 0; firstIndex < edges.length; firstIndex += 1) {
    const first = edges[firstIndex];
    if (first === undefined) throw new TypeError('artifact edge is missing');
    const firstStart = vertices[first.first]?.point;
    const firstEnd = vertices[first.second]?.point;
    if (firstStart === undefined || firstEnd === undefined)
      throw new TypeError('edge endpoint is missing');
    for (let secondIndex = firstIndex + 1; secondIndex < edges.length; secondIndex += 1) {
      const second = edges[secondIndex];
      if (second === undefined) throw new TypeError('artifact edge is missing');
      const secondStart = vertices[second.first]?.point;
      const secondEnd = vertices[second.second]?.point;
      if (secondStart === undefined || secondEnd === undefined)
        throw new TypeError('edge endpoint is missing');
      const intersection = classifyProjectiveSegmentIntersection(
        { start: firstStart, end: firstEnd },
        { start: secondStart, end: secondEnd },
      );
      if (
        intersection.kind === 'proper-crossing' ||
        intersection.kind === 't-junction' ||
        intersection.kind === 'collinear-overlap'
      ) {
        return failure(
          'planarization',
          `$.artifact.edges[${secondIndex}]`,
          'artifact-edge-intersection',
          MESSAGE.edgeIntersection,
        );
      }
    }
  }
  const adjacency = Array.from({ length: vertices.length }, () => [] as number[]);
  for (const edge of edges) {
    adjacency[edge.first]?.push(edge.second);
    adjacency[edge.second]?.push(edge.first);
  }
  const visited = new Set<number>();
  const firstNonempty = adjacency.findIndex((entries) => entries.length > 0);
  if (firstNonempty >= 0) {
    const pending = [firstNonempty];
    while (pending.length > 0) {
      const current = pending.pop();
      if (current === undefined || visited.has(current)) continue;
      visited.add(current);
      for (const neighbor of adjacency[current] ?? []) pending.push(neighbor);
    }
  }
  if (visited.size !== vertices.length) {
    return failure(
      'topology',
      '$.artifact.edges',
      'artifact-graph-disconnected',
      MESSAGE.disconnected,
    );
  }
  return undefined;
}

function enumerateCycles(
  vertices: readonly ArtifactVertex[],
  edges: readonly ArtifactEdge[],
): readonly EnumeratedCycle[] | AuditFailure {
  const adjacency = Array.from(
    { length: vertices.length },
    () => [] as Readonly<{ vertex: number; edge: number }>[],
  );
  for (const edge of edges) {
    adjacency[edge.first]?.push({ vertex: edge.second, edge: edge.index });
    adjacency[edge.second]?.push({ vertex: edge.first, edge: edge.index });
  }
  for (let centerIndex = 0; centerIndex < adjacency.length; centerIndex += 1) {
    const center = vertices[centerIndex]?.point;
    if (center === undefined) throw new TypeError('rotation center is missing');
    adjacency[centerIndex]?.sort((left, right) => {
      const leftPoint = vertices[left.vertex]?.point;
      const rightPoint = vertices[right.vertex]?.point;
      if (leftPoint === undefined || rightPoint === undefined)
        throw new TypeError('ray endpoint is missing');
      return compareProjectiveDirections(center, leftPoint, rightPoint);
    });
    const entries = adjacency[centerIndex] ?? [];
    for (let index = 1; index < entries.length; index += 1) {
      const left = vertices[entries[index - 1]?.vertex ?? -1]?.point;
      const right = vertices[entries[index]?.vertex ?? -1]?.point;
      if (
        left === undefined ||
        right === undefined ||
        compareProjectiveDirections(center, left, right) === 0
      ) {
        return failure(
          'face-enumeration',
          '$.artifact.edges',
          'angular-order-ambiguous',
          MESSAGE.angularOrder,
        );
      }
    }
  }

  const visited = new Set<string>();
  const cycles: EnumeratedCycle[] = [];
  const dartKey = (from: number, to: number): string => `${from}>${to}`;
  for (const edge of edges) {
    for (const start of [
      { from: edge.first, to: edge.second, edge: edge.index },
      { from: edge.second, to: edge.first, edge: edge.index },
    ]) {
      if (visited.has(dartKey(start.from, start.to))) continue;
      const local = new Set<string>();
      const vertexIndices: number[] = [];
      const edgeIndices: number[] = [];
      let current = start;
      let closed = false;
      for (let step = 0; step <= edges.length * 2; step += 1) {
        const key = dartKey(current.from, current.to);
        if (local.has(key)) {
          if (current.from !== start.from || current.to !== start.to) {
            return failure(
              'face-enumeration',
              '$.artifact.edges',
              'dart-traversal-invalid',
              MESSAGE.dartTraversal,
            );
          }
          closed = true;
          break;
        }
        if (visited.has(key)) {
          return failure(
            'face-enumeration',
            '$.artifact.edges',
            'dart-traversal-invalid',
            MESSAGE.dartTraversal,
          );
        }
        local.add(key);
        visited.add(key);
        vertexIndices.push(current.from);
        edgeIndices.push(current.edge);
        const around = adjacency[current.to];
        const incomingIndex = around?.findIndex((entry) => entry.vertex === current.from);
        if (
          around === undefined ||
          incomingIndex === undefined ||
          incomingIndex < 0 ||
          around.length === 0
        ) {
          return failure(
            'face-enumeration',
            '$.artifact.edges',
            'dart-traversal-invalid',
            MESSAGE.dartTraversal,
          );
        }
        const outgoing = around[(incomingIndex + 1) % around.length];
        if (outgoing === undefined) throw new TypeError('next dart is missing');
        current = { from: current.to, to: outgoing.vertex, edge: outgoing.edge };
      }
      if (!closed) {
        return failure(
          'face-enumeration',
          '$.artifact.edges',
          'dart-traversal-invalid',
          MESSAGE.dartTraversal,
        );
      }
      if (vertexIndices.length < 3 || new Set(vertexIndices).size !== vertexIndices.length) {
        return failure(
          'face-enumeration',
          '$.artifact.edges',
          'dart-traversal-invalid',
          MESSAGE.dartTraversal,
        );
      }
      const points = vertexIndices.map((index) => {
        const point = vertices[index]?.point;
        if (point === undefined) throw new TypeError('cycle vertex is missing');
        return point;
      });
      const area = projectivePolygonTwiceSignedArea(points);
      if (signProjectiveRationalComponent(area) === 0) {
        return failure(
          'face-enumeration',
          '$.artifact.edges',
          'dart-traversal-invalid',
          MESSAGE.dartTraversal,
        );
      }
      cycles.push({
        vertexIndices,
        edgeIndices,
        area,
        canonicalPointCycle: canonicalPointCycle(points),
      });
    }
  }
  if (visited.size !== edges.length * 2) {
    return failure(
      'face-enumeration',
      '$.artifact.edges',
      'dart-traversal-invalid',
      MESSAGE.dartTraversal,
    );
  }
  return cycles;
}

function validateBoundaryAlignment(
  vertexIds: readonly string[],
  edgeIds: readonly string[],
  path: string,
  vertexIndexById: ReadonlyMap<string, number>,
  edgeIndexById: ReadonlyMap<string, number>,
  edges: readonly ArtifactEdge[],
): AuditFailure | undefined {
  if (
    vertexIds.length !== edgeIds.length ||
    new Set(vertexIds).size !== vertexIds.length ||
    new Set(edgeIds).size !== edgeIds.length
  ) {
    return failure('artifact', path, 'boundary-reference-invalid', MESSAGE.boundaryReference);
  }
  for (let index = 0; index < vertexIds.length; index += 1) {
    const first = vertexIndexById.get(vertexIds[index] ?? '');
    const second = vertexIndexById.get(vertexIds[(index + 1) % vertexIds.length] ?? '');
    const edgeIndex = edgeIndexById.get(edgeIds[index] ?? '');
    const edge = edgeIndex === undefined ? undefined : edges[edgeIndex];
    if (first === undefined || second === undefined || edge === undefined) {
      return failure('artifact', path, 'boundary-reference-invalid', MESSAGE.boundaryReference);
    }
    if (indexPairKey(first, second) !== indexPairKey(edge.first, edge.second)) {
      return failure(
        'face-enumeration',
        path,
        'boundary-edge-alignment-invalid',
        MESSAGE.boundaryAlignment,
      );
    }
  }
  return undefined;
}

function validateCandidateCycles(
  bundle: FaceComplexAuditInputV1,
  vertices: readonly ArtifactVertex[],
  edges: readonly ArtifactEdge[],
  vertexIndexById: ReadonlyMap<string, number>,
  edgeIndexById: ReadonlyMap<string, number>,
  cycles: readonly EnumeratedCycle[],
): Readonly<{ boundedByCanonicalCycle: ReadonlyMap<string, EnumeratedCycle> }> | AuditFailure {
  const exterior = cycles.filter((cycle) => signProjectiveRationalComponent(cycle.area) > 0);
  const bounded = cycles.filter((cycle) => signProjectiveRationalComponent(cycle.area) < 0);
  if (exterior.length !== 1) {
    return failure(
      'face-enumeration',
      '$.artifact.exteriorBoundary',
      'exterior-cycle-invalid',
      MESSAGE.exteriorCycle,
    );
  }
  const boundedByCanonicalCycle = new Map<string, EnumeratedCycle>();
  for (const cycle of bounded) {
    if (boundedByCanonicalCycle.has(cycle.canonicalPointCycle)) {
      return failure(
        'face-enumeration',
        '$.artifact.faces',
        'face-cycle-invalid',
        MESSAGE.faceCycle,
      );
    }
    boundedByCanonicalCycle.set(cycle.canonicalPointCycle, cycle);
  }

  const exteriorAlignment = validateBoundaryAlignment(
    bundle.artifact.exteriorBoundary.vertexIds,
    bundle.artifact.exteriorBoundary.edgeIds,
    '$.artifact.exteriorBoundary',
    vertexIndexById,
    edgeIndexById,
    edges,
  );
  if (exteriorAlignment !== undefined) return exteriorAlignment;
  const exteriorPoints = bundle.artifact.exteriorBoundary.vertexIds.map((id) => {
    const index = vertexIndexById.get(id);
    const point = index === undefined ? undefined : vertices[index]?.point;
    if (point === undefined) throw new TypeError('exterior vertex is missing');
    return point;
  });
  if (
    signProjectiveRationalComponent(projectivePolygonTwiceSignedArea(exteriorPoints)) !== 1 ||
    canonicalPointCycle(exteriorPoints) !== exterior[0]?.canonicalPointCycle
  ) {
    return failure(
      'face-enumeration',
      '$.artifact.exteriorBoundary',
      'exterior-cycle-invalid',
      MESSAGE.exteriorCycle,
    );
  }

  const faceIds = new Set<string>();
  const candidateCycles = new Set<string>();
  for (let index = 0; index < bundle.artifact.faces.length; index += 1) {
    const face = bundle.artifact.faces[index];
    if (face === undefined) throw new TypeError('candidate face is missing');
    if (face.id === bundle.artifact.exteriorBoundary.id || faceIds.has(face.id)) {
      return failure(
        'artifact',
        `$.artifact.faces[${index}].id`,
        'face-id-duplicate',
        MESSAGE.duplicateFaceId,
      );
    }
    faceIds.add(face.id);
    const alignment = validateBoundaryAlignment(
      face.vertexIds,
      face.edgeIds,
      `$.artifact.faces[${index}]`,
      vertexIndexById,
      edgeIndexById,
      edges,
    );
    if (alignment !== undefined) return alignment;
    const points = face.vertexIds.map((id) => {
      const vertexIndex = vertexIndexById.get(id);
      const point = vertexIndex === undefined ? undefined : vertices[vertexIndex]?.point;
      if (point === undefined) throw new TypeError('face vertex is missing');
      return point;
    });
    if (signProjectiveRationalComponent(projectivePolygonTwiceSignedArea(points)) !== -1) {
      return failure(
        'face-enumeration',
        `$.artifact.faces[${index}].vertexIds`,
        'face-cycle-invalid',
        MESSAGE.faceCycle,
      );
    }
    const canonical = canonicalPointCycle(points);
    if (!boundedByCanonicalCycle.has(canonical) || candidateCycles.has(canonical)) {
      return failure(
        'face-enumeration',
        `$.artifact.faces[${index}].vertexIds`,
        'face-cycle-invalid',
        MESSAGE.faceCycle,
      );
    }
    candidateCycles.add(canonical);
  }
  if (candidateCycles.size !== boundedByCanonicalCycle.size) {
    return failure('face-enumeration', '$.artifact.faces', 'face-cycle-invalid', MESSAGE.faceCycle);
  }

  const incidence = new Map<number, number>();
  for (const face of bundle.artifact.faces) {
    for (const edgeId of face.edgeIds) {
      const edgeIndex = edgeIndexById.get(edgeId);
      if (edgeIndex === undefined) throw new TypeError('face edge is missing');
      incidence.set(edgeIndex, (incidence.get(edgeIndex) ?? 0) + 1);
    }
  }
  for (const edge of edges) {
    const expected = edge.value.assignment === 'B' ? 1 : 2;
    if ((incidence.get(edge.index) ?? 0) !== expected) {
      return failure(
        'topology',
        `$.artifact.edges[${edge.index}].assignment`,
        'assignment-incidence-invalid',
        MESSAGE.incidence,
      );
    }
  }
  return { boundedByCanonicalCycle };
}

function validateDiagonal(
  firstIndex: number,
  secondIndex: number,
  polygonIndices: readonly number[],
  polygonPoints: readonly ProjectivePoint2[],
  vertices: readonly ArtifactVertex[],
): boolean {
  const first = vertices[firstIndex]?.point;
  const second = vertices[secondIndex]?.point;
  if (first === undefined || second === undefined) return false;
  const diagonal = { start: first, end: second };
  for (let index = 0; index < polygonIndices.length; index += 1) {
    const boundaryFirstIndex = polygonIndices[index];
    const boundarySecondIndex = polygonIndices[(index + 1) % polygonIndices.length];
    if (boundaryFirstIndex === undefined || boundarySecondIndex === undefined) return false;
    if (
      boundaryFirstIndex === firstIndex ||
      boundaryFirstIndex === secondIndex ||
      boundarySecondIndex === firstIndex ||
      boundarySecondIndex === secondIndex
    ) {
      continue;
    }
    const boundaryFirst = vertices[boundaryFirstIndex]?.point;
    const boundarySecond = vertices[boundarySecondIndex]?.point;
    if (boundaryFirst === undefined || boundarySecond === undefined) return false;
    if (
      classifyProjectiveSegmentIntersection(diagonal, {
        start: boundaryFirst,
        end: boundarySecond,
      }).kind !== 'disjoint'
    ) {
      return false;
    }
  }
  return pointStrictlyInsidePolygon(exactMidpoint(first, second), polygonPoints);
}

function validateFaceTriangles(
  face: FaceComplexAuditFaceV1,
  faceIndex: number,
  vertices: readonly ArtifactVertex[],
  vertexIndexById: ReadonlyMap<string, number>,
  triangleIds: Set<string>,
): AuditFailure | undefined {
  const path = `$.artifact.faces[${faceIndex}].triangles`;
  if (face.triangles.length !== face.vertexIds.length - 2) {
    return failure('triangulation', path, 'triangle-count-invalid', MESSAGE.triangleCount);
  }
  const polygonIndices = face.vertexIds.map((id) => vertexIndexById.get(id));
  if (polygonIndices.some((entry) => entry === undefined)) {
    return failure('triangulation', path, 'triangle-reference-invalid', MESSAGE.triangleReference);
  }
  const exactPolygonIndices = polygonIndices as number[];
  const polygonPoints = exactPolygonIndices.map((index) => {
    const point = vertices[index]?.point;
    if (point === undefined) throw new TypeError('polygon point is missing');
    return point;
  });
  const boundaryEdges = new Set<string>();
  for (let index = 0; index < exactPolygonIndices.length; index += 1) {
    const first = exactPolygonIndices[index];
    const second = exactPolygonIndices[(index + 1) % exactPolygonIndices.length];
    if (first === undefined || second === undefined)
      throw new TypeError('boundary index is missing');
    boundaryEdges.add(indexPairKey(first, second));
  }
  const triangleEdgeIncidence = new Map<string, number>();
  const diagonalEndpoints = new Map<string, readonly [number, number]>();
  let triangleArea = canonicalProjectiveRationalComponent(0n);
  for (let index = 0; index < face.triangles.length; index += 1) {
    const triangle = face.triangles[index];
    if (triangle === undefined) throw new TypeError('triangle is missing');
    if (triangleIds.has(triangle.id)) {
      return failure(
        'artifact',
        `${path}[${index}].id`,
        'triangle-id-duplicate',
        MESSAGE.duplicateTriangleId,
      );
    }
    triangleIds.add(triangle.id);
    if (triangle.faceId !== face.id) {
      return failure(
        'triangulation',
        `${path}[${index}].faceId`,
        'triangle-reference-invalid',
        MESSAGE.triangleReference,
      );
    }
    if (!sameStringSet(triangle.vertexIds, triangle.semanticVertexIds)) {
      return failure(
        'triangulation',
        `${path}[${index}].semanticVertexIds`,
        'triangle-semantic-ids-invalid',
        MESSAGE.triangleSemantic,
      );
    }
    const indices = triangle.vertexIds.map((id) => vertexIndexById.get(id));
    if (
      new Set(indices).size !== 3 ||
      indices.some((entry) => entry === undefined || !exactPolygonIndices.includes(entry))
    ) {
      return failure(
        'triangulation',
        `${path}[${index}].vertexIds`,
        'triangle-reference-invalid',
        MESSAGE.triangleReference,
      );
    }
    const exactIndices = indices as [number, number, number];
    const points = exactIndices.map((vertexIndex) => vertices[vertexIndex]?.point);
    const first = points[0];
    const second = points[1];
    const third = points[2];
    if (first === undefined || second === undefined || third === undefined) {
      throw new TypeError('triangle point is missing');
    }
    const area = projectiveTriangleTwiceSignedArea(first, second, third);
    if (signProjectiveRationalComponent(area) !== -1) {
      return failure(
        'triangulation',
        `${path}[${index}].vertexIds`,
        'triangle-winding-invalid',
        MESSAGE.triangleWinding,
      );
    }
    triangleArea = addProjectiveRationalComponents(triangleArea, area);
    for (const pair of [
      [exactIndices[0], exactIndices[1]],
      [exactIndices[1], exactIndices[2]],
      [exactIndices[2], exactIndices[0]],
    ] as const) {
      const key = indexPairKey(pair[0], pair[1]);
      triangleEdgeIncidence.set(key, (triangleEdgeIncidence.get(key) ?? 0) + 1);
      if (!boundaryEdges.has(key)) diagonalEndpoints.set(key, pair);
    }
  }
  if (
    !equalProjectiveRationalComponents(
      triangleArea,
      projectivePolygonTwiceSignedArea(polygonPoints),
    )
  ) {
    return failure('triangulation', path, 'triangle-area-invalid', MESSAGE.triangleArea);
  }
  for (const boundary of boundaryEdges) {
    if (triangleEdgeIncidence.get(boundary) !== 1) {
      return failure(
        'triangulation',
        path,
        'triangle-edge-incidence-invalid',
        MESSAGE.triangleIncidence,
      );
    }
  }
  for (const [key, incidence] of triangleEdgeIncidence) {
    if (!boundaryEdges.has(key) && incidence !== 2) {
      return failure(
        'triangulation',
        path,
        'triangle-edge-incidence-invalid',
        MESSAGE.triangleIncidence,
      );
    }
  }
  if (diagonalEndpoints.size !== Math.max(0, face.vertexIds.length - 3)) {
    return failure(
      'triangulation',
      path,
      'triangle-edge-incidence-invalid',
      MESSAGE.triangleIncidence,
    );
  }
  const diagonals = [...diagonalEndpoints.values()];
  for (let index = 0; index < diagonals.length; index += 1) {
    const diagonal = diagonals[index];
    if (
      diagonal === undefined ||
      !validateDiagonal(diagonal[0], diagonal[1], exactPolygonIndices, polygonPoints, vertices)
    ) {
      return failure('triangulation', path, 'triangle-diagonal-invalid', MESSAGE.triangleDiagonal);
    }
    const first = vertices[diagonal[0]]?.point;
    const second = vertices[diagonal[1]]?.point;
    if (first === undefined || second === undefined)
      throw new TypeError('diagonal point is missing');
    for (let otherIndex = index + 1; otherIndex < diagonals.length; otherIndex += 1) {
      const other = diagonals[otherIndex];
      if (other === undefined) throw new TypeError('diagonal is missing');
      const otherFirst = vertices[other[0]]?.point;
      const otherSecond = vertices[other[1]]?.point;
      if (otherFirst === undefined || otherSecond === undefined)
        throw new TypeError('diagonal point is missing');
      const intersection = classifyProjectiveSegmentIntersection(
        { start: first, end: second },
        { start: otherFirst, end: otherSecond },
      );
      const sharesEndpoint = diagonal.some((entry) => other.includes(entry));
      if (
        (sharesEndpoint && intersection.kind !== 'endpoint-touch') ||
        (!sharesEndpoint && intersection.kind !== 'disjoint')
      ) {
        return failure(
          'triangulation',
          path,
          'triangle-diagonal-invalid',
          MESSAGE.triangleDiagonal,
        );
      }
    }
  }
  return undefined;
}

function validateTriangles(
  bundle: FaceComplexAuditInputV1,
  vertices: readonly ArtifactVertex[],
  vertexIndexById: ReadonlyMap<string, number>,
): AuditFailure | undefined {
  const triangleIds = new Set<string>();
  for (let index = 0; index < bundle.artifact.faces.length; index += 1) {
    const face = bundle.artifact.faces[index];
    if (face === undefined) throw new TypeError('face is missing');
    const invalid = validateFaceTriangles(face, index, vertices, vertexIndexById, triangleIds);
    if (invalid !== undefined) return invalid;
  }
  return undefined;
}

function validateTopologyCounters(
  bundle: FaceComplexAuditInputV1,
  vertices: readonly ArtifactVertex[],
  edges: readonly ArtifactEdge[],
  boundedFaceCount: number,
): FaceComplexAuditComputedTopologyV1 | AuditFailure {
  const triangleCount = bundle.artifact.faces.reduce((sum, face) => sum + face.triangles.length, 0);
  const createdIntersectionVertexCount = vertices.filter(
    (vertex) => vertex.value.sourceVertexIndex === null,
  ).length;
  const nonDyadicVertexCount = bundle.artifact.vertices.filter((vertex) => {
    const x = BigInt(vertex.exactCoordinate.x.denominator);
    const y = BigInt(vertex.exactCoordinate.y.denominator);
    return !isPowerOfTwo(x) || !isPowerOfTwo(y);
  }).length;
  const expected = {
    sourceVertexCount: bundle.source.verticesCoords.length,
    sourceEdgeCount: bundle.source.edgesVertices.length,
    planarVertexCount: vertices.length,
    planarEdgeCount: edges.length,
    boundedFaceCount,
    triangleCount,
    createdIntersectionVertexCount,
    nonDyadicVertexCount,
    eulerValue: 1,
  } as const;
  for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
    if (bundle.artifact.topology[key] !== expected[key]) {
      return failure(
        'topology',
        `$.artifact.topology.${key}`,
        'topology-counter-invalid',
        MESSAGE.topologyCounter,
      );
    }
  }
  if (vertices.length - edges.length + boundedFaceCount !== 1) {
    return failure(
      'topology',
      '$.artifact.topology.eulerValue',
      'euler-invariant-invalid',
      MESSAGE.euler,
    );
  }
  return expected;
}

function auditParsedBundle(bundle: FaceComplexAuditInputV1): FaceComplexAuditResultV1 {
  const source = validateSource(bundle);
  if ('ok' in source) return source;
  const artifactVertices = validateArtifactVertices(
    bundle,
    source.sourcePoints,
    source.expectedPoints,
  );
  if ('ok' in artifactVertices) return artifactVertices;
  const expectedSubedges = buildExpectedSubedges(source.sourceEdges, source.expectedPoints);
  const artifactEdges = validateArtifactEdges(
    bundle,
    artifactVertices.vertices,
    artifactVertices.vertexIndexById,
    expectedSubedges,
    source.sourceEdges,
  );
  if ('ok' in artifactEdges) return artifactEdges;
  const invalidPlanarity = validatePlanarityAndConnectivity(
    artifactVertices.vertices,
    artifactEdges.edges,
  );
  if (invalidPlanarity !== undefined) return invalidPlanarity;
  const cycles = enumerateCycles(artifactVertices.vertices, artifactEdges.edges);
  if ('ok' in cycles) return cycles;
  const cycleValidation = validateCandidateCycles(
    bundle,
    artifactVertices.vertices,
    artifactEdges.edges,
    artifactVertices.vertexIndexById,
    artifactEdges.edgeIndexById,
    cycles,
  );
  if ('ok' in cycleValidation) return cycleValidation;
  const triangleValidation = validateTriangles(
    bundle,
    artifactVertices.vertices,
    artifactVertices.vertexIndexById,
  );
  if (triangleValidation !== undefined) return triangleValidation;
  const topologyValidation = validateTopologyCounters(
    bundle,
    artifactVertices.vertices,
    artifactEdges.edges,
    cycleValidation.boundedByCanonicalCycle.size,
  );
  if ('ok' in topologyValidation) return topologyValidation;
  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: FACE_COMPLEX_AUDIT_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      scope: 'face-complex-only' as const,
      implementationRole: 'independent-auditor' as const,
      verificationIndependence: 'separate-projective-kernel-not-full-reference-verifier' as const,
      auditOutcome: 'consistent' as const,
      topology: topologyValidation,
    },
  });
}

/**
 * Independently re-computes the exact planar face complex represented by a
 * closed candidate bundle. A consistent result remains candidate-only and is
 * deliberately not a complete scientific reference-verifier claim.
 */
export function auditFaceComplexCandidateV1(supplied: unknown): FaceComplexAuditResultV1 {
  try {
    const parsed = parseFaceComplexAuditInputV1(supplied);
    if (!parsed.ok) {
      return failure(
        'audit-contract',
        parsed.error[0]?.path ?? '$',
        'input-contract-rejected',
        MESSAGE.contract,
      );
    }
    return auditParsedBundle(parsed.value);
  } catch {
    return failure('audit-internal', '$', 'unexpected-audit-failure', MESSAGE.internal);
  }
}
