import { describe, expect, it } from 'vitest';

import {
  type FoldFaceReconstructionAssignment,
  type FoldFaceReconstructionInputV1,
} from '../../m0f/geometry/fold-face-input.js';
import { prepareFaceComplexAuditInputV1 } from '../../m0f/geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';
import { auditFaceComplexCandidateV1 } from '../../m0f/reference-verifier/face-complex-v1.js';

function segmentedGrid(columns: number, rows: number): FoldFaceReconstructionInputV1 {
  const verticesCoords: [number, number][] = [];
  for (let y = 0; y <= rows; y += 1) {
    for (let x = 0; x <= columns; x += 1) verticesCoords.push([x, y]);
  }
  const index = (x: number, y: number): number => y * (columns + 1) + x;
  const edgesVertices: [number, number][] = [];
  const edgesAssignment: FoldFaceReconstructionAssignment[] = [];
  for (let y = 0; y <= rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      edgesVertices.push([index(x, y), index(x + 1, y)]);
      edgesAssignment.push(y === 0 || y === rows ? 'B' : y % 2 === 0 ? 'M' : 'V');
    }
  }
  for (let x = 0; x <= columns; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      edgesVertices.push([index(x, y), index(x, y + 1)]);
      edgesAssignment.push(x === 0 || x === columns ? 'B' : x % 2 === 0 ? 'V' : 'M');
    }
  }
  return {
    specVersion: '1.2',
    verticesCoords,
    edgesVertices,
    edgesAssignment,
    facesVertices: null,
  };
}

function unsplitLineGrid(
  verticalLineCount: number,
  horizontalLineCount: number,
): FoldFaceReconstructionInputV1 {
  const width = verticalLineCount + 1;
  const height = horizontalLineCount + 1;
  const verticesCoords: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const edgesVertices: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  const edgesAssignment: FoldFaceReconstructionAssignment[] = ['B', 'B', 'B', 'B'];

  for (let x = 1; x <= verticalLineCount; x += 1) {
    const bottom = verticesCoords.push([x, 0]) - 1;
    const top = verticesCoords.push([x, height]) - 1;
    edgesVertices.push([bottom, top]);
    edgesAssignment.push(x % 2 === 0 ? 'M' : 'V');
  }
  for (let y = 1; y <= horizontalLineCount; y += 1) {
    const left = verticesCoords.push([0, y]) - 1;
    const right = verticesCoords.push([width, y]) - 1;
    edgesVertices.push([left, right]);
    edgesAssignment.push(y % 2 === 0 ? 'V' : 'M');
  }
  return {
    specVersion: '1.1',
    verticesCoords,
    edgesVertices,
    edgesAssignment,
    facesVertices: null,
  };
}

function permuteAndReverse(input: FoldFaceReconstructionInputV1): FoldFaceReconstructionInputV1 {
  const vertexOrder = input.verticesCoords
    .map((_vertex, index) => index)
    .sort((left, right) => {
      const leftKey = (left * 17 + 5) % input.verticesCoords.length;
      const rightKey = (right * 17 + 5) % input.verticesCoords.length;
      return leftKey - rightKey || right - left;
    });
  const oldToNew = new Map(vertexOrder.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  const edgeOrder = input.edgesVertices.map((_edge, index) => index).reverse();
  return {
    ...input,
    verticesCoords: vertexOrder.map((index) => input.verticesCoords[index] as [number, number]),
    edgesVertices: edgeOrder.map((edgeIndex, outputIndex) => {
      const source = input.edgesVertices[edgeIndex];
      if (source === undefined) throw new TypeError('edge permutation invariant failed');
      const first = oldToNew.get(source[0]);
      const second = oldToNew.get(source[1]);
      if (first === undefined || second === undefined) {
        throw new TypeError('vertex permutation invariant failed');
      }
      return outputIndex % 2 === 0 ? [second, first] : [first, second];
    }),
    edgesAssignment: edgeOrder.map((index) => {
      const assignment = input.edgesAssignment[index];
      if (assignment === undefined) throw new TypeError('assignment permutation invariant failed');
      return assignment;
    }),
  };
}

function audit(input: FoldFaceReconstructionInputV1) {
  const reconstruction = reconstructFoldFacesCandidateV1(input);
  expect(reconstruction.ok).toBe(true);
  if (!reconstruction.ok) throw new Error(reconstruction.error[0]?.code);
  const prepared = prepareFaceComplexAuditInputV1(input, reconstruction.value);
  expect(prepared.ok).toBe(true);
  if (!prepared.ok) throw new Error(prepared.error[0]?.code);
  const audited = auditFaceComplexCandidateV1(prepared.value);
  expect(audited.ok).toBe(true);
  if (!audited.ok) throw new Error(audited.error[0]?.code);
  return audited.value.topology;
}

describe('face-complex audit deterministic metamorphic corpus', () => {
  it.each([
    [1, 1],
    [2, 1],
    [2, 2],
    [4, 3],
    [6, 4],
  ] as const)('audits a %sx%s segmented grid through collection permutations', (columns, rows) => {
    const input = segmentedGrid(columns, rows);
    for (const variant of [input, permuteAndReverse(input)]) {
      expect(audit(variant)).toMatchObject({
        boundedFaceCount: columns * rows,
        triangleCount: 2 * columns * rows,
        createdIntersectionVertexCount: 0,
      });
    }
  });

  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
  ] as const)(
    'independently recovers a %sx%s crossing-line arrangement and its permutation',
    (verticalLines, horizontalLines) => {
      const input = unsplitLineGrid(verticalLines, horizontalLines);
      for (const variant of [input, permuteAndReverse(input)]) {
        expect(audit(variant)).toMatchObject({
          boundedFaceCount: (verticalLines + 1) * (horizontalLines + 1),
          triangleCount: 2 * (verticalLines + 1) * (horizontalLines + 1),
          createdIntersectionVertexCount: verticalLines * horizontalLines,
          nonDyadicVertexCount: 0,
        });
      }
    },
  );
});
