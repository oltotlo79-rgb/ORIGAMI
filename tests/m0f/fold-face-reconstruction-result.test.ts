import { describe, expect, it } from 'vitest';

import {
  parseCandidateFoldFaceReconstructionV1,
  type CandidateFoldFaceReconstructionParseResult,
} from '../../m0f/geometry/fold-face-reconstruction-result.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';

interface MutableRational {
  numerator: string;
  denominator: string;
}

interface MutableVertex {
  id: string;
  exactCoordinate: { x: MutableRational; y: MutableRational };
  displayCoordinate: [number, number];
  sourceVertexIndex: number | null;
}

interface MutableSourceEdge {
  id: string;
  sourceEdgeIndex: number;
  assignment: string;
}

interface MutableEdge {
  id: string;
  vertexIds: [string, string];
  assignment: string;
  sourceEdges: MutableSourceEdge[];
}

interface MutableTriangle {
  id: string;
  faceId: string;
  vertexIds: [string, string, string];
  semanticVertexIds: [string, string, string];
}

interface MutableFace {
  id: string;
  vertexIds: string[];
  edgeIds: string[];
  areaSign: number;
  triangles: MutableTriangle[];
}

interface MutableProjection {
  file_spec: number;
  vertices_coords: [number, number][];
  edges_vertices: [number, number][];
  edges_assignment: string[];
}

interface MutableTopology {
  sourceVertexCount: number;
  sourceEdgeCount: number;
  planarVertexCount: number;
  planarEdgeCount: number;
  boundedFaceCount: number;
  triangleCount: number;
  createdIntersectionVertexCount: number;
  nonDyadicVertexCount: number;
  eulerValue: number;
}

interface MutableResult {
  schemaId: string;
  scientificClaim: boolean;
  inputSpecVersion: string;
  vertices: MutableVertex[];
  edges: MutableEdge[];
  faces: MutableFace[];
  topology: MutableTopology;
  foldProjection: MutableProjection;
  extra?: unknown;
}

