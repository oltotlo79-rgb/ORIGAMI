import { deepFreezeOwned } from '../clone-and-freeze.js';
import type { ExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  searchEuclideanNecessaryWitnessesV1,
  type EuclideanNecessaryWitnessSearchResultV1,
} from './euclidean-necessary-witness-search.js';
import { validateEuclideanNecessaryWitnessSearchResultV1 } from './euclidean-necessary-witness-search-result-validation.js';
import { type OrderedTreeGridQuantizationInputV1 } from './ordered-tree-grid-quantization.js';
import {
  enumerateOrderedTreeSquareGridCandidatesV1,
  type OrderedTreeSquareGridCandidateResultV1,
} from './ordered-tree-square-grid-candidates.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from './packing-semantics.js';
import { POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE } from './polygon-river-packing-problem.js';
import {
  buildSquareGridLatticeV1,
  SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
  type SquareGridLatticeResultV1,
} from './square-grid-lattice.js';
import {
  buildSquareGridPaperPartitionV1,
  SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
  type SquareGridPaperPartitionResultV1,
} from './square-grid-paper-partition.js';
import { validateSquareGridSelectedCandidateV1 } from './square-grid-selected-candidate-validation.js';

export const BOX_PLEATING_CANDIDATE_FLOW_INPUT_RECORD_TYPE =
  'm0f-box-pleating-candidate-flow-input' as const;
export const BOX_PLEATING_CANDIDATE_FLOW_RESULT_RECORD_TYPE =
  'm0f-box-pleating-candidate-flow-result' as const;

/** Candidate-only defensive envelope; not a SupportProfile or product limit. */
export const BOX_PLEATING_CANDIDATE_FLOW_LIMITS = deepFreezeOwned({
  maxArrayLength: 40,
  maxContainerCount: 512,
  maxDepth: 12,
  maxObjectPropertyCount: 64,
  maxPropertyNameCodeUnits: 96,
  maxStringCodeUnits: 8_192,
  maxTotalStringCodeUnits: 524_288,
  maxTotalPropertyCount: 4_096,
});

export type BoxPleatingCandidateFlowInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BOX_PLEATING_CANDIDATE_FLOW_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  source: OrderedTreeGridQuantizationInputV1;
  candidateId: string;
  maxVisitedStates: number;
  maxWitnesses: number;
}>;

export type BoxPleatingProjectedLeafAnchorPreviewV1 = Readonly<{
  previewRole: 'necessary-filter-witness-anchors-only-not-placement-or-crease-pattern';
  witnessIndex: number;
  gridColumns: number;
  gridRows: number;
  leafAnchors: readonly Readonly<{
    leafNodeId: string;
    gridIndex: Readonly<{ x: number; y: number }>;
    paperPosition: Readonly<{ x: ExactRationalJsonV1; y: ExactRationalJsonV1 }>;
  }>[];
  packingEvidence: false;
  placementEvidence: false;
  creasePatternEvidence: false;
}>;

export type BoxPleatingCandidateFlowResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof BOX_PLEATING_CANDIDATE_FLOW_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  outputKind: 'preconstruction-diagnostic-not-crease-pattern';
  scope: 'caller-selected-grid-candidate-to-necessary-filter-workflow-only';
  candidateSelectionMode: 'caller-supplied-id';
  automaticCandidateSelectionIncluded: false;
  selectedCandidateIndependentValidationPassed: true;
  necessaryFilterIndependentReplayPassed: true;
  gridSubstrateIncluded: true;
  paperPartitionIncluded: true;
  generalPolygonRiverPackingSolverIncluded: false;
  actualPolygonRiverGeometryIncluded: false;
  branchPlacementIncluded: false;
  packingIncluded: false;
  axialConstructionIncluded: false;
  junctionConstructionIncluded: false;
  pleatRoutingIncluded: false;
  creasePatternIncluded: false;
  mountainValleyIncluded: false;
  foldabilityIncluded: false;
  feasibilityDecisionIncluded: false;
  globalM0fGo: false;
  candidateCatalog: Readonly<{
    candidateCount: number;
    candidateIds: readonly string[];
    selectedCandidateId: string;
    selectedCandidateIndex: number;
  }>;
  enumeration: OrderedTreeSquareGridCandidateResultV1;
  lattice: SquareGridLatticeResultV1;
  paperPartition: SquareGridPaperPartitionResultV1;
  necessaryFilterSearch: EuclideanNecessaryWitnessSearchResultV1;
  projectedLeafAnchorPreview: BoxPleatingProjectedLeafAnchorPreviewV1 | null;
}>;

export type BoxPleatingCandidateFlowIssueV1 = Readonly<{
  stage:
    | 'snapshot'
    | 'flow-input'
    | 'enumeration'
    | 'candidate-selection'
    | 'selected-candidate-validation'
    | 'lattice'
    | 'paper-partition'
    | 'necessary-filter-search'
    | 'independent-replay'
    | 'cross-stage-binding';
  path: string;
  code: string;
  message: string;
  sourceStage?: string;
  sourceCode?: string;
}>;

