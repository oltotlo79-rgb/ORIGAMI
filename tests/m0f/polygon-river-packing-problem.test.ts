import { describe, expect, it } from 'vitest';

import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import {
  buildPolygonRiverPackingProblemV1,
  POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_LIMITS,
  POLYGON_RIVER_PACKING_PROBLEM_RESULT_RECORD_TYPE,
} from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { DEFAULT_ORDERED_TREE_INPUT } from '../../m0f/ordered-tree-cli.js';

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

function defaultSource(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: structuredClone(DEFAULT_ORDERED_TREE_INPUT),
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
  };
}

function firstCandidateId(source: Record<string, unknown>): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('test source must enumerate');
  const candidate = enumerated.value.quantization.candidates[0];
  if (candidate === undefined) throw new Error('test source must contain a candidate');
  return candidate.candidateId;
}

function problemInput(
  source: Record<string, unknown> = defaultSource(),
  candidateId: string = firstCandidateId(source),
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source,
    candidateId,
  };
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

function maximalCaterpillarSource(): Record<string, unknown> {
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

function emptyCandidateSource(): Record<string, unknown> {
  const source = defaultSource();
  const tree = source.orderedTree as MutableTree;
  for (const edge of tree.edges) {
    edge.length = 0.3;
    edge.width = 0;
  }
  source.paper = { width: 1, height: 1 };
  source.maxColumns = 1;
  source.maxRows = 1;
  source.relativeErrorLimit = 0;
  return source;
}

function candidateWithResidual(source: Record<string, unknown>): string {
  const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!enumerated.ok) throw new Error('residual test source must enumerate');
  const candidate = enumerated.value.quantization.candidates.find(
    (entry) =>
      entry.residualStrips.xAxis.numerator !== '0' || entry.residualStrips.yAxis.numerator !== '0',
  );
  if (candidate === undefined) throw new Error('residual test candidate must exist');
  return candidate.candidateId;
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectFailure(raw: unknown, stage: string, code: string, path?: string): void {
  const result = buildPolygonRiverPackingProblemV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${stage}/${code}`);
  expect(
    result.error.some(
      (issue) =>
        issue.stage === stage &&
        issue.code === code &&
        (path === undefined || issue.path.startsWith(path)),
    ),
  ).toBe(true);
  expect(result).not.toHaveProperty('value');
  expect(allFrozen(result.error)).toBe(true);
}

describe('M0F finite polygon/river packing CSP problem description', () => {
  it('publishes defensive finite-problem limits without support-profile meaning', () => {
    expect(POLYGON_RIVER_PACKING_PROBLEM_LIMITS).toEqual({
      maxArrayLength: 40,
      maxContainerCount: 320,
      maxDepth: 8,
      maxObjectPropertyCount: 12,
      maxPropertyNameCodeUnits: 64,
      maxStringCodeUnits: 4096,
      maxTotalStringCodeUnits: 262144,
      maxTotalPropertyCount: 2048,
      maxLeaves: 20,
      maxLeafPairs: 190,
      maxTreeEdges: 39,
    });
    expect(Object.isFrozen(POLYGON_RIVER_PACKING_PROBLEM_LIMITS)).toBe(true);
    expect(POLYGON_RIVER_PACKING_PROBLEM_LIMITS).not.toHaveProperty('supportProfile');
  });

  it('describes compact leaf domains, all edge dimensions, and the internal width', () => {
    const result = buildPolygonRiverPackingProblemV1(problemInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must describe a finite problem');

    expect(result.value.activeGridDomain).toEqual({ columns: 12, rows: 8 });
    expect(result.value.leafGridVertexVariables).toEqual([
      {
        leafNodeId: 'node-a',
        x: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 12,
          step: 1,
        },
        y: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 8,
          step: 1,
        },
        assignedCoordinate: null,
      },
      {
        leafNodeId: 'node-d',
        x: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 12,
          step: 1,
        },
        y: {
          representation: 'compact-inclusive-integer-range',
          minimum: 0,
          maximum: 8,
          step: 1,
        },
        assignedCoordinate: null,
      },
    ]);
    expect(result.value.riverDimensionInputs).toEqual([
      {
        treeEdgeId: 'edge-internal',
        firstEndpointNodeId: 'node-b',
        secondEndpointNodeId: 'node-c',
        branchClass: 'internal',
        lengthSteps: '12',
        widthSteps: '2',
      },
      {
        treeEdgeId: 'edge-terminal-a',
        firstEndpointNodeId: 'node-a',
        secondEndpointNodeId: 'node-b',
        branchClass: 'terminal',
        lengthSteps: '8',
        widthSteps: '0',
      },
      {
        treeEdgeId: 'edge-terminal-d',
        firstEndpointNodeId: 'node-c',
        secondEndpointNodeId: 'node-d',
        branchClass: 'terminal',
        lengthSteps: '8',
        widthSteps: '1',
      },
    ]);
    expect(result.value.separationConstraintInputs).toEqual([
      {
        firstLeafId: 'node-a',
        secondLeafId: 'node-d',
        totalLengthSteps: '28',
        maximumWidthSteps: '2',
        pathTreeEdgeIds: ['edge-terminal-a', 'edge-internal', 'edge-terminal-d'],
      },
    ]);
    expect(result.value.sourceBinding).toEqual({
      treeEdgeCount: 3,
      mappedBranchCount: 3,
      sourceBranchCount: 3,
      candidateBranchQuantizationCount: 3,
      riverDimensionInputCount: 3,
      leafCount: 2,
      leafVariableCount: 2,
      leafPairCount: 1,
      separationConstraintInputCount: 1,
    });
    expect(allFrozen(result.value)).toBe(true);
  });

  it('retains both residual axes and explicitly lists a positive rectangular-paper strip', () => {
    const source = defaultSource();
    source.relativeErrorLimit = 1;
    const result = buildPolygonRiverPackingProblemV1(
      problemInput(source, candidateWithResidual(source)),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('residual candidate must describe a finite problem');

    expect(result.value.candidateResidualStrips).toEqual(
      result.value.candidateReference.residualStrips,
    );
    expect(result.value.positiveResidualStrips).toHaveLength(1);
    const positive = result.value.positiveResidualStrips[0];
    if (positive === undefined) throw new Error('one positive residual must be explicit');
    expect(positive.boundary).toBe('positive');
    expect(positive.size.numerator).not.toBe('0');
    expect(positive.size).toEqual(result.value.candidateResidualStrips[`${positive.axis}Axis`]);
    expect(result.value).toMatchObject({
      fullPaperCoverage: false,
      residualStripHandling: 'unresolved',
      positiveResidualStripOrder: 'x-then-y',
    });
  });

  it('covers the simultaneous 39-edge, 20-leaf, and 190-pair boundary compactly', () => {
    const source = maximalCaterpillarSource();
    const result = buildPolygonRiverPackingProblemV1(problemInput(source));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('maximal caterpillar must describe a finite problem');

    expect(result.value.leafGridVertexVariables).toHaveLength(20);
    expect(result.value.riverDimensionInputs).toHaveLength(39);
    expect(result.value.separationConstraintInputs).toHaveLength(190);
    expect(result.value.sourceBinding).toMatchObject({
      treeEdgeCount: 39,
      riverDimensionInputCount: 39,
      leafCount: 20,
      leafVariableCount: 20,
      leafPairCount: 190,
      separationConstraintInputCount: 190,
    });
    expect(result.value.separationConstraintInputs[0]).toMatchObject({
      firstLeafId: 'leaf-00',
      secondLeafId: 'leaf-01',
      totalLengthSteps: '24',
      maximumWidthSteps: '2',
    });
    expect(result.value.separationConstraintInputs.at(-1)).toMatchObject({
      firstLeafId: 'leaf-18',
      secondLeafId: 'leaf-19',
    });
    expect(new Set(result.value.riverDimensionInputs.map((entry) => entry.treeEdgeId)).size).toBe(
      39,
    );
  });

  it('is deterministic under collection permutations and undirected edge reversal', () => {
    const firstSource = defaultSource();
    const candidateId = firstCandidateId(firstSource);
    const secondSource = structuredClone(firstSource);
    const tree = secondSource.orderedTree as MutableTree;
    tree.nodes.reverse();
    tree.edges.reverse();
    tree.rotation.reverse();
    for (const edge of tree.edges) [edge.from, edge.to] = [edge.to, edge.from];

    expect(buildPolygonRiverPackingProblemV1(problemInput(firstSource, candidateId))).toEqual(
      buildPolygonRiverPackingProblemV1(problemInput(secondSource, candidateId)),
    );
  });

  it('cuts caller aliases and deeply freezes the complete problem result', () => {
    const source = defaultSource();
    const raw = problemInput(source);
    const result = buildPolygonRiverPackingProblemV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must describe a finite problem');

    const tree = source.orderedTree as MutableTree;
    const internal = tree.edges.find((edge) => edge.id === 'edge-internal');
    if (internal === undefined) throw new Error('internal test edge must exist');
    internal.width = 99;
    source.maxColumns = 1;
    raw.candidateId = 'changed';
    expect(result.value.activeGridDomain).toEqual({ columns: 12, rows: 8 });
    expect(
      result.value.riverDimensionInputs.find((entry) => entry.treeEdgeId === 'edge-internal'),
    ).toMatchObject({ widthSteps: '2' });
    expect(allFrozen(result.value)).toBe(true);
  });

  it('fixes the unresolved finite-description boundary and every downstream claim false', () => {
    const result = buildPolygonRiverPackingProblemV1(problemInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must describe a finite problem');
    expect(result.value).toMatchObject({
      recordType: POLYGON_RIVER_PACKING_PROBLEM_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'finite-polygon-river-packing-csp-problem-description-only',
      interpretation:
        'finite CSP problem description only; no geometry, metric, assignment, or solver',
      candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source',
      automaticCandidateSelectionIncluded: false,
      treePointSnapIncluded: false,
      metric: 'unresolved',
      metricSelectionIncluded: false,
      constraintEvaluable: false,
      assignmentIncluded: false,
      solverIncluded: false,
      placementIncluded: false,
      fullPaperCoverage: false,
      residualStripHandling: 'unresolved',
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      junctionConstructionIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      riverEndpointOrder: 'first-endpoint-id-then-second-endpoint-id-code-unit',
    });
    expect(result.value.leafGridVertexVariables.map((entry) => entry.assignedCoordinate)).toEqual([
      null,
      null,
    ]);
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toMatch(/"contractStatus":"(?:selected|supported|verified|passed|go)"/i);
    expect(serialized).not.toMatch(
      /"(?:scientificClaim|automaticCandidateSelectionIncluded|treePointSnapIncluded|metricSelectionIncluded|constraintEvaluable|assignmentIncluded|solverIncluded|placementIncluded|fullPaperCoverage|polygonGeometryIncluded|riverGeometryIncluded|packingIncluded|polygonRiverPackingIncluded|hingeConstructionIncluded|ridgeConstructionIncluded|axialConstructionIncluded|junctionConstructionIncluded|creasePatternIncluded|pleatRoutingIncluded|mountainValleyIncluded|foldabilityIncluded|feasibilityDecisionIncluded|globalM0fGo)":true/,
    );
  });
});

describe('M0F polygon/river packing problem fail-closed boundary', () => {
  it('rejects an unknown candidate and an empty enumeration without substitution or no-solution claims', () => {
    expectFailure(
      problemInput(defaultSource(), 'square-grid:not-present'),
      'path-demand',
      'candidate-not-found',
      '$.candidateId',
    );
    const empty = buildPolygonRiverPackingProblemV1(
      problemInput(emptyCandidateSource(), 'square-grid:not-present'),
    );
    expect(empty.ok).toBe(false);
    if (empty.ok) throw new Error('empty enumeration cannot resolve a candidate');
    expect(empty.error).toContainEqual(
      expect.objectContaining({
        stage: 'path-demand',
        path: '$.candidateId',
        code: 'candidate-not-found',
      }),
    );
    expect(JSON.stringify(empty)).not.toMatch(/no[- ]solution/i);
    expect(JSON.stringify(empty)).not.toMatch(/infeasible/i);
  });

  it('rejects outer and embedded claim escalation without a partial problem', () => {
    expectFailure(
      { ...problemInput(), contractStatus: 'verified' },
      'packing-problem-input',
      'claim-boundary',
      '$.contractStatus',
    );
    expectFailure(
      { ...problemInput(), scientificClaim: true },
      'packing-problem-input',
      'claim-boundary',
      '$.scientificClaim',
    );
    const embedded = problemInput();
    (embedded.source as Record<string, unknown>).scientificClaim = true;
    expectFailure(embedded, 'ordered-tree-adapter', 'claim-boundary', '$.source.scientificClaim');
  });

  it('rejects missing and unknown root fields at the closed wrapper', () => {
    const missing = problemInput();
    delete missing.candidateId;
    expectFailure(missing, 'packing-problem-input', 'missing-field', '$.candidateId');
    expectFailure(
      { ...problemInput(), metric: 'euclidean' },
      'packing-problem-input',
      'unknown-field',
      '$.metric',
    );
  });

  it('rejects hostile and over-budget snapshots without invoking accessors', () => {
    const cyclic = problemInput();
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot', '$');

    const sparse = problemInput();
    const source = sparse.source as Record<string, unknown>;
    (source.orderedTree as MutableTree).nodes = new Array<MutableTree['nodes'][number]>(2);
    expectFailure(sparse, 'snapshot', 'invalid-snapshot', '$');

    expectFailure(new Map(Object.entries(problemInput())), 'snapshot', 'invalid-snapshot', '$');
    expectFailure(
      problemInput(
        defaultSource(),
        'x'.repeat(POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxStringCodeUnits + 1),
      ),
      'snapshot',
      'invalid-snapshot',
      '$',
    );

    const accessor = problemInput();
    let getterCalls = 0;
    Object.defineProperty(accessor, 'candidateId', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'candidate';
      },
    });
    expectFailure(accessor, 'snapshot', 'invalid-snapshot', '$');
    expect(getterCalls).toBe(0);
  });
});
