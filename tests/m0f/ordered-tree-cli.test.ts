import { describe, expect, it } from 'vitest';

import { runOrderedTreeCli } from '../../m0f/ordered-tree-cli.js';

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    io: {
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    },
  };
}

describe('ordered-tree CLI', () => {
  it('emits a deterministic internal-width topology result without downstream claims', () => {
    const first = capture();
    const second = capture();
    expect(runOrderedTreeCli([], first.io)).toBe(0);
    expect(runOrderedTreeCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-ordered-tree-input-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-input-validation-only',
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      derived: {
        counts: {
          nodes: 4,
          edges: 3,
          leaves: 2,
          internalNodes: 2,
          terminalEdges: 2,
          internalEdges: 1,
          maximumDegree: 2,
        },
        internalEdgeIds: ['edge-internal'],
      },
    });
    expect(document.edges).toContainEqual(
      expect.objectContaining({ id: 'edge-internal', width: 0.25 }),
    );
    expect(first.stdout[0]).not.toMatch(/"contractStatus":"(?:selected|supported|verified)"/u);
  });

  it('rejects arguments without a partial record', () => {
    const captured = capture();
    expect(runOrderedTreeCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:ordered-tree\n']);
  });
});
