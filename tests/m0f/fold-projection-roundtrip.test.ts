import { describe, expect, it } from 'vitest';

import {
  parseAndRoundtripCandidateFoldProjectionV1,
  type CandidateFoldProjectionRoundtripV1,
} from '../../m0f/geometry/fold-projection-roundtrip.js';
import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldProjectionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';

interface MutableRational {
  numerator: string;
  denominator: string;
  extra?: unknown;
}
interface MutablePoint {
  x: MutableRational;
  y: MutableRational;
}
interface MutableTriangleFace {
  faceId: string;
  triangleIds: string[];
  trianglesVertices: [number, number, number][];
}
interface MutableMetadata {
  schemaVersion: number;
  contractStatus: string;
  scientificClaim: boolean;
  conventionsId: string;
  exactCoordinateEncoding: string;
  vertexIds: string[];
  edgeIds: string[];
  faceIds: string[];
  exactVerticesCoords: MutablePoint[];
  sourceEdgeIdsByEdge: string[][];
  trianglesVerticesByFace: MutableTriangleFace[];
  extra?: unknown;
}
interface MutableProjection {
  file_spec: number;
  file_creator: string;
  frame_classes: string[];
  vertices_coords: [number, number][];
  edges_vertices: [number, number][];
  edges_assignment: string[];
  faces_vertices: number[][];
  _oridesign_m0f_candidate: MutableMetadata;
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

function projectionFor(input: unknown): CandidateFoldProjectionV1 {
  const reconstructed = reconstructFoldFacesCandidateV1(input);
  if (!reconstructed.ok) {
    throw new Error(reconstructed.error.map((entry) => entry.code).join(', '));
  }
  return reconstructed.value.foldProjection;
}

function mutableProjection(input: unknown = twoFaceInput()): MutableProjection {
  return structuredClone(projectionFor(input)) as unknown as MutableProjection;
}

function requireRoundtrip(input: unknown): CandidateFoldProjectionRoundtripV1 {
  const result = parseAndRoundtripCandidateFoldProjectionV1(input);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(', '));
  return result.value;
}

