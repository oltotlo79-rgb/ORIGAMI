import { describe, expect, it } from 'vitest';

import {
  adaptOrderedTreeToSquareGridCandidateInputV1,
  ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
  ORDERED_TREE_GRID_QUANTIZATION_LIMITS,
  ORDERED_TREE_GRID_QUANTIZATION_RESULT_RECORD_TYPE,
} from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import { SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/square-grid-candidates.js';

interface MutableNode {
  id: string;
  pos: { x: number; y: number };
  label: string;
  mirrorOf: string | null;
  onSymmetryAxis: boolean;
}

interface MutableEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  width: number;
  label: string;
  mirrorOf: string | null;
}

interface MutableRotation {
  nodeId: string;
  edgeIds: string[];
}

interface MutableTree {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  scientificClaim: boolean;
  nodes: MutableNode[];
  edges: MutableEdge[];
  rotation: MutableRotation[];
}

interface MutableAdapterInput {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  scientificClaim: boolean;
  orderedTree: MutableTree;
  paper: { width: number; height: number };
  maxColumns: number;
  maxRows: number;
  relativeErrorLimit: number;
}

function pathTree(): MutableTree {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      {
        id: 'node-d',
        pos: { x: 3, y: 0 },
        label: 'D',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'node-a',
        pos: { x: 0, y: 0 },
        label: 'A',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'node-c',
        pos: { x: 2, y: 0 },
        label: 'C',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'node-b',
        pos: { x: 1, y: 0 },
        label: 'B',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    ],
    edges: [
      {
        id: 'edge-3',
        from: 'node-c',
        to: 'node-d',
        length: 1,
        width: 0,
        label: 'terminal',
        mirrorOf: null,
      },
      {
        id: 'edge-2',
        from: 'node-b',
        to: 'node-c',
        length: 1.5,
        width: 0.25,
        label: 'internal width',
        mirrorOf: null,
      },
      {
        id: 'edge-1',
        from: 'node-a',
        to: 'node-b',
        length: 1,
        width: 0,
        label: 'terminal',
        mirrorOf: null,
      },
    ],
    rotation: [
      { nodeId: 'node-d', edgeIds: ['edge-3'] },
      { nodeId: 'node-b', edgeIds: ['edge-2', 'edge-1'] },
      { nodeId: 'node-a', edgeIds: ['edge-1'] },
      { nodeId: 'node-c', edgeIds: ['edge-3', 'edge-2'] },
    ],
  };
}

function adapterInput(tree: MutableTree = pathTree()): MutableAdapterInput {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: tree,
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
  };
}

