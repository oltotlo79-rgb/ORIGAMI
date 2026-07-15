import { describe, expect, it } from 'vitest';

import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import { ORDERED_TREE_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-input.js';
import {
  buildPolygonRiverPackingProblemV1,
  parsePolygonRiverPackingProblemInputV1,
  POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
  POLYGON_RIVER_PACKING_PROBLEM_LIMITS,
} from '../../m0f/box-pleating/polygon-river-packing-problem.js';
import { DEFAULT_ORDERED_TREE_INPUT } from '../../m0f/ordered-tree-cli.js';

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
  edges: {
    id: string;
    from: string;
    to: string;
    length: number;
    width: number;
    label: string;
    mirrorOf: string | null;
  }[];
  rotation: { nodeId: string; edgeIds: string[] }[];
}

type JsonRecord = Record<string, unknown>;

function source(): JsonRecord {
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

function input(
  embeddedSource: JsonRecord = source(),
  candidateId = 'square-grid:12x8:xy:1/8',
): JsonRecord {
  return {
    schemaVersion: 1,
    recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    source: embeddedSource,
    candidateId,
  };
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

function expectFailure(raw: unknown, stage: string, code: string, path?: string): void {
  const result = parsePolygonRiverPackingProblemInputV1(raw);
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
  expect(allFrozen(result)).toBe(true);
}

describe('polygon/river packing problem closed input parser', () => {
  it('validates and canonicalizes the source without requiring the candidate to exist', () => {
    const raw = input(source(), 'square-grid:not-present');
    const result = parsePolygonRiverPackingProblemInputV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('a valid source with an unknown candidate ID must parse');

    expect(result.value).toMatchObject({
      schemaVersion: 1,
      recordType: POLYGON_RIVER_PACKING_PROBLEM_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      candidateId: 'square-grid:not-present',
      source: {
        schemaVersion: 1,
        recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
        contractStatus: 'candidate',
        scientificClaim: false,
        paper: { width: 1.5, height: 1 },
        maxColumns: 12,
        maxRows: 12,
        relativeErrorLimit: 0.01,
        orderedTree: {
          schemaVersion: 1,
          recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
          contractStatus: 'candidate',
          scientificClaim: false,
        },
      },
    });
    expect(result.value.source.orderedTree).not.toHaveProperty('derived');
    expect(result.value.source).not.toHaveProperty('branches');
    expect(result.value).not.toHaveProperty('candidateReference');
    expect(allFrozen(result)).toBe(true);

    const built = buildPolygonRiverPackingProblemV1(result.value);
    expect(built.ok).toBe(false);
    if (built.ok) throw new Error('candidate existence belongs to the builder stage');
    expect(built.error).toContainEqual(
      expect.objectContaining({
        stage: 'path-demand',
        path: '$.candidateId',
        code: 'candidate-not-found',
      }),
    );
  });

  it('canonicalizes collection permutations while preserving numeric source fields', () => {
    const first = input();
    const second = structuredClone(first);
    const secondTree = (second.source as JsonRecord).orderedTree as MutableTree;
    secondTree.nodes.reverse();
    secondTree.edges.reverse();
    secondTree.rotation.reverse();
    (second.source as JsonRecord).relativeErrorLimit = -0;
    (first.source as JsonRecord).relativeErrorLimit = -0;

    const firstParsed = parsePolygonRiverPackingProblemInputV1(first);
    const secondParsed = parsePolygonRiverPackingProblemInputV1(second);
    expect(firstParsed).toEqual(secondParsed);
    expect(firstParsed.ok).toBe(true);
    if (!firstParsed.ok) throw new Error('permuted valid source must parse');
    expect(firstParsed.value.source.orderedTree.nodes.map((node) => node.id)).toEqual([
      'node-a',
      'node-b',
      'node-c',
      'node-d',
    ]);
    expect(firstParsed.value.source.orderedTree.edges.map((edge) => edge.id)).toEqual([
      'edge-internal',
      'edge-terminal-a',
      'edge-terminal-d',
    ]);
    expect(Object.is(firstParsed.value.source.relativeErrorLimit, -0)).toBe(false);
  });

  it('preserves validated caller edge direction as trace data instead of silently reversing it', () => {
    const forward = input();
    const reversed = structuredClone(forward);
    const reversedTree = (reversed.source as JsonRecord).orderedTree as MutableTree;
    const edge = reversedTree.edges.find((entry) => entry.id === 'edge-internal');
    if (edge === undefined) throw new Error('internal edge fixture is missing');
    [edge.from, edge.to] = [edge.to, edge.from];

    const forwardParsed = parsePolygonRiverPackingProblemInputV1(forward);
    const reversedParsed = parsePolygonRiverPackingProblemInputV1(reversed);
    expect(forwardParsed.ok).toBe(true);
    expect(reversedParsed.ok).toBe(true);
    if (!forwardParsed.ok || !reversedParsed.ok) throw new Error('both directions must parse');
    expect(
      forwardParsed.value.source.orderedTree.edges.find((entry) => entry.id === 'edge-internal'),
    ).toMatchObject({ from: 'node-b', to: 'node-c' });
    expect(
      reversedParsed.value.source.orderedTree.edges.find((entry) => entry.id === 'edge-internal'),
    ).toMatchObject({ from: 'node-c', to: 'node-b' });

    // The downstream problem still canonicalizes undirected river endpoints.
    expect(buildPolygonRiverPackingProblemV1(forwardParsed.value)).toEqual(
      buildPolygonRiverPackingProblemV1(reversedParsed.value),
    );
  });

  it('cuts caller aliases and deeply freezes the canonical input', () => {
    const embedded = source();
    const raw = input(embedded);
    const result = parsePolygonRiverPackingProblemInputV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('valid source must parse');

    const tree = embedded.orderedTree as MutableTree;
    const firstNode = tree.nodes[0];
    const firstEdge = tree.edges[0];
    if (firstNode === undefined || firstEdge === undefined)
      throw new Error('fixture is incomplete');
    firstNode.label = 'mutated';
    firstEdge.width = 99;
    embedded.maxColumns = 1;
    raw.candidateId = 'mutated';
    expect(result.value.candidateId).toBe('square-grid:12x8:xy:1/8');
    expect(result.value.source.maxColumns).toBe(12);
    expect(result.value.source.orderedTree.nodes[0]?.label).not.toBe('mutated');
    expect(result.value.source.orderedTree.edges[0]?.width).not.toBe(99);
    expect(allFrozen(result)).toBe(true);
  });

  it('rejects invalid topology and embedded source claims before candidate enumeration', () => {
    const selfLoop = input();
    const selfLoopTree = (selfLoop.source as JsonRecord).orderedTree as MutableTree;
    const selfLoopEdge = selfLoopTree.edges[0];
    if (selfLoopEdge === undefined) throw new Error('self-loop fixture is incomplete');
    selfLoopEdge.to = selfLoopEdge.from;
    expectFailure(selfLoop, 'ordered-tree-adapter', 'tree-self-loop', '$.source.orderedTree.edges');

    const sourceClaim = input();
    (sourceClaim.source as JsonRecord).contractStatus = 'verified';
    expectFailure(sourceClaim, 'ordered-tree-adapter', 'claim-boundary', '$.source.contractStatus');

    const treeClaim = input();
    ((treeClaim.source as JsonRecord).orderedTree as MutableTree).scientificClaim = true;
    expectFailure(
      treeClaim,
      'ordered-tree-adapter',
      'claim-boundary',
      '$.source.orderedTree.scientificClaim',
    );
  });

  it('reports square-grid source errors at caller-visible source paths', () => {
    const zeroPaper = input();
    ((zeroPaper.source as JsonRecord).paper as JsonRecord).width = 0;
    expectFailure(zeroPaper, 'ordered-tree-adapter', 'invalid-bound', '$.source.paper.width');

    const zeroColumns = input();
    (zeroColumns.source as JsonRecord).maxColumns = 0;
    expectFailure(zeroColumns, 'ordered-tree-adapter', 'invalid-bound', '$.source.maxColumns');

    const negativeError = input();
    (negativeError.source as JsonRecord).relativeErrorLimit = -1;
    expectFailure(
      negativeError,
      'ordered-tree-adapter',
      'invalid-bound',
      '$.source.relativeErrorLimit',
    );
  });

  it('rejects unknown fields at the outer, source, and tree boundaries', () => {
    expectFailure(
      { ...input(), metric: 'euclidean' },
      'packing-problem-input',
      'unknown-field',
      '$.metric',
    );

    const unknownSource = input();
    (unknownSource.source as JsonRecord).unknown = true;
    expectFailure(unknownSource, 'ordered-tree-adapter', 'unknown-field', '$.source.unknown');

    const unknownTree = input();
    ((unknownTree.source as JsonRecord).orderedTree as JsonRecord).unknown = true;
    expectFailure(
      unknownTree,
      'ordered-tree-adapter',
      'unknown-field',
      '$.source.orderedTree.unknown',
    );
  });

  it('rejects hostile, sparse, cyclic, and over-budget snapshots without invoking accessors', () => {
    const cyclic = input();
    cyclic.self = cyclic;
    expectFailure(cyclic, 'snapshot', 'invalid-snapshot', '$');

    const sparse = input();
    ((sparse.source as JsonRecord).orderedTree as MutableTree).nodes = new Array<
      MutableTree['nodes'][number]
    >(2);
    expectFailure(sparse, 'snapshot', 'invalid-snapshot', '$');

    const overArrayBudget = input();
    const overArrayTree = (overArrayBudget.source as JsonRecord).orderedTree as MutableTree;
    const templateNode = (structuredClone(DEFAULT_ORDERED_TREE_INPUT) as MutableTree).nodes[0];
    if (templateNode === undefined) throw new Error('node fixture is incomplete');
    overArrayTree.nodes = Array.from(
      { length: POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxArrayLength + 1 },
      () => structuredClone(templateNode),
    );
    expectFailure(overArrayBudget, 'snapshot', 'invalid-snapshot', '$');

    const overStringBudget = input(
      source(),
      'x'.repeat(POLYGON_RIVER_PACKING_PROBLEM_LIMITS.maxStringCodeUnits + 1),
    );
    expectFailure(overStringBudget, 'snapshot', 'invalid-snapshot', '$');

    const accessor = input();
    let getterCalls = 0;
    Object.defineProperty(accessor, 'candidateId', {
      enumerable: true,
      get(): string {
        getterCalls += 1;
        return 'candidate';
      },
    });
    expectFailure(accessor, 'snapshot', 'invalid-snapshot', '$');
    expect(getterCalls).toBe(0);
  });

  it('keeps the valid builder result unchanged after canonical parsing', () => {
    const raw = input();
    const parsed = parsePolygonRiverPackingProblemInputV1(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('default source must parse');
    expect(buildPolygonRiverPackingProblemV1(parsed.value)).toEqual(
      buildPolygonRiverPackingProblemV1(raw),
    );
  });
});
