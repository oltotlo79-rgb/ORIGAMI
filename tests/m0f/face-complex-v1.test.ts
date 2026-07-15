import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  auditFaceComplexCandidateV1,
  type FaceComplexAuditResultV1,
} from '../../m0f/reference-verifier/face-complex-v1.js';

type JsonRecord = Record<string, unknown>;

function twoFaceInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 1],
      [0.5, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'V'],
    facesVertices: null,
  };
}

function nonDyadicIntersectionInput(): JsonRecord {
  return {
    specVersion: '1.1',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [3, 0],
      [3, 1],
      [3, 2],
      [1, 2],
      [0, 2],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 5],
      [0, 3],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function simpleSquareInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

function concaveBoundaryInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [3, 0],
      [3, 1],
      [1, 1],
      [1, 3],
      [0, 3],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

function collinearBoundaryInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B'],
    facesVertices: null,
  };
}

function concurrentCrossingsInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2],
      [0, 2],
      [0, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [1, 5],
      [7, 3],
      [0, 4],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M', 'F'],
    facesVertices: null,
  };
}

function tJunctionInput(): JsonRecord {
  return {
    specVersion: '1.2',
    verticesCoords: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2],
      [0, 2],
      [0, 1],
      [1, 1],
    ],
    edgesVertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [7, 3],
      [1, 8],
    ],
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
    facesVertices: null,
  };
}

function requireReconstruction(input: unknown): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(input);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function bundleFrom(input: JsonRecord): JsonRecord {
  const result = requireReconstruction(input);
  return structuredClone({
    schemaVersion: 1,
    recordType: 'm0f-face-complex-audit-input',
    contractStatus: 'candidate',
    scientificClaim: false,
    source: input,
    artifact: {
      inputSpecVersion: result.inputSpecVersion,
      exactCoordinateEncoding: result.exactCoordinateEncoding,
      vertices: result.vertices,
      edges: result.edges,
      exteriorBoundary: result.exteriorBoundary,
      faces: result.faces,
      topology: result.topology,
    },
  });
}

function record(value: unknown): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('test fixture entry must be an object');
  }
  return value as JsonRecord;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new TypeError('test fixture entry must be an array');
  return value;
}

function artifact(bundle: JsonRecord): JsonRecord {
  return record(bundle.artifact);
}

function expectRejected(
  bundle: JsonRecord,
  code?: string,
): Extract<FaceComplexAuditResultV1, { ok: false }> {
  const result = auditFaceComplexCandidateV1(bundle);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('mutated bundle must be rejected');
  expect(result.error).toHaveLength(1);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
  expect(Object.isFrozen(result.error[0])).toBe(true);
  if (code !== undefined) expect(result.error[0]?.code).toBe(code);
  return result;
}

function renameEveryId(bundle: JsonRecord): void {
  const candidate = artifact(bundle);
  const vertices = array(candidate.vertices).map(record);
  const edges = array(candidate.edges).map(record);
  const faces = array(candidate.faces).map(record);
  const vertexNames = new Map(
    vertices.map((vertex, index) => [String(vertex.id), `renamed-v-${vertices.length - index}`]),
  );
  const edgeNames = new Map(
    edges.map((edge, index) => [String(edge.id), `renamed-e-${edges.length - index}`]),
  );
  const faceNames = new Map(
    faces.map((face, index) => [String(face.id), `renamed-f-${faces.length - index}`]),
  );
  const provenanceNames = new Map<string, string>();
  for (const vertex of vertices) vertex.id = vertexNames.get(String(vertex.id));
  for (const edge of edges) {
    edge.id = edgeNames.get(String(edge.id));
    edge.vertexIds = array(edge.vertexIds).map((id) => vertexNames.get(String(id)));
    for (const source of array(edge.sourceEdges).map(record)) {
      const old = String(source.id);
      const renamed = provenanceNames.get(old) ?? `renamed-source-${provenanceNames.size}`;
      provenanceNames.set(old, renamed);
      source.id = renamed;
    }
  }
  const exterior = record(candidate.exteriorBoundary);
  exterior.id = 'renamed-exterior';
  exterior.vertexIds = array(exterior.vertexIds).map((id) => vertexNames.get(String(id)));
  exterior.edgeIds = array(exterior.edgeIds).map((id) => edgeNames.get(String(id)));
  for (const face of faces) {
    const oldFaceId = String(face.id);
    face.id = faceNames.get(oldFaceId);
    face.vertexIds = array(face.vertexIds).map((id) => vertexNames.get(String(id)));
    face.edgeIds = array(face.edgeIds).map((id) => edgeNames.get(String(id)));
    for (const [index, triangle] of array(face.triangles).map(record).entries()) {
      triangle.id = `renamed-triangle-${oldFaceId}-${index}`;
      triangle.faceId = faceNames.get(String(triangle.faceId));
      triangle.vertexIds = array(triangle.vertexIds).map((id) => vertexNames.get(String(id)));
      triangle.semanticVertexIds = array(triangle.semanticVertexIds).map((id) =>
        vertexNames.get(String(id)),
      );
    }
  }
}

