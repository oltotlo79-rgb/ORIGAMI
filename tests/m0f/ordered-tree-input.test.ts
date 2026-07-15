import { describe, expect, it } from 'vitest';

import {
  analyzeOrderedTreeInputV1,
  ORDERED_TREE_INPUT_LIMITS,
  ORDERED_TREE_INPUT_RECORD_TYPE,
  ORDERED_TREE_RESULT_RECORD_TYPE,
  parseOrderedTreeInputV1,
} from '../../m0f/box-pleating/ordered-tree-input.js';

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

interface MutableInput {
  schemaVersion: number;
  recordType: string;
  contractStatus: string;
  scientificClaim: boolean;
  nodes: MutableNode[];
  edges: MutableEdge[];
  rotation: MutableRotation[];
}

function pathInput(): MutableInput {
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
        id: 'node-b',
        pos: { x: 1, y: 0 },
        label: 'B',
        mirrorOf: null,
        onSymmetryAxis: false,
      },
      {
        id: 'node-a',
        pos: { x: -0, y: 0 },
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
    ],
    edges: [
      {
        id: 'edge-3',
        from: 'node-c',
        to: 'node-d',
        length: 1,
        width: 0,
        label: 'terminal right',
        mirrorOf: null,
      },
      {
        id: 'edge-1',
        from: 'node-a',
        to: 'node-b',
        length: 1,
        width: 0,
        label: 'terminal left',
        mirrorOf: null,
      },
      {
        id: 'edge-2',
        from: 'node-b',
        to: 'node-c',
        length: 1.5,
        width: 0.25,
        label: 'internal with width',
        mirrorOf: null,
      },
    ],
    rotation: [
      { nodeId: 'node-c', edgeIds: ['edge-3', 'edge-2'] },
      { nodeId: 'node-a', edgeIds: ['edge-1'] },
      { nodeId: 'node-d', edgeIds: ['edge-3'] },
      { nodeId: 'node-b', edgeIds: ['edge-2', 'edge-1'] },
    ],
  };
}

function starInput(leafCount: number): MutableInput {
  const center: MutableNode = {
    id: 'center',
    pos: { x: 0, y: 0 },
    label: 'center',
    mirrorOf: null,
    onSymmetryAxis: false,
  };
  const nodes: MutableNode[] = [center];
  const edges: MutableEdge[] = [];
  const rotation: MutableRotation[] = [];
  for (let index = 0; index < leafCount; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const nodeId = `leaf-${suffix}`;
    const edgeId = `edge-${suffix}`;
    nodes.push({
      id: nodeId,
      pos: { x: index + 1, y: index % 2 },
      label: suffix,
      mirrorOf: null,
      onSymmetryAxis: false,
    });
    edges.push({
      id: edgeId,
      from: 'center',
      to: nodeId,
      length: index + 1,
      width: index === 0 ? 0.5 : 0,
      label: suffix,
      mirrorOf: null,
    });
    rotation.push({ nodeId, edgeIds: [edgeId] });
  }
  rotation.push({
    nodeId: 'center',
    edgeIds: edges.map((edge) => edge.id).reverse(),
  });
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

function mirroredInput(): MutableInput {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      {
        id: 'axis',
        pos: { x: 0, y: 0 },
        label: 'axis',
        mirrorOf: 'axis',
        onSymmetryAxis: true,
      },
      {
        id: 'left',
        pos: { x: -1, y: 1 },
        label: 'left',
        mirrorOf: 'right',
        onSymmetryAxis: false,
      },
      {
        id: 'right',
        pos: { x: 1, y: 1 },
        label: 'right',
        mirrorOf: 'left',
        onSymmetryAxis: false,
      },
    ],
    edges: [
      {
        id: 'edge-left',
        from: 'axis',
        to: 'left',
        length: 1,
        width: 0.125,
        label: 'left',
        mirrorOf: 'edge-right',
      },
      {
        id: 'edge-right',
        from: 'axis',
        to: 'right',
        length: 1,
        width: 0.125,
        label: 'right',
        mirrorOf: 'edge-left',
      },
    ],
    rotation: [
      { nodeId: 'left', edgeIds: ['edge-left'] },
      { nodeId: 'axis', edgeIds: ['edge-right', 'edge-left'] },
      { nodeId: 'right', edgeIds: ['edge-right'] },
    ],
  };
}

