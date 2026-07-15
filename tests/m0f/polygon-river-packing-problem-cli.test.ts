import { describe, expect, it } from 'vitest';

import { runPolygonRiverPackingProblemCli } from '../../m0f/polygon-river-packing-problem-cli.js';

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

describe('polygon/river packing problem CLI', () => {
  it('emits one deterministic finite-domain problem description without a solution claim', () => {
    const first = capture();
    const second = capture();
    expect(runPolygonRiverPackingProblemCli([], first.io)).toBe(0);
    expect(runPolygonRiverPackingProblemCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-polygon-river-packing-problem-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'finite-polygon-river-packing-csp-problem-description-only',
      candidateReferenceMode: 'caller-supplied-id-re-enumerated-from-embedded-source',
      automaticCandidateSelectionIncluded: false,
      treePointSnapIncluded: false,
      metric: 'unresolved',
      metricSelectionIncluded: false,
      constraintEvaluable: false,
      assignmentIncluded: false,
      solverIncluded: false,
      placementIncluded: false,
      fullPaperCoverage: false,
      residualStripHandling: 'unresolved',
      polygonGeometryIncluded: false,
      riverGeometryIncluded: false,
      packingIncluded: false,
      hingeConstructionIncluded: false,
      ridgeConstructionIncluded: false,
      axialConstructionIncluded: false,
      junctionConstructionIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      candidateReference: {
        candidateId: 'square-grid:12x8:xy:1/8',
        columns: 12,
        rows: 8,
      },
      activeGridDomain: { columns: 12, rows: 8 },
      leafGridVertexVariables: [
        {
          leafNodeId: 'node-a',
          x: {
            representation: 'compact-inclusive-integer-range',
            minimum: 0,
            maximum: 12,
            step: 1,
          },
          y: {
            representation: 'compact-inclusive-integer-range',
            minimum: 0,
            maximum: 8,
            step: 1,
          },
          assignedCoordinate: null,
        },
        { leafNodeId: 'node-d', assignedCoordinate: null },
      ],
      separationConstraintInputs: [
        {
          firstLeafId: 'node-a',
          secondLeafId: 'node-d',
          totalLengthSteps: '28',
          maximumWidthSteps: '2',
          pathTreeEdgeIds: ['edge-terminal-a', 'edge-internal', 'edge-terminal-d'],
        },
      ],
      sourceBinding: {
        treeEdgeCount: 3,
        riverDimensionInputCount: 3,
        leafCount: 2,
        leafVariableCount: 2,
        leafPairCount: 1,
        separationConstraintInputCount: 1,
      },
    });
    expect(first.stdout[0]).not.toMatch(/"contractStatus":"(?:selected|supported|verified)"/u);
  });

  it('rejects arguments without partial output', () => {
    const captured = capture();
    expect(runPolygonRiverPackingProblemCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:polygon-river-packing-problem\n']);
  });
});
