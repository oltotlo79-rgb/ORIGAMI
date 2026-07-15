import { describe, expect, it } from 'vitest';

import { runCli, type CliIo } from '../../m0f/cli.js';

function captureIo(): { io: CliIo; stdout: string[]; stderr: string[] } {
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

describe('M0F CLI', () => {
  it('validates and lists the populated harness fixture', async () => {
    const validation = captureIo();
    expect(await runCli(['validate', '--json'], validation.io)).toBe(0);
    const validationPayload = JSON.parse(validation.stdout.join('')) as Record<string, unknown>;
    expect(validationPayload.valid).toBe(true);
    expect(validationPayload.fixtureCount).toBe(1);

    const listing = captureIo();
    expect(await runCli(['list'], listing.io)).toBe(0);
    expect(listing.stdout.join('')).toContain('_harness-smoke');
    expect(listing.stdout.join('')).toContain('harness-only');
  });

  it('lists normative canonical patterns without treating smoke as evidence', async () => {
    const capture = captureIo();
    expect(await runCli(['list', '--canonical', '--json'], capture.io)).toBe(0);
    const payload = JSON.parse(capture.stdout.join('')) as { entries: { pattern: string }[] };
    expect(payload.entries.some((entry) => entry.pattern === 'GEN-BP-BIRD-4')).toBe(true);
    expect(payload.entries.some((entry) => entry.pattern === '_harness-smoke')).toBe(false);
  });

  it('passes smoke with an explicit no-scientific-claim message', async () => {
    const capture = captureIo();
    expect(await runCli(['smoke'], capture.io)).toBe(0);
    expect(capture.stdout.join('')).toBe('SMOKE PASS (harness only; no scientific claim)\n');
    expect(capture.stderr).toEqual([]);
  });

  it('fails the fixture catalog completeness check until every canonical ID is populated', async () => {
    const capture = captureIo();
    expect(await runCli(['validate', '--complete', '--json'], capture.io)).toBe(1);
    const payload = JSON.parse(capture.stdout.join('')) as Record<string, unknown>;
    expect(payload.valid).toBe(false);
  });

  it('keeps the final M0F evidence gate fail-closed and distinct from catalog completeness', async () => {
    const capture = captureIo();
    expect(await runCli(['gate', '--json'], capture.io)).toBe(1);
    const payload = JSON.parse(capture.stdout.join('')) as Record<string, unknown>;
    expect(payload.passed).toBe(false);
    expect(payload.reasonCode).toBe('final-evidence-gate-not-ready');
  });

  it('returns usage status for an unknown command', async () => {
    const capture = captureIo();
    expect(await runCli(['unknown'], capture.io)).toBe(2);
    expect(capture.stderr.join('')).toContain('unknown command');
  });
});
