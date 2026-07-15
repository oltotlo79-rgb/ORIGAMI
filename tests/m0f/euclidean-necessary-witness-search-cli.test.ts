import { describe, expect, it } from 'vitest';

import { runEuclideanNecessaryWitnessSearchCli } from '../../m0f/euclidean-necessary-witness-search-cli.js';

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

describe('Euclidean necessary-filter witness-search CLI', () => {
  it('emits one deterministic domain-scoped result without packing or no-solution claims', () => {
    const first = capture();
    const second = capture();
    expect(runEuclideanNecessaryWitnessSearchCli([], first.io)).toBe(0);
    expect(runEuclideanNecessaryWitnessSearchCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-euclidean-necessary-witness-search-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      searchStatus: 'domain-exhausted',
      searchComplete: true,
      witnessCount: 0,
      noNecessaryFilterWitnessInEnumeratedDomain: true,
      globalNoSolutionEvidence: false,
      packingInfeasibilityEvidence: false,
      necessaryFilterWitnessSearchIncluded: true,
      generalPolygonRiverPackingSolverIncluded: false,
      actualGeometryIncluded: false,
      polygonRiverPackingIncluded: false,
      feasibilityDecisionIncluded: false,
      globalM0fGo: false,
    });
    expect(first.stdout[0]).not.toMatch(/"contractStatus":"(?:selected|supported|verified)"/u);
  });

  it('rejects arguments without partial output', () => {
    const captured = capture();
    expect(runEuclideanNecessaryWitnessSearchCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:euclidean-necessary-witness-search\n']);
  });
});
