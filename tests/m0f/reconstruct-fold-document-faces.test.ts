import { describe, expect, it } from 'vitest';

import { reconstructFoldDocumentFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-document-faces.js';

function nonDyadicFoldDocument(): Record<string, unknown> {
  return {
    file_spec: 1.2,
    file_creator: 'OriDesign test fixture',
    frame_classes: ['creasePattern'],
    frame_attributes: ['2D'],
    vertices_coords: [
      [0, 0],
      [1, 0],
      [3, 0],
      [3, 1],
      [3, 2],
      [1, 2],
      [0, 2],
    ],
    edges_vertices: [
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
    edges_assignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'V', 'M'],
  };
}

describe('candidate reconstruction from an external FOLD document', () => {
  it('adapts missing faces and preserves exact non-dyadic topology through output', () => {
    const result = reconstructFoldDocumentFacesCandidateV1(nonDyadicFoldDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      inputSpecVersion: '1.2',
      topology: {
        planarVertexCount: 8,
        planarEdgeCount: 11,
        boundedFaceCount: 4,
        triangleCount: 7,
        nonDyadicVertexCount: 1,
      },
      foldProjection: { file_spec: 1.2 },
    });
    expect(Object.isFrozen(result.value)).toBe(true);
  });

  it('reports external-document failures before entering planarization', () => {
    const document = nonDyadicFoldDocument();
    document.file_frames = [{}];
    const result = reconstructFoldDocumentFacesCandidateV1(document);
    expect(result).toMatchObject({
      ok: false,
      error: [
        {
          stage: 'fold-document',
          path: '$.file_frames',
          code: 'unsupported-file-frames',
        },
      ],
    });
    expect(Object.isFrozen(result)).toBe(true);
  });
});
