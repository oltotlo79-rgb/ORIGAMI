import { describe, expect, it } from 'vitest';

import { runFaceComplexAuditEvidenceCli } from '../../m0f/face-complex-evidence-cli.js';
import {
  parseFaceComplexAuditEvidenceV1,
  reauditFaceComplexAuditEvidenceV1,
} from '../../m0f/reference-verifier/face-complex-evidence.js';

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

describe('face-complex candidate evidence CLI', () => {
  it('emits deterministic persisted evidence that passes a fresh re-audit', async () => {
    const first = capture();
    const second = capture();
    await expect(runFaceComplexAuditEvidenceCli([], first.io)).resolves.toBe(0);
    await expect(runFaceComplexAuditEvidenceCli([], second.io)).resolves.toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(first.stdout).toHaveLength(1);
    expect(first.stdout[0]?.endsWith('\n')).toBe(true);

    const document: unknown = JSON.parse(first.stdout[0] ?? 'null');
    await expect(parseFaceComplexAuditEvidenceV1(document)).resolves.toMatchObject({ ok: true });
    await expect(reauditFaceComplexAuditEvidenceV1(document)).resolves.toMatchObject({
      ok: true,
      value: {
        contractStatus: 'candidate',
        scientificClaim: false,
        auditOutcome: 'consistent',
      },
    });
  });

  it('rejects arguments without producing a partial record', async () => {
    const captured = capture();
    await expect(runFaceComplexAuditEvidenceCli(['unexpected'], captured.io)).resolves.toBe(2);
    expect(captured.stdout).toEqual([]);
    expect(captured.stderr).toEqual(['usage: npm run m0f:face-evidence\n']);
  });
});
