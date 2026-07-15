import { describe, expect, it } from 'vitest';

import { runSquareGridCandidateCli } from '../../m0f/box-grid-candidate-cli.js';

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

describe('square-grid candidate CLI', () => {
  it('emits a deterministic no-claim rectangular-paper enumeration', () => {
    const first = capture();
    const second = capture();
    expect(runSquareGridCandidateCli([], first.io)).toBe(0);
    expect(runSquareGridCandidateCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);

    const document = JSON.parse(first.stdout[0] ?? 'null') as Record<string, unknown>;
    expect(document).toMatchObject({
      recordType: 'm0f-square-grid-candidate-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-quantization-only',
      placementIncluded: false,
      pleatRoutingIncluded: false,
    });
    expect(Array.isArray(document.candidates)).toBe(true);
    expect((document.candidates as unknown[]).length).toBeGreaterThan(0);
    expect(first.stdout[0]).not.toMatch(/"(?:selected|supported|verified)"/u);
  });

  it('rejects arguments without a partial result', () => {
    const captured = capture();
    expect(runSquareGridCandidateCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:box-grid-candidates\n']);
  });
});
