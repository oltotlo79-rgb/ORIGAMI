import { exactOrientationSign, exactPolygonAreaSign, type ExactSign } from './exact-dyadic.js';
import {
  M0F_CONVENTIONS_ID,
  type ReferenceAssignment,
  type ReferenceEdge,
  type ReferenceFace,
  type ReferenceModelV1,
  type ReferenceVertex,
} from './reference-model.js';

export type ConventionIssue = Readonly<{ path: string; code: string; message: string }>;
export type ConventionEvidence = Readonly<{
  conventionsId: typeof M0F_CONVENTIONS_ID;
  faceNormals: readonly Readonly<{ faceId: string; worldNormal: readonly [0, 0, 1] }>[];
  hingeAssignments: readonly Readonly<{
    edgeId: string;
    foldAngleSign: ExactSign;
    assignment: 'M' | 'V' | 'F';
  }>[];
  layerRelations: readonly Readonly<{
    overlapRegionId: string;
    aboveFaceId: string;
    belowFaceId: string;
  }>[];
}>;
export type ConventionEvaluationResult =
  | Readonly<{ ok: true; value: ConventionEvidence }>
  | Readonly<{ ok: false; error: readonly ConventionIssue[] }>;

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function addIssue(issues: ConventionIssue[], path: string, code: string, message: string): void {
  issues.push({ path, code, message });
}

function assignmentFromAngle(angle: number): 'M' | 'V' | 'F' {
  if (angle > 0) return 'V';
  if (angle < 0) return 'M';
  return 'F';
}

function signFromAngle(angle: number): ExactSign {
  return angle < 0 ? -1 : angle > 0 ? 1 : 0;
}

function faceSideOfEdge(
  edge: ReferenceEdge,
  face: ReferenceFace,
  vertices: ReadonlyMap<string, ReferenceVertex>,
): ExactSign | 'straddles' {
  const start = vertices.get(edge.vertices[0]);
  const end = vertices.get(edge.vertices[1]);
  if (start === undefined || end === undefined) return 0;
  let side: ExactSign = 0;
  for (const vertexId of face.vertices) {
    const vertex = vertices.get(vertexId);
    if (vertex === undefined) continue;
    const candidate = exactOrientationSign(start, end, vertex);
    if (candidate === 0) continue;
    if (side !== 0 && side !== candidate) return 'straddles';
    side = candidate;
  }
  return side;
}

function findLayerCycle(
  relations: readonly Readonly<{ above: string; below: string }>[],
): string[] | undefined {
  const adjacency = new Map<string, Set<string>>();
  for (const relation of relations) {
    const outgoing = adjacency.get(relation.above) ?? new Set<string>();
    outgoing.add(relation.below);
    adjacency.set(relation.above, outgoing);
    if (!adjacency.has(relation.below)) adjacency.set(relation.below, new Set());
  }
  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];

  const visit = (faceId: string): string[] | undefined => {
    if (state.get(faceId) === 'visited') return undefined;
    if (state.get(faceId) === 'visiting') {
      const start = stack.indexOf(faceId);
      return [...stack.slice(start), faceId];
    }
    state.set(faceId, 'visiting');
    stack.push(faceId);
    for (const below of adjacency.get(faceId) ?? []) {
      const cycle = visit(below);
      if (cycle !== undefined) return cycle;
    }
    stack.pop();
    state.set(faceId, 'visited');
    return undefined;
  };

  for (const faceId of [...adjacency.keys()].sort(compareCodeUnits)) {
    const cycle = visit(faceId);
    if (cycle !== undefined) return cycle;
  }
  return undefined;
}

/**
 * Evaluate only M0F-0 convention vectors. This is not a foldability verifier.
 * Stored paper coordinates map to world `(X, Y, Z) = (x, -y, z)`, so a
 * front-facing +Z polygon has a negative stored-coordinate signed area.
 */
