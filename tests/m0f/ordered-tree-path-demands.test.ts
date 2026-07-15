import { describe, expect, it } from 'vitest';

import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import {
  buildOrderedTreePathDemandsV1,
  ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE,
  ORDERED_TREE_PATH_DEMAND_LIMITS,
  ORDERED_TREE_PATH_DEMAND_RESULT_RECORD_TYPE,
} from '../../m0f/box-pleating/ordered-tree-path-demands.js';
import { enumerateOrderedTreeSquareGridCandidatesV1 } from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
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
  const result = enumerateOrderedTreeSquareGridCandidatesV1(source);
  if (!result.ok) throw new Error('test source must enumerate');
  const candidate = result.value.quantization.candidates[0];
  if (candidate === undefined) throw new Error('test source must have a candidate');
  return candidate.candidateId;
}

function demandInput(
  source: Record<string, unknown> = defaultSource(),
  candidateId: string = firstCandidateId(source),
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_PATH_DEMAND_INPUT_RECORD_TYPE,
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
        label: `spine ${suffix}`,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: leafNodeId,
        pos: { x: index, y: 1 },
        label: `leaf ${suffix}`,
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

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectFailure(raw: unknown, stage: string, code: string, path?: string): void {
  const result = buildOrderedTreePathDemandsV1(raw);
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
  expect(Object.isFrozen(result.error)).toBe(true);
}

describe('M0F ordered-tree leaf-pair path demands', () => {
  it('publishes bounded defensive limits without support-profile meaning', () => {
    expect(ORDERED_TREE_PATH_DEMAND_LIMITS).toEqual({
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
    expect(Object.isFrozen(ORDERED_TREE_PATH_DEMAND_LIMITS)).toBe(true);
    expect(ORDERED_TREE_PATH_DEMAND_LIMITS).not.toHaveProperty('supportProfile');
  });

  it('builds the unique 2-leaf path and retains the internal edge width', () => {
    const source = defaultSource();
    const result = buildOrderedTreePathDemandsV1(demandInput(source));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must produce one leaf-pair path');

    expect(result.value.leafNodeIds).toEqual(['node-a', 'node-d']);
    expect(result.value.leafPairCount).toBe(1);
    expect(result.value.pathDemands).toEqual([
      {
        firstLeafId: 'node-a',
        secondLeafId: 'node-d',
        edgeOrder: 'first-leaf-to-second-leaf',
        edges: [
          {
            treeEdgeId: 'edge-terminal-a',
            branchClass: 'terminal',
            lengthSteps: '8',
            widthSteps: '0',
          },
          {
            treeEdgeId: 'edge-internal',
            branchClass: 'internal',
            lengthSteps: '12',
            widthSteps: '2',
          },
          {
            treeEdgeId: 'edge-terminal-d',
            branchClass: 'terminal',
            lengthSteps: '8',
            widthSteps: '1',
          },
        ],
        totalLengthSteps: '28',
        maximumWidthSteps: '2',
      },
    ]);
    expect(result.value.sourceBinding).toEqual({
      treeEdgeCount: 3,
      mappedBranchCount: 3,
      candidateBranchQuantizationCount: 3,
    });
    expect(result.value.candidateReference).toMatchObject({
      candidateId: 'square-grid:12x8:xy:1/8',
      cellSize: { numerator: '1', denominator: '8' },
      maximumRelativeError: { numerator: '0', denominator: '1' },
    });
    expect(allFrozen(result.value)).toBe(true);
  });

  it('resolves a caller-selected non-leading candidate without substituting the first one', () => {
    const source = defaultSource();
    source.relativeErrorLimit = 1;
    const enumerated = enumerateOrderedTreeSquareGridCandidatesV1(source);
    expect(enumerated.ok).toBe(true);
    if (!enumerated.ok) throw new Error('wide error limit must enumerate multiple candidates');
    expect(enumerated.value.quantization.candidates.length).toBeGreaterThan(1);
    const selected = enumerated.value.quantization.candidates.at(-1);
    if (selected === undefined) throw new Error('test candidate must exist');

    const result = buildOrderedTreePathDemandsV1(demandInput(source, selected.candidateId));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('non-leading candidate reference must resolve');
    expect(result.value.candidateReference).toEqual(selected);
    expect(result.value.candidateReference.candidateId).not.toBe(
      enumerated.value.quantization.candidates[0]?.candidateId,
    );
    const selectedById = new Map(
      selected.branchQuantizations.map((branch) => [branch.branchId, branch] as const),
    );
    for (const edge of result.value.pathDemands[0]?.edges ?? []) {
      const selectedBranch = selectedById.get(edge.treeEdgeId);
      expect(selectedBranch).toBeDefined();
      expect(edge).toEqual({
        treeEdgeId: selectedBranch?.branchId,
        branchClass: selectedBranch?.branchClass,
        lengthSteps: selectedBranch?.length.steps,
        widthSteps: selectedBranch?.width.steps,
      });
    }
  });

  it('covers all 190 strict unordered pairs at the 20-leaf boundary', () => {
    const source = maximalCaterpillarSource();
    const result = buildOrderedTreePathDemandsV1(demandInput(source));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('20-leaf star must produce path demands');

    expect(result.value.leafNodeIds).toHaveLength(20);
    expect(result.value.leafPairCount).toBe(190);
    expect(result.value.pathDemands).toHaveLength(190);
    expect(result.value.pathDemands[0]).toMatchObject({
      firstLeafId: 'leaf-00',
      secondLeafId: 'leaf-01',
      totalLengthSteps: '24',
      maximumWidthSteps: '2',
    });
    expect(result.value.pathDemands.at(-1)).toMatchObject({
      firstLeafId: 'leaf-18',
      secondLeafId: 'leaf-19',
    });
    expect(result.value.sourceBinding).toEqual({
      treeEdgeCount: 39,
      mappedBranchCount: 39,
      candidateBranchQuantizationCount: 39,
    });
    expect(
      new Set(result.value.pathDemands.flatMap((path) => path.edges.map((edge) => edge.treeEdgeId)))
        .size,
    ).toBe(39);
    expect(
      new Set(result.value.pathDemands.map((path) => `${path.firstLeafId}\0${path.secondLeafId}`))
        .size,
    ).toBe(190);
  });

  it('keeps 20-leaf path sums exact when quantized steps have hundreds of digits', () => {
    const source = maximalCaterpillarSource();
    const tree = source.orderedTree as MutableTree;
    for (const edge of tree.edges) {
      edge.length = Number.MAX_VALUE;
      edge.width = Number.MAX_VALUE;
    }
    source.paper = { width: Number.MIN_VALUE, height: Number.MIN_VALUE };
    source.maxColumns = 1;
    source.maxRows = 1;
    source.relativeErrorLimit = 1;

    const result = buildOrderedTreePathDemandsV1(demandInput(source));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('extreme finite values must retain exact integer paths');
    expect(result.value.pathDemands).toHaveLength(190);

    const quantizationById = new Map(
      result.value.candidateReference.branchQuantizations.map((branch) => [
        branch.branchId,
        branch,
      ]),
    );
    expect(
      result.value.candidateReference.branchQuantizations[0]?.length.steps.length,
    ).toBeGreaterThan(600);
    for (const path of result.value.pathDemands) {
      let expectedLength = 0n;
      let expectedWidth = 0n;
      for (const edge of path.edges) {
        const quantization = quantizationById.get(edge.treeEdgeId);
        if (quantization === undefined) throw new Error('path edge must be candidate-bound');
        const length = BigInt(quantization.length.steps);
        const width = BigInt(quantization.width.steps);
        expectedLength += length;
        if (width > expectedWidth) expectedWidth = width;
      }
      expect(path.totalLengthSteps).toBe(expectedLength.toString());
      expect(path.maximumWidthSteps).toBe(expectedWidth.toString());
    }
  });

  it('is deterministic under external node, edge, and rotation-entry permutations', () => {
    const firstSource = defaultSource();
    const candidateId = firstCandidateId(firstSource);
    const secondSource = structuredClone(firstSource);
    const tree = secondSource.orderedTree as MutableTree;
    tree.nodes.reverse();
    tree.edges.reverse();
    tree.rotation.reverse();
    expect(buildOrderedTreePathDemandsV1(demandInput(firstSource, candidateId))).toEqual(
      buildOrderedTreePathDemandsV1(demandInput(secondSource, candidateId)),
    );
  });

  it('owns the source-derived result before later caller mutation', () => {
    const source = defaultSource();
    const raw = demandInput(source);
    const result = buildOrderedTreePathDemandsV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must produce path demands');
    const tree = source.orderedTree as MutableTree;
    const internalEdge = tree.edges[1];
    if (internalEdge === undefined) throw new Error('internal test edge is missing');
    internalEdge.width = 99;
    source.maxColumns = 1;
    raw.candidateId = 'changed';
    expect(result.value.pathDemands[0]?.maximumWidthSteps).toBe('2');
    expect(result.value.candidateReference.columns).toBe(12);
    expect(allFrozen(result.value)).toBe(true);
  });

  it('states the candidate-only metric-independent boundary and fixes every downstream claim false', () => {
    const result = buildOrderedTreePathDemandsV1(demandInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('default source must produce path demands');
    expect(result.value).toMatchObject({
      recordType: ORDERED_TREE_PATH_DEMAND_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'metric-independent-tree-path-demand-only',
      interpretation: 'metric-independent tree path demand only',
      lengthAggregation: 'sum-of-path-edge-length-steps',
      widthAggregation: 'maximum-path-edge-width-steps-without-packing-semantics',
      candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source',
      automaticCandidateSelectionIncluded: false,
      metricSelectionIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      polygonRiverPackingIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toMatch(/"contractStatus":"(?:selected|supported|verified|passed|go)"/i);
    expect(serialized).not.toMatch(
      /"(?:automaticCandidateSelectionIncluded|metricSelectionIncluded|placementIncluded|packingIncluded|polygonRiverPackingIncluded|hingeConstructionIncluded|ridgeConstructionIncluded|axialConstructionIncluded|creasePatternIncluded|mountainValleyIncluded|foldabilityIncluded|feasibilityDecisionIncluded|globalM0fGo)":true/,
    );
  });
});

describe('M0F ordered-tree path-demand fail-closed boundary', () => {
  it('rejects an unknown candidate without substituting another candidate', () => {
    expectFailure(
      demandInput(defaultSource(), 'square-grid:not-present'),
      'candidate-reference',
      'candidate-not-found',
      '$.candidateId',
    );
  });

  it('treats an empty bounded enumeration only as a missing reference, never as no-solution evidence', () => {
    const result = buildOrderedTreePathDemandsV1(
      demandInput(emptyCandidateSource(), 'square-grid:not-present'),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('empty enumeration cannot satisfy a candidate reference');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'candidate-reference',
        path: '$.candidateId',
        code: 'candidate-not-found',
      }),
    );
    expect(JSON.stringify(result)).not.toMatch(/no[- ]solution/i);
    expect(JSON.stringify(result)).not.toMatch(/infeasible/i);
  });

  it('rejects outer and embedded claim escalation without returning partial demands', () => {
    expectFailure(
      { ...demandInput(), contractStatus: 'verified' },
      'path-demand-input',
      'claim-boundary',
      '$.contractStatus',
    );
    expectFailure(
      { ...demandInput(), scientificClaim: true },
      'path-demand-input',
      'claim-boundary',
      '$.scientificClaim',
    );
    const embedded = demandInput();
    (embedded.source as Record<string, unknown>).contractStatus = 'verified';
    expectFailure(embedded, 'source-enumeration', 'claim-boundary', '$.source.contractStatus');
  });

  it('rejects missing and unknown root fields at the closed input boundary', () => {
    const missing = demandInput();
    delete missing.candidateId;
    expectFailure(missing, 'path-demand-input', 'missing-field', '$.candidateId');
    expectFailure(
      { ...demandInput(), automaticCandidateSelectionIncluded: true },
      'path-demand-input',
      'unknown-field',
      '$.automaticCandidateSelectionIncluded',
    );
  });

  it('rejects hostile, sparse, accessor-bearing, and over-budget snapshots', () => {
    const cyclic = demandInput();
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot', '$');

    const sparse = demandInput();
    const source = sparse.source as Record<string, unknown>;
    const tree = source.orderedTree as MutableTree;
    tree.nodes = new Array<MutableTree['nodes'][number]>(2);
    expectFailure(sparse, 'snapshot', 'invalid-snapshot', '$');

    expectFailure(new Map(Object.entries(demandInput())), 'snapshot', 'invalid-snapshot', '$');
    expectFailure(
      demandInput(
        defaultSource(),
        'x'.repeat(ORDERED_TREE_PATH_DEMAND_LIMITS.maxStringCodeUnits + 1),
      ),
      'snapshot',
      'invalid-snapshot',
      '$',
    );

    const accessor = demandInput();
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
