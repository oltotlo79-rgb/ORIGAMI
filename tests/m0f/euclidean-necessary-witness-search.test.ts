import { describe, expect, it } from 'vitest';

import {
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS,
  EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE,
  searchEuclideanNecessaryWitnessesV1,
  type EuclideanNecessaryWitnessSearchEvaluationResult,
} from '../../m0f/box-pleating/euclidean-necessary-witness-search.js';
import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import { BOX_PLEATING_PACKING_SEMANTICS_V1 } from '../../m0f/box-pleating/packing-semantics.js';
import { POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';

interface MutableEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  width: number;
  label: string;
  mirrorOf: string | null;
}

interface MutableTree {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  scientificClaim: boolean;
  nodes: {
    id: string;
    pos: { x: number; y: number };
    label: string;
    mirrorOf: string | null;
    onSymmetryAxis: boolean;
  }[];
  edges: MutableEdge[];
  rotation: { nodeId: string; edgeIds: string[] }[];
}

function twoLeafSource(
  length: number,
  maxColumns = 2,
  relativeErrorLimit = 0,
): Record<string, unknown> {
  const orderedTree: MutableTree = {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      {
        id: 'leaf-a',
        pos: { x: 0, y: 0 },
        label: 'A',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'leaf-b',
        pos: { x: 1, y: 0 },
        label: 'B',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
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
  };
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree,
    paper: { width: 1, height: 1 },
    maxColumns,
    maxRows: maxColumns,
    relativeErrorLimit,
  };
}

function candidateId(source: Record<string, unknown>, columns: number): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  const candidate = enumerated.value.quantization.candidates.find(
    (entry) => entry.columns === columns && entry.rows === columns,
  );
  if (candidate === undefined) throw new Error('requested test candidate must exist');
  return candidate.candidateId;
}

function searchInput(
  source: Record<string, unknown>,
  selectedCandidateId: string,
  maxVisitedStates: number,
  maxWitnesses = 1,
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    semantics: { ...BOX_PLEATING_PACKING_SEMANTICS_V1 },
    packingProblemInput: {
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      source,
      candidateId: selectedCandidateId,
    },
    maxVisitedStates,
    maxWitnesses,
  };
}

