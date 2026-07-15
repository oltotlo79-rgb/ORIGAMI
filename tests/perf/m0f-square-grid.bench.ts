import { bench, describe } from 'vitest';

import {
  enumerateSquareGridCandidatesV1,
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
} from '../../m0f/box-pleating/square-grid-candidates.js';
import {
  buildSquareGridLatticeV1,
  SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
} from '../../m0f/box-pleating/square-grid-lattice.js';

const CANDIDATE_MEASUREMENT_LABEL =
  'M0F square-grid prerequisite candidate measurement (non-scientific, no threshold)';

const SMALL_ENUMERATION_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  paper: Object.freeze({ width: 1.5, height: 1 }),
  maxColumns: 12,
  maxRows: 12,
  relativeErrorLimit: 0.01,
  branches: Object.freeze([
    Object.freeze({ id: 'terminal-a', branchClass: 'terminal', length: 0.75, width: 0 }),
    Object.freeze({ id: 'internal-a', branchClass: 'internal', length: 0.5, width: 0.25 }),
  ]),
});

const PROFILE_POINT_ENUMERATION_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  paper: Object.freeze({ width: 1, height: 1 }),
  maxColumns: 128,
  maxRows: 128,
  relativeErrorLimit: 0.01,
  branches: Object.freeze(
    Array.from({ length: 39 }, (_, index) =>
      Object.freeze({
        id: `branch-${String(index).padStart(2, '0')}`,
        branchClass: index < 20 ? ('terminal' as const) : ('internal' as const),
        length: (index + 2) / 128,
        width: index % 3 === 0 ? 0 : 1 / 128,
      }),
    ),
  ),
});

const LATTICE_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  squareGridCandidate: Object.freeze({
    candidateId: 'square-grid:32x24:xy:1/32',
    columns: 32,
    rows: 24,
    fitAxis: 'both',
    cellSize: Object.freeze({ numerator: '1', denominator: '32' }),
    paper: Object.freeze({
      width: Object.freeze({ numerator: '1', denominator: '1' }),
      height: Object.freeze({ numerator: '3', denominator: '4' }),
    }),
    residualStrips: Object.freeze({
      xAxis: Object.freeze({ numerator: '0', denominator: '1' }),
      yAxis: Object.freeze({ numerator: '0', denominator: '1' }),
    }),
  }),
});

let candidateMeasurementSink = 0;

function measureEnumeration(input: unknown): void {
  const result = enumerateSquareGridCandidatesV1(input);
  if (!result.ok) throw new Error('square-grid benchmark input must enumerate');
  candidateMeasurementSink = result.value.candidates.reduce(
    (sum, candidate) => sum + candidate.branchQuantizations.length,
    0,
  );
}

function measureLattice(): void {
  const result = buildSquareGridLatticeV1(LATTICE_INPUT);
  if (!result.ok) throw new Error('square-grid lattice benchmark input must build');
  candidateMeasurementSink = result.value.counts.vertices + result.value.counts.directionPrimitives;
}

describe(CANDIDATE_MEASUREMENT_LABEL, () => {
  bench('12x12 bounds with terminal and internal width', () => {
    measureEnumeration(SMALL_ENUMERATION_INPUT);
  });

  bench('128x128 candidate profile point with 39 branches', () => {
    measureEnumeration(PROFILE_POINT_ENUMERATION_INPUT);
  });

  bench('32x24 exact four-direction lattice substrate', () => {
    measureLattice();
  });
});

void candidateMeasurementSink;
