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
    const payload = JSON.parse(capture.stdout.join('')) as {
      passed: boolean;
      catalogComplete: boolean;
      reasonCode: string;
      readiness: {
        contractStatus: string;
        scientificClaim: boolean;
        catalog: {
          missingCanonicalFixtureCount: number;
          missingCanonicalGroups: { gapClass: string; count: number }[];
        };
        summary: {
          gateAreaCount: number;
          blockingAreaCount: number;
          coveredGoConditionCount: number;
          coveredRequiredDeliverableCount: number;
        };
        reasonCodes: string[];
      };
    };
    expect(payload.passed).toBe(false);
    expect(payload.catalogComplete).toBe(false);
    expect(payload.reasonCode).toBe('final-evidence-gate-not-ready');
    expect(payload.readiness.contractStatus).toBe('candidate');
    expect(payload.readiness.scientificClaim).toBe(false);
    expect(payload.readiness.catalog.missingCanonicalFixtureCount).toBe(27);
    expect(payload.readiness.catalog.missingCanonicalGroups).toEqual([
      expect.objectContaining({ gapClass: 'positive-or-reference-exact', count: 16 }),
      expect.objectContaining({ gapClass: 'negative-exact', count: 3 }),
      expect.objectContaining({ gapClass: 'negative-family', count: 8 }),
      expect.objectContaining({ gapClass: 'unclassified', count: 0 }),
    ]);
    expect(payload.readiness.summary).toMatchObject({
      gateAreaCount: 10,
      blockingAreaCount: 10,
      coveredGoConditionCount: 14,
      coveredRequiredDeliverableCount: 14,
    });
    expect(payload.readiness.reasonCodes).toContain('canonical-fixture-catalog-incomplete');
    expect(payload.readiness.reasonCodes).toContain('go-decision-record-not-evaluated');
  });

  it('returns usage status for an unknown command', async () => {
    const capture = captureIo();
    expect(await runCli(['unknown'], capture.io)).toBe(2);
    expect(capture.stderr.join('')).toContain('unknown command');
  });
});
