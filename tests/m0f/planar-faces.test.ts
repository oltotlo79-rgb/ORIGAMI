import { describe, expect, it } from 'vitest';

import {
  enumeratePlanarFaces,
  type PlanarFaceIssueCode,
  type PlanarGraphInput,
} from '../../m0f/geometry/planar-faces.js';

function squareWithDiagonal(): PlanarGraphInput {
  return {
    vertices: [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 2, y: 0 },
      { id: 'c', x: 2, y: 2 },
      { id: 'd', x: 0, y: 2 },
    ],
    edges: [
      { id: 'ab', vertices: ['a', 'b'] },
      { id: 'bc', vertices: ['b', 'c'] },
      { id: 'cd', vertices: ['c', 'd'] },
      { id: 'da', vertices: ['d', 'a'] },
      { id: 'ac', vertices: ['a', 'c'] },
    ],
  };
}

function requireValue(input: PlanarGraphInput) {
  const result = enumeratePlanarFaces(input);
  if (!result.ok) throw new Error(result.error.map((issue) => issue.code).join(', '));
  return result.value;
}

function expectIssue(input: unknown, code: PlanarFaceIssueCode): void {
  const result = enumeratePlanarFaces(input as PlanarGraphInput);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${code}`);
  expect(result.error.some((issue) => issue.code === code)).toBe(true);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
}

describe('M0F-3A candidate planar half-edge face enumeration', () => {
  it('returns one positive exterior and canonical negative bounded cycles in stored y-down coordinates', () => {
    const value = requireValue(squareWithDiagonal());

    expect(value).toEqual({
      claimStatus: 'candidate-only',
      exteriorBoundary: {
        id: 'candidate-exterior',
        vertexIds: ['a', 'b', 'c', 'd'],
        edgeIds: ['ab', 'bc', 'cd', 'da'],
        areaSign: 1,
      },
      boundedFaces: [
        {
          id: 'candidate-face:000001',
          vertexIds: ['a', 'c', 'b'],
          edgeIds: ['ac', 'bc', 'ab'],
          areaSign: -1,
        },
        {
          id: 'candidate-face:000002',
          vertexIds: ['a', 'd', 'c'],
          edgeIds: ['da', 'cd', 'ac'],
          areaSign: -1,
        },
      ],
      topology: {
        vertexCount: 4,
        edgeCount: 5,
        boundedFaceCount: 2,
        eulerValue: 1,
      },
    });
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.boundedFaces)).toBe(true);
    expect(Object.isFrozen(value.boundedFaces[0]?.vertexIds)).toBe(true);
  });

  it('is invariant to vertex/edge order and every undirected edge direction', () => {
    const original = squareWithDiagonal();
    const reordered: PlanarGraphInput = {
      vertices: [...original.vertices].reverse(),
      edges: [...original.edges]
        .reverse()
        .map((edge) => ({ id: edge.id, vertices: [edge.vertices[1], edge.vertices[0]] })),
    };

    expect(requireValue(reordered)).toEqual(requireValue(original));
  });

  it('uses exact binary64 topology even when every approximate area product underflows', () => {
    const unit = Number.MIN_VALUE;
    const value = requireValue({
      vertices: [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: unit, y: 0 },
        { id: 'c', x: unit, y: unit },
        { id: 'd', x: 0, y: unit },
      ],
      edges: [
        { id: 'ab', vertices: ['a', 'b'] },
        { id: 'bc', vertices: ['b', 'c'] },
        { id: 'cd', vertices: ['c', 'd'] },
        { id: 'da', vertices: ['d', 'a'] },
      ],
    });

    expect(value.exteriorBoundary.areaSign).toBe(1);
    expect(value.boundedFaces.map((face) => face.areaSign)).toEqual([-1]);
  });

  it('captures caller-owned arrays once and exposes only a deeply frozen result', () => {
    const mutable = squareWithDiagonal() as {
      vertices: { id: string; x: number; y: number }[];
      edges: { id: string; vertices: [string, string] }[];
    };
    const value = requireValue(mutable);
    const firstVertex = mutable.vertices[0];
    const firstEdge = mutable.edges[0];
    if (firstVertex === undefined || firstEdge === undefined)
      throw new Error('fixture is incomplete');
    firstVertex.id = 'changed';
    firstEdge.vertices.reverse();
    mutable.edges.length = 0;

    expect(value.exteriorBoundary.vertexIds).toEqual(['a', 'b', 'c', 'd']);
    expect(value.topology.edgeCount).toBe(5);
  });

  it('rejects malformed IDs, non-finite coordinates, duplicate coordinates, zero edges, and duplicate undirected edges', () => {
    expectIssue(
      {
        vertices: [
          { id: '1bad', x: 0, y: 0 },
          { id: 'b', x: Number.NaN, y: 0 },
          { id: 'c', x: 0, y: 0 },
        ],
        edges: [],
      },
      'invalid-id',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 1, y: 0 },
          { id: 'c', x: 0, y: 0 },
        ],
        edges: [],
      },
      'duplicate-coordinate',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 1, y: 0 },
          { id: 'c', x: 0, y: 1 },
        ],
        edges: [
          { id: 'zero', vertices: ['a', 'a'] },
          { id: 'first', vertices: ['a', 'b'] },
          { id: 'second', vertices: ['b', 'a'] },
        ],
      },
      'zero-length-edge',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 1, y: 0 },
          { id: 'c', x: 0, y: 1 },
        ],
        edges: [
          { id: 'first', vertices: ['a', 'b'] },
          { id: 'second', vertices: ['b', 'a'] },
        ],
      },
      'duplicate-edge',
    );
  });

  it('fails closed on an undeclared proper crossing', () => {
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 2, y: 0 },
          { id: 'c', x: 2, y: 2 },
          { id: 'd', x: 0, y: 2 },
        ],
        edges: [
          { id: 'ab', vertices: ['a', 'b'] },
          { id: 'bc', vertices: ['b', 'c'] },
          { id: 'cd', vertices: ['c', 'd'] },
          { id: 'da', vertices: ['d', 'a'] },
          { id: 'ac', vertices: ['a', 'c'] },
          { id: 'bd', vertices: ['b', 'd'] },
        ],
      },
      'proper-crossing',
    );
  });

  it('fails closed on undeclared T-junctions and collinear overlaps', () => {
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 2, y: 0 },
          { id: 'c', x: 2, y: 2 },
          { id: 'd', x: 0, y: 2 },
          { id: 'mid', x: 1, y: 0 },
          { id: 'inside', x: 1, y: 1 },
        ],
        edges: [
          { id: 'ab', vertices: ['a', 'b'] },
          { id: 'bc', vertices: ['b', 'c'] },
          { id: 'cd', vertices: ['c', 'd'] },
          { id: 'da', vertices: ['d', 'a'] },
          { id: 'stem', vertices: ['mid', 'inside'] },
        ],
      },
      't-junction',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 2, y: 0 },
          { id: 'c', x: 2, y: 2 },
          { id: 'd', x: 0, y: 2 },
          { id: 'mid', x: 1, y: 0 },
        ],
        edges: [
          { id: 'ab', vertices: ['a', 'b'] },
          { id: 'bc', vertices: ['b', 'c'] },
          { id: 'cd', vertices: ['c', 'd'] },
          { id: 'da', vertices: ['d', 'a'] },
          { id: 'partial', vertices: ['a', 'mid'] },
        ],
      },
      'collinear-overlap',
    );
  });

  it('rejects multiple components and bridge edges in the intentionally narrow first slice', () => {
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 1, y: 0 },
          { id: 'c', x: 0, y: 1 },
          { id: 'd', x: 3, y: 0 },
          { id: 'e', x: 4, y: 0 },
          { id: 'f', x: 3, y: 1 },
        ],
        edges: [
          { id: 'ab', vertices: ['a', 'b'] },
          { id: 'bc', vertices: ['b', 'c'] },
          { id: 'ca', vertices: ['c', 'a'] },
          { id: 'de', vertices: ['d', 'e'] },
          { id: 'ef', vertices: ['e', 'f'] },
          { id: 'fd', vertices: ['f', 'd'] },
        ],
      },
      'disconnected-graph',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 2, y: 0 },
          { id: 'c', x: 2, y: 2 },
          { id: 'd', x: 0, y: 2 },
          { id: 'tail', x: 3, y: 2 },
        ],
        edges: [
          { id: 'ab', vertices: ['a', 'b'] },
          { id: 'bc', vertices: ['b', 'c'] },
          { id: 'cd', vertices: ['c', 'd'] },
          { id: 'da', vertices: ['d', 'a'] },
          { id: 'tailEdge', vertices: ['c', 'tail'] },
        ],
      },
      'bridge-edge',
    );
  });

  it('rejects a non-simple exterior walk such as two cells touching at one articulation vertex', () => {
    expectIssue(
      {
        vertices: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 1, y: 0 },
          { id: 'shared', x: 1, y: 1 },
          { id: 'd', x: 0, y: 1 },
          { id: 'e', x: 2, y: 1 },
          { id: 'f', x: 2, y: 2 },
          { id: 'g', x: 1, y: 2 },
        ],
        edges: [
          { id: 'ab', vertices: ['a', 'b'] },
          { id: 'bs', vertices: ['b', 'shared'] },
          { id: 'sd', vertices: ['shared', 'd'] },
          { id: 'da', vertices: ['d', 'a'] },
          { id: 'se', vertices: ['shared', 'e'] },
          { id: 'ef', vertices: ['e', 'f'] },
          { id: 'fg', vertices: ['f', 'g'] },
          { id: 'gs', vertices: ['g', 'shared'] },
        ],
      },
      'non-cellular-embedding',
    );
  });

  it('rejects unknown fields and non-plain container inputs before topology work', () => {
    expectIssue({ ...squareWithDiagonal(), extra: true }, 'unknown-field');
    expectIssue(new Map([['vertices', []]]), 'invalid-input');
  });
});