function demandFourInput(maxVisitedStates: number, maxWitnesses = 1): Record<string, unknown> {
  const source = twoLeafSource(2);
  return searchInput(source, candidateId(source, 2), maxVisitedStates, maxWitnesses);
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectFailure(
  raw: unknown,
  stage: string,
  code: string,
  path?: string,
): Extract<EuclideanNecessaryWitnessSearchEvaluationResult, { ok: false }> {
  const result = searchEuclideanNecessaryWitnessesV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${stage}/${code}`);
  expect(
    result.error.some(
      (entry) =>
        entry.stage === stage &&
        entry.code === code &&
        (path === undefined || entry.path.startsWith(path)),
    ),
  ).toBe(true);
  expect(result).not.toHaveProperty('value');
  expect(allFrozen(result)).toBe(true);
  return result;
}

function maximalCaterpillarTree(): MutableTree {
  const nodes: MutableTree['nodes'] = [];
  const edges: MutableEdge[] = [];
  const rotation: MutableTree['rotation'] = [];
  for (let index = 0; index < 20; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const spineNodeId = `spine-${suffix}`;
    const leafNodeId = `leaf-${suffix}`;
    const leafEdgeId = `leaf-edge-${suffix}`;
    nodes.push(
      {
        id: spineNodeId,
        pos: { x: index, y: 0 },
        label: suffix,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: leafNodeId,
        pos: { x: index, y: 1 },
        label: suffix,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    );
    edges.push({
      id: leafEdgeId,
      from: spineNodeId,
      to: leafNodeId,
      length: 1,
      width: 0.125,
      label: suffix,
      mirrorOf: null,
    });
    const incident: string[] = [];
    if (index > 0) incident.push(`spine-edge-${String(index - 1).padStart(2, '0')}`);
    incident.push(leafEdgeId);
    if (index < 19) incident.push(`spine-edge-${suffix}`);
    rotation.push(
      { nodeId: leafNodeId, edgeIds: [leafEdgeId] },
      { nodeId: spineNodeId, edgeIds: incident },
    );
    if (index < 19) {
      edges.push({
        id: `spine-edge-${suffix}`,
        from: spineNodeId,
        to: `spine-${String(index + 1).padStart(2, '0')}`,
        length: 1,
        width: 0.25,
        label: suffix,
        mirrorOf: null,
      });
    }
  }
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes,
    edges,
    rotation,
  };
}

function maximalSource(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: maximalCaterpillarTree(),
    paper: { width: 1, height: 1 },
    maxColumns: 8,
    maxRows: 8,
    relativeErrorLimit: 0,
  };
}

function hugeStepSource(): Record<string, unknown> {
  const source = twoLeafSource(Number.MAX_VALUE, 1);
  source.paper = { width: Number.MIN_VALUE, height: Number.MIN_VALUE };
  return source;
}

describe('M0F bounded Euclidean necessary-filter witness search', () => {
  it('exhausts the complete two-leaf 3x3-vertex domain for demand 4', () => {
    const result = searchEuclideanNecessaryWitnessesV1(demandFourInput(90, 8));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('bounded test domain must search');

    expect(result.value).toMatchObject({
      schemaVersion: 1,
      recordType: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      activeGridDomain: { columns: 2, rows: 2, vertexCount: 9 },
      visitedStates: 90,
      searchStatus: 'domain-exhausted',
      searchComplete: true,
      witnessCount: 0,
      witnesses: [],
      noNecessaryFilterWitnessInEnumeratedDomain: true,
      globalNoSolutionEvidence: false,
      packingInfeasibilityEvidence: false,
    });
    expect(result.value.packingProblemReference.separationConstraintInputs[0]).toMatchObject({
      totalLengthSteps: '4',
    });
    expect(allFrozen(result)).toBe(true);
  });

  it('rejects every demand-4 assignment including the delta-(2,2) Manhattan counterexample', () => {
    const result = searchEuclideanNecessaryWitnessesV1(demandFourInput(90, 8));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('bounded counterexample domain must search');
    expect(2n * 2n + 2n * 2n).toBeLessThan(4n * 4n);
    expect(result.value.witnesses).toEqual([]);
    expect(result.value.evaluatedRelation).toBe(
      'dx-squared-plus-dy-squared-at-least-total-length-steps-squared',
    );
  });

  it('returns the first canonical witness and retains every pair evaluation', () => {
    const source = twoLeafSource(1);
    const result = searchEuclideanNecessaryWitnessesV1(
      searchInput(source, candidateId(source, 2), 20, 1),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('witness case must search');

    expect(result.value.searchStatus).toBe('witness-found');
    expect(result.value.searchComplete).toBe(false);
    expect(result.value.visitedStates).toBe(4);
    expect(result.value.witnesses).toEqual([
      {
        witnessIndex: 0,
        assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement',
        leafAssignmentOrder: 'leaf-node-id-code-unit',
        leafAssignments: [
          { leafNodeId: 'leaf-a', x: 0, y: 0 },
          { leafNodeId: 'leaf-b', x: 2, y: 0 },
        ],
        pairEvaluationOrder: 'packing-problem-separation-constraint-order',
        pairEvaluations: [
          {
            firstLeafId: 'leaf-a',
            secondLeafId: 'leaf-b',
            absoluteDeltaX: '2',
            absoluteDeltaY: '0',
            actualSquaredDistance: '4',
            requiredSquaredDistance: '4',
            totalLengthSteps: '2',
            maximumWidthSteps: '0',
            passesNecessaryFilter: true,
          },
        ],
        allNecessaryPairFiltersPass: true,
        packingEvidence: false,
        geometryEvidence: false,
        placementEvidence: false,
      },
    ]);
  });

  it('counts attempted partial assignments exactly at the budget boundary', () => {
    const stopped = searchEuclideanNecessaryWitnessesV1(demandFourInput(89, 8));
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) throw new Error('bounded search must return');
    expect(stopped.value).toMatchObject({
      visitedStates: 89,
      searchStatus: 'budget-exhausted',
      searchComplete: false,
      noNecessaryFilterWitnessInEnumeratedDomain: false,
    });

    const completed = searchEuclideanNecessaryWitnessesV1(demandFourInput(90, 8));
    expect(completed.ok).toBe(true);
    if (!completed.ok) throw new Error('exact boundary search must return');
    expect(completed.value).toMatchObject({
      visitedStates: 90,
      searchStatus: 'domain-exhausted',
      searchComplete: true,
    });
  });

  it('is deterministic for identical source, budget, and witness limit', () => {
    const source = twoLeafSource(1);
    const input = searchInput(source, candidateId(source, 2), 200, 4);
    const first = searchEuclideanNecessaryWitnessesV1(input);
    const second = searchEuclideanNecessaryWitnessesV1(input);
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('stops deterministically at a caller limit greater than one without no-solution claims', () => {
    const source = twoLeafSource(0.1, 2, 1);
    const input = searchInput(source, candidateId(source, 2), 20, 3);
    const first = searchEuclideanNecessaryWitnessesV1(input);
    const second = searchEuclideanNecessaryWitnessesV1(input);
    expect(second).toEqual(first);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('multiple-witness case must search');

    expect(first.value).toMatchObject({
      visitedStates: 4,
      maxWitnesses: 3,
      searchStatus: 'witness-found',
      searchComplete: false,
      witnessCount: 3,
      noNecessaryFilterWitnessInEnumeratedDomain: false,
      globalNoSolutionEvidence: false,
      packingInfeasibilityEvidence: false,
    });
    expect(first.value.witnesses.map((witness) => witness.witnessIndex)).toEqual([0, 1, 2]);
    expect(first.value.witnesses.map((witness) => witness.leafAssignments[1])).toEqual([
      { leafNodeId: 'leaf-b', x: 0, y: 0 },
      { leafNodeId: 'leaf-b', x: 1, y: 0 },
      { leafNodeId: 'leaf-b', x: 2, y: 0 },
    ]);
  });

  it('uses BigInt safely for a 632-digit path demand before the exact budget stop', () => {
    const source = hugeStepSource();
    const result = searchEuclideanNecessaryWitnessesV1(
      searchInput(source, candidateId(source, 1), 2, 8),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('huge exact demand case must search');

    const pair = result.value.packingProblemReference.separationConstraintInputs[0];
    if (pair === undefined) throw new Error('huge-demand pair must exist');
    expect(pair.totalLengthSteps).toHaveLength(632);
    expect(BigInt(pair.totalLengthSteps) ** 2n).toBeGreaterThan(2n);
    expect(result.value).toMatchObject({
      visitedStates: 2,
      searchStatus: 'budget-exhausted',
      searchComplete: false,
      witnessCount: 0,
      noNecessaryFilterWitnessInEnumeratedDomain: false,
      globalNoSolutionEvidence: false,
    });
  });

  it('allows coincident coordinates when the quantized path demand is zero', () => {
    const source = twoLeafSource(0.1, 2, 1);
    const result = searchEuclideanNecessaryWitnessesV1(
      searchInput(source, candidateId(source, 2), 10, 1),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('zero-demand case must search');

    expect(result.value.visitedStates).toBe(2);
    expect(result.value.coordinateDistinctnessConstraintIncluded).toBe(false);
    expect(result.value.zeroDemandCoordinateCoincidenceAllowed).toBe(true);
    expect(result.value.witnesses[0]?.leafAssignments).toEqual([
      { leafNodeId: 'leaf-a', x: 0, y: 0 },
      { leafNodeId: 'leaf-b', x: 0, y: 0 },
    ]);
    expect(result.value.witnesses[0]?.pairEvaluations[0]?.totalLengthSteps).toBe('0');
  });

  it('stops a maximal 20-leaf source at the exact one-state work budget', () => {
    const source = maximalSource();
    const result = searchEuclideanNecessaryWitnessesV1(
      searchInput(source, candidateId(source, 8), 1, 8),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('maximal bounded source must search');

    expect(result.value.packingProblemReference.leafGridVertexVariables).toHaveLength(20);
    expect(result.value.packingProblemReference.separationConstraintInputs).toHaveLength(190);
    expect(result.value.visitedStates).toBe(1);
    expect(result.value.searchStatus).toBe('budget-exhausted');
    expect(result.value.searchComplete).toBe(false);
    expect(result.value.noNecessaryFilterWitnessInEnumeratedDomain).toBe(false);
  });

  it('keeps filter-search and general-packing-solver claims explicitly separated', () => {
    const result = searchEuclideanNecessaryWitnessesV1(demandFourInput(1));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('bounded search must return');

    expect(result.value).toMatchObject({
      assignmentSearchIncluded: true,
      necessaryFilterWitnessSearchIncluded: true,
      necessaryFilterEvaluationIncluded: true,
      filterOnlySearch: true,
      generalPolygonRiverPackingSolverIncluded: false,
      constructionFamily: 'unresolved',
      constructionFamilySelectionIncluded: false,
      geometryIncluded: false,
      actualGeometryIncluded: false,
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      junctionGeometryIncluded: false,
      placementIncluded: false,
      globalPackingIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      junctionConstructionIncluded: false,
      pleatRoutingIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      isSupportProfile: false,
      supportClaim: false,
    });
  });

  it('rejects unknown root fields and claim escalation', () => {
    expectFailure({ ...demandFourInput(1), extra: true }, 'search-input', 'unknown-field');
    expectFailure(
      { ...demandFourInput(1), scientificClaim: true },
      'search-input',
      'claim-boundary',
      '$.scientificClaim',
    );
    const escalated = demandFourInput(1);
    (escalated.semantics as Record<string, unknown>).globalM0fGo = true;
    expectFailure(escalated, 'semantics', 'claim-boundary', '$.semantics.globalM0fGo');
  });

  it('rejects invalid work and witness bounds', () => {
    for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expectFailure(
        { ...demandFourInput(1), maxVisitedStates: value },
        'search-input',
        'invalid-work-budget',
      );
    }
    expectFailure(
      {
        ...demandFourInput(1),
        maxVisitedStates: EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxVisitedStates + 1,
      },
      'search-input',
      'invalid-work-budget',
    );
    for (const value of [0, 1.5, EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxWitnesses + 1]) {
      expectFailure(
        { ...demandFourInput(1), maxWitnesses: value },
        'search-input',
        'invalid-witness-limit',
      );
    }
  });

  it('rejects accessors and cycles before reading caller-controlled values', () => {
    let getterCalls = 0;
    const accessorInput = demandFourInput(1);
    Object.defineProperty(accessorInput, 'maxVisitedStates', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 1;
      },
    });
    expectFailure(accessorInput, 'snapshot', 'invalid-snapshot');
    expect(getterCalls).toBe(0);

    const cyclic = demandFourInput(1);
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot');
  });

  it('rejects maps, sparse arrays, and explicit snapshot-budget overflow', () => {
    expectFailure(new Map(Object.entries(demandFourInput(1))), 'snapshot', 'invalid-snapshot');

    const sparse = demandFourInput(1);
    const sparsePackingInput = sparse.packingProblemInput as Record<string, unknown>;
    const sparseSource = sparsePackingInput.source as Record<string, unknown>;
    const sparseTree = sparseSource.orderedTree as MutableTree;
    sparseTree.nodes = new Array<MutableTree['nodes'][number]>(2);
    expectFailure(sparse, 'snapshot', 'invalid-snapshot');

    const oversized = demandFourInput(1);
    const oversizedPackingInput = oversized.packingProblemInput as Record<string, unknown>;
    oversizedPackingInput.candidateId = 'x'.repeat(
      EUCLIDEAN_NECESSARY_WITNESS_SEARCH_LIMITS.maxStringCodeUnits + 1,
    );
    expectFailure(oversized, 'snapshot', 'invalid-snapshot');
  });

  it('breaks caller aliases and deeply freezes successful output', () => {
    const input = demandFourInput(1);
    const semantics = input.semantics as Record<string, unknown>;
    const shared = { width: 1, height: 1 };
    const source = (input.packingProblemInput as Record<string, unknown>).source as Record<
      string,
      unknown
    >;
    source.paper = shared;

    const result = searchEuclideanNecessaryWitnessesV1(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('aliased plain snapshot must search');
    semantics.scope = 'caller-mutated';
    shared.width = 99;

    expect(result.value.semanticsReference.scope).not.toBe('caller-mutated');
    expect(result.value.packingProblemReference.candidateReference.gridRegion.width).toEqual({
      numerator: '1',
      denominator: '1',
    });
    expect(allFrozen(result)).toBe(true);
  });
});