function appendConsistentIntegerVertex(
  bundle: JsonRecord,
  id: string,
  x: number,
  y: number,
): number {
  const source = record(bundle.source);
  const candidate = artifact(bundle);
  const sourceIndex = array(source.verticesCoords).length;
  array(source.verticesCoords).push([x, y]);
  array(candidate.vertices).push({
    id,
    exactCoordinate: {
      x: { numerator: String(x), denominator: '1' },
      y: { numerator: String(y), denominator: '1' },
    },
    displayCoordinate: [x, y],
    sourceVertexIndex: sourceIndex,
  });
  const topology = record(candidate.topology);
  topology.sourceVertexCount = Number(topology.sourceVertexCount) + 1;
  topology.planarVertexCount = Number(topology.planarVertexCount) + 1;
  return sourceIndex;
}

function artifactVertexIdForSource(bundle: JsonRecord, sourceIndex: number): string {
  const vertex = array(artifact(bundle).vertices)
    .map(record)
    .find((entry) => entry.sourceVertexIndex === sourceIndex);
  if (vertex === undefined) throw new Error('source-mapped artifact vertex is missing');
  return String(vertex.id);
}

function appendConsistentEdge(
  bundle: JsonRecord,
  id: string,
  firstSourceIndex: number,
  secondSourceIndex: number,
  assignment: 'U',
): void {
  const source = record(bundle.source);
  const candidate = artifact(bundle);
  const sourceEdgeIndex = array(source.edgesVertices).length;
  array(source.edgesVertices).push([firstSourceIndex, secondSourceIndex]);
  array(source.edgesAssignment).push(assignment);
  array(candidate.edges).push({
    id,
    vertexIds: [
      artifactVertexIdForSource(bundle, firstSourceIndex),
      artifactVertexIdForSource(bundle, secondSourceIndex),
    ],
    assignment,
    sourceEdges: [
      {
        id: `${id}-source`,
        sourceEdgeIndex,
        assignment,
      },
    ],
  });
  const topology = record(candidate.topology);
  topology.sourceEdgeCount = Number(topology.sourceEdgeCount) + 1;
  topology.planarEdgeCount = Number(topology.planarEdgeCount) + 1;
}

