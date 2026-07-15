import { deepFreezeOwned } from '../clone-and-freeze.js';
import { normalizeFoldFaceReconstructionInputV1 } from './fold-face-input.js';
import { parseCandidateFoldFaceReconstructionV1 } from './fold-face-reconstruction-result.js';
import {
  FACE_COMPLEX_AUDIT_RECORD_TYPE,
  parseFaceComplexAuditInputV1,
  type FaceComplexAuditInputV1,
} from '../reference-verifier/face-complex-contract.js';

export type PrepareFaceComplexAuditInputIssueV1 = Readonly<{
  stage: 'source' | 'artifact' | 'bundle';
  path: string;
  code: string;
  message: string;
}>;

export type PrepareFaceComplexAuditInputResultV1 =
  | Readonly<{ ok: true; value: FaceComplexAuditInputV1 }>
  | Readonly<{ ok: false; error: readonly PrepareFaceComplexAuditInputIssueV1[] }>;

function failure(
  error: readonly PrepareFaceComplexAuditInputIssueV1[],
): PrepareFaceComplexAuditInputResultV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

/**
 * Builds the compact serialized input consumed by the separate face audit.
 *
 * This is only a producer-side convenience adapter. It is intentionally kept
 * outside the audit implementation and its output is fully re-parsed and
 * recomputed by that implementation; passing this function is not evidence.
 */
export function prepareFaceComplexAuditInputV1(
  source: unknown,
  artifact: unknown,
): PrepareFaceComplexAuditInputResultV1 {
  const normalizedSource = normalizeFoldFaceReconstructionInputV1(source);
  if (!normalizedSource.ok) {
    return failure(
      normalizedSource.error.map((entry) => ({
        stage: 'source' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
      })),
    );
  }

  const parsedArtifact = parseCandidateFoldFaceReconstructionV1(artifact);
  if (!parsedArtifact.ok) {
    return failure(
      parsedArtifact.error.map((entry) => ({
        stage: 'artifact' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
      })),
    );
  }

  const sourceVertexIndexById = new Map(
    normalizedSource.value.vertices.map((vertex) => [vertex.id, vertex.sourceVertexIndex]),
  );
  const verticesCoords: [number, number][] = Array.from(
    { length: normalizedSource.value.vertices.length },
    () => [0, 0],
  );
  for (const vertex of normalizedSource.value.vertices) {
    verticesCoords[vertex.sourceVertexIndex] = [vertex.x, vertex.y];
  }

  const edgesVertices: [number, number][] = Array.from(
    { length: normalizedSource.value.edges.length },
    () => [0, 0],
  );
  const edgesAssignment = Array.from(
    { length: normalizedSource.value.edges.length },
    () => normalizedSource.value.edges[0]?.assignment ?? ('U' as const),
  );
  for (const edge of normalizedSource.value.edges) {
    const first = sourceVertexIndexById.get(edge.vertices[0]);
    const second = sourceVertexIndexById.get(edge.vertices[1]);
    if (first === undefined || second === undefined) {
      return failure([
        {
          stage: 'source',
          path: '$.edgesVertices',
          code: 'normalization-invariant-failed',
          message: 'normalized source edge endpoint is missing',
        },
      ]);
    }
    edgesVertices[edge.sourceEdgeIndex] = [first, second];
    edgesAssignment[edge.sourceEdgeIndex] = edge.assignment;
  }

  const candidate = parsedArtifact.value;
  const parsedBundle = parseFaceComplexAuditInputV1({
    schemaVersion: 1,
    recordType: FACE_COMPLEX_AUDIT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source: {
      specVersion: normalizedSource.value.specVersion,
      verticesCoords,
      edgesVertices,
      edgesAssignment,
      facesVertices: null,
    },
    artifact: {
      inputSpecVersion: candidate.inputSpecVersion,
      exactCoordinateEncoding: candidate.exactCoordinateEncoding,
      vertices: candidate.vertices,
      edges: candidate.edges,
      exteriorBoundary: candidate.exteriorBoundary,
      faces: candidate.faces,
      topology: candidate.topology,
    },
  });
  if (!parsedBundle.ok) {
    return failure(
      parsedBundle.error.map((entry) => ({
        stage: 'bundle' as const,
        path: entry.path,
        code: entry.code,
        message: entry.message,
      })),
    );
  }
  return deepFreezeOwned({ ok: true as const, value: parsedBundle.value });
}