function degreeThreeMirroredInput(): MutableInput {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    nodes: [
      {
        id: 'left',
        pos: { x: -1, y: 0 },
        label: 'left',
        mirrorOf: 'right',
        onSymmetryAxis: false,
      },
      {
        id: 'right',
        pos: { x: 1, y: 0 },
        label: 'right',
        mirrorOf: 'left',
        onSymmetryAxis: false,
      },
      {
        id: 'left-a',
        pos: { x: -2, y: 1 },
        label: 'left A',
        mirrorOf: 'right-a',
        onSymmetryAxis: false,
      },
      {
        id: 'right-a',
        pos: { x: 2, y: 1 },
        label: 'right A',
        mirrorOf: 'left-a',
        onSymmetryAxis: false,
      },
      {
        id: 'left-b',
        pos: { x: -2, y: -1 },
        label: 'left B',
        mirrorOf: 'right-b',
        onSymmetryAxis: false,
      },
      {
        id: 'right-b',
        pos: { x: 2, y: -1 },
        label: 'right B',
        mirrorOf: 'left-b',
        onSymmetryAxis: false,
      },
    ],
    edges: [
      {
        id: 'bridge',
        from: 'left',
        to: 'right',
        length: 2,
        width: 0.5,
        label: 'self mirror',
        mirrorOf: 'bridge',
      },
      {
        id: 'edge-left-a',
        from: 'left',
        to: 'left-a',
        length: 1,
        width: 0.125,
        label: 'left A',
        mirrorOf: 'edge-right-a',
      },
      {
        id: 'edge-right-a',
        from: 'right',
        to: 'right-a',
        length: 1,
        width: 0.125,
        label: 'right A',
        mirrorOf: 'edge-left-a',
      },
      {
        id: 'edge-left-b',
        from: 'left',
        to: 'left-b',
        length: 1.5,
        width: 0.25,
        label: 'left B',
        mirrorOf: 'edge-right-b',
      },
      {
        id: 'edge-right-b',
        from: 'right',
        to: 'right-b',
        length: 1.5,
        width: 0.25,
        label: 'right B',
        mirrorOf: 'edge-left-b',
      },
    ],
    rotation: [
      { nodeId: 'left', edgeIds: ['bridge', 'edge-left-a', 'edge-left-b'] },
      { nodeId: 'right', edgeIds: ['bridge', 'edge-right-b', 'edge-right-a'] },
      { nodeId: 'left-a', edgeIds: ['edge-left-a'] },
      { nodeId: 'right-a', edgeIds: ['edge-right-a'] },
      { nodeId: 'left-b', edgeIds: ['edge-left-b'] },
      { nodeId: 'right-b', edgeIds: ['edge-right-b'] },
    ],
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function arrayEntry<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`missing test entry at index ${String(index)}`);
  return value;
}

function rotationEntry(input: MutableInput, nodeId: string): MutableRotation {
  const value = input.rotation.find((entry) => entry.nodeId === nodeId);
  if (value === undefined) throw new Error(`missing test rotation for ${nodeId}`);
  return value;
}

function expectIssue(raw: unknown, code: string): void {
  const parsed = parseOrderedTreeInputV1(raw);
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error(`expected ordered-tree issue ${code}`);
  expect(parsed.error.some((issue) => issue.code === code)).toBe(true);
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Object.values(value).every((child) => allFrozen(child, seen));
}

