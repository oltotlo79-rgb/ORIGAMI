import { describe, expect, it } from 'vitest';

import {
  adaptFoldDocumentToFaceReconstructionInputV1,
  type FoldDocumentFaceAdapterIssueCode,
} from '../../m0f/geometry/fold-document-face-adapter.js';

function squareFoldDocument(): Record<string, unknown> {
  return {
    file_spec: 1.2,
    vertices_coords: [
      [1, 1],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    edges_vertices: [
      [0, 3],
      [2, 0],
      [1, 2],
      [3, 1],
    ],
    edges_assignment: ['B', 'B', 'B', 'B'],
  };
}

function expectFailure(
  input: unknown,
  code: FoldDocumentFaceAdapterIssueCode,
  path?: string,
): void {
  const result = adaptFoldDocumentToFaceReconstructionInputV1(input);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code, ...(path === undefined ? {} : { path }) }),
    ]),
  );
}

describe('adaptFoldDocumentToFaceReconstructionInputV1', () => {
  it('adapts numeric FOLD 1.1/1.2 versions and drops validated interchange metadata', () => {
    const result = adaptFoldDocumentToFaceReconstructionInputV1({
      ...squareFoldDocument(),
      file_spec: 1.1,
      file_creator: 'ORIGAMI',
      file_author: 'Example Author',
      file_title: 'Square',
      file_description: 'Metadata is not part of the geometry DTO.',
      file_classes: ['singleModel'],
      frame_author: 'Frame Author',
      frame_title: 'Crease pattern',
      frame_description: 'One top-level frame.',
      frame_classes: ['creasePattern'],
      frame_attributes: ['2D'],
      frame_unit: 'mm',
      file_frames: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      specVersion: '1.1',
      verticesCoords: [
        [1, 1],
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      edgesVertices: [
        [0, 3],
        [2, 0],
        [1, 2],
        [3, 1],
      ],
      edgesAssignment: ['B', 'B', 'B', 'B'],
      facesVertices: null,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.verticesCoords)).toBe(true);
    expect(Object.isFrozen(result.value.verticesCoords[0])).toBe(true);
  });

  it('requires file_spec to be the FOLD number rather than a version string', () => {
    expectFailure({ ...squareFoldDocument(), file_spec: '1.2' }, 'invalid-literal', '$.file_spec');
  });

  it.each([null, [], [[0, 1, 2]]])(
    'rejects faces_vertices whenever it is present (%j)',
    (facesVertices) => {
      expectFailure(
        { ...squareFoldDocument(), faces_vertices: facesVertices },
        'unsupported-faces-present',
        '$.faces_vertices',
      );
    },
  );

  it('accepts only an absent or empty file_frames array', () => {
    const empty = adaptFoldDocumentToFaceReconstructionInputV1({
      ...squareFoldDocument(),
      file_frames: [],
    });
    expect(empty.ok).toBe(true);

    expectFailure(
      { ...squareFoldDocument(), file_frames: [{}] },
      'unsupported-file-frames',
      '$.file_frames',
    );
    expectFailure({ ...squareFoldDocument(), file_frames: null }, 'invalid-array', '$.file_frames');
  });

  it('requires creasePattern and 2D when frame metadata is present', () => {
    expectFailure(
      { ...squareFoldDocument(), frame_classes: ['foldedForm'] },
      'unsupported-frame-class',
      '$.frame_classes',
    );
    expectFailure(
      { ...squareFoldDocument(), frame_attributes: [] },
      'unsupported-frame-attribute',
      '$.frame_attributes',
    );
  });

  it.each(['3D', 'abstract', 'nonManifold', 'nonOrientable', 'selfIntersecting', 'cuts', 'joins'])(
    'rejects the unsupported %s frame attribute',
    (attribute) => {
      expectFailure(
        { ...squareFoldDocument(), frame_attributes: ['2D', attribute] },
        'unsupported-frame-attribute',
        '$.frame_attributes[1]',
      );
    },
  );

  it('maps geometry-normalizer coordinate paths back to standard FOLD snake_case', () => {
    const document = squareFoldDocument();
    document.vertices_coords = [
      [1, 1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    expectFailure(document, 'invalid-coordinate', '$.vertices_coords[0]');
  });

  it.each(['C', 'J'])('rejects %s through the existing assignment normalizer', (assignment) => {
    expectFailure(
      { ...squareFoldDocument(), edges_assignment: [assignment, 'B', 'B', 'B'] },
      'unsupported-assignment',
      '$.edges_assignment[0]',
    );
  });

  it('rejects unknown fields and invalid known metadata types', () => {
    expectFailure(
      { ...squareFoldDocument(), edges_foldAngle: [0, 0, 0, 0] },
      'unknown-field',
      '$.edges_foldAngle',
    );
    expectFailure({ ...squareFoldDocument(), file_title: 42 }, 'invalid-metadata', '$.file_title');
    expectFailure(
      { ...squareFoldDocument(), frame_classes: 'creasePattern' },
      'invalid-metadata',
      '$.frame_classes',
    );
  });

  it('rejects Map, class, cyclic, and sparse inputs as invalid snapshots', () => {
    class FoldClass {
      file_spec = 1.2;
      vertices_coords = squareFoldDocument().vertices_coords;
      edges_vertices = squareFoldDocument().edges_vertices;
      edges_assignment = squareFoldDocument().edges_assignment;
    }

    const cyclic = squareFoldDocument();
    cyclic.self = cyclic;

    const sparse = squareFoldDocument();
    const sparseCoordinates = new Array<unknown>(4);
    sparseCoordinates[0] = [1, 1];
    sparseCoordinates[2] = [1, 0];
    sparseCoordinates[3] = [0, 1];
    sparse.vertices_coords = sparseCoordinates;

    for (const hostile of [new Map(), new FoldClass(), cyclic, sparse]) {
      expectFailure(hostile, 'invalid-snapshot', '$');
    }
  });

  it('reads accessor values exactly once while capturing the owned snapshot', () => {
    const document = squareFoldDocument();
    const coordinates = document.vertices_coords;
    let reads = 0;
    Object.defineProperty(document, 'vertices_coords', {
      configurable: true,
      enumerable: true,
      get() {
        reads += 1;
        return reads === 1 ? coordinates : null;
      },
    });

    const result = adaptFoldDocumentToFaceReconstructionInputV1(document);
    expect(result.ok).toBe(true);
    expect(reads).toBe(1);
  });

  it('fails closed when a snapshot getter throws', () => {
    const document = squareFoldDocument();
    Object.defineProperty(document, 'file_spec', {
      configurable: true,
      enumerable: true,
      get() {
        throw new Error('hostile getter');
      },
    });
    expectFailure(document, 'invalid-snapshot', '$');
  });

  it('breaks caller aliases before exposing the deeply frozen internal DTO', () => {
    const document = squareFoldDocument();
    const result = adaptFoldDocumentToFaceReconstructionInputV1(document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const sourceCoordinates = document.vertices_coords as number[][];
    const firstCoordinate = sourceCoordinates[0];
    if (firstCoordinate === undefined) throw new Error('fixture coordinate is missing');
    firstCoordinate[0] = 99;
    sourceCoordinates.push([8, 8]);

    expect(result.value.verticesCoords).toHaveLength(4);
    expect(result.value.verticesCoords[0]).toEqual([1, 1]);
  });
});