export type BoxPleatingCandidateFlowEvaluationV1 =
  | Readonly<{ ok: true; value: BoxPleatingCandidateFlowResultV1 }>
  | Readonly<{ ok: false; error: readonly BoxPleatingCandidateFlowIssueV1[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'source',
  'candidateId',
  'maxVisitedStates',
  'maxWitnesses',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function failure(
  error: readonly BoxPleatingCandidateFlowIssueV1[],
): BoxPleatingCandidateFlowEvaluationV1 {
  return deepFreezeOwned({ ok: false as const, error: [...error] });
}

function issue(
  stage: BoxPleatingCandidateFlowIssueV1['stage'],
  path: string,
  code: string,
  message: string,
  sourceStage?: string,
  sourceCode?: string,
): BoxPleatingCandidateFlowIssueV1 {
  return {
    stage,
    path,
    code,
    message,
    ...(sourceStage === undefined ? {} : { sourceStage }),
    ...(sourceCode === undefined ? {} : { sourceCode }),
  };
}

function validateRoot(raw: Record<string, unknown>): BoxPleatingCandidateFlowIssueV1[] {
  const issues: BoxPleatingCandidateFlowIssueV1[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push(
        issue(
          'flow-input',
          `$.${key}`,
          'unknown-field',
          'field is not declared by candidate flow input v1',
        ),
      );
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push(issue('flow-input', `$.${key}`, 'missing-field', 'required field is missing'));
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push(
      issue('flow-input', '$.schemaVersion', 'invalid-literal', 'schemaVersion must be 1'),
    );
  }
  if (raw.recordType !== BOX_PLEATING_CANDIDATE_FLOW_INPUT_RECORD_TYPE) {
    issues.push(
      issue(
        'flow-input',
        '$.recordType',
        'invalid-literal',
        `recordType must be ${BOX_PLEATING_CANDIDATE_FLOW_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push(
      issue(
        'flow-input',
        '$.contractStatus',
        'claim-boundary',
        'contractStatus must remain candidate',
      ),
    );
  }
  if (raw.scientificClaim !== false) {
    issues.push(
      issue(
        'flow-input',
        '$.scientificClaim',
        'claim-boundary',
        'scientificClaim must remain false',
      ),
    );
  }
  return issues;
}

function candidateGeometry(
  enumeration: OrderedTreeSquareGridCandidateResultV1,
  selectedCandidateIndex: number,
) {
  const selected = enumeration.quantization.candidates[selectedCandidateIndex];
  if (selected === undefined) throw new RangeError('selected candidate index must exist');
  return {
    selected,
    latticeInput: {
      candidateId: selected.candidateId,
      columns: selected.columns,
      rows: selected.rows,
      fitAxis: selected.fitAxis,
      cellSize: selected.cellSize,
      paper: enumeration.quantization.paper,
      residualStrips: selected.residualStrips,
    },
  };
}

function previewFrom(
  lattice: SquareGridLatticeResultV1,
  search: EuclideanNecessaryWitnessSearchResultV1,
): BoxPleatingProjectedLeafAnchorPreviewV1 | null {
  const witness = search.witnesses[0];
  if (witness === undefined) return null;
  const vertices = new Map(
    lattice.vertices.map(
      (vertex) => [`${vertex.gridIndex.x},${vertex.gridIndex.y}`, vertex] as const,
    ),
  );
  const leafAnchors = witness.leafAssignments.map((assignment) => {
    const vertex = vertices.get(`${assignment.x},${assignment.y}`);
    if (vertex === undefined)
      throw new RangeError('validated witness anchor must exist in lattice');
    return {
      leafNodeId: assignment.leafNodeId,
      gridIndex: { x: assignment.x, y: assignment.y },
      paperPosition: vertex.position,
    };
  });
  return {
    previewRole: 'necessary-filter-witness-anchors-only-not-placement-or-crease-pattern',
    witnessIndex: witness.witnessIndex,
    gridColumns: search.activeGridDomain.columns,
    gridRows: search.activeGridDomain.rows,
    leafAnchors,
    packingEvidence: false,
    placementEvidence: false,
    creasePatternEvidence: false,
  };
}

/**
 * Composes existing M0F-2 candidate boundaries for one caller-selected grid.
 * A successful record is a reproducible diagnostic, never a CP or packing result.
 */
export function evaluateBoxPleatingCandidateFlowV1(
  supplied: unknown,
): BoxPleatingCandidateFlowEvaluationV1 {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, BOX_PLEATING_CANDIDATE_FLOW_LIMITS);
  if (!snapshot.ok) {
    return failure([
      issue(
        'snapshot',
        '$',
        'invalid-snapshot',
        'input must be one bounded acyclic accessor-free plain snapshot',
      ),
    ]);
  }
  if (!isRecord(snapshot.value)) {
    return failure([
      issue('flow-input', '$', 'invalid-object', 'candidate flow input must be an object'),
    ]);
  }
  const rootIssues = validateRoot(snapshot.value);
  if (rootIssues.length > 0) return failure(rootIssues);

  const enumeration = enumerateOrderedTreeSquareGridCandidatesV1(snapshot.value.source);
  if (!enumeration.ok) {
    return failure(
      enumeration.error.map((entry) =>
        issue('enumeration', entry.path, entry.code, entry.message, entry.stage, entry.sourceStage),
      ),
    );
  }
  const candidateId = snapshot.value.candidateId;
  if (typeof candidateId !== 'string') {
    return failure([
      issue(
        'candidate-selection',
        '$.candidateId',
        'invalid-candidate-id',
        'candidateId must be a string',
      ),
    ]);
  }
  const candidateIds = enumeration.value.quantization.candidates.map((entry) => entry.candidateId);
  const selectedCandidateIndex = candidateIds.indexOf(candidateId);
  if (selectedCandidateIndex < 0) {
    return failure([
      issue(
        'candidate-selection',
        '$.candidateId',
        'unknown-candidate-id',
        'candidateId must name one candidate from the bounded enumeration; no fallback is selected',
      ),
    ]);
  }
  const geometry = candidateGeometry(enumeration.value, selectedCandidateIndex);
  const selectedValidation = validateSquareGridSelectedCandidateV1(
    enumeration.value.adapter.squareGridInput,
    geometry.selected,
  );
  if (!selectedValidation.ok) {
    return failure(
      selectedValidation.violations.map((entry) =>
        issue(
          'selected-candidate-validation',
          entry.path,
          entry.code,
          entry.message,
          entry.stage,
          entry.code,
        ),
      ),
    );
  }

  const latticeInput = {
    schemaVersion: 1,
    recordType: SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    squareGridCandidate: geometry.latticeInput,
  };
  const lattice = buildSquareGridLatticeV1(latticeInput);
  if (!lattice.ok) {
    return failure(
      lattice.error.map((entry) => issue('lattice', entry.path, entry.code, entry.message)),
    );
  }
  const partition = buildSquareGridPaperPartitionV1({
    ...latticeInput,
    recordType: SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
  });
  if (!partition.ok) {
    return failure(
      partition.error.map((entry) =>
        issue('paper-partition', entry.path, entry.code, entry.message),
      ),
    );
  }

  const searchInput = {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    semantics: BOX_PLEATING_PACKING_SEMANTICS_V1,
    packingProblemInput: {
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      source: snapshot.value.source,
      candidateId,
    },
    maxVisitedStates: snapshot.value.maxVisitedStates,
    maxWitnesses: snapshot.value.maxWitnesses,
  };
  const search = searchEuclideanNecessaryWitnessesV1(searchInput);
  if (!search.ok) {
    return failure(
      search.error.map((entry) =>
        issue(
          'necessary-filter-search',
          entry.path,
          entry.code,
          entry.message,
          entry.stage,
          entry.code,
        ),
      ),
    );
  }
  const replay = validateEuclideanNecessaryWitnessSearchResultV1(searchInput, search.value);
  if (!replay.ok) {
    return failure(
      replay.violations.map((entry) =>
        issue('independent-replay', entry.path, entry.code, entry.message, entry.stage, entry.code),
      ),
    );
  }
  if (replay.value.packingProblemReference.candidateReference.candidateId !== candidateId) {
    return failure([
      issue(
        'cross-stage-binding',
        '$.candidateId',
        'candidate-binding-mismatch',
        'enumeration and independently replayed search must reference the same caller-selected candidate',
      ),
    ]);
  }

  return deepFreezeOwned({
    ok: true as const,
    value: {
      schemaVersion: 1 as const,
      recordType: BOX_PLEATING_CANDIDATE_FLOW_RESULT_RECORD_TYPE,
      contractStatus: 'candidate' as const,
      scientificClaim: false as const,
      outputKind: 'preconstruction-diagnostic-not-crease-pattern' as const,
      scope: 'caller-selected-grid-candidate-to-necessary-filter-workflow-only' as const,
      candidateSelectionMode: 'caller-supplied-id' as const,
      automaticCandidateSelectionIncluded: false as const,
      selectedCandidateIndependentValidationPassed: true as const,
      necessaryFilterIndependentReplayPassed: true as const,
      gridSubstrateIncluded: true as const,
      paperPartitionIncluded: true as const,
      generalPolygonRiverPackingSolverIncluded: false as const,
      actualPolygonRiverGeometryIncluded: false as const,
      branchPlacementIncluded: false as const,
      packingIncluded: false as const,
      axialConstructionIncluded: false as const,
      junctionConstructionIncluded: false as const,
      pleatRoutingIncluded: false as const,
      creasePatternIncluded: false as const,
      mountainValleyIncluded: false as const,
      foldabilityIncluded: false as const,
      feasibilityDecisionIncluded: false as const,
      globalM0fGo: false as const,
      candidateCatalog: {
        candidateCount: candidateIds.length,
        candidateIds,
        selectedCandidateId: candidateId,
        selectedCandidateIndex,
      },
      enumeration: enumeration.value,
      lattice: lattice.value,
      paperPartition: partition.value,
      necessaryFilterSearch: replay.value,
      projectedLeafAnchorPreview: previewFrom(lattice.value, replay.value),
    },
  });
}
