import { describe, expect, it } from 'vitest';

import {
  enumerateRationalPlanarFaces,
  type RationalPlanarFaceIssueCode,
  type RationalPlanarGraphInput,
} from '../../m0f/geometry/planar-rational-faces.js';
import {
  planarizeDyadicSegments,
  type SourceEdgeSegment2,
} from '../../m0f/geometry/planarize-segments.js';
import { exactRational, type ExactRationalPoint2 } from '../../m0f/model/exact-rational.js';

function point(x: bigint, y: bigint, denominator = 1n): ExactRationalPoint2 {
  return { x: exactRational(x, denominator), y: exactRational(y, denominator) };
}

function source(
  sourceEdgeId: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): SourceEdgeSegment2 {
  return { sourceEdgeId, start: { x: startX, y: startY }, end: { x: endX, y: endY } };
}

function requirePlanarization(segments: readonly SourceEdgeSegment2[]) {
  const result = planarizeDyadicSegments(segments);
  if (!result.ok) throw new Error(result.error.map((issue) => issue.code).join(', '));
  return result.value;
}

function requireFaces(input: RationalPlanarGraphInput) {
  const result = enumerateRationalPlanarFaces(input);
  if (!result.ok) throw new Error(result.error.map((issue) => issue.code).join(', '));
  return result.value;
}

