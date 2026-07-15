import { describe, expect, it } from 'vitest';

import { createDefaultM0fProductHandoffDiagnosticInput } from '../../m0f/m0f-product-handoff-diagnostic-cli.js';
import {
  BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT,
  bundledM0fProductHandoffDiagnosticEvaluation,
  runBundledM0fProductHandoffDiagnostic,
} from '../../src/diagnostics/m0fProductHandoffDiagnostic.js';

describe('bundled M0F product-handoff diagnostic UI data', () => {
  it('matches the repository-backed CLI input', async () => {
    await expect(createDefaultM0fProductHandoffDiagnosticInput(process.cwd())).resolves.toEqual(
      BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT,
    );
  });

  it('exposes only the fail-closed candidate diagnostic result', () => {
    expect(bundledM0fProductHandoffDiagnosticEvaluation).toMatchObject({
      ok: true,
      value: {
        contractStatus: 'candidate',
        scientificClaim: false,
        readinessDecision: 'not-ready',
        blockingAreaCount: 10,
        unmetGoConditionCount: 14,
        unmetRequiredDeliverableCount: 14,
        finalDecision: 'not-recorded',
        globalM0fGo: false,
        productImplementationStartAuthorized: false,
      },
    });
  });

  it('re-runs the bundled input without mutating the initial result', () => {
    const rerun = runBundledM0fProductHandoffDiagnostic();

    expect(rerun).toEqual(bundledM0fProductHandoffDiagnosticEvaluation);
    expect(rerun).not.toBe(bundledM0fProductHandoffDiagnosticEvaluation);
    expect(Object.isFrozen(rerun)).toBe(true);
    expect(Object.isFrozen(BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT)).toBe(true);
    expect(
      Object.isFrozen(
        BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT.catalog.missingCanonicalPatterns,
      ),
    ).toBe(true);
  });

  it('fails closed when the browser evaluator throws', () => {
    const result = runBundledM0fProductHandoffDiagnostic(() => {
      throw new Error('synthetic evaluator failure');
    });

    expect(result).toEqual({
      ok: false,
      error: [
        {
          stage: 'mapping',
          path: '$',
          code: 'browser-evaluation-exception',
          message: 'the bundled browser diagnostic could not be evaluated',
        },
      ],
    });
    expect(Object.isFrozen(result)).toBe(true);
  });
});