function starTree(leafCount: number): MutableTree {
  const nodes: MutableNode[] = [
    {
      id: 'center',
      pos: { x: 0, y: 0 },
      label: 'center',
      mirrorOf: null,
      onSymmetryAxis: false,
    },
  ];
  const edges: MutableEdge[] = [];
  const rotation: MutableRotation[] = [];
  for (let index = 0; index < leafCount; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const nodeId = `leaf-${suffix}`;
    const edgeId = `edge-${suffix}`;
    nodes.push({
      id: nodeId,
      pos: { x: index + 1, y: index % 3 },
      label: suffix,
      mirrorOf: null,
      onSymmetryAxis: false,
    });
    edges.push({
      id: edgeId,
      from: 'center',
      to: nodeId,
      length: index + 1,
      width: index % 2 === 0 ? 0.125 : 0,
      label: suffix,
      mirrorOf: null,
    });
    rotation.push({ nodeId, edgeIds: [edgeId] });
  }
  rotation.push({ nodeId: 'center', edgeIds: edges.map((edge) => edge.id).reverse() });
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

function fortyNodePath(): MutableTree {
  const tree = pathTree();
  tree.nodes = [];
  tree.edges = [];
  tree.rotation = [];
  for (let index = 0; index < 40; index += 1) {
    const nodeId = `node-${String(index).padStart(2, '0')}`;
    tree.nodes.push({
      id: nodeId,
      pos: { x: index, y: 0 },
      label: '',
      mirrorOf: null,
      onSymmetryAxis: false,
    });
    const incident: string[] = [];
    if (index > 0) incident.push(`edge-${String(index - 1).padStart(2, '0')}`);
    if (index < 39) incident.push(`edge-${String(index).padStart(2, '0')}`);
    tree.rotation.push({ nodeId, edgeIds: incident });
    if (index < 39) {
      tree.edges.push({
        id: `edge-${String(index).padStart(2, '0')}`,
        from: nodeId,
        to: `node-${String(index + 1).padStart(2, '0')}`,
        length: 1,
        width: index > 0 && index < 38 ? 0.25 : 0,
        label: '',
        mirrorOf: null,
      });
    }
  }
  return tree;
}

function maximalCaterpillarTree(): MutableTree {
  const nodes: MutableNode[] = [];
  const edges: MutableEdge[] = [];
  const rotation: MutableRotation[] = [];
  const longLabel = 'x'.repeat(256);
  const spineNodeId = (index: number): string =>
    `n${String(index).padStart(2, '0')}${'n'.repeat(125)}`;
  const leafNodeId = (index: number): string =>
    `q${String(index).padStart(2, '0')}${'q'.repeat(125)}`;
  const spineEdgeId = (index: number): string =>
    `s${String(index).padStart(2, '0')}${'s'.repeat(125)}`;
  const leafEdgeId = (index: number): string =>
    `l${String(index).padStart(2, '0')}${'l'.repeat(125)}`;

  for (let index = 0; index < 20; index += 1) {
    const spine = spineNodeId(index);
    const leaf = leafNodeId(index);
    const leafEdge = leafEdgeId(index);
    nodes.push(
      {
        id: spine,
        pos: { x: index, y: 0 },
        label: longLabel,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: leaf,
        pos: { x: index, y: 1 },
        label: longLabel,
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    );
    edges.push({
      id: leafEdge,
      from: spine,
      to: leaf,
      length: 1,
      width: 0.125,
      label: longLabel,
      mirrorOf: null,
    });
    rotation.push({ nodeId: leaf, edgeIds: [leafEdge] });

    const incident: string[] = [];
    if (index > 0) incident.push(spineEdgeId(index - 1));
    incident.push(leafEdge);
    if (index < 19) incident.push(spineEdgeId(index));
    rotation.push({ nodeId: spine, edgeIds: incident });

    if (index < 19) {
      edges.push({
        id: spineEdgeId(index),
        from: spine,
        to: spineNodeId(index + 1),
        length: 1.5,
        width: 0.25,
        label: longLabel,
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

function twoNodeTree(): MutableTree {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      {
        id: 'left',
        pos: { x: 0, y: 0 },
        label: '',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'right',
        pos: { x: 1, y: 0 },
        label: '',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
    ],
    edges: [
      {
        id: 'only-edge',
        from: 'left',
        to: 'right',
        length: 1,
        width: 0.5,
        label: '',
        mirrorOf: null,
      },
    ],
    rotation: [
      { nodeId: 'right', edgeIds: ['only-edge'] },
      { nodeId: 'left', edgeIds: ['only-edge'] },
    ],
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function arrayEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`missing test entry ${String(index)}`);
  return value;
}

function expectFailure(raw: unknown, stage: string, code: string, pathPrefix?: string): void {
  const result = adaptOrderedTreeToSquareGridCandidateInputV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected ${stage}/${code}`);
  expect(
    result.error.some(
      (issue) =>
        issue.stage === stage &&
        issue.code === code &&
        (pathPrefix === undefined || issue.path.startsWith(pathPrefix)),
    ),
  ).toBe(true);
  expect(result).not.toHaveProperty('value');
  expect(Object.isFrozen(result.error)).toBe(true);
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

describe('M0F ordered-tree to square-grid candidate input adapter', () => {
  it('publishes bounded snapshot limits without SupportProfile semantics', () => {
    expect(ORDERED_TREE_GRID_QUANTIZATION_LIMITS).toEqual({
      maxOrderedTreeNodes: 40,
      maxOrderedTreeEdges: 39,
      maxArrayLength: 40,
      maxContainerCount: 256,
      maxDepth: 7,
      maxObjectPropertyCount: 12,
      maxPropertyNameCodeUnits: 64,
      maxStringCodeUnits: 4096,
      maxTotalStringCodeUnits: 131072,
      maxTotalPropertyCount: 1024,
    });
    expect(Object.isFrozen(ORDERED_TREE_GRID_QUANTIZATION_LIMITS)).toBe(true);
    expect(ORDERED_TREE_GRID_QUANTIZATION_LIMITS).not.toHaveProperty('supportProfile');
  });

  it('maps every edge one-to-one and retains an internal branch width', () => {
    const result = adaptOrderedTreeToSquareGridCandidateInputV1(adapterInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('path input must adapt');
    expect(result.value.squareGridInput).toMatchObject({
      recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
      paper: { width: 1.5, height: 1 },
      maxColumns: 12,
      maxRows: 12,
      relativeErrorLimit: 0.01,
    });
    expect(result.value.squareGridInput.branches).toEqual([
      { id: 'edge-1', branchClass: 'terminal', length: 1, width: 0 },
      { id: 'edge-2', branchClass: 'internal', length: 1.5, width: 0.25 },
      { id: 'edge-3', branchClass: 'terminal', length: 1, width: 0 },
    ]);
    expect(result.value.branchMapping).toEqual([
      {
        treeEdgeId: 'edge-1',
        squareGridBranchId: 'edge-1',
        branchClass: 'terminal',
        length: 1,
        width: 0,
      },
      {
        treeEdgeId: 'edge-2',
        squareGridBranchId: 'edge-2',
        branchClass: 'internal',
        length: 1.5,
        width: 0.25,
      },
      {
        treeEdgeId: 'edge-3',
        squareGridBranchId: 'edge-3',
        branchClass: 'terminal',
        length: 1,
        width: 0,
      },
    ]);
    expect(result.value.branchMapping).toHaveLength(result.value.orderedTree.edges.length);
    expect(allFrozen(result.value)).toBe(true);
  });

  it('accepts the 2-leaf, 20-leaf, and 40-node/39-edge boundaries', () => {
    const twoNode = adaptOrderedTreeToSquareGridCandidateInputV1(adapterInput(twoNodeTree()));
    const twentyLeaf = adaptOrderedTreeToSquareGridCandidateInputV1(adapterInput(starTree(20)));
    const fortyNode = adaptOrderedTreeToSquareGridCandidateInputV1(adapterInput(fortyNodePath()));
    expect(twoNode.ok).toBe(true);
    expect(twentyLeaf.ok).toBe(true);
    expect(fortyNode.ok).toBe(true);
    if (!twoNode.ok || !twentyLeaf.ok || !fortyNode.ok) {
      throw new Error('all defensive boundaries must adapt');
    }
    expect(twoNode.value.squareGridInput.branches).toEqual([
      { id: 'only-edge', branchClass: 'terminal', length: 1, width: 0.5 },
    ]);
    expect(twentyLeaf.value.squareGridInput.branches).toHaveLength(20);
    expect(
      twentyLeaf.value.squareGridInput.branches.every(
        (branch) => branch.branchClass === 'terminal',
      ),
    ).toBe(true);
    expect(fortyNode.value.orderedTree.derived.counts).toMatchObject({ nodes: 40, edges: 39 });
    expect(fortyNode.value.squareGridInput.branches).toHaveLength(39);
  });

  it('accepts the simultaneous 40-node, 39-edge, 20-leaf, long-text, and grid bounds', () => {
    const raw = adapterInput(maximalCaterpillarTree());
    raw.maxColumns = 512;
    raw.maxRows = 512;
    const result = adaptOrderedTreeToSquareGridCandidateInputV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('simultaneous defensive boundary must adapt');
    expect(result.value.orderedTree.derived.counts).toMatchObject({
      nodes: 40,
      edges: 39,
      leaves: 20,
      terminalEdges: 20,
      internalEdges: 19,
    });
    expect(result.value.squareGridInput).toMatchObject({ maxColumns: 512, maxRows: 512 });
    expect(result.value.squareGridInput.branches).toHaveLength(39);
    expect((512 + 512) * result.value.squareGridInput.branches.length).toBe(39_936);
  });

  it('is invariant to external node, edge, and rotation-entry order', () => {
    const raw = adapterInput();
    const first = adaptOrderedTreeToSquareGridCandidateInputV1(raw);
    const permuted = clone(raw);
    permuted.orderedTree.nodes.reverse();
    permuted.orderedTree.edges.reverse();
    permuted.orderedTree.rotation.reverse();
    const second = adaptOrderedTreeToSquareGridCandidateInputV1(permuted);
    expect(first).toEqual(second);
  });

  it('owns and deeply freezes the accepted input before caller mutation', () => {
    const raw = adapterInput();
    const result = adaptOrderedTreeToSquareGridCandidateInputV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('path input must adapt');
    arrayEntry(raw.orderedTree.edges, 1).width = 99;
    raw.paper.width = 99;
    raw.maxColumns = 1;
    expect(result.value.squareGridInput).toMatchObject({
      paper: { width: 1.5, height: 1 },
      maxColumns: 12,
    });
    expect(result.value.branchMapping.find((entry) => entry.treeEdgeId === 'edge-2')?.width).toBe(
      0.25,
    );
    expect(allFrozen(result.value)).toBe(true);
  });

  it('emits a candidate adapter result with every downstream claim fixed false', () => {
    const result = adaptOrderedTreeToSquareGridCandidateInputV1(adapterInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('path input must adapt');
    expect(result.value).toMatchObject({
      recordType: ORDERED_TREE_GRID_QUANTIZATION_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-to-square-grid-input-adapter-only',
      enumerationIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toMatch(/"contractStatus":"(?:selected|supported|verified|passed|go)"/i);
    expect(serialized).not.toMatch(
      /"(?:scientificClaim|enumerationIncluded|placementIncluded|packingIncluded|creasePatternIncluded|pleatRoutingIncluded|mountainValleyIncluded|foldabilityIncluded|feasibilityDecisionIncluded|globalM0fGo)":true/,
    );
  });
});

describe('M0F ordered-tree grid adapter fail-closed stages', () => {
  it('rejects root claim escalation, missing fields, and unknown fields before adaptation', () => {
    expectFailure(
      { ...adapterInput(), contractStatus: 'verified' },
      'adapter-input',
      'claim-boundary',
      '$.contractStatus',
    );
    expectFailure(
      { ...adapterInput(), scientificClaim: true },
      'adapter-input',
      'claim-boundary',
      '$.scientificClaim',
    );
    expectFailure(
      { ...adapterInput(), enumerationIncluded: true },
      'adapter-input',
      'unknown-field',
      '$.enumerationIncluded',
    );
    const missing = adapterInput() as unknown as Record<string, unknown>;
    delete missing.orderedTree;
    expectFailure(missing, 'adapter-input', 'missing-field', '$.orderedTree');
  });

  it('prefixes ordered-tree structural and mirror failures and exposes no partial result', () => {
    const selfLoop = adapterInput();
    const edge = arrayEntry(selfLoop.orderedTree.edges, 0);
    edge.to = edge.from;
    expectFailure(selfLoop, 'ordered-tree', 'tree-self-loop', '$.orderedTree.edges');

    const rotation = adapterInput();
    arrayEntry(rotation.orderedTree.rotation, 0).edgeIds = ['unknown-edge'];
    expectFailure(rotation, 'ordered-tree', 'missing-reference', '$.orderedTree.rotation');

    const mirror = adapterInput();
    arrayEntry(mirror.orderedTree.nodes, 0).mirrorOf = 'missing-node';
    expectFailure(mirror, 'ordered-tree', 'mirror-reference-mismatch', '$.orderedTree.nodes');
  });

  it('delegates paper, grid bounds, error, and closed-paper checks to the grid parser', () => {
    const paper = adapterInput();
    paper.paper.width = 0;
    expectFailure(paper, 'square-grid-input', 'invalid-bound', '$.squareGridInput.paper.width');

    const columns = adapterInput();
    columns.maxColumns = 513;
    expectFailure(columns, 'square-grid-input', 'invalid-bound', '$.squareGridInput.maxColumns');

    const rows = adapterInput();
    rows.maxRows = 0;
    expectFailure(rows, 'square-grid-input', 'invalid-bound', '$.squareGridInput.maxRows');

    const error = adapterInput();
    error.relativeErrorLimit = -0.01;
    expectFailure(
      error,
      'square-grid-input',
      'invalid-bound',
      '$.squareGridInput.relativeErrorLimit',
    );

    const closedPaper = adapterInput() as unknown as {
      paper: Record<string, unknown>;
    };
    closedPaper.paper.unit = 'unit';
    expectFailure(
      closedPaper,
      'square-grid-input',
      'unknown-field',
      '$.squareGridInput.paper.unit',
    );
  });

  it('rejects hostile snapshots and bounded-budget overflows', () => {
    const cyclic = adapterInput() as unknown as Record<string, unknown>;
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot', '$');

    const sparse = adapterInput();
    sparse.orderedTree.nodes = new Array<MutableNode>(2);
    expectFailure(sparse, 'snapshot', 'invalid-snapshot', '$');

    expectFailure(new Map(Object.entries(adapterInput())), 'snapshot', 'invalid-snapshot', '$');

    const oversizedObject = adapterInput() as unknown as Record<string, unknown>;
    for (let index = 0; index < 4; index += 1) oversizedObject[`extra-${String(index)}`] = index;
    expectFailure(oversizedObject, 'snapshot', 'invalid-snapshot', '$');
  });

  it('rejects accessors without invoking getters', () => {
    const raw = adapterInput() as unknown as Record<string, unknown>;
    let getterCalls = 0;
    Object.defineProperty(raw, 'scientificClaim', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return false;
      },
    });
    expectFailure(raw, 'snapshot', 'invalid-snapshot', '$');
    expect(getterCalls).toBe(0);
  });

  it('rejects nested exotic properties before either downstream parser runs', () => {
    const raw = adapterInput();
    Object.defineProperty(arrayEntry(raw.orderedTree.nodes, 0), 'hidden', {
      enumerable: false,
      value: true,
    });
    expectFailure(raw, 'snapshot', 'invalid-snapshot', '$');

    const symbol = adapterInput();
    const node = arrayEntry(symbol.orderedTree.nodes, 0) as unknown as Record<PropertyKey, unknown>;
    node[Symbol('hidden')] = true;
    expectFailure(symbol, 'snapshot', 'invalid-snapshot', '$');
  });
});