function expectIssue(input: unknown, code: string): void {
  const result = parseAndRoundtripCandidateFoldProjectionV1(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
}

describe('M0F candidate FOLD projection same-kernel roundtrip parser', () => {
  it('restores exact BigInt geometry and reproduces canonical faces and triangles', () => {
    const value = requireRoundtrip(projectionFor(twoFaceInput()));

    expect(value).toMatchObject({
      schemaVersion: 1,
      recordType: 'm0f-fold-projection-roundtrip',
      contractStatus: 'candidate',
      implementationRole: 'same-kernel-roundtrip-parser',
      scientificClaim: false,
      verificationIndependence: 'not-independent-same-exact-kernel',
      fileSpec: 1.2,
      numericProjectionAudit: {
        status: 'passed',
        topologyRole: 'projection-integrity-only',
      },
      topology: {
        vertexCount: 6,
        edgeCount: 7,
        boundedFaceCount: 2,
        triangleCount: 4,
        eulerValue: 1,
      },
    });
    expect(typeof value.exactGraph.vertices[0]?.point.x.numerator).toBe('bigint');
    expect(value.faces.map((face) => face.areaSign)).toEqual([-1, -1]);
    expect(value.faces.flatMap((face) => face.triangles)).toHaveLength(4);
    expect(
      value.numericProjectionAudit.boundedFaces.map((face) => ({
        id: face.id,
        vertexIds: face.vertexIds,
        edgeIds: face.edgeIds,
      })),
    ).toEqual(
      value.faces.map((face) => ({
        id: face.id,
        vertexIds: face.vertexIds,
        edgeIds: face.edgeIds,
      })),
    );
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.exactGraph.vertices[0]?.point)).toBe(true);
    expect(Object.isFrozen(value.faces[0]?.triangles)).toBe(true);
  });

  it('roundtrips a non-dyadic intersection without using its display approximation for topology', () => {
    const value = requireRoundtrip(projectionFor(nonDyadicInput()));
    const exactThird = value.exactGraph.vertices.find(
      (vertex) =>
        vertex.point.x.numerator === 1n &&
        vertex.point.x.denominator === 1n &&
        vertex.point.y.numerator === 1n &&
        vertex.point.y.denominator === 3n,
    );

    expect(exactThird).toBeDefined();
    expect(value.topology).toMatchObject({
      vertexCount: 8,
      edgeCount: 11,
      boundedFaceCount: 4,
      triangleCount: 7,
    });
  });

  it('rejects unknown fields at the projection, metadata, and rational levels', () => {
    const root = mutableProjection();
    root.extra = true;
    expectIssue(root, 'unknown-field');

    const metadata = mutableProjection();
    metadata._oridesign_m0f_candidate.extra = true;
    expectIssue(metadata, 'unknown-field');

    const rational = mutableProjection();
    const firstPoint = rational._oridesign_m0f_candidate.exactVerticesCoords[0];
    if (firstPoint === undefined) throw new Error('projection fixture has no exact point');
    firstPoint.x.extra = true;
    expectIssue(rational, 'unknown-field');
  });

  it('rejects literal and exact-rational metadata modification', () => {
    const stringVersion = mutableProjection() as unknown as Record<string, unknown>;
    stringVersion.file_spec = '1.2';
    expectIssue(stringVersion, 'invalid-literal');

    const literal = mutableProjection();
    literal._oridesign_m0f_candidate.exactCoordinateEncoding = 'approximate-v0';
    expectIssue(literal, 'invalid-literal');

    const normalized = mutableProjection();
    const firstPoint = normalized._oridesign_m0f_candidate.exactVerticesCoords[0];
    if (firstPoint === undefined) throw new Error('projection fixture has no exact point');
    firstPoint.x = { numerator: '2', denominator: '2' };
    expectIssue(normalized, 'non-normalized-rational');

    const changedExact = mutableProjection(nonDyadicInput());
    const crossing = changedExact._oridesign_m0f_candidate.exactVerticesCoords.find(
      (entry) => entry.y.numerator === '1' && entry.y.denominator === '3',
    );
    if (crossing === undefined) throw new Error('non-dyadic projection point is missing');
    crossing.y = { numerator: '2', denominator: '3' };
    expectIssue(changedExact, 'display-coordinate-mismatch');
  });

  it('rejects invalid edge indices and canonical face/index modification', () => {
    const invalidEdge = mutableProjection();
    const firstEdge = invalidEdge.edges_vertices[0];
    if (firstEdge === undefined) throw new Error('projection fixture has no edge');
    firstEdge[0] = 999;
    expectIssue(invalidEdge, 'invalid-index');

    const changedFace = mutableProjection();
    const firstFace = changedFace.faces_vertices[0];
    if (firstFace === undefined || firstFace.length < 2) {
      throw new Error('projection fixture has no complete face');
    }
    const firstIndex = firstFace[0];
    const secondIndex = firstFace[1];
    if (firstIndex === undefined || secondIndex === undefined) {
      throw new Error('projection face fixture has missing indices');
    }
    firstFace[0] = secondIndex;
    firstFace[1] = firstIndex;
    expectIssue(changedFace, 'face-roundtrip-mismatch');

    const changedFaceId = mutableProjection();
    changedFaceId._oridesign_m0f_candidate.faceIds[0] = 'candidate-face:999999';
    const firstTriangleFace = changedFaceId._oridesign_m0f_candidate.trianglesVerticesByFace[0];
    if (firstTriangleFace === undefined) throw new Error('triangle face fixture is missing');
    firstTriangleFace.faceId = 'candidate-face:999999';
    expectIssue(changedFaceId, 'face-roundtrip-mismatch');
  });

  it('rejects triangle ID and triangle index modification', () => {
    const changedId = mutableProjection();
    const firstFace = changedId._oridesign_m0f_candidate.trianglesVerticesByFace[0];
    const firstId = firstFace?.triangleIds[0];
    if (firstFace === undefined || firstId === undefined) {
      throw new Error('triangle ID fixture is missing');
    }
    firstFace.triangleIds[0] = `${firstId}:tampered`;
    expectIssue(changedId, 'triangle-roundtrip-mismatch');

    const changedIndices = mutableProjection();
    const firstTriangle =
      changedIndices._oridesign_m0f_candidate.trianglesVerticesByFace[0]?.trianglesVertices[0];
    if (firstTriangle === undefined) throw new Error('triangle index fixture is missing');
    [firstTriangle[0], firstTriangle[1]] = [firstTriangle[1], firstTriangle[0]];
    expectIssue(changedIndices, 'triangle-roundtrip-mismatch');
  });

  it('rejects display-coordinate modification independently of exact topology', () => {
    const changed = mutableProjection(nonDyadicInput());
    const firstDisplay = changed.vertices_coords[0];
    if (firstDisplay === undefined) throw new Error('display fixture is missing');
    firstDisplay[0] += 0.25;
    expectIssue(changed, 'display-coordinate-mismatch');
  });

  it('rejects a Number.MIN_VALUE/3 exact vertex whose numeric projection aliases zero', () => {
    const aliased = mutableProjection();
    const vertexIndex = aliased.vertices_coords.findIndex(([x, y]) => x === 0.5 && y === 0);
    if (vertexIndex < 0) throw new Error('alias fixture vertex is missing');
    const exactPoint = aliased._oridesign_m0f_candidate.exactVerticesCoords[vertexIndex];
    const displayPoint = aliased.vertices_coords[vertexIndex];
    if (exactPoint === undefined || displayPoint === undefined) {
      throw new Error('alias fixture coordinate is missing');
    }
    exactPoint.x = {
      numerator: '1',
      denominator: (3n * (1n << 1074n)).toString(),
    };
    displayPoint[0] = 0;

    expectIssue(aliased, 'numeric-projection-duplicate-coordinate');
  });

  it('validates assignments and source-edge provenance', () => {
    const assignment = mutableProjection();
    assignment.edges_assignment[0] = 'X';
    expectIssue(assignment, 'unsupported-assignment');

    const emptyProvenance = mutableProjection();
    emptyProvenance._oridesign_m0f_candidate.sourceEdgeIdsByEdge[0] = [];
    expectIssue(emptyProvenance, 'invalid-provenance');

    const conflict = mutableProjection(nonDyadicInput());
    const owners = new Map<string, number>();
    let duplicate: readonly [number, number] | undefined;
    conflict._oridesign_m0f_candidate.sourceEdgeIdsByEdge.forEach((ids, edgeIndex) => {
      for (const sourceId of ids) {
        const previous = owners.get(sourceId);
        if (previous === undefined) owners.set(sourceId, edgeIndex);
        else duplicate ??= [previous, edgeIndex];
      }
    });
    if (duplicate === undefined) throw new Error('split-edge provenance fixture is missing');
    const [firstIndex, secondIndex] = duplicate;
    const firstAssignment = conflict.edges_assignment[firstIndex];
    if (firstAssignment === undefined) throw new Error('source assignment fixture is missing');
    conflict.edges_assignment[secondIndex] = firstAssignment === 'M' ? 'V' : 'M';
    expectIssue(conflict, 'provenance-assignment-conflict');
  });

  it('binds B to one bounded face and M/V/F/U to two bounded faces', () => {
    const boundaryAsMountain = mutableProjection();
    const boundaryIndex = boundaryAsMountain.edges_assignment.findIndex(
      (assignment) => assignment === 'B',
    );
    if (boundaryIndex < 0) throw new Error('boundary assignment fixture is missing');
    boundaryAsMountain.edges_assignment[boundaryIndex] = 'M';
    expectIssue(boundaryAsMountain, 'assignment-incidence-mismatch');

    const interiorAsBoundary = mutableProjection();
    const interiorIndex = interiorAsBoundary.edges_assignment.findIndex(
      (assignment) => assignment === 'V',
    );
    if (interiorIndex < 0) throw new Error('interior assignment fixture is missing');
    interiorAsBoundary.edges_assignment[interiorIndex] = 'B';
    expectIssue(interiorAsBoundary, 'assignment-incidence-mismatch');
  });

  it('takes one getter-consistent JSON snapshot, rejects Map, and owns the result', () => {
    const accessor = mutableProjection();
    const display = accessor.vertices_coords;
    let reads = 0;
    Object.defineProperty(accessor, 'vertices_coords', {
      enumerable: true,
      configurable: true,
      get() {
        reads += 1;
        return reads === 1 ? display : [[99, 99]];
      },
    });
    const value = requireRoundtrip(accessor);
    expect(reads).toBe(1);

    display[0] = [99, 99];
    accessor.edges_vertices.length = 0;
    expect(value.exactGraph.vertices[0]?.displayCoordinate).toEqual([0, 0]);
    expect(value.topology.edgeCount).toBe(7);

    const map = mutableProjection() as unknown as Record<string, unknown>;
    map._oridesign_m0f_candidate = new Map([['schemaVersion', 1]]);
    expectIssue(map, 'invalid-snapshot');
  });
});
