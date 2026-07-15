import { describe, expect, it } from 'vitest';

import {
  EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE,
  EUCLIDEAN_NECESSARY_FILTER_LIMITS,
  EUCLIDEAN_NECESSARY_FILTER_RESULT_RECORD_TYPE,
  evaluateEuclideanNecessaryFilterV1,
  type EuclideanNecessaryFilterEvaluationResult,
} from '../../m0f/box-pleating/euclidean-necessary-filter.js';
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

function twoLeafSource(length = 0.5, maxColumns = 8): Record<string, unknown> {
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
    relativeErrorLimit: 0,
  };
}

function candidateId(source: Record<string, unknown>, columns?: number): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  const candidate = enumerated.value.quantization.candidates.find(
    (entry) => columns === undefined || (entry.columns === columns && entry.rows === columns),
  );
  if (candidate === undefined) throw new Error('requested test candidate must exist');
  return candidate.candidateId;
}

function filterInput(
  source: Record<string, unknown>,
  leafAssignments: readonly Record<string, unknown>[],
  selectedCandidateId: string,
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: EUCLIDEAN_NECESSARY_FILTER_INPUT_RECORD_TYPE,
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
    leafAssignments: leafAssignments.map((entry) => ({ ...entry })),
  };
}

function demandFourInput(
  first: Readonly<{ x: number; y: number }>,
  second: Readonly<{ x: number; y: number }>,
): Record<string, unknown> {
  const source = twoLeafSource();
  return filterInput(
    source,
    [
      { leafNodeId: 'leaf-a', ...first },
      { leafNodeId: 'leaf-b', ...second },
    ],
    candidateId(source, 8),
  );
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
): Extract<EuclideanNecessaryFilterEvaluationResult, { ok: false }> {
  const result = evaluateEuclideanNecessaryFilterV1(raw);
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

describe('M0F assigned projected-leaf-anchor Euclidean necessary filter', () => {
  it('rejects the delta (2,2), demand 4 Manhattan counterexample using squared Euclidean distance', () => {
    const result = evaluateEuclideanNecessaryFilterV1(
      demandFourInput({ x: 0, y: 0 }, { x: 2, y: 2 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('valid assignment must evaluate');

    expect(result.value.pairEvaluations).toEqual([
      {
        firstLeafId: 'leaf-a',
        secondLeafId: 'leaf-b',
        absoluteDeltaX: '2',
        absoluteDeltaY: '2',
        actualSquaredDistance: '8',
        requiredSquaredDistance: '16',
        totalLengthSteps: '4',
        maximumWidthSteps: '0',
        passesNecessaryFilter: false,
      },
    ]);
    expect(result.value).toMatchObject({
      allNecessaryFiltersPass: false,
      failedPairCount: 1,
      assignmentRejectedByNecessaryFilter: true,
      manhattanMetricEvaluated: false,
      chebyshevMetricEvaluated: false,
    });
  });

  it('allows Euclidean passing and equality while never promoting either to packing evidence', () => {
    const passing = evaluateEuclideanNecessaryFilterV1(
      demandFourInput({ x: 0, y: 0 }, { x: 3, y: 3 }),
    );
    const equality = evaluateEuclideanNecessaryFilterV1(
      demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 }),
    );
    expect(passing.ok).toBe(true);
    expect(equality.ok).toBe(true);
    if (!passing.ok || !equality.ok) throw new Error('valid assignments must evaluate');

    expect(passing.value.pairEvaluations[0]).toMatchObject({
      actualSquaredDistance: '18',
      requiredSquaredDistance: '16',
      passesNecessaryFilter: true,
    });
    expect(equality.value.pairEvaluations[0]).toMatchObject({
      actualSquaredDistance: '16',
      requiredSquaredDistance: '16',
      passesNecessaryFilter: true,
    });
    for (const result of [passing.value, equality.value]) {
      expect(result).toMatchObject({
        allNecessaryFiltersPass: true,
        failedPairCount: 0,
        assignmentRejectedByNecessaryFilter: false,
        passingIsPackingSufficiencyEvidence: false,
        failureIsGlobalNoSolutionEvidence: false,
        tangencyPolicy: 'allowed-at-equality-for-this-filter',
      });
    }
  });

  it('canonicalizes caller assignment order and preserves full semantics and problem references', () => {
    const first = demandFourInput({ x: 1, y: 2 }, { x: 5, y: 2 });
    const second = structuredClone(first);
    (second.leafAssignments as unknown[]).reverse();
    const firstResult = evaluateEuclideanNecessaryFilterV1(first);
    const secondResult = evaluateEuclideanNecessaryFilterV1(second);
    expect(firstResult).toEqual(secondResult);
    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) throw new Error('valid assignment must evaluate');

    expect(firstResult.value.leafAssignments.map((entry) => entry.leafNodeId)).toEqual([
      'leaf-a',
      'leaf-b',
    ]);
    expect(firstResult.value.semanticsReference).toEqual(BOX_PLEATING_PACKING_SEMANTICS_V1);
    expect(firstResult.value.packingProblemReference.separationConstraintInputs).toHaveLength(1);
    expect(firstResult.value).toMatchObject({
      recordType: EUCLIDEAN_NECESSARY_FILTER_RESULT_RECORD_TYPE,
      assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement',
      pairEvaluationOrder: 'packing-problem-separation-constraint-order',
      filterStrength: 'necessary-only',
      filterEvaluationIncluded: true,
      assignmentIncluded: true,
    });
  });

  it('uses BigInt for exact squared distances beyond Number safe-integer precision', () => {
    const source = twoLeafSource(1_000_000_000, 1);
    const result = evaluateEuclideanNecessaryFilterV1(
      filterInput(
        source,
        [
          { leafNodeId: 'leaf-a', x: 0, y: 0 },
          { leafNodeId: 'leaf-b', x: 1, y: 1 },
        ],
        candidateId(source, 1),
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('large exact path demand must evaluate');
    expect(result.value.pairEvaluations[0]).toMatchObject({
      actualSquaredDistance: '2',
      totalLengthSteps: '1000000000',
      requiredSquaredDistance: '1000000000000000000',
      passesNecessaryFilter: false,
    });
  });

  it('evaluates all 190 canonical leaf pairs at the 20-leaf boundary', () => {
    const source = maximalSource();
    const assignments = Array.from({ length: 20 }, (_, index) => ({
      leafNodeId: `leaf-${String(index).padStart(2, '0')}`,
      x: index % 9,
      y: Math.floor(index / 9),
    }));
    const result = evaluateEuclideanNecessaryFilterV1(
      filterInput(source, assignments, candidateId(source, 8)),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('maximal finite assignment must evaluate');
    expect(result.value.leafAssignments).toHaveLength(20);
    expect(result.value.pairEvaluations).toHaveLength(190);
    expect(result.value.pairEvaluations[0]).toMatchObject({
      firstLeafId: 'leaf-00',
      secondLeafId: 'leaf-01',
    });
    expect(result.value.pairEvaluations.at(-1)).toMatchObject({
      firstLeafId: 'leaf-18',
      secondLeafId: 'leaf-19',
    });
    expect(result.value.failedPairCount).toBe(
      result.value.pairEvaluations.filter((entry) => !entry.passesNecessaryFilter).length,
    );
  });

  it('cuts aliases, deeply freezes success, and canonicalizes negative zero', () => {
    const raw = demandFourInput({ x: -0, y: -0 }, { x: 4, y: 0 });
    const result = evaluateEuclideanNecessaryFilterV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('valid assignment must evaluate');

    const assignments = raw.leafAssignments as Record<string, unknown>[];
    const firstAssignment = assignments[0];
    if (firstAssignment === undefined) throw new Error('first test assignment must exist');
    firstAssignment.x = 7;
    (raw.semantics as Record<string, unknown>).constructionFamily = 'caller-change';
    expect(result.value.leafAssignments[0]).toEqual({ leafNodeId: 'leaf-a', x: 0, y: 0 });
    expect(Object.is(result.value.leafAssignments[0]?.x, -0)).toBe(false);
    expect(result.value.semanticsReference.constructionFamily).toBe('unresolved');
    expect(allFrozen(result)).toBe(true);
  });

  it('keeps every construction, search, geometry, product, and GO claim outside scope', () => {
    const result = evaluateEuclideanNecessaryFilterV1(
      demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('valid assignment must evaluate');
    expect(result.value).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'assigned-projected-leaf-anchor-euclidean-necessary-filter-only',
      constructionFamily: 'unresolved',
      constructionFamilySelectionIncluded: false,
      widthUsedByFilter: false,
      maximumWidthRole: 'trace-only-without-separation-or-packing-semantics',
      globalMetricSelectionIncluded: false,
      actualGeometryIncluded: false,
      globalPackingIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      automaticSearchIncluded: false,
      solverIncluded: false,
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      placementIncluded: false,
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
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toMatch(
      /"(?:scientificClaim|passingIsPackingSufficiencyEvidence|failureIsGlobalNoSolutionEvidence|widthUsedByFilter|manhattanMetricEvaluated|chebyshevMetricEvaluated|globalMetricSelectionIncluded|constructionFamilySelectionIncluded|actualGeometryIncluded|globalPackingIncluded|packingIncluded|polygonRiverPackingIncluded|automaticSearchIncluded|solverIncluded|polygonGeometryIncluded|riverGeometryIncluded|placementIncluded|hingeConstructionIncluded|ridgeConstructionIncluded|axialConstructionIncluded|junctionConstructionIncluded|pleatRoutingIncluded|creasePatternIncluded|mountainValleyIncluded|foldabilityIncluded|feasibilityDecisionIncluded|globalM0fGo|isSupportProfile|supportClaim)":true/,
    );
  });
});

describe('M0F Euclidean necessary-filter fail-closed boundary', () => {
  it('requires every expected leaf exactly once and rejects duplicate or foreign IDs', () => {
    const missing = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    (missing.leafAssignments as unknown[]).pop();
    expectFailure(missing, 'assignment', 'missing-leaf-assignment');

    const duplicate = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    const duplicateAssignment = (duplicate.leafAssignments as Record<string, unknown>[])[1];
    if (duplicateAssignment === undefined) throw new Error('second test assignment must exist');
    duplicateAssignment.leafNodeId = 'leaf-a';
    expectFailure(duplicate, 'assignment', 'duplicate-leaf-assignment');

    const foreign = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    const foreignAssignment = (foreign.leafAssignments as Record<string, unknown>[])[1];
    if (foreignAssignment === undefined) throw new Error('second test assignment must exist');
    foreignAssignment.leafNodeId = 'leaf-z';
    expectFailure(foreign, 'assignment', 'unknown-leaf-assignment');
  });

  it('rejects out-of-domain and non-safe-integer coordinates', () => {
    const outOfBounds = demandFourInput({ x: 0, y: 0 }, { x: 9, y: 0 });
    expectFailure(outOfBounds, 'assignment', 'coordinate-out-of-bounds');

    for (const value of [0.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN]) {
      const invalid = demandFourInput({ x: 0, y: 0 }, { x: value, y: 0 });
      expectFailure(invalid, 'assignment', 'invalid-coordinate');
    }
  });

  it('rejects semantics tampering and outer or embedded claim escalation', () => {
    const semantics = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    (semantics.semantics as Record<string, unknown>).pairwiseNecessaryFilter = 'manhattan-distance';
    expectFailure(semantics, 'semantics', 'invalid-literal', '$.semantics');

    expectFailure(
      { ...demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 }), scientificClaim: true },
      'filter-input',
      'claim-boundary',
      '$.scientificClaim',
    );
    const embedded = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    (embedded.packingProblemInput as Record<string, unknown>).contractStatus = 'verified';
    expectFailure(embedded, 'packing-problem', 'claim-boundary', '$.packingProblemInput');
  });

  it('rejects missing and unknown fields at both closed wrapper levels', () => {
    const missing = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    delete missing.semantics;
    expectFailure(missing, 'filter-input', 'missing-field', '$.semantics');
    expectFailure(
      { ...demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 }), solver: false },
      'filter-input',
      'unknown-field',
      '$.solver',
    );

    const assignment = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    const firstAssignment = (assignment.leafAssignments as Record<string, unknown>[])[0];
    if (firstAssignment === undefined) throw new Error('first test assignment must exist');
    firstAssignment.placement = false;
    expectFailure(assignment, 'assignment', 'unknown-field', '$.leafAssignments[0]');
  });

  it('rejects cycles, accessors, exotic values, and bounded-input overflow without invoking accessors', () => {
    const cyclic = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot', '$');

    expectFailure(
      new Map(Object.entries(demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 }))),
      'snapshot',
      'invalid-snapshot',
      '$',
    );

    let getterCalls = 0;
    const accessor = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    Object.defineProperty(accessor, 'leafAssignments', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return [];
      },
    });
    expectFailure(accessor, 'snapshot', 'invalid-snapshot', '$');
    expect(getterCalls).toBe(0);

    const overflow = demandFourInput({ x: 0, y: 0 }, { x: 4, y: 0 });
    overflow.leafAssignments = Array.from(
      { length: EUCLIDEAN_NECESSARY_FILTER_LIMITS.maxArrayLength + 1 },
      (_, index) => ({ leafNodeId: `x-${String(index)}`, x: 0, y: 0 }),
    );
    expectFailure(overflow, 'snapshot', 'invalid-snapshot', '$');
  });
});
