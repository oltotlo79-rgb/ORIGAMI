import { describe, expect, it } from 'vitest';

import { CANONICAL_FIXTURE_RULES } from '../../m0f/canonical-fixtures.js';
import {
  createM0fFinalEvidenceGateReadinessV1,
  M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1,
} from '../../m0f/final-evidence-gate-readiness.js';

describe('M0F final evidence gate readiness diagnostics', () => {
  it('maps every normative GO condition and required deliverable exactly once', () => {
    const goConditions = M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1.flatMap(
      (area) => area.goConditionNumbers,
    ).sort((left, right) => left - right);
    const requiredDeliverables = M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1.flatMap(
      (area) => area.requiredDeliverableNumbers,
    ).sort((left, right) => left - right);

    expect(goConditions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(requiredDeliverables).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('classifies all current canonical gaps without promoting candidate vectors', () => {
    const inputPatterns = CANONICAL_FIXTURE_RULES.map((rule) => rule.pattern);
    const result = createM0fFinalEvidenceGateReadinessV1({
      catalogComplete: false,
      catalogErrorCount: inputPatterns.length,
      missingCanonicalPatterns: inputPatterns,
    });

    expect(result.passed).toBe(false);
    expect(result.scientificClaim).toBe(false);
    expect(result.catalog.status).toBe('blocked');
    expect(result.catalog.missingCanonicalFixtureCount).toBe(27);
    expect(
      Object.fromEntries(
        result.catalog.missingCanonicalGroups.map((group) => [group.gapClass, group.count]),
      ),
    ).toEqual({
      'positive-or-reference-exact': 16,
      'negative-exact': 3,
      'negative-family': 8,
      unclassified: 0,
    });
    expect(result.areas).toHaveLength(M0F_FINAL_EVIDENCE_GATE_AREA_DEFINITIONS_V1.length);
    expect(result.summary.coveredGoConditionCount).toBe(14);
    expect(result.summary.coveredRequiredDeliverableCount).toBe(14);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.catalog.missingCanonicalPatterns)).toBe(true);
  });

  it('keeps the scientific gate closed even after catalog completeness alone', () => {
    const result = createM0fFinalEvidenceGateReadinessV1({
      catalogComplete: true,
      catalogErrorCount: 0,
      missingCanonicalPatterns: [],
    });

    expect(result.catalog).toMatchObject({
      status: 'ready',
      complete: true,
      reasonCode: null,
      errorCount: 0,
      missingCanonicalFixtureCount: 0,
    });
    expect(result.passed).toBe(false);
    expect(result.reasonCodes).not.toContain('canonical-fixture-catalog-incomplete');
    expect(result.summary.blockingAreaCount).toBe(10);
  });

  it('copies and canonically orders caller-owned missing-pattern input', () => {
    const inputPatterns = ['NEG-LAYER-CYCLE', 'REF-RABBIT-EAR'];
    const result = createM0fFinalEvidenceGateReadinessV1({
      catalogComplete: false,
      catalogErrorCount: 2,
      missingCanonicalPatterns: inputPatterns,
    });
    inputPatterns.push('REF-WATERBOMB');

    expect(result.catalog.missingCanonicalPatterns).toEqual(['REF-RABBIT-EAR', 'NEG-LAYER-CYCLE']);
  });
});
