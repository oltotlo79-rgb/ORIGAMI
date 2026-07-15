import { CANONICAL_FIXTURE_RULES } from '../../m0f/canonical-fixtures.js';
import { deepFreezeOwned } from '../../m0f/clone-and-freeze.js';
import {
  evaluateM0fProductHandoffDiagnosticV1,
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
  type M0fProductHandoffDiagnosticEvaluationV1,
} from '../../m0f/m0f-product-handoff-diagnostic.js';

/**
 * Browser-safe snapshot of the repository-backed CLI input for this build.
 * A unit test keeps this snapshot aligned with the filesystem diagnostic.
 */
export const BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT = deepFreezeOwned({
  schemaVersion: 1,
  recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  catalog: {
    complete: false,
    errorCount: CANONICAL_FIXTURE_RULES.length,
    missingCanonicalPatterns: CANONICAL_FIXTURE_RULES.map((rule) => rule.pattern),
  },
} as const);

const BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_UNAVAILABLE = deepFreezeOwned({
  ok: false as const,
  error: [
    {
      stage: 'mapping' as const,
      path: '$',
      code: 'browser-evaluation-exception',
      message: 'the bundled browser diagnostic could not be evaluated',
    },
  ],
});

/**
 * Re-runs only the bundled candidate input in the browser. It performs no
 * filesystem scan, network request, persistence, or product-state mutation.
 */
export function runBundledM0fProductHandoffDiagnostic(
  evaluator: typeof evaluateM0fProductHandoffDiagnosticV1 = evaluateM0fProductHandoffDiagnosticV1,
): M0fProductHandoffDiagnosticEvaluationV1 {
  try {
    return evaluator(BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT);
  } catch {
    return BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_UNAVAILABLE;
  }
}

/** Initial read-only evaluation; callers must preserve the failure branch. */
export const bundledM0fProductHandoffDiagnosticEvaluation = runBundledM0fProductHandoffDiagnostic();
