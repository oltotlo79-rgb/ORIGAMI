import { describe, expect, it } from 'vitest';

import { runEuclideanNecessaryFilterCli } from '../../m0f/euclidean-necessary-filter-cli.js';

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

describe('Euclidean necessary-filter CLI', () => {
  it('emits one deterministic exact assignment rejection without a global no-solution claim', () => {
    const first = capture();
    const second = capture();
    expect(runEuclideanNecessaryFilterCli([], first.io)).toBe(0);
    expect(runEuclideanNecessaryFilterCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-euclidean-necessary-filter-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'assigned-projected-leaf-anchor-euclidean-necessary-filter-only',
      assignmentRole: 'projected-leaf-anchors-only-not-polygon-placement',
      filterStrength: 'necessary-only',
      filterEvaluationIncluded: true,
      assignmentIncluded: true,
      allNecessaryFiltersPass: false,
      failedPairCount: 1,
      assignmentRejectedByNecessaryFilter: true,
      passingIsPackingSufficiencyEvidence: false,
      failureIsGlobalNoSolutionEvidence: false,
      widthUsedByFilter: false,
      manhattanMetricEvaluated: false,
      chebyshevMetricEvaluated: false,
      globalMetricSelectionIncluded: false,
      solverIncluded: false,
      placementIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      leafAssignments: [
        { leafNodeId: 'node-a', x: 0, y: 0 },
        { leafNodeId: 'node-d', x: 12, y: 8 },
      ],
      pairEvaluations: [
        {
          firstLeafId: 'node-a',
          secondLeafId: 'node-d',
          absoluteDeltaX: '12',
          absoluteDeltaY: '8',
          actualSquaredDistance: '208',
          requiredSquaredDistance: '784',
          totalLengthSteps: '28',
          maximumWidthSteps: '2',
          passesNecessaryFilter: false,
        },
      ],
    });
    expect(first.stdout[0]).not.toMatch(/no[- ]solution|infeasible/iu);
  });

  it('rejects arguments without partial output', () => {
    const captured = capture();
    expect(runEuclideanNecessaryFilterCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:euclidean-necessary-filter\n']);
  });
});