describe('M0F ordered-tree input candidate boundary', () => {
  it('publishes defensive ceilings without SupportProfile semantics', () => {
    expect(ORDERED_TREE_INPUT_LIMITS).toEqual({
      minLeaves: 2,
      maxLeaves: 20,
      maxNodes: 40,
      maxEdges: 39,
      maxDegree: 20,
      maxIdCodeUnits: 128,
      maxLabelCodeUnits: 256,
      maxSnapshotStringCodeUnits: 4096,
      maxSnapshotArrayLength: 40,
      maxSnapshotContainerCount: 512,
      maxSnapshotDepth: 6,
      maxSnapshotObjectPropertyCount: 8,
      maxSnapshotPropertyNameCodeUnits: 64,
      maxSnapshotTotalStringCodeUnits: 131072,
      maxSnapshotTotalPropertyCount: 1024,
    });
    expect(Object.isFrozen(ORDERED_TREE_INPUT_LIMITS)).toBe(true);
    expect(ORDERED_TREE_INPUT_LIMITS).not.toHaveProperty('supportProfile');
    expect(ORDERED_TREE_INPUT_LIMITS).not.toHaveProperty('supported');
  });

  it('accepts internal-branch width and derives stable leaf/internal classifications', () => {
    const result = analyzeOrderedTreeInputV1(pathInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('path tree must analyze');
    expect(result.value.nodes.map((node) => node.id)).toEqual([
      'node-a',
      'node-b',
      'node-c',
      'node-d',
    ]);
    expect(result.value.edges.map((edge) => edge.id)).toEqual(['edge-1', 'edge-2', 'edge-3']);
    expect(result.value.edges[1]).toMatchObject({ id: 'edge-2', width: 0.25 });
    expect(result.value.derived).toMatchObject({
      counts: {
        nodes: 4,
        edges: 3,
        leaves: 2,
        internalNodes: 2,
        terminalEdges: 2,
        internalEdges: 1,
        maximumDegree: 2,
      },
      leafNodeIds: ['node-a', 'node-d'],
      internalNodeIds: ['node-b', 'node-c'],
      terminalEdgeIds: ['edge-1', 'edge-3'],
      internalEdgeIds: ['edge-2'],
    });
    expect(result.value.nodes[0]?.pos.x).toBe(0);
    expect(Object.is(result.value.nodes[0]?.pos.x, -0)).toBe(false);
    expect(allFrozen(result.value)).toBe(true);
  });

  it('accepts both the 2-leaf and 20-leaf boundaries', () => {
    const two = analyzeOrderedTreeInputV1(pathInput());
    const twenty = analyzeOrderedTreeInputV1(starInput(20));
    expect(two.ok).toBe(true);
    expect(twenty.ok).toBe(true);
    if (!twenty.ok) throw new Error('20-leaf boundary must analyze');
    expect(twenty.value.derived.counts).toMatchObject({ leaves: 20, maximumDegree: 20 });
    expect(twenty.value.rotation[0]).toEqual({
      nodeId: 'center',
      edgeIds: Array.from(
        { length: 20 },
        (_, index) => `edge-${String(19 - index).padStart(2, '0')}`,
      ),
    });
  });

  it('accepts the 40-node defensive boundary without treating it as support', () => {
    const raw = pathInput();
    raw.nodes = [];
    raw.edges = [];
    raw.rotation = [];
    for (let index = 0; index < 40; index += 1) {
      raw.nodes.push({
        id: `node-${String(index).padStart(2, '0')}`,
        pos: { x: index, y: 0 },
        label: '',
        mirrorOf: null,
        onSymmetryAxis: false,
      });
      const incident: string[] = [];
      if (index > 0) incident.push(`edge-${String(index - 1).padStart(2, '0')}`);
      if (index < 39) incident.push(`edge-${String(index).padStart(2, '0')}`);
      raw.rotation.push({ nodeId: `node-${String(index).padStart(2, '0')}`, edgeIds: incident });
      if (index < 39) {
        raw.edges.push({
          id: `edge-${String(index).padStart(2, '0')}`,
          from: `node-${String(index).padStart(2, '0')}`,
          to: `node-${String(index + 1).padStart(2, '0')}`,
          length: 1,
          width: 0,
          label: '',
          mirrorOf: null,
        });
      }
    }
    const result = analyzeOrderedTreeInputV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('40-node boundary must analyze');
    expect(result.value.derived.counts).toMatchObject({ nodes: 40, edges: 39, leaves: 2 });
    expect(result.value.feasibilityDecisionIncluded).toBe(false);
  });

  it('preserves each cyclic rotation while canonicalizing only outer ID order', () => {
    const raw = pathInput();
    const first = analyzeOrderedTreeInputV1(raw);
    const permuted = clone(raw);
    permuted.nodes.reverse();
    permuted.edges.reverse();
    permuted.rotation.reverse();
    const second = analyzeOrderedTreeInputV1(permuted);
    expect(first).toEqual(second);
    if (!first.ok) throw new Error('path tree must analyze');
    expect(first.value.rotation).toEqual([
      { nodeId: 'node-a', edgeIds: ['edge-1'] },
      { nodeId: 'node-b', edgeIds: ['edge-2', 'edge-1'] },
      { nodeId: 'node-c', edgeIds: ['edge-3', 'edge-2'] },
      { nodeId: 'node-d', edgeIds: ['edge-3'] },
    ]);

    const changedCycle = clone(raw);
    const nodeB = changedCycle.rotation.find((entry) => entry.nodeId === 'node-b');
    if (nodeB === undefined) throw new Error('node-b rotation is missing');
    nodeB.edgeIds.reverse();
    const changed = analyzeOrderedTreeInputV1(changedCycle);
    expect(changed.ok).toBe(true);
    expect(changed).not.toEqual(first);
  });

  it('accepts reciprocal node/edge mirrors, axis self-mirrors, and endpoint correspondence', () => {
    const result = analyzeOrderedTreeInputV1(mirroredInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('mirrored tree must analyze');
    expect(result.value.nodes[0]).toMatchObject({
      id: 'axis',
      mirrorOf: 'axis',
      onSymmetryAxis: true,
    });
    expect(result.value.edges).toMatchObject([
      { id: 'edge-left', mirrorOf: 'edge-right' },
      { id: 'edge-right', mirrorOf: 'edge-left' },
    ]);
  });

  it('accepts dimension-equal mirrored branches with reverse-cyclic rotations', () => {
    const result = analyzeOrderedTreeInputV1(degreeThreeMirroredInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('degree-three mirrored tree must analyze');
    expect(result.value.derived.counts).toMatchObject({
      nodes: 6,
      edges: 5,
      leaves: 4,
      maximumDegree: 3,
    });
  });

  it('accepts a self-mirrored edge whose paired endpoints swap under symmetry', () => {
    const raw = mirroredInput();
    raw.nodes = raw.nodes.filter((node) => node.id !== 'axis');
    raw.edges = [
      {
        id: 'bridge',
        from: 'left',
        to: 'right',
        length: 2,
        width: 0.5,
        label: 'axis-crossing branch',
        mirrorOf: 'bridge',
      },
    ];
    raw.rotation = [
      { nodeId: 'left', edgeIds: ['bridge'] },
      { nodeId: 'right', edgeIds: ['bridge'] },
    ];
    expect(analyzeOrderedTreeInputV1(raw).ok).toBe(true);
  });

  it('owns caller data and remains unchanged after post-parse mutation', () => {
    const raw = pathInput();
    const parsed = parseOrderedTreeInputV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('path tree must parse');
    arrayEntry(raw.nodes, 0).label = 'mutated';
    arrayEntry(raw.edges, 1).width = 99;
    arrayEntry(raw.rotation, 0).edgeIds.reverse();
    expect(parsed.value.nodes.find((node) => node.id === 'node-d')?.label).toBe('D');
    expect(parsed.value.edges.find((edge) => edge.id === 'edge-1')?.width).toBe(0);
    expect(parsed.value.rotation.find((entry) => entry.nodeId === 'node-c')?.edgeIds).toEqual([
      'edge-3',
      'edge-2',
    ]);
    expect(allFrozen(parsed.value)).toBe(true);
  });
});

describe('M0F ordered-tree fail-closed structural validation', () => {
  it('rejects claim escalation and closed-object violations', () => {
    expectIssue({ ...pathInput(), contractStatus: 'verified' }, 'claim-boundary');
    expectIssue({ ...pathInput(), scientificClaim: true }, 'claim-boundary');
    expectIssue({ ...pathInput(), placementIncluded: true }, 'unknown-field');

    const nodeUnknown = pathInput();
    Object.assign(arrayEntry(nodeUnknown.nodes, 0), { evidenceHash: 'none' });
    expectIssue(nodeUnknown, 'unknown-field');

    const posUnknown = pathInput();
    Object.assign(arrayEntry(posUnknown.nodes, 0).pos, { z: 0 });
    expectIssue(posUnknown, 'unknown-field');

    const edgeUnknown = pathInput();
    Object.assign(arrayEntry(edgeUnknown.edges, 0), { branchClass: 'internal' });
    expectIssue(edgeUnknown, 'unknown-field');

    const rotationUnknown = pathInput();
    Object.assign(arrayEntry(rotationUnknown.rotation, 0), { clockwise: false });
    expectIssue(rotationUnknown, 'unknown-field');

    const missing = pathInput() as unknown as Record<string, unknown>;
    delete missing.scientificClaim;
    expectIssue(missing, 'missing-field');
  });

  it('rejects unstable or duplicate IDs across both namespaces', () => {
    const invalid = pathInput();
    arrayEntry(invalid.nodes, 0).id = 'not valid';
    expectIssue(invalid, 'invalid-id');

    const duplicateNode = pathInput();
    arrayEntry(duplicateNode.nodes, 1).id = arrayEntry(duplicateNode.nodes, 0).id;
    expectIssue(duplicateNode, 'duplicate-id');

    const duplicateAcrossKinds = pathInput();
    arrayEntry(duplicateAcrossKinds.edges, 0).id = arrayEntry(duplicateAcrossKinds.nodes, 0).id;
    expectIssue(duplicateAcrossKinds, 'duplicate-id');
  });

  it('rejects nonfinite coordinates/dimensions, invalid bounds, labels, and booleans', () => {
    const coordinate = pathInput();
    arrayEntry(coordinate.nodes, 0).pos.x = Number.NaN;
    expectIssue(coordinate, 'non-finite-number');

    const length = pathInput();
    arrayEntry(length.edges, 0).length = 0;
    expectIssue(length, 'invalid-bound');

    const width = pathInput();
    arrayEntry(width.edges, 0).width = -0.1;
    expectIssue(width, 'invalid-bound');

    const label = pathInput();
    arrayEntry(label.nodes, 0).label = 'x'.repeat(ORDERED_TREE_INPUT_LIMITS.maxLabelCodeUnits + 1);
    expectIssue(label, 'invalid-string');

    const axis = pathInput() as unknown as { nodes: Record<string, unknown>[] };
    arrayEntry(axis.nodes, 0).onSymmetryAxis = 'false';
    expectIssue(axis, 'invalid-boolean');
  });

  it('rejects self-loops, parallel edges, cycles, disconnection, and edge-count mismatch', () => {
    const selfLoop = pathInput();
    arrayEntry(selfLoop.edges, 0).to = arrayEntry(selfLoop.edges, 0).from;
    expectIssue(selfLoop, 'tree-self-loop');

    const parallel = pathInput();
    arrayEntry(parallel.edges, 1).from = arrayEntry(parallel.edges, 0).to;
    arrayEntry(parallel.edges, 1).to = arrayEntry(parallel.edges, 0).from;
    expectIssue(parallel, 'tree-parallel-edge');

    const cycle = pathInput();
    cycle.edges.push({
      id: 'edge-cycle',
      from: 'node-a',
      to: 'node-d',
      length: 1,
      width: 0,
      label: '',
      mirrorOf: null,
    });
    expectIssue(cycle, 'tree-cycle');

    const disconnected = pathInput();
    arrayEntry(disconnected.edges, 2).from = 'node-a';
    arrayEntry(disconnected.edges, 2).to = 'node-b';
    expectIssue(disconnected, 'tree-disconnected');

    const wrongCount = pathInput();
    wrongCount.edges.pop();
    expectIssue(wrongCount, 'edge-count-mismatch');
  });

  it('rejects missing endpoint and every rotation cross-reference failure', () => {
    const endpoint = pathInput();
    arrayEntry(endpoint.edges, 0).from = 'unknown-node';
    expectIssue(endpoint, 'missing-reference');

    const rotationNode = pathInput();
    arrayEntry(rotationNode.rotation, 0).nodeId = 'unknown-node';
    expectIssue(rotationNode, 'missing-reference');

    const rotationEdge = pathInput();
    arrayEntry(rotationEdge.rotation, 0).edgeIds = ['unknown-edge'];
    expectIssue(rotationEdge, 'missing-reference');

    const duplicatedRotation = pathInput();
    arrayEntry(duplicatedRotation.rotation, 1).nodeId = arrayEntry(
      duplicatedRotation.rotation,
      0,
    ).nodeId;
    expectIssue(duplicatedRotation, 'duplicate-reference');
    expectIssue(duplicatedRotation, 'rotation-coverage-mismatch');

    const duplicateIncident = pathInput();
    rotationEntry(duplicateIncident, 'node-b').edgeIds = ['edge-1', 'edge-1'];
    expectIssue(duplicateIncident, 'duplicate-reference');

    const nonincident = pathInput();
    rotationEntry(nonincident, 'node-a').edgeIds = ['edge-3'];
    expectIssue(nonincident, 'rotation-incidence-mismatch');
  });

  it('rejects leaf/degree and defensive collection limit violations', () => {
    expectIssue(starInput(21), 'leaf-count-out-of-range');
    expectIssue(starInput(21), 'degree-limit-exceeded');

    const tooManyNodes = pathInput();
    tooManyNodes.nodes = Array.from({ length: 41 }, (_, index) => ({
      id: `node-${String(index).padStart(2, '0')}`,
      pos: { x: index, y: 0 },
      label: '',
      mirrorOf: null,
      onSymmetryAxis: false,
    }));
    expectIssue(tooManyNodes, 'invalid-snapshot');
  });

  it('rejects dangling, nonreciprocal, axis-incoherent, and endpoint-incoherent mirrors', () => {
    const danglingNode = mirroredInput();
    arrayEntry(danglingNode.nodes, 1).mirrorOf = 'missing';
    expectIssue(danglingNode, 'mirror-reference-mismatch');

    const nodeReciprocity = mirroredInput();
    arrayEntry(nodeReciprocity.nodes, 2).mirrorOf = null;
    expectIssue(nodeReciprocity, 'mirror-reciprocity-mismatch');

    const axis = mirroredInput();
    arrayEntry(axis.nodes, 0).mirrorOf = null;
    expectIssue(axis, 'mirror-axis-mismatch');

    const falseAxis = pathInput();
    arrayEntry(falseAxis.nodes, 0).mirrorOf = arrayEntry(falseAxis.nodes, 0).id;
    expectIssue(falseAxis, 'mirror-axis-mismatch');

    const danglingEdge = mirroredInput();
    arrayEntry(danglingEdge.edges, 0).mirrorOf = 'missing-edge';
    expectIssue(danglingEdge, 'mirror-reference-mismatch');

    const edgeReciprocity = mirroredInput();
    arrayEntry(edgeReciprocity.edges, 1).mirrorOf = null;
    expectIssue(edgeReciprocity, 'mirror-reciprocity-mismatch');

    const endpoint = mirroredInput();
    arrayEntry(endpoint.edges, 1).to = 'left';
    expectIssue(endpoint, 'mirror-endpoint-mismatch');

    const dimensions = mirroredInput();
    arrayEntry(dimensions.edges, 1).length = 2;
    arrayEntry(dimensions.edges, 1).width = 0.5;
    expectIssue(dimensions, 'mirror-dimension-mismatch');

    const rotation = degreeThreeMirroredInput();
    rotationEntry(rotation, 'right').edgeIds = ['bridge', 'edge-right-a', 'edge-right-b'];
    expectIssue(rotation, 'mirror-rotation-mismatch');
  });
});

describe('M0F ordered-tree strict snapshot and claim boundary', () => {
  it('rejects cycles, sparse arrays, exotic objects, symbols, and nonenumerable data', () => {
    const cyclic = pathInput() as unknown as Record<string, unknown>;
    cyclic.self = cyclic;
    expectIssue(cyclic, 'invalid-snapshot');

    const sparse = pathInput();
    sparse.nodes = new Array<MutableNode>(2);
    expectIssue(sparse, 'invalid-snapshot');

    expectIssue(new Map(Object.entries(pathInput())), 'invalid-snapshot');

    const symbol = pathInput() as unknown as Record<PropertyKey, unknown>;
    symbol[Symbol('hidden')] = true;
    expectIssue(symbol, 'invalid-snapshot');

    const nonEnumerable = pathInput();
    Object.defineProperty(nonEnumerable, 'hidden', { value: true, enumerable: false });
    expectIssue(nonEnumerable, 'invalid-snapshot');

    const longProperty = pathInput() as unknown as Record<string, unknown>;
    longProperty['x'.repeat(ORDERED_TREE_INPUT_LIMITS.maxSnapshotPropertyNameCodeUnits + 1)] = true;
    expectIssue(longProperty, 'invalid-snapshot');

    const tooManyProperties = pathInput() as unknown as Record<string, unknown>;
    tooManyProperties.extraA = true;
    tooManyProperties.extraB = true;
    expectIssue(tooManyProperties, 'invalid-snapshot');
  });

  it('rejects accessors without invoking their getters', () => {
    const accessor = pathInput() as unknown as Record<string, unknown>;
    let getterCalls = 0;
    Object.defineProperty(accessor, 'scientificClaim', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return false;
      },
    });
    expectIssue(accessor, 'invalid-snapshot');
    expect(getterCalls).toBe(0);
  });

  it('accepts harmless shared aliases but breaks caller ownership', () => {
    const raw = pathInput();
    const sharedPosition = { x: 10, y: 20 };
    arrayEntry(raw.nodes, 0).pos = sharedPosition;
    arrayEntry(raw.nodes, 1).pos = sharedPosition;
    const parsed = parseOrderedTreeInputV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('shared acyclic caller aliases must parse');
    sharedPosition.x = 999;
    expect(parsed.value.nodes.find((node) => node.id === 'node-b')?.pos.x).toBe(10);
    expect(parsed.value.nodes.find((node) => node.id === 'node-d')?.pos.x).toBe(10);
  });

  it('emits only candidate/no-claim vocabulary and fixes every downstream claim flag false', () => {
    const result = analyzeOrderedTreeInputV1(pathInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('path tree must analyze');
    expect(result.value).toMatchObject({
      recordType: ORDERED_TREE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-input-validation-only',
      positionQuantizationIncluded: false,
      positionEvidenceIncluded: false,
      labelEvidenceIncluded: false,
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
      /"(?:scientificClaim|positionQuantizationIncluded|positionEvidenceIncluded|labelEvidenceIncluded|placementIncluded|packingIncluded|creasePatternIncluded|pleatRoutingIncluded|mountainValleyIncluded|foldabilityIncluded|feasibilityDecisionIncluded|globalM0fGo)":true/,
    );
  });
});
