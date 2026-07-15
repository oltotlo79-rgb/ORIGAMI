import { describe, expect, it } from 'vitest';

import { runOrderedTreeGridQuantizationCli } from '../../m0f/ordered-tree-grid-quantization-cli.js';

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

describe('ordered-tree grid quantization adapter CLI', () => {
  it('emits one deterministic one-to-one internal-width mapping without downstream claims', () => {
    const first = capture();
    const second = capture();
    expect(runOrderedTreeGridQuantizationCli([], first.io)).toBe(0);
    expect(runOrderedTreeGridQuantizationCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-ordered-tree-grid-quantization-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-to-square-grid-input-adapter-only',
      mappingOrder: 'tree-edge-id-code-unit',
      enumerationIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      squareGridInput: {
        paper: { width: 1.5, height: 1 },
        maxColumns: 12,
        maxRows: 12,
        relativeErrorLimit: 0.01,
        branches: [
          { id: 'edge-internal', branchClass: 'internal', length: 1.5, width: 0.25 },
          { id: 'edge-terminal-a', branchClass: 'terminal', length: 1, width: 0 },
          { id: 'edge-terminal-d', branchClass: 'terminal', length: 1, width: 0.125 },
        ],
      },
    });
    expect(document.branchMapping).toHaveLength(3);
    expect(first.stdout[0]).not.toMatch(/"contractStatus":"(?:selected|supported|verified)"/u);
  });

  it('rejects arguments without a partial record', () => {
    const captured = capture();
    expect(runOrderedTreeGridQuantizationCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:ordered-tree-grid-quantization\n']);
  });
});
