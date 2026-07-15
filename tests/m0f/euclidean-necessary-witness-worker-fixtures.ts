import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  searchEuclideanNecessaryWitnessesV1,
  type EuclideanNecessaryWitnessSearchResultV1,
} from '../../m0f/box-pleating/euclidean-necessary-witness-search.js';
import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from '../../m0f/box-pleating/packing-semantics.js';
import { POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE,
} from '../../m0f/workers/euclidean-necessary-witness-search-worker-protocol.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE,
  EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE,
} from '../../m0f/workers/euclidean-necessary-witness-validation-worker-protocol.js';
import { packingWorkerMaximalSource } from './polygon-river-packing-problem-worker-fixtures.js';

export type WitnessWorkerJson = Record<string, unknown>;

export function witnessWorkerTwoLeafSource(length = 0.5): WitnessWorkerJson {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: {
      schemaVersion: 1,
      recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      nodes: [
        { id: 'leaf-a', pos: { x: 0, y: 0 }, label: 'A', mirrorOf: null, onSymmetryAxis: false },
        { id: 'leaf-b', pos: { x: 1, y: 0 }, label: 'B', mirrorOf: null, onSymmetryAxis: false },
      ],
      edges: [
        {
          id: 'edge-ab',
          from: 'leaf-a',
          to: 'leaf-b',
          length,
          width: 0,
          label: 'AB',
          mirrorOf: null,
        },
      ],
      rotation: [
        { nodeId: 'leaf-a', edgeIds: ['edge-ab'] },
        { nodeId: 'leaf-b', edgeIds: ['edge-ab'] },
      ],
    },
    paper: { width: 1, height: 1 },
    maxColumns: 2,
    maxRows: 2,
    relativeErrorLimit: 0,
  };
}

function candidateId(source: WitnessWorkerJson): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('fixture source must enumerate');
  const selected = enumerated.value.quantization.candidates.find(
    (candidate) => candidate.columns === 2 && candidate.rows === 2,
  );
  if (selected === undefined) throw new Error('fixture requires the 2x2 candidate');
  return selected.candidateId;
}

export function witnessWorkerInput(
  maxVisitedStates = 100,
  maxWitnesses = 1,
  length = 0.5,
): WitnessWorkerJson {
  const source = witnessWorkerTwoLeafSource(length);
  return {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    semantics: structuredClone(BOX_PLEATING_PACKING_SEMANTICS_V1),
    packingProblemInput: {
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      source,
      candidateId: candidateId(source),
    },
    maxVisitedStates,
    maxWitnesses,
  };
}

export function witnessWorkerMaximalInput(): WitnessWorkerJson {
  const source = packingWorkerMaximalSource();
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('maximal fixture must enumerate');
  const selected = enumerated.value.quantization.candidates[0];
  if (selected === undefined) throw new Error('maximal fixture requires one candidate');
  return {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    semantics: structuredClone(BOX_PLEATING_PACKING_SEMANTICS_V1),
    packingProblemInput: {
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      source,
      candidateId: selected.candidateId,
    },
    maxVisitedStates: 1,
    maxWitnesses: 8,
  };
}

export function witnessWorkerCandidate(
  input: unknown = witnessWorkerInput(),
): EuclideanNecessaryWitnessSearchResultV1 {
  const searched = searchEuclideanNecessaryWitnessesV1(input);
  if (!searched.ok) throw new Error('fixture input must search');
  return searched.value;
}

export function witnessWorkerSearchRequest(
  jobId = 'witness:job',
  input: unknown = witnessWorkerInput(),
) {
  return {
    schemaVersion: 1,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_REQUEST_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId,
    input,
  };
}

export function witnessWorkerSearchResponse(
  jobId = 'witness:job',
  input: unknown = witnessWorkerInput(),
  candidate: unknown = witnessWorkerCandidate(input),
) {
  return {
    schemaVersion: 1,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_WORKER_OPERATION,
    contractStatus: 'candidate',
    scientificClaim: false,
    generalPolygonRiverPackingSolverIncluded: false,
    packingIncluded: false,
    feasibilityDecisionIncluded: false,
    globalM0fGo: false,
    jobId,
    sourceInput: input,
    outcome: 'candidate-produced',
    reason: null,
    candidate,
  };
}

export function witnessWorkerValidationRequest(
  jobId = 'witness:job',
  validationId = 'validation:fixture',
  input: unknown = witnessWorkerInput(),
  candidate: unknown = witnessWorkerCandidate(input),
) {
  return {
    schemaVersion: 1,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_REQUEST_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
    contractStatus: 'candidate',
    scientificClaim: false,
    jobId,
    validationId,
    input,
    candidate,
  };
}

export function witnessWorkerValidationResponse(
  jobId = 'witness:job',
  validationId = 'validation:fixture',
  input: unknown = witnessWorkerInput(),
  result: unknown = witnessWorkerCandidate(input),
) {
  return {
    schemaVersion: 1,
    messageType: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_RESPONSE_MESSAGE_TYPE,
    operation: EUCLIDEAN_NECESSARY_WITNESS_VALIDATION_WORKER_OPERATION,
    contractStatus: 'candidate',
    scientificClaim: false,
    independentReplayPerformed: true,
    generalPolygonRiverPackingSolverIncluded: false,
    packingIncluded: false,
    feasibilityDecisionIncluded: false,
    globalM0fGo: false,
    jobId,
    validationId,
    sourceInput: input,
    outcome: 'validated',
    reason: null,
    result,
  };
}
