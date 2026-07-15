import { describe, expect, it } from 'vitest';

import {
  runFaceComplexCandidateSubgateCli,
  type FaceComplexSubgateCliIo,
} from '../../m0f/face-complex-subgate-cli.js';

function captureIo(): { io: FaceComplexSubgateCliIo; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    },
    stdout,
    stderr,
  };
}

describe('face-complex candidate subgate CLI', () => {
  it('emits one deterministic blocked candidate result for the unpopulated repository', async () => {
    const capture = captureIo();
    expect(await runFaceComplexCandidateSubgateCli(['--json'], capture.io)).toBe(1);
    expect(capture.stderr).toEqual([]);
    expect(capture.stdout).toHaveLength(1);
    const result = JSON.parse(capture.stdout[0] ?? '') as Record<string, unknown>;
    expect(result).toMatchObject({
      recordType: 'm0f-face-complex-candidate-subgate-result',
      contractStatus: 'candidate',
      scientificClaim: false,
      globalM0fGate: 'not-evaluated',
      passed: false,
      reasonCodes: ['fixture-missing'],
    });
  });

  it('returns usage status for unknown options', async () => {
    const capture = captureIo();
    expect(await runFaceComplexCandidateSubgateCli(['--complete'], capture.io)).toBe(2);
    expect(capture.stderr.join('')).toContain('Usage:');
  });
});