export function evaluateConventionsV1(model: ReferenceModelV1): ConventionEvaluationResult {
  const issues: ConventionIssue[] = [];
  const vertices = new Map(model.vertices.map((vertex) => [vertex.id, vertex]));
  const faces = new Map(model.faces.map((face) => [face.id, face]));
  const edges = new Map(model.edges.map((edge) => [edge.id, edge]));

  const faceNormals = [...model.faces]
    .sort((left, right) => compareCodeUnits(left.id, right.id))
    .map((face, index) => {
      const points = face.vertices.map((vertexId) => vertices.get(vertexId));
      if (points.some((point) => point === undefined)) {
        addIssue(issues, `$.faces[${index}]`, 'missing-reference', 'face has a missing vertex');
      } else if (exactPolygonAreaSign(points as ReferenceVertex[]) !== -1) {
        addIssue(
          issues,
          `$.faces[${index}].vertices`,
          'face-winding',
          'front-facing canonical winding must have negative stored-coordinate area',
        );
      }
      return { faceId: face.id, worldNormal: [0, 0, 1] as const };
    });

  for (const [edgeIndex, edge] of model.edges.entries()) {
    const sideChecks: readonly Readonly<{
      faceId: string | null;
      expectedPaperSign: ExactSign;
      field: 'leftFaceId' | 'rightFaceId';
    }>[] = [
      { faceId: edge.leftFaceId, expectedPaperSign: -1, field: 'leftFaceId' },
      { faceId: edge.rightFaceId, expectedPaperSign: 1, field: 'rightFaceId' },
    ];
    for (const check of sideChecks) {
      if (check.faceId === null) continue;
      const face = faces.get(check.faceId);
      if (face === undefined) continue;
      const side = faceSideOfEdge(edge, face, vertices);
      if (side === 'straddles') {
        addIssue(
          issues,
          `$.edges[${edgeIndex}].${check.field}`,
          'face-straddles-edge',
          `face ${check.faceId} lies on both sides of oriented edge ${edge.id}`,
        );
      } else if (side !== check.expectedPaperSign) {
        addIssue(
          issues,
          `$.edges[${edgeIndex}].${check.field}`,
          'edge-face-side',
          `${check.field} does not match the world-space left/right convention`,
        );
      }
    }
  }

  const hingeAssignments = [...model.hingeSamples]
    .sort((left, right) => compareCodeUnits(left.edgeId, right.edgeId))
    .map((sample, index) => {
      const edge = edges.get(sample.edgeId);
      const expected = assignmentFromAngle(sample.foldAngleRadians);
      const actual: ReferenceAssignment | undefined = edge?.assignment;
      if (actual !== expected) {
        addIssue(
          issues,
          `$.hingeSamples[${index}].foldAngleRadians`,
          'mv-sign-mismatch',
          `angle sign implies ${expected}, but edge assignment is ${actual ?? 'missing'}`,
        );
      }
      return {
        edgeId: sample.edgeId,
        foldAngleSign: signFromAngle(sample.foldAngleRadians),
        assignment: expected,
      };
    });

  const layerRelations = [...model.overlapRegions]
    .sort((left, right) => compareCodeUnits(left.id, right.id))
    .map((region) => ({
      overlapRegionId: region.id,
      aboveFaceId: region.aboveFaceId,
      belowFaceId: region.belowFaceId,
    }));
  const cycle = findLayerCycle(
    layerRelations.map((relation) => ({
      above: relation.aboveFaceId,
      below: relation.belowFaceId,
    })),
  );
  if (cycle !== undefined) {
    addIssue(
      issues,
      '$.overlapRegions',
      'layer-cycle',
      `above/below relation contains a cycle: ${cycle.join(' -> ')}`,
    );
  }

  if (issues.length > 0) return { ok: false, error: issues };
  return {
    ok: true,
    value: {
      conventionsId: M0F_CONVENTIONS_ID,
      faceNormals,
      hingeAssignments,
      layerRelations,
    },
  };
}
