import { describe, expect, it } from 'vitest';

import { runSquareGridLatticeCli } from '../../m0f/box-grid-lattice-cli.js';

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

describe('square-grid lattice CLI', () => {
  it('emits one deterministic exact no-construction lattice', () => {
    const first = capture();
    const second = capture();
    expect(runSquareGridLatticeCli([], first.io)).toBe(0);
    expect(runSquareGridLatticeCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-square-grid-lattice-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-lattice-substrate-only',
      directionPrimitiveSemantics: 'grid-direction-only',
      creaseIncluded: false,
      roleIncluded: false,
      branchPlacementIncluded: false,
      pleatRoutingIncluded: false,
      mountainValleyIncluded: false,
      foldabilityIncluded: false,
    });
    expect(document.counts).toMatchObject({
      vertices: 35,
      directionPrimitives: 106,
      byDirectionFamily: {
        horizontal: 30,
        vertical: 28,
        positive45Diagonal: 24,
        negative45Diagonal: 24,
      },
    });
    expect(first.stdout[0]).not.toMatch(/"(?:selected|supported|verified|axial|creaseRole)"/u);
  });

  it('rejects arguments without a partial record', () => {
    const captured = capture();
    expect(runSquareGridLatticeCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:box-grid-lattice\n']);
  });
});
