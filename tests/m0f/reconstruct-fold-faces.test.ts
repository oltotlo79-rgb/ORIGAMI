import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  reconstructFoldFacesCandidateV1,
  type CandidateFoldFaceReconstructionV1,
} from '../../m0f/geometry/reconstruct-fold-faces.js';

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

function nonDyadicIntersectionInput(): Record<string, unknown> {
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

function requireReconstruction(input: unknown): CandidateFoldFaceReconstructionV1 {
  const result = reconstructFoldFacesCandidateV1(input);
  if (!result.ok) {
    throw new Error(result.error.map((issue) => `${issue.stage}:${issue.code}`).join(', '));
  }
  return result.value;
}

describe('M0F-3 candidate FOLD face reconstruction pipeline', () => {
  it('reconstructs faces_vertices and deterministic triangles for a two-face FOLD CP', () => {
    const result = requireReconstruction(twoFaceInput());
    expect(result).toMatchObject({
      schemaVersion: 1,
      recordType: 'm0f-fold-face-reconstruction',
      contractStatus: 'candidate',
      implementationRole: 'reference',
      scientificClaim: false,
      inputSpecVersion: '1.2',
      topology: {
        sourceVertexCount: 6,
        sourceEdgeCount: 7,
        planarVertexCount: 6,
        planarEdgeCount: 7,
        boundedFaceCount: 2,
        triangleCount: 4,
        createdIntersectionVertexCount: 0,
        nonDyadicVertexCount: 0,
        eulerValue: 1,
      },
    });
    expect(result.faces).toHaveLength(2);
    expect(result.faces.map((face) => face.areaSign)).toEqual([-1, -1]);
    expect(result.faces.every((face) => face.triangles.length === 2)).toBe(true);
    expect(result.foldProjection.faces_vertices).toHaveLength(2);
    expect(result.foldProjection.edges_assignment.filter((value) => value === 'V')).toHaveLength(1);
    expect(result.foldProjection._oridesign_m0f_candidate).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.foldProjection.faces_vertices)).toBe(true);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('keeps a non-dyadic crossing exact through planarization, faces, triangles, and metadata', () => {
    const result = requireReconstruction(nonDyadicIntersectionInput());
    expect(result.topology).toMatchObject({
      sourceVertexCount: 7,
      sourceEdgeCount: 9,
      planarVertexCount: 8,
      planarEdgeCount: 11,
      boundedFaceCount: 4,
      triangleCount: 7,
      createdIntersectionVertexCount: 1,
      nonDyadicVertexCount: 1,
    });
    const exactThird = result.vertices.find(
      (vertex) =>
        vertex.exactCoordinate.x.numerator === '1' &&
        vertex.exactCoordinate.x.denominator === '1' &&
        vertex.exactCoordinate.y.numerator === '1' &&
        vertex.exactCoordinate.y.denominator === '3',
    );
    expect(exactThird).toMatchObject({ sourceVertexIndex: null });
    expect(result.foldProjection._oridesign_m0f_candidate.exactVerticesCoords).toContainEqual(
      exactThird?.exactCoordinate,
    );
    expect(result.faces.flatMap((face) => face.triangles)).toHaveLength(7);
    expect(JSON.stringify(result)).toContain('"denominator":"3"');
  });

  it('keeps the FOLD projection stable across source array permutations and edge reversals', () => {
    const baseline = requireReconstruction(twoFaceInput());
    const permuted = requireReconstruction({
      specVersion: '1.2',
      verticesCoords: [
        [1, 1],
        [0, 1],
        [0.5, 1],
        [1, 0],
        [0, 0],
        [0.5, 0],
      ],
      edgesVertices: [
        [2, 5],
        [0, 2],
        [1, 2],
        [4, 1],
        [3, 0],
        [5, 3],
        [5, 4],
      ],
      edgesAssignment: ['V', 'B', 'B', 'B', 'B', 'B', 'B'],
      facesVertices: null,
    });
    expect(permuted.foldProjection).toEqual(baseline.foldProjection);
    expect(permuted.faces).toEqual(baseline.faces);
    expect(permuted.exteriorBoundary).toEqual(baseline.exteriorBoundary);
  });

  it.each([
    [
      'input',
      { ...twoFaceInput(), edgesAssignment: ['C', 'B', 'B', 'B', 'B', 'B', 'V'] },
      'unsupported-assignment',
    ],
    [
      'planarization',
      {
        specVersion: '1.2',
        verticesCoords: [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [1, 0],
        ],
        edgesVertices: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
          [0, 4],
        ],
        edgesAssignment: ['B', 'B', 'B', 'B', 'F'],
        facesVertices: null,
      },
      'collinear-overlap',
    ],
    [
      'face-enumeration',
      {
        specVersion: '1.2',
        verticesCoords: [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [3, 2],
        ],
        edgesVertices: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
          [2, 4],
        ],
        edgesAssignment: ['B', 'B', 'B', 'B', 'F'],
        facesVertices: null,
      },
      'bridge-edge',
    ],
    [
      'face-enumeration',
      { ...twoFaceInput(), edgesAssignment: ['M', 'M', 'M', 'M', 'M', 'M', 'V'] },
      'assignment-incidence-mismatch',
    ],
    [
      'face-enumeration',
      { ...twoFaceInput(), edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B'] },
      'assignment-incidence-mismatch',
    ],
  ])('reports fail-closed %s errors with their pipeline stage', (stage, input, code) => {
    const result = reconstructFoldFacesCandidateV1(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual(
      expect.arrayContaining([expect.objectContaining({ stage, code })]),
    );
    expect(Object.isFrozen(result.error)).toBe(true);
  });

  it('rejects a numeric FOLD projection when exact vertices alias after binary64 rounding', () => {
    const tiny = Number.MIN_VALUE;
    const result = reconstructFoldFacesCandidateV1({
      specVersion: '1.2',
      verticesCoords: [
        [0, 0],
        [1, 0],
        [3, 0],
        [3, tiny],
        [3, 2 * tiny],
        [1, 2 * tiny],
        [0, 2 * tiny],
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
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: 'fold-projection', code: 'display-duplicate-coordinate' }),
      ]),
    );
  });

  it('does not retain caller aliases', () => {
    const input = twoFaceInput();
    const result = requireReconstruction(input);
    const before = JSON.stringify(result);
    const coordinate = (input.verticesCoords as number[][])[0];
    if (coordinate === undefined) throw new Error('fixture coordinate is missing');
    coordinate[0] = 99;
    (input.edgesVertices as number[][]).length = 0;
    expect(JSON.stringify(result)).toBe(before);
  });

  it('strictly validates its closed candidate schema and excludes scientific claims', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/fold-face-reconstruction-result-v1.schema.json'), 'utf8'),
    ) as object;
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    const result = JSON.parse(
      JSON.stringify(requireReconstruction(nonDyadicIntersectionInput())),
    ) as Record<string, unknown> | undefined;
    expect(validate(result), JSON.stringify(validate.errors)).toBe(true);
    if (result === undefined) throw new Error('serialized result is missing');
    result.scientificClaim = true;
    expect(validate(result)).toBe(false);

    const stringVersion = JSON.parse(
      JSON.stringify(requireReconstruction(nonDyadicIntersectionInput())),
    ) as { foldProjection: { file_spec: unknown } };
    stringVersion.foldProjection.file_spec = '1.2';
    expect(validate(stringVersion)).toBe(false);
  });
});
