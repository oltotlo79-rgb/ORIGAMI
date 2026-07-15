import { describe, expect, it } from 'vitest';

import { createDefaultM0fProductHandoffDiagnosticInput } from '../../m0f/m0f-product-handoff-diagnostic-cli.js';
import {
  BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT,
  bundledM0fProductHandoffDiagnostic,
} from '../../src/diagnostics/m0fProductHandoffDiagnostic.js';

describe('bundled M0F product-handoff diagnostic UI data', () => {
  it('matches the repository-backed CLI input', async () => {
    await expect(createDefaultM0fProductHandoffDiagnosticInput(process.cwd())).resolves.toEqual(
      BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT,
    );
  });

  it('exposes only the fail-closed candidate diagnostic result', () => {
    expect(bundledM0fProductHandoffDiagnostic).toMatchObject({
      contractStatus: 'candidate',
      scientificClaim: false,
      readinessDecision: 'not-ready',
      blockingAreaCount: 10,
      unmetGoConditionCount: 14,
      unmetRequiredDeliverableCount: 14,
      finalDecision: 'not-recorded',
      globalM0fGo: false,
      productImplementationStartAuthorized: false,
    });
  });
});
