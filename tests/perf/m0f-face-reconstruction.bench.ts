import { bench, describe } from 'vitest';

import { enumerateRationalPlanarFaces } from '../../m0f/geometry/planar-rational-faces.js';
import {
  planarizeDyadicSegments,
  type SourceEdgeSegment2,
} from '../../m0f/geometry/planarize-segments.js';
import { triangulatePlanarRationalFaceCandidate } from '../../m0f/geometry/triangulate-rational-face.js';

type ExpectedCounts = Readonly<{
  vertices: number;
  edges: number;
  boundedFaces: number;
  triangles: number;
}>;

type CandidateCorpus = Readonly<{
  segments: readonly SourceEdgeSegment2[];
  expected: ExpectedCounts;
}>;

// This suite only records candidate implementation measurements. It defines no
// performance threshold and makes no scientific or support-profile claim.
const CANDIDATE_MEASUREMENT_LABEL =
  'M0F exact face-reconstruction candidate measurement (non-scientific, no threshold)';

let candidateMeasurementSink = 0;

function source(
  sourceEdgeId: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): SourceEdgeSegment2 {
  return {
    sourceEdgeId,
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
  };
}

function gridDisk(columns: number, rows: number): CandidateCorpus {
  const segments: SourceEdgeSegment2[] = [];
  for (let row = 0; row <= rows; row += 1) {
    segments.push(source(`horizontal-${row}`, 0, row, columns, row));
  }
  for (let column = 0; column <= columns; column += 1) {
    segments.push(source(`vertical-${column}`, column, 0, column, rows));
  }
  return {
    segments,
    expected: {
      vertices: (columns + 1) * (rows + 1),
      edges: columns * (rows + 1) + rows * (columns + 1),
      boundedFaces: columns * rows,
      triangles: 2 * columns * rows,
    },
  };
}

const SMALL_GRID = gridDisk(3, 2);
const MEDIUM_GRID = gridDisk(8, 6);

/** The internal lines meet exactly at (1, 1/3), not at a dyadic rational. */
const NON_DYADIC_DISK: CandidateCorpus = {
  segments: [
    source('top', 0, 0, 3, 0),
    source('right', 3, 0, 3, 2),
    source('bottom', 3, 2, 0, 2),
    source('left', 0, 2, 0, 0),
    source('diagonal', 0, 0, 3, 1),
    source('vertical', 1, 0, 1, 2),
  ],
  expected: { vertices: 8, edges: 11, boundedFaces: 4, triangles: 7 },
};

function requireCount(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function measureCandidatePipeline(corpus: CandidateCorpus): void {
  const planarized = planarizeDyadicSegments(corpus.segments);
  if (!planarized.ok) {
    throw new Error(
      `planarization failed: ${planarized.error.map((issue) => issue.code).join(',')}`,
    );
  }
  requireCount(planarized.value.vertices.length, corpus.expected.vertices, 'vertex count');
  requireCount(planarized.value.edges.length, corpus.expected.edges, 'edge count');

  const enumerated = enumerateRationalPlanarFaces(planarized.value);
  if (!enumerated.ok) {
    throw new Error(
      `face enumeration failed: ${enumerated.error.map((issue) => issue.code).join(',')}`,
    );
  }
  requireCount(
    enumerated.value.boundedFaces.length,
    corpus.expected.boundedFaces,
    'bounded face count',
  );
  requireCount(enumerated.value.topology.eulerValue, 1, 'Euler value');

  let triangleCount = 0;
  for (const boundary of enumerated.value.boundedFaces) {
    const triangulated = triangulatePlanarRationalFaceCandidate({
      boundary,
      vertices: planarized.value.vertices,
    });
    if (!triangulated.ok) {
      throw new Error(
        `triangulation failed: ${triangulated.error.map((issue) => issue.code).join(',')}`,
      );
    }
    triangleCount += triangulated.value.triangles.length;
  }
  requireCount(triangleCount, corpus.expected.triangles, 'triangle count');

  candidateMeasurementSink =
    planarized.value.vertices.length * 1_000_000 +
    planarized.value.edges.length * 10_000 +
    enumerated.value.boundedFaces.length * 100 +
    triangleCount;
}

describe(CANDIDATE_MEASUREMENT_LABEL, () => {
  bench('small connected 3x2 grid disk', () => {
    measureCandidatePipeline(SMALL_GRID);
  });

  bench('medium connected 8x6 grid disk', () => {
    measureCandidatePipeline(MEDIUM_GRID);
  });

  bench('small disk with exact non-dyadic internal intersection', () => {
    measureCandidatePipeline(NON_DYADIC_DISK);
  });
});

void candidateMeasurementSink;
