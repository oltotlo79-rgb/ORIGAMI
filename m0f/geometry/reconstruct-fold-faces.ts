import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  EXACT_RATIONAL_JSON_ENCODING_ID,
  exactRationalPointToJsonV1,
  type ExactRationalPointJsonV1,
} from '../model/exact-rational-json.js';
import {
  exactRationalPointKey,
  exactRationalToBinary64ForDisplay,
  finiteBinary64ToExactRational,
  type ExactRationalPoint2,
} from '../model/exact-rational.js';
import { M0F_CONVENTIONS_ID } from '../model/reference-model.js';
import {
  normalizeFoldFaceReconstructionInputV1,
  type FoldFaceReconstructionAssignment,
} from './fold-face-input.js';
import { enumeratePlanarFaces } from './planar-faces.js';
import { enumerateRationalPlanarFaces } from './planar-rational-faces.js';
import { planarizeDyadicSegments } from './planarize-segments.js';
import {
  triangulatePlanarRationalFaceCandidate,
  type RationalCandidateFaceTriangulation,
} from './triangulate-rational-face.js';

export const FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID =
  'https://oridesign.local/schemas/m0f/fold-face-reconstruction-result-v1.schema.json' as const;

export type CandidateReconstructedFoldVertexV1 = Readonly<{
  id: string;
  exactCoordinate: ExactRationalPointJsonV1;
  displayCoordinate: readonly [number, number];
  sourceVertexIndex: number | null;
}>;

export type CandidateReconstructedFoldEdgeV1 = Readonly<{
  id: string;
  vertexIds: readonly [string, string];
  assignment: FoldFaceReconstructionAssignment;
  sourceEdges: readonly Readonly<{
    id: string;
    sourceEdgeIndex: number;
    assignment: FoldFaceReconstructionAssignment;
  }>[];
}>;

export type CandidateReconstructedFoldFaceV1 = Readonly<{
  id: string;
  vertexIds: readonly string[];
  edgeIds: readonly string[];
  areaSign: -1;
  triangles: readonly Readonly<{
    id: string;
    faceId: string;
    vertexIds: readonly [string, string, string];
    semanticVertexIds: readonly [string, string, string];
  }>[];
}>;

export type CandidateFoldProjectionV1 = Readonly<{
  file_spec: 1.1 | 1.2;
  file_creator: 'OriDesign M0F candidate reference';
  frame_classes: readonly ['creasePattern'];
  vertices_coords: readonly (readonly [number, number])[];
  edges_vertices: readonly (readonly [number, number])[];
  edges_assignment: readonly FoldFaceReconstructionAssignment[];
  faces_vertices: readonly (readonly number[])[];
  _oridesign_m0f_candidate: Readonly<{
    schemaVersion: 1;
    contractStatus: 'candidate';
    scientificClaim: false;
    conventionsId: typeof M0F_CONVENTIONS_ID;
    exactCoordinateEncoding: typeof EXACT_RATIONAL_JSON_ENCODING_ID;
    vertexIds: readonly string[];
    edgeIds: readonly string[];
    faceIds: readonly string[];
    exactVerticesCoords: readonly ExactRationalPointJsonV1[];
    sourceEdgeIdsByEdge: readonly (readonly string[])[];
    trianglesVerticesByFace: readonly Readonly<{
      faceId: string;
      triangleIds: readonly string[];
      trianglesVertices: readonly (readonly [number, number, number])[];
    }>[];
  }>;
}>;

