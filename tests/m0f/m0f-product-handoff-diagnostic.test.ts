import { describe, expect, it } from 'vitest';

import { CANONICAL_FIXTURE_RULES } from '../../m0f/canonical-fixtures.js';
import {
  evaluateM0fProductHandoffDiagnosticV1,
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE,
} from '../../m0f/m0f-product-handoff-diagnostic.js';
import {
  runM0fProductHandoffDiagnosticCli,
  type M0fProductHandoffDiagnosticCliIo,
} from '../../m0f/m0f-product-handoff-diagnostic-cli.js';

function input(complete = false): Record<string, unknown> {
  const patterns = complete ? [] : CANONICAL_FIXTURE_RULES.map((rule) => rule.pattern);
  return {
    schemaVersion: 1,
    recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    catalog: {
      complete,
      errorCount: patterns.length,
      missingCanonicalPatterns: patterns,
    },
  };
}

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: M0fProductHandoffDiagnosticCliIo = {
    cwd: process.cwd(),
    stdout: (text) => stdout.push(text),
    stderr: (text) => stderr.push(text),
  };
  return { stdout, stderr, io };
}

describe('M0F product handoff diagnostic', () => {
  it('flattens every unmet condition and deliverable without recording a decision', () => {
    const result = evaluateM0fProductHandoffDiagnosticV1(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value).toMatchObject({
      recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      outputKind: 'fail-closed-m0f-handoff-readiness-not-final-go-no-go-decision',
      readinessDecision: 'not-ready',
      handoffReady: false,
      m0fReportIncluded: false,
      m0fDecisionRecorded: false,
      finalDecision: 'not-recorded',
      globalM0fGo: false,
      productImplementationStartAuthorized: false,
      allNormativeNumbersEnumeratedExactlyOnce: true,
      unmetGoConditionCount: 14,
      unmetRequiredDeliverableCount: 14,
      blockingAreaCount: 10,
      readiness: {
        passed: false,
        catalog: { complete: false, missingCanonicalFixtureCount: 27 },
      },
      productStartCondition: {
        predicateId: 'm0f-product-start-authorization-v1',
        operator: 'all',
        value: false,
      },
    });
    expect(result.value.areas).toHaveLength(10);
    expect(result.value.areas).toHaveLength(10);
    expect(result.value.unmetGoConditions.map((entry) => entry.conditionNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ]);
    expect(result.value.unmetRequiredDeliverables.map((entry) => entry.deliverableNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ]);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.readiness)).toBe(true);
  });

  it('keeps product start unauthorized even when the fixture catalog is complete', () => {
    const result = evaluateM0fProductHandoffDiagnosticV1(input(true));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    expect(result.value).toMatchObject({
      readinessDecision: 'not-ready',
      handoffReady: false,
      m0fDecisionRecorded: false,
      finalDecision: 'not-recorded',
      globalM0fGo: false,
      productImplementationStartAuthorized: false,
      blockingAreaCount: 10,
      readiness: { catalog: { complete: true, status: 'ready' } },
    });
    expect(result.value.productStartCondition.signals[0]).toEqual({
      signalId: 'canonical-fixture-catalog-complete',
      satisfied: true,
    });
  });

  it('rejects duplicate patterns, inconsistent counts, and claim escalation', () => {
    const duplicate = input();
    const duplicateCatalog = duplicate.catalog as { missingCanonicalPatterns: string[] };
    const first = duplicateCatalog.missingCanonicalPatterns[0];
    if (first === undefined) throw new Error('canonical rule fixture must exist');
    duplicateCatalog.missingCanonicalPatterns.push(first);
    const duplicateResult = evaluateM0fProductHandoffDiagnosticV1(duplicate);
    expect(duplicateResult.ok).toBe(false);
    if (duplicateResult.ok) throw new Error('expected duplicate rejection');
    expect(duplicateResult.error).toContainEqual(
      expect.objectContaining({ stage: 'catalog', code: 'duplicate-pattern' }),
    );

    const inconsistent = input(true);
    (inconsistent.catalog as { errorCount: number }).errorCount = 1;
    const inconsistentResult = evaluateM0fProductHandoffDiagnosticV1(inconsistent);
    expect(inconsistentResult.ok).toBe(false);
    if (inconsistentResult.ok) throw new Error('expected completeness rejection');
    expect(inconsistentResult.error).toContainEqual(
      expect.objectContaining({ stage: 'catalog', code: 'inconsistent-completeness' }),
    );

    const escalated = input();
    escalated.scientificClaim = true;
    const escalatedResult = evaluateM0fProductHandoffDiagnosticV1(escalated);
    expect(escalatedResult.ok).toBe(false);
    if (escalatedResult.ok) throw new Error('expected claim rejection');
    expect(escalatedResult.error).toContainEqual(
      expect.objectContaining({ stage: 'input', code: 'claim-boundary' }),
    );
  });

  it('emits the current repository handoff deterministically through the CLI', async () => {
    const first = capture();
    const second = capture();
    expect(await runM0fProductHandoffDiagnosticCli([], first.io)).toBe(0);
    expect(await runM0fProductHandoffDiagnosticCli([], second.io)).toBe(0);
    expect(first.stderr).toEqual([]);
    expect(first.stdout).toEqual(second.stdout);
    expect(JSON.parse(first.stdout[0] ?? 'null')).toMatchObject({
      m0fDecisionRecorded: false,
      finalDecision: 'not-recorded',
      globalM0fGo: false,
      productImplementationStartAuthorized: false,
      unmetGoConditionCount: 14,
      unmetRequiredDeliverableCount: 14,
    });
  });
});
