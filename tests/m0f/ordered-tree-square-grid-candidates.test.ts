import { describe, expect, it } from 'vitest';

import { ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE } from '../../m0f/box-pleating/ordered-tree-grid-quantization.js';
import {
  enumerateOrderedTreeSquareGridCandidatesV1,
  ORDERED_TREE_SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE,
} from '../../m0f/box-pleating/ordered-tree-square-grid-candidates.js';
import { validateSquareGridQuantizationCompletedResultV1 } from '../../m0f/experiments/square-grid-result-validation.js';
import { DEFAULT_ORDERED_TREE_INPUT } from '../../m0f/ordered-tree-cli.js';
import {
  enumerateSquareGridCandidatesV1,
  SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
} from '../../m0f/box-pleating/square-grid-candidates.js';

type MutableTree = Readonly<{
  edges: { from: string; to: string; length: number; width: number }[];
}> &
  Record<string, unknown>;

function input(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recordType: ORDERED_TREE_GRID_QUANTIZATION_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    orderedTree: DEFAULT_ORDERED_TREE_INPUT,
    paper: { width: 1.5, height: 1 },
    maxColumns: 12,
    maxRows: 12,
    relativeErrorLimit: 0.01,
    ...overrides,
  };
}

function allFrozen(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every((child) => allFrozen(child, seen));
}

describe('ordered-tree square-grid candidate composition', () => {
  it('maps the ordered tree and enumerates source-bound exact grid candidates', () => {
    const result = enumerateOrderedTreeSquareGridCandidatesV1(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('fixed ordered tree must enumerate grid candidates');

    expect(result.value).toMatchObject({
      recordType: ORDERED_TREE_SQUARE_GRID_CANDIDATE_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-square-grid-quantization-enumeration-only',
      enumerationIncluded: true,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
    expect(result.value.quantization.candidates.length).toBeGreaterThan(0);
    expect(result.value.quantization.sourceBranches).toEqual(
      result.value.adapter.squareGridInput.branches,
    );
    expect(
      result.value.quantization.sourceBranches.find((branch) => branch.id === 'edge-internal'),
    ).toEqual({ id: 'edge-internal', branchClass: 'internal', length: 1.5, width: 0.25 });
    expect(validateSquareGridQuantizationCompletedResultV1(result.value.quantization)).toEqual({
      ok: true,
    });
    expect(allFrozen(result.value)).toBe(true);
  });

  it('is deterministic and invariant to the external tree array order', () => {
    const firstInput = input();
    const secondInput = structuredClone(firstInput);
    const tree = secondInput.orderedTree as {
      nodes: unknown[];
      edges: unknown[];
      rotation: unknown[];
    };
    tree.nodes.reverse();
    tree.edges.reverse();
    tree.rotation.reverse();
    expect(enumerateOrderedTreeSquareGridCandidatesV1(firstInput)).toEqual(
      enumerateOrderedTreeSquareGridCandidatesV1(secondInput),
    );
  });

  it('retains source branches when the bounded candidate set is empty', () => {
    const tree = structuredClone(DEFAULT_ORDERED_TREE_INPUT) as unknown as MutableTree;
    for (const edge of tree.edges) {
      edge.length = 0.3;
      edge.width = 0;
    }
    const result = enumerateOrderedTreeSquareGridCandidatesV1(
      input({
        orderedTree: tree,
        paper: { width: 1, height: 1 },
        maxColumns: 1,
        maxRows: 1,
        relativeErrorLimit: 0,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('empty bounded enumeration must still complete');
    expect(result.value.quantization.candidates).toEqual([]);
    expect(result.value.quantization.sourceBranches).toHaveLength(3);
    expect(JSON.stringify(result.value)).not.toContain('no-solution');
    expect(JSON.stringify(result.value)).not.toContain('verified');
  });

  it('fails atomically with the adapter stage and prefixed source details', () => {
    const malformed = input();
    const tree = structuredClone(DEFAULT_ORDERED_TREE_INPUT) as unknown as MutableTree;
    const firstEdge = tree.edges[0];
    if (firstEdge === undefined) throw new Error('ordered-tree edge fixture is missing');
    firstEdge.to = firstEdge.from;
    malformed.orderedTree = tree;
    const result = enumerateOrderedTreeSquareGridCandidatesV1(malformed);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('self-loop must fail before enumeration');
    expect(result).not.toHaveProperty('value');
    expect(
      result.error.some(
        (issue) =>
          issue.stage === 'adapter' &&
          issue.sourceStage === 'ordered-tree' &&
          issue.code === 'tree-self-loop' &&
          issue.path.startsWith('$.orderedTree.edges'),
      ),
    ).toBe(true);
    expect(Object.isFrozen(result.error)).toBe(true);
  });

  it('rejects claim escalation without returning an enumerated prefix', () => {
    const claimed = input();
    claimed.contractStatus = 'verified';
    const result = enumerateOrderedTreeSquareGridCandidatesV1(claimed);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('claim escalation must fail');
    expect(result.error).toContainEqual(
      expect.objectContaining({
        stage: 'adapter',
        sourceStage: 'adapter-input',
        path: '$.contractStatus',
        code: 'claim-boundary',
      }),
    );
  });

  it('rejects an internally valid empty result bound to different paper', () => {
    const otherEnumeration = enumerateSquareGridCandidatesV1({
      schemaVersion: 1,
      recordType: SQUARE_GRID_CANDIDATE_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      paper: { width: 2, height: 1.1 },
      maxColumns: 12,
      maxRows: 12,
      relativeErrorLimit: 0.01,
      branches: [
        { id: 'edge-internal', branchClass: 'internal', length: 1.5, width: 0.25 },
        { id: 'edge-terminal-a', branchClass: 'terminal', length: 1, width: 0 },
        { id: 'edge-terminal-d', branchClass: 'terminal', length: 1, width: 0.125 },
      ],
    });
    if (!otherEnumeration.ok) throw new Error('alternate paper fixture must enumerate');
    expect(otherEnumeration.value.candidates).toEqual([]);

    const result = enumerateOrderedTreeSquareGridCandidatesV1(input(), () => otherEnumeration);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('different-paper quantization must fail composition binding');
    expect(result.error).toContainEqual({
      stage: 'composition',
      sourceStage: 'source-binding',
      path: '$.quantization.paper',
      code: 'source-result-mismatch',
      message: 'result paper must match its canonical source exactly',
    });
  });

  it('maps an injected enumerator exception to a fixed atomic failure', () => {
    const result = enumerateOrderedTreeSquareGridCandidatesV1(input(), () => {
      throw new Error('SECRET_HOST_DETAIL');
    });
    expect(result).toEqual({
      ok: false,
      error: [
        {
          stage: 'enumeration',
          sourceStage: 'square-grid-executor',
          path: '$.adapter.squareGridInput',
          code: 'enumeration-exception',
          message: 'square-grid enumeration failed before producing a candidate result',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('SECRET');
  });
});
