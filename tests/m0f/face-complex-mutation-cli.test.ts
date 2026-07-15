import { describe, expect, it } from 'vitest';

import { runFaceComplexMutationCli } from '../../m0f/face-complex-mutation-cli.js';
import {
  parseFaceComplexMutationSuiteResultV1,
  parseFaceComplexMutationSuiteV1,
} from '../../m0f/reference-verifier/face-complex-mutation-suite.js';

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

describe('face-complex semantic mutation CLI', () => {
  it('emits one deterministic canonical result for all fixed cases', () => {
    const first = capture();
    const second = capture();
    expect(runFaceComplexMutationCli([], first.io)).toBe(0);
    expect(runFaceComplexMutationCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(first.stdout).toHaveLength(1);

    const document: unknown = JSON.parse(first.stdout[0] ?? 'null');
    const parsed = parseFaceComplexMutationSuiteResultV1(document);
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        contractStatus: 'candidate',
        scientificClaim: false,
        suiteOutcome: 'expectations-met',
      },
    });
    if (!parsed.ok) throw new Error('CLI result must parse');
    expect(parsed.value.cases).toHaveLength(11);
  });

  it('can emit the canonical suite definition used by the saved rerun gate', () => {
    const captured = capture();
    expect(runFaceComplexMutationCli(['--suite'], captured.io)).toBe(0);
    expect(captured.stderr).toEqual([]);
    const parsed = parseFaceComplexMutationSuiteV1(
      JSON.parse(captured.stdout[0] ?? 'null') as unknown,
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: { contractStatus: 'candidate', scientificClaim: false },
    });
    if (!parsed.ok) throw new Error('suite definition must parse');
    expect(parsed.value.cases).toHaveLength(11);
  });

  it('rejects arguments without a partial result', () => {
    const captured = capture();
    expect(runFaceComplexMutationCli(['unexpected'], captured.io)).toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:face-mutations [-- --suite]\n']);
  });
});
