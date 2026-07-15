import { describe, expect, it } from 'vitest';

import { runPolygonRiverSearchSpaceCli } from '../../m0f/polygon-river-search-space-cli.js';

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

describe('polygon/river raw search-space CLI', () => {
  it('emits deterministic exact cardinalities without enumerating assignments', () => {
    const first = capture();
    const second = capture();
    expect(runPolygonRiverSearchSpaceCli([], first.io)).toBe(0);
    expect(runPolygonRiverSearchSpaceCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-polygon-river-search-space-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'metric-independent-exact-finite-search-space-cardinality-audit-only',
      exactIntegerEncoding: 'canonical-nonnegative-base-10-bigint-decimal',
      rawCartesianProductRole: 'constraint-free-upper-bound-and-enumeration-domain-cardinality',
      coordinateCoincidenceIncludedInRawProduct: true,
      distinctnessConstraintApplied: false,
      nonoverlapConstraintApplied: false,
      separationConstraintApplied: false,
      metricDependent: false,
      metricSelectionIncluded: false,
      constraintEvaluationIncluded: false,
      assignmentEnumerationIncluded: false,
      assignmentMaterializationIncluded: false,
      solverIncluded: false,
      placementIncluded: false,
      packingIncluded: false,
      geometryIncluded: false,
      creasePatternIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
      capacityClaim: false,
      supportClaim: false,
      performanceClaim: false,
      activeGridDomain: { columns: 12, rows: 8 },
      gridVertexDomainCardinality: '117',
      leafCount: 2,
      rawCartesianAssignmentCount: '13689',
      perLeafDomains: [
        { leafNodeId: 'node-a', gridVertexDomainCardinality: '117' },
        { leafNodeId: 'node-d', gridVertexDomainCardinality: '117' },
      ],
      packingProblemReference: {
        recordType: 'm0f-polygon-river-packing-problem-result',
        metric: 'unresolved',
        constraintEvaluable: false,
        assignmentIncluded: false,
      },
    });
  });

  it('rejects arguments without partial output', () => {
    const captured = capture();
    expect(runPolygonRiverSearchSpaceCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:polygon-river-search-space\n']);
  });
});