describe('candidate independent face-complex audit', () => {
  it.each([
    ['two-face', twoFaceInput],
    ['non-dyadic intersection', nonDyadicIntersectionInput],
    ['concave boundary', concaveBoundaryInput],
    ['collinear boundary', collinearBoundaryInput],
    ['three concurrent crossings', concurrentCrossingsInput],
    ['T-junction subdivision', tJunctionInput],
  ])('accepts the independently recomputed %s complex', (_name, input) => {
    const caller = bundleFrom(input());
    const result = auditFaceComplexCandidateV1(caller);
    expect(result).toEqual({
      ok: true,
      value: {
        schemaVersion: 1,
        recordType: 'm0f-face-complex-audit-result',
        contractStatus: 'candidate',
        scientificClaim: false,
        scope: 'face-complex-only',
        implementationRole: 'independent-auditor',
        verificationIndependence: 'separate-projective-kernel-not-full-reference-verifier',
        auditOutcome: 'consistent',
        topology: artifact(caller).topology,
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new Error('valid fixture must pass');
    expect(Object.isFrozen(result.value)).toBe(true);

    record(array(artifact(caller).vertices)[0]).id = 'caller-mutated';
    expect(result.value.auditOutcome).toBe('consistent');
  });

  it('accepts a pure, consistent rename without trusting producer naming rules', () => {
    const bundle = bundleFrom(nonDyadicIntersectionInput());
    renameEveryId(bundle);
    expect(auditFaceComplexCandidateV1(bundle)).toMatchObject({
      ok: true,
      value: { auditOutcome: 'consistent' },
    });
  });

  it('ignores finite display-only coordinate changes at the exact audit boundary', () => {
    const bundle = bundleFrom(concurrentCrossingsInput());
    for (const [index, vertex] of array(artifact(bundle).vertices).map(record).entries()) {
      vertex.displayCoordinate = [1e100 + index, -1e100 - index];
    }
    expect(auditFaceComplexCandidateV1(bundle)).toMatchObject({
      ok: true,
      value: { scope: 'face-complex-only', scientificClaim: false },
    });
  });

  it('rejects a provenance-consistent assignment rewrite by bounded-face incidence', () => {
    const bundle = bundleFrom(twoFaceInput());
    array(record(bundle.source).edgesAssignment)[6] = 'B';
    for (const edge of array(artifact(bundle).edges).map(record)) {
      const matching = array(edge.sourceEdges)
        .map(record)
        .filter((entry) => entry.sourceEdgeIndex === 6);
      if (matching.length === 0) continue;
      edge.assignment = 'B';
      for (const provenance of matching) provenance.assignment = 'B';
    }
    expectRejected(bundle, 'assignment-incidence-invalid');
  });

  it('rejects a consistently represented bridge and a disconnected component', () => {
    const bridge = bundleFrom(simpleSquareInput());
    const bridgeEnd = appendConsistentIntegerVertex(bridge, 'audit-bridge-v', 1, 1);
    appendConsistentEdge(bridge, 'audit-bridge-e', 0, bridgeEnd, 'U');
    expectRejected(bridge, 'dart-traversal-invalid');

    const disconnected = bundleFrom(simpleSquareInput());
    const first = appendConsistentIntegerVertex(disconnected, 'audit-component-v1', 3, 0);
    const second = appendConsistentIntegerVertex(disconnected, 'audit-component-v2', 4, 0);
    appendConsistentEdge(disconnected, 'audit-component-e', first, second, 'U');
    expectRejected(disconnected, 'artifact-graph-disconnected');
  });

  it('rejects independently mutated source and artifact exact coordinates', () => {
    const sourceMutation = bundleFrom(twoFaceInput());
    array(array(record(sourceMutation.source).verticesCoords)[0])[0] = -1;
    expectRejected(sourceMutation);

    const artifactMutation = bundleFrom(twoFaceInput());
    const coordinate = record(
      record(array(artifact(artifactMutation).vertices)[0]).exactCoordinate,
    );
    record(coordinate.x).numerator = '-1';
    expectRejected(artifactMutation, 'artifact-coordinate-surplus');
  });

  it('rejects missing, surplus, and provenance-mutated planar edges', () => {
    const missing = bundleFrom(twoFaceInput());
    array(artifact(missing).edges).pop();
    record(artifact(missing).topology).planarEdgeCount = array(artifact(missing).edges).length;
    expectRejected(missing, 'artifact-edge-missing');

    const surplus = bundleFrom(twoFaceInput());
    const firstEdge = structuredClone(array(artifact(surplus).edges)[0]);
    const extra = record(firstEdge);
    extra.id = 'surplus-edge';
    extra.vertexIds = [
      record(array(artifact(surplus).vertices)[0]).id,
      record(array(artifact(surplus).vertices).at(-1)).id,
    ];
    array(artifact(surplus).edges).push(extra);
    expectRejected(surplus, 'artifact-edge-surplus');

    const provenance = bundleFrom(twoFaceInput());
    record(array(record(array(artifact(provenance).edges)[0]).sourceEdges)[0]).sourceEdgeIndex = 6;
    expectRejected(provenance, 'artifact-edge-provenance-invalid');
  });

  it('rejects assignment incidence and candidate face/exterior mutations', () => {
    const assignment = bundleFrom(twoFaceInput());
    const internal = array(artifact(assignment).edges)
      .map(record)
      .find((edge) => edge.assignment === 'V');
    if (internal === undefined) throw new Error('fixture internal edge is missing');
    internal.assignment = 'B';
    expectRejected(assignment, 'artifact-edge-assignment-invalid');

    const face = bundleFrom(twoFaceInput());
    array(record(array(artifact(face).faces)[0]).vertexIds).reverse();
    array(record(array(artifact(face).faces)[0]).edgeIds).reverse();
    expectRejected(face);

    const exterior = bundleFrom(twoFaceInput());
    array(record(artifact(exterior).exteriorBoundary).vertexIds).reverse();
    array(record(artifact(exterior).exteriorBoundary).edgeIds).reverse();
    expectRejected(exterior, 'boundary-edge-alignment-invalid');
  });

  it('rejects triangle reference, topology, and exact triangulation mutations', () => {
    const reference = bundleFrom(twoFaceInput());
    record(array(record(array(artifact(reference).faces)[0]).triangles)[0]).faceId = 'wrong-face';
    expectRejected(reference, 'triangle-reference-invalid');

    const winding = bundleFrom(twoFaceInput());
    array(
      record(array(record(array(artifact(winding).faces)[0]).triangles)[0]).vertexIds,
    ).reverse();
    expectRejected(winding, 'triangle-winding-invalid');

    const count = bundleFrom(twoFaceInput());
    record(artifact(count).topology).triangleCount = 999;
    expectRejected(count, 'topology-counter-invalid');
  });

  it('rejects duplicate semantic IDs instead of mistaking membership for set equality', () => {
    const bundle = bundleFrom(simpleSquareInput());
    const triangle = record(array(record(array(artifact(bundle).faces)[0]).triangles)[0]);
    const vertexIds = array(triangle.vertexIds);
    triangle.semanticVertexIds = [vertexIds[0], vertexIds[0], vertexIds[1]];
    expectRejected(bundle, 'triangle-semantic-ids-invalid');
  });

  it('rejects exact-area and edge-incidence triangulation forgeries', () => {
    const wrongArea = bundleFrom(concaveBoundaryInput());
    const concaveTriangles = array(record(array(artifact(wrongArea).faces)[0]).triangles);
    const firstConcaveTriangle = record(concaveTriangles[0]);
    for (let index = 1; index < concaveTriangles.length; index += 1) {
      concaveTriangles[index] = {
        ...structuredClone(firstConcaveTriangle),
        id: `forged-area-triangle-${index}`,
      };
    }
    expectRejected(wrongArea, 'triangle-area-invalid');

    const wrongIncidence = bundleFrom(simpleSquareInput());
    const squareTriangles = array(record(array(artifact(wrongIncidence).faces)[0]).triangles);
    squareTriangles[1] = {
      ...structuredClone(record(squareTriangles[0])),
      id: 'forged-incidence-triangle',
    };
    expectRejected(wrongIncidence, 'triangle-edge-incidence-invalid');
  });

  it('supports a source collection permutation when all semantic references follow it', () => {
    const input = twoFaceInput();
    const vertices = array(input.verticesCoords);
    const permutation = [3, 5, 4, 2, 0, 1];
    const oldToNew = new Map(permutation.map((oldIndex, newIndex) => [oldIndex, newIndex]));
    input.verticesCoords = permutation.map((index) => vertices[index]);
    input.edgesVertices = array(input.edgesVertices)
      .map((entry) => array(entry).map((index) => oldToNew.get(Number(index))))
      .reverse();
    input.edgesAssignment = array(input.edgesAssignment).reverse();
    const result = auditFaceComplexCandidateV1(bundleFrom(input));
    expect(result).toMatchObject({ ok: true, value: { auditOutcome: 'consistent' } });
  });

  it('contains an unexpected parser failure behind one fixed audit error', () => {
    const bundle = bundleFrom(simpleSquareInput());
    const originalKeys = Object.keys;
    Object.keys = () => {
      throw new Error('injected host detail');
    };
    let result: FaceComplexAuditResultV1;
    try {
      result = auditFaceComplexCandidateV1(bundle);
    } finally {
      Object.keys = originalKeys;
    }
    expect(result).toEqual({
      ok: false,
      error: [
        {
          stage: 'audit-internal',
          path: '$',
          code: 'unexpected-audit-failure',
          message: 'face-complex audit failed closed because of an unexpected internal condition',
        },
      ],
    });
  });

  it('keeps the independent implementation behind the documented import boundary', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'm0f/reference-verifier/face-complex-v1.ts'),
      'utf8',
    );
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    expect(imports).toEqual(
      expect.arrayContaining([
        '../clone-and-freeze.js',
        './face-complex-contract.js',
        './projective-rational.js',
      ]),
    );
    expect(imports).toHaveLength(3);
    expect(source).not.toMatch(/from\s+['"]\.\.\/(?:geometry|model|experiments)\//);
  });
});
