import { describe, expect, it } from 'vitest';

import { runOrderedTreeSquareGridCandidateCli } from '../../m0f/ordered-tree-square-grid-candidate-cli.js';

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

describe('ordered-tree square-grid candidate CLI', () => {
  it('emits deterministic source-bound quantization candidates without placement claims', () => {
    const first = capture();
    const second = capture();
    expect(runOrderedTreeSquareGridCandidateCli([], first.io)).toBe(0);
    expect(runOrderedTreeSquareGridCandidateCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-ordered-tree-square-grid-candidate-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'ordered-tree-square-grid-quantization-enumeration-only',
      enumerationIncluded: true,
      placementIncluded: false,
      packingIncluded: false,
      creasePatternIncluded: false,
      pleatRoutingIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      quantization: {
        scope: 'square-grid-quantization-only',
        sourceBranches: [
          { id: 'edge-internal', branchClass: 'internal', length: 1.5, width: 0.25 },
          { id: 'edge-terminal-a', branchClass: 'terminal', length: 1, width: 0 },
          { id: 'edge-terminal-d', branchClass: 'terminal', length: 1, width: 0.125 },
        ],
      },
    });
    const quantization = document.quantization as Record<string, unknown>;
    expect((quantization.candidates as unknown[]).length).toBeGreaterThan(0);
  });

  it('rejects arguments without partial output', () => {
    const captured = capture();
    expect(runOrderedTreeSquareGridCandidateCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:ordered-tree-grid-candidates\n']);
  });
});
