import { describe, expect, it } from 'vitest';
import { createM0fProductHandoffDiagnosticV1 } from '../../m0f/m0f-product-handoff-diagnostic.js';

describe('M0F product handoff diagnostic', () => {
  it('keeps product start fail-closed until a recorded GO', () => {
    const result = createM0fProductHandoffDiagnosticV1();
    expect(result.globalM0fGo).toBe(false);
    expect(result.finalM0fDecision).toBe('not-recorded');
    expect(result.productImplementationStartAuthorized).toBe(false);
    expect(result.readiness.summary.blockingAreaCount).toBe(10);
  });
});
