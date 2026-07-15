import { bench, describe } from 'vitest';

import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  searchEuclideanNecessaryWitnessesV1,
  type EuclideanNecessaryWitnessSearchStatus,
} from '../../m0f/box-pleating/euclidean-necessary-witness-search.js';
import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from '../../m0f/box-pleating/packing-semantics.js';
import { POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { DEFAULT_EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT } from '../../m0f/euclidean-necessary-witness-search-cli.js';

const MEASUREMENT_LABEL =
  'M0F Euclidean necessary-filter witness search measurement (non-scientific, no threshold, no support claim)';

const BUDGET_EXHAUSTION_INPUT = Object.freeze({
  schemaVersion: 1 as const,
  recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  contractStatus: 'candidate' as const,
  scientificClaim: false as const,
  semantics: BOX_PLEATING_PACKING_SEMANTICS_V1,
  packingProblemInput: Object.freeze({
    schemaVersion: 1 as const,
    recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
    contractStatus: 'candidate' as const,
    scientificClaim: false as const,
    source: Object.freeze({
      schemaVersion: 1 as const,
      recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      orderedTree: Object.freeze({
        schemaVersion: 1 as const,
        recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
        contractStatus: 'candidate' as const,
        scientificClaim: false as const,
        nodes: Object.freeze([
          Object.freeze({
            id: 'leaf-a',
            pos: Object.freeze({ x: 0, y: 0 }),
            label: 'A',
            mirrorOf: null,
            onSymmetryAxis: false,
          }),
          Object.freeze({
            id: 'leaf-b',
            pos: Object.freeze({ x: 1, y: 0 }),
            label: 'B',
            mirrorOf: null,
            onSymmetryAxis: false,
          }),
        ]),
        edges: Object.freeze([
          Object.freeze({
            id: 'edge-ab',
            from: 'leaf-a',
            to: 'leaf-b',
            length: 2,
            width: 0,
            label: 'AB',
            mirrorOf: null,
          }),
        ]),
        rotation: Object.freeze([
          Object.freeze({ nodeId: 'leaf-a', edgeIds: Object.freeze(['edge-ab']) }),
          Object.freeze({ nodeId: 'leaf-b', edgeIds: Object.freeze(['edge-ab']) }),
        ]),
      }),
      paper: Object.freeze({ width: 1, height: 1 }),
      maxColumns: 512,
      maxRows: 512,
      relativeErrorLimit: 0,
    }),
    candidateId: 'square-grid:512x512:xy:1/512',
  }),
  maxVisitedStates: 200_000,
  maxWitnesses: 1,
});

let witnessSearchMeasurementSink = 0;

function measureSearch(
  input: unknown,
  expectedStatus: EuclideanNecessaryWitnessSearchStatus,
  expectedVisitedStates: number,
): void {
  const result = searchEuclideanNecessaryWitnessesV1(input);
  if (!result.ok) throw new Error('witness-search benchmark input must be accepted');
  if (result.value.searchStatus !== expectedStatus) {
    throw new Error(`expected ${expectedStatus}, received ${result.value.searchStatus}`);
  }
  if (result.value.visitedStates !== expectedVisitedStates) {
    throw new Error(
      `expected ${String(expectedVisitedStates)} visited states, received ${String(result.value.visitedStates)}`,
    );
  }
  if (result.value.witnessCount !== 0) {
    throw new Error('witness-search benchmark fixtures must not produce witnesses');
  }
  witnessSearchMeasurementSink =
    (witnessSearchMeasurementSink +
      result.value.visitedStates +
      result.value.activeGridDomain.vertexCount) >>>
    0;
}

describe(MEASUREMENT_LABEL, () => {
  bench('default 12x8 two-leaf domain exhaustion', () => {
    measureSearch(DEFAULT_EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT, 'domain-exhausted', 13_806);
  });

  bench('512x512 two-leaf exact 200000-state budget exhaustion', () => {
    measureSearch(BUDGET_EXHAUSTION_INPUT, 'budget-exhausted', 200_000);
  });
});

void witnessSearchMeasurementSink;
