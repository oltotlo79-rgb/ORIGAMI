import { describe, expect, it } from 'vitest';

import { runSquareGridPaperPartitionCli } from '../../m0f/box-grid-paper-partition-cli.js';

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

describe('square-grid paper partition CLI', () => {
  it('emits one deterministic full-paper residual-strip partition', () => {
    const first = capture();
    const second = capture();
    expect(runSquareGridPaperPartitionCli([], first.io)).toBe(0);
    expect(runSquareGridPaperPartitionCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-square-grid-paper-partition-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-paper-partition-only',
      residualTreatment: 'retained-as-unassigned-paper-region',
      creaseIncluded: false,
      foldAssignmentIncluded: false,
      savedCpIntegrationIncluded: false,
      branchPlacementIncluded: false,
      pleatRoutingIncluded: false,
    });
    expect(document.regions).toHaveLength(2);
    expect(document.interfaces).toHaveLength(1);
    expect(first.stdout[0]).not.toMatch(/"(?:selected|supported|verified|creaseRole)"/u);
  });

  it('rejects arguments without a partial record', () => {
    const captured = capture();
    expect(runSquareGridPaperPartitionCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:box-grid-paper-partition\n']);
  });
});