export type CandidateFoldFaceReconstructionV1 = Readonly<{
  schemaVersion: 1;
  schemaId: typeof FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID;
  recordType: 'm0f-fold-face-reconstruction';
  contractStatus: 'candidate';
  implementationRole: 'reference';
  scientificClaim: false;
  conventionsId: typeof M0F_CONVENTIONS_ID;
  inputSpecVersion: '1.1' | '1.2';
  exactCoordinateEncoding: typeof EXACT_RATIONAL_JSON_ENCODING_ID;
  vertices: readonly CandidateReconstructedFoldVertexV1[];
  edges: readonly CandidateReconstructedFoldEdgeV1[];
  exteriorBoundary: Readonly<{
    id: string;
    vertexIds: readonly string[];
    edgeIds: readonly string[];
    areaSign: 1;
  }>;
  faces: readonly CandidateReconstructedFoldFaceV1[];
  topology: Readonly<{
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
  foldProjection: CandidateFoldProjectionV1;
  limitations: readonly [
    'candidate-reference-o-n-squared',
    'single-connected-disk-no-holes-or-bridges',
    'no-vertex-merge-tolerance-applied',
    'display-coordinates-are-not-topology-evidence',
    'candidate-stable-ids-not-frozen-for-product',
  ];
}>;

export type FoldFaceReconstructionIssue = Readonly<{
  stage: 'input' | 'planarization' | 'face-enumeration' | 'triangulation' | 'fold-projection';
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
}>;

export type FoldFaceReconstructionResult =
  | Readonly<{ ok: true; value: CandidateFoldFaceReconstructionV1 }>
  | Readonly<{ ok: false; error: readonly FoldFaceReconstructionIssue[] }>;

type StageIssue = Readonly<{
  path: string;
  code: string;
  message: string;
  relatedIds?: readonly string[];
  sourceEdgeIds?: readonly string[];
}>;

function failure(
  stage: FoldFaceReconstructionIssue['stage'],
  entries: readonly StageIssue[],
): FoldFaceReconstructionResult {
  return deepFreezeOwned({
    ok: false,
    error: entries.map((entry) => {
      const relatedIds = entry.relatedIds ?? entry.sourceEdgeIds;
      return relatedIds === undefined
        ? { stage, path: entry.path, code: entry.code, message: entry.message }
        : { stage, path: entry.path, code: entry.code, message: entry.message, relatedIds };
    }),
  });
}

function invariantFailure(
  message: string,
  relatedIds?: readonly string[],
): FoldFaceReconstructionResult {
  return failure('fold-projection', [
    {
      path: '$',
      code: 'reconstruction-invariant-failed',
      message,
      ...(relatedIds === undefined ? {} : { relatedIds }),
    },
  ]);
}

function exactPointFromBinary64(x: number, y: number): ExactRationalPoint2 {
  return { x: finiteBinary64ToExactRational(x), y: finiteBinary64ToExactRational(y) };
}

function displayNumber(pointComponent: ExactRationalPoint2['x']): number | undefined {
  const value = exactRationalToBinary64ForDisplay(pointComponent);
  if (!Number.isFinite(value)) return undefined;
  return value === 0 ? 0 : value;
}

function isPowerOfTwo(value: bigint): boolean {
  return value > 0n && (value & (value - 1n)) === 0n;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Candidate M0F-3 reference pipeline for a closed top-level 2D FOLD slice with
 * `faces_vertices` absent. Exact rational coordinates remain authoritative;
 * the numeric FOLD projection is explicitly display/interchange-only evidence.
 */
export function reconstructFoldFacesCandidateV1(supplied: unknown): FoldFaceReconstructionResult {
  const normalized = normalizeFoldFaceReconstructionInputV1(supplied);
  if (!normalized.ok) return failure('input', normalized.error);

  const sourceVerticesById = new Map(
    normalized.value.vertices.map((vertex) => [vertex.id, vertex]),
  );
  const sourceEdgesById = new Map(normalized.value.edges.map((edge) => [edge.id, edge]));
  const segments = normalized.value.edges.map((edge) => {
    const start = sourceVerticesById.get(edge.vertices[0]);
    const end = sourceVerticesById.get(edge.vertices[1]);
    if (start === undefined || end === undefined) {
      throw new TypeError('normalized edge endpoint must exist');
    }
    return {
      sourceEdgeId: edge.id,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
    };
  });
  const planarized = planarizeDyadicSegments(segments);
  if (!planarized.ok) return failure('planarization', planarized.error);

  const enumerated = enumerateRationalPlanarFaces(planarized.value);
  if (!enumerated.ok) return failure('face-enumeration', enumerated.error);

  const incidenceByEdgeId = new Map(planarized.value.edges.map((edge) => [edge.id, 0]));
  for (const face of enumerated.value.boundedFaces) {
    for (const edgeId of face.edgeIds) {
      const incidence = incidenceByEdgeId.get(edgeId);
      if (incidence === undefined) {
        return invariantFailure('enumerated face references an unknown planar edge', [edgeId]);
      }
      incidenceByEdgeId.set(edgeId, incidence + 1);
    }
  }
  for (const edge of planarized.value.edges) {
    const assignments = edge.sourceEdgeIds.flatMap((sourceEdgeId) => {
      const source = sourceEdgesById.get(sourceEdgeId);
      return source === undefined ? [] : [source.assignment];
    });
    if (assignments.length !== edge.sourceEdgeIds.length || assignments.length === 0) {
      return invariantFailure('planar edge assignment provenance is incomplete', [
        edge.id,
        ...edge.sourceEdgeIds,
      ]);
    }
    if (new Set(assignments).size !== 1) {
      return invariantFailure('one planar edge has conflicting source assignments', [
        edge.id,
        ...edge.sourceEdgeIds,
      ]);
    }
    const incidence = incidenceByEdgeId.get(edge.id) ?? 0;
    const expectedIncidence = assignments[0] === 'B' ? 1 : 2;
    if (incidence !== expectedIncidence) {
      return failure('face-enumeration', [
        {
          path: '$.edgesAssignment',
          code: 'assignment-incidence-mismatch',
          message: `assignment ${assignments[0]} requires ${expectedIncidence} bounded-face incidence(s), received ${incidence}`,
          relatedIds: [edge.id, ...edge.sourceEdgeIds],
        },
      ]);
    }
  }

  const triangulations: RationalCandidateFaceTriangulation[] = [];
  for (const face of enumerated.value.boundedFaces) {
    const triangulated = triangulatePlanarRationalFaceCandidate({
      boundary: face,
      vertices: planarized.value.vertices,
    });
    if (!triangulated.ok) return failure('triangulation', triangulated.error);
    triangulations.push(triangulated.value);
  }

  const sourceVertexIndexByExactPoint = new Map(
    normalized.value.vertices.map((vertex) => [
      exactRationalPointKey(exactPointFromBinary64(vertex.x, vertex.y)),
      vertex.sourceVertexIndex,
    ]),
  );
  const vertices: CandidateReconstructedFoldVertexV1[] = [];
  for (const vertex of planarized.value.vertices) {
    const displayX = displayNumber(vertex.point.x);
    const displayY = displayNumber(vertex.point.y);
    if (displayX === undefined || displayY === undefined) {
      return invariantFailure(
        'exact planar vertex cannot be represented by a finite display number',
        [vertex.id],
      );
    }
    vertices.push({
      id: vertex.id,
      exactCoordinate: exactRationalPointToJsonV1(vertex.point),
      displayCoordinate: [displayX, displayY],
      sourceVertexIndex:
        sourceVertexIndexByExactPoint.get(exactRationalPointKey(vertex.point)) ?? null,
    });
  }

  const edges: CandidateReconstructedFoldEdgeV1[] = [];
  for (const edge of planarized.value.edges) {
    const sources = edge.sourceEdgeIds.flatMap((sourceEdgeId) => {
      const source = sourceEdgesById.get(sourceEdgeId);
      return source === undefined ? [] : [source];
    });
    if (sources.length !== edge.sourceEdgeIds.length || sources.length === 0) {
      return invariantFailure(
        'planar edge provenance does not resolve to every normalized source edge',
        [edge.id, ...edge.sourceEdgeIds],
      );
    }
    const assignments = new Set(sources.map((source) => source.assignment));
    if (assignments.size !== 1) {
      return invariantFailure('one planar edge has conflicting source assignments', [
        edge.id,
        ...edge.sourceEdgeIds,
      ]);
    }
    const firstSource = sources[0];
    if (firstSource === undefined) throw new TypeError('resolved source list cannot be empty');
    edges.push({
      id: edge.id,
      vertexIds: [edge.startVertexId, edge.endVertexId],
      assignment: firstSource.assignment,
      sourceEdges: sources.map((source) => ({
        id: source.id,
        sourceEdgeIndex: source.sourceEdgeIndex,
        assignment: source.assignment,
      })),
    });
  }

  const faces: CandidateReconstructedFoldFaceV1[] = enumerated.value.boundedFaces.map(
    (face, index) => {
      const triangulation = triangulations[index];
      if (triangulation === undefined) throw new TypeError('face triangulation is missing');
      return {
        id: face.id,
        vertexIds: face.vertexIds,
        edgeIds: face.edgeIds,
        areaSign: -1,
        triangles: triangulation.triangles,
      };
    },
  );

  const displayEnumeration = enumeratePlanarFaces({
    vertices: vertices.map((vertex) => ({
      id: vertex.id,
      x: vertex.displayCoordinate[0],
      y: vertex.displayCoordinate[1],
    })),
    edges: edges.map((edge) => ({ id: edge.id, vertices: edge.vertexIds })),
  });
  if (!displayEnumeration.ok) {
    return failure(
      'fold-projection',
      displayEnumeration.error.map((issue) => ({
        path: issue.path,
        code: `display-${issue.code}`,
        message: `display projection changed exact topology: ${issue.message}`,
        ...(issue.relatedIds === undefined ? {} : { relatedIds: issue.relatedIds }),
      })),
    );
  }
  const displayFacesMatch =
    displayEnumeration.value.boundedFaces.length === faces.length &&
    displayEnumeration.value.boundedFaces.every((face, index) => {
      const exactFace = faces[index];
      return (
        exactFace !== undefined &&
        face.id === exactFace.id &&
        sameStrings(face.vertexIds, exactFace.vertexIds) &&
        sameStrings(face.edgeIds, exactFace.edgeIds)
      );
    });
  const displayExteriorMatches =
    sameStrings(
      displayEnumeration.value.exteriorBoundary.vertexIds,
      enumerated.value.exteriorBoundary.vertexIds,
    ) &&
    sameStrings(
      displayEnumeration.value.exteriorBoundary.edgeIds,
      enumerated.value.exteriorBoundary.edgeIds,
    );
  if (!displayFacesMatch || !displayExteriorMatches) {
    return invariantFailure(
      'display projection enumerates different boundaries than exact topology',
    );
  }

  const vertexIndexById = new Map(vertices.map((vertex, index) => [vertex.id, index]));
  const indicesFor = (vertexIds: readonly string[]): number[] =>
    vertexIds.map((vertexId) => {
      const index = vertexIndexById.get(vertexId);
      if (index === undefined) throw new TypeError(`projection vertex is missing: ${vertexId}`);
      return index;
    });
  const foldProjection: CandidateFoldProjectionV1 = {
    file_spec: normalized.value.specVersion === '1.1' ? 1.1 : 1.2,
    file_creator: 'OriDesign M0F candidate reference',
    frame_classes: ['creasePattern'],
    vertices_coords: vertices.map((vertex) => vertex.displayCoordinate),
    edges_vertices: edges.map((edge) => {
      const indices = indicesFor(edge.vertexIds);
      const first = indices[0];
      const second = indices[1];
      if (first === undefined || second === undefined)
        throw new TypeError('edge projection is incomplete');
      return [first, second] as const;
    }),
    edges_assignment: edges.map((edge) => edge.assignment),
    faces_vertices: faces.map((face) => indicesFor(face.vertexIds)),
    _oridesign_m0f_candidate: {
      schemaVersion: 1,
      contractStatus: 'candidate',
      scientificClaim: false,
      conventionsId: M0F_CONVENTIONS_ID,
      exactCoordinateEncoding: EXACT_RATIONAL_JSON_ENCODING_ID,
      vertexIds: vertices.map((vertex) => vertex.id),
      edgeIds: edges.map((edge) => edge.id),
      faceIds: faces.map((face) => face.id),
      exactVerticesCoords: vertices.map((vertex) => vertex.exactCoordinate),
      sourceEdgeIdsByEdge: edges.map((edge) => edge.sourceEdges.map((source) => source.id)),
      trianglesVerticesByFace: faces.map((face) => ({
        faceId: face.id,
        triangleIds: face.triangles.map((triangle) => triangle.id),
        trianglesVertices: face.triangles.map((triangle) => {
          const indices = indicesFor(triangle.vertexIds);
          const first = indices[0];
          const second = indices[1];
          const third = indices[2];
          if (first === undefined || second === undefined || third === undefined) {
            throw new TypeError('triangle projection is incomplete');
          }
          return [first, second, third] as const;
        }),
      })),
    },
  };

  const triangleCount = faces.reduce((sum, face) => sum + face.triangles.length, 0);
  const createdIntersectionVertexCount = vertices.filter(
    (vertex) => vertex.sourceVertexIndex === null,
  ).length;
  const nonDyadicVertexCount = planarized.value.vertices.filter(
    (vertex) =>
      !isPowerOfTwo(vertex.point.x.denominator) || !isPowerOfTwo(vertex.point.y.denominator),
  ).length;

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      schemaId: FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID,
      recordType: 'm0f-fold-face-reconstruction',
      contractStatus: 'candidate',
      implementationRole: 'reference',
      scientificClaim: false,
      conventionsId: M0F_CONVENTIONS_ID,
      inputSpecVersion: normalized.value.specVersion,
      exactCoordinateEncoding: EXACT_RATIONAL_JSON_ENCODING_ID,
      vertices,
      edges,
      exteriorBoundary: {
        id: enumerated.value.exteriorBoundary.id,
        vertexIds: enumerated.value.exteriorBoundary.vertexIds,
        edgeIds: enumerated.value.exteriorBoundary.edgeIds,
        areaSign: 1,
      },
      faces,
      topology: {
        sourceVertexCount: normalized.value.vertices.length,
        sourceEdgeCount: normalized.value.edges.length,
        planarVertexCount: vertices.length,
        planarEdgeCount: edges.length,
        boundedFaceCount: faces.length,
        triangleCount,
        createdIntersectionVertexCount,
        nonDyadicVertexCount,
        eulerValue: 1,
      },
      foldProjection,
      limitations: [
        'candidate-reference-o-n-squared',
        'single-connected-disk-no-holes-or-bridges',
        'no-vertex-merge-tolerance-applied',
        'display-coordinates-are-not-topology-evidence',
        'candidate-stable-ids-not-frozen-for-product',
      ],
    }),
  };
}
