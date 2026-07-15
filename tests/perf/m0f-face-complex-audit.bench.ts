import { bench, describe } from 'vitest';

import { prepareFaceComplexAuditInputV1 } from '../../m0f/geometry/prepare-face-complex-audit-input.js';
import { reconstructFoldFacesCandidateV1 } from '../../m0f/geometry/reconstruct-fold-faces.js';
import {
  auditFaceComplexCandidateV1,
  type FaceComplexAuditConsistentV1,
} from '../../m0f/reference-verifier/face-complex-v1.js';
import type { FaceComplexAuditInputV1 } from '../../m0f/reference-verifier/face-complex-contract.js';

interface MutableInput {
  specVersion: '1.2';
  verticesCoords: [number, number][];
  edgesVertices: [number, number][];
  edgesAssignment: ('B' | 'F')[];
  facesVertices: null;
}

const MEASUREMENT_LABEL =
  'M0F separate face-complex audit candidate measurement (non-scientific, no threshold)';

let auditMeasurementSink = 0;

function gridInput(columns: number, rows: number): MutableInput {
  const verticesCoords: [number, number][] = [];
  const vertexIndexByCoordinate = new Map<string, number>();
  const vertex = (x: number, y: number): number => {
    const key = `${x},${y}`;
    const existing = vertexIndexByCoordinate.get(key);
    if (existing !== undefined) return existing;
    const index = verticesCoords.length;
    verticesCoords.push([x, y]);
    vertexIndexByCoordinate.set(key, index);
    return index;
  };

  const edgesVertices: [number, number][] = [];
  const edgesAssignment: ('B' | 'F')[] = [];
  for (let row = 0; row <= rows; row += 1) {
    edgesVertices.push([vertex(0, row), vertex(columns, row)]);
    edgesAssignment.push(row === 0 || row === rows ? 'B' : 'F');
  }
  for (let column = 0; column <= columns; column += 1) {
    edgesVertices.push([vertex(column, 0), vertex(column, rows)]);
    edgesAssignment.push(column === 0 || column === columns ? 'B' : 'F');
  }
  return {
    specVersion: '1.2',
    verticesCoords,
    edgesVertices,
    edgesAssignment,
    facesVertices: null,
  };
}

function nonDyadicInput(): MutableInput {
  return {
    specVersion: '1.2',
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
    edgesAssignment: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'F', 'F'],
    facesVertices: null,
  };
}

function bundle(input: MutableInput): FaceComplexAuditInputV1 {
  const reconstructed = reconstructFoldFacesCandidateV1(input);
  if (!reconstructed.ok) {
    throw new Error(reconstructed.error.map((entry) => entry.code).join(','));
  }
  const prepared = prepareFaceComplexAuditInputV1(input, reconstructed.value);
  if (!prepared.ok) throw new Error(prepared.error.map((entry) => entry.code).join(','));
  return prepared.value;
}

const SMALL_GRID = bundle(gridInput(3, 2));
const MEDIUM_GRID = bundle(gridInput(8, 6));
const NON_DYADIC = bundle(nonDyadicInput());

function measure(input: FaceComplexAuditInputV1): FaceComplexAuditConsistentV1 {
  const result = auditFaceComplexCandidateV1(input);
  if (!result.ok) throw new Error(result.error.map((entry) => entry.code).join(','));
  auditMeasurementSink =
    result.value.topology.planarVertexCount * 1_000_000 +
    result.value.topology.planarEdgeCount * 10_000 +
    result.value.topology.boundedFaceCount * 100 +
    result.value.topology.triangleCount;
  return result.value;
}

describe(MEASUREMENT_LABEL, () => {
  bench('small connected 3x2 grid disk', () => {
    measure(SMALL_GRID);
  });

  bench('medium connected 8x6 grid disk', () => {
    measure(MEDIUM_GRID);
  });

  bench('small disk with exact non-dyadic internal intersection', () => {
    measure(NON_DYADIC);
  });
});

void auditMeasurementSink;