function expectIssue(input: unknown, code: RationalPlanarFaceIssueCode): void {
  const result = enumerateRationalPlanarFaces(input as RationalPlanarGraphInput);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${code}`);
  expect(result.error.some((issue) => issue.code === code)).toBe(true);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.error)).toBe(true);
}

function rationalSquare(): RationalPlanarGraphInput {
  return {
    vertices: [
      { id: 'a', point: point(0n, 0n) },
      { id: 'b', point: point(2n, 0n) },
      { id: 'c', point: point(2n, 2n) },
      { id: 'd', point: point(0n, 2n) },
    ],
    edges: [
      { id: 'ab', startVertexId: 'a', endVertexId: 'b' },
      { id: 'bc', startVertexId: 'b', endVertexId: 'c' },
      { id: 'cd', startVertexId: 'c', endVertexId: 'd' },
      { id: 'da', startVertexId: 'd', endVertexId: 'a' },
    ],
  };
}

describe('M0F-3A exact-rational half-edge face enumeration', () => {
  it('accepts planarizer output directly and preserves a non-dyadic crossing topologically', () => {
    const planarized = requirePlanarization([
      source('top', 0, 0, 3, 0),
      source('right', 3, 0, 3, 2),
      source('bottom', 3, 2, 0, 2),
      source('left', 0, 2, 0, 0),
      source('diagonal', 0, 0, 3, 1),
      source('vertical', 1, 0, 1, 2),
    ]);
    const crossing = planarized.vertices.find(
      (vertex) =>
        vertex.point.x.numerator === 1n &&
        vertex.point.x.denominator === 1n &&
        vertex.point.y.numerator === 1n &&
        vertex.point.y.denominator === 3n,
    );
    expect(crossing).toBeDefined();

    const value = requireFaces(planarized);
    expect(value).toMatchObject({
      claimStatus: 'candidate-only',
      exactCoordinateDomain: 'normalized-bigint-rational',
      topology: {
        vertexCount: 8,
        edgeCount: 11,
        boundedFaceCount: 4,
        eulerValue: 1,
      },
    });
    expect(value.exteriorBoundary.areaSign).toBe(1);
    expect(value.boundedFaces.map((face) => face.areaSign)).toEqual([-1, -1, -1, -1]);
    expect(value.boundedFaces.some((face) => face.vertexIds.includes(crossing?.id ?? ''))).toBe(
      true,
    );
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.boundedFaces)).toBe(true);
    expect(Object.isFrozen(value.boundedFaces[0]?.vertexIds)).toBe(true);
  });

  it('canonicalizes cycles and is invariant to collection order and edge direction', () => {
    const original = rationalSquare();
    const transformed: RationalPlanarGraphInput = {
      vertices: [...original.vertices].reverse(),
      edges: [...original.edges].reverse().map((edge) => ({
        id: edge.id,
        startVertexId: edge.endVertexId,
        endVertexId: edge.startVertexId,
      })),
    };

    const expected = requireFaces(original);
    expect(requireFaces(transformed)).toEqual(expected);
    expect(expected.exteriorBoundary.vertexIds).toEqual(['a', 'b', 'c', 'd']);
    expect(expected.boundedFaces[0]?.vertexIds).toEqual(['a', 'd', 'c', 'b']);
  });

  it('captures accessor-backed BigInt input exactly once and returns owned output', () => {
    let pointReads = 0;
    const firstVertex: Record<string, unknown> = { id: 'a' };
    Object.defineProperty(firstVertex, 'point', {
      enumerable: true,
      get() {
        pointReads += 1;
        return pointReads === 1 ? point(0n, 0n) : point(100n, 100n);
      },
    });
    const square = rationalSquare();
    const input = { ...square, vertices: [firstVertex, ...square.vertices.slice(1)] };
    const value = requireFaces(input as RationalPlanarGraphInput);

    expect(pointReads).toBe(1);
    expect(value.boundedFaces[0]?.vertexIds).toEqual(['a', 'd', 'c', 'b']);
  });

  it('rejects invalid and non-normalized rational coordinates without decimal coercion', () => {
    const base = rationalSquare();
    const first = base.vertices[0];
    if (first === undefined) throw new Error('square fixture is incomplete');
    const invalidDenominator = {
      ...base,
      vertices: [
        { ...first, point: { ...first.point, x: { numerator: 0n, denominator: 0n } } },
        ...base.vertices.slice(1),
      ],
    };
    expectIssue(invalidDenominator, 'invalid-rational');

    const nonNormalized = {
      ...base,
      vertices: [
        { ...first, point: { ...first.point, x: { numerator: 2n, denominator: 2n } } },
        ...base.vertices.slice(1),
      ],
    };
    expectIssue(nonNormalized, 'non-normalized-rational');
  });

  it('rejects duplicate exact coordinates, IDs, missing references, zero edges, and duplicates', () => {
    expectIssue(
      {
        vertices: [
          { id: 'same', point: point(0n, 0n) },
          { id: 'same', point: point(1n, 0n) },
          { id: 'other', point: point(0n, 0n) },
        ],
        edges: [],
      },
      'duplicate-id',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(0n, 0n) },
          { id: 'c', point: point(0n, 1n) },
        ],
        edges: [],
      },
      'duplicate-coordinate',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(1n, 0n) },
          { id: 'c', point: point(0n, 1n) },
        ],
        edges: [
          { id: 'missing', startVertexId: 'a', endVertexId: 'z' },
          { id: 'zero', startVertexId: 'a', endVertexId: 'a' },
          { id: 'first', startVertexId: 'a', endVertexId: 'b' },
          { id: 'second', startVertexId: 'b', endVertexId: 'a' },
        ],
      },
      'missing-vertex',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(1n, 0n) },
          { id: 'c', point: point(0n, 1n) },
        ],
        edges: [
          { id: 'zero', startVertexId: 'a', endVertexId: 'a' },
          { id: 'first', startVertexId: 'a', endVertexId: 'b' },
          { id: 'second', startVertexId: 'b', endVertexId: 'a' },
        ],
      },
      'zero-length-edge',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(1n, 0n) },
          { id: 'c', point: point(0n, 1n) },
        ],
        edges: [
          { id: 'first', startVertexId: 'a', endVertexId: 'b' },
          { id: 'second', startVertexId: 'b', endVertexId: 'a' },
        ],
      },
      'duplicate-edge',
    );
  });

  it('fails closed on unsplit exact crossings, T-junctions, and overlaps', () => {
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(3n, 0n) },
          { id: 'c', point: point(3n, 2n) },
          { id: 'd', point: point(0n, 2n) },
        ],
        edges: [
          { id: 'ab', startVertexId: 'a', endVertexId: 'b' },
          { id: 'bc', startVertexId: 'b', endVertexId: 'c' },
          { id: 'cd', startVertexId: 'c', endVertexId: 'd' },
          { id: 'da', startVertexId: 'd', endVertexId: 'a' },
          { id: 'ac', startVertexId: 'a', endVertexId: 'c' },
          { id: 'bd', startVertexId: 'b', endVertexId: 'd' },
        ],
      },
      'proper-crossing',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(2n, 0n) },
          { id: 'mid', point: point(1n, 0n) },
          { id: 'stem', point: point(1n, 1n) },
        ],
        edges: [
          { id: 'trunk', startVertexId: 'a', endVertexId: 'b' },
          { id: 'branch', startVertexId: 'mid', endVertexId: 'stem' },
        ],
      },
      't-junction',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(2n, 0n) },
          { id: 'mid', point: point(1n, 0n) },
          { id: 'far', point: point(3n, 0n) },
        ],
        edges: [
          { id: 'first', startVertexId: 'a', endVertexId: 'b' },
          { id: 'second', startVertexId: 'mid', endVertexId: 'far' },
        ],
      },
      'collinear-overlap',
    );
  });

  it('rejects disconnected graphs, bridges, and non-simple exterior walks', () => {
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(1n, 0n) },
          { id: 'c', point: point(0n, 1n) },
          { id: 'd', point: point(3n, 0n) },
          { id: 'e', point: point(4n, 0n) },
          { id: 'f', point: point(3n, 1n) },
        ],
        edges: [
          { id: 'ab', startVertexId: 'a', endVertexId: 'b' },
          { id: 'bc', startVertexId: 'b', endVertexId: 'c' },
          { id: 'ca', startVertexId: 'c', endVertexId: 'a' },
          { id: 'de', startVertexId: 'd', endVertexId: 'e' },
          { id: 'ef', startVertexId: 'e', endVertexId: 'f' },
          { id: 'fd', startVertexId: 'f', endVertexId: 'd' },
        ],
      },
      'disconnected-graph',
    );
    const withTail = rationalSquare();
    expectIssue(
      {
        vertices: [...withTail.vertices, { id: 'tail', point: point(3n, 2n) }],
        edges: [...withTail.edges, { id: 'tailEdge', startVertexId: 'c', endVertexId: 'tail' }],
      },
      'bridge-edge',
    );
    expectIssue(
      {
        vertices: [
          { id: 'a', point: point(0n, 0n) },
          { id: 'b', point: point(1n, 0n) },
          { id: 'shared', point: point(1n, 1n) },
          { id: 'd', point: point(0n, 1n) },
          { id: 'e', point: point(2n, 1n) },
          { id: 'f', point: point(2n, 2n) },
          { id: 'g', point: point(1n, 2n) },
        ],
        edges: [
          { id: 'ab', startVertexId: 'a', endVertexId: 'b' },
          { id: 'bs', startVertexId: 'b', endVertexId: 'shared' },
          { id: 'sd', startVertexId: 'shared', endVertexId: 'd' },
          { id: 'da', startVertexId: 'd', endVertexId: 'a' },
          { id: 'se', startVertexId: 'shared', endVertexId: 'e' },
          { id: 'ef', startVertexId: 'e', endVertexId: 'f' },
          { id: 'fg', startVertexId: 'f', endVertexId: 'g' },
          { id: 'gs', startVertexId: 'g', endVertexId: 'shared' },
        ],
      },
      'non-cellular-embedding',
    );
  });

  it('rejects bad candidate metadata, unknown fields, and non-plain BigInt containers', () => {
    expectIssue({ ...rationalSquare(), scientificClaim: true }, 'invalid-input');
    expectIssue({ ...rationalSquare(), approximateCoordinates: [] }, 'unknown-field');
    expectIssue(new Map([['vertices', []]]), 'invalid-input');
  });
});
