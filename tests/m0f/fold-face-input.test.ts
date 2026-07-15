import { describe, expect, it } from 'vitest';

import { normalizeFoldFaceReconstructionInputV1 } from '../../m0f/geometry/fold-face-input.js';

function squareInput(): Record<string, unknown> {
  return {
    specVersion: '1.2',
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
  };
}

describe('normalizeFoldFaceReconstructionInputV1', () => {
  it('assigns stable topology IDs from coordinates and endpoint pairs', () => {
    const parsed = normalizeFoldFaceReconstructionInputV1(squareInput());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      specVersion: '1.2',
    });
    expect(parsed.value.vertices.map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: 'v:0', x: 0, y: 0 },
      { id: 'v:1', x: 0, y: 1 },
      { id: 'v:2', x: 1, y: 0 },
      { id: 'v:3', x: 1, y: 1 },
    ]);
    expect(parsed.value.edges.map((edge) => edge.vertices)).toEqual([
      ['v:0', 'v:1'],
      ['v:0', 'v:2'],
      ['v:1', 'v:3'],
      ['v:2', 'v:3'],
    ]);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.vertices[0])).toBe(true);
  });

  it('keeps topology IDs stable across FOLD array permutations and edge reversals', () => {
    const first = normalizeFoldFaceReconstructionInputV1(squareInput());
    const second = normalizeFoldFaceReconstructionInputV1({
      specVersion: '1.2',
      verticesCoords: [
        [0, 1],
        [1, 0],
        [0, 0],
        [1, 1],
      ],
      edgesVertices: [
        [3, 1],
        [2, 0],
        [0, 3],
        [1, 2],
      ],
      edgesAssignment: ['B', 'B', 'B', 'B'],
      facesVertices: null,
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.vertices.map(({ id, x, y }) => ({ id, x, y }))).toEqual(
      first.value.vertices.map(({ id, x, y }) => ({ id, x, y })),
    );
    expect(
      second.value.edges.map(({ id, vertices, assignment }) => ({ id, vertices, assignment })),
    ).toEqual(
      first.value.edges.map(({ id, vertices, assignment }) => ({ id, vertices, assignment })),
    );
  });

  it.each([
    ['a non-plain snapshot', new Map(), 'invalid-snapshot'],
    ['unknown fields', { ...squareInput(), fileFrames: [] }, 'unknown-field'],
    ['present faces', { ...squareInput(), facesVertices: [[0, 1, 2]] }, 'invalid-literal'],
    [
      'duplicate coordinates including signed zero',
      {
        ...squareInput(),
        verticesCoords: [
          [0, 0],
          [-0, 0],
          [1, 0],
          [0, 1],
        ],
      },
      'duplicate-coordinate',
    ],
    [
      'out-of-range edge indices',
      {
        ...squareInput(),
        edgesVertices: [
          [0, 3],
          [2, 0],
          [1, 9],
          [3, 1],
        ],
      },
      'invalid-index',
    ],
    [
      'self loops',
      {
        ...squareInput(),
        edgesVertices: [
          [0, 0],
          [2, 0],
          [1, 2],
          [3, 1],
        ],
      },
      'zero-length-edge',
    ],
    [
      'duplicate undirected edges',
      {
        ...squareInput(),
        edgesVertices: [
          [0, 3],
          [3, 0],
          [1, 2],
          [3, 1],
        ],
      },
      'duplicate-edge',
    ],
    [
      'unsupported C/J assignments',
      { ...squareInput(), edgesAssignment: ['C', 'B', 'B', 'B'] },
      'unsupported-assignment',
    ],
    [
      'isolated vertices',
      {
        ...squareInput(),
        edgesVertices: [
          [0, 2],
          [2, 1],
          [1, 0],
        ],
        edgesAssignment: ['B', 'B', 'B'],
      },
      'isolated-vertex',
    ],
  ])('rejects %s', (_label, input, code) => {
    const parsed = normalizeFoldFaceReconstructionInputV1(input);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.map((issue) => issue.code)).toContain(code);
  });

  it('takes one owned snapshot and breaks caller aliases', () => {
    const input = squareInput();
    const parsed = normalizeFoldFaceReconstructionInputV1(input);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const coordinate = (input.verticesCoords as number[][])[1];
    if (coordinate === undefined) throw new Error('fixture coordinate is missing');
    coordinate[0] = 99;
    expect(parsed.value.vertices[0]).toMatchObject({ x: 0, y: 0 });
  });
});
