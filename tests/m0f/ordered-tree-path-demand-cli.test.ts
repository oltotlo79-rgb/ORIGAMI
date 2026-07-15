import { describe, expect, it } from 'vitest';

import { runOrderedTreePathDemandCli } from '../../m0f/ordered-tree-path-demand-cli.js';

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

describe('ordered-tree path-demand CLI', () => {
  it('emits deterministic metric-independent demands with internal width retained', () => {
    const first = capture();
    const second = capture();
    expect(runOrderedTreePathDemandCli([], first.io)).toBe(0);
    expect(runOrderedTreePathDemandCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-ordered-tree-path-demand-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'metric-independent-tree-path-demand-only',
      interpretation: 'metric-independent tree path demand only',
      lengthAggregation: 'sum-of-path-edge-length-steps',
      widthAggregation: 'maximum-path-edge-width-steps-without-packing-semantics',
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
      candidateReference: {
        candidateId: 'square-grid:12x8:xy:1/8',
        cellSize: { numerator: '1', denominator: '8' },
      },
      leafNodeIds: ['node-a', 'node-d'],
      leafPairCount: 1,
      pathDemands: [
        {
          firstLeafId: 'node-a',
          secondLeafId: 'node-d',
          totalLengthSteps: '28',
          maximumWidthSteps: '2',
        },
      ],
    });
    expect(first.stdout[0]).not.toMatch(/"contractStatus":"(?:selected|supported|verified)"/u);
  });

  it('rejects arguments without partial output', () => {
    const captured = capture();
    expect(runOrderedTreePathDemandCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:ordered-tree-path-demands\n']);
  });
});