function twoFaceInput(): Record<string, unknown> {
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

function nonDyadicInput(): Record<string, unknown> {
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

function reconstructed(input: unknown = twoFaceInput()): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(input);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function mutable(input: unknown = twoFaceInput()): MutableResult {
  return structuredClone(reconstructed(input)) as unknown as MutableResult;
}

function requireParsed(input: unknown): CandidateFoldFaceReconstructionV1 {
  const result = parseCandidateFoldFaceReconstructionV1(input);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function expectIssue(input: unknown, code: string): CandidateFoldFaceReconstructionParseResult {
  const result = parseCandidateFoldFaceReconstructionV1(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
  expect(
    result.error.every(
      (entry) =>
        entry.stage.length > 0 &&
        entry.path.startsWith('$') &&
        entry.code.length > 0 &&
        entry.message.length > 0,
    ),
  ).toBe(true);
  return result;
}

describe('candidate FOLD face reconstruction semantic result parser', () => {
  it('accepts one producer result, cuts aliases, and freezes the owned JSON result', () => {
    const caller = mutable(nonDyadicInput());
    const parsed = requireParsed(caller);
    expect(parsed).toMatchObject({
      contractStatus: 'candidate',
      implementationRole: 'reference',
      scientificClaim: false,
      topology: {
        planarVertexCount: 8,
        planarEdgeCount: 11,
        boundedFaceCount: 4,
        triangleCount: 7,
        nonDyadicVertexCount: 1,
      },
    });
    const before = JSON.stringify(parsed);
    caller.topology.planarVertexCount = 999;
    caller.vertices[0]?.displayCoordinate.splice(0, 2, 99, 99);
    expect(JSON.stringify(parsed)).toBe(before);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.vertices[0]?.exactCoordinate.x)).toBe(true);
    expect(Object.isFrozen(parsed.faces[0]?.triangles)).toBe(true);
  });

  it('rejects every previously schema-valid semantic mutation', () => {
    const fraction = mutable();
    const firstVertex = fraction.vertices[0];
    if (firstVertex === undefined) throw new Error('fixture vertex is missing');
    firstVertex.exactCoordinate.x = { numerator: '2', denominator: '4' };
    expectIssue(fraction, 'non-normalized-rational');

    const count = mutable();
    count.topology.planarVertexCount = 999;
    expectIssue(count, 'topology-mismatch');

    const selfLoop = mutable();
    const firstEdge = selfLoop.edges[0];
    if (firstEdge === undefined) throw new Error('fixture edge is missing');
    firstEdge.vertexIds[1] = firstEdge.vertexIds[0];
    expectIssue(selfLoop, 'duplicate-id');

    const spec = mutable();
    spec.inputSpecVersion = '1.1';
    expectIssue(spec, 'spec-version-mismatch');

    const display = mutable();
    const displayVertex = display.vertices[0];
    if (displayVertex === undefined) throw new Error('fixture display vertex is missing');
    displayVertex.displayCoordinate[0] = 999;
    expectIssue(display, 'display-coordinate-mismatch');

    const parallel = mutable();
    parallel.foldProjection.edges_vertices.pop();
    expectIssue(parallel, 'length-mismatch');
  });

  it('rejects root face and triangle mutations against exact re-enumeration', () => {
    const face = mutable();
    const firstFace = face.faces[0];
    if (firstFace === undefined || firstFace.vertexIds.length < 2) {
      throw new Error('fixture face is missing');
    }
    const firstId = firstFace.vertexIds[0];
    const secondId = firstFace.vertexIds[1];
    if (firstId === undefined || secondId === undefined) throw new Error('face ring is incomplete');
    firstFace.vertexIds[0] = secondId;
    firstFace.vertexIds[1] = firstId;
    expectIssue(face, 'face-mismatch');

    const triangle = mutable();
    const firstTriangle = triangle.faces[0]?.triangles[0];
    if (firstTriangle === undefined) throw new Error('fixture triangle is missing');
    firstTriangle.id = `${firstTriangle.id}:tampered`;
    expectIssue(triangle, 'triangle-mismatch');

    const parent = mutable();
    const parentTriangle = parent.faces[0]?.triangles[0];
    if (parentTriangle === undefined) throw new Error('fixture parent triangle is missing');
    parentTriangle.faceId = parent.faces[1]?.id ?? 'candidate-face:missing';
    expectIssue(parent, 'triangle-mismatch');
  });

  it('rejects source provenance and source-index mutations', () => {
    const provenance = mutable();
    const firstSource = provenance.edges[0]?.sourceEdges[0];
    if (firstSource === undefined) throw new Error('fixture provenance is missing');
    firstSource.id = 'e:tampered';
    expectIssue(provenance, 'edge-mismatch');

    const vertexIndex = mutable();
    const indexedVertices = vertexIndex.vertices.filter(
      (vertex): vertex is MutableVertex & { sourceVertexIndex: number } =>
        vertex.sourceVertexIndex !== null,
    );
    const firstIndexedVertex = indexedVertices[0];
    const secondIndexedVertex = indexedVertices[1];
    if (firstIndexedVertex === undefined || secondIndexedVertex === undefined) {
      throw new Error('fixture source vertices are missing');
    }
    secondIndexedVertex.sourceVertexIndex = firstIndexedVertex.sourceVertexIndex;
    expectIssue(vertexIndex, 'source-vertex-index-mismatch');

    const outOfRangeVertex = mutable();
    const outOfRange = outOfRangeVertex.vertices.find(
      (vertex) => vertex.sourceVertexIndex !== null,
    );
    if (outOfRange === undefined) throw new Error('fixture source vertex is missing');
    outOfRange.sourceVertexIndex = Number.MAX_SAFE_INTEGER;
    expectIssue(outOfRangeVertex, 'source-vertex-index-mismatch');

    const edgeIndex = mutable();
    const sourceById = new Map<string, MutableSourceEdge>();
    for (const edge of edgeIndex.edges) {
      for (const source of edge.sourceEdges) sourceById.set(source.id, source);
    }
    const distinctSources = [...sourceById.values()];
    const firstDistinct = distinctSources[0];
    const secondDistinct = distinctSources[1];
    if (firstDistinct === undefined || secondDistinct === undefined) {
      throw new Error('fixture source edges are missing');
    }
    for (const edge of edgeIndex.edges) {
      for (const source of edge.sourceEdges) {
        if (source.id === secondDistinct.id) source.sourceEdgeIndex = firstDistinct.sourceEdgeIndex;
      }
    }
    expectIssue(edgeIndex, 'source-edge-index-mismatch');

    const split = mutable(nonDyadicInput());
    const occurrences = new Map<string, MutableSourceEdge[]>();
    for (const edge of split.edges) {
      for (const source of edge.sourceEdges) {
        const entries = occurrences.get(source.id) ?? [];
        entries.push(source);
        occurrences.set(source.id, entries);
      }
    }
    const repeated = [...occurrences.values()].find((entries) => entries.length > 1);
    const changedOccurrence = repeated?.[1];
    if (changedOccurrence === undefined) throw new Error('split provenance fixture is missing');
    changedOccurrence.sourceEdgeIndex += 1_000;
    expectIssue(split, 'source-provenance-conflict');
  });

  it('rechecks B/non-B incidence even when root and projection assignments agree', () => {
    const changed = mutable();
    const boundaryIndex = changed.edges.findIndex((edge) => edge.assignment === 'B');
    const boundary = changed.edges[boundaryIndex];
    if (boundaryIndex < 0 || boundary === undefined) throw new Error('boundary edge is missing');
    boundary.assignment = 'M';
    boundary.sourceEdges.forEach((source) => {
      source.assignment = 'M';
    });
    changed.foldProjection.edges_assignment[boundaryIndex] = 'M';
    expectIssue(changed, 'assignment-incidence-mismatch');

    const projectionOnly = mutable();
    projectionOnly.foldProjection.edges_assignment[boundaryIndex] = 'M';
    expectIssue(projectionOnly, 'assignment-incidence-mismatch');
  });

  it('rejects claim, schema, unknown-field, Map, and throwing-getter inputs', () => {
    const claim = mutable();
    claim.scientificClaim = true;
    expectIssue(claim, 'invalid-literal');

    const schema = mutable();
    schema.schemaId = 'https://example.invalid/verified.schema.json';
    expectIssue(schema, 'invalid-literal');

    const unknown = mutable();
    unknown.extra = true;
    expectIssue(unknown, 'unknown-field');

    expectIssue(new Map([['contractStatus', 'candidate']]), 'invalid-snapshot');

    const getter = mutable() as unknown as Record<string, unknown>;
    Object.defineProperty(getter, 'scientificClaim', {
      configurable: true,
      enumerable: true,
      get(): never {
        throw new Error('getter must not escape the snapshot boundary');
      },
    });
    expectIssue(getter, 'invalid-snapshot');
  });
});
